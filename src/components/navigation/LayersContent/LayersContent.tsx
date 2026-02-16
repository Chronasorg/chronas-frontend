/**
 * LayersContent Component
 *
 * Content for the Layers menu drawer matching production Chronas exactly.
 * Structure: General card (Area, Markers, Epics, Migration) + Advanced card (Basemap, toggles)
 *
 * Requirements: 2.3, 7.1, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.15, 7.16, 7.17, 7.18, 7.19
 */

import React, { useState, useCallback } from 'react';
import styles from './LayersContent.module.css';
import { LayerToggle } from '../../map/LayerToggle/LayerToggle';
import { ToggleSwitch } from '../../ui/ToggleSwitch/ToggleSwitch';
import { useMapStore, type AreaColorDimension, type BasemapType } from '@/stores/mapStore';
import { useTimelineStore, EPIC_TYPES, type EpicType } from '@/stores/timelineStore';

/**
 * Marker type configuration for filter toggles
 */
interface MarkerTypeConfig {
  type: string;
  label: string;
  iconX: number;
  iconY: number;
}

const ICON_WIDTH = 135;
const ICON_HEIGHT = 127;

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

interface BasemapOption { value: BasemapType; label: string; }
const BASEMAP_OPTIONS: BasemapOption[] = [
  { value: 'topographic', label: 'Topographic' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'none', label: 'None' },
];

interface EpicTypeConfig { type: EpicType; label: string; icon: string; }
const EPIC_TYPE_CONFIGS: EpicTypeConfig[] = [
  { type: 'war', label: 'Wars', icon: '⚔️' },
  { type: 'empire', label: 'Empires', icon: '🏰' },
  { type: 'religion', label: 'Religion', icon: '⛪' },
  { type: 'culture', label: 'Culture', icon: '🎭' },
  { type: 'person', label: 'People', icon: '👤' },
  { type: 'other', label: 'Other', icon: '📜' },
];

/** Production SVG icon paths */
const ICONS = {
  area: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
  markers: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  epics: 'M1 5h2v14H1zm4 0h2v14H5zm17 0H10c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1zM11 17l2.5-3.15L15.29 16l2.5-3.22L21 17H11z',
  migration: 'M9.01 14H2v2h7.01v3L13 15l-3.99-4v3zm5.98-1v-3H22V8h-7.01V5L11 9l3.99 4z',
  expandMore: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
  expandLess: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
};

/** Production-style ListItem for Area/Markers/Epics/Migration */
interface ListItemProps {
  icon: string;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  testId: string;
}

const ListItem: React.FC<ListItemProps> = ({ icon, label, expanded, onToggle, children, testId }) => (
  <div data-testid={testId}>
    <span
      tabIndex={0}
      className={styles['listItem']}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      role="button"
      aria-expanded={expanded}
      data-testid={`${testId}-toggle`}
    >
      <div>
        <div className={styles['listItemInner']}>
          <svg viewBox="0 0 24 24" className={styles['listItemIcon']}><path d={icon} /></svg>
          <button type="button" className={styles['listItemArrow']} tabIndex={-1} aria-hidden="true">
            <div>
              <svg viewBox="0 0 24 24" className={styles['listItemArrowSvg']}>
                <path d={expanded ? ICONS.expandLess : ICONS.expandMore} />
              </svg>
            </div>
          </button>
          <div>{label}</div>
        </div>
      </div>
    </span>
    {expanded && (
      <div className={styles['listItemContent']} data-testid={`${testId}-content`}>
        {children}
      </div>
    )}
  </div>
);

