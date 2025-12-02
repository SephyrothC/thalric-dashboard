import { useCharacterStore } from '../store/characterStore';
import TurnCounter from '../components/combat/TurnCounter';
import CombatVitals from '../components/combat/CombatVitals';
import CombatActions from '../components/combat/CombatActions';
import ConditionsTracker from '../components/combat/ConditionsTracker';
import CombatLog from '../components/combat/CombatLog';

export default function Combat() {
  const { character } = useCharacterStore();

  if (!character) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Top: Turn Counter */}
      <div className="flex-none mb-2">
        <TurnCounter />
      </div>

      {/* Main Battle Station Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* LEFT: Vitals & Status (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
          <CombatVitals />
          <div className="bg-dark-surface rounded-xl border border-dark-border p-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Active Conditions</h4>
            <ConditionsTracker />
          </div>
        </div>

        {/* CENTER: The Stage / Log (5 cols) */}
        <div className="lg:col-span-5 h-full min-h-0">
          <CombatLog />
        </div>

        {/* RIGHT: Action Deck (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-0">
          <CombatActions />
        </div>

      </div>
    </div>
  );
}