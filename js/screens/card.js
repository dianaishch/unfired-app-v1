/* CARD DETAIL — hero, description, how to make it, photos, notes & chats. */
import { h, frag, ICON, page, sheet, toast, fmtShort, ago, img, sleep } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { openShare } from './share.js';

const STATES = ['idea', 'making', 'finished'];

export function openCard(id) {
  page((p, close) => {
    const render = () => {
      const c = S.byId(id);
      p.replaceChildren();
      if (!c) { p.append(h('div', { class: 'empty' }, h('div', { class: 'h-big' }, 'CARD GONE'))); return; }
      p.append(
        h('div', { class: 'page-top' },
          h('button', { class: 'iconbtn', onclick: close, html: ICON.back }),
          h('div', { style: { flex: '1' } }),
          h('button', { class: 'iconbtn', html: ICON.spark, onclick: () => openChat(c.id, null, render) })
        ),
        body(c, render, close)
      );
    };
    render();
  });
}

function body(c, render, closePage) {
  const scroll = h('div', { class: 'scroll' });
  const hero = S.hiRes(S.heroSrc(c));

  /* A. HERO */
  scroll.append(
    h('div', { class: 'cardhero', style: { '--glow': c.glow || '#222' } },
      h('div', { class: 'bgglow' }),
      hero
        ? img(hero, c.title)
        : h('div', { class: 'noimg' },
            h('div', { class: 'label' }, c.state === 'idea' ? 'TEXT ONLY — NO IMAGE YET' : 'NO PHOTO'))
    )
  );

  /* title + state */
  const title = h('h1', { class: 'h-mega', contenteditable: 'true', spellcheck: 'false' }, c.title);
  title.addEventListener('blur', () => {
    const v = title.textContent.trim().toUpperCase();
    if (v && v !== c.title) { S.updateCard(c.id, { title: v }); toast({ text: 'Title updated' }); nav.refresh(); }
  });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } });

  const statepick = h('div', { class: 'statepick' },
    ...STATES.map(s => h('button', {
      class: s === c.state ? 'on' : '',
      onclick: () => {
        if (s === c.state) return;
        const snap = S.setState(c.id, s);
        toast({ html: `<b>${s}</b> · set by you`, undo: () => { S.restore(snap); render(); nav.refresh(); } });
        if (s === 'making') startMaking(c.id);
        render(); nav.refresh();
      }
    }, s))
  );

  scroll.append(
    h('div', { class: 'titlewrap' },
      title,
      h('div', { class: 'staterow' },
        statepick,
        h('div', { class: 'meta' }, c.origin?.label || '', ' · ', ago(c.updated))
      )
    )
  );

  /* B. ORIGINAL DESCRIPTION */
  const desc = h('div', { class: 'desc', contenteditable: 'true', spellcheck: 'false' }, c.desc || '');
  desc.addEventListener('blur', () => {
    const v = desc.textContent.trim();
    if (v !== c.desc) { S.updateCard(c.id, { desc: v }); toast({ text: 'Saved' }); }
  });
  scroll.append(
    h('div', { class: 'sect' },
      h('div', { class: 'sh' }, h('div', { class: 'label' }, c.origin?.type === 'voice' ? 'WHAT YOU SAID' : 'WHAT YOU LOGGED')),
      desc)
  );

  /* C. HOW TO MAKE IT (collapsible) */
  scroll.append(howTo(c, render));

  /* D. PHOTOS */
  scroll.append(photos(c, render));

  /* E. NOTES & CHATS */
  scroll.append(notesAndChats(c, render));

  /* actions */
  scroll.append(h('button', { class: 'bigact ghost', onclick: () => openChat(c.id, null, render) },
    'NEW CHAT'));

  if (c.state === 'idea')
    scroll.append(h('button', { class: 'bigact', onclick: () => {
      const snap = S.setState(c.id, 'making');
      startMaking(c.id);
      toast({ html: '<b>MAKING</b> · live activity started', undo: () => { S.restore(snap); render(); nav.refresh(); } });
      render(); nav.refresh();
    } }, 'START MAKING'));

  if (c.state === 'making')
    scroll.append(
      h('button', { class: 'bigact paper', onclick: () => nav.openLock(c.id) }, 'OPEN STUDIO MODE'),
      h('button', { class: 'bigact ghost', onclick: () => {
        const snap = S.setState(c.id, 'finished');
        S.updateCard(c.id, { readyToShare: true });
        toast({ html: 'Looks finished. <b>FINISHED</b>', undo: () => { S.restore(snap); render(); nav.refresh(); } });
        render(); nav.refresh();
      } }, 'MARK FINISHED'));

  if (c.state === 'finished')
    scroll.append(h('button', { class: 'bigact paper', onclick: () => openShare(c.id) }, 'PREPARE TO SHARE'));

  scroll.append(h('div', { style: { height: '40px' } }));
  return scroll;
}

