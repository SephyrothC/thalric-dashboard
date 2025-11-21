import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { toast } from '../../hooks/useToast';

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
    try {
      await fetch('/api/combat/conditions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: conditionName, duration_type: 'rounds', duration_value: 10 })
      });
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to toggle condition:', error);
    }
  };

  const isActive = (name) => conditions.some(c => c.name === name && c.active);
  const activeConditions = CONDITIONS_LIST.filter(c => isActive(c.name));

  return (
    <div className="space-y-2">
      {/* Active Conditions List */}
      <div className="flex flex-wrap gap-2">
        {activeConditions.map(c => (
          <div
            key={c.name}
            className="flex items-center gap-1.5 px-2 py-1 bg-dark-bg border rounded text-xs font-bold text-white animate-slide-in"
            style={{ borderColor: c.color }}
          >
            <span>{c.icon}</span>
            <span>{c.name}</span>
            <button
              className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
              onClick={() => toggleCondition(c.name)}
            >
              ✕
            </button>
          </div>
        ))}
        {activeConditions.length === 0 && (
          <div className="text-xs text-gray-500 italic py-1">No active conditions</div>
        )}
      </div>

      {/* Add Button */}
      <div className="relative">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-full py-1 text-xs font-bold text-gold-dim hover:text-gold-primary border border-dashed border-dark-border hover:border-gold-dim/50 rounded transition-all"
        >
          {isAdding ? 'Close' : '+ Add Condition'}
        </button>

        {/* Dropdown Menu */}
        {isAdding && (
          <div className="absolute top-full left-0 w-full mt-1 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {CONDITIONS_LIST.map(c => {
              const active = isActive(c.name);
              if (active) return null; // Don't show already active ones
              return (
                <button
                  key={c.name}
                  onClick={() => toggleCondition(c.name)}
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
