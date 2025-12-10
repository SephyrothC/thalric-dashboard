import { useCharacterStore } from '../../store/characterStore';
import { useDice } from '../../hooks/useDice';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Footprints, 
  Dices, 
  Brain,
  HeartCrack
} from 'lucide-react';
import AnimatedHealthBar from '../ui/AnimatedHealthBar';

export default function CombatVitals() {
  const { character, updateHP, fetchCharacter } = useCharacterStore();
  const { rollDice, rolling } = useDice();
  const stats = character?.data?.stats || {};
  const saves = character?.data?.saving_throws || {};

  // Quick handlers
  const handleHeal = () => {
    const amount = prompt("Heal amount:");
    if (amount) {
      const healAmount = parseInt(amount);
      updateHP(Math.min(stats.hp_max, stats.hp_current + healAmount), stats.temp_hp);
      toast.success(`Healed ${healAmount} HP!`, {
        icon: <span className="text-green-400">+{healAmount}</span>
      });
    }
  };

  const handleTempHPChange = (newTempHP) => {
    updateHP(stats.hp_current, newTempHP);
    toast.info(`Temp HP set to ${newTempHP}`, {
      icon: <Shield className="w-4 h-4 text-blue-400" />
    });
  };

  const handleDamage = async () => {
    const amount = prompt("Damage amount:");
    if (!amount) return;
    
    const dmg = parseInt(amount);
    const currentTempHP = stats.temp_hp || 0;
    
    // Temp HP absorbs damage first
    let remainingDamage = dmg;
    let newTempHP = currentTempHP;
    let newHP = stats.hp_current;
    
    if (currentTempHP > 0) {
      if (dmg <= currentTempHP) {
        // Temp HP absorbs all damage
        newTempHP = currentTempHP - dmg;
        remainingDamage = 0;
      } else {
        // Temp HP absorbed, remaining damage goes to HP
        remainingDamage = dmg - currentTempHP;
        newTempHP = 0;
      }
    }
    
    // Apply remaining damage to HP
    newHP = Math.max(0, stats.hp_current - remainingDamage);
    
    updateHP(newHP, newTempHP);
    
    // Show appropriate toast
    if (currentTempHP > 0 && dmg > 0) {
      const tempAbsorbed = Math.min(currentTempHP, dmg);
      if (remainingDamage > 0) {
        toast.error(`Took ${dmg} damage! (${tempAbsorbed} absorbed by Temp HP, ${remainingDamage} to HP)`, {
          icon: <HeartCrack className="w-4 h-4 text-red-400" />
        });
      } else {
        toast.warning(`Temp HP absorbed ${tempAbsorbed} damage!`, {
          icon: <Shield className="w-4 h-4 text-blue-400" />
        });
      }
    } else {
      toast.error(`Took ${dmg} damage!`, {
        icon: <HeartCrack className="w-4 h-4 text-red-400" />
      });
    }
    
    // Auto concentration save check
    const concentration_spell = character?.concentration_spell;
    if (concentration_spell && dmg > 0) {
      const dc = Math.max(10, Math.floor(dmg / 2));
      const conSave = saves.constitution || 0;
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + conSave;
      const success = total >= dc;
      
      if (success) {
        toast.success(`Concentration maintained!`, {
          description: `Rolled ${roll}+${conSave}=${total} vs DC${dc}`,
          icon: <Brain className="w-4 h-4 text-purple-400" />
        });
      } else {
        toast.error(`Concentration broken!`, {
          description: `Rolled ${roll}+${conSave}=${total} vs DC${dc}`,
          icon: <HeartCrack className="w-4 h-4 text-red-400" />
        });
        
        try {
          await fetch('/api/combat/concentration/end', { method: 'DELETE' });
          await fetch(`/api/combat/conditions/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: concentration_spell })
          });
          await fetchCharacter();
        } catch (error) {
          console.error('Failed to end concentration:', error);
        }
      }
    }
  };

  const handleSaveRoll = (stat, mod) => {
    let formula = `1d20${mod >= 0 ? '+' : ''}${mod}`;
    let details = `${stat.charAt(0).toUpperCase() + stat.slice(1)} Save`;

    const activeConditions = character?.data?.active_conditions || [];
    
    if (activeConditions.includes('Bless')) {
      formula += '+1d4';
      details += ' + Bless';
    }
    
    if (activeConditions.includes('Bane')) {
      formula += '-1d4';
      details += ' - Bane';
    }

    rollDice(formula, 'Saving Throw', details);
  };

  const handleInitiativeRoll = async () => {
    const dexMod = Math.floor((stats.dexterity - 10) / 2);
    
    // Sentinel Shield gives advantage on initiative rolls
    // Roll 2d20 and take the highest
    const roll1 = Math.floor(Math.random() * 20) + 1;
    const roll2 = Math.floor(Math.random() * 20) + 1;
    const bestRoll = Math.max(roll1, roll2);
    const total = bestRoll + dexMod;
    
    // Show both rolls in the toast
    const rollDetails = `Initiative (Advantage): [${roll1}, ${roll2}] → ${bestRoll} + ${dexMod >= 0 ? '+' : ''}${dexMod} = ${total}`;
    
    toast.success(`🎯 Initiative: ${total}`, {
      description: `Rolls: ${roll1} & ${roll2} (best: ${bestRoll}) + DEX ${dexMod >= 0 ? '+' : ''}${dexMod}`,
      duration: 5000
    });
    
    // Still emit via socket for the viewer
    try {
      await fetch(`${window.location.origin}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formula: `2d20kh1+${dexMod}`, 
          rollType: 'Initiative',
          details: rollDetails,
          result: total,
          rolls: [roll1, roll2],
          advantage: true
        })
      });
    } catch (error) {
      console.error('Error broadcasting initiative:', error);
    }
  };

  const handleD20Roll = () => {
    rollDice('1d20', 'd20', 'Flat d20 Roll');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Main HP Display */}
      <div className="bg-dark-surface rounded-xl border border-dark-border shadow-card overflow-hidden">
        <AnimatedHealthBar 
          current={stats.hp_current} 
          max={stats.hp_max} 
          tempHP={stats.temp_hp} 
          size="normal"
          onHeal={handleHeal}
          onTakeDamage={handleDamage}
          onTempHPChange={handleTempHPChange}
          showActions={true}
        />
      </div>

      {/* Defenses Grid */}
      <div className="grid grid-cols-3 gap-2">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center"
        >
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase tracking-wider">
            <Shield className="w-3 h-3" />
            <span>AC</span>
          </div>
          <div className="text-2xl font-bold text-white font-display">{stats.ac}</div>
          {stats.ac_bonuses && stats.ac_bonuses.length > 0 && (
            <div className="text-[9px] text-gold-dim truncate">
              {stats.ac_bonuses.join(', ')}
            </div>
          )}
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center"
        >
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase tracking-wider">
            <Footprints className="w-3 h-3" />
            <span>Speed</span>
          </div>
          <div className="text-2xl font-bold text-white font-display">{stats.speed}</div>
          <div className="text-[10px] text-gray-500">ft</div>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleInitiativeRoll}
          disabled={rolling}
          className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center hover:border-gold-primary transition-colors"
        >
          <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] uppercase tracking-wider group-hover:text-gold-primary">
            <Dices className="w-3 h-3" />
            <span>Init</span>
          </div>
          <div className="text-2xl font-bold text-white font-display">
            {Math.floor((stats.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((stats.dexterity - 10) / 2)}
          </div>
          <div className="text-[10px] text-gray-500">Roll</div>
        </motion.button>
      </div>

      {/* Quick Saves */}
      <div className="bg-dark-surface p-3 rounded-xl border border-dark-border">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Saving Throws
          </h4>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleD20Roll}
            disabled={rolling}
            className="text-[10px] bg-dark-bg hover:bg-gold-primary/20 text-gold-primary px-2 py-0.5 rounded border border-gold-primary/30 transition-colors flex items-center gap-1"
          >
            <Dices className="w-3 h-3" /> d20
          </motion.button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(saves).map(([stat, mod]) => (
            <motion.button 
              key={stat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSaveRoll(stat, mod)}
              disabled={rolling}
              className="flex flex-col items-center p-1.5 rounded bg-dark-bg hover:bg-dark-hover border border-transparent hover:border-gold-dim/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Roll ${stat} Save`}
            >
              <span className="text-[9px] font-bold text-gray-500 uppercase">{stat.slice(0, 3)}</span>
              <span className={`font-bold text-sm ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
