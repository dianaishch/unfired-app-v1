/* UNFIRED — state, persistence, undo. Single source of truth for every screen. */
import { CARDS } from './seed.js';

const KEY = 'unfired.v1';
const listeners = new Set();

const fresh = () => ({
  cards: JSON.parse(JSON.stringify(CARDS)),
  onboarded: false,
  perms: { photos: false, pinterest: false, boards: [] },
  discardedIdeas: [],
  savedFromDiscover: [],
  importedBatches: 0,
  shared: [],
  lastRoute: null,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards) || !parsed.cards.length) return fresh();
    return { ...fresh(), ...parsed };
  } catch { return fresh(); }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('persist failed', e); }
}

export function get() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { persist(); listeners.forEach(fn => fn(state)); }

/* mutate(fn) — fn receives a draft; returns an undo token snapshot */
export function mutate(fn) {
  const before = JSON.stringify(state);
  fn(state);
  emit();
  return before;
}
export function restore(snapshot) {
  if (!snapshot) return;
  state = JSON.parse(snapshot);
  emit();
}

export function resetDemo() {
  state = fresh();
  emit();
}

/* ---------- selectors ---------- */
export const cards = () => state.cards;
export const byId = (id) => state.cards.find(c => c.id === id);
export const byState = (s) => state.cards.filter(c => c.state === s);
export const making = () => state.cards.filter(c => c.state === 'making')
  .sort((a, b) => b.updated - a.updated);
export const finished = () => state.cards.filter(c => c.state === 'finished')
  .sort((a, b) => (b.finishedAt || b.updated) - (a.finishedAt || a.updated));
export const ideas = () => state.cards.filter(c => c.state === 'idea')
  .sort((a, b) => b.created - a.created);
export const readyToShare = () => state.cards.filter(c => c.state === 'finished' && c.readyToShare);

export function heroSrc(c) {
  if (c.hero && c.hero.src) return c.hero.src;
  const f = (c.photos || []).find(p => p.kind === 'final') || (c.photos || [])[0];
  return f ? f.src : null;
}

/* Archive prefers a background-removed cutout when the card has one. */
export function cutoutSrc(c) {
  const p = (c.photos || []).find(x => /assets\/pieces\//.test(x.src || ''));
  if (p) return p.src;
  return heroSrc(c);
}

/* assets/pieces/<key>.webp is the low-res cutout set (~1.4MB total, always
   available). assets/pieces without bg/<key> 1.png is the same cutouts at
   full export resolution. Given any src from heroSrc/cutoutSrc, swap to the
   HD version when the key follows that pattern; anything else (a process/
   snap photo, a null hero) passes through unchanged. */
export function hiRes(src) {
  const m = /^assets\/pieces\/([^/]+)\.webp$/.exec(src || '');
  return m ? `assets/pieces without bg/${m[1]} 1.png` : src;
}

/* ---------- mutations ---------- */
export const uid = (p = 'x') => p + Math.random().toString(36).slice(2, 9);

export function addCard(card) {
  return mutate(s => { s.cards.unshift(card); });
}

export function updateCard(id, patch) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    Object.assign(c, typeof patch === 'function' ? patch(c) : patch);
    c.updated = Date.now();
  });
}

export function setState(id, next) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    c.state = next;
    c.updated = Date.now();
    if (next === 'making' && !c.startedMaking) c.startedMaking = Date.now();
    if (next === 'finished' && !c.finishedAt) c.finishedAt = Date.now();
  });
}

export function addNote(id, note) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    (c.notes ||= []).unshift({ id: uid('n'), at: Date.now(), src: 'voice', ...note });
    c.updated = Date.now();
  });
}

export function addPhoto(id, photo) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    (c.photos ||= []).push({ id: uid('p'), kind: 'process', ...photo });
    if (!c.hero) c.hero = { src: photo.src, kind: photo.kind || 'process' };
    c.updated = Date.now();
  });
}

export function removePhoto(id, photoId) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    c.photos = (c.photos || []).filter(p => p.id !== photoId);
    c.updated = Date.now();
  });
}

export function addThread(id, thread) {
  const tid = thread.id || uid('t');
  mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    (c.threads ||= []).unshift({ id: tid, at: Date.now(), msgs: [], ...thread });
    c.updated = Date.now();
  });
  return tid;
}

export function addMessage(cardId, threadId, msg) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === cardId);
    const t = c && (c.threads || []).find(x => x.id === threadId);
    if (!t) return;
    t.msgs.push(msg);
    t.at = Date.now();
    c.updated = Date.now();
  });
}

export function setParam(cardId, key, val) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === cardId);
    if (!c || !c.plan) return;
    const p = c.plan.params.find(x => x.key === key);
    if (p) { p.val = val; p.src = 'user'; }
    /* let the assumption block recompose unless the user has written their own */
    if (!c.plan.assumeEdited) delete c.plan.summary;
    c.updated = Date.now();
  });
}
