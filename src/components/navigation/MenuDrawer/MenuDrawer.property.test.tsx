/**
 * Property-based tests for MenuDrawer component
 *
 * Feature: header-navigation-migration
 * Property 8: Drawer Title Based on Content Type
 *
 * **Validates: Requirements 6.3**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MenuDrawer } from './MenuDrawer';

describe('MenuDrawer - Property Tests', () => {
  /**
   * Property 8: Drawer Title Based on Content Type
   *
   * *For any* MenuDrawer with contentType 'layers', the header title SHALL be "Layers".
   * *For any* MenuDrawer with contentType 'collections', the header title SHALL be "Collections".
   *
   * **Validates: Requirements 6.3**
   */
  describe('Property 8: Drawer Title Based on Content Type', () => {
    it('should display "Layers" title when contentType is "layers"', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      const title = screen.getByTestId('menu-drawer-title');
      expect(title.textContent).toBe('Layers');
    });

    it('should display "Collections" title when contentType is "collections"', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType="collections"
          onClose={vi.fn()}
        />
      );

      const title = screen.getByTestId('menu-drawer-title');
      expect(title.textContent).toBe('Collections');
    });

    it('should display empty title when contentType is null', () => {
      render(
        <MenuDrawer
          isOpen={true}
          contentType={null}
          onClose={vi.fn()}
        />
      );

      const title = screen.getByTestId('menu-drawer-title');
      expect(title.textContent).toBe('');
    });

    it('should consistently map contentType to title', () => {
      const contentTypes: ('layers' | 'collections')[] = ['layers', 'collections'];
      const expectedTitles: Record<string, string> = {
        layers: 'Layers',
        collections: 'Collections',
      };

      contentTypes.forEach((contentType) => {
        const { unmount } = render(
          <MenuDrawer
            isOpen={true}
            contentType={contentType}
            onClose={vi.fn()}
          />
        );

        const title = screen.getByTestId('menu-drawer-title');
        expect(title.textContent).toBe(expectedTitles[contentType]);
        
        unmount();
      });
    });

    it('should update title when contentType changes', () => {
      const { rerender } = render(
        <MenuDrawer
          isOpen={true}
          contentType="layers"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('menu-drawer-title').textContent).toBe('Layers');

      rerender(
        <MenuDrawer
          isOpen={true}
          contentType="collections"
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId('menu-drawer-title').textContent).toBe('Collections');
    });
  });
});
