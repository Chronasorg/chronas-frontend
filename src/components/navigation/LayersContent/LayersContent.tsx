/**
 * LayersContent Component
 *
 * Content component for the Layers menu drawer. Contains:
 * - General section with Area (LayerToggle) and Markers subsections
 * - Epics section with epic type filter toggles
 * - Advanced section with basemap, province borders, and opacity settings
 *
 * Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.15, 7.16, 7.17, 7.18, 7.19
 */

import React, { useState, useCallback } from 'react';
import styles from './LayersContent.module.css';
import { LayerToggle } from '../../map/LayerToggle/LayerToggle';
import { useMapStore, type AreaColorDimension, type BasemapType } from '@/stores/mapStore';
import { useTimelineStore, EPIC_TYPES, type EpicType } from '@/stores/timelineStore';

/**
 * Marker type configuration for filter toggles
 */
interface MarkerTypeConfig {
  /** Marker type key (API code) */
  type: string;
  /** Display label */
  label: string;
  /** Icon position in themed-atlas.png (135x127 grid) */
  iconX: number;
  iconY: number;
}

/**
 * Icon dimensions for themed atlas (from production properties.js)
 */
const ICON_WIDTH = 135;
const ICON_HEIGHT = 127;

/**
 * Marker types with their display configuration
 * Requirement 7.8: Add marker type toggles with themed atlas icons
 * Matches production marker categories from properties.js markerIdNameArray
 * Icon positions from production iconMapping['them']
 */
const MARKER_TYPES: MarkerTypeConfig[] = [
  { type: 'ar', label: 'Artifact', iconX: 0, iconY: 3 * ICON_HEIGHT },
  { type: 'b', label: 'Battle', iconX: ICON_WIDTH, iconY: 3 * ICON_HEIGHT },
  { type: 'si', label: 'Siege', iconX: 2 * ICON_WIDTH, iconY: 3 * ICON_HEIGHT },
  { type: 'cp', label: 'Capital', iconX: 3 * ICON_WIDTH, iconY: 3 * ICON_HEIGHT },
  { type: 'c', label: 'City', iconX: 0, iconY: 5 * ICON_HEIGHT },
  { type: 'ca', label: 'Castle', iconX: 0, iconY: 4 * ICON_HEIGHT },
  { type: 'l', label: 'Landmark', iconX: 2 * ICON_WIDTH, iconY: 4 * ICON_HEIGHT },
  { type: 'm', label: 'Military', iconX: 2 * ICON_WIDTH, iconY: 2 * ICON_HEIGHT },
  { type: 'p', label: 'Politician', iconX: 2 * ICON_WIDTH, iconY: 0 },
  { type: 'e', label: 'Explorer', iconX: 3 * ICON_WIDTH, iconY: 0 },
  { type: 's', label: 'Scientist', iconX: 2 * ICON_WIDTH, iconY: ICON_HEIGHT },
  { type: 'a', label: 'Artist', iconX: 0, iconY: ICON_HEIGHT },
  { type: 'r', label: 'Religious', iconX: ICON_WIDTH, iconY: 0 },
  { type: 'at', label: 'Athlete', iconX: ICON_WIDTH, iconY: 2 * ICON_HEIGHT },
  { type: 'op', label: 'Unclassified', iconX: 3 * ICON_WIDTH, iconY: ICON_HEIGHT },
  { type: 'o', label: 'Unknown', iconX: 3 * ICON_WIDTH, iconY: 4 * ICON_HEIGHT },
];

/**
 * Basemap options
 * Requirement 7.15: Add basemap selection dropdown
 */

