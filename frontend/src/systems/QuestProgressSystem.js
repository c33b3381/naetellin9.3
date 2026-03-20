/**
 * QuestProgressSystem.js
 * Handles quest objective progress tracking and completion detection
 * Extracted from GameWorld.jsx for better code organization
 * 
 * Progress Flow:
 * 1. Enemy killed → updateKillObjective() → check match → increment
 * 2. Item collected → updateCollectObjective() → check match → increment
 * 3. Each objective increment → check if objective complete → notify
 * 4. All objectives complete → mark quest complete → notify
 */

// ==================== OBJECTIVE MATCHING ====================

/**
 * Check if enemy matches quest objective target
 * Uses flexible matching: exact match, partial match, or inclusion
 * 
 * @param {Array<string>} namesToMatch - Enemy names to check (priority order)
 * @param {Object} objective - Quest objective to match against
 * @returns {boolean} true if enemy matches objective
 */
export const isEnemyMatchForObjective = (namesToMatch, objective) => {
  if (!namesToMatch || namesToMatch.length === 0) {
    console.log('[MATCH] No names to match');
    return false;
  }
  
  const targetLower = objective.target?.toLowerCase() || '';
  const targetIdLower = objective.targetId?.toLowerCase() || '';
  
  console.log('[MATCH] Checking match - namesToMatch:', namesToMatch, 'targetLower:', targetLower);
  
  // Check if any name matches
  const matched = namesToMatch.some(name => {
    const exactMatch = name === targetLower;
    const exactIdMatch = name === targetIdLower;
    const targetIncludes = targetLower.includes(name);
    const nameIncludes = name.includes(targetLower);
    
    const result = exactMatch || exactIdMatch || targetIncludes || nameIncludes;
    console.log('[MATCH] Testing:', name, '→', { exactMatch, targetIncludes, nameIncludes, result });
    return result;
  });
  
  console.log('[MATCH] Final match result:', matched);
  return matched;
};

/**
 * Check if item matches quest objective target
 * 
 * @param {string} itemId - Item ID to check
 * @param {string} itemName - Item name to check
 * @param {Object} objective - Quest objective to match against
 * @returns {boolean} true if item matches objective
 */
export const isItemMatchForObjective = (itemId, itemName, objective) => {
  const targetLower = objective.target?.toLowerCase() || '';
  const targetIdLower = objective.targetId?.toLowerCase() || '';
  const itemIdLower = itemId?.toLowerCase() || '';
  const itemNameLower = itemName?.toLowerCase() || '';
  
  return itemIdLower === targetIdLower || 
         itemNameLower === targetLower ||
         targetLower.includes(itemNameLower) ||
         itemNameLower.includes(targetLower);
};

// ==================== OBJECTIVE PROGRESS ====================

/**
 * Update a single kill objective if it matches the killed enemy
 * 
 * @param {Object} objective - Objective to potentially update
 * @param {Array<string>} namesToMatch - Enemy names (priority: custom, name, type)
 * @param {Function} addNotification - Notification function
 * @returns {Object} Result {objective, updated, complete}
 */
export const updateKillObjective = (objective, namesToMatch, addNotification) => {
  // Check if this is a kill objective
  const isKillObjective = objective.type === 'kill' || 
                         (objective.target && objective.description?.toLowerCase().includes('kill'));
  
  if (!isKillObjective) {
    return { objective, updated: false, complete: false };
  }
  
  // Check if enemy matches
  if (!isEnemyMatchForObjective(namesToMatch, objective)) {
    return { objective, updated: false, complete: false };
  }
  
  // Check if objective already complete
  if ((objective.current || 0) >= objective.required) {
    return { objective, updated: false, complete: true };
  }
  
  // Increment progress
  const newCurrent = (objective.current || 0) + 1;
  const updatedObjective = { ...objective, current: newCurrent };
  
  // Notify progress
  if (addNotification) {
    addNotification(
      `Quest Progress: ${objective.target || 'Enemy'} ${newCurrent}/${objective.required}`,
      'quest'
    );
    
    // Check if objective just completed
    if (newCurrent >= objective.required) {
      addNotification(
        `Objective Complete: Kill ${objective.required} ${objective.target || 'enemies'}`,
        'success'
      );
    }
  }
  
  return {
    objective: updatedObjective,
    updated: true,
    complete: newCurrent >= objective.required
  };
};

