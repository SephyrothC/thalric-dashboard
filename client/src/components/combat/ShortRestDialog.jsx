import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function ShortRestDialog({ isOpen, onClose }) {
  const { character, fetchCharacter } = useCharacterStore();
  const [isResting, setIsResting] = useState(false);
  const [hitDiceUsed, setHitDiceUsed] = useState(0);
  const [hitDiceAvailable, setHitDiceAvailable] = useState(14);
  const [rolls, setRolls] = useState([]);
  const [totalHealing, setTotalHealing] = useState(0);
  const [currentHP, setCurrentHP] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const data = character?.data || {};
  const stats = data.stats || {};
  const level = data.character_info?.level || 14;
  const conMod = Math.floor((stats.constitution - 10) / 2);
  const maxHP = stats.hp_max || 117;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setHitDiceUsed(0);
      setHitDiceAvailable(level); // TODO: track remaining hit dice in DB
      setRolls([]);
      setTotalHealing(0);
      setCurrentHP(stats.hp_current || 0);
    }
  }, [isOpen, level, stats.hp_current]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isRolling) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isRolling]);

  if (!isOpen) return null;

  const hpMissing = maxHP - currentHP;
  const canRollMore = hitDiceAvailable > hitDiceUsed && currentHP < maxHP;

  // Roll a single hit die
  const rollHitDie = async () => {
    if (!canRollMore) return;
    
    setIsRolling(true);
    
    // Simulate roll animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const roll = Math.floor(Math.random() * 10) + 1; // 1d10
    const healing = Math.max(1, roll + conMod); // Minimum 1 HP
    const actualHealing = Math.min(healing, maxHP - currentHP);
    
    const newRoll = {
      id: Date.now(),
      dieRoll: roll,
      modifier: conMod,
      total: healing,
      actualHealing
    };
    
    setRolls(prev => [...prev, newRoll]);
    setHitDiceUsed(prev => prev + 1);
    setTotalHealing(prev => prev + actualHealing);
    setCurrentHP(prev => Math.min(prev + actualHealing, maxHP));
    setIsRolling(false);
  };

  // Complete the rest and save to server
  const handleCompleteRest = async () => {
    setIsResting(true);

    try {
      // Update HP on server
      if (totalHealing > 0) {
        await fetch('/api/character/hp', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hp: currentHP })
        });
      }

      // Restore short rest features (Channel Divinity)
      const response = await fetch('/api/character/rest/short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hit_dice_spent: 0 }) // HP already handled above
      });

      const result = await response.json();

      if (result.success) {
        if (totalHealing > 0) {
          toast.heal(`Short rest: Healed ${totalHealing} HP!`, { duration: 5000 });
        }
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gold-primary">⏱️ Short Rest</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
            disabled={isResting}
          >
            ✕
          </button>
        </div>

        {/* HP Status */}
        <div className="mb-4 p-4 bg-dark-bg rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Points de Vie</span>
            <span className="text-xl font-bold">
              <span className={currentHP < maxHP ? 'text-red-400' : 'text-green-400'}>{currentHP}</span>
              <span className="text-gray-500"> / {maxHP}</span>
            </span>
          </div>
          <div className="w-full bg-dark-surface rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-600 to-green-500 transition-all duration-500"
              style={{ width: `${(currentHP / maxHP) * 100}%` }}
            />
          </div>
          {totalHealing > 0 && (
            <div className="text-green-400 text-sm mt-2 font-semibold">
              +{totalHealing} HP récupérés
            </div>
          )}
        </div>

        {/* Hit Dice Info */}
        <div className="mb-4 p-4 bg-dark-bg rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gold-secondary font-bold">💎 Dés de Vie</span>
              <div className="text-xs text-gray-400">1d10 + {conMod} (CON) par dé</div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{hitDiceAvailable - hitDiceUsed}</span>
              <span className="text-gray-500"> / {hitDiceAvailable}</span>
            </div>
          </div>
        </div>

        {/* Roll Button */}
        <div className="mb-4">
          <button
            onClick={rollHitDie}
            disabled={!canRollMore || isRolling || isResting}
            className={`w-full py-4 text-xl font-bold rounded-lg transition-all transform ${
              canRollMore && !isRolling
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white hover:scale-[1.02] active:scale-95'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isRolling ? (
              <span className="animate-pulse">🎲 Rolling...</span>
            ) : currentHP >= maxHP ? (
              '❤️ HP Maximum atteint!'
            ) : hitDiceAvailable <= hitDiceUsed ? (
              '💎 Plus de Dés de Vie'
            ) : (
              '🎲 Lancer un Dé de Vie (1d10)'
            )}
          </button>
        </div>

        {/* Roll History */}
        {rolls.length > 0 && (
          <div className="mb-4 p-4 bg-dark-bg rounded-lg">
            <h4 className="text-gold-secondary font-semibold mb-3">📜 Historique des lancers</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {rolls.map((roll, index) => (
                <div 
                  key={roll.id}
                  className="flex items-center justify-between p-2 bg-dark-surface rounded animate-slide-in"
                >
                  <span className="text-gray-400 text-sm">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold ${roll.dieRoll === 10 ? 'text-green-400' : roll.dieRoll === 1 ? 'text-red-400' : 'text-white'}`}>
                      [{roll.dieRoll}]
                    </span>
                    <span className="text-gray-500">+</span>
                    <span className="text-blue-400">{roll.modifier}</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-400 font-bold">+{roll.actualHealing} HP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features to Restore */}
        <div className="mb-4 p-4 bg-dark-bg rounded-lg">
          <h4 className="text-gold-secondary font-semibold mb-2">✅ Capacités restaurées:</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>• <strong className="text-white">Channel Divinity</strong> → 2 utilisations</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            disabled={isResting}
          >
            Annuler
          </button>
          <button
            onClick={handleCompleteRest}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={isResting}
          >
            {isResting ? 'En cours...' : '✅ Terminer le repos'}
          </button>
        </div>

        {/* Rules reminder */}
        <div className="mt-4 p-3 bg-dark-bg rounded text-xs text-gray-400">
          <strong className="text-gold-secondary">Règles du Repos Court:</strong>
          <ul className="mt-1 ml-4 space-y-1">
            <li>• Dépensez des Dés de Vie pour vous soigner</li>
            <li>• Lance 1d10 + modificateur de CON ({conMod >= 0 ? '+' : ''}{conMod})</li>
            <li>• Décision progressive : lancez un dé à la fois</li>
            <li>• Channel Divinity restauré</li>
            <li>• Emplacements de sorts NON restaurés</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
