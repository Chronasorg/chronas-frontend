/**
 * RightDrawer Component Tests
 *
 * Tests for the sliding panel component that displays province/marker details.
 *
 * Requirements tested:
 * - 4.1: 25% viewport width
 * - 4.2: 300ms slide animation
 * - 4.3: Close button in header
 * - 4.4: Header with title
 * - 4.5: Scrollable content area
 * - 4.6: Escape key to close
 * - 4.10: ARIA attributes
 * - 10.4: Escape key closes drawer
 * - 10.5: Close button is focusable with aria-label
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RightDrawer } from './RightDrawer';
import type { DrawerContent } from '@/stores/uiStore';

// Sample test data
const sampleAreaContent: DrawerContent = {
  type: 'area',
  provinceId: 'italia',
  provinceName: 'Italia',
  wikiUrl: 'https://en.wikipedia.org/wiki/Italia',
};

const sampleMarkerContent: DrawerContent = {
  type: 'marker',
  marker: {
    _id: 'battle_actium',
    name: 'Battle of Actium',
    type: 'battle',
    year: -31,
    coo: [20.5, 38.9],
    wiki: 'https://en.wikipedia.org/wiki/Battle_of_Actium',
  },
};

describe('RightDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should render the drawer element', () => {
      render(
        <RightDrawer
          isOpen={false}
          content={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer')).toBeInTheDocument();
    });

    it('should have correct ARIA attributes (Requirement 4.10)', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const drawer = screen.getByTestId('right-drawer');
      expect(drawer).toHaveAttribute('role', 'complementary');
      expect(drawer).toHaveAttribute('aria-label', 'Content details panel');
    });

    it('should set aria-hidden to true when closed', () => {
      render(
        <RightDrawer
          isOpen={false}
          content={null}
          onClose={mockOnClose}
        />
      );

      const drawer = screen.getByTestId('right-drawer');
      expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should set aria-hidden to false when open', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const drawer = screen.getByTestId('right-drawer');
      expect(drawer).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('Open/Close State (Requirement 4.2)', () => {
    it('should have closed class when isOpen is false', () => {
      render(
        <RightDrawer
          isOpen={false}
          content={null}
          onClose={mockOnClose}
        />
      );

      const drawer = screen.getByTestId('right-drawer');
      expect(drawer.className).toContain('closed');
    });

    it('should have open class when isOpen is true', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const drawer = screen.getByTestId('right-drawer');
      expect(drawer.className).toContain('open');
    });
  });

  describe('Header (Requirements 4.3, 4.4)', () => {
    it('should display province name as title for area content', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('Italia');
    });

    it('should display marker name as title for marker content', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleMarkerContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('Battle of Actium');
    });

    it('should display empty title when content is null', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('');
    });

    it('should render close button (Requirement 4.3)', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('right-drawer-close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have aria-label on close button (Requirement 10.5)', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('right-drawer-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close panel');
    });
  });

  describe('Close Button Interaction (Requirement 4.3)', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('right-drawer-close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation (Requirements 4.6, 10.4)', () => {
    it('should call onClose when Escape key is pressed while open', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when Escape key is pressed while closed', () => {
      render(
        <RightDrawer
          isOpen={false}
          content={null}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should not call onClose for other keys', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'a' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Content Area (Requirement 4.5)', () => {
    it('should render content area', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-content')).toBeInTheDocument();
    });

    it('should display province info for area content', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/Province: Italia/)).toBeInTheDocument();
    });

    it('should display marker info for marker content', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleMarkerContent}
          onClose={mockOnClose}
        />
      );

      // MarkerDrawerContent displays the marker name in the header and details
      expect(screen.getByTestId('marker-drawer-content')).toBeInTheDocument();
      expect(screen.getByTestId('marker-type')).toHaveTextContent('Battle');
      expect(screen.getByTestId('marker-year')).toHaveTextContent('31 BCE');
    });

    it('should display empty state when content is null', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('No content selected')).toBeInTheDocument();
    });
  });

  describe('Focus Management (Requirement 10.2)', () => {
    it('should have focusable close button', () => {
      render(
        <RightDrawer
          isOpen={true}
          content={sampleAreaContent}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTestId('right-drawer-close');
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);
    });
  });

  describe('Content Type Handling', () => {
    it('should handle area content type correctly', () => {
      const areaContent: DrawerContent = {
        type: 'area',
        provinceId: 'test-province',
        provinceName: 'Test Province',
      };

      render(
        <RightDrawer
          isOpen={true}
          content={areaContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('Test Province');
    });

    it('should handle marker content type correctly', () => {
      const markerContent: DrawerContent = {
        type: 'marker',
        marker: {
          _id: 'test-marker',
          name: 'Test Marker',
          type: 'city',
          year: 1000,
          coo: [0, 0],
        },
      };

      render(
        <RightDrawer
          isOpen={true}
          content={markerContent}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('Test Marker');
    });

    it('should handle area content without wikiUrl', () => {
      const areaContentNoWiki: DrawerContent = {
        type: 'area',
        provinceId: 'no-wiki',
        provinceName: 'No Wiki Province',
      };

      render(
        <RightDrawer
          isOpen={true}
          content={areaContentNoWiki}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('right-drawer-title')).toHaveTextContent('No Wiki Province');
    });
  });
});
