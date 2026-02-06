/**
 * LayersContent Component Tests
 *
 * Unit tests for the LayersContent component including:
 * - Section expansion/collapse
 * - LayerToggle integration
 * - Marker filter controls
 * - Advanced settings
 *
 * Requirements: 6.8, 7.6, 7.7, 7.8, 7.10, 7.11, 7.15, 7.16, 7.17, 7.19
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { LayersContent } from './LayersContent';
import { useMapStore } from '@/stores/mapStore';

// Mock the mapStore
vi.mock('@/stores/mapStore', async () => {
  const actual = await vi.importActual('@/stores/mapStore');
  return {
    ...actual,
    useMapStore: vi.fn(),
  };
});

describe('LayersContent', () => {
  // Default mock state
  const mockState = {
    activeColor: 'ruler' as const,
    activeLabel: 'ruler' as const,
    colorLabelLocked: true,
    markerFilters: {
      battle: true,
      city: true,
      capital: true,
      person: true,
      event: true,
      other: true,
    },
    setActiveColor: vi.fn(),
    setActiveLabel: vi.fn(),
    setColorLabelLocked: vi.fn(),
    setMarkerFilter: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mock implementation
    (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof mockState) => unknown) => {
      return selector(mockState);
    });
  });

  describe('Rendering', () => {
    it('should render the layers content container', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('layers-content')).toBeInTheDocument();
    });

    it('should render General section expanded by default', () => {
      render(<LayersContent />);
      const generalSection = screen.getByTestId('general-section');
      expect(generalSection).toBeInTheDocument();
      expect(screen.getByTestId('general-section-content')).toBeInTheDocument();
    });

    it('should render Area subsection expanded by default', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('area-section-content')).toBeInTheDocument();
    });

    it('should render Markers subsection expanded by default', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('markers-section-content')).toBeInTheDocument();
    });

    it('should render Advanced section collapsed by default', () => {
      render(<LayersContent />);
      const advancedSection = screen.getByTestId('advanced-section');
      expect(advancedSection).toBeInTheDocument();
      expect(screen.queryByTestId('advanced-section-content')).not.toBeInTheDocument();
    });
  });

  describe('Section Expansion/Collapse', () => {
    it('should collapse General section when toggle is clicked', () => {
      render(<LayersContent />);
      
      const toggleButton = screen.getByTestId('general-section-toggle');
      fireEvent.click(toggleButton);
      
      expect(screen.queryByTestId('general-section-content')).not.toBeInTheDocument();
    });

    it('should expand Advanced section when toggle is clicked', () => {
      render(<LayersContent />);
      
      const toggleButton = screen.getByTestId('advanced-section-toggle');
      fireEvent.click(toggleButton);
      
      expect(screen.getByTestId('advanced-section-content')).toBeInTheDocument();
    });

    it('should toggle aria-expanded attribute on section headers', () => {
      render(<LayersContent />);
      
      const generalToggle = screen.getByTestId('general-section-toggle');
      expect(generalToggle).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(generalToggle);
      expect(generalToggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('LayerToggle Integration', () => {
    it('should render LayerToggle component in Area section', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();
    });

    it('should pass activeColor to LayerToggle', () => {
      render(<LayersContent />);
      // The ruler radio should be selected
      const rulerRadio = screen.getByTestId('area-radio-ruler');
      expect(rulerRadio).toHaveAttribute('aria-checked', 'true');
    });

    it('should call setActiveColor when color dimension changes', () => {
      render(<LayersContent />);
      
      const cultureRadio = screen.getByTestId('area-radio-culture');
      fireEvent.click(cultureRadio);
      
      expect(mockState.setActiveColor).toHaveBeenCalledWith('culture');
    });

    it('should call setActiveLabel when label dimension changes', () => {
      render(<LayersContent />);
      
      const cultureLabel = screen.getByTestId('label-radio-culture');
      fireEvent.click(cultureLabel);
      
      expect(mockState.setActiveLabel).toHaveBeenCalledWith('culture');
    });

    it('should call setColorLabelLocked when lock is toggled', () => {
      render(<LayersContent />);
      
      const lockToggle = screen.getByTestId('lock-toggle');
      fireEvent.click(lockToggle);
      
      expect(mockState.setColorLabelLocked).toHaveBeenCalledWith(false);
    });
  });

  describe('Marker Filters', () => {
    it('should render marker filter controls', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('marker-filters')).toBeInTheDocument();
    });

    it('should render all marker type checkboxes', () => {
      render(<LayersContent />);
      
      expect(screen.getByTestId('marker-filter-battle')).toBeInTheDocument();
      expect(screen.getByTestId('marker-filter-city')).toBeInTheDocument();
      expect(screen.getByTestId('marker-filter-capital')).toBeInTheDocument();
      expect(screen.getByTestId('marker-filter-person')).toBeInTheDocument();
      expect(screen.getByTestId('marker-filter-event')).toBeInTheDocument();
      expect(screen.getByTestId('marker-filter-other')).toBeInTheDocument();
    });

    it('should render toggle all button', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('toggle-all-markers')).toBeInTheDocument();
    });

    it('should call setMarkerFilter when checkbox is toggled', () => {
      render(<LayersContent />);
      
      const battleCheckbox = within(screen.getByTestId('marker-filter-battle')).getByRole('checkbox');
      fireEvent.click(battleCheckbox);
      
      expect(mockState.setMarkerFilter).toHaveBeenCalledWith('battle', false);
    });

    it('should toggle all markers when toggle all button is clicked', () => {
      render(<LayersContent />);
      
      const toggleAllButton = screen.getByTestId('toggle-all-markers');
      fireEvent.click(toggleAllButton);
      
      // Should call setMarkerFilter for each type with false (since all are currently true)
      expect(mockState.setMarkerFilter).toHaveBeenCalledTimes(6);
    });

    it('should render marker limit slider', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('marker-limit-slider')).toBeInTheDocument();
    });

    it('should render cluster markers toggle', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('cluster-markers-toggle')).toBeInTheDocument();
    });
  });

  describe('Advanced Settings', () => {
    it('should render advanced settings when section is expanded', () => {
      render(<LayersContent />);
      
      // Expand advanced section
      const toggleButton = screen.getByTestId('advanced-section-toggle');
      fireEvent.click(toggleButton);
      
      expect(screen.getByTestId('advanced-settings')).toBeInTheDocument();
    });

    it('should render basemap select', () => {
      render(<LayersContent />);
      
      // Expand advanced section
      fireEvent.click(screen.getByTestId('advanced-section-toggle'));
      
      expect(screen.getByTestId('basemap-select')).toBeInTheDocument();
    });

    it('should render show provinces toggle', () => {
      render(<LayersContent />);
      
      // Expand advanced section
      fireEvent.click(screen.getByTestId('advanced-section-toggle'));
      
      expect(screen.getByTestId('show-provinces-toggle')).toBeInTheDocument();
    });

    it('should render opacity by population toggle', () => {
      render(<LayersContent />);
      
      // Expand advanced section
      fireEvent.click(screen.getByTestId('advanced-section-toggle'));
      
      expect(screen.getByTestId('pop-opacity-toggle')).toBeInTheDocument();
    });

    it('should have basemap options', () => {
      render(<LayersContent />);
      
      // Expand advanced section
      fireEvent.click(screen.getByTestId('advanced-section-toggle'));
      
      const select = screen.getByTestId('basemap-select');
      expect(select).toHaveValue('topographic');
      
      // Check options exist
      const options = within(select).getAllByRole('option');
      expect(options).toHaveLength(3);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible section headers', () => {
      render(<LayersContent />);
      
      const generalToggle = screen.getByTestId('general-section-toggle');
      expect(generalToggle).toHaveAttribute('aria-expanded');
      expect(generalToggle).toHaveAttribute('aria-controls');
    });

    it('should have accessible marker checkboxes', () => {
      render(<LayersContent />);
      
      const battleCheckbox = within(screen.getByTestId('marker-filter-battle')).getByRole('checkbox');
      expect(battleCheckbox).toHaveAttribute('aria-label');
    });

    it('should have accessible slider', () => {
      render(<LayersContent />);
      
      const slider = screen.getByTestId('marker-limit-slider');
      expect(slider).toHaveAttribute('aria-label');
    });
  });
});
