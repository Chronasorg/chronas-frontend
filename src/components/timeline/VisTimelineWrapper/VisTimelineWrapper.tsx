/**
 * VisTimelineWrapper Component
 * React wrapper for vis-timeline library with epic item rendering support.
 * Requirements: 5.1, 10.1, 10.7, 10.8, 11.1, 11.2
 */

import React, { forwardRef, useRef, useEffect, useCallback, useImperativeHandle, type ForwardedRef } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline';
import { DataSet } from 'vis-data';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import styles from './VisTimelineWrapper.module.css';

export const EPIC_ITEM_CLASS = 'epic-item';

export interface TimelineOptions {
  width?: string;
  height?: number;
  zoomMin?: number;
  zoomMax?: number;
  min?: string;
  max?: string;
  start?: string;
  end?: string;
  stack?: boolean;
  showCurrentTime?: boolean;
  editable?: boolean;
  showMajorLabels?: boolean;
  showMinorLabels?: boolean;
  horizontalScroll?: boolean;
  zoomable?: boolean;
  moveable?: boolean;
}

export interface TimelineItem {
  id: string;
  content: string;
  start: Date | string;
  end?: Date | string;
  group?: number;
  type?: 'box' | 'point' | 'range' | 'background';
  className?: string;
  style?: string;
  editable?: boolean;
  title?: string;
}

export interface TimelineGroup {
  id: number;
  content: string;
  className?: string;
  style?: string;
  nestedGroups?: number[];
  visible?: boolean;
}

export interface TimelineClickEvent {
  event: MouseEvent;
  time: Date;
  item: string | null;
}

export interface TimelineMouseEvent {
  time: Date;
}

export interface VisTimelineRef {
  setWindow: (start: Date, end: Date, options?: { animation?: boolean }) => void;
  setSelection: (ids: string[]) => void;
  getWindow: () => { start: Date; end: Date };
  fit: () => void;
  moveTo: (time: Date, options?: { animation?: boolean }) => void;
  zoomIn: (percentage: number) => void;
  zoomOut: (percentage: number) => void;
}

export interface VisTimelineWrapperProps {
  options: TimelineOptions;
  items?: TimelineItem[];
  groups?: TimelineGroup[];
  customTimes?: Record<string, string | Date>;
  onTimelineClick?: (event: TimelineClickEvent) => void;
  onRangeChange?: () => void;
  onRangeChanged?: () => void;
  onMouseMove?: (event: TimelineMouseEvent) => void;
  onClick?: (event: TimelineClickEvent) => void;
  className?: string;
}

function VisTimelineWrapperComponent(
  props: VisTimelineWrapperProps,
  ref: ForwardedRef<VisTimelineRef>
): React.JSX.Element {
  const { options, items = [], groups = [], customTimes = {}, onTimelineClick, onRangeChange, onRangeChanged, onMouseMove, onClick, className } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<VisTimeline | null>(null);
  const itemsDataSetRef = useRef<DataSet<TimelineItem> | null>(null);
  const groupsDataSetRef = useRef<DataSet<TimelineGroup> | null>(null);
  const customTimeIdsRef = useRef<Set<string>>(new Set());

  const handleClick = useCallback((properties: { event: MouseEvent; time: Date; item: string | null }) => {
    const clickEvent: TimelineClickEvent = { event: properties.event, time: properties.time, item: properties.item };
    if (properties.item && onClick) onClick(clickEvent);
    else if (!properties.item && onTimelineClick) onTimelineClick(clickEvent);
  }, [onClick, onTimelineClick]);

  const handleMouseMove = useCallback((properties: { time: Date }) => {
    if (onMouseMove) onMouseMove({ time: properties.time });
  }, [onMouseMove]);

  useImperativeHandle(ref, () => ({
    setWindow: (start: Date, end: Date, opts?: { animation?: boolean }) => timelineRef.current?.setWindow(start, end, opts),
    setSelection: (ids: string[]) => timelineRef.current?.setSelection(ids),
    getWindow: () => timelineRef.current?.getWindow() ?? { start: new Date(), end: new Date() },
    fit: () => timelineRef.current?.fit(),
    moveTo: (time: Date, opts?: { animation?: boolean }) => timelineRef.current?.moveTo(time, opts),
    zoomIn: (percentage: number) => timelineRef.current?.zoomIn(percentage),
    zoomOut: (percentage: number) => timelineRef.current?.zoomOut(percentage),
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;
    itemsDataSetRef.current = new DataSet<TimelineItem>();
    groupsDataSetRef.current = new DataSet<TimelineGroup>();
    const timeline = new VisTimeline(containerRef.current, itemsDataSetRef.current, groupsDataSetRef.current, options);
    timelineRef.current = timeline;
    timeline.on('click', handleClick);
    timeline.on('rangechange', () => onRangeChange?.());
    timeline.on('rangechanged', () => onRangeChanged?.());
    timeline.on('mouseMove', handleMouseMove);
    return () => {
      timeline.off('click', handleClick);
      timeline.off('rangechange', () => onRangeChange?.());
      timeline.off('rangechanged', () => onRangeChanged?.());
      timeline.off('mouseMove', handleMouseMove);
      timeline.destroy();
      timelineRef.current = null;
      itemsDataSetRef.current = null;
      groupsDataSetRef.current = null;
      customTimeIdsRef.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!itemsDataSetRef.current) return;
    itemsDataSetRef.current.clear();
    const processedItems = items.map((item) => ({
      ...item,
      className: item.className ? `${item.className} ${EPIC_ITEM_CLASS}` : EPIC_ITEM_CLASS,
      type: item.type ?? (item.end ? 'range' : 'point'),
    }));
    itemsDataSetRef.current.add(processedItems);
  }, [items]);

  useEffect(() => {
    if (!groupsDataSetRef.current) return;
    groupsDataSetRef.current.clear();
    if (groups.length > 0) groupsDataSetRef.current.add(groups);
  }, [groups]);

  useEffect(() => {
    if (!timelineRef.current) return;
    const timeline = timelineRef.current;
    const currentIds = customTimeIdsRef.current;
    Object.entries(customTimes).forEach(([id, time]) => {
      const timeValue = typeof time === 'string' ? new Date(time) : time;
      if (currentIds.has(id)) {
        try { timeline.setCustomTime(timeValue, id); } catch { /* ignore */ }
      } else {
        try { timeline.addCustomTime(timeValue, id); currentIds.add(id); } catch { /* ignore */ }
      }
    });
  }, [customTimes]);

  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.setOptions(options);
  }, [options]);

  const containerClassName = className ? `${styles['container'] ?? ''} ${className}` : (styles['container'] ?? '');
  return <div ref={containerRef} className={containerClassName} data-testid="vis-timeline" />;
}

export const VisTimelineWrapper = forwardRef(VisTimelineWrapperComponent);
export default VisTimelineWrapper;
