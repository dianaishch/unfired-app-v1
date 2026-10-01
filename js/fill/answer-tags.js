/* CARD-FILL · answer tags (design-ref/card-fill Fill-Kit, Fill-Clay): for a
   field whose answer is only a choice. No card, no buttons -- the tags sit
   right-aligned under the AI question, the guess highlighted, "Not now"
   last; one tap answers. onAnswer(label) or onAnswer(null) for Not now. */
import { h } from '../ui.js';

export function render(box, { options, guess = 0, notNow }, onAnswer) {
  box.classList.add('chx-tags');
  const tag = (label, opt, on) => {
    const b = h('button', { class: 'chx-chip', type: 'button', 'aria-pressed': on ? 'true' : 'false',
      onclick: () => onAnswer(label === null ? null : label) },
      opt.dot ? h('span', { class: 'chx-dot', style: { background: opt.dot } }) : null,
      opt.label || opt);
    return b;
  };
  box.replaceChildren(
    ...options.map((o, i) => tag(o.label || o, o, i === guess)),
    tag(null, notNow, false));
  return box;
}
