/* CARD DETAIL — hero, description, how to make it, photos, notes & chats. */
import { h, frag, ICON, page, sheet, toast, fmtShort, ago, img, sleep, pageHead, navBtn, statusBar, pblur } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { mediaPicker, popMenu, BACK16_SVG, DOTS16_SVG } from './media.js';
import { postsForCard, openPostEdit } from './post.js';
import { SAMPLES, CLOSE_SVG, MIC_SVG, STOP_SVG, PLAY_SVG } from './capture.js';
import { chatView } from '../chatui.js';
import { render as patternsWidget } from '../widgets/patterns.js';
import { PATTERNS } from '../seed.js';
import { itemTile } from './items.js';

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
const CHEVRON16_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M6 3.33333L10.6667 8L6 12.6667" stroke="currentColor" stroke-width="1.13333" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* no drawn status bar (see statusBar() in ui.js): just the safe area */
export const heroStatusBar = statusBar;

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
  /* the piece stays in the header with STUDIO MODE on too */
  const compact = !hero || (!photo && !isCutout(hero));
  const kind = c.state === 'finished' ? 'dark' : photo ? 'photo' : 'tint';

  /* Title Case for display; c.title itself stays stored ALL CAPS */
  const title = h('div', { class: 'cx-t', contenteditable: 'true', spellcheck: 'false' }, titleCase(c.title));
  title.addEventListener('blur', () => {
    const v = title.textContent.trim().toUpperCase();
    if (v && v !== c.title) { S.updateCard(c.id, { title: v }); toast({ text: 'Title updated' }); nav.refresh(); }
  });
  title.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); title.blur(); } });

  const inner = h('div', { class: 'cx-in ' + kind + (compact ? ' compact' : '') },
    photo ? h('div', { class: 'cx-photo' }, Object.assign(img(hero, c.title), { loading: 'eager' })) : null,
    photo ? h('div', { class: 'cx-dim' }) : null,
    heroStatusBar(),
    h('div', { class: 'cx-top' },
      h('button', { class: 'cx-btn', onclick: closePage, html: BACK16_SVG, 'aria-label': 'Back' }),
      h('div', { class: 'cx-title' }, heroStatus(c), title),
      h('button', { class: 'cx-btn', onclick: (e) => cardMenu(c, render, closePage, e.currentTarget), html: DOTS16_SVG, 'aria-label': 'Card options' })),
    /* eager: the page slides in from off-screen, and a lazy image there
       isn't fetched until something re-renders it */
    compact ? null : h('div', { class: 'cx-hero' }, photo ? null : Object.assign(img(hero, c.title), { loading: 'eager' })));
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
   content: LOG A NOTE until you type, the caret in orange, the mic types
   the transcript in. The text is the card's description (what the feed
   card shows) and is saved back to it when you leave the page. Under it,
   everything else that was logged: each note (voice, Apple Watch, live
   activity) its own paragraph, then the card's photos and videos as 100px
   tiles ("+" adds one, x removes one). */
const drafts = new Map();   // card id -> { text }
const draftOf = (id) => drafts.get(id) || (drafts.set(id, { text: S.byId(id)?.desc || '' }), drafts.get(id));

function commitLog(id) {
  const d = drafts.get(id);
  drafts.delete(id);
  const c = S.byId(id);
  if (d && c && d.text.trim() !== (c.desc || '').trim()) { S.updateCard(id, { desc: d.text.trim() }); nav.refresh(); }
}

