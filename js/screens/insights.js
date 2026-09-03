/* INSIGHTS — patterns pulled out of the same dataset. Not a dashboard. */
import { h } from '../ui.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard } from './card.js';
import { openSearch } from './items.js';

export function renderInsights(root) {
  const scroll = h('div', { class: 'scroll' });
  const list = AI.insights();

  scroll.append(h('div', { class: 'pad', style: { padding: '4px 20px 22px' } },
    h('div', { class: 'label' }, 'WHAT YOUR ARCHIVE KNOWS'),
    h('div', { class: 'meta', style: { marginTop: '8px' } },
      'Derived from every card, note and firing you have logged.')));

  list.forEach(i => scroll.append(panel(i)));

  scroll.append(h('div', { class: 'pad', style: { padding: '20px' } },
    h('div', { class: 'meta' },
      'Estimates and patterns, not guarantees. Firing and glaze figures come from what you recorded — check manufacturer specifications before you change a schedule.')));

  root.replaceChildren(scroll);
}

function panel(i) {
  const el = h('div', { class: 'ins ' + i.tone });
  const top = h('div');
  top.append(h('h2', { class: 'h-mega', html: (i.big || '').replace(/\n/g, '<br>') }));

  if (i.kind === 'bars') {
    const bars = h('div', { class: 'bars' });
    i.months.forEach(m => bars.append(h('i', {
      class: m.n === i.peak ? 'hi' : '',
      style: { height: Math.max(4, (m.n / i.peak) * 100) + '%' }
    })));
    top.append(bars, h('div', { class: 'barlab' }, ...i.months.map(m => h('span', {}, m.lab))));
  }
  if (i.kind === 'tech') {
    const max = Math.max(...i.techCount.map(t => t.n), 1);
    top.append(h('div', { class: 'tech' },
      ...i.techCount.filter(t => t.n).map(t =>
        h('b', { class: t.n === max ? 'hot' : '' }, h('em', {}, `${t.t} ${t.n}`)))));
  }
  if (i.kind === 'evo') {
    const evo = h('div', { class: 'evo' });
    const total = i.a + i.b || 1;
    for (let k = 0; k < 8; k++)
      evo.append(h('i', { style: { height: (30 + (k < (i.a / total) * 8 ? 62 : 34) * Math.random() + 20) + '%', opacity: k < (i.a / total) * 8 ? .85 : .4 } }));
    top.append(evo);
  }

  if (i.note) top.append(h('div', { class: 'note' }, i.note));
  el.append(top);

  if (i.act)
    el.append(h('button', {
      class: 'act', onclick: () => {
        if (i.go?.type === 'search') openSearch(i.go.q);
        else if (i.go?.type === 'card') openCard(i.go.id);
      }
    }, i.act));

  return el;
}
