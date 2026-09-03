/* COLLIDE — shake two or three cards into one another and see what falls out. */
import { h, ICON, toast, fullLayer, img, sleep } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard } from './card.js';

export function openCollide() {
  fullLayer((wrap, kill) => {
    const stage = h('div', { class: 'cstage' });
    const flash = h('div', { class: 'flash' });
    const result = h('div', { class: 'cresult' });
    const root = h('div', { class: 'collide' },
      h('div', { class: 'page-top' },
        h('button', { class: 'iconbtn', html: ICON.close, onclick: kill }),
        h('div', { class: 'label', style: { flex: '1' } }, 'COLLIDE')),
      stage, flash, result);
    wrap.append(root);

    const run = async () => {
      result.classList.remove('in');
      result.replaceChildren();
      stage.replaceChildren();

      const { picks, result: fused } = AI.collide();
      const W = stage.clientWidth || 380, H = stage.clientHeight || 500;

      /* fly the source cards in from the edges */
      const chips = picks.map((c, i) => {
        const el = h('div', { class: 'cchip' });
        const src = S.cutoutSrc(c);
        el.append(src ? img(src, c.title)
          : h('div', { style: { height: '86px', display: 'grid', placeItems: 'center', color: '#666', fontSize: '10px', letterSpacing: '.12em' } }, 'TEXT IDEA'),
          h('div', { class: 'n' }, c.title));
        const ang = (i / picks.length) * Math.PI * 2 + .6;
        el.style.left = (W / 2 - 66 + Math.cos(ang) * W) + 'px';
        el.style.top = (H / 2 - 70 + Math.sin(ang) * H * .8) + 'px';
        stage.append(el);
        return el;
      });

      await sleep(60);
      chips.forEach((el, i) => {
        el.style.left = (W / 2 - 66 + (i - (chips.length - 1) / 2) * 14) + 'px';
        el.style.top = (H / 2 - 70) + 'px';
        el.style.transform = `rotate(${(i - 1) * 7}deg)`;
      });

      await sleep(820);
      flash.classList.add('go');
      chips.forEach(el => { el.style.opacity = '0'; el.style.transform = 'scale(.7)'; });
      await sleep(420);
      flash.classList.remove('go');
      stage.replaceChildren();

      /* the fused concept */
      const formula = h('div', { class: 'cformula' });
      picks.forEach((c, i) => {
        formula.append(h('button', { class: 'f', onclick: () => openCard(c.id) }, c.title));
        if (i < picks.length - 1) formula.append(h('div', { class: 'x' }, '×'));
      });

      result.append(
        h('div', { class: 'label' }, 'COMBINED FROM'),
        formula,
        h('div', { class: 'gradpanel' },
          h('h1', { class: 'h-mega' }, fused.title),
          h('p', {}, fused.why)),
        h('div', { class: 'assume', style: { marginTop: '18px' } },
          h('div', { class: 'label' }, 'ASSUMING'),
          h('p', {}, fused.plan.assumptions.join(' · '))),
        h('div', { class: 'label', style: { marginTop: '22px' } }, 'HOW TO MAKE IT'),
        h('ol', { class: 'steps' }, ...fused.plan.steps.map(s => h('li', {}, s))),
        h('div', { class: 'risks' }, ...fused.plan.risks.map(r =>
          h('div', { class: 'risk' }, h('b', {}, r.k), h('span', {}, r.t)))),
        h('button', {
          class: 'bigact paper', style: { width: '100%', marginLeft: '0' }, onclick: () => {
            const card = {
              id: S.uid('c'), state: 'idea', title: fused.title,
              created: Date.now(), updated: Date.now(),
              origin: { type: 'collide', label: 'From Collide' },
              glow: '#7A2BFF', desc: fused.desc,
              tags: AI.conceptsIn(fused.title + ' ' + fused.desc),
              hero: null, plan: fused.plan, photos: [], notes: [], threads: [],
              collidedFrom: fused.sources,
            };
            const snap = S.addCard(card);
            nav.refresh();
            toast({
              html: `Saved — <b>${card.title}</b> is in your items`,
              undo: () => { S.restore(snap); nav.refresh(); },
            });
            kill();
          }
        }, 'SAVE AS CARD'),
        h('button', { class: 'bigact ghost', style: { width: '100%', marginLeft: '0' }, onclick: run }, 'COLLIDE AGAIN'),
        h('div', { style: { height: '30px' } })
      );
      requestAnimationFrame(() => result.classList.add('in'));
    };

    run();
  });
}
