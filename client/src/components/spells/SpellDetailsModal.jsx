import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import ConcentrationWarningDialog from './ConcentrationWarningDialog';
import { toast } from '../../hooks/useToast';

export default function SpellDetailsModal({ spell, onClose, onCast }) {
  const { character, fetchCharacter } = useCharacterStore();
  const [showConcentrationWarning, setShowConcentrationWarning] = useState(false);
  const [casting, setCasting] = useState(false);

  const isConcentration = spell?.duration?.toLowerCase().includes('concentration');
  const currentConcentration = character?.concentration_spell;

  // Close modal on Escape key - MUST be before any conditional return
  useEffect(() => {
    if (!spell) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !showConcentrationWarning) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [spell, onClose, showConcentrationWarning]);

  // Early return AFTER all hooks
  if (!spell) return null;

  const getDurationText = (duration) => {
    if (duration && duration.toLowerCase().includes('concentration')) {
      return (
        <span className="flex items-center gap-2">
          <span className="text-purple-400">🧠</span>
          <span className="text-purple-300">{duration}</span>
        </span>
      );
    }
    return duration;
  };

  const handleCastClick = () => {
    // Check if this is a concentration spell and we're already concentrating
    if (isConcentration && currentConcentration) {
      setShowConcentrationWarning(true);
    } else {
      executeCast();
    }
  };

  const executeCast = async () => {
    setCasting(true);
    try {
      if (onCast) {
        await onCast({
          ...spell,
          concentration: isConcentration
        });
      }
      
      if (isConcentration) {
        toast.info(`🧠 Concentration: ${spell.name}`);
      }
      
      await fetchCharacter();
      onClose();
    } catch (error) {
      console.error('Cast failed:', error);
      toast.error('Failed to cast spell');
    } finally {
      setCasting(false);
    }
  };

  const handleConcentrationConfirm = async () => {
    setShowConcentrationWarning(false);
    toast.warning(`💔 Concentration sur ${currentConcentration} brisée!`);
    await executeCast();
  };

  const handleConcentrationCancel = () => {
    setShowConcentrationWarning(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-dark-medium to-dark-light border-b-2 border-gold-primary p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gold-primary mb-2">{spell.name}</h2>
              <div className="flex gap-3 text-sm">
                <span className="px-3 py-1 bg-gold-primary text-dark-bg font-bold rounded">
                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                </span>
                <span className="px-3 py-1 bg-dark-bg text-gold-secondary border border-gold-primary rounded capitalize">
                  {spell.school}
                </span>
                {spell.ritual && (
                  <span className="px-3 py-1 bg-purple-600 text-white rounded">
                    ⭐ Ritual
                  </span>
                )}
                {spell.always_prepared && (
                  <span className="px-3 py-1 bg-blue-600 text-white rounded">
                    🛡️ Oath Spell
                  </span>
                )}
              </div>
            </div>
            <button
              className="text-3xl text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-bg p-4 rounded-lg">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Casting Time</label>
              <div className="text-lg text-white font-semibold">{spell.casting_time}</div>
            </div>
            <div className="bg-dark-bg p-4 rounded-lg">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Range</label>
              <div className="text-lg text-white font-semibold">{spell.range}</div>
            </div>
            <div className="bg-dark-bg p-4 rounded-lg">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Duration</label>
              <div className="text-lg text-white font-semibold">{getDurationText(spell.duration)}</div>
            </div>
            <div className="bg-dark-bg p-4 rounded-lg">
              <label className="text-xs text-gray-400 uppercase tracking-wide">Components</label>
              <div className="text-lg text-white font-semibold">{spell.components}</div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-xl font-bold text-gold-secondary mb-3">Description</h4>
            <p className="text-gray-300 leading-relaxed">{spell.description}</p>
          </div>

          {/* Higher levels */}
          {spell.higher_levels && (
            <div className="mb-6 bg-dark-bg p-4 rounded-lg border-l-4 border-gold-primary">
              <h4 className="text-lg font-bold text-gold-secondary mb-2">At Higher Levels</h4>
              <p className="text-gray-300">{spell.higher_levels}</p>
            </div>
          )}

          {/* Save type */}
          {spell.save_type && (
            <div className="mb-6 bg-red-900 bg-opacity-30 p-4 rounded-lg border-l-4 border-red-500">
              <h4 className="text-lg font-bold text-red-400 mb-2">Saving Throw</h4>
              <p className="text-white text-lg">
                <strong>{spell.save_type} DC 18</strong>
              </p>
            </div>
          )}

          {/* Damage */}
          {spell.damage && (
            <div className="mb-6 bg-orange-900 bg-opacity-30 p-4 rounded-lg border-l-4 border-orange-500">
              <h4 className="text-lg font-bold text-orange-400 mb-2">Damage</h4>
              <p className="text-white text-lg">
                <strong>{spell.damage}</strong> {spell.damage_type}
              </p>
            </div>
          )}

          {/* Source */}
          {spell.source && (
            <div className="text-sm text-gray-500 italic">
              Source: {spell.source}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-medium border-t-2 border-gold-primary p-6">
          {/* Concentration Warning Banner */}
          {isConcentration && currentConcentration && (
            <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-500/50 rounded-lg flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="text-yellow-200 text-sm font-semibold">Attention: Sort de Concentration</p>
                <p className="text-yellow-100/70 text-xs">
                  Tu te concentres sur <strong>{currentConcentration}</strong>. Lancer ce sort brisera ta concentration.
                </p>
              </div>
            </div>
          )}
          
          {/* Concentration Info for new concentration spells */}
          {isConcentration && !currentConcentration && (
            <div className="mb-4 p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div className="flex-1">
                <p className="text-purple-200 text-sm font-semibold">Sort de Concentration</p>
                <p className="text-purple-100/70 text-xs">
                  Ce sort nécessite de maintenir ta concentration. Subir des dégâts peut la briser.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            {spell.level > 0 && (
              <button
                className={`flex-1 px-6 py-3 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  isConcentration 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                }`}
                onClick={handleCastClick}
                disabled={casting}
              >
                {casting ? '✨ Casting...' : isConcentration ? '🧠 Cast (Concentration)' : '✨ Cast Spell'}
              </button>
            )}
            <button
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Concentration Warning Dialog */}
      <ConcentrationWarningDialog
        isOpen={showConcentrationWarning}
        currentSpell={currentConcentration}
        newSpell={spell.name}
        onConfirm={handleConcentrationConfirm}
        onCancel={handleConcentrationCancel}
        onClose={handleConcentrationCancel}
      />
    </div>
  );
}
