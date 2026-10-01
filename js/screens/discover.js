/* DISCOVER — a physical stack of ideas. Swipe, tap, or shake to collide. */
import { h, ICON, toast, fullLayer, img, sleep, titleCase, pageHead, navBtn, squircle, pblur } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, planFallbackText, heroStatusBar, startMaking } from './card.js';
import { BACK16_SVG } from './media.js';
import { openCollide } from './collide.js';

export function openDiscover() {
  fullLayer((wrap, kill) => {
    let feed = AI.discoverFeed();
    const stage = h('div', { class: 'stage' });
    const root = h('div', { class: 'disc' });

    /* header: same layout as the Ready to post screen (ui.js pageHead) */
    const head = pageHead({
      left: navBtn(ICON.back, kill, 'Back'),
      title: 'Discover',
      sub: 'Swipe · tap to inspect · shake to collide',
    });

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

    /* Same look as the Items screen's idea card: paper fading to the piece's
       colour, 48px smoothed corners. Archive items use their card's colour;
       suggestions keep the hue of their old gradient. */
    const GRAD_COLOR = { g1: '#2B36FF', g2: '#FF4A17', g3: '#8C8A84', g4: '#FF7BB0' };
    const colorOf = (item) => S.byId(item.cardId || item.from)?.glow || GRAD_COLOR[item.grad] || '#8C8A84';
    /* An idea that is a photo (a pin, a reference shot) fills the card,
       darkened from the top like a piece card's photo header; a piece
       cut-out sits on the paper gradient, as its clean export (never the
       old generated variants). */
    const OLD_VARIANT = /^assets\/(process|snap)\//;
    const build = (item) => {
      const src = item.src && !OLD_VARIANT.test(item.src) ? S.hiRes(item.src) : null;
      const photo = !!src && !S.isPiece(src);
      const c = h('div', { class: 'dcard' + (photo ? ' photo' : ''), style: {
        background: photo ? '#040404' : `linear-gradient(180deg, #f6f4ec 23.32%, ${colorOf(item)} 100%)` } });
      squircle(c, 48);
      const bg = h('div', { class: 'dbg' });
      if (src) bg.append(img(src, item.title));
      if (photo) bg.append(h('div', { class: 'ddim' }));
      c.append(bg,
        h('div', { class: 'stamp yes' }, 'SAVE'),
        h('div', { class: 'stamp no' }, 'NOPE'),
        h('div', { class: 'dtx' },
          h('div', { class: 'src' + (item.source === 'YOUR ARCHIVE' ? ' archive' : ''), style: { marginBottom: '12px', display: 'inline-block' } }, item.source),
          h('div', { class: 'piece-t' }, titleCase(item.title)),
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

    /* returns the card's id; quiet: no toast (START MAKING has its own) */
    const save = (item, { quiet } = {}) => {
      if (item.kind === 'own') { if (!quiet) toast({ html: `Already in your ideas — <b>${item.title}</b>` }); return item.cardId; }
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
      if (!quiet) toast({
        html: `Saved as an idea — <b>${card.title}</b>`,
        undo: () => { S.restore(snap); nav.refresh(); },
      });
      return card.id;
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
        if (!moved) inspect(item, save, colorOf(item));
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
      h('button', { class: 'dact big dcollide', onclick: () => { kill(); openCollide(); } }, 'Collide'),
      h('button', { class: 'dact', html: '♥', onclick: () => { const el = stage.querySelector('.dcard:last-child'); if (el && feed[0]) decide(feed[0], el, 1); } }));

    root.append(head, stage, acts);
    wrap.append(root);
    paint();
  });
}

/* tap → the idea on the same page as a Collide result (collide.js):
   the tinted header with its status, name and why, then its PLAN, with
   SAVE AS IDEA and START MAKING in the floating bar -- just without
   COMBINED FROM. START MAKING saves it, sets it to making and opens it. */
function inspect(item, save, glow) {
  fullLayer((wrap, kill) => {
    const scroll = h('div', { class: 'scroll under-bar' });
    const header = h('div', { class: 'cx' }, h('div', { class: 'cx-in tint compact',
      style: { background: `linear-gradient(0deg, #f6f4ec 11.058%, ${glow} 100%)` } },
      heroStatusBar(),
      h('div', { class: 'cx-top' },
        h('button', { class: 'cx-btn', onclick: kill, html: BACK16_SVG, 'aria-label': 'Back' }),
        h('div', { class: 'cx-title' }, h('div', { class: 'cl-head' },
          h('div', { class: 'cx-status' }, h('span', { class: 'ic', html: ICON.ideaStar }), h('span', {}, item.source)),
          h('div', { class: 'cx-t' }, titleCase(item.title)))),
        h('span', { class: 'cx-btn ghost' })),
      h('div', { class: 'cl-why' }, item.desc)));
    const plan = AI.generatePlan(item.title + ' ' + item.desc);
    const rest = h('div', { class: 'cl-rest in' },
      h('div', { class: 'sx open' },
        h('div', { class: 'sx-h' }, h('div', { class: 'sx-t' }, 'Plan')),
        h('div', { class: 'pl-box', style: { background: `linear-gradient(0deg, #f6f4ec 6.25%, ${glow} 100%)` } },
          h('div', { class: 'pl-text' }, planFallbackText({ plan })))));
    scroll.append(header, rest);
    const bar = h('div', { class: 'card-bar' }, pblur('up'),
      h('button', { class: 'pe-btn accent', onclick: () => { save(item); kill(); } }, 'Save as idea'),
      h('button', { class: 'pe-btn paper', onclick: () => {
        const id = save(item, { quiet: true });
        const snap = S.setState(id, 'making');
        nav.refresh();
        toast({ html: `<b>making</b> · ${S.byId(id).title}`, undo: () => { S.restore(snap); nav.refresh(); } });
        startMaking(id);
        kill();
        openCard(id);
      } }, 'Start making'));
    wrap.append(h('div', { class: 'collide' }, scroll, bar));
  });
}
