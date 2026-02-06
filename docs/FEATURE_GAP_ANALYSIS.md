# Feature Gap Analysis: Old Chronas vs New Implementation

This document analyzes the interactive features from the old Chronas codebase (`chronas/`) compared to the new implementation (`chronas-frontend/`).

## User Flow Analysis

Based on the user flow:
1. **Entry** → Land on default map (year 1000, global viewport)
2. **Observe** → Year_Notification (top-center badge)
3. **Navigate Timeline** → Click year marker, drag/zoom, search epic
4. **Explore Map** → Pan/zoom, toggle layers (ruler/religion/culture/population)
5. **Interact Provinces** → Hover → highlight + tooltip, Click → select → entity outline → fit bounds
6. **Interact Markers** → Hover → highlight, Click → emit wiki/info panel
7. **Advanced** → Autoplay, theme switch, sidebar

---

## ✅ IMPLEMENTED Features

### Map Core
| Feature | Old Code Location | New Code Location | Status |
|---------|------------------|-------------------|--------|
| Map rendering with Mapbox GL | `Map.js` MapGL component | `MapView.tsx` Map component | ✅ Complete |
| Province coloring by ruler | `Map.js` layer config | `MapView.tsx` ruler-fill layer | ✅ Complete |
| Province coloring by culture | `Map.js` layer config | `MapView.tsx` culture-fill layer | ✅ Complete |
| Province coloring by religion | `Map.js` layer config | `MapView.tsx` religion-fill layer | ✅ Complete |
| Province coloring by population | `Map.js` layer config | `MapView.tsx` population-fill layer | ✅ Complete |
| Entity labels (ruler/culture/religion names) | `Map.js` area-labels | `MapView.tsx` area-labels-layer | ✅ Complete |
| Viewport state management | `Map.js` state.viewport | `mapStore.ts` viewport | ✅ Complete |
| Pan/zoom interactions | `Map.js` onViewportChange | `MapView.tsx` handleMove | ✅ Complete |
| Sidebar layout integration | `Map.js` leftOffset | `MapView.tsx` leftOffset | ✅ Complete |

### Timeline Integration
| Feature | Old Code Location | New Code Location | Status |
|---------|------------------|-------------------|--------|
| Year change triggers data fetch | `Map.js` componentWillReceiveProps | `MapView.tsx` useEffect on debouncedYear | ✅ Complete |
| Year notification badge | `Map.js` Snackbar | `YearDisplay.tsx` | ✅ Complete |
| Debounced year changes | N/A (direct) | `MapView.tsx` useDebounce hook | ✅ Complete |

### Markers
| Feature | Old Code Location | New Code Location | Status |
|---------|------------------|-------------------|--------|
| Marker display on map | `DeckGLOverlay.js` IconLayer | `MapView.tsx` markers-layer | ✅ Complete |
| Marker click → popup | `Map.js` _onMarkerClick | `MapView.tsx` handleClick + Popup | ✅ Complete |
| Marker filtering by type | `Map.js` filtered state | `mapStore.ts` markerFilters | ✅ Complete |

### Province Selection
| Feature | Old Code Location | New Code Location | Status |
|---------|------------------|-------------------|--------|
| Province click selection | `Map.js` _onClick | `MapView.tsx` handleClick | ✅ Complete |
| Entity outline display | `Map.js` area-outlines source | `MapView.tsx` entity-outline-layer | ✅ Complete |
| Selected province state | Redux selectedItem | `mapStore.ts` selectedProvinceId | ✅ Complete |

### Error Handling
| Feature | Old Code Location | New Code Location | Status |
|---------|------------------|-------------------|--------|
| WebGL support check | N/A | `MapView.tsx` checkWebGLSupport | ✅ Complete |
| Error display overlay | `Map.js` showNotification | `MapView.tsx` errorOverlay | ✅ Complete |
| No data message | N/A | `MapView.tsx` noDataMessage | ✅ Complete |
| Retry functionality | N/A | `MapView.tsx` handleRetry | ✅ Complete |

---

## ❌ MISSING Features

### 1. Province Hover Tooltip (HIGH PRIORITY)

**Old Implementation** (`Map.js` lines 2200-2310):
- When hovering over a province, displays a rich tooltip popup with:
  - Ruler name + color chip + avatar icon
  - Culture name + color chip + avatar icon
  - Religion name + color chip + avatar icon
  - Religion General name + color chip + avatar icon
  - Province name + population (formatted as M/k)
- Uses `react-map-gl` Popup component
- Shows metadata colors for the active dimension
- Supports locale-specific metadata names

