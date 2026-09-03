/* CARD DETAIL — hero, description, how to make it, photos, notes & chats. */
import { h, frag, ICON, page, sheet, toast, fmtShort, ago, img, sleep, squircle } from '../ui.js';
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

/* Small status row shared by the hero card -- same visual language as the
   Items-screen archive (square for making/finished, star for idea). */
function heroStatus(c) {
  const icon = c.state === 'idea' ? h('span', { class: 'ic', html: ICON.ideaStar }) : h('span', { class: 'sq' });
  const label = c.state === 'idea' ? 'Idea, ' + ago(c.created)
    : c.state === 'making' ? 'Making, ' + ago(c.startedMaking || c.created)
    : (c.outcome === 'partial' ? 'Partial, ' : 'Finished, ') + ago(c.finishedAt || c.updated);
  return h('div', { class: 'ch-status' }, icon, h('span', {}, label));
}

/* Hero, title, and the state segmented control unified into one gradient
   card (Figma node 467:57910 / 467:57986) -- previously three separate
   stacked elements. Tint comes from c.glow, same field/formula already
   used for the Items-screen hero card. */
function heroCard(c, render) {
  const hero = S.hiRes(S.heroSrc(c));

  const title = h('div', { class: 'ch-t', contenteditable: 'true', spellcheck: 'false' }, c.title);
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

  const tint = c.glow || '#8C8A84';
  const el = h('div', {
    class: 'cardhero2',
    style: { background: `linear-gradient(180deg, #f6f4ec 23.558%, ${tint} 100%)` },
  },
    heroStatus(c),
    title,
    hero ? h('div', { class: 'ch-img' }, img(hero, c.title)) : null,
    statepick);
  /* Same corner-smoothing treatment as the Items-screen hero card
     (.mkcard) -- per your instruction to match its look, minus the
     description and New Chat/Start Making buttons (this page keeps the
     state tags instead). */
  squircle(el, 48);
  return el;
}

function body(c, render, closePage) {
  const scroll = h('div', { class: 'scroll' });

  scroll.append(heroCard(c, render));

  /* Origin/date -- previously sat next to the state picker; the new hero
     card has no room for it, so it moved here, right above the
     description it explains. */
  if (c.origin?.label)
    scroll.append(h('div', { class: 'meta', style: { padding: '14px 20px 0' } }, c.origin.label, ' · ', ago(c.updated)));

  scroll.append(descBox(c));
  scroll.append(planCard(c, render));
  scroll.append(attachmentsRow(c, render));
  scroll.append(chatsSection(c, render));

  if (c.state === 'idea')
    scroll.append(h('button', { class: 'bigact', style: { margin: '28px 20px 0', width: 'calc(100% - 40px)' }, onclick: () => {
      const snap = S.setState(c.id, 'making');
      startMaking(c.id);
      toast({ html: '<b>MAKING</b> · live activity started', undo: () => { S.restore(snap); render(); nav.refresh(); } });
      render(); nav.refresh();
    } }, 'START MAKING'));

  if (c.state === 'making')
    scroll.append(
      h('button', { class: 'bigact paper', style: { margin: '28px 20px 0', width: 'calc(100% - 40px)' }, onclick: () => nav.openLock(c.id) }, 'OPEN STUDIO MODE'),
      h('button', { class: 'bigact ghost', style: { margin: '10px 20px 0', width: 'calc(100% - 40px)' }, onclick: () => {
        const snap = S.setState(c.id, 'finished');
        S.updateCard(c.id, { readyToShare: true });
        toast({ html: 'Looks finished. <b>FINISHED</b>', undo: () => { S.restore(snap); render(); nav.refresh(); } });
        render(); nav.refresh();
      } }, 'MARK FINISHED'));

  if (c.state === 'finished')
    scroll.append(h('button', { class: 'bigact paper', style: { margin: '28px 20px 0', width: 'calc(100% - 40px)' }, onclick: () => openShare(c.id) }, 'PREPARE TO SHARE'));

  scroll.append(h('div', { style: { height: '16px' } }));
  return frag(scroll, composeBar(c, render));
}

/* ---------- HOW TO MAKE IT ---------- */
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

