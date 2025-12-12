import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../../store/characterStore';
import { useCompanionStore, SELF_ONLY_SPELLS } from '../../store/companionStore';
import { useSocket } from '../../hooks/useSocket';
import { 
  Sparkles, 
  X, 
  ChevronUp,
  Zap,
  Loader2,
  Brain,
  Bird
} from 'lucide-react';
import { toast } from 'sonner';

// Calcul des effets à niveau supérieur pour les sorts connus
const SPELL_SCALING = {
  // Soins
  'Cure Wounds': {
    type: 'healing',
    baseDice: 1,
    dicePerLevel: 1,
    diceType: 8,
    addModifier: true,
    modifierStat: 'charisma',
    description: (level, mod) => `${level}d8 + ${mod} PV soignés`
  },
  'Healing Word': {
    type: 'healing',
    baseDice: 1,
    dicePerLevel: 1,
    diceType: 4,
    addModifier: true,
    modifierStat: 'charisma',
    description: (level, mod) => `${level}d4 + ${mod} PV soignés`
  },
  'Prayer of Healing': {
    type: 'healing',
    baseDice: 2,
    dicePerLevel: 1,
    diceType: 8,
    addModifier: true,
    modifierStat: 'charisma',
    description: (level, mod) => `${1 + level}d8 + ${mod} PV soignés (jusqu'à 6 créatures)`
  },
  // Buffs
  'Aid': {
    type: 'buff',
    baseBonus: 5,
    bonusPerLevel: 5,
    description: (level) => `+${5 + (level - 2) * 5} PV max (3 cibles)`
  },
  'Heroism': {
    type: 'buff',
    baseBonus: 5,
    description: () => `5 PV temporaires par tour (+1 cible par niveau supérieur)`
  },
  // Dégâts
  'Blinding Smite': {
    type: 'damage',
    baseDice: 3,
    dicePerLevel: 1,
    diceType: 8,
    damageType: 'radiant',
    description: (level) => `${2 + level}d8 dégâts radiants + aveuglé`
  },
  'Thunderous Smite': {
    type: 'damage',
    baseDice: 2,
    dicePerLevel: 1,
    diceType: 6,
    damageType: 'thunder',
    description: (level) => `${1 + level}d6 dégâts de tonnerre`
  },
  'Wrathful Smite': {
    type: 'damage',
    baseDice: 1,
    dicePerLevel: 1,
    diceType: 6,
    damageType: 'psychic',
    description: (level) => `${level}d6 dégâts psychiques + effrayé`
  },
  'Searing Smite': {
    type: 'damage',
    baseDice: 1,
    dicePerLevel: 1,
    diceType: 6,
    damageType: 'fire',
    description: (level) => `${level}d6 dégâts de feu + 1d6/tour`
  },
  // Command
  'Command': {
    type: 'control',
    description: (level) => `Affecte ${level} créature(s)`
  },
  // Banishment
  'Banishment': {
    type: 'control',
    description: (level) => `Affecte ${1 + (level - 4)} créature(s)`
  },
  // Revivify
  'Revivify': {
    type: 'utility',
    description: () => `Ressuscite une créature morte depuis moins d'1 minute`
  },
  // Aura of Vitality
  'Aura of Vitality': {
    type: 'healing',
    description: () => `2d6 PV soignés par action bonus (10 rounds max)`
  },
  // Guardian of Faith
  'Guardian of Faith': {
    type: 'damage',
    description: () => `20 dégâts radiants par créature (60 max)`
  }
};

