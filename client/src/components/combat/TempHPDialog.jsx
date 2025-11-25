import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { X } from 'lucide-react';

/**
 * Temporary HP Dialog Component
 * Allows adding, removing, and managing temporary hit points
 *
 * Rules:
 * - Temp HP doesn't stack (new value replaces old if higher)
 * - Temp HP is lost first before regular HP
 * - Temp HP doesn't heal, it's a separate buffer
 */

export default function TempHPDialog({ isOpen, onClose }) {
  const { character, updateHP } = useCharacterStore();
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const stats = character?.data?.stats || {};
  const currentTempHP = stats.temp_hp || 0;

  // Add temp HP (replaces if new amount is higher)
  const handleAddTempHP = async (amount) => {
    if (!amount || amount <= 0) {
      setError('Le montant doit être supérieur à 0');
      return;
    }

    try {
      // Per D&D 5e rules: temp HP doesn't stack, use the higher value
      const newTempHP = Math.max(currentTempHP, amount);
      await updateHP(stats.hp_current, newTempHP);

      if (newTempHP === currentTempHP && amount < currentTempHP) {
        setError(`Temp HP actuels (${currentTempHP}) sont plus élevés`);
      } else {
        setError('');
        setCustomAmount('');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour des temp HP');
      console.error('Failed to add temp HP:', err);
    }
  };

  // Remove all temp HP
  const handleRemoveTempHP = async () => {
    try {
      await updateHP(stats.hp_current, 0);
      setError('');
      setCustomAmount('');
    } catch (err) {
      setError('Erreur lors de la suppression des temp HP');
      console.error('Failed to remove temp HP:', err);
    }
  };

  // Quick add buttons
  const quickAmounts = [5, 10, 15, 20];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg shadow-xl max-w-md w-full p-6 border-2 border-gold-primary">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gold-primary">🛡️ Temporary HP</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Temp HP Display */}
        <div className="bg-dark-bg rounded-lg p-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">Temp HP actuels</div>
            <div className="text-4xl font-bold text-blue-400">{currentTempHP}</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-300">
            ℹ️ Les Temp HP ne se cumulent pas. Si vous ajoutez des Temp HP inférieurs à ceux actuels, ils seront ignorés.
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Ajouter rapidement</label>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => handleAddTempHP(amount)}
                className="btn-secondary py-2 text-lg font-bold"
              >
                +{amount}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Montant personnalisé</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setError('');
              }}
              placeholder="Ex: 25"
              className="input-field flex-1"
            />
            <button
              onClick={() => handleAddTempHP(parseInt(customAmount))}
              disabled={!customAmount || parseInt(customAmount) <= 0}
              className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Remove Temp HP Button */}
        {currentTempHP > 0 && (
          <div className="mb-4">
            <button
              onClick={handleRemoveTempHP}
              className="w-full btn-secondary text-red-400 hover:bg-red-900/20"
            >
              🗑️ Retirer tous les Temp HP
            </button>
          </div>
        )}

        {/* Rules Reference */}
        <div className="bg-dark-bg rounded-lg p-3 text-xs text-gray-400">
          <div className="font-bold text-gold-secondary mb-2">Règles D&D 5e:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Les Temp HP ne se cumulent pas (prendre le plus élevé)</li>
            <li>Les Temp HP sont perdus en premier avant les HP normaux</li>
            <li>Les Temp HP ne peuvent pas être soignés</li>
            <li>Les Temp HP disparaissent après un repos long</li>
          </ul>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full btn-primary mt-4"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
