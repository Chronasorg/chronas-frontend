/**
 * MapLibre + OpenFreeMap basemap E2E tests — issue #46.
 *
 * This is the primary safety net for the Mapbox → MapLibre migration.
 * `vitest.config.mts` aliases `react-map-gl/maplibre` to a mock and jsdom has no
 * WebGL, so **no unit test can ever see a real style, layer, glyph or tile**.
 * Every load-bearing claim of the migration is only provable in a real browser,
 * which is what this file does.
 *
 * The hosted stylesheets are pinned to committed snapshots (see the fixtures
 * section) so that assertions about *our* code cannot be destabilised by a free
 * no-SLA provider's throughput; tiles, glyphs and sprites still come from
 * OpenFreeMap, and the `Provider contract` group fetches the real styles to
 * catch upstream drift.
 *
 * Requires `window.__chronasMap` (installed by MapView's ref callback under
 * `import.meta.env.DEV` / `MODE === 'test'`), so it runs against the dev server
 * or a dev/staging build — not against a production bundle.
 *
 * Run with: npx playwright test tests/e2e/basemap-maplibre.spec.ts
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '@playwright/test';
import type { APIRequestContext, Page, Request, Response } from '@playwright/test';

// Budget note: a boot plus one basemap swap each wait on the map settling, and
// the basemap's tiles come from a free no-SLA provider whose throughput was
// measured varying by more than an order of magnitude minute to minute. 180s was
// not enough for the one-swap tests when the provider was slow.
test.setTimeout(240_000);
test.use({ actionTimeout: 15_000 });

// ---------------------------------------------------------------------------
// Contract constants
//
// Measured against the live styles (tilejson 3.16.0). Ids are asserted as
// required subsets rather than exact counts, so an upstream addition doesn't
// fail the suite while a removal or rename — the real no-SLA drift risk — does.
// ---------------------------------------------------------------------------

type BasemapKey = 'topographic' | 'satellite' | 'light' | 'none';

/** The `source-layer: place` symbol layers. Identical in liberty and positron. */
const PLACE_LABEL_IDS = [
  'label_country_1',
  'label_country_2',
  'label_country_3',
  'label_state',
  'label_city',
  'label_city_capital',
  'label_town',
  'label_village',
  'label_other',
];

/**
 * Symbol layers whose `text-field` is `["to-string", ["get", "ref"]]` — route
 * *numbers*, not names. Rewriting these with a name expression would render
 * road names inside shield icons, so they must survive localization untouched.
 */
const REF_ONLY_SHIELD_IDS = [
  'highway-shield-non-us',
  'highway-shield-us-interstate',
  'road_shield_us',
];

const REF_ONLY_TEXT_FIELD = ['to-string', ['get', 'ref']];

/**
 * Name-bearing symbol layers that must all end up localized.
 *
 * The `label_*` ones were covered by the old Mapbox-era `id.includes('label')`
 * filter; the rest were **not**, which is the partial regression that filter
 * caused (road, POI and airport labels stuck in local language). Liberty has
 * 20 name-bearing symbol layers, positron 16 (no `poi_*`, no `poi_transit`).
 */
const NAME_BEARING_IDS: Record<'topographic' | 'light', string[]> = {
  topographic: [
    'waterway_line_label',
    'water_name_point_label',
    'water_name_line_label',
    'poi_r20',
    'poi_r7',
    'poi_r1',
    'poi_transit',
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
    'airport',
    ...PLACE_LABEL_IDS,
  ],
  light: [
    'waterway_line_label',
    'water_name_point_label',
    'water_name_line_label',
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
    'airport',
    ...PLACE_LABEL_IDS,
  ],
};

/**
 * Every layer Chronas adds on top of the basemap, in the order react-map-gl
 * appends them. They all sit above the entire basemap (see the ordering test).
 */
const OWN_LAYER_IDS = [
  'ruler-fill',
  'culture-fill',
  'religion-fill',
  'religionGeneral-fill',
  'population-fill',
  'province-borders',
  'provinces-outline',
  'area-hover-highlight',
  'clusters',
  'cluster-count',
  'markers-layer',
  'markers-label',
  'area-labels-layer',
  'area-labels-points',
  'entity-outline-layer',
];

/** Fonts served from `public/fonts/`, redirected by MapView's `transformRequest`. */
const LOCAL_FONT_NAMES = ['Cinzel Regular', 'Cairo', 'Noto Sans SC'];

/** Custom marker icons cut out of `public/images/themed-atlas.png`. */
const MARKER_ICON_IDS = ['marker-p', 'marker-c', 'marker-b', 'marker-cp'];

// ---------------------------------------------------------------------------
// Hosted stylesheets: pinned for logic, live for drift
//
// OpenFreeMap is free, unmetered and has no SLA, and its throughput for a single
// 43 kB stylesheet was measured ranging from 4.4s to over 90s within the same
// minute (control download on the same CDN edge: 1.2 MB/s). MapLibre keeps
// serving the previous style until the new one parses, so a slow stylesheet is
// indistinguishable from a basemap switch that does nothing — which made the
// swap tests go red for reasons that had nothing to do with this repo.
//
// So the stylesheets are pinned to committed snapshots for every test that is
// really about *our* code (label localization, visibility, layer order, swap
// re-fire), and provider drift — the actual no-SLA risk — is caught by the live
// `Provider contract` group below, which fetches the real styles over HTTP and
// diffs the invariants against these same snapshots. Nothing is stubbed away:
// tiles, glyphs and sprites still come from OpenFreeMap in every test.
// ---------------------------------------------------------------------------

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/openfreemap');

const HOSTED_STYLES = ['liberty', 'positron'] as const;

