/**
 * DeckGLOverlay Component
 *
 * Renders deck.gl layers on top of the Mapbox base map including
 * markers, arcs, city labels, and area color layers.
 *
 * Requirements: 1.2, 5.2, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 11.1, 11.2, 11.3, 11.4
 */

import { useMemo, useCallback } from 'react';
import { useControl } from 'react-map-gl/mapbox';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { IconLayer, TextLayer, ScatterplotLayer, ArcLayer, GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import type { LayersList } from '@deck.gl/core';
import type { DeckGLOverlayProps, MarkerData, ArcData } from './DeckGLOverlay.types';
import {
  iconSize,
  DEFAULT_MARKER_SIZE,
  themedIconMapping,
  clusterIconMapping,
  CITY_LABEL_MIN_FONT_SIZE,
  CITY_LABEL_MAX_FONT_SIZE,
  CITY_DOT_RADIUS,
  CITY_DOT_HIGHLIGHT_RADIUS,
  ARC_STROKE_WIDTH,
  DEFAULT_AREA_FILL_COLOR,
} from './DeckGLOverlay.constants';
import {
  getMarkerSizeScale,
  rgbaToArray,
  getProvinceColor,
  getCityLabelWeight,
  getCityLabelFontSize,
  isCityMarker,
  isNonCapitalCity,
  calculateClusters,
} from './DeckGLOverlay.utils';

// ============================================================================
// DeckGL Overlay Hook
// ============================================================================

/**
 * Custom hook to create a DeckGL MapboxOverlay control.
 * This integrates deck.gl layers with react-map-gl.
 */
function DeckGLOverlayControl(props: { layers: LayersList }) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay({ interleaved: true }));

  overlay.setProps({ layers: props.layers });

  return null;
}

// ============================================================================
// DeckGLOverlay Component
// ============================================================================

/**
 * DeckGLOverlay Component
 *
 * Renders deck.gl layers on top of the Mapbox base map.
 * Includes IconLayer for markers with hover highlighting and click handling.
 *
 * Requirements:
 * - 1.2: THE MapView SHALL initialize deck.gl for overlay rendering
 * - 5.2: THE MapView SHALL support coloring provinces by ruler, religion, religionGeneral, culture, or population
 * - 5.3: WHEN the active color dimension changes, THE MapView SHALL update the visible layer
 * - 5.5: WHEN population coloring is active, THE MapView SHALL use opacity interpolation
 * - 9.1: THE MapView SHALL render markers using a deck.gl IconLayer
 * - 9.2: WHEN markers are loaded, THE MapView SHALL display them at their geographic coordinates
 * - 9.3: THE MapView SHALL use the appropriate icon atlas based on the marker theme setting
 * - 9.4: WHEN the user hovers over a marker, THE MapView SHALL highlight the marker
 * - 9.5: WHEN cluster mode is enabled, THE MapView SHALL display cluster icons with counts
 * - 9.9: THE MapView SHALL scale marker size based on zoom level
 * - 10.1: THE MapView SHALL render city labels using a TextLayer (alternative to TagmapLayer)
 * - 10.2: WHEN cities are loaded, THE MapView SHALL display their names at their geographic coordinates
 * - 10.3: THE MapView SHALL weight city labels (capitals: 4, capital history: 2, regular: 1)
 * - 10.4: THE MapView SHALL configure font size range (18-68px)
 * - 10.5: THE MapView SHALL render dots for non-capital cities using ScatterplotLayer
 * - 10.6: WHEN the user hovers over a city dot, THE MapView SHALL highlight the dot
 * - 10.7: WHEN the user clicks a city dot, THE MapView SHALL trigger onMarkerClick
 * - 11.1: THE MapView SHALL render route connections using a deck.gl ArcLayer
 * - 11.2: WHEN arc data is provided, THE MapView SHALL render curved lines between source and target coordinates
 * - 11.3: THE MapView SHALL color arcs using the provided source and target colors
 * - 11.4: THE MapView SHALL configure arc stroke width
 */
