/* ITEMS — what am I making now, what's ready to share, and the archive. */
import { h, ICON, img, ago, page, toast, squircle } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard, openChat, startMaking } from './card.js';
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
  const el = h('div', { class: 'mkcard ' + mode, onclick: () => openCard(c.id) },
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
  const n = (c.photos || []).length;
  const src = cutoutFor(c);
  const el = h('div', { class: 'rtp-card' },
    h('div', { class: 'thumb' }, src ? img(src, c.title) : null),
    h('div', { class: 'body' },
      h('div', { class: 'head' },
        h('div', { class: 't' }, titleCase(c.title)),
        h('div', { class: 'sub' }, `${n} photo${n === 1 ? '' : 's'} cleaned up`)),
      h('div', { class: 'acts' },
        h('button', { onclick: () => openShare(c.id) }, 'Post'),
        h('button', { onclick: () => openCard(c.id) }, 'Edit'))));
  squircle(el, 48);
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

/* Spatial archive: cutouts float, text ideas become type, occasional accent surface */
function archive() {
  let list = S.cards();
  if (filter !== 'all') list = list.filter(c => c.state === filter);
  list = list.slice().sort((a, b) => (b.updated || 0) - (a.updated || 0));

  if (!list.length)
    return h('div', { class: 'empty' },
      h('div', { class: 'h-big' }, 'NOTHING HERE YET'),
      h('div', { class: 'meta' }, 'Press LOG and say what you are making.'));

  const wrap = h('div', { class: 'archive' });
  let accents = 0;
  list.forEach((c, i) => {
    const src = S.cutoutSrc(c);
    if (src) {
      const tall = i % 3 !== 1;
      wrap.append(h('button', { class: 'arch ' + (tall ? 'tall' : 'short'), onclick: () => openCard(c.id) },
        h('div', { class: 'state ' + c.state + ' badge' }, ''),
        h('div', { class: 'obj' }, img(src, c.title)),
        h('div', { class: 'nm' }, c.title),
        h('div', { class: 'sub' }, subFor(c))));
    } else {
      const accent = accents < 2 && c.state === 'idea' && (i % 4 === 1);
      if (accent) accents++;
      wrap.append(h('button', {
        class: 'arch text' + (accent ? (accents === 1 ? ' accent' : ' blue') : ''),
        onclick: () => openCard(c.id)
      },
        h('div', { class: 'q' }, c.title),
        h('div', {},
          h('div', { class: 'sub', style: { marginBottom: '6px' } }, subFor(c)),
          h('div', { style: { fontSize: '11px', lineHeight: '1.35', opacity: .62 } },
            (c.desc || '').slice(0, 74) + ((c.desc || '').length > 74 ? '…' : '')))));
    }
  });
  return wrap;
}

const subFor = (c) => {
  if (c.state === 'finished') return (c.outcome === 'partial' ? 'PARTIAL · ' : '') + ago(c.finishedAt || c.updated);
  if (c.state === 'making') return 'ON THE BENCH';
  return (c.origin?.type || 'idea').toUpperCase();
};

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
   Figma's node also mocks a full Instagram post (avatar, username, studio
   name, like/comment/repost/save counts, "Liked by X and 220 others") on
   each card. None of that has any real data or behavior behind it in this
   app -- no social graph, no engagement numbers -- so it's left out here
   rather than faked. Kept: the real per-card content (photo, title,
   technique) plus working Post/Edit actions on every card. Figma also
   showed the deck as a scaled stack (centered card large, neighbors
   peeking smaller); implemented instead as a plain scroll-snap row, which
   satisfies "cards are scrollable" with far less complexity. */
function rtpPostCard(c) {
  const src = cutoutFor(c);
  const technique = c.plan?.params?.find(p => p.key === 'technique')?.val || '';
  const tint = `color-mix(in srgb, ${c.glow || '#8C8A84'} 35%, white)`;
  return h('div', { class: 'rtp-post' },
    h('div', { class: 'photo', style: { background: `linear-gradient(180deg, #f6f4ec 41.334%, ${tint} 100%)` } },
      h('div', { class: 'tag tl' }, 'Ceramics'),
      technique ? h('div', { class: 'tag tr' }, technique) : null,
      src ? img(src, c.title) : null,
      h('div', { class: 'tag bl' }, titleCase(c.title))),
    h('div', { class: 'foot' },
      h('div', { class: 't' }, titleCase(c.title)),
      h('div', { class: 'acts' },
        h('button', { onclick: () => openShare(c.id) }, 'Post'),
        h('button', { onclick: () => openCard(c.id) }, 'Edit'))));
}

export function openReadyToPost() {
  page((p, close) => {
    const rts = S.readyToShare();
    p.append(
      h('div', { class: 'rtp-page-head' },
        h('div', { class: 'navrow' },
          h('button', { class: 'navbtn', onclick: close, html: ICON.back, 'aria-label': 'Back' }),
          /* Figma shows a "+" here with no stated action -- rendered for visual
             fidelity, left inert rather than guessing at behavior. */
          h('button', { class: 'navbtn', html: ICON.plus, 'aria-label': 'Add' })),
        h('div', { class: 't' }, 'Ready to post'),
        h('div', { class: 'sub' }, 'Prepared while you were away')),
      h('div', { class: 'rtp-stack' }, ...rts.map(rtpPostCard)));
  });
}
