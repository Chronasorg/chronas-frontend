import { describe, it, expect } from 'vitest';
import type { Marker } from '../api/types';
import { cityNameInYear, cityExistsInYear, isCapitalInYear, citiesToGeoJSON, cityLabel } from './cityNames';

const volgograd: Marker = {
  _id: 'Volgograd',
  name: 'Tsaritsyn',
  type: 'c',
  year: 1589,
  coo: [44.483, 48.7],
  names: [[1589, 1925, 'Tsaritsyn'], [1925, 1961, 'Stalingrad'], [1961, null, 'Volgograd']],
};

describe('cityNameInYear', () => {
  it('picks the name of the period, with the end year exclusive', () => {
    expect(cityNameInYear(volgograd, 1600)).toBe('Tsaritsyn');
    expect(cityNameInYear(volgograd, 1942)).toBe('Stalingrad');
    expect(cityNameInYear(volgograd, 1961)).toBe('Volgograd');
    expect(cityNameInYear(volgograd, 2000)).toBe('Volgograd');
  });

  it('falls back to the marker name outside every period or without a history', () => {
    expect(cityNameInYear(volgograd, 1500)).toBe('Tsaritsyn');
    expect(cityNameInYear({ name: 'Samara' }, 1900)).toBe('Samara');
  });

  it('accepts an open start and ignores malformed entries', () => {
    const marker = { name: 'Gdańsk', names: [[null, 1793, 'Gdańsk'], ['x'], [1793, 1945, 'Danzig']] } as unknown as Marker;
    expect(cityNameInYear(marker, 1000)).toBe('Gdańsk');
    expect(cityNameInYear(marker, 1900)).toBe('Danzig');
  });
});

describe('cityExistsInYear / isCapitalInYear', () => {
  it('shows a city from its founding year until its end year', () => {
    expect(cityExistsInYear({ year: 1783 }, 1000)).toBe(false);
    expect(cityExistsInYear({ year: 1783 }, 1783)).toBe(true);
    expect(cityExistsInYear({ year: 965, end: 1319 }, 1319)).toBe(true);
    expect(cityExistsInYear({ year: 965, end: 1319 }, 1320)).toBe(false);
  });

  it('marks capitals by their capital years', () => {
    expect(isCapitalInYear({ capital: [[1992, 2000, 'ERI']] }, 1995)).toBe(true);
    expect(isCapitalInYear({ capital: [[1992, 2000, 'ERI']] }, 1900)).toBe(false);
    expect(isCapitalInYear({}, 1900)).toBe(false);
  });
});

describe('citiesToGeoJSON', () => {
  const sevastopol: Marker = { _id: 'Sevastopol', name: 'Sevastopol', type: 'c', year: 1783, coo: [33.5, 44.6] };
  const kiev: Marker = { _id: 'Kiev', name: 'Kiev', type: 'c', year: 482, coo: [30.5, 50.45], capital: [[882, 1240, 'KIE']] };

  it('keeps only the cities of the year, with their name of that year', () => {
    const fc = citiesToGeoJSON([volgograd, sevastopol, kiev], 1000);
    expect(fc.features.map((f) => f.properties?.['id'])).toEqual(['Kiev']);
    expect(fc.features[0]?.properties).toEqual({ id: 'Kiev', name: 'Kiev', capital: 1, rank: 1 });
    expect(citiesToGeoJSON([volgograd], 1950).features[0]?.properties?.['rank']).toBe(0);
    const fc1942 = citiesToGeoJSON([volgograd, sevastopol, kiev], 1942);
    expect(fc1942.features.find((f) => f.properties?.['id'] === 'Volgograd')?.properties?.['name']).toBe('Stalingrad');
  });

  it('skips cities shown as markers already and cities without valid coordinates', () => {
    const broken: Marker = { ...sevastopol, _id: 'Broken', coo: [Number.NaN, 1] };
    const fc = citiesToGeoJSON([volgograd, sevastopol, broken], 1950, new Set(['Sevastopol']));
    expect(fc.features.map((f) => f.properties?.['id'])).toEqual(['Volgograd']);
  });
});

describe('cityLabel', () => {
  it('drops Wikipedia disambiguation from labels', () => {
    expect(cityLabel('Rudnya, Volgograd Oblast')).toBe('Rudnya');
    expect(cityLabel('Pallasovka (town)')).toBe('Pallasovka');
    expect(cityLabel('Petukhovo (town), Kurgan Oblast')).toBe('Petukhovo');
    expect(cityLabel('Stalingrad')).toBe('Stalingrad');
  });
});
