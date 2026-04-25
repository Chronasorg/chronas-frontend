import { describe, it, expect } from 'vitest';
import { DETAIL_LEVEL_PRESETS, detectDetailLevel } from './detailLevelUtils';

describe('DETAIL_LEVEL_PRESETS', () => {
  it('maps low/medium/high to tiered marker limits and clustering', () => {
    expect(DETAIL_LEVEL_PRESETS.low.markerLimit).toBe(0);
    expect(DETAIL_LEVEL_PRESETS.low.clusterMarkers).toBe(true);

    expect(DETAIL_LEVEL_PRESETS.medium.markerLimit).toBe(2000);
    expect(DETAIL_LEVEL_PRESETS.medium.clusterMarkers).toBe(true);

    expect(DETAIL_LEVEL_PRESETS.high.markerLimit).toBe(5000);
    expect(DETAIL_LEVEL_PRESETS.high.clusterMarkers).toBe(false);
  });
});

describe('detectDetailLevel', () => {
  it('returns one of the three valid levels in the jsdom test environment', () => {
    const level = detectDetailLevel();
    expect(['low', 'medium', 'high']).toContain(level);
  });
});
