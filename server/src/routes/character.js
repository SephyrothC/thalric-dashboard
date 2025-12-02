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

// Get current character
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT * FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Fetch active conditions
    const activeConditions = db.prepare(`
      SELECT name FROM conditions 
      WHERE character_id = 1 AND active = 1
    `).all().map(c => c.name);

    // Parse JSON data
    const characterData = {
      ...character,
      data: JSON.parse(character.data)
    };

    // Apply Condition Effects to Stats
    characterData.data.active_conditions = activeConditions;
    
    // AC Bonuses
    if (activeConditions.includes('Shield of Faith')) {
      characterData.data.stats.ac += 2;
      if (!characterData.data.stats.ac_bonuses) characterData.data.stats.ac_bonuses = [];
      characterData.data.stats.ac_bonuses.push('Shield of Faith (+2)');
    }
    
    if (activeConditions.includes('Haste')) {
      characterData.data.stats.ac += 2;
      if (!characterData.data.stats.ac_bonuses) characterData.data.stats.ac_bonuses = [];
      characterData.data.stats.ac_bonuses.push('Haste (+2)');
    }

    res.json(characterData);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Update character data
router.patch('/', (req, res) => {
  try {
    const db = getDb();
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing character data' });
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({ success: true, message: 'Character updated' });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// Update HP
router.patch('/hp', (req, res) => {
  try {
    const { hp, tempHp } = req.body;

    if (hp === undefined && tempHp === undefined) {
      return res.status(400).json({ error: 'Missing HP data' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Validate HP
    if (hp !== undefined) {
      const newHp = Math.max(0, Math.min(hp, data.stats.hp_max));
      data.stats.hp_current = newHp;
    }

    if (tempHp !== undefined) {
      data.stats.temp_hp = Math.max(0, tempHp);
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      hp: data.stats.hp_current,
      tempHp: data.stats.temp_hp
    });
  } catch (error) {
    console.error('Error updating HP:', error);
    res.status(500).json({ error: 'Failed to update HP' });
  }
});

// Perform short rest
router.post('/rest/short', (req, res) => {
  try {
    const db = getDb();
    const { hit_dice_spent } = req.body;
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);
    const level = data.character_info.level || 14;
    const conMod = Math.floor((data.stats.constitution - 10) / 2); // +2 for Thalric
    const restored = [];

    // Restore short rest features
    if (data.features.channel_divinity) {
      data.features.channel_divinity.uses = data.features.channel_divinity.uses_max;
      restored.push('Channel Divinity');
    }

    // Hit Dice healing
    let totalHealing = 0;
    let hitDiceRolls = [];

    if (hit_dice_spent && hit_dice_spent > 0) {
      const diceToSpend = Math.min(hit_dice_spent, level);

      for (let i = 0; i < diceToSpend; i++) {
        const roll = Math.floor(Math.random() * 10) + 1; // 1d10
        const healing = roll + conMod;
        hitDiceRolls.push({ roll, healing });
        totalHealing += healing;
      }

      // Apply healing (can't exceed max HP)
      const currentHP = data.stats.hp_current || 0;
      const maxHP = data.stats.hp_max || 117;
      const newHP = Math.min(currentHP + totalHealing, maxHP);
      data.stats.hp_current = newHP;

      restored.push(`${diceToSpend} Hit Dice (${totalHealing} HP)`);
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: 'Short rest completed',
      restored,
      healing: {
        total: totalHealing,
        rolls: hitDiceRolls,
        newHP: data.stats.hp_current
      }
    });
  } catch (error) {
    console.error('Error performing short rest:', error);
    res.status(500).json({ error: 'Failed to perform short rest' });
  }
});

// Perform long rest
router.post('/rest/long', (req, res) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Restore HP
    data.stats.hp_current = data.stats.hp_max;
    data.stats.temp_hp = 0;

    // Restore spell slots
    if (data.spellcasting) {
      Object.keys(data.spellcasting.spell_slots).forEach(level => {
        data.spellcasting.spell_slots_current[level] = data.spellcasting.spell_slots[level];
      });
    }

    // Restore long rest features
    const features = data.features;
    if (features.channel_divinity) features.channel_divinity.uses = features.channel_divinity.uses_max;
    if (features.lay_on_hands) features.lay_on_hands.pool = features.lay_on_hands.pool_max;
    if (features.divine_sense) features.divine_sense.uses = features.divine_sense.uses_max;
    if (features.cleansing_touch) features.cleansing_touch.uses = features.cleansing_touch.uses_max;
    if (features.radiant_soul) features.radiant_soul.uses = features.radiant_soul.uses_max;
    if (features.healing_hands) features.healing_hands.uses = features.healing_hands.uses_max;

    // Restore weapon charges
    if (data.weapons.crystal_longsword) {
      data.weapons.crystal_longsword.charges = data.weapons.crystal_longsword.charges_max;
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: 'Long rest completed',
      restored: ['HP', 'Spell Slots', 'Channel Divinity', 'Lay on Hands', 'Divine Sense', 'Cleansing Touch', 'Radiant Soul', 'Healing Hands', 'Crystal Longsword Charges']
    });
  } catch (error) {
    console.error('Error performing long rest:', error);
    res.status(500).json({ error: 'Failed to perform long rest' });
  }
});

