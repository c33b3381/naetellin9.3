/**
 * TerrainSystem.js
 * 
 * Centralized terrain generation and query system.
 * Extracted from GameWorld.jsx to modularize terrain logic.
 * 
 * This module provides:
 * - SimplexNoise class for procedural noise generation
 * - Terrain height calculation with zone-specific modifications
 * - Water body detection and depth queries
 * - Terrain constants and configuration
 */

// ==================== TERRAIN CONSTANTS ====================

// Terrain generation scales
export const TERRAIN_SCALES = {
  base: 0.015,
  hill: 0.008,
  detail: 0.05,
};

// Village flattening
export const VILLAGE_FLATTEN_RADIUS = 40;
export const PATH_WIDTH = 3;

// Water body definitions
export const WATER_BODIES = {
  mainLake: {
    x: 45,
    z: 45,
    radius: 25,
    maxDepth: 3,
  },
  river: {
    startX: 100,
    endX: 280,
    baseZ: 20,
    amplitude: 15,
    frequency: 0.05,
    width: 8,
    maxDepth: 1.5,
  },
  frozenPond: {
    x: -20,
    z: -180,
    radius: 15,
    maxDepth: 2,
  },
  oasis: {
    x: -180,
    z: 30,
    radius: 12,
    maxDepth: 2,
  },
};

// ==================== SIMPLEX NOISE CLASS ====================

/**
 * SimplexNoise - Simplex-like noise generator for terrain generation
 * Uses a seeded random number generator for deterministic results
 */
class SimplexNoise {
  constructor(seed = Math.random() * 10000) {
    this.p = new Uint8Array(512);
    this.perm = new Uint8Array(512);
    
    // Initialize permutation table with seed
    const random = this.seededRandom(seed);
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
    }
  }
  
  seededRandom(seed) {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }
  
  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }
  
  noise2D(x, y) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    
    let n0 = 0, n1 = 0, n2 = 0;
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.grad(this.perm[ii + this.perm[jj]], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
    }
    
    return 70.0 * (n0 + n1 + n2);
  }
  
  /**
   * Fractal Brownian Motion for more natural terrain
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (actually Z in world space)
   * @param {number} octaves - Number of noise layers
   * @param {number} lacunarity - Frequency multiplier per octave
   * @param {number} gain - Amplitude multiplier per octave
   * @returns {number} Noise value
   */
  fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }
}

// ==================== TERRAIN NOISE INSTANCE ====================

// Global terrain noise instance with fixed seed for consistent terrain
const terrainNoise = new SimplexNoise(42);

/**
 * Create a new terrain noise instance with a specific seed
 * @param {number} seed - Random seed for noise generation
 * @returns {SimplexNoise} New noise instance
 */
export const createTerrainNoise = (seed = 42) => {
  return new SimplexNoise(seed);
};

/**
 * Get the global terrain noise instance
 * @returns {SimplexNoise} Global noise instance
 */
export const getTerrainNoise = () => terrainNoise;

// ==================== TERRAIN HEIGHT FUNCTIONS ====================

/**
 * Get terrain height at any world position
 * Includes zone-specific terrain modifications
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {number} Terrain height at position (minimum 0)
 */
export const getTerrainHeight = (x, z) => {
  const scale = TERRAIN_SCALES.base;
  const hillScale = TERRAIN_SCALES.hill;
  const detailScale = TERRAIN_SCALES.detail;
  
  // Base terrain with gentle rolling hills
  let height = terrainNoise.fbm(x * scale, z * scale, 4, 2.0, 0.5) * 8;
  
  // Add larger hills
  height += terrainNoise.fbm(x * hillScale + 100, z * hillScale + 100, 3, 2.0, 0.6) * 12;
  
  // Add small detail bumps
  height += terrainNoise.noise2D(x * detailScale, z * detailScale) * 0.5;
  
  // Flatten areas around village center
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter < VILLAGE_FLATTEN_RADIUS) {
    const flatten = Math.max(0, 1 - distFromCenter / VILLAGE_FLATTEN_RADIUS);
    height *= (1 - flatten * flatten);
  }
  
  // Flatten paths
  if (Math.abs(x) < PATH_WIDTH || Math.abs(z) < PATH_WIDTH) {
    height *= 0.3;
  }
  
  // Zone-specific terrain modifications
  // Frozen peaks - more mountainous
  if (z < -100) {
    height += terrainNoise.fbm(x * 0.02, z * 0.02, 3, 2.0, 0.7) * 15;
  }
  
  // Scorched plains - flatter with some dunes
  if (x < -100) {
    height = height * 0.5 + terrainNoise.noise2D(x * 0.03, z * 0.03) * 3;
  }
  
  // Crystal caves - rolling with some plateaus
  if (z > 100) {
    height = Math.floor(height / 3) * 3 + (height % 3) * 0.5;
  }
  
  return Math.max(0, height);
};

