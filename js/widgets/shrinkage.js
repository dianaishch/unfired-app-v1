/* Shrinkage calculator: the fired height you want (slider) and your clay
   (chips) give the height to throw it: wet = fired / (1 - shrink), one
   decimal. Everything updates live -- the numbers in the AI bubble too --
   and two bars show wet against fired. SAVE TO RECIPE answers in the chat. */
import { h } from '../ui.js';

/* throwing height: always one decimal; the fired height as set (9, 9.5) */
const one = (n) => (Math.round(n * 10) / 10).toFixed(1);
const plain = (n) => String(Math.round(n * 10) / 10);

export function render(box, data, chat) {
  const template = chat.aiText.textContent;
  let fired = data.fired, clay = data.clay;

  const value = h('div', { class: 'sh-val' });
  const range = h('input', { class: 'chx-range', type: 'range', min: data.min, max: data.max, step: data.step,
    value: fired, 'aria-label': 'Fired height in centimetres' });
  range.addEventListener('input', () => { fired = +range.value; paint(); });
  const chips = data.clays.map((c, i) => h('button', { class: 'chx-chip', type: 'button',
    onclick: () => { clay = i; paint(); } }, `${c.label} ${c.shrink}%`));
  const bar = (label) => {
    const fill = h('i'), num = h('span', { class: 'sh-num' });
    return { el: h('div', { class: 'sh-bar' }, h('div', { class: 'chx-label' }, label),
      h('div', { class: 'sh-track' }, fill, num)), fill, num };
  };
  const wetBar = bar('Throw it'), firedBar = bar('After firing');
  wetBar.el.classList.add('wet');
  const save = h('button', { class: 'chx-pill', type: 'button', onclick: () => chat.act(save, data.action, fill(data.reply)) }, data.action);

  const wet = () => fired / (1 - data.clays[clay].shrink / 100);
  const fill = (t) => t.replace('{wet}', one(wet())).replace('{pct}', data.clays[clay].shrink)
    .replace('{fired}', plain(fired)).replace('{clay}', data.clays[clay].label.toLowerCase());
  const most = data.max / (1 - Math.max(...data.clays.map(c => c.shrink)) / 100);

  const paint = () => {
    chat.aiText.textContent = fill(template);
    value.textContent = plain(fired) + ' cm';
    range.style.setProperty('--p', ((fired - data.min) / (data.max - data.min) * 100) + '%');
    chips.forEach((c, i) => c.setAttribute('aria-pressed', String(i === clay)));
    wetBar.fill.style.width = (wet() / most * 100) + '%'; wetBar.num.textContent = one(wet()) + ' cm';
    firedBar.fill.style.width = (fired / most * 100) + '%'; firedBar.num.textContent = plain(fired) + ' cm';
  };

  box.append(
    h('label', { class: 'sh-head' }, h('span', { class: 'chx-label' }, 'Fired height'), value),
    range,
    h('div', { class: 'chx-chips', role: 'group', 'aria-label': 'Clay' }, ...chips),
    h('div', { class: 'sh-bars' }, wetBar.el, firedBar.el),
    h('div', { class: 'chx-act' }, save));
  paint();
}
