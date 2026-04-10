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
import { getMarkerIcon, getMarkerTypeName, formatYear } from './MarkerDrawerContent.utils';

/**
 * MarkerDrawerContent component props
 */
export interface MarkerDrawerContentProps {
  /** Marker data to display */
  marker: Marker;
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
 * Constructs the full Wikipedia URL for a marker.
 * 
 * Production behavior (from chronas/src/components/content/ArticleIframe.js):
 * - If marker.wiki exists and is already a full URL, use it
 * - If marker.wiki exists but is just an article name, prepend Wikipedia base URL
 * - If marker.wiki is undefined, use marker._id as the article name
 * 
 * @param marker - The marker to get Wikipedia URL for
 * @returns Full Wikipedia URL or undefined if no article available
 */
function getMarkerWikiUrl(marker: Marker): string | undefined {
  const WIKIPEDIA_BASE_URL = 'https://en.wikipedia.org/wiki/';
  
  // Get the wiki identifier from marker.wiki or marker._id
  const wikiId = marker.wiki ?? marker._id;
  
  if (!wikiId) {
    return undefined;
  }
  
  // Check if it's already a full URL
  if (wikiId.startsWith('http://') || wikiId.startsWith('https://')) {
    return wikiId;
  }
  
  // Construct full Wikipedia URL from article name
  return `${WIKIPEDIA_BASE_URL}${wikiId}`;
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
  const wikiUrl = getMarkerWikiUrl(marker);

  return (
    <div className={styles['container']} data-testid="marker-drawer-content">
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
          url={wikiUrl}
          title={`Wikipedia article for ${marker.name}`}
        />
      </section>
    </div>
  );
};

export default MarkerDrawerContent;
