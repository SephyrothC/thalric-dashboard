import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

export default function ConcentrationBar() {
  const { character, fetchCharacter } = useCharacterStore();
  const { socket } = useSocket();
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [saveDC, setSaveDC] = useState(10);

  const data = character?.data || {};
  const stats = data.stats || {};
  const concentration_spell = stats.concentration_spell;
  const concentration_duration = stats.concentration_duration;
  const concentration_rounds_left = stats.concentration_rounds_left;
  const concentration_dc = stats.concentration_dc || 10;

  useEffect(() => {
    if (!socket) return;

    socket.on('concentration_ended', () => {
      fetchCharacter();
    });

    return () => {
      socket.off('concentration_ended');
    };
  }, [socket, fetchCharacter]);

  const endConcentration = async () => {
    if (confirm(`End concentration on ${concentration_spell}?`)) {
      try {
        await fetch('/api/combat/concentration/end', { method: 'DELETE' });
        toast.info(`Concentration on ${concentration_spell} ended`);
        await fetchCharacter();
      } catch (error) {
        console.error('Failed to end concentration:', error);
        toast.error('Failed to end concentration');
      }
    }
  };

  const takeDamage = async () => {
    const damage = prompt('How much damage did you take?');
    if (damage && !isNaN(damage)) {
      try {
        const response = await fetch('/api/combat/concentration/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ damage: parseInt(damage) })
        });
        const data = await response.json();
        setSaveDC(data.dc);
        setShowSavePrompt(true);
        toast.warning(`Constitution save DC ${data.dc} required!`);
      } catch (error) {
        console.error('Failed to calculate save DC:', error);
        toast.error('Failed to calculate save DC');
      }
    }
  };

  const rollSave = async (success) => {
    if (!success) {
      toast.error(`Lost concentration on ${concentration_spell}!`, { icon: '💥' });
      await fetch('/api/combat/concentration/end', { method: 'DELETE' });
      await fetchCharacter();
    } else {
      toast.success('Maintained concentration!');
    }
    setShowSavePrompt(false);
  };

  if (!concentration_spell) return null;

  const percentageLeft = concentration_duration > 0
    ? (concentration_rounds_left / concentration_duration) * 100
    : 0;

  return (
    <div className="bg-dark-medium border-2 border-purple-500 rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <div>
            <div className="text-lg font-bold text-purple-300">{concentration_spell}</div>
            <div className="text-sm text-gray-400">
              {concentration_rounds_left} / {concentration_duration} rounds
            </div>
          </div>
        </div>
        <button
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
          onClick={endConcentration}
        >
          End
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
          style={{ width: `${percentageLeft}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition-colors"
          onClick={takeDamage}
        >
          💥 Took Damage
        </button>
      </div>

      {/* Save prompt modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-2xl font-bold text-gold-primary mb-4">
              ⚠️ Concentration Save Required
            </h4>
            <p className="text-white text-lg mb-6">
              Roll Constitution save <strong className="text-gold-secondary">DC {saveDC}</strong>
            </p>
            <div className="text-sm text-gray-400 mb-6">
              Your Constitution save bonus: <strong>+{data.saving_throws?.constitution || 0}</strong>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => rollSave(true)}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
              >
                ✓ Passed
              </button>
              <button
                onClick={() => rollSave(false)}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                ✗ Failed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules reminder */}
      <div className="mt-3 p-3 bg-dark-bg rounded text-xs text-gray-400">
        <div className="font-semibold text-purple-300 mb-1">⚠️ Concentration ends if you:</div>
        <ul className="space-y-1 ml-4">
          <li>• Cast another concentration spell</li>
          <li>• Are incapacitated or killed</li>
          <li>• Fail Constitution save when damaged</li>
        </ul>
      </div>
    </div>
  );
}
