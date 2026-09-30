/* UNFIRED chat with widgets -- chat.html?scenario=<id>. The shell is the
   chat screen in Figma 562:11117: header (back, status + title, "···"),
   the conversation anchored to the bottom (user bubble on paper, AI bubble
   on the piece's gradient, the widget under the AI bubble), and the input
   bar. Copy and mock data: data/chat-scenarios.json. Widgets:
   js/widgets/<id>.js, each exporting render(container, data, chat).
   Without ?scenario the page lists all scenarios (dev only). */
import { h, img, statusBar, pblur } from './ui.js';
import { BACK16_SVG, DOTS16_SVG, mediaPicker } from './screens/media.js';
import { PLUS24_SVG } from './screens/card.js';
import { MIC_SVG, STOP_SVG, CLOSE_SVG, PLAY_SVG, SAMPLES } from './screens/capture.js';
import { keyboard } from './keyboard.js';

const root = document.getElementById('chat');

const { scenarios } = await (await fetch('data/chat-scenarios.json')).json();
const id = new URLSearchParams(location.search).get('scenario');
const sc = scenarios.find(s => s.id === id);
if (!sc || !sc.messages) devList(); else open(sc);

/* dev only: every scenario, the ones not built yet greyed out */
function devList() {
  root.append(statusBar(),
    h('div', { class: 'chx-dev' },
      h('h1', { class: 'chx-dev-t' }, 'Chat scenarios'),
      h('ol', {}, ...scenarios.map(s => h('li', {}, s.messages
        ? h('a', { href: '?scenario=' + s.id }, s.name)
        : h('span', {}, s.name + ' — not built yet'))))));
}

function open(sc) {
  const list = h('div', { class: 'chx-list' });
  const inner = h('div', { class: 'chx-inner' });
  list.append(inner);

  /* bubbles hug their text (max 80% of the screen); the AI one sits on the
     piece's gradient -- the same one as the piece card header and PLAN box */
  const bubble = (role, text, photos = []) => {
    const b = h('div', { class: 'chx-b ' + role }, h('p', {}, text));
    if (role === 'ai') b.style.background = `linear-gradient(0deg, var(--paper) 6.25%, ${sc.glow} 100%)`;
    const row = h('div', { class: 'chx-row ' + role });
    if (photos.length) row.append(h('div', { class: 'chx-sent' }, ...photos.map(a =>
      h('div', { class: 'att' }, h('div', { class: 'ph' }, img(a.src, '')),
        a.video ? h('span', { class: 'vid', html: PLAY_SVG }) : null))));
    if (text) row.append(b);
    return row;
  };
  const scrollDown = () => requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; });
  /* stay at the end while things change size -- the keyboard sliding open,
     widget images loading, the field growing -- unless you scrolled up */
  let stick = true;
  /* only your own scrolling (wheel, touch, keys) can unstick it */
  const userScroll = () => requestAnimationFrame(() => { stick = list.scrollHeight - list.scrollTop - list.clientHeight < 24; });
  ['wheel', 'touchmove', 'keydown'].forEach(ev => list.addEventListener(ev, userScroll, { passive: true }));
  new ResizeObserver(() => { if (stick) list.scrollTop = list.scrollHeight; }).observe(list);
  new ResizeObserver(() => { if (stick) list.scrollTop = list.scrollHeight; }).observe(inner);
  const chat = {
    /* add a message; returns its text node so a widget can keep it live */
    say(role, text, photos) {
      const row = bubble(role, text, photos);
      inner.append(row); scrollDown();
      return row.querySelector('p');
    },
  };

  /* input bar (Figma 590:8730): the text field, "+" and the mic -- they work
     like the Log screen's, but the voice transcript goes into the field */
  /* a textarea, so long messages wrap instead of being cut off: one line is
     the 58px pill, more lines grow it upward (up to 4, then it scrolls) */
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
    chat.say('me', text, attachments);
    input.value = ''; attachments = []; paintAtt(); grow();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  input.addEventListener('focus', () => setKb(true));

  const plus = h('button', { class: 'chx-round big', type: 'button', html: PLUS24_SVG, 'aria-label': 'Add photo or video' });
  const mic = h('button', { class: 'mic', type: 'button', html: MIC_SVG, 'aria-label': 'Voice' });
  const media = h('div', { class: 'chx-media' }, plus, mic);
  plus.addEventListener('click', () => mediaPicker({ anchor: plus, align: media,
    onPick: (src, guess, { video } = {}) => { attachments.push({ src, video }); paintAtt(); } }));

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

  /* the iOS keyboard (js/keyboard.js), open by default: its keys type into
     the field, return sends, its mic is the voice input. Tapping the
     conversation closes it, tapping the field opens it again. */
  const kb = keyboard({ field: input, onReturn: send, onMic: () => mic.click(), onType: grow });
  const setKb = (on) => kb.classList.toggle('open', on);
  list.addEventListener('click', (e) => { if (!e.target.closest('button, input, label, a')) setKb(false); });

  const head = h('header', { class: 'chx-head' }, pblur('down'), statusBar(),
      h('div', { class: 'chx-bar' },
        h('button', { class: 'chx-round', type: 'button', html: BACK16_SVG, 'aria-label': 'Back', onclick: () => history.back() }),
        h('div', { class: 'chx-title' },
          h('div', { class: 'chx-status' }, sc.status),
          h('div', { class: 'chx-t' }, sc.title)),
        h('button', { class: 'chx-round', type: 'button', html: DOTS16_SVG, 'aria-label': 'More' })));
  root.append(
    head,
    list,
    attRow,
    h('div', { class: 'chx-foot' }, ask, media),
    kb);
  paintAtt();
  /* the header floats over the list: start the list below it */
  list.style.paddingTop = head.offsetHeight - 40 + 'px';
  setKb(true);
  input.focus({ preventScroll: true });

  sc.messages.forEach(async m => {
    const text = chat.say(m.role, m.text);
    if (!m.widget) return;
    const box = h('div', { class: 'chx-widget' });
    inner.append(box);
    const mod = await import(`./widgets/${m.widget}.js`);
    mod.render(box, sc.widget, { ...chat, aiText: text });
    scrollDown();
  });
}
