/* ITEMS — what am I making now, what's ready to share, and the archive. */
import { h, ICON, img, ago, page, toast } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openCard } from './card.js';
import { openShare } from './share.js';

let filter = 'all';

export function renderItems(root) {
  const scroll = h('div', { class: 'scroll' });
  const mk = S.making(), rts = S.readyToShare(), ids = S.ideas();

  /* ── 1. MAKING NOW / MAKE NEXT ───────────────────────── */
  if (mk.length) {
    const c = mk[0];
    const done = (c.photos || []).filter(p => p.kind === 'process').length;
    const total = Math.max(4, (c.plan?.steps || []).length);
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'kicker' },
        h('div', { class: 'sec-t' }, 'Making now'),
        h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => nav.openLock(c.id), 'aria-label': 'Studio mode' })),
      nowCard(c, `${done} process photo${done === 1 ? '' : 's'} · started ${ago(c.startedMaking || c.created)}`,
        Math.min(.92, .18 + done * .22))));
  } else if (ids.length) {
    const c = ids[0];
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'kicker' },
        h('div', { class: 'sec-t' }, 'Make next'),
        h('button', { class: 'circlebtn', html: ICON.arrowFwd, onclick: () => nav.openDiscover(), 'aria-label': 'Discover' })),
      nowCard(c, 'Plan already prepared · ' + (c.plan?.assumptions?.[0] || ''), null)));
  } else {
    scroll.append(h('div', { class: 'hero-now' },
      h('div', { class: 'label' }, 'NOTHING ON THE BENCH'),
      h('h1', { class: 'h-mega', style: { margin: '14px 0 18px' } }, 'WHAT\nSHOULD\nYOU MAKE?'),
      h('button', { class: 'bigact paper', style: { margin: '0', width: '100%' },
        onclick: () => nav.openDiscover() }, 'OPEN DISCOVER')));
  }

  /* ── 2. READY TO SHARE ───────────────────────────────── */
  if (rts.length) {
    const c = rts[0];
    const n = (c.photos || []).length;
    scroll.append(h('div', { class: 'blk' },
      h('div', { class: 'blk-head' }, h('div', { class: 'sec-t' }, 'Ready to post')),
      h('div', { class: 'meta', style: { padding: '0 20px 12px' } }, 'done while you were away'),
      h('div', { class: 'share-strip' },
        h('div', { class: 'thumb' }, img(S.heroSrc(c), c.title)),
        h('div', { style: { flex: '1', minWidth: '0' } },
          h('h4', {}, c.title),
          h('p', {}, `${n} photo${n === 1 ? '' : 's'} cleaned up. Caption written from your notes.`),
          h('div', { class: 'acts' },
            h('button', { class: 'pill-dark', onclick: () => openShare(c.id) }, 'Preview'),
            h('button', { class: 'pill-out', onclick: () => openCard(c.id) }, 'Open card'))))));
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

function nowCard(c, sub, prog) {
  const src = S.heroSrc(c);
  return h('button', { class: 'nowcard', style: { width: '100%' }, onclick: () => openCard(c.id) },
    src ? h('div', { class: 'art' }, img(src, c.title)) : null,
    h('div', { class: 'veil' }),
    h('div', { class: 'cap' },
      h('div', { class: 'state ' + c.state, style: { marginBottom: '10px' } }, c.state),
      h('div', { class: 'h-big' }, c.title),
      h('div', { class: 'meta' }, sub),
      prog !== null && prog !== undefined
        ? h('div', { class: 'progressline' }, h('i', { style: { width: (prog * 100) + '%' } }))
        : null));
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
