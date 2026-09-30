/* CARD DETAIL — hero, description, how to make it, photos, notes & chats. */
import { h, frag, ICON, page, sheet, toast, fmtShort, ago, img, sleep, pageHead, navBtn } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { mediaPicker, popMenu, BACK16_SVG, DOTS16_SVG } from './media.js';
import { postsForCard, openPostEdit } from './post.js';
import { SAMPLES, CLOSE_SVG, MIC_SVG, STOP_SVG, PLAY_SVG } from './capture.js';

export function openCard(id) {
  page((p, close) => {
    const leave = () => { commitLog(id); close(); };
    const render = () => {
      const c = S.byId(id);
      p.replaceChildren();
      /* Card-gone is the one place this page still needs a plain .page-top --
         there's no hero to carry the back button once the card itself is
         missing. */
      if (!c) {
        p.append(
          h('div', { class: 'page-top' }, h('button', { class: 'iconbtn', onclick: leave, html: ICON.back })),
          h('div', { class: 'empty keep-type' }, h('div', { class: 'h-big' }, 'CARD GONE')));
        return;
      }
      /* Back + New Chat buttons move onto the hero itself (full-bleed, runs
         behind the status bar) -- no separate .page-top for this screen. */
      p.append(body(c, render, leave));
    };
    render();
  }, { onClose: () => commitLog(id) });
}

/* ---------- HEADER (Figma 562:8624 / 8456 / 8537 / 8965 / 9096 / 9606) ----------
   Rounded-bottom header with the status bar, back + "···", the status line
   and the title, then the piece:
   - a cutout (assets/pieces...) sits on the card's gradient (paper at the
     bottom, the card's glow at the top); finished cards sit on black
   - an idea's own photo fills the whole header, dimmed toward the bottom
   - no picture, or a making card in studio mode: the short header */
const WIFI_SVG = '<svg viewBox="0 0 16 12" fill="none">' +
  '<path d="M1 4.5C4.8 0.8 11.2 0.8 15 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<path d="M3.3 7C5.9 4.5 10.1 4.5 12.7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<path d="M5.8 9.3C6.9 8.2 9.1 8.2 10.2 9.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<circle cx="8" cy="11.3" r="0.9" fill="currentColor"/></svg>';
const CHEVRON16_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3.33333L10.6667 8L6 12.6667" stroke="currentColor" stroke-width="1.13333" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function heroStatusBar() {
  return h('div', { class: 'ch-statusbar' },
    h('span', {}, '9:41'),
    h('div', { class: 'icons' },
      h('div', { class: 'bars' }, h('i'), h('i'), h('i'), h('i')),
      h('span', { class: 'wifi', html: WIFI_SVG }),
      h('div', { class: 'batt' }, h('i'))));
}

function heroStatus(c) {
  if (c.state === 'making')
    return h('div', { class: 'cx-status making' }, h('i', { class: 'dot' }), h('span', {}, 'Making'));
  const label = c.state === 'idea' ? 'Idea, ' + ago(c.created) : 'Finished, ' + ago(c.finishedAt || c.updated);
  return h('div', { class: 'cx-status' }, h('span', { class: 'ic', html: ICON.ideaStar }), h('span', {}, label));
}

/* a background-removed cutout, not a photo (S.isPiece) */
const isCutout = S.isPiece;

function cardHeader(c, render, closePage) {
  const hero = S.hiRes(S.cutoutSrc(c));
  const photo = c.state === 'idea' && !!hero && !isCutout(hero);
  const compact = !hero || (c.state === 'making' && c.live) || (!photo && !isCutout(hero));
  const kind = c.state === 'finished' ? 'dark' : photo ? 'photo' : 'tint';

  /* Title Case for display; c.title itself stays stored ALL CAPS */
  const title = h('div', { class: 'cx-t', contenteditable: 'true', spellcheck: 'false' }, titleCase(c.title));
  title.addEventListener('blur', () => {
    const v = title.textContent.trim().toUpperCase();
    if (v && v !== c.title) { S.updateCard(c.id, { title: v }); toast({ text: 'Title updated' }); nav.refresh(); }
  });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } });

  const inner = h('div', { class: 'cx-in ' + kind + (compact ? ' compact' : '') },
    photo ? h('div', { class: 'cx-photo' }, img(hero, c.title)) : null,
    photo ? h('div', { class: 'cx-dim' }) : null,
    heroStatusBar(),
    h('div', { class: 'cx-top' },
      h('button', { class: 'cx-btn', onclick: closePage, html: BACK16_SVG, 'aria-label': 'Back' }),
      h('div', { class: 'cx-title' }, heroStatus(c), title),
      h('button', { class: 'cx-btn', onclick: (e) => cardMenu(c, render, closePage, e.currentTarget), html: DOTS16_SVG, 'aria-label': 'Card options' })),
    compact ? null : h('div', { class: 'cx-hero' }, photo ? null : img(hero, c.title)));
  if (kind === 'tint') {
    const stop = c.state === 'making' ? '6.25%' : '11.058%';
    inner.style.background = `linear-gradient(0deg, #f6f4ec ${stop}, ${S.pieceColor(c)} 100%)`;
  }
  return h('div', { class: 'cx' }, inner);
}

