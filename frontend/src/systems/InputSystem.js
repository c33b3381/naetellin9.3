/**
 * InputSystem.js
 * 
 * Centralized input handling for keyboard events.
 * Extracted from GameWorld.jsx to modularize input processing.
 * 
 * This module provides:
 * - Key binding configuration
 * - Input state management
 * - Event handler factories
 * - Input registration/cleanup utilities
 */

// ==================== KEY BINDING CONSTANTS ====================

// Movement keys (handled by PlayerMovementSystem)
export const MOVEMENT_KEYS = ['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight', 'Space'];

// Action bar hotkeys (1-6)
export const ACTION_BAR_KEYS = {
  'Digit1': 0,
  'Numpad1': 0,
  'Digit2': 1,
  'Numpad2': 1,
  'Digit3': 2,
  'Numpad3': 2,
  'Digit4': 3,
  'Numpad4': 3,
  'Digit5': 4,
  'Numpad5': 4,
  'Digit6': 5,
  'Numpad6': 5,
};

// Editor toggle keys
export const EDITOR_KEYS = {
  'F1': 'worldEditor',
  'F2': 'terrainEditor',
  'F3': 'enemyEditor',
  'F4': 'itemEditor',
  'F5': 'mapEditorMode',
  'F6': 'flightMode',
  'F7': 'questMaker',
};

// Panel toggle keys
export const PANEL_KEYS = {
  'KeyL': 'questLog',
  'KeyP': 'spellBook',
  'KeyM': 'worldMap',
  'KeyB': 'backpack',
  'KeyC': 'characterPanel',
};

// ==================== INPUT STATE ====================

/**
 * Create initial input state object
 */
export const createInputState = () => ({
  // Track which keys are currently pressed
  pressedKeys: new Set(),
  // Track modifier keys
  ctrlPressed: false,
  shiftPressed: false,
  altPressed: false,
});

// ==================== KEY HANDLER PROCESSING ====================

/**
 * Process Ctrl+S save world shortcut
 * @returns {boolean} true if handled
 */
export const processSaveShortcut = (e, callbacks) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault();
    if (callbacks.onSaveWorld) {
      callbacks.onSaveWorld();
    }
    return true;
  }
  return false;
};

/**
 * Check if dialog blocking keys (except Escape and M)
 * @param {Object} panelStates - Current panel open states
 * @returns {boolean} true if a blocking dialog is open
 */
export const isDialogBlocking = (panelStates) => {
  const blockingDialogs = [
    'isQuestDialogOpen',
    'isQuestLogOpen',
    'isTrainerOpen',
    'isSpellBookOpen',
    'isCharacterPanelOpen',
    'isItemEditorOpen',
    'isWorldMapOpen',
  ];
  
  return blockingDialogs.some(dialog => panelStates[dialog]);
};

/**
 * Close all blocking dialogs
 * @param {Object} callbacks - Callback setters for panel states
 */
export const closeAllDialogs = (callbacks) => {
  if (callbacks.setIsQuestDialogOpen) callbacks.setIsQuestDialogOpen(false);
  if (callbacks.setIsQuestLogOpen) callbacks.setIsQuestLogOpen(false);
  if (callbacks.setIsTrainerOpen) callbacks.setIsTrainerOpen(false);
  if (callbacks.setIsSpellBookOpen) callbacks.setIsSpellBookOpen(false);
  if (callbacks.setIsCharacterPanelOpen) callbacks.setIsCharacterPanelOpen(false);
  if (callbacks.setIsItemEditorOpen) callbacks.setIsItemEditorOpen(false);
  if (callbacks.setIsWorldMapOpen) callbacks.setIsWorldMapOpen(false);
};

/**
 * Process movement keys
 * @returns {boolean} true if handled
 */
export const processMovementKey = (e, movementState, handleMovementKeyDown) => {
  if (MOVEMENT_KEYS.includes(e.code)) {
    handleMovementKeyDown(e, movementState);
    return true;
  }
  return false;
};

