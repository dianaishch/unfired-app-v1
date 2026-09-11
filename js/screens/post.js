/* POST EDIT + PREVIEW -- the "Ready to post" flow.
   Edit screen: Figma nodes 493:16808 (a post) / 493:18256 (card with no
   post yet: "Upload an image" placeholder). Preview: Figma 493:16989 -- it
   shows the same exported post image as the Ready-to-post carousel, not a
   rebuilt Instagram frame (per your call), so edits made on the Edit screen
   don't show there. Post / Custom open placeholder modals; no real share
   sheet or colour picker behind them yet. */
import { h, ICON, page, sheet, toast, img, ago } from '../ui.js';
import * as S from '../store.js';
import { openCard, pickPhoto } from './card.js';
import { statusBar } from './items.js';

/* The exported posts, each tied to its real piece card. Both plate posts
   belong to Starred Plates (the bowl and the sun plate are its photos).
   `bg` is each export's own backdrop, sampled from the PNG; `name`/`tech`
   are the labels printed on it. */
const PINK = 'linear-gradient(0deg, #f6f4ec 0.962%, #f6f4ec 41.334%, #feb2b8 100%)';
export const POSTS = [
  { id: 'post-1', img: 'assets/posts/Post 1.png?v=2', cardId: 'lavender-teapot-2',
    piece: 'assets/pieces without bg/19-lavender-teapot 1.png', name: 'Lavender Teapot', tech: 'Hand Built', bg: 0 },
  { id: 'post-2', img: 'assets/posts/Post 2.png?v=2', cardId: 'starred-plates',
    piece: 'assets/pieces without bg/02-red-star-bowl 1.png', name: 'Starred Plate N2', tech: 'Pinch Built', bg: PINK },
  { id: 'post-3', img: 'assets/posts/Post 3.png?v=2', cardId: 'starred-plates',
    piece: 'assets/pieces without bg/01-red-star-sun-plate 1.png', name: 'Starred Plate N1', tech: 'Wheel Thrown', bg: PINK },
];
/* Every card with a piece photo (a background-removed cutout) -- remakes
   included -- has at least one post: its exported ones above, else one
   generated from the cutout, with no exported image yet (the carousel/
   preview show a placeholder card until you replace it). Other photos
   (inspiration, process shots) don't make posts. Generated posts open on
   swatch 0, the piece-colour gradient. */