/* ---------- BODY, per state ----------
   idea      562:8456  LOG · CHATS                        START MAKING · + · mic · chat
   making    562:8965  STUDIO MODE · PLAN · LOG · CHATS   FINISH ITEM · + · mic · chat
   finished  562:9606  READY TO POST · PLAN · LOG · CHATS POST · REMAKE · + · mic */
function body(c, render, closePage) {
  const scroll = h('div', { class: 'scroll under-bar' });
  const log = logSection(c, render);
  scroll.append(cardHeader(c, render, closePage));
  if (c.state === 'making') scroll.append(studioRow(c, render));
  if (c.state === 'finished') scroll.append(readyToPostRow(c));
  if (c.state !== 'idea') scroll.append(planSection(c, render));
  scroll.append(log.el, chatsSection(c, render));
  return frag(scroll, bottomBar(c, render, log));
}

/* SHOW/HIDE per section, remembered while the app is open. Defaults: an
   idea shows everything; making shows the plan only; finished hides all. */
const shown = new Map();
const isShown = (c, sec) => shown.has(c.id + sec) ? shown.get(c.id + sec)
  : c.state === 'idea' || (c.state === 'making' && sec === 'plan');

function section(c, sec, title, content, extraClass = '') {
  const btn = h('button', { class: 'sx-tog' });
  const el = h('div', { class: 'sx ' + extraClass },
    h('div', { class: 'sx-h' }, h('div', { class: 'sx-t' }, title), btn), content);
  const paint = (on) => { content.hidden = !on; btn.textContent = on ? 'Hide' : 'Show'; el.classList.toggle('open', on); };
  btn.onclick = () => { const on = content.hidden; shown.set(c.id + sec, on); paint(on); };
  paint(isShown(c, sec));
  el.open = () => { shown.set(c.id + sec, true); paint(true); };
  return el;
}

/* ---------- STUDIO MODE (making, Figma 562:8986 / 562:9113) ----------
   The toggle turns the lock-screen live activity on (and shows it) or off. */
function studioRow(c, render) {
  const on = !!c.live;
  const tog = h('button', { class: 'sw' + (on ? ' on' : ''), 'aria-label': 'Studio mode', onclick: () => toggleLive(S.byId(c.id), render) },
    h('span', { class: 'sw-k' }), h('span', { class: 'sw-t' }, on ? 'On' : 'Off'));
  return h('div', { class: 'cx-row' }, h('div', { class: 'cx-box' },
    h('div', { class: 'cx-box-tx' }, h('div', { class: 'cx-box-t' }, 'Studio mode'),
      h('div', { class: 'cx-box-s' }, 'Plan and logging on locked screen')),
    tog));
}

/* ---------- READY TO POST (finished, Figma 562:9627) ---------- */
function readyToPostRow(c) {
  const n = postsForCard(c.id).length;
  return h('div', { class: 'cx-row' }, h('button', { class: 'cx-box', onclick: () => openPostEdit(c.id) },
    h('div', { class: 'cx-box-tx' }, h('div', { class: 'cx-box-t' }, 'Ready to post'),
      h('div', { class: 'cx-box-s' }, n ? `${n} Instagram post${n > 1 ? 's' : ''} ready for sharing` : 'Add photos to make a post')),
    h('span', { class: 'cx-go', html: CHEVRON16_SVG })));
}

