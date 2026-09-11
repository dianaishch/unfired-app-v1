/* CARD DETAIL — hero, description, how to make it, photos, notes & chats. */
import { h, frag, ICON, page, sheet, toast, fmtShort, ago, img, sleep, squircle } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { postsForCard, openPostEdit, placeholderModal } from './post.js';

const STATES = ['idea', 'making', 'finished'];

export function openCard(id) {
  page((p, close) => {
    const render = () => {
      const c = S.byId(id);
      p.replaceChildren();
      /* Card-gone is the one place this page still needs a plain .page-top --
         there's no hero to carry the back button once the card itself is
         missing. */
      if (!c) {
        p.append(
          h('div', { class: 'page-top' }, h('button', { class: 'iconbtn', onclick: close, html: ICON.back })),
          h('div', { class: 'empty keep-type' }, h('div', { class: 'h-big' }, 'CARD GONE')));
        return;
      }
      /* Back + New Chat buttons move onto the hero itself (full-bleed, runs
         behind the status bar) -- no separate .page-top for this screen. */
      p.append(body(c, render, close));
    };
    render();
  });
}

/* Small status row shared by the hero card -- same visual language as the
   Items-screen archive (square for making/finished, star for idea). Color
   comes from the hero's own `color` (dark in treatment A, white in B via
   .cardhero2.photo) -- no hardcoded color here so it follows that. */
function heroStatus(c) {
  const icon = c.state === 'idea' ? h('span', { class: 'ic', html: ICON.ideaStar }) : h('span', { class: 'sq' });
  const label = c.state === 'idea' ? 'Idea, ' + ago(c.created)
    : c.state === 'making' ? 'Making, ' + ago(c.startedMaking || c.created)
    : (c.outcome === 'partial' ? 'Partial, ' : 'Finished, ') + ago(c.finishedAt || c.updated);
  return h('div', { class: 'ch-status' }, icon, h('span', {}, label));
}

/* Reused for the hero's own on-glass status bar (Figma nodes 478:65918 /
   478:66013 / 478:66106) -- same glyph shapes as items.js's statusBar(),
   but built on currentColor instead of hardcoded #fff (that version, and
   its CSS, is unique to the "ready to post" black bar and stays that way)
   so it can flip white-on-photo vs dark-on-gradient with the hero's own
   color, like everything else in the hero. */
/* The border-hack wifi glyph (a bottom-rounded box with no top border,
   copied from items.js's .rtp-statusbar) read as a stray bracket rather
   than a wifi icon at this size -- a real SVG glyph instead. */
const WIFI_SVG = '<svg viewBox="0 0 16 12" fill="none">' +
  '<path d="M1 4.5C4.8 0.8 11.2 0.8 15 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<path d="M3.3 7C5.9 4.5 10.1 4.5 12.7 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<path d="M5.8 9.3C6.9 8.2 9.1 8.2 10.2 9.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
  '<circle cx="8" cy="11.3" r="0.9" fill="currentColor"/></svg>';

function heroStatusBar() {
  return h('div', { class: 'ch-statusbar' },
    h('span', {}, '9:41'),
    h('div', { class: 'icons' },
      h('div', { class: 'bars' }, h('i'), h('i'), h('i'), h('i')),
      h('span', { class: 'wifi', html: WIFI_SVG }),
      h('div', { class: 'batt' }, h('i'))));
}

/* assets/pieces/... (and its hi-res assets/pieces without bg/... form) is a
   background-removed cutout, not a photo -- full-bleed cover-cropping one
   would clip the isolated object against its own transparent edge and look
   broken. Treatment B (full-bleed photo) is reserved for anything else
   (assets/process/...); a cutout still gets treatment A, centered in flow,
   same as before this task. This is the "confirm with design" decision the
   task flagged -- documenting it here rather than leaving it silent. */
const isCutout = (src) => /^assets\/pieces\b/.test(src || '');

/* Hero, title, and the state segmented control unified into one full-bleed
   card (Figma nodes 478:65918 "no photo" / 478:66013, 478:66106 "with
   photo") -- runs edge-to-edge and behind the status bar / back+chat
   buttons, which now live inside it. Tint comes from c.glow, same field/
   formula already used for the Items-screen hero card. */
