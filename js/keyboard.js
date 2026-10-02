/* iOS keyboard (Figma 590:8740 / 562:11197), built from real buttons.
   It types into whichever text field has focus (input, textarea or
   contenteditable) the way a real keyboard does, so the field's own
   handlers run. Letters; shift for one capital; delete (hold to repeat);
   space; return presses Enter on the field (it sends where the field sends,
   otherwise starts a new line); the ABC key switches to numbers and
   punctuation and back; the mic at the bottom calls onMic.
   keyboard() makes one; mountKeyboard() gives the whole app one that opens
   when a text field is tapped. */
import { h } from './ui.js';

const LETTERS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const NUMBERS = ['1234567890', '-/:;()$&@"', '.,?!\''];

const SHIFT_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 3.5 12.5H8v8h8v-8h4.5L12 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const SHIFT_ON_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 3.5 12.5H8v8h8v-8h4.5L12 3.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const DELETE_SVG = '<svg viewBox="0 0 28 24" fill="none"><path d="M9.5 5H24a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9.5L2.5 12l7-7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m13 9 6 6m0-6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const RETURN_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M20 5v6.5a2 2 0 0 1-2 2H5m0 0 4.5-4.5M5 13.5 9.5 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* Figma's own exports */
const EMOJI_SVG = '<svg viewBox="0 0 26.92 26.92" fill="none"><path fill="currentColor" d="M13.45 18.39C11.34 18.39 9.1 18.09 7.06 17.57C6.68 16.99 6.4 16.37 6.27 15.74C8.42 16.35 10.92 16.77 13.46 16.77C16 16.77 18.5 16.35 20.66 15.74C20.51 16.37 20.24 16.99 19.87 17.57C17.83 18.08 15.59 18.39 13.46 18.39H13.45ZM13.45 22.46C17.97 22.46 21.6 19.14 22.1 15.2C22.21 14.41 21.69 14.05 20.99 14.25C18.45 15 16.07 15.42 13.45 15.42C10.83 15.42 8.47 15 5.92 14.25C5.22 14.05 4.71 14.41 4.81 15.2C5.3 19.14 8.92 22.46 13.45 22.46ZM17.35 12.28C18.18 12.28 18.92 11.53 18.92 10.47C18.92 9.41 18.18 8.65 17.35 8.65C16.52 8.65 15.79 9.41 15.79 10.47C15.79 11.53 16.52 12.28 17.35 12.28ZM9.53 12.28C10.37 12.28 11.11 11.53 11.11 10.47C11.11 9.41 10.37 8.65 9.53 8.65C8.69 8.65 7.99 9.41 7.99 10.47C7.99 11.53 8.7 12.28 9.53 12.28ZM13.46 24.63C7.26 24.63 2.29 19.66 2.29 13.45C2.29 7.24 7.25 2.28 13.45 2.28C19.65 2.28 24.64 7.25 24.64 13.46C24.64 19.67 19.67 24.64 13.46 24.64V24.63ZM13.46 26.91C20.82 26.91 26.92 20.81 26.92 13.45C26.92 6.09 20.82 0 13.45 0C6.08 0 0 6.1 0 13.46C0 20.82 6.1 26.92 13.46 26.92V26.91Z"/></svg>';
const MIC_SVG = '<svg viewBox="0 0 18.8657 28.2129" fill="none"><path fill="currentColor" d="M0 13.9351V11.2588C0 10.9863 0.0966797 10.7534 0.290039 10.5601C0.483398 10.3667 0.716309 10.27 0.98877 10.27C1.27002 10.27 1.50732 10.3667 1.70068 10.5601C1.89404 10.7534 1.99072 10.9863 1.99072 11.2588V13.856C1.99072 15.3501 2.29834 16.6597 2.91357 17.7847C3.52881 18.9097 4.39453 19.7842 5.51074 20.4082C6.62695 21.0234 7.93652 21.3311 9.43945 21.3311C10.9424 21.3311 12.2476 21.0234 13.355 20.4082C14.4712 19.7842 15.3369 18.9097 15.9521 17.7847C16.5674 16.6597 16.875 15.3501 16.875 13.856V11.2588C16.875 10.9863 16.9717 10.7534 17.165 10.5601C17.3584 10.3667 17.5957 10.27 17.877 10.27C18.1494 10.27 18.3823 10.3667 18.5757 10.5601C18.769 10.7534 18.8657 10.9863 18.8657 11.2588V13.9351C18.8657 15.6577 18.5098 17.187 17.7979 18.5229C17.0947 19.8589 16.1104 20.9312 14.8447 21.7397C13.5791 22.5396 12.1069 23.0098 10.4282 23.1504V26.2222H15.3193C15.6006 26.2222 15.8379 26.3188 16.0312 26.5122C16.2246 26.7056 16.3213 26.9429 16.3213 27.2241C16.3213 27.4966 16.2246 27.7295 16.0312 27.9229C15.8379 28.1162 15.6006 28.2129 15.3193 28.2129H3.54639C3.26514 28.2129 3.02783 28.1162 2.83447 27.9229C2.64111 27.7295 2.54443 27.4966 2.54443 27.2241C2.54443 26.9429 2.64111 26.7056 2.83447 26.5122C3.02783 26.3188 3.26514 26.2222 3.54639 26.2222H8.4375V23.1504C6.75879 23.0098 5.28662 22.5396 4.021 21.7397C2.75537 20.9312 1.7666 19.8589 1.05469 18.5229C0.351562 17.187 0 15.6577 0 13.9351ZM4.64062 13.4604V5.16797C4.64062 4.15723 4.84277 3.26514 5.24707 2.4917C5.65137 1.70947 6.21387 1.09863 6.93457 0.65918C7.65527 0.219727 8.49023 0 9.43945 0C10.3799 0 11.2104 0.219727 11.9312 0.65918C12.6519 1.09863 13.2144 1.70947 13.6187 2.4917C14.0229 3.26514 14.2251 4.15723 14.2251 5.16797V13.4604C14.2251 14.4712 14.0229 15.3677 13.6187 16.1499C13.2144 16.9233 12.6519 17.5298 11.9312 17.9692C11.2104 18.4087 10.3799 18.6284 9.43945 18.6284C8.49023 18.6284 7.65527 18.4087 6.93457 17.9692C6.21387 17.5298 5.65137 16.9233 5.24707 16.1499C4.84277 15.3677 4.64062 14.4712 4.64062 13.4604ZM6.63135 13.4604C6.63135 14.436 6.88623 15.2139 7.396 15.7939C7.91455 16.374 8.5957 16.6641 9.43945 16.6641C10.2832 16.6641 10.96 16.374 11.4697 15.7939C11.9795 15.2139 12.2344 14.436 12.2344 13.4604V5.16797C12.2344 4.19238 11.9795 3.41455 11.4697 2.83447C10.96 2.25439 10.2832 1.96436 9.43945 1.96436C8.5957 1.96436 7.91455 2.25439 7.396 2.83447C6.88623 3.41455 6.63135 4.19238 6.63135 5.16797V13.4604Z"/></svg>';