/* ---------- LOG (Figma 562:8624 empty / 562:8456 typed / 562:8537 photo) ----------
   The space under LOG is the Log screen's typing area, sized to its
   content: LOG A NOTE until you type, the caret in orange, photos added
   with "+" as 100px tiles under the text (x removes one), the mic types the
   transcript in. Photos join the card as they're added; the text becomes a
   note on the card when you leave the page. */
const drafts = new Map();   // card id -> { text, photos: [photo ids] }
const draftOf = (id) => drafts.get(id) || (drafts.set(id, { text: '', photos: [] }), drafts.get(id));

function commitLog(id) {
  const d = drafts.get(id);
  drafts.delete(id);
  if (d && d.text.trim() && S.byId(id)) { S.addNote(id, { text: d.text.trim(), src: 'type' }); nav.refresh(); }
}

function logSection(c, render) {
  const d = draftOf(c.id);
  const ph = h('div', { class: 'lg-ph' }, 'Log', h('br'), 'a note');
  const text = h('div', { class: 'lg-text', contenteditable: 'true', spellcheck: 'false' }, d.text);
  const att = h('div', { class: 'lg-att' });
  const box = h('div', { class: 'lg' }, ph, text, att);

  const sync = () => {
    d.text = text.textContent;
    ph.hidden = !!d.text.trim() || !!d.photos.length || document.activeElement === text;
  };
  text.addEventListener('input', sync);
  text.addEventListener('focus', sync);
  text.addEventListener('blur', sync);
  box.addEventListener('click', (e) => { if (!e.target.closest('.lg-att') && document.activeElement !== text) text.focus(); });

  const paintAtt = () => {
    const cc = S.byId(c.id);
    d.photos = d.photos.filter(pid => (cc.photos || []).some(x => x.id === pid));
    att.replaceChildren(...d.photos.map(pid => {
      const ph0 = cc.photos.find(x => x.id === pid);
      return h('div', { class: 'att' }, h('div', { class: 'ph' }, img(ph0.src, '')),
        ph0.video ? h('span', { class: 'vid', html: PLAY_SVG }) : null,
        h('button', { class: 'x', html: CLOSE_SVG, 'aria-label': 'Remove', onclick: () => {
          S.removePhoto(c.id, pid);
          d.photos = d.photos.filter(x => x !== pid);
          render(); nav.refresh();
        } }));
    }));
    att.hidden = !d.photos.length;
    sync();
  };
  paintAtt();

  const el = section(c, 'log', 'Log', box, 'log');
  return {
    el,
    /* "+" in the bottom bar */
    add(src, guess, { video } = {}) {
      const kind = guess || (c.state === 'finished' ? 'final' : c.state === 'making' ? 'process' : 'inspiration');
      const before = new Set((S.byId(c.id).photos || []).map(x => x.id));
      S.addPhoto(c.id, { src, kind, video: video || undefined, cap: 'Added in the log' });
      const added = S.byId(c.id).photos.find(x => !before.has(x.id));
      if (added) d.photos.push(added.id);
      shown.set(c.id + 'log', true);
      /* what the photo shows moves the card on: glazed -> finished,
         unfired -> making (S.stateFromPhoto) */
      const next = S.stateFromPhoto(S.byId(c.id), src);
      if (next) {
        S.setState(c.id, next);
        if (next === 'finished') S.updateCard(c.id, { readyToShare: true, live: false });
        toast({ html: next === 'finished' ? 'Looks finished. <b>FINISHED</b>' : 'Looks like you started making this. <b>MAKING</b>' });
      }
      render(); nav.refresh();
    },
    /* mic in the bottom bar: the transcript types into the log */
    listen(micBtn) {
      el.open();
      const base = d.text.trim();
      const words = SAMPLES[Math.floor(Math.random() * SAMPLES.length)].split(' ');
      let i = 0;
      micBtn.classList.add('rec'); micBtn.innerHTML = STOP_SVG;
      const stop = () => {
        clearInterval(t); micBtn.classList.remove('rec'); micBtn.innerHTML = MIC_SVG;
        micBtn.onclick = () => this.listen(micBtn);
      };
      const t = setInterval(() => {
        if (i >= words.length) return stop();
        text.textContent = (base ? base + ' ' : '') + words.slice(0, ++i).join(' ');
        sync();
      }, 105);
      micBtn.onclick = stop;
      sync();
    },
  };
}

