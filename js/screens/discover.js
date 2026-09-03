/* DISCOVER — a physical stack of ideas. Swipe, tap, or shake to collide. */
import { h, ICON, toast, fullLayer, img, sleep } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard } from './card.js';
import { openCollide } from './collide.js';

export function openDiscover() {
  fullLayer((wrap, kill) => {
    let feed = AI.discoverFeed();
    const stage = h('div', { class: 'stage' });
    const root = h('div', { class: 'disc' });

    const head = h('div', { class: 'page-top' },
      h('button', { class: 'iconbtn', html: ICON.close, onclick: kill }),
      h('div', { style: { flex: '1' } },
        h('div', { class: 'label' }, 'DISCOVER'),
        h('div', { class: 'meta', style: { marginTop: '2px' } }, 'Swipe · tap to inspect · shake to collide')),
      h('button', { class: 'iconbtn', html: ICON.spark, onclick: () => { kill(); openCollide(); } }));

    const paint = () => {
      stage.replaceChildren();
      if (!feed.length) {
        stage.append(h('div', { class: 'empty' },
          h('div', { class: 'h-big' }, 'THAT\'S\nEVERYTHING\nFOR NOW.'),
          h('div', { class: 'meta', style: { marginTop: '12px' } },
            'More appears as your archive grows, or shake to collide what you already have.'),
          h('button', { class: 'bigact ghost', style: { marginTop: '22px' }, onclick: () => { kill(); openCollide(); } }, 'COLLIDE')));
        return;
      }
      feed.slice(0, 3).reverse().forEach((item, i, arr) => {
        const depth = arr.length - 1 - i;
        const card = build(item);
        card.style.transform = `translateY(${depth * 9}px) scale(${1 - depth * .035})`;
        card.style.zIndex = 10 - depth;
        card.style.opacity = depth > 1 ? .5 : 1;
        if (depth === 0) attachGestures(card, item);
        stage.append(card);
      });
    };

    const build = (item) => {
      const c = h('div', { class: 'dcard ' + (item.src ? '' : item.grad) });
      const bg = h('div', { class: 'dbg' });
      if (item.src) bg.append(img(item.src, item.title));
      c.append(bg,
        h('div', { class: 'stamp yes' }, 'SAVE'),
        h('div', { class: 'stamp no' }, 'NOPE'),
        h('div', { class: 'dtx' },
          h('div', { class: 'src' + (item.source === 'YOUR ARCHIVE' ? ' archive' : ''), style: { marginBottom: '12px', display: 'inline-block' } }, item.source),
          h('div', { class: 'h-big' }, item.title),
          h('div', { class: 'why' }, item.desc)));
      return c;
    };

    const decide = async (item, el, dir) => {
      el.style.transition = 'transform .38s cubic-bezier(.2,.9,.24,1), opacity .38s';
      el.style.transform = `translateX(${dir * 620}px) rotate(${dir * 22}deg)`;
      el.style.opacity = '0';
      if (dir > 0) save(item); else {
        S.mutate(s => s.discardedIdeas.push(item.id));
        toast({ text: 'Not for you', ms: 1500 });
      }
      feed = feed.filter(x => x.id !== item.id);
      await sleep(240);
      paint();
    };

    const save = (item) => {
      if (item.kind === 'own') { toast({ html: `Already in your ideas — <b>${item.title}</b>` }); return; }
      const card = {
        id: S.uid('c'), state: 'idea', title: item.title,
        created: Date.now(), updated: Date.now(),
        origin: { type: 'discover', label: 'Saved from Discover' },
        glow: '#2B36FF', desc: item.desc,
        tags: AI.conceptsIn(item.title + ' ' + item.desc),
        hero: item.src ? { src: item.src, ref: true } : null,
        plan: AI.generatePlan(item.title + ' ' + item.desc),
        photos: item.src ? [{ id: S.uid('p'), kind: 'inspiration', src: item.src, cap: item.why }] : [],
        notes: [], threads: [],
      };
      const snap = S.addCard(card);
      S.mutate(s => s.savedFromDiscover.push(item.id));
      nav.refresh();
      toast({
        html: `Saved as an idea — <b>${card.title}</b>`,
        undo: () => { S.restore(snap); nav.refresh(); },
      });
    };

    const attachGestures = (el, item) => {
      let x0 = 0, y0 = 0, dx = 0, dragging = false, moved = false;
      const yes = el.querySelector('.stamp.yes'), no = el.querySelector('.stamp.no');
      const down = (x, y) => { x0 = x; y0 = y; dragging = true; moved = false; el.style.transition = 'none'; };
      const move = (x, y) => {
        if (!dragging) return;
        dx = x - x0;
        if (Math.abs(dx) > 6) moved = true;
        el.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
        yes.style.opacity = Math.max(0, Math.min(1, dx / 90));
        no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
      };
      const up = () => {
        if (!dragging) return;
        dragging = false;
        el.style.transition = '';
        if (Math.abs(dx) > 92) { decide(item, el, dx > 0 ? 1 : -1); return; }
        el.style.transform = ''; yes.style.opacity = 0; no.style.opacity = 0;
        if (!moved) inspect(item, save);
        dx = 0;
      };
      el.addEventListener('touchstart', e => down(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
      el.addEventListener('touchmove', e => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
      el.addEventListener('touchend', up);
      el.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX, e.clientY); });
      window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      window.addEventListener('mouseup', up);
    };

    const acts = h('div', { class: 'dactions' },
      h('button', { class: 'dact', html: '✕', onclick: () => { const el = stage.querySelector('.dcard:last-child'); if (el && feed[0]) decide(feed[0], el, -1); } }),
      h('button', { class: 'dact big', html: ICON.spark, onclick: () => { kill(); openCollide(); } }),
      h('button', { class: 'dact', html: '♥', onclick: () => { const el = stage.querySelector('.dcard:last-child'); if (el && feed[0]) decide(feed[0], el, 1); } }));

    root.append(head, stage, acts);
    wrap.append(root);
    paint();
  });
}

/* tap → inspect concept + how to make it */
function inspect(item, save) {
  import('../ui.js').then(({ sheet }) => {
    sheet({ full: true, build: (b, done) => {
      b.append(
        h('div', { class: 'src' + (item.source === 'YOUR ARCHIVE' ? ' archive' : ''), style: { display: 'inline-block' } }, item.source),
        h('h1', { class: 'h-mega', style: { margin: '14px 0 12px' } }, item.title),
        h('div', { class: 'meta' }, item.why),
        item.src ? h('div', { style: { margin: '18px 0', display: 'grid', placeItems: 'center' } },
          img(item.src, '', '')) : null,
        h('div', { class: 'desc' }, item.desc));

      const plan = AI.generatePlan(item.title + ' ' + item.desc);
      b.append(h('div', { class: 'assume', style: { marginTop: '22px' } },
        h('div', { class: 'label' }, 'ASSUMING'),
        h('p', {}, plan.assumptions.join(' · '))));
      b.append(h('div', { class: 'label', style: { marginTop: '22px' } }, 'HOW TO MAKE IT'));
      b.append(h('ol', { class: 'steps' }, ...plan.steps.map(s => h('li', {}, s))));
      b.append(h('div', { class: 'risks' }, ...plan.risks.map(r =>
        h('div', { class: 'risk' }, h('b', {}, r.k), h('span', {}, r.t)))));
      b.append(h('button', { class: 'bigact paper', style: { width: '100%', margin: '24px 0 0' },
        onclick: () => { save(item); done(); } }, 'SAVE AS CARD'));
    } });
  });
}