function logSection(c, render) {
  const d = draftOf(c.id);
  const ph = h('div', { class: 'lg-ph' }, 'Log', h('br'), 'a note');
  const text = h('div', { class: 'lg-text', contenteditable: 'true', spellcheck: 'false' }, d.text);
  /* what was logged by voice, Apple Watch, the live activity or typed:
     each note its own paragraph under the description, oldest first */
  const notes = h('div', { class: 'lg-notes' }, ...[...(c.notes || [])].sort((a, b) => (a.at || 0) - (b.at || 0)).map(n => h('p', { class: 'lg-note' }, n.text)));
  const att = h('div', { class: 'lg-att' });
  const box = h('div', { class: 'lg' }, ph, text, notes, att);

  const sync = () => {
    d.text = text.textContent;
    ph.hidden = !!d.text.trim() || !!(c.notes || []).length || !!logged().length || document.activeElement === text;
  };
  text.addEventListener('input', sync);
  text.addEventListener('focus', sync);
  text.addEventListener('blur', sync);
  box.addEventListener('click', (e) => { if (!e.target.closest('.lg-att') && document.activeElement !== text) text.focus(); });

  /* every photo and video on the card, x removes one. Not the piece images
     UNFIRED makes from a photo (pieceOf), and never the old generated
     demo images: the rough cut-outs in assets/pieces show as their clean
     export (S.hiRes), the fake greenware / phone-snap variants
     (assets/process, assets/snap) don't show at all. */
  const OLD_VARIANT = /^assets\/(process|snap)\//;
  const logged = () => (S.byId(c.id).photos || []).filter(p => !p.pieceOf && !OLD_VARIANT.test(p.src));
  const paintAtt = () => {
    att.replaceChildren(...logged().map(ph0 =>
      h('div', { class: 'att' }, h('div', { class: 'ph' }, img(S.hiRes(ph0.src), '')),
        ph0.video ? h('span', { class: 'vid', html: PLAY_SVG }) : null,
        h('button', { class: 'x', html: CLOSE_SVG, 'aria-label': 'Remove', onclick: () => {
          S.removePhoto(c.id, ph0.id);
          render(); nav.refresh();
        } }))));
    att.hidden = !logged().length;
    sync();
  };
  paintAtt();

  const el = section(c, 'log', 'Log', box, 'log');
  return {
    el,
    /* "+" in the bottom bar */
    add(src, guess, { video } = {}) {
      const kind = guess || (c.state === 'finished' ? 'final' : c.state === 'making' ? 'process' : 'inspiration');
      S.addPhoto(c.id, { src, kind, video: video || undefined, cap: 'Added in the log' });
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

/* Making: the plan is read-only and its numbered steps ("01 · …") are a
   checklist -- the onboarding checkbox, orange when ticked, the step greyed
   and struck through (Tailwind's to-do example). Ticks are kept on the
   card by step text, so steps added later (a pattern from chat) work too.
   Finished: the same list, locked (disabled), showing what was ticked --
   or every step, for a piece finished before it had ticks.
   brief (the live activity, studio.js): without the risks and FROM YOUR
   ARCHIVE blocks. */
export function planChecklist(c, text = c.plan?.text || planFallbackText(c), { disabled = false, brief = false } = {}) {
  const allDone = c.state === 'finished' && !c.plan?.checked;
  const done = new Set(c.plan?.checked || []);
  const el = h('div', { class: 'pl-text pl-list' });
  let k = 0;
  let lines = text.split('\n');
  if (brief) {
    let skip = false;
    lines = lines.filter(l => {
      if (/^⚠ /.test(l) || l === 'FROM YOUR ARCHIVE') skip = true;
      else if (skip && !l.trim()) { skip = false; return false; }
      return !skip;
    });
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  }
  const isStep = (l) => /^\d{2} · /.test(l || '');
  lines.forEach((line, i) => {
    const m = line.match(/^(\d{2}) · (.*)$/);
    /* the blank lines between steps: the rows space themselves */
    if (!line.trim() && isStep(lines[i - 1]) && isStep(lines[i + 1])) return;
    if (!m) { el.append(h('div', { class: 'pl-line' }, line || '\u00a0')); return; }
    const key = line;
    const box = h('input', { type: 'checkbox', id: `pl-${c.id}-${k++}-${Math.random().toString(36).slice(2, 6)}`,
      checked: allDone || done.has(key) || null, disabled: disabled || null });
    box.addEventListener('change', () => S.updateCard(c.id, cc => {
      const set = new Set(cc.plan?.checked || []);
      box.checked ? set.add(key) : set.delete(key);
      return { plan: { ...cc.plan, checked: [...set] } };
    }));
    el.append(h('label', { class: 'pl-step', for: box.id }, box,
      h('span', { class: 'bx', html: ICON.check, 'aria-hidden': 'true' }),
      h('span', { class: 'tx' }, m[1] + ' · ' + m[2])));
  });
  return el;
}

function planSection(c, render) {
  const plan = c.plan || {};
  const currentText = () => plan.text || planFallbackText(c);
  const readOnly = c.state === 'making' || c.state === 'finished';
  const text = readOnly ? planChecklist(c, currentText(), { disabled: c.state === 'finished' }) : h('div', { class: 'pl-text', contenteditable: 'true', spellcheck: 'false',
    'data-ph': 'Type in or regenerate plan…' }, currentText());
  if (!readOnly) text.addEventListener('blur', () => {
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
  /* a finished piece's plan is its record: no REGENERATE */
  const box = h('div', { class: 'pl-box', style: {
    background: `linear-gradient(0deg, #f6f4ec 6.25%, ${S.pieceColor(c)} 100%)` } }, text, c.state === 'finished' ? null : regen);
  return section(c, 'plan', 'Plan', box);
}

/* ---------- CHATS (Figma nodes 487:3571 / 487:3575) ----------
   A flat list of paper bubbles. Each bubble is one 16px summary line
   plus a "TYPE, DATE" meta line ("VOICE, 22 JUL" / "TEXT, 22 JUL" /
   "SUGGESTION, NOW"); the whole bubble is the tap target. The suggestion
   is just the first bubble -- generic text ("Ask UNFIRED about this
   piece") rather than Figma's per-card "Visualize this idea with
   different painted patterns", since there's no prompt generator here. */
const bubWhen = (at) => (Date.now() - at < 12 * 36e5 ? 'now' : fmtShort(at));

function chatsSection(c, render) {
  const bubbles = h('div', { class: 'bubbles' });
  const bub = (summary, meta, onclick) => h('button', { class: 'bub', onclick },
    h('div', { class: 'sum' }, summary),
    h('div', { class: 'w' }, meta));

  /* Suggestions. Tapping one starts its chat with the question as your
     message and UNFIRED's answer; from then on that chat is just a thread
     in the list (marked SUGGESTION) and the suggestion itself is gone --
     tapping it again opens the same chat, never a copy. */
  const threads = c.threads || [];
  const suggest = (key, q, msgs) => {
    if (threads.some(t => t.suggest === key || (key === 'patterns' && t.patterns) || (key === 'plan' && t.planQuestions))) return;
    bubbles.append(bub(q, 'Suggestion, now', () => {
      const m = msgs();
      const tid = S.addThread(c.id, { title: q, suggestion: true, suggest: key,
        patterns: key === 'patterns' || undefined, planQuestions: key === 'plan' || undefined,
        msgs: [{ role: 'me', text: q }, ...m] });
      render();
      openChat(c.id, tid, render, null, { reply: !m.length });
    }));
  };

  /* Pink Pitcher (the one piece with variant images) answers this one with
     the pattern variants widget; elsewhere UNFIRED answers in words */
  suggest(c.id === PATTERNS.cardId ? 'patterns' : 'visualize', PATTERNS.ask, () =>
    c.id === PATTERNS.cardId ? [{ role: 'ai', text: PATTERNS.question, widget: 'patterns' }] : []);

  /* Ideas get a second suggestion: with a thin plan, the questions UNFIRED
     needs answered to build one; otherwise a question drawn from the
     plan's own first risk. */
  if (c.state === 'idea') {
    if (planIsThin(c.plan)) {
      suggest('plan', 'Answer a few questions to build your plan', () => [{ role: 'ai', text: PLAN_QUESTIONS }]);
    } else {
      const risk = (c.plan.risks || [])[0];
      suggest('risk', risk ? `How do I avoid ${risk.k.toLowerCase()}?` : 'Which step is the riskiest here?', () => []);
    }
  }

  /* chats only -- what you logged (voice, watch, live activity, photos)
     lives in LOG */
  [
    ...(c.threads || []).map(t => ({
      at: t.at, summary: t.title,
      meta: (t.suggestion || t.msgs[0]?.role === 'ai' ? 'Suggestion' : 'Chat') + ', ' + bubWhen(t.at),
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
  return h('div', { class: 'card-bar' }, pblur('up'), ...kids);
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

/* ---------- CHAT THREAD ---------- */
/* seed: a note to ask about ("About this note: …"); ask: a question sent
   as-is; reply: the thread ends on your question (a suggestion just
   tapped), so UNFIRED answers it; glow: the AI bubbles' colour when it
   isn't the card's (an Insights card's own colour).
   With no card the chat starts as ASK YOUR ARCHIVE: the suggested
   questions, answered from every card, with the cards it used as a
   widget.
   cardId null = the bottom bar's chat button: no card yet. The first
   message is routed like a Log note (AI.classify) -- it joins the card it's
   about, or starts a new idea card -- and the chat lives on there. */
export function openChat(cardId, threadId, onDone, seed, { ask, reply, glow } = {}) {
  let cid = cardId;
  let tid = threadId;
  if (cid && !tid) tid = S.addThread(cid, { title: 'NEW CHAT', msgs: [] });
  const card = () => cid && S.byId(cid);
  const thread = () => cid && ((card().threads || []).find(x => x.id === tid) || null);
  /* header: the status line is the piece (or "Suggested, now" for a
     suggestion; today's date before a card-less chat is filed), the
     title the thread */
  const head = () => {
    const t = thread();
    const status = t && t.suggestion ? 'Suggested, ' + bubWhen(t.at) : card() ? titleCase(card().title) : fmtShort(Date.now());
    return [status, titleCase(t && t.title !== 'NEW CHAT' ? t.title : 'New chat')];
  };

  page((p, close) => {
    let busy = false;
    const view = chatView({ status: head()[0], title: head()[1], glow: glow || (card() ? S.pieceColor(card()) : undefined),
      onBack: () => { if (cid) cleanEmpty(cid, tid); onDone && onDone(); close(); },
      /* ··· -> DELETE CHAT: the thread goes from the card (a chat not yet
         filed under a card just closes) */
      onDelete: () => {
        if (cid && tid) S.updateCard(cid, cc => ({ threads: (cc.threads || []).filter(x => x.id !== tid) }));
        nav.refresh(); onDone && onDone(); close();
      },
      onSend: (text, photos) => send(text, photos) });
    p.append(view.el);

    const persist = (msg) => { S.addMessage(cid, tid, msg); return thread().msgs.length - 1; };
    const patch = (i, fields) => S.mutate(st => {
      const t = st.cards.find(x => x.id === cid).threads.find(x => x.id === tid);
      Object.assign(t.msgs[i], fields);
    });
    const answer = (msg, ms = 700) => new Promise(res => {
      const done = view.typing();
      setTimeout(() => { done(); const i = persist(msg); show(msg, i); res(i); }, ms);
    });

    /* pattern variants: SELECT -> your pick, then how to make it with
       ADD TO PLAN; that adds the steps to the card's plan */
    const pick = (i, v, btn) => {
      (btn.closest('.chx-act') || btn).remove();
      patch(i, { pick: v.label });
      const me = { role: 'me', text: v.label };
      show(me, persist(me));
      answer({ role: 'ai', pattern: v.label, action: 'Add to plan',
        text: `Here's how to make the ${v.label.toLowerCase()} pattern:\n\n` +
          v.steps.map((st, k) => String(k + 1).padStart(2, '0') + ' · ' + st).join('\n') });
    };
    const addToPlan = (i, m, btn) => {
      (btn.closest('.chx-act') || btn).remove();
      patch(i, { done: true });
      const me = { role: 'me', text: m.action };
      show(me, persist(me));
      const v = PATTERNS.variants.find(x => x.label === m.pattern);
      const block = `PATTERN · ${v.label.toUpperCase()}\n` + v.steps.map((st, k) => String(k + 1).padStart(2, '0') + ' · ' + st).join('\n');
      S.updateCard(cid, cc => ({ plan: { ...cc.plan, text: (cc.plan.text || planFallbackText(cc)).trim() + '\n\n' + block } }));
      nav.refresh(); onDone && onDone();
      answer({ role: 'ai', text: `Added to the plan of ${titleCase(card().title)}, under PATTERN · ${v.label.toUpperCase()}.` });
    };

    /* ASK YOUR ARCHIVE: suggested questions as chips under the intro;
       one becomes your message, the answer cites the cards it used */
    let sugBox = null;
    const suggestions = () => {
      sugBox = view.widget();
      sugBox.classList.add('chx-sugs');
      sugBox.append(...AI.SUGGESTED.map(q => h('button', { class: 'chx-chip', type: 'button', onclick: () => archive(q) }, q)));
    };
    const looksLikeQuestion = (v) => /\?$|^(what|which|where|when|how|why|who|show|find|did|have|list)\b/i.test(v);
    async function archive(q) {
      if (busy) return;
      busy = true;
      if (sugBox) { sugBox.remove(); sugBox = null; }
      view.say('me', q);
      const done = view.typing();
      await sleep(700 + Math.random() * 400);
      done();
      const { answer, results } = AI.search(q);
      if (!answer.paras) {
        view.say('ai', `Nothing in your archive matches that yet. You have ${S.cards().length} cards — try handles, glaze, coils, nerikomi, a colour or a form.`);
      } else {
        view.say('ai', answer.paras.join('\n\n'), { src: answer.src });
        if (results.length) usedCards(view.widget(), results);
      }
      busy = false;
    }

    function show(m, i) {
      if (m.role === 'sys') return view.sys(m.text);
      if (m.role === 'me') return view.say('me', m.text, { photos: m.photos || [] });
      view.say('ai', m.text, { src: m.src });
      if (m.widget === 'patterns')
        patternsWidget(view.widget(), { ...PATTERNS, locked: m.pick, onSelect: (v, btn) => pick(i, v, btn) }, view);
      if (m.action && !m.done) view.pill(m.action, (btn) => addToPlan(i, m, btn));
    }

    /* first message of a card-less chat: decide where it belongs */
    const route = (v) => {
      const res = AI.classify(v, []);
      if (res.kind === 'attach') cid = res.card.id;
      else { S.addCard(res.card); cid = res.card.id; }
      tid = S.addThread(cid, { title: 'NEW CHAT', msgs: [] });
      const name = titleCase(S.byId(cid).title);
      const sys = { role: 'sys', text: res.kind === 'attach' ? `Added to ${name}` : `Started a new idea: ${name}` };
      show(sys, persist(sys));
      nav.refresh();
    };

    async function send(text, photos = []) {
      const v = (text || '').trim();
      if ((!v && !photos.length) || busy) return;
      busy = true;
      if (!cid && v && !photos.length && looksLikeQuestion(v) && AI.search(v).answer.paras) { busy = false; return archive(v); }
      if (!cid) route(v || 'photo');
      const me = { role: 'me', text: v, photos: photos.length ? photos : undefined };
      show(me, persist(me));
      if (thread().title === 'NEW CHAT' && v) S.updateCard(cid, cc => {
        const tt = cc.threads.find(x => x.id === tid);
        tt.title = v.replace(/[?.]$/, '').split(/\s+/).slice(0, 3).join(' ').toUpperCase();
        return {};
      });
      view.setHead(...head());
      await sleep(700 + Math.random() * 500);
      await answer(AI.reply(S.byId(cid), v || 'a photo'), 0);
      busy = false;
      onDone && onDone();
    }

    const t = thread();
    /* an empty chat opens on the intro -- or, with no card, on the
       suggested questions instead */
    if (!cid && !ask) suggestions();
    else if ((!t || !t.msgs.length) && !ask && !seed)
      view.sys('Ask what’s on your mind', { intro: true });
    (t ? t.msgs : []).forEach((m, i) => show(m, i));
    if (seed) setTimeout(() => send(`About this note: ${seed}`), 250);
    else if (ask && !cid) setTimeout(() => archive(ask), 250);
    else if (ask) setTimeout(() => send(ask), 250);
    else if (reply && t && t.msgs.at(-1)?.role === 'me') {
      busy = true;
      setTimeout(async () => { await answer(AI.reply(card(), t.msgs.at(-1).text)); busy = false; onDone && onDone(); }, 250);
    }
    setTimeout(() => view.focus(), 420);
  });
}

/* the cards an archive answer used, as the same tiles as the Items feed
   (items.js itemTile), two to a row */
function usedCards(box, cards) {
  const grid = h('div', { class: 'archive chx-used' });
  for (let k = 0; k < cards.length; k += 2)
    grid.append(h('div', { class: 'arch-row' }, ...cards.slice(k, k + 2).map(itemTile)));
  box.append(grid);
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
