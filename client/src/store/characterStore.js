import { create } from 'zustand';

const API_URL = 'http://localhost:3000';

export const useCharacterStore = create((set, get) => ({
  character: null,
  loading: false,
  error: null,

  // Fetch character data
  fetchCharacter: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/character`);
      if (!response.ok) throw new Error('Failed to fetch character');
      const data = await response.json();
      set({ character: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching character:', error);
    }
  },

  // Update character data (generic)
  updateCharacter: async (updates) => {
    const { character } = get();
    const updatedData = { ...character.data, ...updates };

    try {
      const response = await fetch(`${API_URL}/api/character`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData })
      });

      if (!response.ok) throw new Error('Failed to update character');

      set({ character: { ...character, data: updatedData } });
    } catch (error) {
      console.error('Error updating character:', error);
    }
  },

  // Update HP
  updateHP: async (hp, tempHp) => {
    try {
      const response = await fetch(`${API_URL}/api/character/hp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hp, tempHp })
      });

      if (!response.ok) throw new Error('Failed to update HP');

      const result = await response.json();

      // Update local state
      const { character } = get();
      set({
        character: {
          ...character,
          data: {
            ...character.data,
            stats: {
              ...character.data.stats,
              hp_current: result.hp,
              temp_hp: result.tempHp
            }
          }
        }
      });
    } catch (error) {
      console.error('Error updating HP:', error);
    }
  },

  // Perform short rest
  shortRest: async () => {
    try {
      const response = await fetch(`${API_URL}/api/character/rest/short`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to perform short rest');

      await get().fetchCharacter(); // Refresh character data
    } catch (error) {
      console.error('Error performing short rest:', error);
    }
  },

  // Perform long rest
  longRest: async () => {
    try {
      const response = await fetch(`${API_URL}/api/character/rest/long`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to perform long rest');

      await get().fetchCharacter(); // Refresh character data
    } catch (error) {
      console.error('Error performing long rest:', error);
    }
  },

  // Use feature (Channel Divinity, Lay on Hands, etc.)
  useFeature: async (feature, options = {}) => {
    try {
      // Support both old format (number) and new format (object)
      const body = typeof options === 'number'
        ? { feature, amount: options }
        : { feature, ...options };

      const response = await fetch(`${API_URL}/api/character/feature/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to use feature');

      await get().fetchCharacter(); // Refresh character data
      return true;
    } catch (error) {
      console.error('Error using feature:', error);
      return false;
    }
  },

  // Cast spell (consume spell slot)
  castSpell: async (spellLevel) => {
    try {
      const response = await fetch(`${API_URL}/api/spells/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spellLevel })
      });

      if (!response.ok) throw new Error('Failed to cast spell');

      await get().fetchCharacter(); // Refresh character data
    } catch (error) {
      console.error('Error casting spell:', error);
    }
  }
}));
