import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function LayOnHandsDialog({ isOpen, onClose }) {
  const { character, useFeature } = useCharacterStore();
  const [customAmount, setCustomAmount] = useState('');
  const [isHealing, setIsHealing] = useState(false);

  const data = character?.data || {};
  const layOnHands = data.features?.lay_on_hands || {};
  const pool = layOnHands.pool || 0;
  const maxPool = layOnHands.pool_max || 70;
  const stats = data.stats || {};
  const currentHP = stats.hp_current || 0;
  const maxHP = stats.hp_max || 117;
  const hpMissing = maxHP - currentHP;

  if (!isOpen) return null;

  const handleHeal = async (amount) => {
    if (amount > pool) {
      toast.error(`Not enough Lay on Hands pool! (${pool} remaining)`);
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsHealing(true);

    try {
      const response = await useFeature('lay_on_hands', { amount, action: 'heal' });

      if (response) {
        const actualHealing = Math.min(amount, hpMissing);
        toast.heal(`Healed ${actualHealing} HP! Lay on Hands: ${pool - amount}/${maxPool} remaining`, { duration: 4000 });
      }
    } catch (error) {
      console.error('Lay on Hands failed:', error);
      toast.error('Failed to use Lay on Hands');
    } finally {
      setIsHealing(false);
      setCustomAmount('');
    }
  };

  const handleCurePoison = async () => {
    if (pool < 5) {
      toast.error(`Not enough Lay on Hands pool! Need 5 HP, have ${pool}`);
      return;
    }

    setIsHealing(true);

    try {
      const response = await useFeature('lay_on_hands', { amount: 5, action: 'cure' });

      if (response) {
        toast.success(`Disease/Poison cured! Lay on Hands: ${pool - 5}/${maxPool} remaining`);
      }
    } catch (error) {
      console.error('Cure poison failed:', error);
      toast.error('Failed to cure disease/poison');
    } finally {
      setIsHealing(false);
    }
  };

  const quickAmounts = [5, 10, 20];
  const allAmount = Math.min(pool, hpMissing);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gold-primary">🙏 Lay on Hands</h3>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{pool}</div>
              <div className="text-sm text-gray-400">/ {maxPool} HP</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

      {/* Pool Bar */}
      <div className="mb-4">
        <div className="w-full h-4 bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
            style={{ width: `${(pool / maxPool) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 text-center mt-1">
          {Math.round((pool / maxPool) * 100)}% remaining
        </div>
      </div>

      {pool === 0 && (
        <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border-2 border-red-500 rounded-lg text-center">
          <div className="text-red-400 font-bold">⚠️ Pool Exhausted</div>
          <div className="text-red-300 text-sm mt-1">Recharges on Long Rest</div>
        </div>
      )}

      {/* HP Missing Info */}
      {hpMissing > 0 && (
        <div className="mb-4 p-3 bg-dark-bg rounded-lg flex justify-between items-center">
          <span className="text-gray-400">HP Missing:</span>
          <span className="text-red-400 font-bold">{hpMissing} HP</span>
        </div>
      )}

      {/* Quick Heal Buttons */}
      <div className="mb-4">
        <label className="block text-gold-secondary mb-2 font-semibold text-sm">Quick Heal:</label>
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => handleHeal(amount)}
              disabled={isHealing || pool < amount}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              +{amount}
            </button>
          ))}
          <button
            onClick={() => handleHeal(allAmount)}
            disabled={isHealing || pool === 0 || hpMissing === 0}
            className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            ALL ({allAmount})
          </button>
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-4">
        <label className="block text-gold-secondary mb-2 font-semibold text-sm">Custom Amount:</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max={pool}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={`1-${pool}`}
            disabled={isHealing || pool === 0}
            className="flex-1 px-4 py-2 bg-dark-bg border-2 border-gold-primary rounded-lg text-white font-bold text-center disabled:opacity-50"
          />
          <button
            onClick={() => handleHeal(parseInt(customAmount) || 0)}
            disabled={isHealing || !customAmount || parseInt(customAmount) > pool || parseInt(customAmount) <= 0}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Heal
          </button>
        </div>
      </div>

      {/* Cure Disease/Poison */}
      <button
        onClick={handleCurePoison}
        disabled={isHealing || pool < 5}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        🧪 Cure Disease/Poison (-5 HP)
      </button>

      {/* Rules */}
      <div className="mt-4 p-3 bg-dark-bg rounded text-xs text-gray-400">
        <strong className="text-gold-secondary">Rules:</strong>
        <ul className="mt-1 ml-4 space-y-1">
          <li>• <strong>Action</strong> (full action, not bonus)</li>
          <li>• Touch yourself or an ally</li>
          <li>• Cannot exceed target's max HP</li>
          <li>• Doesn't work on undead/constructs</li>
          <li>• Recharges on <strong>Long Rest</strong> only</li>
        </ul>
      </div>
      </div>
    </div>
  );
}
