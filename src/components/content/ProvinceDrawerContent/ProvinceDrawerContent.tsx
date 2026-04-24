/**
 * ProvinceDrawerContent Component
 *
 * Displays detailed province information in the right drawer with
 * tabbed navigation (Issue #16):
 *   Summary | Ruler | Culture | Religion | Wikipedia
 *
 * - Summary: structured Chronas metadata (ruler, culture, religion, religionGeneral, population)
 * - Ruler / Culture / Religion: shows the entity's color + name as a header, then embeds that
 *   entity's Wikipedia article (so users can read about the empire itself, not just the province)
 * - Wikipedia: the province's own Wikipedia article
 */

import type React from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ProvinceDrawerContent.module.css';
import { formatPopulation } from '@/utils/formatUtils';
import { ArticleIframe } from '@/components/content/ArticleIframe/ArticleIframe';
import type { EntityMetadata, MetadataEntry, ProvinceData } from '@/api/types';
import {
  buildEntityWikiUrl,
  getEntityMetadata,
  getReligionGeneralMetadata,
} from './ProvinceDrawerContent.utils';

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

type TabId = 'summary' | 'ruler' | 'culture' | 'religion';

interface EntityTabConfig {
  id: Extract<TabId, 'ruler' | 'culture' | 'religion'>;
  dataIndex: number;
  metadataKey: keyof EntityMetadata;
  labelKey: string;
  labelFallback: string;
  icon: string;
}

const ENTITY_TABS: EntityTabConfig[] = [
  { id: 'ruler', dataIndex: 0, metadataKey: 'ruler', labelKey: 'map.ruler', labelFallback: 'Ruler', icon: '👑' },
  { id: 'culture', dataIndex: 1, metadataKey: 'culture', labelKey: 'map.culture', labelFallback: 'Culture', icon: '🎭' },
  { id: 'religion', dataIndex: 2, metadataKey: 'religion', labelKey: 'map.religion', labelFallback: 'Religion', icon: '⛪' },
];

interface EntityRowProps {
  label: string;
  entry: MetadataEntry;
  icon: string;
}

const EntityRow: React.FC<EntityRowProps> = ({ label, entry, icon }) => (
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

export const ProvinceDrawerContent: React.FC<ProvinceDrawerContentProps> = ({
  provinceId,
  provinceData,
  metadata,
  wikiUrl,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  const [, , religionId, , population] = provinceData;
  const formattedPopulation = formatPopulation(population);
  const religionGeneralEntry = getReligionGeneralMetadata(religionId, metadata);

  // Precompute entity entries + their wiki urls so the tab panels render cleanly
  const entityEntries = useMemo(() => {
    return ENTITY_TABS.map((cfg) => {
      const entityId = provinceData[cfg.dataIndex] as string;
      const entry = getEntityMetadata(entityId, cfg.metadataKey, metadata);
      return { cfg, entityId, entry, wiki: buildEntityWikiUrl(entry, entityId) };
    });
  }, [provinceData, metadata]);

  const tabLabel = (id: TabId): string => {
    switch (id) {
      case 'summary':
        return t('drawer.tabs.summary', 'Summary');
      case 'ruler':
        return t('map.ruler', 'Ruler');
      case 'culture':
        return t('map.culture', 'Culture');
      case 'religion':
        return t('map.religion', 'Religion');
    }
  };

  const TAB_ORDER: TabId[] = ['summary', 'ruler', 'culture', 'religion'];

  const renderTabPanel = (): React.ReactNode => {
    if (activeTab === 'summary') {
      return (
        <>
          <section
            className={styles['entitySection']}
            data-testid="entity-section"
            aria-label="Province entity details"
          >
            {entityEntries.map(({ cfg, entry }) => (
              <EntityRow
                key={cfg.metadataKey}
                label={t(cfg.labelKey, cfg.labelFallback)}
                entry={entry}
                icon={cfg.icon}
              />
            ))}
            <EntityRow
              label={t('map.religionGeneral', 'Religion Gen.')}
              entry={religionGeneralEntry}
              icon="☯️"
            />
            <div className={styles['populationRow']} data-testid="population-row">
              <span className={styles['populationLabel']}>
                {t('map.population', 'Population')}:
              </span>
              <span className={styles['populationValue']} data-testid="population-value">
                {formattedPopulation}
              </span>
            </div>
          </section>
          <section
            className={styles['articleSection']}
            data-testid="article-section"
            aria-label="Wikipedia article"
          >
            <ArticleIframe url={wikiUrl} title={`Wikipedia article for ${provinceId}`} />
          </section>
        </>
      );
    }

    // Entity tab (ruler/culture/religion): header row + iframe of the entity's wiki
    const found = entityEntries.find((e) => e.cfg.id === activeTab);
    if (!found) return null;
    const { entry, entityId, wiki, cfg } = found;
    return (
      <>
        <section className={styles['entitySection']} aria-label={`${tabLabel(activeTab)} details`}>
          <EntityRow label={t(cfg.labelKey, cfg.labelFallback)} entry={entry} icon={cfg.icon} />
        </section>
        <section
          className={styles['articleSection']}
          data-testid="article-section"
          aria-label={`Wikipedia article for ${entry.name}`}
        >
          <ArticleIframe url={wiki} title={`Wikipedia article for ${entry.name || entityId}`} />
        </section>
      </>
    );
  };

  return (
    <div className={styles['container']} data-testid="province-drawer-content">
      <div
        role="tablist"
        aria-label="Province information tabs"
        className={styles['tabList']}
        data-testid="province-tabs"
      >
        {TAB_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`tab-panel-${id}`}
            id={`tab-${id}`}
            className={`${styles['tabButton'] ?? ''} ${activeTab === id ? (styles['tabButtonActive'] ?? '') : ''}`}
            onClick={() => setActiveTab(id)}
            data-testid={`province-tab-${id}`}
          >
            {tabLabel(id)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`tab-panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className={styles['tabPanel']}
      >
        {renderTabPanel()}
      </div>
    </div>
  );
};

export default ProvinceDrawerContent;
