import { motion } from 'framer-motion';
import { Bird, Sparkles, Heart, Shield } from 'lucide-react';

export default function CompanionHeader({ companion, activeBuffs = [] }) {
  const hpPercentage = (companion.hp_current / companion.hp_max) * 100;
  const hasBuffs = activeBuffs.length > 0;
  
  const getStatusColor = () => {
    if (companion.hp_current === 0) return 'text-gray-500';
    if (hpPercentage > 50) return 'text-green-400';
    if (hpPercentage > 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusText = () => {
    if (companion.hp_current === 0) return 'Disparu';
    if (hpPercentage > 75) return 'En pleine forme';
    if (hpPercentage > 50) return 'Blessé';
    if (hpPercentage > 25) return 'Gravement blessé';
    return 'Critique';
  };

  return (
    <div className="bg-dark-surface rounded-xl border border-dark-border p-3 flex items-center justify-between">
      {/* Left: Companion Info */}
      <div className="flex items-center gap-4">
        <motion.div 
          animate={{ 
            boxShadow: companion.hp_current > 0 
              ? ['0 0 10px rgba(245,158,11,0.3)', '0 0 20px rgba(245,158,11,0.5)', '0 0 10px rgba(245,158,11,0.3)']
              : 'none'
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center"
        >
          <Bird className="w-7 h-7 text-white" />
        </motion.div>
        
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold text-gold-primary">{companion.name}</h2>
            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Find Greater Steed
            </span>
          </div>
          <p className="text-sm text-gray-400">{companion.type} • {companion.creatureType}</p>
        </div>
      </div>

      {/* Center: Active Buffs Icons */}
      {hasBuffs && (
        <div className="flex items-center gap-2">
          {activeBuffs.slice(0, 4).map((buff) => (
            <motion.div
              key={buff.name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-8 h-8 bg-purple-900/50 border border-purple-500/50 rounded-lg flex items-center justify-center"
              title={`${buff.name}: ${buff.effect.description}`}
            >
              <span className="text-sm">{buff.effect.icon || '✨'}</span>
            </motion.div>
          ))}
          {activeBuffs.length > 4 && (
            <span className="text-xs text-purple-300">+{activeBuffs.length - 4}</span>
          )}
        </div>
      )}

      {/* Right: Quick Status */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <Heart className={`w-4 h-4 ${getStatusColor()}`} />
            <span className={`text-sm font-bold ${getStatusColor()}`}>{getStatusText()}</span>
          </div>
          <div className="text-xs text-gray-500">
            {companion.hp_current}/{companion.hp_max} HP
            {companion.temp_hp > 0 && <span className="text-blue-400"> (+{companion.temp_hp})</span>}
          </div>
        </div>
        
        {/* Mini HP Bar */}
        <div className="w-24 h-3 bg-dark-bg rounded-full overflow-hidden border border-dark-border relative">
          {companion.temp_hp > 0 && (
            <motion.div
              animate={{ width: `${Math.min(100, ((companion.hp_current + companion.temp_hp) / companion.hp_max) * 100)}%` }}
              className="h-full bg-blue-500/50 absolute"
            />
          )}
          <motion.div
            animate={{ width: `${hpPercentage}%` }}
            className={`h-full ${
              hpPercentage > 50 ? 'bg-green-500' : 
              hpPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