function readStyleFixture(name: (typeof HOSTED_STYLES)[number]): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.json`), 'utf8');
}

async function pinHostedStyles(page: Page): Promise<void> {
  await page.route('https://tiles.openfreemap.org/styles/*', async (route) => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    if (!HOSTED_STYLES.includes(name as (typeof HOSTED_STYLES)[number])) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: readStyleFixture(name as (typeof HOSTED_STYLES)[number]),
    });
  });
}

/** Just enough of a MapLibre stylesheet to compute the invariants below. */
interface HostedStyle {
  layers: { id: string; type: string; source?: string; layout?: Record<string, unknown> }[];
  glyphs?: string;
  sprite?: string;
}

/** The invariants this suite depends on, computed the same way for live and pinned styles. */
interface StyleInvariants {
  symbolCount: number;
  nameBearingIds: string[];
  placeLabelIds: string[];
  refOnlyIds: string[];
  reliefLayerIds: string[];
  glyphs: string | undefined;
  sprite: string | undefined;
}

function styleInvariants(style: HostedStyle): StyleInvariants {
  const symbols = style.layers.filter((layer) => layer.type === 'symbol');
  const textField = (layer: (typeof symbols)[number]): string =>
    JSON.stringify(layer.layout?.['text-field'] ?? '');
  return {
    symbolCount: symbols.length,
    nameBearingIds: symbols.filter((layer) => /"name(:|")/.test(textField(layer))).map((l) => l.id),
    placeLabelIds: symbols
      .filter((layer) => PLACE_LABEL_IDS.includes(layer.id))
      .map((layer) => layer.id),
    refOnlyIds: symbols
      .filter((layer) => textField(layer) === JSON.stringify(REF_ONLY_TEXT_FIELD))
      .map((layer) => layer.id),
    reliefLayerIds: style.layers.filter((layer) => layer.source === 'ne2_shaded').map((l) => l.id),
    glyphs: style.glyphs,
    sprite: style.sprite,
  };
}

// ---------------------------------------------------------------------------
// Browser-side probe
//
// Installed via addInitScript *before* navigation so it is in place when
// MapView assigns `window.__chronasMap`. A property setter is the only way to
// hook the instant of creation: `error` and `styleimagemissing` fire during the
// first tile parse, well before any `page.evaluate` could attach listeners.
// ---------------------------------------------------------------------------

const MAP_PROBE = `
(() => {
  const state = { map: null, errors: [], missingImages: [], styleDataEvents: 0 };
  window.__chronasProbe = state;
  Object.defineProperty(window, '__chronasMap', {
    configurable: true,
    get: () => state.map,
    set: (map) => {
      if (state.map === map) return;
      state.map = map;
      map.on('error', (event) => {
        const error = event && event.error;
        state.errors.push(String(error && error.message ? error.message : error || event));
      });
      // MapLibre v6 only fires this *after* the missing-image resolver has had
      // its chance, so any event here is a genuinely unresolvable image.
      map.on('styleimagemissing', (event) => { state.missingImages.push(event.id); });
      map.on('styledata', () => { state.styleDataEvents += 1; });
    },
  });
})();
`;

interface StyleFacts {
  layerIds: string[];
  sourceIds: string[];
  /** Symbol layers not belonging to one of our own GeoJSON sources. */
  basemapSymbols: { id: string; textField: unknown; visibility: string }[];
  errors: string[];
  missingImages: string[];
}

/** Source ids of the GeoJSON layers Chronas adds — mirrors `OWN_SOURCE_IDS`. */
const OWN_SOURCE_IDS = [
  'provinces',
  'area-hover',
  'markers',
  'area-label-lines',
  'area-labels',
  'entity-outline',
];

async function readStyleFacts(page: Page): Promise<StyleFacts> {
  return page.evaluate((ownSourceIds: string[]) => {
    const probe = (window as any).__chronasProbe;
    const map = (window as any).__chronasMap;
    const style = map.getStyle();
    const own = new Set(ownSourceIds);
    const layers = style.layers as any[];
    return {
      layerIds: layers.map((layer) => layer.id),
      sourceIds: Object.keys(style.sources ?? {}),
      basemapSymbols: layers
        .filter((layer) => layer.type === 'symbol' && !own.has(layer.source))
        .map((layer) => ({
          id: layer.id,
          textField: layer.layout?.['text-field'] ?? null,
          visibility: layer.layout?.visibility ?? 'visible',
        })),
      errors: [...probe.errors],
      missingImages: [...probe.missingImages],
    };
  }, OWN_SOURCE_IDS);
}

// ---------------------------------------------------------------------------
// Navigation / wait helpers
// ---------------------------------------------------------------------------

interface RequestLog {
  urls: string[];
  failures: { url: string; status: number }[];
}

/**
 * Starts collecting requests and non-OK responses. Must be called before
 * navigating. Worker-issued fetches (glyphs, vector tiles) are invisible to
 * main-thread `performance.getEntriesByType('resource')` but *are* reported
 * here, which is why every network assertion in this file goes through it.
 */
function collectRequests(page: Page): RequestLog {
  const log: RequestLog = { urls: [], failures: [] };
  page.on('request', (request: Request) => {
    log.urls.push(request.url());
  });
  page.on('response', (response: Response) => {
    if (response.status() >= 400) {
      log.failures.push({ url: response.url(), status: response.status() });
    }
  });
  return log;
}

/**
 * Waits until the style is **parsed**, which is what every assertion in this
 * file actually reads: layer ids, resolved `text-field`s, `layout.visibility`,
 * source ids.
 *
 * Deliberately *not* `isStyleLoaded()`. That is a much stronger condition —
 * MapLibre's `Style.loaded()` additionally requires every in-view tile of every
 * source to have settled, including the ~40 Natural Earth relief rasters and the
 * ~600 kB z2 planet tiles served by OpenFreeMap. Gating on it makes the whole
 * suite hostage to a free, unmetered, no-SLA third party's throughput: measured
 * against tiles.openfreemap.org while it was shaping us to ~5 kB/s, this gate
 * resolved in 1.8s and `isStyleLoaded()` had still not turned true after 60s.
 * That is a suite that goes red for reasons that have nothing to do with the
 * code under test.
 *
 * Tile *delivery* is therefore asserted where it belongs — that the requests are
 * issued to OpenFreeMap and not to Mapbox — and worker liveness gets its own
 * explicit, bandwidth-independent check via `waitForOwnSourcesLoaded`.
 */
async function waitForStyleParsed(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const map = (window as any).__chronasMap;
        if (!map) return false;
        // `getStyle()` returns undefined until the stylesheet is parsed
        // (`Style.serialize()` bails on `!this._loaded`), and the try/catch
        // guards the case where a future version throws there instead.
        let style: any;
        try {
          style = map.getStyle();
        } catch {
          return false;
        }
        return Array.isArray(style?.layers) && style.layers.length > 0;
      },
      undefined,
      { timeout: 60_000 }
    );
  } catch (error) {
    throw new Error(`map style was never parsed: ${JSON.stringify(await diagnose(page))}`, {
      cause: error,
    });
  }
}

/**
 * Asserts the tile worker is actually alive, without depending on the network.
 *
 * This is the check that catches the failure class that broke the production
 * bundle: MapLibre parses all vector and GeoJSON data in a Web Worker, and when
 * that worker fails to boot the symptom is silent — the canvas mounts, raster
 * relief still draws, and every source simply never finishes. Chronas's own
 * sources are plain GeoJSON handed to the worker in-process, so they settle in
 * under a second (measured: 843ms) and require no third-party bytes at all. If
 * the worker is dead they never settle, which is exactly the discrimination the
 * old `isStyleLoaded()` gate was trying and failing to make.
 *
 * The discrimination is not perfectly clean, though. Two of our six sources —
 * `area-labels` and `area-label-lines` — carry the *text* layers, and a symbol
 * tile cannot finish until its fontstack's glyph ranges arrive from the provider.
 * Measured (locale `ja`, fontstack `Noto Sans Regular`): those two stuck at
 * `loading` while the other four were loaded, with the glyph PBFs taking
 * 6.0s/10.9s/12.3s and nine planet tiles still unanswered past 65s.
 *
 * So on timeout we don't fail blindly: if the worker has proved it is alive
 * (something of ours is loaded, and every straggler has already handed its data
 * over — `source.loaded()` true) *and* the provider still owes us bytes, we
 * record an annotation and let the test proceed. A dead worker settles nothing at
 * all and the provider owes nothing, so it still fails, loudly.
 */
async function waitForOwnSourcesLoaded(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      (ownSourceIds: string[]) => {
        const map = (window as any).__chronasMap;
        if (!map) return false;
        return ownSourceIds.every((id) => {
          try {
            return map.isSourceLoaded(id) === true;
          } catch {
            return false;
          }
        });
      },
      OWN_SOURCE_IDS,
      { timeout: 60_000 }
    );
  } catch (error) {
    const report = await workerReport(page);
    const owed = providerInFlight(page);
    if (
      report.loadedIds.length > 0 &&
      report.pendingIds.length > 0 &&
      report.pendingIds.every((id) => report.parsedIds.includes(id)) &&
      owed.length > 0
    ) {
      const byKind = owed.reduce<Record<string, number>>(
        (acc, entry) => ({ ...acc, [entry.kind]: (acc[entry.kind] ?? 0) + 1 }),
        {}
      );
      test.info().annotations.push({
        type: 'provider-congestion',
        description:
          `waited out OpenFreeMap: ${JSON.stringify(byKind)} request(s) still unanswered after 60s, ` +
          `so ${report.pendingIds.join(', ')} had parsed but not finished slicing (loaded: ` +
          `${report.loadedIds.join(', ')}). The worker is alive; proceeding.`,
      });
      return;
    }
    throw new Error(
      `Chronas GeoJSON sources never finished parsing — the MapLibre worker is probably dead.\n` +
        `  map state: ${JSON.stringify(await diagnose(page))}\n` +
        `  provider requests still unanswered: ${JSON.stringify(owed)}`,
      { cause: error }
    );
  }
}

interface WorkerReport {
  /** `map.isSourceLoaded` — every in-view tile sliced. Depends on glyph fetches. */
  loadedIds: string[];
  pendingIds: string[];
  /** `source.loaded()` — the worker answered the parse. Depends on nothing remote. */
  parsedIds: string[];
}

/** Splits "the worker answered" from "every tile is sliced" — see `sourcesParsed`. */
async function workerReport(page: Page): Promise<WorkerReport> {
  return page
    .evaluate((ownSourceIds: string[]) => {
      const map = (window as any).__chronasMap;
      const loadedIds: string[] = [];
      const pendingIds: string[] = [];
      const parsedIds: string[] = [];
      for (const id of ownSourceIds) {
        try {
          if (map.isSourceLoaded(id) === true) loadedIds.push(id);
          else pendingIds.push(id);
          if (map.getSource(id)?.loaded() === true) parsedIds.push(id);
        } catch {
          pendingIds.push(id);
        }
      }
      return { loadedIds, pendingIds, parsedIds };
    }, OWN_SOURCE_IDS)
    .catch(() => ({ loadedIds: [], pendingIds: OWN_SOURCE_IDS, parsedIds: [] }));
}

/**
 * Waits until every Chronas *layer* is back in the style.
 *
 * A style swap tears the whole stylesheet down, and react-map-gl re-adds our
 * `<Source>`s before its `<Layer>`s. So "sources have finished parsing" is
 * strictly earlier than "our layers exist again", and a test that reads layer
 * ids straight after `waitForOwnSourcesLoaded` can observe the gap — which is
 * what made the four-basemap round trip flaky rather than any product bug.
 */
async function waitForOwnLayers(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      (ownLayerIds: string[]) => {
        const map = (window as any).__chronasMap;
        if (!map) return false;
        return ownLayerIds.every((id) => !!map.getLayer(id));
      },
      OWN_LAYER_IDS,
      { timeout: 30_000 }
    );
  } catch (error) {
    const present = await page
      .evaluate(
        (ids: string[]) =>
          ids.filter((id) => !(window as any).__chronasMap?.getLayer(id)),
        OWN_LAYER_IDS
      )
      .catch(() => ['<unavailable>']);
    throw new Error(`Chronas layers missing after the style settled: ${JSON.stringify(present)}`, {
      cause: error,
    });
  }
}

/**
 * Per-source tile-state histogram, for failure messages.
 *
 * Reads `style.tileManagers`, which is where MapLibre 6 keeps them; the
 * `style.sourceCaches` of older versions no longer exists, so a diagnostic
 * written against it silently reports nothing at all.
 */
async function diagnose(page: Page): Promise<unknown> {
  return page
    .evaluate(() => {
      const map = (window as any).__chronasMap;
      if (!map) return { map: null };
      const sources: Record<string, unknown> = {};
      for (const [id, manager] of Object.entries<any>(map.style?.tileManagers ?? {})) {
        const tiles: Record<string, number> = {};
        for (const tile of Object.values<any>(manager._inViewTiles?._tiles ?? {})) {
          tiles[tile.state] = (tiles[tile.state] ?? 0) + 1;
        }
        sources[id] = {
          loaded: manager.loaded(),
          type: manager._source?.type,
          isUpdatingWorker: manager._source?._isUpdatingWorker ?? null,
          tiles,
        };
      }
      return {
        isStyleLoaded: map.isStyleLoaded(),
        areTilesLoaded: map.areTilesLoaded(),
        sources,
        errors: (window as any).__chronasProbe?.errors ?? [],
      };
    })
    .catch(() => ({ diagnosticsUnavailable: true }));
}

/**
 * Predicates that identify each basemap's style, used to wait out the swap.
 * Polling `isStyleLoaded()` alone would pass instantly on the *old* style,
 * because MapLibre keeps serving it until the new one is parsed.
 */
const BASEMAP_SIGNATURES: Record<BasemapKey, (facts: StyleFacts) => boolean> = {
  // Liberty is the only style with a layer drawing the Natural Earth relief.
  topographic: (facts) => facts.layerIds.includes('natural_earth'),
  // Positron ships the `ne2_shaded` source but no layer using it.
  light: (facts) =>
    facts.sourceIds.includes('openmaptiles') && !facts.layerIds.includes('natural_earth'),
  satellite: (facts) => facts.sourceIds.includes('eox-s2cloudless'),
  none: (facts) =>
    !facts.sourceIds.includes('openmaptiles') && !facts.sourceIds.includes('eox-s2cloudless'),
};

/**
 * Tracks every request to the tile provider, so a failure can say whether we
 * were waiting on the app or on bytes we don't control.
 *
 * Deliberately a Playwright-side listener rather than `performance.getEntries`:
 * a `PerformanceResourceTiming` entry is only queued once the fetch *finishes*,
 * so an in-flight request is indistinguishable from one that was never made —
 * which is precisely the distinction needed here. MapLibre keeps serving the old
 * style until the new one parses, so a stalled fetch looks exactly like a broken
 * `mapStyle` binding. OpenFreeMap is free, unmetered and has no SLA; it has been
 * measured serving the 43 kB liberty style in 47.7s while a control download on
 * the same CDN edge ran at 1.2 MB/s.
 *
 * Glyphs matter as much as tiles: Chronas's own `area-labels` /
 * `area-label-lines` sources carry the text layers, so their tiles cannot finish
 * until the fontstack's glyph ranges arrive. With locale `ja` that stack is
 * `Noto Sans Regular`, served by OpenFreeMap — measured at 6.0s/10.9s/12.3s for
 * three ranges while nine planet tiles sat unanswered past 65s.
 */
interface ProviderFetch {
  url: string;
  kind: 'style' | 'font' | 'tile' | 'other';
  done: boolean;
  ms: number;
}

const providerFetches = new WeakMap<Page, ProviderFetch[]>();

function classify(url: string): ProviderFetch['kind'] | null {
  if (/\/styles\/|style\.json/.test(url)) return 'style';
  if (!url.includes('tiles.openfreemap.org')) return null;
  if (url.includes('/fonts/')) return 'font';
  if (url.endsWith('.pbf')) return 'tile';
  return 'other';
}

function trackProviderFetches(page: Page): void {
  if (providerFetches.has(page)) return;
  const log: ProviderFetch[] = [];
  providerFetches.set(page, log);
  const started = new Map<Request, { entry: ProviderFetch; at: number }>();
  page.on('request', (request: Request) => {
    const kind = classify(request.url());
    if (!kind) return;
    const entry: ProviderFetch = {
      url: decodeURIComponent(request.url()).replace('https://tiles.openfreemap.org', ''),
      kind,
      done: false,
      ms: 0,
    };
    log.push(entry);
    started.set(request, { entry, at: Date.now() });
  });
  const settle = (request: Request): void => {
    const record = started.get(request);
    if (!record) return;
    record.entry.done = true;
    record.entry.ms = Date.now() - record.at;
  };
  page.on('requestfinished', settle);
  page.on('requestfailed', settle);
}

function styleRequestState(page: Page): unknown {
  return providerFetches.get(page)?.filter((entry) => entry.kind === 'style') ?? 'not tracked';
}

/** Provider requests still unanswered right now, by kind. */
function providerInFlight(page: Page): ProviderFetch[] {
  return (providerFetches.get(page) ?? []).filter((entry) => !entry.done);
}

async function waitForBasemap(page: Page, basemap: BasemapKey): Promise<StyleFacts> {
  const matches = BASEMAP_SIGNATURES[basemap];
  let facts = await readStyleFacts(page);
  const deadline = Date.now() + 60_000;
  while (!matches(facts) && Date.now() < deadline) {
    await page.waitForTimeout(400);
    facts = await readStyleFacts(page);
  }
  const selected = await page
    .getByTestId('basemap-select')
    .inputValue()
    .catch(() => '<select unreadable>');
  expect(
    matches(facts),
    `basemap "${basemap}" style never became active.\n` +
      `  basemap-select reads: ${selected}\n` +
      `  observed sources: ${JSON.stringify(facts.sourceIds)}\n` +
      `  stylesheet fetches: ${JSON.stringify(styleRequestState(page))}\n` +
      `  map state: ${JSON.stringify(await diagnose(page))}`
  ).toBe(true);
  await waitForStyleParsed(page);
  await waitForOwnSourcesLoaded(page);
  await waitForOwnLayers(page);
  return readStyleFacts(page);
}

/**
 * Boots the map and waits until it is assertable.
 *
 * Pins the hosted stylesheets by default; pass `{ liveStyles: true }` for the
 * tests that are specifically about reaching the real provider.
 */
async function gotoMap(page: Page, { liveStyles = false } = {}): Promise<void> {
  trackProviderFetches(page);
  if (!liveStyles) await pinHostedStyles(page);
  await page.addInitScript({ content: MAP_PROBE });
  // Bounded explicitly: the Vite dev server occasionally stalls a navigation
  // outright (dependency re-optimization mid-run), and without a timeout here
  // that surfaces as the whole test budget expiring inside `goto` with no clue
  // which side stalled.
  await page.goto('/#/?year=1000', { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.getByTestId('app-shell').waitFor({ state: 'visible', timeout: 30_000 });
  await page.getByTestId('map-container').waitFor({ state: 'visible', timeout: 30_000 });
  await waitForStyleParsed(page);
  await waitForOwnSourcesLoaded(page);
  await waitForOwnLayers(page);
}

/** The timeline canvas overlays the sidebar hit area; house pattern from `layer-controls`. */
async function disableTimelinePointerEvents(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      #timeline-portal, #timeline-portal * { pointer-events: none !important; }
      .vis-loading-screen { display: none !important; }
    `,
  });
}

