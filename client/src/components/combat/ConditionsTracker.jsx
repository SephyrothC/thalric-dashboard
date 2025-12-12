import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useCharacterStore } from '../../store/characterStore';
import { useCompanionStore } from '../../store/companionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  EyeOff, 
  Heart, 
  VolumeX, 
  AlertTriangle, 
  Grip, 
  Moon, 
  Ghost, 
  Snowflake, 
  Mountain, 
  Skull, 
  BedDouble, 
  Link2, 
  Sparkles as SparklesIcon, 
  X,
  Plus,
  Zap,
  Bird
} from 'lucide-react';

const CONDITIONS_LIST = [
  { name: 'Blinded', icon: EyeOff, color: '#757575' },
  { name: 'Charmed', icon: Heart, color: '#e91e63', immune: true },
  { name: 'Deafened', icon: VolumeX, color: '#9e9e9e' },
  { name: 'Frightened', icon: AlertTriangle, color: '#ff9800', immune: true },
  { name: 'Grappled', icon: Grip, color: '#795548' },
  { name: 'Incapacitated', icon: Moon, color: '#607d8b' },
  { name: 'Invisible', icon: Ghost, color: '#9c27b0' },
  { name: 'Paralyzed', icon: Snowflake, color: '#00bcd4' },
  { name: 'Petrified', icon: Mountain, color: '#9e9e9e' },
  { name: 'Poisoned', icon: Skull, color: '#4caf50' },
  { name: 'Prone', icon: BedDouble, color: '#8d6e63' },
  { name: 'Restrained', icon: Link2, color: '#607d8b' },
  { name: 'Stunned', icon: Zap, color: '#ffeb3b' },
  { name: 'Unconscious', icon: Moon, color: '#f44336' },
];

