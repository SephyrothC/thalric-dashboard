import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { useSocket } from '../hooks/useSocket';
import HPDisplay from '../components/ui/HPDisplay';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { character, updateHP } = useCharacterStore();
  const { isConnected } = useSocket();
  
  const stats = character?.data?.stats || {};

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/combat', label: 'Combat Tracker', icon: '⚔️' },
    { path: '/spells', label: 'Spellbook', icon: '✨' },
    { path: '/inventory', label: 'Inventory', icon: '🎒' },
  ];

  const handleQuickHeal = () => {
    const healAmount = prompt('Enter heal amount:');
    if (healAmount && !isNaN(healAmount)) {
      const newHP = Math.min(stats.hp_current + parseInt(healAmount), stats.hp_max);
      updateHP(newHP, stats.temp_hp || 0);
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-dark-surface border-r border-dark-border transition-all duration-300 flex flex-col z-20`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-gold-dim rounded-lg flex items-center justify-center text-dark-bg font-bold shadow-glow">
              T
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-wide text-gold-primary">THALRIC</span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gold-primary/10 text-gold-primary border border-gold-primary/20' 
                    : 'text-gray-400 hover:bg-dark-hover hover:text-gray-100'
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                {isSidebarOpen && (
                  <span className="font-medium">{item.label}</span>
                )}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-primary shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Viewer Link) */}
        <div className="p-4 border-t border-dark-border">
          <a 
            href="/viewer" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border hover:border-gold-dim/50 transition-colors ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <span>📱</span>
            {isSidebarOpen && <span className="text-sm text-gray-400">Open Viewer</span>}
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-dark-surface/50 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-dark-hover rounded-lg text-gray-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Breadcrumb / Context */}
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-gray-200">
                {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-bg border border-dark-border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-combat-heal shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-combat-attack'}`} />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Character Summary */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gold-secondary">{character?.data?.character_info?.name || 'Loading...'}</div>
                <div className="text-xs text-gray-500">Lvl {character?.data?.character_info?.level} {character?.data?.character_info?.class}</div>
              </div>
              
              {/* HP Widget */}
              <div className="w-48">
                <HPDisplay
                  current={stats.hp_current || 0}
                  max={stats.hp_max || 100}
                  tempHP={stats.temp_hp || 0}
                  size="compact"
                  onHeal={handleQuickHeal}
                  showQuickActions={false}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
