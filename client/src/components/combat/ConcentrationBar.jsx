import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

export default function ConcentrationBar({ compact = false }) {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();

  // Get concentration data from character root (not data object)
  const concentration_spell = character?.concentration_spell;
  const concentration_duration = character?.concentration_duration;
  const concentration_rounds_left = character?.concentration_rounds_left;

  useEffect(() => {
    if (!socket) return;

    socket.on('concentration_ended', () => {
      fetchCharacter();
    });

    socket.on('concentration_started', () => {
      fetchCharacter();
    });

    return () => {
      socket.off('concentration_ended');
      socket.off('concentration_started');
    };
  }, [socket, fetchCharacter]);

  const endConcentration = async () => {
    try {
      await fetch('/api/combat/concentration/end', { method: 'DELETE' });
      
      // Also remove the condition
      await fetch(`/api/combat/conditions/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: concentration_spell })
      });
      
      toast.info(`Concentration sur ${concentration_spell} terminée`);
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to end concentration:', error);
      toast.error('Failed to end concentration');
    }
  };

  if (!concentration_spell) return null;

  // Compact mode for TurnCounter
  if (compact) {
    return (
      <div 
        className="flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/50 rounded-lg cursor-pointer hover:bg-purple-900/50 transition-colors"
        onClick={endConcentration}
        title={`Concentration: ${concentration_spell} (${concentration_rounds_left}r) - Click to end`}
      >
        <span className="text-lg animate-pulse">🧠</span>
        <span className="text-sm font-bold text-purple-300 hidden sm:inline">{concentration_spell}</span>
        {concentration_duration && (
          <span className="text-xs text-purple-400">{concentration_rounds_left}r</span>
        )}
      </div>
    );
  }

  // Full mode (not used anymore but kept for compatibility)
  return null;
}
