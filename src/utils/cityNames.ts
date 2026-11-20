/**
 * Historical city names (issue #69): a city shows the name it had in the
 * selected year, and only while it existed.
 */
import type { FeatureCollection, Point } from 'geojson';
import type { Marker } from '../api/types';

/**
 * The name a marker has in `year`: the matching entry of its name history,
 * else its own name.
 */
export function cityNameInYear(marker: Pick<Marker, 'name' | 'names'>, year: number): string {
  const names = Array.isArray(marker.names) ? marker.names : [];
  for (const entry of names) {
    if (!Array.isArray(entry) || typeof entry[2] !== 'string') continue;
    const [from, until, name] = entry;
    if ((from === null || year >= from) && (until === null || year < until)) return name;
  }
  return marker.name;
}

/**
 * A city name as a map label: without the disambiguation many marker names
 * carry from their Wikipedia title ("Rudnya, Volgograd Oblast",
 * "Pallasovka (town)").
 */
export function cityLabel(name: string): string {
  const label = name.replace(/,.*$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  return label || name;
}

/** Whether a city existed in `year`: founded by then and not yet ended. */
export function cityExistsInYear(marker: Pick<Marker, 'year' | 'end'>, year: number): boolean {
  if (typeof marker.year !== 'number' || marker.year > year) return false;
  return typeof marker.end !== 'number' || marker.end >= year;
}

/** Whether a city was a capital in `year`. */
export function isCapitalInYear(marker: Pick<Marker, 'capital'>, year: number): boolean {
  return Array.isArray(marker.capital)
    && marker.capital.some((c) => Array.isArray(c) && c[0] <= year && year <= c[1]);
}

/**
 * The cities of `year` as GeoJSON points with their name of that year.
 * Cities in `skipIds` (shown as event markers already) are left out.
 */
export function citiesToGeoJSON(
  cities: readonly Marker[],
  year: number,
  skipIds: ReadonlySet<string> = new Set(),
): FeatureCollection<Point> {
  const features: FeatureCollection<Point>['features'] = [];
  for (const city of cities) {
    if (skipIds.has(city._id) || !cityExistsInYear(city, year)) continue;
    const coo = city.coo as unknown;
    if (!Array.isArray(coo) || typeof coo[0] !== 'number' || typeof coo[1] !== 'number'
      || Number.isNaN(coo[0]) || Number.isNaN(coo[1])) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [coo[0], coo[1]] },
      properties: {
        id: city._id,
        name: cityLabel(cityNameInYear(city, year)),
        capital: isCapitalInYear(city, year) ? 1 : 0,
        // Label priority (lower first): cities with a name history are the
        // bigger, better-documented ones, so they win over villages nearby.
        rank: Array.isArray(city.names) && city.names.length > 0 ? 0 : 1,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
