/* CARD-FILL · field card (design-ref/card-fill Fill-Kit, Fill-Size): for
   anything that isn't only a choice -- one card holding one control, with
   SKIP / SAVE right-aligned below it, outside the card.
   render(box, field, data, onDone): onDone({ value, said, written }) on
   SAVE, onDone(null) on SKIP. The control comes from CONTROLS by
   field.control; each returns { el, result() }. */
import { h } from '../ui.js';

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
};

export function render(box, f, data, onDone) {
  const control = CONTROLS[f.control](f);
  box.append(
    h('div', { class: 'fc-card' }, control.el),
    h('div', { class: 'chx-act' },
      h('button', { class: 'chx-pill skip', type: 'button', onclick: () => onDone(null) }, data.skip),
      h('button', { class: 'chx-pill', type: 'button', onclick: () => onDone(control.result()) }, data.save)));
  return box;
}
