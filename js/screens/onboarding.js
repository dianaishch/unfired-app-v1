/* ONBOARDING + AUTOMATIC GATHERING — value first, permission second, skip always. */
import { h, toast, fullLayer, sleep, img, ICON } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { PINTEREST_BOARDS, PHOTO_LIB } from '../seed.js';

export function openOnboarding() {
  fullLayer((wrap, kill) => {
    const root = h('div', { class: 'onb' });
    wrap.append(root);
    let step = 0;
    const chosen = new Set(['b1', 'b3']);

    const finish = () => {
      S.mutate(s => { s.onboarded = true; });
      kill(); nav.refresh();
    };

    const shell = (label, big, para, primary, onPrimary, skipLabel, extra) => {
      root.replaceChildren(
        h('div', { class: 'obody' },
          h('div', { class: 'label' }, label),
          h('h1', { class: 'h-mega', style: { marginTop: '16px' }, html: big.replace(/\n/g, '<br>') }),
          para ? h('p', {}, para) : null,
          extra || null),
        h('div', { class: 'ofoot' },
          h('button', { class: 'prim', onclick: onPrimary }, primary),
          h('button', { class: 'skip', onclick: () => step === 3 ? finish() : go(step + 1) }, skipLabel || 'SKIP'))
      );
      root.classList.remove('fadein'); void root.offsetWidth; root.classList.add('fadein');
    };

    const go = (n) => {
      step = n;
      if (n === 0) shell('UNFIRED', 'YOUR\nCERAMICS\nALREADY\nLIVE ON\nYOUR PHONE.',
        'Photos, screenshots, saved pins, half-written notes. UNFIRED turns them into one ceramic memory, without you filing anything.',
        'SHOW ME', () => go(1), 'SKIP EVERYTHING');

      else if (n === 1) shell('PHOTOS', 'IT CAN\nTELL A\nGLAZE TEST\nFROM A\nSCREENSHOT.',
        'UNFIRED reads your camera roll in the background, groups photos of the same piece, and files them against the right card. Nothing leaves your phone.',
        'ALLOW PHOTOS', () => {
          S.mutate(s => s.perms.photos = true);
          toast({ text: 'Photos connected' });
          go(2);
        }, 'NOT NOW');

      else if (n === 2) {
        const boards = h('div', { class: 'boards' });
        const paint = () => {
          boards.replaceChildren(...PINTEREST_BOARDS.map(b =>
            h('button', { class: chosen.has(b.id) ? 'on' : '', onclick: () => { chosen.has(b.id) ? chosen.delete(b.id) : chosen.add(b.id); paint(); } },
              h('div', { class: 'bx', html: chosen.has(b.id) ? ICON.check : '' }),
              h('div', { class: 'bn' }, b.name),
              h('div', { class: 'bc' }, b.n))));
        };
        paint();
        shell('PINTEREST', 'WHICH\nBOARDS?', null,
          'CONNECT ' + chosen.size + ' BOARDS', () => {
            S.mutate(s => { s.perms.pinterest = true; s.perms.boards = [...chosen]; });
            toast({ text: chosen.size + ' boards connected' });
            go(3);
          }, 'NOT NOW', boards);
      }

      else shell('READY', 'THAT\'S IT.\nJUST MAKE\nTHINGS.',
        'Press LOG whenever something happens. UNFIRED works out where it belongs. You can always undo it.',
        'START', () => { finish(); setTimeout(() => runImport(true), 1400); }, 'DONE');
    };
    go(0);
  });
}

/* ---------- BACKGROUND PHOTO IMPORT ---------- */
export async function runImport(force = false) {
  const s = S.get();
  if (!force && !s.perms.photos) {
    toast({ html: 'Photos are not connected.<br>Turn it on in onboarding.', ms: 3200 });
    return;
  }
  const t = toast({ work: true, html: 'Scanning your photos…', ms: 9000 });
  await sleep(650);
  t.kill();

  const teapot = S.byId('lavender-teapot-2');
  const plates = S.byId('starred-plates');
  const pool = PHOTO_LIB.slice(0, 8);
  const toTeapot = pool.filter(p => p.card === 'lavender-teapot-2');
  const toPlates = pool.filter(p => p.card === 'starred-plates');
  const newIdea = pool.find(p => !p.card);

  const added = { teapot: 0, plates: 0 };
  const snap = S.mutate(state => {
    const add = (cardId, ps, key) => {
      const c = state.cards.find(x => x.id === cardId);
      if (!c) return;
      ps.forEach(p => {
        if ((c.photos || []).some(x => x.src === p.src)) return;
        c.photos.push({ id: S.uid('p'), kind: p.guess, src: p.src, cap: 'Found in your photos · ' + p.cap });
        added[key]++;
      });
      c.updated = Date.now();
    };
    add('lavender-teapot-2', toTeapot, 'teapot');
    add('starred-plates', toPlates, 'plates');
    state.importedBatches++;
  });

  let created = null;
  if (newIdea && !S.cards().some(c => c.hero?.src === newIdea.src)) {
    created = {
      id: S.uid('c'), state: 'idea', title: 'SHELL FORM',
      created: Date.now(), updated: Date.now(),
      origin: { type: 'photo', label: 'Found in your photos' },
      glow: '#D89AA8',
      desc: 'A screenshot UNFIRED found in your camera roll. Shell form, shallow, pressed.',
      tags: ['press mould', 'shell', 'dish'],
      hero: { src: newIdea.src, ref: true },
      plan: AI.generatePlan('press mould shell dish'),
      photos: [{ id: S.uid('p'), kind: 'inspiration', src: newIdea.src, cap: 'Screenshot' }],
      notes: [], threads: [],
    };
    S.addCard(created);
  }

  nav.refresh();
  const n = added.teapot + added.plates + (created ? 1 : 0);
  if (!n) { toast({ html: 'Photos scanned. Nothing new since last time.', ms: 3200 }); return; }
  toast({
    html: `Found ${n} ceramic photo${n === 1 ? '' : 's'}.` +
      (added.teapot ? `<br>Added ${added.teapot} to <b>${teapot?.title || '—'}</b>` : '') +
      (added.plates ? `<br>Added ${added.plates} to <b>${plates?.title || '—'}</b>` : '') +
      (created ? '<br>Created 1 new idea' : ''),
    ms: 7000,
    undo: () => { S.restore(snap); if (created) S.mutate(st => { st.cards = st.cards.filter(c => c.id !== created.id); }); nav.refresh(); },
  });
}
