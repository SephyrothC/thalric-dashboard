import { useEffect } from 'react';
import { useCompanionStore } from '../store/companionStore';
import { useCharacterStore } from '../store/characterStore';
import { useSocket } from '../hooks/useSocket';
import CompanionHeader from '../components/companion/CompanionHeader';
import CompanionVitals from '../components/companion/CompanionVitals';
import CompanionActions from '../components/companion/CompanionActions';
import CompanionBuffs from '../components/companion/CompanionBuffs';
import CombatLog from '../components/combat/CombatLog';

import { toast } from 'sonner';
import { Bird } from 'lucide-react';

export default function Companion() {
  const { 
    companion, 
    activeBuffs, 
    getEffectiveAC, 
    getEffectiveMaxHP, 
    getEffectiveSpeed,
    removeBuff,
    heal,
    damage,
    setTempHP,
    fullHeal
  } = useCompanionStore();
  
  const { character } = useCharacterStore();
  const { socket } = useSocket();

  // Écouter les événements de concentration pour synchroniser les buffs
  useEffect(() => {
    if (!socket) return;

    const handleConcentrationEnded = (data) => {
      // Quand Thalric perd sa concentration, retirer le buff de Quicksilver
      const { spell, reason } = data;
      const buffExists = activeBuffs.find(b => b.name === spell);
      
      if (buffExists) {
        removeBuff(spell);
        toast.warning(`${spell} terminé sur Quicksilver!`, {
          icon: <Bird className="w-4 h-4 text-amber-400" />,
          description: reason === 'damage' ? 'Concentration brisée' : 'Sort terminé'
        });
      }
    };

    socket.on('concentration_ended', handleConcentrationEnded);

    return () => {
      socket.off('concentration_ended', handleConcentrationEnded);
    };
  }, [socket, activeBuffs, removeBuff]);

  // Calculer les stats effectives
  const effectiveAC = getEffectiveAC();
  const effectiveMaxHP = getEffectiveMaxHP();
  const effectiveSpeed = getEffectiveSpeed();

  // Créer un objet companion avec les stats effectives pour les composants
  const effectiveCompanion = {
    ...companion,
    ac: effectiveAC,
    hp_max: effectiveMaxHP,
    speed: effectiveSpeed
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Top: Companion Header */}
      <div className="flex-none mb-2">
        <CompanionHeader companion={effectiveCompanion} activeBuffs={activeBuffs} />
      </div>

      {/* Main Grid - Same as Combat */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* LEFT: Vitals & Status (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
          <CompanionVitals 
            companion={effectiveCompanion} 
            baseAC={12}
            onHeal={heal}
            onDamage={damage}
            onTempHP={setTempHP}
            onFullHeal={fullHeal}
          />

          {/* Active Buffs from Thalric */}
          <CompanionBuffs activeBuffs={activeBuffs} onRemoveBuff={removeBuff} />
        </div>

        {/* CENTER: Combat Log (5 cols) */}
        <div className="lg:col-span-5 h-full min-h-0">
          <CombatLog />
        </div>

        {/* RIGHT: Action Deck (4 cols) */}
        <div className="lg:col-span-4 h-full min-h-0">
          <CompanionActions companion={effectiveCompanion} activeBuffs={activeBuffs} />
        </div>

      </div>
    </div>
  );
}
