import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCharacterStore } from '../store/characterStore';
import { useSocket } from '../hooks/useSocket';
import AnimatedHealthBar from '../components/ui/AnimatedHealthBar';
import { 
  LayoutDashboard, 
  Swords, 
  BookOpen, 
  Zap, 
  Backpack, 
  Menu, 
  X, 
  Wifi, 
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Bird
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { character, updateHP } = useCharacterStore();
  const { isConnected } = useSocket();
  
  const stats = character?.data?.stats || {};

  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/combat', label: 'Combat', icon: Swords },
    { path: '/spells', label: 'Spellbook', icon: BookOpen },
    { path: '/features', label: 'Abilities', icon: Zap },
    { path: '/inventory', label: 'Inventory', icon: Backpack },
    { path: '/companion', label: 'Companion', icon: Bird },
  ];

  const handleQuickHeal = () => {
    const healAmount = prompt('Enter heal amount:');
    if (healAmount && !isNaN(healAmount)) {
      const newHP = Math.min(stats.hp_current + parseInt(healAmount), stats.hp_max);
      updateHP(newHP, stats.temp_hp || 0);
    }
  };

  const handleQuickDamage = () => {
    const damageAmount = prompt('Enter damage amount:');
    if (damageAmount && !isNaN(damageAmount)) {
      const newHP = Math.max(stats.hp_current - parseInt(damageAmount), 0);
      updateHP(newHP, stats.temp_hp || 0);
    }
  };

  // Mobile Navigation Component
  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border z-30">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'text-gold-primary' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-gold-primary' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 bg-gold-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-bg text-gray-100 font-sans overflow-hidden">
      {/* Desktop Sidebar Navigation */}
      <aside 
        className={`hidden md:flex ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-dark-surface border-r border-dark-border transition-all duration-300 flex-col z-20`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-gold-dim rounded-lg flex items-center justify-center text-dark-bg font-bold shadow-glow">
              T
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-lg tracking-wide text-gold-primary">THALRIC</span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-dark-hover rounded-lg text-gray-400 transition-colors"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
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
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-primary' : 'group-hover:scale-110'} transition-transform`} />
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

        {/* Connection Status */}
        <div className="p-4 border-t border-dark-border">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg ${!isSidebarOpen ? 'justify-center' : ''}`}>
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            {isSidebarOpen && (
              <span className="text-xs font-medium text-gray-400">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 md:h-16 bg-dark-surface/50 backdrop-blur-md border-b border-dark-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-dark-hover rounded-lg text-gray-400 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Page Title */}
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-200">
                {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            {/* Mobile Connection Indicator */}
            <div className="md:hidden">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>

            {/* Desktop Connection Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-dark-bg border border-dark-border">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Character Summary - Desktop */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-bold text-gold-secondary">{character?.data?.character_info?.name || 'Loading...'}</div>
                <div className="text-xs text-gray-500">Lvl {character?.data?.character_info?.level} {character?.data?.character_info?.class}</div>
              </div>
            </div>
            
            {/* HP Widget */}
            <div className="w-32 md:w-40">
              <AnimatedHealthBar
                current={stats.hp_current || 0}
                max={stats.hp_max || 100}
                tempHP={stats.temp_hp || 0}
                size="compact"
                onHeal={handleQuickHeal}
                onTakeDamage={handleQuickDamage}
                showActions={false}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
