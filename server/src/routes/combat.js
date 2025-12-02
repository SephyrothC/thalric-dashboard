const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');

// Export a function that takes io as parameter
module.exports = (io) => {

  // =============================================
  // DEATH SAVES
  // =============================================

  // POST /api/combat/death-save/roll
  router.post('/death-save/roll', async (req, res) => {
    const db = getDb();

    try {
      const char = db.prepare('SELECT * FROM character WHERE id = 1').get();
      const data = JSON.parse(char.data);
      const roll = Math.floor(Math.random() * 20) + 1;

      let successes = char.death_saves_successes || 0;
      let failures = char.death_saves_failures || 0;
      let hp = data.stats.hp_current || 0;
      let stable = char.is_stable || 0;
      let result = '';
      let message = '';

      if (roll === 1) {
        // Natural 1 = 2 failures
        failures = Math.min(failures + 2, 3);
        result = 'critical_failure';
        message = `💀 CRITICAL FAILURE! (${failures}/3 failures)`;
      } else if (roll === 20) {
        // Natural 20 = heal 1 HP, reset
        hp = 1;
        successes = 0;
        failures = 0;
        stable = 0;
        result = 'critical_success';
        message = '💚 CRITICAL SUCCESS! You regain 1 HP!';
      } else if (roll >= 10) {
        successes = Math.min(successes + 1, 3);
        result = 'success';
        message = `✅ Success! (${successes}/3 successes)`;
      } else {
        failures = Math.min(failures + 1, 3);
        result = 'failure';
        message = `❌ Failure... (${failures}/3 failures)`;
      }

      // Check for stabilization or death
      if (successes >= 3) {
        hp = 1; // Regain 1 HP when stabilized with 3 successes
        stable = 0; // Not stable anymore since HP > 0
        successes = 0;
        failures = 0;
        result = 'stabilized';
        message = '✅ STABILIZED! You regain 1 HP and wake up!';
      }

      if (failures >= 3) {
        result = 'dead';
        message = '💀 YOU ARE DEAD. You have failed 3 death saves.';
      }

      // Update HP in data JSON if changed
      if (hp !== data.stats.hp_current) {
        data.stats.hp_current = hp;
        const updateDataStmt = db.prepare(`
          UPDATE character
          SET data = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `);
        updateDataStmt.run(JSON.stringify(data));
      }

      // Update death saves
      const updateStmt = db.prepare(`
        UPDATE character
        SET death_saves_successes = ?,
            death_saves_failures = ?,
            is_stable = ?
        WHERE id = 1
      `);
      updateStmt.run(successes, failures, stable);

      // Broadcast to viewers
      io.emit('death_save_rolled', {
        roll,
        result,
        successes,
        failures,
        message,
        timestamp: new Date().toLocaleTimeString()
      });

      res.json({ roll, result, successes, failures, hp, stable, message });
    } catch (error) {
      console.error('Death save roll failed:', error);
      res.status(500).json({ error: 'Failed to roll death save' });
    }
  });

  // POST /api/combat/death-save/reset
  router.post('/death-save/reset', async (req, res) => {
    const db = getDb();

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET death_saves_successes = 0,
            death_saves_failures = 0,
            is_stable = 0
        WHERE id = 1
      `);
      updateStmt.run();

      res.json({ success: true });
    } catch (error) {
      console.error('Death save reset failed:', error);
      res.status(500).json({ error: 'Failed to reset death saves' });
    }
  });

  // =============================================
  // CONDITIONS TRACKER
  // =============================================

  // GET /api/combat/conditions
  router.get('/conditions', async (req, res) => {
    const db = getDb();

    try {
      const conditions = db.prepare(`
        SELECT * FROM conditions
        WHERE character_id = 1 AND active = 1
        ORDER BY applied_at DESC
      `).all();

      res.json(conditions);
    } catch (error) {
      console.error('Failed to get conditions:', error);
      res.status(500).json({ error: 'Failed to get conditions' });
    }
  });

  // POST /api/combat/conditions/toggle
  router.post('/conditions/toggle', async (req, res) => {
    const db = getDb();
    const { name, duration_type = 'permanent', duration_value = null } = req.body;

    try {
      // Check if condition already active
      const existing = db.prepare(`
        SELECT * FROM conditions
        WHERE character_id = 1 AND name = ? AND active = 1
      `).get(name);

      if (existing) {
        // Remove condition
        db.prepare('UPDATE conditions SET active = 0 WHERE id = ?').run(existing.id);
        io.emit('condition_removed', { name });
        res.json({ action: 'removed', name });
      } else {
        // Add condition
        const insertStmt = db.prepare(`
          INSERT INTO conditions (character_id, name, duration_type, duration_value, rounds_left)
          VALUES (1, ?, ?, ?, ?)
        `);
        insertStmt.run(name, duration_type, duration_value, duration_value);

        io.emit('condition_added', { name, duration_type, duration_value });
        res.json({ action: 'added', name });
      }
    } catch (error) {
      console.error('Failed to toggle condition:', error);
      res.status(500).json({ error: 'Failed to toggle condition' });
    }
  });

  // POST /api/combat/conditions/tick
  router.post('/conditions/tick', async (req, res) => {
    const db = getDb();

    try {
      // Decrease rounds for round-based conditions
      db.prepare(`
        UPDATE conditions
        SET rounds_left = rounds_left - 1
        WHERE character_id = 1 AND active = 1 AND duration_type = 'rounds' AND rounds_left > 0
      `).run();

      // Remove expired conditions
      db.prepare(`
        UPDATE conditions
        SET active = 0
        WHERE character_id = 1 AND duration_type = 'rounds' AND rounds_left <= 0
      `).run();

      const conditions = db.prepare(`
        SELECT * FROM conditions
        WHERE character_id = 1 AND active = 1
      `).all();

      res.json(conditions);
    } catch (error) {
      console.error('Failed to tick conditions:', error);
      res.status(500).json({ error: 'Failed to tick conditions' });
    }
  });

  // DELETE /api/combat/conditions/clear
  router.delete('/conditions/clear', async (req, res) => {
    const db = getDb();

    try {
      db.prepare('UPDATE conditions SET active = 0 WHERE character_id = 1').run();
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to clear conditions:', error);
      res.status(500).json({ error: 'Failed to clear conditions' });
    }
  });

  // =============================================
  // CONCENTRATION TRACKER
  // =============================================

  // POST /api/combat/concentration/start
  router.post('/concentration/start', async (req, res) => {
    const db = getDb();
    const { spell, duration } = req.body;

    try {
      // Check if already concentrating
      const char = db.prepare('SELECT concentration_spell FROM character WHERE id = 1').get();

      if (char.concentration_spell) {
        return res.status(409).json({
          error: 'already_concentrating',
          current_spell: char.concentration_spell,
          message: 'You are already concentrating on a spell. End it first?'
        });
      }

      // Start concentration
      const updateStmt = db.prepare(`
        UPDATE character
        SET concentration_spell = ?,
            concentration_duration = ?,
            concentration_rounds_left = ?,
            concentration_dc = 10
        WHERE id = 1
      `);
      updateStmt.run(spell, duration, duration);

      io.emit('concentration_started', { spell, duration });

      res.json({ success: true, spell, duration });
    } catch (error) {
      console.error('Failed to start concentration:', error);
      res.status(500).json({ error: 'Failed to start concentration' });
    }
  });

  // DELETE /api/combat/concentration/end
  router.delete('/concentration/end', async (req, res) => {
    const db = getDb();

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET concentration_spell = NULL,
            concentration_duration = NULL,
            concentration_rounds_left = NULL,
            concentration_dc = 10
        WHERE id = 1
      `);
      updateStmt.run();

      io.emit('concentration_ended');

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to end concentration:', error);
      res.status(500).json({ error: 'Failed to end concentration' });
    }
  });

  // POST /api/combat/concentration/save
  router.post('/concentration/save', async (req, res) => {
    const db = getDb();
    const { damage } = req.body;

    try {
      const dc = Math.max(10, Math.floor(damage / 2));

      db.prepare('UPDATE character SET concentration_dc = ? WHERE id = 1').run(dc);

      res.json({ dc, message: `Roll Constitution save DC ${dc} to maintain concentration` });
    } catch (error) {
      console.error('Failed to calculate concentration save:', error);
      res.status(500).json({ error: 'Failed to calculate save DC' });
    }
  });

  // POST /api/combat/concentration/tick
  router.post('/concentration/tick', async (req, res) => {
    const db = getDb();

    try {
      const char = db.prepare('SELECT * FROM character WHERE id = 1').get();

      if (char.concentration_spell && char.concentration_rounds_left > 0) {
        const newRounds = char.concentration_rounds_left - 1;

        if (newRounds <= 0) {
          // Concentration ended naturally
          db.prepare(`
            UPDATE character
            SET concentration_spell = NULL,
                concentration_duration = NULL,
                concentration_rounds_left = NULL
            WHERE id = 1
          `).run();

          io.emit('concentration_ended', { reason: 'duration' });
        } else {
          db.prepare('UPDATE character SET concentration_rounds_left = ? WHERE id = 1').run(newRounds);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to tick concentration:', error);
      res.status(500).json({ error: 'Failed to tick concentration' });
    }
  });

  // =============================================
  // INITIATIVE & COMBAT TRACKER
  // =============================================

  // POST /api/combat/start
  router.post('/start', async (req, res) => {
    const db = getDb();
    const { initiative_roll } = req.body;

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET in_combat = 1,
            current_round = 1,
            initiative = ?,
            reaction_used = 0
        WHERE id = 1
      `);
      updateStmt.run(initiative_roll);

      io.emit('combat_started', { initiative: initiative_roll });

      res.json({ success: true, initiative: initiative_roll });
    } catch (error) {
      console.error('Failed to start combat:', error);
      res.status(500).json({ error: 'Failed to start combat' });
    }
  });

  // POST /api/combat/next-turn
  router.post('/next-turn', async (req, res) => {
    const db = getDb();

    try {
      // Reset reaction
      db.prepare('UPDATE character SET reaction_used = 0 WHERE id = 1').run();

      // Tick concentration (internal call)
      const char = db.prepare('SELECT * FROM character WHERE id = 1').get();

      if (char.concentration_spell && char.concentration_rounds_left > 0) {
        const newRounds = char.concentration_rounds_left - 1;

        if (newRounds <= 0) {
          db.prepare(`
            UPDATE character
            SET concentration_spell = NULL,
                concentration_duration = NULL,
                concentration_rounds_left = NULL
            WHERE id = 1
          `).run();

          io.emit('concentration_ended', { reason: 'duration' });
        } else {
          db.prepare('UPDATE character SET concentration_rounds_left = ? WHERE id = 1').run(newRounds);
        }
      }

      // Tick conditions
      db.prepare(`
        UPDATE conditions
        SET rounds_left = rounds_left - 1
        WHERE character_id = 1 AND active = 1 AND duration_type = 'rounds' AND rounds_left > 0
      `).run();

      db.prepare(`
        UPDATE conditions
        SET active = 0
        WHERE character_id = 1 AND duration_type = 'rounds' AND rounds_left <= 0
      `).run();

      // Emit update
      io.emit('turn_advanced');

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to advance turn:', error);
      res.status(500).json({ error: 'Failed to advance turn' });
    }
  });

  // POST /api/combat/next-round
  router.post('/next-round', async (req, res) => {
    const db = getDb();

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET current_round = current_round + 1,
            reaction_used = 0
        WHERE id = 1
      `);
      updateStmt.run();

      const char = db.prepare('SELECT current_round FROM character WHERE id = 1').get();
      io.emit('round_advanced', { round: char.current_round });

      res.json({ success: true, round: char.current_round });
    } catch (error) {
      console.error('Failed to advance round:', error);
      res.status(500).json({ error: 'Failed to advance round' });
    }
  });

  // POST /api/combat/reset-round
  router.post('/reset-round', async (req, res) => {
    const db = getDb();

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET current_round = 1,
            reaction_used = 0
        WHERE id = 1
      `);
      updateStmt.run();

      io.emit('round_advanced', { round: 1 });

      res.json({ success: true, round: 1 });
    } catch (error) {
      console.error('Failed to reset round:', error);
      res.status(500).json({ error: 'Failed to reset round' });
    }
  });

  // POST /api/combat/end
  router.post('/end', async (req, res) => {
    const db = getDb();

    try {
      const updateStmt = db.prepare(`
        UPDATE character
        SET in_combat = 0,
            current_round = 0,
            initiative = 0,
            reaction_used = 0
        WHERE id = 1
      `);
      updateStmt.run();

      io.emit('combat_ended');

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to end combat:', error);
      res.status(500).json({ error: 'Failed to end combat' });
    }
  });

  // POST /api/combat/reaction/toggle
  router.post('/reaction/toggle', async (req, res) => {
    const db = getDb();

    try {
      const char = db.prepare('SELECT reaction_used FROM character WHERE id = 1').get();
      const newState = char.reaction_used === 1 ? 0 : 1;

      db.prepare('UPDATE character SET reaction_used = ? WHERE id = 1').run(newState);

      res.json({ reaction_used: newState });
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      res.status(500).json({ error: 'Failed to toggle reaction' });
    }
  });

  return router;
};
