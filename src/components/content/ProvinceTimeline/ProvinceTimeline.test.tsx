/**
 * ProvinceTimeline: malformed API data must not break rendering (review of PR #72).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import type { EntityMetadata } from '@/api/types';
import { ProvinceTimeline } from './ProvinceTimeline';

const mockGet = vi.hoisted(() => vi.fn());
vi.mock('@/api/client', () => ({ apiClient: { get: mockGet } }));

// Capture the items handed to vis-timeline (jsdom has no layout to draw them).
const timelineItems = vi.hoisted(() => ({ current: [] as { content: string; title: string }[] }));
vi.mock('vis-timeline', () => ({
  Timeline: class {
    constructor(_el: HTMLElement, items: { get: () => { content: string; title: string }[] }) {
      timelineItems.current = items.get();
    }
    addCustomTime = vi.fn();
    on = vi.fn();
    destroy = vi.fn();
  },
}));

describe('ProvinceTimeline', () => {
  beforeEach(() => {
    mockGet.mockReset();
    timelineItems.current = [];
  });

  it('renders entries whose names are not strings, and escapes names that are', async () => {
    mockGet.mockResolvedValueOnce({
      ruler: [{ 1000: 'RUS' }, { 1100: 'BAD' }, { 1200: 'EVIL' }],
      culture: [{ 1000: 42 }],
      religion: [{ 1000: null }],
      religionGeneral: [],
      capital: [{ 1000: { not: 'a string' } }],
    });
    const metadata = {
      ruler: {
        RUS: { name: 'Kievan Rus', color: 'rgb(1,2,3)' },
        BAD: { name: 42, color: 'rgb(4,5,6)' },
        EVIL: { name: '<img src=x onerror=alert(1)>', color: 'rgb(7,8,9)' },
      },
    } as unknown as EntityMetadata;

    render(<ProvinceTimeline provinceId="Kiev" metadata={metadata} />);

    await screen.findByTestId('province-timeline-vis');
    await waitFor(() => expect(timelineItems.current.length).toBe(6));
    const contents = timelineItems.current.map((item) => item.content);
    expect(contents).toContain('Kievan Rus');
    expect(contents).toContain('&lt;img src=x onerror=alert(1)&gt;');
    for (const item of timelineItems.current) {
      expect(typeof item.content).toBe('string');
      expect(item.content).not.toMatch(/<img/i);
      expect(item.title).not.toMatch(/<img/i);
    }
  });
});
