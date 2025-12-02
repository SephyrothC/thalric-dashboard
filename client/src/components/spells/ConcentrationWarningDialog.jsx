import { useEffect } from 'react';

export default function ConcentrationWarningDialog({ 
  isOpen, 
  onClose, 
  currentSpell, 
  newSpell, 
  onConfirm, 
  onCancel 
}) {
  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
      <div className="bg-dark-medium border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full animate-shake">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">⚠️</span>
          <div>
            <h3 className="text-2xl font-bold text-yellow-400">Concentration Active!</h3>
            <p className="text-sm text-gray-400">Tu te concentres déjà sur un sort</p>
          </div>
        </div>

        {/* Current Concentration */}
        <div className="mb-4 p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
          <div className="text-xs text-purple-300 uppercase font-bold mb-1">Sort Actuel</div>
          <div className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🧠</span>
            {currentSpell}
          </div>
        </div>

        {/* Warning Text */}
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>Règle D&D :</strong> Tu ne peux te concentrer que sur <strong>un seul sort</strong> à la fois.
          </p>
          <p className="text-gray-300 text-sm mt-2">
            Si tu lances <strong className="text-gold-primary">{newSpell}</strong>, ta concentration sur <strong className="text-purple-400">{currentSpell}</strong> sera <span className="text-red-400">immédiatement brisée</span>.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span> Changer de Sort
          </button>
        </div>
      </div>
    </div>
  );
}
