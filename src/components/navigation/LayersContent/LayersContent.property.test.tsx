/**
 * LayersContent Property-Based Tests
 *
 * **Feature: mvp-visual-polish, Property 3: Layers Panel Structure Completeness**
 * **Validates: Requirements 2.3**
 *
 * Property tests verify that for any click on the Layers icon, the expanded Layers_Panel
 * SHALL contain all required sections:
 * - "LAYERS" header
 * - "GENERAL" section
 * - "Area" section with Area/Label toggles
 * - Dimension radio options (Ruler/Culture/Religion/Religion Gen./Population)
 * - "Markers" section with marker type checkboxes
 * - Marker Limit slider
 * - Cluster Marker toggle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import * as fc from 'fast-check';
import { LayersContent, type LayersContentProps } from './LayersContent';
import { useMapStore, type AreaColorDimension, type BasemapType } from '@/stores/mapStore';
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

const mockUseMapStore = useMapStore as unknown as ReturnType<typeof vi.fn>;
const mockUseTimelineStore = useTimelineStore as unknown as ReturnType<typeof vi.fn>;

/**
 * Required dimension options as defined in Requirements 2.3
 */
const REQUIRED_DIMENSIONS: AreaColorDimension[] = [
  'ruler',
  'culture',
  'religion',
  'religionGeneral',
  'population',
];

/**
 * Required marker types that should have checkboxes
 * Using API marker type codes from the component
 */
const REQUIRED_MARKER_TYPES = [
  'ar', // Artifact
  'b',  // Battle
  'si', // Siege
  'cp', // Capital
  'c',  // City
  'ca', // Castle
  'l',  // Landmark
  'm',  // Military
  'p',  // Politician
  'e',  // Explorer
  's',  // Scientist
  'a',  // Artist
  'r',  // Religious
  'at', // Athlete
  'op', // Unclassified
  'o',  // Unknown
];

