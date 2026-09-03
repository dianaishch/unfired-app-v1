/* UNFIRED — tiny view layer: hyperscript, sheets, pages, toasts, icons. */

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'data') Object.entries(v).forEach(([a, b]) => el.dataset[a] = b);
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (k) => {
    if (k === null || k === undefined || k === false) return;
    if (Array.isArray(k)) return k.forEach(add);
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  };
  kids.forEach(add);
  return el;
}
export const frag = (...k) => { const f = document.createDocumentFragment(); k.flat().forEach(x => x && f.append(x)); return f; };
export const $ = (s, r = document) => r.querySelector(s);

/* ---------- icons ---------- */
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}${extra}</svg>`;
export const ICON = {
  search: ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>'),
  mic:    ic('<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>'),
  back:   ic('<path d="M15 5l-7 7 7 7"/>'),
  close:  ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  send:   ic('<path d="M4 12h15"/><path d="M13 6l6 6-6 6"/>'),
  photo:  ic('<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="10" r="1.6"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>'),
  video:  ic('<rect x="3" y="6" width="12" height="12" rx="3"/><path d="M15 11l6-3v8l-6-3z"/>'),
  link:   ic('<path d="M10 13a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7L11 6.3"/><path d="M14 11a4 4 0 0 0-5.7 0L5.7 13.6a4 4 0 0 0 5.7 5.7L13 17.7"/>'),
  spark:  ic('<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3"/>'),
  plus:   ic('<path d="M12 5v14M5 12h14"/>'),
  chart:  ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  cards:  ic('<rect x="3" y="6" width="13" height="14" rx="3"/><path d="M8 3h9a4 4 0 0 1 4 4v9"/>'),
  watch:  ic('<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9 6l.6-3h4.8l.6 3M9 18l.6 3h4.8l.6-3"/>'),
  lock:   ic('<rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>'),
  undo:   ic('<path d="M4 9h11a5 5 0 0 1 0 10h-3"/><path d="M8 5L4 9l4 4"/>'),
  check:  ic('<path d="M4 12.5l5 5L20 6.5"/>'),
};

/* ---------- layers: sheets & pages ---------- */
const layers = () => document.getElementById('layers');

export function sheet({ title, build, full = false, onClose } = {}) {
  const wrap = h('div', { class: 'layer' });
  const scrim = h('div', { class: 'scrim' });
  const body = h('div', { class: 'sbody' });
  const s = h('div', { class: 'sheet' + (full ? ' full' : '') }, h('div', { class: 'grip' }), body);
  wrap.append(scrim, s);
  layers().append(wrap);
  requestAnimationFrame(() => { scrim.classList.add('in'); s.classList.add('in'); });

  const close = () => {
    scrim.classList.remove('in'); s.classList.remove('in');
    setTimeout(() => { wrap.remove(); onClose && onClose(); }, 380);
  };
  scrim.addEventListener('click', close);

  /* drag to dismiss */
  let y0 = null;
  s.addEventListener('touchstart', e => { if (body.scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
  s.addEventListener('touchmove', e => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0;
    if (dy > 0) { s.style.transition = 'none'; s.style.transform = `translateY(${dy}px)`; }
  }, { passive: true });
  s.addEventListener('touchend', e => {
    if (y0 === null) return;
    const dy = (e.changedTouches[0].clientY - y0);
    s.style.transition = ''; s.style.transform = '';
    y0 = null;
    if (dy > 110) close();
  });

  build && build(body, close);
  return { close, body };
}

export function page(build, { onClose } = {}) {
  const wrap = h('div', { class: 'layer' });
  const p = h('div', { class: 'page' });
  wrap.append(p);
  layers().append(wrap);
  requestAnimationFrame(() => p.classList.add('in'));
  const close = () => {
    p.classList.remove('in');
    setTimeout(() => { wrap.remove(); onClose && onClose(); }, 400);
  };
  /* edge swipe back */
  let x0 = null;
  p.addEventListener('touchstart', e => { if (e.touches[0].clientX < 26) x0 = e.touches[0].clientX; }, { passive: true });
  p.addEventListener('touchmove', e => {
    if (x0 === null) return;
    const dx = e.touches[0].clientX - x0;
    if (dx > 0) { p.style.transition = 'none'; p.style.transform = `translateX(${dx}px)`; }
  }, { passive: true });
  p.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    p.style.transition = ''; p.style.transform = ''; x0 = null;
    if (dx > 90) close();
  });
  build(p, close);
  return { close, el: p };
}

export function fullLayer(build) {
  const wrap = h('div', { class: 'layer' });
  layers().append(wrap);
  const close = () => wrap.remove();
  build(wrap, close);
  return { close, el: wrap };
}

export function topbar(title, close, right) {
  return h('div', { class: 'page-top' },
    h('button', { class: 'iconbtn', onclick: close, html: ICON.back, 'aria-label': 'Back' }),
    h('div', { class: 'label', style: { flex: '1' } }, title || ''),
    right || null
  );
}

/* ---------- toasts ---------- */
export function toast({ text, html, undo, ms = 4200, work = false } = {}) {
  const host = document.getElementById('toasts');
  const el = h('div', { class: 'toast' + (work ? ' work' : '') });
  if (work) el.append(h('div', { class: 'spin' }));
  el.append(h('div', { class: 'tx', html: html || text }));
  let done = false;
  const kill = () => {
    if (done) return; done = true;
    el.classList.remove('in');
    setTimeout(() => el.remove(), 320);
  };
  if (undo) el.append(h('button', { class: 'un', onclick: () => { undo(); kill(); } }, 'Undo'));
  host.append(el);
  requestAnimationFrame(() => el.classList.add('in'));
  const t = setTimeout(kill, ms);
  return { kill: () => { clearTimeout(t); kill(); }, el };
}

/* ---------- misc ---------- */
export const fmtDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtShort = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export function ago(ts) {
  const d = Math.floor((Date.now() - ts) / 864e5);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return d + ' days ago';
  const m = Math.round(d / 30);
  return m + (m === 1 ? ' month ago' : ' months ago');
}
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function img(src, alt = '', cls = '') {
  const i = h('img', { src, alt, loading: 'lazy', class: cls });
  i.addEventListener('error', () => {
    i.replaceWith(h('div', { class: 'shimmer', style: { width: '100%', height: '100%', minHeight: '80px' } }));
  });
  return i;
}
