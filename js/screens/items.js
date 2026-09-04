/* ITEMS — what am I making now, what's ready to share, and the archive. */
import { h, ICON, img, ago, page, toast, squircle } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, openChat, startMaking, isCutout } from './card.js';
import { openShare } from './share.js';

let filter = 'all';

export function renderItems(root) {
  const scroll = h('div', { class: 'scroll' });
  const mk = S.making(), rts = S.readyToShare(), ids = S.ideas();

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
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'label' }, 'NOTHING ON THE BENCH'),
      h('h1', { class: 'h-mega', style: { margin: '14px 0 18px' } }, 'WHAT\nSHOULD\nYOU MAKE?'),
      h('button', { class: 'bigact paper', style: { margin: '0', width: '100%' },
        onclick: () => nav.openDiscover() }, 'OPEN DISCOVER')));
  }

  /* ── 2. READY TO SHARE ───────────────────────────────── */
  if (rts.length) {
    scroll.append(h('div', { class: 'blk' },
      h('div', { class: 'blk-head act' },
        h('div', { class: 'sec-t' }, 'Ready to post'),
        h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => openReadyToPost(), 'aria-label': 'See all' })),
      h('div', { class: 'rtp-row' }, ...rts.map(rtpCard))));
  }

  /* ── 3. ARCHIVE ──────────────────────────────────────── */
  scroll.append(h('div', { class: 'blk' },
    h('div', { class: 'blk-head act' },
      h('div', { class: 'sec-t' }, 'Archive'),
      h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => openSearch(), 'aria-label': 'Ask your archive' })),
    filters(),
    archive()));

  root.replaceChildren(scroll);
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
    style: { background: `linear-gradient(180deg, #f6f4ec ${stop}, ${tint} 100%)` },
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

