/* STUDIO — simulated Lock Screen Live Activity and Apple Watch capture. */
import { h, ICON, toast, fullLayer, sleep, titleCase, ago } from '../ui.js';
import * as S from '../store.js';
import { nav } from '../nav.js';
import { processLog } from './capture.js';

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function activeCard(preferred) {
  return (preferred && S.byId(preferred)) || S.making()[0] || S.cards()[0];
}

/* ---------- LOCK SCREEN ---------- */
/* Live activity card: Figma 494:24966 ("Live session"). Title + MAKING,
   "Started … · <clay amount> <clay>" from the plan, the numbered steps
   (done grey, current acid, next white), and Hide plan / Add photo /
   End session. End session turns Live mode off on the card. */
const LA_WATCH_SVG = '<svg viewBox="0 0 17.998 17.998" fill="none"><path d="M10.8738 5.24942H7.12421C6.08879 5.24942 5.24942 6.08879 5.24942 7.12421V10.8738C5.24942 11.9092 6.08879 12.7486 7.12421 12.7486H10.8738C11.9092 12.7486 12.7486 11.9092 12.7486 10.8738V7.12421C12.7486 6.08879 11.9092 5.24942 10.8738 5.24942Z" stroke="white" stroke-opacity="0.6" stroke-width="1.27486" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.12421 5.24942L7.49917 2.99967H10.4988L10.8738 5.24942M7.12421 12.7486L7.49917 14.9983H10.4988L10.8738 12.7486" stroke="white" stroke-opacity="0.6" stroke-width="1.27486" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LA_CHEVRON_SVG = '<svg viewBox="0 0 15.9961 15.9961" fill="none"><path d="M3.99903 5.99854L7.99805 9.99756L11.9971 5.99854" stroke="white" stroke-opacity="0.6" stroke-width="1.13306" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* onChange: re-render whoever opened it (the card page's LIVE MODE button) */
export function openLock(cardId, onChange) {
  const c = activeCard(cardId);
  if (!c) return;
  fullLayer((wrap, kill) => {
    const root = h('div', { class: 'lock' });
    let planHidden = false;

    const paint = () => {
      const card = S.byId(c.id);
      if (!card) { kill(); return; }
      const steps = (card.plan?.steps || []).slice(0, 6);
      const doneCount = Math.max(0, Math.min(steps.length - 1, (card.photos || []).filter(p => p.kind === 'process').length + (card.notes || []).length - 1));
      const param = (k) => (card.plan?.params || []).find(p => p.key === k)?.val;
      const clay = [param('clay amount'), param('clay')].filter(Boolean).join(' ');
      const started = ago(card.startedMaking || card.created);
      const sub = 'Started ' + (started === 'today' ? 'today' : started) + (clay ? ' · ' + clay : '');
      const togglePlan = () => { planHidden = !planHidden; paint(); };

      root.replaceChildren(
        h('div', { class: 'clock' }, h('div', { class: 'd' }, today()), h('div', { class: 't' }, now())),
        h('div', { class: 'la' },
          h('div', { class: 'lah' },
            h('div', { class: 'latx' },
              h('div', { class: 'lat' },
                h('span', { class: 'title' }, titleCase(card.title)),
                h('span', { class: 'lastate' }, h('i'), 'making')),
              h('div', { class: 'lasub' }, sub)),
            h('span', { class: 'laic', html: LA_WATCH_SVG, 'aria-hidden': 'true' }),
            h('button', { class: 'laic' + (planHidden ? ' up' : ''), html: LA_CHEVRON_SVG, onclick: togglePlan,
              'aria-label': planHidden ? 'Show plan' : 'Hide plan' })),
          planHidden ? null : h('ol', {}, ...steps.map((s, i) => h('li', {
            class: i < doneCount ? 'done' : i === doneCount ? 'now' : ''
          }, s))),
          h('div', { class: 'labtns' },
            h('button', { onclick: togglePlan }, planHidden ? 'Show plan' : 'Hide plan'),
            h('button', { onclick: () => import('./card.js').then(({ mediaDrawer }) =>
              mediaDrawer((src, guess) => {
                S.addPhoto(card.id, { src, kind: guess || 'process', cap: 'From the live activity' });
                nav.refresh(); paint(); onChange && onChange();
              }, 'ADD TO ' + card.title)) }, 'Add photo'),
            h('button', { class: 'end', onclick: () => {
              S.updateCard(card.id, { live: false });
              nav.refresh(); onChange && onChange(); kill();
            } }, 'End session'))),
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
