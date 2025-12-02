const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

function parseDuration(durationStr) {
  if (!durationStr) return null;
  const lower = durationStr.toLowerCase();
  if (lower.includes('instant')) return null;
  
  let rounds = 0;
  if (lower.includes('minute')) {
    const num = parseInt(lower) || 1;
    rounds = num * 10;
  } else if (lower.includes('hour')) {
    const num = parseInt(lower) || 1;
    rounds = num * 600;
  } else if (lower.includes('round')) {
    const num = parseInt(lower) || 1;
    rounds = num;
  } else if (lower.includes('turn')) {
    rounds = 1;
  }
  
  return rounds > 0 ? rounds : null;
}

module.exports = (io) => {

// Get all spells
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    res.json({
      spellcasting: data.spellcasting,
      spells: data.spells || {}
    });
  } catch (error) {
    console.error('Error fetching spells:', error);
    res.status(500).json({ error: 'Failed to fetch spells' });
  }
});

// Cast spell (consume spell slot)
router.post('/cast', (req, res) => {
  try {
    const { spellLevel, name, duration, concentration } = req.body;

    if (!spellLevel || spellLevel < 1 || spellLevel > 9) {
      return res.status(400).json({ error: 'Invalid spell level' });
    }

    const db = getDb();
    const character = db.prepare('SELECT * FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Check if spell slot is available
    const currentSlots = data.spellcasting.spell_slots_current[spellLevel];

    if (!currentSlots || currentSlots <= 0) {
      return res.status(400).json({ error: 'No spell slots available for this level' });
    }

    // Handle Concentration
    let previousConcentration = null;
    const isConcentration = concentration || (duration && duration.toLowerCase().includes('concentration'));
    
    if (isConcentration) {
      // Check if already concentrating
      if (character.concentration_spell) {
        previousConcentration = character.concentration_spell;
        
        // Remove the old concentration spell from conditions
        db.prepare(`
          UPDATE conditions 
          SET active = 0 
          WHERE character_id = 1 AND name = ? AND active = 1
        `).run(character.concentration_spell);
        
        io.emit('concentration_ended', { spell: character.concentration_spell, reason: 'new_spell' });
      }
      
      // Parse duration for concentration tracking
      const rounds = parseDuration(duration);
      
      // Start new concentration
      db.prepare(`
        UPDATE character
        SET concentration_spell = ?,
            concentration_duration = ?,
            concentration_rounds_left = ?,
            concentration_dc = 10
        WHERE id = 1
      `).run(name, rounds, rounds);
      
      io.emit('concentration_started', { spell: name, duration: rounds });
    }

    // Consume spell slot
    data.spellcasting.spell_slots_current[spellLevel] -= 1;

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    // Add condition if duration is present (for tracking buff effects)
    if (duration && name) {
      const rounds = parseDuration(duration);
      if (rounds) {
        // Check if already exists
        const existing = db.prepare(`
          SELECT * FROM conditions
          WHERE character_id = 1 AND name = ? AND active = 1
        `).get(name);

        if (existing) {
          // Reset duration
          db.prepare(`
            UPDATE conditions 
            SET rounds_left = ?, duration_value = ? 
            WHERE id = ?
          `).run(rounds, rounds, existing.id);
        } else {
          // Insert new
          db.prepare(`
            INSERT INTO conditions (character_id, name, duration_type, duration_value, rounds_left)
            VALUES (1, ?, 'rounds', ?, ?)
          `).run(name, rounds, rounds);
        }
        
        io.emit('condition_added', { name, duration_type: 'rounds', duration_value: rounds });
      }
    }

    res.json({
      success: true,
      message: `Spell slot level ${spellLevel} consumed`,
      remaining: data.spellcasting.spell_slots_current[spellLevel],
      concentration: isConcentration,
      previousConcentration
    });
  } catch (error) {
    console.error('Error casting spell:', error);
    res.status(500).json({ error: 'Failed to cast spell' });
  }
});

// Restore spell slot (for specific cases)
router.post('/restore', (req, res) => {
  try {
    const { spellLevel } = req.body;

    if (!spellLevel || spellLevel < 1 || spellLevel > 9) {
      return res.status(400).json({ error: 'Invalid spell level' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Check if already at max
    const maxSlots = data.spellcasting.spell_slots[spellLevel];
    const currentSlots = data.spellcasting.spell_slots_current[spellLevel];

    if (currentSlots >= maxSlots) {
      return res.status(400).json({ error: 'Spell slots already at maximum' });
    }

    // Restore one slot
    data.spellcasting.spell_slots_current[spellLevel] += 1;

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: `Spell slot level ${spellLevel} restored`,
      current: data.spellcasting.spell_slots_current[spellLevel]
    });
  } catch (error) {
    console.error('Error restoring spell slot:', error);
    res.status(500).json({ error: 'Failed to restore spell slot' });
  }
});

return router;
};

