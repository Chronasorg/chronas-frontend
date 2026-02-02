/**
 * Property-Based Tests for NavItem Component
 *
 * Feature: header-navigation-migration
 * Property 3: Active State Route Matching
 * Property 9: Aria-Label Correctness
 *
 * Validates: Requirements 3.7, 9.2
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavItem } from './NavItem';

// Simple icon component for testing
const TestIcon = () => <svg data-testid="test-icon"><circle /></svg>;

describe('NavItem - Property Tests', () => {
  /**
   * Property 9: Aria-Label Correctness
   *
   * For any NavItem with a label prop, the rendered element SHALL have
   * an aria-label attribute equal to that label.
   *
   * **Validates: Requirements 9.2**
   */
  describe('Property 9: Aria-Label Correctness', () => {
    it('should have aria-label matching label prop for button items', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (label) => {
            const { unmount } = render(
              <MemoryRouter>
                <NavItem
                  icon={<TestIcon />}
                  label={label}
                  onClick={() => { /* noop */ }}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            expect(element).toHaveAttribute('aria-label', label);
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have aria-label matching label prop for link items', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s.replace(/[^a-z0-9]/gi, '')}`),
          (label, path) => {
            const { unmount } = render(
              <MemoryRouter>
                <NavItem
                  icon={<TestIcon />}
                  label={label}
                  to={path || '/test'}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            expect(element).toHaveAttribute('aria-label', label);
            
            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 3: Active State Route Matching
   *
   * For any NavItem with a `to` prop and for any current route,
   * the NavItem SHALL display active styling if and only if
   * the current route matches the `to` prop.
   *
   * **Validates: Requirements 3.7**
   */
  describe('Property 3: Active State Route Matching', () => {
    it('should be active when current route matches to prop exactly', () => {
      const routes = ['/discover', '/settings', '/pro', '/play', '/info', '/community'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...routes),
          (route) => {
            const { unmount } = render(
              <MemoryRouter initialEntries={[route]}>
                <NavItem
                  icon={<TestIcon />}
                  label="Test"
                  to={route}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            expect(element.className).toContain('active');
            expect(element).toHaveAttribute('aria-current', 'page');
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not be active when current route does not match to prop', () => {
      const routePairs = [
        { current: '/discover', to: '/settings' },
        { current: '/pro', to: '/play' },
        { current: '/info', to: '/community' },
        { current: '/', to: '/discover' },
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...routePairs),
          ({ current, to }) => {
            const { unmount } = render(
              <MemoryRouter initialEntries={[current]}>
                <NavItem
                  icon={<TestIcon />}
                  label="Test"
                  to={to}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            expect(element.className).not.toContain('active');
            expect(element).not.toHaveAttribute('aria-current');
            
            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should be active when current route is a child of to prop', () => {
      const parentChildPairs = [
        { parent: '/community', child: '/community/general' },
        { parent: '/community', child: '/community/user/test' },
      ];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...parentChildPairs),
          ({ parent, child }) => {
            const { unmount } = render(
              <MemoryRouter initialEntries={[child]}>
                <NavItem
                  icon={<TestIcon />}
                  label="Test"
                  to={parent}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            expect(element.className).toContain('active');
            
            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should allow explicit isActive prop to override route matching', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isActive) => {
            const { unmount } = render(
              <MemoryRouter initialEntries={['/other']}>
                <NavItem
                  icon={<TestIcon />}
                  label="Test"
                  to="/test"
                  isActive={isActive}
                  testId="nav-item"
                />
              </MemoryRouter>
            );

            const element = screen.getByTestId('nav-item');
            
            if (isActive) {
              expect(element.className).toContain('active');
            } else {
              expect(element.className).not.toContain('active');
            }
            
            unmount();
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