**New Implementation** (`MapView.tsx`):
- Has `hoverInfo` state that tracks hover position and feature properties
- Has `handleMouseMove` that sets hover info
- Has `area-hover` source with a circle highlight
- **MISSING**: No tooltip UI component that displays the province information

**Required Implementation**:
```tsx
// Add to MapView.tsx render, similar to marker popup
{hoverInfo && (
  <Popup
    longitude={hoverInfo.lngLat[0]}
    latitude={hoverInfo.lngLat[1]}
    closeButton={false}
    className={styles['provinceTooltip']}
  >
    <ProvinceTooltip 
      feature={hoverInfo.feature}
      metadata={metadata}
      activeColor={activeColor}
      theme={theme}
    />
  </Popup>
)}
```

---

### 2. Province Click → Wiki/Info Panel (HIGH PRIORITY)

**Old Implementation** (`Map.js` lines 1020-1050, `actionReducers.js` lines 70-78):
- When clicking a province:
  1. Calls `selectAreaItem(wikiId, itemName)` Redux action
  2. Updates URL query params: `?type=area&value={provinceName}`
  3. Navigates to `/article` route
  4. Opens right drawer with Wikipedia iframe or article content

**New Implementation** (`MapView.tsx`):
- Has `handleClick` that calls `selectProvince(provinceId)`
- Updates `selectedProvinceId` in mapStore
- Calculates entity outline
- **MISSING**: 
  - No navigation to `/article` route
  - No right drawer with wiki/info panel
  - No Wikipedia iframe component
  - ArticlePage is just a placeholder

**Required Implementation**:
1. Create `ArticlePanel` component with Wikipedia iframe
2. Create `RightDrawer` component for article display
3. Add navigation logic to `handleClick`:
```tsx
// In handleClick after selectProvince
if (provinceId && wikiUrl) {
  navigate(`/article?type=area&value=${provinceId}`);
  // or open right drawer
  openRightDrawer({ type: 'area', wiki: wikiUrl, name: provinceName });
}
```

---

### 3. Marker Click → Wiki/Info Panel (HIGH PRIORITY)

**Old Implementation** (`Map.js` lines 1889-1920):
- When clicking a marker:
  1. Calls `selectMarkerItem(wikiId, markerData)` Redux action
  2. Updates URL query params: `?type=marker&value={markerId}`
  3. Navigates to `/article` route
  4. Opens right drawer with marker details + Wikipedia iframe

**New Implementation** (`MapView.tsx`):
- Has marker click handling that shows a basic Popup
- Popup shows: name, type, year, description, wiki link
- **MISSING**:
  - No navigation to `/article` route
  - No right drawer integration
  - Wiki link opens in new tab instead of in-app panel

**Required Implementation**:
1. Integrate with RightDrawer component
2. Add navigation or drawer open on marker click:
```tsx
// In handleClick for markers
if (clickedMarker) {
  navigate(`/article?type=marker&value=${clickedMarker._id}`);
  // or open right drawer
  openRightDrawer({ type: 'marker', wiki: clickedMarker.wiki, data: clickedMarker });
}
```

---

### 4. Marker Hover Highlight (MEDIUM PRIORITY)

**Old Implementation** (`DeckGLOverlay.js`):
- Uses deck.gl `onHover` callback
- Highlights marker with theme's `highlightColor`
- Changes cursor to pointer

**New Implementation** (`MapView.tsx`):
- Markers are rendered as circles via Mapbox GL layer
- **MISSING**: No hover highlight effect on markers
- No cursor change on marker hover

**Required Implementation**:
```tsx
// Add hover state for markers
const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

// In handleMouseMove, check for marker features
if (layerId === 'markers-layer') {
  setHoveredMarkerId(properties['id'] as string);
} else {
  setHoveredMarkerId(null);
}

// Update marker layer paint to highlight hovered marker
paint={{
  'circle-radius': [
    'case',
    ['==', ['get', 'id'], hoveredMarkerId ?? ''],
    12, // larger when hovered
    8   // normal size
  ],
  'circle-stroke-color': [
    'case',
    ['==', ['get', 'id'], hoveredMarkerId ?? ''],
    themeConfig.highlightColors[0],
    '#ffffff'
  ],
}}
```

---

### 5. Layer Toggle UI Controls (MEDIUM PRIORITY)

**Old Implementation** (`Menu.js`, various components):
- UI buttons/toggles to switch between ruler/culture/religion/population views
- Integrated into menu or toolbar

**New Implementation**:
- `mapStore.ts` has `layerVisibility` state and `setLayerVisibility` action
- `activeColor` state exists
- **MISSING**: No UI controls to toggle between dimensions

