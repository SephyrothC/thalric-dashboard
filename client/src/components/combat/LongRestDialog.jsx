import { useState, useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function LongRestDialog({ isOpen, onClose }) {
  const { character, fetchCharacter } = useCharacterStore();
  const [isResting, setIsResting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [restoredItems, setRestoredItems] = useState([]);

  const data = character?.data || {};
  const stats = data.stats || {};
  const features = data.features || {};
  const spellcasting = data.spellcasting || {};
  const currentHP = stats.hp_current || 0;
  const maxHP = stats.hp_max || 117;
  const hpToRestore = maxHP - currentHP;

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowResults(false);
      setRestoredItems([]);
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isResting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isResting]);

  if (!isOpen) return null;

  // Calculate what will be restored
  const getRestorationPreview = () => {
    const items = [];
    
    // HP
    if (hpToRestore > 0) {
      items.push({ icon: '❤️', name: 'Points de Vie', detail: `${currentHP} → ${maxHP} (+${hpToRestore})`, color: 'text-red-400' });
    } else {
      items.push({ icon: '❤️', name: 'Points de Vie', detail: `${maxHP} / ${maxHP} (déjà max)`, color: 'text-green-400' });
    }

    // Hit Dice (half restored)
    const level = data.character_info?.level || 14;
    const hitDiceRestored = Math.max(1, Math.floor(level / 2));
    items.push({ icon: '💎', name: 'Dés de Vie', detail: `+${hitDiceRestored} dés restaurés`, color: 'text-blue-400' });

    // Spell Slots
    if (spellcasting.spell_slots) {
      const slotsToRestore = [];
      Object.entries(spellcasting.spell_slots).forEach(([lvl, max]) => {
        const current = spellcasting.spell_slots_current?.[lvl] || 0;
        if (current < max) {
          slotsToRestore.push(`Niv.${lvl}`);
        }
      });
      if (slotsToRestore.length > 0) {
        items.push({ icon: '✨', name: 'Emplacements de Sort', detail: `${slotsToRestore.join(', ')} restaurés`, color: 'text-purple-400' });
      } else {
        items.push({ icon: '✨', name: 'Emplacements de Sort', detail: 'Tous au maximum', color: 'text-green-400' });
      }
    }

    // Features
    if (features.channel_divinity) {
      const cd = features.channel_divinity;
      if (cd.uses < cd.uses_max) {
        items.push({ icon: '⚡', name: 'Channel Divinity', detail: `${cd.uses} → ${cd.uses_max}`, color: 'text-yellow-400' });
      }
    }

    if (features.lay_on_hands) {
      const loh = features.lay_on_hands;
      if (loh.pool < loh.pool_max) {
        items.push({ icon: '🤲', name: 'Lay on Hands', detail: `${loh.pool} → ${loh.pool_max} points`, color: 'text-green-400' });
      }
    }

    if (features.divine_sense) {
      const ds = features.divine_sense;
      if (ds.uses < ds.uses_max) {
        items.push({ icon: '👁️', name: 'Divine Sense', detail: `${ds.uses} → ${ds.uses_max}`, color: 'text-cyan-400' });
      }
    }

    if (features.cleansing_touch) {
      const ct = features.cleansing_touch;
      if (ct.uses < ct.uses_max) {
        items.push({ icon: '🧹', name: 'Cleansing Touch', detail: `${ct.uses} → ${ct.uses_max}`, color: 'text-teal-400' });
      }
    }

    if (features.radiant_soul) {
      const rs = features.radiant_soul;
      if (rs.uses < rs.uses_max) {
        items.push({ icon: '😇', name: 'Radiant Soul', detail: `${rs.uses} → ${rs.uses_max}`, color: 'text-yellow-300' });
      }
    }

    if (features.healing_hands) {
      const hh = features.healing_hands;
      if (hh.uses < hh.uses_max) {
        items.push({ icon: '✋', name: 'Healing Hands', detail: `${hh.uses} → ${hh.uses_max}`, color: 'text-pink-400' });
      }
    }

    // Weapon charges
    if (data.weapons?.crystal_longsword) {
      const sword = data.weapons.crystal_longsword;
      if (sword.charges < sword.charges_max) {
        items.push({ icon: '⚔️', name: 'Crystal Longsword', detail: `${sword.charges} → ${sword.charges_max} charges`, color: 'text-cyan-300' });
      }
    }

    return items;
  };

  const handleLongRest = async () => {
    setIsResting(true);

    // Simulate rest animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const response = await fetch('/api/character/rest/long', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();

      if (result.success) {
        setRestoredItems(result.restored || []);
        setShowResults(true);
        await fetchCharacter();
        toast.success('Long rest completed! All resources restored.');
      } else {
        toast.error('Failed to complete long rest');
        onClose();
      }
    } catch (error) {
      console.error('Long rest failed:', error);
      toast.error('Failed to complete long rest');
      onClose();
    } finally {
      setIsResting(false);
    }
  };

  const previewItems = getRestorationPreview();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-purple-500 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌙</span>
            <div>
              <h3 className="text-2xl font-bold text-purple-400">Long Rest</h3>
              <p className="text-sm text-gray-400">8 heures de repos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
            disabled={isResting}
          >
            ✕
          </button>
        </div>

        {/* Resting Animation */}
        {isResting && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 animate-pulse">💤</div>
            <p className="text-xl text-purple-300 font-semibold animate-pulse">
              Repos en cours...
            </p>
            <p className="text-gray-400 mt-2">Récupération de toutes vos ressources</p>
            <div className="mt-6 flex justify-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && !isResting && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-5xl mb-3">✅</div>
              <h4 className="text-xl font-bold text-green-400">Repos Terminé!</h4>
              <p className="text-gray-400">Vous vous réveillez revigoré</p>
            </div>

            <div className="bg-dark-bg rounded-lg p-4 space-y-2">
              <h5 className="text-gold-secondary font-semibold mb-3">Ressources restaurées:</h5>
              {restoredItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-green-400 text-sm animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <span>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-lg transition-all"
            >
              Continuer l'aventure
            </button>
          </div>
        )}

        {/* Preview (before resting) */}
        {!isResting && !showResults && (
          <>
            {/* What will be restored */}
            <div className="mb-6">
              <h4 className="text-gold-secondary font-semibold mb-3 flex items-center gap-2">
                <span>📋</span> Ce qui sera restauré:
              </h4>
              <div className="bg-dark-bg rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {previewItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-dark-surface rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-white font-medium">{item.name}</span>
                    </div>
                    <span className={`text-sm font-mono ${item.color}`}>{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules reminder */}
            <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <h5 className="text-purple-300 font-semibold mb-2">📜 Règles du Long Rest:</h5>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• <strong>8 heures</strong> de repos (6h de sommeil minimum)</li>
                <li>• <strong>HP</strong> restaurés au maximum</li>
                <li>• <strong>Dés de Vie</strong>: récupère la moitié du niveau</li>
                <li>• <strong>Tous les emplacements</strong> de sort restaurés</li>
                <li>• <strong>Toutes les capacités</strong> restaurées</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleLongRest}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🌙</span> Dormir 8 heures
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
