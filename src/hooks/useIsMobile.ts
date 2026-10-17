import { useSyncExternalStore } from 'react';

/**
 * Matches the `@media (max-width: 767px)` breakpoint used across the CSS modules.
 * Keep the two in sync: JS layout offsets (map, timeline) must switch at the same
 * width as the CSS that repositions the drawers.
 */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

function getMediaQueryList(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mql = getMediaQueryList();
  if (!mql) return () => undefined;
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return getMediaQueryList()?.matches ?? false;
}

/**
 * Returns true while the viewport is phone-sized (under 768px wide).
 * Falls back to false where matchMedia is unavailable (jsdom, SSR).
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
