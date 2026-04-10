/**
 * ProvinceDrawerContent Component
 *
 * Displays detailed province information in the right drawer panel.
 * Shows province name as header, entity details with color chips,
 * and embeds a Wikipedia article iframe.
 *
 * Requirements: 2.4, 2.5, 2.6
 */

import type React from 'react';
import styles from './ProvinceDrawerContent.module.css';
import { formatPopulation } from '@/utils/formatUtils';
import { ArticleIframe } from '@/components/content/ArticleIframe/ArticleIframe';
// ProvinceTimeline temporarily removed — province ID mismatch needs resolution first
// import { ProvinceTimeline } from '@/components/content/ProvinceTimeline';
import type { EntityMetadata, MetadataEntry, ProvinceData } from '@/api/types';
import { getEntityMetadata, getReligionGeneralMetadata } from './ProvinceDrawerContent.utils';

/**
 * ProvinceDrawerContent component props
 */
export interface ProvinceDrawerContentProps {
  /** Province ID (name) */
  provinceId: string;
  /** Province data tuple: [ruler, culture, religion, capital, population] */
  provinceData: ProvinceData;
  /** Entity metadata for colors and names */
  metadata: EntityMetadata | null;
  /** Optional Wikipedia URL for the province */
  wikiUrl?: string;
}

/**
 * Entity row configuration for rendering
 */
interface EntityRowConfig {
  /** Index in provinceData tuple */
  dataIndex: number;
  /** Metadata key for looking up entity info */
  metadataKey: keyof EntityMetadata;
  /** Display label for the entity type */
  label: string;
  /** Avatar icon for the entity type */
  icon: string;
}

/**
 * Entity row configurations for the drawer content
 * Defines the order and properties of each entity row
 */
const ENTITY_ROWS: EntityRowConfig[] = [
  {
    dataIndex: 0,
    metadataKey: 'ruler',
    label: 'Ruler',
    icon: '👑',
  },
  {
    dataIndex: 1,
    metadataKey: 'culture',
    label: 'Culture',
    icon: '🎭',
  },
  {
    dataIndex: 2,
    metadataKey: 'religion',
    label: 'Religion',
    icon: '⛪',
  },
];

/**
 * EntityRow Component
 *
 * Renders a single entity row with color chip, label, name, and icon
 */
interface EntityRowProps {
  /** Display label for the entity type */
  label: string;
  /** Entity metadata entry */
  entry: MetadataEntry;
  /** Avatar icon for the entity type */
  icon: string;
}

const EntityRow: React.FC<EntityRowProps> = ({ label, entry, icon }) => {
  return (
    <div className={styles['entityRow']} data-testid="entity-row">
      <div
        className={styles['colorChip']}
        style={{ backgroundColor: entry.color }}
        data-testid="color-chip"
        aria-hidden="true"
      />
      <span className={styles['entityLabel']} data-testid="entity-label">
        {label}:
      </span>
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
 * ProvinceDrawerContent Component
 *
 * Displays detailed province information in the right drawer panel.
 *
 * Visual structure:
 * ```
 * ┌──────────────────────────────────────────┐
 * │ Italia                                   │  ← Province name header
 * ├──────────────────────────────────────────┤
 * │ [■] Ruler: Roman Empire             👑  │  ← Ruler row with color chip
 * │ [■] Culture: Latin                  🎭  │  ← Culture row with color chip
 * │ [■] Religion: Roman Paganism        ⛪  │  ← Religion row with color chip
 * │ [■] Religion Gen.: Paganism         ☯️  │  ← Religion General row
 * │ Population: 1.2M                        │  ← Population display
 * ├──────────────────────────────────────────┤
 * │                                          │
 * │      Wikipedia Iframe                    │
 * │      (scrollable area)                   │
 * │                                          │
 * └──────────────────────────────────────────┘
 * ```
 *
 * Requirements:
 * - 2.4: Province drawer displays province name as header
 * - 2.5: Province drawer displays entity details (ruler, culture, religion) with color chips
 * - 2.6: Province drawer embeds Wikipedia article iframe
 *
 * @param props - ProvinceDrawerContent component props
 * @returns ProvinceDrawerContent React component
 */
export const ProvinceDrawerContent: React.FC<ProvinceDrawerContentProps> = ({
  provinceId,
  provinceData,
  metadata,
  wikiUrl,
}) => {
  // Extract data from provinceData tuple
  // ProvinceData = [ruler, culture, religion, capital, population]
  const [, , religionId, , population] = provinceData;

  // Format population for display
  const formattedPopulation = formatPopulation(population);

  // Get religionGeneral metadata (derived from religion's parent)
  const religionGeneralEntry = getReligionGeneralMetadata(religionId, metadata);

  return (
    <div className={styles['container']} data-testid="province-drawer-content">
      {/* Entity details section - Requirement 2.5 */}
      <section
        className={styles['entitySection']}
        data-testid="entity-section"
        aria-label="Province entity details"
      >
        {/* Render standard entity rows (ruler, culture, religion) */}
        {ENTITY_ROWS.map((config) => {
          const entityId = provinceData[config.dataIndex] as string;
          const entry = getEntityMetadata(entityId, config.metadataKey, metadata);

          return (
            <EntityRow
              key={config.metadataKey}
              label={config.label}
              entry={entry}
              icon={config.icon}
            />
          );
        })}

        {/* Religion General row (derived from religion's parent) */}
        <EntityRow
          label="Religion Gen."
          entry={religionGeneralEntry}
          icon="☯️"
        />

        {/* Population display */}
        <div className={styles['populationRow']} data-testid="population-row">
          <span className={styles['populationLabel']}>Population:</span>
          <span className={styles['populationValue']} data-testid="population-value">
            {formattedPopulation}
          </span>
        </div>
      </section>

      {/* Province Timeline — temporarily removed pending province ID mismatch fix
       * TODO: Re-enable when mapStore.selectProvince returns correct province keys
       * Component: ProvinceTimeline (src/components/content/ProvinceTimeline/)
       * Stories: US-3.4, US-3.5
       */}

      {/* Wikipedia iframe section - Requirement 2.6 */}
      <section
        className={styles['articleSection']}
        data-testid="article-section"
        aria-label="Wikipedia article"
      >
        <ArticleIframe
          url={wikiUrl}
          title={`Wikipedia article for ${provinceId}`}
        />
      </section>
    </div>
  );
};

export default ProvinceDrawerContent;