function heroCard(c, render, closePage) {
  /* S.cutoutSrc(), not S.heroSrc() -- same "prefer the isolated cutout
     when the card has one" rule the Items-screen mkcard (cutoutFor())
     and the archive already use. A card like Lavender Teapot №2 has
     both a raw process/bench photo (c.hero.src) and a proper cutout
     among its photos; heroSrc() picked the former, showing a dark,
     dim-photo hero here while mkcard showed a bright cutout on a
     gradient for the exact same card -- inconsistent. cutoutSrc()
     falls back to heroSrc() when no cutout exists, so a genuine-photo
     idea (no assets/pieces/ photo at all) is unaffected. */
  const hero = S.hiRes(S.cutoutSrc(c));
  const hasPhoto = !!hero && !isCutout(hero);

  /* Title Case for display, matching .mkcard's titleCase(c.title) treatment --
     c.title itself stays stored/compared as ALL CAPS, same as every other
     screen that reads it (archive, items list). */
  const title = h('div', { class: 'ch-t', contenteditable: 'true', spellcheck: 'false' }, titleCase(c.title));
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

  const btnRow = h('div', { class: 'ch-btnrow' },
    h('button', { class: 'ch-circle', onclick: closePage, html: ICON.back, 'aria-label': 'Back' }),
    /* Figma's mock reads as a "cards/deck" glyph here rather than the spark
       used elsewhere for New Chat -- keeping ICON.spark and the New Chat
       action per the task's own "default to current behavior" fallback,
       since there's no ICON.cards in this codebase to confirm the swap
       against. */
    /* Figma 493:16883: "···" -> card options (was a New chat spark; NEW
       CHAT lives in the bottom bar) */
    h('button', { class: 'ch-circle more', onclick: () => cardMenu(c, render, closePage), html: MORE_SVG, 'aria-label': 'Card options' }));

  const el = h('div', { class: 'cardhero2 ' + c.state + (hasPhoto ? ' photo' : '') },
    hasPhoto ? h('div', { class: 'ch-photo' }, img(hero, c.title)) : null,
    hasPhoto ? h('div', { class: 'ch-dim' }) : null,
    heroStatusBar(),
    btnRow,
    /* Grouped so justify-content:space-between (treatment B, which pins the
       tabs to the hero's bottom edge) distributes its extra space around
       this group, not inside it -- otherwise status and title stretch
       apart on any card without enough content to fill the height. */
    h('div', { class: 'ch-head' }, heroStatus(c), title),
    !hasPhoto && hero ? h('div', { class: 'ch-img' }, img(hero, c.title)) : null,
    statepick);

  if (!hasPhoto) {
    const tint = c.glow || '#8C8A84';
    /* Gradient stop matches .mkcard's per-mode value exactly (23.558% for
       making, 23.32% otherwise) instead of a single hardcoded number. */
    const stop = c.state === 'making' ? '23.558%' : '23.32%';
    el.style.background = S.cardBg(c) || `linear-gradient(180deg, #f6f4ec ${stop}, ${tint} 100%)`;
  }

  /* Full-bleed: square at the top (flush with the screen edge), smoothed
     only at the bottom (48px superellipse) -- squircle() now takes a
     per-corner radius object for exactly this case. */
  squircle(el, { tl: 0, tr: 0, br: 48, bl: 48 });
  return el;
}

function body(c, render, closePage) {
  const scroll = h('div', { class: 'scroll' });

  scroll.append(heroCard(c, render, closePage));

  /* Origin/date line ("Voice note · 24 Aug · 10 days ago") removed per
     your instruction -- c.origin is still stored, just not shown here. */

  scroll.append(descBox(c));
  scroll.append(planCard(c, render));
  scroll.append(readyToPostRow(c));
  scroll.append(attachmentsRow(c, render));
  scroll.append(chatsSection(c, render));

  /* The old end-of-page START MAKING / OPEN STUDIO MODE / MARK FINISHED /
     PREPARE TO SHARE buttons are gone -- the per-state bottom bar covers
     them, and "finished" is still one tap away on the hero's state tabs. */
  scroll.append(h('div', { style: { height: '16px' } }));
  return frag(scroll, bottomBar(c, render));
}

/* Which HIDE/SHOW sections start hidden, by state: an idea shows
   everything; making shows Description + Plan only; finished hides all. */
const startsHidden = (c, section) =>
  c.state === 'finished' || (c.state === 'making' && section === 'chats');

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

/* HIDE/SHOW button for a section -- HIDE fully removes the given element(s)
   (Plan passes its input + its Regenerate button). */
