/**
 * BasicPin Unit Tests
 *
 * Unit tests for the BasicPin component.
 * Requirements: 16.1, 16.2, 16.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BasicPin, DEFAULT_PIN_SIZE, isValidCoordinates } from './BasicPin';

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

describe('BasicPin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Requirement 16.1: BasicPin SHALL render at specified coordinates', () => {
    it('should render at valid coordinates', () => {
      render(<BasicPin coordinates={[10, 20]} />);

      const marker = screen.getByTestId('marker-wrapper');
      expect(marker).toBeInTheDocument();
      expect(marker).toHaveAttribute('data-longitude', '10');
      expect(marker).toHaveAttribute('data-latitude', '20');
    });

    it('should render at negative coordinates', () => {
      render(<BasicPin coordinates={[-122.4194, 37.7749]} />);

      const marker = screen.getByTestId('marker-wrapper');
      expect(marker).toHaveAttribute('data-longitude', '-122.4194');
      expect(marker).toHaveAttribute('data-latitude', '37.7749');
    });

    it('should render at boundary coordinates', () => {
      render(<BasicPin coordinates={[180, 90]} />);

      const marker = screen.getByTestId('marker-wrapper');
      expect(marker).toHaveAttribute('data-longitude', '180');
      expect(marker).toHaveAttribute('data-latitude', '90');
    });

    it('should render at negative boundary coordinates', () => {
      render(<BasicPin coordinates={[-180, -90]} />);

      const marker = screen.getByTestId('marker-wrapper');
      expect(marker).toHaveAttribute('data-longitude', '-180');
      expect(marker).toHaveAttribute('data-latitude', '-90');
    });

    it('should not render with invalid coordinates (out of bounds longitude)', () => {
      const { container } = render(<BasicPin coordinates={[181, 45]} />);
      expect(container.querySelector('[data-testid="basic-pin"]')).toBeNull();
    });

    it('should not render with invalid coordinates (out of bounds latitude)', () => {
      const { container } = render(<BasicPin coordinates={[45, 91]} />);
      expect(container.querySelector('[data-testid="basic-pin"]')).toBeNull();
    });

    it('should not render with NaN coordinates', () => {
      const { container } = render(<BasicPin coordinates={[NaN, 45]} />);
      expect(container.querySelector('[data-testid="basic-pin"]')).toBeNull();
    });

    it('should not render with Infinity coordinates', () => {
      const { container } = render(<BasicPin coordinates={[Infinity, 45]} />);
      expect(container.querySelector('[data-testid="basic-pin"]')).toBeNull();
    });

    it('should use bottom anchor for marker positioning', () => {
      render(<BasicPin coordinates={[10, 20]} />);

      const marker = screen.getByTestId('marker-wrapper');
      expect(marker).toHaveAttribute('data-anchor', 'bottom');
    });
  });

  describe('Requirement 16.2: BasicPin SHALL support configurable size', () => {
    it('should use default size when not specified', () => {
      render(<BasicPin coordinates={[10, 20]} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveStyle({ width: `${String(DEFAULT_PIN_SIZE)}px`, height: `${String(DEFAULT_PIN_SIZE)}px` });
    });

    it('should use custom size when specified', () => {
      render(<BasicPin coordinates={[10, 20]} size={80} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveStyle({ width: '80px', height: '80px' });
    });

    it('should use small size', () => {
      render(<BasicPin coordinates={[10, 20]} size={24} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveStyle({ width: '24px', height: '24px' });
    });

    it('should use large size', () => {
      render(<BasicPin coordinates={[10, 20]} size={120} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveStyle({ width: '120px', height: '120px' });
    });

    it('should render SVG icon with correct size', () => {
      render(<BasicPin coordinates={[10, 20]} size={48} />);

      const icon = screen.getByTestId('basic-pin-icon');
      expect(icon).toHaveAttribute('width', '48');
      expect(icon).toHaveAttribute('height', '48');
    });
  });

  describe('Requirement 16.3: BasicPin SHALL support hideInit property', () => {
    it('should be visible by default (hideInit=false)', () => {
      render(<BasicPin coordinates={[10, 20]} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('visible');
      expect(pin.className).not.toContain('hidden');
    });

    it('should be hidden initially when hideInit=true', () => {
      render(<BasicPin coordinates={[10, 20]} hideInit={true} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('hidden');
    });

    it('should become visible after delay when hideInit=true', async () => {
      render(<BasicPin coordinates={[10, 20]} hideInit={true} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('hidden');

      // Advance timers past the delay wrapped in act
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(pin.className).toContain('visible');
    });

    it('should remain visible when hideInit=false', () => {
      render(<BasicPin coordinates={[10, 20]} hideInit={false} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('visible');

      // Advance timers
      vi.advanceTimersByTime(200);

      expect(pin.className).toContain('visible');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      render(<BasicPin coordinates={[10, 20]} className="custom-class" />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('custom-class');
    });

    it('should combine custom className with default classes', () => {
      render(<BasicPin coordinates={[10, 20]} className="my-pin" />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin.className).toContain('basicPin');
      expect(pin.className).toContain('my-pin');
    });
  });

  describe('accessibility', () => {
    it('should have role="img"', () => {
      render(<BasicPin coordinates={[10, 20]} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveAttribute('role', 'img');
    });

    it('should have aria-label with coordinates', () => {
      render(<BasicPin coordinates={[10.1234, 20.5678]} />);

      const pin = screen.getByTestId('basic-pin');
      expect(pin).toHaveAttribute('aria-label', 'Pin marker at coordinates 10.1234, 20.5678');
    });
  });
});

describe('isValidCoordinates', () => {
  describe('valid coordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinates([0, 0])).toBe(true);
      expect(isValidCoordinates([10, 20])).toBe(true);
      expect(isValidCoordinates([-122.4194, 37.7749])).toBe(true);
    });

    it('should return true for boundary coordinates', () => {
      expect(isValidCoordinates([180, 90])).toBe(true);
      expect(isValidCoordinates([-180, -90])).toBe(true);
      expect(isValidCoordinates([180, -90])).toBe(true);
      expect(isValidCoordinates([-180, 90])).toBe(true);
    });
  });

  describe('invalid coordinates', () => {
    it('should return false for out of bounds longitude', () => {
      expect(isValidCoordinates([181, 45])).toBe(false);
      expect(isValidCoordinates([-181, 45])).toBe(false);
    });

    it('should return false for out of bounds latitude', () => {
      expect(isValidCoordinates([45, 91])).toBe(false);
      expect(isValidCoordinates([45, -91])).toBe(false);
    });

    it('should return false for NaN values', () => {
      expect(isValidCoordinates([NaN, 45])).toBe(false);
      expect(isValidCoordinates([45, NaN])).toBe(false);
      expect(isValidCoordinates([NaN, NaN])).toBe(false);
    });

    it('should return false for Infinity values', () => {
      expect(isValidCoordinates([Infinity, 45])).toBe(false);
      expect(isValidCoordinates([45, Infinity])).toBe(false);
      expect(isValidCoordinates([-Infinity, 45])).toBe(false);
    });

    it('should return false for non-array input', () => {
      expect(isValidCoordinates(null)).toBe(false);
      expect(isValidCoordinates(undefined)).toBe(false);
      expect(isValidCoordinates('10,20')).toBe(false);
    });

    it('should return false for wrong array length', () => {
      expect(isValidCoordinates([10])).toBe(false);
      expect(isValidCoordinates([10, 20, 30])).toBe(false);
      expect(isValidCoordinates([])).toBe(false);
    });
  });
});
