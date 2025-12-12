import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, 
  Swords,
  Target, 
  Flame,
  Bird,
  Info,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompanionActions({ companion, activeBuffs = [] }) {
  const [activeTab, setActiveTab] = useState('attacks');
  const [rolling, setRolling] = useState(false);

  // Check for attack/damage bonuses from buffs
  const getBlessBonus = () => activeBuffs.find(b => b.name === 'Bless');
  const getCrusaderMantle = () => activeBuffs.find(b => b.name === "Crusader's Mantle");

  // Attack rolls
  const handleAttack = async (attack) => {
    setRolling(true);
    try {
      // Add Bless bonus if active
      const bless = getBlessBonus();
      const formula = bless 
        ? `1d20+${attack.attackBonus}+1d4`
        : `1d20+${attack.attackBonus}`;
      const details = bless
        ? `+${attack.attackBonus} pour toucher (+1d4 Bless)`
        : `+${attack.attackBonus} pour toucher`;

      await fetch(`${window.location.origin}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula,
          rollType: `${companion.name} - ${attack.name} (Attaque)`,
          details
        })
      });
    } catch (error) {
      console.error('Attack roll failed:', error);
    } finally {
      setRolling(false);
    }
  };

  const handleDamageRoll = async (attack) => {
    setRolling(true);
    try {
      // Add Crusader's Mantle bonus if active
      const crusader = getCrusaderMantle();
      const formula = crusader
        ? `${attack.damage}+1d4`
        : attack.damage;
      const details = crusader
        ? `${attack.damage} ${attack.damageType} (+1d4 radiant)`
        : `${attack.damage} ${attack.damageType}`;

      await fetch(`${window.location.origin}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula,
          rollType: `${companion.name} - ${attack.name} (Dégâts)`,
          details
        })
      });
    } catch (error) {
      console.error('Damage roll failed:', error);
    } finally {
      setRolling(false);
    }
  };

  const handleMultiattack = async () => {
    setRolling(true);
    toast.info(`${companion.name} utilise Attaques multiples!`, {
      icon: <Swords className="w-4 h-4 text-yellow-400" />
    });
    
    // Roll both attacks sequentially
    for (const attack of companion.attacks) {
      await handleAttack(attack);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setRolling(false);
  };

  return (
    <div className="flex flex-col h-full bg-dark-surface rounded-xl border border-dark-border shadow-card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark-border">
        <TabButton 
          active={activeTab === 'attacks'} 
          onClick={() => setActiveTab('attacks')} 
          icon={<Sword className="w-4 h-4" />} 
          label="Attaques" 
        />
        <TabButton 
          active={activeTab === 'abilities'} 
          onClick={() => setActiveTab('abilities')} 
          icon={<Sparkles className="w-4 h-4" />} 
          label="Capacités" 
        />
        <TabButton 
          active={activeTab === 'info'} 
          onClick={() => setActiveTab('info')} 
          icon={<Info className="w-4 h-4" />} 
          label="Notes" 
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* ATTACKS TAB */}
          {activeTab === 'attacks' && (
            <motion.div
              key="attacks"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Multiattack Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleMultiattack}
                disabled={rolling}
                className="w-full p-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold rounded-lg shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" />
                Attaques Multiples (Bec + Griffes)
              </motion.button>

              <div className="text-center text-xs text-gray-500 py-1">— ou individuellement —</div>

              {/* Individual Attacks */}
              {companion.attacks.map((attack) => (
                <motion.div 
                  key={attack.id} 
                  whileHover={{ scale: 1.01 }}
                  className="group bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-red-500/50 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2">
                      <Sword className="w-4 h-4 text-red-400 mt-1" />
                      <div>
                        <h4 className="font-bold text-white group-hover:text-red-400 transition-colors">{attack.name}</h4>
                        <div className="text-xs text-gray-400">{attack.damageType} • {attack.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gold-primary">+{attack.attackBonus}</div>
                      <div className="text-xs text-gray-500">pour toucher</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-2">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAttack(attack)}
                      disabled={rolling}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold py-2 rounded shadow-lg transition-all disabled:opacity-50"
                    >
                      <Target className="w-4 h-4" />
                      Attaque
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDamageRoll(attack)}
                      disabled={rolling}
                      className="flex-1 flex items-center justify-center gap-2 bg-dark-surface hover:bg-dark-hover border border-dark-border text-gray-300 text-sm font-bold py-2 rounded transition-all disabled:opacity-50"
                    >
                      <Flame className="w-4 h-4" />
                      {attack.damage}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ABILITIES TAB */}
          {activeTab === 'abilities' && (
            <motion.div
              key="abilities"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {companion.abilities.map((ability, idx) => (
                <motion.div 
                  key={idx} 
                  whileHover={{ scale: 1.01 }}
                  className="bg-dark-bg p-3 rounded-lg border border-dark-border hover:border-amber-500/50 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bird className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-amber-400">{ability.name}</h4>
                  </div>
                  <p className="text-sm text-gray-300">{ability.description}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="bg-dark-bg p-3 rounded-lg border border-purple-500/30">
                <h4 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Find Greater Steed
                </h4>
                <p className="text-sm text-gray-300">
                  Les sorts ciblant uniquement Thalric peuvent aussi affecter {companion.name} (ex: Aid, Shield of Faith, Haste).
                </p>
              </div>

              <div className="bg-dark-bg p-3 rounded-lg border border-amber-500/30">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <Bird className="w-4 h-4" />
                  Monture
                </h4>
                <p className="text-sm text-gray-300">
                  Thalric peut monter {companion.name} et utiliser ses actions normalement pendant que le griffon se déplace (Mounted Combatant feat recommandé).
                </p>
              </div>

              <div className="bg-dark-bg p-3 rounded-lg border border-red-500/30">
                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Disparition
                </h4>
                <p className="text-sm text-gray-300">
                  Si {companion.name} tombe à 0 HP, il disparaît et peut être ré-invoqué avec un nouveau cast de Find Greater Steed (10 minutes, slot niveau 4).
                </p>
              </div>

              <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                <h4 className="font-bold text-gray-400 mb-2">Statistiques détaillées</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• <span className="text-white">Type:</span> {companion.creatureType}</li>
                  <li>• <span className="text-white">Alignement:</span> {companion.alignment}</li>
                  <li>• <span className="text-white">Vision dans le noir:</span> {companion.senses.darkvision} ft</li>
                  <li>• <span className="text-white">Perception passive:</span> {companion.senses.passive_perception}</li>
                  <li>• <span className="text-white">Langues:</span> Comprend le Commun et le Céleste</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
        active 
          ? 'text-white bg-dark-surface' 
          : 'text-gray-500 bg-dark-bg hover:bg-dark-hover hover:text-gray-300'
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="companionActiveTab"
          className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
        />
      )}
    </button>
  );
}
