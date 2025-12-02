import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import ConcentrationBar from './ConcentrationBar';

export default function TurnCounter() {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();
  const [round, setRound] = useState(1);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (character?.current_round) {
      setRound(character.current_round);
    }
  }, [character]);

  useEffect(() => {
    if (!socket) return;

    const handleRoundAdvanced = (data) => {
      setRound(data.round);
      fetchCharacter(); // Refresh to get updated conditions/concentration
    };

    socket.on('round_advanced', handleRoundAdvanced);
    return () => {
      socket.off('round_advanced', handleRoundAdvanced);
    };
  }, [socket, fetchCharacter]);

  const handleNextRound = async () => {
    try {
      // Advance round (increments counter)
      await fetch('/api/combat/next-round', { method: 'POST' });
      
      // Advance turn (ticks effects/conditions)
      await fetch('/api/combat/next-turn', { method: 'POST' });
    } catch (error) {
      console.error('Failed to advance round:', error);
    }
  };

  const handleResetRound = async () => {
    try {
      await fetch('/api/combat/reset-round', { method: 'POST' });
      setShowResetConfirm(false);
    } catch (error) {
      console.error('Failed to reset round:', error);
    }
  };

  // Calculate time: 1 Round = 1 Minute (User Request)
  // Standard D&D is 6 seconds, but user asked for 1 min.
  const timeElapsed = (round - 1) * 1; 

  return (
    <>
      <div className="w-full bg-dark-surface border-b border-dark-border p-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-center relative group cursor-pointer" 
            onClick={() => setShowResetConfirm(true)} 
            title="Click to Reset"
          >
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Round</div>
            <div className="text-xl font-bold text-gold-primary font-display">{round}</div>
            <div className="absolute inset-0 flex items-center justify-center bg-dark-bg/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <span className="text-xs text-red-400 font-bold">Reset</span>
            </div>
          </div>
          
          {/* Time Display */}
          <div className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-center min-w-[80px]">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Time</div>
            <div className="text-xl font-bold text-white font-display">
              {timeElapsed} <span className="text-xs text-gray-500 font-sans">min</span>
            </div>
          </div>

          <div className="text-gray-400 text-xs hidden sm:block">
            <p>1 Round = 1 Minute</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Concentration Indicator (compact) */}
          <ConcentrationBar compact={true} />
          
          <button 
            onClick={handleNextRound}
            className="px-3 py-1 bg-gold-primary hover:bg-gold-secondary text-dark-bg rounded-lg text-xs font-bold transition-colors shadow-glow flex items-center gap-2"
          >
            Next Round ➡️
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-surface border-2 border-red-500 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-[shake_0.3s_ease-in-out]">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚔️</div>
              <h3 className="text-xl font-bold text-white mb-2">Nouveau Combat ?</h3>
              <p className="text-gray-400 text-sm">
                Remettre le compteur à <span className="text-gold-primary font-bold">Round 1</span> ?
              </p>
            </div>
            
            <div className="bg-dark-bg rounded-lg p-3 mb-4 text-center">
              <div className="text-gray-500 text-xs uppercase mb-1">Round actuel</div>
              <div className="text-3xl font-bold text-red-400">{round}</div>
              <div className="text-gray-500 text-xs mt-1">→ sera remis à 1</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleResetRound}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
