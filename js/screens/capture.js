/* GLOBAL LOG — voice-first capture. No forms, no categorisation, no confirmation. */
import { h, ICON, toast, fullLayer, sleep, img } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { PHOTO_LIB } from '../seed.js';

const SAMPLES = [
  'I used the blue engobe on the teapot handle and three coats looked much better than two.',
  'The handle cracked after bisque, right where it meets the body.',
  'Spout is on the lavender teapot, cut the strainer holes first this time. Everything under plastic.',
  'I want to make a big red star mug with a proper handle, same red as the plates.',
  'The lavender ran again on the test tile, about five millimetres. Wax higher next time.',
  'Idea — a set of small nerikomi tumblers, straight sided so I can scrape instead of ribbing.',
  'Green cup is out of the glaze fire and it came out really well.',
];

export function openCapture({ prompt = 'WHAT ARE\nWE MAKING?', cardHint = null, source = 'voice' } = {}) {
  let attachments = [];
  let recording = false, timer = null, sample = '', idx = 0;

  fullLayer((wrap, kill) => {
    const cap = h('div', { class: 'capture' });
    const live = h('div', { class: 'live', contenteditable: 'true', spellcheck: 'false' });
    const promptEl = h('div', { class: 'prompt h-mega', html: prompt.replace(/\n/g, '<br>') });
    const sendBtn = h('button', { class: 'send' }, 'SEND');
    const micBtn = h('button', { class: 'mic', html: ICON.mic });
    const attRow = h('div', { class: 'attachrow' });

    const close = () => { cap.classList.remove('in'); setTimeout(kill, 340); };

    const sync = () => {
      const has = live.textContent.trim().length > 0 || attachments.length > 0;
      sendBtn.classList.toggle('on', has);
      promptEl.style.opacity = live.textContent.trim() ? '0' : '1';
    };
    live.addEventListener('input', sync);

    /* simulated live transcription */
    const startRec = () => {
      recording = true;
      micBtn.classList.add('rec');
      sample = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
      const words = sample.split(' ');
      idx = 0; live.textContent = '';
      timer = setInterval(() => {
        if (idx >= words.length) { stopRec(); return; }
        live.textContent = words.slice(0, ++idx).join(' ');
        live.scrollTop = live.scrollHeight;
        sync();
      }, 105);
    };
    const stopRec = () => {
      recording = false; micBtn.classList.remove('rec');
      clearInterval(timer); timer = null; sync();
    };
    micBtn.addEventListener('click', () => recording ? stopRec() : startRec());

    const paintAtt = () => {
      attRow.replaceChildren();
      attachments.forEach((a, i) => {
        const el = h('button', { class: 'att', onclick: () => { attachments.splice(i, 1); paintAtt(); sync(); } });
        if (a.src) el.append(img(a.src, ''));
        else el.append(h('span', {}, a.label));
        attRow.append(el);
      });
      sync();
    };

    const fileInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0]; if (!f) return;
      attachments.push({ kind: 'process', src: URL.createObjectURL(f) });
      paintAtt();
    });

    const addFromLib = () => {
      const p = PHOTO_LIB[Math.floor(Math.random() * PHOTO_LIB.length)];
      attachments.push({ kind: p.guess, src: p.src });
      paintAtt();
    };

    const chips = h('div', { class: 'chips' },
      h('button', { class: 'chip', onclick: () => { live.focus(); } }, 'Type'),
      h('button', { class: 'chip', onclick: addFromLib }, '+ Photo'),
      h('button', { class: 'chip', onclick: () => fileInput.click() }, '+ Upload'),
      h('button', { class: 'chip', onclick: () => { attachments.push({ kind: 'video', label: 'VIDEO 0:14' }); paintAtt(); } }, '+ Video'),
      h('button', { class: 'chip', onclick: () => { attachments.push({ kind: 'link', label: 'LINK' }); paintAtt(); } }, '+ Link'));

    sendBtn.addEventListener('click', () => {
      stopRec();
      const text = live.textContent.trim();
      if (!text && !attachments.length) return;
      close();                                  /* dismiss immediately */
      process(text, attachments.slice(), cardHint, source);
    });

    cap.append(
      h('div', { class: 'ctop' }, h('button', { class: 'iconbtn', html: ICON.close, onclick: () => { stopRec(); close(); } })),
      h('div', { class: 'cmid' }, promptEl, live),
      h('div', { class: 'cbot' }, attRow, chips, h('div', { class: 'crow' }, micBtn, sendBtn)),
      fileInput);
    wrap.append(cap);
    requestAnimationFrame(() => cap.classList.add('in'));
    sync();
    setTimeout(startRec, 850);                  /* voice-first: it is already listening */
  });
}

/* ---------- background "AI" pipeline ---------- */
async function process(text, attachments, cardHint, source) {
  const work = toast({ work: true, html: 'Understanding…', ms: 6000 });
  await sleep(220);

  let res;
  if (cardHint) {
    const card = S.byId(cardHint);
    res = { kind: 'attach', card, extraction: AI.extract(text), inferState: null, reason: 'context' };
  } else {
    res = AI.classify(text, attachments);
  }
  work.kill();

  if (res.kind === 'attach') {
    const c = res.card;
    const snap = S.addNote(c.id, { text, src: source });
    attachments.filter(a => a.src).forEach(a => S.addPhoto(c.id, { src: a.src, kind: a.kind, cap: 'Logged with a note' }));

    /* structured extraction lands on the plan */
    res.extraction.forEach(e => {
      const has = c.plan?.params.find(p => p.key === e.k);
      if (has) S.setParam(c.id, e.k, e.v);
    });

    let extra = '';
    if (res.inferState) {
      S.setState(c.id, res.inferState);
      extra = res.inferState === 'making' ? '<br>Looks like you started making this. <b>MAKING</b>'
                                          : '<br>Looks finished. <b>FINISHED</b>';
      if (res.inferState === 'finished') S.updateCard(c.id, { readyToShare: true });
    }
    nav.refresh();
    toast({
      html: `Added to <b>${c.title}</b>${extra}`,
      undo: () => { S.restore(snap); nav.refresh(); toast({ text: 'Undone' }); },
      ms: 5600,
    });
    if (res.extraction.length)
      setTimeout(() => toast({
        html: res.extraction.map(e => `<b>${e.k}</b> ${e.v}`).join(' · '), ms: 3600, work: true
      }), 320);
  } else {
    const snap = S.addCard(res.card);
    nav.refresh();
    toast({
      html: `Created new idea <b>${res.card.title}</b><br>Plan already written.`,
      undo: () => { S.restore(snap); nav.refresh(); toast({ text: 'Undone' }); },
      ms: 5600,
    });
  }
}

export { process as processLog };
