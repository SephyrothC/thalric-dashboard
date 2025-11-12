const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../../data/thalric.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
const db = new Database(DB_PATH, { verbose: console.log });
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency

// Initialize database schema
function initDatabase() {
  console.log('📦 Initializing SQLite database...');

  // Character table
  db.exec(`
    CREATE TABLE IF NOT EXISTS character (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      class TEXT NOT NULL,
      subclass TEXT,
      race TEXT,
      subrace TEXT,
      background TEXT,
      data TEXT NOT NULL,  -- JSON blob for full character data
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Spell slots table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spell_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      level INTEGER NOT NULL,
      current INTEGER NOT NULL,
      maximum INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
    )
  `);

  // Dice rolls table (for history and statistics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS dice_rolls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      formula TEXT NOT NULL,
      result INTEGER NOT NULL,
      roll_type TEXT NOT NULL,
      details TEXT,
      is_critical BOOLEAN DEFAULT 0,
      is_fumble BOOLEAN DEFAULT 0,
      FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
    )
  `);

  // Create index for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_dice_rolls_character
    ON dice_rolls(character_id, timestamp DESC)
  `);

  console.log('✅ Database initialized successfully');
}

// Get database instance
function getDb() {
  return db;
}

// Close database connection (call on app shutdown)
function closeDatabase() {
  db.close();
  console.log('🔒 Database connection closed');
}

module.exports = {
  initDatabase,
  getDb,
  closeDatabase
};
