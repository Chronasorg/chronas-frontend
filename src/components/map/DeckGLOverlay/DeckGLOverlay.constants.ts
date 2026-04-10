/**
 * DeckGLOverlay Constants
 *
 * Constants used by the DeckGLOverlay component and related utilities.
 *
 * Requirements: 5.5, 9.9, 10.3, 10.4, 10.5, 10.6, 11.4
 */

import type { AreaColorDimension } from '../../../stores/mapStore';
import type { IconMapping } from './DeckGLOverlay.types';

// ============================================================================
// Marker Constants
// ============================================================================

/**
 * Icon size multipliers by marker type.
 * Requirements: 9.9
 */
export const iconSize: Record<string, number> = {
  cp: 7, // Capital
  ca: 4, // Castle
  b: 5, // Battle
  si: 5, // Siege
  c0: 7, // Capital outline
  c: 4, // City
  l: 4, // Landmark
  m: 4, // Military
  p: 4, // Politician
  e: 4, // Explorer
  s: 4, // Scientist
  a: 4, // Artist
  r: 4, // Religious
  at: 4, // Athlete
  op: 4, // Unclassified
  o: 4, // Unknown
  ar: 4, // Artifact
};

/**
 * Default marker size in pixels
 */
export const DEFAULT_MARKER_SIZE = 20;

/**
 * Icon dimensions for themed atlas (from production properties.js)
 */
const ICON_WIDTH = 135;
const ICON_HEIGHT = 127;

/**
 * Basic icon mapping for themed markers
 * Positions from production iconMapping['them'] in properties.js
 */
export const themedIconMapping: IconMapping = {
  // Row 0: r, p, e (and '1' for cluster)
  r: {
    x: ICON_WIDTH,
    y: 0,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  p: {
    x: 2 * ICON_WIDTH,
    y: 0,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  e: {
    x: 3 * ICON_WIDTH,
    y: 0,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  // Row 1: a, s, op (and '6' for cluster)
  a: {
    x: 0,
    y: ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  s: {
    x: 2 * ICON_WIDTH,
    y: ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  op: {
    x: 3 * ICON_WIDTH,
    y: ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  // Row 2: at, m (and '9', '12' for cluster)
  at: {
    x: ICON_WIDTH,
    y: 2 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  m: {
    x: 2 * ICON_WIDTH,
    y: 2 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  // Row 3: ar, b, si, cp
  ar: {
    x: 0,
    y: 3 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  b: {
    x: ICON_WIDTH,
    y: 3 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  si: {
    x: 2 * ICON_WIDTH,
    y: 3 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  cp: {
    x: 3 * ICON_WIDTH,
    y: 3 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: true,
  },
  // Row 4: ca, c0, l, o (and '18' for cluster)
  ca: {
    x: 0,
    y: 4 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  c0: {
    x: ICON_WIDTH,
    y: 4 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  l: {
    x: 2 * ICON_WIDTH,
    y: 4 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  h: {
    x: 2 * ICON_WIDTH,
    y: 4 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  }, // Same as l
  o: {
    x: 3 * ICON_WIDTH,
    y: 4 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
  // Row 5: c
  c: {
    x: 0,
    y: 5 * ICON_HEIGHT,
    width: ICON_WIDTH,
    height: ICON_HEIGHT,
    anchorY: ICON_HEIGHT,
    mask: false,
  },
};

/**
 * Cluster icon mapping for cluster markers
 */
export const clusterIconMapping: IconMapping = {
  '': { x: 0, y: 0, width: 1, height: 1, anchorY: 1 },
  '1': { x: 0, y: 0, width: 64, height: 64, anchorY: 64 },
  '2': { x: 64, y: 0, width: 64, height: 64, anchorY: 64 },
  '3': { x: 128, y: 0, width: 64, height: 64, anchorY: 64 },
  '4': { x: 192, y: 0, width: 64, height: 64, anchorY: 64 },
  '5': { x: 0, y: 64, width: 64, height: 64, anchorY: 64 },
  '6': { x: 64, y: 64, width: 64, height: 64, anchorY: 64 },
  '7': { x: 128, y: 64, width: 64, height: 64, anchorY: 64 },
  '8': { x: 192, y: 64, width: 64, height: 64, anchorY: 64 },
  '9': { x: 0, y: 128, width: 64, height: 64, anchorY: 64 },
  '10': { x: 64, y: 128, width: 64, height: 64, anchorY: 64 },
  '20': { x: 128, y: 128, width: 64, height: 64, anchorY: 64 },
  '30': { x: 192, y: 128, width: 64, height: 64, anchorY: 64 },
  '40': { x: 0, y: 192, width: 64, height: 64, anchorY: 64 },
  '50': { x: 64, y: 192, width: 64, height: 64, anchorY: 64 },
  '60': { x: 128, y: 192, width: 64, height: 64, anchorY: 64 },
  '70': { x: 192, y: 192, width: 64, height: 64, anchorY: 64 },
  '80': { x: 0, y: 256, width: 64, height: 64, anchorY: 64 },
  '90': { x: 64, y: 256, width: 64, height: 64, anchorY: 64 },
  '100': { x: 128, y: 256, width: 64, height: 64, anchorY: 64 },
};

// ============================================================================
// City Label Constants
// ============================================================================

/**
 * Minimum font size for city labels in pixels.
 * Requirements: 10.4
 */
export const CITY_LABEL_MIN_FONT_SIZE = 18;

/**
 * Maximum font size for city labels in pixels.
 * Requirements: 10.4
 */
export const CITY_LABEL_MAX_FONT_SIZE = 68;

/**
 * City label weight for capitals.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_CAPITAL = 4;

/**
 * City label weight for cities with capital history.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_CAPITAL_HISTORY = 2;

/**
 * City label weight for regular cities.
 * Requirements: 10.3
 */
export const CITY_WEIGHT_REGULAR = 1;

/**
 * Radius for city dots in pixels.
 * Requirements: 10.5
 */
export const CITY_DOT_RADIUS = 4;

/**
 * Radius for highlighted city dots in pixels.
 * Requirements: 10.6
 */
export const CITY_DOT_HIGHLIGHT_RADIUS = 6;

/**
 * Default stroke width for arc connections in pixels.
 * Requirements: 11.4
 */
export const ARC_STROKE_WIDTH = 15;

// ============================================================================
// Area Color Layer Constants
// ============================================================================

/**
 * Minimum opacity for population coloring.
 * Requirements: 5.5
 */
export const POPULATION_OPACITY_MIN = 0.3;

/**
 * Maximum opacity for population coloring.
 * Requirements: 5.5
 */
export const POPULATION_OPACITY_MAX = 0.8;

/**
 * Default fill color for areas without metadata color.
 */
export const DEFAULT_AREA_FILL_COLOR: [number, number, number, number] = [128, 128, 128, 180];

/**
 * Population color (used for population dimension).
 * Requirements: 5.5
 */
export const POPULATION_FILL_COLOR: [number, number, number] = [100, 149, 237]; // Cornflower blue

/**
 * Maximum population value for opacity interpolation.
 * Requirements: 5.5
 */
export const MAX_POPULATION_FOR_OPACITY = 10000000;

/**
 * Index mapping for area color dimensions to province data array indices.
 * ruler=0, culture=1, religion=2, religionGeneral maps to religion (2), population=4
 */
export const DIMENSION_INDEX: Record<AreaColorDimension, number> = {
  ruler: 0,
  culture: 1,
  religion: 2,
  religionGeneral: 2, // religionGeneral uses the same index as religion
  population: 4,
};
