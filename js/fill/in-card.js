/* CARD-FILL inside piece cards: which fill chats a card suggests, the
   widget each one shows (built from the card's own data), and how an
   answer is written to the card and taken back.
     idea / making   SIZE  -> plan: height + clay amount
                     GLAZE -> plan: surface
     making          SESSION PLAN -> the plan's ticks (the PLAN box's)
     finished        PHOTO -> the after-firing photo
   Copy in data/card-fill.json (fields + inCards). card.js openChat runs
   the conversation and keeps it in the thread. */
import * as S from '../store.js';
import { titleCase } from '../ui.js';
import { render as answerTags } from './answer-tags.js';
import { render as fieldCard } from './field-card.js';

export const DATA = await (await fetch('data/card-fill.json')).json();
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const nameOf = (c) => titleCase(c.title);

/* the fill suggestions for a card, in the order they're offered */
export function fillSuggestions(c) {
  const keys = c.state === 'finished' ? ['photo']
    : c.state === 'making' ? ['session', 'size', 'glaze']
    : ['size', 'glaze'];
  /* a session plan needs steps to tick */
  return keys.filter(k => k !== 'session' || planLines(c).length).map(k => ({ key: k, ask: DATA.inCards[k].ask }));
}

export const fillQuestion = (key, c) => fill(DATA.inCards[key].question, { name: nameOf(c) });
export const fillNext = (key) => DATA.inCards[key].next;

/* the numbered steps of the card's plan ("01 · …"), as in the PLAN box */
function planLines(c) {
  const text = c.plan?.text || (c.plan?.steps || []).map((s, i) => String(i + 1).padStart(2, '0') + ' · ' + s).join('\n');
  return text.split('\n').filter(l => /^\d{2} · /.test(l));
}
const param = (c, k) => (c.plan?.params || []).find(p => p.key === k)?.val || '';

/* the field the widget shows, from the card */
function fieldFor(key, c) {
  const f = DATA.fields;
  if (key === 'size') {
    const cm = parseFloat((param(c, 'height') || param(c, 'dimensions')).replace(/[^\d.]/g, ''));
    const v = cm ? Math.min(f.size.max, Math.max(f.size.min, Math.round(cm * 2) / 2)) : f.size.value;
    return { ...f.size, value: v };
  }
  if (key === 'glaze') {
    /* the guess is the glaze already on the card's plan -- one of the list,
       or, when it isn't there, itself as the first tag */
    const surf = param(c, 'surface');
    const i = f.glaze.options.findIndex(o => o.label && surf.toLowerCase().includes(o.label.toLowerCase()));
    if (i >= 0 || !surf) return { ...f.glaze, guess: Math.max(0, i) };
    return { ...f.glaze, options: [{ label: surf }, ...f.glaze.options], guess: 0 };
  }
  if (key === 'session') {
    const done = new Set(c.plan?.checked || []);
    return { ...f.plan, labels: { ...f.plan.labels, head: 'Plan · ' + nameOf(c) },
      steps: planLines(c).map(l => ({ label: l.replace(/^\d{2} · /, ''), line: l, done: done.has(l) })) };
  }
  if (key === 'photo') {
    return { ...f.photo, before: { src: S.hiRes(S.cutoutSrc(c)), alt: nameOf(c) } };
  }
}
export const fieldTitle = (key) => (key === 'session' ? DATA.fields.plan.savedLabel : DATA.fields[key].savedLabel || DATA.fields[key].title);

/* the widget under UNFIRED's question; onDone({ value, said, written,
   photos }) or onDone(null) for Not now / Skip */
export function renderFill(box, key, c, onDone) {
  const f = fieldFor(key, c);
  if (f.pattern === 'tags')
    return answerTags(box, { options: f.options, guess: f.guess, notNow: DATA.notNow },
      (v) => onDone(v === null ? null : { value: v, said: v, written: v }));
  return fieldCard(box, f, { ...DATA, glow: S.pieceColor(c) }, (r) => {
    if (r && key === 'session') {
      /* the ticks, as the plan's own step lines */
      const lines = f.steps.filter((_, i) => r.value[i]).map(s => s.line);
      return onDone({ ...r, value: lines });
    }
    onDone(r);
  });
}

/* writing to the card: snap() before, apply(value), restore(snap) to undo */
const setParams = (id, pairs) => S.updateCard(id, cc => {
  const params = [...(cc.plan?.params || [])];
  for (const [k, v] of pairs) {
    const i = params.findIndex(p => p.key === k);
    if (i >= 0) params[i] = { ...params[i], val: v, src: 'user' }; else params.push({ key: k, val: v, src: 'user' });
  }
  return { plan: { ...cc.plan, params } };
});
export function writer(key, id) {
  const c = () => S.byId(id);
  const snapParams = () => JSON.parse(JSON.stringify(c().plan?.params || []));
  const restoreParams = (p) => S.updateCard(id, cc => ({ plan: { ...cc.plan, params: p } }));
  return {
    size: {
      snap: snapParams, restore: restoreParams,
      apply: (v) => setParams(id, [['height', `~${v.h} cm`], ['clay amount', `~${v.clay} g`]]),
    },
    glaze: { snap: snapParams, restore: restoreParams, apply: (v) => setParams(id, [['surface', v]]) },
    session: {
      snap: () => c().plan?.checked || null,
      apply: (lines) => S.updateCard(id, cc => ({ plan: { ...cc.plan, checked: lines } })),
      restore: (s) => S.updateCard(id, cc => {
        const { checked: _x, ...plan } = cc.plan || {};
        return { plan: s ? { ...plan, checked: s } : plan };
      }),
    },
    photo: {
      snap: () => (c().photos || []).map(p => p.id),
      apply: (src) => S.addPhoto(id, { src, kind: 'final', cap: 'After firing' }),
      restore: (ids) => S.updateCard(id, cc => ({ photos: (cc.photos || []).filter(p => ids.includes(p.id)) })),
    },
  }[key];
}
