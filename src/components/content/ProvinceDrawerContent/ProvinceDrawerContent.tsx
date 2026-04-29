/**
 * ProvinceDrawerContent Component
 *
 * Displays detailed province information in the right drawer with
 * tabbed navigation matching the map tooltip categories:
 *   Ruler | Culture | Religion | Religion General
 *
 * Each tab shows the entity's color + name as a header, then embeds that
 * entity's Wikipedia article.
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

type TabId = 'ruler' | 'culture' | 'religion' | 'religionGeneral';

interface EntityTabConfig {
  id: TabId;
  dataIndex: number;
  metadataKey: keyof EntityMetadata;
  labelKey: string;
  labelFallback: string;
  icon: string;
  isDerived?: boolean;
}

const ENTITY_TABS: EntityTabConfig[] = [
  { id: 'ruler', dataIndex: 0, metadataKey: 'ruler', labelKey: 'map.ruler', labelFallback: 'Ruler', icon: '👑' },
  { id: 'culture', dataIndex: 1, metadataKey: 'culture', labelKey: 'map.culture', labelFallback: 'Culture', icon: '🎭' },
  { id: 'religion', dataIndex: 2, metadataKey: 'religion', labelKey: 'map.religion', labelFallback: 'Religion', icon: '⛪' },
  { id: 'religionGeneral', dataIndex: -1, metadataKey: 'religionGeneral', labelKey: 'map.religionGeneral', labelFallback: 'Religion Gen.', icon: '☯️', isDerived: true },
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
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('ruler');

  const [, , religionId, , population] = provinceData;
  const formattedPopulation = formatPopulation(population);
  const religionGeneralEntry = getReligionGeneralMetadata(religionId, metadata);

  // Precompute entity entries + their wiki urls so the tab panels render cleanly
  const entityEntries = useMemo(() => {
    return ENTITY_TABS.map((cfg) => {
      if (cfg.isDerived) {
        return { cfg, entityId: religionGeneralEntry.name, entry: religionGeneralEntry, wiki: buildEntityWikiUrl(religionGeneralEntry, religionGeneralEntry.name) };
      }
      const entityId = provinceData[cfg.dataIndex] as string;
      const entry = getEntityMetadata(entityId, cfg.metadataKey, metadata);
      return { cfg, entityId, entry, wiki: buildEntityWikiUrl(entry, entityId) };
    });
  }, [provinceData, metadata, religionGeneralEntry]);

  const tabLabel = (id: TabId): string => {
    const cfg = ENTITY_TABS.find(tab => tab.id === id);
    return cfg ? t(cfg.labelKey, cfg.labelFallback) : id;
  };

  const TAB_ORDER: TabId[] = ['ruler', 'culture', 'religion', 'religionGeneral'];

  const renderTabPanel = (): React.ReactNode => {
    const found = entityEntries.find((e) => e.cfg.id === activeTab);
    if (!found) return null;
    const { entry, entityId, wiki, cfg } = found;
    return (
      <>
        <section className={styles['entitySection']} aria-label={`${tabLabel(activeTab)} details`}>
          <EntityRow label={t(cfg.labelKey, cfg.labelFallback)} entry={entry} icon={cfg.icon} />
          <div className={styles['populationRow']} data-testid="population-row">
            <span className={styles['populationLabel']}>
              {provinceId}
            </span>
            <span className={styles['populationValue']} data-testid="population-value">
              {formattedPopulation}
            </span>
          </div>
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
