import { useState } from 'react';

// Use relative URL to work from any device on the network
const API_URL = window.location.origin;

export function useDice() {
  const [rolling, setRolling] = useState(false);

  const rollDice = async (formula, rollType, details) => {
    setRolling(true);
    try {
      const response = await fetch(`${API_URL}/api/dice/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula, rollType, details })
      });

      if (!response.ok) throw new Error('Failed to roll dice');

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error rolling dice:', error);
      throw error;
    } finally {
      setRolling(false);
    }
  };

  const rollAttack = async (weaponId, modifiers = {}) => {
    setRolling(true);
    try {
      const response = await fetch(`${API_URL}/api/dice/attack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId, modifiers })
      });

      if (!response.ok) throw new Error('Failed to roll attack');

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error rolling attack:', error);
      throw error;
    } finally {
      setRolling(false);
    }
  };

  const rollDamage = async (weaponId, isCritical = false, modifiers = {}) => {
    setRolling(true);
    try {
      const response = await fetch(`${API_URL}/api/dice/damage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId, isCritical, modifiers })
      });

      if (!response.ok) throw new Error('Failed to roll damage');

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error rolling damage:', error);
      throw error;
    } finally {
      setRolling(false);
    }
  };

  return { rollDice, rollAttack, rollDamage, rolling };
}