export function DeckGLOverlay(props: DeckGLOverlayProps) {
  const {
    viewport,
    theme,
    activeColor,
    layerVisibility,
    provincesGeoJSON,
    areaData,
    markerData,
    arcData,
    selectedItem,
    selectedYear,
    markerTheme,
    metadata,
    showCluster,
    onMarkerClick,
    onHover,
  } = props;

  // Derive processed markers with clustering data via useMemo
  // (replaces previous useEffect + useState pattern to avoid synchronous setState in effect)
  const processedMarkers = useMemo(() => {
    if (markerData.length === 0) {
      return [];
    }

    // Add screen coordinates to markers for clustering
    // coo is typed as [number, number], but runtime data may be invalid
    // Use type assertion to allow runtime validation
    const validMarkers = markerData.filter((marker) => {
      const coo = marker.coo as unknown;
      if (!coo || !Array.isArray(coo) || coo.length < 2) {
        return false;
      }
      const [lng, lat] = coo as [unknown, unknown];
      return typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat);
    });

    const markersWithCoords = validMarkers.map((marker) => {
      // Simple mercator projection for screen coordinates
      // This is a simplified version - in production, use WebMercatorViewport
      const x = ((marker.coo[0] + 180) / 360) * viewport.width;
      const y = ((90 - marker.coo[1]) / 180) * viewport.height;
      return { ...marker, x, y };
    });

    if (showCluster) {
      const sizeScaleValue =
        DEFAULT_MARKER_SIZE *
        getMarkerSizeScale(viewport.zoom) *
        (window.devicePixelRatio || 1);
      return calculateClusters(markersWithCoords, viewport.zoom, sizeScaleValue);
    }

    return markersWithCoords;
  }, [markerData, viewport.zoom, viewport.width, viewport.height, showCluster]);

  /**
   * Handle marker hover events.
   * Requirements: 9.4
   */
  const handleHover = useCallback(
    (info: PickingInfo) => {
      onHover({
        object: info.object as MarkerData | undefined,
        x: info.x,
        y: info.y,
        coordinate: info.coordinate as [number, number] | undefined,
      });
    },
    [onHover]
  );

  /**
   * Handle marker click events.
   * Requirements: 7.5
   */
  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object) {
        onMarkerClick(info.object as MarkerData);
      }
    },
    [onMarkerClick]
  );

  /**
   * Get the icon atlas URL based on marker theme.
   * Requirements: 9.3
   */
  const iconAtlasUrl = useMemo(() => {
    if (showCluster) {
      return '/images/themed-cluster-atlas.png';
    }
    return '/images/' + markerTheme + '-atlas.png';
  }, [markerTheme, showCluster]);

  /**
   * Get the icon mapping based on marker theme.
   */
  const currentIconMapping = useMemo(() => {
    return showCluster ? clusterIconMapping : themedIconMapping;
  }, [showCluster]);

  /**
   * Calculate marker size scale based on zoom.
   * Requirements: 9.9
   */
  const sizeScale = useMemo(() => {
    return DEFAULT_MARKER_SIZE * getMarkerSizeScale(viewport.zoom) * (window.devicePixelRatio || 1);
  }, [viewport.zoom]);

  /**
   * Get highlight color from theme.
   * Requirements: 9.4
   */
  const highlightColor = useMemo(() => {
    const colorStr = theme.highlightColors[0];
    return rgbaToArray(colorStr);
  }, [theme.highlightColors]);

  /**
   * Filter markers for display based on clustering.
   */
  const displayMarkers = useMemo(() => {
    if (!showCluster) {
      return processedMarkers;
    }

    const z = Math.floor(viewport.zoom);
    // Only show markers that are cluster centers (have non-null zoomLevels[z])
    return processedMarkers.filter((m) => {
      if (m.subtype === 'c') return true; // Always show cities
      const zoomLevels = m.zoomLevels;
      if (!zoomLevels) return false;
      return zoomLevels[z] !== null && zoomLevels[z] !== undefined;
    });
  }, [processedMarkers, showCluster, viewport.zoom]);

  /**
   * Filter city markers for labels and dots.
   * Requirements: 10.1, 10.5
   */
  const cityMarkers = useMemo(() => {
    return processedMarkers.filter(isCityMarker);
  }, [processedMarkers]);

  /**
   * Filter non-capital city markers for dots.
   * Requirements: 10.5
   */
  const nonCapitalCityMarkers = useMemo(() => {
    return processedMarkers.filter(isNonCapitalCity);
  }, [processedMarkers]);

  /**
   * Create the IconLayer for markers.
   * Requirements: 5.2, 5.3, 5.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.9
   */
  const layers = useMemo(() => {
    const z = Math.floor(viewport.zoom);
    const layersList: LayersList = [];

    /**
     * Area Color GeoJsonLayer
     * Requirements: 5.2, 5.3, 5.5
     *
     * Renders province polygons colored by the active dimension.
     * - Supports ruler, religion, religionGeneral, culture, and population
     * - Uses categorical fill-color stops from metadata
     * - Population uses opacity interpolation between 0.3 and 0.8
     */
    if (provincesGeoJSON && layerVisibility[activeColor]) {
      const areaColorLayer = new GeoJsonLayer({
        id: `area-color-${activeColor}`,
        data: provincesGeoJSON,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthMinPixels: 1,
        // Requirements: 5.2 - Color provinces by active dimension
        getFillColor: (feature) => {
          const props = feature.properties as Record<string, unknown> | null;
          const provinceId = props?.['id'] as string | undefined;
          if (!provinceId) return DEFAULT_AREA_FILL_COLOR;
          return getProvinceColor(provinceId, areaData, activeColor, metadata);
        },
        // Requirements: 5.5 - Population opacity interpolation
        getLineColor: [80, 80, 80, 255] as [number, number, number, number],
        getLineWidth: 1,
        // Apply opacity for population dimension
        opacity: activeColor === 'population' ? 0.7 : 0.8,
        updateTriggers: {
          getFillColor: [activeColor, areaData],
          opacity: [activeColor],
        },
      });
      layersList.push(areaColorLayer);
    }

    const iconLayer = new IconLayer({
      id: 'markers',
      data: displayMarkers,
      pickable: true,
      autoHighlight: true,
      highlightColor: showCluster ? [0, 50, 0, 1] : highlightColor,
      iconAtlas: iconAtlasUrl,
      iconMapping: currentIconMapping,
      sizeScale,
      // Requirements: 9.2 - Position markers at their geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      // Get icon based on subtype or cluster icon
      getIcon: (d: MarkerData) => {
        const zoomLevels = d.zoomLevels;
        if (showCluster && zoomLevels) {
          const zoomData = zoomLevels[z];
          if (zoomData) {
            return zoomData.icon || d.subtype;
          }
        }
        return d.subtype;
      },
      // Get size based on marker type or cluster size
      getSize: (d: MarkerData) => {
        const zoomLevels = d.zoomLevels;
        if (showCluster && zoomLevels) {
          const zoomData = zoomLevels[z];
          if (zoomData) {
            return (zoomData.size || 1) * 20;
          }
        }
        // Highlight active markers
        if (d.isActive) {
          return (iconSize[d.subtype] ?? 4) + 10;
        }
        return iconSize[d.subtype] ?? 4;
      },
      // Get color for capital markers based on ruler metadata
      getColor: (d: MarkerData): [number, number, number, number] => {
        if (d.subtype === 'cp' && d.capital) {
          // Find the ruler for the current year
          const capitalEntry = d.capital.find(
            (entry) => entry[0] <= selectedYear && entry[1] >= selectedYear
          );
          if (capitalEntry) {
            const rulerId = capitalEntry[2];
            const rulerMeta = metadata.ruler[rulerId];
            if (rulerMeta) {
              const colorValue = rulerMeta[1];
              if (typeof colorValue === 'string') {
                return rgbaToArray(colorValue);
              }
            }
          }
        }
        return [0, 0, 0, 255];
      },
      onHover: handleHover,
      onClick: handleClick,
      updateTriggers: {
        getIcon: [z, showCluster],
        getSize: [z, showCluster, selectedItem.wiki],
        getColor: [selectedYear, activeColor],
      },
    });

    /**
     * City Labels TextLayer
     * Requirements: 10.1, 10.2, 10.3, 10.4
     *
     * Renders city names at their geographic coordinates with weight-based sizing.
     * - Capitals (cp): weight 4, largest font
     * - Cities with capital history: weight 2, medium font
     * - Regular cities (c): weight 1, smallest font
     */
    const cityLabelsLayer = new TextLayer({
      id: 'city-labels',
      data: cityMarkers,
      pickable: true,
      // Requirements: 10.2 - Position labels at geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      getText: (d: MarkerData) => d.name,
      // Requirements: 10.3, 10.4 - Weight-based font sizing
      getSize: (d: MarkerData) => {
        const weight = getCityLabelWeight(d, selectedYear);
        return getCityLabelFontSize(weight);
      },
      getColor: [0, 0, 0, 255],
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'top',
      getPixelOffset: [0, 10], // Offset below the marker
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      outlineWidth: 2,
      outlineColor: [255, 255, 255, 200],
      // Scale text with zoom for better visibility
      sizeScale: Math.max(0.5, getMarkerSizeScale(viewport.zoom)),
      sizeMinPixels: CITY_LABEL_MIN_FONT_SIZE,
      sizeMaxPixels: CITY_LABEL_MAX_FONT_SIZE,
      updateTriggers: {
        getSize: [selectedYear],
      },
    });

    /**
     * City Dots ScatterplotLayer
     * Requirements: 10.5, 10.6, 10.7
     *
     * Renders dots for non-capital cities with hover highlighting and click handling.
     */
    const cityDotsLayer = new ScatterplotLayer({
      id: 'city-dots',
      data: nonCapitalCityMarkers,
      pickable: true,
      autoHighlight: true,
      // Requirements: 10.6 - Highlight on hover
      highlightColor: highlightColor,
      // Requirements: 10.5 - Position dots at geographic coordinates
      getPosition: (d: MarkerData) => d.coo,
      getRadius: (d: MarkerData) =>
        d.isActive ? CITY_DOT_HIGHLIGHT_RADIUS : CITY_DOT_RADIUS,
      getFillColor: [100, 100, 100, 200],
      getLineColor: [50, 50, 50, 255],
      stroked: true,
      lineWidthMinPixels: 1,
      radiusMinPixels: 2,
      radiusMaxPixels: 10,
      // Requirements: 10.6, 10.7 - Hover and click handling
      onHover: handleHover,
      onClick: handleClick,
      updateTriggers: {
        getRadius: [selectedItem.wiki],
      },
    });

    /**
     * Arc Layer for Route Connections
     * Requirements: 11.1, 11.2, 11.3, 11.4
     *
     * Renders curved lines between source and target coordinates for route connections.
     * - Source and target positions from arc data
     * - Source and target colors for gradient effect
     * - Configurable stroke width (default: 15)
     */
    const arcLayer = new ArcLayer<ArcData>({
      id: 'arcs',
      data: arcData ?? [],
      pickable: true,
      // Requirements: 11.2 - Position arcs between source and target coordinates
      getSourcePosition: (d: ArcData) => d.source,
      getTargetPosition: (d: ArcData) => d.target,
      // Requirements: 11.3 - Color arcs using source and target colors
      getSourceColor: (d: ArcData) => d.sourceColor,
      getTargetColor: (d: ArcData) => d.targetColor,
      // Requirements: 11.4 - Configure stroke width
      getWidth: ARC_STROKE_WIDTH,
      // Requirements: 11.5 - Update on viewport changes
      updateTriggers: {
        getSourcePosition: [arcData],
        getTargetPosition: [arcData],
        getSourceColor: [arcData],
        getTargetColor: [arcData],
      },
    });

    // Add all layers to the list
    layersList.push(iconLayer, cityLabelsLayer, cityDotsLayer, arcLayer);

    return layersList;
  }, [
    displayMarkers,
    cityMarkers,
    nonCapitalCityMarkers,
    viewport.zoom,
    showCluster,
    highlightColor,
    iconAtlasUrl,
    currentIconMapping,
    sizeScale,
    metadata,
    selectedYear,
    selectedItem.wiki,
    activeColor,
    layerVisibility,
    provincesGeoJSON,
    areaData,
    handleHover,
    handleClick,
    arcData,
  ]);

  return <DeckGLOverlayControl layers={layers} />;
}

export default DeckGLOverlay;
