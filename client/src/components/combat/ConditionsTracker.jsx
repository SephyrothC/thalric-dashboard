import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

const CONDITIONS_LIST = [
  { name: 'Blinded', icon: '😵', color: '#757575', effect: 'Auto-fail sight checks. Attacks: disadvantage. Attacks against: advantage.' },
  { name: 'Charmed', icon: '😍', color: '#e91e63', effect: "Can't attack charmer. Charmer has advantage on social checks.", immune: true },
  { name: 'Deafened', icon: '🔇', color: '#9e9e9e', effect: 'Auto-fail hearing checks.' },
  { name: 'Frightened', icon: '😨', color: '#ff9800', effect: 'Disadvantage while source visible. Cannot move closer.', immune: true },
  { name: 'Grappled', icon: '🤝', color: '#795548', effect: 'Speed = 0. Cannot benefit from bonuses to speed.' },
  { name: 'Incapacitated', icon: '😴', color: '#607d8b', effect: 'Cannot take actions or reactions.' },
  { name: 'Invisible', icon: '👻', color: '#9c27b0', effect: 'Attacks: advantage. Attacks against: disadvantage.' },
  { name: 'Paralyzed', icon: '🧊', color: '#00bcd4', effect: 'Incapacitated. Auto-fail STR/DEX saves. Attacks against: advantage. Hits within 5ft: crit.' },
  { name: 'Petrified', icon: '🗿', color: '#9e9e9e', effect: 'Incapacitated. Resistance to all damage. Immune to poison/disease.' },
  { name: 'Poisoned', icon: '🤢', color: '#4caf50', effect: 'Disadvantage on attacks and ability checks.' },
  { name: 'Prone', icon: '🛌', color: '#8d6e63', effect: 'Disadvantage on attacks. Attacks against: advantage (5ft) or disadvantage (ranged).' },
  { name: 'Restrained', icon: '⛓️', color: '#607d8b', effect: 'Speed = 0. Disadvantage on attacks and DEX saves. Attacks against: advantage.' },
  { name: 'Stunned', icon: '💫', color: '#ffeb3b', effect: 'Incapacitated. Auto-fail STR/DEX saves. Attacks against: advantage.' },
  { name: 'Unconscious', icon: '😵‍💫', color: '#f44336', effect: 'Incapacitated. Drop items, fall prone. Auto-fail STR/DEX saves. Attacks: advantage. Hits within 5ft: crit.' },
];

export default function ConditionsTracker() {
  const [conditions, setConditions] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    loadConditions();

    if (!socket) return;

    socket.on('condition_added', loadConditions);
    socket.on('condition_removed', loadConditions);

    return () => {
      socket.off('condition_added');
      socket.off('condition_removed');
    };
  }, [socket]);

  const loadConditions = async () => {
    try {
      const response = await fetch('/api/combat/conditions');
      const data = await response.json();
      setConditions(data);
    } catch (error) {
      console.error('Failed to load conditions:', error);
    }
  };

  const toggleCondition = async (conditionName) => {
    const isCurrentlyActive = isActive(conditionName);

    try {
      await fetch('/api/combat/conditions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: conditionName,
          duration_type: 'rounds',
          duration_value: 10
        })
      });

      const condition = CONDITIONS_LIST.find(c => c.name === conditionName);
      if (isCurrentlyActive) {
        toast.info(`${condition?.icon || ''} ${conditionName} removed`);
      } else {
        toast.warning(`${condition?.icon || ''} ${conditionName} applied`);
      }
    } catch (error) {
      console.error('Failed to toggle condition:', error);
      toast.error('Failed to toggle condition');
    }
  };

  const clearAll = async () => {
    if (confirm('Clear all conditions?')) {
      try {
        await fetch('/api/combat/conditions/clear', { method: 'DELETE' });
        toast.success('All conditions cleared');
        loadConditions();
      } catch (error) {
        console.error('Failed to clear conditions:', error);
        toast.error('Failed to clear conditions');
      }
    }
  };

  const isActive = (name) => conditions.some(c => c.name === name && c.active);
  const isImmune = (condition) => {
    // Thalric immunities: Charmed (Aura of Devotion), Frightened (Aura of Courage)
    return condition.immune && ['Charmed', 'Frightened'].includes(condition.name);
  };

  const activeConditions = CONDITIONS_LIST.filter(c => isActive(c.name));

  return (
    <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gold-primary">⚠️ Conditions</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 bg-dark-bg hover:bg-dark-light text-gold-secondary font-semibold rounded-lg transition-colors"
          >
            {showAll ? 'Hide' : 'Show All'}
          </button>
          {conditions.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active conditions summary */}
      {activeConditions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-gold-secondary font-semibold mb-2">Active:</h4>
          <div className="flex flex-wrap gap-2">
            {activeConditions.map(c => (
              <div
                key={c.name}
                className="flex items-center gap-2 px-4 py-2 bg-dark-bg border-2 rounded-lg"
                style={{ borderColor: c.color }}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className="font-semibold text-white">{c.name}</span>
                <button
                  className="ml-2 text-red-400 hover:text-red-300 font-bold"
                  onClick={() => toggleCondition(c.name)}
                  title="Remove condition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All conditions grid */}
      {showAll && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {CONDITIONS_LIST.map(condition => {
            const active = isActive(condition.name);
            const immune = isImmune(condition);

            return (
              <button
                key={condition.name}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-105 ${
                  active
                    ? 'bg-opacity-20 border-opacity-100 shadow-lg'
                    : 'border-transparent hover:border-gold-primary'
                } ${
                  immune
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                style={{
                  borderColor: active ? condition.color : 'transparent',
                  backgroundColor: active ? `${condition.color}20` : 'var(--dark-bg)'
                }}
                onClick={() => !immune && toggleCondition(condition.name)}
                disabled={immune}
                title={condition.effect}
              >
                <div className="text-4xl mb-2">{condition.icon}</div>
                <div className="text-sm font-semibold text-white">{condition.name}</div>
                {immune && (
                  <div className="absolute top-1 right-1 text-xs bg-gold-primary text-dark-bg px-2 py-1 rounded-full font-bold">
                    🛡️ IMMUNE
                  </div>
                )}
                {active && (
                  <div className="absolute top-1 left-1 text-green-400 text-xl">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Effects summary */}
      {activeConditions.length > 0 && (
        <div className="bg-dark-bg rounded-lg p-4">
          <h4 className="text-gold-secondary font-semibold mb-2">Current Effects:</h4>
          <div className="space-y-2">
            {activeConditions.map(c => (
              <div key={c.name} className="text-sm text-gray-300">
                <strong className="text-white">{c.icon} {c.name}:</strong> {c.effect}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
