import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as turf from '@turf/turf';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import { useMapStore } from '../../../stores/mapStore';
import { useTimelineStore } from '../../../stores/timelineStore';
import type { Marker } from '../../../api/types';
import {
  searchProvinces,
  searchMarkers,
  type ProvinceMatch,
} from '../../../utils/placeSearch';
import styles from './SearchContent.module.css';

export interface SearchContentProps {
  onClose?: () => void;
  className?: string;
  testId?: string;
}

const PROVINCE_FLY_ZOOM = 5;
const MARKER_FLY_ZOOM = 6;
const FLY_DURATION_MS = 1500;

function getProvinceCentroid(
  feature: Feature<Polygon | MultiPolygon>
): [number, number] | null {
  try {
    const c = turf.centroid(feature);
    const lng = c.geometry.coordinates[0];
    const lat = c.geometry.coordinates[1];
    if (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      Number.isFinite(lng) &&
      Number.isFinite(lat)
    ) {
      return [lng, lat];
    }
  } catch {
    return null;
  }
  return null;
}

export const SearchContent: React.FC<SearchContentProps> = ({
  onClose,
  className,
  testId = 'search-content',
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const provincesGeoJSON = useMapStore((s) => s.provincesGeoJSON);
  const currentAreaData = useMapStore((s) => s.currentAreaData);
  const markers = useMapStore((s) => s.markers);
  const selectedYear = useTimelineStore((s) => s.selectedYear);

  // Autofocus the input when the drawer opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const features = useMemo<readonly Feature<Polygon | MultiPolygon>[]>(
    () => provincesGeoJSON?.features ?? [],
    [provincesGeoJSON]
  );

  const provinceMatches = useMemo(
    () => searchProvinces(query, features, currentAreaData),
    [query, features, currentAreaData]
  );
  const markerMatches = useMemo(() => searchMarkers(query, markers), [query, markers]);

  const inViewProvinces = provinceMatches.filter((p) => p.inCurrentYear);
  const acrossTimeProvinces = provinceMatches.filter((p) => !p.inCurrentYear);

  const featureById = useMemo(() => {
    const map = new Map<string, Feature<Polygon | MultiPolygon>>();
    for (const feature of features) {
      const props = feature.properties;
      const id =
        (props?.['name'] as string | undefined) ?? (props?.['id'] as string | undefined);
      if (id && !map.has(id)) {
        map.set(id, feature);
      }
    }
    return map;
  }, [features]);

  const handleProvinceSelect = useCallback(
    (match: ProvinceMatch) => {
      const feature = featureById.get(match.id);
      if (!feature) return;
      const centroid = getProvinceCentroid(feature);

      // Highlight the area on the map; this also updates entity outline downstream.
      // We deliberately do NOT update URL state with type/value here, since that
      // would trigger the right drawer to open — searching is a "fly to + select" flow.
      useMapStore.getState().selectProvince(match.id);

      if (centroid) {
        useMapStore.getState().flyTo({
          longitude: centroid[0],
          latitude: centroid[1],
          zoom: PROVINCE_FLY_ZOOM,
          duration: FLY_DURATION_MS,
        });
      }
    },
    [featureById]
  );

  const handleMarkerSelect = useCallback((marker: Marker) => {
    // Marker.coo is typed as a fixed-length tuple, but real responses sometimes
    // omit it. Validate at runtime through unknown to bypass the static type.
    const rawCoo = (marker as unknown as { coo?: unknown }).coo;
    if (!Array.isArray(rawCoo) || rawCoo.length < 2) return;
    const lng = Number(rawCoo[0]);
    const lat = Number(rawCoo[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
    // Same as province selection: fly to without auto-opening the right drawer.
    useMapStore.getState().flyTo({
      longitude: lng,
      latitude: lat,
      zoom: MARKER_FLY_ZOOM,
      duration: FLY_DURATION_MS,
    });
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const placeholder = t('search.placeholder', 'Search places, cities, regions…');
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const hasAnyMatch =
    inViewProvinces.length > 0 ||
    markerMatches.length > 0 ||
    acrossTimeProvinces.length > 0;

  return (
    <div
      className={[styles['searchContent'], className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      <div className={styles['banner']}>
        <div className={styles['bannerTitle']}>
          <span>{t('nav.search', 'Search')}</span>
        </div>
        {onClose && (
          <div className={styles['bannerClose']}>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('search.close', 'Close search')}
              data-testid="search-close-button"
            >
              <svg
                viewBox="0 0 24 24"
                className={styles['chevronLeft']}
                aria-hidden="true"
              >
                <path
                  d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className={styles['inputWrapper']}>
        <svg
          viewBox="0 0 24 24"
          className={styles['inputIcon']}
          aria-hidden="true"
          fill="currentColor"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className={styles['input']}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={placeholder}
          data-testid="search-input"
          autoComplete="off"
          spellCheck={false}
        />
        {hasQuery && (
          <button
            type="button"
            className={styles['clearButton']}
            onClick={handleClear}
            aria-label={t('search.clear', 'Clear search')}
            data-testid="search-clear-button"
          >
            ×
          </button>
        )}
      </div>

      <div className={styles['results']} data-testid="search-results">
        {!hasQuery && (
          <p className={styles['hint']}>
            {t(
              'search.hint',
              'Type a placename to find provinces, cities, and historical landmarks. Selecting a result moves the map there.'
            )}
          </p>
        )}

        {hasQuery && !hasAnyMatch && (
          <p className={styles['empty']} data-testid="search-empty">
            {t('search.empty', 'No matches found.')}
          </p>
        )}

        {inViewProvinces.length + markerMatches.length > 0 && (
          <>
            <div className={styles['groupTitle']}>
              {t('search.inView', 'In view')} · {String(selectedYear)}
            </div>
            <ul className={styles['groupList']}>
              {inViewProvinces.map((match) => (
                <li key={`p-${match.id}`}>
                  <button
                    type="button"
                    className={styles['resultItem']}
                    onClick={() => handleProvinceSelect(match)}
                    data-testid={`search-province-${match.id}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={styles['resultIcon']}
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                    </svg>
                    <span className={styles['resultName']}>{match.name}</span>
                    <span className={styles['resultMeta']}>
                      {t('search.province', 'Province')}
                    </span>
                  </button>
                </li>
              ))}
              {markerMatches.map(({ marker }) => (
                <li key={`m-${marker._id}`}>
                  <button
                    type="button"
                    className={styles['resultItem']}
                    onClick={() => handleMarkerSelect(marker)}
                    data-testid={`search-marker-${marker._id}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={styles['resultIcon']}
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                    </svg>
                    <span className={styles['resultName']}>{marker.name}</span>
                    <span className={styles['resultMeta']}>
                      {marker.year ? String(marker.year) : t('search.marker', 'Marker')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {acrossTimeProvinces.length > 0 && (
          <>
            <div className={styles['groupTitle']}>
              {t('search.acrossHistory', 'Across history')}
            </div>
            <ul className={styles['groupList']}>
              {acrossTimeProvinces.map((match) => (
                <li key={`pa-${match.id}`}>
                  <button
                    type="button"
                    className={styles['resultItem']}
                    onClick={() => handleProvinceSelect(match)}
                    data-testid={`search-province-other-${match.id}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className={styles['resultIcon']}
                      aria-hidden="true"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
                    </svg>
                    <span className={styles['resultName']}>{match.name}</span>
                    <span className={styles['resultMeta']}>
                      {t('search.otherYear', 'Other year')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchContent;
