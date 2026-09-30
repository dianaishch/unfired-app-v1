/* ITEMS — what am I making now, what's ready to share, and the archive. */
import { h, ICON, img, ago, page, toast, squircle, statusBar, pageHead, navBtn } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, openChat, startMaking } from './card.js';
import { allPosts, postPlaceholder, openPostEdit, openShareSheet } from './post.js';
import { CARDS } from '../seed.js';

const SEED_IDS = new Set(CARDS.map(c => c.id));

let filter = 'all';
let itemsScrollTop = 0;

/* Items feed -- Figma 562:8203 / 562:8713 / 562:9355: the filter row, one
   featured card (what you're making, else an idea), then every other
   card as a half-width tile, two per row. */
export function renderItems(root) {
  const scroll = h('div', { class: 'scroll feed' });
  const feat = featured();
  if (feat && (filter === 'all' || filter === feat.state)) {
    scroll.append(h('div', { class: 'feat' }, feat.state === 'making'
      ? nowCard(feat, makingSub(feat), 'making')
      : nowCard(feat, feat.desc || '', 'idea')));
  }
  scroll.append(archive(feat));

  /* Keep the scroll position across re-renders (filter switches,
     refreshes after an edit) instead of jumping back to the top. app.js
     rebuilds the whole stage each render, so it's remembered here. */
  root.replaceChildren(scroll);
  scroll.scrollTop = itemsScrollTop;
  scroll.addEventListener('scroll', () => { itemsScrollTop = scroll.scrollTop; }, { passive: true });
}

/* last time you did anything with a card: logged to it, edited it, made it */
const touchedAt = (c) => Math.max(c.loggedAt || 0, c.updated || 0, c.created || 0, c.startedMaking || 0);
/* The big card: the piece you're making (the latest one, if several);
   with nothing on the go, an idea -- the one you touched last. */
const latest = (list) => list.slice().sort((a, b) => touchedAt(b) - touchedAt(a))[0] || null;
const featured = () => latest(S.making()) || latest(S.ideas());
const makingSub = (c) => {
  const n = (c.photos || []).length;
  return `${n} photo${n === 1 ? '' : 's'}, started ${ago(c.startedMaking || c.created)}`;
};

/* Figma's hero-card titles are set in title case; app data stores titles ALL CAPS
   (see seed.js). Transforming here only, scoped to this card — every other place
   c.title renders (archive, card detail, etc.) keeps its existing ALL-CAPS look. */
const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

/* Figma's card art is an isolated cutout (no background). c.hero/c.photos here are
   process/bench photos (assets/process/*.webp) — the matching background-removed
   piece lives under assets/pieces (and, at higher res, "assets/pieces without bg"),
   keyed by the same filename. Derive that key from whatever src the card already
   has and look up the cutout instead of rendering the bench photo directly. */
const cutoutFor = (c) => {
  const piece = S.hiRes(S.cutoutSrc(c));
  if (S.isPiece(piece)) return piece;
  const src = (c.hero && c.hero.src) || S.heroSrc(c) || '';
  const m = src.match(/([^/]+)\.webp$/);
  return m ? `assets/pieces without bg/${m[1]} 1.png` : null;
};