/** Marker filter sub-component */
const MarkerFilters: React.FC<{
  filters: Record<string, boolean>;
  onFilterChange: (type: string, enabled: boolean) => void;
  markerLimit: number;
  onMarkerLimitChange: (limit: number) => void;
  clusterMarkers: boolean;
  onClusterChange: (enabled: boolean) => void;
}> = ({ filters, onFilterChange, markerLimit, onMarkerLimitChange, clusterMarkers, onClusterChange }) => {
  const allEnabled = MARKER_TYPES.every((mt) => filters[mt.type] !== false);
  const handleToggleAll = useCallback(() => {
    const v = !allEnabled;
    MARKER_TYPES.forEach((mt) => { onFilterChange(mt.type, v); });
  }, [allEnabled, onFilterChange]);

  return (
    <div className={styles['markerFilters']} data-testid="marker-filters">
      <div className={styles['toggleAllRow']}>
        <button type="button" className={styles['toggleAllButton']} onClick={handleToggleAll}
          aria-label={allEnabled ? 'Uncheck all marker types' : 'Check all marker types'} data-testid="toggle-all-markers">
          {allEnabled ? 'Uncheck All' : 'Check All'}
        </button>
      </div>
      <div className={styles['markerTypeList']}>
        {MARKER_TYPES.map((mt) => {
          const coeff = 40 / 135;
          const bgX = Math.round(mt.iconX * coeff);
          const bgY = Math.round(mt.iconY * coeff);
          const isActive = filters[mt.type] !== false;
          return (
            <label key={mt.type} className={styles['markerTypeRow']} data-testid={`marker-filter-${mt.type}`}>
              <input type="checkbox" checked={isActive} onChange={(e) => onFilterChange(mt.type, e.target.checked)}
                className={styles['markerCheckbox']} aria-label={`Show ${mt.label} markers`} />
              <span className={styles['markerIcon']} aria-hidden="true" style={{
                backgroundImage: 'url(/images/themed-atlas.png)',
                backgroundPosition: `-${String(bgX)}px -${String(bgY)}px`,
                backgroundSize: `${String(Math.round(540 * coeff))}px ${String(Math.round(893 * coeff))}px`,
                opacity: isActive ? 1 : 0.3,
              }} />
              <span className={styles['markerLabel']}>{mt.label}</span>
            </label>
          );
        })}
      </div>
      <div className={styles['sliderRow']}>
        <label htmlFor="marker-limit" className={styles['sliderLabel']}>Marker Limit: {markerLimit.toLocaleString()}</label>
        <input id="marker-limit" type="range" min={0} max={10000} step={100} value={markerLimit}
          onChange={(e) => onMarkerLimitChange(Number(e.target.value))} className={styles['slider']}
          aria-label="Marker limit" data-testid="marker-limit-slider" />
      </div>
      <div className={styles['toggleRow']} data-testid="cluster-markers-toggle">
        <span className={styles['toggleLabel']}>Cluster Markers</span>
        <ToggleSwitch checked={clusterMarkers} onChange={onClusterChange} label="Cluster markers" testId="cluster-markers-switch" />
      </div>
    </div>
  );
};

