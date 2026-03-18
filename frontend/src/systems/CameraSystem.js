/**
 * Camera System
 * Handles all camera logic including:
 * - WoW-style orbit camera
 * - Mouse-driven rotation
 * - Zoom in/out
 * - Camera following player
 * - Pitch/yaw clamping
 * 
 * Note: Map editor camera is handled separately in GameWorld.jsx
 * to avoid breaking editor functionality
 * 
 * Extracted from GameWorld.jsx for modularity
 */

// Default camera configuration
const DEFAULT_CAMERA_CONFIG = {
  distance: 12,
  minDistance: 3,
  maxDistance: 30,
  rotationY: 0,      // Horizontal rotation (yaw)
  rotationX: 0.3,    // Vertical rotation (pitch)
  minPitch: -0.5,
  maxPitch: 1.2,
  isRightMouseDown: false,
  isLeftMouseDown: false,
  lastMouseX: 0,
  lastMouseY: 0
};

// Sensitivity settings
const ROTATION_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 0.01;

/**
 * Create initial camera state
 * @returns {Object} Camera state object
 */
export const createCameraState = () => ({
  ...DEFAULT_CAMERA_CONFIG
});

/**
 * Handle right mouse button down for camera rotation
 * @param {MouseEvent} e - Mouse event
 * @param {Object} cameraState - Camera state ref.current
 */
export const handleCameraMouseDown = (e, cameraState) => {
  if (e.button === 2) { // Right click
    cameraState.isRightMouseDown = true;
    cameraState.lastMouseX = e.clientX;
    cameraState.lastMouseY = e.clientY;
  } else if (e.button === 0) { // Left click
    cameraState.isLeftMouseDown = true;
  }
};

/**
 * Handle mouse button up
 * @param {MouseEvent} e - Mouse event
 * @param {Object} cameraState - Camera state ref.current
 */
export const handleCameraMouseUp = (e, cameraState) => {
  if (e.button === 2) { // Right click
    cameraState.isRightMouseDown = false;
  } else if (e.button === 0) { // Left click
    cameraState.isLeftMouseDown = false;
  }
};

/**
 * Handle mouse move for camera rotation (when right mouse is held)
 * @param {MouseEvent} e - Mouse event
 * @param {Object} cameraState - Camera state ref.current
 * @param {boolean} isMapEditorMode - Whether in map editor mode
 * @param {Object} mapEditorCameraState - Map editor camera state (optional)
 * @returns {boolean} Whether camera rotation was handled
 */
export const handleCameraMouseMove = (e, cameraState, isMapEditorMode = false, mapEditorCameraState = null) => {
  if (!cameraState.isRightMouseDown) {
    return false;
  }
  
  const deltaX = e.clientX - cameraState.lastMouseX;
  const deltaY = e.clientY - cameraState.lastMouseY;
  
  if (isMapEditorMode && e.ctrlKey && mapEditorCameraState) {
    // Map Editor Mode: Ctrl+RMB Drag to pan camera
    const panSpeed = 0.5;
    mapEditorCameraState.x -= deltaX * panSpeed;
    mapEditorCameraState.z -= deltaY * panSpeed;
    
    // Clamp to world bounds
    mapEditorCameraState.x = Math.max(-280, Math.min(280, mapEditorCameraState.x));
    mapEditorCameraState.z = Math.max(-280, Math.min(280, mapEditorCameraState.z));
  } else if (!isMapEditorMode) {
    // Game Mode: Rotate camera
    // Horizontal rotation (yaw)
    cameraState.rotationY -= deltaX * ROTATION_SENSITIVITY;
    
    // Vertical rotation (pitch) with limits
    cameraState.rotationX += deltaY * ROTATION_SENSITIVITY;
    cameraState.rotationX = Math.max(
      cameraState.minPitch,
      Math.min(cameraState.maxPitch, cameraState.rotationX)
    );
  }
  
  cameraState.lastMouseX = e.clientX;
  cameraState.lastMouseY = e.clientY;
  
  return true;
};

