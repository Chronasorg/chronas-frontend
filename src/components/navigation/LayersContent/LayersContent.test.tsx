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
import { useTimelineStore, type EpicType } from '@/stores/timelineStore';

// Mock the mapStore
vi.mock('@/stores/mapStore', async () => {
  const actual = await vi.importActual('@/stores/mapStore');
  return {
    ...actual,
    useMapStore: vi.fn(),
  };
});

// Mock the timelineStore
vi.mock('@/stores/timelineStore', async () => {
  const actual = await vi.importActual('@/stores/timelineStore');
  return {
    ...actual,
    useTimelineStore: vi.fn(),
  };
});

describe('LayersContent', () => {
  // Default mock state for mapStore
  const mockMapState = {
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
    // Layer control state from mapStore (Requirement 1.1, 2.1, 3.1, 4.1, 5.1)
    basemap: 'topographic' as const,
    showProvinceBorders: true,
    populationOpacity: false,
    markerLimit: 5000,
    clusterMarkers: false,
    // Actions
    setActiveColor: vi.fn(),
    setActiveLabel: vi.fn(),
    setColorLabelLocked: vi.fn(),
    setMarkerFilter: vi.fn(),
    setBasemap: vi.fn(),
    setShowProvinceBorders: vi.fn(),
    setPopulationOpacity: vi.fn(),
    setMarkerLimit: vi.fn(),
    setClusterMarkers: vi.fn(),
  };

  // Default mock state for timelineStore (Requirement 7.1, 7.2, 7.5)
  const mockTimelineState = {
    epicFilters: {
      war: true,
      empire: true,
      religion: true,
      culture: true,
      person: true,
      other: true,
    } as Record<EpicType, boolean>,
    // Actions
    setEpicFilter: vi.fn(),
    setAllEpicFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup mapStore mock implementation
    (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof mockMapState) => unknown) => {
      return selector(mockMapState);
    });
    // Setup timelineStore mock implementation
    (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: (state: typeof mockTimelineState) => unknown) => {
      return selector(mockTimelineState);
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
      
      expect(mockMapState.setActiveColor).toHaveBeenCalledWith('culture');
    });

    it('should call setActiveLabel when label dimension changes', () => {
      render(<LayersContent />);
      
      const cultureLabel = screen.getByTestId('label-radio-culture');
      fireEvent.click(cultureLabel);
      
      expect(mockMapState.setActiveLabel).toHaveBeenCalledWith('culture');
    });

    it('should call setColorLabelLocked when lock is toggled', () => {
      render(<LayersContent />);
      
      const lockToggle = screen.getByTestId('lock-toggle');
      fireEvent.click(lockToggle);
      
      expect(mockMapState.setColorLabelLocked).toHaveBeenCalledWith(false);
    });
  });

  describe('Marker Filters', () => {
    it('should render marker filter controls', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('marker-filters')).toBeInTheDocument();
    });

    it('should render all marker type checkboxes', () => {
      render(<LayersContent />);
      
      // Use API marker type codes
      expect(screen.getByTestId('marker-filter-b')).toBeInTheDocument();    // Battle
      expect(screen.getByTestId('marker-filter-c')).toBeInTheDocument();    // City
      expect(screen.getByTestId('marker-filter-cp')).toBeInTheDocument();   // Capital
      expect(screen.getByTestId('marker-filter-p')).toBeInTheDocument();    // Politician
      expect(screen.getByTestId('marker-filter-e')).toBeInTheDocument();    // Explorer
      expect(screen.getByTestId('marker-filter-o')).toBeInTheDocument();    // Unknown/Other
    });

    it('should render toggle all button', () => {
      render(<LayersContent />);
      expect(screen.getByTestId('toggle-all-markers')).toBeInTheDocument();
    });

    it('should call setMarkerFilter when checkbox is toggled', () => {
      render(<LayersContent />);
      
      // Use API marker type code 'b' for battle
      const battleCheckbox = within(screen.getByTestId('marker-filter-b')).getByRole('checkbox');
      fireEvent.click(battleCheckbox);
      
      expect(mockMapState.setMarkerFilter).toHaveBeenCalledWith('b', false);
    });

    it('should toggle all markers when toggle all button is clicked', () => {
      render(<LayersContent />);
      
      const toggleAllButton = screen.getByTestId('toggle-all-markers');
      fireEvent.click(toggleAllButton);
      
      // Should call setMarkerFilter for each type with false (since all are currently true)
      // We now have 16 marker types
      expect(mockMapState.setMarkerFilter).toHaveBeenCalledTimes(16);
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
      
      // Use API marker type code 'b' for battle
      const battleCheckbox = within(screen.getByTestId('marker-filter-b')).getByRole('checkbox');
      expect(battleCheckbox).toHaveAttribute('aria-label');
    });

    it('should have accessible slider', () => {
      render(<LayersContent />);
      
      const slider = screen.getByTestId('marker-limit-slider');
      expect(slider).toHaveAttribute('aria-label');
    });
  });

  /**
   * Layer Control Store Integration Tests
   *
   * Tests that verify UI controls are properly wired to mapStore actions
   * and that UI reflects store state correctly.
   *
   * Requirements: 1.1, 2.1, 3.1, 4.1, 5.1
   */
  describe('Layer Control Store Integration', () => {
    /**
     * Basemap Selection Tests (Requirement 1.1)
     *
     * Verifies that:
     * - Basemap select displays current store value
     * - Changing basemap calls setBasemap action
     */
    describe('Basemap Selection (Requirement 1.1)', () => {
      it('should display current basemap value from store', () => {
        render(<LayersContent />);
        
        // Expand advanced section to access basemap select
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const basemapSelect = screen.getByTestId('basemap-select');
        expect(basemapSelect).toHaveValue('topographic');
      });

      it('should display watercolor when store has watercolor basemap', () => {
        // Update mock state to have watercolor basemap
        const watercolorState = { ...mockMapState, basemap: 'watercolor' as 'topographic' | 'watercolor' | 'none' };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof watercolorState) => unknown) => selector(watercolorState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const basemapSelect = screen.getByTestId('basemap-select');
        expect(basemapSelect).toHaveValue('watercolor');
      });

      it('should display none when store has none basemap', () => {
        // Update mock state to have none basemap
        const noneState = { ...mockMapState, basemap: 'none' as 'topographic' | 'watercolor' | 'none' };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof noneState) => unknown) => selector(noneState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const basemapSelect = screen.getByTestId('basemap-select');
        expect(basemapSelect).toHaveValue('none');
      });

      it('should call setBasemap action when basemap is changed to watercolor', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const basemapSelect = screen.getByTestId('basemap-select');
        fireEvent.change(basemapSelect, { target: { value: 'watercolor' } });
        
        expect(mockMapState.setBasemap).toHaveBeenCalledWith('watercolor');
      });

      it('should call setBasemap action when basemap is changed to none', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const basemapSelect = screen.getByTestId('basemap-select');
        fireEvent.change(basemapSelect, { target: { value: 'none' } });
        
        expect(mockMapState.setBasemap).toHaveBeenCalledWith('none');
      });
    });

    /**
     * Province Borders Toggle Tests (Requirement 2.1)
     *
     * Verifies that:
     * - Show provinces checkbox reflects store state
     * - Toggling calls setShowProvinceBorders action
     */
    describe('Province Borders Toggle (Requirement 2.1)', () => {
      it('should reflect store state when showProvinceBorders is true', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('show-provinces-toggle')).getByRole('checkbox');
        expect(checkbox).toBeChecked();
      });

      it('should reflect store state when showProvinceBorders is false', () => {
        // Update mock state to have showProvinceBorders false
        const hiddenBordersState = { ...mockMapState, showProvinceBorders: false };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(hiddenBordersState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('show-provinces-toggle')).getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
      });

      it('should call setShowProvinceBorders(false) when unchecking', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('show-provinces-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(mockMapState.setShowProvinceBorders).toHaveBeenCalledWith(false);
      });

      it('should call setShowProvinceBorders(true) when checking', () => {
        // Update mock state to have showProvinceBorders false
        const hiddenBordersState = { ...mockMapState, showProvinceBorders: false };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(hiddenBordersState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('show-provinces-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(hiddenBordersState.setShowProvinceBorders).toHaveBeenCalledWith(true);
      });
    });

    /**
     * Population Opacity Toggle Tests (Requirement 3.1)
     *
     * Verifies that:
     * - Pop opacity checkbox reflects store state
     * - Toggling calls setPopulationOpacity action
     */
    describe('Population Opacity Toggle (Requirement 3.1)', () => {
      it('should reflect store state when populationOpacity is false', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('pop-opacity-toggle')).getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
      });

      it('should reflect store state when populationOpacity is true', () => {
        // Update mock state to have populationOpacity true
        const opacityEnabledState = { ...mockMapState, populationOpacity: true };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(opacityEnabledState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('pop-opacity-toggle')).getByRole('checkbox');
        expect(checkbox).toBeChecked();
      });

      it('should call setPopulationOpacity(true) when checking', () => {
        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('pop-opacity-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(mockMapState.setPopulationOpacity).toHaveBeenCalledWith(true);
      });

      it('should call setPopulationOpacity(false) when unchecking', () => {
        // Update mock state to have populationOpacity true
        const opacityEnabledState = { ...mockMapState, populationOpacity: true };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(opacityEnabledState)
        );

        render(<LayersContent />);
        
        // Expand advanced section
        fireEvent.click(screen.getByTestId('advanced-section-toggle'));
        
        const checkbox = within(screen.getByTestId('pop-opacity-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(opacityEnabledState.setPopulationOpacity).toHaveBeenCalledWith(false);
      });
    });

    /**
     * Marker Limit Slider Tests (Requirement 4.1)
     *
     * Verifies that:
     * - Slider displays current store value
     * - Changing slider calls setMarkerLimit action
     */
    describe('Marker Limit Slider (Requirement 4.1)', () => {
      it('should display current marker limit value from store', () => {
        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        expect(slider).toHaveValue('5000');
      });

      it('should display different marker limit values from store', () => {
        // Update mock state to have different marker limit
        const lowLimitState = { ...mockMapState, markerLimit: 1000 };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(lowLimitState)
        );

        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        expect(slider).toHaveValue('1000');
      });

      it('should display zero marker limit from store', () => {
        // Update mock state to have zero marker limit
        const zeroLimitState = { ...mockMapState, markerLimit: 0 };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(zeroLimitState)
        );

        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        expect(slider).toHaveValue('0');
      });

      it('should display max marker limit from store', () => {
        // Update mock state to have max marker limit
        const maxLimitState = { ...mockMapState, markerLimit: 10000 };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(maxLimitState)
        );

        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        expect(slider).toHaveValue('10000');
      });

      it('should call setMarkerLimit action when slider value changes', () => {
        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        fireEvent.change(slider, { target: { value: '3000' } });
        
        expect(mockMapState.setMarkerLimit).toHaveBeenCalledWith(3000);
      });

      it('should call setMarkerLimit with zero when slider is set to minimum', () => {
        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        fireEvent.change(slider, { target: { value: '0' } });
        
        expect(mockMapState.setMarkerLimit).toHaveBeenCalledWith(0);
      });

      it('should call setMarkerLimit with max when slider is set to maximum', () => {
        render(<LayersContent />);
        
        const slider = screen.getByTestId('marker-limit-slider');
        fireEvent.change(slider, { target: { value: '10000' } });
        
        expect(mockMapState.setMarkerLimit).toHaveBeenCalledWith(10000);
      });
    });

    /**
     * Cluster Markers Toggle Tests (Requirement 5.1)
     *
     * Verifies that:
     * - Cluster checkbox reflects store state
     * - Toggling calls setClusterMarkers action
     */
    describe('Cluster Markers Toggle (Requirement 5.1)', () => {
      it('should reflect store state when clusterMarkers is false', () => {
        render(<LayersContent />);
        
        const checkbox = within(screen.getByTestId('cluster-markers-toggle')).getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
      });

      it('should reflect store state when clusterMarkers is true', () => {
        // Update mock state to have clusterMarkers true
        const clusterEnabledState = { ...mockMapState, clusterMarkers: true };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(clusterEnabledState)
        );

        render(<LayersContent />);
        
        const checkbox = within(screen.getByTestId('cluster-markers-toggle')).getByRole('checkbox');
        expect(checkbox).toBeChecked();
      });

      it('should call setClusterMarkers(true) when checking', () => {
        render(<LayersContent />);
        
        const checkbox = within(screen.getByTestId('cluster-markers-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(mockMapState.setClusterMarkers).toHaveBeenCalledWith(true);
      });

      it('should call setClusterMarkers(false) when unchecking', () => {
        // Update mock state to have clusterMarkers true
        const clusterEnabledState = { ...mockMapState, clusterMarkers: true };
        (useMapStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockMapState) => unknown) => selector(clusterEnabledState)
        );

        render(<LayersContent />);
        
        const checkbox = within(screen.getByTestId('cluster-markers-toggle')).getByRole('checkbox');
        fireEvent.click(checkbox);
        
        expect(clusterEnabledState.setClusterMarkers).toHaveBeenCalledWith(false);
      });
    });
  });

  /**
   * Epics Section Tests
   *
   * Tests for the Epics collapsible section including:
   * - Toggle rendering for each epic type
   * - Check All / Uncheck All functionality
   *
   * Requirements: 7.1, 7.2, 7.5
   */
  describe('Epics Section (Requirements 7.1, 7.2, 7.5)', () => {
    /**
     * Epics Section Rendering Tests (Requirement 7.1)
     *
     * Verifies that:
     * - Epics section is rendered as a collapsible section
     * - Epics section is expanded by default
     */
    describe('Epics Section Rendering (Requirement 7.1)', () => {
      it('should render Epics section', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epics-section')).toBeInTheDocument();
      });

      it('should render Epics section expanded by default', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epics-section-content')).toBeInTheDocument();
      });

      it('should collapse Epics section when toggle is clicked', () => {
        render(<LayersContent />);
        
        const toggleButton = screen.getByTestId('epics-section-toggle');
        fireEvent.click(toggleButton);
        
        expect(screen.queryByTestId('epics-section-content')).not.toBeInTheDocument();
      });

      it('should expand Epics section when toggle is clicked again', () => {
        render(<LayersContent />);
        
        const toggleButton = screen.getByTestId('epics-section-toggle');
        // Collapse
        fireEvent.click(toggleButton);
        expect(screen.queryByTestId('epics-section-content')).not.toBeInTheDocument();
        
        // Expand
        fireEvent.click(toggleButton);
        expect(screen.getByTestId('epics-section-content')).toBeInTheDocument();
      });

      it('should have accessible toggle button with aria-expanded', () => {
        render(<LayersContent />);
        
        const toggleButton = screen.getByTestId('epics-section-toggle');
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        
        fireEvent.click(toggleButton);
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
      });

      it('should render epic filters container', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filters')).toBeInTheDocument();
      });
    });

    /**
     * Epic Type Toggle Rendering Tests (Requirement 7.2)
     *
     * Verifies that:
     * - All epic type toggles are rendered (war, empire, religion, culture, person, other)
     * - Each toggle has correct label and icon
     */
    describe('Epic Type Toggle Rendering (Requirement 7.2)', () => {
      it('should render toggle for war epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-war')).toBeInTheDocument();
      });

      it('should render toggle for empire epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-empire')).toBeInTheDocument();
      });

      it('should render toggle for religion epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-religion')).toBeInTheDocument();
      });

      it('should render toggle for culture epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-culture')).toBeInTheDocument();
      });

      it('should render toggle for person epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-person')).toBeInTheDocument();
      });

      it('should render toggle for other epic type', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('epic-filter-other')).toBeInTheDocument();
      });

      it('should render all six epic type toggles', () => {
        render(<LayersContent />);
        
        const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
        epicTypes.forEach((type) => {
          expect(screen.getByTestId(`epic-filter-${type}`)).toBeInTheDocument();
        });
      });

      it('should render checkboxes for each epic type', () => {
        render(<LayersContent />);
        
        const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
        epicTypes.forEach((type) => {
          const checkbox = within(screen.getByTestId(`epic-filter-${type}`)).getByRole('checkbox');
          expect(checkbox).toBeInTheDocument();
        });
      });

      it('should have accessible labels for epic checkboxes', () => {
        render(<LayersContent />);
        
        const warCheckbox = within(screen.getByTestId('epic-filter-war')).getByRole('checkbox');
        expect(warCheckbox).toHaveAttribute('aria-label', 'Show Wars epics');
        
        const empireCheckbox = within(screen.getByTestId('epic-filter-empire')).getByRole('checkbox');
        expect(empireCheckbox).toHaveAttribute('aria-label', 'Show Empires epics');
      });
    });

    /**
     * Epic Filter State Tests (Requirement 7.2)
     *
     * Verifies that:
     * - Checkboxes reflect store state
     * - Toggling calls setEpicFilter action
     */
    describe('Epic Filter State (Requirement 7.2)', () => {
      it('should reflect store state when all epic filters are enabled', () => {
        render(<LayersContent />);
        
        const epicTypes = ['war', 'empire', 'religion', 'culture', 'person', 'other'];
        epicTypes.forEach((type) => {
          const checkbox = within(screen.getByTestId(`epic-filter-${type}`)).getByRole('checkbox');
          expect(checkbox).toBeChecked();
        });
      });

      it('should reflect store state when war filter is disabled', () => {
        // Update mock state to have war filter disabled
        const warDisabledState = {
          ...mockTimelineState,
          epicFilters: { ...mockTimelineState.epicFilters, war: false },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(warDisabledState)
        );

        render(<LayersContent />);
        
        const warCheckbox = within(screen.getByTestId('epic-filter-war')).getByRole('checkbox');
        expect(warCheckbox).not.toBeChecked();
        
        // Other checkboxes should still be checked
        const empireCheckbox = within(screen.getByTestId('epic-filter-empire')).getByRole('checkbox');
        expect(empireCheckbox).toBeChecked();
      });

      it('should reflect store state when multiple filters are disabled', () => {
        // Update mock state to have multiple filters disabled
        const multiDisabledState = {
          ...mockTimelineState,
          epicFilters: {
            war: false,
            empire: false,
            religion: true,
            culture: true,
            person: false,
            other: true,
          },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(multiDisabledState)
        );

        render(<LayersContent />);
        
        expect(within(screen.getByTestId('epic-filter-war')).getByRole('checkbox')).not.toBeChecked();
        expect(within(screen.getByTestId('epic-filter-empire')).getByRole('checkbox')).not.toBeChecked();
        expect(within(screen.getByTestId('epic-filter-religion')).getByRole('checkbox')).toBeChecked();
        expect(within(screen.getByTestId('epic-filter-culture')).getByRole('checkbox')).toBeChecked();
        expect(within(screen.getByTestId('epic-filter-person')).getByRole('checkbox')).not.toBeChecked();
        expect(within(screen.getByTestId('epic-filter-other')).getByRole('checkbox')).toBeChecked();
      });

      it('should call setEpicFilter when war checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const warCheckbox = within(screen.getByTestId('epic-filter-war')).getByRole('checkbox');
        fireEvent.click(warCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('war', false);
      });

      it('should call setEpicFilter when empire checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const empireCheckbox = within(screen.getByTestId('epic-filter-empire')).getByRole('checkbox');
        fireEvent.click(empireCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('empire', false);
      });

      it('should call setEpicFilter when religion checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const religionCheckbox = within(screen.getByTestId('epic-filter-religion')).getByRole('checkbox');
        fireEvent.click(religionCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('religion', false);
      });

      it('should call setEpicFilter when culture checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const cultureCheckbox = within(screen.getByTestId('epic-filter-culture')).getByRole('checkbox');
        fireEvent.click(cultureCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('culture', false);
      });

      it('should call setEpicFilter when person checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const personCheckbox = within(screen.getByTestId('epic-filter-person')).getByRole('checkbox');
        fireEvent.click(personCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('person', false);
      });

      it('should call setEpicFilter when other checkbox is toggled off', () => {
        render(<LayersContent />);
        
        const otherCheckbox = within(screen.getByTestId('epic-filter-other')).getByRole('checkbox');
        fireEvent.click(otherCheckbox);
        
        expect(mockTimelineState.setEpicFilter).toHaveBeenCalledWith('other', false);
      });

      it('should call setEpicFilter with true when enabling a disabled filter', () => {
        // Update mock state to have war filter disabled
        const warDisabledState = {
          ...mockTimelineState,
          epicFilters: { ...mockTimelineState.epicFilters, war: false },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(warDisabledState)
        );

        render(<LayersContent />);
        
        const warCheckbox = within(screen.getByTestId('epic-filter-war')).getByRole('checkbox');
        fireEvent.click(warCheckbox);
        
        expect(warDisabledState.setEpicFilter).toHaveBeenCalledWith('war', true);
      });
    });

    /**
     * Check All / Uncheck All Tests (Requirement 7.5)
     *
     * Verifies that:
     * - Toggle all button is rendered
     * - Clicking toggle all calls setAllEpicFilters with correct value
     * - Button text changes based on current state
     */
    describe('Check All / Uncheck All (Requirement 7.5)', () => {
      it('should render toggle all button', () => {
        render(<LayersContent />);
        expect(screen.getByTestId('toggle-all-epics')).toBeInTheDocument();
      });

      it('should display "Uncheck All" when all filters are enabled', () => {
        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        expect(toggleAllButton).toHaveTextContent('Uncheck All');
      });

      it('should display "Check All" when any filter is disabled', () => {
        // Update mock state to have one filter disabled
        const oneDisabledState = {
          ...mockTimelineState,
          epicFilters: { ...mockTimelineState.epicFilters, war: false },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(oneDisabledState)
        );

        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        expect(toggleAllButton).toHaveTextContent('Check All');
      });

      it('should display "Check All" when all filters are disabled', () => {
        // Update mock state to have all filters disabled
        const allDisabledState = {
          ...mockTimelineState,
          epicFilters: {
            war: false,
            empire: false,
            religion: false,
            culture: false,
            person: false,
            other: false,
          },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(allDisabledState)
        );

        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        expect(toggleAllButton).toHaveTextContent('Check All');
      });

      it('should call setAllEpicFilters(false) when clicking "Uncheck All"', () => {
        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        fireEvent.click(toggleAllButton);
        
        expect(mockTimelineState.setAllEpicFilters).toHaveBeenCalledWith(false);
      });

      it('should call setAllEpicFilters(true) when clicking "Check All"', () => {
        // Update mock state to have one filter disabled
        const oneDisabledState = {
          ...mockTimelineState,
          epicFilters: { ...mockTimelineState.epicFilters, war: false },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(oneDisabledState)
        );

        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        fireEvent.click(toggleAllButton);
        
        expect(oneDisabledState.setAllEpicFilters).toHaveBeenCalledWith(true);
      });

      it('should call setAllEpicFilters(true) when all filters are disabled and clicking "Check All"', () => {
        // Update mock state to have all filters disabled
        const allDisabledState = {
          ...mockTimelineState,
          epicFilters: {
            war: false,
            empire: false,
            religion: false,
            culture: false,
            person: false,
            other: false,
          },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(allDisabledState)
        );

        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        fireEvent.click(toggleAllButton);
        
        expect(allDisabledState.setAllEpicFilters).toHaveBeenCalledWith(true);
      });

      it('should have accessible aria-label for toggle all button when showing "Uncheck All"', () => {
        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        expect(toggleAllButton).toHaveAttribute('aria-label', 'Uncheck all epic types');
      });

      it('should have accessible aria-label for toggle all button when showing "Check All"', () => {
        // Update mock state to have one filter disabled
        const oneDisabledState = {
          ...mockTimelineState,
          epicFilters: { ...mockTimelineState.epicFilters, war: false },
        };
        (useTimelineStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
          (selector: (state: typeof mockTimelineState) => unknown) => selector(oneDisabledState)
        );

        render(<LayersContent />);
        
        const toggleAllButton = screen.getByTestId('toggle-all-epics');
        expect(toggleAllButton).toHaveAttribute('aria-label', 'Check all epic types');
      });
    });
  });
});
