const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/thalric.db');
const db = new Database(dbPath);

console.log('🔄 Starting Phase 1 Migration...');

try {
  db.exec('BEGIN TRANSACTION');

  // =============================================
  // 1. DEATH SAVES SYSTEM
  // =============================================
  console.log('📝 Adding Death Saves columns...');

  try {
    db.exec(`ALTER TABLE character ADD COLUMN death_saves_successes INTEGER DEFAULT 0 CHECK (death_saves_successes BETWEEN 0 AND 3)`);
  } catch (e) {
    console.log('   death_saves_successes already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN death_saves_failures INTEGER DEFAULT 0 CHECK (death_saves_failures BETWEEN 0 AND 3)`);
  } catch (e) {
    console.log('   death_saves_failures already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN is_stable INTEGER DEFAULT 0`);
  } catch (e) {
    console.log('   is_stable already exists, skipping...');
  }

  // =============================================
  // 2. CONDITIONS TRACKER
  // =============================================
  console.log('📝 Creating conditions table...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      duration_type TEXT,
      duration_value INTEGER,
      rounds_left INTEGER,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (character_id) REFERENCES character(id) ON DELETE CASCADE
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_conditions_active ON conditions(character_id, active)`);

  // =============================================
  // 3. CONCENTRATION TRACKER
  // =============================================
  console.log('📝 Adding Concentration columns...');

  try {
    db.exec(`ALTER TABLE character ADD COLUMN concentration_spell TEXT`);
  } catch (e) {
    console.log('   concentration_spell already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN concentration_duration INTEGER`);
  } catch (e) {
    console.log('   concentration_duration already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN concentration_rounds_left INTEGER`);
  } catch (e) {
    console.log('   concentration_rounds_left already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN concentration_dc INTEGER DEFAULT 10`);
  } catch (e) {
    console.log('   concentration_dc already exists, skipping...');
  }

  // =============================================
  // 4. INITIATIVE & COMBAT TRACKER
  // =============================================
  console.log('📝 Adding Combat Tracker columns...');

  try {
    db.exec(`ALTER TABLE character ADD COLUMN initiative INTEGER DEFAULT 0`);
  } catch (e) {
    console.log('   initiative already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN in_combat INTEGER DEFAULT 0`);
  } catch (e) {
    console.log('   in_combat already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN current_round INTEGER DEFAULT 0`);
  } catch (e) {
    console.log('   current_round already exists, skipping...');
  }

  try {
    db.exec(`ALTER TABLE character ADD COLUMN reaction_used INTEGER DEFAULT 0`);
  } catch (e) {
    console.log('   reaction_used already exists, skipping...');
  }

  db.exec('COMMIT');

  console.log('✅ Phase 1 Migration completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  ✓ Death Saves System');
  console.log('  ✓ Conditions Tracker Table');
  console.log('  ✓ Concentration Tracker');
  console.log('  ✓ Initiative & Combat Tracker');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
