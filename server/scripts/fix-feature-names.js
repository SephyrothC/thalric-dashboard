const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/thalric.db');
const db = new Database(dbPath);

// Noms anglais des features avec descriptions françaises
const featureNames = {
  "channel_divinity": {
    nameEN: "Channel Divinity",
    descriptionFR: null, // Pas de description principale
    recharge: "repos_court",
    options: {
      "sacred_weapon": {
        nameEN: "Sacred Weapon",
        descriptionFR: "+5 aux jets d'attaque, l'arme émet de la lumière, durée 1 minute"
      },
      "turn_the_unholy": {
        nameEN: "Turn the Unholy",
        descriptionFR: "Les fiélons et morts-vivants à 30 pieds doivent faire un jet de Sagesse (DD 18) ou être repoussés"
      }
    }
  },
  "lay_on_hands": {
    nameEN: "Lay on Hands",
    descriptionFR: "Soigne des PV ou guérit maladie/poison (5 PV par maladie/poison)",
    recharge: "repos_long"
  },
  "divine_sense": {
    nameEN: "Divine Sense",
    descriptionFR: "Détecte célestes, fiélons, morts-vivants à 60 pieds par action",
    recharge: "repos_long"
  },
  "healing_hands": {
    nameEN: "Healing Hands",
    descriptionFR: "Capacité de guérison raciale Aasimar",
    recharge: "repos_long"
  },
  "radiant_soul": {
    nameEN: "Radiant Soul",
    descriptionFR: "Action bonus : gagne 30 pieds de vol, +4 dégâts radiants une fois par tour",
    recharge: "repos_long"
  },
  "aura_of_protection": {
    nameEN: "Aura of Protection",
    descriptionFR: "+5 aux jets de sauvegarde pour vous et vos alliés à 10 pieds"
  },
  "aura_of_courage": {
    nameEN: "Aura of Courage",
    descriptionFR: "Vous et vos alliés à 10 pieds ne pouvez pas être effrayés"
  },
  "aura_of_devotion": {
    nameEN: "Aura of Devotion",
    descriptionFR: "Vous et vos alliés à 10 pieds ne pouvez pas être charmés"
  },
  "divine_smite": {
    nameEN: "Divine Smite",
    descriptionFR: "Dépensez un emplacement de sort pour +2d8 à 5d8 dégâts radiants sur une attaque de mêlée"
  },
  "improved_divine_smite": {
    nameEN: "Improved Divine Smite",
    descriptionFR: "Toutes les attaques d'armes de mêlée infligent +1d8 dégâts radiants"
  },
  "cleansing_touch": {
    nameEN: "Cleansing Touch",
    descriptionFR: "Termine un sort sur vous-même ou une créature consentante que vous touchez. Utilisations égales au modificateur de Charisme (minimum 1).",
    recharge: "repos_long"
  }
};

console.log('🔄 Remise des noms de features en anglais (descriptions en français)...\n');

// Récupérer les données du personnage
const character = db.prepare('SELECT data FROM character WHERE id = 1').get();
const data = JSON.parse(character.data);

// Mettre à jour toutes les features
Object.keys(data.features).forEach(featureKey => {
  const feature = data.features[featureKey];
  const featureData = featureNames[featureKey];

  if (featureData) {
    // Nom en anglais, description en français
    console.log(`  ✓ ${feature.name} → ${featureData.nameEN}`);
    feature.name = featureData.nameEN;

    if (featureData.descriptionFR) {
      feature.description = featureData.descriptionFR;
    }

    if (featureData.recharge) {
      feature.recharge = featureData.recharge;
    }

    // Traduire les options si elles existent (pour Channel Divinity)
    if (featureData.options && feature.options) {
      Object.keys(feature.options).forEach(optionKey => {
        const option = feature.options[optionKey];
        const optionData = featureData.options[optionKey];

        if (optionData) {
          console.log(`    ↳ ${option.name} → ${optionData.nameEN}`);
          option.name = optionData.nameEN;
          option.description = optionData.descriptionFR;
        }
      });
    }
  }
});

// Mettre à jour la base de données
const stmt = db.prepare(`
  UPDATE character
  SET data = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
`);

stmt.run(JSON.stringify(data));

console.log('\n✅ Noms des features remis en anglais!');
console.log('📝 Descriptions gardées en français.');

db.close();
