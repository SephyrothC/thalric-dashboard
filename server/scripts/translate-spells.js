const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/thalric.db');
const db = new Database(dbPath);

// Traductions des sorts
const spellTranslations = {
  // Cantrips
  "light": {
    name: "Lumière",
    description: "Toucher un objet pour qu'il émette une lumière vive dans un rayon de 20 pieds",
    source: "Racial Aasimar"
  },

  // Level 1
  "protection_from_evil_and_good": {
    name: "Protection contre le Mal et le Bien",
    description: "Protège contre les aberrations, célestes, élémentaires, fées, fiélons et morts-vivants",
    source: "Sort de serment"
  },
  "sanctuary": {
    name: "Sanctuaire",
    description: "Protège une créature contre les attaques, les attaquants doivent réussir un jet de Sagesse",
    source: "Sort de serment"
  },
  "bless": {
    name: "Bénédiction",
    description: "3 créatures ajoutent 1d4 aux jets d'attaque et de sauvegarde"
  },
  "cure_wounds": {
    name: "Soins",
    description: "Soigne 1d8 + modificateur de CHA PV"
  },
  "shield_of_faith": {
    name: "Bouclier de la Foi",
    description: "+2 CA à la cible"
  },
  "heroism": {
    name: "Héroïsme",
    description: "La cible est immunisée contre la condition effrayé et gagne 5 PV temporaires au début de chacun de ses tours"
  },

  // Level 2
  "lesser_restoration": {
    name: "Restauration Partielle",
    description: "Termine une maladie ou condition (aveuglé, assourdi, paralysé, empoisonné)",
    source: "Sort de serment"
  },
  "zone_of_truth": {
    name: "Zone de Vérité",
    description: "Les créatures dans un rayon de 15 pieds ne peuvent pas mentir",
    source: "Sort de serment"
  },
  "aid": {
    name: "Aide",
    description: "Jusqu'à 3 créatures gagnent 5 PV temporaires et augmentent leur maximum de PV"
  },
  "find_steed": {
    name: "Trouver une Monture",
    description: "Invoque un esprit céleste, féérique ou fiélon comme monture"
  },
  "prayer_of_healing": {
    name: "Prière de Guérison",
    description: "Jusqu'à 6 créatures récupèrent 2d8 + modificateur de CHA PV"
  },

  // Level 3
  "dispel_magic": {
    name: "Dissipation de la Magie",
    description: "Termine les sorts de niveau 3 ou inférieur, jet pour les sorts de niveau supérieur",
    source: "Sort de serment"
  },
  "beacon_of_hope": {
    name: "Lueur d'Espoir",
    description: "Les créatures ont l'avantage aux jets de Sagesse et de mort, récupèrent le maximum de PV lors des soins",
    source: "Sort de serment"
  },
  "revivify": {
    name: "Rappel à la Vie",
    description: "Ramène à la vie une créature morte depuis moins d'une minute"
  },
  "aura_of_vitality": {
    name: "Aura de Vitalité",
    description: "Action bonus pour soigner 2d6 PV à une créature dans l'aura"
  },
  "magic_circle": {
    name: "Cercle Magique",
    description: "Cylindre de 10 pieds protège contre les célestes, élémentaires, fées, fiélons ou morts-vivants"
  },
  "remove_curse": {
    name: "Lever une Malédiction",
    description: "Termine toutes les malédictions sur une créature ou un objet",
    source: "Sort de serment"
  },
  "crusaders_mantle": {
    name: "Manteau du Croisé",
    description: "Les alliés à 30 pieds infligent +1d4 dégâts radiants avec leurs attaques d'armes"
  },

  // Level 4
  "aura_of_life": {
    name: "Aura de Vie",
    description: "Résistance aux dégâts nécrotiques, les alliés à 0 PV récupèrent 1 PV au début de leur tour",
    source: "Sort de serment"
  },
  "guardian_of_faith": {
    name: "Gardien de la Foi",
    description: "Un gardien spectral inflige 20 dégâts radiants aux ennemis qui s'approchent"
  },
  "death_ward": {
    name: "Protection contre la Mort",
    description: "La première fois que la cible tomberait à 0 PV, elle tombe à 1 PV à la place. Le sort se termine après avoir empêché la mort une fois."
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

console.log('🌍 Traduction des sorts en français...\n');

// Récupérer les données du personnage
const character = db.prepare('SELECT data FROM character WHERE id = 1').get();
const data = JSON.parse(character.data);

// Traduire tous les sorts
Object.keys(data.spells).forEach(levelKey => {
  const levelSpells = data.spells[levelKey];

  Object.keys(levelSpells).forEach(spellKey => {
    const spell = levelSpells[spellKey];
    const translation = spellTranslations[spellKey];

    if (translation) {
      // Appliquer les traductions
      if (translation.name) {
        console.log(`  ✓ ${spell.name} → ${translation.name}`);
        spell.name = translation.name;
      }

      if (translation.description) {
        spell.description = translation.description;
      }

      if (translation.source) {
        spell.source = translation.source;
      }
    }

    // Traduire les champs communs
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

console.log('\n✅ Tous les sorts ont été traduits en français!');
console.log('📝 Base de données mise à jour avec succès.');

db.close();
