import { useState, useEffect, useRef } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

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
        toast.success('NATURAL 20! You regain 1 HP!', { icon: '💚', duration: 5000 });
      } else if (data.result === 'critical_failure') {
        toast.error('NATURAL 1! 2 death save failures!', { icon: '💀', duration: 5000 });
      } else if (data.result === 'dead') {
        toast.error('YOU ARE DEAD. 3 failures reached.', { icon: '💀', duration: 8000 });
      } else if (data.result === 'stabilized') {
        toast.success('STABILIZED! You have 3 successes.', { icon: '✅', duration: 5000 });
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
      <h3 className="text-2xl font-bold text-gold-primary mb-4">💀 Death Saves</h3>

      {lastResult && (
        <div className={`mb-4 p-4 rounded-lg text-center font-bold text-lg ${
          lastResult.result === 'critical_success' ? 'bg-green-600 text-white' :
          lastResult.result === 'critical_failure' ? 'bg-red-600 text-white animate-pulse' :
          lastResult.result === 'success' ? 'bg-green-500 bg-opacity-30 text-green-300' :
          lastResult.result === 'failure' ? 'bg-red-500 bg-opacity-30 text-red-300' :
          lastResult.result === 'stabilized' ? 'bg-blue-600 text-white' :
          'bg-gray-600 text-white'
        }`}>
          <div className="text-3xl mb-2">🎲 {lastResult.roll}</div>
          <div>{lastResult.message}</div>
        </div>
      )}

      {is_stable ? (
        <div className="bg-green-600 bg-opacity-20 border-2 border-green-500 rounded-lg p-4 text-center">
          <div className="text-green-400 text-xl font-bold">
            ✅ STABLE
          </div>
          <div className="text-green-300 text-sm mt-2">
            You are unconscious but no longer dying.
          </div>
        </div>
      ) : (
        <>
          {/* Failures */}
          <div className="mb-4">
            <label className="block text-gold-secondary mb-2 font-semibold">Failures:</label>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3].map(i => (
                <span
                  key={`fail-${i}`}
                  className={`text-6xl transition-all duration-300 ${
                    death_saves_failures >= i
                      ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(255,56,56,0.8)]'
                      : 'opacity-30'
                  } ${animatingFailure === i ? 'animate-bounce' : ''}`}
                  style={{
                    animation: animatingFailure === i ? 'deathSavePopRed 0.8s ease-out' : ''
                  }}
                >
                  💀
                </span>
              ))}
            </div>
          </div>

          {/* Successes */}
          <div className="mb-6">
            <label className="block text-gold-secondary mb-2 font-semibold">Successes:</label>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3].map(i => (
                <span
                  key={`success-${i}`}
                  className={`text-6xl transition-all duration-300 ${
                    death_saves_successes >= i
                      ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(76,175,80,0.8)]'
                      : 'opacity-30'
                  } ${animatingSuccess === i ? 'animate-bounce' : ''}`}
                  style={{
                    animation: animatingSuccess === i ? 'deathSavePopGreen 0.8s ease-out' : ''
                  }}
                >
                  💚
                </span>
              ))}
            </div>
          </div>

          <button
            className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            onClick={rollDeathSave}
            disabled={rolling}
          >
            {rolling ? '🎲 Rolling...' : '🎲 Roll Death Save'}
          </button>

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
      <div className="mt-4 p-3 bg-gold-primary bg-opacity-10 border-l-4 border-gold-primary rounded">
        <div className="text-gold-secondary text-sm">
          <strong>🔮 Periapt of Wound Closure:</strong> You automatically stabilize at 0 HP.
        </div>
      </div>
    </div>
  );
}
