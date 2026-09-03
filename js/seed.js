/* UNFIRED — seeded ceramicist.
   One coherent practice: hand-built cream stoneware, painted decoration,
   recurring red stars, animal figures, an ongoing fight with handles,
   and a lavender glaze that ran. Everything below cross-references. */

export const P   = (k) => `assets/pieces/${k}.webp`;
export const PRC = (k) => `assets/process/${k}.webp`;
export const SNP = (k) => `assets/snap/${k}.webp`;

const D = (s) => new Date(s + 'T11:00:00').getTime();

/* helper builders keep the seed readable */
const par = (key, val, src = 'ai') => ({ key, val, src });      // src: 'ai' | 'user'
const th  = (id, title, msgs, at) => ({ id, title, msgs, at });
const m   = (role, text, src) => ({ role, text, src });

export const CARDS = [

/* ══════════════════════════ MAKING ══════════════════════════ */
{
  id:'lavender-teapot-2', state:'making', title:'LAVENDER TEAPOT №2',
  created:D('2026-08-14'), updated:D('2026-08-25'), startedMaking:D('2026-08-19'),
  origin:{ type:'voice', label:'Voice note · 14 Aug' },
  glow:'#6E5AA8',
  desc:'Second go at the lavender teapot. Same body, same lid, but this time the glaze does not get anywhere near the foot. Spout a bit shorter and angled up more so it stops dribbling.',
  tags:['hand built','coil','stoneware','lavender glaze','teapot','cone 6'],
  hero:{ src:PRC('19-lavender-teapot'), kind:'process' },
  plan:{
    assumptions:['Stoneware, cone 6','~16 cm to top of lid','Coil built, paddled round'],
    params:[
      par('technique','Coil + paddle','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~1.4 kg body, 250 g lid'),
      par('height','~16 cm','user'),
      par('wall','7 mm'),
      par('surface','Lavender gloss, 2 coats','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
      par('dry','5–6 days under plastic, spout wrapped'),
    ],
    tools:['Paddle','Surform','Hole cutter','Small rib','Sponge on a stick'],
    steps:[
      'Coil the body in three sittings, paddle round between each.',
      'Cut the lid seat while the rim is still soft. Keep the lid drying on the pot.',
      'Pull the spout separately, let both reach the same leather-hard.',
      'Score, slip, attach spout. Cut the strainer holes before attaching, not after.',
      'Attach the handle last, at soft leather-hard — this is where №1 was rushed.',
      'Dry slow under plastic for 5–6 days, spout and handle wrapped.',
      'Bisque 04.',
      'Wax the foot AND the bottom 8 mm of the wall before glazing.',
      'Glaze cone 6, lid fired separately on stilts.'
    ],
    risks:[
      { k:'Glaze run', t:'Lavender moved about 6 mm down the wall on №1 and stuck the foot to the shelf. Waxing 8 mm is the fix you already worked out.' },
      { k:'Spout drip', t:'Cut the spout tip at a sharper angle and undercut the inside lip.' },
      { k:'Lid fit', t:'Lid and pot must dry together or the seat goes oval.' }
    ],
    refs:[
      { cardId:'red-pink-pitcher', note:'Handle attached at soft leather-hard, scored + slipped, dried wrapped. That one never cracked.' },
      { cardId:'deep-blue-bowl', note:'Glaze put on thick pinholed along the rim. Thin, even coats.' },
    ]
  },
  photos:[
    { id:'p1', kind:'inspiration', src:P('19-lavender-teapot'), cap:'№1, fired. Lovely colour, ruined foot.' },
    { id:'p2', kind:'process', src:PRC('19-lavender-teapot'), cap:'Body + lid drying together, day 3.' }
  ],
  notes:[
    { id:'n1', at:D('2026-08-19'), src:'voice', text:'Starting the second teapot today. Coiling the body, going to paddle it rounder than last time.' },
    { id:'n2', at:D('2026-08-22'), src:'watch', text:'Handle is too soft. Wait another twenty minutes.' },
    { id:'n3', at:D('2026-08-25'), src:'voice', text:'Spout is on. Cut the strainer holes first this time, much easier. Everything under plastic.' }
  ],
  threads:[
    th('t1','Spout angle',[
      m('me','How much should I angle the spout up so it stops dribbling?'),
      m('ai','Set the spout tip at or slightly above the lid seat — that is what stops it emptying itself when you tip it back. For the dribble specifically the tip matters more than the angle: cut it at a sharp bevel and undercut the inside edge so the stream breaks cleanly.\n\nOn №1 your spout tip sat about 8 mm below the seat, which is also why it kept spilling from the lid.','archive')
    ],D('2026-08-25')),
    th('t2','Waxing the foot',[
      m('me','How far up should I wax?'),
      m('ai','Your lavender moved roughly 6 mm on №1. Wax the foot plus 8 mm of wall — a little more margin than the run you actually measured. Estimated, based on your own note, not a manufacturer figure. Worth checking the glaze supplier sheet if you go hotter than cone 6.','archive')
    ],D('2026-08-21'))
  ]
},

/* ══════════════════════════ FINISHED ══════════════════════════ */
{
  id:'starred-plates', state:'finished', title:'STARRED PLATES',
  created:D('2026-07-02'), updated:D('2026-08-24'), finishedAt:D('2026-08-11'),
  origin:{ type:'screenshot', label:'Screenshot · Pinterest' },
  glow:'#C7362E', outcome:'success', readyToShare:true,
  desc:'A set — dinner plate and a little bowl to match. Red stars, hand painted, no masking, no ruler. The spiral sun in the middle was a last-minute decision and it is the best part.',
  tags:['slab','hump mould','underglaze','stars','stoneware','cone 6','red'],
  hero:{ src:P('01-red-star-sun-plate') },
  plan:{
    assumptions:['Stoneware, cone 6','24 cm plate / 13 cm bowl','Slab over a hump mould'],
    params:[
      par('technique','Slab over hump mould','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~900 g plate','user'),
      par('thickness','8 mm slab','user'),
      par('surface','Red underglaze, 2 coats','user'),
      par('glaze','Clear gloss','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Rolling pin','8 mm guides','Hump mould','Liner brush','Banding wheel'],
    steps:[
      'Roll an 8 mm slab, drape over the hump mould, smooth from the centre out.',
      'Trim the rim with a needle tool, leave it slightly uneven on purpose.',
      'Dry on the mould overnight, release, then dry slow.',
      'Bisque 04.',
      'Paint stars freehand, two coats of red underglaze.',
      'Clear gloss, cone 6.'
    ],
    risks:[
      { k:'S-crack', t:'Plates over 20 cm want slow, flat drying. Yours were fine — flipped on day two.' },
      { k:'Thin red', t:'One coat of that red goes pink over cream. Two is the minimum.' }
    ],
    refs:[{ cardId:'navy-starburst-plate', note:'Same hump mould, same 8 mm slab. The rim thickness that worked there worked here.' }]
  },
  photos:[
    { id:'p1', kind:'final', src:P('01-red-star-sun-plate'), cap:'Plate, fired.' },
    { id:'p2', kind:'final', src:P('02-red-star-bowl'), cap:'Matching bowl.' },
    { id:'p3', kind:'process', src:PRC('01-red-star-sun-plate'), cap:'Greenware, drying flat.' }
  ],
  notes:[
    { id:'n1', at:D('2026-07-14'), src:'voice', text:'Two coats of the red is the answer. One coat goes pink over the cream body.' },
    { id:'n2', at:D('2026-08-11'), src:'voice', text:'Both out of the glaze fire and both good. The spiral in the middle is the thing that makes it.' }
  ],
  threads:[
    th('t1','Painting the stars',[
      m('me','Should I mask the stars or paint them freehand?'),
      m('ai','Freehand, on this body. Masking gives you a hard edge that fights the wobbly rim you deliberately left. A liner brush loaded with two passes of underglaze holds a star shape well on bisque.','ref')
    ],D('2026-07-14'))
  ]
},
{
  id:'red-pink-pitcher', state:'finished', title:'PINK PITCHER',
  created:D('2026-05-08'), updated:D('2026-06-02'), finishedAt:D('2026-06-02'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#D8465C', outcome:'success', readyToShare:true,
  desc:'Coiled and paddled, pulled handle. The glaze broke pink over the rim and pooled darker in the throwing marks. Best handle I have made.',
  tags:['coil','paddle','pulled handle','stoneware','cone 6','pink glaze','pitcher'],
  hero:{ src:P('11-red-pink-pitcher') },
  plan:{
    assumptions:['Stoneware, cone 6','~15 cm tall','Coil built'],
    params:[
      par('technique','Coil + paddle','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~1.1 kg','user'),
      par('wall','6–7 mm','user'),
      par('surface','Pink breaking glaze, 1 dip','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Paddle','Rib','Surform'],
    steps:[
      'Coil in two sittings, paddle the belly round.',
      'Pull the spout from the rim with a wet thumb.',
      'Pull the handle separately, hang it to stiffen.',
      'Attach at soft leather-hard: score, slip, press, blend both joins.',
      'Dry under plastic, handle wrapped in a strip of plastic for 3 days.',
      'Bisque 04, single dip, cone 6.'
    ],
    risks:[{ k:'Handle join', t:'This is the one that worked. Same-moisture clay, scored, slipped, dried wrapped.' }],
    refs:[]
  },
  photos:[
    { id:'p1', kind:'final', src:P('11-red-pink-pitcher'), cap:'Fired. Glaze broke over the rim.' }
  ],
  notes:[
    { id:'n1', at:D('2026-05-22'), src:'voice', text:'Handle went on at soft leather-hard, both bits the same wetness, scored and slipped properly. Dried it wrapped for three days.' },
    { id:'n2', at:D('2026-06-02'), src:'voice', text:'No crack at all on this handle. That is the method from now on.' }
  ],
  threads:[]
},
{
  id:'blue-striped-mug', state:'finished', title:'BLUE LINE MUG',
  created:D('2026-03-02'), updated:D('2026-04-04'), finishedAt:D('2026-04-04'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#5B8FC9', outcome:'partial', readyToShare:true,
  desc:'Cream mug with blue engobe drawn straight down the wall in one pass. The first handle cracked after bisque and I made a second one.',
  tags:['hand built','engobe','turquoise engobe','handle','crack','mug','stoneware','cone 6'],
  hero:{ src:P('08-blue-striped-mug') },
  plan:{
    assumptions:['Stoneware, cone 6','~9 cm tall','Pinched and paddled'],
    params:[
      par('technique','Pinched + paddled','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~450 g','user'),
      par('surface','Blue engobe, 3 coats','user'),
      par('glaze','Clear gloss','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Soft rib','Wide brush','Banding wheel'],
    steps:[
      'Pinch the wall, paddle it straighter.',
      'Engobe onto leather-hard, three coats, one continuous stroke each.',
      'Pull the handle, attach at leather-hard.',
      'Dry slow, bisque 04, clear gloss, cone 6.'
    ],
    risks:[{ k:'Handle crack', t:'Handle #1 was attached too dry and cracked at the lower join after bisque.' }],
    refs:[]
  },
  photos:[
    { id:'p1', kind:'final', src:P('08-blue-striped-mug'), cap:'Second handle, fired.' },
    { id:'p2', kind:'process', src:PRC('08-blue-striped-mug'), cap:'Greenware before the crack.' }
  ],
  notes:[
    { id:'n1', at:D('2026-03-11'), src:'voice', text:'The turquoise engobe worked much better with three coats. Two was patchy over the cream and you could see the brush drag.' },
    { id:'n2', at:D('2026-03-24'), src:'voice', text:'The handle cracked after bisque. Right at the bottom join. I think I attached it when the mug was already too dry.' },
    { id:'n3', at:D('2026-04-04'), src:'voice', text:'Second handle survived. Attached it much softer this time.' }
  ],
  threads:[
    th('t1','Handle attachment',[
      m('me','How dry should the body be when I put a handle on?'),
      m('ai','Soft leather-hard — the wall should still take a fingernail mark without crumbling, and the handle should be at the same stage. The crack you got at the lower join is the classic signature of a wetter handle shrinking against a drier wall.\n\nScore both faces, use slip made from the same clay, and wrap the join for the first two or three days of drying.','archive')
    ],D('2026-03-24')),
    th('t2','Engobe coats',[
      m('me','Two coats of the blue looks patchy.'),
      m('ai','Three coats is where that engobe covers on a cream body — you found the same thing when you logged it in March. Let each coat lose its shine before the next.','archive')
    ],D('2026-03-11'))
  ]
},
{
  id:'deep-blue-bowl', state:'finished', title:'DEEP BLUE BOWL',
  created:D('2026-02-04'), updated:D('2026-03-01'), finishedAt:D('2026-03-01'),
  origin:{ type:'photo', label:'Photo library' }, glow:'#2A4C8F', outcome:'partial',
  desc:'Pinched bowl in a speckled blue. The glaze pooled beautifully in the bottom and pinholed along the rim where I put it on thickest.',
  tags:['pinched','glaze test','blue glaze','pinhole','bowl','stoneware','cone 6'],
  hero:{ src:P('13-deep-blue-bowl') },
  plan:{
    assumptions:['Stoneware, cone 6','12 cm across','Pinched'],
    params:[
      par('technique','Pinched','user'),
      par('clay','Speckled stoneware','user'),
      par('clay amount','~400 g','user'),
      par('surface','Speckled blue, 2 dips','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
      par('result','Pinholes on rim','user'),
    ],
    tools:['Rib','Sponge'],
    steps:['Pinch from a ball, rest, refine the rim.','Bisque 04.','Two dips of the blue.','Cone 6, slow cool.'],
    risks:[{ k:'Pinholing', t:'Thick application on a rim plus a fast cool. A 20 minute hold near top temperature usually closes them.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('13-deep-blue-bowl'), cap:'Pooled dark in the well.' }],
  notes:[
    { id:'n1', at:D('2026-03-01'), src:'voice', text:'Pinholes all along the rim of the blue bowl. That is where I dipped it twice and it went on thick.' }
  ],
  threads:[]
},
{
  id:'yellow-creature-dish', state:'finished', title:'YELLOW CREATURE DISH',
  created:D('2026-01-10'), updated:D('2026-02-20'), finishedAt:D('2026-02-20'),
  origin:{ type:'text', label:'Typed idea' }, glow:'#D8C22E', outcome:'success',
  desc:'A little yellow person sitting in the middle of a star dish. The first one blew up in the bisque because I modelled it solid.',
  tags:['modelled','press mould','figure','underglaze','stars','explosion','earthenware'],
  hero:{ src:P('06-yellow-creature-dish') },
  plan:{
    assumptions:['Stoneware, cone 6','18 cm dish','Press-moulded dish + modelled figure'],
    params:[
      par('technique','Press mould + solid modelling','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~700 g total','user'),
      par('surface','Yellow + pastel underglaze','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Press mould','Loop tool','Needle tool'],
    steps:[
      'Press the dish, paint the stars on bisque.',
      'Model the figure solid, then hollow it from underneath with a loop tool.',
      'Leave a vent hole where it will not show.',
      'Attach at leather-hard, score and slip.',
      'Dry very slowly — a solid-ish figure holds water long after the dish is dry.'
    ],
    risks:[{ k:'Blow-out', t:'Figure #1 was solid and trapped water. It came apart in the bisque.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('06-yellow-creature-dish'), cap:'Second figure, hollowed and vented.' }],
  notes:[
    { id:'n1', at:D('2026-01-24'), src:'voice', text:'The little figure blew up in the bisque. It was solid, about four centimetres thick. Hollow them out next time and leave a vent hole underneath.' }
  ],
  threads:[]
},
{
  id:'polka-dot-dog', state:'finished', title:'SPOTTED DOG',
  created:D('2025-11-02'), updated:D('2025-12-06'), finishedAt:D('2025-12-06'),
  origin:{ type:'photo', label:'Photo library' }, glow:'#3A3A3A', outcome:'success',
  desc:'Modelled from a photo of the neighbour\'s dog. Hollowed from the base, ears made separately and attached soft.',
  tags:['modelled','figure','animal','underglaze','black','stoneware','cone 6'],
  hero:{ src:P('07-polka-dot-dog') },
  plan:{
    assumptions:['Stoneware, cone 6','~19 cm tall','Solid modelled then hollowed'],
    params:[
      par('technique','Modelled + hollowed','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~1.6 kg','user'),
      par('surface','Black underglaze spots','user'),
      par('glaze','Clear gloss','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Loop tools','Wire','Needle tool'],
    steps:[
      'Model solid, cut in half with a wire, hollow both halves to about 12 mm.',
      'Rejoin with slip, blend the seam.',
      'Ears attached at soft leather-hard so they move with the head.',
      'Vent hole under the tail.',
      'Slow dry, bisque 04, spots painted on bisque, clear gloss cone 6.'
    ],
    risks:[{ k:'Ear cracks', t:'Thin attachments on a thick body crack if they dry ahead of it. Wrap the ears.' }],
    refs:[{ cardId:'yellow-creature-dish', note:'Hollow and vent anything thicker than about 2 cm.' }]
  },
  photos:[{ id:'p1', kind:'final', src:P('07-polka-dot-dog'), cap:'Fired.' }],
  notes:[
    { id:'n1', at:D('2025-11-19'), src:'voice', text:'Ears cracked where they meet the head. Attached them a bit too dry and they dried faster than the body.' }
  ],
  threads:[]
},
{
  id:'black-cat-candle', state:'finished', title:'CAT CANDLE HOLDER',
  created:D('2026-04-12'), updated:D('2026-05-18'), finishedAt:D('2026-05-18'),
  origin:{ type:'pinterest', label:'Pinterest · Objects' }, glow:'#5C7EA8', outcome:'success',
  desc:'Black cat in a pale blue hat, and the hat is the candle cup. Hollowed the same way as the dog.',
  tags:['modelled','figure','animal','black glaze','candle holder','stoneware','cone 6'],
  hero:{ src:P('03-black-cat-candle-holder') },
  plan:{
    assumptions:['Stoneware, cone 6','~17 cm tall','Modelled and hollowed'],
    params:[
      par('technique','Modelled + hollowed','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~1.2 kg','user'),
      par('surface','Black gloss + pale blue','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
      par('detail','Candle cup 22 mm ID','user'),
    ],
    tools:['Loop tools','22 mm dowel','Needle tool'],
    steps:[
      'Model the body solid, halve, hollow, rejoin.',
      'Form the hat as a small cylinder, size the cup on a dowel so a taper fits.',
      'Attach the hat at leather-hard, blend into the head.',
      'Bisque 04, black gloss on the body, pale blue on hat and collar, cone 6.'
    ],
    risks:[{ k:'Glaze pooling', t:'Black gloss runs into the ear undercuts. Wipe it back before firing.' }],
    refs:[{ cardId:'polka-dot-dog', note:'Same halve-and-hollow method. 12 mm wall held up.' }]
  },
  photos:[{ id:'p1', kind:'final', src:P('03-black-cat-candle-holder'), cap:'Fired.' }],
  notes:[{ id:'n1', at:D('2026-05-18'), src:'voice', text:'Black gloss pooled in the ears again. Wipe the undercuts next time.' }],
  threads:[]
},
{
  id:'three-flower-vase', state:'finished', title:'THREE FLOWER VASE',
  created:D('2025-11-28'), updated:D('2025-12-18'), finishedAt:D('2025-12-18'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#5E86A8', outcome:'success',
  desc:'Coil built, applied flowers pressed on at leather-hard. Made this one just before Christmas as a present.',
  tags:['coil','applied decoration','vase','blue glaze','stoneware','cone 6','gift'],
  hero:{ src:P('14-three-flower-vase') },
  plan:{
    assumptions:['Stoneware, cone 6','~14 cm tall','Coil built'],
    params:[
      par('technique','Coil built','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~1 kg','user'),
      par('wall','7 mm','user'),
      par('surface','Blue satin + coloured flowers','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Rib','Small flower cutters','Sponge'],
    steps:[
      'Coil the body in one sitting, rib the outside smooth.',
      'Cut flowers from a thin slab, dish each petal on a fingertip.',
      'Score, slip and press on at leather-hard.',
      'Slow dry — applied bits crack if the body shrinks past them.',
      'Bisque 04, blue satin, flowers picked out, cone 6.'
    ],
    risks:[{ k:'Applied pieces lifting', t:'Same-moisture clay and a wrapped dry is what keeps them on.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('14-three-flower-vase'), cap:'Fired, wrapped and given away.' }],
  notes:[
    { id:'n1', at:D('2025-12-12'), src:'voice', text:'7 mm walls on the coil vase felt right. Light enough to pick up, thick enough not to warp.' }
  ],
  threads:[]
},
{
  id:'navy-starburst-plate', state:'finished', title:'STARBURST PLATE',
  created:D('2026-06-06'), updated:D('2026-07-01'), finishedAt:D('2026-07-01'),
  origin:{ type:'screenshot', label:'Screenshot' }, glow:'#22407A', outcome:'success',
  desc:'Twenty-something cobalt rays from a bare dot in the middle. Painted in one sitting, no pencil lines.',
  tags:['slab','hump mould','underglaze','cobalt','plate','stoneware','cone 6'],
  hero:{ src:P('10-navy-starburst-plate') },
  plan:{
    assumptions:['Stoneware, cone 6','22 cm','Slab over hump mould'],
    params:[
      par('technique','Slab over hump mould','user'),
      par('clay','Cream stoneware','user'),
      par('thickness','8 mm slab','user'),
      par('surface','Cobalt underglaze','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Rolling pin','Hump mould','Liner brush'],
    steps:['Roll and drape, trim rim.','Bisque 04.','Paint rays from the outside inwards so they taper.','Clear gloss cone 6.'],
    risks:[{ k:'Uneven rays', t:'Paint opposite pairs first — four, then eight, then fill.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('10-navy-starburst-plate'), cap:'Fired.' }],
  notes:[{ id:'n1', at:D('2026-07-01'), src:'voice', text:'Painting rays in opposite pairs keeps them even. Four first, then eight, then fill the gaps.' }],
  threads:[]
},
{
  id:'orange-wave-plate', state:'finished', title:'ORANGE WAVE PLATE',
  created:D('2026-07-20'), updated:D('2026-08-08'), finishedAt:D('2026-08-08'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#C0552A', outcome:'success',
  desc:'One wave, one colour, nothing else. Made it to prove I can stop decorating.',
  tags:['slab','hump mould','underglaze','orange','plate','minimal','stoneware','cone 6'],
  hero:{ src:P('18-orange-wave-plate') },
  plan:{
    assumptions:['Stoneware, cone 6','20 cm','Slab over hump mould'],
    params:[
      par('technique','Slab over hump mould','user'),
      par('clay','Cream stoneware','user'),
      par('thickness','8 mm slab','user'),
      par('surface','Orange underglaze line','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Hump mould','Liner brush','Banding wheel'],
    steps:['Roll, drape, trim.','Bisque 04.','One continuous wave, turning the banding wheel with the other hand.','Clear gloss cone 6.'],
    risks:[{ k:'Break in the line', t:'Load the brush heavily and go once. Touching up shows.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('18-orange-wave-plate'), cap:'Fired.' }],
  notes:[],
  threads:[]
},
{
  id:'striped-bowl', state:'finished', title:'STRIPED BOWL',
  created:D('2026-06-14'), updated:D('2026-07-12'), finishedAt:D('2026-07-12'),
  origin:{ type:'pinterest', label:'Pinterest · Ceramics' }, glow:'#C08A3E', outcome:'partial',
  desc:'Six colours straight down the wall, inside and out. The yellow went thin and I had to go back over it.',
  tags:['press mould','underglaze','stripes','bowl','stoneware','cone 6'],
  hero:{ src:P('05-multicolor-striped-bowl') },
  plan:{
    assumptions:['Stoneware, cone 6','15 cm','Press moulded'],
    params:[
      par('technique','Press mould','user'),
      par('clay','Cream stoneware','user'),
      par('surface','6 underglaze colours','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Press mould','Flat brush 12 mm'],
    steps:['Press the bowl, dry, bisque 04.','Paint stripes outside first, then match them inside over the rim.','Clear gloss cone 6.'],
    risks:[{ k:'Thin yellows', t:'Yellow and orange need a third coat over cream. Red and cobalt do not.' }],
    refs:[{ cardId:'starred-plates', note:'Two coats of red is enough. Yellow is not the same.' }]
  },
  photos:[{ id:'p1', kind:'final', src:P('05-multicolor-striped-bowl'), cap:'Fired.' }],
  notes:[{ id:'n1', at:D('2026-07-12'), src:'voice', text:'Yellow underglaze needs three coats over the cream body. Red only needs two.' }],
  threads:[]
},
{
  id:'navy-flower-cup', state:'finished', title:'FLOWER CUP',
  created:D('2026-02-16'), updated:D('2026-03-20'), finishedAt:D('2026-03-20'),
  origin:{ type:'pinterest', label:'Pinterest · Ceramics' }, glow:'#2C3D6B', outcome:'success',
  desc:'A band of outlined flowers going all the way round, cobalt on cream. No handle on purpose.',
  tags:['pinched','underglaze','cobalt','flowers','cup','stoneware','cone 6'],
  hero:{ src:P('04-navy-flower-cup') },
  plan:{
    assumptions:['Stoneware, cone 6','8 cm tall','Pinched'],
    params:[
      par('technique','Pinched','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~380 g','user'),
      par('surface','Cobalt outline','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Liner brush','Rib'],
    steps:['Pinch, paddle, level the rim.','Bisque 04.','Draw the flower band with a liner brush, outlines only.','Clear gloss cone 6.'],
    risks:[{ k:'Line bleed', t:'Clear gloss over a fine cobalt line can soften it. Keep the gloss thin.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('04-navy-flower-cup'), cap:'Fired.' }],
  notes:[],
  threads:[]
},
{
  id:'green-cup', state:'finished', title:'GREEN CUP',
  created:D('2026-04-28'), updated:D('2026-05-30'), finishedAt:D('2026-05-30'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#3E7A3A', outcome:'success',
  desc:'One deep green glaze, no decoration. Handle pulled much thinner than I used to make them.',
  tags:['pinched','pulled handle','green glaze','cup','stoneware','cone 6'],
  hero:{ src:P('12-green-cup') },
  plan:{
    assumptions:['Stoneware, cone 6','9 cm tall','Pinched'],
    params:[
      par('technique','Pinched','user'),
      par('clay','Cream stoneware','user'),
      par('clay amount','~420 g','user'),
      par('surface','Deep green gloss, 1 dip','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
      par('handle','9 mm at the top of the pull','user'),
    ],
    tools:['Rib','Sponge'],
    steps:['Pinch and paddle.','Pull a thin handle, attach at soft leather-hard.','Dry wrapped, bisque 04, single dip, cone 6.'],
    risks:[{ k:'Thin handle warping', t:'A thinner pull dries faster than the wall. Wrap it.' }],
    refs:[{ cardId:'red-pink-pitcher', note:'Attach soft, wrap the join, dry slow.' }]
  },
  photos:[{ id:'p1', kind:'final', src:P('12-green-cup'), cap:'Fired.' }],
  notes:[{ id:'n1', at:D('2026-05-30'), src:'voice', text:'Handle is much thinner than the ones I was making last year and it feels better in the hand.' }],
  threads:[]
},
{
  id:'mustard-dot-mug', state:'finished', title:'MUSTARD DOT MUG',
  created:D('2026-01-18'), updated:D('2026-02-08'), finishedAt:D('2026-02-08'),
  origin:{ type:'text', label:'Typed idea' }, glow:'#B8862A', outcome:'success',
  desc:'Wax resist dots under a mustard glaze, so the dots come out as bare cream body.',
  tags:['pinched','wax resist','dots','mug','yellow glaze','stoneware','cone 6'],
  hero:{ src:P('15-mustard-dot-mug') },
  plan:{
    assumptions:['Stoneware, cone 6','9.5 cm tall','Pinched'],
    params:[
      par('technique','Pinched','user'),
      par('clay','Cream stoneware','user'),
      par('surface','Wax resist dots + mustard glaze','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Round brush','Wax emulsion'],
    steps:['Pinch and paddle, pull handle, attach soft.','Bisque 04.','Dot wax onto the bisque, let it dry an hour.','Dip in mustard, sponge any beads off the wax.','Cone 6.'],
    risks:[{ k:'Glaze creeping over wax', t:'Thin, even dots. A blobby wax dot leaves a raised edge.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('15-mustard-dot-mug'), cap:'Fired.' }],
  notes:[],
  threads:[]
},
{
  id:'bag-face-vase', state:'finished', title:'HI BAG VASE',
  created:D('2025-09-14'), updated:D('2025-10-10'), finishedAt:D('2025-10-10'),
  origin:{ type:'note', label:'Apple Notes' }, glow:'#3F63C4', outcome:'success',
  desc:'Slab bag with a face and a handle across the top. It slumped slightly and that is the whole charm.',
  tags:['slab','slump','face','vase','stoneware','cone 6','blue'],
  hero:{ src:P('09-bag-face-vase') },
  plan:{
    assumptions:['Stoneware, cone 6','~15 cm tall','Slab built'],
    params:[
      par('technique','Slab built','user'),
      par('clay','Cream stoneware','user'),
      par('thickness','6 mm slab','user'),
      par('surface','Blue + red underglaze on cream','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Rolling pin','Newspaper former','Needle tool'],
    steps:[
      'Roll a 6 mm slab, wrap round a loose newspaper former.',
      'Join the seam with slip, paddle the corners soft.',
      'Cut the handle opening while soft, smooth the inside edge.',
      'Pull the former out at leather-hard and let it slump a little.',
      'Bisque 04, paint the face, clear gloss cone 6.'
    ],
    risks:[{ k:'Seam splitting', t:'Slab seams open in the bisque if they are only smeared, not scored.' }],
    refs:[]
  },
  photos:[{ id:'p1', kind:'final', src:P('09-bag-face-vase'), cap:'Fired.' }],
  notes:[],
  threads:[]
},
{
  id:'speckled-bird', state:'finished', title:'SPECKLED BIRD',
  created:D('2025-10-20'), updated:D('2025-11-15'), finishedAt:D('2025-11-15'),
  origin:{ type:'photo', label:'Photo library' }, glow:'#8A6B44', outcome:'success',
  desc:'Small solid bird, hollowed out through the base. Speckled clay with a soft brown glaze breaking over the wings.',
  tags:['modelled','figure','animal','speckled stoneware','brown glaze','cone 6'],
  hero:{ src:P('17-speckled-bird') },
  plan:{
    assumptions:['Speckled stoneware, cone 6','~9 cm long','Modelled'],
    params:[
      par('technique','Modelled + hollowed','user'),
      par('clay','Speckled stoneware','user'),
      par('clay amount','~350 g','user'),
      par('surface','Brown breaking glaze','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
    ],
    tools:['Loop tool','Needle tool'],
    steps:['Model from one ball.','Hollow from underneath, leave 10 mm wall.','Vent hole in the base.','Bisque 04, glaze, wipe the base bare, cone 6.'],
    risks:[{ k:'Trapped water', t:'Anything modelled solid must be hollowed and vented.' }],
    refs:[{ cardId:'yellow-creature-dish', note:'The one that blew up taught this.' }]
  },
  photos:[{ id:'p1', kind:'final', src:P('17-speckled-bird'), cap:'Fired.' }],
  notes:[],
  threads:[]
},
{
  id:'nerikomi-bowl', state:'finished', title:'NERIKOMI BOWL',
  created:D('2026-04-02'), updated:D('2026-04-26'), finishedAt:D('2026-04-26'),
  origin:{ type:'text', label:'Typed idea' }, glow:'#4A4A4A', outcome:'partial',
  desc:'First and so far only nerikomi attempt. Stained blocks, sliced and pressed into a bowl. The pattern smeared when I ribbed it and I never photographed it.',
  tags:['nerikomi','press mould','stained clay','porcelain','bowl','cone 6','experiment'],
  hero:null,
  plan:{
    assumptions:['Porcelain, cone 6','13 cm','Nerikomi, press moulded'],
    params:[
      par('technique','Nerikomi','user'),
      par('clay','Porcelain + body stains','user'),
      par('surface','Clear gloss inside only','user'),
      par('firing','Bisque 04 · glaze cone 6','user'),
      par('result','Pattern smeared','user'),
    ],
    tools:['Wire','Press mould','Metal rib','Fine sandpaper'],
    steps:[
      'Stain three batches of porcelain, wedge each until even.',
      'Stack, compress, rest overnight so the blocks stiffen together.',
      'Slice thin, lay into the mould, join edge to edge.',
      'Do NOT rib while wet — scrape at leather-hard instead.',
      'Sand the bisque to bring the pattern back.'
    ],
    risks:[
      { k:'Smearing', t:'This is what went wrong. A rib on soft nerikomi drags one colour over another.' },
      { k:'Different shrinkage', t:'Heavily stained porcelain and plain porcelain can move at slightly different rates. Test tiles first.' }
    ],
    refs:[]
  },
  photos:[],
  notes:[
    { id:'n1', at:D('2026-04-26'), src:'voice', text:'The nerikomi smeared. I ribbed it while it was still soft and dragged the colours into each other. Should have waited and scraped it at leather-hard.' }
  ],
  threads:[]
},

/* ══════════════════════════ IDEAS ══════════════════════════ */
{
  id:'idea-shell-dish', state:'idea', title:'SCALLOP SHELL DISH',
  created:D('2026-08-20'), updated:D('2026-08-20'),
  origin:{ type:'pinterest', label:'Pinterest · Shapes' }, glow:'#D89AA8',
  desc:'Pink scallop shell, shallow, for rings and earrings. Saved from Pinterest.',
  tags:['press mould','shell','dish','pink glaze','idea'],
  hero:{ src:P('16-pink-shell-dish'), ref:true },
  plan:{
    assumptions:['Stoneware, cone 6','~14 cm across','Press moulded over a real shell'],
    params:[
      par('technique','Press mould'),
      par('clay','Cream stoneware'),
      par('clay amount','~450 g'),
      par('thickness','7 mm slab'),
      par('surface','Pink gloss, 2 dips'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['A large scallop shell','Rolling pin','Soft rib','Sponge'],
    steps:[
      'Press a 7 mm slab into a real shell dusted with cornflour.',
      'Cut the outline while it is in the shell.',
      'Pinch up the little foot tab at the hinge end.',
      'Release at leather-hard, soften the edge with a damp sponge.',
      'Bisque 04, two dips of pink gloss, cone 6.'
    ],
    risks:[
      { k:'Sticking', t:'Cornflour or a thin cloth between clay and shell, or you will not get it out.' },
      { k:'Ridge cracks', t:'The deep flutes are the thin points. Do not roll the slab under 6 mm.' }
    ],
    refs:[{ cardId:'striped-bowl', note:'Press moulding worked well there — same release trick.' }]
  },
  photos:[{ id:'p1', kind:'inspiration', src:P('16-pink-shell-dish'), cap:'Saved from Pinterest.' }],
  notes:[], threads:[]
},
{
  id:'idea-heart-dishes', state:'idea', title:'HEART DISHES, SET OF FOUR',
  created:D('2026-08-18'), updated:D('2026-08-18'),
  origin:{ type:'pinterest', label:'Pinterest · Objects' }, glow:'#E0707E',
  desc:'Four little coral hearts with a daisy in each. Would sell as a set.',
  tags:['slab','template','heart','dish','coral glaze','set','idea'],
  hero:{ src:P('20-coral-heart-dish'), ref:true },
  plan:{
    assumptions:['Stoneware, cone 6','11 cm each','Slab over a card template'],
    params:[
      par('technique','Slab + template'),
      par('clay','Cream stoneware'),
      par('clay amount','~320 g each, 1.3 kg for four'),
      par('thickness','7 mm slab'),
      par('surface','Coral gloss + painted daisies'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Card template','Rolling pin','Small liner brush','Foam former'],
    steps:[
      'Cut four hearts from one slab so they shrink alike.',
      'Slump each over a foam mound to lift the sides.',
      'Pinch the point sharp before it stiffens.',
      'Bisque 04, coral gloss, daisies on top in three brush marks each.',
      'Cone 6.'
    ],
    risks:[{ k:'Point cracking', t:'The sharp tip of a heart dries first. Wrap the points for the first day.' }],
    refs:[{ cardId:'starred-plates', note:'Painting freehand on bisque, two coats, worked on the plates.' }]
  },
  photos:[{ id:'p1', kind:'inspiration', src:P('20-coral-heart-dish'), cap:'Saved from Pinterest.' }],
  notes:[], threads:[]
},
{
  id:'idea-star-mug', state:'idea', title:'RED STAR MUG',
  created:D('2026-08-23'), updated:D('2026-08-23'),
  origin:{ type:'voice', label:'Voice note · 23 Aug' }, glow:'#C7362E',
  desc:'The stars from the plates, but on a mug. Same red, same freehand, with a proper handle this time.',
  tags:['pinched','underglaze','stars','red','mug','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~9 cm tall','Pinched, pulled handle'],
    params:[
      par('technique','Pinched + pulled handle'),
      par('clay','Cream stoneware'),
      par('clay amount','~450 g'),
      par('surface','Red underglaze stars, 2 coats'),
      par('glaze','Clear gloss'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Liner brush','Rib','Banding wheel'],
    steps:[
      'Pinch the wall, paddle it straight, level the rim.',
      'Pull the handle, let it stiffen to match the body.',
      'Attach at soft leather-hard, score and slip, wrap the join.',
      'Bisque 04.',
      'Stars freehand, two coats of red.',
      'Clear gloss, cone 6.'
    ],
    risks:[
      { k:'Handle crack', t:'Three of your last four cracks were at handle joins. Attach soft, wrap for three days.' },
      { k:'Stars on a curve', t:'A star reads flat on a plate and skewed on a wall. Turn the mug as you paint, keep them small.' }
    ],
    refs:[
      { cardId:'starred-plates', note:'Two coats of red over cream. One goes pink.' },
      { cardId:'red-pink-pitcher', note:'The handle method that did not crack.' }
    ]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-big-platter', state:'idea', title:'ONE VERY BIG PLATTER',
  created:D('2026-08-06'), updated:D('2026-08-06'),
  origin:{ type:'text', label:'Typed' }, glow:'#2B36FF',
  desc:'40 cm, floppy rim, one single wave round the edge. Big enough for a whole fish.',
  tags:['slab','platter','large','minimal','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~40 cm','Slab, slow flat dry'],
    params:[
      par('technique','Slab, dried flat'),
      par('clay','Cream stoneware'),
      par('clay amount','~3.2 kg'),
      par('thickness','10 mm slab'),
      par('surface','One orange wave'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Long guides','Canvas','Two boards for flipping','Drywall sheet'],
    steps:[
      'Roll at 10 mm — thicker than your plates, it has further to sag.',
      'Compress both faces with a rib. This is the whole game at 40 cm.',
      'Dry flat on drywall, flip daily between two boards.',
      'Ten days minimum before bisque.',
      'Bisque 04, one wave, clear gloss cone 6.'
    ],
    risks:[
      { k:'S-crack', t:'Large flat forms crack from uneven drying more than anything else. Compress and flip.' },
      { k:'Kiln shelf', t:'Check the widest shelf you have before you roll a 40 cm slab.' }
    ],
    refs:[{ cardId:'orange-wave-plate', note:'The single-wave decoration, scaled up.' }]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-cat-dog-pair', state:'idea', title:'A FRIEND FOR THE CAT',
  created:D('2026-07-28'), updated:D('2026-07-28'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#5C7EA8',
  desc:'The cat and the dog should be a pair. Same size, same hollowing, one more animal to go with them.',
  tags:['modelled','figure','animal','series','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~17 cm to match the cat','Modelled and hollowed'],
    params:[
      par('technique','Modelled + hollowed'),
      par('clay','Cream stoneware'),
      par('clay amount','~1.2 kg'),
      par('wall','12 mm after hollowing'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Loop tools','Wire','Needle tool'],
    steps:[
      'Model solid, halve with a wire, hollow to 12 mm, rejoin.',
      'Attach ears and tail at soft leather-hard.',
      'Vent hole underneath.',
      'Slow dry, bisque 04, glaze cone 6.'
    ],
    risks:[{ k:'Ear cracks', t:'Happened on the dog. Attach soft and wrap the thin bits.' }],
    refs:[
      { cardId:'black-cat-candle', note:'17 cm, 12 mm wall.' },
      { cardId:'polka-dot-dog', note:'Ears cracked when attached too dry.' }
    ]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-nerikomi-tumblers', state:'idea', title:'NERIKOMI TUMBLERS',
  created:D('2026-06-30'), updated:D('2026-06-30'),
  origin:{ type:'ai', label:'Suggested by UNFIRED' }, glow:'#7A5AA8',
  desc:'Go back to nerikomi, but on a small straight form where you can scrape instead of rib.',
  tags:['nerikomi','stained clay','porcelain','tumbler','experiment','idea'],
  hero:null,
  plan:{
    assumptions:['Porcelain, cone 6','~10 cm tall','Nerikomi around a former'],
    params:[
      par('technique','Nerikomi, wrapped'),
      par('clay','Porcelain + body stains'),
      par('clay amount','~380 g each'),
      par('thickness','8 mm before scraping'),
      par('surface','Clear gloss inside, bare outside'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Wire','Cardboard former','Metal scraper','400 grit'],
    steps:[
      'Build and rest the block overnight so it is stiff enough to slice cleanly.',
      'Slice 4 mm, lay round a cardboard former, join edge to edge.',
      'Leave it alone until leather-hard.',
      'Scrape, do not rib. Then sand the bisque.',
      'Glaze inside only so the pattern stays matt outside.'
    ],
    risks:[
      { k:'Smearing', t:'The exact thing that spoiled the bowl. Scrape at leather-hard, never rib soft.' },
      { k:'Shrinkage mismatch', t:'Stained and unstained porcelain can move differently. Run test tiles before committing.' }
    ],
    refs:[{ cardId:'nerikomi-bowl', note:'Ribbed it soft and dragged the colours. Do not repeat.' }]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-garlic-keeper', state:'idea', title:'GARLIC KEEPER',
  created:D('2026-05-02'), updated:D('2026-05-02'),
  origin:{ type:'note', label:'Apple Notes · shared' }, glow:'#8A8A6A',
  desc:'Lidded pot with vent holes cut in a pattern. Needs to breathe, so unglazed outside.',
  tags:['coil','lidded','vent holes','unglazed','kitchen','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~13 cm tall','Coil built, lid cut from the form'],
    params:[
      par('technique','Coil built'),
      par('clay','Cream stoneware'),
      par('clay amount','~1.1 kg'),
      par('wall','7 mm'),
      par('surface','Bare outside, clear gloss inside'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Hole cutters 8 mm and 12 mm','Paddle','Rib'],
    steps:[
      'Coil a closed form, then cut the lid off it so the fit is exact.',
      'Cut the vent holes at leather-hard, from the outside in, and clean the burr inside.',
      'Keep holes away from the lid seat.',
      'Dry slow, bisque 04, glaze inside only, cone 6.'
    ],
    risks:[{ k:'Cracks from the holes', t:'Every hole is a stress point. Round the edges and keep them well apart.' }],
    refs:[{ cardId:'lavender-teapot-2', note:'Cutting holes before assembly is easier — you found this with the teapot strainer.' }]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-bird-flock', state:'idea', title:'A FLOCK OF BIRDS',
  created:D('2026-03-30'), updated:D('2026-03-30'),
  origin:{ type:'voice', label:'Voice note' }, glow:'#8A6B44',
  desc:'Six or seven of the speckled bird, all slightly different sizes, sold as a flock.',
  tags:['modelled','figure','animal','series','speckled stoneware','idea'],
  hero:null,
  plan:{
    assumptions:['Speckled stoneware, cone 6','6–11 cm each','Modelled'],
    params:[
      par('technique','Modelled + hollowed'),
      par('clay','Speckled stoneware'),
      par('clay amount','~2 kg for seven'),
      par('surface','Brown breaking glaze'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Loop tool','Needle tool'],
    steps:[
      'Weigh the balls first — 200 g to 400 g — so the sizes step evenly.',
      'Model, hollow, vent each one.',
      'Glaze the same and let the speckle do the variation.'
    ],
    risks:[{ k:'Sameness', t:'Vary the head angle, not the glaze, or it reads as a factory set.' }],
    refs:[{ cardId:'speckled-bird', note:'350 g, 10 mm wall, vented in the base.' }]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-wavy-cups', state:'idea', title:'WAVY RIM CUPS',
  created:D('2026-08-02'), updated:D('2026-08-02'),
  origin:{ type:'text', label:'Typed' }, glow:'#C0552A',
  desc:'Cups where the rim itself waves instead of the decoration. Cut the wave, do not paint it.',
  tags:['pinched','wavy rim','cup','minimal','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~8 cm tall','Pinched, rim cut'],
    params:[
      par('technique','Pinched, cut rim'),
      par('clay','Cream stoneware'),
      par('clay amount','~400 g'),
      par('surface','One glaze, no decoration'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Needle tool','Template card','Sponge'],
    steps:[
      'Pinch the cup a centimetre taller than final.',
      'Cut the wave at soft leather-hard with a needle tool against a card template.',
      'Compress the cut edge with a damp chamois or it will crack.',
      'Bisque 04, single glaze, cone 6.'
    ],
    risks:[{ k:'Rim cracks', t:'Any cut edge must be compressed. This is the whole difficulty of the form.' }],
    refs:[{ cardId:'orange-wave-plate', note:'The wave, moved from the surface into the form.' }]
  },
  photos:[], notes:[], threads:[]
},
{
  id:'idea-blue-engobe-jug', state:'idea', title:'BLUE ENGOBE JUG',
  created:D('2026-08-24'), updated:D('2026-08-24'),
  origin:{ type:'voice', label:'Voice note · 24 Aug' }, glow:'#5B8FC9',
  desc:'The blue engobe from the mug, but poured down a whole jug in three coats so it really covers.',
  tags:['coil','engobe','turquoise engobe','jug','blue','idea'],
  hero:null,
  plan:{
    assumptions:['Stoneware, cone 6','~18 cm tall','Coil built'],
    params:[
      par('technique','Coil + paddle'),
      par('clay','Cream stoneware'),
      par('clay amount','~1.3 kg'),
      par('wall','7 mm'),
      par('surface','Blue engobe, 3 coats'),
      par('firing','Bisque 04 · glaze cone 6'),
    ],
    tools:['Paddle','Wide brush','Banding wheel','Jug for pouring'],
    steps:[
      'Coil and paddle the body.',
      'Engobe at leather-hard, three coats, letting each lose its shine.',
      'Pull the spout from the rim.',
      'Handle on at soft leather-hard, wrapped for three days.',
      'Bisque 04, clear gloss, cone 6.'
    ],
    risks:[
      { k:'Engobe flaking', t:'Engobe wants leather-hard clay. On bone dry it lifts.' },
      { k:'Handle crack', t:'Your recurring one. Soft attachment, wrapped drying.' }
    ],
    refs:[
      { cardId:'blue-striped-mug', note:'Three coats of the blue engobe, not two.' },
      { cardId:'red-pink-pitcher', note:'Pulled spout and the handle method that held.' }
    ],
    /* Literal plan text per your Figma mock -- the Plan field is now a single
       freeform block (see js/screens/card.js's planCard()), not composed from
       the structured fields above. Kept here as an explicit example of that
       "AI recommendation" wording; other cards fall back to a plain
       composition of their own steps/tools/risks/refs (planFallbackText). */
    text:'01 · BUILD\n1.3 kg cream stoneware\nCoil + paddle · 7 mm walls\n\n'
      + '02 · SHAPE\nPull spout from rim\nAttach handle · Soft leather-hard\n\n'
      + '⚠ HANDLE CRACK\nCompress the join well\nWrap and dry slowly\n\n'
      + '03 · ENGOBE\nBlue engobe · 3 coats\nLeather-hard · Wide brush\n\n'
      + '⚠ ENGOBE FLAKING\nApply before bone dry\nLet each coat lose its shine\n\n'
      + '04 · DRY\nWrap loosely · Slow dry\n~3 days\n\n'
      + '05 · BISQUE\nCone 04\n\n'
      + '06 · GLAZE + FIRE\nClear gloss · Cone 6\n\n'
      + 'FROM YOUR ARCHIVE\n'
      + 'Blue Line Mug — 3 coats worked better than 2\n'
      + 'Pink Pitcher — pulled spout + handle method worked'
  },
  photos:[], notes:[], threads:[]
}
];

/* Simulated phone photo library — used by the import simulation */
export const PHOTO_LIB = [
  { id:'l1', src:PRC('19-lavender-teapot'), guess:'process', card:'lavender-teapot-2', cap:'Studio, this morning' },
  { id:'l2', src:SNP('19-lavender-teapot'), guess:'process', card:'lavender-teapot-2', cap:'Bench, Tuesday' },
  { id:'l3', src:SNP('01-red-star-sun-plate'), guess:'final', card:'starred-plates', cap:'Kitchen table' },
  { id:'l4', src:SNP('02-red-star-bowl'), guess:'final', card:'starred-plates', cap:'Kitchen table' },
  { id:'l5', src:P('16-pink-shell-dish'), guess:'inspiration', card:null, cap:'Screenshot' },
  { id:'l6', src:SNP('12-green-cup'), guess:'final', card:'green-cup', cap:'Window sill' },
  { id:'l7', src:PRC('14-three-flower-vase'), guess:'process', card:'three-flower-vase', cap:'Drying shelf' },
  { id:'l8', src:P('20-coral-heart-dish'), guess:'inspiration', card:null, cap:'Screenshot' },
];

export const PINTEREST_BOARDS = [
  { id:'b1', name:'Ceramics', n:214 },
  { id:'b2', name:'Glazes', n:88 },
  { id:'b3', name:'Objects', n:167 },
  { id:'b4', name:'Shapes', n:63 },
  { id:'b5', name:'Weird handles', n:41 },
];
