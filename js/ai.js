/* UNFIRED — deterministic mock intelligence.
   No external API. Everything is derived from the user's own archive. */
import * as S from './store.js';

const norm = (s) => (s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
const words = (s) => norm(s).split(/\s+/).filter(Boolean);

/* ---------- concept lexicon ---------- */
export const CONCEPTS = {
  handle:     ['handle','handles','pulled handle','grip'],
  crack:      ['crack','cracked','cracking','split','snapped','broke','broken','fissure'],
  engobe:     ['engobe','slip','turquoise engobe','blue engobe'],
  glaze:      ['glaze','glazed','glazing','gloss','satin','matt','matte','dip','dipped'],
  metallic:   ['metallic','lustre','luster','iron','bronze'],
  bisque:     ['bisque','biscuit','first firing','04'],
  firing:     ['firing','fired','kiln','cone','temperature','1240','1220','1260','fire'],
  coil:       ['coil','coils','coiled','coiling'],
  slab:       ['slab','slabs','rolled','hump mould','press mould','template'],
  pinch:      ['pinch','pinched','pinching'],
  nerikomi:   ['nerikomi','agateware','stained clay','marbled'],
  porcelain:  ['porcelain'],
  stoneware:  ['stoneware'],
  mug:        ['mug','mugs','cup','cups','tumbler','tumblers'],
  bowl:       ['bowl','bowls'],
  plate:      ['plate','plates','platter','dish','dishes'],
  vase:       ['vase','vases','jug','jugs','pitcher','teapot','pot'],
  animal:     ['animal','dog','cat','bird','creature','figure','sculpture'],
  dry:        ['dry','drying','leather hard','leather-hard','bone dry','wrapped','plastic'],
  pinhole:    ['pinhole','pinholes','pitting','bubbles'],
  run:        ['ran','run','running','dripped','shelf','stuck'],
  star:       ['star','stars','starred','starburst'],
  blue:       ['blue','cobalt','navy','turquoise'],
  red:        ['red','coral','pink','crimson'],
  green:      ['green'],
  yellow:     ['yellow','mustard','ochre'],
  lavender:   ['lavender','lilac','purple'],
  explode:    ['explode','exploded','blew up','blow','burst','shattered'],
  hollow:     ['hollow','hollowed','vent','vent hole','solid'],
  wave:       ['wave','wavy','squiggle'],
  underglaze: ['underglaze','painted','painting','brush','freehand','liner'],
};

export function conceptsIn(text) {
  const t = ' ' + norm(text) + ' ';
  const hits = [];
  for (const [c, terms] of Object.entries(CONCEPTS))
    if (terms.some(x => t.includes(' ' + x + ' ') || t.includes(x))) hits.push(c);
  return hits;
}

/* ---------- searchable corpus per card ---------- */
function corpus(c) {
  const bits = [c.title, c.desc, (c.tags || []).join(' ')];
  (c.notes || []).forEach(n => bits.push(n.text));
  (c.threads || []).forEach(t => { bits.push(t.title); (t.msgs || []).forEach(m => bits.push(m.text)); });
  (c.photos || []).forEach(p => bits.push(p.cap));
  if (c.plan) {
    (c.plan.params || []).forEach(p => bits.push(p.key + ' ' + p.val));
    (c.plan.risks || []).forEach(r => bits.push(r.k + ' ' + r.t));
    (c.plan.steps || []).forEach(s => bits.push(s));
  }
  return bits.filter(Boolean).join(' \n ');
}

function score(c, q) {
  const text = norm(corpus(c));
  const title = norm(c.title);
  const qw = words(q).filter(w => w.length > 2 && !STOP.has(w));
  let s = 0;
  for (const w of qw) {
    if (title.includes(w)) s += 6;
    const n = text.split(w).length - 1;
    if (n) s += Math.min(n, 4) * 2;
  }
  const qc = conceptsIn(q), cc = conceptsIn(corpus(c));
  for (const k of qc) if (cc.includes(k)) s += 4;
  return s;
}
const STOP = new Set(['the','and','for','with','что','what','did','you','i','my','me','how','can','make','made','show','find','about','which','from','have','was','are','some','things','piece','pieces','all','not','use','used','using','on','in','of','to','a','an','it','is','do','last','recently','me']);

/* ══════════════════ 1. LOG CLASSIFICATION ══════════════════ */
/* Where does a new capture belong? Best guess, always undoable. */
export function classify(text, attachments = []) {
  const cs = S.cards();
  const t = norm(text);
  const cons = conceptsIn(text);

  /* explicit name match wins */
  let best = null, bestScore = 0;
  for (const c of cs) {
    let sc = 0;
    const tw = words(c.title).filter(w => w.length > 3);
    for (const w of tw) if (t.includes(w)) sc += 8;
    const cc = conceptsIn(corpus(c));
    for (const k of cons) if (cc.includes(k)) sc += 2.2;
    if (c.state === 'making') sc *= 1.7;                    /* what you're working on now */
    else if (c.state === 'idea') sc *= 0.85;
    const age = (Date.now() - (c.updated || 0)) / 864e5;
    sc += Math.max(0, 3 - age / 30);
    if (sc > bestScore) { bestScore = sc; best = c; }
  }

  const isObservation = /\b(worked|better|cracked|crack|dried|too|should|next time|degrees|cone|coats|layers|note|it)\b/i.test(text);
  const isNewIdea = /\b(idea|want to make|i want|make a|make some|try making|would be|next i|new)\b/i.test(text);

  const attachKind = attachments.length ? attachments[0].kind : null;

  if (isNewIdea && bestScore < 12) return newIdeaFrom(text, attachments);
  if (attachKind === 'inspiration' && bestScore < 12) return newIdeaFrom(text, attachments);

  if (best && bestScore >= 6) {
    return {
      kind: 'attach', card: best,
      extraction: extract(text),
      inferState: inferState(best, text, attachKind),
      reason: bestScore >= 12 ? 'named' : (isObservation ? 'observation' : 'context'),
    };
  }
  return newIdeaFrom(text, attachments);
}

function inferState(card, text, attachKind) {
  const t = norm(text);
  if (card.state === 'idea' &&
      (/\b(started|starting|rolled|coiled|pinched|building|built|attached|throwing|wedged)\b/.test(t) || attachKind === 'process'))
    return 'making';
  if (card.state === 'making' &&
      (/\b(out of the kiln|out of the glaze|finished|done|fired and|it's done|all good|came out)\b/.test(t) || attachKind === 'final'))
    return 'finished';
  return null;
}

function titleFrom(text) {
  const t = text.replace(/^(i want to |i'd like to |make |making |idea |new idea[:,]? )/i, '');
  const cons = conceptsIn(text);
  const colour = ['blue','red','green','yellow','lavender'].find(c => cons.includes(c));
  const form = ['mug','bowl','plate','vase','animal'].find(c => cons.includes(c));
  const FORM = { mug: 'MUG', bowl: 'BOWL', plate: 'PLATE', vase: 'VASE', animal: 'FIGURE' };
  const COL = { blue: 'BLUE', red: 'RED', green: 'GREEN', yellow: 'YELLOW', lavender: 'LAVENDER' };
  if (colour && form) return `${COL[colour]} ${FORM[form]}`;
  if (form) {
    const tech = ['coil','slab','pinch','nerikomi'].find(c => cons.includes(c));
    const T = { coil: 'COILED', slab: 'SLAB', pinch: 'PINCHED', nerikomi: 'NERIKOMI' };
    return tech ? `${T[tech]} ${FORM[form]}` : FORM[form];
  }
  const w = t.split(/[.,;\n]/)[0].split(/\s+/).slice(0, 4).join(' ');
  return (w || 'NEW IDEA').toUpperCase();
}

function newIdeaFrom(text, attachments) {
  const card = {
    id: S.uid('c'),
    state: 'idea',
    title: titleFrom(text),
    created: Date.now(), updated: Date.now(),
    origin: { type: attachments.length ? 'photo' : 'voice', label: 'Logged just now' },
    glow: '#2B36FF',
    desc: text.trim(),
    tags: conceptsIn(text),
    hero: attachments.length ? { src: attachments[0].src, ref: true } : null,
    plan: generatePlan(text),
    photos: attachments.map((a, i) => ({ id: S.uid('p'), kind: a.kind || 'inspiration', src: a.src, cap: 'Added with the log' })),
    notes: [], threads: [],
    isNew: true,
  };
  return { kind: 'create', card, extraction: extract(text), reason: 'new' };
}

/* structured extraction — what UNFIRED pulled out of the sentence */
export function extract(text) {
  const out = [];
  const t = text.toLowerCase();
  const cone = t.match(/cone\s?(\d{1,2})/);           if (cone) out.push({ k: 'firing', v: 'Cone ' + cone[1] });
  const temp = t.match(/(\d{3,4})\s?(°|degrees|c\b)/); if (temp) out.push({ k: 'firing', v: temp[1] + '°C' });
  const coats = t.match(/(one|two|three|four|\d+)\s?(coats?|layers?)/);
  if (coats) out.push({ k: 'surface', v: coats[1] + ' coats' });
  const mm = t.match(/(\d{1,2})\s?(mm|millimet)/);     if (mm) out.push({ k: 'wall', v: mm[1] + ' mm' });
  const cm = t.match(/(\d{1,3})\s?(cm|centimet)/);     if (cm) out.push({ k: 'height', v: cm[1] + ' cm' });
  const g  = t.match(/(\d{3,4})\s?(g|grams?|kg)\b/);   if (g) out.push({ k: 'clay amount', v: g[0] });
  const mins = t.match(/(\d{1,3})\s?(minutes?|mins?|hours?)/); if (mins) out.push({ k: 'timing', v: mins[0] });
  const cons = conceptsIn(text);
  if (cons.includes('crack')) out.push({ k: 'result', v: 'Crack recorded' });
  if (cons.includes('pinhole')) out.push({ k: 'result', v: 'Pinholing recorded' });
  return out;
}

/* ══════════════════ 2. PLAN GENERATION ══════════════════ */
export function generatePlan(text) {
  const c = conceptsIn(text);
  const tech = c.includes('coil') ? 'Coil built'
    : c.includes('slab') ? 'Slab built'
    : c.includes('nerikomi') ? 'Nerikomi'
    : c.includes('animal') ? 'Modelled + hollowed'
    : c.includes('plate') ? 'Slab over hump mould'
    : 'Pinched + paddled';
  const form = c.includes('plate') ? 'plate' : c.includes('bowl') ? 'bowl'
    : c.includes('vase') ? 'vase' : c.includes('animal') ? 'figure' : 'cup';
  const amount = { plate: '~900 g', bowl: '~450 g', vase: '~1.2 kg', figure: '~1.2 kg', cup: '~450 g' }[form];
  const height = { plate: '~22 cm across', bowl: '~14 cm across', vase: '~16 cm tall', figure: '~15 cm tall', cup: '~9 cm tall' }[form];
  const body = c.includes('porcelain') ? 'Porcelain' : 'Cream stoneware';

  const steps = [];
  if (tech === 'Coil built') steps.push('Coil the body in two sittings, paddle it round between each.');
  else if (tech.startsWith('Slab')) steps.push('Roll an 8 mm slab and form it over the mould, smoothing from the centre out.');
  else if (tech === 'Modelled + hollowed') steps.push('Model solid, halve with a wire, hollow to about 12 mm, rejoin with slip.');
  else if (tech === 'Nerikomi') steps.push('Build and rest the stained block overnight, then slice thin and lay the pieces edge to edge.');
  else steps.push('Pinch the wall from a ball, paddle it even, level the rim.');
  steps.push('Refine at leather-hard — scrape rather than rib if there is any pattern in the clay.');
  if (c.includes('handle') || form === 'cup' || form === 'vase')
    steps.push('Pull the handle separately and attach at soft leather-hard: score, slip, wrap the join.');
  if (c.includes('animal')) steps.push('Leave a vent hole where it will not show.');
  steps.push('Dry slow under plastic, 4–6 days.');
  steps.push('Bisque 04.');
  if (c.includes('engobe')) steps.push('Engobe at leather-hard, three coats, letting each lose its shine.');
  if (c.includes('underglaze') || c.includes('star')) steps.push('Paint on the bisque, two coats — one coat goes pale over cream.');
  steps.push('Glaze and fire to cone 6.');

  const risks = [];
  if (c.includes('handle') || form === 'cup')
    risks.push({ k: 'Handle crack', t: 'Three of your last four cracks were at handle joins. Attach soft, wrap for three days.' });
  if (c.includes('animal')) risks.push({ k: 'Blow-out', t: 'Anything modelled thicker than 2 cm has to be hollowed and vented.' });
  if (c.includes('nerikomi')) risks.push({ k: 'Smearing', t: 'Ribbing nerikomi while soft drags the colours. Scrape at leather-hard.' });
  if (form === 'plate') risks.push({ k: 'S-crack', t: 'Compress both faces and dry flat, flipping daily.' });
  if (c.includes('glaze')) risks.push({ k: 'Glaze run', t: 'Estimated from your lavender teapot — wax the foot plus 8 mm of wall. Check the glaze supplier sheet for the real range.' });
  if (!risks.length) risks.push({ k: 'Uneven drying', t: 'Thin parts dry ahead of thick ones. Wrap the thin bits.' });

  return {
    assumptions: [`${body}, cone 6`, height, tech],
    params: [
      { key: 'technique', val: tech, src: 'ai' },
      { key: 'clay', val: body, src: 'ai' },
      { key: 'clay amount', val: amount, src: 'ai' },
      { key: 'dimensions', val: height, src: 'ai' },
      { key: 'surface', val: c.includes('engobe') ? 'Engobe, 3 coats' : c.includes('underglaze') ? 'Underglaze, 2 coats' : 'One glaze', src: 'ai' },
      { key: 'firing', val: 'Bisque 04 · glaze cone 6', src: 'ai' },
    ],
    tools: ['Rib', 'Paddle', 'Needle tool', 'Sponge'].concat(tech.startsWith('Slab') ? ['Rolling pin', '8 mm guides'] : []),
    steps, risks,
    refs: relatedRefs(text),
  };
}

function relatedRefs(text) {
  const cs = S.cards().filter(c => c.state === 'finished');
  return cs.map(c => ({ c, s: score(c, text) }))
    .filter(x => x.s > 5).sort((a, b) => b.s - a.s).slice(0, 2)
    .map(x => ({ cardId: x.c.id, note: memoryLine(x.c) }));
}

function memoryLine(c) {
  const n = (c.notes || [])[0];
  if (n) return n.text.length > 130 ? n.text.slice(0, 128) + '…' : n.text;
  const r = (c.plan && c.plan.risks || [])[0];
  return r ? r.t : c.desc.slice(0, 120);
}

/* ══════════════════ 3. SEMANTIC MEMORY / SEARCH ══════════════════ */
export const SUGGESTED = [
  'What did I learn about handles?',
  'Show me pieces where the glaze cracked or ran',
  'Find the vase I made before Christmas',
  'Things I made with coils',
  'Which glaze did I use on the blue bowl?',
  'What can I make with 500 g of white clay?',
  'Which techniques haven\'t I used recently?',
  'Show me unsuccessful pieces using porcelain',
];

export function search(q) {
  const cs = S.cards();
  const ranked = cs.map(c => ({ c, s: score(c, q) })).filter(x => x.s > 3)
    .sort((a, b) => b.s - a.s);
  const answer = compose(q, ranked.map(x => x.c));
  return { answer, results: (answer.cards || ranked.map(x => x.c)).slice(0, 6) };
}

function get(id) { return S.byId(id); }

function compose(q, ranked) {
  const t = norm(q), c = conceptsIn(q);
  const P = (...p) => p.filter(Boolean);

  /* handles */
  if (c.includes('handle')) {
    const cards = ['blue-striped-mug', 'red-pink-pitcher', 'green-cup'].map(get).filter(Boolean);
    return { paras: P(
      'Handles are the thing that keeps going wrong, and you have already solved it once.',
      'BLUE LINE MUG cracked at the lower join after bisque — you logged that you attached the handle when the mug had gone too dry. PINK PITCHER is the counter-example: handle and body at the same soft leather-hard, scored and slipped, then dried wrapped for three days. No crack.',
      'On GREEN CUP you pulled the handle much thinner than you used to, and noted it felt better in the hand. Your handles have got thinner across the year.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* cracks / runs / failures */
  if (c.includes('crack') || c.includes('run') || c.includes('explode')) {
    const cards = ['blue-striped-mug', 'lavender-teapot-2', 'yellow-creature-dish', 'polka-dot-dog'].map(get).filter(Boolean);
    return { paras: P(
      'Four failures in the archive, and they fall into two groups.',
      'Joins drying at different speeds: BLUE LINE MUG handle, SPOTTED DOG ears. Both were attached too dry and cracked where thin met thick.',
      'Trapped water and running glaze: the first YELLOW CREATURE figure was modelled solid and came apart in the bisque; the lavender on TEAPOT №1 moved about 6 mm and stuck the foot to the shelf.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* christmas vase */
  if (t.includes('christmas') || (c.includes('vase') && /before|last|december/.test(t))) {
    const cards = [get('three-flower-vase')].filter(Boolean);
    return { paras: P(
      'THREE FLOWER VASE, finished 18 December 2025 and given away as a present.',
      'Coil built, ~1 kg of cream stoneware, 7 mm walls, applied flowers pressed on at leather-hard under a blue satin. You logged at the time that 7 mm felt right — light to pick up, thick enough not to warp.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* coils */
  if (c.includes('coil')) {
    const cards = S.cards().filter(x => (x.tags || []).includes('coil'));
    return { paras: P(
      `${cards.length} pieces built with coils.`,
      'THREE FLOWER VASE and PINK PITCHER are the two finished ones — both coiled then paddled round, both at about 7 mm. LAVENDER TEAPOT №2 is on the bench now, same method. BLUE ENGOBE JUG and GARLIC KEEPER are waiting as ideas.',
      'Coiling is your most reliable technique. Nothing coiled has cracked.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* blue bowl glaze */
  if (c.includes('bowl') && c.includes('blue')) {
    const cards = [get('deep-blue-bowl')].filter(Boolean);
    return { paras: P(
      'DEEP BLUE BOWL — a speckled blue, two dips, cone 6.',
      'It pooled dark and lovely in the well, and pinholed along the rim exactly where the second dip made it thick. Your note from 1 March says the same. A hold near top temperature usually closes pinholes, but that is an estimate — check the glaze manufacturer specification before you change your firing.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* 500 g */
  if (/\b(\d{3})\s?(g|grams)\b/.test(t) || /how much clay/.test(t)) {
    const g = (t.match(/\b(\d{3})\s?(g|grams)\b/) || [, '500'])[1];
    const cards = ['navy-flower-cup', 'green-cup', 'deep-blue-bowl', 'idea-star-mug'].map(get).filter(Boolean);
    return { paras: P(
      `${g} g is one cup or one small bowl at the sizes you actually work at.`,
      'FLOWER CUP took ~380 g, GREEN CUP ~420 g, DEEP BLUE BOWL ~400 g. Your mugs land around 450 g with the handle.',
      'RED STAR MUG is sitting in your ideas at ~450 g, which fits with a little to spare.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* techniques not used recently */
  if (/haven|not used|recently|forgot|stopped/.test(t) || c.includes('nerikomi')) {
    const cards = ['nerikomi-bowl', 'idea-nerikomi-tumblers'].map(get).filter(Boolean);
    return { paras: P(
      'Nerikomi. One attempt, in April, and nothing since.',
      'The NERIKOMI BOWL smeared because you ribbed it while it was still soft. You never photographed it. NERIKOMI TUMBLERS is the idea that fixes it — a straight form you can scrape at leather-hard instead.',
      'Wheel throwing does not appear anywhere in the archive. Everything this year is hand built.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* porcelain failures */
  if (c.includes('porcelain')) {
    const cards = ['nerikomi-bowl', 'idea-nerikomi-tumblers'].map(get).filter(Boolean);
    return { paras: P(
      'Porcelain appears twice, and only for nerikomi.',
      'NERIKOMI BOWL is the only fired porcelain piece and it was a partial failure — the pattern smeared. Everything else in the archive is cream or speckled stoneware at cone 6.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* engobe */
  if (c.includes('engobe')) {
    const cards = ['blue-striped-mug', 'idea-blue-engobe-jug'].map(get).filter(Boolean);
    return { paras: P(
      'Three coats. That is the whole finding.',
      'On BLUE LINE MUG two coats went patchy over the cream body and the brush drag showed. Three covered. You logged it on 11 March and it is the reason BLUE ENGOBE JUG specifies three.',
      'Engobe wants leather-hard clay — on bone dry it lifts.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* firing */
  if (c.includes('firing') || c.includes('bisque')) {
    const cards = S.finished().slice(0, 4);
    return { paras: P(
      'Every piece in the archive is bisque 04 then glaze cone 6. You have not varied it once.',
      'The only firing problems you have recorded are surface ones: pinholes on DEEP BLUE BOWL where the glaze went on thick, and the lavender running on TEAPOT №1. Both are application, not schedule.'
    ), cards, src: 'YOUR ARCHIVE' };
  }
  /* stars */
  if (c.includes('star')) {
    const cards = ['starred-plates', 'navy-starburst-plate', 'idea-star-mug'].map(get).filter(Boolean);
    return { paras: P(
      'Stars are the motif you keep coming back to — three pieces and one idea.',
      'STARRED PLATES in red, STARBURST PLATE in cobalt, small pastel stars on YELLOW CREATURE DISH. RED STAR MUG would be the first time the motif leaves a flat surface.'
    ), cards, src: 'YOUR ARCHIVE' };
  }

  /* generic fallback — still grounded in real cards */
  if (!ranked.length) return { paras: null, cards: [], src: null };
  const top = ranked.slice(0, 3);
  return { paras: [
    `${ranked.length} ${ranked.length === 1 ? 'piece' : 'pieces'} in your archive touch on that.`,
    top.map(c => `${c.title} — ${memoryLine(c)}`).join('\n\n')
  ], cards: ranked, src: 'YOUR ARCHIVE' };
}

/* ══════════════════ 4. CARD CHAT ══════════════════ */
export function reply(card, question) {
  const q = norm(question), c = conceptsIn(question);
  const line = (txt, src) => ({ role: 'ai', text: txt, src });

  if (c.includes('handle') || q.includes('handle'))
    return line(`Attach at soft leather-hard — the wall should still take a fingernail mark, and the handle should be at exactly the same stage.\n\nOn BLUE LINE MUG you attached one too dry and it cracked at the lower join after bisque. On PINK PITCHER you matched the moisture, scored and slipped, then wrapped the join for three days, and it held. Use that.`, 'archive');

  if (c.includes('dry') || q.includes('how long'))
    return line(`Four to six days under plastic for something this size, and wrap anything thin separately.\n\nThe pattern in your archive is consistent: everything that cracked — the mug handle, the dog's ears — was a thin part that dried ahead of a thick one.`, 'archive');

  if (c.includes('firing') || c.includes('bisque') || c.includes('metallic'))
    return line(`Bisque 04 then glaze cone 6, which is what every piece in your archive has had.\n\nEstimated for this one — if you are changing glaze, check the manufacturer specification rather than assuming it behaves like the last one. Your lavender moved 6 mm at cone 6 and that was within its stated range.`, 'ref');

  if (c.includes('glaze') || c.includes('run'))
    return line(`Wax the foot and the bottom 8 mm of the wall.\n\nThat number comes from your own measurement — the lavender on TEAPOT №1 ran about 6 mm and stuck to the shelf. 8 mm gives you margin. Treat it as an estimate, not a guarantee, and check the glaze sheet if you fire hotter.`, 'archive');

  if (c.includes('engobe'))
    return line(`Three coats, onto leather-hard clay, letting each lose its shine before the next.\n\nYou logged this on BLUE LINE MUG in March: two coats went patchy over the cream body.`, 'archive');

  if (c.includes('crack'))
    return line(`Most likely a moisture difference at a join, which is where three of your last four cracks happened.\n\nScore both faces properly, use slip made from the same clay, and wrap the join for the first few days. If it is a cut edge instead — a rim or a hole — compress it with a damp chamois before it dries.`, 'archive');

  if (c.includes('hollow') || c.includes('explode') || c.includes('animal'))
    return line(`Hollow anything thicker than about 2 cm and leave a vent hole where it will not show.\n\nThe first YELLOW CREATURE figure was solid at roughly 4 cm and came apart in the bisque. Since then SPOTTED DOG, CAT CANDLE HOLDER and SPECKLED BIRD were all halved, hollowed to 12 mm and vented, and all three survived.`, 'archive');

  if (c.includes('nerikomi'))
    return line(`Do not rib it while it is soft — scrape at leather-hard and then sand the bisque.\n\nThat is precisely what spoiled NERIKOMI BOWL in April. Also run test tiles: stained and unstained porcelain can shrink at slightly different rates.`, 'archive');

  if (/how much clay|weight|grams|kg/.test(q))
    return line(`Around ${(card.plan?.params.find(p => p.key === 'clay amount') || {}).val || '450 g'} for this form, based on what you have actually weighed out before — cups land at 380–450 g, plates near 900 g, and the coiled vessels around 1–1.4 kg.`, 'archive');

  if (/why|what if|should i/.test(q))
    return line(`For this piece the thing most likely to bite you is ${(card.plan?.risks[0]?.k || 'uneven drying').toLowerCase()}: ${card.plan?.risks[0]?.t || 'thin parts dry ahead of thick ones.'}\n\nEverything else in the plan is an estimate you can overwrite — tap any parameter to change it.`, 'ref');

  return line(`Working from ${card.title} and the rest of your archive: ${card.plan?.risks[0]?.t || 'dry it slowly and attach anything thin at soft leather-hard.'}\n\nAsk me about the handle, the drying, the glaze or the firing and I can be more specific.`, 'archive');
}

/* ══════════════════ 5. INSIGHTS ══════════════════ */
export function insights() {
  const fin = S.finished();
  const all = S.cards();
  const out = [];

  /* monthly output over the last 12 months */
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ d, n: 0, lab: d.toLocaleString('en', { month: 'narrow' }) });
  }
  fin.forEach(c => {
    const d = new Date(c.finishedAt || c.updated);
    const m = months.find(x => x.d.getFullYear() === d.getFullYear() && x.d.getMonth() === d.getMonth());
    if (m) m.n++;
  });
  const peak = Math.max(1, ...months.map(m => m.n));
  const quiet = months.filter(m => !m.n).length;
  out.push({ kind: 'bars', tone: 'dark', big: `${fin.length}\nPIECES\nFIRED`,
    note: `Across twelve months, never more than ${peak} in one. ` +
      (quiet ? `${quiet} month${quiet === 1 ? '' : 's'} with nothing out of the kiln.` : 'Not one empty month.'),
    months, peak });

  /* cups & mugs */
  const cups = fin.filter(c => /mug|cup/i.test(c.title) || (c.tags||[]).some(t => /mug|cup/.test(t)));
  if (cups.length >= 3)
    out.push({ kind: 'text', tone: 'acid', big: `YOU MADE\n${cups.length} CUPS\nTHIS YEAR.`,
      note: 'Your handles got thinner every time — 12 mm on the blue line mug, 9 mm on the green cup. You wrote that the thin one felt better in the hand.',
      act: 'Show me the cups', go: { type: 'search', q: 'mug cup handle' } });

  /* cracks at handles */
  const crackCards = all.filter(c => (c.notes || []).some(n => /crack/i.test(n.text)));
  const handleCracks = crackCards.filter(c => (c.notes || []).some(n => /crack/i.test(n.text) && /handle|ear|join|spout/i.test(n.text)));
  if (handleCracks.length)
    out.push({ kind: 'text', tone: 'orange', big: `${handleCracks.length} OF YOUR\nLAST ${crackCards.length} CRACKS\nWERE AT JOINS.`,
      note: 'Handles, ears, spouts. Always a thin piece attached to a thick one, always dried too fast. The pink pitcher is the one that worked — same moisture, scored, wrapped for three days.',
      act: 'What did I learn about handles?', go: { type: 'search', q: 'What did I learn about handles?' } });

  /* techniques */
  const TECHS = ['coil','slab','pinched','press mould','modelled','nerikomi','engobe','wax resist'];
  const techCount = TECHS.map(t => ({ t, n: all.filter(c => (c.tags||[]).some(x => x.includes(t))).length }))
    .sort((a, b) => b.n - a.n);
  out.push({ kind: 'tech', tone: 'paper', big: 'HOW YOU\nBUILD.', techCount,
    note: 'Every piece this year was hand built. The wheel does not appear once.' });

  /* dormant technique */
  const ner = S.byId('nerikomi-bowl');
  if (ner) {
    const mo = Math.max(1, Math.round((Date.now() - ner.finishedAt) / 2.63e9));
    out.push({ kind: 'text', tone: 'blue', big: `YOU HAVEN'T\nTOUCHED\nNERIKOMI\nIN ${mo} MONTHS.`,
      note: 'One bowl, in April, and the pattern smeared because you ribbed it soft. There is a fix sitting in your ideas.',
      act: 'Give me an idea', go: { type: 'card', id: 'idea-nerikomi-tumblers' } });
  }

  /* colour */
  const reds = all.filter(c => (c.tags||[]).some(t => /red|coral|pink/.test(t))).length;
  const blues = all.filter(c => (c.tags||[]).some(t => /blue|cobalt|navy|turquoise/.test(t))).length;
  out.push({ kind: 'evo', tone: 'dark', big: 'BLUE, THEN\nRED.',
    note: `${blues} pieces lean blue, ${reds} lean red. The blues are all from the winter; everything since June has been red, coral or orange.`,
    a: blues, b: reds });

  /* repeated form */
  const plates = all.filter(c => /plate|dish|platter/i.test(c.title));
  if (plates.length >= 3)
    out.push({ kind: 'text', tone: 'dark', big: `${plates.length}\nFLAT\nTHINGS.`,
      note: 'Plates and dishes are your safest form — every one came out of the kiln intact. All of them are an 8 mm slab over the same hump mould.',
      act: 'Show me the flat work', go: { type: 'search', q: 'plate dish slab' } });

  /* process → result connection */
  out.push({ kind: 'text', tone: 'acid', big: 'SLOW\nDRYING\nIS THE\nWHOLE JOB.',
    note: 'Every piece you logged as wrapped and dried slowly survived. Every crack in the archive followed a note about something being attached too dry or drying fast.',
    act: 'Show me the cracks', go: { type: 'search', q: 'crack' } });

  /* experimentation */
  const exps = all.filter(c => (c.tags||[]).includes('experiment') || (c.tags||[]).includes('glaze test'));
  out.push({ kind: 'text', tone: 'orange', big: `${exps.length}\nEXPERIMENTS.`,
    note: 'Nerikomi, the speckled blue, wax resist. Two of the three went partly wrong, and both of those turned into a better idea afterwards.' });

  return out;
}

/* ══════════════════ 6. DISCOVER FEED ══════════════════ */
export function discoverFeed() {
  const s = S.get();
  const skip = new Set(s.discardedIdeas);
  const fin = S.finished(), idea = S.ideas();
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const items = [];

  idea.slice(0, 4).forEach(c => items.push({
    id: 'own-' + c.id, kind: 'own', cardId: c.id, title: c.title, why: 'From your own ideas',
    src: c.hero?.src || null, desc: c.desc, source: 'YOUR ARCHIVE', grad: 'g3',
  }));

  const varied = fin.slice(0, 5).map(c => {
    const t = variation(c);
    return { id: 'var-' + c.id, kind: 'variation', title: t.title, why: t.why, src: c.hero?.src || null,
      desc: t.desc, source: 'YOUR ARCHIVE', grad: 'g1', from: c.id };
  });
  items.push(...varied);

  items.push({ id: 'ner-1', kind: 'dormant', title: 'NERIKOMI TILE PANEL', source: 'YOUR ARCHIVE', grad: 'g4',
    why: 'You haven\'t used nerikomi in four months', src: null,
    desc: 'Nine small tiles, each a slice from the same block, laid out as one panel. Flat means no ribbing, so the pattern cannot smear.' });
  items.push({ id: 'pin-1', kind: 'pinterest', title: 'WEIRD HANDLE STUDY', source: 'CONNECTED PINTEREST', grad: 'g2',
    why: 'From your Weird handles board', src: null,
    desc: 'Six cups, one form, six handles that should not work. A pulled loop, a folded strap, a pinched ear, a knuckle, a rope, a hole.' });
  items.push({ id: 'ref-1', kind: 'reference', title: 'UNGLAZED FOOT RING', source: 'CERAMIC REFERENCE', grad: 'g3',
    why: 'A technique you have not tried', src: null,
    desc: 'Leave the bottom band raw so the fired clay shows against the glaze. Works especially well with your speckled body.' });

  return items.filter(i => !skip.has(i.id)).sort(() => Math.random() - .5);
}

function variation(c) {
  const t = (c.tags || []);
  if (t.includes('stars')) return { title: 'STARS ON A CURVE', why: `A variation on ${c.title}`,
    desc: 'Take the red star painting off the flat plate and put it on a rounded form, where the stars foreshorten as they wrap.' };
  if (t.includes('coil')) return { title: c.title.split(' ')[0] + ' AT TWICE THE HEIGHT', why: `A variation on ${c.title}`,
    desc: 'The same coil-and-paddle method, taken to 30 cm. Build in three sittings and let each one stiffen.' };
  if (t.includes('animal')) return { title: 'THE SAME ANIMAL, ONE METRE SMALLER', why: `A variation on ${c.title}`,
    desc: 'Shrink the modelled figure to 5 cm so it can be solid, no hollowing, no vent hole. A whole shelf of them.' };
  if (t.some(x => /glaze/.test(x))) return { title: 'ONE GLAZE, FIVE FORMS', why: `A variation on ${c.title}`,
    desc: 'Use the glaze that worked as the only constant and change nothing else. A set that reads as a family.' };
  return { title: c.title + ', INVERTED', why: `A variation on ${c.title}`,
    desc: 'Same silhouette, opposite surface — bare where it was glazed, glazed where it was bare.' };
}

/* ══════════════════ 7. COLLIDE ══════════════════ */
export function collide() {
  const pool = S.cards().filter(c => c.state !== 'idea' || c.hero);
  const shuffled = [...pool].sort(() => Math.random() - .5);
  const n = Math.random() > .55 ? 3 : 2;
  const picks = shuffled.slice(0, n);
  return { picks, result: fuse(picks) };
}

const KEYWORD = (c) => {
  const t = c.tags || [];
  if (t.includes('stars')) return 'STAR';
  if (t.includes('nerikomi')) return 'NERIKOMI';
  if (t.some(x => /engobe/.test(x))) return 'ENGOBE';
  if (t.includes('animal')) return 'CREATURE';
  if (t.includes('coil')) return 'COILED';
  if (t.includes('wax resist')) return 'RESIST';
  if (t.includes('stripes')) return 'STRIPED';
  if (t.some(x => /wave|wavy/.test(x))) return 'WAVE';
  if (t.includes('shell')) return 'SHELL';
  if (t.includes('heart')) return 'HEART';
  const w = c.title.split(' ')[0];
  return w;
};
const FORM = (c) => {
  const t = (c.title + ' ' + (c.tags || []).join(' ')).toLowerCase();
  if (/teapot/.test(t)) return 'TEAPOT';
  if (/mug|cup/.test(t)) return 'MUG';
  if (/bowl/.test(t)) return 'BOWL';
  if (/plate|dish|platter/.test(t)) return 'PLATE';
  if (/vase|jug|pitcher/.test(t)) return 'VASE';
  if (/dog|cat|bird|creature/.test(t)) return 'FIGURE';
  return 'VESSEL';
};

function fuse(picks) {
  const kws = picks.map(KEYWORD);
  const form = FORM(picks[picks.length - 1]);
  const title = [...new Set(kws.slice(0, picks.length - 1))].join(' ') + ' ' + form;
  /* the form donor decides how it is built; the others donate surface */
  const donor = picks[picks.length - 1];
  const techs = (donor.tags || []).filter(t => /coil|slab|pinch|modell|press|nerikomi/.test(t))
    .concat(picks.flatMap(p => (p.tags || []).filter(t => /coil|slab|pinch|modell|press|nerikomi/.test(t))));
  const surfs = picks.slice(0, -1).concat(picks)
    .flatMap(p => (p.tags || []).filter(t => /engobe|underglaze|resist|stripes|stars/.test(t)));
  const tech = techs[0] || 'coil';
  const surf = surfs[0] || 'underglaze';

  const why = `${picks.map(p => p.title).join(' and ')} share a body and a firing but nothing else. ` +
    `This takes the ${surf} language off ${picks[0].title} and puts it on the ${form.toLowerCase()} form from ${picks[picks.length - 1].title}.`;

  const plan = generatePlan(`${tech} ${form} with ${surf} ${kws.join(' ')}`);
  plan.assumptions = ['Cream stoneware, cone 6', `${form === 'PLATE' ? '~22 cm across' : '~14 cm tall'}`, tech.charAt(0).toUpperCase() + tech.slice(1)];
  plan.refs = picks.map(p => ({ cardId: p.id, note: memoryLine(p) }));

  return {
    title: title.trim(),
    why,
    desc: `${why}\n\nBuilt the way you already build, decorated the way you already decorate — just never together.`,
    plan,
    sources: picks.map(p => p.id),
  };
}

/* ══════════════════ 8. SHARE ══════════════════ */
export function caption(card, format) {
  const notes = (card.notes || []).slice().sort((a, b) => a.at - b.at);
  const origin = card.origin?.type === 'screenshot' ? 'Started from a screenshot.'
    : card.origin?.type === 'pinterest' ? 'Started from something saved on Pinterest.'
    : card.origin?.type === 'photo' ? 'Started from a photo on my phone.'
    : 'Started as a voice note in the studio.';
  const story = notes.map(n => n.text.replace(/^I /, '')).slice(0, 3);
  const tech = card.plan?.params.find(p => p.key === 'technique')?.val || 'Hand built';
  const fire = card.plan?.params.find(p => p.key === 'firing')?.val || 'Cone 6';

  const body = [origin, ...story].join(' ');

  if (format === 'pinterest')
    return `${card.title} — ${tech.toLowerCase()}, ${fire.toLowerCase()}.\n\n${body}\n\nHand built, one of a kind.`;
  if (format === 'listing')
    return `${card.title}\n\n${card.desc}\n\n${tech}. ${card.plan?.params.find(p => p.key === 'clay')?.val || 'Stoneware'}, fired to cone 6. ${card.plan?.params.find(p => p.key === 'height')?.val || ''}\n\nHand made, so no two are identical. Small variations in the surface are part of it.`.trim();
  return `${body}\n\n${tech}, ${fire.toLowerCase()}.`;
}

export { memoryLine, score };
