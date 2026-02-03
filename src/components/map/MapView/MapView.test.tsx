/**
 * MapView Component Unit Tests
 *
 * Tests for the MapView component including rendering,
 * WebGL support, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { checkWebGLSupport } from './MapView';
import { MapErrorBoundary } from './MapErrorBoundary';

// Note: MapView component tests that require react-map-gl are skipped
// because the package has module resolution issues in the test environment.
// The component is tested via E2E tests instead.

describe('checkWebGLSupport', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return true when WebGL is supported', () => {
    // Mock canvas with WebGL context
    const mockGetContext = vi.fn().mockReturnValue({});
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: mockGetContext,
    } as unknown as HTMLCanvasElement);

    expect(checkWebGLSupport()).toBe(true);
    expect(mockGetContext).toHaveBeenCalledWith('webgl');
  });

  it('should try experimental-webgl if webgl fails', () => {
    const mockGetContext = vi.fn()
      .mockReturnValueOnce(null) // webgl returns null
      .mockReturnValueOnce({}); // experimental-webgl returns context
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: mockGetContext,
    } as unknown as HTMLCanvasElement);

    expect(checkWebGLSupport()).toBe(true);
  });

  it('should return false when WebGL is not supported', () => {
    const mockGetContext = vi.fn().mockReturnValue(null);
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: mockGetContext,
    } as unknown as HTMLCanvasElement);

    expect(checkWebGLSupport()).toBe(false);
  });

  it('should return false when an error is thrown', () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('Canvas not supported');
    });

    expect(checkWebGLSupport()).toBe(false);
  });
});

describe('MapErrorBoundary', () => {
  // Suppress console.error for error boundary tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('should render children when no error', () => {
    render(
      <MapErrorBoundary>
        <div data-testid="child">Child content</div>
      </MapErrorBoundary>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should render error UI when child throws', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <MapErrorBoundary>
        <ThrowingComponent />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should call onError callback when error is caught', () => {
    const onError = vi.fn();
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <MapErrorBoundary onError={onError}>
        <ThrowingComponent />
      </MapErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    const firstCall = onError.mock.calls[0] as [Error, unknown] | undefined;
    if (!firstCall) {
      throw new Error('Expected onError to be called');
    }
    expect(firstCall[0]).toBeInstanceOf(Error);
    expect(firstCall[0].message).toBe('Test error');
  });

  it('should show Try Again and Refresh buttons', () => {
    const ThrowingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <MapErrorBoundary>
        <ThrowingComponent />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
  });

  it('should show default error message when error has no message', () => {
    const ThrowingComponent = () => {
      throw new Error();
    };

    render(
      <MapErrorBoundary>
        <ThrowingComponent />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
