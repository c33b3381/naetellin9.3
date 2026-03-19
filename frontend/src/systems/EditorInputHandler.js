/**
 * EditorInputHandler.js
 * Consolidated editor-specific keyboard shortcut handling
 * Extracted from InputSystem.js for better separation of concerns
 * 
 * Handles all editor-related keyboard shortcuts:
 * - F1-F7: Editor panel toggles
 * - Delete/Backspace: Delete selected objects
 * - Ctrl+C: Copy selected enemy
 * - Ctrl+S: Save world
 */

// ==================== EDITOR KEY CONSTANTS ====================

export const EDITOR_KEYS = {
  'F1': 'worldEditor',
  'F2': 'terrainEditor',
  'F3': 'enemyEditor',
  'F4': 'itemEditor',
  'F5': 'mapEditorMode',
  'F6': 'flightMode',
  'F7': 'questMaker',
};

export const EDITOR_KEY_DESCRIPTIONS = {
  'F1': 'Toggle World Editor (place objects, NPCs)',
  'F2': 'Toggle Terrain Editor (sculpt terrain)',
  'F3': 'Toggle Enemy Editor (spawn enemies)',
  'F4': 'Toggle Item Database Editor',
  'F5': 'Toggle Map Editor Mode (detached camera)',
  'F6': 'Toggle Flight Mode (only in map editor)',
  'F7': 'Toggle Quest Maker (create custom quests)',
};

// ==================== EDITOR SHORTCUT PROCESSORS ====================

/**
 * Process Ctrl+S save world shortcut
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Function} onSaveWorld - Save world callback
 * @returns {boolean} true if handled
 */
export const processEditorSaveShortcut = (e, onSaveWorld) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault();
    if (onSaveWorld) {
      onSaveWorld();
    }
    return true;
  }
  return false;
};

/**
 * Process editor toggle keys (F1-F7)
 * Handles opening/closing editor panels and modes
 * 
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} refs - Required refs
 * @param {Object} callbacks - Editor state setters
 * @returns {boolean} true if handled
 */
export const processEditorToggleKeys = (e, refs, callbacks, helpers = {}) => {
  const { 
    isMapEditorModeRef, 
    isFlightModeRef, 
    playerRef, 
    mapEditorCameraState 
  } = refs;
  
  const {
    setIsEditorOpen,
    setIsTerrainEditorOpen,
    setIsEnemyEditorOpen,
    setIsItemEditorOpen,
    setIsMapEditorMode,
    setIsFlightMode,
    setIsQuestMakerOpen,
  } = callbacks;
  
  const { getTerrainHeight } = helpers;
  
  switch (e.code) {
    case 'F1':
      e.preventDefault();
      setIsEditorOpen(prev => !prev);
      setIsTerrainEditorOpen(false);
      setIsEnemyEditorOpen(false);
      return true;
      
    case 'F2':
      e.preventDefault();
      setIsTerrainEditorOpen(prev => !prev);
      setIsEditorOpen(false);
      setIsEnemyEditorOpen(false);
      return true;
      
    case 'F3':
      e.preventDefault();
      setIsEnemyEditorOpen(prev => !prev);
      setIsEditorOpen(false);
      setIsTerrainEditorOpen(false);
      return true;
      
    case 'F4':
      e.preventDefault();
      setIsItemEditorOpen(prev => !prev);
      return true;
      
    case 'F5':
      e.preventDefault();
      setIsMapEditorMode(prev => {
        const newMode = !prev;
        if (newMode && playerRef.current && mapEditorCameraState?.current) {
          // Store player position when entering map editor mode
          mapEditorCameraState.current.x = playerRef.current.position.x;
          mapEditorCameraState.current.z = playerRef.current.position.z;
        }
        // Exit flight mode when leaving map editor mode
        if (!newMode && isFlightModeRef?.current) {
          setIsFlightMode(false);
        }
        return newMode;
      });
      return true;
      
    case 'F6':
      e.preventDefault();
      e.stopPropagation();
      // F6 only works in map editor mode
      if (isMapEditorModeRef?.current) {
        setIsFlightMode(prev => {
          const newFlightMode = !prev;
          if (newFlightMode && playerRef.current && getTerrainHeight && mapEditorCameraState?.current) {
            // Entering flight mode - set to player height + 8
            const terrainHeight = getTerrainHeight(
              mapEditorCameraState.current.x,
              mapEditorCameraState.current.z
            );
            mapEditorCameraState.current.height = terrainHeight + 8;
          }
          return newFlightMode;
        });
      }
      return true;
      
    case 'F7':
      e.preventDefault();
      setIsQuestMakerOpen(prev => !prev);
      return true;
      
    default:
      return false;
  }
};