function nowCard(c, sub, mode) {
  const src = cutoutFor(c);
  const act = (fn) => (e) => { e.stopPropagation(); fn(); };
  /* Gradient bottom stop now uses the card's own glow (same field every
     other card in the app already draws its accent from) instead of a
     fixed hex -- so each piece's hero card tints toward its real color
     rather than a generic blue for every "making" card. */
  const stop = mode === 'making' ? '6.25%' : '11.058%';
  const el = h('div', {
    class: 'mkcard ' + mode,
    style: { background: `linear-gradient(0deg, #f6f4ec ${stop}, ${S.pieceColor(c)} 100%)` },
    onclick: () => openCard(c.id),
  },
    /* status, title and line underneath: one group, 8px apart (the idea
       card spreads its content to fill 210px -- this keeps the three
       together and only the buttons go to the bottom) */
    h('div', { class: 'head' },
      h('div', { class: 'status' },
        mode === 'making' ? h('span', { class: 'dot' }) : h('span', { html: ICON.ideaStar }),
        h('span', {}, mode === 'making' ? 'making' : 'Idea, ' + ago(c.created))),
      h('div', { class: 't' }, titleCase(c.title)),
      h('div', { class: 'sub' }, sub)),
    mode === 'making' && src ? h('div', { class: 'img' }, img(src, c.title)) : null,
    h('div', { class: 'acts' },
      mode === 'making'
        ? h('button', { onclick: act(() => nav.openLock(c.id)) }, 'Studio mode')
        : h('button', { onclick: act(() => {
            const snap = S.setState(c.id, 'making');
            toast({ html: '<b>making</b> · set by you', undo: () => { S.restore(snap); nav.refresh(); } });
            startMaking(c.id);
            nav.refresh();
          }) }, 'Start making'),
      h('button', { onclick: act(() => openChat(c.id)) }, 'New chat')));
  squircle(el, 48);
  return el;
}


export function filters() {
  const counts = {
    all: S.cards().length,
    idea: S.ideas().length,
    making: S.making().length,
    finished: S.finished().length,
  };
  const row = h('div', { class: 'filters' });
  [['all', 'All'], ['idea', 'Ideas'], ['making', 'Making'], ['finished', 'Finished']].forEach(([k, lab]) => {
    row.append(h('button', {
      class: filter === k ? 'on' : '',
      onclick: () => { filter = k; nav.refresh(); }
    }, lab, h('span', { class: 'count' }, counts[k])));
  });
  return row;
}

/* Archive, card-based per Figma node 468:63620. Three card types:
   - fin: finished/making, has a photo -> floating cutout, no background
   - bleed: idea with a photo -> photo bleeds full-card, dark scrim, title overlaid
   - spot: idea, no photo -> full-width gradient spotlight card, title + description
   fin/bleed pack two-per-row (half width); spot is always full-width, alone.
   Figma's own arrangement is a one-off hand-placed sequence for ~10 example
   cards, not a formula -- this is a designed repeating rule that produces a
   similar rhythm (paired half-cards, occasional lone half, full-width
   spotlights breaking up the pairs) for any real, changing card list:
   walk the sorted list, buffer fin/bleed cards two at a time into a row;
   hitting a spot card flushes whatever's buffered (even just one, giving
   the occasional lone half-width card Figma also shows) before placing
   the spotlight as its own full-width row. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const shortDate = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };

function archStatus(c) {
  if (c.state === 'idea') return { sq: false, text: 'Idea, ' + shortDate(c.created) };
  if (c.state === 'making') return { sq: true, text: 'Making, ' + shortDate(c.startedMaking || c.created) };
  return { sq: true, text: 'Finished, ' + shortDate(c.finishedAt || c.updated) };
}

function archStatusRow(st) {
  return h('div', { class: 'st' },
    st.sq ? h('i', { class: 'sq' }) : h('span', { class: 'ic', html: ICON.ideaStar }),
    h('span', {}, st.text));
}

/* Finished: the piece without a background, straight on black. Making:
   the same cutout on the card's gradient, like its card header. */
function finCard(c) {
  const src = S.hiRes(S.cutoutSrc(c));
  const making = c.state === 'making';
  return h('button', { class: 'arch fin' + (making ? ' mk' : ''), onclick: () => openCard(c.id),
    style: making ? { background: `linear-gradient(0deg, #f6f4ec 6.25%, ${S.pieceColor(c)} 100%)` } : null },
    h('div', { class: 'obj' },
      src ? img(src, c.title) : h('div', { class: 'noimg' }, h('div', { class: 'noimg-t' }, 'No photo'))),
    h('div', { class: 'info' },
      h('div', { class: 't' }, titleCase(c.title)),
      archStatusRow(archStatus(c))));
}

