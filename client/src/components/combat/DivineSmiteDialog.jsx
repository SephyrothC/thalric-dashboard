import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useDice } from '../../hooks/useDice';
import { toast } from '../../hooks/useToast';

export default function DivineSmiteDialog({ isOpen, onClose, weaponId }) {
  const { character } = useCharacterStore();
  const { rollDamage, rolling } = useDice();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isUndeadFiend, setIsUndeadFiend] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const spellcasting = character?.data?.spellcasting || {};
  const maxSlots = spellcasting.spell_slots || {};
  const currentSlots = spellcasting.spell_slots_current || {};

  // Combine into a usable format
  const spellSlots = {};
  Object.keys(maxSlots).forEach(level => {
    spellSlots[level] = {
      max: maxSlots[level],
      current: currentSlots[level]
    };
  });

  const weapon = character?.data?.weapons?.[weaponId] || {};

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

  if (!isOpen) return null;

  const handleSmite = async () => {
    if (!spellSlots[selectedLevel] || spellSlots[selectedLevel].current <= 0) {
      toast.error(`No Level ${selectedLevel} spell slots remaining!`);
      return;
    }

    try {
      await rollDamage(weaponId, isCritical, { 
        divineSmiteLevel: selectedLevel,
        isUndeadFiend 
      });
      toast.success(`Divine Smite used at Level ${selectedLevel}!`);
      onClose();
    } catch (error) {
      console.error('Smite failed:', error);
      toast.error('Failed to use Divine Smite');
    }
  };

  // Calculate damage dice for preview
  const baseDice = Math.min(2 + selectedLevel, 5);
  const totalDice = isUndeadFiend ? Math.min(baseDice + 1, 6) : baseDice;
  const diceString = `${totalDice}d8`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gold-primary">✨ Divine Smite</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-300">
          <p className="mb-2">
            Expend a spell slot to deal radiant damage in addition to your weapon's damage.
          </p>
          <div className="bg-dark-bg p-3 rounded border border-gold-primary/30">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-white">Weapon:</span>
              <span className="text-gold-secondary">{weapon.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Smite Damage:</span>
              <span className="text-gold-primary font-mono text-lg">{diceString}</span>
            </div>
          </div>
        </div>

        {/* Spell Slot Selection */}
        <div className="mb-6">
          <label className="block text-gold-secondary mb-2 font-semibold text-sm">Select Spell Slot Level:</label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(level => {
              const slot = spellSlots[level];
              const max = slot?.max || 0;
              const current = slot?.current || 0;
              const disabled = !slot || current === 0;

              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  disabled={disabled}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded border transition-all
                    ${selectedLevel === level 
                      ? 'bg-gold-primary text-black border-gold-primary' 
                      : 'bg-dark-bg text-gray-400 border-dark-border hover:border-gold-primary/50'}
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="font-bold text-lg">{level}</span>
                  <span className="text-xs">{current}/{max}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 bg-dark-bg rounded border border-dark-border cursor-pointer hover:border-gold-primary/50 transition-colors">
            <input
              type="checkbox"
              checked={isUndeadFiend}
              onChange={(e) => setIsUndeadFiend(e.target.checked)}
              className="w-5 h-5 text-gold-primary rounded focus:ring-gold-primary bg-dark-surface border-gray-600"
            />
            <div>
              <span className="block font-bold text-white">Target is Fiend or Undead</span>
              <span className="text-xs text-gray-400">Adds +1d8 damage (max 6d8)</span>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-dark-bg rounded border border-dark-border cursor-pointer hover:border-gold-primary/50 transition-colors">
            <input
              type="checkbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              className="w-5 h-5 text-gold-primary rounded focus:ring-gold-primary bg-dark-surface border-gray-600"
            />
            <div>
              <span className="block font-bold text-white">Critical Hit!</span>
              <span className="text-xs text-gray-400">Doubles all damage dice</span>
            </div>
          </label>
        </div>

        <button
          onClick={handleSmite}
          disabled={rolling}
          className="w-full py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold rounded-lg shadow-lg transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {rolling ? 'Rolling...' : '💥 SMITE!'}
        </button>
      </div>
    </div>
  );
}
