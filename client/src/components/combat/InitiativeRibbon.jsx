import { useState } from 'react';

export default function InitiativeRibbon() {
  // Mock data for now - eventually this comes from the store
  const [combatants] = useState([
    { id: 1, name: 'Thalric', initiative: 18, isPlayer: true, hp: 80, maxHp: 100 },
    { id: 2, name: 'Goblin Boss', initiative: 15, isPlayer: false, hp: 45, maxHp: 60 },
    { id: 3, name: 'Cleric', initiative: 12, isPlayer: true, hp: 50, maxHp: 50 },
    { id: 4, name: 'Goblin A', initiative: 8, isPlayer: false, hp: 10, maxHp: 15 },
  ]);

  const activeIndex = 0; // Mock active turn

  return (
    <div className="w-full bg-dark-surface border-b border-dark-border p-4 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-4 min-w-max mx-auto">
        {combatants.map((c, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div 
              key={c.id}
              className={`relative flex flex-col items-center transition-all duration-300 ${
                isActive ? 'scale-110 z-10' : 'opacity-60 scale-90'
              }`}
            >
              {/* Initiative Badge */}
              <div className="absolute -top-2 z-20 bg-dark-bg border border-dark-border text-xs font-bold px-1.5 rounded text-gray-400">
                {c.initiative}
              </div>

              {/* Avatar/Token */}
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg shadow-lg overflow-hidden ${
                isActive 
                  ? 'border-gold-primary shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : c.isPlayer ? 'border-blue-500' : 'border-red-500'
              } bg-dark-bg`}>
                {c.name.charAt(0)}
              </div>

              {/* Name & HP Bar */}
              <div className="mt-2 text-center">
                <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {c.name}
                </div>
                <div className="w-12 h-1 bg-dark-bg rounded-full mt-1 overflow-hidden">
                  <div 
                    className={`h-full ${c.isPlayer ? 'bg-blue-500' : 'bg-red-500'}`} 
                    style={{ width: `${(c.hp / c.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Active Indicator Arrow */}
              {isActive && (
                <div className="absolute -bottom-6 text-gold-primary animate-bounce">
                  ▲
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
