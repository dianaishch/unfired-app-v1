/* Add-media flow shared by the Log screen, piece cards and the live activity.
   Figma 540:21475 (source popover), 540:21528 / 540:21986 (gallery, with a
   pick), 540:21599 (camera). The "+" opens a small popover -- TAKE A PICTURE
   / UPLOAD FROM DEVICE -- and each opens a rounded panel over the bottom of
   the screen it was opened from. Videos live in the gallery with the photos;
   there's no separate video control.

   mediaPicker({ anchor, align, onPick })
     anchor  the "+" button; the popover sits 12px above it
     align   element whose right edge the popover lines up with (default:
             the anchor's left edge instead)
     onPick(src, guess, { video }) once per picked item */
import { h, img } from '../ui.js';
import { GALLERY } from '../seed.js';

export const BACK16_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M10 3.33333L5.33333 8L10 12.6667" stroke="currentColor" stroke-width="1.13333" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const DOTS16_SVG = '<svg viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>';
const BACK24_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DOTS24_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M7.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm6 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 12 12"><path fill="currentColor" d="M3 1.8v8.4c0 .4.4.6.8.4l6.6-4.2c.3-.2.3-.6 0-.8L3.8 1.4c-.4-.2-.8 0-.8.4Z"/></svg>';

/* the phone frame the flow draws into: the layer the anchor lives in */
const hostOf = (el) => el.closest('.layer') || document.getElementById('device');
/* the device frame can be scaled on desktop -- convert screen px to CSS px */
const scaleOf = (host) => host.getBoundingClientRect().width / host.offsetWidth || 1;

export function mediaPicker({ anchor, align = null, onPick }) {
  const host = hostOf(anchor);
  const k = scaleOf(host);
  const hr = host.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();

  const catcher = h('div', { class: 'mp-catch' });
  const pop = h('div', { class: 'mp-pop' },
    h('button', { onclick: () => { dismiss(); openCamera(host, onPick); } }, 'Take a picture'),
    h('button', { onclick: () => { dismiss(); openGallery(host, onPick); } }, 'Upload from device'));
  pop.style.bottom = (hr.bottom - ar.top) / k + 12 + 'px';
  if (align) pop.style.right = (hr.right - align.getBoundingClientRect().right) / k + 'px';
  else pop.style.left = (ar.left - hr.left) / k + 'px';

  const dismiss = () => { catcher.remove(); pop.classList.remove('in'); setTimeout(() => pop.remove(), 180); };
  catcher.addEventListener('click', dismiss);
  host.append(catcher, pop);
  requestAnimationFrame(() => pop.classList.add('in'));
}

/* Rounded panel over the bottom of the host (8px inset, 505px tall). A tap
   above it closes it, like the popover. */
function panel(host, cls, build) {
  const catcher = h('div', { class: 'mp-catch' });
  const p = h('div', { class: 'mp-panel ' + cls });
  const close = () => {
    catcher.remove(); p.classList.remove('in');
    setTimeout(() => p.remove(), 320);
  };
  catcher.addEventListener('click', close);
  build(p, close);
  host.append(catcher, p);
  requestAnimationFrame(() => p.classList.add('in'));
  return close;
}

const roundBtn = (svg, label, onclick) =>
  h('button', { class: 'mp-round', html: svg, 'aria-label': label, onclick });

/* Gallery: 3-up grid, tap to pick (numbered orange badge, in pick order).
   The pill reads ALL PHOTOS (the real library, via the file input) until
   something's picked, then ADD N PHOTOS / VIDEOS in orange. */
function openGallery(host, onPick) {
  const picked = [];
  panel(host, 'mp-gallery', (p, close) => {
    const grid = h('div', { class: 'mp-grid' });
    const pill = h('button', { class: 'mp-pill' });
    const file = h('input', { type: 'file', accept: 'image/*,video/*', multiple: true, hidden: true });

    const paint = () => {
      tiles.forEach(({ el, item }) => {
        const n = picked.indexOf(item);
        el.classList.toggle('on', n >= 0);
        el.querySelector('.mp-badge').textContent = n >= 0 ? n + 1 : '';
      });
      const n = picked.length;
      const noun = picked.every(x => x.video) ? 'video' : picked.some(x => x.video) ? 'item' : 'photo';
      pill.textContent = n ? `Add ${n} ${noun}${n > 1 ? 's' : ''}` : 'All photos';
      pill.classList.toggle('accent', n > 0);
    };
    const tiles = GALLERY.map(item => {
      const el = h('button', { class: 'mp-tile', onclick: () => {
        const i = picked.indexOf(item);
        i >= 0 ? picked.splice(i, 1) : picked.push(item);
        paint();
      } }, img(item.src, ''),
        item.video ? h('span', { class: 'mp-dur' }, h('i', { html: PLAY_SVG }), item.video) : null,
        h('span', { class: 'mp-badge' }));
      grid.append(el);
      return { el, item };
    });

    pill.addEventListener('click', () => {
      if (!picked.length) return file.click();
      picked.forEach(x => onPick(x.src, x.guess, { video: !!x.video }));
      close();
    });
    file.addEventListener('change', () => {
      [...file.files].forEach(f => onPick(URL.createObjectURL(f), null, { video: f.type.startsWith('video') }));
      close();
    });

    p.append(h('div', { class: 'mp-scroll' }, grid), h('div', { class: 'mp-bar' }, roundBtn(BACK24_SVG, 'Back', close), pill), file);
    paint();
  });
}

/* Camera: the viewfinder fills the panel; the shutter "takes" the frame. */
function openCamera(host, onPick) {
  const shot = GALLERY[0].src;
  panel(host, 'mp-camera', (p, close) => {
    const view = h('div', { class: 'mp-view' }, img(shot, ''));
    const shutter = h('button', { class: 'mp-shutter', 'aria-label': 'Take picture', onclick: () => {
      view.classList.add('flash');
      setTimeout(() => { onPick(shot, 'process', { video: false }); close(); }, 180);
    } }, h('i'));
    p.append(view, h('div', { class: 'mp-bar end' },
      roundBtn(BACK24_SVG, 'Back', close), shutter, roundBtn(DOTS24_SVG, 'Camera options', () => {})));
  });
}
