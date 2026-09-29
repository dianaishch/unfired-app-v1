/* INSIGHTS — patterns pulled out of the same dataset. Not a dashboard. */
import { h, squircle } from '../ui.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard } from './card.js';
import { openSearch } from './items.js';

export function renderInsights(root) {
  const scroll = h('div', { class: 'scroll' });
  const list = AI.insights();

  /* intro heading + "Derived from…" line removed per your call; a small
     spacer keeps the first panel off the tabs */
  scroll.append(h('div', { style: { height: '4px' } }));
  list.forEach(i => scroll.append(panel(i)));

  scroll.append(h('div', { class: 'ins-foot' },
    'Estimates and patterns, not guarantees. Firing and glaze figures come from what you recorded.'));

  root.replaceChildren(scroll);
}

/* Figma 583:8265: the headline reads as one sentence ("21 pieces fired"),
   not the stacked caps the data is written in */
const sentence = (s) => {
  const t = (s || '').replace(/\s*\n\s*/g, ' ').replace(/\.$/, '').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};
/* "Blue, then red": eight arch bars, the blue-leaning share bright */
const EVO_H = [76, 96, 100, 69, 59, 70, 69, 50];

function panel(i) {
  /* a text-only card (no chart, no button) is as tall as its text */
  const el = h('div', { class: 'ins ' + i.tone + (i.kind === 'text' && !i.act ? ' short' : '') });
  const top = h('div');
  top.append(h('h2', { class: 'ins-t' }, sentence(i.big)));

  if (i.kind === 'bars') {
    const bars = h('div', { class: 'bars' });
    i.months.forEach(m => bars.append(h('i', {
      class: m.n === i.peak ? 'hi' : '',
      style: { height: Math.max(4, (m.n / i.peak) * 100) + '%' }
    })));
    top.append(bars, h('div', { class: 'barlab' }, ...i.months.map(m => h('span', {}, m.lab))));
  }
  if (i.kind === 'tech') {
    top.append(h('div', { class: 'tech' },
      ...i.techCount.filter(t => t.n).map(t =>
        h('span', { class: 'chip' }, `${t.t} ${t.n}`))));
  }
  if (i.kind === 'evo') {
    const evo = h('div', { class: 'evo' });
    const total = i.a + i.b || 1;
    const lit = Math.round((i.a / total) * 8);
    EVO_H.forEach((ht, k) => evo.append(h('i', { class: k < lit ? 'lit' : '', style: { height: ht + '%' } })));
    top.append(evo);
  }

  if (i.note && i.kind !== 'tech') top.append(h('div', { class: 'note' }, i.note));
  el.append(top);

  if (i.act)
    el.append(h('button', {
      class: 'act', onclick: () => {
        if (i.go?.type === 'search') openSearch(i.go.q);
        else if (i.go?.type === 'card') openCard(i.go.id);
      }
    }, i.act));

  /* same 48px smoothed (superellipse) corners as the Items page cards */
  squircle(el, 48);
  return el;
}
