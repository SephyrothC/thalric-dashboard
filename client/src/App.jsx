import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useCharacterStore } from './store/characterStore';
import { useSocket } from './hooks/useSocket';
import { useToast, setGlobalToastHandler } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';

// Layouts & Pages
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Combat from './pages/Combat';
import Spells from './pages/Spells';
import Features from './pages/Features';
import Inventory from './pages/Inventory';
import Viewer from './pages/Viewer';

function App() {
  const { character, fetchCharacter, error } = useCharacterStore();
  const { socket } = useSocket();
  const toast = useToast();

  // Set global toast handler for easy access
  useEffect(() => {
    setGlobalToastHandler(toast);
  }, [toast]);

  // Listen for real-time updates to refresh character data
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchCharacter();
    };

    // Combat & Condition events that affect character stats/state
    socket.on('condition_added', handleUpdate);
    socket.on('condition_removed', handleUpdate);
    socket.on('turn_advanced', handleUpdate);
    socket.on('combat_started', handleUpdate);
    socket.on('combat_ended', handleUpdate);
    socket.on('round_advanced', handleUpdate);
    socket.on('concentration_started', handleUpdate);
    socket.on('concentration_ended', handleUpdate);
    socket.on('death_save_rolled', handleUpdate);

    return () => {
      socket.off('condition_added', handleUpdate);
      socket.off('condition_removed', handleUpdate);
      socket.off('turn_advanced', handleUpdate);
      socket.off('combat_started', handleUpdate);
      socket.off('combat_ended', handleUpdate);
      socket.off('round_advanced', handleUpdate);
      socket.off('concentration_started', handleUpdate);
      socket.off('concentration_ended', handleUpdate);
      socket.off('death_save_rolled', handleUpdate);
    };
  }, [socket, fetchCharacter]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="text-center p-8 bg-dark-surface border border-red-500 rounded-xl max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">System Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gold-primary text-xl font-display tracking-widest">LOADING THALRIC OS...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard Routes wrapped in Layout */}
        <Route path="/" element={<DashboardLayout><DashboardHome /></DashboardLayout>} />
        <Route path="/combat" element={<DashboardLayout><Combat /></DashboardLayout>} />
        <Route path="/spells" element={<DashboardLayout><Spells /></DashboardLayout>} />
        <Route path="/features" element={<DashboardLayout><Features /></DashboardLayout>} />
        <Route path="/inventory" element={<DashboardLayout><Inventory /></DashboardLayout>} />
        
        {/* Standalone Routes */}
        <Route path="/viewer" element={<Viewer />} />
      </Routes>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </BrowserRouter>
  );
}

export default App;