/**
 * Clicks `toggleTestId` until `revealsTestId` is visible.
 *
 * A plain `click()` intermittently blocks on "waiting for navigation to
 * finish": the map writes the viewport into the URL hash on every `moveend`, so
 * a navigation is often in flight while a panel is being opened. The fallback
 * dispatches the click through the DOM, which skips Playwright's actionability
 * wait entirely.
 */
async function clickUntilVisible(
  page: Page,
  toggleTestId: string,
  revealsTestId: string
): Promise<void> {
  const target = page.getByTestId(revealsTestId);
  const toggle = page.getByTestId(toggleTestId);
  const isVisible = async (): Promise<boolean> =>
    target
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);

  if (await isVisible()) return;
  await toggle.click({ force: true }).catch(() => undefined);
  if (await isVisible()) return;
  await toggle.evaluate((element: HTMLElement) => { element.click(); });
  await target.waitFor({ state: 'visible', timeout: 10_000 });
}

async function openLayersPanel(page: Page): Promise<void> {
  await disableTimelinePointerEvents(page);
  await clickUntilVisible(page, 'nav-item-layers', 'layers-content');
}

async function selectBasemap(page: Page, basemap: BasemapKey): Promise<StyleFacts> {
  await openLayersPanel(page);
  await clickUntilVisible(page, 'advanced-section-toggle', 'advanced-section-content');
  await page.getByTestId('basemap-select').selectOption(basemap);
  return waitForBasemap(page, basemap);
}

