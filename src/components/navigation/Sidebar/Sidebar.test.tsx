/**
 * Sidebar Component Unit Tests
 *
 * Tests for sidebar rendering, navigation items, and responsive behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
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

describe('Sidebar', () => {
  const mockToggleDrawer = vi.fn();
  const mockClearUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseUIStore.mockReturnValue({ theme: 'light' });
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      username: null,
      avatar: null,
      score: null,
      subscription: null,
      clearUser: mockClearUser,
    });
    mockUseNavigationStore.mockReturnValue({
      toggleDrawer: mockToggleDrawer,
      drawerOpen: false,
      drawerContent: null,
    });
  });

  describe('Rendering', () => {
    it('should render the sidebar', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('navigation-sidebar')).toBeInTheDocument();
    });

    it('should render with custom testId', () => {
      render(
        <MemoryRouter>
          <Sidebar testId="custom-sidebar" />
        </MemoryRouter>
      );

      expect(screen.getByTestId('custom-sidebar')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <MemoryRouter>
          <Sidebar className="custom-class" />
        </MemoryRouter>
      );

      const sidebar = screen.getByTestId('navigation-sidebar');
      expect(sidebar.className).toContain('custom-class');
    });

    it('should have aria-label for accessibility', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      const sidebar = screen.getByTestId('navigation-sidebar');
      expect(sidebar).toHaveAttribute('aria-label', 'Main navigation');
    });
  });

  describe('Logo', () => {
    it('should render the logo at the top', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('sidebar-logo')).toBeInTheDocument();
    });
  });

  describe('Navigation items', () => {
    it('should render top section navigation items', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('nav-item-layers')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-discover')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-random')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
    });

    it('should render bottom section navigation items', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('nav-item-pro')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-collections')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-play')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-help')).toBeInTheDocument();
      expect(screen.getByTestId('nav-item-logout')).toBeInTheDocument();
    });
  });

  describe('Drawer actions', () => {
    it('should toggle layers drawer when Layers button is clicked', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('nav-item-layers'));
      expect(mockToggleDrawer).toHaveBeenCalledWith('layers');
    });

    it('should toggle collections drawer when Collections button is clicked', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('nav-item-collections'));
      expect(mockToggleDrawer).toHaveBeenCalledWith('collections');
    });

    it('should show active state for Layers when drawer is open with layers content', () => {
      mockUseNavigationStore.mockReturnValue({
        toggleDrawer: mockToggleDrawer,
        drawerOpen: true,
        drawerContent: 'layers',
      });

      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      const layersButton = screen.getByTestId('nav-item-layers');
      expect(layersButton.className).toContain('active');
    });
  });

  describe('Open/Close state', () => {
    it('should have open class when isOpen is true', () => {
      render(
        <MemoryRouter>
          <Sidebar isOpen={true} />
        </MemoryRouter>
      );

      const sidebar = screen.getByTestId('navigation-sidebar');
      expect(sidebar.className).toContain('open');
    });

    it('should have closed class when isOpen is false', () => {
      render(
        <MemoryRouter>
          <Sidebar isOpen={false} />
        </MemoryRouter>
      );

      const sidebar = screen.getByTestId('navigation-sidebar');
      expect(sidebar.className).toContain('closed');
    });
  });

  describe('Toggle button', () => {
    it('should render toggle button when onToggle is provided', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter>
          <Sidebar onToggle={handleToggle} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    });

    it('should not render toggle button when onToggle is not provided', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
    });

    it('should call onToggle when toggle button is clicked', () => {
      const handleToggle = vi.fn();
      render(
        <MemoryRouter>
          <Sidebar onToggle={handleToggle} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByTestId('sidebar-toggle'));
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('User avatar', () => {
    it('should render user avatar when authenticated', () => {
      mockUseAuthStore.mockReturnValue({
        isAuthenticated: true,
        username: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
        score: 100,
        subscription: null,
        clearUser: mockClearUser,
      });

      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.getByTestId('sidebar-user-avatar')).toBeInTheDocument();
    });

    it('should not render user avatar when not authenticated', () => {
      render(
        <MemoryRouter>
          <Sidebar />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('sidebar-user-avatar')).not.toBeInTheDocument();
    });
  });
});
