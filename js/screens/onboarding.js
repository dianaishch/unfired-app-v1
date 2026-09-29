/* ONBOARDING + AUTOMATIC GATHERING — value first, permission second, skip always. */
import { h, toast, fullLayer, sleep, img, ICON } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { PINTEREST_BOARDS, PHOTO_LIB } from '../seed.js';

export function openOnboarding() {
  /* Guard: never stack two onboarding layers. A second call (a stray
     boot re-entry, a double devbar click) was leaving one layer behind
     when the other finished -- which is how "DONE takes me back to an
     earlier step" happens. */
  if (document.querySelector('.onb')) return;

  fullLayer((wrap, kill) => {
    const root = h('div', { class: 'onb' });
    wrap.append(root);
    let step = 0;
    const chosen = new Set(['b1', 'b3']);

    const finish = () => {
      S.mutate(s => { s.onboarded = true; });
      kill();
      /* Belt and braces -- clear any other onboarding layer too. */
      document.querySelectorAll('.onb').forEach(el => el.closest('.layer')?.remove());
      nav.refresh();
    };

    /* onSkip lets a step override the default "advance one step" skip
       behavior -- step 0's "SKIP EVERYTHING" needs to actually skip
       everything (jump straight to READY), not just this one screen. */
    const shell = (label, big, para, primary, onPrimary, skipLabel, extra, onSkip) => {
      /* .fadein goes on this inner wrapper, not on root -- root is the
         full-screen opaque black panel, and animating its opacity/transform
         on every step flashed the app behind it and jumped the whole
         screen down 9px. A fresh .ocontent element each step restarts the
         animation on its own, so the manual reflow-retrigger is gone too. */
      root.replaceChildren(
        h('div', { class: 'ocontent fadein' },
          h('div', { class: 'obody' },
            h('div', { class: 'label' }, label),
            h('h1', { class: 'h-mega', style: { marginTop: '16px' }, html: big.replace(/\n/g, '<br>') }),
            para ? h('p', {}, para) : null,
            extra || null),
          h('div', { class: 'ofoot' },
            h('button', { class: 'prim', onclick: onPrimary }, primary),
            /* skipLabel null = no second button (the READY step has only START) */
            skipLabel === null ? null : h('button', { class: 'skip', onclick: onSkip || (() => step === 3 ? finish() : go(step + 1)) }, skipLabel || 'SKIP')))
      );
    };

    const go = (n) => {
      step = n;
      if (n === 0) shell('UNFIRED', 'YOUR\nCERAMICS\nALREADY\nLIVE ON\nYOUR PHONE.',
        'Photos, screenshots, saved pins, half-written notes. UNFIRED turns them into one ceramic memory, without you filing anything.',
        'SHOW ME', () => go(1), 'SKIP EVERYTHING', null, () => go(3));

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
        'START', () => { finish(); setTimeout(() => runImport(true), 1400); }, null);
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
  const pool = PHOTO_LIB;
  const toTeapot = pool.filter(p => p.card === 'lavender-teapot-2');
  const toPlates = pool.filter(p => p.card === 'starred-plates');
  const ideaShots = pool.filter(p => p.idea);
  const newIdea = ideaShots[0];

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
      /* what the photo shows sets the status (S.stateFor): glazed -> finished */
      id: S.uid('c'), state: S.stateFor(newIdea.src) || 'idea', title: (newIdea.name || 'Marbled mug').toUpperCase(),
      created: Date.now(), updated: Date.now(), startedMaking: Date.now(), finishedAt: Date.now(),
      readyToShare: S.stateFor(newIdea.src) === 'finished',
      origin: { type: 'photo', label: 'Found in your photos' },
      glow: '#8C8479',
      desc: 'A marbled mug UNFIRED found in your camera roll. Nerikomi, dark and light clay swirled together.',
      tags: ['nerikomi', 'marbled', 'mug'],
      hero: { src: newIdea.piece || newIdea.src, ref: true },
      plan: AI.generatePlan('nerikomi marbled mug'),
      photos: ideaShots.flatMap(p => {
        const ph = { id: S.uid('p'), kind: p.guess || 'inspiration', src: p.src, cap: p.cap };
        return p.piece ? [ph, { id: S.uid('p'), kind: 'final', src: p.piece, pieceOf: ph.id, cap: 'Piece image' }] : [ph];
      }),
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
      (created ? `<br>Added <b>${created.title}</b>, ${created.state}` : ''),
    ms: 7000,
    undo: () => { S.restore(snap); if (created) S.mutate(st => { st.cards = st.cards.filter(c => c.id !== created.id); }); nav.refresh(); },
  });
}