async function openSettings(page: Page): Promise<void> {
  await disableTimelinePointerEvents(page);
  await clickUntilVisible(page, 'nav-item-settings', 'settings-content');
}

async function selectLocale(page: Page, locale: string): Promise<void> {
  await openSettings(page);
  await page.getByTestId('language-select').selectOption(locale);
}

async function selectLabelNameMode(
  page: Page,
  mode: 'historical' | 'modern' | 'both'
): Promise<void> {
  await openSettings(page);
  await page.getByTestId('label-name-mode-select').selectOption(mode);
}

/**
 * The `text-field` expression MapView should install for a locale.
 *
 * Deliberately re-derived here instead of importing
 * `buildLocalizedNameExpression`: a contract test that imports the
 * implementation's expectation can't detect the implementation changing.
 */
function expectedNameExpression(locale: string): unknown[] {
  const keys =
    locale === 'zh'
      ? ['name:zh-Hans', 'name:zh-Hant', 'name:zh']
      : [`name:${locale}`];
  return ['coalesce', ...[...keys, 'name:latin', 'name'].map((key) => ['get', key])];
}

/** Waits until every name-bearing basemap symbol layer carries `expected`. */
async function waitForLocalizedLabels(page: Page, locale: string): Promise<StyleFacts> {
  const expected = JSON.stringify(expectedNameExpression(locale));
  const deadline = Date.now() + 30_000;
  let facts = await readStyleFacts(page);
  const isLocalized = (candidate: StyleFacts): boolean =>
    candidate.basemapSymbols
      .filter((layer) => referencesName(layer.textField))
      .every((layer) => JSON.stringify(layer.textField) === expected);

  while (!isLocalized(facts) && Date.now() < deadline) {
    await page.waitForTimeout(400);
    facts = await readStyleFacts(page);
  }
  return facts;
}

/** Mirror of `textFieldReferencesName` — matches a `name`-family field reference. */
function referencesName(textField: unknown): boolean {
  if (textField === null || textField === undefined) return false;
  const serialized = typeof textField === 'string' ? textField : JSON.stringify(textField);
  return /(?:^|[^a-z])name(?:[^a-z]|$)/i.test(serialized);
}

