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
  /* Edit-screen state per post (or per card, for cards with no post yet):
     { [key]: { bg, caption, photos: [src] } } -- see screens/post.js. */
  posts: {},
  /* Live mode sheet's "Save this choice": ['lock', 'widget', 'watch'] or null. */
  liveChoice: null,
  migrations: [],
});

/* One-off patches for seed changes that saved state (localStorage) would
   otherwise hide from anyone who opened the prototype before. */
const MIGRATIONS = {
  /* A Flock of Birds demonstrates the "not enough info for a plan" idea. */
  'bird-flock-thin-plan': (s) => {
    const seed = CARDS.find(c => c.id === 'idea-bird-flock');
    const c = s.cards.find(x => x.id === 'idea-bird-flock');
    if (seed && c) c.plan = JSON.parse(JSON.stringify(seed.plan));
  },
};
function migrate(s) {
  let changed = false;
  for (const [k, fn] of Object.entries(MIGRATIONS)) {
    if (s.migrations.includes(k)) continue;
    fn(s);
    s.migrations.push(k);
    changed = true;
  }
  if (changed) try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode etc. */ }
  return s;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrate(fresh());
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards) || !parsed.cards.length) return migrate(fresh());
    return migrate({ ...fresh(), ...parsed });
  } catch { return migrate(fresh()); }
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
/* Per-piece card gradients straight from Figma, overriding the generic
   paper -> c.glow gradient on the Items "now" card and the card-page hero.
   Keyed by id in code, not stored on the card, because saved state in
   localStorage would keep serving an old seed value. */
const CARD_BG = {
  /* Figma node 461:54289 */
  'lavender-teapot-2': 'linear-gradient(0deg, #dab4ff 14.423%, #f6f4ec 58.666%, #f6f4ec 99.038%)',
};
export const cardBg = (c) => CARD_BG[c.id] || null;

/* The piece's colour as a single value (post backdrops build their
   swatches from it): the Figma override's colour where one exists, else
   c.glow -- the same colour its card page gradient tints toward. */
const CARD_TINT = { 'lavender-teapot-2': '#dab4ff' };
export const pieceColor = (c) => CARD_TINT[c.id] || c.glow || '#dab4ff';

export const postEdit = (key) => state.posts[key] || null;
export function updatePostEdit(key, patch) {
  return mutate(s => { s.posts[key] = { ...(s.posts[key] || {}), ...patch }; });
}

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

/* REMAKE: a new idea card from a piece -- same title + "REMAKE", its
   description, plan, tags, colour, and the piece photo as a reference.
   No notes, chats or posts. Returns the new card's id. */
export function remakeCard(id) {
  const src = byId(id);
  if (!src) return null;
  const piece = (src.photos || []).find(p => /assets\/pieces\//.test(p.src || ''));
  const nid = uid('remake-');
  const now = Date.now();
  mutate(s => {
    s.cards.unshift({
      id: nid, state: 'idea', title: src.title + ' REMAKE', remakeOf: src.id,
      created: now, updated: now,
      origin: { type: 'remake', label: 'Remake of ' + src.title },
      glow: src.glow, desc: src.desc || '', tags: [...(src.tags || [])],
      plan: src.plan ? JSON.parse(JSON.stringify(src.plan)) : null,
      hero: null,
      photos: piece ? [{ ...piece, id: uid('p'), kind: 'inspiration', cap: 'From ' + src.title }] : [],
      notes: [], threads: [],
    });
  });
  return nid;
}

/* Delete a card for good -- with its notes, chats and photos, and any post
   edits saved for it (keys "gen-<id>", "card:<id>"; exported posts are
   dropped from the list by post.js once their card is gone). Returns an
   undo snapshot. */
export function deleteCard(id) {
  return mutate(s => {
    s.cards = s.cards.filter(c => c.id !== id);
    delete s.posts['gen-' + id];
    delete s.posts['card:' + id];
  });
}

export function setLiveChoice(surfaces) { mutate(s => { s.liveChoice = surfaces; }); }

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

/* c.loggedAt: last time you added something yourself -- a note, a photo or
   a chat message. The archive puts those cards first (items.js). */
export function addNote(id, note) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    (c.notes ||= []).unshift({ id: uid('n'), at: Date.now(), src: 'voice', ...note });
    c.updated = c.loggedAt = Date.now();
  });
}

export function addPhoto(id, photo) {
  return mutate(s => {
    const c = s.cards.find(x => x.id === id);
    if (!c) return;
    (c.photos ||= []).push({ id: uid('p'), kind: 'process', ...photo });
    if (!c.hero) c.hero = { src: photo.src, kind: photo.kind || 'process' };
    c.updated = c.loggedAt = Date.now();
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
    if (msg.role === 'me') c.loggedAt = c.updated;
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