/* ---------- PLAN (making / finished, Figma 562:9013) ----------
   One editable text on the card's gradient, with REGENERATE. c.plan.text
   holds it verbatim when a card has it; otherwise it's composed from the
   plan's steps / tools / risks / archive refs. */
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

/* A contenteditable div that has been fully cleared still holds a stray
   <br>, so :empty never matches and the placeholder stays hidden. */
function clearIfEmpty(el) {
  if (!el.textContent.trim()) el.replaceChildren();
}

/* Not enough to go on: no tools or fewer than two steps. Instead of
   guessing, the plan points to a chat with UNFIRED (and Chats carries a
   suggested bubble with the questions it needs answered). */
const planIsThin = (plan) => !plan || !(plan.tools || []).length || (plan.steps || []).length < 2;
const THIN_PLAN_TEXT = 'Not enough to build a plan yet. Chat with UNFIRED about next steps.';

export function planFallbackText(c) {
  const plan = c.plan;
  if (planIsThin(plan)) return THIN_PLAN_TEXT;
  const lines = [planSummary(c)];
  if (plan.tools?.length) lines.push('', 'TOOLS', plan.tools.join(' · '));
  plan.steps.forEach((s, i) => lines.push('', String(i + 1).padStart(2, '0') + ' · ' + s));
  (plan.risks || []).forEach(r => lines.push('', '⚠ ' + r.k.toUpperCase(), r.t));
  if (plan.refs?.length) {
    lines.push('', 'FROM YOUR ARCHIVE');
    plan.refs.forEach(r => {
      const rc = S.byId(r.cardId);
      if (rc) lines.push(rc.title + ' — ' + r.note);
    });
  }
  return lines.join('\n');
}

function planSection(c, render) {
  const plan = c.plan || {};
  const currentText = () => plan.text || planFallbackText(c);
  const text = h('div', { class: 'pl-text', contenteditable: 'true', spellcheck: 'false',
    'data-ph': 'Type in or regenerate plan…' }, currentText());
  text.addEventListener('blur', () => {
    const v = text.textContent.trim();
    clearIfEmpty(text);
    if (v !== currentText()) { S.updateCard(c.id, cc => ({ plan: { ...cc.plan, text: v } })); toast({ text: 'Saved' }); }
  });
  /* fresh AI plan from the card's title + tags; drops any hand-edited text */
  const regen = h('button', { class: 'pl-regen', onclick: () => {
    const fresh = AI.generatePlan([c.title, ...(c.tags || [])].join(' '));
    S.updateCard(c.id, cc => {
      const { text: _t, summary: _s, assumeEdited: _a, ...keep } = cc.plan || {};
      return { plan: { ...keep, ...fresh } };
    });
    toast({ text: 'Plan regenerated' });
    render();
  } }, 'Regenerate');
  const box = h('div', { class: 'pl-box', style: {
    background: `linear-gradient(0deg, #f6f4ec 6.25%, ${S.pieceColor(c)} 100%)` } }, text, regen);
  return section(c, 'plan', 'Plan', box);
}

/* ---------- CHATS (Figma nodes 487:3571 / 487:3575) ----------
   A flat list of paper bubbles. Each bubble is one 16px summary line
   plus a "TYPE, DATE" meta line ("VOICE, 22 JUL" / "TEXT, 22 JUL" /
   "SUGGESTION, NOW"); the whole bubble is the tap target. The suggestion
   is just the first bubble -- generic text ("Ask UNFIRED about this
   piece") rather than Figma's per-card "Visualize this idea with
   different painted patterns", since there's no prompt generator here. */
const bubType = (src) => ({ voice: 'Voice', type: 'Text', watch: 'Apple Watch', liveactivity: 'Live Activity', import: 'Imported' }[src] || 'Note');
const bubWhen = (at) => (Date.now() - at < 12 * 36e5 ? 'now' : fmtShort(at));

