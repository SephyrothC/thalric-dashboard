import { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Skull, 
  Heart, 
  Dices, 
  CheckCircle, 
  XCircle,
  Shield,
  Loader2,
  Gem
} from 'lucide-react';

export default function DeathSaves() {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [animatingSuccess, setAnimatingSuccess] = useState(null);
  const [animatingFailure, setAnimatingFailure] = useState(null);
  const prevSuccesses = useRef(0);
  const prevFailures = useRef(0);

  const data = character?.data || {};
  const stats = data.stats || {};
  const death_saves_successes = stats.death_saves_successes || 0;
  const death_saves_failures = stats.death_saves_failures || 0;
  const is_stable = stats.is_stable || 0;
  const hp_current = stats.hp_current || 0;

  // Detect changes in successes/failures and animate the new icon
  useEffect(() => {
    if (death_saves_successes > prevSuccesses.current) {
      setAnimatingSuccess(death_saves_successes);
      setTimeout(() => setAnimatingSuccess(null), 800);
    }
    if (death_saves_failures > prevFailures.current) {
      setAnimatingFailure(death_saves_failures);
      setTimeout(() => setAnimatingFailure(null), 800);
    }
    prevSuccesses.current = death_saves_successes;
    prevFailures.current = death_saves_failures;
  }, [death_saves_successes, death_saves_failures]);

  useEffect(() => {
    if (!socket) return;

    const handleDeathSaveRoll = (data) => {
      setLastResult(data);
      setTimeout(() => setLastResult(null), 5000);
      fetchCharacter();
    };

    socket.on('death_save_rolled', handleDeathSaveRoll);

    return () => {
      socket.off('death_save_rolled', handleDeathSaveRoll);
    };
  }, [socket, fetchCharacter]);

  const rollDeathSave = async () => {
    setRolling(true);

    try {
      const response = await fetch('/api/combat/death-save/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      // Show result notification
      if (data.result === 'critical_success') {
        toast.success('NATURAL 20! You regain 1 HP!', { 
          icon: <Heart className="w-4 h-4 text-green-400" />, 
          duration: 5000 
        });
      } else if (data.result === 'critical_failure') {
        toast.error('NATURAL 1! 2 death save failures!', { 
          icon: <Skull className="w-4 h-4 text-red-400" />, 
          duration: 5000 
        });
      } else if (data.result === 'dead') {
        toast.error('YOU ARE DEAD. 3 failures reached.', { 
          icon: <Skull className="w-4 h-4" />, 
          duration: 8000 
        });
      } else if (data.result === 'stabilized') {
        toast.success('STABILIZED! You have 3 successes.', { 
          icon: <CheckCircle className="w-4 h-4 text-green-400" />, 
          duration: 5000 
        });
      } else if (data.result === 'success') {
        toast.success(`Death Save Success (${data.successes}/3)`, { duration: 4000 });
      } else if (data.result === 'failure') {
        toast.warning(`Death Save Failure (${data.failures}/3)`, { duration: 4000 });
      }

      await fetchCharacter();
    } catch (error) {
      console.error('Failed to roll death save:', error);
      toast.error('Failed to roll death save');
    } finally {
      setRolling(false);
    }
  };

  // Don't show if HP > 0
  if (hp_current > 0) return null;

  return (
    <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gold-primary mb-4 flex items-center gap-2">
        <Skull className="w-6 h-6" />
        Death Saves
      </h3>

      {lastResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 p-4 rounded-lg text-center font-bold text-lg ${
            lastResult.result === 'critical_success' ? 'bg-green-600 text-white' :
            lastResult.result === 'critical_failure' ? 'bg-red-600 text-white animate-pulse' :
            lastResult.result === 'success' ? 'bg-green-500/30 text-green-300' :
            lastResult.result === 'failure' ? 'bg-red-500/30 text-red-300' :
            lastResult.result === 'stabilized' ? 'bg-blue-600 text-white' :
            'bg-gray-600 text-white'
        }`}>
          <div className="text-3xl mb-2 flex items-center justify-center gap-2">
            <Dices className="w-8 h-8" />
            {lastResult.roll}
          </div>
          <div>{lastResult.message}</div>
        </motion.div>
      )}

      {is_stable ? (
        <div className="bg-green-600/20 border-2 border-green-500 rounded-lg p-4 text-center">
          <div className="text-green-400 text-xl font-bold flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6" />
            STABLE
          </div>
          <div className="text-green-300 text-sm mt-2">
            You are unconscious but no longer dying.
          </div>
        </div>
      ) : (
        <>
          {/* Failures */}
          <div className="mb-4">
            <label className="block text-gold-secondary mb-2 font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              Failures:
            </label>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={`fail-${i}`}
                  animate={animatingFailure === i ? { scale: [1, 1.3, 1] } : {}}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    death_saves_failures >= i
                      ? 'bg-red-500/30 shadow-[0_0_15px_rgba(255,56,56,0.5)]'
                      : 'bg-dark-bg opacity-30'
                  }`}
                >
                  <Skull className={`w-8 h-8 ${death_saves_failures >= i ? 'text-red-400' : 'text-gray-600'}`} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Successes */}
          <div className="mb-6">
            <label className="block text-gold-secondary mb-2 font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Successes:
            </label>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={`success-${i}`}
                  animate={animatingSuccess === i ? { scale: [1, 1.3, 1] } : {}}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    death_saves_successes >= i
                      ? 'bg-green-500/30 shadow-[0_0_15px_rgba(76,175,80,0.5)]'
                      : 'bg-dark-bg opacity-30'
                  }`}
                >
                  <Heart className={`w-8 h-8 ${death_saves_successes >= i ? 'text-green-400' : 'text-gray-600'}`} />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={rollDeathSave}
            disabled={rolling}
          >
            {rolling ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Rolling...
              </>
            ) : (
              <>
                <Dices className="w-5 h-5" />
                Roll Death Save
              </>
            )}
          </motion.button>

          <div className="mt-4 p-4 bg-dark-bg rounded-lg">
            <div className="text-gray-400 text-sm space-y-1">
              <div><strong className="text-gold-secondary">Rules:</strong></div>
              <div>• 1-9: Failure | 10-19: Success</div>
              <div>• Natural 1: 2 failures</div>
              <div>• Natural 20: Regain 1 HP</div>
              <div>• 3 successes: Stable | 3 failures: Dead</div>
            </div>
          </div>
        </>
      )}

      {/* Periapt note */}
      <div className="mt-4 p-3 bg-gold-primary/10 border-l-4 border-gold-primary rounded flex items-start gap-2">
        <Gem className="w-5 h-5 text-gold-secondary flex-shrink-0 mt-0.5" />
        <div className="text-gold-secondary text-sm">
          <strong>Periapt of Wound Closure:</strong> You automatically stabilize at 0 HP.
        </div>
      </div>
    </div>
  );
}
