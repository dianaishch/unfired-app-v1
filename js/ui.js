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
  /* exported from Figma (file 1tQDdb27nZuUlRbpSVl8OR) — filled paths, tint via currentColor */
  topSearch: '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M16.1558 17.382C14.3232 18.8993 11.9767 19.6525 9.60337 19.4852C7.23007 19.3179 5.01237 18.243 3.41078 16.4836C1.80918 14.7242 0.946744 12.4155 1.00255 10.037C1.05835 7.65847 2.02811 5.3928 3.71045 3.71045C5.3928 2.02811 7.65847 1.05835 10.037 1.00255C12.4155 0.946744 14.7242 1.80918 16.4836 3.41078C18.243 5.01237 19.3179 7.23007 19.4852 9.60337C19.6525 11.9767 18.8993 14.3232 17.382 16.1558L22.7239 21.4977C22.8091 21.5771 22.8775 21.6729 22.9249 21.7793C22.9723 21.8858 22.9978 22.0006 22.9999 22.1171C23.0019 22.2336 22.9805 22.3493 22.9369 22.4574C22.8932 22.5654 22.8283 22.6635 22.7459 22.7459C22.6635 22.8283 22.5654 22.8932 22.4574 22.9369C22.3493 22.9805 22.2336 23.0019 22.1171 22.9999C22.0006 22.9978 21.8858 22.9723 21.7793 22.9249C21.6729 22.8775 21.5771 22.8091 21.4977 22.7239L16.1558 17.382ZM17.773 10.254C17.773 8.25989 16.9808 6.34742 15.5707 4.93735C14.1606 3.52728 12.2482 2.73511 10.254 2.73511C8.25989 2.73511 6.34742 3.52728 4.93735 4.93735C3.52728 6.34742 2.73511 8.25989 2.73511 10.254C2.73511 12.2482 3.52728 14.1606 4.93735 15.5707C6.34742 16.9808 8.25989 17.773 10.254 17.773C12.2482 17.773 14.1606 16.9808 15.5707 15.5707C16.9808 14.1606 17.773 12.2482 17.773 10.254Z"/></svg>',
  arrowFwd: '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" stroke="currentColor" stroke-width="0.2" d="M12.567 3.49983C12.7526 3.49116 12.9345 3.55733 13.0719 3.68244L21.3697 11.2596C21.473 11.353 21.5564 11.4673 21.6129 11.5946C21.6694 11.7218 21.6988 11.8596 21.6988 11.9989C21.6988 12.1381 21.6694 12.2759 21.6129 12.4031C21.5564 12.5304 21.4739 12.6447 21.3707 12.7381L21.3697 12.7371L13.0719 20.3143C12.9347 20.4394 12.7534 20.5044 12.568 20.4959C12.3825 20.4874 12.2077 20.4056 12.0826 20.2684C11.9577 20.1312 11.8924 19.9498 11.901 19.7645C11.9096 19.5791 11.9914 19.4051 12.1285 19.2801L19.3355 12.7H2.99961C2.8142 12.6999 2.63663 12.626 2.50547 12.4949C2.37419 12.3637 2.30039 12.1855 2.30039 11.9998C2.30044 11.8142 2.37423 11.6359 2.50547 11.5047C2.63662 11.3738 2.81428 11.2997 2.99961 11.2996H19.3385L12.1285 4.7176C11.9912 4.59249 11.9087 4.41784 11.9 4.23225C11.8915 4.04691 11.9568 3.86557 12.0816 3.72834C12.2067 3.59106 12.3815 3.50857 12.567 3.49983Z"/></svg>',
  dockDiscover: '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M5.59754 16.8262C5.39873 17.5784 5.50448 18.3791 5.89162 19.053C6.27876 19.7269 6.91572 20.219 7.66297 20.4216L15.6271 22.5779C15.9968 22.6781 16.3826 22.7039 16.7622 22.6539C17.1419 22.6039 17.508 22.4791 17.8396 22.2865C18.1712 22.094 18.4617 21.8375 18.6945 21.5318C18.9274 21.2262 19.0979 20.8773 19.1964 20.5052L22.9014 6.536C23.1007 5.78383 22.9954 4.98288 22.6085 4.30867C22.2216 3.63447 21.5847 3.142 20.8374 2.93919L12.8732 0.78286C12.5034 0.682437 12.1176 0.656424 11.7377 0.706312C11.3579 0.7562 10.9916 0.881008 10.6599 1.07358C10.3281 1.26615 10.0375 1.52269 9.80453 1.82848C9.57159 2.13428 9.40098 2.48332 9.30248 2.85557L5.59754 16.8262ZM8.03784 19.0045C7.66443 18.9028 7.34629 18.6565 7.15303 18.3194C6.95976 17.9824 6.90711 17.5821 7.00658 17.2061L10.7115 3.23696C10.7608 3.05101 10.846 2.87666 10.9624 2.72391C11.0788 2.57115 11.224 2.443 11.3897 2.34679C11.5555 2.25058 11.7384 2.18821 11.9282 2.16325C12.1179 2.13829 12.3107 2.15124 12.4954 2.20134L20.4611 4.35767C21.2385 4.56743 21.7009 5.37275 21.4938 6.15607L17.7888 20.1238C17.7398 20.31 17.6546 20.4847 17.5382 20.6377C17.4217 20.7907 17.2764 20.9191 17.1105 21.0155C16.9446 21.1119 16.7614 21.1743 16.5714 21.1993C16.3814 21.2242 16.1884 21.2112 16.0035 21.1609L8.03784 19.0045ZM4.04117 13.1033L2.09972 5.81869C1.89918 5.06725 2.00366 4.26648 2.39018 3.59251C2.77669 2.91854 3.41359 2.42657 4.16078 2.22481L4.27163 2.19547C4.1172 2.65177 4.03835 3.13048 4.03825 3.61249V3.8868C3.806 4.06279 3.63135 4.30458 3.53675 4.58112C3.44214 4.85765 3.43189 5.15632 3.5073 5.43876L4.03971 7.4352L4.04117 13.1033ZM5.49835 11.5073V3.61249C5.49835 2.8344 5.8057 2.08818 6.3528 1.53799C6.8999 0.987804 7.64192 0.678711 8.41563 0.678711H8.57024C8.35582 1.00289 8.18808 1.36815 8.08306 1.76568L7.96345 2.21748C7.67125 2.31329 7.4166 2.49948 7.23586 2.74947C7.05512 2.99946 6.95752 3.30047 6.95699 3.60955V6.00792L5.49835 11.5073ZM17.1675 6.54333C17.1675 6.93237 17.0138 7.30548 16.7402 7.58058C16.4667 7.85567 16.0957 8.01022 15.7088 8.01022C15.322 8.01022 14.951 7.85567 14.6774 7.58058C14.4039 7.30548 14.2502 6.93237 14.2502 6.54333C14.2502 6.15429 14.4039 5.78118 14.6774 5.50608C14.951 5.23099 15.322 5.07644 15.7088 5.07644C16.0957 5.07644 16.4667 5.23099 16.7402 5.50608C17.0138 5.78118 17.1675 6.15429 17.1675 6.54333ZM12.7915 18.2784C13.1784 18.2784 13.5494 18.1239 13.823 17.8488C14.0965 17.5737 14.2502 17.2006 14.2502 16.8115C14.2502 16.4225 14.0965 16.0494 13.823 15.7743C13.5494 15.4992 13.1784 15.3447 12.7915 15.3447C12.4047 15.3447 12.0337 15.4992 11.7601 15.7743C11.4866 16.0494 11.3329 16.4225 11.3329 16.8115C11.3329 17.2006 11.4866 17.5737 11.7601 17.8488C12.0337 18.1239 12.4047 18.2784 12.7915 18.2784Z"/></svg>',
  dockWatch: '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M12.75 7.75C12.75 7.55109 12.671 7.36032 12.5303 7.21967C12.3897 7.07902 12.1989 7 12 7C11.8011 7 11.6103 7.07902 11.4697 7.21967C11.329 7.36032 11.25 7.55109 11.25 7.75V11.25H7.75C7.55109 11.25 7.36032 11.329 7.21967 11.4697C7.07902 11.6103 7 11.8011 7 12C7 12.1989 7.07902 12.3897 7.21967 12.5303C7.36032 12.671 7.55109 12.75 7.75 12.75H11.25V16.25C11.25 16.4489 11.329 16.6397 11.4697 16.7803C11.6103 16.921 11.8011 17 12 17C12.1989 17 12.3897 16.921 12.5303 16.7803C12.671 16.6397 12.75 16.4489 12.75 16.25V12.75H16.25C16.4489 12.75 16.6397 12.671 16.7803 12.5303C16.921 12.3897 17 12.1989 17 12C17 11.8011 16.921 11.6103 16.7803 11.4697C16.6397 11.329 16.4489 11.25 16.25 11.25H12.75V7.75ZM22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C1.99792 13.5979 2.38035 15.1729 3.115 16.592L2.047 20.415C1.98743 20.6285 1.98568 20.8539 2.04193 21.0683C2.09818 21.2826 2.2104 21.4782 2.36711 21.6349C2.52382 21.7916 2.71937 21.9038 2.93372 21.9601C3.14808 22.0163 3.37354 22.0146 3.587 21.955L7.413 20.888C8.83082 21.6208 10.404 22.0022 12 22C17.523 22 22 17.523 22 12ZM3.5 12C3.50054 10.1347 4.11463 8.32141 5.24758 6.83963C6.38054 5.35784 7.96946 4.28988 9.76936 3.80037C11.5693 3.31087 13.4802 3.42702 15.2076 4.13091C16.935 4.83479 18.3828 6.08733 19.328 7.69542C20.2731 9.30351 20.6631 11.1778 20.4377 13.0295C20.2124 14.8811 19.3842 16.6071 18.0809 17.9416C16.7776 19.276 15.0715 20.1446 13.2257 20.4136C11.3799 20.6826 9.49693 20.337 7.867 19.43L7.597 19.28L3.611 20.391L4.724 16.407L4.573 16.137C3.86716 14.8726 3.4977 13.4481 3.5 12Z"/></svg>',
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
