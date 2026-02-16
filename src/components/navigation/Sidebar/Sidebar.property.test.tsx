/**
 * Sidebar Property-Based Tests
 *
 * **Feature: mvp-visual-polish, Property 2: Sidebar Navigation Completeness**
 * **Validates: Requirements 2.2**
 *
 * Property tests verify that for any rendered Left_Sidebar in collapsed state,
 * all required navigation items SHALL be present:
 * - Layers icon
 * - Discover icon (compass)
 * - Random icon (dice)
 * - Settings icon
 * - Star icon (PRO)
 * - Collections icon
 * - Play icon (gamepad)
 * - Help icon
 * - Logout icon
 *
 * Production reference: https://chronas.org
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { Sidebar, type SidebarProps } from './Sidebar';
import { useUIStore } from '../../../stores/uiStore';
import { useAuthStore } from '../../../stores/authStore';
import { useNavigationStore } from '../../../stores/navigationStore';

// Mock the stores
vi.mock('../../../stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../../stores/navigationStore', () => ({
  useNavigationStore: vi.fn(),
}));

const mockUseUIStore = useUIStore as unknown as ReturnType<typeof vi.fn>;
const mockUseAuthStore = useAuthStore as unknown as ReturnType<typeof vi.fn>;
const mockUseNavigationStore = useNavigationStore as unknown as ReturnType<typeof vi.fn>;

/**
 * Required navigation item IDs as defined in Requirements 2.2
 * These match the production sidebar at https://chronas.org
 * 
 * Production order:
 * Top: Layers, Discover, Random, Settings
 * Bottom: Star (PRO), Collections, Play, Help, Logout
 */
const REQUIRED_NAV_ITEMS = [
  { id: 'layers', label: 'Layers' },
  { id: 'discover', label: 'Discover' },
  { id: 'random', label: 'Random Article' },
  { id: 'settings', label: 'Configuration' },
  { id: 'pro', label: 'PRO Version' },
  { id: 'collections', label: 'Collections' },
  { id: 'play', label: 'Play' },
  { id: 'help', label: 'Help' },
  { id: 'logout', label: 'Logout' },
] as const;