/* Idea with its own (non-cutout) photo: the photo bleeds full-card, the
   same image its piece page shows. */

function bleedCard(c, photoSrc) {
  return h('button', { class: 'arch bleed', style: { background: c.glow || '#222' }, onclick: () => openCard(c.id) },
    h('div', { class: 'bgimg' }, img(photoSrc, c.title)),
    h('div', { class: 'dim' }),
    archStatusRow(archStatus(c)),
    h('div', { class: 't' }, titleCase(c.title)));
}

const gradTint = (c) => `linear-gradient(180deg, ${c.glow || '#8C8A84'} 0%, #f4f2ec 100%)`;


/* Half-width gradient card (Figma node 477:64406) -- same content/style as
   spotCard, sized to pair with a photo card instead of always full-width.
   Unlike spotCard's fixed character slice, this clamps by line count since
   that's what was actually asked for: title max 2 lines, description max
   3, CSS ellipsis past that -- so it gets the untruncated text and lets
   -webkit-line-clamp do the cutting at whatever length actually wraps. */
function smallSpotCard(c) {
  return h('button', { class: 'arch spot small', style: { background: gradTint(c) }, onclick: () => openCard(c.id) },
    archStatusRow(archStatus(c)),
    h('div', {},
      h('div', { class: 't clamp2' }, titleCase(c.title)),
      h('div', { class: 'd clamp3' }, c.desc || '')));
}

/* One grid tile for a card (also Collide's source tiles). Only finished
   pieces sit without a background. Making pieces are the cutout on their
   gradient; ideas are their own photo full-bleed, or the gradient tile
   with the description (remakes too -- a cutout isn't a photo). */
const ownPhoto = (c) => ((c.photos || []).find(p => !S.isPiece(p.src)) || {}).src || null;
export const itemTile = (c) => c.state !== 'idea' ? finCard(c)
  : ownPhoto(c) ? bleedCard(c, ownPhoto(c)) : smallSpotCard(c);

/* Shuffle (Fisher-Yates) instead of sorting by date -- cards mix randomly
   rather than clustering by when they were made. */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Pinned per filter tab: the shuffle only reshuffles when the actual set
   of card ids under that filter changes, not on every re-render. */
const archiveShuffleCache = new Map();

/* The grid (Figma 562:8266 ...): every card a half-width tile, two per
   row. Pieces (a photo of the object: finished, making, remakes) and ideas
   (a gradient tile, or their own photo full-bleed) alternate, so most rows
   pair one of each; the pair swaps sides every row, like the Figma feed. */
function archive(feat) {
  let list = S.cards().filter(c => c !== feat);
  if (filter !== 'all') list = list.filter(c => c.state === filter);

  if (!list.length && !(feat && (filter === 'all' || filter === feat.state)))
    return h('div', { class: 'empty keep-type' },
      h('div', { class: 'h-big' }, 'NOTHING HERE YET'),
      h('div', { class: 'meta' }, 'Press LOG and say what you are making.'));

  const isIdeaTile = (c) => c.state === 'idea';
  const halfCard = itemTile;

  /* Cards you've just touched lead, most recent first: ones you made (not
     in the seed) and ones you logged something to (c.loggedAt). */
  const byId = new Map(list.map(c => [c.id, c]));
  const cached = archiveShuffleCache.get(filter);
  const order = (pool, cachedIds) => {
    const kept = (cachedIds || []).filter(id => pool.some(c => c.id === id)).map(id => byId.get(id));
    const added = shuffled(pool.filter(c => !kept.includes(c)));
    const all = [...kept, ...added];
    const touched = (c) => Math.max(c.loggedAt || 0, SEED_IDS.has(c.id) ? 0 : c.created || 0);
    const mine = all.filter(c => touched(c) > 0).sort((a, b) => touched(b) - touched(a));
    return [...mine, ...all.filter(c => !touched(c))];
  };
  const pieces = order(list.filter(c => !isIdeaTile(c)), cached?.photoIds);
  const ideas = order(list.filter(isIdeaTile), cached?.gradIds);
  archiveShuffleCache.set(filter, { photoIds: pieces.map(c => c.id), gradIds: ideas.map(c => c.id) });

  const wrap = h('div', { class: 'archive' });
  let row = 0;
  while (pieces.length || ideas.length) {
    const a = pieces.shift() || ideas.shift();
    const b = ideas.shift() || pieces.shift();
    const pair = [a, b].filter(Boolean).map(halfCard);
    if (row++ % 2) pair.reverse();
    wrap.append(h('div', { class: 'arch-row' }, ...pair));
  }
  return wrap;
}

