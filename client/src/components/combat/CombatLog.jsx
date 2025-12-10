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

    const handleSpellCast = (data) => {
      addLog({
        type: 'spell',
        timestamp: new Date(),
        data: data
      });
    };

    // Listen for dice rolls
    socket.on('dice_roll', handleDiceRoll);
    // Listen for spell casts
    socket.on('spell_cast', handleSpellCast);

    return () => {
      socket.off('dice_roll', handleDiceRoll);
      socket.off('spell_cast', handleSpellCast);
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
  const { data, type } = log;
  
  // Handle spell cast logs
  if (type === 'spell') {
    return <SpellLogEntry log={log} />;
  }
  
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

function SpellLogEntry({ log }) {
  const { data } = log;
  const { spell, level, baseLevel, effect, rollResult } = data;
  
  const isUpcast = level > baseLevel;
  const hasRoll = rollResult && rollResult.total !== undefined;
  
  // Determine the type of spell for coloring
  const isHealing = rollResult?.type === 'healing' || effect?.toLowerCase().includes('soign') || effect?.toLowerCase().includes('pv');
  const isDamage = rollResult?.type === 'spell_damage' || effect?.toLowerCase().includes('dégât');
  
  let borderColor = 'border-purple-500/50';
  let bgGradient = 'from-purple-900/30 to-blue-900/30';
  let iconBg = 'bg-purple-500/20';
  let iconColor = 'text-purple-400';
  
  if (isHealing) {
    borderColor = 'border-green-500/50';
    bgGradient = 'from-green-900/30 to-teal-900/30';
    iconBg = 'bg-green-500/20';
    iconColor = 'text-green-400';
  } else if (isDamage) {
    borderColor = 'border-red-500/50';
    bgGradient = 'from-red-900/30 to-orange-900/30';
    iconBg = 'bg-red-500/20';
    iconColor = 'text-red-400';
  }
  
  return (
    <div className={`bg-gradient-to-r ${bgGradient} p-3 rounded-lg border ${borderColor} shadow-sm animate-slide-in`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full ${iconBg} flex items-center justify-center`}>
            <span className={iconColor}>✨</span>
          </span>
          <span className="font-bold text-white text-sm">
            {spell}
          </span>
          <span className="text-xs px-2 py-0.5 bg-dark-bg rounded text-gray-400">
            Niv. {level}
          </span>
          {isUpcast && (
            <span className="text-xs px-2 py-0.5 bg-purple-500/30 rounded text-purple-300">
              +{level - baseLevel}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Roll Result (if any) */}
      {hasRoll && (
        <div className="flex items-center gap-4 mb-2">
          <div className={`text-3xl font-bold font-display ${
            isHealing ? 'text-green-400' : isDamage ? 'text-red-400' : 'text-white'
          }`}>
            {rollResult.total}
          </div>
          <div className="flex-1">
            <div className="text-xs text-gray-400">
              {Array.isArray(rollResult.rolls) && rollResult.rolls.map((r, i) => {
                const val = typeof r === 'object' ? r.value : r;
                return (
                  <span key={i}>
                    {i > 0 && ' + '}
                    [{val}]
                  </span>
                );
              })}
              {rollResult.modifier !== undefined && rollResult.modifier !== 0 && (
                <span className="text-gold-dim">
                  {' '}{rollResult.modifier >= 0 ? '+' : ''}{rollResult.modifier}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {rollResult.formula}
            </div>
          </div>
        </div>
      )}

      {/* Effect Description */}
      <div className="text-sm text-gray-300 bg-dark-bg/50 rounded p-2">
        {effect}
      </div>
    </div>
  );
}
