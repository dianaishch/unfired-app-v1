/* The iPhone status bar (Figma "Status bar - iPhone", 402 x 62), drawn
   over every screen when the prototype runs in a frame or a desktop
   browser -- on a phone the real one is there. One bar for the whole app,
   on top of every layer; it can't be tapped. It's white over black and
   over photos, black over the light gradients (an idea's header, the
   piece cards), picked from what is actually under it, so it changes as
   a page scrolls or a layer opens. */
import { h } from './ui.js';

const SRC = { white: 'assets/system/Status%20bar%20white.png', black: 'assets/system/Status%20bar%20black.png' };

/* 0..1 lightness of a CSS colour, with its alpha */
const rgba = (s) => {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { l: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a };
};

/* what one element contributes at the bar: 'light', 'dark' or null (see-through) */
function tone(el) {
  if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || el.tagName === 'CANVAS') return 'dark';
  const cs = getComputedStyle(el);
  if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
  const bi = cs.backgroundImage;
  if (bi && bi !== 'none') {
    if (/url\(/.test(bi) && !/gradient/.test(bi)) return 'dark';
    const stops = (bi.match(/rgba?\([^)]+\)/g) || []).map(rgba).filter(c => c && c.a > 0.35);
    if (stops.length) return stops.reduce((s, c) => s + c.l, 0) / stops.length > 0.55 ? 'light' : 'dark';
  }
  const bg = rgba(cs.backgroundColor);
  if (bg && bg.a > 0.5) return bg.l > 0.55 ? 'light' : 'dark';
  return null;
}

export function mountSysbar(device) {
  const white = h('img', { class: 'sysbar', src: SRC.white, alt: '' });
  const black = h('img', { class: 'sysbar', src: SRC.black, alt: '' });
  black.hidden = true;
  device.append(white, black);

  /* the clock (left) and the icons (right) decide: light under both -> black */
  const pick = () => {
    if (!document.documentElement.classList.contains('with-sysbar')) return;
    const d = device.getBoundingClientRect();
    const y = d.top + 31;
    const light = [d.left + 64, d.right - 64].every(x => {
      for (const el of document.elementsFromPoint(x, y)) {
        if (!device.contains(el) || el === device) break;
        const t = tone(el);
        if (t) return t === 'light';
      }
      return false;
    });
    black.hidden = !light; white.hidden = light;
  };
  let last = 0;
  const loop = (t) => { if (t - last > 120) { last = t; pick(); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
