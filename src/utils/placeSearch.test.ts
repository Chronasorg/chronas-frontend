import { describe, it, expect } from 'vitest';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { Marker } from '../api/types';
import type { AreaData } from '../stores/mapStore';
import { searchProvinces, searchMarkers, normalizeForSearch } from './placeSearch';

function provinceFeature(name: string): Feature<Polygon | MultiPolygon> {
  return {
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
  };
}

function makeMarker(overrides: Partial<Marker> & { _id: string; name: string }): Marker {
  return {
    type: 'c',
    year: 1000,
    coo: [0, 0],
    ...overrides,
  };
}

describe('normalizeForSearch', () => {
  it('lowercases and trims', () => {
    expect(normalizeForSearch('  Rome  ')).toBe('rome');
  });

  it('strips diacritics', () => {
    expect(normalizeForSearch('Köln')).toBe('koln');
    expect(normalizeForSearch('São Paulo')).toBe('sao paulo');
  });
});

describe('searchProvinces', () => {
  const features = [
    provinceFeature('Rome'),
    provinceFeature('Roman Empire'),
    provinceFeature('Romania'),
    provinceFeature('Athens'),
    provinceFeature('Carthage'),
  ];
  const currentAreaData: AreaData = {
    Rome: ['r1', 'c1', 'rel1', null, 100],
    Athens: ['r2', 'c2', 'rel2', null, 50],
  };

  it('returns empty for empty query', () => {
    expect(searchProvinces('', features, currentAreaData)).toEqual([]);
    expect(searchProvinces('   ', features, currentAreaData)).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const results = searchProvinces('rome', features, currentAreaData);
    expect(results.map((r) => r.name)).toContain('Rome');
  });

  it('marks provinces in the current year', () => {
    const results = searchProvinces('rom', features, currentAreaData);
    const rome = results.find((r) => r.name === 'Rome');
    expect(rome?.inCurrentYear).toBe(true);
    const romanEmpire = results.find((r) => r.name === 'Roman Empire');
    expect(romanEmpire?.inCurrentYear).toBe(false);
  });

  it('ranks prefix matches above substring matches', () => {
    const results = searchProvinces('rom', features, currentAreaData);
    const names = results.map((r) => r.name);
    expect(names[0]).toMatch(/^Rom/);
    expect(names).toContain('Rome');
  });

  it('returns no matches for unrelated query', () => {
    expect(searchProvinces('xyzzz', features, currentAreaData)).toEqual([]);
  });

  it('treats null currentAreaData as empty', () => {
    const results = searchProvinces('rome', features, null);
    expect(results.every((r) => !r.inCurrentYear)).toBe(true);
  });

  it('deduplicates by province id', () => {
    const dupFeatures = [provinceFeature('Rome'), provinceFeature('Rome')];
    const results = searchProvinces('rome', dupFeatures, currentAreaData);
    expect(results).toHaveLength(1);
  });
});

describe('searchMarkers', () => {
  const markers: Marker[] = [
    makeMarker({ _id: '1', name: 'Sack of Rome' }),
    makeMarker({ _id: '2', name: 'Battle of Hastings' }),
    makeMarker({ _id: '3', name: 'Romulus' }),
  ];

  it('returns empty for empty query', () => {
    expect(searchMarkers('', markers)).toEqual([]);
  });

  it('matches case-insensitively', () => {
    const results = searchMarkers('rome', markers);
    expect(results.map((r) => r.marker.name)).toContain('Sack of Rome');
  });

  it('ranks word-boundary matches above mid-word matches', () => {
    const results = searchMarkers('rom', markers);
    const names = results.map((r) => r.marker.name);
    expect(names[0]).toBe('Romulus');
  });

  it('skips markers without a name', () => {
    const broken = [
      ...markers,
      makeMarker({ _id: '4', name: '' }),
    ];
    const results = searchMarkers('rome', broken);
    expect(results.every((r) => !!r.marker.name)).toBe(true);
  });
});
