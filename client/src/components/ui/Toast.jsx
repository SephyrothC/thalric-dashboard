import { useEffect } from 'react';
import './Toast.css';

/**
 * Toast Notification Component
 * Provides visual feedback for user actions
 *
 * Usage:
 * toast.success("Spell cast successfully!")
 * toast.error("Not enough spell slots")
 * toast.info("Initiative rolled: 18")
 */

export default function Toast({ id, message, type = 'info', duration = 3000, icon, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getIcon = () => {
    if (icon) return icon;

    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'dice':
        return '🎲';
      case 'attack':
        return '⚔️';
      case 'spell':
        return '✨';
      case 'heal':
        return '❤️';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
      case 'dice':
      case 'attack':
      case 'spell':
      case 'heal':
        return 'toast-action';
      default:
        return 'toast-info';
    }
  };

  return (
    <div className={`toast ${getTypeClass()} animate-slide-in`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
}

// Toast Container Component
export function ToastContainer({ toasts, onClose }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
