# Browser Sanity Check — Playwright MCP

Use the Playwright MCP server to manually validate all major UI areas after every frontend change.
This checklist replaces the flaky automated E2E tests that were removed due to WebGL event-loop timing issues.

**How to run:** Use the Playwright MCP tools (`browser_navigate`, `browser_click`, `browser_snapshot`, `browser_take_screenshot`) against `http://localhost:5173` (dev) or `https://chronas.org` (prod).

---

## 1. App Shell & Map Loading

- [ ] Navigate to the app — app shell (`data-testid="app-shell"`) renders
- [ ] Map container is visible (`.mapboxgl-canvas` or `data-testid="map-container"`)
- [ ] Sidebar navigation items are rendered and interactive
- [ ] Take a screenshot to confirm visual layout

## 2. Navigation Sidebar

- [ ] Layers, Settings, Help, and Logout nav items are visible and enabled
- [ ] Discover, Random, Pro, Collections, Play items are visible and disabled
- [ ] Clicking Layers opens the left drawer with layers content
- [ ] Clicking Settings opens the left drawer with settings content
- [ ] Clicking Help toggles the announcement banner
- [ ] Clicking Layers twice closes the drawer
- [ ] Switching from Layers to Settings replaces drawer content
- [ ] Logo link points to `#/info`

## 3. Layers Panel — Area Dimensions

- [ ] Open Layers drawer
- [ ] All 5 area dimension radios are visible: ruler, culture, religion, religionGeneral, population
- [ ] Clicking each area radio selects it (checked state)
- [ ] Label radios are visible for ruler, culture, religion, religionGeneral (not population)
- [ ] Lock toggle is visible and initially locked (`aria-pressed="true"`)
- [ ] Toggling lock switches between locked/unlocked
- [ ] When locked, selecting an area radio also selects the matching label radio

## 4. Layers Panel — Marker Filters

- [ ] All 16 marker type checkboxes are visible and checked by default
- [ ] "Uncheck All" button unchecks all markers and changes to "Check All"
- [ ] "Check All" re-checks all markers
- [ ] Individual marker checkbox can be toggled on/off
- [ ] Marker limit slider is visible with a value between 0 and 10,000
- [ ] Cluster markers switch toggles between on/off

## 5. Layers Panel — Epic Filters

- [ ] All 6 epic type checkboxes are visible: war, empire, religion, culture, person, other
- [ ] All epic checkboxes are checked by default
- [ ] "Uncheck All" unchecks every epic type
- [ ] Individual epic checkbox can be toggled

## 6. Layers Panel — Advanced Section

- [ ] Advanced section expands on click
- [ ] Basemap select is visible with 4 options: topographic, satellite, light, none
- [ ] Changing basemap updates the select value
- [ ] Show provinces toggle is visible

## 7. Layers Panel — Section Collapse/Expand

- [ ] Area section can be collapsed and expanded
- [ ] Markers section can be collapsed and expanded
- [ ] Epics section can be collapsed and expanded
- [ ] GENERAL section can be collapsed and expanded
- [ ] Collapse button closes the entire layers panel

## 8. Settings Panel

- [ ] Open Settings drawer
- [ ] Theme buttons are visible: Light, Dark, Luther
- [ ] Light theme is active by default (`aria-pressed="true"`)
- [ ] Clicking Dark applies dark theme (visual change, aria-pressed updates)
- [ ] Clicking Luther applies luther theme
- [ ] Language dropdown is visible with English default

## 9. Right Drawer

- [ ] Right drawer is visible with "No content selected" message
- [ ] Close button is present on the right drawer

## 10. Timeline Controls

- [ ] Year display shows 1000 by default
- [ ] Expand timeline button is visible
- [ ] Search epics button is visible
- [ ] Autoplay button is visible
- [ ] Epic items are rendered in the timeline

## 11. Announcement Banner

- [ ] Banner is visible on first load with "Welcome to Chronas" text
- [ ] Dismiss button hides the banner
- [ ] GitHub link points to `https://github.com/Chronasorg/chronas-frontend/issues`
- [ ] Classic version link points to `https://old.chronas.org`

## 12. Keyboard Accessibility

- [ ] Escape closes the layers drawer
- [ ] Escape closes the settings drawer
- [ ] Sidebar nav items are focusable via Tab

## 13. Translations / i18n

- [ ] Navigate to app — default language is English
- [ ] If subdomain locale detection is testable, verify `de.chronas.org` sets German locale
- [ ] Language dropdown in Settings shows available languages
- [ ] Changing language updates UI text (nav labels, drawer headings, etc.)

## 14. Map Interactions (requires Mapbox token)

- [ ] Map renders tiles and colored provinces
- [ ] Hovering a province shows tooltip
- [ ] Clicking a province opens the right drawer with province content
- [ ] Markers are visible on the map at appropriate zoom levels
- [ ] Changing the year via timeline updates province colors and markers
- [ ] Autoplay advances the year and updates the map

---

## When to run this checklist

Run this **before reporting any frontend task as complete** (per CLAUDE.md completion checklist).
At minimum, validate sections 1-2 and any sections directly affected by the change.
For large changes, validate all sections.