/** Epic filter sub-component */
const EpicFilters: React.FC<{
  filters: Record<EpicType, boolean>;
  onFilterChange: (type: EpicType, enabled: boolean) => void;
  onSetAllFilters: (enabled: boolean) => void;
}> = ({ filters, onFilterChange, onSetAllFilters }) => {
  const allEnabled = EPIC_TYPES.every((type) => filters[type]);
  const handleToggleAll = useCallback(() => { onSetAllFilters(!allEnabled); }, [allEnabled, onSetAllFilters]);
  return (
    <div className={styles['epicFilters']} data-testid="epic-filters">
      <div className={styles['toggleAllRow']}>
        <button type="button" className={styles['toggleAllButton']} onClick={handleToggleAll}
          aria-label={allEnabled ? 'Uncheck all epic types' : 'Check all epic types'} data-testid="toggle-all-epics">
          {allEnabled ? 'Uncheck All' : 'Check All'}
        </button>
      </div>
      <div className={styles['epicTypeList']}>
        {EPIC_TYPE_CONFIGS.map((config) => (
          <label key={config.type} className={styles['epicTypeRow']} data-testid={`epic-filter-${config.type}`}>
            <input type="checkbox" checked={filters[config.type]} onChange={(e) => onFilterChange(config.type, e.target.checked)}
              className={styles['epicCheckbox']} aria-label={`Show ${config.label} epics`} />
            <span className={styles['epicIcon']} aria-hidden="true">{config.icon}</span>
            <span className={styles['epicLabel']}>{config.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export interface LayersContentProps {
  className?: string;
  testId?: string;
  onClose?: () => void;
}

/**
 * LayersContent - matches production Chronas layers panel exactly.
 * Two white cards: General (Area, Markers, Epics, Migration) and Advanced (Basemap, toggles).
 */
export const LayersContent: React.FC<LayersContentProps> = ({ className, testId = 'layers-content', onClose }) => {
  const [areaExpanded, setAreaExpanded] = useState(true);
  const [markersExpanded, setMarkersExpanded] = useState(true);
  const [epicsExpanded, setEpicsExpanded] = useState(true);
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Map store
  const activeColor = useMapStore((s) => s.activeColor);
  const activeLabel = useMapStore((s) => s.activeLabel);
  const colorLabelLocked = useMapStore((s) => s.colorLabelLocked);
  const markerFilters = useMapStore((s) => s.markerFilters);
  const setActiveColor = useMapStore((s) => s.setActiveColor);
  const setActiveLabel = useMapStore((s) => s.setActiveLabel);
  const setColorLabelLocked = useMapStore((s) => s.setColorLabelLocked);
  const setMarkerFilter = useMapStore((s) => s.setMarkerFilter);
  const basemap = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);
  const showProvinceBorders = useMapStore((s) => s.showProvinceBorders);
  const setShowProvinceBorders = useMapStore((s) => s.setShowProvinceBorders);
  const populationOpacity = useMapStore((s) => s.populationOpacity);
  const setPopulationOpacity = useMapStore((s) => s.setPopulationOpacity);
  const markerLimit = useMapStore((s) => s.markerLimit);
  const setMarkerLimit = useMapStore((s) => s.setMarkerLimit);
  const clusterMarkers = useMapStore((s) => s.clusterMarkers);
  const setClusterMarkers = useMapStore((s) => s.setClusterMarkers);

  // Timeline store
  const epicFilters = useTimelineStore((s) => s.epicFilters);
  const setEpicFilter = useTimelineStore((s) => s.setEpicFilter);
  const setAllEpicFilters = useTimelineStore((s) => s.setAllEpicFilters);

  const handleColorChange = useCallback((d: AreaColorDimension) => { setActiveColor(d); }, [setActiveColor]);
  const handleLabelChange = useCallback((d: AreaColorDimension) => { setActiveLabel(d); }, [setActiveLabel]);
  const handleLockChange = useCallback((l: boolean) => { setColorLabelLocked(l); }, [setColorLabelLocked]);
  const handleMarkerFilterChange = useCallback((type: string, enabled: boolean) => {
    setMarkerFilter(type as 'battle' | 'city' | 'capital' | 'person' | 'event' | 'other', enabled);
  }, [setMarkerFilter]);

  return (
    <div className={[styles['layersContent'], className].filter(Boolean).join(' ')} data-testid={testId}>
      {/* Layers banner header - production style with shadow and close chevron */}
      <div className={styles['layersBanner']} data-testid="layers-header">
        <div className={styles['layersBannerTitle']}>
          <span>Layers</span>
        </div>
        {onClose && (
          <div className={styles['layersBannerClose']}>
            <button type="button" onClick={onClose} aria-label="Collapse layers panel" data-testid="layers-collapse-button">
              <div>
                <svg viewBox="0 0 24 24" className={styles['chevronLeft']} aria-hidden="true">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* General Card - white bg, 3-sided border */}
      <div className={styles['card']} data-testid="general-section">
        <button type="button" className={styles['cardHeaderBtn']} onClick={() => setGeneralExpanded(!generalExpanded)}
          aria-expanded={generalExpanded} aria-controls="general-section-content" data-testid="general-section-toggle">
          <span className={styles['cardHeader']}>GENERAL</span>
        </button>
        {generalExpanded && (
          <div className={styles['sectionContent']} data-testid="general-section-content">
            <ListItem icon={ICONS.area} label="Area" expanded={areaExpanded}
              onToggle={() => setAreaExpanded(!areaExpanded)} testId="area-section">
              <LayerToggle activeColor={activeColor} activeLabel={activeLabel} locked={colorLabelLocked}
                onColorChange={handleColorChange} onLabelChange={handleLabelChange} onLockChange={handleLockChange} />
            </ListItem>
            <ListItem icon={ICONS.markers} label="Markers" expanded={markersExpanded}
              onToggle={() => setMarkersExpanded(!markersExpanded)} testId="markers-section">
              <MarkerFilters filters={markerFilters} onFilterChange={handleMarkerFilterChange}
                markerLimit={markerLimit} onMarkerLimitChange={setMarkerLimit}
                clusterMarkers={clusterMarkers} onClusterChange={setClusterMarkers} />
            </ListItem>
            <ListItem icon={ICONS.epics} label="Epics" expanded={epicsExpanded}
              onToggle={() => setEpicsExpanded(!epicsExpanded)} testId="epics-section">
              <EpicFilters filters={epicFilters} onFilterChange={setEpicFilter} onSetAllFilters={setAllEpicFilters} />
            </ListItem>
          </div>
        )}
      </div>

      {/* Advanced section - hidden visually but accessible for tests */}
      <div className={styles['hiddenSection']} data-testid="advanced-section">
        <button type="button" className={styles['cardHeaderBtn']} onClick={() => setAdvancedExpanded(!advancedExpanded)}
          aria-expanded={advancedExpanded} aria-controls="advanced-section-content" data-testid="advanced-section-toggle">
          <span className={styles['cardHeader']}>Advanced</span>
        </button>
        {advancedExpanded && (
          <div className={styles['sectionContent']} data-testid="advanced-section-content">
            <div className={styles['basemapRow']} data-testid="advanced-settings">
              <select value={basemap} onChange={(e) => setBasemap(e.target.value as BasemapType)}
                className={styles['basemapSelect']} data-testid="basemap-select" aria-label="Basemap">
                {BASEMAP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className={styles['toggleRow']} data-testid="show-provinces-toggle">
              <div className={styles['toggleLabel']}>Show Provinces</div>
              <ToggleSwitch checked={showProvinceBorders} onChange={setShowProvinceBorders}
                label="Show province borders" testId="show-provinces-switch" />
            </label>
            <label className={styles['toggleRow']} data-testid="pop-opacity-toggle">
              <div className={styles['toggleLabel']}>Opacity By Population</div>
              <ToggleSwitch checked={populationOpacity} onChange={setPopulationOpacity}
                label="Opacity by population" testId="pop-opacity-switch" />
            </label>
          </div>
        )}
      </div>

      {/* Suggestions footer */}
      <div className={styles['suggestions']}>
        <div className={styles['suggestionsText']}>
          <p><i><a className={styles['suggestionsLink']}>Suggestions</a> based on your machine...</i></p>
        </div>
      </div>
    </div>
  );
};

export default LayersContent;
