import { useState, useMemo } from 'react';
import { useCharacterStore } from '../store/characterStore';
import FeaturesList from '../components/features/FeaturesList';
import LayOnHandsDialog from '../components/combat/LayOnHandsDialog';
import ChannelDivinityDialog from '../components/combat/ChannelDivinityDialog';

export default function Features() {
  const { character, useFeature, shortRest, longRest } = useCharacterStore();
  const [isLayOnHandsOpen, setLayOnHandsOpen] = useState(false);
  const [isChannelDivinityOpen, setChannelDivinityOpen] = useState(false);

  // --- Data Normalization ---
  const features = useMemo(() => {
    if (!character?.data?.features) return [];

    return Object.entries(character.data.features).map(([key, raw]) => {
      // Infer Type
      let type = 'passive';
      if (raw.uses !== undefined || raw.pool !== undefined || raw.action_type) {
        type = 'active';
      }

      // Infer Activation
      let activation = raw.action_type || 'none';
      if (type === 'active' && activation === 'none') {
        // Heuristic: if it has uses but no action type, assume Action unless specified in description
        activation = 'action'; 
      }
      if (type === 'passive') activation = 'none';

      // Infer Resource
      let resource = null;
      if (raw.uses !== undefined) {
        resource = { current: raw.uses, max: raw.uses_max, label: 'Uses' };
      } else if (raw.pool !== undefined) {
        resource = { current: raw.pool, max: raw.pool_max, label: 'Points' };
      }

      // Infer Source (Mock logic as it's not in JSON yet)
      let source = raw.source || 'Class';
      if (['radiant_soul', 'healing_hands', 'light'].includes(key)) source = 'Race';
      if (['sentinel', 'polearm_master'].includes(key)) source = 'Feat';

      return {
        id: key,
        name: raw.name,
        description: raw.description,
        type,
        activation,
        resource,
        recharge: raw.recharge,
        source,
        raw // Keep raw for debugging/updates
      };
    });
  }, [character]);

  const handleUseFeature = async (feature) => {
    if (feature.id === 'lay_on_hands') {
      setLayOnHandsOpen(true);
    } else if (feature.id === 'channel_divinity') {
      setChannelDivinityOpen(true);
    } else {
      // Standard usage
      // Pass duration if available
      const duration = feature.raw?.duration;
      await useFeature(feature.id, { name: feature.name, duration });
    }
  };

  if (!character) return <div className="p-8 text-center text-gray-500">Loading Features...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-bold text-gold-primary mb-2">Abilities</h1>
          <p className="text-gray-400">Manage your class features, racial traits, and feats.</p>
        </div>
        
        {/* Rest Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => window.confirm('Short Rest?') && shortRest()}
            className="px-4 py-2 bg-dark-surface hover:bg-blue-900/30 border border-dark-border hover:border-blue-500 text-blue-400 rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <span>☕</span> Short Rest
          </button>
          <button 
            onClick={() => window.confirm('Long Rest?') && longRest()}
            className="px-4 py-2 bg-dark-surface hover:bg-purple-900/30 border border-dark-border hover:border-purple-500 text-purple-400 rounded-lg font-bold transition-all flex items-center gap-2"
          >
            <span>⛺</span> Long Rest
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        <FeaturesList features={features} onUseFeature={handleUseFeature} />
      </div>

      {/* Modals */}
      <LayOnHandsDialog 
        isOpen={isLayOnHandsOpen} 
        onClose={() => setLayOnHandsOpen(false)} 
      />
      <ChannelDivinityDialog 
        isOpen={isChannelDivinityOpen} 
        onClose={() => setChannelDivinityOpen(false)} 
      />
    </div>
  );
}
