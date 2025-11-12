const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

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

    // Check if spell slot is available
    const currentSlots = data.spellcasting.spell_slots_current[spellLevel];

    if (!currentSlots || currentSlots <= 0) {
      return res.status(400).json({ error: 'No spell slots available for this level' });
    }

    // Consume spell slot
    data.spellcasting.spell_slots_current[spellLevel] -= 1;

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: `Spell slot level ${spellLevel} consumed`,
      remaining: data.spellcasting.spell_slots_current[spellLevel]
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

module.exports = router;
