/**
 * MarkerDrawerContent Component
 *
 * Displays detailed marker information in the right drawer panel.
 * Shows marker name as header, type with icon, year, description,
 * and embeds a Wikipedia article iframe.
 *
 * Requirements: 3.3, 3.4, 3.5, 3.6, 3.7
 */

import type React from 'react';
import styles from './MarkerDrawerContent.module.css';
import { ArticleIframe } from '@/components/content/ArticleIframe/ArticleIframe';
import type { Marker } from '@/api/types';

/**
 * MarkerDrawerContent component props
 */
export interface MarkerDrawerContentProps {
  /** Marker data to display */
  marker: Marker;
}

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

/**
 * Gets the description from a marker
 * Handles both direct description property and nested data.description
 *
 * @param marker - The marker to get description from
 * @returns The description string or undefined
 */
function getMarkerDescription(marker: Marker): string | undefined {
  // Check for description in marker.data first
  if (marker.data?.description) {
    return marker.data.description;
  }
  return undefined;
}

/**
 * MarkerDrawerContent Component
 *
 * Displays detailed marker information in the right drawer panel.
 *
 * Visual structure:
 * ```
 * ┌──────────────────────────────────────────┐
 * │ Battle of Actium                         │  ← Marker name header
 * ├──────────────────────────────────────────┤
 * │ ⚔️ Type: Battle                          │  ← Type with icon
 * │ 📅 Year: 31 BCE                          │  ← Year display
 * │                                          │
 * │ Description:                             │  ← Description (if available)
 * │ Naval battle between the forces of...   │
 * ├──────────────────────────────────────────┤
 * │                                          │
 * │      Wikipedia Iframe                    │
 * │      (scrollable area)                   │
 * │                                          │
 * └──────────────────────────────────────────┘
 * ```
 *
 * Requirements:
 * - 3.3: Marker drawer displays marker name as header
 * - 3.4: Marker drawer displays marker type with appropriate icon
 * - 3.5: Marker drawer displays marker year
 * - 3.6: Marker drawer displays marker description (if available)
 * - 3.7: Marker drawer embeds Wikipedia article iframe
 *
 * @param props - MarkerDrawerContent component props
 * @returns MarkerDrawerContent React component
 */
export const MarkerDrawerContent: React.FC<MarkerDrawerContentProps> = ({
  marker,
}) => {
  const icon = getMarkerIcon(marker.type);
  const typeName = getMarkerTypeName(marker.type);
  const formattedYear = formatYear(marker.year);
  const description = getMarkerDescription(marker);

  return (
    <div className={styles['container']} data-testid="marker-drawer-content">
      {/* Marker name header - Requirement 3.3 */}
      <header className={styles['header']} data-testid="marker-header">
        <h2 className={styles['markerName']}>{marker.name}</h2>
      </header>

      {/* Marker details section - Requirements 3.4, 3.5, 3.6 */}
      <section
        className={styles['detailsSection']}
        data-testid="details-section"
        aria-label="Marker details"
      >
        {/* Type row with icon - Requirement 3.4 */}
        <div className={styles['detailRow']} data-testid="type-row">
          <span className={styles['detailIcon']} aria-hidden="true">
            {icon}
          </span>
          <span className={styles['detailLabel']}>Type:</span>
          <span className={styles['detailValue']} data-testid="marker-type">
            {typeName}
          </span>
        </div>

        {/* Year row - Requirement 3.5 */}
        <div className={styles['detailRow']} data-testid="year-row">
          <span className={styles['detailIcon']} aria-hidden="true">
            📅
          </span>
          <span className={styles['detailLabel']}>Year:</span>
          <span className={styles['detailValue']} data-testid="marker-year">
            {formattedYear}
          </span>
        </div>

        {/* Description section - Requirement 3.6 */}
        {description && (
          <div className={styles['descriptionSection']} data-testid="description-section">
            <div className={styles['descriptionHeader']}>
              <span className={styles['detailIcon']} aria-hidden="true">
                📝
              </span>
              <span className={styles['detailLabel']}>Description:</span>
            </div>
            <p className={styles['descriptionText']} data-testid="marker-description">
              {description}
            </p>
          </div>
        )}
      </section>

      {/* Wikipedia iframe section - Requirement 3.7 */}
      <section
        className={styles['articleSection']}
        data-testid="article-section"
        aria-label="Wikipedia article"
      >
        <ArticleIframe
          url={marker.wiki}
          title={`Wikipedia article for ${marker.name}`}
        />
      </section>
    </div>
  );
};

export default MarkerDrawerContent;
