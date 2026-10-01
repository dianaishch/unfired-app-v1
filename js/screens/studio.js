/* STUDIO — simulated Lock Screen Live Activity and Apple Watch capture. */
import { h, ICON, toast, fullLayer, sleep, titleCase } from '../ui.js';
import * as S from '../store.js';
import { nav } from '../nav.js';
import { processLog, SAMPLES, MIC_SVG, STOP_SVG } from './capture.js';
import { planChecklist, mediaDrawer, openChat, PLUS24_SVG } from './card.js';

const now = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

function activeCard(preferred) {
  return (preferred && S.byId(preferred)) || S.making()[0] || S.cards()[0];
}

/* ---------- LOCK SCREEN ---------- */
/* Live activity card: Figma 494:24966 ("Live session"). MAKING above the title,
   then the making card's plan (steps as checkboxes, no risks or archive
   notes), and the app's buttons: CLOSE (turns
   Live mode off on the card) · + · mic · new chat. */

const LA_CHEVRON_SVG = '<svg viewBox="0 0 15.9961 15.9961" fill="none"><path d="M3.99903 5.99854L7.99805 9.99756L11.9971 5.99854" stroke="white" stroke-opacity="0.6" stroke-width="1.13306" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* onChange: re-render whoever opened it (the card page's LIVE MODE button) */
export function openLock(cardId, onChange) {
  const c = activeCard(cardId);
  if (!c) return;
  fullLayer((wrap, kill) => {
    const root = h('div', { class: 'lock' });
    let listening = null;
    let planHidden = false;

    const paint = () => {
      const card = S.byId(c.id);
      if (!card) { kill(); return; }

      /* the app's own bottom-bar buttons (card.js): CLOSE on the left,
         + and mic in the middle, new chat on the right */
      const round = (html, label, onclick) => h('button', { class: 'cb-round', type: 'button', html, onclick, 'aria-label': label });
      const plus = round(PLUS24_SVG, 'Add photo or video', () => mediaDrawer((src, guess) => {
        S.addPhoto(card.id, { src, kind: guess || 'process', cap: 'From the live activity' });
        if (S.stateFromPhoto(S.byId(card.id), src) === 'finished') {
          S.setState(card.id, 'finished');
          S.updateCard(card.id, { readyToShare: true, live: false });
        }
        nav.refresh(); paint(); onChange && onChange();
      }, plus));
      /* mic: listens, then the transcript lands on the card as a note */
      const mic = round(MIC_SVG, 'Voice', () => {
        if (listening) return stopListening();
        mic.classList.add('rec'); mic.innerHTML = STOP_SVG;
        const text = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
        listening = setTimeout(() => stopListening(text), 2600);
      });
      const stopListening = (text) => {
        clearTimeout(listening); listening = null;
        mic.classList.remove('rec'); mic.innerHTML = MIC_SVG;
        if (!text) return;
        S.addNote(card.id, { text, src: 'liveactivity' });
        nav.refresh(); onChange && onChange();
        toast({ html: `Note added to <b>${card.title}</b>`, ms: 2600 });
      };
      const chat = round(ICON.dockWatch, 'New chat', () => { kill(); openChat(card.id, null, () => { nav.refresh(); onChange && onChange(); }); });
      const end = h('button', { class: 'pe-btn accent', type: 'button', onclick: () => {
        S.updateCard(card.id, { live: false });
        nav.refresh(); onChange && onChange(); kill();
      } }, 'Close');

      const list = planChecklist(card, undefined, { brief: true });
      const ticked = list.querySelectorAll('input:checked').length;

      root.replaceChildren(
        h('div', { class: 'clock' }, h('div', { class: 'd' }, today()), h('div', { class: 't' }, now())),
        h('div', { class: 'la' },
          h('div', { class: 'lah' },
            h('div', { class: 'latx' },
              h('span', { class: 'lastate' }, h('i'), 'making'),
              h('div', { class: 'title' }, titleCase(card.title))),
            h('button', { class: 'laic' + (planHidden ? ' up' : ''), type: 'button', html: LA_CHEVRON_SVG,
              onclick: () => { planHidden = !planHidden; paint(); }, 'aria-label': planHidden ? 'Show plan' : 'Hide plan' })),
          /* the making card's plan, checkboxes and all (ticks are shared
             with the card), without REGENERATE, risks or archive notes;
             the chevron folds it to "N of M steps done" */
          planHidden ? h('div', { class: 'la-done' }, `${ticked} of ${list.querySelectorAll('input').length} steps done`)
            : h('div', { class: 'la-plan' }, list),
          h('div', { class: 'la-bar' }, end, h('div', { class: 'cb-media' }, plus, mic), chat)),
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
