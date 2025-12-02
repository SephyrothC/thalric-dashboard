import { useCharacterStore } from '../../store/characterStore';
import { useDice } from '../../hooks/useDice';
import { toast } from '../../hooks/useToast';
import HPDisplay from '../ui/HPDisplay';

export default function CombatVitals() {
  const { character, updateHP, fetchCharacter } = useCharacterStore();
  const { rollDice, rolling } = useDice();
  const stats = character?.data?.stats || {};
  const saves = character?.data?.saving_throws || {};

  // Quick handlers
  const handleHeal = () => {
    const amount = prompt("Heal amount:");
    if (amount) updateHP(Math.min(stats.hp_max, stats.hp_current + parseInt(amount)), stats.temp_hp);
  };

  const handleDamage = async () => {
    const amount = prompt("Damage amount:");
    if (!amount) return;
    
    const dmg = parseInt(amount);
    updateHP(Math.max(0, stats.hp_current - dmg), stats.temp_hp);
    
    // Auto concentration save check
    const concentration_spell = character?.concentration_spell;
    if (concentration_spell && dmg > 0) {
      // Calculate DC: max(10, damage/2)
      const dc = Math.max(10, Math.floor(dmg / 2));
      
      // Get CON save bonus
      const conSave = saves.constitution || 0;
      
      // Roll the save
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + conSave;
      const success = total >= dc;
      
      // Notify via toast
      if (success) {
        toast.success(`🧠 Concentration maintenue! (${roll}+${conSave}=${total} vs DD${dc})`);
      } else {
        toast.error(`💔 Concentration brisée! (${roll}+${conSave}=${total} vs DD${dc})`);
        
        // End concentration
        try {
          await fetch('/api/combat/concentration/end', { method: 'DELETE' });
          
          // Also remove the condition
          await fetch(`/api/combat/conditions/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: concentration_spell })
          });
          
          await fetchCharacter();
        } catch (error) {
          console.error('Failed to end concentration:', error);
        }
      }
    }
  };

  const handleSaveRoll = (stat, mod) => {
    let formula = `1d20${mod >= 0 ? '+' : ''}${mod}`;
    let details = `${stat.charAt(0).toUpperCase() + stat.slice(1)} Save`;

    // Check for Bless/Bane
    const activeConditions = character?.data?.active_conditions || [];
    
    if (activeConditions.includes('Bless')) {
      formula += '+1d4';
      details += ' + Bless';
    }
    
    if (activeConditions.includes('Bane')) {
      formula += '-1d4';
      details += ' - Bane';
    }

    if (activeConditions.includes('Aura of Protection')) {
       // Assuming Aura of Protection is always active for the Paladin themselves if the feature is present
       // But here we are checking active_conditions which usually implies temporary effects.
       // However, Aura of Protection is a passive feature that adds CHA mod to saves.
       // The user might want this automated too.
       // Let's stick to the requested "Active Conditions" for now.
    }

    rollDice(formula, 'Saving Throw', details);
  };

  const handleInitiativeRoll = () => {
    const dexMod = Math.floor((stats.dexterity - 10) / 2);
    const formula = `1d20${dexMod >= 0 ? '+' : ''}${dexMod}`;
    rollDice(formula, 'Initiative', 'Initiative Roll');
  };

  const handleD20Roll = () => {
    rollDice('1d20', 'd20', 'Flat d20 Roll');
  };

  return (
    <div className="h-full flex flex-col gap-3">
      {/* Main HP Display - Compact */}
      <div className="bg-dark-surface rounded-xl p-3 border border-dark-border shadow-card flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-bg/50 pointer-events-none" />
        <HPDisplay 
          current={stats.hp_current} 
          max={stats.hp_max} 
          tempHP={stats.temp_hp} 
          size="compact"
          onHeal={handleHeal}
          onTakeDamage={handleDamage}
        />
      </div>

      {/* Defenses Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider">AC</div>
          <div className="text-2xl font-bold text-white font-display">{stats.ac}</div>
          {stats.ac_bonuses && stats.ac_bonuses.length > 0 && (
            <div className="text-[9px] text-gold-dim truncate">
              {stats.ac_bonuses.join(', ')}
            </div>
          )}
        </div>
        <div className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center">
          <div className="text-gray-400 text-[10px] uppercase tracking-wider">Speed</div>
          <div className="text-2xl font-bold text-white font-display">{stats.speed}</div>
          <div className="text-[10px] text-gray-500">ft</div>
        </div>
        <button 
          onClick={handleInitiativeRoll}
          disabled={rolling}
          className="bg-dark-surface p-2 rounded-lg border border-dark-border text-center hover:border-gold-primary transition-colors group active:scale-95"
        >
          <div className="text-gray-400 text-[10px] uppercase tracking-wider group-hover:text-gold-primary">Init</div>
          <div className="text-2xl font-bold text-white font-display">
            {Math.floor((stats.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((stats.dexterity - 10) / 2)}
          </div>
          <div className="text-[10px] text-gray-500">Roll</div>
        </button>
      </div>

      {/* Quick Saves */}
      <div className="bg-dark-surface p-3 rounded-xl border border-dark-border">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase">Saving Throws</h4>
          <button 
            onClick={handleD20Roll}
            disabled={rolling}
            className="text-[10px] bg-dark-bg hover:bg-gold-primary/20 text-gold-primary px-2 py-0.5 rounded border border-gold-primary/30 transition-colors flex items-center gap-1 active:scale-95"
          >
            <span>🎲</span> d20
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(saves).map(([stat, mod]) => (
            <button 
              key={stat}
              onClick={() => handleSaveRoll(stat, mod)}
              disabled={rolling}
              className="flex flex-col items-center p-1.5 rounded bg-dark-bg hover:bg-dark-hover border border-transparent hover:border-gold-dim/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Roll ${stat} Save`}
            >
              <span className="text-[9px] font-bold text-gray-500 uppercase">{stat.slice(0, 3)}</span>
              <span className={`font-bold text-sm ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
