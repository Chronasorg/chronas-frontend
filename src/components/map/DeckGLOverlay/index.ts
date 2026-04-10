/**
 * DeckGLOverlay Component Export
 *
 * Exports the DeckGLOverlay component and related types, constants, and utilities.
 */

export { DeckGLOverlay, default } from './DeckGLOverlay';
export type {
  DeckGLOverlayProps,
  MarkerData,
  ZoomLevelData,
  ArcData,
  SelectedItem,
  MetadataEntry,
  Metadata,
  DeckHoverEvent,
  GoToViewportOptions,
  IconEntry,
  IconMapping,
} from './DeckGLOverlay.types';
export {
  iconSize,
  DEFAULT_MARKER_SIZE,
  themedIconMapping,
  clusterIconMapping,
  CITY_LABEL_MIN_FONT_SIZE,
  CITY_LABEL_MAX_FONT_SIZE,
  CITY_WEIGHT_CAPITAL,
  CITY_WEIGHT_CAPITAL_HISTORY,
  CITY_WEIGHT_REGULAR,
  CITY_DOT_RADIUS,
  CITY_DOT_HIGHLIGHT_RADIUS,
  ARC_STROKE_WIDTH,
  POPULATION_OPACITY_MIN,
  POPULATION_OPACITY_MAX,
  DEFAULT_AREA_FILL_COLOR,
  POPULATION_FILL_COLOR,
  MAX_POPULATION_FOR_OPACITY,
  DIMENSION_INDEX,
} from './DeckGLOverlay.constants';
export {
  getMarkerSizeScale,
  rgbaToArray,
  getClusterIconName,
  getClusterIconSize,
  getProvinceColor,
  getProvinceOpacity,
  getCityLabelWeight,
  getCityLabelFontSize,
  isCityMarker,
  isNonCapitalCity,
  MarkerSpatialIndex,
  calculateClusters,
} from './DeckGLOverlay.utils';