export default function ConditionsTracker() {
  const [conditions, setConditions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState(1);
  const { socket } = useSocket();
  
  // Get Aid bonus from character store and companion buffs
  const { aidBonus, removeAid, resetHpToBase, character } = useCharacterStore();
  const { activeBuffs, removeBuff, clearAllBuffs } = useCompanionStore();
  
  // Check if HP max is higher than expected (stuck Aid bonus)
  const currentMaxHp = character?.data?.stats?.hp_max || 124;
  const expectedMaxHp = 124 + aidBonus;
  const hasStuckBonus = currentMaxHp > expectedMaxHp;

  useEffect(() => {
    loadConditions();
    if (!socket) return;
    socket.on('condition_added', loadConditions);
    socket.on('condition_removed', loadConditions);
    socket.on('turn_advanced', loadConditions);
    
    // Listen for concentration ending to remove shared buffs from Quicksilver
    socket.on('concentration_ended', (data) => {
      if (data?.spell) {
        const buffExists = activeBuffs.find(b => b.name === data.spell);
        if (buffExists) {
          removeBuff(data.spell);
          toast.info(`✨ ${data.spell} terminé pour Quicksilver`);
        }
      }
    });
    
    return () => {
      socket.off('condition_added');
      socket.off('condition_removed');
      socket.off('turn_advanced');
      socket.off('concentration_ended');
    };
  }, [socket, activeBuffs, removeBuff]);

  const loadConditions = async () => {
    try {
      const response = await fetch('/api/combat/conditions');
      const data = await response.json();
      setConditions(data);
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }
  };

  const toggleCondition = async (conditionName, duration = 10) => {
    try {
      await fetch('/api/combat/conditions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: conditionName, 
          duration_type: 'rounds', 
          duration_value: parseInt(duration) 
        })
      });
      setIsAdding(false);
      setCustomName('');
    } catch (error) {
      console.error('Failed to toggle condition:', error);
    }
  };

  // Handle removing spell buffs (like Aid)
  const handleRemoveSpellBuff = async (buffName) => {
    if (buffName === 'Aid') {
      // Remove Aid from both Thalric and Quicksilver
      const removedBonus = await removeAid();
      removeBuff('Aid');
      if (removedBonus > 0) {
        toast.success(`🛡️ Aid terminé`, {
          description: `-${removedBonus} HP max pour Thalric et Quicksilver`
        });
      }
    } else {
      // Just remove from Quicksilver
      removeBuff(buffName);
      toast.success(`✨ ${buffName} terminé pour Quicksilver`);
    }
  };

  // Merge standard and custom conditions for display
  const allActiveConditions = conditions.filter(c => c.active).map(c => {
    const standard = CONDITIONS_LIST.find(s => s.name === c.name);
    return {
      ...c,
      Icon: standard ? standard.icon : SparklesIcon,
      color: standard ? standard.color : '#2196f3',
      displayName: c.name
    };
  });

  return (
    <div className="space-y-2">
      {/* Warning: Stuck HP bonus */}
      {hasStuckBonus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500 rounded text-xs"
        >
          <span className="text-amber-400">
            ⚠️ HP max bloqués à {currentMaxHp} (base: 124)
          </span>
          <button
            onClick={async () => {
              await resetHpToBase();
              clearAllBuffs();
              toast.success('HP réinitialisés à 124');
            }}
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-bold transition-colors"
          >
            Reset
          </button>
        </motion.div>
      )}
      
      {/* Active Spell Buffs (Aid, etc.) */}
      {(aidBonus > 0 || activeBuffs.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-2">
          <AnimatePresence mode="popLayout">
            {/* Aid buff for Thalric */}
            {aidBonus > 0 && (
              <motion.div
                key="aid-thalric"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border border-red-500 rounded text-xs font-bold text-white"
                title="Cliquer pour terminer le sort"
              >
                <Heart className="w-3 h-3 text-red-500" />
                <span>Aid</span>
                <span className="text-[10px] text-red-400 bg-dark-surface px-1 rounded">
                  +{aidBonus} HP
                </span>
                <button
                  className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
                  onClick={() => handleRemoveSpellBuff('Aid')}
                  title="Terminer le sort"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
            
            {/* Other Quicksilver buffs (that don't have Thalric equivalent) */}
            {activeBuffs.filter(b => b.name !== 'Aid').map(buff => (
              <motion.div
                key={`qs-${buff.name}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border border-blue-500 rounded text-xs font-bold text-white"
                title={`${buff.effect.description} (Quicksilver)`}
              >
                <Bird className="w-3 h-3 text-blue-400" />
                <span>{buff.name}</span>
                <span className="text-[10px] text-blue-400 bg-dark-surface px-1 rounded">
                  QS
                </span>
                <button
                  className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
                  onClick={() => handleRemoveSpellBuff(buff.name)}
                  title="Terminer le sort"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Active Conditions List */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {allActiveConditions.map(c => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border rounded text-xs font-bold text-white"
              style={{ borderColor: c.color }}
              title={`${c.rounds_left} rounds remaining`}
            >
              <c.Icon className="w-3 h-3" style={{ color: c.color }} />
              <span>{c.displayName}</span>
              {c.duration_type === 'rounds' && (
                <span className="text-[10px] text-gray-400 bg-dark-surface px-1 rounded">
                  {c.rounds_left}r
                </span>
              )}
              <button
                className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
                onClick={() => toggleCondition(c.name)}
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {allActiveConditions.length === 0 && aidBonus === 0 && activeBuffs.length === 0 && (
          <div className="text-[10px] text-gray-500 italic py-0.5">No active conditions</div>
        )}
      </div>

      {/* Add Button */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setIsAdding(!isAdding)}
          className="w-full py-0.5 text-[10px] font-bold text-gold-dim hover:text-gold-primary border border-dashed border-dark-border hover:border-gold-dim/50 rounded transition-all flex items-center justify-center gap-1"
        >
          {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {isAdding ? 'Close' : 'Add Effect / Condition'}
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-2"
            >
              
              {/* Custom Effect Input */}
              <div className="mb-2 pb-2 border-b border-dark-border">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Custom Effect / Spell</div>
                <div className="flex gap-1 mb-1">
                  <input 
                    type="text" 
                    placeholder="Name (e.g. Bless)" 
                    className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:border-gold-primary outline-none"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Rounds" 
                    className="w-12 bg-dark-bg border border-dark-border rounded px-1 py-1 text-xs text-white focus:border-gold-primary outline-none text-center"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => toggleCondition(customName, customDuration)}
                  disabled={!customName}
                  className="w-full bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/30 rounded py-1 text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Custom Effect
                </button>
              </div>

              {/* Standard Conditions */}
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Standard Conditions</div>
              {CONDITIONS_LIST.map(c => {
                const active = conditions.some(ac => ac.name === c.name && ac.active);
                if (active) return null;
                const IconComp = c.icon;
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleCondition(c.name, 10)}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-dark-hover hover:text-white rounded flex items-center gap-2"
                    disabled={c.immune}
                  >
                    <IconComp className="w-4 h-4" style={{ color: c.color }} />
                    <span className={c.immune ? 'line-through opacity-50' : ''}>{c.name}</span>
                    {c.immune && <span className="ml-auto text-[10px] text-gold-dim">IMMUNE</span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
