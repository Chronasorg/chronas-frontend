/**
 * BasicPin Utility Functions and Constants
 *
 * Coordinate validation and pin size defaults.
 * Extracted from BasicPin.tsx to satisfy react-refresh/only-export-components.
 */

/**
 * Default pin size in pixels
 * Requirement 16.2: THE BasicPin SHALL have a configurable size (default: 60)
 */
export const DEFAULT_PIN_SIZE = 60;

/**
 * BasicPin component props
 * Requirement 16.1: THE BasicPin SHALL render at specified coordinates
 * Requirement 16.2: THE BasicPin SHALL have a configurable size
 * Requirement 16.3: THE BasicPin SHALL support a hideInit property
 */
export interface BasicPinProps {
  /** Coordinates [longitude, latitude] */
  coordinates: [number, number];
  /** Pin size in pixels (default: 60) */
  size?: number;
  /** Whether to hide initially (for animation) */
  hideInit?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Validates that coordinates are valid numbers within geographic bounds.
 *
 * @param coordinates - The [longitude, latitude] tuple to validate
 * @returns true if coordinates are valid
 */
export function isValidCoordinates(coordinates: unknown): coordinates is [number, number] {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [longitude, latitude] = coordinates as [unknown, unknown];

  // Check for valid numbers
  if (typeof longitude !== 'number' || typeof latitude !== 'number') {
    return false;
  }

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return false;
  }

  // Check geographic bounds
  // Longitude: -180 to 180
  // Latitude: -90 to 90
  if (longitude < -180 || longitude > 180) {
    return false;
  }

  if (latitude < -90 || latitude > 90) {
    return false;
  }

  return true;
}
