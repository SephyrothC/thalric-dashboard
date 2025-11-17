import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import SpellDetailsModal from '../components/spells/SpellDetailsModal';

export default function Spells() {
  const { character, castSpell } = useCharacterStore();
  const [selectedSpell, setSelectedSpell] = useState(null);
  
  if (!character || !character.data) {
    return <div className="text-white p-6">Loading character data...</div>;
  }

  const spellcasting = character.data.spellcasting || {};
  const spellsData = character.data.spells || {};

  const handleCastSpell = async (level) => {
    if (spellcasting.spell_slots_current && spellcasting.spell_slots_current[level] > 0) {
      await castSpell(level);
    }
  };

  // Convertir spells en format array si nécessaire
  const spellsByLevel = {};
  
  // Si spells est un objet avec des niveaux comme clés
  if (typeof spellsData === 'object' && !Array.isArray(spellsData)) {
    Object.keys(spellsData).forEach(level => {
      const levelSpells = spellsData[level];
      // S'assurer que c'est un array
      if (Array.isArray(levelSpells)) {
        spellsByLevel[level] = levelSpells;
      } else if (typeof levelSpells === 'object') {
        // Si c'est un objet, le convertir en array
        spellsByLevel[level] = Object.values(levelSpells);
      }
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gold-primary mb-6">✨ Spellcasting</h2>

      {/* Spell Slots */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">🔮 Spell Slots</h3>
        {spellcasting.spell_attack_bonus && (
          <div className="mb-4">
            <div className="text-sm text-gray-400">Spellcasting Ability: <span className="text-gold-secondary font-bold">Charisma</span></div>
            <div className="text-sm text-gray-400">Spell Attack: <span className="text-white font-bold">+{spellcasting.spell_attack_bonus}</span></div>
            <div className="text-sm text-gray-400">Spell Save DC: <span className="text-white font-bold">{spellcasting.spell_save_dc}</span></div>
          </div>
        )}
        
        {spellcasting.spell_slots ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.keys(spellcasting.spell_slots).map(level => {
              const current = spellcasting.spell_slots_current?.[level] || 0;
              const max = spellcasting.spell_slots[level];
              return (
                <div key={level} className="bg-dark-bg p-4 rounded-lg text-center">
                  <div className="text-gold-secondary font-bold mb-2">Level {level}</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {Array.from({ length: max }, (_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full border-2 ${i < current ? 'bg-gold-primary border-gold-primary' : 'border-gray-600'}`}></div>
                    ))}
                  </div>
                  <div className="text-white font-bold">{current}/{max}</div>
                  <button 
                    onClick={() => handleCastSpell(level)} 
                    disabled={current <= 0} 
                    className={`text-sm mt-2 w-full px-4 py-2 rounded-lg font-bold transition-all ${
                      current > 0 
                        ? 'bg-gold-primary hover:bg-gold-secondary text-dark-bg' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Cast
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">No spell slot data available.</p>
        )}
      </div>

      {/* Spell List */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">📜 Prepared Spells</h3>
        {Object.keys(spellsByLevel).length === 0 ? (
          <div className="text-gray-400">
            <p>No spells found in character data.</p>
            <p className="text-sm mt-2">Add spells to your thalric_data.json under the "spells" key.</p>
          </div>
        ) : (
          Object.entries(spellsByLevel).map(([level, levelSpells]) => (
            <div key={level} className="mb-6">
              <h4 className="text-lg font-bold text-gold-secondary mb-3">
                {level === '0' ? 'Cantrips' : `Level ${level} Spells`}
              </h4>
              <div className="space-y-2">
                {levelSpells && levelSpells.length > 0 ? (
                  levelSpells.map((spell, idx) => (
                    <div
                      key={idx}
                      className="bg-dark-bg p-3 rounded-lg hover:bg-dark-light transition-colors cursor-pointer border-2 border-transparent hover:border-gold-primary"
                      onClick={() => setSelectedSpell(spell)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-white">{spell.name || 'Unnamed Spell'}</div>
                          <div className="text-sm text-gray-400 line-clamp-2">{spell.description || 'No description'}</div>
                          {spell.level !== undefined && <div className="text-xs text-gold-secondary mt-1">Level {spell.level}</div>}
                        </div>
                        <button className="ml-3 px-3 py-1 bg-gold-primary hover:bg-gold-secondary text-dark-bg text-sm font-bold rounded transition-colors">
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No spells at this level</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Spell Details Modal */}
      <SpellDetailsModal
        spell={selectedSpell}
        onClose={() => setSelectedSpell(null)}
        onCast={async (spell) => {
          if (spell.level > 0) {
            await handleCastSpell(spell.level);
            // Optionally start concentration if spell requires it
            if (spell.duration && spell.duration.includes('Concentration')) {
              try {
                // Extract duration in rounds (assuming duration is like "Concentration, up to 10 minutes")
                const durationMatch = spell.duration.match(/(\d+)\s*(minute|hour)/);
                let rounds = 10; // default
                if (durationMatch) {
                  const value = parseInt(durationMatch[1]);
                  const unit = durationMatch[2];
                  rounds = unit === 'hour' ? value * 600 : value * 10; // 1 minute = 10 rounds
                }

                await fetch('/api/combat/concentration/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ spell: spell.name, duration: rounds })
                });
              } catch (error) {
                console.error('Failed to start concentration:', error);
              }
            }
          }
        }}
      />
    </div>
  );
}