function rtpCard(c) {
  const src = cutoutFor(c);
  /* Description and buttons removed per your latest spec -- without them
     the card had no way to open the piece at all, so it's now clickable
     as a whole (opens the card), matching every other preview card in
     the app (hero, archive). Flagging that addition since it wasn't
     explicitly requested. */
  const el = h('div', { class: 'rtp-card', onclick: () => openCard(c.id) },
    h('div', { class: 'thumb' }, src ? img(src, c.title) : null),
    h('div', { class: 'head' },
      h('div', { class: 't' }, titleCase(c.title))));
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

/* "assets/images for ideas" holds proper opaque bleed-ready stock photos --
   only 2 exist and their content (a creature figure, a paint-texture
   close-up) doesn't match any real card's actual subject, so this is a
   stock pool, cycled positionally across idea cards whose OWN photo isn't
   suitable for a full-bleed cover crop, same pattern as the ready-to-post
   carousel images, not a per-card content match. This is now reserved for
   ideas with no photo at all -- see the isCutout() note on ideaImg()
   below for why a card with a real (if cutout-style) reference photo no
   longer routes through here. */
const IDEA_PHOTOS = ['assets/images for ideas/image creature.png', 'assets/images for ideas/image paint.png'];

function bleedCard(c, photoSrc) {
  return h('button', { class: 'arch bleed', style: { background: c.glow || '#222' }, onclick: () => openCard(c.id) },
    h('div', { class: 'bgimg' }, img(photoSrc, c.title)),
    h('div', { class: 'dim' }),
    archStatusRow(archStatus(c)),
    h('div', { class: 't' }, titleCase(c.title)));
}

const gradTint = (c) => `linear-gradient(180deg, ${c.glow || '#8C8A84'} 0%, #f4f2ec 100%)`;

/* An idea's own photo (Pinterest-saved reference, etc.) is almost always a
   repurposed piece cutout (assets/pieces/..., near-transparent -- see the
   IDEA_PHOTOS note above), not a real bleed-ready photo. Previously any
   idea with SOME photo -- cutout or not -- got routed through bleedCard,
   which discarded that real image entirely and substituted an unrelated
   stock photo (a creature figure / paint texture); the archive tile and
   the card you actually opened showed completely different pictures.
   Cutout-style photos now render centered on the gradient card instead --
   the real image, matching what openCard()'s hero shows for the same
   card (S.isCutout()'s treatment-A rule) -- while a genuine non-cutout
   photo (none in the current seed data, but the data model allows it)
   still gets the full-bleed bleedCard treatment. */
const ideaImg = (c) => {
  const src = S.cutoutSrc(c);
  if (!src) return null;
  const hi = S.hiRes(src);
  return isCutout(hi) ? hi : null;
};
const bleedReady = (c) => { const src = S.cutoutSrc(c); return src && !isCutout(S.hiRes(src)); };

function spotCard(c) {
  const thumb = ideaImg(c);
  return h('button', { class: 'arch spot' + (thumb ? ' has-img' : ''), style: { background: gradTint(c) }, onclick: () => openCard(c.id) },
    archStatusRow(archStatus(c)),
    thumb ? h('div', { class: 'obj' }, img(thumb, c.title)) : null,
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
  const thumb = ideaImg(c);
  return h('button', { class: 'arch spot small' + (thumb ? ' has-img' : ''), style: { background: gradTint(c) }, onclick: () => openCard(c.id) },
    archStatusRow(archStatus(c)),
    thumb ? h('div', { class: 'obj' }, img(thumb, c.title)) : null,
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
    return h('div', { class: 'empty' },
      h('div', { class: 'h-big' }, 'NOTHING HERE YET'),
      h('div', { class: 'meta' }, 'Press LOG and say what you are making.'));

  /* "gradient pool" now means "not bleed-ready", not just "no photo" --
     an idea with a cutout-style reference photo isn't suitable for
     bleedCard's full-bleed cover crop either (see ideaImg()/bleedReady()
     above), so it renders via spotCard/smallSpotCard too, with its real
     image centered on the gradient instead of a mismatched stock photo. */
  const isGradient = (c) => c.state === 'idea' && !bleedReady(c);
  const idKey = list.map(c => c.id).sort().join(',');
  const cached = archiveShuffleCache.get(filter);
  let photoPool, gradPool;
  if (cached && cached.idKey === idKey) {
    const byId = new Map(list.map(c => [c.id, c]));
    photoPool = cached.photoIds.map(id => byId.get(id));
    gradPool = cached.gradIds.map(id => byId.get(id));
  } else {
    photoPool = shuffled(list.filter(c => !isGradient(c)));
    gradPool = shuffled(list.filter(isGradient));
    archiveShuffleCache.set(filter, {
      idKey, photoIds: photoPool.map(c => c.id), gradIds: gradPool.map(c => c.id),
    });
  }
  let pi = 0, gi = 0;
  const nextPhoto = () => pi < photoPool.length ? photoPool[pi++] : null;
  const nextGrad = () => gi < gradPool.length ? gradPool[gi++] : null;
  const nextAny = () => nextPhoto() || nextGrad();
  const remaining = () => (photoPool.length - pi) + (gradPool.length - gi);

  let ideaPhotoIdx = 0;
  const halfCard = (c) => isGradient(c)
    ? smallSpotCard(c)
    : (c.state === 'idea' ? bleedCard(c, IDEA_PHOTOS[ideaPhotoIdx++ % IDEA_PHOTOS.length]) : finCard(c));

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
              h('div', { class: 'n' }, c.title),
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
   Post-preview cards are exact Figma exports (assets/posts/Post*.png), not
   rebuilt from primitives, and still not individually clickable -- per
   your direction, they're images you swipe past, not buttons.
   Carousel animation modeled on https://pin.it/3HbQi36yD: the centered
   card sits at full scale, neighbors shrink/fade toward the edges as you
   scroll, continuously (not stepped). Post/Edit buttons are the static
   #0B0B0B chip from Figma node 467:60895 -- no color animation on them;
   only their onclick target follows the centered card, positionally
   (image i <-> rts[i], same as before). Fewer real cards than images
   just means the tail images center with no click target. */
const RTP_IMAGES = ['assets/posts/Post.png', 'assets/posts/Post-1.png', 'assets/posts/Post-2.png'];

function statusBar() {
  return h('div', { class: 'rtp-statusbar' },
    h('span', {}, '9:41'),
    h('div', { class: 'icons' },
      h('div', { class: 'bars' }, h('i'), h('i'), h('i'), h('i')),
      h('div', { class: 'wifi' }),
      h('div', { class: 'batt' }, h('i'))));
}

export function openReadyToPost() {
  page((p, close) => {
    const rts = S.readyToShare();
    const cardEls = RTP_IMAGES.map(src => img(src, ''));
    const deck = h('div', { class: 'rtp-deck' }, ...cardEls);
    const postBtn = h('button', {}, 'Post');
    const editBtn = h('button', {}, 'Edit');
    let currentIdx = -1;

    /* Buttons stay Figma's static #0B0B0B chip (node 467:60895) -- no color
       animation. Only their onclick target follows the centered card. */
    const setActive = (i) => {
      if (i === currentIdx) return;
      currentIdx = i;
      const c = rts[i];
      postBtn.onclick = c ? () => openShare(c.id) : null;
      editBtn.onclick = c ? () => openCard(c.id) : null;
    };

    const layout = () => {
      const rect = deck.getBoundingClientRect();
      const mid = rect.left + rect.width / 2;
      let bestI = 0, bestDist = Infinity;
      cardEls.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs((r.left + r.width / 2) - mid);
        const norm = Math.min(1, dist / (rect.width * 0.55));
        el.style.transform = `scale(${(1 - norm * 0.18).toFixed(3)})`;
        el.style.opacity = (1 - norm * 0.35).toFixed(3);
        if (dist < bestDist) { bestDist = dist; bestI = i; }
      });
      setActive(bestI);
    };
    let ticking = false;
    deck.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { layout(); ticking = false; });
    }, { passive: true });

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
      h('div', { class: 'rtp-bottombar' }, postBtn, editBtn));

    requestAnimationFrame(layout);
  });
}
