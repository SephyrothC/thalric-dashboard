import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Sparkles } from 'lucide-react';

export default function CompanionBuffs({ activeBuffs, onRemoveBuff }) {
  const hasBuffs = activeBuffs && activeBuffs.length > 0;

  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border p-2">
      <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
        Buffs (Find Greater Steed)
      </h4>
      
      {!hasBuffs ? (
        <p className="text-[10px] text-gray-500 italic text-center py-1">
          Aucun buff actif
        </p>
      ) : (
        <div className="space-y-1">
          <AnimatePresence>
            {activeBuffs.map((buff) => (
              <motion.div
                key={buff.name}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-purple-900/30 border border-purple-500/40 rounded px-2 py-1 flex items-center gap-2 group"
              >
                <span className="text-sm">{buff.effect.icon || '✨'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-purple-300 truncate block">
                    {buff.name}
                  </span>
                  {buff.effect.acBonus && (
                    <span className="text-[9px] text-green-400">+{buff.effect.acBonus} CA</span>
                  )}
                  {buff.effect.hpMaxBonus && (
                    <span className="text-[9px] text-red-400">+{buff.effect.hpMaxBonus} HP</span>
                  )}
                </div>
                <button
                  onClick={() => onRemoveBuff(buff.name)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/20 rounded text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
