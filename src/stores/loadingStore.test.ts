/**
 * Loading Store Tests
 *
 * Unit tests for the loading state store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLoadingStore, initialState } from './loadingStore';

describe('useLoadingStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useLoadingStore.setState(initialState);
  });

  describe('initial state', () => {
    it('should have isLoading set to false initially', () => {
      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have loadingMessage set to null initially', () => {
      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set isLoading to true when called with true', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true);

      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set isLoading to false when called with false', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true);
      setLoading(false);

      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should set loadingMessage when provided with isLoading true', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true, 'Loading data...');

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBe('Loading data...');
    });

    it('should set loadingMessage to null when isLoading is true but no message provided', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true);

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBeNull();
    });

    it('should clear loadingMessage when isLoading is set to false', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true, 'Loading...');
      setLoading(false);

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBeNull();
    });

    it('should clear loadingMessage when isLoading is set to false even if message is provided', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true, 'Loading...');
      setLoading(false, 'This should be ignored');

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBeNull();
    });

    it('should update loadingMessage when called multiple times with isLoading true', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true, 'First message');
      setLoading(true, 'Second message');

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBe('Second message');
    });

    it('should handle empty string message', () => {
      const { setLoading } = useLoadingStore.getState();
      setLoading(true, '');

      const state = useLoadingStore.getState();
      expect(state.loadingMessage).toBe('');
    });
  });

  describe('state transitions', () => {
    it('should correctly transition from not loading to loading with message', () => {
      const { setLoading } = useLoadingStore.getState();

      // Initial state
      let state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.loadingMessage).toBeNull();

      // Start loading
      setLoading(true, 'Fetching data...');
      state = useLoadingStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.loadingMessage).toBe('Fetching data...');

      // Stop loading
      setLoading(false);
      state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.loadingMessage).toBeNull();
    });

    it('should handle rapid state changes', () => {
      const { setLoading } = useLoadingStore.getState();

      setLoading(true, 'Step 1');
      setLoading(true, 'Step 2');
      setLoading(true, 'Step 3');
      setLoading(false);

      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.loadingMessage).toBeNull();
    });
  });
});