function sectionToggle(startHidden, ...els) {
  els.forEach(el => el && (el.hidden = startHidden));
  const btn = h('button', { class: 'plan-toggle' }, startHidden ? 'SHOW' : 'HIDE');
  btn.onclick = () => {
    const next = !els[0].hidden;
    els.forEach(el => el && (el.hidden = next));
    btn.textContent = next ? 'SHOW' : 'HIDE';
  };
  return btn;
}

/* A contenteditable div that has been fully cleared still holds a stray
   <br>, so :empty never matches and the placeholder stays hidden. Wipe it
   on blur when the trimmed text is empty. */
function clearIfEmpty(el) {
  if (!el.textContent.trim()) el.replaceChildren();
}

/* ---------- DESCRIPTION (paper card, Figma) ---------- */
function descBox(c) {
  const hidden = startsHidden(c, 'desc');
  const desc = h('div', {
    class: 'desc2', contenteditable: 'true', spellcheck: 'false',
    'data-ph': 'Type in or use voice via microphone button…',
  }, c.desc || '');
  desc.addEventListener('blur', () => {
    const v = desc.textContent.trim();
    clearIfEmpty(desc);
    if (v !== c.desc) { S.updateCard(c.id, { desc: v }); toast({ text: 'Saved' }); }
  });
  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Description'), sectionToggle(hidden, desc)),
    desc);
}

/* ---------- PLAN (single editable text, matching Description, Figma) ----------
   Per your instruction, the plan is now one freeform contenteditable block --
   same container/typography as the description -- not a composed list of
   separate step/tool/risk elements. c.plan.text holds this verbatim when a
   card has it (the literal "AI recommendation" wording you gave for Blue
   Engobe Jug, matching your Figma mock exactly); cards without one fall back
   to planFallbackText(), a plain-text composition of the real steps/tools/
   risks/refs fields -- there's no real copy generator in this app to write
   that wording for the other 27 cards, so the fallback stays literal rather
   than inventing per-step titles like "BUILD"/"SHAPE" that aren't in the
   data. Two behavior losses from this change, flagged since neither was
   explicitly discussed: archive refs are plain text now, not individually
   clickable to open that card; and the separate ASSUMING/YOURS editing
   affordance is gone -- editing this field edits the whole plan at once. */
/* Not enough to go on: no tools or fewer than two steps. Instead of
   guessing, the plan points to a chat with UNFIRED (and Chats carries a
   suggested bubble with the questions it needs answered). */
const planIsThin = (plan) => !plan || !(plan.tools || []).length || (plan.steps || []).length < 2;
const THIN_PLAN_TEXT = 'Not enough to build a plan yet. Chat with UNFIRED about next steps.';

function planFallbackText(c) {
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

function planCard(c, render) {
  const plan = c.plan || {};

  const currentText = () => plan.text || planFallbackText(c);
  const text = h('div', {
    class: 'desc2 plan-text', contenteditable: 'true', spellcheck: 'false',
    'data-ph': 'Type in or regenerate plan…',
  }, currentText());
  text.addEventListener('blur', () => {
    const v = text.textContent.trim();
    clearIfEmpty(text);
    if (v !== currentText()) { S.updateCard(c.id, cc => ({ plan: { ...cc.plan, text: v } })); toast({ text: 'Saved' }); }
  });

  /* Regenerate: fresh AI plan from the card's title + tags, replacing the
     structured plan fields and dropping any hand-edited plan.text /
     summary so the box recomposes from the new plan. */
  const regen = h('button', { class: 'regen-plan', onclick: () => {
    const fresh = AI.generatePlan([c.title, ...(c.tags || [])].join(' '));
    S.updateCard(c.id, cc => {
      const { text: _t, summary: _s, assumeEdited: _a, ...keep } = cc.plan || {};
      return { plan: { ...keep, ...fresh } };
    });
    toast({ text: 'Plan regenerated' });
    render();
  } }, 'Regenerate plan');

  const toggle = sectionToggle(startsHidden(c, 'plan'), text, regen);

  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Plan'), toggle),
    /* Own class, not .meta -- .meta is shared by discover/insights/items/
       studio/card's own chat-count badge with its own sizing; restyling it
       here per spec would've changed all of those too. */
    h('div', { class: 'plan-sub' }, 'Estimated from your archive'),
    text,
    regen);
}

/* ---------- READY TO POST (Figma node 493:16931) ----------
   On every piece card. Count comes from the posts linked to this card in
   screens/post.js; the arrow opens the post Edit screen (its first post,
   or the empty "Upload an image" state when it has none yet). */