interface BasemapOption {
  value: BasemapType;
  label: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  { value: 'topographic', label: 'Topographic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'none', label: 'None' },
];

/**
 * Epic type configuration for filter toggles
 * Requirement 7.2: Display toggles for each epic type/category
 */
interface EpicTypeConfig {
  /** Epic type key */
  type: EpicType;
  /** Display label */
  label: string;
  /** Icon emoji or character */
  icon: string;
}

/**
 * Epic types with their display configuration
 * Requirement 7.2: Display toggles for each epic type/category
 */
const EPIC_TYPE_CONFIGS: EpicTypeConfig[] = [
  { type: 'war', label: 'Wars', icon: '⚔️' },
  { type: 'empire', label: 'Empires', icon: '🏰' },
  { type: 'religion', label: 'Religion', icon: '⛪' },
  { type: 'culture', label: 'Culture', icon: '🎭' },
  { type: 'person', label: 'People', icon: '👤' },
  { type: 'other', label: 'Other', icon: '📜' },
];

/**
 * Collapsible section component
 */
interface CollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Whether section is expanded */
  expanded: boolean;
  /** Toggle callback */
  onToggle: () => void;
  /** Section content */
  children: React.ReactNode;
  /** Test ID (required) */
  testId: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  expanded,
  onToggle,
  children,
  testId,
}) => {
  return (
    <div className={styles['section']} data-testid={testId}>
      <button
        type="button"
        className={styles['sectionHeader']}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`${testId}-content`}
        data-testid={`${testId}-toggle`}
      >
        <span className={styles['sectionTitle']}>{title}</span>
        <span className={styles['expandIcon']} aria-hidden="true">
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && (
        <div
          id={`${testId}-content`}
          className={styles['sectionContent']}
          data-testid={`${testId}-content`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Marker filter toggle component
 * Requirement 7.7: Add Check All / Uncheck All toggle
 * Requirement 7.8: Add marker type toggles with themed atlas icons
 */
interface MarkerFiltersProps {
  /** Current filter state */
  filters: Record<string, boolean>;
  /** Callback when filter changes */
  onFilterChange: (type: string, enabled: boolean) => void;
  /** Marker limit value */
  markerLimit: number;
  /** Callback when marker limit changes */
  onMarkerLimitChange: (limit: number) => void;
  /** Whether markers are clustered */
  clusterMarkers: boolean;
  /** Callback when cluster toggle changes */
  onClusterChange: (enabled: boolean) => void;
}

const MarkerFilters: React.FC<MarkerFiltersProps> = ({
  filters,
  onFilterChange,
  markerLimit,
  onMarkerLimitChange,
  clusterMarkers,
  onClusterChange,
}) => {
  // Check if all markers are enabled
  const allEnabled = MARKER_TYPES.every((mt) => filters[mt.type] !== false);

  /**
   * Handle check all / uncheck all
   * Requirement 7.7: Add Check All / Uncheck All toggle
   */
  const handleToggleAll = useCallback(() => {
    const newValue = !allEnabled;
    MARKER_TYPES.forEach((mt) => {
      onFilterChange(mt.type, newValue);
    });
  }, [allEnabled, onFilterChange]);

  return (
    <div className={styles['markerFilters']} data-testid="marker-filters">
      {/* Check All / Uncheck All toggle */}
      <div className={styles['toggleAllRow']}>
        <button
          type="button"
          className={styles['toggleAllButton']}
          onClick={handleToggleAll}
          aria-label={allEnabled ? 'Uncheck all marker types' : 'Check all marker types'}
          data-testid="toggle-all-markers"
        >
          {allEnabled ? 'Uncheck All' : 'Check All'}
        </button>
      </div>

      {/* Individual marker type toggles */}
      <div className={styles['markerTypeList']}>
        {MARKER_TYPES.map((mt) => {
          // Calculate background position for sprite atlas icon
          // Production uses coefficient = 40 / 135 for themed atlas
          const coefficient = 40 / 135;
          const bgX = Math.round(mt.iconX * coefficient);
          const bgY = Math.round(mt.iconY * coefficient);
          // Background size: 540 * coefficient = 160, height scales proportionally
          const bgWidth = Math.round(540 * coefficient);
          const bgHeight = Math.round(893 * coefficient);
          const isActive = filters[mt.type] !== false;
          
          return (
            <label
              key={mt.type}
              className={styles['markerTypeRow']}
              data-testid={`marker-filter-${mt.type}`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => onFilterChange(mt.type, e.target.checked)}
                className={styles['markerCheckbox']}
                aria-label={`Show ${mt.label} markers`}
              />
              <span 
                className={styles['markerIcon']} 
                aria-hidden="true"
                style={{
                  backgroundImage: 'url(/images/themed-atlas.png)',
                  backgroundPosition: `-${String(bgX)}px -${String(bgY)}px`,
                  backgroundSize: `${String(bgWidth)}px ${String(bgHeight)}px`,
                  opacity: isActive ? 1 : 0.3,
                }}
              />
              <span className={styles['markerLabel']}>{mt.label}</span>
            </label>
          );
        })}
      </div>

      {/* Marker limit slider - Requirement 7.10 */}
      <div className={styles['sliderRow']}>
        <label htmlFor="marker-limit" className={styles['sliderLabel']}>
          Marker Limit: {markerLimit.toLocaleString()}
        </label>
        <input
          id="marker-limit"
          type="range"
          min={0}
          max={10000}
          step={100}
          value={markerLimit}
          onChange={(e) => onMarkerLimitChange(Number(e.target.value))}
          className={styles['slider']}
          aria-label="Marker limit"
          data-testid="marker-limit-slider"
        />
      </div>

      {/* Cluster markers toggle - Requirement 7.11 */}
      <label className={styles['toggleRow']} data-testid="cluster-markers-toggle">
        <input
          type="checkbox"
          checked={clusterMarkers}
          onChange={(e) => onClusterChange(e.target.checked)}
          className={styles['toggleCheckbox']}
          aria-label="Cluster markers"
        />
        <span className={styles['toggleLabel']}>Cluster Markers</span>
      </label>
    </div>
  );
};

/**
 * Epic filter toggle component
 * Requirement 7.1: Include an "Epics" collapsible section
 * Requirement 7.2: Display toggles for each epic type/category
 * Requirement 7.5: Provide "Check All" and "Uncheck All" buttons
 */
interface EpicFiltersProps {
  /** Current filter state */
  filters: Record<EpicType, boolean>;
  /** Callback when filter changes */
  onFilterChange: (type: EpicType, enabled: boolean) => void;
  /** Callback to set all filters */
  onSetAllFilters: (enabled: boolean) => void;
}

const EpicFilters: React.FC<EpicFiltersProps> = ({
  filters,
  onFilterChange,
  onSetAllFilters,
}) => {
  // Check if all epics are enabled
  const allEnabled = EPIC_TYPES.every((type) => filters[type]);

  /**
   * Handle check all / uncheck all
   * Requirement 7.5: Provide "Check All" and "Uncheck All" buttons
   */
  const handleToggleAll = useCallback(() => {
    onSetAllFilters(!allEnabled);
  }, [allEnabled, onSetAllFilters]);

  return (
    <div className={styles['epicFilters']} data-testid="epic-filters">
      {/* Check All / Uncheck All toggle - Requirement 7.5 */}
      <div className={styles['toggleAllRow']}>
        <button
          type="button"
          className={styles['toggleAllButton']}
          onClick={handleToggleAll}
          aria-label={allEnabled ? 'Uncheck all epic types' : 'Check all epic types'}
          data-testid="toggle-all-epics"
        >
          {allEnabled ? 'Uncheck All' : 'Check All'}
        </button>
      </div>

      {/* Individual epic type toggles - Requirement 7.2 */}
      <div className={styles['epicTypeList']}>
        {EPIC_TYPE_CONFIGS.map((config) => (
          <label
            key={config.type}
            className={styles['epicTypeRow']}
            data-testid={`epic-filter-${config.type}`}
          >
            <input
              type="checkbox"
              checked={filters[config.type]}
              onChange={(e) => onFilterChange(config.type, e.target.checked)}
              className={styles['epicCheckbox']}
              aria-label={`Show ${config.label} epics`}
            />
            <span className={styles['epicIcon']} aria-hidden="true">
              {config.icon}
            </span>
            <span className={styles['epicLabel']}>{config.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

/**
 * Advanced settings component
 * Requirement 7.15, 7.16, 7.17
 */
interface AdvancedSettingsProps {
  /** Current basemap selection */
  basemap: BasemapType;
  /** Callback when basemap changes */
  onBasemapChange: (basemap: BasemapType) => void;
  /** Whether province borders are shown */
  showProvinceBorders: boolean;
  /** Callback when show province borders changes */
  onShowProvinceBordersChange: (show: boolean) => void;
  /** Whether opacity by population is enabled */
  populationOpacity: boolean;
  /** Callback when population opacity changes */
  onPopulationOpacityChange: (enabled: boolean) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  basemap,
  onBasemapChange,
  showProvinceBorders,
  onShowProvinceBordersChange,
  populationOpacity,
  onPopulationOpacityChange,
}) => {
  return (
    <div className={styles['advancedSettings']} data-testid="advanced-settings">
      {/* Basemap selection - Requirement 7.15 */}
      <div className={styles['selectRow']}>
        <label htmlFor="basemap-select" className={styles['selectLabel']}>
          Basemap
        </label>
        <select
          id="basemap-select"
          value={basemap}
          onChange={(e) => onBasemapChange(e.target.value as BasemapType)}
          className={styles['select']}
          data-testid="basemap-select"
        >
          {BASEMAP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Show Provinces toggle - Requirement 7.16 */}
      <label className={styles['toggleRow']} data-testid="show-provinces-toggle">
        <input
          type="checkbox"
          checked={showProvinceBorders}
          onChange={(e) => onShowProvinceBordersChange(e.target.checked)}
          className={styles['toggleCheckbox']}
          aria-label="Show province borders"
        />
        <span className={styles['toggleLabel']}>Show Provinces</span>
      </label>

      {/* Opacity by Population toggle - Requirement 7.17 */}
      <label className={styles['toggleRow']} data-testid="pop-opacity-toggle">
        <input
          type="checkbox"
          checked={populationOpacity}
          onChange={(e) => onPopulationOpacityChange(e.target.checked)}
          className={styles['toggleCheckbox']}
          aria-label="Opacity by population"
        />
        <span className={styles['toggleLabel']}>Opacity by Population</span>
      </label>
    </div>
  );
};

/**
 * LayersContent component props
 */
export interface LayersContentProps {
  /** Additional CSS class name */
  className?: string;
  /** Test ID */
  testId?: string;
}

/**
 * LayersContent Component
 *
 * Main content component for the Layers menu drawer.
 * Contains General section (Area + Markers) and Advanced section.
 *
 * Requirements: 7.5, 7.6
 */
export const LayersContent: React.FC<LayersContentProps> = ({
  className,
  testId = 'layers-content',
}) => {
  // Section expansion state
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [areaExpanded, setAreaExpanded] = useState(true);
  const [markersExpanded, setMarkersExpanded] = useState(true);
  const [epicsExpanded, setEpicsExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Map store state and actions
  const activeColor = useMapStore((state) => state.activeColor);
  const activeLabel = useMapStore((state) => state.activeLabel);
  const colorLabelLocked = useMapStore((state) => state.colorLabelLocked);
  const markerFilters = useMapStore((state) => state.markerFilters);
  const setActiveColor = useMapStore((state) => state.setActiveColor);
  const setActiveLabel = useMapStore((state) => state.setActiveLabel);
  const setColorLabelLocked = useMapStore((state) => state.setColorLabelLocked);
  const setMarkerFilter = useMapStore((state) => state.setMarkerFilter);

  // Map store state for layer controls (wired to mapStore)
  // Requirement 1.1, 2.1, 3.1, 4.1, 5.1
  const basemap = useMapStore((state) => state.basemap);
  const setBasemap = useMapStore((state) => state.setBasemap);
  const showProvinceBorders = useMapStore((state) => state.showProvinceBorders);
  const setShowProvinceBorders = useMapStore((state) => state.setShowProvinceBorders);
  const populationOpacity = useMapStore((state) => state.populationOpacity);
  const setPopulationOpacity = useMapStore((state) => state.setPopulationOpacity);
  const markerLimit = useMapStore((state) => state.markerLimit);
  const setMarkerLimit = useMapStore((state) => state.setMarkerLimit);
  const clusterMarkers = useMapStore((state) => state.clusterMarkers);
  const setClusterMarkers = useMapStore((state) => state.setClusterMarkers);

  // Timeline store state for epic filters (wired to timelineStore)
  // Requirement 7.1, 7.2, 7.5
  const epicFilters = useTimelineStore((state) => state.epicFilters);
  const setEpicFilter = useTimelineStore((state) => state.setEpicFilter);
  const setAllEpicFilters = useTimelineStore((state) => state.setAllEpicFilters);

  // Handlers for LayerToggle
  const handleColorChange = useCallback(
    (dimension: AreaColorDimension) => {
      setActiveColor(dimension);
    },
    [setActiveColor]
  );

  const handleLabelChange = useCallback(
    (dimension: AreaColorDimension) => {
      setActiveLabel(dimension);
    },
    [setActiveLabel]
  );

  const handleLockChange = useCallback(
    (locked: boolean) => {
      setColorLabelLocked(locked);
    },
    [setColorLabelLocked]
  );

  // Handler for marker filter changes
  const handleMarkerFilterChange = useCallback(
    (type: string, enabled: boolean) => {
      // Pass the type directly - mapStore now accepts any string type
      setMarkerFilter(type as 'battle' | 'city' | 'capital' | 'person' | 'event' | 'other', enabled);
    },
    [setMarkerFilter]
  );

  const containerClass = [styles['layersContent'], className].filter(Boolean).join(' ');

  return (
    <div className={containerClass} data-testid={testId}>
      {/* General Section - Requirement 7.5 */}
      <CollapsibleSection
        title="General"
        expanded={generalExpanded}
        onToggle={() => setGeneralExpanded(!generalExpanded)}
        testId="general-section"
      >
        {/* Area Subsection - Requirement 7.6 */}
        <CollapsibleSection
          title="Area"
          expanded={areaExpanded}
          onToggle={() => setAreaExpanded(!areaExpanded)}
          testId="area-section"
        >
          <LayerToggle
            activeColor={activeColor}
            activeLabel={activeLabel}
            locked={colorLabelLocked}
            onColorChange={handleColorChange}
            onLabelChange={handleLabelChange}
            onLockChange={handleLockChange}
          />
        </CollapsibleSection>

        {/* Markers Subsection - Requirement 7.7, 7.8, 7.9, 7.10, 7.11 */}
        <CollapsibleSection
          title="Markers"
          expanded={markersExpanded}
          onToggle={() => setMarkersExpanded(!markersExpanded)}
          testId="markers-section"
        >
          <MarkerFilters
            filters={markerFilters}
            onFilterChange={handleMarkerFilterChange}
            markerLimit={markerLimit}
            onMarkerLimitChange={setMarkerLimit}
            clusterMarkers={clusterMarkers}
            onClusterChange={setClusterMarkers}
          />
        </CollapsibleSection>
      </CollapsibleSection>

      {/* Epics Section - Requirement 7.1, 7.2, 7.5 */}
      <CollapsibleSection
        title="Epics"
        expanded={epicsExpanded}
        onToggle={() => setEpicsExpanded(!epicsExpanded)}
        testId="epics-section"
      >
        <EpicFilters
          filters={epicFilters}
          onFilterChange={setEpicFilter}
          onSetAllFilters={setAllEpicFilters}
        />
      </CollapsibleSection>

      {/* Advanced Section - Requirement 7.15, 7.16, 7.17 */}
      <CollapsibleSection
        title="Advanced"
        expanded={advancedExpanded}
        onToggle={() => setAdvancedExpanded(!advancedExpanded)}
        testId="advanced-section"
      >
        <AdvancedSettings
          basemap={basemap}
          onBasemapChange={setBasemap}
          showProvinceBorders={showProvinceBorders}
          onShowProvinceBordersChange={setShowProvinceBorders}
          populationOpacity={populationOpacity}
          onPopulationOpacityChange={setPopulationOpacity}
        />
      </CollapsibleSection>
    </div>
  );
};

export default LayersContent;
