/* GLOBAL LOG — voice-first capture. No forms, no categorisation, no confirmation. */
import { h, toast, fullLayer, sleep, img } from '../ui.js';
import * as S from '../store.js';
import * as AI from '../ai.js';
import { nav } from '../nav.js';
import { mediaDrawer, PLUS24_SVG } from './card.js';
import { statusBar } from './items.js';

const SAMPLES = [
  'I used the blue engobe on the teapot handle and three coats looked much better than two.',
  'The handle cracked after bisque, right where it meets the body.',
  'Spout is on the lavender teapot, cut the strainer holes first this time. Everything under plastic.',
  'I want to make a big red star mug with a proper handle, same red as the plates.',
  'The lavender ran again on the test tile, about five millimetres. Wax higher next time.',
  'Idea — a set of small nerikomi tumblers, straight sided so I can scrape instead of ribbing.',
  'Green cup is out of the glaze fire and it came out really well.',
];

/* Log screen -- Figma 494:23392 (empty), 494:23423 (tapped: keyboard),
   494:23454 (typed), 494:23482 (photo added), 494:23512 (voice). Waits for
   a tap on the mic (no auto-listen); SAVE stays dimmed until there's text or
   a photo, then routes it to the right card or a new idea (process below). */
const CLOSE_SVG = '<svg viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M3.61516 3.61516C3.72768 3.50263 3.88029 3.43942 4.03942 3.43942C4.19855 3.43942 4.35116 3.50263 4.46368 3.61516L7.99922 7.15069L11.5348 3.61516C11.6473 3.50263 11.7999 3.43942 11.959 3.43942C12.1181 3.43942 12.2708 3.50263 12.3833 3.61516C12.4958 3.72768 12.559 3.88029 12.559 4.03942C12.559 4.19855 12.4958 4.35116 12.3833 4.46368L8.84775 7.99922L12.3833 11.5348C12.4958 11.6473 12.559 11.7999 12.559 11.959C12.559 12.1181 12.4958 12.2708 12.3833 12.3833C12.2708 12.4958 12.1181 12.559 11.959 12.559C11.7999 12.559 11.6473 12.4958 11.5348 12.3833L7.99922 8.84775L4.46368 12.3833C4.35116 12.4958 4.19855 12.559 4.03942 12.559C3.88029 12.559 3.72768 12.4958 3.61516 12.3833C3.50263 12.2708 3.43942 12.1181 3.43942 11.959C3.43942 11.7999 3.50263 11.6473 3.61516 11.5348L7.15069 7.99922L3.61516 4.46368C3.50263 4.35116 3.43942 4.19855 3.43942 4.03942C3.43942 3.88029 3.50263 3.72768 3.61516 3.61516Z"/></svg>';
const MIC_SVG = '<svg viewBox="0 0 22 22" fill="none"><path d="M11 17.4172V20.1674M4.5826 9.16652V11C4.5826 12.7019 5.25872 14.3342 6.46221 15.5376C7.66571 16.7411 9.298 17.4172 11 17.4172C12.702 17.4172 14.3343 16.7411 15.5378 15.5376C16.7413 14.3342 17.4174 12.7019 17.4174 11V9.16652M11 1.8326C12.519 1.8326 13.7503 3.06392 13.7503 4.58282V11C13.7503 12.5189 12.519 13.7502 11 13.7502C9.48104 13.7502 8.24969 12.5189 8.24969 11V4.58282C8.24969 3.06392 9.48104 1.8326 11 1.8326Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

export function openCapture({ prompt = 'LOG A NOTE', cardHint = null, source = 'voice' } = {}) {
  let attachments = [];
  let recording = false, timer = null, sample = '', idx = 0;

  fullLayer((wrap, kill) => {
    const cap = h('div', { class: 'capture' });
    const live = h('div', { class: 'live', contenteditable: 'true', spellcheck: 'false' });
    const promptEl = h('div', { class: 'prompt', html: prompt.replace(/\n/g, '<br>') });
    const saveBtn = h('button', { class: 'send' }, 'Save');
    const micBtn = h('button', { class: 'mic', html: MIC_SVG, 'aria-label': 'Voice' });
    const plusBtn = h('button', { class: 'cround', html: PLUS24_SVG, 'aria-label': 'Add photo' });
    const attRow = h('div', { class: 'attachrow' });
    const mid = h('div', { class: 'cmid' }, promptEl, live);

    const close = () => { cap.classList.remove('in'); setTimeout(kill, 340); };

    const sync = () => {
      const text = live.textContent.trim();
      saveBtn.classList.toggle('on', text.length > 0 || attachments.length > 0);
      promptEl.hidden = text.length > 0;       /* your words take the title's place */
    };
    live.addEventListener('input', sync);
    /* tap anywhere in the middle -> type (keyboard on a phone) */
    mid.addEventListener('click', () => { if (document.activeElement !== live) live.focus(); });

    /* simulated live transcription -- the existing word-by-word animation */
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

    /* added photos: 100px tiles above the bar; tap one to remove it */
    const paintAtt = () => {
      attRow.replaceChildren(...attachments.map((a, i) =>
        h('button', { class: 'att', 'aria-label': 'Remove photo',
          onclick: () => { attachments.splice(i, 1); paintAtt(); } }, img(a.src, ''))));
      attRow.hidden = !attachments.length;
      sync();
    };
    plusBtn.addEventListener('click', () => mediaDrawer((src, guess) => {
      attachments.push({ kind: guess || 'process', src });
      paintAtt();
    }, 'ADD TO THIS NOTE'));

    saveBtn.addEventListener('click', () => {
      stopRec();
      const text = live.textContent.trim();
      if (!text && !attachments.length) return;
      close();                                  /* dismiss immediately */
      process(text, attachments.slice(), cardHint, source);
    });

    cap.append(
      statusBar(),
      h('div', { class: 'ctop' }, h('button', { class: 'iconbtn', html: CLOSE_SVG, 'aria-label': 'Close',
        onclick: () => { stopRec(); close(); } })),
      mid,
      h('div', { class: 'cbot' }, attRow, h('div', { class: 'crow' }, plusBtn, saveBtn, micBtn)));
    wrap.append(cap);
    requestAnimationFrame(() => cap.classList.add('in'));
    paintAtt();
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