/**
 * Process map editor camera controls (R, F, Q, E keys)
 * @returns {boolean} true if handled
 */
export const processMapEditorCameraKey = (e, isMapEditorMode, mapEditorCameraState, movementState) => {
  if (!isMapEditorMode) return false;
  
  switch (e.code) {
    case 'KeyR':
      // Increase tilt (more top-down)
      mapEditorCameraState.tilt = Math.min(
        mapEditorCameraState.maxTilt,
        mapEditorCameraState.tilt + 0.1
      );
      return true;
    case 'KeyF':
      // Decrease tilt (more angled)
      mapEditorCameraState.tilt = Math.max(
        mapEditorCameraState.minTilt,
        mapEditorCameraState.tilt - 0.1
      );
      return true;
    case 'KeyQ':
      // Rotate camera left
      mapEditorCameraState.rotationY += 0.1;
      return true;
    case 'KeyE':
      // Rotate camera right
      mapEditorCameraState.rotationY -= 0.1;
      return true;
    default:
      return false;
  }
};

/**
 * Process non-map-editor R key (auto-run toggle)
 * @returns {boolean} true if handled
 */
export const processAutoRunKey = (e, isMapEditorMode, movementState) => {
  if (e.code === 'KeyR' && !isMapEditorMode) {
    movementState.autoRun = !movementState.autoRun;
    return true;
  }
  return false;
};

/**
 * Process Tab key for target nearest enemy
 * @returns {boolean} true if handled
 */
export const processTabTargeting = (e, refs, callbacks) => {
  if (e.code !== 'Tab') return false;
  
  e.preventDefault();
  
  const { playerRef, selectableObjects, targetIndicatorRef } = refs;
  const { setSelectedTarget } = callbacks;
  
  if (!playerRef.current) return true;
  
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  selectableObjects.current.forEach(obj => {
    if (obj.userData.hostile) {
      const dist = playerRef.current.position.distanceTo(obj.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = obj;
      }
    }
  });
  
  if (nearestEnemy) {
    setSelectedTarget(nearestEnemy);
    targetIndicatorRef.current.visible = true;
    targetIndicatorRef.current.position.copy(nearestEnemy.position);
    targetIndicatorRef.current.position.y = 0.05;
    targetIndicatorRef.current.material.color.setHex(0xff0000);
  }
  
  return true;
};

/**
 * Process action bar hotkey (1-6)
 * @returns {boolean} true if handled
 */
