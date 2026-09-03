# UNFIRED — interactive prototype

Invisible ceramic memory. Capture without administration.

## Run

```bash
python3 -m http.server 4321
```

Then open http://localhost:4321 — the app centres itself in an iPhone-sized
viewport on desktop and fills the screen on a phone.

## Prototype controls

The small ◍ in the corner opens the demo panel:

| Control | Shortcut | What it does |
|---|---|---|
| Shake | ⇧S | Collide — pulls 2–3 archive cards together |
| Lock screen | ⇧L | Live Activity for the current Making card |
| Watch | ⇧W | Simulated Apple Watch dictation |
| Photo scan | ⇧P | Background photo import |
| Log | ⇧K | Global capture surface |
| Onboarding | — | Replays value → permissions → boards |
| Reset demo data | — | Restores the seeded ceramicist |

Real DeviceMotion drives Shake on a phone; the keyboard shortcut is the
desktop equivalent.

## Structure

```
js/seed.js            the seeded ceramicist — 28 connected cards
js/store.js           state, localStorage persistence, undo snapshots
js/ai.js              deterministic mock intelligence (no external API)
js/ui.js              hyperscript, sheets, pages, toasts, icons
js/screens/           items · card · share · capture · insights ·
                      discover · collide · studio · onboarding
assets/pieces/        background-removed cutouts of the real work
assets/process/       greenware / studio variants
assets/snap/          untouched phone-photo variants (share "before")
```

Everything renders from the shared card objects in the store, so a change made
in one place propagates everywhere — archive, search, insights, discover,
collide and share all read the same data.

## The seeded practice

One hand-builder working in cream stoneware at cone 6. Recurring red stars,
animal figures, and a running fight with handles. The continuity is
deliberate: a glaze note logged on one card turns up in semantic search,
becomes an insight, gets reused by the AI on another card, and can end up in
Collide.
