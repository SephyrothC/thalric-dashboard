-- Thalric Dashboard Database Schema
-- SQLite3 Schema for character management

-- Character table - Stores main character data
CREATE TABLE IF NOT EXISTS character (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  class TEXT NOT NULL,
  subclass TEXT,
  race TEXT,
  subrace TEXT,
  background TEXT,
  data TEXT NOT NULL,  -- JSON blob containing all character stats and features
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Spell slots table - Tracks spell slot usage
CREATE TABLE IF NOT EXISTS spell_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  level INTEGER NOT NULL,          -- Spell level (1-9)
  current INTEGER NOT NULL,        -- Current available slots
  maximum INTEGER NOT NULL,        -- Maximum slots
  FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
);

-- Dice rolls table - History of all dice rolls
CREATE TABLE IF NOT EXISTS dice_rolls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id INTEGER NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  formula TEXT NOT NULL,           -- e.g. "1d20+8"
  result INTEGER NOT NULL,         -- Final result
  roll_type TEXT NOT NULL,         -- e.g. "Attack", "Saving Throw", "Skill Check"
  details TEXT,                    -- Additional info (JSON)
  is_critical BOOLEAN DEFAULT 0,
  is_fumble BOOLEAN DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dice_rolls_character
  ON dice_rolls(character_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_spell_slots_character
  ON spell_slots(character_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_character_timestamp
AFTER UPDATE ON character
BEGIN
  UPDATE character SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
