import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';

export default function Viewer() {
  const { isConnected, lastDiceRoll } = useSocket();
  const [rollHistory, setRollHistory] = useState([]);

  useEffect(() => {
    if (lastDiceRoll) {
      setRollHistory(prev => [lastDiceRoll, ...prev].slice(0, 10));
    }
  }, [lastDiceRoll]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-medium to-dark-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-dark-medium to-dark-light border-b-4 border-gold-primary p-6 shadow-lg">
        <h1 className="text-4xl font-bold text-gold-primary text-center drop-shadow-lg">🎲 Dice Viewer</h1>
        <div className="text-center text-gold-secondary text-lg mt-2">Thalric Cœur d'Argent - Dashboard</div>
      </header>

      {/* Connection Status */}
      <div className="flex justify-between items-center bg-dark-light p-4 border-b border-gold-primary">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-white font-semibold">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="bg-dark-bg px-4 py-2 rounded-lg border-2 border-gold-primary">
          <span className="text-gold-primary font-bold">Rolls: {rollHistory.length}</span>
        </div>
      </div>

      {/* Dice Results */}
      <div className="p-6 space-y-4">
        {rollHistory.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center animate-pulse">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-2xl text-gold-primary font-bold">Waiting for dice rolls...</div>
              <div className="text-gray-400 mt-2">Results will appear here in real-time</div>
            </div>
          </div>
        ) : (
          rollHistory.map((roll, index) => (
            <div key={index} className={`card animate-slide-in ${roll.is_critical ? 'animate-pulse-glow border-critical' : roll.is_fumble ? 'border-fumble animate-shake' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="text-xl font-bold text-gold-secondary">{roll.rollType}</div>
                <div className="text-sm text-gray-400 bg-dark-bg px-3 py-1 rounded-full">{roll.timestamp}</div>
              </div>

              <div className="text-center mb-4">
                <div className="text-lg text-gray-400 mb-2">{roll.formula}</div>
                <div className={`text-7xl font-bold ${roll.is_critical ? 'text-critical' : roll.is_fumble ? 'text-fumble' : 'text-gold-primary'}`}>
                  {roll.result}
                </div>
                <div className="text-md text-gray-300 mt-2">{roll.details}</div>
              </div>

              {(roll.is_critical || roll.is_fumble) && (
                <div className="flex justify-center gap-4 mt-4">
                  {roll.is_critical && (
                    <div className="bg-critical text-white px-6 py-2 rounded-full font-bold animate-pulse">
                      ✨ CRITICAL SUCCESS! ✨
                    </div>
                  )}
                  {roll.is_fumble && (
                    <div className="bg-fumble text-white px-6 py-2 rounded-full font-bold animate-shake">
                      💀 CRITICAL FAILURE!
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-dark-medium border-t border-gold-primary p-4 text-center text-gray-400 text-sm">
        Viewer synchronized with Thalric Dashboard • WebSocket real-time
      </footer>
    </div>
  );
}
