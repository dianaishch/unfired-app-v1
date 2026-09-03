/* STUDIO — simulated Lock Screen Live Activity and Apple Watch capture. */
import { h, ICON, toast, fullLayer, sleep } from '../ui.js';
import * as S from '../store.js';
import { nav } from '../nav.js';
import { processLog } from './capture.js';

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function activeCard(preferred) {
  return (preferred && S.byId(preferred)) || S.making()[0] || S.cards()[0];
}

/* ---------- LOCK SCREEN ---------- */
export function openLock(cardId) {
  const c = activeCard(cardId);
  if (!c) return;
  fullLayer((wrap, kill) => {
    const root = h('div', { class: 'lock' });

    const paint = () => {
      const card = S.byId(c.id);
      const steps = (card.plan?.steps || []).slice(0, 6);
      const doneCount = Math.min(steps.length - 1, (card.photos || []).filter(p => p.kind === 'process').length + (card.notes || []).length - 1);
      root.replaceChildren(
        h('div', { class: 'clock' }, h('div', { class: 'd' }, today()), h('div', { class: 't' }, now())),
        h('div', { class: 'la' },
          h('div', { class: 'lah' },
            h('div', { class: 'mark' }, 'U'),
            h('div', { class: 'nm' }, 'UNFIRED · LIVE'),
            h('div', { class: 'state making' }, 'making')),
          h('div', { class: 'title' }, card.title),
          h('ol', {}, ...steps.map((s, i) => h('li', {
            class: i < doneCount ? 'done' : i === doneCount ? 'now' : ''
          }, s))),
          h('button', {
            class: 'laact', onclick: () => {
              kill();
              import('./capture.js').then(({ openCapture }) =>
                openCapture({ prompt: 'LOG A NOTE', cardHint: card.id, source: 'liveactivity' }));
            }
          }, 'LOG NOTE')),
        h('button', { class: 'exit', onclick: kill }, 'Tap to unlock ↑')
      );
    };
    paint();
    const t = setInterval(paint, 20000);
    wrap.append(root);
    wrap.addEventListener('DOMNodeRemoved', () => clearInterval(t));
  });
}

/* ---------- APPLE WATCH ---------- */
const WATCH_LINES = [
  'Handle is too soft. Wait another twenty minutes.',
  'Foot is waxed, eight millimetres up the wall.',
  'Second coat of lavender on. One more tomorrow.',
  'Spout is dribbling again. Cut the tip sharper.',
];

export function openWatch(cardId) {
  const c = activeCard(cardId);
  fullLayer((wrap, kill) => {
    const line = h('div', { class: 'wbig dim' }, 'Tap to dictate');
    const mic = h('button', { class: 'wmic', html: ICON.mic });
    const watch = h('div', { class: 'watch' },
      h('div', { class: 'wt' }, 'UNFIRED'),
      line, mic);
    const root = h('div', { class: 'watchwrap' }, watch,
      h('div', { class: 'hint' },
        h('div', { class: 'label' }, 'SIMULATED APPLE WATCH'),
        h('button', { class: 'meta', style: { marginTop: '8px' }, onclick: kill }, 'Close')));
    wrap.append(root);

    let busy = false;
    mic.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      mic.classList.add('rec');
      line.classList.remove('dim');
      const text = WATCH_LINES[Math.floor(Math.random() * WATCH_LINES.length)];
      const words = text.split(' ');
      for (let i = 1; i <= words.length; i++) { line.textContent = words.slice(0, i).join(' '); await sleep(115); }
      mic.classList.remove('rec');
      await sleep(320);
      watch.replaceChildren(
        h('div', { class: 'wt' }, 'UNFIRED'),
        h('div', { class: 'wbig' }, text),
        h('div', { class: 'wok' }, '✓ Added to'),
        h('div', { class: 'wbig', style: { flex: 'none', fontWeight: '700', textTransform: 'uppercase', fontSize: '15px' } }, c.title));
      processLog(text, [], c.id, 'watch');
      await sleep(1900);
      kill();
      nav.refresh();
      toast({ html: `From your watch → <b>${c.title}</b>` });
    });
  });
}