/**
 * Process Delete/Backspace key for deleting selected editor objects
 * Works for both world editor objects and enemy editor enemies
 * 
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} editorStates - Current editor states
 * @param {Object} callbacks - Delete action callbacks
 * @returns {boolean} true if handled
 */
export const processEditorDeleteKey = (e, editorStates, callbacks) => {
  if (e.code !== 'Delete' && e.code !== 'Backspace') return false;
  
  const { selectedEditObject, isEditorOpen, selectedEditEnemy, isEnemyEditorOpen } = editorStates;
  const { handleDeleteObject, handleDeleteEnemy } = callbacks;
  
  // Delete selected edit object in world editor
  if (selectedEditObject && isEditorOpen) {
    e.preventDefault();
    handleDeleteObject(selectedEditObject.id);
    return true;
  }
  
  // Delete selected enemy in enemy editor
  if (selectedEditEnemy && isEnemyEditorOpen) {
    e.preventDefault();
    handleDeleteEnemy(selectedEditEnemy.id);
    return true;
  }
  
  return false;
};

/**
 * Process Ctrl+C for copying enemies in enemy editor
 * Creates a duplicate with random offset
 * 
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} editorStates - Current editor states
 * @param {Object} callbacks - Place enemy callback
 * @returns {boolean} true if handled
 */
export const processEditorCopyKey = (e, editorStates, callbacks) => {
  if (e.code !== 'KeyC' || !e.ctrlKey) return false;
  
  const { selectedEditEnemy, isEnemyEditorOpen } = editorStates;
  const { handlePlaceEnemy } = callbacks;
  
  if (selectedEditEnemy && isEnemyEditorOpen) {
    e.preventDefault();
    // Duplicate the enemy with random offset
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetZ = (Math.random() - 0.5) * 10;
    handlePlaceEnemy({
      ...selectedEditEnemy,
      name: selectedEditEnemy.name + ' (Copy)',
      position: {
        x: (selectedEditEnemy.position?.x || 0) + offsetX,
        y: 0,
        z: (selectedEditEnemy.position?.z || 0) + offsetZ
      },
      currentHealth: selectedEditEnemy.maxHealth
    });
    return true;
  }
  
  return false;
};

/**
 * Process all editor-specific keyboard shortcuts
 * Central dispatcher for editor input handling
 * 
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} config - Configuration object
 * @param {Object} config.refs - Required refs
 * @param {Object} config.editorStates - Current editor states
 * @param {Object} config.callbacks - Action callbacks
 * @param {Object} config.helpers - Helper functions
 * @returns {boolean} true if handled by any editor shortcut
 */
export const processAllEditorShortcuts = (e, config) => {
  const { refs, editorStates, callbacks, helpers } = config;
  
  // Try each editor shortcut processor in priority order
  if (processEditorSaveShortcut(e, callbacks.onSaveWorld)) return true;
  if (processEditorToggleKeys(e, refs, callbacks, helpers)) return true;
  if (processEditorDeleteKey(e, editorStates, callbacks)) return true;
  if (processEditorCopyKey(e, editorStates, callbacks)) return true;
  
  return false;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Check if any editor panel is currently open
 * @param {Object} editorStates - Current editor states
 * @returns {boolean} true if any editor is open
 */
export const isAnyEditorOpen = (editorStates) => {
  return editorStates.isEditorOpen || 
         editorStates.isTerrainEditorOpen || 
         editorStates.isEnemyEditorOpen ||
         editorStates.isItemEditorOpen ||
         editorStates.isQuestMakerOpen;
};

/**
 * Get list of currently active editor modes
 * @param {Object} editorStates - Current editor states
 * @returns {string[]} Array of active editor names
 */
export const getActiveEditors = (editorStates) => {
  const active = [];
  if (editorStates.isEditorOpen) active.push('World Editor');
  if (editorStates.isTerrainEditorOpen) active.push('Terrain Editor');
  if (editorStates.isEnemyEditorOpen) active.push('Enemy Editor');
  if (editorStates.isItemEditorOpen) active.push('Item Database');
  if (editorStates.isQuestMakerOpen) active.push('Quest Maker');
  if (editorStates.isMapEditorMode) active.push('Map Editor Mode');
  if (editorStates.isFlightMode) active.push('Flight Mode');
  return active;
};

export default {
  EDITOR_KEYS,
  EDITOR_KEY_DESCRIPTIONS,
  processEditorSaveShortcut,
  processEditorToggleKeys,
  processEditorDeleteKey,
  processEditorCopyKey,
  processAllEditorShortcuts,
  isAnyEditorOpen,
  getActiveEditors
};
