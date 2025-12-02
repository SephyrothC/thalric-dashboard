import { motion } from 'framer-motion';

export default function FeatureCard({ feature, onUse }) {
  const isPassive = feature.type === 'passive';
  const hasResource = feature.resource !== null;
  const isDepleted = hasResource && feature.resource.current <= 0;

  // Determine border color based on recharge type
  let borderColor = 'border-dark-border';
  if (feature.recharge === 'short_rest') borderColor = 'border-blue-500/30';
  if (feature.recharge === 'long_rest') borderColor = 'border-purple-500/30';
  if (isPassive) borderColor = 'border-gold-primary/20';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-dark-surface rounded-xl border ${borderColor} overflow-hidden group hover:shadow-lg transition-all ${
        isDepleted ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      {/* Header / Badge */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <div className="flex items-center gap-2">
          {/* Icon based on activation type */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold ${
            isPassive ? 'bg-gray-700 text-gray-400' :
            feature.activation === 'bonus_action' ? 'bg-orange-500/20 text-orange-500' :
            feature.activation === 'reaction' ? 'bg-green-500/20 text-green-500' :
            'bg-red-500/20 text-red-500' // Action
          }`}>
            {isPassive ? '🛡️' : feature.activation === 'bonus_action' ? '⚡' : feature.activation === 'reaction' ? '↩️' : '⚔️'}
          </div>
          <div>
            <h3 className="font-bold text-white group-hover:text-gold-primary transition-colors">
              {feature.name}
            </h3>
            <div className="text-xs text-gray-500 flex gap-2">
              <span className="capitalize">{feature.source}</span>
              {feature.recharge && (
                <>
                  <span>•</span>
                  <span className="text-blue-400 capitalize">{feature.recharge.replace('_', ' ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resource Counter */}
        {hasResource && (
          <div className="text-right">
            <div className={`text-xl font-bold font-display ${isDepleted ? 'text-red-500' : 'text-white'}`}>
              {feature.resource.current} <span className="text-sm text-gray-500 font-sans">/ {feature.resource.max}</span>
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{feature.resource.label}</div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="px-4 py-2">
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
          {feature.description}
        </p>
      </div>

      {/* Action Footer */}
      {!isPassive && (
        <div className="p-3 mt-2 border-t border-dark-border/50 bg-dark-bg/50 flex justify-end">
          <button
            onClick={() => onUse(feature)}
            disabled={isDepleted}
            className={`px-4 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${
              isDepleted
                ? 'bg-dark-border text-gray-500 cursor-not-allowed'
                : 'bg-gold-primary hover:bg-gold-secondary text-dark-bg shadow-lg hover:shadow-gold-primary/20 active:scale-95'
            }`}
          >
            {isDepleted ? 'Depleted' : 'Use Feature'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