/**
 * Update a single collect objective if it matches the collected item
 * 
 * @param {Object} objective - Objective to potentially update
 * @param {string} itemId - Collected item ID
 * @param {string} itemName - Collected item name
 * @param {number} quantity - Quantity collected
 * @param {Function} addNotification - Notification function
 * @returns {Object} Result {objective, updated, complete}
 */
export const updateCollectObjective = (objective, itemId, itemName, quantity, addNotification) => {
  // Check if this is a collect objective
  if (objective.type !== 'collect') {
    return { objective, updated: false, complete: false };
  }
  
  // Check if item matches
  if (!isItemMatchForObjective(itemId, itemName, objective)) {
    return { objective, updated: false, complete: false };
  }
  
  // Check if objective already complete
  if ((objective.current || 0) >= objective.required) {
    return { objective, updated: false, complete: true };
  }
  
  // Increment progress (capped at required)
  const newCurrent = Math.min((objective.current || 0) + quantity, objective.required);
  const updatedObjective = { ...objective, current: newCurrent };
  
  // Notify progress
  if (addNotification) {
    addNotification(
      `Quest Progress: ${objective.target || 'Item'} ${newCurrent}/${objective.required}`,
      'quest'
    );
    
    // Check if objective just completed
    if (newCurrent >= objective.required) {
      addNotification(
        `Objective Complete: Collect ${objective.required} ${objective.target || 'items'}`,
        'success'
      );
    }
  }
  
  return {
    objective: updatedObjective,
    updated: true,
    complete: newCurrent >= objective.required
  };
};

// ==================== QUEST PROGRESS ====================

/**
 * Update all objectives in a quest based on an enemy kill
 * 
 * @param {Object} quest - Quest to update
 * @param {Array<string>} namesToMatch - Enemy names to match
 * @param {Function} addNotification - Notification function
 * @returns {Object} Result {quest, updated, allComplete}
 */
export const updateQuestForEnemyKill = (quest, namesToMatch, addNotification) => {
  if (!quest.objectives) {
    console.log('[QUEST MATCH] Quest has no objectives:', quest.name);
    return { quest, updated: false, allComplete: false };
  }
  
  console.log('[QUEST MATCH] Checking quest:', quest.name);
  console.log('[QUEST MATCH] Names to match:', namesToMatch);
  console.log('[QUEST MATCH] Quest objectives:', quest.objectives);
  
  let anyUpdated = false;
  
  // Update all objectives
  const updatedObjectives = quest.objectives.map(obj => {
    console.log('[QUEST MATCH] Checking objective:', obj);
    const result = updateKillObjective(obj, namesToMatch, addNotification);
    console.log('[QUEST MATCH] Objective result:', { updated: result.updated, current: result.objective.current });
    if (result.updated) anyUpdated = true;
    return result.objective;
  });
  
  // Check if all objectives are complete
  const allComplete = updatedObjectives.every(obj => (obj.current || 0) >= obj.required);
  
  // Create updated quest
  let updatedQuest = { ...quest, objectives: updatedObjectives };
  
  // Mark quest complete if all objectives done
  if (allComplete && !quest.isComplete) {
    if (addNotification) {
      addNotification(`Quest "${quest.name}" is ready to turn in!`, 'success');
    }
    updatedQuest.isComplete = true;
  }
  
  console.log('[QUEST MATCH] Final result - anyUpdated:', anyUpdated, 'allComplete:', allComplete);
  
  return {
    quest: updatedQuest,
    updated: anyUpdated,
    allComplete
  };
};

/**
 * Update all objectives in a quest based on an item collection
 * 
 * @param {Object} quest - Quest to update
 * @param {string} itemId - Collected item ID
 * @param {string} itemName - Collected item name
 * @param {number} quantity - Quantity collected
 * @param {Function} addNotification - Notification function
 * @returns {Object} Result {quest, updated, allComplete}
 */