export default function CastSpellDialog({ 
  spell, 
  isOpen, 
  onClose, 
  onCast,
  maxSpellLevel = 4 
}) {
  const { character, applyAid } = useCharacterStore();
  const { addBuff } = useCompanionStore();
  const { socket } = useSocket();
  const [selectedLevel, setSelectedLevel] = useState(spell?.level || 1);
  const [casting, setCasting] = useState(false);

  // Récupérer les spell slots disponibles
  const spellSlots = useMemo(() => {
    if (!character?.data?.spellcasting) return {};
    return character.data.spellcasting.spell_slots_current || {};
  }, [character]);

  const maxSlots = useMemo(() => {
    if (!character?.data?.spellcasting) return {};
    return character.data.spellcasting.spell_slots || {};
  }, [character]);

  // Calculer le modificateur de charisme
  const charismaModifier = useMemo(() => {
    if (!character?.data?.stats?.abilities) return 0;
    const cha = character.data.stats.abilities.charisma || 10;
    return Math.floor((cha - 10) / 2);
  }, [character]);

  // Niveaux disponibles pour ce sort
  const availableLevels = useMemo(() => {
    if (!spell) return [];
    const levels = [];
    for (let lvl = spell.level; lvl <= maxSpellLevel; lvl++) {
      const hasSlots = spellSlots[lvl] > 0;
      levels.push({
        level: lvl,
        hasSlots,
        current: spellSlots[lvl] || 0,
        max: maxSlots[lvl] || 0
      });
    }
    return levels;
  }, [spell, spellSlots, maxSlots, maxSpellLevel]);

  // Calculer l'effet à ce niveau
  const getEffectAtLevel = (level) => {
    if (!spell) return null;
    const scaling = SPELL_SCALING[spell.name];
    if (!scaling) {
      return { description: spell.description };
    }

    const levelDiff = level - spell.level;
    
    switch (scaling.type) {
      case 'healing': {
        const totalDice = (scaling.baseDice || 0) + (scaling.dicePerLevel || 0) * level;
        const modifier = scaling.addModifier ? charismaModifier : 0;
        return {
          type: 'healing',
          formula: `${totalDice}d${scaling.diceType}${modifier > 0 ? `+${modifier}` : ''}`,
          description: scaling.description(level, modifier)
        };
      }
      case 'damage': {
        const totalDice = (scaling.baseDice || 0) + (scaling.dicePerLevel || 0) * levelDiff;
        return {
          type: 'damage',
          formula: `${totalDice}d${scaling.diceType}`,
          damageType: scaling.damageType,
          description: scaling.description(level)
        };
      }
      case 'buff':
      case 'control':
      case 'utility':
        return {
          type: scaling.type,
          description: scaling.description(level)
        };
      default:
        return { description: spell.description };
    }
  };

  // Lancer les dés et cast
  const handleCast = async () => {
    if (!spell || spellSlots[selectedLevel] <= 0) return;
    
    setCasting(true);
    try {
      const effect = getEffectAtLevel(selectedLevel);
      let rollResult = null;
      
      // Si le sort a une formule de dés, lancer les dés
      if (effect?.formula) {
        const response = await fetch(`${window.location.origin}/api/dice/roll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formula: effect.formula,
            rollType: `${spell.name} (Niv. ${selectedLevel})`,
            details: effect.description
          })
        });
        
        if (response.ok) {
          rollResult = await response.json();
        }
      }
      
      // Vérifier si c'est un sort self-only qui affecte Quicksilver
      const affectsMount = SELF_ONLY_SPELLS.includes(spell.name);
      
      // Ajouter le buff à Quicksilver si c'est un sort partagé
      if (affectsMount) {
        addBuff(spell.name, selectedLevel);
      }
      
      // Appliquer l'effet d'Aid sur Thalric aussi
      if (spell.name === 'Aid') {
        const hpBonus = await applyAid(selectedLevel);
        if (hpBonus > 0) {
          toast.success(`🛡️ Aid: +${hpBonus} PV max pour Thalric`);
        }
      }
      
      // Émettre l'événement spell_cast pour le Combat Log
      socket?.emit('spell_cast', {
        spell: spell.name,
        level: selectedLevel,
        baseLevel: spell.level,
        effect: effect?.description || spell.description,
        affectsQuicksilver: affectsMount,
        rollResult: rollResult ? {
          total: rollResult.total,
          rolls: rollResult.rolls,
          modifier: rollResult.modifier,
          formula: effect.formula,
          type: effect.type
        } : null
      });
      
      // Notification pour Quicksilver si c'est un sort self-only
      if (affectsMount) {
        toast.success(`Quicksilver bénéficie aussi de ${spell.name}!`, {
          icon: <Bird className="w-4 h-4 text-amber-400" />,
          description: 'Find Greater Steed - Sort partagé',
          duration: 4000
        });
      }
      
      // Cast le sort (consume le slot)
      await onCast({
        ...spell,
        castLevel: selectedLevel
      });
      
      onClose();
    } catch (error) {
      console.error('Error casting spell:', error);
    } finally {
      setCasting(false);
    }
  };

  if (!isOpen || !spell) return null;

  const isConcentration = spell.duration?.toLowerCase().includes('concentration');
  const currentEffect = getEffectAtLevel(selectedLevel);
  const affectsQuicksilver = SELF_ONLY_SPELLS.includes(spell.name);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-surface border-2 border-gold-primary rounded-xl max-w-md w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-gold-primary p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {isConcentration ? (
                  <Brain className="w-6 h-6 text-purple-400" />
                ) : (
                  <Sparkles className="w-6 h-6 text-gold-primary" />
                )}
                <div>
                  <h2 className="text-xl font-bold text-white">{spell.name}</h2>
                  <p className="text-sm text-gray-400">Sort de niveau {spell.level}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Sélection du niveau */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Lancer à quel niveau ?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {availableLevels.map(({ level, hasSlots, current, max }) => (
                  <button
                    key={level}
                    onClick={() => hasSlots && setSelectedLevel(level)}
                    disabled={!hasSlots}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      selectedLevel === level
                        ? 'border-gold-primary bg-gold-primary/20 text-gold-primary'
                        : hasSlots
                        ? 'border-dark-border hover:border-gray-500 text-white'
                        : 'border-dark-border/50 text-gray-600 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div className="text-lg font-bold">Niv. {level}</div>
                    <div className="text-xs mt-1">
                      {current}/{max} slots
                    </div>
                    {level > spell.level && hasSlots && (
                      <ChevronUp className="absolute top-1 right-1 w-3 h-3 text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Effet à ce niveau */}
            <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">
                  Effet au niveau {selectedLevel}
                </span>
              </div>
              <p className="text-gray-300 text-sm">
                {currentEffect?.description || spell.description}
              </p>
              {currentEffect?.formula && (
                <div className="mt-2 text-xs text-gray-500">
                  Formule: <span className="text-gold-dim font-mono">{currentEffect.formula}</span>
                </div>
              )}
            </div>

            {/* Warning si upcast */}
            {selectedLevel > spell.level && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex items-center gap-2">
                <ChevronUp className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300">
                  Incantation à niveau supérieur (+{selectedLevel - spell.level})
                </span>
              </div>
            )}

            {/* Find Greater Steed - Sort partagé avec Quicksilver */}
            {affectsQuicksilver && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Bird className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-300 block">
                    Find Greater Steed
                  </span>
                  <span className="text-xs text-amber-200/80">
                    Quicksilver bénéficiera aussi de ce sort!
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-dark-border p-4 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCast}
              disabled={casting || spellSlots[selectedLevel] <= 0}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isConcentration
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                  : 'bg-gradient-to-r from-gold-primary to-yellow-600 hover:from-yellow-500 hover:to-yellow-500'
              }`}
            >
              {casting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Incantation...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Lancer (Niv. {selectedLevel})
                </>
              )}
            </motion.button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
