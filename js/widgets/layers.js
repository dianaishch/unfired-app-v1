/* Glaze layer order: a test tile showing one glaze poured over the other
   (the top glaze runs down over the bottom one), the two glazes named as
   TOP and BOTTOM with a swap button between them, and what happened last
   time in a paper box. Swap flips the order and the tile. PLAN TEST TILES
   turns into your message. Glaze colours come from the data. */
import { h } from '../ui.js';

const SWAP_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M8 4v15m0 0-3.5-3.5M8 19l3.5-3.5M16 20V5m0 0-3.5 3.5M16 5l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* the tile: the bottom glaze fills it; the top glaze covers the upper part
   with drips running into the bottom one */
const tile = (top, bottom) => `<svg viewBox="0 0 120 150" preserveAspectRatio="none" aria-hidden="true">
  <rect width="120" height="150" fill="${bottom}"/>
  <path d="M0 0H120V78C112 78 110 104 104 104C98 104 97 84 90 84C82 84 80 118 72 118C64 118 63 88 56 88C49 88 47 100 40 100C33 100 32 82 24 82C16 82 14 110 7 110C3 110 0 96 0 90Z" fill="${top}"/>
</svg>`;

export function render(box, data, chat) {
  let top = data.top;
  const g = () => [data.glazes[top], data.glazes[1 - top]];
  const pic = h('div', { class: 'ly-tile' });
  const row = (role) => {
    const dot = h('i'), name = h('span', { class: 'ly-name' });
    return { el: h('div', { class: 'ly-g' }, h('span', { class: 'chx-label' }, role), h('div', { class: 'ly-n' }, dot, name)), dot, name };
  };
  const tRow = row('Top'), bRow = row('Bottom');
  const swap = h('button', { class: 'chx-round ly-swap', type: 'button', html: SWAP_SVG, 'aria-label': 'Swap the order',
    onclick: () => { top = 1 - top; box.classList.add('swapping'); setTimeout(() => { paint(); box.classList.remove('swapping'); }, 160); } });
  const plan = h('button', { class: 'chx-pill', type: 'button', onclick: () => {
    const [a, b] = data.glazes.map(x => x.name);
    chat.act(plan, data.action, data.reply.replaceAll('{a}', a).replaceAll('{b}', b));
  } }, data.action);

  const paint = () => {
    const [t, b] = g();
    pic.innerHTML = tile(t.color, b.color);
    pic.setAttribute('aria-label', `${t.name} over ${b.name}`);
    tRow.dot.style.background = t.color; tRow.name.textContent = t.name;
    bRow.dot.style.background = b.color; bRow.name.textContent = b.name;
  };

  box.append(
    h('div', { class: 'ly' }, pic, h('div', { class: 'ly-order' }, tRow.el, swap, bRow.el)),
    h('div', { class: 'ly-ref' },
      h('div', { class: 'ly-ref-t' }, data.reference.title),
      h('div', { class: 'ly-ref-s' }, data.reference.text)),
    h('div', { class: 'chx-act' }, plan));
  paint();
}