function nameBearing(facts: StyleFacts): { id: string; textField: unknown }[] {
  return facts.basemapSymbols.filter((layer) => referencesName(layer.textField));
}

function layerById(facts: StyleFacts, id: string): { id: string; textField: unknown; visibility: string } {
  const layer = facts.basemapSymbols.find((candidate) => candidate.id === id);
  expect(layer, `symbol layer "${id}" is missing from the style`).toBeDefined();
  return layer!;
}

function mapboxRequests(log: RequestLog): string[] {
  return log.urls.filter((url) => {
    // Match on hostname, not the raw URL: our own vendored
    // `mapbox-gl-rtl-text.js` is a same-origin path containing "mapbox".
    try {
      return /(^|\.)mapbox\.com$/.test(new URL(url).hostname);
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------------------
// 1. Token-free — the acceptance criterion of issue #46
// ---------------------------------------------------------------------------

test.describe('Basemap: token-free rendering', () => {
  test('renders the map without contacting Mapbox at all', async ({ page }) => {
    const log = collectRequests(page);
    // Live: the acceptance criterion is about what the real app fetches, so
    // nothing here may be served from a fixture.
    await gotoMap(page, { liveStyles: true });

    expect(mapboxRequests(log), 'the migration must not talk to Mapbox').toEqual([]);
    expect(log.urls.filter((url) => url.includes('access_token='))).toEqual([]);
  });

  test('loads the OpenFreeMap style and its vector tiles', async ({ page }) => {
    const log = collectRequests(page);
    await gotoMap(page, { liveStyles: true });

    const openfreemap = (): string[] => log.urls.filter((url) => url.includes('tiles.openfreemap.org'));
    expect(
      openfreemap().some((url) => url.includes('/styles/liberty')),
      'the default basemap must be fetched from OpenFreeMap'
    ).toBe(true);
    // Polled, not read once: `gotoMap` returns as soon as *our* sources are
    // assertable, and when the provider is slow to hand over the stylesheet the
    // map has not asked for a single basemap tile by then. A bounded poll keeps
    // the assertion real while attributing a genuine outage to the provider.
    await expect
      .poll(() => openfreemap().filter((url) => /\.pbf(\?|$)/.test(url)).length, {
        message: 'OpenFreeMap was asked for no protobuf tile or glyph at all',
        timeout: 60_000,
      })
      .toBeGreaterThan(0);
  });

  test('never shows the removed Mapbox token gate', async ({ page }) => {
    await gotoMap(page);

    await expect(page.getByText(/token missing/i)).toHaveCount(0);
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 2a. Provider contract — the live drift detector
//
// The only tests that read the real stylesheets. They do it over plain HTTP with
// no map, so they cost one request each and cannot be destabilised by tile
// throughput; everything else in this file runs against the committed snapshots.
// If OpenFreeMap renames or drops a layer, this is what goes red, and the fix is
// to re-snapshot `tests/fixtures/openfreemap/` and re-check the assumptions.
// ---------------------------------------------------------------------------

test.describe('Provider contract: live OpenFreeMap styles', () => {
  const LIVE_EXPECTATIONS = {
    liberty: { symbolCount: 25, nameBearing: 20, relief: ['natural_earth'] },
    positron: { symbolCount: 19, nameBearing: 16, relief: [] as string[] },
  };

  /**
   * Fetches a live style, retrying transport-level failures.
   *
   * OpenFreeMap resets connections under load (observed: `read ECONNRESET` on a
   * plain 43 kB GET), and a drift detector that goes red on a reset stops being
   * read. Only the *content* of a successful response is allowed to fail the test.
   */
  async function fetchLiveStyle(
    request: APIRequestContext,
    name: (typeof HOSTED_STYLES)[number]
  ): Promise<HostedStyle> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await request.get(`https://tiles.openfreemap.org/styles/${name}`, {
          timeout: 120_000,
        });
        expect(response.status(), `${name} did not return 200`).toBe(200);
        return (await response.json()) as HostedStyle;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`could not fetch the live ${name} style in 3 attempts`, { cause: lastError });
  }

  for (const name of HOSTED_STYLES) {
    test(`${name} still matches the committed snapshot's invariants`, async ({ request }) => {
      const live = styleInvariants(await fetchLiveStyle(request, name));
      const pinned = styleInvariants(JSON.parse(readStyleFixture(name)) as HostedStyle);
      const expectations = LIVE_EXPECTATIONS[name];

      // Absolute expectations, so a drift is legible without diffing files.
      expect(live.symbolCount, `${name} symbol layer count drifted`).toBe(expectations.symbolCount);
      expect(live.nameBearingIds.length, `${name} name-bearing layer count drifted`).toBe(
        expectations.nameBearing
      );
      expect([...live.placeLabelIds].sort()).toEqual([...PLACE_LABEL_IDS].sort());
      expect(live.reliefLayerIds).toEqual(expectations.relief);
      expect(live.glyphs).toBe('https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf');
      expect(live.sprite).toBeTruthy();

      // And the snapshot the rest of the suite runs against is still faithful.
      // Compared after the assertions above so their failure messages come first,
      // and on copies, because `expect(...).toEqual` on a sorted array would
      // otherwise be comparing something these assertions had reordered in place.
      expect(live, `${name} drifted from tests/fixtures/openfreemap/${name}.json`).toEqual(pinned);
    });
  }

  test('liberty still carries the three ref-only route shields', async ({ request }) => {
    const live = styleInvariants(await fetchLiveStyle(request, 'liberty'));
    expect([...live.refOnlyIds].sort()).toEqual([...REF_ONLY_SHIELD_IDS].sort());
  });
});

// ---------------------------------------------------------------------------
// 2b. Style contract, per basemap — asserted against the pinned stylesheets
// ---------------------------------------------------------------------------

test.describe('Basemap: style contract', () => {
  for (const basemap of ['topographic', 'light'] as const) {
    test(`${basemap} exposes the place label layers and localizes every name-bearing symbol layer`, async ({
      page,
    }) => {
      await gotoMap(page);
      if (basemap !== 'topographic') await selectBasemap(page, basemap);
      const facts = await waitForLocalizedLabels(page, 'en');

      // The label layers the historical/modern toggle and localization depend on.
      for (const id of PLACE_LABEL_IDS) {
        expect(facts.layerIds, `${basemap} lost place label layer "${id}"`).toContain(id);
      }

      // Every layer we expect to be localizable is, including the road/POI/airport
      // ones the old id-based filter missed.
      const localized = new Set(nameBearing(facts).map((layer) => layer.id));
      for (const id of NAME_BEARING_IDS[basemap]) {
        expect(localized, `${basemap} lost name-bearing symbol layer "${id}"`).toContain(id);
      }

      // And *every* name-bearing layer got rewritten — count-independent, so a
      // new upstream label layer is covered automatically.
      const expected = JSON.stringify(expectedNameExpression('en'));
      for (const layer of nameBearing(facts)) {
        expect(
          JSON.stringify(layer.textField),
          `${layer.id} was not localized`
        ).toBe(expected);
      }
    });

    test(`${basemap} leaves the route-shield layers reading ref`, async ({ page }) => {
      await gotoMap(page);
      if (basemap !== 'topographic') await selectBasemap(page, basemap);
      await waitForLocalizedLabels(page, 'en');
      const facts = await readStyleFacts(page);

      for (const id of REF_ONLY_SHIELD_IDS) {
        expect(layerById(facts, id).textField).toEqual(REF_ONLY_TEXT_FIELD);
      }
    });
  }

  test('satellite renders the keyless EOX raster source', async ({ page }) => {
    const log = collectRequests(page);
    await gotoMap(page);
    const facts = await selectBasemap(page, 'satellite');

    expect(facts.sourceIds).toContain('eox-s2cloudless');
    expect(facts.layerIds).toContain('eox-s2cloudless');
    expect(mapboxRequests(log)).toEqual([]);

    const rasterRequests = log.urls.filter((url) => url.includes('tiles.maps.eox.at'));
    expect(rasterRequests.length).toBeGreaterThan(0);
    expect(rasterRequests.some((url) => url.includes('access_token'))).toBe(false);
  });

  test('none renders only a background, with our layers on top', async ({ page }) => {
    await gotoMap(page);
    const facts = await selectBasemap(page, 'none');

    expect(facts.layerIds).toContain('background');
    expect(facts.basemapSymbols).toEqual([]);
    for (const id of OWN_LAYER_IDS) {
      expect(facts.layerIds, `own layer "${id}" missing on the empty basemap`).toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Label localization — asserted on the style, not a screenshot
// ---------------------------------------------------------------------------

test.describe('Basemap: label localization', () => {
  test('switching to Arabic rewrites country, road and POI labels to name:ar', async ({
    page,
  }) => {
    await gotoMap(page);
    await selectLocale(page, 'ar');
    const facts = await waitForLocalizedLabels(page, 'ar');
    const expected = expectedNameExpression('ar');

    // A `place` label — covered by the old Mapbox-era id filter too.
    expect(layerById(facts, 'label_country_1').textField).toEqual(expected);
    // Road and POI labels — these are the ones the id filter silently missed.
    expect(layerById(facts, 'highway-name-major').textField).toEqual(expected);
    expect(layerById(facts, 'poi_r20').textField).toEqual(expected);
  });

  test('Chinese uses the script-specific coalesce chain', async ({ page }) => {
    await gotoMap(page);
    await selectLocale(page, 'zh');
    const facts = await waitForLocalizedLabels(page, 'zh');

    // `name:zh` is populated inconsistently in OpenMapTiles, so the
    // script-specific keys must come first and `name` must terminate the chain.
    expect(layerById(facts, 'label_country_1').textField).toEqual([
      'coalesce',
      ['get', 'name:zh-Hans'],
      ['get', 'name:zh-Hant'],
      ['get', 'name:zh'],
      ['get', 'name:latin'],
      ['get', 'name'],
    ]);
  });

  test('localization does not touch the route-shield layers', async ({ page }) => {
    await gotoMap(page);
    await selectLocale(page, 'ja');
    const facts = await waitForLocalizedLabels(page, 'ja');

    for (const id of REF_ONLY_SHIELD_IDS) {
      expect(
        layerById(facts, id).textField,
        `${id} must keep rendering route numbers, not names`
      ).toEqual(REF_ONLY_TEXT_FIELD);
    }
  });

  test('leaves our own symbol layers to react-map-gl', async ({ page }) => {
    await gotoMap(page);
    await selectLocale(page, 'de');
    await waitForLocalizedLabels(page, 'de');

    // The locale effect walks the whole style, so it must skip layers whose
    // layout properties react-map-gl owns declaratively.
    const ownTextFields = await page.evaluate<[string, string][]>(() => {
      const map = (window as any).__chronasMap;
      return ['markers-label', 'area-labels-points'].map(
        (id): [string, string] => [id, JSON.stringify(map.getLayoutProperty(id, 'text-field') ?? null)]
      );
    });
    const localized = JSON.stringify(expectedNameExpression('de'));
    for (const [id, textField] of ownTextFields) {
      expect(textField, `${id} must not be rewritten by the locale effect`).not.toBe(localized);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Historical / modern label toggle
// ---------------------------------------------------------------------------

test.describe('Basemap: historical and modern label modes', () => {
  const COUNTRY_AND_STATE_IDS = [
    'label_country_1',
    'label_country_2',
    'label_country_3',
    'label_state',
  ];

  async function waitForVisibility(
    page: Page,
    expectedVisibility: 'none' | 'visible'
  ): Promise<StyleFacts> {
    const deadline = Date.now() + 20_000;
    let facts = await readStyleFacts(page);
    const matches = (candidate: StyleFacts): boolean =>
      COUNTRY_AND_STATE_IDS.every(
        (id) =>
          candidate.basemapSymbols.find((layer) => layer.id === id)?.visibility ===
          expectedVisibility
      );
    while (!matches(facts) && Date.now() < deadline) {
      await page.waitForTimeout(400);
      facts = await readStyleFacts(page);
    }
    return facts;
  }

  test('historical mode hides the basemap country and state labels', async ({ page }) => {
    await gotoMap(page);
    // 'historical' is the default, but assert through an explicit switch so the
    // test also covers the modern → historical transition.
    await selectLabelNameMode(page, 'modern');
    await waitForVisibility(page, 'visible');
    await selectLabelNameMode(page, 'historical');
    const facts = await waitForVisibility(page, 'none');

    for (const id of COUNTRY_AND_STATE_IDS) {
      expect(layerById(facts, id).visibility, `${id} should be hidden`).toBe('none');
    }
  });

  test('modern and both modes show them', async ({ page }) => {
    await gotoMap(page);

    for (const mode of ['modern', 'both'] as const) {
      await selectLabelNameMode(page, mode);
      const facts = await waitForVisibility(page, 'visible');
      for (const id of COUNTRY_AND_STATE_IDS) {
        expect(layerById(facts, id).visibility, `${id} in ${mode} mode`).toBe('visible');
      }
    }
  });

  test('leaves city and POI labels alone in every mode', async ({ page }) => {
    await gotoMap(page);
    await selectLabelNameMode(page, 'historical');
    const facts = await waitForVisibility(page, 'none');

    // The toggle is scoped to country/state; hiding city labels was never the
    // behaviour and would be a visible regression.
    expect(layerById(facts, 'label_city').visibility).toBe('visible');
    expect(layerById(facts, 'label_town').visibility).toBe('visible');
  });
});

// ---------------------------------------------------------------------------
// 5. A basemap swap must re-apply both label effects
// ---------------------------------------------------------------------------

test.describe('Basemap: switching styles', () => {
  test('re-applies localization and label visibility after a swap', async ({ page }) => {
    await gotoMap(page);
    await selectLocale(page, 'ja');
    await waitForLocalizedLabels(page, 'ja');

    // Swapping `mapStyle` tears down and rebuilds the style; without the
    // `styledata` re-fire the new basemap silently keeps its local-language
    // labels, because the effects throw into a swallowing try/catch while the
    // style is still parsing.
    await selectBasemap(page, 'light');
    const facts = await waitForLocalizedLabels(page, 'ja');
    const expected = JSON.stringify(expectedNameExpression('ja'));

    for (const id of NAME_BEARING_IDS.light) {
      expect(
        JSON.stringify(layerById(facts, id).textField),
        `${id} lost its localization across the basemap swap`
      ).toBe(expected);
    }
    // The visibility effect must survive the swap too.
    expect(layerById(facts, 'label_country_1').visibility).toBe('none');
  });

  test('survives a round trip through all four basemaps', async ({ page }) => {
    // Four stylesheet fetches, three of them from OpenFreeMap — the only test
    // here that waits out more than one swap, so it needs more than the
    // file-wide budget.
    test.setTimeout(300_000);
    const log = collectRequests(page);
    await gotoMap(page);

    for (const basemap of ['satellite', 'none', 'light', 'topographic'] as const) {
      const facts = await selectBasemap(page, basemap);
      expect(facts.errors, `map errors after switching to ${basemap}`).toEqual([]);
      for (const id of OWN_LAYER_IDS) {
        expect(facts.layerIds, `own layer "${id}" lost on ${basemap}`).toContain(id);
      }
    }
    expect(mapboxRequests(log)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. Glyphs, sprites and marker icons
// ---------------------------------------------------------------------------

test.describe('Basemap: glyphs and images', () => {
  test('resolves every custom marker icon with no missing images', async ({ page }) => {
    await gotoMap(page);
    await page.waitForTimeout(3_000);

    const icons = await page.evaluate(
      (ids: string[]) => {
        const map = (window as any).__chronasMap;
        return ids.map((id) => [id, map.hasImage(id)] as const);
      },
      MARKER_ICON_IDS
    );
    for (const [id, present] of icons) {
      expect(present, `marker icon "${id}" was not registered`).toBe(true);
    }

    const facts = await readStyleFacts(page);
    // MapLibre v6 only fires `styleimagemissing` once the resolver has failed,
    // so anything here is genuinely unresolvable — a Maki-era sprite id, say.
    expect(facts.missingImages).toEqual([]);
  });

  test('every glyph request succeeds', async ({ page }) => {
    const log = collectRequests(page);
    await gotoMap(page);
    await page.waitForTimeout(3_000);

    const glyphFailures = log.failures.filter((failure) => failure.url.includes('.pbf'));
    expect(glyphFailures, 'a font stack is not served by its glyph endpoint').toEqual([]);

    // Comma-joined stacks are a single request, and OpenFreeMap only serves
    // exact single-font names, so any comma in a glyph URL is a latent 404.
    const glyphRequests = log.urls.filter((url) => /\/fonts\/[^/]+\/\d+-\d+\.pbf/.test(url));
    expect(glyphRequests.length).toBeGreaterThan(0);
    for (const url of glyphRequests) {
      const stack = decodeURIComponent(/\/fonts\/([^/]+)\//.exec(url)![1]!);
      expect(stack, `multi-font stack "${stack}" cannot be served`).not.toContain(',');
    }
  });

  test('serves all three self-hosted font families', async ({ page }) => {
    await gotoMap(page);

    // Latin (0-255) and the Arabic range Cairo exists for (1536-1791).
    for (const font of LOCAL_FONT_NAMES) {
      for (const range of ['0-255', '1536-1791']) {
        const response = await page.request.get(
          `/fonts/${encodeURIComponent(font)}/${range}.pbf`
        );
        expect(response.status(), `/fonts/${font}/${range}.pbf`).toBe(200);
      }
    }
  });

  test('reports no MapLibre errors on first load', async ({ page }) => {
    await gotoMap(page);
    await page.waitForTimeout(3_000);
    const facts = await readStyleFacts(page);
    expect(facts.errors).toEqual([]);
  });

  test('boots the tile worker, so Chronas GeoJSON sources actually parse', async ({ page }) => {
    // The regression this pins is the one that broke the production bundle and
    // is invisible to every other check: MapLibre locates its own worker with
    // `new URL('./maplibre-gl-worker.mjs', import.meta.url)` and never verifies
    // the result, so when the URL is wrong the canvas still mounts, raster
    // relief still draws, no `error` event fires — and every source silently
    // never finishes parsing. `gotoMap` already waits on this; asserting it
    // under its own name is what makes a failure legible instead of showing up
    // as an unrelated timeout further down the file.
    //
    // Asserted on `getSource(id).loaded()`, not `map.isSourceLoaded(id)`: the
    // former is `!_isUpdatingWorker && !_hasPendingWorkerUpdate()` — the worker
    // answered the parse, which needs no third-party bytes and is therefore the
    // exact signal for a dead worker. The latter also requires every in-view tile
    // to be sliced, and our two text sources cannot finish a tile until the
    // fontstack's glyph ranges arrive from OpenFreeMap, so it goes red for the
    // provider's reasons rather than ours.
    await gotoMap(page);
    // Accumulated across polls rather than sampled once: `source.loaded()` is a
    // momentary state, and the app pushes new GeoJSON as the year and dimension
    // change, so a source that has already parsed can read `false` again while a
    // fresh `setData` is in flight. "Parsed at least once" is monotone, converges
    // in milliseconds against a live worker, and never converges against a dead one.
    const parsedEver = new Set<string>();
    await expect
      .poll(
        async () => {
          const report = await workerReport(page);
          for (const id of report.parsedIds) parsedEver.add(id);
          return OWN_SOURCE_IDS.filter((id) => !parsedEver.has(id));
        },
        { message: 'sources the MapLibre worker never answered for', timeout: 30_000 }
      )
      .toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 7. Layer ordering (deck.gl overlay is interleaved into this same style)
// ---------------------------------------------------------------------------

test.describe('Basemap: layer ordering', () => {
  test('draws all Chronas layers above the entire basemap, in order', async ({ page }) => {
    await gotoMap(page);
    const facts = await readStyleFacts(page);

    const indices = OWN_LAYER_IDS.map((id) => {
      const index = facts.layerIds.indexOf(id);
      expect(index, `own layer "${id}" is missing`).toBeGreaterThanOrEqual(0);
      return index;
    });

    // Strictly ascending in the documented order: fills, then borders, then
    // markers/clusters, then labels, then the selected-entity outline.
    for (let i = 1; i < indices.length; i += 1) {
      expect(
        indices[i]!,
        `${OWN_LAYER_IDS[i]!} must come after ${OWN_LAYER_IDS[i - 1]!}`
      ).toBeGreaterThan(indices[i - 1]!);
    }

    // react-map-gl appends without `beforeId`, so our block sits on top of the
    // whole basemap — including its `label_*` symbols, which is what lets the
    // historical area labels read over modern place names.
    const firstOwn = Math.min(...indices);
    const basemapLayerIds = facts.layerIds.filter((id) => !OWN_LAYER_IDS.includes(id));
    for (const id of basemapLayerIds) {
      expect(
        facts.layerIds.indexOf(id),
        `basemap layer "${id}" must render below the Chronas layers`
      ).toBeLessThan(firstOwn);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Interactivity through the real MapLibre event path
// ---------------------------------------------------------------------------

test.describe('Basemap: interactivity', () => {
  test('queries rendered features from the interactive province layers', async ({ page }) => {
    await gotoMap(page);
    await page.waitForTimeout(3_000);

    const featureCount = await page.evaluate(() => {
      const map = (window as any).__chronasMap;
      return map.queryRenderedFeatures({ layers: ['ruler-fill'] }).length;
    });
    expect(featureCount, 'no province features rendered at year 1000').toBeGreaterThan(0);
  });

  test('hovering a province drives the hover highlight through MapLibre events', async ({
    page,
  }) => {
    await gotoMap(page);
    await page.waitForTimeout(3_000);

    // Find a screen point that actually hits a province rather than assuming
    // the canvas centre does. Two extra conditions matter: the canvas must be
    // the topmost element there (the banner, timeline and right drawer overlay
    // parts of it, and would swallow the mouse event), and no marker or area
    // label may be under the cursor — `handleMouseMove` short-circuits on those
    // and never sets `hoverInfo`.
    const point = await page.evaluate(() => {
      const map = (window as any).__chronasMap;
      const canvas = map.getCanvas();
      const box: DOMRect = canvas.getBoundingClientRect();
      const blocking = ['markers-layer', 'clusters', 'area-labels-layer', 'area-labels-points'];
      for (let x = 0.15; x < 0.65; x += 0.05) {
        for (let y = 0.25; y < 0.7; y += 0.05) {
          // The query point must be a `[x, y]` tuple: MapLibre treats a plain
          // `{x, y}` object as the *options* argument, which silently turns a
          // point query into a whole-viewport query.
          const candidate: [number, number] = [
            Math.round(canvas.clientWidth * x),
            Math.round(canvas.clientHeight * y),
          ];
          const client = { x: box.left + candidate[0], y: box.top + candidate[1] };
          if (document.elementFromPoint(client.x, client.y) !== canvas) continue;
          if (map.queryRenderedFeatures(candidate, { layers: blocking }).length > 0) continue;
          if (map.queryRenderedFeatures(candidate, { layers: ['ruler-fill'] }).length === 0) {
            continue;
          }
          return client;
        }
      }
      return null;
    });
    expect(point, 'found no unobstructed province anywhere on screen to hover').not.toBeNull();

    // Two moves: the first only guarantees the pointer is over the canvas, the
    // second produces a mousemove with a delta from there.
    await page.mouse.move(point!.x - 3, point!.y - 3);
    await page.mouse.move(point!.x, point!.y);
    // `area-hover-highlight` paints at 0.8 opacity only while `hoverInfo` is
    // set, so this asserts the whole chain: MapLibre event → React state →
    // style update.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const map = (window as any).__chronasMap;
            return map.getPaintProperty('area-hover-highlight', 'circle-opacity');
          }),
        { timeout: 10_000 }
      )
      .toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// 9. Known regressions are asserted, not discovered later
// ---------------------------------------------------------------------------

test.describe('Basemap: relief and zoom limits', () => {
  test('topographic keeps Natural Earth relief, light has none', async ({ page }) => {
    await gotoMap(page);
    const topographic = await readStyleFacts(page);
    expect(topographic.sourceIds).toContain('ne2_shaded');
    expect(topographic.layerIds).toContain('natural_earth');

    const light = await selectBasemap(page, 'light');
    // Positron ships the source but no layer using it — no relief at any zoom.
    expect(light.sourceIds).toContain('ne2_shaded');
    expect(light.layerIds).not.toContain('natural_earth');
  });

  test('degrades gracefully past the vector tile maxzoom of 14', async ({ page }) => {
    const log = collectRequests(page);
    await gotoMap(page);

    await page.evaluate(() => {
      const map = (window as any).__chronasMap;
      map.jumpTo({ center: [2.35, 48.86], zoom: 16 });
    });
    await page.waitForTimeout(5_000);
    await waitForStyleParsed(page);

    const facts = await readStyleFacts(page);
    // OpenFreeMap serves z15+ as 200 with a zero-byte body, so the map must
    // over-zoom the z14 tiles rather than error out.
    expect(facts.errors, 'over-zooming past z14 must not raise map errors').toEqual([]);
    expect(mapboxRequests(log)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 10. RTL text shaping (a pre-existing gap the migration closes)
// ---------------------------------------------------------------------------

test.describe('Basemap: right-to-left text', () => {
  test('serves the vendored RTL plugin from our own origin', async ({ page }) => {
    await gotoMap(page);
    const response = await page.request.get('/vendor/mapbox-gl-rtl-text.js');
    expect(response.status()).toBe(200);
    // The worker loads it with `importScripts`, so it must be a classic script.
    expect(await response.text()).not.toContain('export default');
  });

  test('renders Arabic labels without MapLibre errors', async ({ page }) => {
    const log = collectRequests(page);
    await gotoMap(page);
    await selectLocale(page, 'ar');
    await waitForLocalizedLabels(page, 'ar');
    await page.waitForTimeout(3_000);

    const facts = await readStyleFacts(page);
    expect(facts.errors).toEqual([]);
    // Registered lazily, so the fetch only happens once a tile carries RTL
    // text — but if it did happen it must have succeeded.
    expect(log.failures.filter((f) => f.url.includes('mapbox-gl-rtl-text'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 11. Attribution — an ODbL licence obligation, not a nicety
// ---------------------------------------------------------------------------

test.describe('Basemap: attribution', () => {
  test('credits OpenStreetMap, OpenFreeMap and Natural Earth', async ({ page }) => {
    await gotoMap(page);

    const attribution = page.locator('.maplibregl-ctrl-attrib');
    await expect(attribution).toHaveCount(1);
    const inner = attribution.locator('.maplibregl-ctrl-attrib-inner');

    // Our own credits are declared on the map and appear with it; the OSM and
    // OpenFreeMap ones are declared by the *source*, so MapLibre only shows them
    // once it has fetched the vector TileJSON — a separate request to the
    // provider. Read `textContent` rather than `innerText` (the control is
    // `compact`, so the credits are collapsed and visually hidden), and poll,
    // because asserting immediately after boot races that fetch.
    await expect(inner).toHaveText(/Natural Earth/i);
    try {
      await expect(inner).toHaveText(/OpenStreetMap/i, { timeout: 60_000 });
    } catch (error) {
      // The obligation and the fetch are the same event: those credits live in
      // `https://tiles.openfreemap.org/planet`, which is also where the tile URLs
      // come from — so if it never answers there is no OSM data on screen to
      // credit. Still fail if the request was never made or already came back,
      // because that would be our bug.
      const pending = providerInFlight(page).filter(
        (entry) => entry.kind === 'other' && entry.url.includes('/planet')
      );
      if (pending.length === 0) throw error;
      test.info().annotations.push({
        type: 'provider-congestion',
        description:
          `the source TileJSON was still unanswered after 60s (${JSON.stringify(pending)}), so ` +
          `no OSM tiles rendered and no credit is owed yet`,
      });
      return;
    }
    await expect(inner).toHaveText(/OpenFreeMap/i);
  });

  test('credits EOX on the satellite basemap', async ({ page }) => {
    await gotoMap(page);
    await selectBasemap(page, 'satellite');

    const text = await page
      .locator('.maplibregl-ctrl-attrib .maplibregl-ctrl-attrib-inner')
      .textContent();
    expect(text).toMatch(/Sentinel-2 cloudless/i);
    expect(text).toMatch(/EOX/i);
  });
});
