# Asset slots

Every image on the site sits in a `.slot`. Until the file exists, the slot
renders as a labelled frame showing its name and intended size — the layout
never collapses, so you can drop assets in one at a time and reload.

Drop a file at the exact path below and it appears. No config, no rebuild.

| File | Size | Used on | Direction |
|---|---|---|---|
| `hero-img.png` | 1145 × 1373 ✅ | Home hero — **poster behind the video** | Already in place. Dark, centred figure. The crop is biased upward (`object-position: center 32%`) so the wordmark sits above the headline — if you swap this for a landscape plate, revisit that value in `css/main.css` §9. Now sits *behind* the hero video as the first paint and the reduced-motion fallback, so it should read as a still from the same edit. |
| `quote-plate.jpg` | 2400 × 1200 | Oppenheimer quote band — home, philosophy | Wide, desaturated, low contrast. Text sits over the **left** half, so put interest on the right. |
| `cta-plate.jpg` | 2400 × 1000 | Closing CTA on every page | Low-key, symmetrical, centre-weighted. Text sits dead centre. |
| `still-01.jpg` | 1200 × 900 | Home + philosophy gallery | 4:3. Grainy, filmic, monochrome-leaning. |
| `still-02.jpg` | 1000 × 750 | Home + philosophy gallery | 4:3. Same treatment as 01. |
| `still-03.jpg` | 800 × 600 | Home + philosophy gallery | 4:3. Same treatment as 01. |
| `dissolve.jpg` | 1000 × 1000 | How it works — "Move 05" tile | Square. Should read as dissipation: smoke, ash, an emptying frame. |
| `agentgod-poster.png` | 1145 × 1373 ✅ | Home "In control" portrait | Already in place. Any 3:4 portrait works. |
| `orchestrator-banner.jpg` | 1500 × 500 ✅ | How it works — banner | Already in place. Any 3:1 wide strip works. |
| `og-card.jpg` | 1200 × 630 | Social share preview | Wordmark + the headline. Not shown on the site itself. |
| `favicon.svg` | — ✅ | Browser tab | Already in place. Replace with your own mark when you have one. |

## Notes

- **Colour treatment is applied in CSS**, not baked into the file. Plates are
  desaturated, darkened, and gradient-masked on the way in — so supply the
  cleanest version you have and let the page grade it. See the `filter`
  declarations under section 8/9/14/19 in [`../css/main.css`](../css/main.css).
- **JPG for photographic plates, PNG only when you need transparency.** The
  full-bleed plates are large; keep them under ~400 KB each.
- **Changing a size?** Slot aspect ratios come from the `slot--16x9`,
  `slot--4x3`, `slot--3x1`, `slot--1x1`, `slot--3x4` classes on the `<figure>`.
  Swap the class to match your file.
- **Adding a new slot?** Copy this shape — the `data-slot` text is what the
  placeholder frame displays, with `&#10;` as the line break:

```html
<figure class="slot slot--16x9" data-reveal="0"
        data-slot="My plate&#10;1600 × 900&#10;assets/my-plate.jpg">
  <img src="assets/my-plate.jpg" alt="">
</figure>
```
