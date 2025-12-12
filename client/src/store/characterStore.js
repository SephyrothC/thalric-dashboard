import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Use relative URL to work from any device on the network
const API_URL = window.location.origin;

// Base max HP for Thalric (level 13 Paladin)
const THALRIC_BASE_MAX_HP = 124;

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      character: null,
      loading: false,
      error: null,
      aidBonus: 0, // Track Aid bonus separately to remove it later
      baseMaxHp: THALRIC_BASE_MAX_HP, // Thalric's base max HP without buffs

  // Fetch character data and sync Aid bonus
  fetchCharacter: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/character`);
      if (!response.ok) throw new Error('Failed to fetch character');
      const data = await response.json();
      
      // Sync Aid bonus with actual HP max from DB
      const { aidBonus } = get();
      const actualMaxHp = data.data?.stats?.hp_max || THALRIC_BASE_MAX_HP;
      const expectedMaxHp = THALRIC_BASE_MAX_HP + aidBonus;
      
      // If HP max doesn't match expected (with Aid bonus), fix it
      if (actualMaxHp !== expectedMaxHp && aidBonus > 0) {
        console.log(`[CharacterStore] HP max mismatch: DB=${actualMaxHp}, expected=${expectedMaxHp}. Resetting Aid bonus.`);
        // HP in DB doesn't match our tracked Aid bonus - reset Aid bonus
        set({ aidBonus: 0 });
      }
      
      set({ character: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching character:', error);
    }
  },

  // Reset HP max to base (remove any Aid bonus stuck in DB)
  resetHpToBase: async () => {
    const { character } = get();
    if (!character) return;
    
    const stats = character.data.stats;
    const currentHp = Math.min(stats.hp_current, THALRIC_BASE_MAX_HP);
    
    try {
      const response = await fetch(`${API_URL}/api/character`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: THALRIC_BASE_MAX_HP,
              hp_current: currentHp
            }
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to reset HP');
      
      set({
        aidBonus: 0,
        character: {
          ...character,
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: THALRIC_BASE_MAX_HP,
              hp_current: currentHp
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error resetting HP:', error);
      return false;
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

  // Apply Aid effect (increases max HP and current HP)
  applyAid: async (castLevel) => {
    const { character, aidBonus: currentAidBonus, baseMaxHp } = get();
    if (!character) return;
    
    // Aid gives +5 HP per level above 1st (base 2nd level = +5)
    const hpBonus = 5 + (castLevel - 2) * 5;
    const stats = character.data.stats;
    
    // Remove old Aid bonus first, then apply new one
    const hpWithoutAid = stats.hp_max - currentAidBonus;
    const newMaxHp = hpWithoutAid + hpBonus;
    const newCurrentHp = Math.min(stats.hp_current - currentAidBonus + hpBonus, newMaxHp);
    
    try {
      const response = await fetch(`${API_URL}/api/character`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: newMaxHp,
              hp_current: newCurrentHp
            }
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to apply Aid');
      
      // Update local state with Aid bonus tracked
      set({
        aidBonus: hpBonus,
        character: {
          ...character,
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: newMaxHp,
              hp_current: newCurrentHp
            }
          }
        }
      });
      
      return hpBonus;
    } catch (error) {
      console.error('Error applying Aid:', error);
      return 0;
    }
  },

  // Remove Aid effect (decreases max HP and current HP)
  removeAid: async () => {
    const { character, aidBonus } = get();
    if (!character || aidBonus === 0) return 0;
    
    const stats = character.data.stats;
    const newMaxHp = stats.hp_max - aidBonus;
    const newCurrentHp = Math.min(stats.hp_current, newMaxHp);
    
    try {
      const response = await fetch(`${API_URL}/api/character`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: newMaxHp,
              hp_current: newCurrentHp
            }
          }
        })
      });
      
      if (!response.ok) throw new Error('Failed to remove Aid');
      
      const removedBonus = aidBonus;
      
      // Update local state
      set({
        aidBonus: 0,
        character: {
          ...character,
          data: {
            ...character.data,
            stats: {
              ...stats,
              hp_max: newMaxHp,
              hp_current: newCurrentHp
            }
          }
        }
      });
      
      return removedBonus;
    } catch (error) {
      console.error('Error removing Aid:', error);
      return 0;
    }
  },

  // Cast spell (consume spell slot)
  castSpell: async (spellOrLevel) => {
    try {
      const body = typeof spellOrLevel === 'object' 
        ? { 
            spellLevel: spellOrLevel.castLevel || spellOrLevel.level, 
            name: spellOrLevel.name, 
            duration: spellOrLevel.duration,
            concentration: spellOrLevel.concentration || spellOrLevel.duration?.toLowerCase().includes('concentration')
          }
        : { spellLevel: spellOrLevel };

      const response = await fetch(`${API_URL}/api/spells/cast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to cast spell');

      await get().fetchCharacter(); // Refresh character data
    } catch (error) {
      console.error('Error casting spell:', error);
    }
  }
}),
    {
      name: 'thalric-character-store',
      partialize: (state) => ({ 
        aidBonus: state.aidBonus,
        baseMaxHp: state.baseMaxHp
      })
    }
  )
);
