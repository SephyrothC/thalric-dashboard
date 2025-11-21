import { useCharacterStore } from '../../store/characterStore';
import HPDisplay from '../ui/HPDisplay';

export default function CombatVitals() {
  const { character, updateHP } = useCharacterStore();
  const stats = character?.data?.stats || {};
  const saves = character?.data?.saving_throws || {};

  // Quick handlers
  const handleHeal = () => {
    const amount = prompt("Heal amount:");
    if (amount) updateHP(Math.min(stats.hp_max, stats.hp_current + parseInt(amount)), stats.temp_hp);
  };

  const handleDamage = () => {
    const amount = prompt("Damage amount:");
    if (amount) updateHP(Math.max(0, stats.hp_current - parseInt(amount)), stats.temp_hp);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Main HP Display - Using the existing component but constrained */}
      <div className="bg-dark-surface rounded-xl p-4 border border-dark-border shadow-card flex-1 flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg/50 pointer-events-none" />
        <HPDisplay 
          current={stats.hp_current} 
          max={stats.hp_max} 
          tempHP={stats.temp_hp} 
          size="large"
          onHeal={handleHeal}
          onTakeDamage={handleDamage}
        />
      </div>

      {/* Defenses Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-dark-surface p-3 rounded-lg border border-dark-border text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider">AC</div>
          <div className="text-3xl font-bold text-white font-display">{stats.ac}</div>
          <div className="text-xs text-gold-dim">Shield +2</div>
        </div>
        <div className="bg-dark-surface p-3 rounded-lg border border-dark-border text-center">
          <div className="text-gray-400 text-xs uppercase tracking-wider">Speed</div>
          <div className="text-3xl font-bold text-white font-display">{stats.speed}</div>
          <div className="text-xs text-gray-500">ft/round</div>
        </div>
      </div>

      {/* Quick Saves */}
      <div className="bg-dark-surface p-4 rounded-xl border border-dark-border">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Saving Throws</h4>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(saves).map(([stat, mod]) => (
            <button 
              key={stat}
              className="flex flex-col items-center p-2 rounded bg-dark-bg hover:bg-dark-hover border border-transparent hover:border-gold-dim/30 transition-all"
              title={`Roll ${stat} Save`}
            >
              <span className="text-[10px] font-bold text-gray-500 uppercase">{stat}</span>
              <span className={`font-bold ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
