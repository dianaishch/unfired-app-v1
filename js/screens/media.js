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
/* camera options (Figma 589:8449): close, switch camera, flash off / on */
const X24_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M5.42 5.42a.9.9 0 0 1 1.27 0L12 10.73l5.3-5.3a.9.9 0 1 1 1.28 1.27L13.27 12l5.3 5.3a.9.9 0 1 1-1.27 1.28L12 13.27l-5.3 5.3a.9.9 0 1 1-1.28-1.27L10.73 12l-5.3-5.3a.9.9 0 0 1 0-1.28Z"/></svg>';
const FLIP_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M16.25 5.18C16.1295 5.33821 16.0767 5.53781 16.1034 5.7349C16.13 5.932 16.2338 6.11045 16.392 6.231C17.5451 7.10917 18.4086 8.31276 18.871 9.68645C19.3333 11.0601 19.3734 12.5409 18.986 13.9376C18.5987 15.3343 17.8016 16.5828 16.6977 17.5221C15.5938 18.4614 14.2337 19.0483 12.793 19.207L13.47 18.53C13.6042 18.3962 13.6827 18.2165 13.6899 18.0271C13.697 17.8377 13.6322 17.6527 13.5084 17.5092C13.3846 17.3656 13.2111 17.2743 13.0227 17.2535C12.8344 17.2327 12.6451 17.2839 12.493 17.397L12.409 17.47L10.409 19.47C10.282 19.597 10.2048 19.7653 10.1914 19.9445C10.178 20.1236 10.2293 20.3015 10.336 20.446L10.409 20.53L12.409 22.53C12.543 22.663 12.7222 22.7405 12.9109 22.7471C13.0995 22.7538 13.2837 22.689 13.4268 22.5658C13.5698 22.4426 13.6611 22.27 13.6824 22.0825C13.7038 21.8949 13.6537 21.7062 13.542 21.554L13.47 21.47L12.72 20.72C14.4831 20.574 16.1605 19.897 17.531 18.7783C18.9015 17.6596 19.9007 16.1518 20.3968 14.4536C20.8929 12.7555 20.8626 10.9469 20.3099 9.26633C19.7573 7.58577 18.7082 6.1122 17.301 5.04C17.1429 4.91937 16.9434 4.86646 16.7463 4.8929C16.5492 4.91934 16.3707 5.02297 16.25 5.181M10.53 1.471C10.3895 1.61163 10.3107 1.80225 10.3107 2.001C10.3107 2.19975 10.3895 2.39037 10.53 2.531L11.28 3.281C9.54529 3.42389 7.89262 4.08091 6.53328 5.16803C5.17395 6.25516 4.16973 7.723 3.64903 9.38388C3.12833 11.0448 3.11481 12.8232 3.61019 14.4918C4.10558 16.1604 5.08736 17.6433 6.43 18.751C6.50597 18.8138 6.59356 18.861 6.68777 18.8899C6.78198 18.9188 6.88096 18.9289 6.97906 18.9196C7.07717 18.9102 7.17248 18.8817 7.25954 18.8355C7.34661 18.7893 7.42373 18.7265 7.4865 18.6505C7.54927 18.5745 7.59647 18.4869 7.62539 18.3927C7.65431 18.2985 7.66439 18.1995 7.65506 18.1014C7.64573 18.0033 7.61716 17.908 7.571 17.821C7.52483 17.7339 7.46197 17.6568 7.386 17.594C6.28671 16.6869 5.47913 15.4759 5.06417 14.1124C4.64921 12.7489 4.64527 11.2934 5.05285 9.92769C5.46043 8.56197 6.26145 7.34666 7.35582 6.43361C8.45018 5.52056 9.78936 4.95027 11.206 4.794L10.53 5.471C10.4584 5.54022 10.4013 5.623 10.362 5.71453C10.3228 5.80605 10.3021 5.90447 10.3013 6.00406C10.3005 6.10364 10.3195 6.20239 10.3573 6.29454C10.395 6.3867 10.4508 6.47041 10.5212 6.5408C10.5917 6.61118 10.6754 6.66683 10.7676 6.7045C10.8598 6.74217 10.9586 6.7611 11.0582 6.76019C11.1577 6.75927 11.2561 6.73854 11.3476 6.69919C11.4391 6.65984 11.5218 6.60266 11.591 6.531L13.591 4.531C13.7315 4.39037 13.8103 4.19975 13.8103 4.001C13.8103 3.80225 13.7315 3.61163 13.591 3.471L11.591 1.471C11.4504 1.33055 11.2598 1.25166 11.061 1.25166C10.8622 1.25166 10.6716 1.33055 10.531 1.471"/></svg>';
const FLASH_OFF_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M11.4123 15.6549L9.75 21.75L13.4949 17.7376M9.25736 13.5H3.75L6.40873 10.6514M8.4569 8.4569L14.25 2.25L12 10.5H20.25L15.5431 15.5431M8.4569 8.4569L3 3M8.4569 8.4569L15.5431 15.5431M15.5431 15.5431L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FLASH_ON_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M3.75 13.5L14.25 2.25L12 10.5H20.25L9.75 21.75L12 13.5H3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 12 12"><path fill="currentColor" d="M3 1.8v8.4c0 .4.4.6.8.4l6.6-4.2c.3-.2.3-.6 0-.8L3.8 1.4c-.4-.2-.8 0-.8.4Z"/></svg>';

