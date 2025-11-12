import { useState } from 'react';
import { useCharacterStore } from '../store/characterStore';
import { useDice } from '../hooks/useDice';

export default function Combat() {
  const { character, updateHP, shortRest, longRest, useFeature } = useCharacterStore();
  const { rollAttack, rollDamage, rollDice, rolling } = useDice();
  const [hpInput, setHpInput] = useState('');
  const [divineSmiteLevel, setDivineSmiteLevel] = useState(1);

  const stats = character?.data?.stats || {};
  const weapons = character?.data?.weapons || {};
  const features = character?.data?.features || {};

  const handleHPChange = (delta) => {
    const newHP = Math.max(0, Math.min(stats.hp_current + delta, stats.hp_max));
    updateHP(newHP, stats.temp_hp);
  };

  const handleWeaponAttack = async (weaponId) => {
    try {
      await rollAttack(weaponId, {});
    } catch (error) {
      console.error('Attack failed:', error);
    }
  };

  const handleWeaponDamage = async (weaponId, isCritical = false) => {
    try {
      const modifiers = divineSmiteLevel > 0 ? { divineSmiteLevel } : {};
      await rollDamage(weaponId, isCritical, modifiers);
    } catch (error) {
      console.error('Damage roll failed:', error);
    }
  };

  const handleSavingThrow = async (ability, modifier) => {
    try {
      await rollDice('1d20+' + modifier, 'Saving Throw', ability);
    } catch (error) {
      console.error('Saving throw failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gold-primary mb-6">⚔️ Combat & Stats</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats Card */}
        <div className="card">
          <h3 className="text-xl font-bold text-gold-primary mb-4">📊 Statistics</h3>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries({ STR: stats.strength, DEX: stats.dexterity, CON: stats.constitution, INT: stats.intelligence, WIS: stats.wisdom, CHA: stats.charisma }).map(([stat, value]) => (
              <div key={stat} className="bg-dark-bg p-3 rounded-lg text-center">
                <div className="text-gold-secondary font-bold">{stat}</div>
                <div className="text-2xl text-white">{value}</div>
                <div className="text-sm text-gray-400">+{Math.floor((value - 10) / 2)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">AC:</span>
              <span className="text-white font-bold">{stats.ac}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Speed:</span>
              <span className="text-white font-bold">{stats.speed} ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Proficiency:</span>
              <span className="text-white font-bold">+{stats.proficiency_bonus}</span>
            </div>
          </div>
        </div>

        {/* HP Card */}
        <div className="card">
          <h3 className="text-xl font-bold text-gold-primary mb-4">❤️ Hit Points</h3>
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-2xl font-bold text-red-400">{stats.hp_current} / {stats.hp_max}</span>
              {stats.temp_hp > 0 && <span className="text-blue-400">+{stats.temp_hp} temp</span>}
            </div>
            <div className="w-full bg-dark-bg rounded-full h-6 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-400 h-full transition-all" style={{ width: ((stats.hp_current / stats.hp_max) * 100) + '%' }}></div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => handleHPChange(-1)} className="btn-secondary flex-1">-1</button>
            <button onClick={() => handleHPChange(-5)} className="btn-secondary flex-1">-5</button>
            <button onClick={() => handleHPChange(5)} className="btn-secondary flex-1">+5</button>
            <button onClick={() => handleHPChange(10)} className="btn-secondary flex-1">+10</button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => shortRest()} className="btn-primary flex-1">Short Rest</button>
            <button onClick={() => longRest()} className="btn-primary flex-1">Long Rest</button>
          </div>
        </div>
      </div>

      {/* Weapons */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">⚔️ Weapons</h3>
        {Object.entries(weapons).map(([weaponId, weapon]) => (
          <div key={weaponId} className="bg-dark-bg p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h4 className="text-lg font-bold text-gold-secondary">{weapon.name}</h4>
                <p className="text-sm text-gray-400">{weapon.damage} {weapon.damage_type}</p>
              </div>
              <div className="text-gold-primary font-bold">+{weapon.attack_bonus} to hit</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleWeaponAttack(weaponId)} disabled={rolling} className="btn-primary flex-1">Roll Attack</button>
              <button onClick={() => handleWeaponDamage(weaponId, false)} disabled={rolling} className="btn-secondary flex-1">Roll Damage</button>
              <button onClick={() => handleWeaponDamage(weaponId, true)} disabled={rolling} className="btn-secondary flex-1">Crit Damage</button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm text-gray-400">Divine Smite:</label>
              <select value={divineSmiteLevel} onChange={(e) => setDivineSmiteLevel(parseInt(e.target.value))} className="input-field text-sm py-1">
                <option value="0">None</option>
                <option value="1">Level 1 (3d8)</option>
                <option value="2">Level 2 (4d8)</option>
                <option value="3">Level 3 (5d8)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Saving Throws */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">🛡️ Saving Throws</h3>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(character?.data?.saving_throws || {}).map(([ability, modifier]) => (
            <button key={ability} onClick={() => handleSavingThrow(ability, modifier)} disabled={rolling} className="btn-secondary">
              {ability.toUpperCase()} +{modifier}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card">
        <h3 className="text-xl font-bold text-gold-primary mb-4">✨ Features & Abilities</h3>
        <div className="space-y-3">
          {Object.entries(features).map(([featureId, feature]) => (
            <div key={featureId} className="bg-dark-bg p-3 rounded-lg flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gold-secondary">{feature.name}</h4>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
              <div className="text-right">
                {feature.uses !== undefined && (
                  <>
                    <div className="text-white font-bold">{feature.uses}/{feature.uses_max}</div>
                    <button onClick={() => useFeature(featureId)} disabled={feature.uses <= 0} className="btn-primary text-sm mt-1">Use</button>
                  </>
                )}
                {feature.pool !== undefined && (
                  <div className="text-white font-bold">{feature.pool}/{feature.pool_max}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
