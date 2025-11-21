import { useCharacterStore } from '../../store/characterStore';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const { character, shortRest, longRest } = useCharacterStore();
  const stats = character?.data?.stats || {};
  const info = character?.data?.character_info || {};
  const features = character?.data?.features || {};

  // Calculate some summary stats
  const activeConditions = []; // Placeholder for when conditions are in store
  const limitedFeatures = Object.values(features).filter(f => f.uses !== undefined || f.pool !== undefined);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-surface to-dark-bg border border-dark-border p-8 shadow-card">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gold-primary/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, <span className="text-gold-primary">{info.name}</span>
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Ready for your next adventure? Your vital statistics are stable. 
            You have <span className="text-white font-bold">{limitedFeatures.length}</span> limited resources tracked.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Armor Class" 
          value={stats.ac} 
          icon="🛡️" 
          subtext="Base Defense"
        />
        <StatCard 
          label="Passive Perception" 
          value={stats.passive_perception || 10} 
          icon="👁️" 
          subtext="Alertness"
        />
        <StatCard 
          label="Proficiency" 
          value={`+${stats.proficiency_bonus}`} 
          icon="🎓" 
          subtext="Bonus"
        />
        <StatCard 
          label="Speed" 
          value={`${stats.speed} ft`} 
          icon="🦶" 
          subtext="Movement"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Actions Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            <Link to="/combat" className="text-sm text-gold-primary hover:underline">Go to Combat Tracker &rarr;</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard 
              title="Combat Mode" 
              description="Enter combat, track initiative, and manage HP."
              icon="⚔️"
              to="/combat"
              color="bg-combat-attack/10 border-combat-attack/20 hover:border-combat-attack"
            />
            <ActionCard 
              title="Spellbook" 
              description="Manage spell slots and view known spells."
              icon="✨"
              to="/spells"
              color="bg-combat-magic/10 border-combat-magic/20 hover:border-combat-magic"
            />
          </div>

          {/* Resource Monitor */}
          <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
            <h3 className="text-lg font-bold text-white mb-4">Resource Monitor</h3>
            <div className="space-y-4">
              {limitedFeatures.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 group-hover:text-gold-primary transition-colors">{feature.name}</span>
                    <span className="text-gray-400">
                      {feature.uses ?? feature.pool} / {feature.uses_max ?? feature.pool_max}
                    </span>
                  </div>
                  <div className="h-2 bg-dark-bg rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold-dim transition-all duration-500"
                      style={{ 
                        width: `${((feature.uses ?? feature.pool) / (feature.uses_max ?? feature.pool_max)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
              {limitedFeatures.length === 0 && (
                <p className="text-gray-500 italic">No limited resources found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Ability Scores Compact */}
          <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
            <h3 className="text-lg font-bold text-white mb-4">Ability Scores</h3>
            <div className="grid grid-cols-2 gap-3">
              {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => {
                const val = stats[
                  stat === 'STR' ? 'strength' : 
                  stat === 'DEX' ? 'dexterity' :
                  stat === 'CON' ? 'constitution' :
                  stat === 'INT' ? 'intelligence' :
                  stat === 'WIS' ? 'wisdom' : 'charisma'
                ];
                const mod = Math.floor((val - 10) / 2);
                return (
                  <div key={stat} className="bg-dark-bg p-2 rounded border border-dark-border flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">{stat}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-white block">{val}</span>
                      <span className="text-xs text-gold-primary">{mod >= 0 ? '+' : ''}{mod}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rest Actions */}
          <div className="bg-dark-surface rounded-xl border border-dark-border p-6">
            <h3 className="text-lg font-bold text-white mb-4">Rest & Recovery</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  if(window.confirm('Take a Short Rest? This will reset short-rest abilities.')) {
                    shortRest();
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">☕</span>
                  <div className="text-left">
                    <div className="font-bold text-white group-hover:text-gold-primary">Short Rest</div>
                    <div className="text-xs text-gray-500">Reset short-rest abilities</div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => {
                  if(window.confirm('Take a Long Rest? This will reset all abilities and HP.')) {
                    longRest();
                  }
                }}
                className="w-full flex items-center justify-between p-3 bg-dark-bg hover:bg-dark-hover border border-dark-border rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⛺</span>
                  <div className="text-left">
                    <div className="font-bold text-white group-hover:text-gold-primary">Long Rest</div>
                    <div className="text-xs text-gray-500">Full recovery</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, subtext }) {
  return (
    <div className="bg-dark-surface p-4 rounded-xl border border-dark-border hover:border-gold-dim/50 transition-colors group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{label}</p>
          <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-gold-primary transition-colors">{value}</h3>
        </div>
        <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    </div>
  );
}

function ActionCard({ title, description, icon, to, color }) {
  return (
    <Link 
      to={to} 
      className={`block p-6 rounded-xl border transition-all duration-200 hover:-translate-y-1 ${color}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </Link>
  );
}
