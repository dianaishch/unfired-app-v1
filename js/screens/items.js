/* ITEMS — what am I making now, what's ready to share, and the archive. */
import { h, ICON, img, ago, page, toast, squircle } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, openChat, startMaking } from './card.js';
import { allPosts, postPlaceholder, openPostEdit, openShareSheet } from './post.js';
import { CARDS } from '../seed.js';

const SEED_IDS = new Set(CARDS.map(c => c.id));

let filter = 'all';
let itemsScrollTop = 0;

export function renderItems(root) {
  const scroll = h('div', { class: 'scroll' });
  const mk = S.making(), ids = S.ideas();

  /* ── 1. MAKING NOW / MAKE NEXT ───────────────────────── */
  if (mk.length) {
    const c = mk[0];
    const done = (c.photos || []).filter(p => p.kind === 'process').length;
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'kicker' },
        h('div', { class: 'sec-t' }, 'Making now')),
      nowCard(c, `${done} photo${done === 1 ? '' : 's'}, started ${ago(c.startedMaking || c.created)}`, 'making')));
  } else if (ids.length) {
    const c = ids[0];
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'kicker' },
        h('div', { class: 'sec-t' }, 'Make next'),
        h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => nav.openDiscover(), 'aria-label': 'Discover' })),
      nowCard(c, c.desc || '', 'idea')));
  } else {
    scroll.append(h('div', { class: 'hero-now keep-type' },
      h('div', { class: 'label' }, 'NOTHING ON THE BENCH'),
      h('h1', { class: 'h-mega', style: { margin: '14px 0 18px' } }, 'WHAT\nSHOULD\nYOU MAKE?'),
      h('button', { class: 'bigact paper', style: { margin: '0', width: '100%' },
        onclick: () => nav.openDiscover() }, 'OPEN DISCOVER')));
  }

  /* ── 2. READY TO POST ────────────────────────────────── */
  const posts = allPosts();
  if (posts.length) {
    scroll.append(h('div', { class: 'blk' },
      h('div', { class: 'blk-head act' },
        h('div', { class: 'sec-t' }, 'Ready to post'),
        h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => openReadyToPost(), 'aria-label': 'See all' })),
      h('div', { class: 'rtp-row' }, ...posts.map(rtpCard))));
  }

  /* ── 3. ARCHIVE ──────────────────────────────────────── */
  scroll.append(h('div', { class: 'blk' },
    h('div', { class: 'blk-head act' },
      h('div', { class: 'sec-t' }, 'Archive'),
      h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => openSearch(), 'aria-label': 'Ask your archive' })),
    filters(),
    archive()));

  /* Keep the scroll position across re-renders (archive tab switches,
     refreshes after an edit) instead of jumping back to the top. app.js
     rebuilds the whole stage each render, so it's remembered here. */
  root.replaceChildren(scroll);
  scroll.scrollTop = itemsScrollTop;
  scroll.addEventListener('scroll', () => { itemsScrollTop = scroll.scrollTop; }, { passive: true });
}

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
  const stop = mode === 'making' ? '23.558%' : '23.32%';
  const tint = c.glow || (mode === 'making' ? '#7192ff' : '#6ab8ef');
  const el = h('div', {
    class: 'mkcard ' + mode,
    style: { background: S.cardBg(c) || `linear-gradient(180deg, #f6f4ec ${stop}, ${tint} 100%)` },
    onclick: () => openCard(c.id),
  },
    h('div', { class: 'status' },
      mode === 'making' ? h('span', { class: 'dot' }) : h('span', { html: ICON.ideaStar }),
      h('span', {}, mode === 'making' ? 'making' : 'Idea, ' + ago(c.created))),
    h('div', { class: 't' }, titleCase(c.title)),
    h('div', { class: 'sub' }, sub),
    mode === 'making' && src ? h('div', { class: 'img' }, img(src, c.title)) : null,
    h('div', { class: 'acts' },
      h('button', { onclick: act(() => openChat(c.id)) }, 'New chat'),
      mode === 'making'
        ? h('button', { onclick: act(() => nav.openLock(c.id)) }, 'Studio mode')
        : h('button', { onclick: act(() => {
            const snap = S.setState(c.id, 'making');
            toast({ html: '<b>making</b> · set by you', undo: () => { S.restore(snap); nav.refresh(); } });
            startMaking(c.id);
            nav.refresh();
          }) }, 'Start making')));
  squircle(el, 48);
  return el;
}

/* One card per post (same list and order as the "see all" carousel) --
   the post's piece photo and name rather than a placeholder; tapping it
   opens that post's Edit screen. */
function rtpCard(post) {
  const el = h('div', { class: 'rtp-card', onclick: () => openPostEdit(post.id) },
    h('div', { class: 'thumb' }, img(post.piece, post.name)),
    h('div', { class: 'head' },
      h('div', { class: 't' }, post.name)));
  squircle(el, 40);
  return el;
}

