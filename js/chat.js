/* UNFIRED chat scenarios, dev page -- chat.html?scenario=<id>. The screen
   is the app's chat (chatui.js) with its own keyboard; copy and mock data
   in data/chat-scenarios.json (the pattern variants come from seed.js, the
   same data the app uses). Widgets: js/widgets/<id>.js, each exporting
   render(container, data, chat). Without ?scenario: a list of all. */
import { h, statusBar } from './ui.js';
import { chatView } from './chatui.js';
import { PATTERNS } from './seed.js';

const root = document.getElementById('chat');

const { scenarios } = await (await fetch('data/chat-scenarios.json')).json();
const id = new URLSearchParams(location.search).get('scenario');
const sc = scenarios.find(s => s.id === id);
if (!sc || !sc.messages) devList(); else open(sc);

function devList() {
  root.append(h('div', { class: 'chatx' }, statusBar(),
    h('div', { class: 'chx-dev' },
      h('h1', { class: 'chx-dev-t' }, 'Chat scenarios'),
      h('ol', {}, ...scenarios.map(s => h('li', {}, s.messages
        ? h('a', { href: '?scenario=' + s.id }, s.name)
        : h('span', {}, s.name + ' — not built yet')))))));
}

function open(sc) {
  const view = chatView({ status: sc.status, title: sc.title, glow: sc.glow,
    onBack: () => history.back(), ownKeyboard: true });
  root.append(view.el);
  view.focus();
  sc.messages.forEach(async m => {
    const text = view.say(m.role, m.text);
    if (!m.widget) return;
    const box = view.widget();
    const mod = await import(`./widgets/${m.widget}.js`);
    mod.render(box, sc.widget || (m.widget === 'patterns' ? PATTERNS : null), { ...view, aiText: text });
  });
}
