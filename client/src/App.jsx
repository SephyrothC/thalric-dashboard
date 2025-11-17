import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useCharacterStore } from './store/characterStore';
import { useSocket } from './hooks/useSocket';
import { useToast, setGlobalToastHandler } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';
import HPDisplay from './components/ui/HPDisplay';
import Combat from './pages/Combat';
import Spells from './pages/Spells';
import Inventory from './pages/Inventory';
import Viewer from './pages/Viewer';

function App() {
  const { character, fetchCharacter, updateHP } = useCharacterStore();
  const { isConnected } = useSocket();
  const toast = useToast();

  // Set global toast handler for easy access
  useEffect(() => {
    setGlobalToastHandler(toast);
  }, [toast]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-gold-primary text-2xl">Loading Thalric Dashboard...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Combat /></Layout>} />
        <Route path="/combat" element={<Layout><Combat /></Layout>} />
        <Route path="/spells" element={<Layout><Spells /></Layout>} />
        <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
        <Route path="/viewer" element={<Viewer />} />
      </Routes>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </BrowserRouter>
  );
}

function Layout({ children }) {
  const { character, updateHP } = useCharacterStore();
  const { isConnected } = useSocket();
  const stats = character?.data?.stats || {};

  const handleQuickHeal = () => {
    // Open Lay on Hands dialog or quick heal
    const healAmount = prompt('Enter heal amount (Lay on Hands pool: 70):');
    if (healAmount && !isNaN(healAmount)) {
      const newHP = Math.min(stats.hp_current + parseInt(healAmount), stats.hp_max);
      updateHP(newHP, stats.temp_hp || 0);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-dark-medium to-dark-light border-b-4 border-gold-primary p-4 shadow-lg">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gold-primary">⚔️ Thalric Dashboard</h1>
              <p className="text-gold-secondary text-sm">
                {character?.data?.character_info?.name} - Level {character?.data?.character_info?.level} {character?.data?.character_info?.class}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <HPDisplay
                current={stats.hp_current || 0}
                max={stats.hp_max || 117}
                tempHP={stats.temp_hp || 0}
                size="compact"
                onHeal={handleQuickHeal}
                showQuickActions={false}
              />
            </div>
          </div>
          <nav className="mt-4 flex gap-2">
            <Link to="/combat" className="px-4 py-2 bg-dark-bg text-gold-secondary rounded-lg hover:bg-gold-primary hover:text-dark-bg transition-all font-semibold">⚔️ Combat</Link>
            <Link to="/spells" className="px-4 py-2 bg-dark-bg text-gold-secondary rounded-lg hover:bg-gold-primary hover:text-dark-bg transition-all font-semibold">✨ Spells</Link>
            <Link to="/inventory" className="px-4 py-2 bg-dark-bg text-gold-secondary rounded-lg hover:bg-gold-primary hover:text-dark-bg transition-all font-semibold">🎒 Inventory</Link>
            <a href="/viewer" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-dark-bg text-gold-primary rounded-lg border border-gold-primary hover:bg-dark-light transition-colors">📱 Viewer</a>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
      <footer className="bg-dark-medium border-t border-gold-primary p-4 text-center text-gray-400 text-sm">
        Thalric Dashboard v2.0 • Node.js + React + SQLite
      </footer>
    </div>
  );
}

export default App;