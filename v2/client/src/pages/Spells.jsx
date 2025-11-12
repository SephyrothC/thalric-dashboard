import { useCharacterStore } from '../store/characterStore';

export default function Spells() {
  const { character, castSpell } = useCharacterStore();
  const spellcasting = character?.data?.spellcasting || {};
  const spells = character?.data?.spells || {};

  const handleCastSpell = async (level) => {
    if (spellcasting.spell_slots_current[level] > 0) {
      await castSpell(level);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gold-primary mb-6">✨ Spellcasting</h2>

      {/* Spell Slots */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">🔮 Spell Slots</h3>
        <div className="mb-4">
          <div className="text-sm text-gray-400">Spellcasting Ability: <span className="text-gold-secondary font-bold">Charisma</span></div>
          <div className="text-sm text-gray-400">Spell Attack: <span className="text-white font-bold">+{spellcasting.spell_attack_bonus}</span></div>
          <div className="text-sm text-gray-400">Spell Save DC: <span className="text-white font-bold">{spellcasting.spell_save_dc}</span></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(spellcasting.spell_slots || {}).map(level => {
            const current = spellcasting.spell_slots_current[level];
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
                <button onClick={() => handleCastSpell(level)} disabled={current <= 0} className="btn-primary text-sm mt-2 w-full">Cast</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spell List */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">📜 Prepared Spells</h3>
        {Object.entries(spells).map(([level, levelSpells]) => (
          <div key={level} className="mb-4">
            <h4 className="text-lg font-bold text-gold-secondary mb-2">Level {level} Spells</h4>
            <div className="space-y-2">
              {levelSpells.map((spell, idx) => (
                <div key={idx} className="bg-dark-bg p-3 rounded-lg">
                  <div className="font-bold text-white">{spell.name}</div>
                  <div className="text-sm text-gray-400">{spell.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