function chatsSection(c, render) {
  const bubbles = h('div', { class: 'bubbles' });
  const bub = (summary, meta, onclick) => h('button', { class: 'bub', onclick },
    h('div', { class: 'sum' }, summary),
    h('div', { class: 'w' }, meta));

  bubbles.append(bub('Visualize this idea with different painted patterns', 'Suggestion, now',
    () => openChat(c.id, null, render)));

  /* Ideas get a second suggestion: with a thin plan, the questions UNFIRED
     needs answered to build one (until that chat exists); otherwise a
     question drawn from the plan's own first risk. */
  if (c.state === 'idea') {
    if (planIsThin(c.plan)) {
      if (!(c.threads || []).some(t => t.planQuestions))
        bubbles.append(bub('Answer a few questions to build your plan', 'Suggestion, now', () => {
          const tid = S.addThread(c.id, { title: 'BUILD THE PLAN', planQuestions: true,
            msgs: [{ role: 'ai', text: PLAN_QUESTIONS }] });
          openChat(c.id, tid, render);
          render();
        }));
    } else {
      const risk = (c.plan.risks || [])[0];
      const q = risk ? `How do I avoid ${risk.k.toLowerCase()}?` : 'Which step is the riskiest here?';
      bubbles.append(bub(q, 'Suggestion, now', () => openChat(c.id, null, render, null, { ask: q })));
    }
  }

  [
    ...(c.notes || []).map(n => ({
      at: n.at, summary: n.text,
      meta: bubType(n.src) + ', ' + bubWhen(n.at),
      open: () => openNote(c.id, n, render),
    })),
    ...(c.threads || []).map(t => ({
      at: t.at, summary: t.title,
      meta: (t.msgs[0]?.role === 'ai' ? 'Suggestion' : 'Chat') + ', ' + bubWhen(t.at),
      open: () => openChat(c.id, t.id, render),
    })),
  ].sort((a, b) => b.at - a.at).forEach(it => bubbles.append(bub(it.summary, it.meta, it.open)));

  return section(c, 'chats', 'Chats', bubbles);
}

/* ---------- CARD OPTIONS ("···" in the hero) ----------
   The Log screen's dropdown, opened below the button, with the actions
   for the card's status (Delete asks first). */
function cardMenu(c, render, closePage, anchor) {
  /* status changes work like FINISH ITEM: the log is saved first */
  const mark = (next) => () => {
    commitLog(c.id);
    const snap = S.setState(c.id, next);
    if (next === 'finished') S.updateCard(c.id, { readyToShare: true, live: false });
    toast({ html: `<b>${next}</b> · set by you`, undo: () => { S.restore(snap); render(); nav.refresh(); } });
    render(); nav.refresh();
  };
  const remake = () => { const id = S.remakeCard(c.id); nav.refresh(); if (id) openCard(id); };
  /* a link to the piece, on the clipboard */
  const copyLink = () => navigator.clipboard?.writeText(`https://unfired.app/p/${c.id}`).catch(() => {});
  const link = ['Copy link', copyLink, 'Copied'];
  const del = () => confirmDelete(c, closePage);
  const items = {
    idea: [['Mark finished', mark('finished')], link, ['Delete', del]],
    making: [['Mark finished', mark('finished')], ['Remake as idea', remake], link, ['Delete', del]],
    finished: [['Mark making', mark('making')], link, ['Delete', del]],
  }[c.state];
  popMenu({ anchor, below: true, items });
}

function confirmDelete(c, closePage) {
  sheet({ build: (b, done) => {
    b.append(h('div', { class: 'label' }, 'DELETE CARD'),
      h('div', { class: 'h-big', style: { margin: '10px 0 12px' } }, 'Delete ' + titleCase(c.title) + '?'),
      h('div', { class: 'meta', style: { marginBottom: '20px' } }, 'Its notes, chats, photos and posts go with it.'),
      h('button', { class: 'bigact', style: { margin: '0 0 10px', width: '100%' }, onclick: () => {
        done();
        S.deleteCard(c.id);
        nav.refresh();
        closePage();
      } }, 'DELETE'),
      h('button', { class: 'bigact ghost', style: { margin: '0', width: '100%' }, onclick: done }, 'CANCEL'));
  } });
}

const PLAN_QUESTIONS = 'To build your plan I need a few answers:\n' +
  '1. What clay are you using, and what cone do you fire to?\n' +
  '2. How big should it be?\n' +
  '3. How are you making it — thrown, hand built, modelled?\n' +
  '4. What surface or glaze are you imagining?\n' +
  '5. Is there a deadline, or a number of pieces you need?';

/* ---------- BOTTOM BAR (per state, Figma 562:8521 / 562:9080 / 562:9720) ----------
   the state's main action · + (photo/video into the log) · mic (voice into
   the log) · new chat -- finished swaps the chat button for REMAKE. */