export const updateQuestForItemCollection = (quest, itemId, itemName, quantity, addNotification) => {
  if (!quest.objectives) {
    return { quest, updated: false, allComplete: false };
  }
  
  let anyUpdated = false;
  
  // Update all objectives
  const updatedObjectives = quest.objectives.map(obj => {
    const result = updateCollectObjective(obj, itemId, itemName, quantity, addNotification);
    if (result.updated) anyUpdated = true;
    return result.objective;
  });
  
  // Check if all objectives are complete
  const allComplete = updatedObjectives.every(obj => (obj.current || 0) >= obj.required);
  
  // Create updated quest
  let updatedQuest = { ...quest, objectives: updatedObjectives };
  
  // Mark quest complete if all objectives done
  if (allComplete && !quest.isComplete) {
    if (addNotification) {
      addNotification(`Quest "${quest.name}" is ready to turn in!`, 'success');
    }
    updatedQuest.isComplete = true;
  }
  
  return {
    quest: updatedQuest,
    updated: anyUpdated,
    allComplete
  };
};

// ==================== QUEST LIST UPDATES ====================

/**
 * Update entire quest list (active or custom) for an enemy kill
 * 
 * @param {Array<Object>} quests - Quest list to update
 * @param {string} enemyName - Enemy name
 * @param {string} enemyType - Enemy type
 * @param {string} customName - Custom enemy name (priority)
 * @param {Function} addNotification - Notification function
 * @param {boolean} requiresNpcAssignment - If true, only update quests with npc_id
 * @returns {Object} Result {updatedQuests, anyUpdated}
 */
export const updateQuestListForEnemyKill = (
  quests,
  enemyName,
  enemyType,
  customName,
  addNotification,
  requiresNpcAssignment = false
) => {
  // Build priority-ordered name list
  const namesToMatch = [
    customName?.toLowerCase(),
    enemyName?.toLowerCase(),
    enemyType?.toLowerCase()
  ].filter(Boolean);
  
  let anyUpdated = false;
  
  const updatedQuests = quests.map(quest => {
    // Skip if quest requires NPC assignment and doesn't have one
    if (requiresNpcAssignment && !quest.npc_id) {
      return quest;
    }
    
    const result = updateQuestForEnemyKill(quest, namesToMatch, addNotification);
    if (result.updated) anyUpdated = true;
    return result.quest;
  });
  
  return {
    updatedQuests,
    anyUpdated
  };
};

/**
 * Update entire quest list (active or custom) for an item collection
 * 
 * @param {Array<Object>} quests - Quest list to update
 * @param {string} itemId - Collected item ID
 * @param {string} itemName - Collected item name
 * @param {number} quantity - Quantity collected
 * @param {Function} addNotification - Notification function
 * @param {boolean} requiresNpcAssignment - If true, only update quests with npc_id
 * @returns {Object} Result {updatedQuests, anyUpdated}
 */
export const updateQuestListForItemCollection = (
  quests,
  itemId,
  itemName,
  quantity,
  addNotification,
  requiresNpcAssignment = false
) => {
  let anyUpdated = false;
  
  const updatedQuests = quests.map(quest => {
    // Skip if quest requires NPC assignment and doesn't have one
    if (requiresNpcAssignment && !quest.npc_id) {
      return quest;
    }
    
    const result = updateQuestForItemCollection(quest, itemId, itemName, quantity, addNotification);
    if (result.updated) anyUpdated = true;
    return result.quest;
  });
  
  return {
    updatedQuests,
    anyUpdated
  };
};

// ==================== EXPORTS ====================

export default {
  // Matching
  isEnemyMatchForObjective,
  isItemMatchForObjective,
  
  // Single objective updates
  updateKillObjective,
  updateCollectObjective,
  
  // Single quest updates
  updateQuestForEnemyKill,
  updateQuestForItemCollection,
  
  // Quest list updates
  updateQuestListForEnemyKill,
  updateQuestListForItemCollection
};
