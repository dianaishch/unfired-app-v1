/* CARD-FILL runner: one empty field of a piece card, filled in chat.
   The AI asks its guess; the field's pattern (answer tags / field card)
   takes the answer -- a tap, or SAVE / SKIP under a field card; then your bubble with it, UNFIRED's bubble saying
   what was saved to the card, and its bubble naming the next gap.
   Undo is a message: "undo", "change it", "that's wrong"... puts the
   card's old value back and asks again. Typing one of the options answers
   too. Copy and options: data/card-fill.json.
   card: { get(), set(value) } -- where the answer is written.
   Returns { onText(text) } -> true when the fill handled the message. */
import { render as answerTags } from './answer-tags.js';
import { render as fieldCard } from './field-card.js';
import { savedText, undoneText, isUndo } from './receipt.js';

export function runFill(view, data, key, card) {
  const f = data.fields[key];
  let box = null;          // the open answer tags, while asking
  let last = null;         // { before } of the last answer, for undo

  const ask = () => {
    view.say('ai', f.question);
    box = view.widget();
    if (f.pattern === 'tags')
      answerTags(box, { options: f.options, guess: f.guess, notNow: data.notNow }, (v) => {
        view.say('me', v === null ? data.notNow : v);
        answer(v);
      });
    if (f.pattern === 'card')
      fieldCard(box, f, data, (r) => {
        view.say('me', r ? r.said : data.notNow);
        answer(r ? r.value : null, r && r.written);
      });
  };
  /* v: the value written to the card (null = Not now / Skip); written:
     how the confirmation reads, when it isn't just the value */
  const answer = (v, written = v) => {
    if (box) { box.remove(); box = null; }
    last = { before: card.get() };
    if (v !== null) card.set(v);
    view.say('ai', savedText(data, f.title, v === null ? null : written));
    /* the next gap -- or, per answer, what follows from it (What happened) */
    view.say('ai', (v !== null && f.nextFor?.[v]) || f.next);
  };

  ask();
  return {
    /* a typed message; your bubble is already in the chat */
    onText(text) {
      if (isUndo(data, text)) {
        if (!last) { view.say('ai', data.nothingToUndo); return true; }
        card.set(last.before);
        view.say('ai', undoneText(data, f.title, last.before));
        last = null;
        ask();
        return true;
      }
      const opt = (f.options || []).find(o => (o.label || o).toLowerCase() === text.trim().toLowerCase());
      if (opt && box) { answer(opt.label || opt); return true; }
      return false;
    },
  };
}