/**
 * Handle mouse wheel for camera zoom
 * @param {WheelEvent} e - Wheel event
 * @param {Object} cameraState - Camera state ref.current
 * @param {boolean} isMapEditorMode - Whether in map editor mode
 * @param {boolean} isFlightMode - Whether in flight mode
 * @param {Object} mapEditorCameraState - Map editor camera state (optional)
 * @returns {boolean} Whether zoom was handled
 */
export const handleCameraWheel = (e, cameraState, isMapEditorMode = false, isFlightMode = false, mapEditorCameraState = null) => {
  e.preventDefault();
  
  if (isMapEditorMode && !isFlightMode && mapEditorCameraState) {
    // Map Editor Mode (not in flight): Adjust camera height
    mapEditorCameraState.height -= e.deltaY * 0.1;
    mapEditorCameraState.height = Math.max(
      mapEditorCameraState.minHeight,
      Math.min(mapEditorCameraState.maxHeight, mapEditorCameraState.height)
    );
    return true;
  } else if (!isMapEditorMode) {
    // Game Mode: Zoom in/out
    cameraState.distance += e.deltaY * ZOOM_SENSITIVITY;
    cameraState.distance = Math.max(
      cameraState.minDistance,
      Math.min(cameraState.maxDistance, cameraState.distance)
    );
    return true;
  }
  
  // In flight mode, mouse wheel is disabled
  return false;
};

/**
 * Update camera position to follow player (WoW-style orbit camera)
 * @param {THREE.Camera} camera - Three.js camera
 * @param {THREE.Object3D} player - Player mesh/group
 * @param {Object} cameraState - Camera state ref.current
 * @param {Object} options - Additional options
 * @param {number} options.playerHeightOffset - Height offset above player (default 2)
 * @param {number} options.lookAtHeightOffset - Height offset for look target (default 1.5)
 * @param {number} options.minCameraY - Minimum camera Y position (default 1)
 */
export const updateCamera = (camera, player, cameraState, options = {}) => {
  const {
    playerHeightOffset = 2,
    lookAtHeightOffset = 1.5,
    minCameraY = 1
  } = options;
  
  if (!camera || !player) return;
  
  const cam = cameraState;
  
  // Calculate camera position using spherical coordinates
  const camX = player.position.x + Math.sin(cam.rotationY) * Math.cos(cam.rotationX) * cam.distance;
  const camY = player.position.y + playerHeightOffset + Math.sin(cam.rotationX) * cam.distance;
  const camZ = player.position.z + Math.cos(cam.rotationY) * Math.cos(cam.rotationX) * cam.distance;
  
  // Set camera position (ensure minimum height)
  camera.position.set(camX, Math.max(minCameraY, camY), camZ);
  
  // Look at player
  camera.lookAt(
    player.position.x, 
    player.position.y + lookAtHeightOffset, 
    player.position.z
  );
};

/**
 * Get the current camera rotation for other systems (e.g., movement direction)
 * @param {Object} cameraState - Camera state ref.current
 * @returns {Object} Object with rotationY and rotationX
 */
export const getCameraRotation = (cameraState) => ({
  rotationY: cameraState.rotationY,
  rotationX: cameraState.rotationX
});

/**
 * Check if both mouse buttons are held (for move-forward behavior)
 * @param {Object} cameraState - Camera state ref.current
 * @returns {boolean} True if both buttons are held
 */
export const isBothMouseButtonsHeld = (cameraState) => {
  return cameraState.isLeftMouseDown && cameraState.isRightMouseDown;
};

/**
 * Reset camera to default position behind player
 * @param {Object} cameraState - Camera state ref.current
 * @param {number} playerRotationY - Player's current Y rotation (optional)
 */
export const resetCameraPosition = (cameraState, playerRotationY = 0) => {
  cameraState.rotationY = playerRotationY;
  cameraState.rotationX = DEFAULT_CAMERA_CONFIG.rotationX;
  cameraState.distance = DEFAULT_CAMERA_CONFIG.distance;
};

export default {
  createCameraState,
  handleCameraMouseDown,
  handleCameraMouseUp,
  handleCameraMouseMove,
  handleCameraWheel,
  updateCamera,
  getCameraRotation,
  isBothMouseButtonsHeld,
  resetCameraPosition
};