export const PLUS24_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M11.9999 2.70034C12.2385 2.70034 12.4675 2.79516 12.6362 2.96395C12.805 3.13273 12.8999 3.36165 12.8999 3.60034V11.1003H20.3999C20.6385 11.1003 20.8675 11.1952 21.0363 11.3639C21.205 11.5327 21.2999 11.7616 21.2999 12.0003C21.2999 12.239 21.205 12.468 21.0363 12.6367C20.8675 12.8055 20.6385 12.9003 20.3999 12.9003H12.8999L12.8999 20.4003C12.8999 20.639 12.805 20.868 12.6362 21.0367C12.4675 21.2055 12.2385 21.3003 11.9999 21.3003C11.7612 21.3003 11.5322 21.2055 11.3635 21.0367C11.1947 20.868 11.0999 20.639 11.0999 20.4003V12.9003H3.59985C3.36116 12.9003 3.13224 12.8055 2.96346 12.6367C2.79467 12.468 2.69985 12.239 2.69985 12.0003C2.69985 11.7616 2.79467 11.5327 2.96346 11.3639C3.13224 11.1952 3.36116 11.1003 3.59985 11.1003L11.0999 11.1003L11.0999 3.60034C11.0999 3.36165 11.1947 3.13273 11.3635 2.96394C11.5322 2.79516 11.7612 2.70034 11.9999 2.70034Z"/></svg>';

function bottomBar(c, render, log) {
  const round = (html, label, onclick) => h('button', { class: 'cb-round', html, onclick, 'aria-label': label });
  const btn = (cls, text, onclick) => h('button', { class: 'pe-btn ' + cls, onclick }, text);
  const plus = round(PLUS24_SVG, 'Add photo or video', () => mediaPicker({ anchor: plus, onPick: (...a) => log.add(...a) }));
  const mic = round(MIC_SVG, 'Voice', () => log.listen(mic));
  const media = h('div', { class: 'cb-media' }, plus, mic);
  const chat = round(ICON.dockWatch, 'New chat', () => openChat(c.id, null, render));
  const setState = (next, extra) => {
    commitLog(c.id);
    const snap = S.setState(c.id, next);
    if (extra) S.updateCard(c.id, extra);
    toast({ html: `<b>${next}</b> · set by you`, undo: () => { S.restore(snap); render(); nav.refresh(); } });
    if (next === 'making') startMaking(c.id);
    render(); nav.refresh();
  };

  const kids = c.state === 'idea'
    ? [btn('accent', 'Start making', () => setState('making')), media, chat]
    : c.state === 'making'
    ? [btn('accent', 'Finish item', () => setState('finished', { readyToShare: true, live: false })), media, chat]
    : [btn('accent', 'Post', () => openPostEdit(c.id)),
       btn('paper', 'Remake', () => {
         const id = S.remakeCard(c.id);
         nav.refresh();
         if (id) openCard(id);
       }), media];
  return h('div', { class: 'card-bar' }, ...kids);
}

/* "+" on the live activity (studio.js): the popover -> gallery / camera
   flow (media.js). anchor = the button that was tapped. */
export function mediaDrawer(onPick, anchor) {
  mediaPicker({ anchor, onPick });
}

/* STUDIO MODE switch: on = the lock-screen live activity, shown right away
   (on the surfaces saved earlier, else the lock screen); off = off. */
function toggleLive(c, render) {
  if (c.live) { S.updateCard(c.id, { live: false }); render(); nav.refresh(); return; }
  const saved = S.get().liveChoice;
  S.updateCard(c.id, { live: true, liveSurfaces: saved && saved.length ? saved : ['lock'] });
  render(); nav.refresh();
  nav.openLock(c.id, render);
}

const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

const srcLabel = (s) => ({ watch: 'APPLE WATCH', liveactivity: 'LIVE ACTIVITY', voice: 'VOICE', type: 'TYPED', import: 'IMPORTED' }[s] || 'VOICE');

