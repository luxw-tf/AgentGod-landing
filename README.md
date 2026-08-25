# AgentGod — landing site

Static, zero-build marketing site. No bundler, no dependencies, no install step.
Open `index.html` in a browser and it works.

```
index.html          Overview — hero, premise, quote, domain, control, CTA
how-it-works.html   Topology diagram, the five moves, the trace
philosophy.html     The Oppenheimer inheritance, creation, destruction, authority
docs.html           Install, first run, scopes, trace, halt, CLI reference

css/main.css        One stylesheet, 25 numbered sections (index at the top)
js/main.js          Slots, hero video, nav, reveal, terminal typewriter, scrollspy
assets/             Images + README.md listing every slot and its size
check.js            Static sanity check — run with `node check.js`
```

## Running it

Any static server, or just open the file:

```sh
python -m http.server 8000    # then visit http://localhost:8000
```

Deploys as-is to Netlify, Vercel, Cloudflare Pages, or GitHub Pages — no build
command, publish directory is the repo root.

## Adding your assets

Every image is a `.slot`. Until the file exists, the slot renders a labelled
frame showing its name and intended dimensions, so the layout never collapses
and you can drop assets in one at a time.

See **[assets/README.md](assets/README.md)** for the full table: filename,
size, where it appears, and art direction for each.

Three of your assets are already wired in (`hero-img.png`,
`agentgod-poster.png`, `orchestrator-banner.jpg`). The rest show as
placeholders.

> **Compress these two before launch.** `hero-img.png` (2.6 MB) and
> `agentgod-poster.png` (2.8 MB) are each ~20x larger than everything else on
> the home page combined. The hero one matters most — it's the largest
> contentful paint, so it directly sets how slow the site feels on first load.
> WebP at quality ~82 will take both under 300 KB with no visible difference at
> these sizes.

## Hero video

The home hero opens on a Mux-hosted AMV edit, plays it once, then dissolves to
the still underneath. The copy is deliberately dialled down to a supporting
role throughout.

Both knobs live on one element in [`index.html`](index.html):

```html
<div class="hero__video"
     data-video="YOUR_MUX_PLAYBACK_ID"
     data-video-duration="9657"></div>
```

`data-video-duration` is the asset length in milliseconds. Get it for a new
edit by summing the segment durations in the HLS manifest:

```sh
ID=your_playback_id
# Variant URLs carry query strings, so match on '.m3u8' anywhere in the line
# and skip the #EXT-X-MEDIA audio entries.
VAR=$(curl -s "https://stream.mux.com/$ID.m3u8" | grep -v '^#' | grep -m1 '\.m3u8')
curl -s "$VAR" | grep '^#EXTINF' | sed 's/#EXTINF://; s/,.*//' \
  | awk '{s+=$1} END {print int(s*1000), "ms"}'
```

### The sequence

| t | What happens |
|---|---|
| 0 ms | Iframe injected on DOMContentLoaded, muted autoplay, no loop |
| +700 ms | Edit faded in over the still |
| +8.4 s | Dissolve begins — 1.8 s cross-fade down to the still |
| +10.2 s | Dissolve complete, ~150 ms before the final frame |
| +10.4 s | Iframe removed from the DOM |

Timing constants are `FADE_OUT` / `STARTUP` / `MARGIN` in
[`js/main.js`](js/main.js) → `initHeroVideo`. `FADE_OUT` must stay in step with
the `.hero__video` transition in `css/main.css` §9.

The iframe is removed rather than just hidden, which stops decoding and — more
importantly — means the control bar Mux shows on `ended` is never revealed as
the still comes up.

### Other behaviour

- **Cover-sized, never letterboxed.** The iframe is a 16:9 box scaled by
  viewport units so exactly one axis overshoots. Wide viewports crop
  top/bottom, tall ones crop the sides.
- **Non-interactive.** `pointer-events: none`, so clicks pass through to the
  page and hovering never surfaces controls.
