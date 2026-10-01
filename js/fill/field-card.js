/* CARD-FILL · field card (design-ref/card-fill Fill-Kit, Fill-Size): for
   anything that isn't only a choice -- one card holding one control, with
   SKIP / SAVE right-aligned below it, outside the card.
   render(box, field, data, onDone): onDone({ value, said, written }) on
   SAVE, onDone(null) on SKIP. The control comes from CONTROLS by
   field.control; each returns { el, result() }. */
import { h, img } from '../ui.js';
import { openGalleryFor } from '../screens/media.js';
import { PLUS24_SVG } from '../screens/card.js';

const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const fmt = (n) => String(Math.round(n * 10) / 10);

const CONTROLS = {
  /* Size: fired height on a slider; the raw (throwing) height and the clay
     it takes follow from it (constants and formula in the data) */
  size(f) {
    const big = () => h('span', { class: 'fc-big' });
    const firedN = big(), rawN = big(), clayTx = h('div', { class: 'fc-sub' });
    const col = (label, ...kids) => h('div', { class: 'fc-col' }, h('div', { class: 'fc-label' }, label), ...kids);
    const num = (n) => h('div', { class: 'fc-num' }, n, h('span', { class: 'fc-unit' }, f.labels.unit));
    const range = h('input', { class: 'fc-range', type: 'range', min: f.min, max: f.max, step: f.step, value: f.value,
      'aria-label': f.labels.fired });
    const calc = () => {
      const hh = Number(range.value), H = hh / f.shrink, D = f.diameter * H;
      const vol = Math.PI * D * H * f.wall + Math.PI * (D / 2) ** 2 * f.base;
      return { h: fmt(hh), wet: H.toFixed(1), clay: Math.round(vol * f.density * f.trim / 10) * 10 };
    };
    const paint = () => {
      const v = calc();
      firedN.textContent = v.h; rawN.textContent = v.wet; clayTx.textContent = fill(f.labels.clay, v);
    };
    range.addEventListener('input', paint);
    paint();
    return {
      el: h('div', { class: 'fc-body' },
        h('div', { class: 'fc-cols' },
          col(f.labels.fired, num(firedN)),
          col(f.labels.raw, h('div', { class: 'fc-stack' }, num(rawN), clayTx))),
        range),
      result: () => { const v = calc(); return { value: v, said: fill(f.answer, v), written: fill(f.written, v) }; },
    };
  },

  /* Photo: before / after firing side by side. The after slot is the post
   editor's photo tile (.pe-tile, post.js), sized to the slot: the "+" tile
   until a photo is picked from the app's gallery (opened straight away), then
   that photo -- tap it to pick another. SAVE waits
   for a photo. */
  photo(f, ready) {
    let src = null;
    const slot = (label, el) => h('div', { class: 'fc-col' }, h('div', { class: 'fc-label' }, label), el);
    const after = h('button', { class: 'pe-tile add fc-after', type: 'button', html: PLUS24_SVG, 'aria-label': f.labels.add,
      onclick: () => openGalleryFor(after, (s) => {
        src = s;
        after.className = 'pe-tile on fc-after';
        after.setAttribute('aria-label', f.labels.after);
        after.replaceChildren(img(s, f.labels.after));
        ready(true);
      }) });
    ready(false);
    return {
      el: h('div', { class: 'fc-cols tight' },
        slot(f.labels.before, img(f.before.src, f.before.alt, 'fc-photo before')),
        slot(f.labels.after, after)),
      result: () => ({ value: src, said: f.answer, written: f.written, photos: [{ src }] }),
    };
  },
};


export function render(box, f, data, onDone) {
  const save = h('button', { class: 'chx-pill', type: 'button', onclick: () => onDone(control.result()) }, data.save);
  /* a control that needs input first (a photo) holds SAVE until it has it */
  const ready = (on) => { save.disabled = !on; };
  const control = CONTROLS[f.control](f, ready);
  box.append(
    h('div', { class: 'fc-card' }, control.el),
    h('div', { class: 'chx-act' },
      h('button', { class: 'chx-pill skip', type: 'button', onclick: () => onDone(null) }, data.skip),
      save));
  return box;
}
