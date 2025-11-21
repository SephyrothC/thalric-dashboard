import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useCharacterStore } from './store/characterStore';
import { useToast, setGlobalToastHandler } from './hooks/useToast';
import { ToastContainer } from './components/ui/Toast';

// Layouts & Pages
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Combat from './pages/Combat';
import Spells from './pages/Spells';
import Inventory from './pages/Inventory';
import Viewer from './pages/Viewer';

function App() {
  const { character, fetchCharacter, error } = useCharacterStore();
  const toast = useToast();

  // Set global toast handler for easy access
  useEffect(() => {
    setGlobalToastHandler(toast);
  }, [toast]);

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