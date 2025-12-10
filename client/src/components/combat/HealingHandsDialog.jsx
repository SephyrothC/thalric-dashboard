import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function HealingHandsDialog({ isOpen, onClose }) {
  const { character, useFeature, updateHP } = useCharacterStore();
  const [isHealing, setIsHealing] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  const data = character?.data || {};
  const healingHands = data.features?.healing_hands || {};
  const uses = healingHands.uses ?? 1;
  const usesMax = healingHands.uses_max ?? 1;
  
  // Get healing amount - can be a number (level) or dice string (e.g., "15d4")
  const healingValue = healingHands.healing;
  const level = data.character_info?.level || 15;
  
  // Determine if we're using fixed healing (number) or dice
  const isFixedHealing = typeof healingValue === 'number';
  const healingAmount = isFixedHealing ? healingValue : level;
  
  // For dice-based healing (legacy support)
  const diceMatch = typeof healingValue === 'string' ? healingValue.match(/(\d+)d4/) : null;
  const diceCount = diceMatch ? parseInt(diceMatch[1]) : level;
  
  const stats = data.stats || {};
  const currentHP = stats.hp_current || 0;
  const maxHP = stats.hp_max || 124;
  const hpMissing = maxHP - currentHP;

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset roll result when dialog opens
  useEffect(() => {
    if (isOpen) {
      setRollResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rollDice = () => {
    // For fixed healing, just return the amount
    if (isFixedHealing) {
      return { rolls: [healingAmount], total: healingAmount };
    }
    // Roll Xd4 where X = level (legacy dice support)
    const rolls = [];
    for (let i = 0; i < diceCount; i++) {
      rolls.push(Math.floor(Math.random() * 4) + 1);
    }
    const total = rolls.reduce((a, b) => a + b, 0);
    return { rolls, total };
  };

  const handleHeal = async () => {
    if (uses <= 0) {
      toast.error('Healing Hands already used! Recharges on Long Rest.');
      return;
    }

    setIsHealing(true);

    try {
      // Roll the dice
      const { rolls, total } = rollDice();
      setRollResult({ rolls, total });

      // Calculate actual healing (can't exceed missing HP)
      const actualHealing = Math.min(total, hpMissing);

      // Update HP
      const newHP = Math.min(currentHP + actualHealing, maxHP);
      await updateHP(newHP, stats.temp_hp);

      // Use the feature (decrement uses)
      await useFeature('healing_hands', { amount: actualHealing });

      // Show toast with roll details
      const rollDetails = isFixedHealing 
        ? `${total} HP`
        : `${rolls.join('+')} = ${total} HP`;
      toast.heal(
        `✋ Healing Hands: ${rollDetails}! (Healed ${actualHealing})`,
        { duration: 5000 }
      );

    } catch (error) {
      console.error('Healing Hands failed:', error);
      toast.error('Failed to use Healing Hands');
    } finally {
      setIsHealing(false);
    }
  };

  const handleClose = () => {
    setRollResult(null);
    onClose();
  };

  // Calculate average and range (for dice-based healing)
  const minRoll = isFixedHealing ? healingAmount : diceCount;
  const maxRoll = isFixedHealing ? healingAmount : diceCount * 4;
  const avgRoll = isFixedHealing ? healingAmount : diceCount * 2.5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">✋</span>
            <div>
              <h3 className="text-2xl font-bold text-gold-primary">Healing Hands</h3>
              <p className="text-sm text-gray-400">Aasimar Racial Trait</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Uses Indicator */}
        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: usesMax }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                i < uses
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-dark-bg shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                  : 'bg-dark-bg border-2 border-gray-600 text-gray-600'
              }`}
            >
              {i < uses ? '✓' : '✗'}
            </div>
          ))}
          <span className="ml-2 text-gray-400 text-sm">
            {uses}/{usesMax} uses
          </span>
        </div>

        {uses === 0 && (
          <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border-2 border-red-500 rounded-lg text-center">
            <div className="text-red-400 font-bold">⚠️ Already Used</div>
            <div className="text-red-300 text-sm mt-1">Recharges on Long Rest</div>
          </div>
        )}

        {/* Healing Info */}
        <div className="mb-4 p-4 bg-dark-bg rounded-lg text-center">
          <div className="text-sm text-gray-400 mb-1">
            {isFixedHealing ? 'Healing Amount' : 'Healing Roll'}
          </div>
          <div className="text-3xl font-bold text-gold-primary">
            {isFixedHealing ? `${healingAmount} HP` : `${diceCount}d4`}
          </div>
          {!isFixedHealing && (
            <div className="text-xs text-gray-500 mt-1">
              Range: {minRoll} - {maxRoll} (avg: {avgRoll})
            </div>
          )}
          {isFixedHealing && (
            <div className="text-xs text-gray-500 mt-1">
              Equal to your level
            </div>
          )}
        </div>

        {/* HP Missing Info */}
        {hpMissing > 0 && (
          <div className="mb-4 p-3 bg-dark-bg rounded-lg flex justify-between items-center">
            <span className="text-gray-400">HP Missing:</span>
            <span className="text-red-400 font-bold">{hpMissing} HP</span>
          </div>
        )}

        {hpMissing === 0 && (
          <div className="mb-4 p-3 bg-green-600 bg-opacity-20 border border-green-500 rounded-lg text-center">
            <span className="text-green-400 font-bold">Already at full HP!</span>
          </div>
        )}

        {/* Roll Result */}
        {rollResult && (
          <div className="mb-4 p-4 bg-green-900/30 border-2 border-green-500 rounded-lg text-center animate-pulse">
            <div className="text-sm text-green-400 mb-1">
              {isFixedHealing ? 'Healing Applied' : 'Roll Result'}
            </div>
            {!isFixedHealing && (
              <div className="flex items-center justify-center gap-2 mb-2">
                {rollResult.rolls.map((roll, i) => (
                  <span 
                    key={i} 
                    className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                      roll === 4 ? 'bg-green-500 text-white' : 'bg-dark-bg text-gray-300'
                    }`}
                  >
                    {roll}
                  </span>
                ))}
              </div>
            )}
            <div className="text-3xl font-bold text-green-400">
              {rollResult.total} HP
            </div>
          </div>
        )}

        {/* Heal Button */}
        <button
          onClick={handleHeal}
          disabled={isHealing || uses <= 0 || hpMissing === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-dark-bg font-bold text-xl rounded-lg transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
        >
          {isHealing ? '✨ Healing...' : rollResult ? '✓ Done!' : isFixedHealing ? `✋ Heal ${healingAmount} HP` : `✋ Roll ${diceCount}d4 Healing`}
        </button>

        {rollResult && (
          <button
            onClick={handleClose}
            className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        )}

        {/* Rules */}
        <div className="mt-4 p-3 bg-dark-bg rounded text-xs text-gray-400">
          <strong className="text-gold-secondary">Healing Hands (Aasimar):</strong>
          <ul className="mt-1 ml-4 space-y-1">
            <li>• <strong>Action</strong> to use</li>
            <li>• Touch yourself or another creature</li>
            <li>• Roll {diceCount}d4 (= your level)</li>
            <li>• Target regains HP equal to total</li>
            <li>• Recharges on <strong>Long Rest</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