/* the phone frame the flow draws into: the layer the anchor lives in */
const hostOf = (el) => el.closest('.layer') || document.getElementById('device');
/* the device frame can be scaled on desktop -- convert screen px to CSS px */
const scaleOf = (host) => host.getBoundingClientRect().width / host.offsetWidth || 1;

export function mediaPicker({ anchor, align = null, onPick }) {
  popMenu({ anchor, align, items: [
    ['Take a video', (host) => openCamera(host, onPick, true)],
    ['Take a picture', (host) => openCamera(host, onPick)],
    ['Upload from device', (host) => openGallery(host, onPick)],
  ] });
}

/* The dropdown itself, shared with the piece card's "···" menu: a 240px
   dark box of bold uppercase rows, 12px from the button that opened it --
   above it (the Log screen's "+"), or below (below: true, right-aligned
   with the button, for buttons at the top of the screen). A tap outside
   closes it. items: [[label, fn(host), done?], ...] */
export function popMenu({ anchor, align = null, below = false, items }) {
  const host = hostOf(anchor);
  const k = scaleOf(host);
  const hr = host.getBoundingClientRect();
  const ar = anchor.getBoundingClientRect();

  const catcher = h('div', { class: 'mp-catch' });
  const pop = h('div', { class: 'mp-pop' + (below ? ' below' : '') },
    ...items.map(([label, fn, done]) => h('button', { onclick: (e) => {
      /* done: a word the row shows for a moment before the menu closes
         (COPY LINK -> COPIED), for actions with nothing else to see */
      if (!done) { dismiss(); fn(host); return; }
      fn(host); e.currentTarget.textContent = done; setTimeout(dismiss, 700);
    } }, label)));
  if (below) {
    pop.style.top = (ar.bottom - hr.top) / k + 12 + 'px';
    pop.style.right = (hr.right - ar.right) / k + 'px';
  } else {
    pop.style.bottom = (hr.bottom - ar.top) / k + 12 + 'px';
    if (align) pop.style.right = (hr.right - align.getBoundingClientRect().right) / k + 'px';
    else pop.style.left = (ar.left - hr.left) / k + 'px';
  }

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
/* straight to the gallery, no dropdown (the card-fill photo slot) */
export const openGalleryFor = (anchor, onPick) => openGallery(hostOf(anchor), onPick);

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

/* Camera: the viewfinder fills the panel. Photo: the shutter "takes" the
   frame. Video: the shutter starts recording (orange square + timer), a
   second tap stops and adds the clip (the frame stands in for it). "···"
   opens switch camera and flash above it (Figma 589:8449), and turns
   into x to close them. */
function openCamera(host, onPick, video = false) {
  const shot = GALLERY[0].src;
  panel(host, 'mp-camera', (p, close) => {
    const view = h('div', { class: 'mp-view' }, img(shot, ''));
    const timer = h('div', { class: 'mp-timer', hidden: true }, '0:00');
    let rec = null, secs = 0;
    const shutter = h('button', { class: 'mp-shutter' + (video ? ' video' : ''),
      'aria-label': video ? 'Record' : 'Take picture', onclick: () => {
      if (!video) {
        view.classList.add('flash');
        setTimeout(() => { onPick(shot, 'process', { video: false }); close(); }, 180);
        return;
      }
      if (!rec) {
        shutter.classList.add('rec'); timer.hidden = false; secs = 0; timer.textContent = '0:00';
        rec = setInterval(() => { secs++; timer.textContent = `0:${String(secs).padStart(2, '0')}`; }, 1000);
      } else {
        clearInterval(rec); rec = null;
        onPick(shot, 'process', { video: true, length: `0:${String(Math.max(1, secs)).padStart(2, '0')}` });
        close();
      }
    } }, h('i'));

    let flash = false;
    const flashBtn = roundBtn(FLASH_OFF_SVG, 'Flash off', () => {
      flash = !flash;
      flashBtn.innerHTML = flash ? FLASH_ON_SVG : FLASH_OFF_SVG;
      flashBtn.setAttribute('aria-label', flash ? 'Flash on' : 'Flash off');
    });
    const flipBtn = roundBtn(FLIP_SVG, 'Switch camera', () => {
      view.classList.remove('flip'); void view.offsetWidth; view.classList.add('flip');
    });
    const extra = h('div', { class: 'mp-extra' }, flipBtn, flashBtn);
    const more = roundBtn(DOTS24_SVG, 'Camera options', () => {
      const open = !extra.classList.contains('in');
      extra.classList.toggle('in', open);
      more.innerHTML = open ? X24_SVG : DOTS24_SVG;
      more.setAttribute('aria-label', open ? 'Close camera options' : 'Camera options');
    });
    const back = roundBtn(BACK24_SVG, 'Back', () => { clearInterval(rec); close(); });
    p.append(view, timer, extra, h('div', { class: 'mp-bar end' }, back, shutter, more));
  });
}
