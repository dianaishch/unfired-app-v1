# Claude Code prompt — card-fill chat widgets

Copy this folder into the repo as `design-ref/card-fill/`, then paste everything below the line into Claude Code (launch from `~/Claude/Projects`).

---

## Task

Build the "card-fill" chat widgets in the UNFIRED prototype (`github.com/dianaishch/unfired-app-v1`, plain HTML/CSS/vanilla JS, no build step). Branch: `chat-widgets` from `redesign-v2`. If `redesign-v2` does not exist, stop and tell me.

**Idea:** a piece card has empty fields. Each empty field opens a chat. The AI asks a guess ("Speckled stoneware, like last time?"), the user answers in one tap or with one control, and the answer is written back to the card.

## Design source

`design-ref/card-fill/designs/` holds the approved designs, one file per screen. Each one is HTML with inline styles, so open it to read layout, sizes and copy.

- They are **specs, not code to copy**. They use a template syntax (`{{value}}`, `<sc-if>`, `<sc-for>`, `class Component extends DCLogic`) that does not run in the prototype. Rebuild them in the app's own HTML/CSS/JS.
- The `<script>` block at the bottom of each file is the behaviour spec: states, options, formulas and copy.
- `Fill-Kit.dc.html` is the rulebook: structure, controls and rules. Read it first.
- `pitcher.png` is a stand-in piece image.

## Screens

| File | Field | Pattern |
|---|---|---|
| Fill-Size | Size (idea) | Field card: slider, fired height + throw height + ≈ clay weight |
| Fill-Clay | Clay | Answer tags |
| Fill-Glaze | Glaze | Answer tags with colour dots |
| Fill-Firing | Firing | Answer tags |
| Fill-Photo | Result photo | Field card: before / after photo slots |
| Fill-Story | Story | Field card: voice note + tags under it |
| Fill-Link | Link to past piece | Field card: two images + tags |
| Fill-Cause | What happened (broken) | Answer tags |
| Fill-Plan | Session plan | Field card: checklist with checkboxes |

**Two patterns, keep them exact:**

1. **Answer tags**, used when the answer is a choice only. There is no card and there are no buttons: the tags sit right-aligned under the AI question, and one tap answers. The guessed answer is highlighted, and the last tag is "Not now".
2. **Field card**, used for everything else. It is one card with one control, with Skip / Save right-aligned below it, outside the card.

Both patterns end the same way: a user bubble with the answer, then a receipt row ("Clay · saved to card" + Undo), then an AI bubble naming the next gap.

## Rules

- Use only the fonts and colours already in the app: Helvetica Neue and the UNFIRED variables (`Background #040404`, `Surface #0e0e0e`, `Surface Raised #181818`, `Border #292929`, `Paper #f6f4ec`, `Text Primary Black #040404`, `Text Tertiary #54524e`) plus the AI bubble gradient `#6ab8ef → #f4f2ec`. Map them to the CSS variables in the repo. If a variable is missing, ask before you add it.
- Glaze dot colours are **content** and live in data, not in CSS.
- Keep all copy and options in `data/card-fill.json`. Build one JS module per pattern (`answer-tags.js`, `field-card.js`, `receipt.js`), not one per screen.
- Use real `<button>` and `<input type="range">` elements. Touch targets are 44 px or larger. Checkboxes use `aria-pressed`.
- No scores or percentages (PRD). The "2 of 5 done" count in Plan is a task count; keep it.

## Workflow (strict)

1. Read `Fill-Kit` and all 9 screens. Write me a short spec table: the tokens used, the two patterns, and the gaps (slider, photo slot, checkbox and receipt are new controls). Wait for my OK.
2. Build the shared shell and the answer-tags pattern with **Clay** first. Render it at 402 px, screenshot it next to `Fill-Clay.dc.html` opened in a browser, and list the mismatches yourself.
3. Wait for my approval, then build the next screen. One screen per approval.
4. Commit after each approved screen. Don't push until I say so.
5. Don't change existing screens or shared CSS without asking.
