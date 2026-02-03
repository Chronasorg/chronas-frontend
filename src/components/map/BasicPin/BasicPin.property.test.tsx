/**
 * BasicPin Property Tests
 *
 * Property-based tests for the BasicPin component using fast-check.
 *
 * **Property 39: Basic Pin Visibility**
 * **Validates: Requirements 16.1, 16.2**
 *
 * For any selected item with valid coordinates, a BasicPin marker SHALL be
 * displayed at those coordinates.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import * as fc from 'fast-check';
import { BasicPin, isValidCoordinates, DEFAULT_PIN_SIZE } from './BasicPin';

// Mock react-map-gl/mapbox Marker component
vi.mock('react-map-gl/mapbox', () => ({
  Marker: ({ children, longitude, latitude, anchor }: {
    children: React.ReactNode;
    longitude: number;
    latitude: number;
    anchor: string;
  }) => (
    <div
      data-testid="marker-wrapper"
      data-longitude={longitude}
      data-latitude={latitude}
      data-anchor={anchor}
    >
      {children}
    </div>
  ),
}));

/**
 * Custom arbitrary for valid geographic coordinates.
 * Longitude: -180 to 180
 * Latitude: -90 to 90
 */
const validCoordinatesArb: fc.Arbitrary<[number, number]> = fc.tuple(
  fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
  fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
);

/**
 * Custom arbitrary for invalid coordinates (out of bounds).
 */
const invalidCoordinatesArb: fc.Arbitrary<[number, number]> = fc.oneof(
  // Out of bounds longitude (positive)
  fc.tuple(
    fc.double({ min: 180.001, max: 1000, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
  ),
  // Out of bounds longitude (negative)
  fc.tuple(
    fc.double({ min: -1000, max: -180.001, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })
  ),
  // Out of bounds latitude (positive)
  fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: 90.001, max: 500, noNaN: true, noDefaultInfinity: true })
  ),
  // Out of bounds latitude (negative)
  fc.tuple(
    fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }),
    fc.double({ min: -500, max: -90.001, noNaN: true, noDefaultInfinity: true })
  )
);

/**
 * Custom arbitrary for valid pin sizes.
 */
const validSizeArb = fc.integer({ min: 1, max: 500 });

describe('BasicPin - Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Property 39: Basic Pin Visibility', () => {
    /**
     * **Property 39: Basic Pin Visibility**
     * **Validates: Requirements 16.1, 16.2**
     *
     * For any selected item with valid coordinates, a BasicPin marker SHALL be
     * displayed at those coordinates.
     */

    it('should render a pin marker for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} />);

          // Pin should be rendered
          const pin = screen.getByTestId('basic-pin');
          expect(pin).toBeInTheDocument();

          // Marker should have correct coordinates
          const marker = screen.getByTestId('marker-wrapper');
          expect(Number(marker.getAttribute('data-longitude'))).toBeCloseTo(coordinates[0], 5);
          expect(Number(marker.getAttribute('data-latitude'))).toBeCloseTo(coordinates[1], 5);

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should not render for any invalid coordinates (out of bounds)', () => {
      fc.assert(
        fc.property(invalidCoordinatesArb, (coordinates) => {
          const { container, unmount } = render(<BasicPin coordinates={coordinates} />);

          // Pin should NOT be rendered for invalid coordinates
          const pin = container.querySelector('[data-testid="basic-pin"]');
          expect(pin).toBeNull();

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should render with any valid size at any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, validSizeArb, (coordinates, size) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} size={size} />);

          // Pin should be rendered with correct size
          const pin = screen.getByTestId('basic-pin');
          expect(pin).toBeInTheDocument();
          expect(pin).toHaveStyle({ width: `${String(size)}px`, height: `${String(size)}px` });

          // Icon should have correct size
          const icon = screen.getByTestId('basic-pin-icon');
          expect(icon).toHaveAttribute('width', String(size));
          expect(icon).toHaveAttribute('height', String(size));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should use default size when size is not specified for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} />);

          const pin = screen.getByTestId('basic-pin');
          expect(pin).toHaveStyle({
            width: `${String(DEFAULT_PIN_SIZE)}px`,
            height: `${String(DEFAULT_PIN_SIZE)}px`,
          });

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should be visible by default for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} />);

          const pin = screen.getByTestId('basic-pin');
          expect(pin.className).toContain('visible');
          expect(pin.className).not.toContain('hidden');

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should be initially hidden when hideInit=true for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} hideInit={true} />);

          const pin = screen.getByTestId('basic-pin');
          expect(pin.className).toContain('hidden');

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should use bottom anchor for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} />);

          const marker = screen.getByTestId('marker-wrapper');
          expect(marker).toHaveAttribute('data-anchor', 'bottom');

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should have accessible aria-label with coordinates for any valid coordinates', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          const { unmount } = render(<BasicPin coordinates={coordinates} />);

          const pin = screen.getByTestId('basic-pin');
          const ariaLabel = pin.getAttribute('aria-label');

          // Should contain the coordinates (formatted to 4 decimal places)
          expect(ariaLabel).toContain(coordinates[0].toFixed(4));
          expect(ariaLabel).toContain(coordinates[1].toFixed(4));

          unmount();
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidCoordinates property tests', () => {
    it('should return true for any coordinates within valid bounds', () => {
      fc.assert(
        fc.property(validCoordinatesArb, (coordinates) => {
          expect(isValidCoordinates(coordinates)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for any coordinates outside valid bounds', () => {
      fc.assert(
        fc.property(invalidCoordinatesArb, (coordinates) => {
          expect(isValidCoordinates(coordinates)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for NaN in either coordinate', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.tuple(fc.constant(NaN), fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })),
            fc.tuple(fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }), fc.constant(NaN)),
            fc.tuple(fc.constant(NaN), fc.constant(NaN))
          ),
          (coordinates) => {
            expect(isValidCoordinates(coordinates)).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should return false for Infinity in either coordinate', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.tuple(fc.constant(Infinity), fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })),
            fc.tuple(fc.constant(-Infinity), fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true })),
            fc.tuple(fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }), fc.constant(Infinity)),
            fc.tuple(fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true }), fc.constant(-Infinity))
          ),
          (coordinates) => {
            expect(isValidCoordinates(coordinates)).toBe(false);
          }
        ),
        { numRuns: 40 }
      );
    });

    it('should handle boundary values correctly', () => {
      // Exact boundary values should be valid
      expect(isValidCoordinates([180, 90])).toBe(true);
      expect(isValidCoordinates([-180, -90])).toBe(true);
      expect(isValidCoordinates([180, -90])).toBe(true);
      expect(isValidCoordinates([-180, 90])).toBe(true);
      expect(isValidCoordinates([0, 0])).toBe(true);
    });
  });

  describe('hideInit animation property tests', () => {
    it('should become visible after delay when hideInit=true for any valid coordinates', async () => {
      // Test with a few representative coordinates instead of full property test
      // to avoid async timing issues with fake timers
      const testCoordinates: [number, number][] = [
        [0, 0],
        [180, 90],
        [-180, -90],
        [45.5, -30.25],
        [-122.4194, 37.7749],
      ];

      for (const coordinates of testCoordinates) {
        const { unmount } = render(<BasicPin coordinates={coordinates} hideInit={true} />);

        const pin = screen.getByTestId('basic-pin');

        // Initially hidden
        expect(pin.className).toContain('hidden');

        // Advance timers past the delay wrapped in act
        await act(async () => {
          await vi.advanceTimersByTimeAsync(150);
        });

        // Should become visible
        expect(pin.className).toContain('visible');

        unmount();
      }
    });
  });
});
