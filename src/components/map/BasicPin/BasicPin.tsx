/**
 * BasicPin Component
 *
 * Renders a pin marker at specified coordinates on the map.
 * Used to indicate selected locations, linked items, or epics.
 *
 * Requirements: 16.1, 16.2, 16.3
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import styles from './BasicPin.module.css';
import { DEFAULT_PIN_SIZE, isValidCoordinates, type BasicPinProps } from './BasicPin.utils';

/**
 * Animation delay for hideInit in milliseconds
 */
const HIDE_INIT_DELAY = 100;

/**
 * BasicPin Component
 *
 * Renders a pin marker at the specified geographic coordinates.
 * - Supports configurable size
 * - Supports hideInit property for animation effects
 * - Uses react-map-gl Marker component for positioning
 *
 * Requirement 16.1: WHEN a linked item or epic is selected with coordinates,
 * THE MapView SHALL display a BasicPin marker at that location
 * Requirement 16.2: THE BasicPin SHALL have a configurable size (default: 60)
 * Requirement 16.3: THE BasicPin SHALL support a hideInit property for gallery markers
 *
 * @param props - BasicPin component props
 * @returns BasicPin React component or null if coordinates are invalid
 */
export const BasicPin: React.FC<BasicPinProps> = ({
  coordinates,
  size = DEFAULT_PIN_SIZE,
  hideInit = false,
  className,
}) => {
  // State for controlling visibility when hideInit is true
  const [isVisible, setIsVisible] = useState(!hideInit);

  // Handle hideInit animation
  // Requirement 16.3: THE BasicPin SHALL support a hideInit property
  useEffect(() => {
    if (hideInit) {
      // Start hidden, then show after a short delay
      setIsVisible(false); // eslint-disable-line react-hooks/set-state-in-effect -- visibility toggle with delayed timer is intentional for animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, HIDE_INIT_DELAY);

      return () => clearTimeout(timer);
    }

    setIsVisible(true);
    return undefined;
  }, [hideInit]);

  // Validate coordinates before rendering
  if (!isValidCoordinates(coordinates)) {
    return null;
  }

  const [longitude, latitude] = coordinates;

  // Calculate pin dimensions
  const pinWidth = size;
  const pinHeight = size;

  // Build container class names
  const containerClasses = [
    styles['basicPin'],
    isVisible ? styles['visible'] : styles['hidden'],
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      // Requirement 16.5: THE BasicPin SHALL use react-map-gl Marker component
      // with captureClick and captureDrag disabled
    >
      <div
        className={containerClasses}
        data-testid="basic-pin"
        style={{
          width: `${String(pinWidth)}px`,
          height: `${String(pinHeight)}px`,
        }}
        role="img"
        aria-label={`Pin marker at coordinates ${longitude.toFixed(4)}, ${latitude.toFixed(4)}`}
      >
        {/* Pin SVG icon */}
        <svg
          viewBox="0 0 24 24"
          width={pinWidth}
          height={pinHeight}
          className={styles['pinIcon']}
          data-testid="basic-pin-icon"
        >
          {/* Pin shape - drop/teardrop shape pointing down */}
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="currentColor"
            stroke="none"
          />
          {/* Inner circle */}
          <circle
            cx="12"
            cy="9"
            r="2.5"
            fill="white"
          />
        </svg>
      </div>
    </Marker>
  );
};

export default BasicPin;
