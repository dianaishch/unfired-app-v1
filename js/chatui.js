/* The chat screen (Figma 562:11117), shared by the app (card.js openChat)
   and the dev page (chat.js): the floating header (back, status line +
   title), the conversation anchored to the bottom (your bubble on paper,
   the AI's on the piece's gradient -- the same one as the card header and
   PLAN box -- both hugging their text, max 80% of the screen), and the
   input bar (Figma 590:8730) with "+" and the mic working like the Log
   screen's, the voice transcript going into the field.
   chatView() returns the element and the calls to fill it; onSend(text,
   photos) is called when you send. ownKeyboard: the dev page brings its
   own iOS keyboard; in the app the shared one (keyboard.js) opens when the
   field gets focus. */
import { h, img, statusBar, pblur } from './ui.js';
import { BACK16_SVG, DOTS16_SVG, mediaPicker, popMenu } from './screens/media.js';
import { PLUS24_SVG } from './screens/card.js';
import { MIC_SVG, STOP_SVG, CLOSE_SVG, PLAY_SVG, SAMPLES } from './screens/capture.js';
import { keyboard, showKeyboard } from './keyboard.js';

export function chatView({ status = '', title = '', glow = '#dab4ff', onBack, onSend, onDelete, ownKeyboard = false }) {
  const list = h('div', { class: 'chx-list' });
  const inner = h('div', { class: 'chx-inner' });
  list.append(inner);

  const photoTiles = (photos) => h('div', { class: 'chx-sent' }, ...photos.map(a =>
    h('div', { class: 'att' }, h('div', { class: 'ph' }, img(a.src, '')),
      a.video ? h('span', { class: 'vid', html: PLAY_SVG }) : null)));
  const bubble = (role, text, { photos = [], src } = {}) => {
    const b = h('div', { class: 'chx-b ' + role }, h('p', {}, text));
    if (role === 'ai') b.style.background = `linear-gradient(0deg, var(--paper) 6.25%, ${glow} 100%)`;
    if (src) b.append(h('div', { class: 'chx-src' }, src === 'archive' ? 'Your archive' : 'Ceramic reference'));
    const row = h('div', { class: 'chx-row ' + role });
    if (photos.length) row.append(photoTiles(photos));
    if (text) row.append(b);
    return row;
  };

  /* stay at the end while things change size -- the keyboard sliding open,
     widget images loading, the field growing -- unless you scrolled up */
  const scrollDown = () => requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  let stick = true;
  const userScroll = () => requestAnimationFrame(() => { stick = list.scrollHeight - list.scrollTop - list.clientHeight < 24; });
  ['wheel', 'touchmove', 'keydown'].forEach(ev => list.addEventListener(ev, userScroll, { passive: true }));
  new ResizeObserver(() => { if (stick) list.scrollTop = list.scrollHeight; }).observe(list);
  new ResizeObserver(() => { if (stick) list.scrollTop = list.scrollHeight; }).observe(inner);
  const add = (el) => { inner.append(el); stick = true; scrollDown(); return el; };

  const view = {
    /* a message; returns its text node so a widget can keep it live */
    say(role, text, opts) { return add(bubble(role, text, opts)).querySelector('p'); },
    /* a system line ("Added to Pink Pitcher") */
    sys(text, { intro } = {}) { add(h('div', { class: 'chx-sys' + (intro ? ' intro' : '') }, text)); },
    /* the AI is typing; returns a function that removes the dots */
    typing() {
      const row = add(h('div', { class: 'chx-row ai' }, h('div', { class: 'chx-b ai chx-typing',
        style: { background: `linear-gradient(0deg, var(--paper) 6.25%, ${glow} 100%)` } },
        h('div', { class: 'typing' }, h('i'), h('i'), h('i')))));
      return () => row.remove();
    },
    /* a box under the latest message for a widget */
    widget() { return add(h('div', { class: 'chx-widget' })); },
    /* an action pill on the right, under the latest message */
    pill(label, onclick) {
      const btn = h('button', { class: 'chx-pill', type: 'button', onclick: () => onclick(btn) }, label);
      add(h('div', { class: 'chx-act' }, btn));
      return btn;
    },
    /* an action pill turns into your message: the pill goes, your bubble
       appears, then (dev page) the AI answers */
    act(btn, text, reply) {
      (btn.closest('.chx-act') || btn).remove();
      view.say('me', text);
      if (reply) { const done = view.typing(); setTimeout(() => { done(); view.say('ai', reply); }, 600); }
    },
    setHead(s, t) { statusEl.textContent = s; titleEl.textContent = t; },
    /* focus the field; in the app the shared keyboard comes up with it */
    focus() { input.focus({ preventScroll: true }); if (!ownKeyboard) showKeyboard(); },
  };

  /* input bar: a textarea, so long messages wrap -- one line is the 58px
     pill, more lines grow it upward (up to 4, then it scrolls) */
  const input = h('textarea', { class: 'chx-field', rows: 1, placeholder: 'Ask unfired', 'aria-label': 'Ask unfired',
    inputmode: 'none', autocomplete: 'off', spellcheck: 'false' });
  const ask = h('label', { class: 'chx-ask' }, input);
  const grow = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 72) + 'px';
    ask.classList.toggle('multi', input.scrollHeight > 20);
  };
  input.addEventListener('input', grow);
  let attachments = [];
  const attRow = h('div', { class: 'attachrow chx-att' });
  const paintAtt = () => {
    attRow.replaceChildren(...attachments.map((a, i) =>
      h('div', { class: 'att' }, h('div', { class: 'ph' }, img(a.src, '')),
        a.video ? h('span', { class: 'vid', html: PLAY_SVG }) : null,
        h('button', { class: 'x', type: 'button', html: CLOSE_SVG, 'aria-label': 'Remove',
          onclick: () => { attachments.splice(i, 1); paintAtt(); } }))));
    attRow.hidden = !attachments.length;
  };
  const send = () => {
    stopRec();
    const text = input.value.trim();
    if (!text && !attachments.length) return;
    const photos = attachments;
    input.value = ''; attachments = []; paintAtt(); grow();
    onSend ? onSend(text, photos) : view.say('me', text, { photos });
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });

  const plus = h('button', { class: 'chx-round big', type: 'button', html: PLUS24_SVG, 'aria-label': 'Add photo or video' });
  const mic = h('button', { class: 'mic', type: 'button', html: MIC_SVG, 'aria-label': 'Voice' });
  const media = h('div', { class: 'chx-media' }, plus, mic);
  plus.addEventListener('click', () => mediaPicker({ anchor: plus, align: media,
    onPick: (src, guess, { video } = {}) => { attachments.push({ src, video: !!video }); paintAtt(); } }));

  let rec = null;
  const stopRec = () => {
    if (!rec) return;
    clearInterval(rec); rec = null;
    mic.classList.remove('rec'); mic.innerHTML = MIC_SVG; mic.setAttribute('aria-label', 'Voice');
  };
  mic.addEventListener('click', () => {
    if (rec) return stopRec();
    const base = input.value.trim();
    const words = SAMPLES[Math.floor(Math.random() * SAMPLES.length)].split(' ');
    let i = 0;
    mic.classList.add('rec'); mic.innerHTML = STOP_SVG; mic.setAttribute('aria-label', 'Stop');
    rec = setInterval(() => {
      if (i >= words.length) return stopRec();
      input.value = (base ? base + ' ' : '') + words.slice(0, ++i).join(' ');
      grow(); input.scrollTop = input.scrollHeight;
    }, 105);
  });

  const more = h('button', { class: 'chx-round', type: 'button', html: DOTS16_SVG, 'aria-label': 'More',
    onclick: () => popMenu({ anchor: more, below: true, items: [['Delete chat', () => { stopRec(); onDelete(); }]] }) });
  const statusEl = h('div', { class: 'chx-status' }, status);
  const titleEl = h('div', { class: 'chx-t' }, title);
  const head = h('header', { class: 'chx-head' }, pblur('down'), statusBar(),
    h('div', { class: 'chx-bar' },
      h('button', { class: 'chx-round', type: 'button', html: BACK16_SVG, 'aria-label': 'Back', onclick: () => { stopRec(); onBack && onBack(); } }),
      h('div', { class: 'chx-title' }, statusEl, titleEl),
      /* "···": DELETE CHAT (when the chat can be deleted) */
      onDelete ? more : h('span', { class: 'chx-round ghost' })));
  /* the input bar floats over the end of the conversation with the app tab
     bar's progressive blur (strongest at the bottom), so messages pass
     softly under it; the list keeps room for it at the end */
  const dock = h('div', { class: 'chx-dock' }, pblur('up'), attRow, h('div', { class: 'chx-foot' }, ask, media));
  new ResizeObserver(() => { list.style.paddingBottom = dock.offsetHeight + 'px'; if (stick) list.scrollTop = list.scrollHeight; }).observe(dock);
  const el = h('div', { class: 'chatx' }, head, h('div', { class: 'chx-main' }, list, dock));

  /* the dev page's own keyboard, open by default; tapping the conversation
     closes it, tapping the field opens it again */
  if (ownKeyboard) {
    const kb = keyboard({ onMic: () => mic.click() });
    const setKb = (on) => kb.classList.toggle('open', on);
    input.addEventListener('focus', () => setKb(true));
    list.addEventListener('click', (e) => { if (!e.target.closest('button, input, label, a')) setKb(false); });
    el.append(kb);
    setKb(true);
  }
  paintAtt();
  /* the header floats over the list: start the list below it (once in the page) */
  requestAnimationFrame(() => { list.style.paddingTop = head.offsetHeight - 40 + 'px'; });
  view.el = el;
  return view;
}
