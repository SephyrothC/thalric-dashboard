import { useState } from 'react';

export default function TurnCounter() {
  const [round, setRound] = useState(1);

  return (
    <div className="w-full bg-dark-surface border-b border-dark-border p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Round</div>
          <div className="text-2xl font-bold text-gold-primary font-display">{round}</div>
        </div>
        <div className="text-gray-400 text-sm">
          <p>Track spell durations manually.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setRound(Math.max(1, round - 1))}
          className="px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-gray-300 rounded-lg font-bold transition-colors"
        >
          - Prev
        </button>
        <button 
          onClick={() => setRound(round + 1)}
          className="px-4 py-2 bg-gold-primary hover:bg-gold-secondary text-dark-bg rounded-lg font-bold transition-colors shadow-glow"
        >
          Next Round ➡️
        </button>
      </div>
    </div>
  );
}