describe('Sidebar Property Tests', () => {
  const mockToggleDrawer = vi.fn();
  const mockClearUser = vi.fn();

  /**
   * Arbitrary generator for sidebar props
   * Note: We use fc.oneof to either include or exclude optional properties
   * to satisfy exactOptionalPropertyTypes
   */
  const sidebarPropsArbitrary = fc.record({
    isOpen: fc.boolean(),
  }).chain((base) =>
    fc.record({
      className: fc.option(fc.string(), { nil: undefined }),
      testId: fc.option(fc.string(), { nil: undefined }),
    }).map((optionals) => {
      // Filter out undefined values to satisfy exactOptionalPropertyTypes
      const result: { isOpen: boolean; className?: string; testId?: string } = { isOpen: base.isOpen };
      if (optionals.className !== undefined) {
        result.className = optionals.className;
      }
      if (optionals.testId !== undefined) {
        result.testId = optionals.testId;
      }
      return result;
    })
  );

  /**
   * Arbitrary generator for authentication state
   */
  const authStateArbitrary = fc.record({
    isAuthenticated: fc.boolean(),
    username: fc.option(fc.string(), { nil: null }),
    avatar: fc.option(fc.webUrl(), { nil: null }),
    score: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: null }),
    subscription: fc.option(fc.constantFrom('free', 'pro'), { nil: null }),
  });

  /**
   * Arbitrary generator for UI store state
   */
  const uiStateArbitrary = fc.record({
    theme: fc.constantFrom('light', 'dark'),
  });

  /**
   * Arbitrary generator for navigation store state
   */
  const navigationStateArbitrary = fc.record({
    drawerOpen: fc.boolean(),
    drawerContent: fc.option(fc.constantFrom('layers', 'collections'), { nil: null }),
  });

  /**
   * Helper to setup mocks with given state
   */
  const setupMocks = (
    uiState: { theme: string },
    authState: {
      isAuthenticated: boolean;
      username: string | null;
      avatar: string | null;
      score: number | null;
      subscription: string | null;
    },
    navState: { drawerOpen: boolean; drawerContent: string | null }
  ) => {
    mockUseUIStore.mockReturnValue(uiState);
    mockUseAuthStore.mockReturnValue({
      ...authState,
      clearUser: mockClearUser,
    });
    mockUseNavigationStore.mockReturnValue({
      ...navState,
      toggleDrawer: mockToggleDrawer,
    });
  };

  /**
   * Helper to render Sidebar with MemoryRouter
   */
  const renderSidebar = (props: Partial<SidebarProps> = {}) => {
    return render(
      <MemoryRouter>
        <Sidebar {...props} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('Property 2: Sidebar Navigation Completeness', () => {
    /**
     * **Validates: Requirements 2.2**
     *
     * For any rendered Left_Sidebar in collapsed state, all required navigation items
     * SHALL be present matching production (https://chronas.org):
     * Top: Layers, Discover, Random, Settings
     * Bottom: Star (PRO), Collections, Play, Help, Logout
     */

    it('should contain Layers navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const layersItem = screen.getByTestId('nav-item-layers');
            expect(layersItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Discover navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const discoverItem = screen.getByTestId('nav-item-discover');
            expect(discoverItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Random navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const randomItem = screen.getByTestId('nav-item-random');
            expect(randomItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Settings navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const settingsItem = screen.getByTestId('nav-item-settings');
            expect(settingsItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Star/PRO navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const proItem = screen.getByTestId('nav-item-pro');
            expect(proItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Collections navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const collectionsItem = screen.getByTestId('nav-item-collections');
            expect(collectionsItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Play navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const playItem = screen.getByTestId('nav-item-play');
            expect(playItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Help navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const helpItem = screen.getByTestId('nav-item-help');
            expect(helpItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Logout navigation item for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const logoutItem = screen.getByTestId('nav-item-logout');
            expect(logoutItem).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain ALL required navigation items for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            // Verify all required navigation items are present
            for (const item of REQUIRED_NAV_ITEMS) {
              const navItem = screen.getByTestId(`nav-item-${item.id}`);
              expect(navItem).toBeInTheDocument();
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have exactly 9 required navigation items for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            // Count all nav items that match required IDs
            const foundItems = REQUIRED_NAV_ITEMS.filter((item) => {
              try {
                screen.getByTestId(`nav-item-${item.id}`);
                return true;
              } catch {
                return false;
              }
            });

            expect(foundItems.length).toBe(REQUIRED_NAV_ITEMS.length);

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render navigation items with SVG icons for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            // Each navigation item should contain an SVG icon
            for (const item of REQUIRED_NAV_ITEMS) {
              const navItem = screen.getByTestId(`nav-item-${item.id}`);
              const svg = navItem.querySelector('svg');
              expect(svg).toBeInTheDocument();
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain navigation item presence across multiple renders with different states', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(sidebarPropsArbitrary, authStateArbitrary, uiStateArbitrary, navigationStateArbitrary),
            { minLength: 2, maxLength: 5 }
          ),
          (stateConfigs) => {
            for (const [props, authState, uiState, navState] of stateConfigs) {
              setupMocks(uiState, authState, navState);
              const { unmount } = renderSidebar(props);

              // All required navigation items should be present for each state
              for (const item of REQUIRED_NAV_ITEMS) {
                expect(screen.getByTestId(`nav-item-${item.id}`)).toBeInTheDocument();
              }

              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should render sidebar with proper accessibility attributes for any state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            // Use getByRole to find the sidebar since testId may be empty string
            const sidebar = screen.getByRole('complementary', { name: 'Main navigation' });
            expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
            expect(sidebar.tagName.toLowerCase()).toBe('aside');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render logo at the top for any sidebar state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { unmount } = renderSidebar(props);

            const logo = screen.getByTestId('sidebar-logo');
            expect(logo).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have navigation items in correct sections (top/bottom) for any state', () => {
      fc.assert(
        fc.property(
          sidebarPropsArbitrary,
          authStateArbitrary,
          uiStateArbitrary,
          navigationStateArbitrary,
          (props, authState, uiState, navState) => {
            setupMocks(uiState, authState, navState);
            const { container, unmount } = renderSidebar(props);

            // Top section items: layers, discover, random, settings
            const topSection = container.querySelector('[aria-label="Primary navigation"]');
            expect(topSection).toBeInTheDocument();
            expect(topSection?.querySelector('[data-testid="nav-item-layers"]')).toBeInTheDocument();
            expect(topSection?.querySelector('[data-testid="nav-item-discover"]')).toBeInTheDocument();
            expect(topSection?.querySelector('[data-testid="nav-item-random"]')).toBeInTheDocument();
            expect(topSection?.querySelector('[data-testid="nav-item-settings"]')).toBeInTheDocument();

            // Bottom section items: pro, collections, play, help, logout
            const bottomSection = container.querySelector('[aria-label="Secondary navigation"]');
            expect(bottomSection).toBeInTheDocument();
            expect(bottomSection?.querySelector('[data-testid="nav-item-pro"]')).toBeInTheDocument();
            expect(bottomSection?.querySelector('[data-testid="nav-item-collections"]')).toBeInTheDocument();
            expect(bottomSection?.querySelector('[data-testid="nav-item-play"]')).toBeInTheDocument();
            expect(bottomSection?.querySelector('[data-testid="nav-item-help"]')).toBeInTheDocument();
            expect(bottomSection?.querySelector('[data-testid="nav-item-logout"]')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
