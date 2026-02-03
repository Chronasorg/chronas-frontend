/**
 * Mock for react-map-gl
 *
 * Provides mock implementations for testing components that use react-map-gl.
 */

import { forwardRef, useImperativeHandle, useEffect } from 'react';

// Mock MapRef interface
export interface MapRef {
  flyTo: (options: {
    center: [number, number];
    zoom?: number;
    duration?: number;
    bearing?: number;
    pitch?: number;
  }) => void;
  getMap: () => unknown;
}

// Mock ViewStateChangeEvent
export interface ViewStateChangeEvent {
  viewState: {
    latitude: number;
    longitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
  };
}

// Mock Map component props
interface MapProps {
  children?: React.ReactNode;
  mapboxAccessToken?: string;
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
    bearing?: number;
    pitch?: number;
  };
  minZoom?: number;
  style?: React.CSSProperties;
  mapStyle?: string;
  onMove?: (evt: ViewStateChangeEvent) => void;
  onLoad?: () => void;
  onMoveEnd?: () => void;
  attributionControl?: boolean;
  reuseMaps?: boolean;
}

// Mock Map component
const Map = forwardRef<MapRef, MapProps>(function MockMap(props, ref) {
  const { children, onLoad, onMove, onMoveEnd, initialViewState } = props;

  // Expose flyTo method via ref
  useImperativeHandle(ref, () => ({
    flyTo: (options) => {
      // Simulate flyTo by calling onMove with new view state
      if (onMove) {
        onMove({
          viewState: {
            latitude: options.center[1],
            longitude: options.center[0],
            zoom: options.zoom ?? initialViewState?.zoom ?? 2.5,
            bearing: options.bearing ?? 0,
            pitch: options.pitch ?? 0,
          },
        });
      }
      // Call onMoveEnd after a short delay
      if (onMoveEnd) {
        setTimeout(onMoveEnd, 10);
      }
    },
    getMap: () => ({}),
  }));

  // Simulate map load
  useEffect(() => {
    if (onLoad) {
      const timer = setTimeout(onLoad, 0);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [onLoad]);

  return (
    <div data-testid="mock-map" style={props.style}>
      {children}
    </div>
  );
});

export default Map;
export { Map };
