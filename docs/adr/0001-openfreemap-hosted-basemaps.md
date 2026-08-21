# ADR 0001 — Use OpenFreeMap hosted styles instead of self-hosted Protomaps

- **Status:** Accepted
- **Date:** 2026-08-21
- **Context:** issue [#46](https://github.com/Chronasorg/chronas-frontend/issues/46) (MapLibre migration)
- **Supersedes:** the basemap-hosting portion of issue #46's implementation plan (Phase 2 and Phase 4)

## Context

Issue #46 was raised because Mapbox revoked the production access token, which broke
the map with no code change. The migration's goal was to remove the mandatory token,
the recurring bill, and the quota cliff.

The issue proposed **self-hosted Protomaps `.pmtiles`** on the S3 bucket and
CloudFront distribution we already own, with **MapTiler hosted styles** named as the
explicit fallback "if visual parity / least effort is preferred". Phase 4 of the plan
was to upload the `.pmtiles` archive and verify CloudFront serves HTTP Range requests,
which pmtiles requires.

The branch ships **neither**. `topographic` and `light` point at OpenFreeMap's hosted
styles, fetched from the provider at runtime:

```
topographic: https://tiles.openfreemap.org/styles/liberty
light:       https://tiles.openfreemap.org/styles/positron
satellite:   /styles/satellite-eox.json   (local JSON, EOX raster tiles)
none:        /styles/empty.json           (local JSON, no basemap)
```

This ADR records that deviation, because it was made during implementation and never
written down. The decision is not being re-litigated here; it is being documented so
that the risk it carries is visible to whoever operates this next.

## Decision

Use OpenFreeMap's hosted `liberty` and `positron` styles for the two vector basemaps.

## Why

- **It fully meets the issue's actual goal.** OpenFreeMap is keyless: no token to
  revoke, no account, no quota, no bill. That is the failure mode #46 exists to remove.
- **It removed a whole phase of work and a live infrastructure risk.** The pmtiles path
  depended on CloudFront serving HTTP Range requests correctly — listed as risk #2 in
  the issue, and unverified. OpenFreeMap needs no infrastructure from us at all.
- **The vector schema is OpenMapTiles**, which carries the multilingual `name:xx`
  fields the label-language switching and historical/modern label toggle depend on —
  the same property that made Protomaps viable.

## Consequences

### Accepted downside: a single-operator free service with no SLA

This is the material difference from what #46 approved. Self-hosted pmtiles on our own
CloudFront would have had our availability; OpenFreeMap has its operator's. During
development its throughput was measured varying by more than an order of magnitude
minute to minute, at times down to roughly 5 kB/s — slow enough that
`tests/e2e/basemap-maplibre.spec.ts` needed a 240s timeout and a dedicated
"provider congestion" annotation path to stay honest about provider outages rather
than reporting them as our bugs.

Mitigations already in the branch:

- The hosted stylesheets are pinned to committed fixtures under
  `tests/fixtures/openfreemap/`, so tests assert against our code, not the provider's
  current mood, and a separate `Provider contract` group detects upstream drift.

### Open: the third-party dependency is not gone, only the token

Tiles still come from OpenFreeMap. Glyphs no longer do.

**Closed — glyphs are fully self-hosted.** The `glyphs` URL in
`public/styles/empty.json` and `public/styles/satellite-eox.json` still names
OpenFreeMap, but nothing reaches it: `LOCAL_FONT_NAMES` now covers every
fontstack Chronas references, and `transformRequest` rewrites all of them to
`public/fonts/`. `Noto Sans Regular` and `Noto Sans Bold` joined
`Cinzel Regular`, `Cairo` and `Noto Sans SC` there (256 ranges each), which was
the gap that mattered: those two carry `DEFAULT_FONT`, `DEFAULT_BOLD_FONT`, the
`cluster-count` and `markers-label` layers, and area labels for
el/ja/ko/vi/hi/ru — all Chronas's own layers, which previously died with
OpenFreeMap even on the dependency-free `none` basemap.

The ranges are byte-for-byte copies of OpenFreeMap's rather than a local fontnik
build, so label rendering is unchanged; see `public/fonts/LICENSE.md` for the
provenance note and the SIL OFL 1.1 notice. The cost is ~68 MB of `.pbf` in the
repo, because both are merged multi-script builds whose CJK ranges dominate
(171 of 256 files exceed 100 kB). That was accepted knowingly: pruning ranges
would save most of it but renders tofu boxes instead of failing loudly, and
`Noto Sans SC` had already set the precedent at 23 MB. Clients are unaffected —
MapLibre fetches ranges on demand, so a Latin-only session still pulls a
handful of files.

Guarded by two E2E tests: `serves the scripts our locales need, from our own
origin` (asserts all eight script blocks carry real glyph data locally) and
`requests no glyphs from a third party` (fails if any fontstack escapes to a
remote glyph endpoint).

**Still open — ~12 MB of relief raster on a cold first visit.** A single boot at
the default z2.5 globe issues 161 Natural Earth relief tile requests (119
distinct URLs, ~11.9 MB). `ne2_shaded` in `liberty` is `tileSize: 256,
maxzoom: 6`, so MapLibre fetches one zoom deeper, and the globe projection
applies that across the whole visible sphere rather than a flat viewport. Tiles
are `max-age=315360000`, so repeat visits are cached, but first-visit throughput
is exactly the exposure above. Serving our own patched copy of `liberty` from
`public/styles/` would let us cap the relief maxzoom, declare
`projection: {type: "globe"}` in the stylesheet instead of at runtime, and drop
the runtime style fetch — three fixes in one file, and a step back toward the
self-hosting #46 asked for.

### Also note

- `docs/maplibre-migration-plan.md`, which #46 says "lives at" that path and would be
  committed with the branch, was never written. This ADR covers the basemap-hosting
  decision only; the rest of that plan exists solely in the issue.
- Satellite imagery came from EOX Sentinel-2 cloudless rather than the Esri World
  Imagery named in the issue, deliberately: the 2016 `s2cloudless_3857` mosaic is
  CC BY 4.0, whereas later years are CC BY-NC-SA 4.0, which would impose a
  NonCommercial restriction. See the `metadata` block in
  `public/styles/satellite-eox.json`.

## Alternatives considered

| Option | Token-free | Our availability | Cost | Why not chosen |
|---|---|---|---|---|
| Self-hosted Protomaps pmtiles (issue's plan) | Yes | Yes | S3/CF only | Needs verified CloudFront Range support and an upload/refresh path; ~½d more plus ongoing archive maintenance. Still the right end state for the two items above. |
| MapTiler hosted (issue's fallback) | **No** | No | Free tier then paid | Keeps a vendor key — reintroduces exactly the revocation and quota failure mode #46 exists to remove. |
| **OpenFreeMap hosted (chosen)** | Yes | **No** | Free | Accepted: no SLA, single operator. |

## Revisit if

- OpenFreeMap announces shutdown, rate limits, or requires accounts.
- First-visit basemap traffic becomes a measured problem for real users.
- We want our own labels to survive an OpenFreeMap outage — item 1 above is the
  cheapest fix and does not require changing basemap hosting at all.
