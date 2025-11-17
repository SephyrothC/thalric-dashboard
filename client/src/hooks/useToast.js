import { useState, useCallback } from 'react';

/**
 * Toast Hook
 * Provides easy toast notification management
 *
 * Usage:
 * const toast = useToast();
 * toast.success("Action completed!");
 * toast.error("Something went wrong");
 * toast.dice("Rolled 18 on initiative!");
 */

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 3000,
      icon: options.icon,
      ...options
    };

    setToasts((prev) => [...prev, toast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, options) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const error = useCallback((message, options) => {
    return addToast(message, 'error', options);
  }, [addToast]);

  const warning = useCallback((message, options) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const info = useCallback((message, options) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  const dice = useCallback((message, options) => {
    return addToast(message, 'dice', { duration: 2000, ...options });
  }, [addToast]);

  const attack = useCallback((message, options) => {
    return addToast(message, 'attack', { duration: 2000, ...options });
  }, [addToast]);

  const spell = useCallback((message, options) => {
    return addToast(message, 'spell', { duration: 2500, ...options });
  }, [addToast]);

  const heal = useCallback((message, options) => {
    return addToast(message, 'heal', { duration: 2000, ...options });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
    dice,
    attack,
    spell,
    heal
  };
}

// Singleton toast provider (optional global usage)
let globalToastHandler = null;

export function setGlobalToastHandler(handler) {
  globalToastHandler = handler;
}

export const toast = {
  success: (message, options) => globalToastHandler?.success(message, options),
  error: (message, options) => globalToastHandler?.error(message, options),
  warning: (message, options) => globalToastHandler?.warning(message, options),
  info: (message, options) => globalToastHandler?.info(message, options),
  dice: (message, options) => globalToastHandler?.dice(message, options),
  attack: (message, options) => globalToastHandler?.attack(message, options),
  spell: (message, options) => globalToastHandler?.spell(message, options),
  heal: (message, options) => globalToastHandler?.heal(message, options),
};
