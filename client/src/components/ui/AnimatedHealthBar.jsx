import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Heart, HeartCrack, Shield, Skull, Swords, Plus, Minus } from 'lucide-react';

/**
 * Animated Health Bar with Ghost Bar Effect
 * - Smooth transitions when HP changes
 * - Ghost bar shows damage taken with delay
 * - Color-coded based on HP percentage
 * - Pulse animation when critical
 */
export default function AnimatedHealthBar({
  current,
  max,
  tempHP = 0,
  onHeal,
  onTakeDamage,
  onTempHPChange,
  size = 'normal', // 'compact', 'normal', 'large'
  showActions = true
}) {
  const [previousHP, setPreviousHP] = useState(current);
  const [showGhost, setShowGhost] = useState(false);
  const [editingTempHP, setEditingTempHP] = useState(false);
  const [tempHPInput, setTempHPInput] = useState('');

  // Animated values
  const springConfig = { stiffness: 100, damping: 20 };
  const animatedCurrent = useSpring(current, springConfig);
  const animatedGhost = useSpring(previousHP, { stiffness: 50, damping: 25 });

  // Calculate percentages
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const ghostPercentage = Math.min(100, Math.max(0, (previousHP / max) * 100));
  
  // States
  const isLow = percentage < 50;
  const isCritical = percentage < 25;
  const isDying = current === 0;

  // Track damage for ghost bar
  useEffect(() => {
    if (current < previousHP) {
      // Took damage - show ghost
      setShowGhost(true);
      const timer = setTimeout(() => {
        setPreviousHP(current);
        setShowGhost(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Healed or same
      setPreviousHP(current);
    }
  }, [current]);

  // Update spring values
  useEffect(() => {
    animatedCurrent.set(current);
  }, [current, animatedCurrent]);

  useEffect(() => {
    if (!showGhost) {
      animatedGhost.set(current);
    }
  }, [showGhost, current, animatedGhost]);

  // Get color based on HP
  const getBarColor = () => {
    if (isDying) return 'bg-red-900';
    if (isCritical) return 'bg-gradient-to-r from-red-600 to-red-500';
    if (isLow) return 'bg-gradient-to-r from-yellow-600 to-yellow-500';
    return 'bg-gradient-to-r from-green-600 to-emerald-500';
  };

  const getTextColor = () => {
    if (isDying) return 'text-red-400';
    if (isCritical) return 'text-red-400';
    if (isLow) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Size classes
  const sizeClasses = {
    compact: {
      container: 'p-2',
      bar: 'h-3',
      numbers: 'text-lg',
      icon: 'w-4 h-4',
      button: 'p-1.5'
    },
    normal: {
      container: 'p-4',
      bar: 'h-5',
      numbers: 'text-3xl',
      icon: 'w-5 h-5',
      button: 'p-2'
    },
    large: {
      container: 'p-6',
      bar: 'h-7',
      numbers: 'text-5xl',
      icon: 'w-6 h-6',
      button: 'p-3'
    }
  };

  const s = sizeClasses[size];

  return (
    <div className={`w-full ${s.container}`}>
      {/* Status Badge */}
      {(isCritical || isDying) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center gap-2 mb-2 px-3 py-1 rounded-full text-xs font-bold ${
            isDying ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'
          }`}
        >
          {isDying ? (
            <>
              <Skull className="w-4 h-4" />
              <span>DYING</span>
            </>
          ) : (
            <>
              <HeartCrack className="w-4 h-4 animate-pulse" />
              <span>CRITICAL</span>
            </>
          )}
        </motion.div>
      )}

      {/* HP Numbers */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <Heart className={`${s.icon} ${getTextColor()}`} fill="currentColor" />
        <div className="flex items-baseline gap-1">
          <motion.span 
            className={`${s.numbers} font-bold ${getTextColor()}`}
            key={current}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {current}
          </motion.span>
          <span className="text-gray-500">/</span>
          <span className={`${size === 'compact' ? 'text-sm' : 'text-lg'} text-gray-400`}>{max}</span>
        </div>
        
        {/* Temp HP - Clickable to edit */}
        {editingTempHP ? (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 rounded-full">
            <Shield className="w-3 h-3 text-blue-400" />
            <input
              type="number"
              value={tempHPInput}
              onChange={(e) => setTempHPInput(e.target.value)}
              onBlur={() => {
                const newVal = parseInt(tempHPInput) || 0;
                if (onTempHPChange) onTempHPChange(Math.max(0, newVal));
                setEditingTempHP(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newVal = parseInt(tempHPInput) || 0;
                  if (onTempHPChange) onTempHPChange(Math.max(0, newVal));
                  setEditingTempHP(false);
                } else if (e.key === 'Escape') {
                  setEditingTempHP(false);
                }
              }}
              autoFocus
              className="w-12 text-sm font-bold text-blue-400 bg-transparent border-b border-blue-400 outline-none text-center"
            />
          </div>
        ) : (
          <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => {
              setTempHPInput(tempHP.toString());
              setEditingTempHP(true);
            }}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 rounded-full cursor-pointer transition-colors"
            title="Click to edit Temp HP"
          >
            <Shield className="w-3 h-3 text-blue-400" />
            <span className="text-sm font-bold text-blue-400">+{tempHP}</span>
          </motion.button>
        )}
      </div>

      {/* HP Bar */}
      <div className={`relative w-full ${s.bar} bg-dark-bg rounded-full overflow-hidden`}>
        {/* Ghost bar (shows damage taken) */}
        {showGhost && (
          <motion.div
            className="absolute inset-y-0 left-0 bg-red-400/50"
            initial={{ width: `${ghostPercentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        )}

        {/* Main HP bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 ${getBarColor()} ${isCritical ? 'animate-pulse' : ''}`}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />

        {/* Temp HP overlay */}
        {tempHP > 0 && (
          <motion.div
            className="absolute inset-y-0 bg-blue-500/60"
            style={{ left: `${percentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100 - percentage, (tempHP / max) * 100)}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        )}

        {/* Percentage label */}
        {size !== 'compact' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-lg">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {showActions && (
        <div className="flex justify-center gap-2 mt-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHeal}
            className={`${s.button} flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 rounded-lg transition-colors`}
          >
            <Plus className={s.icon} />
            {size !== 'compact' && <span className="text-sm font-medium">Heal</span>}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTakeDamage}
            className={`${s.button} flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded-lg transition-colors`}
          >
            <Swords className={s.icon} />
            {size !== 'compact' && <span className="text-sm font-medium">Damage</span>}
          </motion.button>
        </div>
      )}

      {/* Helper Text */}
      {size !== 'compact' && (
        <div className="text-center mt-2">
          {isDying ? (
            <span className="text-sm text-red-400 font-medium">Roll Death Saves!</span>
          ) : isCritical ? (
            <span className="text-sm text-yellow-400">Heal quickly!</span>
          ) : (
            <span className="text-xs text-gray-500">Hit Points</span>
          )}
        </div>
      )}
    </div>
  );
}