- **Skipped entirely under `prefers-reduced-motion`.** The iframe is never
  requested and `assets/hero-img.png` is simply what you see. An AMV edit is a
  lot of motion to force on someone who asked for less.
- **The still is deprioritised** (`fetchpriority="low"`). It is not needed
  until the dissolve ~9.5 s in, so it must not compete with the video stream
  for bandwidth early on.

### Two known constraints

**Controls can't be disabled via the iframe.** `player.mux.com` honours
`autoplay`, `muted`, `loop` and `nohotkeys` as query params but drops
`controls` — verified against the rendered `<mux-player>` element. Mux
auto-hides them after a couple of seconds of no input, and the iframe receives
none, so they go away and stay away. But because the edit now leads rather than
fading in later, they are briefly visible at the very start. The hero's opaque
bottom gradient covers most of that region; it is not fully eliminated.

**No audio, and no way to add an unmute toggle.** Muted autoplay is the only
kind browsers permit, and the iframe is cross-origin so its volume isn't
reachable from the page. For an AMV that loses half the point.

Both constraints disappear if you drop the iframe for a native `<video>` on the
HLS stream — `https://stream.mux.com/{PLAYBACK_ID}.m3u8`, which is public on
this asset. That gives guaranteed zero chrome, a real `ended` event instead of a
duration timer, and room for a "sound on" control, at the cost of adding hls.js
(~150 KB from a CDN) for non-Safari browsers.

## Design system

Everything is driven by custom properties at the top of `css/main.css`. Change
a token, the whole site follows.

**Colour.** Warm-neutral blacks rather than blue-black, so it reads as film
stock instead of terminal. Two accents carry the whole brand argument:

| Token | Value | Meaning |
|---|---|---|
| `--create` | `#A9C6E4` | Cold light. Creation, links, active state, the eyebrow index. |
| `--destroy` | `#C9552B` | Ember. Termination only — never decoration. |

Colour is scarce on purpose. If ember shows up somewhere that isn't about
destruction, it's a bug.

**Type.** Three families, each with one job:

- `Instrument Serif` — display and pull quotes. Carries the cinematic weight.
- `Inter Tight` — body and UI.
- `JetBrains Mono` — eyebrows, labels, section numbers, terminal. The technical
  register that keeps the serif from tipping into perfume ad.

**Motion.** Slow, one-directional, no bounce. Reveals are an 18px rise and a
fade over 1.1s. Everything collapses to nothing under
`prefers-reduced-motion`.

**Atmosphere.** Animated film grain and a vignette sit in a fixed
`pointer-events: none` layer above the page. It's what makes flat colour feel
photographed. Turn it down by lowering `.atmosphere__grain` opacity.

## Editing content

Copy lives directly in the HTML — no CMS, no JSON. The repeated pieces are the
nav and footer blocks, duplicated across the four pages. If that becomes
annoying, that's the point at which a static site generator earns its keep;
until then duplication is cheaper than a build step.

The two terminal sessions are data, not markup — edit the `SCRIPTS` object in
[`js/main.js`](js/main.js). Each line takes a `tone` of `create`, `destroy`,
`dim`, or `default`.

## Before launch

- [ ] Replace placeholder assets (see [assets/README.md](assets/README.md))
- [ ] Compress `hero-img.png` and `agentgod-poster.png` (2.6 MB / 2.8 MB)
- [ ] Add `assets/og-card.jpg` (1200 × 630) — social previews are blank without it
- [ ] Point `Launch app` at the real product URL (currently `#launch`)
- [ ] Fill in the X / Discord hrefs in the nav footer of all four pages
- [ ] Set the real contact address (currently `hello@agentgod.ai`)
- [ ] Swap `assets/favicon.svg` for your own mark
- [ ] Confirm the hero edit autoplays on Safari and on iOS — muted autoplay is
      the strictest case, and low-power mode blocks it outright
- [ ] Run `node check.js` — catches dead links, dead anchors, undefined classes,
      unbalanced tags