/* ---------- DESCRIPTION (paper card, Figma) ---------- */
function descBox(c) {
  const desc = h('div', {
    class: 'desc2', contenteditable: 'true', spellcheck: 'false',
    'data-ph': 'Type in or use voice via microphone button…',
  }, c.desc || '');
  desc.addEventListener('blur', () => {
    const v = desc.textContent.trim();
    if (v !== c.desc) { S.updateCard(c.id, { desc: v }); toast({ text: 'Saved' }); }
  });
  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Description')),
    desc);
}

/* ---------- PLAN (interleaved narrative + collapse, Figma) ----------
   Figma's example interleaves specific warnings between the exact steps
   they narratively relate to (a handle-crack warning right after the
   shape step) and breaks out per-step params (clay weight, wall
   thickness) as sub-lines under each numbered step. Neither association
   exists in the real plan data model (risks and params aren't linked to
   a specific step index), so rather than guess a pairing that might be
   wrong, this keeps every real field -- tools, steps, risks, archive
   refs -- in one merged numbered list, risks appended after all the
   steps instead of interleaved mid-sequence. Flagging that as the one
   place this isn't literally what the reference shows. */
function planCard(c, render) {
  const plan = c.plan;
  if (!plan) return h('div');

  const summaryText = () => planSummary(c);
  const summary = h('p', { contenteditable: 'true', spellcheck: 'false' }, summaryText());
  summary.addEventListener('blur', () => {
    const v = summary.textContent.trim();
    if (!v || v === summaryText()) return;
    S.updateCard(c.id, cc => ({ plan: { ...cc.plan, summary: v, assumeEdited: true } }));
    toast({ html: 'Assumptions — <b>yours now</b>' });
    render();
  });

  const list = h('div', { class: 'plan-list' },
    h('div', { class: 'plan-item' }, h('div', { class: 'plan-n' }, plan.assumeEdited ? 'YOURS' : 'ASSUMING'), summary),
    plan.tools?.length
      ? h('div', { class: 'plan-item' }, h('div', { class: 'plan-n' }, 'TOOLS'), h('div', {}, plan.tools.join(' · ')))
      : null,
    ...plan.steps.map((s, i) => h('div', { class: 'plan-item' },
      h('div', { class: 'plan-n' }, String(i + 1).padStart(2, '0')), h('div', {}, s))),
    ...(plan.risks || []).map(r => h('div', { class: 'plan-item warn' },
      h('div', { class: 'plan-n' }, '⚠'), h('div', {}, h('b', {}, r.k), ' — ', r.t))));

  if (plan.refs?.length) {
    const refs = h('div', { class: 'plan-refs' }, h('div', { class: 'plan-refs-t' }, 'From your archive'));
    plan.refs.forEach(r => {
      const rc = S.byId(r.cardId);
      if (!rc) return;
      refs.append(h('button', { class: 'plan-ref', onclick: () => openCard(rc.id) },
        h('b', {}, rc.title), ' — ', r.note));
    });
    list.append(refs);
  }

  let expanded = c.state !== 'finished';
  list.classList.toggle('collapsed', !expanded);
  const toggle = h('button', { class: 'plan-toggle' }, expanded ? 'HIDE' : 'SHOW');
  toggle.onclick = () => {
    expanded = !expanded;
    toggle.textContent = expanded ? 'HIDE' : 'SHOW';
    list.classList.toggle('collapsed', !expanded);
  };

  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Plan'), toggle),
    h('div', { class: 'meta', style: { margin: '2px 0 10px' } }, 'Estimated from your archive'),
    list);
}

/* ---------- ATTACHMENTS ---------- */
function addPhotoFlow(c, render) {
  const input = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  input.addEventListener('change', () => {
    const f = input.files[0]; if (!f) return;
    addProcessPhoto(c.id, URL.createObjectURL(f), render);
  });
  sheet({ build: (b, done) => {
    b.append(h('div', { class: 'label' }, 'ADD A PHOTO'),
      h('div', { class: 'h-big', style: { margin: '10px 0 20px' } }, 'FROM WHERE?'),
      h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
        onclick: () => { done(); input.click(); } }, 'UPLOAD FROM THIS DEVICE'),
      h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
        onclick: () => { done(); pickFromLibrary(c.id, render); } }, 'SIMULATED PHOTO LIBRARY'));
  } });
}