function filters() {
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
  return { sq: true, text: (c.outcome === 'partial' ? 'Partial, ' : 'Finished, ') + shortDate(c.finishedAt || c.updated) };
}

function archStatusRow(st) {
  return h('div', { class: 'st' },
    st.sq ? h('i', { class: 'sq' }) : h('span', { class: 'ic', html: ICON.ideaStar }),
    h('span', {}, st.text));
}

function finCard(c) {
  const src = S.hiRes(S.cutoutSrc(c));
  return h('button', { class: 'arch fin', onclick: () => openCard(c.id) },
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

function spotCard(c) {
  return h('button', { class: 'arch spot', style: { background: gradTint(c) }, onclick: () => openCard(c.id) },
    archStatusRow(archStatus(c)),
    h('div', {},
      h('div', { class: 't' }, titleCase(c.title)),
      h('div', { class: 'd' }, (c.desc || '').slice(0, 74) + ((c.desc || '').length > 74 ? '…' : ''))));
}

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

/* Archive layout: a fixed repeating 3-row rhythm -- pair (2 half-width),
   wide (1 full-width, gradient-only), single (1 half-width, alternating
   left/right each time) -- rather than the previous content-driven
   packing. Cards are split into two recency-ordered pools: "photo" (has a
   real photo -- finished/making cutouts, idea-with-photo) and "gradient"
   (idea, no photo). Wide rows must pull from the gradient pool only; if
   it's empty when a wide row comes up, that row is skipped and the cycle
   keeps going (confirmed) rather than forcing a photo card into it. Pair/
   single rows pull whichever pool's next card is more recent, mixing
   both types freely (confirmed) -- gradient cards that don't make it into
   a wide row show up here as the small variant instead. */
/* Shuffle (Fisher-Yates) instead of sorting by date -- ideas mix randomly
   rather than clustering by when they were made, so a pair row is much
   more likely to land one photo card + one gradient/bleed idea card
   together instead of two of the same type in a row. */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Pinned per filter tab: the shuffle only reshuffles when the actual set
   of card ids under that filter changes (a card added/removed/moved in
   or out), not on every re-render -- otherwise the whole grid would
   visibly reshuffle after every toggle/refresh, which reads as broken
   rather than "randomly mixed once". */
const archiveShuffleCache = new Map();

function archive() {
  let list = S.cards();
  if (filter !== 'all') list = list.filter(c => c.state === filter);

  if (!list.length)
    return h('div', { class: 'empty keep-type' },
      h('div', { class: 'h-big' }, 'NOTHING HERE YET'),
      h('div', { class: 'meta' }, 'Press LOG and say what you are making.'));

  const isGradient = (c) => c.state === 'idea' && !S.cutoutSrc(c);
  /* Shuffled once per filter; when cards are added/removed, the ones
     already placed keep their order and only the newcomers get slotted in,
     so the grid doesn't reshuffle. Cards you've just touched lead, most
     recent first: ones you made (not in the seed -- remakes, logged ideas,
     collide results) and ones you logged something to (a note, photo or
     chat message -- c.loggedAt), so you can see where it went. */
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
  const photoPool = order(list.filter(c => !isGradient(c)), cached?.photoIds);
  const gradPool = order(list.filter(isGradient), cached?.gradIds);
  archiveShuffleCache.set(filter, { photoIds: photoPool.map(c => c.id), gradIds: gradPool.map(c => c.id) });
  let pi = 0, gi = 0;
  const nextPhoto = () => pi < photoPool.length ? photoPool[pi++] : null;
  const nextGrad = () => gi < gradPool.length ? gradPool[gi++] : null;
  const nextAny = () => nextPhoto() || nextGrad();
  const remaining = () => (photoPool.length - pi) + (gradPool.length - gi);

  /* An idea whose photo is a real piece cutout (a remake) shows that piece
     like finished work does; other photo ideas keep the stock bleed photo. */
  const hasPiece = (c) => (c.photos || []).some(p => /assets\/pieces\//.test(p.src || ''));
  const halfCard = (c) => isGradient(c) ? smallSpotCard(c)
    : (c.state === 'idea' && !hasPiece(c)) ? bleedCard(c, S.heroSrc(c))
    : finCard(c);

  const wrap = h('div', { class: 'archive' });
  const CYCLE = ['pair', 'wide', 'single'];
  let step = 0, singleCount = 0;
  while (remaining() > 0) {
    const kind = CYCLE[step % 3];
    step++;
    if (kind === 'wide') {
      const g = nextGrad();
      if (g) wrap.append(spotCard(g));
      continue;
    }
    if (kind === 'single') {
      const c = nextAny();
      if (!c) break;
      wrap.append(h('div', { class: 'arch-row' + (singleCount % 2 ? ' right' : '') }, halfCard(c)));
      singleCount++;
      continue;
    }
    /* pair -- prefer one photo card + one gradient/bleed idea card together
       whenever both pools still have cards; drain whichever pool remains
       once the other runs out. */
    let a, b;
    if (pi < photoPool.length && gi < gradPool.length) {
      a = nextPhoto(); b = nextGrad();
    } else {
      a = nextAny();
      if (!a) break;
      b = nextAny();
    }
    wrap.append(h('div', { class: 'arch-row' }, halfCard(a), b ? halfCard(b) : null));
  }
  return wrap;
}

/* ══════════════ SEMANTIC SEARCH ══════════════ */
export function openSearch(prefill) {
  page((p, close) => {
    const input = h('input', { placeholder: 'Ask your archive anything', value: prefill || '' });
    const out = h('div');
    const scroll = h('div', { class: 'scroll' }, out);

    const showSuggests = () => {
      out.replaceChildren(
        h('div', { class: 'pad', style: { paddingTop: '26px' } },
          h('h1', { class: 'h-mega' }, 'ASK\nYOUR\nARCHIVE.')),
        h('div', { class: 'suggests' },
          ...AI.SUGGESTED.map(q => h('button', { onclick: () => run(q) }, q))));
    };

    const run = async (q) => {
      input.value = q;
      out.replaceChildren(h('div', { class: 'pad', style: { paddingTop: '30px' } },
        h('div', { class: 'shimmer', style: { height: '16px', width: '60%', marginBottom: '10px' } }),
        h('div', { class: 'shimmer', style: { height: '16px', width: '85%', marginBottom: '10px' } }),
        h('div', { class: 'shimmer', style: { height: '16px', width: '40%' } })));
      await new Promise(r => setTimeout(r, 520));

      const { answer, results } = AI.search(q);
      out.replaceChildren();

      if (!answer.paras) {
        out.append(h('div', { class: 'empty' },
          h('div', { class: 'h-big' }, 'NOTHING\nMATCHES\nTHAT.'),
          h('div', { class: 'meta', style: { marginTop: '12px' } },
            'Your archive has ' + S.cards().length + ' cards. Try handles, glaze, coils, nerikomi, a colour, or a form.'),
          h('button', { class: 'bigact ghost', style: { marginTop: '24px' }, onclick: showSuggests }, 'SEE EXAMPLES')));
        return;
      }

      const ans = h('div', { class: 'answer' });
      answer.paras.forEach(t => ans.append(h('p', {}, t)));
      if (answer.src) ans.append(h('div', { class: 'src archive', style: { marginTop: '14px', display: 'inline-block' } }, answer.src));
      out.append(ans);

      if (results.length) {
        out.append(h('div', { class: 'label', style: { padding: '26px 20px 0' } },
          results.length + ' CARD' + (results.length === 1 ? '' : 'S')));
        const l = h('div', { class: 'reslist' });
        results.forEach(c => {
          const src = S.cutoutSrc(c);
          l.append(h('button', { class: 'res', onclick: () => openCard(c.id) },
            h('div', { class: 't' }, src ? img(src, '') : h('div', { class: 'state ' + c.state })),
            h('div', { style: { minWidth: '0' } },
              h('div', { class: 'n' }, titleCase(c.title)),
              h('div', { class: 'w' }, AI.memoryLine(c))),
            h('div', { class: 'state ' + c.state })));
        });
        out.append(l);
      }
      out.append(h('div', { style: { height: '40px' } }));
    };

    input.addEventListener('keydown', e => { if (e.key === 'Enter') run(input.value); });

    p.append(
      h('div', { class: 'page-top' },
        h('button', { class: 'iconbtn', onclick: close, html: ICON.back }),
        h('div', { class: 'searchbar', style: { flex: '1', margin: '0' } },
          h('div', { style: { width: '17px', height: '17px', color: '#8C8A84' }, html: ICON.search }),
          input)),
      scroll);

    if (prefill) run(prefill); else showSuggests();
    setTimeout(() => input.focus(), 400);
  });
}

/* ══════════════ READY TO POST (all) ══════════════
   Post-preview cards are exact Figma exports (POSTS in post.js, each tied
   to its real piece card). Carousel animation is a port of
   infinite-scrolling-cards-slider.webflow.io (see the loop inside
   openReadyToPost), driven by horizontal scrolling of the screen; none of
   the reference's own UI is used. EDIT (dark chip) then POST (orange
   #FF451A / #040404 text); both act on the centred card. Tapping the
   centred card opens Edit too; tapping a side card brings it to centre. */
export function statusBar() {
  return h('div', { class: 'rtp-statusbar' },
    h('span', {}, '9:41'),
    h('div', { class: 'icons' },
      h('div', { class: 'bars' }, h('i'), h('i'), h('i'), h('i')),
      h('div', { class: 'wifi' }),
      h('div', { class: 'batt' }, h('i'))));
}

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
