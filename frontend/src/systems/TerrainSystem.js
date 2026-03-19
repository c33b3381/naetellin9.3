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

// Terrain generation scales (REDUCED for flatter, more playable terrain)
export const TERRAIN_SCALES = {
  base: 0.015,      // Frequency stays same
  hill: 0.008,      // Frequency stays same
  detail: 0.05,     // Frequency stays same
};

// Terrain amplitude multipliers (REDUCED for usability overhaul)
export const TERRAIN_AMPLITUDES = {
  base: 3,          // Reduced from 8 (base rolling terrain)
  hill: 5,          // Reduced from 12 (larger hills)
  detail: 0.2,      // Reduced from 0.5 (small bumps)
};

// Village flattening (EXPANDED for larger stable spawn area)
export const VILLAGE_FLATTEN_RADIUS = 60;    // Increased from 40
export const VILLAGE_TARGET_HEIGHT = 0.5;    // Target height for spawn area
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
 * USABILITY OVERHAUL: Reduced amplitude for flatter, more walkable terrain
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {number} Terrain height at position (minimum 0)
 */
export const getTerrainHeight = (x, z) => {
  const scale = TERRAIN_SCALES.base;
  const hillScale = TERRAIN_SCALES.hill;
  const detailScale = TERRAIN_SCALES.detail;
  
  // Base terrain with gentle rolling hills (REDUCED AMPLITUDE)
  let height = terrainNoise.fbm(x * scale, z * scale, 4, 2.0, 0.5) * TERRAIN_AMPLITUDES.base;
  
  // Add larger hills (REDUCED AMPLITUDE)
  height += terrainNoise.fbm(x * hillScale + 100, z * hillScale + 100, 3, 2.0, 0.6) * TERRAIN_AMPLITUDES.hill;
  
  // Add small detail bumps (REDUCED AMPLITUDE)
  height += terrainNoise.noise2D(x * detailScale, z * detailScale) * TERRAIN_AMPLITUDES.detail;
  
  // IMPROVED SPAWN FLATTENING: Smooth lerp to target height instead of multiplying
  const distFromCenter = Math.sqrt(x * x + z * z);
  if (distFromCenter < VILLAGE_FLATTEN_RADIUS) {
    // Smooth falloff using squared ease-out
    const flattenStrength = Math.max(0, 1 - distFromCenter / VILLAGE_FLATTEN_RADIUS);
    const smoothFlatten = flattenStrength * flattenStrength;
    
    // Lerp height toward target spawn height
    height = height * (1 - smoothFlatten) + VILLAGE_TARGET_HEIGHT * smoothFlatten;
  }
  
  // Flatten paths (less aggressive)
  if (Math.abs(x) < PATH_WIDTH || Math.abs(z) < PATH_WIDTH) {
    height *= 0.5;  // Changed from 0.3 to 0.5 (less extreme)
  }
  
  // Zone-specific terrain modifications (REDUCED for usability)
  // Frozen peaks - more mountainous (REDUCED from +15 to +8)
  if (z < -100) {
    height += terrainNoise.fbm(x * 0.02, z * 0.02, 3, 2.0, 0.7) * 8;
  }
  
  // Scorched plains - flatter with some dunes (REDUCED from +3 to +2)
  if (x < -100) {
    height = height * 0.5 + terrainNoise.noise2D(x * 0.03, z * 0.03) * 2;
  }
  
  // Crystal caves - rolling with some plateaus (gentler steps)
  if (z > 100) {
    height = Math.floor(height / 2) * 2 + (height % 2) * 0.5;  // Changed from /3 to /2
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

// ==================== TERRAIN COLORING SYSTEM ====================

/**
 * Color palette for stylized fantasy terrain
 * Each zone has primary colors that blend based on terrain features
 */
export const TERRAIN_COLORS = {
  // Starter Village (Oakvale) - Lush green meadows
  starter: {
    grassLow: { r: 0.22, g: 0.55, b: 0.22 },      // #38A038 - Lush grass
    grassHigh: { r: 0.35, g: 0.65, b: 0.30 },     // #59A64D - Lighter hilltop grass
    dirt: { r: 0.45, g: 0.35, b: 0.20 },          // #735933 - Brown dirt/paths
    rock: { r: 0.50, g: 0.48, b: 0.45 },          // #807A73 - Rocky slopes
    wet: { r: 0.12, g: 0.35, b: 0.18 },           // #1F592E - Damp grass
  },
  // Darkwood Forest - Deep greens and shadows
  forest: {
    grassLow: { r: 0.10, g: 0.30, b: 0.10 },      // #1A4D1A - Dark forest floor
    grassHigh: { r: 0.15, g: 0.40, b: 0.15 },     // #266626 - Mossy areas
    dirt: { r: 0.25, g: 0.20, b: 0.12 },          // #40331F - Dark soil
    rock: { r: 0.30, g: 0.28, b: 0.25 },          // #4D4740 - Dark stone
    wet: { r: 0.08, g: 0.22, b: 0.10 },           // #14381A - Boggy areas
  },
  // Crystal Caves - Purple/blue mystical tones
  caves: {
    grassLow: { r: 0.29, g: 0.29, b: 0.42 },      // #4A4A6A - Purple-gray ground
    grassHigh: { r: 0.38, g: 0.38, b: 0.55 },     // #61618C - Lighter crystal areas
    dirt: { r: 0.35, g: 0.32, b: 0.45 },          // #595273 - Purple soil
    rock: { r: 0.45, g: 0.42, b: 0.55 },          // #736B8C - Crystal-infused rock
    wet: { r: 0.22, g: 0.22, b: 0.35 },           // #383859 - Damp cave floor
  },
  // Scorched Plains - Desert/burnt orange tones
  scorched: {
    grassLow: { r: 0.55, g: 0.41, b: 0.08 },      // #8C6914 - Sandy grass
    grassHigh: { r: 0.65, g: 0.50, b: 0.15 },     // #A68026 - Lighter dunes
    dirt: { r: 0.60, g: 0.45, b: 0.20 },          // #997333 - Scorched earth
    rock: { r: 0.55, g: 0.40, b: 0.25 },          // #8C6640 - Red rock
    wet: { r: 0.40, g: 0.35, b: 0.15 },           // #665926 - Oasis mud
  },
  // Frozen Peaks - Snow and ice
  frozen: {
    grassLow: { r: 0.85, g: 0.88, b: 0.90 },      // #D9E0E6 - Snow
    grassHigh: { r: 0.95, g: 0.97, b: 1.00 },     // #F2F8FF - Fresh snow
    dirt: { r: 0.65, g: 0.68, b: 0.72 },          // #A6ADB8 - Frozen dirt
    rock: { r: 0.50, g: 0.55, b: 0.60 },          // #808C99 - Icy rock
    wet: { r: 0.70, g: 0.78, b: 0.85 },           // #B3C7D9 - Frozen puddles
  },
};

/**
 * Get the zone type for a world position
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {string} Zone key ('starter', 'forest', 'caves', 'scorched', 'frozen')
 */
export const getZoneType = (x, z) => {
  if (x > 100) return 'forest';
  if (x < -100) return 'scorched';
  if (z > 100) return 'caves';
  if (z < -100) return 'frozen';
  return 'starter';
};

/**
 * Calculate slope at a position (0 = flat, 1 = very steep)
 * Uses terrain height samples around the point
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {number} sampleDist - Distance for sampling (default 2)
 * @returns {number} Slope value 0-1
 */
export const getTerrainSlope = (x, z, sampleDist = 2) => {
  const heightCenter = getTerrainHeight(x, z);
  const heightN = getTerrainHeight(x, z - sampleDist);
  const heightS = getTerrainHeight(x, z + sampleDist);
  const heightE = getTerrainHeight(x + sampleDist, z);
  const heightW = getTerrainHeight(x - sampleDist, z);
  
  // Calculate gradient
  const gradX = (heightE - heightW) / (2 * sampleDist);
  const gradZ = (heightS - heightN) / (2 * sampleDist);
  
  // Slope magnitude (normalized to 0-1 range, capped)
  const slope = Math.sqrt(gradX * gradX + gradZ * gradZ);
  return Math.min(1, slope / 2); // Divide by 2 to normalize typical terrain slopes
};

/**
 * Get distance to nearest water body (normalized)
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @returns {number} Proximity value 0-1 (1 = at water edge, 0 = far from water)
 */
export const getWaterProximity = (x, z) => {
  const { mainLake, river, frozenPond, oasis } = WATER_BODIES;
  
  let minDist = Infinity;
  const maxProximityDist = 15; // Max distance to consider "near water"
  
  // Check main lake
  const distToLake = Math.sqrt((x - mainLake.x) ** 2 + (z - mainLake.z) ** 2) - mainLake.radius;
  if (distToLake < minDist) minDist = distToLake;
  
  // Check river (approximate)
  if (x > river.startX - 20 && x < river.endX + 20) {
    const riverZ = river.baseZ + Math.sin(x * river.frequency) * river.amplitude;
    const distToRiver = Math.abs(z - riverZ) - river.width;
    if (distToRiver < minDist) minDist = distToRiver;
  }
  
  // Check frozen pond
  const distToPond = Math.sqrt((x - frozenPond.x) ** 2 + (z - frozenPond.z) ** 2) - frozenPond.radius;
  if (distToPond < minDist) minDist = distToPond;
  
  // Check oasis
  const distToOasis = Math.sqrt((x - oasis.x) ** 2 + (z - oasis.z) ** 2) - oasis.radius;
  if (distToOasis < minDist) minDist = distToOasis;
  
  // Convert to proximity (0-1, where 1 is at water edge)
  if (minDist <= 0) return 1; // In or at water
  if (minDist >= maxProximityDist) return 0; // Far from water
  return 1 - (minDist / maxProximityDist);
};

/**
 * Linear interpolation between two colors
 * @param {Object} c1 - First color {r, g, b}
 * @param {Object} c2 - Second color {r, g, b}
 * @param {number} t - Interpolation factor 0-1
 * @returns {Object} Interpolated color {r, g, b}
 */
const lerpColor = (c1, c2, t) => {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  };
};

/**
 * Add subtle noise variation to a color
 * @param {Object} color - Base color {r, g, b}
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {number} intensity - Noise intensity (default 0.08)
 * @returns {Object} Color with noise {r, g, b}
 */
const addColorNoise = (color, x, z, intensity = 0.08) => {
  // Use simplex noise for smooth color variation
  const noise = terrainNoise.noise2D(x * 0.1, z * 0.1) * intensity;
  const detailNoise = terrainNoise.noise2D(x * 0.3, z * 0.3) * (intensity * 0.5);
  
  return {
    r: Math.max(0, Math.min(1, color.r + noise + detailNoise)),
    g: Math.max(0, Math.min(1, color.g + noise + detailNoise)),
    b: Math.max(0, Math.min(1, color.b + noise + detailNoise)),
  };
};

/**
 * Calculate terrain color at a world position
 * Takes into account: zone, height, slope, water proximity, and adds noise variation
 * 
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {number} height - Pre-calculated terrain height (optional, will be calculated if not provided)
 * @returns {Object} Color {r, g, b} with values 0-1
 */
export const getTerrainColor = (x, z, height = null) => {
  // Get height if not provided
  if (height === null) {
    height = getTerrainHeight(x, z);
  }
  
  // Get zone-specific color palette
  const zone = getZoneType(x, z);
  const palette = TERRAIN_COLORS[zone];
  
  // Calculate terrain features
  const slope = getTerrainSlope(x, z);
  const waterProximity = getWaterProximity(x, z);
  const inWater = isInWater(x, z);
  
  // Start with base grass color
  let baseColor;
  
  // Height-based color (low grass vs high grass)
  const heightFactor = Math.min(1, Math.max(0, height / 15)); // 0-1 based on height 0-15
  baseColor = lerpColor(palette.grassLow, palette.grassHigh, heightFactor * 0.6);
  
  // Slope-based blending (steep = more rock/dirt)
  if (slope > 0.2) {
    const slopeFactor = Math.min(1, (slope - 0.2) / 0.5); // 0-1 for slopes 0.2-0.7
    // Blend toward dirt first, then rock for steeper slopes
    if (slope > 0.5) {
      const rockFactor = (slope - 0.5) / 0.5;
      baseColor = lerpColor(baseColor, palette.rock, rockFactor * 0.7);
    } else {
      baseColor = lerpColor(baseColor, palette.dirt, slopeFactor * 0.5);
    }
  }
  
  // Water proximity (wet/damp areas near water)
  if (waterProximity > 0 && !inWater) {
    baseColor = lerpColor(baseColor, palette.wet, waterProximity * 0.6);
  }
  
  // In-water coloring (underwater ground)
  if (inWater) {
    baseColor = lerpColor(baseColor, palette.wet, 0.8);
    // Darken slightly for submerged effect
    baseColor.r *= 0.7;
    baseColor.g *= 0.75;
    baseColor.b *= 0.8;
  }
  
  // Add path flattening color (near center paths)
  if (Math.abs(x) < PATH_WIDTH || Math.abs(z) < PATH_WIDTH) {
    const pathFactor = 1 - (Math.min(Math.abs(x), Math.abs(z)) / PATH_WIDTH);
    baseColor = lerpColor(baseColor, palette.dirt, pathFactor * 0.6);
  }
  
  // Add noise variation for more organic look
  const finalColor = addColorNoise(baseColor, x, z, 0.06);
  
  // Zone transition blending (smooth edges between zones)
  const transitionWidth = 20;
  
  // Check for zone transitions and blend
  if (x > 80 && x < 120) {
    // Starter to Forest transition
    const t = (x - 80) / transitionWidth;
    const forestColor = getZoneBaseColor(x + 50, z, height); // Sample from forest zone
    return lerpColor(finalColor, { r: forestColor.r, g: forestColor.g, b: forestColor.b }, t * 0.5);
  }
  if (x < -80 && x > -120) {
    // Starter to Scorched transition
    const t = (-80 - x) / transitionWidth;
    const scorchedColor = getZoneBaseColor(x - 50, z, height);
    return lerpColor(finalColor, { r: scorchedColor.r, g: scorchedColor.g, b: scorchedColor.b }, t * 0.5);
  }
  if (z > 80 && z < 120) {
    // Starter to Caves transition
    const t = (z - 80) / transitionWidth;
    const cavesColor = getZoneBaseColor(x, z + 50, height);
    return lerpColor(finalColor, { r: cavesColor.r, g: cavesColor.g, b: cavesColor.b }, t * 0.5);
  }
  if (z < -80 && z > -120) {
    // Starter to Frozen transition
    const t = (-80 - z) / transitionWidth;
    const frozenColor = getZoneBaseColor(x, z - 50, height);
    return lerpColor(finalColor, { r: frozenColor.r, g: frozenColor.g, b: frozenColor.b }, t * 0.5);
  }
  
  return finalColor;
};

/**
 * Get base zone color (without transitions) - helper for zone blending
 */
const getZoneBaseColor = (x, z, height) => {
  const zone = getZoneType(x, z);
  const palette = TERRAIN_COLORS[zone];
  const heightFactor = Math.min(1, Math.max(0, height / 15));
  return lerpColor(palette.grassLow, palette.grassHigh, heightFactor * 0.6);
};

// Export SimplexNoise class for advanced use cases
export { SimplexNoise };
