/* UNFIRED — app shell: two destinations, one persistent LOG, everything else contextual. */
import { h, ICON, toast } from './ui.js';
import * as S from './store.js';
import { nav } from './nav.js';
import { renderItems, openSearch, openReadyToPost } from './screens/items.js';
import { openPostEdit } from './screens/post.js';
import { renderInsights } from './screens/insights.js';
import { openCard, openChat } from './screens/card.js';
import { openCapture } from './screens/capture.js';
import { openDiscover } from './screens/discover.js';
import { openCollide } from './screens/collide.js';
import { openLock, openWatch } from './screens/studio.js';
import { openShare } from './screens/share.js';
import { openOnboarding, runImport } from './screens/onboarding.js';

const app = document.getElementById('app');
let route = 'items';

function chrome() {
  const bar = h('div', { class: 'topbar' },
    h('button', { class: 'navword' + (route === 'items' ? ' on' : ''), onclick: () => go('items') }, 'Items'),
    h('button', { class: 'navword' + (route === 'insights' ? ' on' : ''), onclick: () => go('insights') }, 'Insights'),
    h('div', { class: 'spacer' }),
    /* Search on both tabs (Insights used to show a Discover icon here) */
    h('button', { class: 'circlebtn', html: ICON.topSearch, onclick: () => openSearch(), 'aria-label': 'Search' }));

  const dock = h('div', { class: 'logdock' },
    h('button', { class: 'side', html: ICON.dockDiscover, onclick: openDiscover, 'aria-label': 'Discover' }),
    h('button', { class: 'logbtn', onclick: () => openCapture({}) }, h('span', { class: 'dot' }), 'Log'),
    /* new chat -- UNFIRED files it under the right piece after the first
       message (card.js openChat with no card). Watch sim stays on the W key. */
    h('button', { class: 'side', html: ICON.dockWatch, onclick: () => openChat(null), 'aria-label': 'New chat' }));

  return { bar, dock };
}

function render() {
  const scr = h('div', { class: 'screen' });
  const { bar, dock } = chrome();
  const stage = h('div', { style: { flex: '1', position: 'relative', display: 'flex', flexDirection: 'column', minHeight: '0' } });
  scr.append(bar, stage, dock);
  app.replaceChildren(scr);
  if (route === 'items') renderItems(stage);
  else renderInsights(stage);
}

function go(r) {
  if (r === route) return;
  route = r;
  S.mutate(s => { s.lastRoute = r; });
  render();
}

/* wire the registry */
Object.assign(nav, {
  go, openCard, openCapture, openSearch, openDiscover, openCollide,
  openLock, openWatch, openShare, openOnboarding, refresh: render,
});

/* ---------- shake → collide ---------- */
let lastShake = 0;
function shake() {
  if (Date.now() - lastShake < 1200) return;
  lastShake = Date.now();
  if (navigator.vibrate) navigator.vibrate(30);
  openCollide();
}
if (window.DeviceMotionEvent) {
  let last = { x: 0, y: 0, z: 0 };
  window.addEventListener('devicemotion', e => {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const d = Math.abs(a.x - last.x) + Math.abs(a.y - last.y) + Math.abs(a.z - last.z);
    last = { x: a.x, y: a.y, z: a.z };
    if (d > 42) shake();
  });
}
window.addEventListener('keydown', e => {
  if (!e.shiftKey || e.metaKey || e.ctrlKey) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
  const k = e.key.toLowerCase();
  if (k === 's') { e.preventDefault(); shake(); }
  if (k === 'l') { e.preventDefault(); openLock(); }
  if (k === 'w') { e.preventDefault(); openWatch(); }
  if (k === 'p') { e.preventDefault(); runImport(); }
  if (k === 'k') { e.preventDefault(); openCapture({}); }
});

/* ---------- prototype controls ---------- */
const devbar = document.getElementById('devbar');
document.getElementById('devtoggle').addEventListener('click', () => devbar.hidden = !devbar.hidden);
devbar.addEventListener('click', e => {
  const a = e.target.dataset.dev;
  if (!a) return;
  /* screens open on a fresh Items screen, so Back behaves normally */
  const fresh = () => { document.getElementById('layers').replaceChildren(); route = 'items'; render(); };
  if (a.startsWith('card:')) { fresh(); openCard(a.slice(5)); }
  if (a === 'rtp') { fresh(); openReadyToPost(); }
  if (a === 'edit') { fresh(); openPostEdit('post-1'); }
  if (a === 'log') { fresh(); openCapture({}); }
  if (a === 'log-rec') { fresh(); openCapture({ listen: true }); }
  if (a === 'lock') { fresh(); openLock('lavender-teapot-2'); }
  if (a === 'shake') { fresh(); shake(); }
  if (a === 'onboard') openOnboarding();
  if (a === 'reset') {
    S.resetDemo();
    document.getElementById('layers').replaceChildren();
    route = 'items'; render();
    toast({ text: 'Demo data reset' });
    setTimeout(() => openOnboarding(), 500);
  }
  devbar.hidden = true;
});

/* ---------- boot ---------- */
render();

const s = S.get();
if (!s.onboarded) {
  setTimeout(() => openOnboarding(), 400);
} else {
  /* deterministic background work while the prototype is open */
  setTimeout(() => {
    const rts = S.readyToShare()[0];
    if (rts) toast({
      html: `<b>${rts.title}</b> is ready to share.<br>Photos cleaned up while you were away.`,
      ms: 5200,
    });
  }, 2600);
  setTimeout(() => { if (S.get().perms.photos) runImport(); }, 14000);
}