const pieceOf = (c) => {
  const p = (c.photos || []).find(x => /assets\/pieces\//.test(x.src || ''));
  return p ? S.hiRes(p.src) : null;
};

export function allPosts() {
  const gen = S.cards()
    .filter(c => pieceOf(c) && !POSTS.some(p => p.cardId === c.id))
    .map(c => ({ id: 'gen-' + c.id, img: null, cardId: c.id, piece: pieceOf(c),
                 name: titleCase(c.title), tech: techOf(c), bg: 0 }));
  return [...POSTS.filter(p => S.byId(p.cardId)), ...gen];
}
export const postsForCard = (cardId) => allPosts().filter(p => p.cardId === cardId);

/* Placeholder for a post with no exported image yet (Figma 493:19727). */
export const postPlaceholder = (name) =>
  h('div', { class: 'post-ph' }, h('div', {}, 'Post preview card for ' + name));

/* A light tint of a colour: same hue, lightness lifted to Figma's light
   lavender swatch (#e4caff = hsl(270, 100%, 89.6%)), so for the teapot's
   #dab4ff it lands exactly on #e4caff. */
function lightTint(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let hue = 0;
  if (d) hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue = (hue * 60 + 360) % 360;
  const l0 = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0;
  return `hsl(${hue.toFixed(1)}, ${(s * 100).toFixed(1)}%, 89.6%)`;
}

/* Backdrop swatches, in Figma order (493:16837). The two gradients and the
   light tint follow the piece's colour (Figma shows them for the lavender
   teapot, where they come out identical); the rest are fixed. */
const swatchesFor = (color) => [
  `linear-gradient(0deg, #f6f4ec 0.962%, #f6f4ec 41.334%, ${color} 100%)`,
  `linear-gradient(0deg, ${color} 0%, #f6f4ec 58.666%, #f6f4ec 99.038%)`,
  lightTint(color),
  '#181818',
  '#2b36ff',
  '#d6ff2e',
  'linear-gradient(150deg, #f2efe6 7.735%, #c9b9a8 92.265%)',
];

/* Figma's own icon exports (Edit 493:16808), recoloured to currentColor. */
const BACK_SVG = '<svg viewBox="0 0 16 16" fill="none"><path d="M10 3.33333L5.33333 8L10 12.6667" stroke="currentColor" stroke-width="1.13333" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PLUS_SVG = '<svg viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M7.9999 1.80023C8.15903 1.80023 8.31164 1.86344 8.42417 1.97596C8.53669 2.08849 8.5999 2.2411 8.5999 2.40023V7.40023H13.5999C13.759 7.40023 13.9116 7.46344 14.0242 7.57596C14.1367 7.68849 14.1999 7.8411 14.1999 8.00023C14.1999 8.15936 14.1367 8.31197 14.0242 8.42449C13.9116 8.53701 13.759 8.60023 13.5999 8.60023H8.5999L8.5999 13.6002C8.5999 13.7594 8.53669 13.912 8.42417 14.0245C8.31164 14.137 8.15903 14.2002 7.9999 14.2002C7.84077 14.2002 7.68816 14.137 7.57564 14.0245C7.46312 13.912 7.3999 13.7594 7.3999 13.6002V8.60023H2.3999C2.24077 8.60023 2.08816 8.53701 1.97564 8.42449C1.86312 8.31197 1.7999 8.15936 1.7999 8.00023C1.7999 7.8411 1.86312 7.68849 1.97564 7.57596C2.08816 7.46344 2.24077 7.40023 2.3999 7.40023L7.3999 7.40023L7.3999 2.40023C7.3999 2.2411 7.46312 2.08848 7.57564 1.97596C7.68816 1.86344 7.84077 1.80023 7.9999 1.80023Z"/></svg>';
const REGEN_SVG = '<svg viewBox="0 0 24 24" fill="none"><path fill="currentColor" d="M16.25 5.18C16.1295 5.33821 16.0767 5.53781 16.1034 5.7349C16.13 5.932 16.2338 6.11045 16.392 6.231C17.5451 7.10917 18.4086 8.31276 18.871 9.68645C19.3333 11.0601 19.3734 12.5409 18.986 13.9376C18.5987 15.3343 17.8016 16.5828 16.6977 17.5221C15.5938 18.4614 14.2337 19.0483 12.793 19.207L13.47 18.53C13.6042 18.3962 13.6827 18.2165 13.6899 18.0271C13.697 17.8377 13.6322 17.6527 13.5084 17.5092C13.3846 17.3656 13.2111 17.2743 13.0227 17.2535C12.8344 17.2327 12.6451 17.2839 12.493 17.397L12.409 17.47L10.409 19.47C10.282 19.597 10.2048 19.7653 10.1914 19.9445C10.178 20.1236 10.2293 20.3015 10.336 20.446L10.409 20.53L12.409 22.53C12.543 22.663 12.7222 22.7405 12.9109 22.7471C13.0995 22.7538 13.2837 22.689 13.4268 22.5658C13.5698 22.4426 13.6611 22.27 13.6824 22.0825C13.7038 21.8949 13.6537 21.7062 13.542 21.554L13.47 21.47L12.72 20.72C14.4831 20.574 16.1605 19.897 17.531 18.7783C18.9015 17.6596 19.9007 16.1518 20.3968 14.4536C20.8929 12.7555 20.8626 10.9469 20.3099 9.26633C19.7573 7.58577 18.7082 6.1122 17.301 5.04C17.1429 4.91937 16.9434 4.86646 16.7463 4.8929C16.5492 4.91934 16.3707 5.02297 16.25 5.181M10.53 1.471C10.3895 1.61163 10.3107 1.80225 10.3107 2.001C10.3107 2.19975 10.3895 2.39037 10.53 2.531L11.28 3.281C9.54529 3.42389 7.89262 4.08091 6.53328 5.16803C5.17395 6.25516 4.16973 7.723 3.64903 9.38388C3.12833 11.0448 3.11481 12.8232 3.61019 14.4918C4.10558 16.1604 5.08736 17.6433 6.43 18.751C6.50597 18.8138 6.59356 18.861 6.68777 18.8899C6.78198 18.9188 6.88096 18.9289 6.97906 18.9196C7.07717 18.9102 7.17248 18.8817 7.25954 18.8355C7.34661 18.7893 7.42373 18.7265 7.4865 18.6505C7.54927 18.5745 7.59647 18.4869 7.62539 18.3927C7.65431 18.2985 7.66439 18.1995 7.65506 18.1014C7.64573 18.0033 7.61716 17.908 7.571 17.821C7.52483 17.7339 7.46197 17.6568 7.386 17.594C6.28671 16.6869 5.47913 15.4759 5.06417 14.1124C4.64921 12.7489 4.64527 11.2934 5.05285 9.92769C5.46043 8.56197 6.26145 7.34666 7.35582 6.43361C8.45018 5.52056 9.78936 4.95027 11.206 4.794L10.53 5.471C10.4584 5.54022 10.4013 5.623 10.362 5.71453C10.3228 5.80605 10.3021 5.90447 10.3013 6.00406C10.3005 6.10364 10.3195 6.20239 10.3573 6.29454C10.395 6.3867 10.4508 6.47041 10.5212 6.5408C10.5917 6.61118 10.6754 6.66683 10.7676 6.7045C10.8598 6.74217 10.9586 6.7611 11.0582 6.76019C11.1577 6.75927 11.2561 6.73854 11.3476 6.69919C11.4391 6.65984 11.5218 6.60266 11.591 6.531L13.591 4.531C13.7315 4.39037 13.8103 4.19975 13.8103 4.001C13.8103 3.80225 13.7315 3.61163 13.591 3.471L11.591 1.471C11.4504 1.33055 11.2598 1.25166 11.061 1.25166C10.8622 1.25166 10.6716 1.33055 10.531 1.471"/></svg>';

const titleCase = (s) => (s || '').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

/* Placeholder modals for flows that aren't built yet. */
export function placeholderModal(text) {
  sheet({ build: (b) => b.append(h('div', { class: 'ph-modal' }, text)) });
}
export const openShareSheet = () => placeholderModal('standard sharing ios sheet opens');

/* Technique label for a card with no exported post: first making-method
   tag it has, else a neutral fallback. Only the card's own data. */
const TECHS = ['wheel thrown', 'hand built', 'pinched', 'pinch built', 'coil', 'slab', 'press mould'];
const techOf = (c) => titleCase((c.tags || []).find(t => TECHS.includes(t)) || 'handmade');

/* Caption variants, all composed from the piece card -- no invented story
   ("Written from piece card"). Regenerate steps to the next one. */
function captionsFor(c, name) {
  const tags = c.tags || [];
  const year = new Date(c.created || Date.now()).getFullYear();
  const glaze = tags.find(t => /glaze|engobe|underglaze/.test(t));
  const clay = tags.find(t => /stoneware|porcelain|earthenware/.test(t));
  const cone = tags.find(t => /^cone /.test(t));
  const tech = techOf(c);
  return [
    `${name} / ${year}`,
    [`${name}.`, [tech, glaze].filter(Boolean).join(', ') + '.'].join(' '),
    [tech, clay, cone].filter(Boolean).join(' · ') + ` — ${name}, ${year}`,
    [name, glaze, clay].filter(Boolean).join(' · '),
  ];
}

/* Resolve what the Edit screen is editing: a post id, or a card id (its
   first post, or the card itself when it has no post yet). */
function resolve(ref) {
  const post = allPosts().find(p => p.id === ref) || postsForCard(ref)[0] || null;
  const card = S.byId(post ? post.cardId : ref);
  if (!card) return null;
  return { post, card, key: post ? post.id : 'card:' + card.id,
           name: post ? post.name : titleCase(card.title), tech: post ? post.tech : techOf(card),
           swatches: swatchesFor(S.pieceColor(card)) };
}

function editState(r) {
  const saved = S.postEdit(r.key) || {};
  return {
    bg: saved.bg ?? (r.post ? r.post.bg : 0),   // swatch index, or a CSS string (an export's own backdrop)
    caption: saved.caption ?? (r.post ? `${r.name} / 2026` : ''),
    photos: saved.photos || [],
  };
}
const bgCss = (r, bg) => (typeof bg === 'number' ? r.swatches[bg] : bg);

function navHeader(title, onBack, onPlus) {
  return h('div', { class: 'pe-nav' },
    h('button', { class: 'pe-navbtn', onclick: onBack, html: BACK_SVG, 'aria-label': 'Back' }),
    h('div', { class: 'pe-title' }, title),
    h('button', { class: 'pe-navbtn', onclick: onPlus, html: PLUS_SVG, 'aria-label': 'Add photos' }));
}

/* The composed post image: backdrop + slides (piece cutout, then any added
   photos) + the four corner labels. Slides swipe horizontally; the top-
   right counter follows the visible slide. */
function composed(r, st) {
  const slides = [...(r.post ? [r.post.piece] : []), ...st.photos];
  const counter = h('div', { class: 'pe-lab tr' }, `1/${slides.length}`);
  const track = h('div', { class: 'pe-slides' },
    ...slides.map(src => h('div', { class: 'pe-slide' }, img(src, r.name))));
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    counter.textContent = `${i + 1}/${slides.length}`;
  }, { passive: true });
  return h('div', { class: 'pe-img', style: { background: bgCss(r, st.bg) } },
    track,
    h('div', { class: 'pe-lab tl' }, 'Ceramics'),
    counter,
    h('div', { class: 'pe-lab bl' }, r.name),
    h('div', { class: 'pe-lab br' }, r.tech));
}

