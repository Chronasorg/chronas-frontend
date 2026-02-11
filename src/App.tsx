import { useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useAuthStore } from './stores';
import { useMapStore } from './stores/mapStore';
import { useTimelineStore } from './stores/timelineStore';
import { useUIStore } from './stores/uiStore';
import { getYearFromURL } from './utils/mapUtils';
import { parseURLState } from './utils/urlStateUtils';

/**
 * Builds a wiki URL for a province based on metadata.
 * Uses the entity's wiki URL from metadata if available, otherwise falls back to province name.
 *
 * @param provinceId - The province ID
 * @param activeColor - The active color dimension
 * @param currentAreaData - The current area data
 * @param getEntityWiki - Function to get wiki URL from metadata
 * @returns The wiki URL
 */
function buildWikiUrl(
  provinceId: string,
  activeColor: string,
  currentAreaData: Record<string, [string, string, string, string | null, number]> | null,
  getEntityWiki: (value: string, dimension: 'ruler' | 'culture' | 'religion' | 'religionGeneral' | 'population') => string | undefined
): string {
  const provinceData = currentAreaData?.[provinceId];
  if (!provinceData) {
    return `https://en.wikipedia.org/wiki/${encodeURIComponent(provinceId.replace(/ /g, '_'))}`;
  }

  // Get the entity value based on active color dimension
  // For religionGeneral, we use index 2 (religion) because we need the religion ID
  // to look up its parent (religionGeneral ID) in the metadata
  const dimension = activeColor as 'ruler' | 'culture' | 'religion' | 'religionGeneral' | 'population';
  const entityValue = provinceData[dimension === 'ruler' ? 0 : 
                                   dimension === 'culture' ? 1 : 
                                   dimension === 'religion' ? 2 :
                                   dimension === 'religionGeneral' ? 2 : 0];

  // Get wiki URL from metadata for the active entity
  const metadataWiki = dimension !== 'population' && entityValue 
    ? getEntityWiki(entityValue, dimension)
    : undefined;

  // Build wiki URL: prefer metadata wiki, fallback to province name
  return metadataWiki 
    ? `https://en.wikipedia.org/wiki/${encodeURIComponent(metadataWiki.replace(/ /g, '_'))}`
    : `https://en.wikipedia.org/wiki/${encodeURIComponent(provinceId.replace(/ /g, '_'))}`;
}

function App() {
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const loadMetadata = useMapStore((state) => state.loadMetadata);
  const currentAreaData = useMapStore((state) => state.currentAreaData);
  const activeColor = useMapStore((state) => state.activeColor);
  const getEntityWiki = useMapStore((state) => state.getEntityWiki);
  const selectedYear = useTimelineStore((state) => state.selectedYear);
  const setYear = useTimelineStore((state) => state.setYear);
  const loadEpicItems = useTimelineStore((state) => state.loadEpicItems);
  const openRightDrawer = useUIStore((state) => state.openRightDrawer);
  const closeRightDrawer = useUIStore((state) => state.closeRightDrawer);

  // Initialize stores on mount
  // Requirement 2.1: WHEN the application initializes, THE Map_Store SHALL fetch metadata
  // Requirement 9.4: THE application SHALL restore drawer state from URL on page load
  useEffect(() => {
    loadFromStorage();
    // Load metadata for entity colors on app startup
    void loadMetadata();
    // Load epic items for timeline display
    void loadEpicItems();
    
    // Note: Year is now initialized synchronously from URL in timelineStore's initial state
    // This prevents race conditions where MapView loads data for wrong year
    // We no longer need to call setYear here as it's already set
    
    // Restore drawer state from URL if present
    // Requirement 9.4: THE application SHALL restore drawer state from URL on page load
    const urlState = parseURLState();
    if (urlState.type && urlState.value) {
      if (urlState.type === 'area') {
        // Open right drawer with province content
        // Wiki URL will be updated when area data loads
        const wikiUrl = buildWikiUrl(urlState.value, activeColor, currentAreaData, getEntityWiki);
        openRightDrawer({
          type: 'area',
          provinceId: urlState.value,
          provinceName: urlState.value,
          wikiUrl,
        });
      } else {
        // Open right drawer with marker content (type === 'marker')
        // Note: We don't have the full marker data here, so we create a minimal marker object
        // The actual marker data will be loaded when the map loads
        openRightDrawer({
          type: 'marker',
          marker: {
            _id: urlState.value,
            name: urlState.value,
            type: 'other',
            year: selectedYear,
            coo: [0, 0],
          },
        });
      }
    }
    
    /**
     * Handle URL state changes from browser navigation (back/forward).
     * Requirement 9.6: THE application SHALL update drawer state on browser navigation.
     */
    const handleURLStateChange = () => {
      const newYearFromURL = getYearFromURL();
      if (newYearFromURL !== null) {
        setYear(newYearFromURL);
      }
      
      // Update drawer state based on URL
      const newUrlState = parseURLState();
      if (newUrlState.type && newUrlState.value) {
        if (newUrlState.type === 'area') {
          const wikiUrl = buildWikiUrl(newUrlState.value, activeColor, currentAreaData, getEntityWiki);
          openRightDrawer({
            type: 'area',
            provinceId: newUrlState.value,
            provinceName: newUrlState.value,
            wikiUrl,
          });
        } else {
          // type === 'marker'
          openRightDrawer({
            type: 'marker',
            marker: {
              _id: newUrlState.value,
              name: newUrlState.value,
              type: 'other',
              year: newYearFromURL ?? selectedYear,
              coo: [0, 0],
            },
          });
        }
      } else {
        // No drawer params in URL, close the drawer
        closeRightDrawer();
      }
    };
    
    // Listen for hash changes (includes both hashchange and popstate for browser navigation)
    window.addEventListener('hashchange', handleURLStateChange);
    window.addEventListener('popstate', handleURLStateChange);
    
    return () => {
      window.removeEventListener('hashchange', handleURLStateChange);
      window.removeEventListener('popstate', handleURLStateChange);
    };
    // Note: activeColor, currentAreaData, and getEntityWiki are intentionally excluded from deps
    // to avoid re-running the effect when they change. The handleURLStateChange callback
    // will use the latest values when called.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFromStorage, loadMetadata, loadEpicItems, setYear, openRightDrawer, closeRightDrawer]);

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
