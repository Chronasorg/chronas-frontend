/**
 * MapErrorBoundary Component
 *
 * Error boundary wrapper for the MapView component.
 * Catches rendering errors and displays a fallback UI.
 *
 * Requirement 13.3: THE MapView SHALL be wrapped with an error boundary
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './MapView.module.css';

/**
 * Props for the MapErrorBoundary component
 */
export interface MapErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * State for the MapErrorBoundary component
 */
export interface MapErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error */
  error: Error | null;
}

/**
 * MapErrorBoundary Component
 *
 * Catches errors in the MapView component tree and displays
 * a user-friendly fallback UI.
 *
 * Requirement 13.3: THE MapView SHALL be wrapped with an error boundary
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Updates state when an error is caught during rendering.
   */
  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Logs error information and calls optional callback.
   */
  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Map component error:', error);
    console.error('Error info:', errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Handles the refresh button click.
   */
  handleRefresh = (): void => {
    window.location.reload();
  };

  /**
   * Handles the retry button click.
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles['container']}>
          <div className={styles['webglError']}>
            <h2>Something went wrong</h2>
            <p>The map failed to load. This could be due to a temporary issue.</p>
            <p>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
