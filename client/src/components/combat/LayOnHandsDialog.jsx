import { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hand, 
  X, 
  Heart,
  HeartPulse,
  AlertTriangle,
  FlaskConical,
  Loader2,
  Sparkles,
  Moon,
  Minus,
  Plus,
  Droplets
} from 'lucide-react';

export default function LayOnHandsDialog({ isOpen, onClose }) {
  const { character, useFeature } = useCharacterStore();
  const [healAmount, setHealAmount] = useState(1);
  const [isHealing, setIsHealing] = useState(false);
  const [activeTab, setActiveTab] = useState('heal'); // 'heal' or 'cure'
  const sliderRef = useRef(null);

  const data = character?.data || {};
  const layOnHands = data.features?.lay_on_hands || {};
  const pool = layOnHands.pool || 0;
  const maxPool = layOnHands.pool_max || 75;
  const stats = data.stats || {};
  const currentHP = stats.hp_current || 0;
  const maxHP = stats.hp_max || 124;
  const hpMissing = maxHP - currentHP;

  // Reset heal amount when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHealAmount(Math.min(pool, hpMissing) || 1);
    }
  }, [isOpen, pool, hpMissing]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxHealable = Math.min(pool, hpMissing);
  const poolPercentage = (pool / maxPool) * 100;
  const poolAfterHeal = pool - healAmount;

  const handleHeal = async () => {
    if (healAmount > pool || healAmount <= 0) return;

    setIsHealing(true);

    try {
      const response = await useFeature('lay_on_hands', { amount: healAmount, action: 'heal' });

      if (response) {
        const actualHealing = Math.min(healAmount, hpMissing);
        toast.success(`Healed ${actualHealing} HP!`, {
          description: `Lay on Hands: ${poolAfterHeal}/${maxPool} remaining`,
          icon: <HeartPulse className="w-4 h-4 text-green-400" />,
          duration: 4000
        });
        onClose();
      }
    } catch (error) {
      console.error('Lay on Hands failed:', error);
      toast.error('Failed to use Lay on Hands');
    } finally {
      setIsHealing(false);
    }
  };

  const handleCurePoison = async () => {
    if (pool < 5) return;

    setIsHealing(true);

    try {
      const response = await useFeature('lay_on_hands', { amount: 5, action: 'cure' });

      if (response) {
        toast.success(`Disease/Poison cured!`, {
          description: `Lay on Hands: ${pool - 5}/${maxPool} remaining`,
          icon: <FlaskConical className="w-4 h-4 text-purple-400" />
        });
        onClose();
      }
    } catch (error) {
      console.error('Cure poison failed:', error);
      toast.error('Failed to cure disease/poison');
    } finally {
      setIsHealing(false);
    }
  };

  const adjustAmount = (delta) => {
    setHealAmount(prev => Math.max(1, Math.min(maxHealable, prev + delta)));
  };

  const presetAmounts = [5, 10, 20, maxHealable];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gradient-to-b from-dark-surface to-dark-bg border border-gold-primary/50 rounded-2xl shadow-2xl shadow-gold-primary/20 max-w-lg w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-yellow-600/20 via-yellow-500/10 to-yellow-600/20 p-6 border-b border-gold-primary/30">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <motion.div 
                className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg"
                animate={{ 
                  boxShadow: ['0 0 20px rgba(234,179,8,0.3)', '0 0 40px rgba(234,179,8,0.5)', '0 0 20px rgba(234,179,8,0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Hand className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold text-white">Lay on Hands</h3>
                <p className="text-yellow-200/70 text-sm">Divine Healing Touch</p>
              </div>
            </div>

            {/* Pool Display */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Healing Pool</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-yellow-400">{pool}</span>
                  <span className="text-xl text-gray-500">/ {maxPool}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Moon className="w-4 h-4" />
                Recharges on Long Rest
              </div>
            </div>

            {/* Pool Bar */}
            <div className="mt-3 h-3 bg-dark-bg/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500 relative"
                initial={{ width: 0 }}
                animate={{ width: `${poolPercentage}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </motion.div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {pool === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="inline-flex p-4 bg-red-500/20 rounded-full mb-4">
                  <AlertTriangle className="w-12 h-12 text-red-400" />
                </div>
                <h4 className="text-xl font-bold text-red-400 mb-2">Pool Exhausted</h4>
                <p className="text-gray-400">Your divine healing power will recharge after a Long Rest.</p>
              </motion.div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-dark-bg rounded-xl">
                  <button
                    onClick={() => setActiveTab('heal')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'heal' 
                        ? 'bg-green-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <HeartPulse className="w-5 h-5" />
                    Heal
                  </button>
                  <button
                    onClick={() => setActiveTab('cure')}
                    disabled={pool < 5}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'cure' 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <FlaskConical className="w-5 h-5" />
                    Cure
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'heal' ? (
                    <motion.div
                      key="heal"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      {/* HP Missing Info */}
                      {hpMissing > 0 ? (
                        <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Droplets className="w-5 h-5 text-red-400" />
                            <span className="text-gray-300">HP Missing</span>
                          </div>
                          <span className="text-2xl font-bold text-red-400">{hpMissing}</span>
                        </div>
                      ) : (
                        <div className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center gap-3">
                          <Sparkles className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold">You're at full health!</span>
                        </div>
                      )}

                      {/* Heal Amount Selector */}
                      {hpMissing > 0 && (
                        <>
                          {/* Big Number Display */}
                          <div className="text-center mb-4">
                            <div className="text-sm text-gray-400 mb-2">Healing Amount</div>
                            <div className="flex items-center justify-center gap-4">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => adjustAmount(-5)}
                                disabled={healAmount <= 1}
                                className="p-3 bg-dark-bg hover:bg-dark-light rounded-full transition-colors disabled:opacity-30"
                              >
                                <Minus className="w-6 h-6 text-white" />
                              </motion.button>
                              
                              <motion.div 
                                key={healAmount}
                                initial={{ scale: 1.2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-32 text-center"
                              >
                                <span className="text-6xl font-bold text-green-400">+{healAmount}</span>
                              </motion.div>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => adjustAmount(5)}
                                disabled={healAmount >= maxHealable}
                                className="p-3 bg-dark-bg hover:bg-dark-light rounded-full transition-colors disabled:opacity-30"
                              >
                                <Plus className="w-6 h-6 text-white" />
                              </motion.button>
                            </div>
                          </div>

                          {/* Slider */}
                          <div className="mb-5">
                            <input
                              ref={sliderRef}
                              type="range"
                              min="1"
                              max={maxHealable}
                              value={healAmount}
                              onChange={(e) => setHealAmount(parseInt(e.target.value))}
                              className="w-full h-3 bg-dark-bg rounded-full appearance-none cursor-pointer accent-green-500
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                                [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg
                                [&::-webkit-slider-thumb]:hover:bg-green-400 [&::-webkit-slider-thumb]:transition-colors"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>1</span>
                              <span>{maxHealable}</span>
                            </div>
                          </div>

                          {/* Quick Presets */}
                          <div className="grid grid-cols-4 gap-2 mb-5">
                            {presetAmounts.map((amount, i) => (
                              <motion.button
                                key={amount}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setHealAmount(Math.min(amount, maxHealable))}
                                disabled={amount > pool}
                                className={`py-2 px-3 rounded-lg font-bold transition-all ${
                                  healAmount === amount 
                                    ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-2 ring-offset-dark-bg' 
                                    : 'bg-dark-bg hover:bg-dark-light text-gray-300'
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                              >
                                {i === 3 ? 'MAX' : `+${amount}`}
                              </motion.button>
                            ))}
                          </div>

                          {/* Pool Preview */}
                          <div className="mb-5 p-3 bg-dark-bg rounded-xl flex items-center justify-between text-sm">
                            <span className="text-gray-400">Pool after healing:</span>
                            <span className={`font-bold ${poolAfterHeal < 20 ? 'text-orange-400' : 'text-yellow-400'}`}>
                              {poolAfterHeal} / {maxPool}
                            </span>
                          </div>

                          {/* Heal Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleHeal}
                            disabled={isHealing || healAmount <= 0}
                            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 
                              text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                              shadow-lg shadow-green-600/30 flex items-center justify-center gap-3"
                          >
                            {isHealing ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <>
                                <Heart className="w-6 h-6" />
                                Heal for {healAmount} HP
                              </>
                            )}
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="cure"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-center py-4"
                    >
                      <div className="inline-flex p-4 bg-purple-500/20 rounded-full mb-4">
                        <FlaskConical className="w-12 h-12 text-purple-400" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Cure Disease or Poison</h4>
                      <p className="text-gray-400 mb-6">
                        Expend 5 HP from your pool to neutralize one disease or poison affecting the target.
                      </p>

                      <div className="mb-4 p-3 bg-dark-bg rounded-xl flex items-center justify-between">
                        <span className="text-gray-400">Cost:</span>
                        <span className="font-bold text-purple-400">5 HP</span>
                      </div>

                      <div className="mb-6 p-3 bg-dark-bg rounded-xl flex items-center justify-between text-sm">
                        <span className="text-gray-400">Pool after cure:</span>
                        <span className={`font-bold ${pool - 5 < 20 ? 'text-orange-400' : 'text-yellow-400'}`}>
                          {pool - 5} / {maxPool}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCurePoison}
                        disabled={isHealing || pool < 5}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 
                          text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          shadow-lg shadow-purple-600/30 flex items-center justify-center gap-3"
                      >
                        {isHealing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-6 h-6" />
                            Cure Disease/Poison
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer Rules */}
          <div className="px-6 pb-6">
            <div className="p-4 bg-dark-bg/50 rounded-xl border border-dark-light">
              <div className="flex items-center gap-2 text-gold-secondary font-semibold text-sm mb-2">
                <Hand className="w-4 h-4" />
                Rules Reminder
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>• Requires an <strong className="text-white">Action</strong></div>
                <div>• Touch range only</div>
                <div>• Won't exceed max HP</div>
                <div>• No undead/constructs</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