export const processActionBarKey = (e, actionBarSpells, selectedTarget, refs, callbacks) => {
  const slotIndex = ACTION_BAR_KEYS[e.code];
  if (slotIndex === undefined) return false;
  
  const { selectedTargetRef, scene } = refs;
  const { 
    handleCastSpell, 
    attackMonster, 
    createDamageText, 
    damageTextsRef,
    monsterHealthBarsRef,
    setCombatLog,
    addNotification,
    setSelectedTarget,
    targetIndicatorRef,
    selectableObjects
  } = callbacks;
  
  // Slot 1 special case: attack if hostile target selected
  if (slotIndex === 0) {
    const attackTarget = selectedTargetRef.current;
    if (attackTarget && attackTarget.userData.hostile) {
      const monsterType = attackTarget.userData.monsterType || 'goblin';
      const monsterId = attackTarget.userData.monsterId;
      const targetPosition = attackTarget.position.clone();
      
      attackMonster(monsterType).then(result => {
        if (result.damage_dealt > 0 && createDamageText) {
          const damageSprite = createDamageText(scene, targetPosition, result.damage_dealt, false);
          damageTextsRef.current.push(damageSprite);
        }
        if (result.damage_taken > 0 && refs.playerRef.current && createDamageText) {
          const playerDamageSprite = createDamageText(scene, refs.playerRef.current.position.clone(), result.damage_taken, true);
          damageTextsRef.current.push(playerDamageSprite);
        }
        const healthBarData = monsterHealthBarsRef.current[monsterId];
        if (healthBarData && healthBarData.healthBar) {
          const hpPercent = Math.max(0, result.monster_hp / attackTarget.userData.maxHealth);
          healthBarData.healthBar.scale.x = hpPercent;
          healthBarData.healthBar.position.x = -(healthBarData.maxWidth * (1 - hpPercent)) / 2;
          attackTarget.userData.currentHealth = result.monster_hp;
        }
        setCombatLog(prev => [...prev.slice(-9), {
          time: Date.now(),
          text: `You hit ${attackTarget.name} for ${result.damage_dealt} damage!`
        }]);
        if (result.damage_taken > 0) {
          setCombatLog(prev => [...prev.slice(-9), {
            time: Date.now(),
            text: `${attackTarget.name} hits you for ${result.damage_taken} damage!`
          }]);
        }
        if (result.monster_defeated) {
          addNotification(`Defeated ${attackTarget.name}! +${result.xp_gained} XP`, 'success');
          setTimeout(() => {
            scene.remove(attackTarget);
            selectableObjects.current = selectableObjects.current.filter(obj => obj !== attackTarget);
            delete monsterHealthBarsRef.current[monsterId];
            setSelectedTarget(null);
            targetIndicatorRef.current.visible = false;
          }, 500);
          if (result.drop) {
            setCombatLog(prev => [...prev.slice(-9), { time: Date.now(), text: `Loot: ${result.drop}` }]);
          }
        }
      }).catch(err => {
        console.error('Attack failed:', err);
        addNotification('Attack failed!', 'error');
      });
      return true;
    }
  }
  
  // Use spell from action bar slot
  handleCastSpell(actionBarSpells[slotIndex]);
  return true;
};

/**
 * Process panel toggle keys (L, P, M, B, C)
 * @returns {boolean} true if handled
 */
export const processPanelToggleKey = (e, callbacks) => {
  switch (e.code) {
    case 'KeyL':
      callbacks.setIsQuestLogOpen?.(prev => !prev);
      return true;
    case 'KeyP':
      e.preventDefault();
      callbacks.setIsSpellBookOpen?.(prev => !prev);
      return true;
    case 'KeyM':
      e.preventDefault();
      callbacks.setIsWorldMapOpen?.(prev => !prev);
      return true;
    case 'KeyB':
      e.preventDefault();
      callbacks.setOpenBagIndex?.(prev => prev === 0 ? null : 0);
      return true;
    case 'KeyC':
      // Only toggle character panel if not Ctrl+C (copy)
      if (!e.ctrlKey) {
        e.preventDefault();
        callbacks.setIsCharacterPanelOpen?.(prev => !prev);
        return true;
      }
      return false;
    default:
      return false;
  }
};

/**
 * Process Escape key - deselect target and close panels
 * @returns {boolean} true if handled
 */
export const processEscapeKey = (e, panelStates, refs, callbacks) => {
  if (e.code !== 'Escape') return false;
  
  const { targetIndicatorRef } = refs;
  const { 
    setSelectedTarget, 
    setIsAutoAttacking,
    setIsWorldMapOpen,
    setIsEditorOpen,
    setIsSpellBookOpen,
    setIsTerrainEditorOpen,
    setIsEnemyEditorOpen,
    setOpenBagIndex,
    setIsCharacterPanelOpen,
    setIsItemEditorOpen
  } = callbacks;
  
  // Deselect target and stop auto-attack
  setSelectedTarget(null);
  setIsAutoAttacking(false);
  if (targetIndicatorRef.current) {
    targetIndicatorRef.current.visible = false;
  }
  
  // Close any open panels
  if (panelStates.isWorldMapOpen) setIsWorldMapOpen(false);
  if (panelStates.isEditorOpen) setIsEditorOpen(false);
  if (panelStates.isSpellBookOpen) setIsSpellBookOpen(false);
  if (panelStates.isTerrainEditorOpen) setIsTerrainEditorOpen(false);
  if (panelStates.isEnemyEditorOpen) setIsEnemyEditorOpen(false);
  if (panelStates.openBagIndex !== null) setOpenBagIndex(null);
  if (panelStates.isCharacterPanelOpen) setIsCharacterPanelOpen(false);
  if (panelStates.isItemEditorOpen) setIsItemEditorOpen(false);
  
  return true;
};