export function keyboard({ onMic } = {}) {
  let numbers = false, shift = false;
  const keys = h('div', { class: 'kb-keys' });
  const el = h('div', { class: 'chx-kb', role: 'group', 'aria-label': 'Keyboard' },
    h('div', { class: 'kb' }, keys,
      h('div', { class: 'kb-foot' },
        h('button', { class: 'kb-icon', type: 'button', tabindex: '-1', html: EMOJI_SVG, 'aria-label': 'Emoji' }),
        press(h('button', { class: 'kb-icon', type: 'button', tabindex: '-1', html: MIC_SVG, 'aria-label': 'Dictate' }), () => onMic && onMic()))));

  const field = () => (isEditable(document.activeElement) ? document.activeElement : null);
  const type = (t) => { if (field()) document.execCommand('insertText', false, t); };
  const del = () => { if (field()) document.execCommand('delete'); };
  const ret = () => {
    const f = field(); if (!f) return;
    const go = f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
    if (go && f.tagName !== 'INPUT') document.execCommand(f.isContentEditable ? 'insertLineBreak' : 'insertText', false, '\n');
  };

  /* a key: acts on press (so the field keeps focus), lights up while held */
  function press(btn, fn, repeat = false) {
    let t1, t2;
    const up = () => { btn.classList.remove('down'); clearTimeout(t1); clearInterval(t2); };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('down');
      fn();
      if (repeat) t1 = setTimeout(() => { t2 = setInterval(fn, 80); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, up));
    return btn;
  }
  const key = (label, cls, fn, opts = {}) => press(h('button', { class: 'kb-k ' + (cls || ''), type: 'button', tabindex: '-1',
    'aria-label': opts.aria || label, html: opts.html || null }, opts.html ? null : label), fn, opts.repeat);

  const paint = () => {
    const rows = numbers ? NUMBERS : LETTERS;
    const letter = (c) => key(shift && !numbers ? c.toUpperCase() : c, '', () => {
      type(shift && !numbers ? c.toUpperCase() : c);
      if (shift) { shift = false; paint(); }
    });
    keys.replaceChildren(
      h('div', { class: 'kb-row' }, ...[...rows[0]].map(letter)),
      h('div', { class: 'kb-row' + (numbers ? '' : ' in') }, ...[...rows[1]].map(letter)),
      h('div', { class: 'kb-row third' },
        numbers ? key('#+=', 'mod', () => {})
          : key('', 'mod' + (shift ? ' on' : ''), () => { shift = !shift; paint(); }, { html: shift ? SHIFT_ON_SVG : SHIFT_SVG, aria: 'Shift' }),
        h('div', { class: 'kb-mid' + (numbers ? ' wide' : '') }, ...[...rows[2]].map(letter)),
        key('', 'mod del', del, { html: DELETE_SVG, aria: 'Delete', repeat: true })),
      h('div', { class: 'kb-row' },
        key(numbers ? 'abc' : 'ABC', 'mod switch', () => { numbers = !numbers; shift = false; paint(); },
          { aria: numbers ? 'Letters' : 'Numbers and punctuation' }),
        key('', 'space', () => type(' '), { aria: 'Space' }),
        key('', 'ret', ret, { html: RETURN_SVG, aria: 'Return' })));
  };
  paint();
  return el;
}

