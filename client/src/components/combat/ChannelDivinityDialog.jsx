import { useEffect } from 'react';
import { useCharacterStore } from '../../store/characterStore';
import { toast } from '../../hooks/useToast';

export default function ChannelDivinityDialog({ isOpen, onClose }) {
  const { character, useFeature } = useCharacterStore();
  
  const data = character?.data || {};
  const channelDivinity = data.features?.channel_divinity || {};
  const uses = channelDivinity.uses || 0;
  const maxUses = channelDivinity.uses_max || 1;

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleUseOption = async (optionName) => {
    if (uses <= 0) {
      toast.error(`No Channel Divinity uses remaining!`);
      return;
    }

    try {
      const response = await useFeature('channel_divinity', { 
        option: optionName,
        name: optionName,
        duration: '1 minute'
      });

      if (response) {
        toast.success(`Used Channel Divinity: ${optionName}`);
        onClose();
      }
    } catch (error) {
      console.error('Channel Divinity failed:', error);
      toast.error('Failed to use Channel Divinity');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gold-primary">☀️ Channel Divinity</h3>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{uses}</div>
              <div className="text-sm text-gray-400">/ {maxUses} Uses</div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {uses === 0 && (
          <div className="mb-6 p-3 bg-red-600 bg-opacity-20 border-2 border-red-500 rounded-lg text-center">
            <div className="text-red-400 font-bold">⚠️ No Uses Remaining</div>
            <div className="text-red-300 text-sm mt-1">Recharges on Short or Long Rest</div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {/* Sacred Weapon */}
          <div className="bg-dark-bg p-4 rounded-lg border border-gold-primary/30 hover:border-gold-primary transition-all flex flex-col">
            <h4 className="text-xl font-bold text-white mb-2">⚔️ Sacred Weapon</h4>
            <div className="text-sm text-gray-300 flex-1 space-y-2 mb-4">
              <p>For 1 minute, add <strong>+5 to attack rolls</strong> with one weapon.</p>
              <p>The weapon emits bright light (20ft) and dim light (20ft).</p>
              <p>Becomes magical if it isn't already.</p>
              <p className="text-xs italic text-gray-500 mt-2">
                "You can end this effect on your turn as part of any other action. If you are no longer holding or carrying this weapon, or if you fall unconscious, this effect ends."
              </p>
            </div>
            <button
              onClick={() => handleUseOption('Sacred Weapon')}
              disabled={uses === 0}
              className="w-full py-3 bg-gold-primary hover:bg-yellow-500 text-black font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Activate Sacred Weapon
            </button>
          </div>

          {/* Turn the Unholy */}
          <div className="bg-dark-bg p-4 rounded-lg border border-gold-primary/30 hover:border-gold-primary transition-all flex flex-col">
            <h4 className="text-xl font-bold text-white mb-2">👻 Turn the Unholy</h4>
            <div className="text-sm text-gray-300 flex-1 space-y-2 mb-4">
              <p>Each fiend or undead within 30ft must make a <strong>Wisdom saving throw</strong>.</p>
              <p>On fail, creature is turned for 1 minute or until damaged.</p>
              <p>Turned creatures must move away and cannot take reactions.</p>
              <p className="text-xs italic text-gray-500 mt-2">
                "For its action, it can use only the Dash action or try to escape from an effect that prevents it from moving. If there’s nowhere to move, the creature can use the Dodge action."
              </p>
            </div>
            <button
              onClick={() => handleUseOption('Turn the Unholy')}
              disabled={uses === 0}
              className="w-full py-3 bg-gold-primary hover:bg-yellow-500 text-black font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Activate Turn the Unholy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
