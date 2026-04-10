/**
 * DeckGLOverlay Types
 *
 * Type definitions for the DeckGLOverlay component and related utilities.
 *
 * Requirements: 1.2, 5.2, 5.3, 5.5, 9.2, 11.2, 11.3
 */

import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import type { ThemeConfig } from '../../../config/mapTheme';
import type { ViewportState, AreaColorDimension, LayerVisibility, AreaData } from '../../../stores/mapStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Marker data structure for map markers.
 * Requirements: 9.2
 */
export interface MarkerData {
  /** Unique identifier */
  _id: string;
  /** Display name */
  name: string;
  /** Marker type/subtype (b, si, c, cp, etc.) */
  subtype: string;
  /** Coordinates [longitude, latitude] */
  coo: [number, number];
  /** Wikipedia reference */
  wiki?: string;
  /** Year of the marker */
  year?: number;
  /** Capital history array [[startYear, endYear, rulerId], ...] */
  capital?: [number, number, string][];
  /** Whether this marker is currently active/selected */
  isActive?: boolean;
  /** Zoom level visibility data for clustering */
  zoomLevels?: Record<number, ZoomLevelData | null>;
  /** Screen X coordinate for clustering */
  x?: number;
  /** Screen Y coordinate for clustering */
  y?: number;
}

/**
 * Zoom level data for clustering
 */
export interface ZoomLevelData {
  icon: string;
  size: number;
  points: MarkerData[];
}

/**
 * Arc data for connections between locations.
 * Requirements: 11.2, 11.3
 */
export interface ArcData {
  /** Source coordinates [longitude, latitude] */
  source: [number, number];
  /** Target coordinates [longitude, latitude] */
  target: [number, number];
  /** Source color [r, g, b, a] */
  sourceColor: [number, number, number, number];
  /** Target color [r, g, b, a] */
  targetColor: [number, number, number, number];
}

/**
 * Selected item state
 */
export interface SelectedItem {
  wiki?: string;
  type?: string;
  data?: {
    content?: { properties?: { w?: string } }[];
    drawRoute?: boolean;
  };
}

/**
 * Metadata entry for colors and labels
 */
export interface MetadataEntry {
  /** Display name */
  0: string;
  /** Color value (rgba string) */
  1: string;
  /** Additional data varies by type */
  [key: number]: unknown;
}

/**
 * Metadata structure
 */
export interface Metadata {
  ruler: Record<string, MetadataEntry>;
  culture: Record<string, MetadataEntry>;
  religion: Record<string, MetadataEntry>;
  religionGeneral: Record<string, MetadataEntry>;
}

/**
 * Deck.gl hover event
 */
export interface DeckHoverEvent {
  object: MarkerData | undefined;
  x: number;
  y: number;
  coordinate: [number, number] | undefined;
}

/**
 * Go to viewport options
 */
export interface GoToViewportOptions {
  longitude: number;
  latitude: number;
  zoom?: number;
  zoomIn?: boolean;
}

/**
 * Props for the DeckGLOverlay component.
 * Requirements: 1.2, 5.2, 5.3, 5.5
 */
export interface DeckGLOverlayProps {
  /** Current viewport state */
  viewport: ViewportState;
  /** Current theme configuration */
  theme: ThemeConfig;
  /** Active color dimension for areas */
  activeColor: AreaColorDimension;
  /** Layer visibility state for each color dimension - Requirement 5.3 */
  layerVisibility: LayerVisibility;
  /** Provinces GeoJSON for area coloring - Requirement 5.2 */
  provincesGeoJSON?: FeatureCollection<Polygon | MultiPolygon> | null;
  /** Current area data for province coloring - Requirement 5.2 */
  areaData?: AreaData | null;
  /** Marker data to display */
  markerData: MarkerData[];
  /** Arc data for connections (reserved for future arc layer implementation) */
  arcData?: ArcData[];
  /** Currently selected item */
  selectedItem: SelectedItem;
  /** Current year */
  selectedYear: number;
  /** Marker theme (themed or abstract) */
  markerTheme: string;
  /** Metadata for colors and labels */
  metadata: Metadata;
  /** Whether to show clustered markers */
  showCluster: boolean;
  /** Callback for marker clicks */
  onMarkerClick: (marker: MarkerData) => void;
  /** Callback for hover events */
  onHover: (event: DeckHoverEvent) => void;
  /** Callback to update route line (reserved for future route animation) */
  updateLine?: (coordinates: number[][]) => void;
  /** Callback to navigate viewport (reserved for future navigation) */
  goToViewport?: (options: GoToViewportOptions) => void;
}

/**
 * Icon mapping entry for sprite sheet icons.
 * Each entry defines position and size in the sprite sheet.
 */
export interface IconEntry {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorY: number;
  anchorX?: number;
  mask?: boolean;
}

export type IconMapping = Record<string, IconEntry>;
