/* COLLIDE -- two or three of your cards fused into one new idea. Built from
   the same parts as Items and the piece cards (there's no Figma frame):
   the short card header, the source cards as Items tiles that glide
   together and fade into the new idea (shown in the header, like a piece
   card's), then COMBINED FROM, the PLAN
   box, and the floating bottom bar -- SAVE AS IDEA / COLLIDE AGAIN. */
import { h, ICON, toast, fullLayer, sleep, titleCase, pblur } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, planFallbackText, heroStatusBar } from './card.js';
import { itemTile } from './items.js';
import { BACK16_SVG } from './media.js';

const GLOW = '#7A2BFF';   // the colour a collided idea is saved with

/* withId: collide this particular card (from its own card page). */
export function openCollide(withId) {
  fullLayer((wrap, kill) => {
    const scroll = h('div', { class: 'scroll under-bar' });
    const bar = h('div', { class: 'card-bar' });
    const barBlur = pblur('up');
    const root = h('div', { class: 'collide' },
      scroll, bar);
    wrap.append(root);

    /* the header holds the new idea, like a piece card's header: "Collide /
       New idea" while the cards gather, then its status, name and why */
    const statusTx = h('span', {}, 'Collide');
    const titleTx = h('div', { class: 'cx-t' }, 'New idea');
    const whyTx = h('div', { class: 'cl-why' });
    const headText = h('div', { class: 'cl-head' },
      h('div', { class: 'cx-status' }, h('span', { class: 'ic', html: ICON.ideaStar }), statusTx), titleTx);
    const header = h('div', { class: 'cx' }, h('div', { class: 'cx-in tint compact',
      style: { background: `linear-gradient(0deg, #f6f4ec 11.058%, ${GLOW} 100%)` } },
      heroStatusBar(),
      h('div', { class: 'cx-top' },
        h('button', { class: 'cx-btn', onclick: kill, html: BACK16_SVG, 'aria-label': 'Back' }),
        h('div', { class: 'cx-title' }, headText),
        h('span', { class: 'cx-btn ghost' })),
      whyTx));
    const setHead = (status, title, why) => {
      statusTx.textContent = status; titleTx.textContent = title;
      whyTx.textContent = why || ''; whyTx.hidden = !why;
    };

    const run = async () => {
      const { picks, result: fused } = AI.collide(withId);
      bar.replaceChildren(barBlur);
      setHead('Collide', 'New idea', '');

      /* 1. the source cards, side by side, as their Items tiles */
      const row = h('div', { class: 'cl-row n' + picks.length }, ...picks.map(itemTile));
      const stage = h('div', { class: 'cl-stage' }, row);
      scroll.replaceChildren(header, stage);
      requestAnimationFrame(() => row.classList.add('in'));
      await sleep(900);

      /* 2. they glide to the centre and fade out... */
      const mid = stage.getBoundingClientRect();
      [...row.children].forEach(t => {
        const r = t.getBoundingClientRect();
        const dx = (mid.left + mid.width / 2) - (r.left + r.width / 2);
        t.style.transform = `translateX(${dx}px) scale(.82)`;
        t.style.opacity = '0';
      });
      await sleep(420);

      /* 3. ...into the new idea, in the header; the rest follows */
      headText.classList.add('out'); await sleep(180);
      setHead('Idea, now', titleCase(fused.title),
        picks.reduce((t, c) => t.split(c.title).join(titleCase(c.title)), fused.why));
      headText.classList.remove('out');
      const from = h('div', { class: 'sx open' },
        h('div', { class: 'sx-h' }, h('div', { class: 'sx-t' }, 'Combined from')),
        h('div', { class: 'cl-row from n' + picks.length }, ...picks.map(c => {
          const t = itemTile(c);
          t.onclick = () => openCard(c.id);
          return t;
        })));
      const plan = h('div', { class: 'sx open' },
        h('div', { class: 'sx-h' }, h('div', { class: 'sx-t' }, 'Plan')),
        h('div', { class: 'pl-box', style: { background: `linear-gradient(0deg, #f6f4ec 6.25%, ${GLOW} 100%)` } },
          h('div', { class: 'pl-text' }, planFallbackText({ plan: fused.plan }))));
      const rest = h('div', { class: 'cl-rest' }, from, plan);
      scroll.replaceChildren(header, rest);
      requestAnimationFrame(() => rest.classList.add('in'));

      bar.append(
        h('button', { class: 'pe-btn accent', onclick: () => {
          const card = {
            id: S.uid('c'), state: 'idea', title: fused.title,
            created: Date.now(), updated: Date.now(),
            origin: { type: 'collide', label: 'From Collide' },
            glow: GLOW, desc: fused.desc,
            tags: AI.conceptsIn(fused.title + ' ' + fused.desc),
            hero: null, plan: fused.plan, photos: [], notes: [], threads: [],
            collidedFrom: fused.sources,
          };
          const snap = S.addCard(card);
          nav.refresh();
          toast({ html: `Saved — <b>${card.title}</b> is in your items`, undo: () => { S.restore(snap); nav.refresh(); } });
          kill();
          openCard(card.id);
        } }, 'Save as idea'),
        h('button', { class: 'pe-btn paper', onclick: run }, 'Collide again'));
    };

    run();
  });
}
