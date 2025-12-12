import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bird,
  Heart,
  Shield,
  Footprints,
  Wind,
  Eye,
  Plus,
  Minus,
  RotateCcw,
  HeartCrack,
  Sparkles,
  Dices
} from 'lucide-react';
import { toast } from 'sonner';

// Noms français des caractéristiques
const STAT_NAMES = {
  strength: 'Force',
  dexterity: 'Dextérité',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Sagesse',
  charisma: 'Charisme'
};

export default function CompanionVitals({ companion, baseAC = 12, onHeal, onDamage, onTempHP, onFullHeal }) {
  const [rolling, setRolling] = useState(false);

  // Saving throw roll
  const handleSavingThrow = async (stat, value) => {
    if (rolling) return;
    
    setRolling(true);
    const mod = Math.floor((value - 10) / 2);
    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
    
    try {
      await fetch(`${window.location.origin}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula: `1d20${modStr}`,
          rollType: `${companion.name} - Sauvegarde ${STAT_NAMES[stat]}`,
          details: `Modificateur: ${modStr}`
        })
      });
      
      toast.info(`Jet de sauvegarde ${STAT_NAMES[stat]}!`, {
        icon: <Dices className="w-4 h-4 text-gold-primary" />
      });
    } catch (error) {
      console.error('Saving throw failed:', error);
    } finally {
      setRolling(false);
    }
  };
  // HP Management using store functions
  const handleHeal = () => {
    const amount = prompt("Soins (HP):");
    if (amount) {
      const healAmount = parseInt(amount);
      onHeal(healAmount);
      toast.success(`${companion.name} soigné de ${healAmount} HP!`, {
        icon: <Plus className="w-4 h-4 text-green-400" />
      });
    }
  };

  const handleDamage = () => {
    const amount = prompt("Dégâts:");
    if (amount) {
      const dmg = parseInt(amount);
      onDamage(dmg);
      
      if (companion.hp_current - dmg <= 0) {
        toast.error(`${companion.name} est tombé à 0 HP! Il disparaît...`, {
          icon: <Bird className="w-4 h-4 text-gray-400" />,
          duration: 5000
        });
      } else {
        toast.error(`${companion.name} a pris ${dmg} dégâts!`, {
          icon: <HeartCrack className="w-4 h-4 text-red-400" />
        });
      }
    }
  };

  const handleTempHPChange = () => {
    const amount = prompt("HP Temporaires:");
    if (amount) {
      const tempHP = parseInt(amount);
      onTempHP(tempHP);
      toast.info(`HP temporaires mis à jour!`, {
        icon: <Shield className="w-4 h-4 text-blue-400" />
      });
    }
  };

  const handleFullHeal = () => {
    onFullHeal();
    toast.success(`${companion.name} entièrement soigné!`, {
      icon: <RotateCcw className="w-4 h-4 text-green-400" />
    });
  };

  // Calculate HP percentage
  const hpPercentage = (companion.hp_current / companion.hp_max) * 100;
  const getHPColor = () => {
    if (hpPercentage > 50) return 'from-green-600 to-green-500';
    if (hpPercentage > 25) return 'from-yellow-600 to-yellow-500';
    return 'from-red-600 to-red-500';
  };

  // Check if AC has a buff
  const acBonus = companion.ac - baseAC;
  const hasACBonus = acBonus > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Companion Header - Compact */}
      <div className="bg-dark-surface rounded-xl border border-dark-border p-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
            <Bird className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-display font-bold text-gold-primary truncate">{companion.name}</h2>
            <p className="text-[10px] text-gray-400 truncate">{companion.type}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleFullHeal}
            className="p-1.5 bg-dark-bg hover:bg-green-600/20 rounded-lg border border-dark-border transition-colors"
            title="Full Heal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-green-400" />
          </motion.button>
        </div>
      </div>

      {/* HP Display - Compact */}
      <div className="bg-dark-surface rounded-xl border border-dark-border p-2">
        {/* HP Bar */}
        <div className="relative h-8 bg-dark-bg rounded-lg overflow-hidden border border-dark-border mb-2">
          {companion.temp_hp > 0 && (
            <motion.div
              animate={{ width: `${Math.min(100, ((companion.hp_current + companion.temp_hp) / companion.hp_max) * 100)}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600/60 to-cyan-500/60"
            />
          )}
          <motion.div
            animate={{ width: `${hpPercentage}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getHPColor()}`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-lg font-display">
              {companion.hp_current}
              {companion.temp_hp > 0 && <span className="text-blue-300 text-sm"> (+{companion.temp_hp})</span>}
              <span className="text-gray-300 text-sm"> / {companion.hp_max}</span>
            </span>
          </div>
        </div>

        {/* HP Buttons - Compact */}
        <div className="flex gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleHeal}
            className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" /> Heal
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDamage}
            className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Minus className="w-3 h-3" /> Dmg
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleTempHPChange}
            className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
            title="Add Temp HP"
          >
            <Shield className="w-3 h-3" />
          </motion.button>
        </div>
      </div>

      {/* Stats Grid - Compact 4 cols */}
      <div className="grid grid-cols-4 gap-1.5">
        <div className={`bg-dark-surface p-2 rounded-lg border text-center ${hasACBonus ? 'border-purple-500/50 bg-purple-900/20' : 'border-dark-border'}`}>
          <div className="flex items-center justify-center gap-0.5 text-gray-400 text-[9px] uppercase">
            <Shield className={`w-2.5 h-2.5 ${hasACBonus ? 'text-purple-400' : ''}`} />
            CA
          </div>
          <div className={`text-lg font-bold font-display ${hasACBonus ? 'text-purple-300' : 'text-white'}`}>
            {companion.ac}
          </div>
        </div>
        
        <div className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center">
          <div className="flex items-center justify-center gap-0.5 text-gray-400 text-[9px] uppercase">
            <Footprints className="w-2.5 h-2.5" />
            Vit
          </div>
          <div className="text-lg font-bold text-white font-display">{companion.speed.walk}</div>
        </div>
        
        <div className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center">
          <div className="flex items-center justify-center gap-0.5 text-amber-400 text-[9px] uppercase">
            <Wind className="w-2.5 h-2.5" />
            Vol
          </div>
          <div className="text-lg font-bold text-amber-400 font-display">{companion.speed.fly}</div>
        </div>
        
        <div className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center">
          <div className="flex items-center justify-center gap-0.5 text-gray-400 text-[9px] uppercase">
            <Eye className="w-2.5 h-2.5" />
            Perc
          </div>
          <div className="text-lg font-bold text-white font-display">{companion.senses.passive_perception}</div>
        </div>
      </div>

      {/* Ability Scores - Compact */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-2">
        <div className="grid grid-cols-6 gap-1">
          {Object.entries(companion.stats).map(([stat, value]) => {
            const mod = Math.floor((value - 10) / 2);
            return (
              <motion.button
                key={stat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSavingThrow(stat, value)}
                disabled={rolling}
                className="text-center bg-dark-bg rounded p-1 border border-dark-border hover:border-gold-primary/50 hover:bg-dark-hover transition-all cursor-pointer disabled:opacity-50"
                title={`Sauvegarde ${STAT_NAMES[stat]}`}
              >
                <div className="text-[7px] text-gray-500 uppercase">{stat.slice(0, 3)}</div>
                <div className="text-xs font-bold text-white">{value}</div>
                <div className="text-[9px] text-gold-primary">{mod >= 0 ? `+${mod}` : mod}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
