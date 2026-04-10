/**
 * ProvinceTooltip Utility Functions and Types
 *
 * Entity metadata lookup and feature property types.
 * Extracted from ProvinceTooltip.tsx to satisfy react-refresh/only-export-components.
 */

import type { EntityMetadata, MetadataEntry } from '@/api/types';

/**
 * Province feature properties from GeoJSON
 * These are the properties attached to province features on the map
 */
export interface ProvinceFeatureProperties {
  /** Province ID */
  id: string;
  /** Ruler ID */
  r: string;
  /** Culture ID */
  c: string;
  /** Religion ID */
  e: string;
  /** Religion General ID */
  g: string;
  /** Population */
  p: number;
}

/**
 * Fallback color for entities when metadata is not available
 * Requirement 1.9: IF metadata is not available for an entity,
 * THEN THE Tooltip SHALL display "Unknown" with a fallback gray Color_Chip
 */
const FALLBACK_COLOR = 'rgba(128, 128, 128, 0.5)';

/**
 * Fallback name for entities when metadata is not available
 */
const FALLBACK_NAME = 'Unknown';

/**
 * Gets entity metadata entry for a given entity ID
 *
 * @param entityId - The entity ID to look up
 * @param metadataKey - The metadata category to search in
 * @param metadata - The full metadata object
 * @returns The metadata entry or a fallback entry
 */
export function getEntityMetadata(
  entityId: string,
  metadataKey: keyof EntityMetadata,
  metadata: EntityMetadata | null
): MetadataEntry {
  if (!metadata || !entityId) {
    return { name: FALLBACK_NAME, color: FALLBACK_COLOR };
  }

  const categoryMetadata = metadata[metadataKey];
  const entry = categoryMetadata[entityId];
  if (!entry) {
    return { name: FALLBACK_NAME, color: FALLBACK_COLOR };
  }

  return {
    name: entry.name || FALLBACK_NAME,
    color: entry.color || FALLBACK_COLOR,
  };
}
