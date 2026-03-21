/**
 * WorldSetup.js
 * Pure setup helper functions for Three.js scene initialization
 * Extracted from GameWorld.jsx for better code organization
 * 
 * These functions are deterministic and self-contained,
 * with no side effects beyond creating Three.js objects.
 */

import * as THREE from 'three';

/**
 * Create a Three.js scene with improved atmosphere settings
 * @returns {THREE.Scene} Configured scene with background and fog
 */
export const createGameScene = () => {
  const scene = new THREE.Scene();
  
  // Improved sky color - slightly warmer and brighter for fantasy feel
  const skyColor = new THREE.Color(0x8ecae6); // Lighter, warmer sky blue
  scene.background = skyColor;
  
  // Improved fog - starts further out and extends longer for better depth perception
  // Slight gradient toward horizon color
  scene.fog = new THREE.Fog(0xa8d4e6, 80, 250);
  
  return scene;
};

/**
 * Create a perspective camera with game-appropriate settings
 * @returns {THREE.PerspectiveCamera} Configured camera
 */
export const createGameCamera = () => {
  const camera = new THREE.PerspectiveCamera(
    55,                                    // FOV
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1,                                   // Near plane
    1000                                   // Far plane
  );
  
  return camera;
};

/**
 * Create and configure a WebGL renderer with optimized settings
 * @param {HTMLElement} container - DOM container to append canvas to
 * @returns {THREE.WebGLRenderer} Configured renderer
 */
export const createGameRenderer = (container) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Tone mapping for more natural, pleasing colors
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  container.appendChild(renderer.domElement);
  
  return renderer;
};

/**
 * Setup all lighting for the game world
 * Includes ambient, directional (sun), fill, and hemisphere lights
 * Designed for stylized fantasy look with good depth and readability
 * 
 * @param {THREE.Scene} scene - Scene to add lights to
 */
export const setupWorldLighting = (scene) => {
  // Ambient light - provides base illumination so shadows aren't pitch black
  // Lower intensity since hemisphere light handles most ambient
  const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.25);
  scene.add(ambientLight);
  
  // Main directional light - acts as the sun
  // Warm color (golden hour feel) at an angle that creates readable shadows
  const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
  directionalLight.position.set(50, 80, 30); // Higher and more angled for longer shadows
  directionalLight.castShadow = true;
  
  // Shadow map configuration - optimized for performance (2048 is plenty for browser games)
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 200;
  
  // Larger shadow frustum to cover more of the visible world
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  
  // Softer shadow edges
  directionalLight.shadow.radius = 2;
  directionalLight.shadow.bias = -0.0005;
  
  scene.add(directionalLight);
  
  // Secondary fill light - subtle light from opposite side to reduce harsh shadows
  const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.3);
  fillLight.position.set(-30, 40, -20);
  fillLight.castShadow = false; // No shadows from fill light
  scene.add(fillLight);
  
  // Hemisphere light - sky color above, ground bounce below
  // Creates natural ambient lighting gradient
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // Sky color - light blue
    0x3d6b3d, // Ground color - forest green (bounce light from grass)
    0.5       // Intensity
  );
  scene.add(hemisphereLight);
};

/**
 * Create lighting configuration for the game world
 * Returns light objects without adding them to scene (for manual control if needed)
 * 
 * @returns {Object} Object containing all light references
 */
export const createWorldLights = () => {
  const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.25);
  
  const directionalLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
  directionalLight.position.set(50, 80, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 1;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.radius = 2;
  directionalLight.shadow.bias = -0.0005;
  
  const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.3);
  fillLight.position.set(-30, 40, -20);
  fillLight.castShadow = false;
  
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x3d6b3d, 0.5);
  
  return {
    ambientLight,
    directionalLight,
    fillLight,
    hemisphereLight
  };
};

export default {
  createGameScene,
  createGameCamera,
  createGameRenderer,
  setupWorldLighting,
  createWorldLights
};
