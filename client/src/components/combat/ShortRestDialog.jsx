import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function ShortRestDialog({ isOpen, onClose }) {
  const { character, fetchCharacter } = useCharacterStore();
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const data = character?.data || {};
  const stats = data.stats || {};
  const level = data.character_info?.level || 14;
  const conMod = Math.floor((stats.constitution - 10) / 2);
  const currentHP = stats.hp_current || 0;
  const maxHP = stats.hp_max || 117;
  const hpMissing = maxHP - currentHP;

  if (!isOpen) return null;

  const handleShortRest = async () => {
    setIsResting(true);

    try {
      const response = await fetch('/api/character/rest/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hit_dice_spent: hitDiceToSpend })
      });

      const result = await response.json();

      if (result.success) {
        // Show healing details
        if (result.healing.total > 0) {
          const rollsText = result.healing.rolls
            .map(r => `${r.roll}+${conMod}=${r.healing}`)
            .join(', ');
          toast.heal(`Healed ${result.healing.total} HP! (${rollsText})`, { duration: 5000 });
        }

        // Show restored features
        result.restored.forEach(feature => {
          if (feature.includes('Channel Divinity')) {
            toast.success('Channel Divinity restored!');
          }
        });

        toast.success('Short rest completed! (1 hour)');
        await fetchCharacter();
        onClose();
      } else {
        toast.error('Failed to complete short rest');
      }
    } catch (error) {
      console.error('Short rest failed:', error);
      toast.error('Failed to complete short rest');
    } finally {
      setIsResting(false);
    }
  };

  const estimatedHealing = hitDiceToSpend > 0
    ? `≈ ${hitDiceToSpend * (5.5 + conMod)} HP avg`
    : '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gold-primary">⏱️ Short Rest</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Rest Info */}
        <div className="mb-4 p-3 bg-dark-bg rounded-lg">
          <div className="text-sm text-gray-300 space-y-1">
            <div>⏱️ <strong>Duration:</strong> 1 hour</div>
            <div>❤️ <strong>HP Missing:</strong> {hpMissing} HP</div>
          </div>
        </div>

        {/* Hit Dice Section */}
        <div className="mb-6">
          <label className="block text-gold-secondary mb-2 font-semibold">
            💎 Spend Hit Dice (1d10 + {conMod} each)
          </label>

          <div className="flex items-center gap-3 mb-2">
            <input
              type="number"
              min="0"
              max={level}
              value={hitDiceToSpend}
              onChange={(e) => setHitDiceToSpend(Math.min(level, Math.max(0, parseInt(e.target.value) || 0)))}
              className="flex-1 px-4 py-2 bg-dark-bg border-2 border-gold-primary rounded-lg text-white text-lg font-bold text-center"
            />
            <span className="text-gray-400">/ {level}</span>
          </div>

          {hitDiceToSpend > 0 && (
            <div className="text-sm text-green-400 font-semibold">
              {estimatedHealing}
            </div>
          )}

          {/* Quick buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setHitDiceToSpend(Math.ceil(hpMissing / (5.5 + conMod)))}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
            >
              Full Heal
            </button>
            <button
              onClick={() => setHitDiceToSpend(Math.floor(level / 2))}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
            >
              Half ({Math.floor(level / 2)})
            </button>
            <button
              onClick={() => setHitDiceToSpend(0)}
              className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded transition-colors"
            >
              None
            </button>
          </div>
        </div>

        {/* Features to Restore */}
        <div className="mb-6 p-4 bg-dark-bg rounded-lg">
          <h4 className="text-gold-secondary font-semibold mb-2">✅ Features Restored:</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>• <strong className="text-white">Channel Divinity</strong> → 2 uses</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            disabled={isResting}
          >
            Cancel
          </button>
          <button
            onClick={handleShortRest}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isResting}
          >
            {isResting ? 'Resting...' : '⏱️ Complete Rest'}
          </button>
        </div>

        {/* Rules reminder */}
        <div className="mt-4 p-3 bg-dark-bg rounded text-xs text-gray-400">
          <strong className="text-gold-secondary">Short Rest Rules:</strong>
          <ul className="mt-1 ml-4 space-y-1">
            <li>• Spend Hit Dice to heal</li>
            <li>• Channel Divinity restored</li>
            <li>• Spell slots NOT restored</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
