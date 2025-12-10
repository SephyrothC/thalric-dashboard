import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Brain, RefreshCw, X } from 'lucide-react';

export default function ConcentrationWarningDialog({ 
  isOpen, 
  onClose, 
  currentSpell, 
  newSpell, 
  onConfirm, 
  onCancel 
}) {
  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
        onClick={onCancel}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-medium border-2 border-yellow-500 rounded-lg p-6 max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-yellow-400">Concentration Active!</h3>
              <p className="text-sm text-gray-400">You're already concentrating on a spell</p>
            </div>
          </div>

          {/* Current Concentration */}
          <div className="mb-4 p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
            <div className="text-xs text-purple-300 uppercase font-bold mb-1">Current Spell</div>
            <div className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              {currentSpell}
            </div>
          </div>

          {/* Warning Text */}
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>D&D Rule:</strong> You can only concentrate on <strong>one spell</strong> at a time.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Casting <strong className="text-gold-primary">{newSpell}</strong> will <span className="text-red-400">immediately break</span> your concentration on <strong className="text-purple-400">{currentSpell}</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Switch Spell
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
