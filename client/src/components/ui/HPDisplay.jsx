import './HPDisplay.css';

/**
 * Enhanced HP Display Component
 * Shows HP with visual bar, color coding, and contextual actions
 *
 * Features:
 * - Color-coded based on HP percentage (green/yellow/red)
 * - Temp HP overlay
 * - Pulsing animation when critical
 * - Quick heal button when HP < 50%
 * - Large, readable numbers
 */

export default function HPDisplay({
  current,
  max,
  tempHP = 0,
  onHeal,
  onTakeDamage,
  size = 'normal', // 'normal', 'large', 'compact'
  showQuickActions = true
}) {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  const isLow = percentage < 50;
  const isCritical = percentage < 25;
  const isDying = current === 0;

  // Get HP color based on percentage
  const getHPColor = () => {
    if (isDying) return 'var(--hp-critical)';
    if (isCritical) return 'var(--hp-low)';
    if (isLow) return 'var(--hp-medium)';
    return 'var(--hp-high)';
  };

  // Get status text
  const getStatusText = () => {
    if (isDying) return '💀 DYING';
    if (isCritical) return '⚠️ CRITICAL';
    if (isLow) return '⚠️ LOW HP';
    return '✅ Healthy';
  };

  const containerClass = `hp-display hp-display-${size} ${isCritical ? 'hp-critical-pulse' : ''} ${isDying ? 'hp-dying' : ''}`;

  return (
    <div className={containerClass}>
      {/* Status Badge */}
      {(isCritical || isDying) && (
        <div className="hp-status-badge">
          {getStatusText()}
        </div>
      )}

      {/* HP Numbers */}
      <div className="hp-numbers">
        <span className="hp-current">{current}</span>
        <span className="hp-separator">/</span>
        <span className="hp-max">{max}</span>
        {tempHP > 0 && (
          <span className="hp-temp">+{tempHP}</span>
        )}
      </div>

      {/* HP Bar */}
      <div className="hp-bar-container">
        {/* Main HP Bar */}
        <div
          className="hp-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getHPColor(),
            transition: 'all 0.3s ease'
          }}
        >
          <span className="hp-bar-label">{Math.round(percentage)}%</span>
        </div>

        {/* Temp HP Overlay */}
        {tempHP > 0 && (
          <div
            className="hp-temp-bar"
            style={{
              width: `${Math.min(100, (tempHP / max) * 100)}%`,
              left: `${percentage}%`
            }}
            title={`${tempHP} Temporary HP`}
          />
        )}
      </div>

      {/* Quick Actions */}
      {showQuickActions && (isLow || onTakeDamage) && (
        <div className="hp-quick-actions">
          {isLow && onHeal && (
            <button
              className="hp-quick-button hp-heal-button"
              onClick={onHeal}
              title="Quick heal (Lay on Hands)"
            >
              <span className="button-icon">❤️</span>
              <span className="button-text">Heal</span>
            </button>
          )}
          {onTakeDamage && (
            <button
              className="hp-quick-button hp-damage-button"
              onClick={onTakeDamage}
              title="Take damage"
            >
              <span className="button-icon">⚔️</span>
              <span className="button-text">Damage</span>
            </button>
          )}
        </div>
      )}

      {/* Helper Text */}
      {size !== 'compact' && (
        <div className="hp-helper-text">
          {isDying ? (
            <span className="text-danger font-bold">Roll Death Saves!</span>
          ) : isCritical ? (
            <span className="text-warning">Heal quickly!</span>
          ) : (
            <span className="text-muted">Hit Points</span>
          )}
        </div>
      )}
    </div>
  );
}