function openNote(cardId, n, render) {
  sheet({ build: (b, done) => {
    b.append(
      h('div', { class: 'label' }, srcLabel(n.src) + ' · ' + fmtShort(n.at)),
      h('div', { class: 'desc', style: { marginTop: '14px' } }, n.text));
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
/* seed: a note to ask about ("About this note: …"); ask: a question sent
   as-is (the suggested-question bubbles).
   cardId null = the bottom bar's chat button: no card yet. The first
   message is routed like a Log note (AI.classify) -- it joins the card it's
   about, or starts a new idea card -- and the chat lives on there. */
export function openChat(cardId, threadId, onDone, seed, { ask } = {}) {
  let cid = cardId;
  let tid = threadId;
  if (cid && !tid) tid = S.addThread(cid, { title: 'NEW CHAT', msgs: [] });
  const thread = () => cid && ((S.byId(cid).threads || []).find(x => x.id === tid) || null);

  page((p, close) => {
    const list = h('div', { class: 'thread' });
    const cardLabel = h('span', {}, cid ? titleCase(S.byId(cid).title) : '');
    const headTitle = h('span', {}, thread()?.title || 'NEW CHAT');
    const ti = h('div', { class: 'ti', contenteditable: 'true',
      'data-ph': cid ? 'Ask about this piece…' : 'Ask UNFIRED anything…' });
    let busy = false;

    const paint = () => {
      const t = thread();
      list.replaceChildren();
      if (!t || !t.msgs.length)
        list.append(h('div', { class: 'meta', style: { padding: '30px 0', textAlign: 'center' } },
          cid ? 'UNFIRED already knows this card and everything else you have made.'
              : 'Say what’s on your mind. UNFIRED files this chat under the piece it’s about, or starts a new idea.'));
      (t ? t.msgs : []).forEach(m => {
        if (m.role === 'sys') { list.append(h('div', { class: 'meta chat-sys' }, m.text)); return; }
        const el = h('div', { class: 'msg ' + (m.role === 'me' ? 'me' : 'ai') });
        el.append(document.createTextNode(m.text));
        if (m.role === 'ai' && m.src)
          el.append(h('div', { class: 'src ' + (m.src === 'archive' ? 'archive' : '') },
            m.src === 'archive' ? 'YOUR ARCHIVE' : 'CERAMIC REFERENCE'));
        list.append(el);
      });
      list.scrollTop = list.scrollHeight;
    };

    /* first message of a card-less chat: decide where it belongs */
    const route = (v) => {
      const res = AI.classify(v, []);
      if (res.kind === 'attach') cid = res.card.id;
      else { S.addCard(res.card); cid = res.card.id; }
      tid = S.addThread(cid, { title: 'NEW CHAT', msgs: [] });
      const name = titleCase(S.byId(cid).title);
      S.addMessage(cid, tid, { role: 'sys',
        text: res.kind === 'attach' ? `Added to ${name}` : `Started a new idea: ${name}` });
      cardLabel.textContent = titleCase(S.byId(cid).title);
      ti.dataset.ph = 'Ask about this piece…';
      nav.refresh();
    };

    const send = async (text) => {
      const v = (text ?? ti.textContent).trim();
      if (!v || busy) return;
      busy = true;
      ti.textContent = '';
      if (!cid) route(v);
      S.addMessage(cid, tid, { role: 'me', text: v });
      if (thread().title === 'NEW CHAT') S.updateCard(cid, cc => {
        const tt = cc.threads.find(x => x.id === tid);
        tt.title = v.replace(/[?.]$/, '').split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        return {};
      });
      headTitle.textContent = thread()?.title || 'NEW CHAT';
      paint();
      const typing = h('div', { class: 'msg ai' }, h('div', { class: 'typing' }, h('i'), h('i'), h('i')));
      list.append(typing); list.scrollTop = list.scrollHeight;
      await sleep(700 + Math.random() * 500);
      typing.remove();
      const r = AI.reply(S.byId(cid), v);
      S.addMessage(cid, tid, r);
      paint();
      busy = false;
      onDone && onDone();
    };

    ti.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    p.append(
      /* header like Ready to post: thread title, card name under it (both
         fill in once a card-less chat has been routed) */
      pageHead({ left: navBtn(ICON.back, () => { if (cid) cleanEmpty(cid, tid); onDone && onDone(); close(); }, 'Back'),
        title: headTitle, sub: cardLabel }),
      list,
      h('div', { class: 'composer' }, ti,
        h('button', { class: 'sendb', html: ICON.send, onclick: () => send() }))
    );
    paint();
    if (seed) setTimeout(() => send(`About this note: ${seed}`), 250);
    else if (ask) setTimeout(() => send(ask), 250);
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
