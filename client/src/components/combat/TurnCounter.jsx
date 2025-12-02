import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';

export default function TurnCounter() {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();
  const [round, setRound] = useState(1);

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
    if (!confirm('Reset round counter to 1?')) return;
    try {
      await fetch('/api/combat/reset-round', { method: 'POST' });
    } catch (error) {
      console.error('Failed to reset round:', error);
    }
  };

  // Calculate time: 1 Round = 1 Minute (User Request)
  // Standard D&D is 6 seconds, but user asked for 1 min.
  const timeElapsed = (round - 1) * 1; 

  return (
    <div className="w-full bg-dark-surface border-b border-dark-border p-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1 text-center relative group cursor-pointer" onClick={handleResetRound} title="Click to Reset">
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

      <div className="flex gap-2">
        <button 
          onClick={handleNextRound}
          className="px-3 py-1 bg-gold-primary hover:bg-gold-secondary text-dark-bg rounded-lg text-xs font-bold transition-colors shadow-glow flex items-center gap-2"
        >
          Next Round ➡️
        </button>
      </div>
    </div>
  );
}
