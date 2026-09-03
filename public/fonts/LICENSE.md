# Font licences

Each subdirectory here holds a MapLibre/Mapbox **glyph fontstack**: 256 `.pbf`
files, one per Unicode range of 256 codepoints, containing SDF-rendered glyphs.
They are derived assets, not the original font files, so the licence of the
upstream typeface still applies and its notice has to travel with them.

All five families below are licensed under the
**SIL Open Font License, Version 1.1** — full text at
<https://openfontlicense.org/open-font-license-official-text/>.

| Directory | Upstream typeface | Copyright |
|---|---|---|
| `Cinzel Regular/` | [Cinzel](https://fonts.google.com/specimen/Cinzel) | Copyright (c) Natanael Gama |
| `Cairo/` | [Cairo](https://fonts.google.com/specimen/Cairo) | Copyright (c) The Cairo Project Authors |
| `Noto Sans SC/` | [Noto Sans Simplified Chinese](https://fonts.google.com/noto/specimen/Noto+Sans+SC) | Copyright (c) The Noto Project Authors |
| `Noto Sans Regular/` | [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) (merged multi-script build) | Copyright (c) The Noto Project Authors |
| `Noto Sans Bold/` | [Noto Sans](https://fonts.google.com/noto/specimen/Noto+Sans) (merged multi-script build) | Copyright (c) The Noto Project Authors |

The OFL permits redistribution of the fonts and of derivatives such as these
glyph ranges, provided the copyright notice and licence accompany them, which is
what this file is for. It does not require the *application* using the fonts to
be open source.

## Provenance of the two Noto Sans stacks

`Noto Sans Regular` and `Noto Sans Bold` are byte-for-byte copies of the ranges
published at `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`,
rather than regenerated locally from TTFs. That is deliberate: a fresh
[fontnik](https://github.com/mapbox/node-fontnik) build would produce different
SDF output and shift label rendering, whereas copying guarantees the migration
away from the remote glyph endpoint is cartographically a no-op.

They are merged multi-script builds — a single fontstack covering Latin, Greek,
Cyrillic, Arabic, Devanagari, Kana, CJK and Hangul — which is why they are large
(~34 MB each) and why they can serve as the universal `DEFAULT_FONT`. Do not
prune ranges to save space: `languageToFont` routes `el`/`ja`/`ko`/`vi`/`hi`/`ru`
to `Noto Sans Regular`, and a missing range renders as tofu boxes rather than
failing loudly.

See `src/config/mapTheme.ts` (`LOCAL_FONT_NAMES`) for how these are wired up, and
`docs/adr/0001-openfreemap-hosted-basemaps.md` for why they are self-hosted.
