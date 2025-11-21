const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/thalric.db');
const db = new Database(dbPath);

// Noms anglais des sorts avec descriptions françaises
const spellNames = {
  // Cantrips
  "light": {
    nameEN: "Light",
    descriptionFR: "Toucher un objet pour qu'il émette une lumière vive dans un rayon de 20 pieds",
    sourceFR: "Racial Aasimar"
  },

  // Level 1
  "protection_from_evil_and_good": {
    nameEN: "Protection from Evil and Good",
    descriptionFR: "Protège contre les aberrations, célestes, élémentaires, fées, fiélons et morts-vivants",
    sourceFR: "Sort de serment"
  },
  "sanctuary": {
    nameEN: "Sanctuary",
    descriptionFR: "Protège une créature contre les attaques, les attaquants doivent réussir un jet de Sagesse",
    sourceFR: "Sort de serment"
  },
  "bless": {
    nameEN: "Bless",
    descriptionFR: "3 créatures ajoutent 1d4 aux jets d'attaque et de sauvegarde"
  },
  "cure_wounds": {
    nameEN: "Cure Wounds",
    descriptionFR: "Soigne 1d8 + modificateur de CHA PV"
  },
  "shield_of_faith": {
    nameEN: "Shield of Faith",
    descriptionFR: "+2 CA à la cible"
  },
  "heroism": {
    nameEN: "Heroism",
    descriptionFR: "La cible est immunisée contre la condition effrayé et gagne 5 PV temporaires au début de chacun de ses tours"
  },

  // Level 2
  "lesser_restoration": {
    nameEN: "Lesser Restoration",
    descriptionFR: "Termine une maladie ou condition (aveuglé, assourdi, paralysé, empoisonné)",
    sourceFR: "Sort de serment"
  },
  "zone_of_truth": {
    nameEN: "Zone of Truth",
    descriptionFR: "Les créatures dans un rayon de 15 pieds ne peuvent pas mentir",
    sourceFR: "Sort de serment"
  },
  "aid": {
    nameEN: "Aid",
    descriptionFR: "Jusqu'à 3 créatures gagnent 5 PV temporaires et augmentent leur maximum de PV"
  },
  "find_steed": {
    nameEN: "Find Steed",
    descriptionFR: "Invoque un esprit céleste, féérique ou fiélon comme monture"
  },
  "prayer_of_healing": {
    nameEN: "Prayer of Healing",
    descriptionFR: "Jusqu'à 6 créatures récupèrent 2d8 + modificateur de CHA PV"
  },

  // Level 3
  "dispel_magic": {
    nameEN: "Dispel Magic",
    descriptionFR: "Termine les sorts de niveau 3 ou inférieur, jet pour les sorts de niveau supérieur",
    sourceFR: "Sort de serment"
  },
  "beacon_of_hope": {
    nameEN: "Beacon of Hope",
    descriptionFR: "Les créatures ont l'avantage aux jets de Sagesse et de mort, récupèrent le maximum de PV lors des soins",
    sourceFR: "Sort de serment"
  },
  "revivify": {
    nameEN: "Revivify",
    descriptionFR: "Ramène à la vie une créature morte depuis moins d'une minute"
  },
  "aura_of_vitality": {
    nameEN: "Aura of Vitality",
    descriptionFR: "Action bonus pour soigner 2d6 PV à une créature dans l'aura"
  },
  "magic_circle": {
    nameEN: "Magic Circle",
    descriptionFR: "Cylindre de 10 pieds protège contre les célestes, élémentaires, fées, fiélons ou morts-vivants"
  },
  "remove_curse": {
    nameEN: "Remove Curse",
    descriptionFR: "Termine toutes les malédictions sur une créature ou un objet",
    sourceFR: "Sort de serment"
  },
  "crusaders_mantle": {
    nameEN: "Crusader's Mantle",
    descriptionFR: "Les alliés à 30 pieds infligent +1d4 dégâts radiants avec leurs attaques d'armes"
  },

  // Level 4
  "aura_of_life": {
    nameEN: "Aura of Life",
    descriptionFR: "Résistance aux dégâts nécrotiques, les alliés à 0 PV récupèrent 1 PV au début de leur tour",
    sourceFR: "Sort de serment"
  },
  "guardian_of_faith": {
    nameEN: "Guardian of Faith",
    descriptionFR: "Un gardien spectral inflige 20 dégâts radiants aux ennemis qui s'approchent"
  },
  "death_ward": {
    nameEN: "Death Ward",
    descriptionFR: "La première fois que la cible tomberait à 0 PV, elle tombe à 1 PV à la place. Le sort se termine après avoir empêché la mort une fois."
  }
};

// Traductions des écoles de magie
const schoolTranslations = {
  "evocation": "évocation",
  "abjuration": "abjuration",
  "enchantment": "enchantement",
  "necromancy": "nécromancie",
  "conjuration": "invocation"
};

// Traductions des temps d'incantation
const castingTimeTranslations = {
  "1 action": "1 action",
  "1 bonus action": "1 action bonus",
  "10 minutes": "10 minutes",
  "1 minute": "1 minute"
};

// Traductions des portées
const rangeTranslations = {
  "Touch": "Toucher",
  "Self": "Soi-même",
  "30 feet": "30 pieds",
  "60 feet": "60 pieds",
  "120 feet": "120 pieds",
  "10 feet": "10 pieds",
  "Self (30-foot radius)": "Soi-même (rayon de 30 pieds)"
};

// Traductions des durées
const durationTranslations = {
  "1 hour": "1 heure",
  "1 minute": "1 minute",
  "10 minutes": "10 minutes",
  "8 hours": "8 heures",
  "Instantaneous": "Instantanée",
  "Concentration, up to 10 minutes": "Concentration, jusqu'à 10 minutes",
  "Concentration, up to 1 minute": "Concentration, jusqu'à 1 minute"
};

console.log('🔄 Remise des noms de sorts en anglais (descriptions en français)...\n');

// Récupérer les données du personnage
const character = db.prepare('SELECT data FROM character WHERE id = 1').get();
const data = JSON.parse(character.data);

// Mettre à jour tous les sorts
Object.keys(data.spells).forEach(levelKey => {
  const levelSpells = data.spells[levelKey];

  Object.keys(levelSpells).forEach(spellKey => {
    const spell = levelSpells[spellKey];
    const spellData = spellNames[spellKey];

    if (spellData) {
      // Nom en anglais, description en français
      console.log(`  ✓ ${spell.name} → ${spellData.nameEN}`);
      spell.name = spellData.nameEN;
      spell.description = spellData.descriptionFR;

      if (spellData.sourceFR) {
        spell.source = spellData.sourceFR;
      }
    }

    // Traduire les champs communs en français
    if (spell.school && schoolTranslations[spell.school]) {
      spell.school = schoolTranslations[spell.school];
    }

    if (spell.casting_time && castingTimeTranslations[spell.casting_time]) {
      spell.casting_time = castingTimeTranslations[spell.casting_time];
    }

    if (spell.range && rangeTranslations[spell.range]) {
      spell.range = rangeTranslations[spell.range];
    }

    if (spell.duration && durationTranslations[spell.duration]) {
      spell.duration = durationTranslations[spell.duration];
    }
  });
});

// Mettre à jour la base de données
const stmt = db.prepare(`
  UPDATE character
  SET data = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`);

stmt.run(JSON.stringify(data));

console.log('\n✅ Noms des sorts remis en anglais!');
console.log('📝 Descriptions gardées en français.');

db.close();