// Use feature (Channel Divinity, Lay on Hands, etc.)
router.post('/feature/use', (req, res) => {
  try {
    const { feature, amount, action, name, duration } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Missing feature name' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);
    let responseData = { success: true };

    // Handle different features
    if (feature === 'lay_on_hands') {
      const pool = data.features.lay_on_hands.pool;
      const useAmount = amount || 1;

      if (pool < useAmount) {
        return res.status(400).json({ error: 'Not enough Lay on Hands points' });
      }

      data.features.lay_on_hands.pool -= useAmount;

      // If healing action, also heal HP
      if (action === 'heal') {
        const currentHP = data.stats.hp_current || 0;
        const maxHP = data.stats.hp_max || 117;
        const actualHealing = Math.min(useAmount, maxHP - currentHP);

        data.stats.hp_current = Math.min(currentHP + useAmount, maxHP);

        responseData.healing = {
          amount: actualHealing,
          newHP: data.stats.hp_current
        };
      }

      responseData.message = action === 'cure' ? 'Disease/Poison cured' : `Healed ${useAmount} HP`;
      responseData.remaining = data.features.lay_on_hands.pool;
    } else if (data.features[feature]) {
      const featureData = data.features[feature];

      if (featureData.uses <= 0) {
        return res.status(400).json({ error: `No ${feature} uses remaining` });
      }

      featureData.uses -= 1;
      responseData.message = `${feature} used`;
      responseData.remaining = featureData.uses;
    } else {
      return res.status(400).json({ error: 'Unknown feature' });
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    // Add condition if duration is present
    if (duration) {
      const rounds = parseDuration(duration);
      if (rounds) {
        const conditionName = name || feature;
        
        // Check if already exists
        const existing = db.prepare(`
          SELECT * FROM conditions
          WHERE character_id = 1 AND name = ? AND active = 1
        `).get(conditionName);

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
          `).run(conditionName, rounds, rounds);
        }
        
        io.emit('condition_added', { name: conditionName, duration_type: 'rounds', duration_value: rounds });
      }
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error using feature:', error);
    res.status(500).json({ error: 'Failed to use feature' });
  }
});

// Delete a condition
router.delete('/conditions/:name', (req, res) => {
  try {
    const { name } = req.params;
    const db = getDb();

    const stmt = db.prepare(`
      UPDATE conditions 
      SET active = 0 
      WHERE character_id = 1 AND name = ? AND active = 1
    `);

    const result = stmt.run(name);

    if (result.changes > 0) {
      res.json({ success: true, message: `Condition ${name} removed` });
    } else {
      res.status(404).json({ error: 'Condition not found or already inactive' });
    }
  } catch (error) {
    console.error('Error removing condition:', error);
    res.status(500).json({ error: 'Failed to remove condition' });
  }
});

// Update currency/money
router.patch('/money', (req, res) => {
  try {
    const { money } = req.body;

    if (!money) {
      return res.status(400).json({ error: 'Missing money data' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);
    
    // Update money values (validate non-negative)
    data.money = {
      pp: Math.max(0, parseInt(money.pp) || 0),
      gp: Math.max(0, parseInt(money.gp) || 0),
      ep: Math.max(0, parseInt(money.ep) || 0),
      sp: Math.max(0, parseInt(money.sp) || 0),
      cp: Math.max(0, parseInt(money.cp) || 0)
    };

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    io.emit('currency_updated', data.money);

    res.json({
      success: true,
      money: data.money
    });
  } catch (error) {
    console.error('Error updating money:', error);
    res.status(500).json({ error: 'Failed to update money' });
  }
});

// Save session notes
router.post('/notes', (req, res) => {
  try {
    const { notes } = req.body;

    if (notes === undefined) {
      return res.status(400).json({ error: 'Missing notes' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);
    data.session_notes = notes;

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: 'Notes saved successfully'
    });
  } catch (error) {
    console.error('Error saving notes:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

return router;
};

