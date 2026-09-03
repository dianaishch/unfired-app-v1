/* SHARE — presentation only. The object itself is never altered. */
import { h, ICON, page, toast, img, sleep } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';

const BACKDROPS = [
  { id: 'paper', name: 'Paper', css: '#EDE9E0', ink: '#000' },
  { id: 'putty', name: 'Putty', css: '#C9C1B2', ink: '#000' },
  { id: 'ink',   name: 'Ink',   css: '#111111', ink: '#fff' },
  { id: 'blue',  name: 'Blue',  css: '#2B36FF', ink: '#fff' },
  { id: 'acid',  name: 'Acid',  css: '#D6FF2E', ink: '#000' },
  { id: 'grad',  name: 'Gradient', css: 'linear-gradient(150deg,#F2EFE6,#C9B9A8)', ink: '#000' },
];
const FORMATS = [
  { id: 'instagram', name: 'Instagram post', cls: '' },
  { id: 'pinterest', name: 'Pinterest pin', cls: 'pin' },
  { id: 'listing',   name: 'Marketplace listing', cls: '' },
];
const LAYOUTS = [
  { id: 'solo', name: 'Object only' },
  { id: 'trio', name: 'Process → after' },
];

export function openShare(cardId) {
  const c = S.byId(cardId);
  if (!c) return;
  let bg = BACKDROPS[0], fmt = FORMATS[0], layout = LAYOUTS[0], generated = false;

  page((p, close) => {
    const stage = h('div');
    const scroll = h('div', { class: 'scroll' }, stage);

    const clean = S.cutoutSrc(c);
    /* the untouched phone photo of the same object — dim, tilted, cluttered */
    const before = /assets\/pieces\//.test(clean || '')
      ? clean.replace('assets/pieces', 'assets/snap')
      : ((c.photos || []).find(x => x.kind === 'process')?.src || clean);

    const paint = () => {
      stage.replaceChildren();

      stage.append(h('div', { class: 'pad', style: { paddingTop: '4px' } },
        h('div', { class: 'label' }, generated ? 'READY' : 'READY TO SHARE'),
        h('h1', { class: 'h-big', style: { margin: '8px 0 18px' } }, c.title)));

      if (!generated) {
        stage.append(
          h('div', { class: 'beforeafter' },
            h('div', {}, h('span', {}, 'YOUR PHOTO'), img(before, '')),
            h('div', { style: { background: '#EDE9E0' } }, h('span', {}, 'CLEANED'),
              h('div', { style: { aspectRatio: '1', display: 'grid', placeItems: 'center', padding: '10%' } },
                img(clean, '')))),
          h('div', { class: 'truth' }, h('b', {}, 'NOT TOUCHED'),
            h('span', {}, 'Form, glaze, texture and every defect are exactly as fired. UNFIRED only crops, straightens and replaces the background.')),
          h('button', { class: 'bigact paper', onclick: async () => {
            const t = toast({ work: true, html: 'Cropping, straightening, lifting background…', ms: 9000 });
            await sleep(1500); t.kill();
            generated = true; paint();
            toast({ html: '<b>3 layouts</b> generated' });
          } }, 'GENERATE PRESENTATION'));
        return;
      }

      /* preview */
      const prev = h('div', { class: 'canvasprev ' + fmt.cls, style: { background: bg.css } });
      if (layout.id === 'solo') {
        prev.append(img(clean, c.title));
      } else {
        prev.style.display = 'grid';
        prev.style.gridTemplateColumns = '1fr 1fr';
        prev.style.gap = '6px';
        prev.style.padding = '6%';
        const cell = (src, lab) => h('div', { style: { position: 'relative', display: 'grid', placeItems: 'center', overflow: 'hidden', borderRadius: '10px' } },
          img(src, ''), h('div', { style: { position: 'absolute', bottom: '4px', left: '6px', fontSize: '8px', letterSpacing: '.14em', color: bg.ink, opacity: .55 } }, lab));
        prev.append(cell(before, 'PROCESS'), cell(clean, 'FIRED'));
      }
      if (fmt.id === 'listing') prev.append(h('div', { class: 'price' }, '£48'));
      prev.append(h('div', { class: 'cap', style: { color: bg.ink, opacity: .5 } }, 'UNFIRED · ' + c.title));

      stage.append(prev);

      /* controls */
      stage.append(h('div', { class: 'optrow' }, ...FORMATS.map(f =>
        h('button', { class: 'opt' + (f.id === fmt.id ? ' on' : ''), onclick: () => { fmt = f; paint(); } }, f.name))));
      stage.append(h('div', { class: 'optrow' }, ...LAYOUTS.map(l =>
        h('button', { class: 'opt' + (l.id === layout.id ? ' on' : ''), onclick: () => { layout = l; paint(); } }, l.name))));
      stage.append(h('div', { class: 'optrow', style: { alignItems: 'center', gap: '10px' } },
        h('div', { class: 'label', style: { flex: 'none' } }, 'BACKDROP'),
        ...BACKDROPS.map(b => h('button', {
          class: 'swatch' + (b.id === bg.id ? ' on' : ''),
          style: { background: b.css }, onclick: () => { bg = b; paint(); }, 'aria-label': b.name
        }))));

      /* caption from real card history */
      stage.append(
        h('div', { class: 'label', style: { padding: '24px 20px 0' } }, 'CAPTION — FROM THIS CARD'),
        h('div', { class: 'captionbox' }, AI.caption(c, fmt.id)),
        h('div', { class: 'truth' }, h('b', {}, 'SOURCE'),
          h('span', {}, `Written from ${(c.notes || []).length} note${(c.notes || []).length === 1 ? '' : 's'} and the plan on this card. No invented story.`)),
        h('button', { class: 'bigact paper', onclick: () => {
          S.mutate(s => { s.shared.push({ card: c.id, fmt: fmt.id, at: Date.now() }); });
          S.updateCard(c.id, { readyToShare: false });
          toast({ html: `<b>${c.title}</b> exported for ${fmt.name}` });
          close();
        } }, 'EXPORT ' + fmt.name.toUpperCase()),
        h('button', { class: 'bigact ghost', onclick: () => { generated = false; paint(); } }, 'BACK TO THE PHOTO'),
        h('div', { style: { height: '30px' } })
      );
    };

    p.append(
      h('div', { class: 'page-top' },
        h('button', { class: 'iconbtn', onclick: close, html: ICON.back }),
        h('div', { class: 'label', style: { flex: '1' } }, 'SHARE')),
      scroll);
    paint();
  });
}
