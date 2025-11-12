const fs = require('fs');
const path = require('path');
const { initDatabase, getDb } = require('./database');

// Migration script to import thalric_data.json into SQLite

function migrateCharacterData() {
  console.log('🚀 Starting data migration...');

  // Initialize database
  initDatabase();
  const db = getDb();

  // Read existing thalric_data.json
  const jsonPath = path.join(__dirname, '../../../thalric_data.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ thalric_data.json not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const characterData = JSON.parse(rawData);

  console.log(`📦 Loaded character: ${characterData.character_info.name}`);

  // Check if character already exists
  const existingChar = db.prepare('SELECT id FROM character WHERE id = 1').get();

  if (existingChar) {
    console.log('⚠️  Character already exists in database. Updating...');

    const updateStmt = db.prepare(`
      UPDATE character
      SET name = ?,
          level = ?,
          class = ?,
          subclass = ?,
          race = ?,
          subrace = ?,
          background = ?,
          data = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `);

    updateStmt.run(
      characterData.character_info.name,
      characterData.character_info.level,
      characterData.character_info.class,
      characterData.character_info.subclass || '',
      characterData.character_info.race,
      characterData.character_info.subrace || '',
      characterData.character_info.background,
      JSON.stringify(characterData)
    );

    console.log('✅ Character updated successfully');
  } else {
    console.log('➕ Inserting new character...');

    const insertStmt = db.prepare(`
      INSERT INTO character (id, name, level, class, subclass, race, subrace, background, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      1,
      characterData.character_info.name,
      characterData.character_info.level,
      characterData.character_info.class,
      characterData.character_info.subclass || '',
      characterData.character_info.race,
      characterData.character_info.subrace || '',
      characterData.character_info.background,
      JSON.stringify(characterData)
    );

    console.log('✅ Character inserted successfully');
  }

  // Migrate spell slots
  if (characterData.spellcasting) {
    console.log('📚 Migrating spell slots...');

    // Delete existing spell slots for this character
    db.prepare('DELETE FROM spell_slots WHERE character_id = 1').run();

    const insertSlotStmt = db.prepare(`
      INSERT INTO spell_slots (character_id, level, current, maximum)
      VALUES (?, ?, ?, ?)
    `);

    Object.keys(characterData.spellcasting.spell_slots).forEach(level => {
      const maximum = characterData.spellcasting.spell_slots[level];
      const current = characterData.spellcasting.spell_slots_current[level];

      insertSlotStmt.run(1, parseInt(level), current, maximum);
    });

    console.log('✅ Spell slots migrated');
  }

  console.log('🎉 Migration completed successfully!');
  console.log('\nCharacter summary:');
  console.log(`  Name: ${characterData.character_info.name}`);
  console.log(`  Level: ${characterData.character_info.level}`);
  console.log(`  Class: ${characterData.character_info.class} (${characterData.character_info.subclass})`);
  console.log(`  Race: ${characterData.character_info.race}`);
  console.log(`  HP: ${characterData.stats.hp_current}/${characterData.stats.hp_max}`);
}

// Run migration if executed directly
if (require.main === module) {
  try {
    migrateCharacterData();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

module.exports = { migrateCharacterData };