/* ══════════════ SEMANTIC SEARCH ══════════════ */
/* ASK YOUR ARCHIVE is a chat now (card.js openChat with no card): the
   suggested questions, answered in chat with the cards used as a widget.
   A prefill (an Insights item) is asked straight away. */
export function openSearch(prefill) {
  openChat(null, null, () => nav.refresh(), null, { ask: prefill || undefined });
}

/* ══════════════ READY TO POST (all) ══════════════
   Post-preview cards are exact Figma exports (POSTS in post.js, each tied
   to its real piece card). Carousel animation is a port of
   infinite-scrolling-cards-slider.webflow.io (see the loop inside
   openReadyToPost), driven by horizontal scrolling of the screen; none of
   the reference's own UI is used. EDIT (dark chip) then POST (orange
   #FF451A / #040404 text); both act on the centred card. Tapping the
   centred card opens Edit too; tapping a side card brings it to centre. */
/* status bar lives in ui.js now; re-exported for post.js / capture.js */
export { statusBar };

export function openReadyToPost() {
  page((p, close) => {
    /* The loop needs enough cards that the wrap point sits off-screen (the
       reference refuses to run with < 6), so the image set is repeated:
       3 images -> 9 cards, visible slots -4..+4 are always distinct cards. */
    /* Every post: the exported images, then a same-size placeholder card
       for each generated post (Figma 493:19727) until it gets its export. */
    const posts = allPosts();
    const n = posts.length;
    const total = n * Math.ceil(9 / n);
    const cardEls = Array.from({ length: total }, (_, j) => {
      const post = posts[j % n];
      if (!post.img) return postPlaceholder(post.name);
      const el = img(post.img, '');
      el.loading = 'eager';
      el.draggable = false;
      return el;
    });
    const deck = h('div', { class: 'rtp-deck' }, ...cardEls);
    const editBtn = h('button', {}, 'Edit');
    const postBtn = h('button', { class: 'post', onclick: openShareSheet }, 'Post');
    let currentIdx = 0;
    const setActive = (i) => { currentIdx = i; };
    const editCurrent = () => openPostEdit(posts[currentIdx].id);
    editBtn.onclick = editCurrent;

    /* Port of infinite-scrolling-cards-slider.webflow.io (GSAP seamless
       loop), animation only:
       - a card `slot` places from centre sits at x = slot*80% of its width,
         scale == opacity == (1 - |slot|*0.2)^2 (the reference's power1.in
         yoyo), z-index tracks scale so the centre card is on top;
       - it loops forever in both directions;
       - input only ever moves a raw position; the target is that position
         snapped to a whole card, and the displayed position eases to it
         over 0.5s power3.out (the reference's `scrub` tween), so cards
         always settle dead-centre.
       Driven by horizontal scrolling of the screen -- a horizontal
       swipe/drag anywhere on the page, or trackpad / shift+wheel -- instead
       of the reference's vertical page scroll. */
    const WHEEL_PX_PER_CARD = 300;   // reference: 3000px scroll per 10 cards
    const SCRUB_MS = 500;            // reference: scrub duration 0.5
    const easeOut3 = t => 1 - Math.pow(1 - t, 3);
    let raw = 0, target = 0, shown = 0;
    let from = 0, t0 = 0, raf = 0;

    const render = () => {
      cardEls.forEach((el, j) => {
        let slot = ((j - shown) % total + total) % total;
        if (slot >= total / 2) slot -= total;
        const s = Math.max(0, 1 - Math.abs(slot) * 0.2);
        const k = s * s;
        el.style.transform = `translate(${(slot * 80 - 50).toFixed(2)}%, -50%) scale(${k.toFixed(4)})`;
        el.style.opacity = k.toFixed(4);
        el.style.zIndex = Math.round(k * 100);
      });
      setActive(((Math.round(shown) % n) + n) % n);
    };
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / SCRUB_MS);
      shown = from + (target - from) * easeOut3(t);
      render();
      raf = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    const setRaw = (v) => {
      raw = v;
      const snapped = Math.round(raw);
      if (snapped === target) return;
      target = snapped;
      from = shown; t0 = performance.now();   // restart the scrub, like scrub.invalidate().restart()
      if (!raf) raf = requestAnimationFrame(tick);
    };

    /* trackpad horizontal scroll / shift+wheel */
    p.addEventListener('wheel', (e) => {
      let dx = e.deltaX;
      if (e.shiftKey && !dx) dx = e.deltaY;
      else if (Math.abs(dx) <= Math.abs(e.deltaY)) return;
      e.preventDefault();   // keep the browser's back/forward swipe out of it
      setRaw(raw + dx / WHEEL_PX_PER_CARD);
    }, { passive: false });

    /* horizontal swipe / drag anywhere on the screen. Skips the left-edge
       strip (page()'s swipe-back) and the buttons. The finger moves the raw
       position 1:1 with card spacing; a flick carries on a little. */
    p.style.touchAction = 'pan-y';
    let drag = null;
    p.addEventListener('pointerdown', (e) => {
      if (e.button || e.target.closest('button')) return;
      if (e.pointerType === 'touch' && e.clientX < 26) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, raw0: raw, on: false,
               step: cardEls[0].offsetWidth * 0.8, vx: 0, lx: e.clientX, lt: e.timeStamp };
    });
    p.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (!drag.on) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return;
        drag.on = true;
        try { p.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      }
      const dt = e.timeStamp - drag.lt;
      if (dt > 0) drag.vx = 0.8 * ((e.clientX - drag.lx) / dt) + 0.2 * drag.vx;
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      setRaw(drag.raw0 - dx / drag.step);
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.on) {
        const fling = e.timeStamp - drag.lt < 80 ? -drag.vx * 120 / drag.step : 0;
        setRaw(Math.round(raw + Math.max(-2, Math.min(2, fling))));
      } else if (e.type === 'pointerup' && deck.contains(e.target)
                 && Math.abs(e.clientY - drag.y) < 10) {
        /* a tap, not a swipe: centre card -> Edit; a side card -> centre it */
        const j = ((Math.round(shown) % total) + total) % total;
        const r = cardEls[j].getBoundingClientRect();
        if (e.clientX < r.left) setRaw(target - 1);
        else if (e.clientX > r.right) setRaw(target + 1);
        else if (e.clientY >= r.top && e.clientY <= r.bottom) editCurrent();
      }
      drag = null;
    };
    p.addEventListener('pointerup', endDrag);
    p.addEventListener('pointercancel', endDrag);

    p.append(
      statusBar(),
      h('div', { class: 'rtp-page-head' },
        h('div', { class: 'navrow' },
          h('button', { class: 'navbtn', onclick: close, html: ICON.back, 'aria-label': 'Back' }),
          /* Figma shows a "+" here with no stated action -- rendered for visual
             fidelity, left inert rather than guessing at behavior. */
          h('button', { class: 'navbtn', html: ICON.plus, 'aria-label': 'Add' })),
        h('div', { class: 't' }, 'Ready to post'),
        h('div', { class: 'sub' }, 'Prepared while you were away')),
      deck,
      h('div', { class: 'rtp-bottombar' }, editBtn, postBtn));

    render();
  });
}
