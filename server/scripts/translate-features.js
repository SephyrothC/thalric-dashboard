const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/thalric.db');
const db = new Database(dbPath);

// Traductions des features
const featureTranslations = {
  "channel_divinity": {
    name: "Canalisation Divine",
    recharge: "repos_court",
    options: {
      "sacred_weapon": {
        name: "Arme Sacrée",
        description: "+5 aux jets d'attaque, l'arme émet de la lumière, durée 1 minute"
      },
      "turn_the_unholy": {
        name: "Repousser les Impies",
        description: "Les fiélons et morts-vivants à 30 pieds doivent faire un jet de Sagesse (DD 18) ou être repoussés"
      }
    }
  },
  "lay_on_hands": {
    name: "Imposition des Mains",
    recharge: "repos_long",
    description: "Soigne des PV ou guérit maladie/poison (5 PV par maladie/poison)"
  },
  "divine_sense": {
    name: "Détection Divine",
    recharge: "repos_long",
    description: "Détecte célestes, fiélons, morts-vivants à 60 pieds par action"
  },
  "healing_hands": {
    name: "Mains Guérisseuses",
    recharge: "repos_long",
    description: "Capacité de guérison raciale Aasimar"
  },
  "radiant_soul": {
    name: "Âme Radieuse",
    recharge: "repos_long",
    description: "Action bonus : gagne 30 pieds de vol, +4 dégâts radiants une fois par tour"
  },
  "aura_of_protection": {
    name: "Aura de Protection",
    description: "+5 aux jets de sauvegarde pour vous et vos alliés à 10 pieds"
  },
  "aura_of_courage": {
    name: "Aura de Courage",
    description: "Vous et vos alliés à 10 pieds ne pouvez pas être effrayés"
  },
  "aura_of_devotion": {
    name: "Aura de Dévotion",
    description: "Vous et vos alliés à 10 pieds ne pouvez pas être charmés"
  },
  "divine_smite": {
    name: "Châtiment Divin",
    description: "Dépensez un emplacement de sort pour +2d8 à 5d8 dégâts radiants sur une attaque de mêlée"
  },
  "improved_divine_smite": {
    name: "Châtiment Divin Amélioré",
    description: "Toutes les attaques d'armes de mêlée infligent +1d8 dégâts radiants"
  },
  "cleansing_touch": {
    name: "Toucher Purificateur",
    recharge: "repos_long",
    description: "Termine un sort sur vous-même ou une créature consentante que vous touchez. Utilisations égales au modificateur de Charisme (minimum 1)."
  }
};

// Traductions des types de recharge
const rechargeTranslations = {
  "short_rest": "repos_court",
  "long_rest": "repos_long"
};

console.log('🌍 Traduction des Features & Abilities en français...\n');

// Récupérer les données du personnage
const character = db.prepare('SELECT data FROM character WHERE id = 1').get();
const data = JSON.parse(character.data);

// Traduire toutes les features
Object.keys(data.features).forEach(featureKey => {
  const feature = data.features[featureKey];
  const translation = featureTranslations[featureKey];

  if (translation) {
    // Appliquer les traductions
    if (translation.name) {
      console.log(`  ✓ ${feature.name} → ${translation.name}`);
      feature.name = translation.name;
    }

    if (translation.description) {
      feature.description = translation.description;
    }

    if (translation.recharge && rechargeTranslations[feature.recharge]) {
      feature.recharge = translation.recharge;
    }

    // Traduire les options si elles existent (pour Channel Divinity)
    if (translation.options && feature.options) {
      Object.keys(feature.options).forEach(optionKey => {
        const option = feature.options[optionKey];
        const optionTranslation = translation.options[optionKey];

        if (optionTranslation) {
          if (optionTranslation.name) {
            console.log(`    ↳ ${option.name} → ${optionTranslation.name}`);
            option.name = optionTranslation.name;
          }
          if (optionTranslation.description) {
            option.description = optionTranslation.description;
          }
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

console.log('\n✅ Toutes les Features & Abilities ont été traduites en français!');
console.log('📝 Base de données mise à jour avec succès.');

db.close();
