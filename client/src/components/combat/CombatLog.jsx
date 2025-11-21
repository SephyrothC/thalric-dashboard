import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

export default function CombatLog() {
  const { socket } = useSocket();
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleDiceRoll = (data) => {
      addLog({
        type: 'dice',
        timestamp: new Date(),
        data: data
      });
    };

    // Listen for dice rolls
    socket.on('dice_roll', handleDiceRoll);

    return () => {
      socket.off('dice_roll', handleDiceRoll);
    };
  }, [socket]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (log) => {
    setLogs(prev => [...prev.slice(-50), log]); // Keep last 50 logs
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg rounded-xl border border-dark-border overflow-hidden relative">
      {/* Background Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div className="text-9xl">🎲</div>
      </div>

      {/* Log Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10">
        {logs.length === 0 && (
          <div className="text-center text-gray-500 italic mt-10">
            Waiting for rolls...
          </div>
        )}
        
        {logs.map((log, idx) => (
          <LogEntry key={idx} log={log} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function LogEntry({ log }) {
  const { data } = log;
  
  // Normalize data from different backend endpoints
  const total = data.total ?? data.result;
  const label = data.label ?? data.rollType ?? 'Dice Roll';
  const isCrit = data.isCritical ?? data.is_critical ?? false;
  const isFumble = data.isFumble ?? data.is_fumble ?? false;
  const rolls = Array.isArray(data.rolls) ? data.rolls : [];
  const modifier = data.modifier;
  const details = data.details;

  // Determine border color based on roll type
  let borderColor = 'border-dark-border';
  if (isCrit) borderColor = 'border-gold-primary';
  if (isFumble) borderColor = 'border-red-500';

  return (
    <div className={`bg-dark-surface p-3 rounded-lg border ${borderColor} shadow-sm animate-slide-in`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold text-white text-sm">
          {label}
        </span>
        <span className="text-xs text-gray-500">
          {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Roll Result */}
      <div className="flex items-center gap-4">
        {/* Total */}
        <div className={`text-3xl font-bold font-display ${
          isCrit ? 'text-gold-primary drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 
          isFumble ? 'text-red-500' : 'text-white'
        }`}>
          {total}
        </div>

        {/* Details */}
        <div className="flex-1">
          <div className="text-xs text-gray-400">
            {rolls.length > 0 ? (
              // If we have individual rolls
              <span>
                {rolls.map((r, i) => {
                  // Handle both number array [1, 2] and object array [{value: 1}, {value: 2}]
                  const val = typeof r === 'object' ? r.value : r;
                  const discarded = typeof r === 'object' ? r.discarded : false;
                  return (
                    <span key={i}>
                      {i > 0 && ' + '}
                      <span className={discarded ? 'line-through opacity-50' : ''}>
                        [{val}]
                      </span>
                    </span>
                  );
                })}
                {modifier !== undefined && modifier !== 0 && (
                  <span className="text-gold-dim">
                    {' '}{modifier >= 0 ? '+' : ''}{modifier}
                  </span>
                )}
              </span>
            ) : (
              // Fallback to details string if no rolls array
              <span>{details}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {data.formula}
          </div>
        </div>
      </div>

      {/* Crit/Fumble Badge */}
      {isCrit && (
        <div className="mt-2 text-xs font-bold text-gold-primary uppercase tracking-wider text-center bg-gold-primary/10 rounded py-0.5">
          Critical Hit!
        </div>
      )}
      {isFumble && (
        <div className="mt-2 text-xs font-bold text-red-500 uppercase tracking-wider text-center bg-red-500/10 rounded py-0.5">
          Critical Miss!
        </div>
      )}
    </div>
  );
}
