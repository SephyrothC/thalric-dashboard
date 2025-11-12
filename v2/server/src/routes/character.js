const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// Get current character
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const character = db.prepare('SELECT * FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Parse JSON data
    const characterData = {
      ...character,
      data: JSON.parse(character.data)
    };

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
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Restore short rest features
    if (data.features.channel_divinity) {
      data.features.channel_divinity.uses = data.features.channel_divinity.uses_max;
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
      restored: ['Channel Divinity']
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
    const { feature, amount } = req.body;

    if (!feature) {
      return res.status(400).json({ error: 'Missing feature name' });
    }

    const db = getDb();
    const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const data = JSON.parse(character.data);

    // Handle different features
    if (feature === 'lay_on_hands') {
      const pool = data.features.lay_on_hands.pool;
      const useAmount = amount || 1;

      if (pool < useAmount) {
        return res.status(400).json({ error: 'Not enough Lay on Hands points' });
      }

      data.features.lay_on_hands.pool -= useAmount;
    } else if (data.features[feature]) {
      const featureData = data.features[feature];

      if (featureData.uses <= 0) {
        return res.status(400).json({ error: `No ${feature} uses remaining` });
      }

      featureData.uses -= 1;
    } else {
      return res.status(400).json({ error: 'Unknown feature' });
    }

    const stmt = db.prepare(`
      UPDATE character
      SET data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    stmt.run(JSON.stringify(data));

    res.json({
      success: true,
      message: `${feature} used`,
      remaining: data.features[feature]?.uses || data.features[feature]?.pool
    });
  } catch (error) {
    console.error('Error using feature:', error);
    res.status(500).json({ error: 'Failed to use feature' });
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

module.exports = router;