function readyToPostRow(c) {
  const n = postsForCard(c.id).length;
  return h('div', { class: 'sect2 rtp-sect' },
    h('div', { class: 'rtp-sect-tx' },
      h('div', { class: 'h-mid' }, 'Ready to post'),
      h('div', { class: 'rtp-sect-sub' }, n ? `${n} post${n > 1 ? 's' : ''} ready` : 'Add photos to make a post')),
    h('button', { class: 'circlebtn', onclick: () => openPostEdit(c.id), html: ICON.arrowFwd, 'aria-label': 'Open post' }));
}

/* ---------- ATTACHMENTS ---------- */
/* The "from where?" photo sheet, shared with the post Edit screen's "+".
   onPick(src, guess) -- guess is the library photo's kind, if it has one. */
export function pickPhoto(onPick) {
  const input = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  input.addEventListener('change', () => {
    const f = input.files[0]; if (!f) return;
    onPick(URL.createObjectURL(f));
  });
  sheet({ build: (b, done) => {
    b.append(h('div', { class: 'label' }, 'ADD A PHOTO'),
      h('div', { class: 'h-big', style: { margin: '10px 0 20px' } }, 'FROM WHERE?'),
      h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
        onclick: () => { done(); input.click(); } }, 'UPLOAD FROM THIS DEVICE'),
      h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
        onclick: () => { done(); pickFromLibrary(onPick); } }, 'SIMULATED PHOTO LIBRARY'));
  } });
}

function addPhotoFlow(c, render) {
  pickPhoto((src, guess) => addProcessPhoto(c.id, src, render, guess));
}

/* Compact row on the card page -- add button first, then plain thumbnails,
   per Figma. Per-photo kind/caption/delete moved to the "see all" page
   (no dedicated attachments page existed before; built per your
   confirmation). */
