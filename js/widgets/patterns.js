/* Pattern variants (Figma 562:11117): the piece, the variant chips and
   SELECT. Switching a chip swaps the image; SELECT answers in the chat and
   locks the choice. */
import { h } from '../ui.js';

export function render(box, data, chat) {
  let sel = data.selected || 0;
  const pic = h('img', { alt: '' });
  const chips = data.variants.map((v, i) => h('button', { class: 'chx-chip', type: 'button',
    onclick: () => { sel = i; paint(); } }, v.label));
  const go = h('button', { class: 'chx-pill', type: 'button', onclick: () => {
    const v = data.variants[sel];
    chips.forEach(c => { c.disabled = true; });
    go.disabled = true; go.textContent = 'Selected';
    chat.say('me', v.label);
    setTimeout(() => chat.say('ai', data.reply.replace('{variant}', v.label)), 500);
  } }, data.action);

  const paint = () => {
    const v = data.variants[sel];
    pic.src = v.img; pic.alt = v.label;
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String(i === sel)));
    /* bring the selected chip into view in the sideways-scrolling row */
    const row = chips[sel].parentElement;
    if (row && row.isConnected) {
      const r = row.getBoundingClientRect(), c = chips[sel].getBoundingClientRect();
      if (c.left < r.left + 16) row.scrollBy({ left: c.left - r.left - 16, behavior: 'smooth' });
      else if (c.right > r.right - 16) row.scrollBy({ left: c.right - r.right + 16, behavior: 'smooth' });
    }
  };

  box.append(
    h('div', { class: 'pv-pic' }, pic),
    h('div', { class: 'chx-chips', role: 'group', 'aria-label': 'Pattern variant' }, ...chips),
    h('div', { class: 'chx-act' }, go));
  paint();
}
