import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

export default function CombatTracker() {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();
  const [rollingInitiative, setRollingInitiative] = useState(false);

  const data = character?.data || {};
  const stats = data.stats || {};
  const in_combat = stats.in_combat || 0;
  const current_round = stats.current_round || 0;
  const initiative = stats.initiative || 0;
  const reaction_used = stats.reaction_used || 0;

  const rollInitiative = async () => {
    setRollingInitiative(true);

    try {
      // Roll with advantage (Sentinel Shield)
      const roll1 = Math.floor(Math.random() * 20) + 1;
      const roll2 = Math.floor(Math.random() * 20) + 1;
      const roll = Math.max(roll1, roll2);
      const total = roll + 0; // Thalric has +0 DEX

      await fetch('/api/combat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initiative_roll: total })
      });

      // Broadcast to viewers
      if (socket) {
        socket.emit('dice_roll', {
          type: 'initiative',
          roll1,
          roll2,
          result: roll,
          total,
          advantage: true,
          rollType: 'Initiative',
          formula: `1d20+0 (Advantage)`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      toast.dice(`Initiative: ${total} (rolled ${roll1}, ${roll2})`);
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to roll initiative:', error);
      toast.error('Failed to roll initiative');
    } finally {
      setRollingInitiative(false);
    }
  };

  const nextTurn = async () => {
    try {
      await fetch('/api/combat/next-turn', { method: 'POST' });
      toast.info('Turn advanced - Reaction refreshed');
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to advance turn:', error);
      toast.error('Failed to advance turn');
    }
  };

  const nextRound = async () => {
    try {
      await fetch('/api/combat/next-round', { method: 'POST' });
      toast.info(`Round ${current_round + 1} started`);
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to advance round:', error);
      toast.error('Failed to advance round');
    }
  };

  const endCombat = async () => {
    if (confirm('End combat?')) {
      try {
        await fetch('/api/combat/end', { method: 'POST' });
        toast.success('Combat ended');
        await fetchCharacter();
      } catch (error) {
        console.error('Failed to end combat:', error);
        toast.error('Failed to end combat');
      }
    }
  };

  const toggleReaction = async () => {
    try {
      await fetch('/api/combat/reaction/toggle', { method: 'POST' });
      const newState = reaction_used === 1 ? 0 : 1;
      toast.info(newState ? 'Reaction used' : 'Reaction available');
      await fetchCharacter();
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      toast.error('Failed to toggle reaction');
    }
  };

  if (!in_combat) {
    return (
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gold-primary mb-4">⚔️ Combat Tracker</h3>
        <button
          className="w-full py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={rollInitiative}
          disabled={rollingInitiative}
        >
          {rollingInitiative ? '🎲 Rolling...' : '⚔️ Roll Initiative (Advantage)'}
        </button>
        <div className="mt-3 text-sm text-gray-400 text-center">
          Sentinel Shield grants advantage on initiative rolls
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-medium border-2 border-red-500 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-red-400">⚔️ COMBAT ACTIVE</h3>
          <div className="flex gap-4 mt-2">
            <div>
              <span className="text-gray-400 text-sm">Round:</span>
              <span className="ml-2 text-2xl font-bold text-white">{current_round}</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Initiative:</span>
              <span className="ml-2 text-2xl font-bold text-gold-primary">{initiative}</span>
            </div>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded transition-colors"
          onClick={endCombat}
        >
          End Combat
        </button>
      </div>

      {/* Combat controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          onClick={nextTurn}
        >
          ⏭️ Next Turn
        </button>
        <button
          className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
          onClick={nextRound}
        >
          🔄 Next Round
        </button>
      </div>

      {/* Reaction tracker */}
      <button
        className={`w-full px-4 py-3 font-bold rounded-lg transition-all duration-200 transform hover:scale-105 ${
          reaction_used
            ? 'bg-gray-600 text-gray-400'
            : 'bg-yellow-600 hover:bg-yellow-700 text-white animate-pulse'
        }`}
        onClick={toggleReaction}
      >
        {reaction_used ? '⚡ Reaction Used' : '⚡ Reaction Available'}
      </button>

      {/* Combat reminders */}
      <div className="mt-4 p-3 bg-dark-bg rounded text-xs text-gray-400">
        <div className="font-semibold text-gold-secondary mb-2">Combat Actions:</div>
        <ul className="space-y-1 ml-4">
          <li>• <strong>Action:</strong> Attack, Cast Spell, Dash, etc.</li>
          <li>• <strong>Bonus Action:</strong> Divine Smite, Radiant Soul, etc.</li>
          <li>• <strong>Reaction:</strong> Opportunity Attack, Shield of Faith</li>
          <li>• <strong>Movement:</strong> 30 ft (60 ft with Radiant Soul fly)</li>
        </ul>
      </div>
    </div>
  );
}
