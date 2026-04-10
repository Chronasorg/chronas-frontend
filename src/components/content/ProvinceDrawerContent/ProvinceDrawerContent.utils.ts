/**
 * ProvinceDrawerContent Utility Functions
 *
 * Helper functions for entity metadata lookup.
 * Extracted from ProvinceDrawerContent.tsx to satisfy react-refresh/only-export-components.
 */

import type { EntityMetadata, MetadataEntry } from '@/api/types';

/**
 * Fallback color for entities when metadata is not available
 * Requirement: Display "Unknown" with a fallback gray Color_Chip for missing metadata
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
  entityId: string | null,
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

/**
 * Gets religionGeneral metadata from religion ID
 * ReligionGeneral is derived from the religion's parent field
 *
 * @param religionId - The religion ID to look up
 * @param metadata - The full metadata object
 * @returns The religionGeneral metadata entry or a fallback entry
 */
export function getReligionGeneralMetadata(
  religionId: string | null,
  metadata: EntityMetadata | null
): MetadataEntry {
  if (!metadata || !religionId) {
    return { name: FALLBACK_NAME, color: FALLBACK_COLOR };
  }

  // First, get the religion entry to find its parent (religionGeneral)
  const religionEntry = metadata.religion[religionId];
  if (!religionEntry?.parent) {
    return { name: FALLBACK_NAME, color: FALLBACK_COLOR };
  }

  // Look up the religionGeneral using the parent ID
  const religionGeneralEntry = metadata.religionGeneral[religionEntry.parent];
  if (!religionGeneralEntry) {
    return { name: FALLBACK_NAME, color: FALLBACK_COLOR };
  }

  return {
    name: religionGeneralEntry.name || FALLBACK_NAME,
    color: religionGeneralEntry.color || FALLBACK_COLOR,
  };
}
