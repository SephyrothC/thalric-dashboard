import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';

const CONDITIONS_LIST = [
  { name: 'Blinded', icon: '😵', color: '#757575' },
  { name: 'Charmed', icon: '😍', color: '#e91e63', immune: true },
  { name: 'Deafened', icon: '🔇', color: '#9e9e9e' },
  { name: 'Frightened', icon: '😨', color: '#ff9800', immune: true },
  { name: 'Grappled', icon: '🤝', color: '#795548' },
  { name: 'Incapacitated', icon: '😴', color: '#607d8b' },
  { name: 'Invisible', icon: '👻', color: '#9c27b0' },
  { name: 'Paralyzed', icon: '🧊', color: '#00bcd4' },
  { name: 'Petrified', icon: '🗿', color: '#9e9e9e' },
  { name: 'Poisoned', icon: '🤢', color: '#4caf50' },
  { name: 'Prone', icon: '🛌', color: '#8d6e63' },
  { name: 'Restrained', icon: '⛓️', color: '#607d8b' },
  { name: 'Stunned', icon: '💫', color: '#ffeb3b' },
  { name: 'Unconscious', icon: '😵‍💫', color: '#f44336' },
];

export default function ConditionsTracker() {
  const [conditions, setConditions] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDuration, setCustomDuration] = useState(1); // Default 1 round (1 min if 1r=1m)
  const { socket } = useSocket();

  useEffect(() => {
    loadConditions();
    if (!socket) return;
    socket.on('condition_added', loadConditions);
    socket.on('condition_removed', loadConditions);
    socket.on('turn_advanced', loadConditions); // Listen for ticks
    return () => {
      socket.off('condition_added');
      socket.off('condition_removed');
      socket.off('turn_advanced');
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

  const toggleCondition = async (conditionName, duration = 10) => {
    try {
      await fetch('/api/combat/conditions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: conditionName, 
          duration_type: 'rounds', 
          duration_value: parseInt(duration) 
        })
      });
      setIsAdding(false);
      setCustomName('');
    } catch (error) {
      console.error('Failed to toggle condition:', error);
    }
  };

  // Merge standard and custom conditions for display
  const allActiveConditions = conditions.filter(c => c.active).map(c => {
    const standard = CONDITIONS_LIST.find(s => s.name === c.name);
    return {
      ...c,
      icon: standard ? standard.icon : '✨',
      color: standard ? standard.color : '#2196f3',
      displayName: c.name
    };
  });

  return (
    <div className="space-y-2">
      {/* Active Conditions List */}
      <div className="flex flex-wrap gap-2">
        {allActiveConditions.map(c => (
          <div
            key={c.name}
            className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border rounded text-xs font-bold text-white animate-slide-in"
            style={{ borderColor: c.color }}
            title={`${c.rounds_left} rounds remaining`}
          >
            <span>{c.icon}</span>
            <span>{c.displayName}</span>
            {c.duration_type === 'rounds' && (
              <span className="text-[10px] text-gray-400 bg-dark-surface px-1 rounded">
                {c.rounds_left}r
              </span>
            )}
            <button
              className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
              onClick={() => toggleCondition(c.name)}
            >
              ✕
            </button>
          </div>
        ))}
        {allActiveConditions.length === 0 && (
          <div className="text-[10px] text-gray-500 italic py-0.5">No active conditions</div>
        )}
      </div>

      {/* Add Button */}
      <div className="relative">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full py-0.5 text-[10px] font-bold text-gold-dim hover:text-gold-primary border border-dashed border-dark-border hover:border-gold-dim/50 rounded transition-all"
        >
          {isAdding ? 'Close' : '+ Add Effect / Condition'}
        </button>

        {/* Dropdown Menu */}
        {isAdding && (
          <div className="absolute top-full left-0 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto custom-scrollbar p-2">
            
            {/* Custom Effect Input */}
            <div className="mb-2 pb-2 border-b border-dark-border">
              <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Custom Effect / Spell</div>
              <div className="flex gap-1 mb-1">
                <input 
                  type="text" 
                  placeholder="Name (e.g. Bless)" 
                  className="flex-1 bg-dark-bg border border-dark-border rounded px-2 py-1 text-xs text-white focus:border-gold-primary outline-none"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
                <input 
                  type="number" 
                  placeholder="Rounds" 
                  className="w-12 bg-dark-bg border border-dark-border rounded px-1 py-1 text-xs text-white focus:border-gold-primary outline-none text-center"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                />
              </div>
              <button 
                onClick={() => toggleCondition(customName, customDuration)}
                disabled={!customName}
                className="w-full bg-gold-primary/10 hover:bg-gold-primary/20 text-gold-primary border border-gold-primary/30 rounded py-1 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Add Custom Effect
              </button>
            </div>

            {/* Standard Conditions */}
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Standard Conditions</div>
            {CONDITIONS_LIST.map(c => {
              const active = conditions.some(ac => ac.name === c.name && ac.active);
              if (active) return null;
              return (
                <button
                  key={c.name}
                  onClick={() => toggleCondition(c.name, 10)}
                  className="w-full text-left px-2 py-1.5 text-xs text-gray-300 hover:bg-dark-hover hover:text-white rounded flex items-center gap-2"
                  disabled={c.immune}
                >
                  <span>{c.icon}</span>
                  <span className={c.immune ? 'line-through opacity-50' : ''}>{c.name}</span>
                  {c.immune && <span className="ml-auto text-[10px] text-gold-dim">IMMUNE</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