/* ---------- HOW TO MAKE IT ---------- */
function howTo(c, render) {
  const plan = c.plan;
  if (!plan) return h('div');
  let open = c.state !== 'finished';
  const inner = h('div');
  const chev = h('div', { class: 'chev' + (open ? ' open' : ''), html: '▾' });

  const build = () => {
    inner.replaceChildren();
    if (!open) return;
    inner.classList.add('fadein');

    /* one editable assumption block — tap it to correct anything */
    inner.append(assumeBlock(c, render));

    if (plan.tools?.length)
      inner.append(h('div', { class: 'srcline' }, h('div', { class: 'label' }, 'TOOLS'),
        ...plan.tools.map(t => h('div', { class: 'src' }, t))));

    /* steps */
    inner.append(h('div', { class: 'label', style: { marginTop: '22px' } }, 'ACTION PLAN'));
    inner.append(h('ol', { class: 'steps' }, ...plan.steps.map(s => h('li', {}, s))));

    /* risks */
    if (plan.risks?.length) {
      inner.append(h('div', { class: 'label', style: { marginTop: '22px' } }, 'WHERE IT GOES WRONG'));
      inner.append(h('div', { class: 'risks' },
        ...plan.risks.map(r => h('div', { class: 'risk' }, h('b', {}, r.k), h('span', {}, r.t)))));
    }

    /* archive memory */
    if (plan.refs?.length) {
      inner.append(h('div', { class: 'srcline' }, h('div', { class: 'src archive' }, 'YOUR ARCHIVE')));
      plan.refs.forEach(r => {
        const rc = S.byId(r.cardId);
        if (!rc) return;
        inner.append(h('button', { class: 'memo', style: { textAlign: 'left', display: 'block', width: '100%' },
          onclick: () => openCard(rc.id) },
          h('b', {}, rc.title), ' — ', r.note));
      });
    }
  };
  build();

  const head = h('button', { class: 'sh', onclick: () => { open = !open; chev.classList.toggle('open', open); build(); } },
    h('div', { class: 'h-mid' }, 'HOW TO MAKE IT'), chev);

  return h('div', { class: 'sect' }, head, inner);
}

/* The single editable statement of what UNFIRED is assuming. */
export function planSummary(c) {
  const plan = c.plan;
  if (plan.summary) return plan.summary;
  const params = (plan.params || []).filter(p => p.val);
  if (!params.length) return (plan.assumptions || []).join(' · ');
  /* a bare number means nothing on its own — keep its label; a phrase speaks for itself */
  const parts = params.map(p => /^[~\d]/.test(String(p.val).trim()) ? `${p.key} ${p.val}` : p.val);
  const line = parts.join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
}

function assumeBlock(c, render) {
  const plan = c.plan;
  const anyLogged = (plan.params || []).some(p => p.src === 'user');
  const text = h('p', { contenteditable: 'true', spellcheck: 'false' }, planSummary(c));

  text.addEventListener('blur', () => {
    const v = text.textContent.trim();
    if (!v || v === planSummary(c)) return;
    S.updateCard(c.id, cc => ({ plan: { ...cc.plan, summary: v, assumeEdited: true } }));
    toast({ html: 'Assumptions — <b>yours now</b>' });
    render();
  });

  return h('div', { class: 'assume' },
    h('div', { class: 'label' }, plan.assumeEdited ? 'YOURS' : 'ASSUMING'),
    text,
    h('div', { class: 'meta', style: { marginTop: '10px', fontSize: '11px' } },
      plan.assumeEdited ? 'Edited by you. Tap to change it again.'
        : (anyLogged ? 'Some of this you logged, the rest is estimated from your archive. Tap to correct it.'
                     : 'Estimated from your archive. Tap to correct it.')));
}

/* ---------- PHOTOS ---------- */
function photos(c, render) {
  const row = h('div', { class: 'photorow' });
  (c.photos || []).forEach(p => {
    row.append(h('div', { class: 'ph' },
      img(p.src, p.cap || ''),
      h('div', { class: 'k' }, p.kind),
      h('button', { class: 'x', html: '×', onclick: () => {
        const snap = S.removePhoto(c.id, p.id);
        toast({ text: 'Photo removed', undo: () => { S.restore(snap); render(); } });
        render();
      } }),
      p.cap ? h('div', { class: 'cp' }, p.cap) : null
    ));
  });

  const input = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  input.addEventListener('change', () => {
    const f = input.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    addProcessPhoto(c.id, url, render);
  });

  row.append(h('button', { class: 'ph add', onclick: () => {
    sheet({ build: (b, done) => {
      b.append(h('div', { class: 'label' }, 'ADD A PHOTO'),
        h('div', { class: 'h-big', style: { margin: '10px 0 20px' } }, 'FROM WHERE?'),
        h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
          onclick: () => { done(); input.click(); } }, 'UPLOAD FROM THIS DEVICE'),
        h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
          onclick: () => { done(); pickFromLibrary(c.id, render); } }, 'SIMULATED PHOTO LIBRARY'));
    } });
  } }, '+ PHOTO'));

  return h('div', { class: 'sect' },
    h('div', { class: 'sh' }, h('div', { class: 'h-mid' }, 'PHOTOS'),
      h('div', { class: 'meta' }, (c.photos || []).length || 'none')),
    row);
}

