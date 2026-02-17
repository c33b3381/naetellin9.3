import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Currency conversion helpers (WoW-style)
export const copperToGold = (copper) => {
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const copperRemainder = copper % 100;
  return { gold, silver, copper: copperRemainder };
};

export const formatCurrency = (copper) => {
  const { gold, silver, copper: c } = copperToGold(copper);
  const parts = [];
  if (gold > 0) parts.push(`${gold}g`);
  if (silver > 0) parts.push(`${silver}s`);
  if (c > 0 || parts.length === 0) parts.push(`${c}c`);
  return parts.join(' ');
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      // Auth State
      token: null,
      playerId: null,
      username: null,
      isAuthenticated: false,
      
      // Player State
      player: null,
      character: null,
      skills: {},
      inventory: [],
      equipment: {},
      quests: { active: [], completed: [], available: [] },
      stats: { hp: 100, max_hp: 100, mana: 50, max_mana: 50 },
      copper: 2500, // Currency in copper (100 copper = 1 silver, 100 silver = 1 gold)
      position: { x: 0, y: 0, z: 0, zone: 'starter_village' },
      learned_spells: ['autoAttack', 'warrior_attack'],
      action_bar: ['autoAttack', 'warrior_attack', null, null, null, null],
      experience: 0,
      combat_level: 1,
      
      // Bag System (WoW-style)
      backpack: [], // 16 slots, always available
      bags: [ // 4 bag slots
        { bagItem: null, items: [] }, // Slot 1
        { bagItem: null, items: [] }, // Slot 2
        { bagItem: null, items: [] }, // Slot 3
        { bagItem: null, items: [] }  // Slot 4
      ],
      
      // Game State
      currentZone: 'starter_village',
      combatLog: [],
      notifications: [],
      
      // UI State
      activePanel: null,
      isLoading: false,
      error: null,
      
      // Actions
      setAuth: (token, playerId, username) => {
        set({ token, playerId, username, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem('e1_token', token);
        }
      },
      
      logout: async (worldData = null) => {
        // Comprehensive save before logout - saves ALL game data
        const token = get().token;
        if (token) {
          try {
            // Gather all player data from store
            const saveData = {
              position: get().position,
              copper: get().copper,
              backpack: get().backpack,
              equipment: get().equipment,
              bags: get().bags,
              skills: get().skills,
              learned_spells: get().learned_spells,
              action_bar: get().action_bar,
              combat_level: get().combat_level,
              experience: get().experience
            };
            
            // Add world data if provided (terrain, world objects, enemies)
            if (worldData) {
              if (worldData.terrain) {
                saveData.terrain = worldData.terrain;
              }
              if (worldData.world_objects) {
                saveData.world_objects = worldData.world_objects;
                saveData.zone = worldData.zone || 'starter_village';
              }
              if (worldData.placed_enemies) {
                saveData.placed_enemies = worldData.placed_enemies;
              }
            }
            
            // Call comprehensive save endpoint
            await axios.post(`${API}/player/save-all`, saveData, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('All game data saved successfully on logout');
          } catch (err) {
            console.error('Failed to save game data on logout:', err);
          }
        }
        
        localStorage.removeItem('e1_token');
        set({
          token: null,
          playerId: null,
          username: null,
          isAuthenticated: false,
          player: null,
          character: null
        });
      },
      
      // Validate stored token on init
      initializeAuth: async () => {
        const storedToken = localStorage.getItem('e1_token');
        if (!storedToken) return false;
        
        try {
          // Test if token is valid by making a request
          const res = await axios.get(`${API}/player/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          // Token is valid - restore session
          set({ 
            token: storedToken, 
            isAuthenticated: true,
            player: res.data,
            character: res.data.character,
            skills: res.data.skills,
            inventory: res.data.inventory,
            equipment: res.data.equipment,
            quests: res.data.quests,
            stats: res.data.stats,
            copper: res.data.copper || 2500,
            position: res.data.position
          });
          return true;
        } catch (err) {
          // Token is invalid - clear it
          console.log('Stored token is invalid, clearing...');
          localStorage.removeItem('e1_token');
          return false;
        }
      },
      
      // API Helpers
      getHeaders: () => ({
        headers: { Authorization: `Bearer ${get().token}` }
      }),
      
      // Handle API errors - auto logout on invalid token
      handleApiError: (err) => {
        if (err.response?.status === 401) {
          // Invalid token - logout
          get().logout();
          window.location.href = '/';
        }
        return err;
      },
      
      // Auth Actions
      register: async (username, password, email) => {
        set({ isLoading: true, error: null });
        try {
          const res = await axios.post(`${API}/auth/register`, { username, password, email });
          set({ isLoading: false });
          get().setAuth(res.data.token, res.data.player_id, res.data.username);
          return res.data;
        } catch (err) {
          set({ isLoading: false, error: err.response?.data?.detail || 'Registration failed' });
          throw err;
        }
      },
      
      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await axios.post(`${API}/auth/login`, { username, password });
          set({ isLoading: false });
          get().setAuth(res.data.token, res.data.player_id, res.data.username);
          return res.data;
        } catch (err) {
          set({ isLoading: false, error: err.response?.data?.detail || 'Login failed' });
          throw err;
        }
      },
      
      // Player Actions
      fetchPlayer: async () => {
        try {
          const res = await axios.get(`${API}/player/me`, get().getHeaders());
          // Ensure autoAttack is always in learned_spells (core ability)
          const learnedSpells = res.data.learned_spells || [];
          if (!learnedSpells.includes('autoAttack')) {
            learnedSpells.unshift('autoAttack');
          }
          // Ensure autoAttack is in action_bar if not present
          const actionBar = res.data.action_bar || [null, null, null, null, null, null];
          if (!actionBar.includes('autoAttack')) {
            actionBar[0] = 'autoAttack';
          }
          set({
            player: res.data,
            character: res.data.character,
            skills: res.data.skills,
            inventory: res.data.inventory,
            equipment: res.data.equipment,
            quests: res.data.quests,
            stats: res.data.stats,
            copper: res.data.copper || 2500,
            position: res.data.position,
            learned_spells: learnedSpells,
            action_bar: actionBar
          });
          return res.data;
        } catch (err) {
          get().handleApiError(err);
          console.error('Failed to fetch player:', err);
          throw err;
        }
      },
      
      createCharacter: async (characterData) => {
        set({ isLoading: true });
        try {
          const res = await axios.post(`${API}/player/character`, characterData, get().getHeaders());
          set({ isLoading: false, character: res.data.character });
          return res.data;
        } catch (err) {
          get().handleApiError(err);
          set({ isLoading: false, error: err.response?.data?.detail || 'Invalid token - please login again' });
          throw err;
        }
      },
      
      // Game State Actions
      learnSpell: async (spellId, cost) => {
        try {
          const res = await axios.post(`${API}/player/learn-spell`, { spell_id: spellId, cost }, get().getHeaders());
          set({ 
            learned_spells: [...(get().learned_spells || []), spellId],
            copper: res.data.new_copper
          });
          return res.data;
        } catch (err) {
          get().handleApiError(err);
          console.error('Failed to learn spell:', err);
          throw err;
        }
      },
      
      updateCopper: async (amount) => {
        try {
          const res = await axios.put(`${API}/player/copper`, { amount }, get().getHeaders());
          set({ copper: res.data.copper });
          return res.data.copper;
        } catch (err) {
          console.error('Failed to update copper:', err);
          throw err;
        }
      },
      
      saveActionBar: async (actionBar) => {
        try {
          await axios.put(`${API}/player/action-bar`, { action_bar: actionBar }, get().getHeaders());
          set({ action_bar: actionBar });
        } catch (err) {
          console.error('Failed to save action bar:', err);
        }
      },
      
      fetchGameState: async () => {
        try {
          const res = await axios.get(`${API}/player/game-state`, get().getHeaders());
          // Ensure autoAttack is always in learned_spells (core ability)
          const learnedSpells = res.data.learned_spells || [];
          if (!learnedSpells.includes('autoAttack')) {
            learnedSpells.unshift('autoAttack');
          }
          // Ensure autoAttack is in action_bar if not present
          const actionBar = res.data.action_bar || [null, null, null, null, null, null];
          if (!actionBar.includes('autoAttack')) {
            actionBar[0] = 'autoAttack';
          }
          set({
            learned_spells: learnedSpells,
            action_bar: actionBar,
            copper: res.data.copper || 2500,
            experience: res.data.experience,
            combat_level: res.data.combat_level,
            position: res.data.position
          });
          return res.data;
        } catch (err) {
          console.error('Failed to fetch game state:', err);
        }
      },
      
      updatePosition: async (position) => {
        try {
          // Also save current experience and level with position
          const updateData = {
            ...position,
            combat_level: get().combat_level,
            experience: get().experience
          };
          await axios.put(`${API}/player/position`, updateData, get().getHeaders());
          set({ position });
        } catch (err) {
          console.error('Failed to update position:', err);
        }
      },
      
      // Skills Actions
      trainSkill: async (skillName, xpGained) => {
        try {
          const res = await axios.post(`${API}/skills/train`, { skill_name: skillName, xp_gained: xpGained }, get().getHeaders());
          const skills = { ...get().skills };
          skills[skillName] = { level: res.data.level, xp: res.data.xp };
          set({ skills });
          
          if (res.data.level_up) {
            get().addNotification(`Level up! ${skillName} is now level ${res.data.level}!`, 'success');
          }
          return res.data;
        } catch (err) {
          console.error('Failed to train skill:', err);
          throw err;
        }
      },
      
      // Inventory Actions
      addItem: async (item) => {
        try {
          const res = await axios.post(`${API}/inventory/add`, item, get().getHeaders());
          set({ inventory: res.data.inventory });
          return res.data;
        } catch (err) {
          console.error('Failed to add item:', err);
          throw err;
        }
      },
      
      // Bag System Actions
      addItemToBag: (item) => {
        const { backpack, bags } = get();
        
        // Try to stack with existing item first
        let added = false;
        
        // Check backpack for stackable item
        const backpackCopy = [...backpack];
        for (let i = 0; i < backpackCopy.length; i++) {
          if (backpackCopy[i].id === item.id && item.type !== 'bag') {
            backpackCopy[i].quantity += item.quantity || 1;
            added = true;
            break;
          }
        }
        
        // If not stacked and backpack has space
        if (!added && backpackCopy.length < 16) {
          backpackCopy.push({ ...item, quantity: item.quantity || 1 });
          added = true;
        }
        
        // Try other bags if backpack is full
        const bagsCopy = [...bags];
        if (!added) {
          for (let bagIndex = 0; bagIndex < bagsCopy.length; bagIndex++) {
            const bag = bagsCopy[bagIndex];
            if (!bag.bagItem) continue;
            
            // Try to stack
            for (let i = 0; i < bag.items.length; i++) {
              if (bag.items[i].id === item.id && item.type !== 'bag') {
                bag.items[i].quantity += item.quantity || 1;
                added = true;
                break;
              }
            }
            
            // Add to empty slot if bag has space
            if (!added && bag.items.length < bag.bagItem.slots) {
              bag.items.push({ ...item, quantity: item.quantity || 1 });
              added = true;
              break;
            }
          }
        }
        
        if (added) {
          set({ backpack: backpackCopy, bags: bagsCopy });
          get().addNotification(`Looted: ${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`, 'success');
          return true;
        } else {
          get().addNotification('Inventory full!', 'error');
          return false;
        }
      },
      
      equipBag: (bagItem, slotIndex, sourceBagIndex, sourceItemIndex) => {
        if (slotIndex < 0 || slotIndex > 3) return;
        
        const bags = [...get().bags];
        const backpack = [...get().backpack];
        
        // Remove from source
        if (sourceBagIndex === 0) {
          // Remove from backpack
          backpack.splice(sourceItemIndex, 1);
        } else {
          // Remove from another bag
          bags[sourceBagIndex - 1].items.splice(sourceItemIndex, 1);
        }
        
        // Equip to bag slot
        bags[slotIndex] = {
          bagItem: bagItem,
          items: []
        };
        
        set({ bags, backpack });
        get().addNotification(`Equipped ${bagItem.name}`, 'success');
      },
      
      removeBag: (slotIndex) => {
        if (slotIndex < 0 || slotIndex > 3) return;
        
        const bags = [...get().bags];
        const bag = bags[slotIndex];
        
        // Return bag items to backpack if possible
        if (bag.items.length > 0) {
          get().addNotification('Empty the bag before removing it!', 'error');
          return;
        }
        
        bags[slotIndex] = { bagItem: null, items: [] };
        set({ bags });
      },
      
      removeItemFromBag: (bagIndex, itemIndex) => {
        const bags = [...get().bags];
        const backpack = [...get().backpack];
        
        if (bagIndex === 0) {
          backpack.splice(itemIndex, 1);
          set({ backpack });
        } else {
          bags[bagIndex - 1].items.splice(itemIndex, 1);
          set({ bags });
        }
      },
      
      equipItem: (item, sourceBagIndex, sourceItemIndex) => {
        const equipment = { ...get().equipment };
        
        // Validate item can be equipped in this slot
        if (item.type !== 'equipment' || !item.equipSlot) {
          get().addNotification('Cannot equip this item!', 'error');
          return;
        }
        
        // If slot already has item, swap it back to backpack
        if (equipment[item.equipSlot]) {
          const oldItem = equipment[item.equipSlot];
          get().addItemToBag(oldItem);
        }
        
        // Equip new item
        equipment[item.equipSlot] = item;
        
        // Remove from source bag
        get().removeItemFromBag(sourceBagIndex, sourceItemIndex);
        
        set({ equipment });
        get().addNotification(`Equipped ${item.name}`, 'success');
      },
      
      // Quest Actions
      fetchQuests: async () => {
        try {
          const res = await axios.get(`${API}/quests/available`, get().getHeaders());
          set({ quests: res.data });
          return res.data;
        } catch (err) {
          console.error('Failed to fetch quests:', err);
          throw err;
        }
      },
      
      acceptQuest: async (questId) => {
        try {
          const res = await axios.post(`${API}/quests/accept/${questId}`, {}, get().getHeaders());
          await get().fetchQuests();
          get().addNotification(`Quest accepted: ${res.data.quest.name}`, 'info');
          return res.data;
        } catch (err) {
          console.error('Failed to accept quest:', err);
          throw err;
        }
      },
      
      updateQuestProgress: async (questId, progress) => {
        try {
          const res = await axios.post(`${API}/quests/progress`, { quest_id: questId, progress }, get().getHeaders());
          if (res.data.complete) {
            get().addNotification('Quest completed! Check your rewards.', 'success');
            await get().fetchPlayer();
          }
          await get().fetchQuests();
          return res.data;
        } catch (err) {
          console.error('Failed to update quest:', err);
          throw err;
        }
      },
      
      // Combat Actions
      attackMonster: async (monsterType) => {
        try {
          const res = await axios.post(`${API}/combat/attack/${monsterType}`, {}, get().getHeaders());
          
          // Update stats
          set({ stats: { ...get().stats, hp: res.data.player_hp } });
          
          // Add to combat log
          const log = [...get().combatLog];
          log.push({
            type: 'attack',
            damage: res.data.damage_dealt,
            timestamp: Date.now()
          });
          if (res.data.damage_taken > 0) {
            log.push({
              type: 'damage',
              damage: res.data.damage_taken,
              timestamp: Date.now()
            });
          }
          set({ combatLog: log.slice(-20) });
          
          if (res.data.monster_defeated) {
            get().addNotification(`Monster defeated! +${res.data.xp_gained} XP`, 'success');
            if (res.data.drop) {
              get().addNotification(`Loot: ${res.data.drop}`, 'info');
            }
            await get().fetchPlayer();
          }
          
          return res.data;
        } catch (err) {
          console.error('Combat error:', err);
          throw err;
        }
      },
      
      heal: async () => {
        try {
          const res = await axios.post(`${API}/combat/heal`, {}, get().getHeaders());
          set({ stats: { ...get().stats, hp: res.data.hp } });
          get().addNotification(`Healed ${res.data.healed} HP`, 'success');
          await get().fetchPlayer();
          return res.data;
        } catch (err) {
          get().addNotification(err.response?.data?.detail || 'Cannot heal', 'error');
          throw err;
        }
      },
      
      // Terrain Actions
      fetchTerrain: async () => {
        try {
          const res = await axios.get(`${API}/terrain`);
          return res.data;
        } catch (err) {
          console.error('Failed to fetch terrain:', err);
          return { terrain: null, exists: false };
        }
      },
      
      saveTerrain: async (terrainData) => {
        try {
          const res = await axios.post(`${API}/terrain`, terrainData, get().getHeaders());
          console.log('Terrain saved:', res.data);
          return res.data;
        } catch (err) {
          console.error('Failed to save terrain:', err);
          throw err;
        }
      },
      
      modifyTerrain: async (modifications) => {
        try {
          const res = await axios.patch(`${API}/terrain`, {
            terrain_id: 'main_terrain',
            modifications
          }, get().getHeaders());
          return res.data;
        } catch (err) {
          console.error('Failed to modify terrain:', err);
          throw err;
        }
      },
      
      // UI Actions
      setActivePanel: (panel) => set({ activePanel: get().activePanel === panel ? null : panel }),
      closePanel: () => set({ activePanel: null }),
      
      addNotification: (message, type = 'info') => {
        const notification = { id: Date.now(), message, type };
        set({ notifications: [...get().notifications, notification] });
        setTimeout(() => {
          set({ notifications: get().notifications.filter(n => n.id !== notification.id) });
        }, 5000);
      },
      
      clearError: () => set({ error: null }),
      
      // Zone Actions
      setCurrentZone: (zone) => set({ currentZone: zone }),
      
      // World Editor Actions
      fetchWorldObjects: async (zone = null) => {
        try {
          const url = zone ? `${API}/world/objects?zone=${zone}` : `${API}/world/objects`;
          const res = await axios.get(url, get().getHeaders());
          return res.data.objects;
        } catch (err) {
          console.error('Failed to fetch world objects:', err);
          return [];
        }
      },
      
      saveWorldObject: async (object) => {
        try {
          const res = await axios.post(`${API}/world/objects`, object, get().getHeaders());
          return res.data.object;
        } catch (err) {
          console.error('Failed to save world object:', err);
          throw err;
        }
      },
      
      deleteWorldObject: async (objectId) => {
        try {
          await axios.delete(`${API}/world/objects/${objectId}`, get().getHeaders());
        } catch (err) {
          console.error('Failed to delete world object:', err);
          throw err;
        }
      },
      
      saveWorldObjectsBulk: async (objects, zone) => {
        try {
          await axios.post(`${API}/world/objects/bulk`, { objects, zone }, get().getHeaders());
        } catch (err) {
          console.error('Failed to save world objects:', err);
          throw err;
        }
      },
      
      // Custom Quest Actions
      createCustomQuest: async (quest) => {
        try {
          const res = await axios.post(`${API}/quests/custom/create`, quest, get().getHeaders());
          get().addNotification(`Quest "${quest.name}" created!`, 'success');
          return res.data.quest;
        } catch (err) {
          console.error('Failed to create quest:', err);
          get().addNotification('Failed to create quest', 'error');
          throw err;
        }
      },
      
      fetchCustomQuests: async () => {
        try {
          const res = await axios.get(`${API}/quests/custom/list`, get().getHeaders());
          return res.data.quests;
        } catch (err) {
          console.error('Failed to fetch custom quests:', err);
          return [];
        }
      },
      
      assignQuestToNPC: async (questId, npcData) => {
        try {
          await axios.put(`${API}/quests/custom/assign/${questId}`, npcData, get().getHeaders());
          get().addNotification('Quest assigned to NPC!', 'success');
        } catch (err) {
          console.error('Failed to assign quest:', err);
          get().addNotification('Failed to assign quest', 'error');
          throw err;
        }
      },
      
      getQuestByNPC: async (npcId) => {
        try {
          const res = await axios.get(`${API}/quests/custom/by-npc/${npcId}`, get().getHeaders());
          return res.data.quest;
        } catch (err) {
          console.error('Failed to get NPC quest:', err);
          return null;
        }
      },
      
      removeQuestFromNPC: async (questId) => {
        try {
          await axios.delete(`${API}/quests/custom/remove/${questId}`, get().getHeaders());
          get().addNotification('Quest removed from NPC', 'success');
        } catch (err) {
          console.error('Failed to remove quest:', err);
          get().addNotification('Failed to remove quest', 'error');
          throw err;
        }
      },
      
      // Global Quest Database Functions
      createGlobalQuest: async (quest) => {
        try {
          const res = await axios.post(`${API}/quests/global`, quest, get().getHeaders());
          get().addNotification('Quest saved to database!', 'success');
          return res.data.quest;
        } catch (err) {
          console.error('Failed to create global quest:', err);
          get().addNotification('Failed to save quest', 'error');
          throw err;
        }
      },
      
      fetchGlobalQuests: async () => {
        try {
          const res = await axios.get(`${API}/quests/global`);
          return res.data.quests || [];
        } catch (err) {
          console.error('Failed to fetch global quests:', err);
          return [];
        }
      },
      
      deleteGlobalQuest: async (questId) => {
        try {
          await axios.delete(`${API}/quests/global/${questId}`, get().getHeaders());
          get().addNotification('Quest deleted', 'success');
        } catch (err) {
          console.error('Failed to delete quest:', err);
          get().addNotification('Failed to delete quest', 'error');
          throw err;
        }
      },
      
      assignGlobalQuestToNPC: async (questId, npcId, npcName) => {
        try {
          await axios.put(`${API}/quests/global/${questId}/assign`, { npc_id: npcId, npc_name: npcName }, get().getHeaders());
          get().addNotification(`Quest assigned to ${npcName}!`, 'success');
        } catch (err) {
          console.error('Failed to assign quest:', err);
          get().addNotification('Failed to assign quest', 'error');
          throw err;
        }
      },
      
      unassignGlobalQuest: async (questId) => {
        try {
          await axios.put(`${API}/quests/global/${questId}/unassign`, {}, get().getHeaders());
          get().addNotification('Quest unassigned from NPC', 'success');
        } catch (err) {
          console.error('Failed to unassign quest:', err);
          get().addNotification('Failed to unassign quest', 'error');
          throw err;
        }
      },
    }),
    {
      name: 'quest-of-honor-storage',
      partialize: (state) => ({
        token: state.token,
        playerId: state.playerId,
        username: state.username,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
