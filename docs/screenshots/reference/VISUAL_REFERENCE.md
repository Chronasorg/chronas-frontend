# Visual Reference: Production vs Dev

## Screenshots Captured: February 2026

### Current Dev State Issues

**Screenshot 1 - Dev Environment (https://d1q6nlczw9cdpt.cloudfront.net)**

#### Timeline Issues:
- Timeline is a thin bar at the very bottom
- Year display "924" is small and positioned at bottom
- No epic item thumbnails visible at top of screen
- "SEARCH EPICS" button at bottom right corner
- Missing the horizontal epic thumbnail row at top
- Missing colored epic blocks on timeline bar

#### Left Sidebar Issues:
- Light/white background instead of dark theme
- "LAYERS" panel has wrong styling
- Area section shows radio buttons but wrong layout
- Missing proper dark theme styling
- Missing basemap selector with thumbnail
- Missing "SHOW PROVINCES" toggle
- Missing "OPACITY BY POPULATION" option
- Missing "SUGGESTIONS BASED ON YOUR MACHINE" section

---

### Production Reference

**Screenshot 2 - Production (https://chronas.org)**

#### Timeline (Production):
- **Epic Thumbnails Row**: Horizontal row of epic item images at TOP of screen
  - Shows historical figures, events as square thumbnails
  - Scrollable horizontally
  - Each thumbnail ~60-80px square
- **Year Display**: Large "588" displayed prominently in CENTER of map
  - Font size approximately 80-100px
  - Semi-transparent white/light color
  - Positioned over the map, not in timeline bar
- **Timeline Bar**: At bottom, shows colored blocks representing epic periods
  - Dark semi-transparent background
  - Colored segments for different historical periods
  - "SE" button (Search Epics) at bottom right

#### Left Sidebar (Production):
- **Dark Theme**: Dark gray/charcoal background (#2d2d2d or similar)
- **Header**: "Layers" with collapse arrow "<"
- **Sections**:
  1. **GENERAL** (collapsed section header)
  2. **Area** - expandable with chevron
     - Contains area-related toggles
  3. **Markers** - expandable with icon and chevron
  4. **Epics** - expandable with icon and chevron
  5. **Migration** - with help icon (?)
  6. **ADVANCED** (section header)
  7. **Basemap** - thumbnail preview of current basemap style
  8. **SHOW PROVINCES** - toggle switch
  9. **OPACITY BY POPULATION** - option/toggle
  10. **SUGGESTIONS BASED ON YOUR MACHINE** - info section

#### Icon Bar (Production - Left Edge):
- Vertical strip of icons on far left (separate from Layers panel)
- Icons include: Layers, Edit, Grid, Settings, Star, Save, Grid, Help, Power
- Dark background
- Icon-only (no text labels)

---

## Key Visual Specifications (Extracted from Production)

### Colors
- Sidebar background: `#2d2d2d` or `rgba(45, 45, 45, 1)`
- Section headers: Uppercase, light gray text
- Active/hover states: Subtle highlight

### Typography
- Section headers: Uppercase, ~11-12px, letter-spacing
- Year display on map: 80-100px, semi-transparent white

### Layout
- Epic thumbnails: Fixed row at top, ~80px height
- Sidebar width: ~200-240px when expanded
- Icon bar width: ~48-56px

### Timeline
- Epic blocks: Colored segments representing historical periods
- Year marker: Red vertical line with year label
- Background: Dark semi-transparent

---

## Required Changes

### Priority 1: Year Display Repositioning
- Move large year display to center of map
- Increase font size to 80-100px
- Make semi-transparent

### Priority 2: Left Sidebar Restructure
- Implement dark theme
- Add proper section structure (GENERAL, Area, Markers, Epics, Migration, ADVANCED)
- Add Basemap selector with thumbnail
- Add SHOW PROVINCES toggle
- Add OPACITY BY POPULATION option

### Priority 3: Timeline Bar
- Add colored epic blocks
- Proper dark background
- Correct positioning
