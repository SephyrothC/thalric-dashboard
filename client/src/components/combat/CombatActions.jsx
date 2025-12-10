import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useDice } from '../../hooks/useDice';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Sparkles, 
  Zap, 
  Target, 
  Wand2,
  Shield,
  Flame,
  Brain,
  AlertTriangle
} from 'lucide-react';
import ChannelDivinityDialog from './ChannelDivinityDialog';
import DivineSmiteDialog from './DivineSmiteDialog';
import HealingHandsDialog from './HealingHandsDialog';
import CastSpellDialog from '../spells/CastSpellDialog';
import ConcentrationWarningDialog from '../spells/ConcentrationWarningDialog';

export default function CombatActions() {
  const [activeTab, setActiveTab] = useState('attacks');
  const [isChannelDivinityOpen, setChannelDivinityOpen] = useState(false);
  const [isHealingHandsOpen, setHealingHandsOpen] = useState(false);
  const [smiteWeaponId, setSmiteWeaponId] = useState(null);
  const [selectedSpell, setSelectedSpell] = useState(null);
  const [showCastDialog, setShowCastDialog] = useState(false);
  const [showConcentrationWarning, setShowConcentrationWarning] = useState(false);
  const { character, useFeature, castSpell, fetchCharacter } = useCharacterStore();
  const { rollAttack, rollDamage, rolling } = useDice();
  
  const weapons = character?.data?.weapons || {};
  const features = character?.data?.features || {};
  const spells = character?.data?.spells || {};
  const spellSlots = character?.data?.spell_slots || {};
  const currentConcentration = character?.concentration_spell;

  const activeFeatures = Object.entries(features).filter(([_, f]) => 
    f.activation_type !== 'passive' && 
    (f.uses !== undefined || f.pool !== undefined || f.action_type !== undefined || f.recharge !== undefined)
  );

  const spellsByLevel = Object.entries(spells).reduce((acc, [levelKey, levelSpells]) => {
    let level = 0;
    if (levelKey === 'cantrips') level = 0;
    else if (levelKey.startsWith('level_')) level = parseInt(levelKey.replace('level_', ''));
    
    if (!acc[level]) acc[level] = [];
    
    Object.values(levelSpells).forEach(spell => {
      acc[level].push({ ...spell, level });
    });
    
    return acc;
  }, {});

  const handleCastSpell = (spell) => {
    const isConcentration = spell.duration?.toLowerCase().includes('concentration');
    
    // Check if already concentrating on another spell
    if (isConcentration && currentConcentration) {
      setSelectedSpell(spell);
      setShowConcentrationWarning(true);
    } else {
      setSelectedSpell(spell);
      setShowCastDialog(true);
    }
  };

  const handleConcentrationConfirm = () => {
    setShowConcentrationWarning(false);
    toast.warning(`Concentration sur ${currentConcentration} brisée!`, {
      icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />
    });
    setShowCastDialog(true);
  };

  const handleConcentrationCancel = () => {
    setShowConcentrationWarning(false);
    setSelectedSpell(null);
  };

  const executeCast = async (spellWithLevel) => {
    try {
      const isConcentration = spellWithLevel.duration?.toLowerCase().includes('concentration');
      
      await castSpell({
        ...spellWithLevel,
        concentration: isConcentration
      });
      
      if (isConcentration) {
        toast.info(`Concentration: ${spellWithLevel.name}`, {
          icon: <Brain className="w-4 h-4 text-purple-400" />
        });
      } else {
        toast.success(`${spellWithLevel.name} lancé!`, {
          description: `Emplacement de sort niveau ${spellWithLevel.castLevel} consommé`,
          icon: <Wand2 className="w-4 h-4" />
        });
      }
      
      await fetchCharacter();
    } catch (error) {
      console.error('Cast failed:', error);
      toast.error('Échec du lancement du sort');
    }
  };

  const handleUseFeature = async (id, feature) => {
    if (id === 'channel_divinity') {
      setChannelDivinityOpen(true);
    } else if (id === 'healing_hands') {
      setHealingHandsOpen(true);
    } else {
      await useFeature(id, { name: feature.name, duration: feature.duration });
      toast.success(`${feature.name} activated!`, {
        icon: <Zap className="w-4 h-4" />
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface rounded-xl border border-dark-border shadow-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <TabButton 
          active={activeTab === 'attacks'} 
          onClick={() => setActiveTab('attacks')} 
          icon={<Sword className="w-4 h-4" />} 
          label="Attacks" 
        />
        <TabButton 
          active={activeTab === 'spells'} 
          onClick={() => setActiveTab('spells')} 
          icon={<Sparkles className="w-4 h-4" />} 
          label="Spells" 
        />
        <TabButton 
          active={activeTab === 'features'} 
          onClick={() => setActiveTab('features')} 
          icon={<Zap className="w-4 h-4" />} 
          label="Features" 
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* ATTACKS TAB */}
          {activeTab === 'attacks' && (
            <motion.div
              key="attacks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {Object.entries(weapons).map(([id, weapon]) => (
                <motion.div 
                  key={id} 
                  whileHover={{ scale: 1.01 }}
                  className="group bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-red-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2">
                      <Sword className="w-4 h-4 text-red-400 mt-1" />
                      <div>
                        <h4 className="font-bold text-white group-hover:text-red-400 transition-colors">{weapon.name}</h4>
                        <div className="text-xs text-gray-400">{weapon.damage_type} • {weapon.range || 'Melee'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gold-primary">+{weapon.attack_bonus}</div>
                      <div className="text-xs text-gray-500">to hit</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => rollAttack(id)}
                      disabled={rolling}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2 rounded shadow-lg transition-all"
                    >
                      <Target className="w-4 h-4" />
                      Attack
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => rollDamage(id)}
                      disabled={rolling}
                      className="flex-1 flex items-center justify-center gap-2 bg-dark-surface hover:bg-dark-hover border border-dark-border text-gray-300 text-sm font-bold py-2 rounded transition-all"
                    >
                      <Flame className="w-4 h-4" />
                      {weapon.damage}
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSmiteWeaponId(id)}
                      disabled={rolling}
                      className="px-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black text-sm font-bold rounded shadow-lg transition-all"
                      title="Divine Smite"
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* SPELLS TAB */}
          {activeTab === 'spells' && (
            <motion.div
              key="spells"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {Object.entries(spellsByLevel).map(([level, levelSpells]) => (
                <div key={level}>
                  <div className="flex items-center justify-between mb-2 sticky top-0 bg-dark-surface py-2 z-10">
                    <h4 className="font-bold text-gold-secondary text-sm uppercase tracking-wider flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      {level === '0' ? 'Cantrips' : `Level ${level}`}
                    </h4>
                    {level !== '0' && spellSlots[level] && (
                      <div className="flex gap-1">
                        {Array.from({ length: spellSlots[level].max }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-3 h-3 rounded-full border border-indigo-500 transition-all ${
                              i < spellSlots[level].current 
                                ? 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]' 
                                : 'bg-dark-bg opacity-30'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {levelSpells.map((spell, idx) => (
                      <motion.div 
                        key={idx} 
                        whileHover={{ scale: 1.01 }}
                        className="bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-indigo-500/50 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5" />
                            <div>
                              <h5 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{spell.name}</h5>
                              <p className="text-xs text-gray-400">{spell.casting_time} • {spell.range}</p>
                            </div>
                          </div>
                          {level !== '0' && (
                            <motion.button 
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCastSpell(spell)}
                              className="px-3 py-1 bg-dark-surface hover:bg-indigo-600 hover:text-white text-indigo-400 border border-indigo-500/30 rounded text-xs font-bold transition-all"
                            >
                              Cast
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* FEATURES TAB */}
          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {activeFeatures.map(([id, feature]) => (
                <motion.div 
                  key={id} 
                  whileHover={{ scale: 1.01 }}
                  className="bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-gold-primary/50 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold-primary" />
                      <h4 className="font-bold text-gold-secondary">{feature.name}</h4>
                    </div>
                    {(feature.uses !== undefined || feature.pool !== undefined) && (
                      <span className="text-xs bg-dark-surface px-2 py-1 rounded text-gray-300 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {feature.uses ?? feature.pool} / {feature.uses_max ?? feature.pool_max}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 ml-6">{feature.description}</p>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUseFeature(id, feature)}
                    className="w-full mt-2 bg-dark-surface hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/30 text-xs font-bold py-1.5 rounded transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3 h-3" />
                    Use Feature
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ChannelDivinityDialog 
        isOpen={isChannelDivinityOpen} 
        onClose={() => setChannelDivinityOpen(false)} 
      />

      <DivineSmiteDialog 
        isOpen={!!smiteWeaponId} 
        onClose={() => setSmiteWeaponId(null)} 
        weaponId={smiteWeaponId}
      />

      <HealingHandsDialog 
        isOpen={isHealingHandsOpen} 
        onClose={() => setHealingHandsOpen(false)} 
      />

      {/* Cast Spell Level Selection Dialog */}
      <CastSpellDialog
        spell={selectedSpell}
        isOpen={showCastDialog}
        onClose={() => {
          setShowCastDialog(false);
          setSelectedSpell(null);
        }}
        onCast={async (spellWithLevel) => {
          setShowCastDialog(false);
          await executeCast(spellWithLevel);
          setSelectedSpell(null);
        }}
        maxSpellLevel={4}
      />

      {/* Concentration Warning Dialog */}
      <ConcentrationWarningDialog
        isOpen={showConcentrationWarning}
        currentSpell={currentConcentration}
        newSpell={selectedSpell?.name}
        onConfirm={handleConcentrationConfirm}
        onCancel={handleConcentrationCancel}
        onClose={handleConcentrationCancel}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
        active 
          ? 'text-white bg-dark-surface' 
          : 'text-gray-500 bg-dark-bg hover:bg-dark-hover hover:text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
        />
      )}
    </button>
  );
}