function pickFromLibrary(cardId, render) {
  import('../seed.js').then(({ PHOTO_LIB }) => {
    sheet({ build: (b, done) => {
      b.append(h('div', { class: 'label' }, 'PHOTO LIBRARY · SIMULATED'),
        h('div', { class: 'h-big', style: { margin: '10px 0 16px' } }, 'RECENT'));
      const g = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' } });
      PHOTO_LIB.forEach(p => g.append(h('button', {
        style: { borderRadius: '14px', overflow: 'hidden', aspectRatio: '1', background: '#111' },
        onclick: () => { done(); addProcessPhoto(cardId, p.src, render, p.guess); }
      }, img(p.src, '', ''))));
      b.append(g);
    } });
  });
}

function addProcessPhoto(cardId, src, render, kind) {
  const c = S.byId(cardId);
  const guess = kind || (c.state === 'finished' ? 'final' : c.state === 'making' ? 'process' : 'inspiration');
  const t = toast({ work: true, html: 'Reading photo…', ms: 700 });
  setTimeout(() => {
    t.kill();
    const snap = S.addPhoto(cardId, { src, kind: guess, cap: 'Added just now' });
    let msg = `Added as a <b>${guess}</b> photo to <b>${c.title}</b>`;
    /* state inference from photo kind */
    if (c.state === 'idea' && guess === 'process') { S.setState(cardId, 'making'); msg = 'Looks like you started making this.<br><b>MAKING</b>'; startMaking(cardId); }
    else if (c.state === 'making' && guess === 'final') { S.setState(cardId, 'finished'); S.updateCard(cardId, { readyToShare: true }); msg = 'Looks finished.<br><b>FINISHED</b>'; }
    toast({ html: msg, undo: () => { S.restore(snap); render(); nav.refresh(); } });
    render(); nav.refresh();
  }, 380);
}

/* ---------- NOTES & CHATS ---------- */
function notesAndChats(c, render) {
  const wrap = h('div', { class: 'sect' },
    h('div', { class: 'sh' }, h('div', { class: 'h-mid' }, 'NOTES & CHATS'),
      h('div', { class: 'meta' }, ((c.notes || []).length + (c.threads || []).length) || 'none')));

  const bubbles = h('div', { class: 'bubbles' });

  (c.notes || []).slice().sort((a, b) => b.at - a.at).forEach(n => {
    bubbles.append(h('button', { class: 'bub', onclick: () => openNote(c.id, n, render) },
      h('div', { class: 't' }, noteTitle(n)),
      h('div', { class: 'p' }, n.text),
      h('div', { class: 'w' }, srcLabel(n.src), ' · ', fmtShort(n.at))));
  });

  (c.threads || []).slice().sort((a, b) => b.at - a.at).forEach(t => {
    const last = t.msgs[t.msgs.length - 1];
    bubbles.append(h('button', { class: 'bub', onclick: () => openChat(c.id, t.id, render) },
      h('div', { class: 't' }, t.title),
      h('div', { class: 'p' }, last ? last.text : 'Empty'),
      h('div', { class: 'w' }, t.msgs.length + ' messages · ' + fmtShort(t.at))));
  });

  if (!bubbles.children.length)
    bubbles.append(h('div', { class: 'meta', style: { padding: '14px 0' } },
      'Nothing logged against this card yet. Anything you say near it lands here.'));

  wrap.append(bubbles);
  return wrap;
}

const noteTitle = (n) => {
  const t = n.text;
  const words = t.replace(/^(the |a |i )/i, '').split(/\s+/).slice(0, 3).join(' ');
  return words.replace(/[.,]$/, '').toUpperCase();
};
const srcLabel = (s) => ({ watch: 'APPLE WATCH', liveactivity: 'LIVE ACTIVITY', voice: 'VOICE', type: 'TYPED', import: 'IMPORTED' }[s] || 'VOICE');

