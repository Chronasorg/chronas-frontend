/**
 * MenuDrawer Component Unit Tests
 *
 * Tests for drawer rendering, close button, and accessibility.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuDrawer } from './MenuDrawer';

describe('MenuDrawer', () => {
  describe('Rendering', () => {
    it('should render the drawer', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('menu-drawer')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
          testId="custom-drawer"
        />
      );

      expect(screen.getByTestId('custom-drawer')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
          className="custom-class"
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer.className).toContain('custom-class');
    });

    it('should render children in content area', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        >
          <div data-testid="child-content">Test Content</div>
        </MenuDrawer>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Open/Close state', () => {
    it('should have open class when isOpen is true', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer.className).toContain('open');
    });

    it('should not have open class when isOpen is false', () => {
      render(
        <MenuDrawer
          isOpen={false}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer.className).not.toContain('open');
    });

    it('should have aria-hidden true when closed', () => {
      render(
        <MenuDrawer
          isOpen={false}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have aria-hidden false when open', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('Close button', () => {
    it('should render close button', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('menu-drawer-close')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={handleClose}
        />
      );

      fireEvent.click(screen.getByTestId('menu-drawer-close'));
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label on close button', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByTestId('menu-drawer-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close drawer');
    });
  });

  describe('Keyboard interaction', () => {
    it('should call onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={handleClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on Escape when drawer is closed', () => {
      const handleClose = vi.fn();
      render(
        <MenuDrawer
          isOpen={false}
          contentType="layers"
          onClose={handleClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('role', 'dialog');
    });

    it('should have aria-modal="true"', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-label based on content type', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('aria-label', 'Layers');
    });

    it('should have fallback aria-label when contentType is null', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType={null}
          onClose={vi.fn()}
        />
      );

      const drawer = screen.getByTestId('menu-drawer');
      expect(drawer).toHaveAttribute('aria-label', 'Menu drawer');
    });
  });

  describe('Content area', () => {
    it('should render content area', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('menu-drawer-content')).toBeInTheDocument();
    });

    it('should have scrollable content area class', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const content = screen.getByTestId('menu-drawer-content');
      expect(content.className).toContain('content');
    });
  });
});
