import { describe, it, expect } from 'vitest';
import { DETAIL_LEVEL_PRESETS, detectDetailLevel } from './detailLevelUtils';

describe('DETAIL_LEVEL_PRESETS', () => {
  it('maps low/medium/high to tiered marker limits with clustering off by default', () => {
    expect(DETAIL_LEVEL_PRESETS.low.markerLimit).toBe(2000);
    expect(DETAIL_LEVEL_PRESETS.low.clusterMarkers).toBe(false);

    expect(DETAIL_LEVEL_PRESETS.medium.markerLimit).toBe(5000);
    expect(DETAIL_LEVEL_PRESETS.medium.clusterMarkers).toBe(false);

    expect(DETAIL_LEVEL_PRESETS.high.markerLimit).toBe(10000);
    expect(DETAIL_LEVEL_PRESETS.high.clusterMarkers).toBe(false);
  });
});

describe('detectDetailLevel', () => {
  it('returns one of the three valid levels in the jsdom test environment', () => {
    const level = detectDetailLevel();
    expect(['low', 'medium', 'high']).toContain(level);
  });
});
