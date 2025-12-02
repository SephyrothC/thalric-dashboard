const express = require('express');
const { getDb } = require('../db/database');

// Dice rolling utilities
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function parseDiceFormula(formula) {
  // Parse formula like "1d20+8" or "2d6+3"
  const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);

  if (!match) {
    throw new Error('Invalid dice formula');
  }

  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  return { count, sides, modifier };
}

function getMaxDamage(formula) {
  const { count, sides, modifier } = parseDiceFormula(formula);
  return (count * sides) + modifier;
}

function executeDiceRoll(formula) {
  const { count, sides, modifier } = parseDiceFormula(formula);
  const rolls = [];
  let total = modifier;

  for (let i = 0; i < count; i++) {
    const roll = rollDice(sides);
    rolls.push(roll);
    total += roll;
  }

  return {
    rolls,
    modifier,
    total,
    isCritical: count === 1 && sides === 20 && rolls[0] === 20,
    isFumble: count === 1 && sides === 20 && rolls[0] === 1
  };
}

module.exports = (io) => {
  const router = express.Router();

  // Roll dice
  router.post('/roll', (req, res) => {
    try {
      const { formula, rollType, details } = req.body;

      if (!formula) {
        return res.status(400).json({ error: 'Missing dice formula' });
      }

      const rollResult = executeDiceRoll(formula);
      const timestamp = new Date().toISOString();

      // Save to database
      const db = getDb();
      const stmt = db.prepare(`
        INSERT INTO dice_rolls (character_id, formula, result, roll_type, details, is_critical, is_fumble, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        1, // character_id = 1 (Thalric)
        formula,
        rollResult.total,
        rollType || 'Unknown',
        details || null,
        rollResult.isCritical ? 1 : 0,
        rollResult.isFumble ? 1 : 0,
        timestamp
      );

      // Broadcast to all connected clients (including viewers)
      const broadcastData = {
        result: rollResult.total,
        formula,
        rollType: rollType || 'Dice Roll',
        details: details || `Rolled ${rollResult.rolls.join(', ')}`,
        rolls: rollResult.rolls,
        modifier: rollResult.modifier,
        is_critical: rollResult.isCritical,
        is_fumble: rollResult.isFumble,
        timestamp: new Date().toLocaleTimeString(),
        animation_class: rollResult.isCritical ? 'critical-success' : rollResult.isFumble ? 'critical-failure' : 'normal-roll'
      };

      io.emit('dice_roll', broadcastData);

      res.json({
        success: true,
        ...rollResult,
        timestamp
      });
    } catch (error) {
      console.error('Error rolling dice:', error);
      res.status(500).json({ error: 'Failed to roll dice' });
    }
  });

  // Roll attack
  router.post('/attack', (req, res) => {
    try {
      const { weaponId, modifiers } = req.body;

      if (!weaponId) {
        return res.status(400).json({ error: 'Missing weapon ID' });
      }

      // Get character data to fetch weapon info
      const db = getDb();
      const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      const data = JSON.parse(character.data);
      const weapon = data.weapons[weaponId];

      if (!weapon) {
        return res.status(400).json({ error: 'Weapon not found' });
      }

      // Fetch active conditions
      const activeConditions = db.prepare(`
        SELECT name FROM conditions 
        WHERE character_id = 1 AND active = 1
      `).all().map(c => c.name);

      // Calculate attack bonus
      let attackBonus = weapon.attack_bonus;
      let bonusDetails = [];

      // Apply Sacred Weapon
      if (activeConditions.includes('Sacred Weapon')) {
        attackBonus += 5;
        bonusDetails.push('Sacred Weapon (+5)');
      }

      // Apply Bless
      if (activeConditions.includes('Bless')) {
        const blessRoll = executeDiceRoll('1d4');
        attackBonus += blessRoll.total;
        bonusDetails.push(`Bless (+${blessRoll.total})`);
      }

      // Apply Bane
      if (activeConditions.includes('Bane')) {
        const baneRoll = executeDiceRoll('1d4');
        attackBonus -= baneRoll.total;
        bonusDetails.push(`Bane (-${baneRoll.total})`);
      }

      // Manual modifiers
      if (modifiers?.sacredWeapon && !activeConditions.includes('Sacred Weapon')) {
        attackBonus += 5;
        bonusDetails.push('Sacred Weapon (+5)');
      }

      // Roll attack
      const attackFormula = `1d20+${attackBonus}`;
      const attackRoll = executeDiceRoll(attackFormula);

      // Format details
      const rollDetails = `Roll: ${attackRoll.rolls[0]} + ${weapon.attack_bonus} (Base)${bonusDetails.length > 0 ? ' + ' + bonusDetails.join(' + ') : ''}`;

      // Broadcast attack roll
      const attackData = {
        result: attackRoll.total,
        formula: attackFormula,
        rollType: `Attack - ${weapon.name}`,
        details: rollDetails,
        is_critical: attackRoll.isCritical,
        is_fumble: attackRoll.isFumble,
        timestamp: new Date().toLocaleTimeString(),
        animation_class: attackRoll.isCritical ? 'critical-success' : attackRoll.isFumble ? 'critical-failure' : 'normal-roll'
      };

      io.emit('dice_roll', attackData);

      // Save attack roll
      const stmt = db.prepare(`
        INSERT INTO dice_rolls (character_id, formula, result, roll_type, is_critical, is_fumble)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        1,
        attackFormula,
        attackRoll.total,
        `Attack - ${weapon.name}`,
        attackRoll.isCritical ? 1 : 0,
        attackRoll.isFumble ? 1 : 0
      );

      res.json({
        success: true,
        attackRoll: attackRoll.total,
        isCritical: attackRoll.isCritical,
        isFumble: attackRoll.isFumble,
        weapon: weapon.name
      });
    } catch (error) {
      console.error('Error rolling attack:', error);
      res.status(500).json({ error: 'Failed to roll attack' });
    }
  });

  // Roll damage
  router.post('/damage', (req, res) => {
    try {
      const { weaponId, isCritical, modifiers } = req.body;

      if (!weaponId) {
        return res.status(400).json({ error: 'Missing weapon ID' });
      }

      // Get character data
      const db = getDb();
      const character = db.prepare('SELECT data FROM character WHERE id = 1').get();

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      // Fetch active conditions
      const activeConditions = db.prepare(`
        SELECT name FROM conditions 
        WHERE character_id = 1 AND active = 1
      `).all().map(c => c.name);

      const data = JSON.parse(character.data);
      const weapon = data.weapons[weaponId];

      if (!weapon) {
        return res.status(400).json({ error: 'Weapon not found' });
      }

      // Calculate damage
      let damageFormula = weapon.damage;
      let damageDetails = [];

      // Roll base damage
      let baseRoll = executeDiceRoll(damageFormula);
      let totalDamage = baseRoll.total;
      damageDetails.push(`${weapon.damage_type}: ${baseRoll.total}`);

      // Critical: double dice
      if (isCritical) {
        const maxDmg = getMaxDamage(damageFormula);
        totalDamage += maxDmg;
        damageDetails.push(`Critical (Max): +${maxDmg}`);
      }

      // Magic damage (Crystal Longsword)
      if (weapon.magic_damage) {
        const magicRoll = executeDiceRoll(weapon.magic_damage);
        totalDamage += magicRoll.total;
        damageDetails.push(`${weapon.magic_damage_type}: ${magicRoll.total}`);

        if (isCritical) {
          const maxMagic = getMaxDamage(weapon.magic_damage);
          totalDamage += maxMagic;
          damageDetails.push(`Critical ${weapon.magic_damage_type} (Max): +${maxMagic}`);
        }
      }

      // Improved Divine Smite (+1d8 radiant)
      if (data.features.improved_divine_smite) {
        const improvedSmiteRoll = executeDiceRoll('1d8');
        totalDamage += improvedSmiteRoll.total;
        damageDetails.push(`Improved Divine Smite: ${improvedSmiteRoll.total}`);

        if (isCritical) {
          const maxImp = getMaxDamage('1d8');
          totalDamage += maxImp;
          damageDetails.push(`Crit Imp. Smite (Max): +${maxImp}`);
        }
      }

      // Divine Smite (if using spell slot)
      if (modifiers?.divineSmiteLevel) {
        const level = modifiers.divineSmiteLevel;
        let smiteDice = Math.min(2 + level, 5); // 2d8 base + 1d8 per level, max 5d8
        
        // Undead/Fiend bonus (+1d8, max 6d8)
        if (modifiers.isUndeadFiend) {
          smiteDice = Math.min(smiteDice + 1, 6);
        }

        const smiteFormula = `${smiteDice}d8`;
        const smiteRoll = executeDiceRoll(smiteFormula);
        totalDamage += smiteRoll.total;
        damageDetails.push(`Divine Smite (Lv${level}${modifiers.isUndeadFiend ? '+Fiend' : ''}): ${smiteRoll.total}`);

        if (isCritical) {
          const maxSmite = getMaxDamage(smiteFormula);
          totalDamage += maxSmite;
          damageDetails.push(`Crit Smite (Max): +${maxSmite}`);
        }

        // Consume spell slot
        data.spellcasting.spell_slots_current[level] -= 1;

        const updateStmt = db.prepare(`
          UPDATE character
          SET data = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `);
        updateStmt.run(JSON.stringify(data));
      }

      // Radiant Soul (+level radiant damage once per turn)
      if (modifiers?.radiantSoul || activeConditions.includes('Radiant Soul')) {
        totalDamage += data.character_info.level;
        damageDetails.push(`Radiant Soul: ${data.character_info.level}`);
      }

      // Broadcast damage roll
      const damageData = {
        result: totalDamage,
        formula: damageFormula,
        rollType: `Damage - ${weapon.name}`,
        details: damageDetails.join(' + '),
        timestamp: new Date().toLocaleTimeString(),
        animation_class: 'damage-roll',
        damage_type: weapon.damage_type
      };

      io.emit('dice_roll', damageData);

      res.json({
        success: true,
        totalDamage,
        details: damageDetails
      });
    } catch (error) {
      console.error('Error rolling damage:', error);
      res.status(500).json({ error: 'Failed to roll damage' });
    }
  });

  // Get dice roll history
  router.get('/history', (req, res) => {
    try {
      const db = getDb();
      const limit = req.query.limit || 20;

      const stmt = db.prepare(`
        SELECT * FROM dice_rolls
        WHERE character_id = 1
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      const rolls = stmt.all(limit);

      res.json({ rolls });
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  });

  return router;
};