function attachmentsRow(c, render) {
  const list = (c.photos || []);
  const thumbs = list.slice(0, 4).map(p =>
    h('button', { class: 'att-thumb', onclick: () => openAttachments(c.id, render) }, img(p.src, p.cap || '')));
  return h('div', { class: 'sect2' },
    h('div', { class: 'sh2' },
      h('div', { class: 'h-mid' }, 'Attachments'),
      h('button', { class: 'circlebtn', onclick: () => openAttachments(c.id, render), html: ICON.arrowFwd, 'aria-label': 'See all' })),
    h('div', { class: 'att-row' },
      h('button', { class: 'att-thumb add', onclick: () => addPhotoFlow(c, render), html: ICON.plus }),
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

function pickFromLibrary(onPick) {
  import('../seed.js').then(({ PHOTO_LIB }) => {
    sheet({ build: (b, done) => {
      b.append(h('div', { class: 'label' }, 'PHOTO LIBRARY · SIMULATED'),
        h('div', { class: 'h-big', style: { margin: '10px 0 16px' } }, 'RECENT'));
      const g = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' } });
      PHOTO_LIB.forEach(p => g.append(h('button', {
        style: { borderRadius: '14px', overflow: 'hidden', aspectRatio: '1', background: '#111' },
        onclick: () => { done(); onPick(p.src, p.guess); }
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
  /* Same HIDE/SHOW button as Description and Plan -- hides the whole list. */
  const wrap = h('div', { class: 'sect2' },
    h('div', { class: 'sh2' }, h('div', { class: 'h-mid' }, 'Chats'), sectionToggle(startsHidden(c, 'chats'), bubbles)));
  const bub = (summary, meta, onclick) => h('button', { class: 'bub', onclick },
    h('div', { class: 'sum' }, summary),
    h('div', { class: 'w' }, meta));

  bubbles.append(bub('Visualize this idea', 'Suggestion, now',
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

  wrap.append(bubbles);
  return wrap;
}

/* ---------- CARD OPTIONS ("···" in the hero) ----------
   Remake as new idea (any state), Live activities (making cards -- the
   same flow as the LIVE MODE button), Delete card (after a confirm). */
const MORE_SVG = '<svg viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M5 8C5 8.26522 4.89464 8.51957 4.70711 8.70711C4.51957 8.89464 4.26522 9 4 9C3.73478 9 3.48043 8.89464 3.29289 8.70711C3.10536 8.51957 3 8.26522 3 8C3 7.73478 3.10536 7.48043 3.29289 7.29289C3.48043 7.10536 3.73478 7 4 7C4.26522 7 4.51957 7.10536 4.70711 7.29289C4.89464 7.48043 5 7.73478 5 8ZM9 8C9 8.26522 8.89464 8.51957 8.70711 8.70711C8.51957 8.89464 8.26522 9 8 9C7.73478 9 7.48043 8.89464 7.29289 8.70711C7.10536 8.51957 7 8.26522 7 8C7 7.73478 7.10536 7.48043 7.29289 7.29289C7.48043 7.10536 7.73478 7 8 7C8.26522 7 8.51957 7.10536 8.70711 7.29289C8.89464 7.48043 9 7.73478 9 8ZM12 9C12.2652 9 12.5196 8.89464 12.7071 8.70711C12.8946 8.51957 13 8.26522 13 8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7C11.7348 7 11.4804 7.10536 11.2929 7.29289C11.1054 7.48043 11 7.73478 11 8C11 8.26522 11.1054 8.51957 11.2929 8.70711C11.4804 8.89464 11.7348 9 12 9Z"/></svg>';

function cardMenu(c, render, closePage) {
  sheet({ build: (b, done) => {
    const opt = (text, fn, cls = '') => h('button', { class: 'bigact ghost ' + cls, style: { margin: '0 0 10px', width: '100%' },
      onclick: () => { done(); fn(); } }, text);
    /* filter(Boolean): native append() would print a skipped option as "null" */
    b.append(...[h('div', { class: 'label' }, 'CARD OPTIONS'),
      h('div', { class: 'h-big', style: { margin: '10px 0 20px' } }, titleCase(c.title)),
      opt('REMAKE AS NEW IDEA', () => {
        const id = S.remakeCard(c.id);
        nav.refresh();
        if (id) openCard(id);
      }),
      c.state === 'making' ? opt(c.live ? 'TURN OFF LIVE ACTIVITY' : 'LIVE ACTIVITIES', () => toggleLive(S.byId(c.id), render)) : null,
      opt('DELETE CARD', () => confirmDelete(c, closePage), 'danger')].filter(Boolean));
  } });
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

/* ---------- BOTTOM BAR (per state) ----------
   idea     493:19500  cards icon -> collide this card · START MAKING · NEW CHAT
   making   493:18702  + -> add drawer · LIVE MODE:OFF/ON · NEW CHAT
   finished 493:19297  + -> add drawer · REMAKE · POST
   Replaces the old "Ask about…" compose bar. */
export const PLUS24_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M11.9999 2.70034C12.2385 2.70034 12.4675 2.79516 12.6362 2.96395C12.805 3.13273 12.8999 3.36165 12.8999 3.60034V11.1003H20.3999C20.6385 11.1003 20.8675 11.1952 21.0363 11.3639C21.205 11.5327 21.2999 11.7616 21.2999 12.0003C21.2999 12.239 21.205 12.468 21.0363 12.6367C20.8675 12.8055 20.6385 12.9003 20.3999 12.9003H12.8999L12.8999 20.4003C12.8999 20.639 12.805 20.868 12.6362 21.0367C12.4675 21.2055 12.2385 21.3003 11.9999 21.3003C11.7612 21.3003 11.5322 21.2055 11.3635 21.0367C11.1947 20.868 11.0999 20.639 11.0999 20.4003V12.9003H3.59985C3.36116 12.9003 3.13224 12.8055 2.96346 12.6367C2.79467 12.468 2.69985 12.239 2.69985 12.0003C2.69985 11.7616 2.79467 11.5327 2.96346 11.3639C3.13224 11.1952 3.36116 11.1003 3.59985 11.1003L11.0999 11.1003L11.0999 3.60034C11.0999 3.36165 11.1947 3.13273 11.3635 2.96394C11.5322 2.79516 11.7612 2.70034 11.9999 2.70034Z"/></svg>';

function bottomBar(c, render) {
  const icon = (html, label, onclick) => h('button', { class: 'pe-regen', html, onclick, 'aria-label': label });
  const btn = (cls, text, onclick) => h('button', { class: 'pe-btn ' + cls, onclick }, text);
  const newChat = btn('paper', 'New chat', () => openChat(c.id, null, render));
  let kids;

  if (c.state === 'idea') {
    kids = [
      icon(ICON.dockDiscover, 'Collide this card', () => nav.openCollide(c.id)),
      btn('accent', 'Start making', () => {
        const snap = S.setState(c.id, 'making');
        toast({ html: '<b>MAKING</b> · set by you', undo: () => { S.restore(snap); render(); nav.refresh(); } });
        render(); nav.refresh();
      }),
      newChat];
  } else if (c.state === 'making') {
    kids = [
      icon(PLUS24_SVG, 'Add', () => addDrawer(c, render)),
      btn('accent', c.live ? 'Live mode:on' : 'Live mode:off', () => toggleLive(c, render)),
      newChat];
  } else {
    kids = [
      icon(PLUS24_SVG, 'Add', () => addDrawer(c, render)),
      btn('accent', 'Remake', () => {
        const id = S.remakeCard(c.id);
        nav.refresh();
        if (id) openCard(id);
      }),
      btn('paper', 'Post', () => openPostEdit(c.id))];
  }
  return h('div', { class: 'card-bar' }, ...kids);
}

/* "+" drawer (making / finished cards, and the Log screen). Gallery is the
   simulated photo library; camera and video are placeholders for now.
   onPick(src, guess) gets the picked photo. */
export function mediaDrawer(onPick, label = 'ADD TO THIS PIECE') {
  sheet({ build: (b, done) => {
    const opt = (text, fn) => h('button', { class: 'bigact ghost', style: { margin: '0 0 10px', width: '100%' },
      onclick: () => { done(); fn(); } }, text);
    b.append(h('div', { class: 'label' }, label),
      h('div', { class: 'h-big', style: { margin: '10px 0 20px' } }, 'FROM WHERE?'),
      opt('ADD FROM GALLERY', () => pickFromLibrary(onPick)),
      opt('TAKE A PICTURE', () => placeholderModal('Camera screen opens')),
      opt('VIDEO', () => placeholderModal('Video recording opens')));
  } });
}
const addDrawer = (c, render) => mediaDrawer((src, guess) => addProcessPhoto(c.id, src, render, guess));

/* LIVE MODE. Off -> the sheet (where to show the live activity) unless a
   choice was saved, then on + the Lock Screen live activity. On -> off,
   instantly. The per-surface widgets come later; for now every choice
   shows the Lock Screen one that already exists (studio.js). */
const LIVE_SURFACES = [['lock', 'Locked screen'], ['widget', 'Home screen widget'], ['watch', 'Apple Watch']];

function toggleLive(c, render) {
  if (c.live) { S.updateCard(c.id, { live: false }); render(); return; }
  const turnOn = (surfaces) => {
    S.updateCard(c.id, { live: true, liveSurfaces: surfaces });
    render();
    nav.openLock(c.id, render);
  };
  const saved = S.get().liveChoice;
  if (saved && saved.length) return turnOn(saved);

  sheet({ build: (b, done) => {
    const picked = new Set(['lock']);
    let save = false;
    const row = (label, isOn, onToggle) => {
      const el = h('button', { class: 'live-opt' + (isOn() ? ' on' : '') },
        h('span', { class: 'box', html: ICON.check }), h('span', {}, label));
      el.onclick = () => { onToggle(); el.classList.toggle('on', isOn()); go.disabled = !picked.size; };
      return el;
    };
    const go = h('button', { class: 'pe-btn accent live-go', onclick: () => {
      if (!picked.size) return;
      const surfaces = LIVE_SURFACES.map(([k]) => k).filter(k => picked.has(k));
      if (save) S.setLiveChoice(surfaces);
      done(); turnOn(surfaces);
    } }, 'Save');
    b.append(h('div', { class: 'label' }, 'LIVE MODE'),
      h('div', { class: 'h-big', style: { margin: '10px 0 18px' } }, 'SHOW LIVE ACTIVITY ON'),
      ...LIVE_SURFACES.map(([k, label]) => row(label, () => picked.has(k),
        () => (picked.has(k) ? picked.delete(k) : picked.add(k)))),
      h('div', { class: 'live-sep' }),
      row('Save this choice', () => save, () => { save = !save; }),
      go);
  } });
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
    const cardLabel = h('div', { class: 'label' }, cid ? S.byId(cid).title : '');
    const headTitle = h('div', { class: 'h-mid', style: { marginTop: '2px' } }, thread()?.title || 'NEW CHAT');
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
      cardLabel.textContent = S.byId(cid).title;
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
      h('div', { class: 'page-top' },
        h('button', { class: 'iconbtn', onclick: () => { if (cid) cleanEmpty(cid, tid); onDone && onDone(); close(); }, html: ICON.back }),
        h('div', { class: 'chat-head' }, cardLabel, headTitle)),
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