function openNote(cardId, n, render) {
  sheet({ build: (b, done) => {
    b.append(
      h('div', { class: 'label' }, srcLabel(n.src) + ' · ' + fmtShort(n.at)),
      h('div', { class: 'desc', style: { fontSize: '20px', marginTop: '14px' } }, n.text));
    const ex = AI.extract(n.text);
    if (ex.length) {
      b.append(h('div', { class: 'label', style: { marginTop: '22px' } }, 'UNFIRED PULLED OUT'));
      b.append(h('div', { class: 'params' }, ...ex.map(x =>
        h('div', { class: 'ptag est' }, h('div', { class: 'k' }, x.k), h('div', { class: 'v' }, x.v)))));
    }
    b.append(h('button', { class: 'bigact ghost', style: { width: '100%', margin: '24px 0 0' },
      onclick: () => { done(); openChat(cardId, null, render, n.text); } }, 'ASK ABOUT THIS'));
  } });
}

/* ---------- CHAT THREAD ---------- */
export function openChat(cardId, threadId, onDone, seed) {
  const c = S.byId(cardId);
  let tid = threadId;
  if (!tid) tid = S.addThread(cardId, { title: 'NEW CHAT', msgs: [] });

  page((p, close) => {
    const list = h('div', { class: 'thread' });
    const headTitle = h('div', { class: 'h-mid', style: { marginTop: '2px' } },
      ((S.byId(cardId).threads || []).find(x => x.id === tid) || {}).title || 'NEW CHAT');
    const ti = h('div', { class: 'ti', contenteditable: 'true', 'data-ph': 'Ask about this piece…' });
    let busy = false;

    const paint = () => {
      const card = S.byId(cardId);
      const t = (card.threads || []).find(x => x.id === tid);
      list.replaceChildren();
      if (!t.msgs.length)
        list.append(h('div', { class: 'meta', style: { padding: '30px 0', textAlign: 'center' } },
          'UNFIRED already knows this card and everything else you have made.'));
      t.msgs.forEach(m => {
        const el = h('div', { class: 'msg ' + (m.role === 'me' ? 'me' : 'ai') });
        el.append(document.createTextNode(m.text));
        if (m.role === 'ai' && m.src)
          el.append(h('div', { class: 'src ' + (m.src === 'archive' ? 'archive' : '') },
            m.src === 'archive' ? 'YOUR ARCHIVE' : 'CERAMIC REFERENCE'));
        list.append(el);
      });
      list.scrollTop = list.scrollHeight;
    };

    const send = async (text) => {
      const v = (text ?? ti.textContent).trim();
      if (!v || busy) return;
      busy = true;
      ti.textContent = '';
      S.addMessage(cardId, tid, { role: 'me', text: v });
      const card = S.byId(cardId);
      const t = (card.threads || []).find(x => x.id === tid);
      if (t.title === 'NEW CHAT') S.updateCard(cardId, cc => {
        const tt = cc.threads.find(x => x.id === tid);
        tt.title = v.replace(/[?.]$/, '').split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        return {};
      });
      headTitle.textContent = ((S.byId(cardId).threads || []).find(x => x.id === tid) || {}).title || 'NEW CHAT';
      paint();
      const typing = h('div', { class: 'msg ai' }, h('div', { class: 'typing' }, h('i'), h('i'), h('i')));
      list.append(typing); list.scrollTop = list.scrollHeight;
      await sleep(700 + Math.random() * 500);
      typing.remove();
      const r = AI.reply(S.byId(cardId), v);
      S.addMessage(cardId, tid, r);
      paint();
      busy = false;
      onDone && onDone();
    };

    ti.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    p.append(
      h('div', { class: 'page-top' },
        h('button', { class: 'iconbtn', onclick: () => { cleanEmpty(cardId, tid); onDone && onDone(); close(); }, html: ICON.back }),
        h('div', {}, h('div', { class: 'label' }, c.title), headTitle)),
      list,
      h('div', { class: 'composer' }, ti,
        h('button', { class: 'sendb', html: ICON.send, onclick: () => send() }))
    );
    paint();
    if (seed) setTimeout(() => send(`About this note: ${seed}`), 250);
    setTimeout(() => ti.focus(), 420);
  });
}

function cleanEmpty(cardId, tid) {
  const c = S.byId(cardId);
  const t = (c.threads || []).find(x => x.id === tid);
  if (t && !t.msgs.length) S.updateCard(cardId, cc => ({ threads: cc.threads.filter(x => x.id !== tid) }));
}

/* ---------- starting to make ---------- */
export function startMaking(cardId) {
  const c = S.byId(cardId);
  if (!c) return;
  setTimeout(() => {
    toast({
      html: `Live Activity on your Lock Screen for <b>${c.title}</b>`,
      ms: 5200,
      undo: null,
    });
  }, 900);
}