export function openPostEdit(ref) {
  const r = resolve(ref);
  if (!r) return;
  page((p, close) => {
    const st = editState(r);
    const save = () => S.updatePostEdit(r.key, { bg: st.bg, caption: st.caption, photos: st.photos });

    const imgSlot = h('div', { class: 'pe-imgwrap' });
    const hasImage = () => !!r.post || st.photos.length > 0;
    const addPhotos = () => pickPhoto((src) => {
      st.photos = [...st.photos, src]; save(); paintImage();
      toast({ text: 'Photo added to the post' });
    });
    const paintImage = () => {
      imgSlot.replaceChildren(hasImage()
        ? composed(r, st)
        : h('button', { class: 'pe-empty', onclick: addPhotos }, 'Upload an image'));
    };

    const swatches = h('div', { class: 'pe-swatches' });
    const paintSwatches = () => swatches.replaceChildren(...r.swatches.map((css, i) =>
      h('button', { class: 'pe-sw' + (st.bg === i ? ' on' : ''), style: { background: css },
        'aria-label': 'Backdrop ' + (i + 1),
        onclick: () => { st.bg = i; save(); paintSwatches(); paintImage(); } })));

    const caption = h('textarea', { class: 'pe-caption', placeholder: 'Write or generate', spellcheck: 'false' });
    caption.value = st.caption;
    caption.addEventListener('input', () => { st.caption = caption.value; save(); });

    const copy = () => {
      const done = () => toast({ text: 'Caption copied' });
      navigator.clipboard?.writeText(st.caption).then(done, done) ?? done();
    };

    /* Regenerate: a different backdrop + the next caption variant. (Later:
       composition too.) */
    const regen = () => {
      let next;
      do { next = Math.floor(Math.random() * r.swatches.length); } while (next === st.bg);
      st.bg = next;
      const opts = captionsFor(r.card, r.name);
      st.caption = opts[(opts.indexOf(st.caption) + 1) % opts.length];
      caption.value = st.caption;
      save(); paintSwatches(); paintImage();
      toast({ text: 'Backdrop and caption regenerated' });
    };

    const updated = ago(r.card.updated || r.card.created);

    p.append(
      statusBar(),
      navHeader(r.card.title, close, addPhotos),
      h('div', { class: 'pe-body' },
        imgSlot,
        h('div', { class: 'pe-sh' },
          h('div', { class: 'pe-sh-t' }, 'Backdrop'),
          h('button', { class: 'pe-sh-act', onclick: () => placeholderModal('Colour-picker opens') }, 'Custom')),
        swatches,
        h('div', { class: 'pe-sh' },
          h('div', {},
            h('div', { class: 'pe-sh-t' }, 'Post caption'),
            h('div', { class: 'pe-sh-sub' }, 'Written from piece card. No invented story.')),
          h('button', { class: 'pe-sh-act', onclick: copy }, 'Copy')),
        caption,
        h('div', { class: 'pe-sh pe-piece' },
          h('div', {},
            h('div', { class: 'pe-sh-t' }, 'Piece card'),
            h('div', { class: 'pe-sh-sub big' }, 'Last updated ' + updated)),
          h('button', { class: 'circlebtn', onclick: () => openCard(r.card.id), html: ICON.arrowFwd, 'aria-label': 'Open piece card' }))),
      h('div', { class: 'pe-bottom' },
        h('button', { class: 'pe-regen', onclick: regen, html: REGEN_SVG, 'aria-label': 'Regenerate' }),
        h('button', { class: 'pe-btn paper', onclick: () => openPostPreview(r.key, addPhotos) }, 'See preview'),
        h('button', { class: 'pe-btn accent', onclick: openShareSheet }, 'Post')));

    paintImage();
    paintSwatches();
  });
}

/* Preview (Figma 493:16989): the same card as the carousel shows -- the
   exported post image, or the placeholder card for a generated post. A
   card with no post at all (no piece photo) shows the Edit screen's
   composed image. "+" goes back to Edit and opens the photo picker there
   (onPlus), since the photos land on the Edit screen. */
export function openPostPreview(ref, onPlus) {
  const r = resolve(ref.startsWith('card:') ? ref.slice(5) : ref);
  if (!r) return;
  page((p, close) => {
    const art = !r.post ? h('div', { class: 'pv-art composed' }, composed(r, editState(r)))
      : r.post.img ? h('div', { class: 'pv-art' }, img(r.post.img, r.name))
      : h('div', { class: 'pv-art' }, postPlaceholder(r.name));
    p.append(
      statusBar(),
      navHeader(r.card.title, close, () => { close(); onPlus && onPlus(); }),
      h('div', { class: 'pv-body' },
        art,
        h('div', { class: 'pv-btns' },
          h('button', { class: 'pe-btn dark', onclick: close }, 'Edit'),
          h('button', { class: 'pe-btn accent', onclick: openShareSheet }, 'Post'))));
  });
}
