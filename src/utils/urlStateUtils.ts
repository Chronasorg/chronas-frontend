/**
 * URL State Utilities
 *
 * Utility functions for parsing and updating URL state parameters.
 * The app uses HashRouter, so URL parameters are in the hash portion.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */

/**
 * URL state interface representing the parameters stored in the URL.
 */
export interface URLState {
  /** Current year being displayed */
  year?: number;
  /** Type of content in the right drawer */
  type?: 'area' | 'marker';
  /** Value/ID of the selected entity */
  value?: string;
  /** Marker limit setting */
  limit?: number;
  /** Map position as "lat,lng,zoom" */
  pos?: string;
  /** Active area color dimension (ruler|culture|religion|religionGeneral|population) */
  color?: string;
  /** Comma-separated list of enabled epic filter keys (war,empire,religion,culture,person,other) */
  epics?: string;
  /** Comma-separated list of marker filter keys that are OFF (opt-out, keeps URL short) */
  markersOff?: string;
}

/**
 * Parses the current URL hash to extract state parameters.
 *
 * The app uses HashRouter, so the URL format is:
 * - `/#/?year=1000&type=area&value=Athens`
 *
 * Requirement 9.4: THE application SHALL restore drawer state from URL on page load.
 *
 * @returns The parsed URL state
 *
 * @example
 * // URL: /#/?year=1000&type=area&value=Athens
 * parseURLState() // { year: 1000, type: 'area', value: 'Athens' }
 */
export function parseURLState(): URLState {
  // Prefer HashRouter query params (`/#/?year=1000`), fall back to the regular
  // `window.location.search`. This mirrors getQueryStringParameter in mapUtils.ts
  // which writes into whichever shape the current URL uses.
  const hash = window.location.hash;
  const hashQueryIndex = hash.indexOf('?');
  let queryString: string;
  if (hashQueryIndex !== -1) {
    queryString = hash.slice(hashQueryIndex + 1);
  } else if (window.location.search) {
    const search = window.location.search;
    queryString = search.startsWith('?') ? search.slice(1) : search;
  } else {
    return {};
  }

  const params = new URLSearchParams(queryString);

  const state: URLState = {};

  // Parse year
  const yearParam = params.get('year');
  if (yearParam !== null) {
    const year = parseInt(yearParam, 10);
    if (!isNaN(year)) {
      state.year = year;
    }
  }

  // Parse type
  const typeParam = params.get('type');
  if (typeParam === 'area' || typeParam === 'marker') {
    state.type = typeParam;
  }

  // Parse value
  const valueParam = params.get('value');
  if (valueParam !== null && valueParam !== '') {
    state.value = valueParam;
  }

  // Parse limit
  const limitParam = params.get('limit');
  if (limitParam !== null) {
    const limit = parseInt(limitParam, 10);
    if (!isNaN(limit) && limit >= 0) {
      state.limit = limit;
    }
  }

  // Parse pos (lat,lng,zoom)
  const posParam = params.get('pos');
  if (posParam !== null && posParam !== '') {
    state.pos = posParam;
  }

  // Parse color dimension
  const colorParam = params.get('color');
  if (colorParam !== null && colorParam !== '') {
    state.color = colorParam;
  }

  // Parse epics (enabled filter keys, comma-separated)
  const epicsParam = params.get('epics');
  if (epicsParam !== null) {
    state.epics = epicsParam;
  }

  // Parse markersOff (disabled marker filter keys, comma-separated)
  const markersOffParam = params.get('markersOff');
  if (markersOffParam !== null) {
    state.markersOff = markersOffParam;
  }

  return state;
}

/**
 * Updates the URL hash with new state parameters.
 *
 * Uses `replaceState` to avoid polluting browser history.
 *
 * Requirement 9.5: THE URL update SHALL use replaceState to avoid history pollution.
 *
 * @param params - Partial URL state to update. Pass `undefined` or `null` to remove a parameter.
 *
 * @example
 * // Current URL: /#/?year=1000
 * updateURLState({ type: 'area', value: 'Athens' })
 * // New URL: /#/?year=1000&type=area&value=Athens
 *
 * @example
 * // Current URL: /#/?year=1000&type=area&value=Athens
 * updateURLState({ type: undefined, value: undefined })
 * // New URL: /#/?year=1000
 */
export function updateURLState(params: Partial<URLState>): void {
  // Get current hash
  const hash = window.location.hash;

  // Extract path and query from hash
  const queryIndex = hash.indexOf('?');
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? '' : hash.slice(queryIndex + 1);

  // Parse existing params
  const searchParams = new URLSearchParams(queryString);

  // Update params - use type assertion since Object.entries loses type info
  (Object.entries(params) as [string, string | number | undefined][]).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    } else {
      searchParams.delete(key);
    }
  });

  // Build new hash
  const newQueryString = searchParams.toString();
  const newHash = newQueryString ? `${path}?${newQueryString}` : path;

  // Update URL without adding to history
  const newUrl = `${window.location.pathname}${newHash}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Clears specific parameters from the URL.
 *
 * Convenience function for removing drawer-related params when closing.
 *
 * @param keys - Array of parameter keys to remove
 *
 * @example
 * // Current URL: /#/?year=1000&type=area&value=Athens
 * clearURLParams(['type', 'value'])
 * // New URL: /#/?year=1000
 */
export function clearURLParams(keys: (keyof URLState)[]): void {
  // Get current hash
  const hash = window.location.hash;

  // Extract path and query from hash
  const queryIndex = hash.indexOf('?');
  const path = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? '' : hash.slice(queryIndex + 1);

  // Parse existing params
  const searchParams = new URLSearchParams(queryString);

  // Remove specified keys
  keys.forEach((key) => {
    searchParams.delete(key);
  });

  // Build new hash
  const newQueryString = searchParams.toString();
  const newHash = newQueryString ? `${path}?${newQueryString}` : path;

  // Update URL without adding to history
  const newUrl = `${window.location.pathname}${newHash}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Checks if the URL has drawer content parameters.
 *
 * @returns True if both type and value are present in the URL
 */
export function hasDrawerParams(): boolean {
  const state = parseURLState();
  return state.type !== undefined && state.value !== undefined;
}

/**
 * Returns the current full shareable URL (includes hash + all state params).
 */
export function getShareableURL(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href;
}
