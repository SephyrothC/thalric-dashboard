import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Définition des effets des sorts partagés via Find Greater Steed
const SHARED_SPELL_EFFECTS = {
  'Shield of Faith': {
    acBonus: 2,
    description: '+2 CA',
    icon: '🛡️',
    type: 'concentration'
  },
  'Aid': {
    hpMaxBonus: 5, // Base level 2, +5 per level above 2 added in the code
    description: '+5 HP max (niveau 2)',
    icon: '❤️',
    type: 'duration',
    scaling: (level) => ({ hpMaxBonus: 5 + (level - 2) * 5, description: `+${5 + (level - 2) * 5} HP max` })
  },
  'Protection from Evil and Good': {
    condition: 'protection_evil_good',
    description: 'Protection contre aberrations, célestes, élémentaires, fées, fiélons, morts-vivants',
    icon: '✨',
    type: 'concentration'
  },
  'Heroism': {
    tempHpPerTurn: 5, // CHA mod de Thalric
    description: '5 HP temp/tour, immunité effrayé',
    icon: '⚔️',
    type: 'concentration'
  },
  'Bless': {
    attackBonus: '1d4',
    saveBonus: '1d4',
    description: '+1d4 attaques et sauvegardes',
    icon: '🙏',
    type: 'concentration'
  },
  'Warding Bond': {
    acBonus: 1,
    saveBonus: 1,
    resistanceAll: true,
    description: '+1 CA, +1 sauvegardes, résistance à tous les dégâts',
    icon: '🔗',
    type: 'duration'
  },
  'Aura of Vitality': {
    healingAura: true,
    description: '2d6 PV soignés par action bonus',
    icon: '💚',
    type: 'concentration'
  },
  'Crusader\'s Mantle': {
    extraDamage: '1d4 radiant',
    description: '+1d4 dégâts radiants aux attaques',
    icon: '⚡',
    type: 'concentration'
  },
  'Death Ward': {
    deathWard: true,
    description: 'Revient à 1 HP au lieu de tomber à 0 (1 fois)',
    icon: '💀',
    type: 'duration'
  },
  'Haste': {
    acBonus: 2,
    speedMultiplier: 2,
    extraAction: true,
    advantageDex: true,
    description: '+2 CA, vitesse x2, action supplémentaire',
    icon: '⚡',
    type: 'concentration'
  },
  'Freedom of Movement': {
    freedomOfMovement: true,
    description: 'Immunité aux entraves, mouvements non-réduits',
    icon: '🏃',
    type: 'duration'
  }
};

// Liste des sorts self-only qui peuvent être partagés
export const SELF_ONLY_SPELLS = Object.keys(SHARED_SPELL_EFFECTS);

// Données de base de Quicksilver
const BASE_COMPANION_DATA = {
  name: 'Quicksilver',
  type: 'Griffon',
  creatureType: 'Grande Créature monstrueuse',
  alignment: 'Céleste (Find Greater Steed)',
  hp_max: 59,
  hp_current: 59,
  temp_hp: 0,
  ac: 18, // Half Plate +1 (15 + 2 DEX + 1 magic) pour Griffon
  armor: {
    name: 'Griffon Half Plate +1',
    baseAC: 15,
    dexBonus: 2, // Max DEX bonus for half plate
    magicBonus: 1,
    description: 'Armure de demi-plate magique adaptée pour griffon'
  },
  speed: {
    walk: 30,
    fly: 80
  },
  stats: {
    strength: 18,
    dexterity: 15,
    constitution: 16,
    intelligence: 6,
    wisdom: 13,
    charisma: 8
  },
  senses: {
    darkvision: 60,
    passive_perception: 15
  },
  attacks: [
    {
      id: 'beak',
      name: 'Bec',
      attackBonus: 6,
      damage: '1d8+4',
      damageType: 'perforant',
      description: 'Attaque de mêlée'
    },
    {
      id: 'claws',
      name: 'Griffes',
      attackBonus: 6,
      damage: '2d6+4',
      damageType: 'tranchant',
      description: 'Attaque de mêlée'
    }
  ],
  abilities: [
    {
      name: 'Attaques multiples',
      description: 'Le griffon fait deux attaques : une avec son bec et une avec ses griffes.'
    },
    {
      name: 'Vision dans le noir',
      description: 'Le griffon peut voir dans l\'obscurité jusqu\'à 18 mètres (60 ft).'
    },
    {
      name: 'Monture céleste',
      description: 'Invoqué par Find Greater Steed. Intelligence de 6 minimum. Comprend le Commun et le Céleste.'
    },
    {
      name: 'Lien télépathique',
      description: 'Peut communiquer télépathiquement avec Thalric tant qu\'ils sont sur le même plan.'
    }
  ]
};