/**
 * Process editor toggle keys (F1-F7)
 * @returns {boolean} true if handled
 */
export const processEditorToggleKey = (e, refs, callbacks, getTerrainHeight) => {
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
        if (newMode && playerRef.current) {
          // Store player position when entering map editor mode
          mapEditorCameraState.current.x = playerRef.current.position.x;
          mapEditorCameraState.current.z = playerRef.current.position.z;
        }
        // Exit flight mode when leaving map editor mode
        if (!newMode && isFlightModeRef.current) {
          setIsFlightMode(false);
        }
        return newMode;
      });
      return true;
      
    case 'F6':
      e.preventDefault();
      e.stopPropagation();
      // F6 only works in map editor mode
      if (isMapEditorModeRef.current) {
        setIsFlightMode(prev => {
          const newFlightMode = !prev;
          if (newFlightMode && playerRef.current && getTerrainHeight) {
            // Entering flight mode - set to player height * 4
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
 * Process Delete/Backspace key for deleting selected objects
 * @returns {boolean} true if handled
 */
export const processDeleteKey = (e, editorStates, callbacks) => {
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
 * Process Ctrl+C for copying enemies
 * @returns {boolean} true if handled
 */
export const processCopyEnemyKey = (e, editorStates, callbacks) => {
  if (e.code !== 'KeyC' || !e.ctrlKey) return false;
  
  const { selectedEditEnemy, isEnemyEditorOpen } = editorStates;
  const { handlePlaceEnemy } = callbacks;
  
  if (selectedEditEnemy && isEnemyEditorOpen) {
    e.preventDefault();
    // Duplicate the enemy with offset
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

// ==================== MAIN HANDLER FACTORIES ====================

/**
 * Create the main keydown handler function
 * This factory creates a handler with all necessary dependencies injected
 * 
 * @param {Object} config - Configuration object containing:
 *   - refs: React refs (playerRef, targetIndicatorRef, etc.)
 *   - stateRefs: Refs to current state values (for reading current values in handlers)
 *   - callbacks: State setters and action handlers
 *   - systems: External system functions (handleMovementKeyDown, etc.)
 *   - helpers: Helper functions (getTerrainHeight, etc.)
 * @returns {Function} Event handler function
 */
export const createKeyDownHandler = (config) => {
  const { refs, stateRefs, callbacks, systems, helpers } = config;
  
  return (e) => {
    // Ctrl+S to save world
    if (processSaveShortcut(e, callbacks)) return;
    
    // Check if dialog is blocking (except Escape and M)
    // Use stateRefs to get current values
    const panelStates = {
      isQuestDialogOpen: stateRefs.isQuestDialogOpenRef?.current ?? false,
      isQuestLogOpen: stateRefs.isQuestLogOpenRef?.current ?? false,
      isTrainerOpen: stateRefs.isTrainerOpenRef?.current ?? false,
      isSpellBookOpen: stateRefs.isSpellBookOpenRef?.current ?? false,
      isCharacterPanelOpen: stateRefs.isCharacterPanelOpenRef?.current ?? false,
      isItemEditorOpen: stateRefs.isItemEditorOpenRef?.current ?? false,
      isWorldMapOpen: stateRefs.isWorldMapOpenRef?.current ?? false,
    };
    
    if (isDialogBlocking(panelStates)) {
      if (e.code === 'Escape' || e.code === 'KeyM') {
        closeAllDialogs(callbacks);
      }
      return;
    }
    
    // Process keys in priority order
    
    // Movement keys
    if (MOVEMENT_KEYS.includes(e.code)) {
      systems.handleMovementKeyDown(e, refs.movementState.current);
      return;
    }
    
    // Quest Log (L key) - special case, not a movement key
    if (e.code === 'KeyL') {
      callbacks.setIsQuestLogOpen(prev => !prev);
      return;
    }
    
    // Map editor camera controls (R, F, Q, E in map editor mode)
    if (processMapEditorCameraKey(e, refs.isMapEditorModeRef.current, refs.mapEditorCameraState.current, refs.movementState.current)) {
      return;
    }
    
    // Auto-run toggle (R key outside map editor)
    if (processAutoRunKey(e, refs.isMapEditorModeRef.current, refs.movementState.current)) {
      return;
    }
    
    // Tab targeting
    if (processTabTargeting(e, refs, callbacks)) {
      return;
    }
    
    // Action bar hotkeys (1-6)
    // Get current values from stateRefs
    const actionBarSpells = stateRefs.actionBarSpellsRef?.current ?? [];
    const selectedTarget = stateRefs.selectedTargetRef?.current ?? null;
    if (processActionBarKey(e, actionBarSpells, selectedTarget, refs, callbacks)) {
      return;
    }
    
    // Panel toggles (P, M, B, C)
    if (processPanelToggleKey(e, callbacks)) {
      return;
    }
    
    // Escape key - use current state values from refs
    const escapePanelStates = {
      isWorldMapOpen: stateRefs.isWorldMapOpenRef?.current ?? false,
      isEditorOpen: stateRefs.isEditorOpenRef?.current ?? false,
      isSpellBookOpen: stateRefs.isSpellBookOpenRef?.current ?? false,
      isTerrainEditorOpen: stateRefs.isTerrainEditorOpenRef?.current ?? false,
      isEnemyEditorOpen: stateRefs.isEnemyEditorOpenRef?.current ?? false,
      openBagIndex: stateRefs.openBagIndexRef?.current ?? null,
      isCharacterPanelOpen: stateRefs.isCharacterPanelOpenRef?.current ?? false,
      isItemEditorOpen: stateRefs.isItemEditorOpenRef?.current ?? false,
    };
    if (processEscapeKey(e, escapePanelStates, refs, callbacks)) {
      return;
    }
    
    // Editor toggle keys (F1-F7)
    if (processEditorToggleKey(e, refs, callbacks, helpers.getTerrainHeight)) {
      return;
    }
    
    // Delete/Backspace for deleting objects - use current values from refs
    const editorStates = {
      selectedEditObject: stateRefs.selectedEditObjectRef?.current ?? null,
      isEditorOpen: stateRefs.isEditorOpenRef?.current ?? false,
      selectedEditEnemy: stateRefs.selectedEditEnemyRef?.current ?? null,
      isEnemyEditorOpen: stateRefs.isEnemyEditorOpenRef?.current ?? false,
    };
    if (processDeleteKey(e, editorStates, callbacks)) {
      return;
    }
    
    // Ctrl+C for copying enemies
    if (processCopyEnemyKey(e, editorStates, callbacks)) {
      return;
    }
  };
};

/**
 * Create the main keyup handler function
 * 
 * @param {Object} config - Configuration object
 * @returns {Function} Event handler function
 */
export const createKeyUpHandler = (config) => {
  const { refs, systems } = config;
  
  return (e) => {
    // Movement keys - handled by PlayerMovementSystem
    systems.handleMovementKeyUp(e, refs.movementState.current);
  };
};

// ==================== INPUT REGISTRATION ====================

/**
 * Register keyboard event handlers
 * 
 * @param {Function} handleKeyDown - Keydown handler
 * @param {Function} handleKeyUp - Keyup handler
 * @returns {Function} Cleanup function to unregister handlers
 */
export const registerKeyboardHandlers = (handleKeyDown, handleKeyUp) => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
};

/**
 * Unregister keyboard event handlers
 * 
 * @param {Function} handleKeyDown - Keydown handler to remove
 * @param {Function} handleKeyUp - Keyup handler to remove
 */
export const unregisterKeyboardHandlers = (handleKeyDown, handleKeyUp) => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
};
