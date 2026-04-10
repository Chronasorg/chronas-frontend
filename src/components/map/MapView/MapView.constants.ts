/**
 * MapView Constants and Types
 *
 * Non-component exports extracted from MapView.tsx to satisfy
 * react-refresh/only-export-components lint rule.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.3, 5.3, 5.5, 11.2, 15.1, 15.2
 */

import type { AreaColorDimension } from '../../../stores/mapStore';

/**
 * Mapbox GL expression type for data-driven styling.
 * Using ExpressionSpecification from mapbox-gl for proper typing.
 */
export type MapboxExpression = [string, ...unknown[]];

/**
 * Debounce delay for year changes in milliseconds.
 * Requirement 11.2: THE MapView SHALL debounce year change events to prevent excessive API calls
 */
export const YEAR_CHANGE_DEBOUNCE_MS = 300;

/**
 * Hover information for province interactions
 * Requirement 7.4: WHEN the user hovers over a province, THE MapView SHALL display hover info
 */
export interface HoverInfo {
  /** Longitude and latitude of hover position */
  lngLat: [number, number];
  /** Feature properties from the hovered layer */
  feature: Record<string, unknown>;
  /** Province ID if available */
  provinceId: string | undefined;
}

/**
 * Sidebar width constants for layout calculations
 * SIDEBAR_WIDTH_OPEN = 50px sidebar + 300px MenuDrawer = 350px total
 * SIDEBAR_WIDTH_CLOSED = 50px sidebar only
 */
export const SIDEBAR_WIDTH_OPEN = 350;
export const SIDEBAR_WIDTH_CLOSED = 50;

/**
 * Right drawer width for layout calculations -- must match RightDrawer CSS width (35%)
 */
export const RIGHT_DRAWER_WIDTH_PERCENT = 35;

/**
 * Province layer configuration for each color dimension.
 * Requirement 3.1, 3.2, 3.3, 3.4: Province coloring by dimension
 */
export interface ProvinceLayerConfig {
  /** Layer ID */
  id: string;
  /** Property name in GeoJSON feature (r, c, e, g, p) */
  property: string;
  /** Color dimension this layer represents */
  dimension: AreaColorDimension;
}

/**
 * Province layer configurations for all dimensions.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.3
 */
export const PROVINCE_LAYERS: ProvinceLayerConfig[] = [
  { id: 'ruler-fill', property: 'r', dimension: 'ruler' },
  { id: 'culture-fill', property: 'c', dimension: 'culture' },
  { id: 'religion-fill', property: 'e', dimension: 'religion' },
  { id: 'religionGeneral-fill', property: 'g', dimension: 'religionGeneral' },
  { id: 'population-fill', property: 'p', dimension: 'population' },
];

/**
 * Default population fill color for population dimension.
 * Requirement 3.5: Population opacity interpolation
 */
export const POPULATION_FILL_COLOR = '#4a90d9';

/**
 * Population opacity range for interpolation.
 * Requirement 3.4: Opacity range [0.3, 1.0]
 */
export const POPULATION_OPACITY_MIN = 0.3;
export const POPULATION_OPACITY_MAX = 1.0;

/**
 * Maximum population value for opacity interpolation.
 * Requirement 3.4: THE MapView SHALL normalize population values to an opacity range of 0.3 to 1.0
 */
export const MAX_POPULATION_FOR_OPACITY = 10000000; // 10 million

/**
 * Default fill opacity for categorical layers.
 */
export const DEFAULT_FILL_OPACITY = 0.7;

/**
 * Marker icon configuration for each marker type.
 * Requirement 5.5: THE MapView SHALL use appropriate icons for each marker type
 */
export const MARKER_ICONS: Record<string, string> = {
  battle: 'castle', // Mapbox Maki icon for battles
  city: 'town-hall', // Mapbox Maki icon for cities
  capital: 'star', // Mapbox Maki icon for capitals
  person: 'monument', // Mapbox Maki icon for persons
  event: 'information', // Mapbox Maki icon for events
  other: 'marker', // Default marker icon
};

/**
 * Default marker icon for unknown types.
 */
export const DEFAULT_MARKER_ICON = 'marker';

/**
 * Marker icon size.
 */
export const MARKER_ICON_SIZE = 1.0;

/**
 * Marker icon colors by type.
 * Requirement 5.3: THE MapView SHALL support marker types with distinct styling
 */
export const MARKER_COLORS: Record<string, string> = {
  battle: '#e74c3c', // Red for battles
  city: '#3498db', // Blue for cities
  capital: '#f1c40f', // Gold for capitals
  person: '#9b59b6', // Purple for persons
  event: '#2ecc71', // Green for events
  other: '#95a5a6', // Gray for other
};
