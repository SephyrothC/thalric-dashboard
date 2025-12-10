import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Dice6, Sword, Wand2, Sparkles, X, Trophy, Skull } from 'lucide-react';

/**
 * Animated Dice Roll Modal
 * - Shake animation before showing result
 * - Critical/Fumble special effects
 * - Clean, modern design with Lucide icons
 */
export default function DiceRollModal({ roll, onClose }) {
  const [phase, setPhase] = useState('rolling'); // 'rolling' | 'reveal' | 'done'
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (roll) {
      setPhase('rolling');
      setShowResult(false);
      
      // Shake phase
      const timer1 = setTimeout(() => {
        setPhase('reveal');
      }, 600);
      
      // Show result
      const timer2 = setTimeout(() => {
        setShowResult(true);
        setPhase('done');
      }, 800);
      
      // Auto close
      const timer3 = setTimeout(() => {
        onClose?.();
      }, 3500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [roll]);

  if (!roll) return null;

  const getRollIcon = () => {
    switch (roll.rollType?.toLowerCase()) {
      case 'attack':
        return <Sword className="w-8 h-8" />;
      case 'damage':
        return <Sparkles className="w-8 h-8" />;
      case 'spell':
        return <Wand2 className="w-8 h-8" />;
      default:
        return <Dice6 className="w-8 h-8" />;
    }
  };

  const getResultColor = () => {
    if (roll.is_critical) return 'text-yellow-400';
    if (roll.is_fumble) return 'text-red-400';
    return 'text-white';
  };

  const getBorderColor = () => {
    if (roll.is_critical) return 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]';
    if (roll.is_fumble) return 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]';
    return 'border-gold-primary shadow-[0_0_20px_rgba(245,158,11,0.2)]';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            phase === 'rolling'
              ? {
                  scale: 1,
                  opacity: 1,
                  rotate: [0, -5, 5, -5, 5, 0],
                  transition: { rotate: { repeat: Infinity, duration: 0.15 } }
                }
              : {
                  scale: 1,
                  opacity: 1,
                  rotate: 0
                }
          }
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative bg-dark-surface rounded-2xl p-8 min-w-[300px] border-2 ${getBorderColor()} transition-all duration-300`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Roll Type Header */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`${roll.is_critical ? 'text-yellow-400' : roll.is_fumble ? 'text-red-400' : 'text-gold-primary'}`}>
              {getRollIcon()}
            </div>
            <h3 className="text-xl font-bold text-gray-200">{roll.rollType}</h3>
          </div>

          {/* Formula */}
          <div className="text-center mb-4">
            <span className="text-sm text-gray-400 font-mono bg-dark-bg px-3 py-1 rounded">
              {roll.formula}
            </span>
          </div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.div
                key="result"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="text-center py-4"
              >
                <div className={`text-7xl font-bold ${getResultColor()} drop-shadow-lg`}>
                  {roll.result}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
                  className="text-6xl text-gold-primary inline-block"
                >
                  <Dice6 className="w-16 h-16" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Details */}
          {roll.details && showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-gray-400 text-sm mt-2"
            >
              {roll.details}
            </motion.div>
          )}

          {/* Critical/Fumble Badge */}
          <AnimatePresence>
            {showResult && (roll.is_critical || roll.is_fumble) && (
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold ${
                  roll.is_critical
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                }`}
              >
                {roll.is_critical ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>CRITICAL SUCCESS!</span>
                    <Trophy className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Skull className="w-5 h-5" />
                    <span>CRITICAL FAILURE!</span>
                    <Skull className="w-5 h-5" />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
