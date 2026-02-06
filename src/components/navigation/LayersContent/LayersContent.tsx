/**
 * LayersContent Component
 *
 * Content component for the Layers menu drawer. Contains:
 * - General section with Area (LayerToggle) and Markers subsections
 * - Advanced section with basemap, province borders, and opacity settings
 *
 * Requirements: 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.15, 7.16, 7.17, 7.18, 7.19
 */

import React, { useState, useCallback } from 'react';
import styles from './LayersContent.module.css';
import { LayerToggle } from '../../map/LayerToggle/LayerToggle';
import { useMapStore, type AreaColorDimension } from '@/stores/mapStore';

/**
 * Marker type configuration for filter toggles
 */
interface MarkerTypeConfig {
  /** Marker type key */
  type: string;
  /** Display label */
  label: string;
  /** Icon emoji or character */
  icon: string;
}

/**
 * Marker types with their display configuration
 * Requirement 7.8: Add marker type toggles with themed atlas icons
 */
const MARKER_TYPES: MarkerTypeConfig[] = [
  { type: 'battle', label: 'Battles', icon: '⚔️' },
  { type: 'city', label: 'Cities', icon: '🏛️' },
  { type: 'capital', label: 'Capitals', icon: '👑' },
  { type: 'person', label: 'People', icon: '👤' },
  { type: 'event', label: 'Events', icon: '📜' },
  { type: 'other', label: 'Other', icon: '📍' },
];

/**
 * Basemap options
 * Requirement 7.15: Add basemap selection dropdown
 */
type BasemapType = 'topographic' | 'watercolor' | 'none';

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
        {MARKER_TYPES.map((mt) => (
          <label
            key={mt.type}
            className={styles['markerTypeRow']}
            data-testid={`marker-filter-${mt.type}`}
          >
            <input
              type="checkbox"
              checked={filters[mt.type] !== false}
              onChange={(e) => onFilterChange(mt.type, e.target.checked)}
              className={styles['markerCheckbox']}
              aria-label={`Show ${mt.label} markers`}
            />
            <span className={styles['markerIcon']} aria-hidden="true">
              {mt.icon}
            </span>
            <span className={styles['markerLabel']}>{mt.label}</span>
          </label>
        ))}
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
 * Advanced settings component
 * Requirement 7.15, 7.16, 7.17
 */
interface AdvancedSettingsProps {
  /** Current basemap selection */
  basemap: BasemapType;
  /** Callback when basemap changes */
  onBasemapChange: (basemap: BasemapType) => void;
  /** Whether province borders are shown */
  showProvinces: boolean;
  /** Callback when show provinces changes */
  onShowProvincesChange: (show: boolean) => void;
  /** Whether opacity by population is enabled */
  popOpacity: boolean;
  /** Callback when pop opacity changes */
  onPopOpacityChange: (enabled: boolean) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  basemap,
  onBasemapChange,
  showProvinces,
  onShowProvincesChange,
  popOpacity,
  onPopOpacityChange,
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
          checked={showProvinces}
          onChange={(e) => onShowProvincesChange(e.target.checked)}
          className={styles['toggleCheckbox']}
          aria-label="Show province borders"
        />
        <span className={styles['toggleLabel']}>Show Provinces</span>
      </label>

      {/* Opacity by Population toggle - Requirement 7.17 */}
      <label className={styles['toggleRow']} data-testid="pop-opacity-toggle">
        <input
          type="checkbox"
          checked={popOpacity}
          onChange={(e) => onPopOpacityChange(e.target.checked)}
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

  // Local state for settings not yet in mapStore
  // These will be wired up when the corresponding mapStore actions are added
  const [markerLimit, setMarkerLimit] = useState(5000);
  const [clusterMarkers, setClusterMarkers] = useState(false);
  const [basemap, setBasemap] = useState<BasemapType>('topographic');
  const [showProvinces, setShowProvinces] = useState(true);
  const [popOpacity, setPopOpacity] = useState(false);

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
      // Cast to MarkerType - the store will validate
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
          showProvinces={showProvinces}
          onShowProvincesChange={setShowProvinces}
          popOpacity={popOpacity}
          onPopOpacityChange={setPopOpacity}
        />
      </CollapsibleSection>
    </div>
  );
};

export default LayersContent;
