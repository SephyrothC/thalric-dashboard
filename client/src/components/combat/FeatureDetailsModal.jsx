import { useEffect } from 'react';

export default function FeatureDetailsModal({ feature, featureId, onClose, onUse }) {
  if (!feature) return null;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleUse = () => {
    if (onUse) {
      onUse(featureId);
    }
    onClose();
  };

  const getRechargeText = (recharge) => {
    const rechargeMap = {
      'repos_court': '⚡ Repos Court',
      'repos_long': '🌙 Repos Long',
      'short_rest': '⚡ Short Rest',
      'long_rest': '🌙 Long Rest'
    };
    return rechargeMap[recharge] || recharge;
  };

  const canUse = () => {
    if (feature.uses !== undefined) {
      return feature.uses > 0;
    }
    if (feature.pool !== undefined) {
      return feature.pool > 0;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-medium border-2 border-gold-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-dark-medium to-dark-light border-b-2 border-gold-primary p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gold-primary mb-2">{feature.name}</h2>
              <div className="flex gap-3 text-sm flex-wrap">
                {feature.recharge && (
                  <span className="px-3 py-1 bg-dark-bg text-gold-secondary border border-gold-primary rounded">
                    {getRechargeText(feature.recharge)}
                  </span>
                )}
                {feature.action_type && (
                  <span className="px-3 py-1 bg-blue-600 text-white rounded capitalize">
                    {feature.action_type}
                  </span>
                )}
                {feature.uses !== undefined && (
                  <span className="px-3 py-1 bg-green-600 text-white font-bold rounded">
                    {feature.uses}/{feature.uses_max} utilisations
                  </span>
                )}
                {feature.pool !== undefined && (
                  <span className="px-3 py-1 bg-yellow-600 text-white font-bold rounded">
                    {feature.pool}/{feature.pool_max} points
                  </span>
                )}
              </div>
            </div>
            <button
              className="text-3xl text-gray-400 hover:text-white transition-colors ml-4"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {feature.range !== undefined && (
              <div className="bg-dark-bg p-4 rounded-lg">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Portée</label>
                <div className="text-lg text-white font-semibold">{feature.range} pieds</div>
              </div>
            )}
            {feature.duration && (
              <div className="bg-dark-bg p-4 rounded-lg">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Durée</label>
                <div className="text-lg text-white font-semibold">{feature.duration}</div>
              </div>
            )}
            {feature.bonus !== undefined && (
              <div className="bg-dark-bg p-4 rounded-lg">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Bonus</label>
                <div className="text-lg text-white font-semibold">+{feature.bonus}</div>
              </div>
            )}
            {feature.healing && (
              <div className="bg-dark-bg p-4 rounded-lg">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Soins</label>
                <div className="text-lg text-white font-semibold">{feature.healing}</div>
              </div>
            )}
            {feature.damage && (
              <div className="bg-dark-bg p-4 rounded-lg">
                <label className="text-xs text-gray-400 uppercase tracking-wide">Dégâts</label>
                <div className="text-lg text-white font-semibold">
                  {feature.damage} {feature.damage_type || ''}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {feature.description && (
            <div className="mb-6">
              <h4 className="text-xl font-bold text-gold-secondary mb-3">Description</h4>
              <p className="text-gray-300 leading-relaxed text-lg">{feature.description}</p>
            </div>
          )}

          {/* Options (pour Channel Divinity) */}
          {feature.options && (
            <div className="mb-6">
              <h4 className="text-xl font-bold text-gold-secondary mb-3">Options</h4>
              <div className="space-y-3">
                {Object.entries(feature.options).map(([optionKey, option]) => (
                  <div key={optionKey} className="bg-dark-bg p-4 rounded-lg border-l-4 border-gold-primary">
                    <h5 className="text-lg font-bold text-white mb-2">{option.name}</h5>
                    <p className="text-gray-300">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recharge info */}
          {feature.recharge && (
            <div className="bg-blue-900 bg-opacity-30 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="text-lg font-bold text-blue-400 mb-2">Récupération</h4>
              <p className="text-white">
                Cette capacité se recharge après un <strong>{getRechargeText(feature.recharge)}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-medium border-t-2 border-gold-primary p-6">
          <div className="flex gap-3">
            {(feature.uses !== undefined || feature.pool !== undefined) && onUse && (
              <button
                className={`flex-1 px-6 py-3 font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                  canUse()
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleUse}
                disabled={!canUse()}
              >
                ⚡ Utiliser
              </button>
            )}
            <button
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              onClick={onClose}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
