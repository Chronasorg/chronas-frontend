/**
 * Detail-level utilities for Issue #8 Feature 3.
 *
 * Maps the user-facing "Low / Medium / High" detail preset to the internal
 * rendering knobs the map store already exposes (markerLimit, clusterMarkers).
 *
 * Auto-detection uses modern browser APIs (navigator.hardwareConcurrency,
 * navigator.deviceMemory, window.screen, and WebGL MAX_RENDERBUFFER_SIZE),
 * mirroring the thresholds from the legacy Chronas PerformanceSelector.
 */

import type { DetailLevel } from '@/stores/uiStore';

export interface DetailLevelPreset {
  markerLimit: number;
  clusterMarkers: boolean;
}

export const DETAIL_LEVEL_PRESETS: Record<DetailLevel, DetailLevelPreset> = {
  low: { markerLimit: 0, clusterMarkers: true },
  medium: { markerLimit: 2000, clusterMarkers: true },
  high: { markerLimit: 5000, clusterMarkers: false },
};

interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number;
}

function probeMaxRenderBufferSize(): number {
  try {
    if (typeof document === 'undefined') return 0;
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl');
    if (!gl) return 0;
    const max = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number | null;
    return typeof max === 'number' ? max : 0;
  } catch {
    return 0;
  }
}

function isMobileUserAgent(ua: string): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

/**
 * Auto-detects a sensible default detail level for the current device.
 * Mobile/tablet → low. Modest desktops → medium. Powerful desktops → high.
 */
export function detectDetailLevel(): DetailLevel {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'medium';
  }

  if (isMobileUserAgent(navigator.userAgent)) return 'low';

  const cores = navigator.hardwareConcurrency;
  const memory = (navigator as NavigatorWithDeviceMemory).deviceMemory ?? 0;
  const screenPixels = window.screen.width * window.screen.height;
  const maxRenderBuffer = probeMaxRenderBufferSize();

  // Thresholds adapted from legacy chronas/src/components/menu/performanceSelector/PerformanceSelector.js
  const isHighEnd =
    screenPixels > 1_296_000 &&
    maxRenderBuffer > 10_000 &&
    cores >= 8 &&
    (memory === 0 || memory >= 8);

  if (isHighEnd) return 'high';

  const isMidTier =
    screenPixels > 1_043_624 && maxRenderBuffer > 5_000 && cores >= 4;

  if (isMidTier) return 'medium';

  return 'low';
}
