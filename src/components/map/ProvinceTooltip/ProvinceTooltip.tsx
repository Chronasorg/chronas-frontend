/**
 * ProvinceTooltip Component
 *
 * Displays detailed information about a province when hovering over it on the map.
 * Shows entity information (ruler, culture, religion, religionGeneral) with color chips
 * and avatar icons, plus province name and formatted population.
 *
 * Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9
 */

import type React from 'react';
import styles from './ProvinceTooltip.module.css';
import { formatPopulation } from '@/utils/formatUtils';
import type { EntityMetadata, MetadataEntry } from '@/api/types';
import type { AreaColorDimension } from '@/stores/mapStore';
import type { Theme } from '@/stores/uiStore';
import { getEntityMetadata, type ProvinceFeatureProperties } from './ProvinceTooltip.utils';

/**
 * ProvinceTooltip component props
 */
export interface ProvinceTooltipProps {
  /** Province feature properties from GeoJSON */
  feature: ProvinceFeatureProperties;
  /** Current metadata for entity colors and names */
  metadata: EntityMetadata;
  /** Currently active color dimension */
  activeColor: AreaColorDimension;
  /** Current theme for styling */
  theme: Theme;
  /** Position for tooltip placement */
  position: { x: number; y: number };
}

/**
 * Entity row configuration for rendering
 */
interface EntityRowConfig {
  /** Dimension key for this entity type */
  dimension: AreaColorDimension;
  /** Property key in feature properties */
  featureKey: keyof ProvinceFeatureProperties;
  /** Metadata key for looking up entity info */
  metadataKey: keyof EntityMetadata;
  /** Display label for the entity type */
  label: string;
  /** Avatar icon for the entity type */
  icon: string;
}

/**
 * Entity row configurations for the tooltip
 * Defines the order and properties of each entity row
 */
const ENTITY_ROWS: EntityRowConfig[] = [
  {
    dimension: 'ruler',
    featureKey: 'r',
    metadataKey: 'ruler',
    label: 'Ruler',
    icon: '👑',
  },
  {
    dimension: 'culture',
    featureKey: 'c',
    metadataKey: 'culture',
    label: 'Culture',
    icon: '🎭',
  },
  {
    dimension: 'religion',
    featureKey: 'e',
    metadataKey: 'religion',
    label: 'Religion',
    icon: '⛪',
  },
  {
    dimension: 'religionGeneral',
    featureKey: 'g',
    metadataKey: 'religionGeneral',
    label: 'Religion General',
    icon: '☯️',
  },
];

/**
 * EntityRow Component
 *
 * Renders a single entity row in the tooltip with color chip, name, and icon
 */
interface EntityRowProps {
  /** Entity metadata entry */
  entry: MetadataEntry;
  /** Avatar icon for the entity type */
  icon: string;
  /** Whether this row is the active dimension */
  isActive: boolean;
}

const EntityRow: React.FC<EntityRowProps> = ({ entry, icon, isActive }) => {
  const rowClasses = [
    styles['entityRow'],
    isActive ? styles['active'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rowClasses} data-testid="entity-row">
      <div
        className={styles['colorChip']}
        style={{ backgroundColor: entry.color }}
        data-testid="color-chip"
        aria-hidden="true"
      />
      <span className={styles['entityName']} data-testid="entity-name">
        {entry.name}
      </span>
      <span className={styles['entityIcon']} data-testid="entity-icon" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
};

/**
 * ProvinceTooltip Component
 *
 * Displays detailed information about a province when hovering over it on the map.
 *
 * Visual structure:
 * ```
 * ┌──────────────────────────────────────────┐
 * │ [■] Roman Empire                    👑   │  ← Ruler row with color chip & icon
 * │ [■] Latin                           🎭   │  ← Culture row with color chip & icon
 * │ [■] Roman Paganism                  ⛪   │  ← Religion row with color chip & icon
 * │ [■] Paganism                        ☯️   │  ← Religion General row
 * │ ─────────────────────────────────────────│
 * │ Italia                           1.2M   │  ← Province name & population
 * └──────────────────────────────────────────┘
 * ```
 *
 * Requirements:
 * - 1.2: Show ruler name with Color_Chip and Avatar_Icon
 * - 1.3: Show culture name with Color_Chip and Avatar_Icon
 * - 1.4: Show religion name with Color_Chip and Avatar_Icon
 * - 1.5: Show religionGeneral name with Color_Chip and Avatar_Icon
 * - 1.6: Show province name and population formatted as M/k
 * - 1.8: Highlight active dimension row
 * - 1.9: Display "Unknown" with fallback gray Color_Chip for missing metadata
 *
 * @param props - ProvinceTooltip component props
 * @returns ProvinceTooltip React component
 */
export const ProvinceTooltip: React.FC<ProvinceTooltipProps> = ({
  feature,
  metadata,
  activeColor,
  theme,
  position,
}) => {
  // Format population for display
  // Requirement 1.6: Show population formatted as M/k
  const formattedPopulation = formatPopulation(feature.p);

  // Build container class names with theme
  const containerClasses = [
    styles['provinceTooltip'],
    styles[`theme-${theme}`],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClasses}
      style={{
        left: position.x,
        top: position.y,
      }}
      data-testid="province-tooltip"
      role="tooltip"
      aria-label={`Province information for ${feature.id}`}
    >
      {/* Entity rows section */}
      <div className={styles['entitySection']} data-testid="entity-section">
        {ENTITY_ROWS.map((config) => {
          const entityId = feature[config.featureKey] as string;
          const entry = getEntityMetadata(entityId, config.metadataKey, metadata);
          const isActive = activeColor === config.dimension;

          return (
            <EntityRow
              key={config.dimension}
              entry={entry}
              icon={config.icon}
              isActive={isActive}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div className={styles['divider']} aria-hidden="true" />

      {/* Province info section */}
      <div className={styles['provinceSection']} data-testid="province-section">
        <span className={styles['provinceName']} data-testid="province-name">
          {feature.id}
        </span>
        <span className={styles['population']} data-testid="population">
          {formattedPopulation}
        </span>
      </div>
    </div>
  );
};

export default ProvinceTooltip;