/* Compact row on the card page -- add button first, then plain thumbnails,
   per Figma. Per-photo kind/caption/delete moved to the "see all" page
   (no dedicated attachments page existed before; built per your
   confirmation). */
function attachmentsRow(c, render) {
  const list = (c.photos || []);
  const thumbs = list.slice(0, 4).map(p =>
    h('button', { class: 'att', onclick: () => openAttachments(c.id, render) }, img(p.src, p.cap || '')));
  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' },
      h('div', { class: 'h-mid' }, 'Attachments'),
      h('button', { class: 'arr', onclick: () => openAttachments(c.id, render), html: ICON.arrowFwd, 'aria-label': 'See all' })),
    h('div', { class: 'att-row' },
      h('button', { class: 'att add', onclick: () => addPhotoFlow(c, render), html: ICON.plus }),
      ...thumbs));
}

function openAttachments(cardId, parentRender) {
  page((p, close) => {
    const render = () => {
      const c = S.byId(cardId);
      p.replaceChildren();
      if (!c) return;
      const grid = h('div', { class: 'att-grid' });
      (c.photos || []).forEach(ph => {
        grid.append(h('div', { class: 'att-cell' },
          img(ph.src, ph.cap || ''),
          h('div', { class: 'k' }, ph.kind),
          h('button', { class: 'x', html: '×', onclick: () => {
            const snap = S.removePhoto(c.id, ph.id);
            toast({ text: 'Photo removed', undo: () => { S.restore(snap); render(); parentRender(); } });
            render(); parentRender();
          } }),
          ph.cap ? h('div', { class: 'cp' }, ph.cap) : null));
      });
      grid.append(h('button', { class: 'att-cell add', onclick: () => addPhotoFlow(c, () => { render(); parentRender(); }), html: ICON.plus }));
      p.append(
        h('div', { class: 'page-top' },
          h('button', { class: 'iconbtn', onclick: close, html: ICON.back }),
          h('div', { class: 'label', style: { flex: '1' } }, 'Attachments')),
        h('div', { class: 'scroll' }, grid));
    };
    render();
  });
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
/* ---------- CHATS ----------
   Figma's example card has no existing notes/threads either way, so the
   reference only shows the suggested-prompt card. Per your confirmation,
   history keeps rendering exactly as before, with the suggestion card
   added above it as an entry point -- nothing is lost. The suggested
   text itself is generic ("Ask UNFIRED about this piece"), not a
   per-card AI-generated question like Figma's "Visualize this idea with
   different painted patterns" -- there's no generator in this app that
   produces a tailored suggestion from a card's content, and inventing
   one felt like fabricating intelligence the prototype doesn't have. */
function chatsSection(c, render) {
  const wrap = h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Chats'),
      h('div', { class: 'meta' }, ((c.notes || []).length + (c.threads || []).length) || 'none')));

  wrap.append(h('div', { class: 'suggest-card' },
    h('div', {}, 'Ask UNFIRED about this piece'),
    h('button', { class: 'suggest-btn', onclick: () => openChat(c.id, null, render) }, 'START CHAT')));

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

  if (bubbles.children.length) wrap.append(bubbles);
  return wrap;
}

/* ---------- COMPOSE BAR ----------
   New: nothing like this exists in the app today. Per your confirmation,
   sending text here opens a new AI chat with that text -- the same
   openChat(...) flow already used by "ASK ABOUT THIS" and the suggested-
   prompt card, just from an always-visible bar. The mic button has no
   real speech-to-text behind it (this is a prototype); left visually
   present but inert rather than faked, same treatment given to other
   buttons with unclear/unbuildable behavior earlier in this project. */
function composeBar(c, render) {
  const input = h('input', { placeholder: `Ask about ${titleCase(c.title)}…` });
  const send = () => {
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    openChat(c.id, null, render, v);
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  return h('div', { class: 'composebar' },
    h('button', { class: 'cb-ic', html: ICON.plus, onclick: () => addPhotoFlow(c, render), 'aria-label': 'Add photo' }),
    input,
    h('button', { class: 'cb-ic', html: ICON.mic, 'aria-label': 'Voice (not implemented in this prototype)' }));
}

const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

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
