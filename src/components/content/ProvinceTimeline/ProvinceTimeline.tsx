/**
 * ProvinceTimeline Component
 *
 * Displays a vis.js Timeline showing historical rulers, cultures, religions,
 * and capitals for a province over time.
 *
 * Legacy reference: chronas/src/components/content/ProvinceTimeline.js
 * Data source: /metadata/ap_{provinceId}?type=ap
 *
 * Requirements: US-3.4, US-3.5
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline';
import { DataSet } from 'vis-data';
import type { EntityMetadata } from '@/api/types';
import { apiClient } from '@/api/client';
import { METADATA } from '@/api/endpoints';
import { useTimelineStore } from '@/stores/timelineStore';
import styles from './ProvinceTimeline.module.css';

/**
 * Province timeline data structure from API.
 * Each key contains an array of {year: entityId} objects.
 */
interface ProvinceTimelineData {
  ruler: Record<string, string>[];
  culture: Record<string, string>[];
  religion: Record<string, string>[];
  religionGeneral: Record<string, string>[];
  capital: Record<string, string>[];
  population?: Record<string, number>[];
}

export interface ProvinceTimelineProps {
  provinceId: string;
  metadata: EntityMetadata | null;
  testId?: string;
}

const GROUPS = [
  { id: 'ruler', content: 'Ruler' },
  { id: 'religion', content: 'Religion' },
  { id: 'religionGeneral', content: 'Religion General' },
  { id: 'culture', content: 'Culture' },
  { id: 'capital', content: 'Capital' },
];

const TIMELINE_OPTIONS = {
  width: '100%',
  height: '326px',
  zoomMin: 315360000000,
  min: new Date(-2500, 0, 1),
  max: new Date(2500, 0, 1),
  stack: false,
  showCurrentTime: false,
  tooltip: { followMouse: true },
};

/**
 * Builds vis.js timeline items from province timeline data.
 */
function buildTimelineItems(
  data: ProvinceTimelineData,
  metadata: EntityMetadata | null
): { id: string; group: string; content: string; start: Date; end: Date; type: string; style: string; title: string; className: string }[] {
  const items: { id: string; group: string; content: string; start: Date; end: Date; type: string; style: string; title: string; className: string }[] = [];

  for (const key of Object.keys(data) as (keyof ProvinceTimelineData)[]) {
    if (key === 'population') continue;
    const entries = data[key];
    if (!Array.isArray(entries)) continue;

    entries.forEach((item, index) => {
      const yearStr = Object.keys(item)[0];
      if (!yearStr) return;
      const startYear = Number(yearStr);
      const dimKey = (Object.values(item)[0]) ?? '';
      const nextEntry = entries[index + 1];
      const endYear = nextEntry ? Number(Object.keys(nextEntry)[0]) : 2000;

      // Get display name and color from metadata
      let itemTitle = dimKey;
      let bgColor = '';
      if (key === 'capital') {
        itemTitle = dimKey;
      } else if (metadata?.[key]) {
        const metaEntry = (metadata[key])[dimKey];
        if (metaEntry) {
          itemTitle = metaEntry.name || dimKey;
          bgColor = metaEntry.color || '';
        }
      }

      items.push({
        id: `${key}||${String(index)}||${dimKey}`,
        group: key,
        content: itemTitle,
        start: new Date(new Date(0, 1, 1).setFullYear(startYear)),
        end: new Date(new Date(0, 1, 1).setFullYear(endYear)),
        type: 'range',
        style: bgColor ? `background: ${bgColor}` : '',
        title: `<span style="color: red">${itemTitle}</span> ${String(startYear)} - ${String(endYear)} (${String(endYear - startYear)} years)`,
        className: 'provinceTimelineItem',
      });
    });
  }

  return items;
}

export function ProvinceTimeline({ provinceId, metadata, testId = 'province-timeline' }: ProvinceTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<ProvinceTimelineData | null>(null);
  const setYear = useTimelineStore((s) => s.setYear);
  const selectedYear = useTimelineStore((s) => s.selectedYear);

  // Fetch province timeline data
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading/error state before async fetch is a standard data-fetching pattern
    setLoading(true);
    setError(null);

    apiClient.get<ProvinceTimelineData>(METADATA.GET_PROVINCE_TIMELINE(provinceId))
      .then((data) => {
        if (!cancelled) {
          setTimelineData(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load province timeline');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [provinceId]);

  // Initialize vis.js timeline
  useEffect(() => {
    if (!containerRef.current || !timelineData || !metadata) return undefined;

    const items = buildTimelineItems(timelineData, metadata);
    const dataSet = new DataSet(items);
    const groupsDataSet = new DataSet(GROUPS);

    const timeline = new VisTimeline(containerRef.current, dataSet, groupsDataSet, TIMELINE_OPTIONS);

    // Set custom time marker for selected year
    try {
      timeline.addCustomTime(new Date(new Date(0, 1, 1).setFullYear(selectedYear)), 'selectedYear');
    } catch {
      // Custom time may already exist
    }

    // Click handler — update map year (US-3.5)
    timeline.on('select', (props: { items: string[] }) => {
      if (props.items.length === 0) return;
      const itemId = props.items[0];
      if (!itemId) return;
      const item = dataSet.get(itemId);
      if (item?.start) {
        const clickedYear = (item.start).getFullYear();
        if (clickedYear >= -2000 && clickedYear <= 2000) {
          setYear(clickedYear);
        }
      }
    });

    timelineRef.current = timeline;

    return () => {
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [timelineData, metadata, selectedYear, setYear]);

  // Handle click on timeline item to navigate year (US-3.5)
  const handleTimelineClick = useCallback(() => {
    // Click handling is done via vis.js 'select' event above
  }, []);

  if (loading) {
    return <div className={styles['loading']} data-testid={testId}>Loading province history...</div>;
  }

  if (error) {
    return <div className={styles['error']} data-testid={testId}>{error}</div>;
  }

  if (!timelineData) {
    return null;
  }

  return (
    <div className={styles['container']} data-testid={testId} onClick={handleTimelineClick}>
      <div ref={containerRef} className={styles['timelineWrapper']} data-testid={`${testId}-vis`} />
    </div>
  );
}

export default ProvinceTimeline;
