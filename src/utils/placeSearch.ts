/**
 * Place search utilities.
 *
 * Pure helpers used by the SearchContent drawer to filter and rank
 * provinces and markers by query text.
 */

import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { Marker } from '../api/types';
import type { AreaData } from '../stores/mapStore';

const MAX_RESULTS_PER_GROUP = 50;

export interface ProvinceMatch {
  /** Province ID (also its display name, since the API keys provinces by name) */
  id: string;
  /** Display name shown to the user */
  name: string;
  /** True when this province exists in `currentAreaData` (the active year) */
  inCurrentYear: boolean;
}

export interface MarkerMatch {
  marker: Marker;
}

/**
 * Normalize a string for case-insensitive substring comparison and remove
 * common diacritics so "Köln" still matches "koln".
 */
export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Score a candidate against a normalized query. Higher is better.
 * Returns null when there is no match.
 */
function scoreMatch(candidate: string, normalizedQuery: string): number | null {
  if (!candidate) return null;
  const normalized = normalizeForSearch(candidate);
  if (!normalized) return null;
  const idx = normalized.indexOf(normalizedQuery);
  if (idx === -1) return null;
  // Prefix matches rank higher; shorter strings are slightly preferred.
  const prefixBonus = idx === 0 ? 1000 : 0;
  const wordBoundaryBonus = idx > 0 && /\s/.test(normalized[idx - 1] ?? '') ? 500 : 0;
  return prefixBonus + wordBoundaryBonus + Math.max(0, 200 - candidate.length) - idx;
}

/**
 * Search provinces by name. Looks at every province feature so the user can
 * find places that exist in other years too.
 *
 * @param query - The user's search input
 * @param features - All known province features (the full universe of provinces)
 * @param currentAreaData - Province data for the active year, used to mark which results are "in view"
 */
export function searchProvinces(
  query: string,
  features: readonly Feature<Polygon | MultiPolygon>[],
  currentAreaData: AreaData | null
): ProvinceMatch[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const results: { match: ProvinceMatch; score: number }[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    const props = feature.properties;
    const provinceId =
      (props?.['name'] as string | undefined) ??
      (props?.['id'] as string | undefined);
    if (!provinceId) continue;
    if (seen.has(provinceId)) continue;
    seen.add(provinceId);

    const score = scoreMatch(provinceId, normalizedQuery);
    if (score === null) continue;

    results.push({
      match: {
        id: provinceId,
        name: provinceId,
        inCurrentYear: currentAreaData !== null && provinceId in currentAreaData,
      },
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_RESULTS_PER_GROUP).map((r) => r.match);
}

/**
 * The Marker type declares `coo` as a required `[number, number]` tuple, but
 * upstream data is loose: some markers come back with `coo` undefined. Cast
 * through `unknown` so the check survives the runtime mismatch.
 */
function hasCoordinates(marker: Marker): boolean {
  const coo = (marker as unknown as { coo?: unknown }).coo;
  return Array.isArray(coo) && coo.length >= 2 &&
    Number.isFinite(coo[0]) && Number.isFinite(coo[1]);
}

/**
 * Search markers by name. Markers are already filtered to the current year,
 * so all matches are in-view.
 */
export function searchMarkers(query: string, markers: readonly Marker[]): MarkerMatch[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const results: { match: MarkerMatch; score: number }[] = [];

  for (const marker of markers) {
    if (!marker.name) continue;
    if (!hasCoordinates(marker)) continue;
    const score = scoreMatch(marker.name, normalizedQuery);
    if (score === null) continue;
    results.push({ match: { marker }, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, MAX_RESULTS_PER_GROUP).map((r) => r.match);
}

export const PLACE_SEARCH_MAX_RESULTS = MAX_RESULTS_PER_GROUP;