**Required Implementation**:
1. Create `LayerToggle` component with buttons for each dimension
2. Add to map toolbar or menu:
```tsx
<LayerToggle
  activeColor={activeColor}
  onColorChange={(dimension) => setActiveColor(dimension)}
/>
```

---

### 6. Fit Bounds on Entity Selection (MEDIUM PRIORITY)

**Old Implementation** (`Map.js`):
- When entity outline is calculated, calls `fitBounds` to zoom to entity
- Uses padding and zoom limits (min 4.5, max current - 1)

**New Implementation** (`mapStore.ts`):
- Has `entityOutline` state
- **MISSING**: No automatic fit bounds when entity is selected

**Required Implementation**:
```tsx
// In mapStore.ts selectProvince action
// After calculating entityOutline, calculate bounds and trigger flyTo
const bounds = turf.bbox(entityOutline);
flyTo({
  longitude: (bounds[0] + bounds[2]) / 2,
  latitude: (bounds[1] + bounds[3]) / 2,
  zoom: calculateZoomForBounds(bounds),
});
```

---

### 7. Right Drawer Component (HIGH PRIORITY)

**Old Implementation** (`RightDrawerRoutes.js`, ~700 lines):
- Sliding drawer from right side (25% width)
- Contains article iframe, marker details, epic content
- Integrates with map layout (map width adjusts)

**New Implementation**:
- `MapView.tsx` has `RIGHT_DRAWER_WIDTH_PERCENT = 25` constant
- **MISSING**: No RightDrawer component exists

**Required Implementation**:
1. Create `RightDrawer` component
2. Create `ArticleIframe` component for Wikipedia content
3. Add to `uiStore.ts`:
```tsx
rightDrawerOpen: boolean;
rightDrawerContent: { type: string; wiki?: string; data?: unknown } | null;
openRightDrawer: (content) => void;
closeRightDrawer: () => void;
```

---

### 8. deck.gl Overlay Layers (LOW PRIORITY)

**Old Implementation** (`DeckGLOverlay.js`):
- IconLayer for markers with custom atlas
- ArcLayer for connections
- ScatterplotLayer for city dots
- TagmapLayer for city labels
- Migration animation layer

**New Implementation**:
- Uses native Mapbox GL layers (circle, symbol)
- **MISSING**: 
  - Custom icon atlas (themed-atlas.png)
  - Arc layer for connections
  - Migration layer
  - Cluster markers

**Note**: Current implementation works but lacks visual parity with production.

---

## Priority Summary

### HIGH PRIORITY (Required for feature parity)
1. **Province Hover Tooltip** - Users expect to see province info on hover
2. **Province Click → Wiki Panel** - Core interaction for exploring history
3. **Marker Click → Wiki Panel** - Core interaction for exploring events
4. **Right Drawer Component** - Container for wiki/article content

### MEDIUM PRIORITY (Important for UX)
5. **Marker Hover Highlight** - Visual feedback for interactivity
6. **Layer Toggle UI** - Users need to switch between dimensions
7. **Fit Bounds on Selection** - Better UX when selecting entities

### LOW PRIORITY (Nice to have)
8. **deck.gl Overlay Layers** - Visual enhancements

---

## Implementation Recommendations

### Phase 1: Core Interactions
1. Create `ProvinceTooltip` component
2. Create `RightDrawer` component
3. Create `ArticleIframe` component
4. Wire up province click → right drawer
5. Wire up marker click → right drawer

### Phase 2: UI Controls
6. Create `LayerToggle` component
7. Add marker hover highlight
8. Implement fit bounds on selection

### Phase 3: Visual Parity
9. Migrate to deck.gl for markers (optional)
10. Add arc layer support
11. Add migration layer support

---

## Files to Create/Modify

### New Components
- `chronas-frontend/src/components/map/ProvinceTooltip/ProvinceTooltip.tsx`
- `chronas-frontend/src/components/layout/RightDrawer/RightDrawer.tsx`
- `chronas-frontend/src/components/content/ArticleIframe/ArticleIframe.tsx`
- `chronas-frontend/src/components/map/LayerToggle/LayerToggle.tsx`

### Store Updates
- `chronas-frontend/src/stores/uiStore.ts` - Add rightDrawer state
- `chronas-frontend/src/stores/mapStore.ts` - Add fitBounds logic

### Component Updates
- `chronas-frontend/src/components/map/MapView/MapView.tsx` - Add tooltip, drawer integration
- `chronas-frontend/src/routes/index.tsx` - Implement ArticlePage properly
