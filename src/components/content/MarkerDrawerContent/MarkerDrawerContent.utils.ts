/**
 * MarkerDrawerContent Utility Functions
 *
 * Helper functions for marker type icons, display names, and year formatting.
 * Extracted from MarkerDrawerContent.tsx to satisfy react-refresh/only-export-components.
 */

/**
 * Marker type icon mapping
 * Maps marker type strings to their corresponding emoji icons
 * Based on chronas.org marker icons
 */
const MARKER_TYPE_ICONS: Record<string, string> = {
  battle: '⚔️',
  b: '⚔️',
  city: '🏛️',
  c: '🏛️',
  capital: '🏰',
  person: '👤',
  p: '👤',
  scholar: '📚',
  s: '📚',
  artist: '🎨',
  a: '🎨',
  artwork: '🖼️',
  ar: '🖼️',
  artifact: '🏺',
  event: '📜',
  e: '📜',
  organization: '🏢',
  o: '🏢',
  architecture: '🏛️',
  ai: '🏛️',
  default: '📍',
};

/**
 * Marker type display name mapping
 * Maps marker type codes to human-readable names
 */
const MARKER_TYPE_NAMES: Record<string, string> = {
  battle: 'Battle',
  b: 'Battle',
  city: 'City',
  c: 'City',
  capital: 'Capital',
  person: 'Person',
  p: 'Person',
  scholar: 'Scholar',
  s: 'Scholar',
  artist: 'Artist',
  a: 'Artist',
  artwork: 'Artwork',
  ar: 'Artwork',
  artifact: 'Artifact',
  event: 'Event',
  e: 'Event',
  organization: 'Organization',
  o: 'Organization',
  architecture: 'Architecture',
  ai: 'Architecture',
};

/**
 * Capitalizes the first letter of a string
 *
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Gets the icon for a marker type
 *
 * @param type - The marker type string
 * @returns The emoji icon for the marker type
 */
export function getMarkerIcon(type: string): string {
  const normalizedType = type.toLowerCase();
  const icon = MARKER_TYPE_ICONS[normalizedType];
  return icon ?? MARKER_TYPE_ICONS['default'] ?? '📍';
}

/**
 * Gets the display name for a marker type
 *
 * @param type - The marker type string
 * @returns The human-readable name for the marker type
 */
export function getMarkerTypeName(type: string): string {
  const normalizedType = type.toLowerCase();
  return MARKER_TYPE_NAMES[normalizedType] ?? capitalizeFirst(type);
}

/**
 * Formats a year for display, handling BCE years
 *
 * @param year - The year to format (negative for BCE)
 * @returns Formatted year string (e.g., "31 BCE" or "1066 CE")
 */
export function formatYear(year: number): string {
  if (year < 0) {
    return `${String(Math.abs(year))} BCE`;
  }
  return `${String(year)} CE`;
}