export const isEditable = (el) => !!el && (el.isContentEditable || el.tagName === 'TEXTAREA' ||
  (el.tagName === 'INPUT' && /^(text|search|email|url|tel|number|password|)$/.test(el.type || '')));

/* The app's keyboard: slides up when a text field inside #device gets
   focus, goes away when none has it. Like iOS, the screen above shrinks
   (#device.kb-open, see app.css). The fields get inputmode="none" so a real
   phone doesn't open its own keyboard on top. The mic presses the screen's
   own voice button, where it has one. */
let setApp = null;
/* open the app's keyboard now (a chat opens with it up) */
export const showKeyboard = () => setApp && setApp(true);

/* Keep the field you're typing in visible above the keyboard: scroll its
   page so the caret (or the field, when there's no caret yet) sits clear of
   the bottom edge -- with room for a floating bottom bar -- and below a
   floating header. Fields that aren't in a scrolling page (the chat's input
   bar) are already above the keyboard. */
const scroller = (el) => {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
};
function reveal(el, smooth = true) {
  const box = el && scroller(el);
  if (!box) return;
  let r = null;
  const sel = window.getSelection();
  if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
    const rr = sel.getRangeAt(0).getBoundingClientRect();
    if (rr.height) r = rr;
  }
  if (!r) {
    const fr = el.getBoundingClientRect();
    /* a tall field: aim for its first lines, not its far end */
    r = { top: fr.top, bottom: Math.min(fr.bottom, fr.top + 120) };
  }
  const b = box.getBoundingClientRect();
  const page = box.closest('.layer') || box.parentElement;
  const bar = page.querySelector('.card-bar, .pe-bottom, .rtp-bottombar');
  const bottomRoom = (bar ? bar.offsetHeight : 0) + 24;
  const topRoom = 80;
  let d = 0;
  if (r.bottom > b.bottom - bottomRoom) d = r.bottom - (b.bottom - bottomRoom);
  else if (r.top < b.top + topRoom) d = r.top - (b.top + topRoom);
  if (d) box.scrollBy({ top: d, behavior: smooth ? 'smooth' : 'auto' });
}

export function mountKeyboard(device) {
  const kb = keyboard({ onMic: () => {
    const scope = [...document.querySelectorAll('#layers .layer')].pop() || device;
    const mic = scope.querySelector('button[aria-label="Voice"], button[aria-label="Stop"]');
    if (mic) mic.click();
  } });
  kb.classList.add('app-kb');
  device.append(kb);
  const set = (on) => {
    const opening = on && !kb.classList.contains('open');
    kb.classList.toggle('open', on); device.classList.toggle('kb-open', on);
    /* once the screen has shrunk for the keyboard (.28s), bring the field
       into view; at once if the keyboard was already up */
    if (on) setTimeout(() => reveal(document.activeElement), opening ? 320 : 0);
  };
  /* typing (a longer note, a new line) keeps the caret in view */
  device.addEventListener('input', (e) => { if (kb.classList.contains('open')) reveal(e.target, false); });
  setApp = set;
  device.addEventListener('focusin', (e) => {
    if (!isEditable(e.target) || kb.contains(e.target)) return;
    e.target.setAttribute('inputmode', 'none');
    set(true);
  });
  /* Tapping a button (a suggested question, an answer tag) takes the focus
     from the field. Closing the keyboard right then would move the screen
     under your finger and the tap would miss, so while the finger is down
     the keyboard waits; it closes once the tap has landed (the click
     handler below, or on release). */
  let pressing = false;
  device.addEventListener('pointerdown', (e) => { if (!kb.contains(e.target)) pressing = true; }, true);
  const release = () => {
    if (!pressing) return;
    pressing = false;
    setTimeout(() => set(isEditable(document.activeElement)), 0);
  };
  ['pointerup', 'pointercancel'].forEach(ev => window.addEventListener(ev, release, true));
  device.addEventListener('focusout', () => setTimeout(() => { if (!pressing) set(isEditable(document.activeElement)); }, 0));
  /* also on the tap itself (some screens focus their field from a tap on a
     larger area, and focus events don't always fire) */
  device.addEventListener('click', (e) => {
    if (kb.contains(e.target)) return;
    setTimeout(() => {
      const f = document.activeElement;
      if (isEditable(f) && device.contains(f)) { f.setAttribute('inputmode', 'none'); set(true); }
      else set(false);
    }, 0);
  });
  return kb;
}