describe('LayersContent Property Tests', () => {
  /**
   * Arbitrary generator for LayersContent props
   */
  const layersContentPropsArbitrary = fc.record({
    className: fc.option(fc.string(), { nil: undefined }),
    testId: fc.option(fc.string(), { nil: undefined }),
    onClose: fc.option(fc.constant(() => { /* noop */ }), { nil: undefined }),
  }).map((props) => {
    // Filter out undefined values to satisfy exactOptionalPropertyTypes
    const result: LayersContentProps = {};
    if (props.className !== undefined) {
      result.className = props.className;
    }
    if (props.testId !== undefined) {
      result.testId = props.testId;
    }
    if (props.onClose !== undefined) {
      result.onClose = props.onClose;
    }
    return result;
  });

  /**
   * Arbitrary generator for map store state
   */
  const mapStateArbitrary = fc.record({
    activeColor: fc.constantFrom<AreaColorDimension>('ruler', 'culture', 'religion', 'religionGeneral', 'population'),
    activeLabel: fc.constantFrom<AreaColorDimension>('ruler', 'culture', 'religion', 'religionGeneral', 'population'),
    colorLabelLocked: fc.boolean(),
    basemap: fc.constantFrom<BasemapType>('topographic', 'watercolor', 'none'),
    showProvinceBorders: fc.boolean(),
    populationOpacity: fc.boolean(),
    markerLimit: fc.integer({ min: 0, max: 10000 }),
    clusterMarkers: fc.boolean(),
  });

  /**
   * Arbitrary generator for marker filters state
   */
  const markerFiltersArbitrary = fc.record(
    Object.fromEntries(REQUIRED_MARKER_TYPES.map((type) => [type, fc.boolean()]))
  );

  /**
   * Arbitrary generator for epic filters state
   */
  const epicFiltersArbitrary = fc.record({
    war: fc.boolean(),
    empire: fc.boolean(),
    religion: fc.boolean(),
    culture: fc.boolean(),
    person: fc.boolean(),
    other: fc.boolean(),
  });

  /**
   * Helper to setup mocks with given state
   */
  const setupMocks = (
    mapState: {
      activeColor: AreaColorDimension;
      activeLabel: AreaColorDimension;
      colorLabelLocked: boolean;
      basemap: BasemapType;
      showProvinceBorders: boolean;
      populationOpacity: boolean;
      markerLimit: number;
      clusterMarkers: boolean;
    },
    markerFilters: Record<string, boolean>,
    epicFilters: Record<EpicType, boolean>
  ) => {
    const mockMapState = {
      ...mapState,
      markerFilters,
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

    const mockTimelineState = {
      epicFilters,
      setEpicFilter: vi.fn(),
      setAllEpicFilters: vi.fn(),
    };

    mockUseMapStore.mockImplementation((selector: (state: typeof mockMapState) => unknown) => {
      return selector(mockMapState);
    });

    mockUseTimelineStore.mockImplementation((selector: (state: typeof mockTimelineState) => unknown) => {
      return selector(mockTimelineState);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe('Property 3: Layers Panel Structure Completeness', () => {
    /**
     * **Validates: Requirements 2.3**
     *
     * For any click on the Layers icon, the expanded Layers_Panel SHALL contain all required sections:
     * "LAYERS" header, "GENERAL" section, "Area" section with Area/Label toggles,
     * dimension radio options (Ruler/Culture/Religion/Religion Gen./Population),
     * "Markers" section with marker type checkboxes, Marker Limit slider, and Cluster Marker toggle.
     */

    it('should contain "LAYERS" header for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const header = screen.getByTestId('layers-header');
            expect(header).toBeInTheDocument();
            expect(screen.getByText('Layers')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain "GENERAL" section for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const generalSection = screen.getByTestId('general-section');
            expect(generalSection).toBeInTheDocument();
            expect(screen.getByTestId('general-section-toggle')).toHaveTextContent('GENERAL');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain "Area" section with LayerToggle for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const areaSection = screen.getByTestId('area-section');
            expect(areaSection).toBeInTheDocument();
            expect(screen.getByTestId('area-section-toggle')).toHaveTextContent('Area');
            expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Area/Label column headers in LayerToggle for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const layerToggle = screen.getByTestId('layer-toggle');
            expect(within(layerToggle).getByText('Area')).toBeInTheDocument();
            expect(within(layerToggle).getByText('Label')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain all dimension radio options (Ruler/Culture/Religion/Religion Gen./Population) for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            // Verify all dimension radio buttons are present
            for (const dimension of REQUIRED_DIMENSIONS) {
              const areaRadio = screen.getByTestId(`area-radio-${dimension}`);
              expect(areaRadio).toBeInTheDocument();
              expect(areaRadio).toHaveAttribute('role', 'radio');
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain label radio options for non-population dimensions for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            // Label radios exist for all dimensions except population
            const dimensionsWithLabels = REQUIRED_DIMENSIONS.filter((d) => d !== 'population');
            for (const dimension of dimensionsWithLabels) {
              const labelRadio = screen.getByTestId(`label-radio-${dimension}`);
              expect(labelRadio).toBeInTheDocument();
              expect(labelRadio).toHaveAttribute('role', 'radio');
            }

            // Population should NOT have a label radio
            expect(screen.queryByTestId('label-radio-population')).not.toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain "Markers" section for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const markersSection = screen.getByTestId('markers-section');
            expect(markersSection).toBeInTheDocument();
            expect(screen.getByTestId('markers-section-toggle')).toHaveTextContent('Markers');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain marker type checkboxes for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const markerFiltersContainer = screen.getByTestId('marker-filters');
            expect(markerFiltersContainer).toBeInTheDocument();

            // Verify all marker type checkboxes are present
            for (const markerType of REQUIRED_MARKER_TYPES) {
              const markerFilter = screen.getByTestId(`marker-filter-${markerType}`);
              expect(markerFilter).toBeInTheDocument();
              const checkbox = within(markerFilter).getByRole('checkbox');
              expect(checkbox).toBeInTheDocument();
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Marker Limit slider for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const slider = screen.getByTestId('marker-limit-slider');
            expect(slider).toBeInTheDocument();
            expect(slider).toHaveAttribute('type', 'range');
            expect(slider).toHaveAttribute('min', '0');
            expect(slider).toHaveAttribute('max', '10000');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain Cluster Marker toggle for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const clusterToggle = screen.getByTestId('cluster-markers-toggle');
            expect(clusterToggle).toBeInTheDocument();
            const toggle = within(clusterToggle).getByRole('switch');
            expect(toggle).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain ALL required elements for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            // 1. Layers header
            expect(screen.getByTestId('layers-header')).toBeInTheDocument();
            expect(screen.getByText('Layers')).toBeInTheDocument();

            // 2. GENERAL section
            expect(screen.getByTestId('general-section')).toBeInTheDocument();

            // 3. Area section with Area/Label toggles
            expect(screen.getByTestId('area-section')).toBeInTheDocument();
            expect(screen.getByTestId('layer-toggle')).toBeInTheDocument();

            // 4. Dimension radio options
            for (const dimension of REQUIRED_DIMENSIONS) {
              expect(screen.getByTestId(`area-radio-${dimension}`)).toBeInTheDocument();
            }

            // 5. Markers section
            expect(screen.getByTestId('markers-section')).toBeInTheDocument();

            // 6. Marker type checkboxes
            for (const markerType of REQUIRED_MARKER_TYPES) {
              expect(screen.getByTestId(`marker-filter-${markerType}`)).toBeInTheDocument();
            }

            // 7. Marker Limit slider
            expect(screen.getByTestId('marker-limit-slider')).toBeInTheDocument();

            // 8. Cluster Marker toggle
            expect(screen.getByTestId('cluster-markers-toggle')).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain structure completeness across multiple renders with different states', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              layersContentPropsArbitrary,
              mapStateArbitrary,
              markerFiltersArbitrary,
              epicFiltersArbitrary
            ),
            { minLength: 2, maxLength: 5 }
          ),
          (stateConfigs) => {
            for (const [props, mapState, markerFilters, epicFilters] of stateConfigs) {
              setupMocks(mapState, markerFilters, epicFilters);
              const { unmount } = render(<LayersContent {...props} />);

              // All required elements should be present for each state
              expect(screen.getByTestId('layers-header')).toBeInTheDocument();
              expect(screen.getByTestId('general-section')).toBeInTheDocument();
              expect(screen.getByTestId('area-section')).toBeInTheDocument();
              expect(screen.getByTestId('markers-section')).toBeInTheDocument();
              expect(screen.getByTestId('marker-limit-slider')).toBeInTheDocument();
              expect(screen.getByTestId('cluster-markers-toggle')).toBeInTheDocument();

              unmount();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have lock toggle in Area section for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const lockToggle = screen.getByTestId('lock-toggle');
            expect(lockToggle).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have toggle-all-markers button for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const toggleAllButton = screen.getByTestId('toggle-all-markers');
            expect(toggleAllButton).toBeInTheDocument();

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render with proper accessibility attributes for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            // Section toggles should have aria-expanded
            const generalToggle = screen.getByTestId('general-section-toggle');
            expect(generalToggle).toHaveAttribute('aria-expanded');

            const areaToggle = screen.getByTestId('area-section-toggle');
            expect(areaToggle).toHaveAttribute('aria-expanded');

            const markersToggle = screen.getByTestId('markers-section-toggle');
            expect(markersToggle).toHaveAttribute('aria-expanded');

            // Slider should have aria-label
            const slider = screen.getByTestId('marker-limit-slider');
            expect(slider).toHaveAttribute('aria-label');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect marker limit value from store for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const slider = screen.getByTestId('marker-limit-slider');
            expect(slider).toHaveValue(String(mapState.markerLimit));

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect cluster markers state from store for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const clusterToggle = screen.getByTestId('cluster-markers-toggle');
            const toggle = within(clusterToggle).getByRole('switch');
            
            if (mapState.clusterMarkers) {
              expect(toggle).toHaveAttribute('aria-checked', 'true');
            } else {
              expect(toggle).toHaveAttribute('aria-checked', 'false');
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reflect active color dimension from store for any panel state', () => {
      fc.assert(
        fc.property(
          layersContentPropsArbitrary,
          mapStateArbitrary,
          markerFiltersArbitrary,
          epicFiltersArbitrary,
          (props, mapState, markerFilters, epicFilters) => {
            setupMocks(mapState, markerFilters, epicFilters);
            const { unmount } = render(<LayersContent {...props} />);

            const activeRadio = screen.getByTestId(`area-radio-${mapState.activeColor}`);
            expect(activeRadio).toHaveAttribute('aria-checked', 'true');

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