// ==================== WATER DETECTION FUNCTIONS ====================

/**
 * Check if a position is in water
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {boolean} True if position is in water
 */
export const isInWater = (x, z) => {
  const { mainLake, river, frozenPond, oasis } = WATER_BODIES;
  
  // Main lake near village (southeast)
  const distToLake = Math.sqrt((x - mainLake.x) ** 2 + (z - mainLake.z) ** 2);
  if (distToLake < mainLake.radius) return true;
  
  // River running through darkwood forest
  if (x > river.startX && x < river.endX) {
    const riverZ = river.baseZ + Math.sin(x * river.frequency) * river.amplitude;
    if (Math.abs(z - riverZ) < river.width) return true;
  }
  
  // Pond in frozen peaks
  const distToPond = Math.sqrt((x - frozenPond.x) ** 2 + (z - frozenPond.z) ** 2);
  if (distToPond < frozenPond.radius) return true;
  
  // Small pond in scorched plains (oasis)
  const distToOasis = Math.sqrt((x - oasis.x) ** 2 + (z - oasis.z) ** 2);
  if (distToOasis < oasis.radius) return true;
  
  return false;
};

/**
 * Get water depth at a position
 * Returns 0 if not in water
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {number} Water depth (0 if not in water)
 */
export const getWaterDepth = (x, z) => {
  const { mainLake, river, frozenPond, oasis } = WATER_BODIES;
  
  // Main lake
  const distToLake = Math.sqrt((x - mainLake.x) ** 2 + (z - mainLake.z) ** 2);
  if (distToLake < mainLake.radius) {
    return Math.max(0, (1 - distToLake / mainLake.radius) * mainLake.maxDepth);
  }
  
  // River
  if (x > river.startX && x < river.endX) {
    const riverZ = river.baseZ + Math.sin(x * river.frequency) * river.amplitude;
    const distToRiver = Math.abs(z - riverZ);
    if (distToRiver < river.width) {
      return Math.max(0, (1 - distToRiver / river.width) * river.maxDepth);
    }
  }
  
  // Frozen pond
  const distToPond = Math.sqrt((x - frozenPond.x) ** 2 + (z - frozenPond.z) ** 2);
  if (distToPond < frozenPond.radius) {
    return Math.max(0, (1 - distToPond / frozenPond.radius) * frozenPond.maxDepth);
  }
  
  // Oasis
  const distToOasis = Math.sqrt((x - oasis.x) ** 2 + (z - oasis.z) ** 2);
  if (distToOasis < oasis.radius) {
    return Math.max(0, (1 - distToOasis / oasis.radius) * oasis.maxDepth);
  }
  
  return 0;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get terrain info at a position (height + water status)
 * Convenience function combining multiple queries
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {Object} Terrain info { height, inWater, waterDepth }
 */
export const getTerrainInfo = (x, z) => {
  return {
    height: getTerrainHeight(x, z),
    inWater: isInWater(x, z),
    waterDepth: getWaterDepth(x, z),
  };
};

/**
 * Get the effective Y position for an object at world coordinates
 * Takes into account terrain height
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {number} offset - Height offset above terrain (default 0)
 * @returns {number} Y position
 */
export const getTerrainY = (x, z, offset = 0) => {
  return getTerrainHeight(x, z) + offset;
};

// Export SimplexNoise class for advanced use cases
export { SimplexNoise };