export const useCompanionStore = create(
  persist(
    (set, get) => ({
      // État de base
      companion: { ...BASE_COMPANION_DATA },
      activeBuffs: [], // Liste des buffs actifs: { name, effect, castLevel, startTime }
      
      // Getters pour les stats calculées avec les buffs
      getEffectiveAC: () => {
        const { companion, activeBuffs } = get();
        let ac = companion.ac;
        
        activeBuffs.forEach(buff => {
          if (buff.effect.acBonus) {
            ac += buff.effect.acBonus;
          }
        });
        
        return ac;
      },
      
      getEffectiveMaxHP: () => {
        const { companion, activeBuffs } = get();
        let maxHP = 59; // Base HP
        
        activeBuffs.forEach(buff => {
          if (buff.effect.hpMaxBonus) {
            maxHP += buff.effect.hpMaxBonus;
          }
        });
        
        return maxHP;
      },
      
      getEffectiveSpeed: () => {
        const { companion, activeBuffs } = get();
        let speed = { ...companion.speed };
        
        activeBuffs.forEach(buff => {
          if (buff.effect.speedMultiplier) {
            speed.walk *= buff.effect.speedMultiplier;
            speed.fly *= buff.effect.speedMultiplier;
          }
        });
        
        return speed;
      },
      
      getAttackBonuses: () => {
        const { activeBuffs } = get();
        const bonuses = [];
        
        activeBuffs.forEach(buff => {
          if (buff.effect.attackBonus) {
            bonuses.push({ name: buff.name, bonus: buff.effect.attackBonus });
          }
          if (buff.effect.extraDamage) {
            bonuses.push({ name: buff.name, damage: buff.effect.extraDamage });
          }
        });
        
        return bonuses;
      },
      
      // Ajouter un buff partagé
      addBuff: (spellName, castLevel = null) => {
        const effectDef = SHARED_SPELL_EFFECTS[spellName];
        if (!effectDef) return false;
        
        // Calculer l'effet avec scaling si applicable
        let effect = { ...effectDef };
        if (effectDef.scaling && castLevel) {
          const scaled = effectDef.scaling(castLevel);
          effect = { ...effect, ...scaled };
        }
        
        set(state => {
          // Vérifier si le buff existe déjà
          const exists = state.activeBuffs.find(b => b.name === spellName);
          if (exists) {
            // Mettre à jour le buff existant
            return {
              activeBuffs: state.activeBuffs.map(b => 
                b.name === spellName 
                  ? { ...b, effect, castLevel, startTime: Date.now() }
                  : b
              )
            };
          }
          
          // Ajouter le nouveau buff
          const newBuffs = [...state.activeBuffs, {
            name: spellName,
            effect,
            castLevel,
            startTime: Date.now()
          }];
          
          // Si Aid est ajouté, ajuster les HP actuels aussi
          if (effect.hpMaxBonus) {
            const newMaxHP = 59 + effect.hpMaxBonus;
            const hpIncrease = effect.hpMaxBonus;
            return {
              activeBuffs: newBuffs,
              companion: {
                ...state.companion,
                hp_current: Math.min(state.companion.hp_current + hpIncrease, newMaxHP),
                hp_max: newMaxHP
              }
            };
          }
          
          return { activeBuffs: newBuffs };
        });
        
        return true;
      },
      
      // Retirer un buff
      removeBuff: (spellName) => {
        const { companion, activeBuffs } = get();
        const buff = activeBuffs.find(b => b.name === spellName);
        
        if (!buff) return;
        
        set(state => {
          const newBuffs = state.activeBuffs.filter(b => b.name !== spellName);
          
          // Si c'était Aid, réajuster les HP
          if (buff.effect.hpMaxBonus) {
            const newMaxHP = 59;
            return {
              activeBuffs: newBuffs,
              companion: {
                ...state.companion,
                hp_current: Math.min(state.companion.hp_current, newMaxHP),
                hp_max: newMaxHP
              }
            };
          }
          
          return { activeBuffs: newBuffs };
        });
      },
      
      // Retirer tous les buffs (long rest ou dismiss)
      clearAllBuffs: () => {
        set(state => ({
          activeBuffs: [],
          companion: {
            ...state.companion,
            hp_max: 59,
            hp_current: Math.min(state.companion.hp_current, 59)
          }
        }));
      },
      
      // HP Management
      heal: (amount) => {
        set(state => {
          const maxHP = get().getEffectiveMaxHP();
          const newHP = Math.min(maxHP, state.companion.hp_current + amount);
          return {
            companion: { ...state.companion, hp_current: newHP }
          };
        });
      },
      
      damage: (amount) => {
        set(state => {
          let remainingDamage = amount;
          let newTempHP = state.companion.temp_hp;
          
          // Temp HP absorbs first
          if (newTempHP > 0) {
            if (amount <= newTempHP) {
              newTempHP -= amount;
              remainingDamage = 0;
            } else {
              remainingDamage = amount - newTempHP;
              newTempHP = 0;
            }
          }
          
          const newHP = Math.max(0, state.companion.hp_current - remainingDamage);
          
          return {
            companion: { 
              ...state.companion, 
              hp_current: newHP,
              temp_hp: newTempHP
            }
          };
        });
      },
      
      setTempHP: (amount) => {
        set(state => ({
          companion: { 
            ...state.companion, 
            temp_hp: Math.max(state.companion.temp_hp, amount)
          }
        }));
      },
      
      fullHeal: () => {
        set(state => ({
          companion: {
            ...state.companion,
            hp_current: get().getEffectiveMaxHP(),
            temp_hp: 0
          }
        }));
      },
      
      // Reset complet (re-summon)
      resetCompanion: () => {
        set({
          companion: { ...BASE_COMPANION_DATA },
          activeBuffs: []
        });
      }
    }),
    {
      name: 'companion-storage',
      version: 2, // Increment this when BASE_COMPANION_DATA changes
      partialize: (state) => ({
        companion: state.companion,
        activeBuffs: state.activeBuffs
      }),
      // Migration to update old persisted data with new base values
      migrate: (persistedState, version) => {
        if (version < 2) {
          // Update AC and armor from BASE_COMPANION_DATA
          return {
            ...persistedState,
            companion: {
              ...persistedState.companion,
              ac: BASE_COMPANION_DATA.ac,
              armor: BASE_COMPANION_DATA.armor
            }
          };
        }
        return persistedState;
      }
    }
  )
);

export { SHARED_SPELL_EFFECTS };
