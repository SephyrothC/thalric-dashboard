import { useState } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { useDice } from '../../hooks/useDice';

export default function CombatActions() {
  const [activeTab, setActiveTab] = useState('attacks'); // attacks | spells | features
  const { character, useFeature, castSpell } = useCharacterStore();
  const { rollAttack, rollDamage, rolling } = useDice();
  
  const weapons = character?.data?.weapons || {};
  const features = character?.data?.features || {};
  const spells = character?.data?.spells || {};
  const spellSlots = character?.data?.spell_slots || {};

  // Filter features that are actually usable actions (have uses, pool, or explicit action type)
  const activeFeatures = Object.entries(features).filter(([_, f]) => 
    f.activation_type !== 'passive' && 
    (f.uses !== undefined || f.pool !== undefined || f.action_type !== undefined || f.recharge !== undefined)
  );

  // Flatten spells from the nested structure (cantrips, level_1, etc.)
  const spellsByLevel = Object.entries(spells).reduce((acc, [levelKey, levelSpells]) => {
    // Extract level number from key (level_1 -> 1, cantrips -> 0)
    let level = 0;
    if (levelKey === 'cantrips') level = 0;
    else if (levelKey.startsWith('level_')) level = parseInt(levelKey.replace('level_', ''));
    
    if (!acc[level]) acc[level] = [];
    
    // Add all spells from this level object
    Object.values(levelSpells).forEach(spell => {
      acc[level].push({ ...spell, level }); // Ensure level is set on spell object
    });
    
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-dark-surface rounded-xl border border-dark-border shadow-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <TabButton 
          active={activeTab === 'attacks'} 
          onClick={() => setActiveTab('attacks')} 
          icon="⚔️" 
          label="Attacks" 
        />
        <TabButton 
          active={activeTab === 'spells'} 
          onClick={() => setActiveTab('spells')} 
          icon="✨" 
          label="Spells" 
        />
        <TabButton 
          active={activeTab === 'features'} 
          onClick={() => setActiveTab('features')} 
          icon="⚡" 
          label="Features" 
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {/* ATTACKS TAB */}
        {activeTab === 'attacks' && (
          <div className="space-y-3">
            {Object.entries(weapons).map(([id, weapon]) => (
              <div key={id} className="group bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-combat-attack/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-combat-attack transition-colors">{weapon.name}</h4>
                    <div className="text-xs text-gray-400">{weapon.damage_type} • {weapon.range || 'Melee'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gold-primary">+{weapon.attack_bonus}</div>
                    <div className="text-xs text-gray-500">to hit</div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => rollAttack(id)}
                    disabled={rolling}
                    className="flex-1 bg-combat-attack hover:bg-red-600 text-white text-sm font-bold py-1.5 rounded shadow-lg active:scale-95 transition-all"
                  >
                    Attack
                  </button>
                  <button 
                    onClick={() => rollDamage(id)}
                    disabled={rolling}
                    className="flex-1 bg-dark-surface hover:bg-dark-hover border border-dark-border text-gray-300 text-sm font-bold py-1.5 rounded transition-all"
                  >
                    {weapon.damage} Dmg
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SPELLS TAB */}
        {activeTab === 'spells' && (
          <div className="space-y-6">
            {Object.entries(spellsByLevel).map(([level, levelSpells]) => (
              <div key={level}>
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-dark-surface py-2 z-10">
                  <h4 className="font-bold text-gold-secondary text-sm uppercase tracking-wider">
                    {level === '0' ? 'Cantrips' : `Level ${level}`}
                  </h4>
                  {level !== '0' && spellSlots[level] && (
                    <div className="flex gap-1">
                      {Array.from({ length: spellSlots[level].max }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-full border border-combat-magic ${
                            i < spellSlots[level].current ? 'bg-combat-magic shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-dark-bg opacity-30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {levelSpells.map((spell, idx) => (
                    <div key={idx} className="bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-combat-magic/50 transition-all group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-bold text-white group-hover:text-combat-magic transition-colors">{spell.name}</h5>
                          <p className="text-xs text-gray-400">{spell.casting_time} • {spell.range}</p>
                        </div>
                        {level !== '0' && (
                          <button 
                            onClick={() => castSpell(parseInt(level))}
                            disabled={spellSlots[level]?.current <= 0}
                            className="px-3 py-1 bg-dark-surface hover:bg-combat-magic hover:text-white text-combat-magic border border-combat-magic/30 rounded text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Cast
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FEATURES TAB */}
        {activeTab === 'features' && (
          <div className="space-y-3">
            {activeFeatures.map(([id, feature]) => (
              <div key={id} className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gold-secondary">{feature.name}</h4>
                  {(feature.uses !== undefined || feature.pool !== undefined) && (
                    <span className="text-xs bg-dark-surface px-2 py-1 rounded text-gray-300">
                      {feature.uses ?? feature.pool} / {feature.uses_max ?? feature.pool_max}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{feature.description}</p>
                <button 
                  onClick={() => useFeature(id)}
                  className="w-full mt-2 bg-dark-surface hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/30 text-xs font-bold py-1.5 rounded transition-all active:scale-95"
                >
                  Use Feature
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
        active 
          ? 'text-white bg-dark-surface' 
          : 'text-gray-500 bg-dark-bg hover:bg-dark-hover hover:text-gray-300'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
      )}
    </button>
  );
}
