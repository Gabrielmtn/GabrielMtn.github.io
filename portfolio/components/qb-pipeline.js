// <qb-pipeline> A sketch of the Pipelines builder's information architecture and interaction model: a guided flow
// of steps running top to bottom in an open workspace. Each step names its channel (the service it talks to) and
// its action with an icon. Its body is split into collapsible sections: the data it uses stays open, and the
// connection details, which repeat from step to step, fold away. One search covers every channel's actions, and a
// pick drops a new step at the end of whichever branch you chose. Set a test budget and run it to see the path.
import { mount, reducedMotion, fmt, focusCss } from './shared.js';

const ico = (d, extra = '') => `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
// channels: generic glyphs, not the services' logos
const CH = {
  qb: { name: 'Quickbase', c: '#a98cf0', g: '<rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 6.5h12M6 6.5V13"/>' },
  slack: { name: 'Slack', c: '#e8a33d', g: '<path d="M3 3.5h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7l-3 2.5V11.5H3a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/>' },
  cal: { name: 'Calendar', c: '#5fb3e8', g: '<rect x="2" y="3.5" width="12" height="10" rx="1.5"/><path d="M2 7h12M5.5 2v3M10.5 2v3"/>' },
  mail: { name: 'Email', c: '#e8717f', g: '<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 9l5.5-4.5"/>' },
  hook: { name: 'Webhooks', c: '#7fd1a8', g: '<path d="M6.5 9.5 9.5 6.5"/><path d="M7 4.5l1.2-1.2a2.5 2.5 0 0 1 3.5 3.5L10.5 8M9 11.5l-1.2 1.2a2.5 2.5 0 0 1-3.5-3.5L5.5 8"/>' },
  logic: { name: 'Logic', c: '#c9d0cc', g: '<path d="M8 2v4M8 6 4 10v4M8 6l4 4v4"/>' },
};
// actions: what the step does, each with its own icon
const VERB = {
  trigger: '<path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/>',
  search: '<circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/>',
  create: '<path d="M8 3v10M3 8h10"/>',
  update: '<path d="M10.5 2.5l3 3L6 13H3v-3z"/>',
  send: '<path d="M14 2 7 9M14 2l-4.5 12L7 9 2 6.5z"/>',
  cond: '<path d="M8 2v4M8 6 4 10v4M8 6l4 4v4"/>',
};

const tok = (t) => `<span class="tok">${t}</span>`;
const MAIN = [
  { id: 's1', ch: 'qb', verb: 'trigger', kind: 'Trigger', title: 'When a record is added to <b>Projects</b>',
    data: [['Watch table', 'Projects'], ['Test record', '<span class="tok">Project name</span> Riverside clinic'], ['Budget', '__budget__']],
    conn: [['Account', 'acme.quickbase.com'], ['App', 'Operations'], ['Runs as', 'Pipeline owner']] },
  { id: 's2', ch: 'qb', verb: 'search', kind: 'Search records', title: 'Find the matching row in <b>Budgets</b>',
    data: [['Table', 'Budgets'], ['Where', `Project ${tok('1 · Project name')}`], ['Return', 'First match']],
    conn: [['Account', 'acme.quickbase.com'], ['App', 'Finance']] },
  { id: 's3', ch: 'logic', verb: 'cond', kind: 'Condition', title: 'If the budget is over the limit',
    data: [['Value', tok('1 · Budget')], ['Is greater than', '__limit__']], conn: null },
];
const LIB = [
  { ch: 'qb', verb: 'create', name: 'Create a record', data: [['Table', 'Tasks'], ['Name', tok('1 · Project name')]] },
  { ch: 'qb', verb: 'update', name: 'Update a record', data: [['Table', 'Projects'], ['Status', 'In review']] },
  { ch: 'qb', verb: 'search', name: 'Search records', data: [['Table', 'Contacts'], ['Where', `Owner ${tok('1 · Owner')}`]] },
  { ch: 'slack', verb: 'send', name: 'Send a message', data: [['Channel', '#finance'], ['Message', `${tok('1 · Project name')} needs a budget review`]] },
  { ch: 'slack', verb: 'create', name: 'Create a channel', data: [['Name', `proj-${tok('1 · Project name')}`]] },
  { ch: 'cal', verb: 'create', name: 'Create an event', data: [['Title', `Kickoff: ${tok('1 · Project name')}`], ['When', 'Next business day, 10:00']] },
  { ch: 'cal', verb: 'search', name: 'Find events', data: [['Calendar', 'Team'], ['Contains', tok('1 · Project name')]] },
  { ch: 'mail', verb: 'send', name: 'Send an email', data: [['To', tok('1 · Owner')], ['Subject', `Welcome to ${tok('1 · Project name')}`]] },
  { ch: 'hook', verb: 'send', name: 'Make a request', data: [['Method', 'POST'], ['URL', 'https://hooks.example.com/new']] },
];
const CONN = { qb: [['Account', 'acme.quickbase.com']], slack: [['Workspace', 'Acme']], cal: [['Account', 'ops@acme.example']], mail: [['From', 'ops@acme.example']], hook: [['Auth', 'None']] };
const START = { yes: [{ lib: 3 }], no: [{ lib: 5 }] };

const css = `
:host { display: block; container-type: inline-size; --bg: #12161a; --card: #1a1f22; --line: #2d3437; --line2: #3a4246; --ink: #e7ebe9; --mut: #a3aca8; --acc: #8ea4ff; --ok: #5fd38d; }
${focusCss}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
.app { background: var(--bg); border: 1px solid var(--line); border-radius: 4px; color: var(--ink); font: 14px/1.4 var(--f-body, system-ui, sans-serif); overflow: hidden; }
.mono { font: 500 10.5px/1.2 var(--f-mono, ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; color: var(--mut); }
button { font: inherit; color: inherit; cursor: pointer; }
.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; padding: 12px 16px; border-bottom: 1px solid var(--line); background: #161b1e; }
.top .name { display: grid; gap: 3px; } .top b { font-size: 15px; font-weight: 600; }
.acts { display: flex; flex-wrap: wrap; gap: 8px; }
.btn { font-weight: 600; font-size: 13px; border-radius: 4px; padding: 7px 12px; border: 1px solid var(--line2); background: transparent; }
.btn:hover { border-color: var(--mut); }
.btn.run { background: var(--acc); border-color: var(--acc); color: #0b1020; display: inline-flex; gap: 6px; align-items: center; }
.btn:disabled { opacity: .55; cursor: default; }
.body { display: grid; grid-template-columns: minmax(0, 1fr) 264px; }
.ws { padding: 22px clamp(12px, 3cqi, 32px) 26px; min-width: 0;
  background-image: radial-gradient(circle at 1px 1px, #252c30 1px, transparent 0); background-size: 18px 18px; }
.flow { max-width: 640px; margin: 0 auto; }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 22px; }
ol > li { position: relative; }
ol > li + li::before, .split::before, .br::before { content: ""; position: absolute; left: 50%; width: 2px; margin-left: -1px; background: var(--line2); }
ol > li + li::before { top: -22px; height: 22px; }
/* the two branches: a line down from the condition, a bar across, a line down into each */
.split { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-top: 40px; margin-top: 0; }
.split::before { top: 0; height: 20px; }
.split > i { position: absolute; top: 19px; left: 25%; right: 25%; border-top: 2px solid var(--line2); margin: 0 -4px; }
.br { position: relative; display: grid; gap: 12px; align-content: start; min-width: 0; }
.br::before { top: -21px; height: 21px; }
.bl { justify-self: center; background: var(--bg); border: 1px solid var(--line2); border-radius: 99px; padding: 4px 10px; position: relative; }
.br.lit .bl { border-color: var(--ok); color: var(--ok); }
.br.skip { opacity: .42; }
.add { justify-self: center; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--mut); background: var(--bg); border: 1px dashed var(--line2); border-radius: 4px; padding: 6px 12px; }
.add:hover, .add[aria-pressed="true"] { color: var(--ink); border-color: var(--acc); border-style: solid; }
.add[aria-pressed="true"] { background: rgba(142,164,255,.12); }

/* a step */
.step { background: var(--card); border: 1px solid var(--line2); border-radius: 6px; transition: border-color .2s, box-shadow .2s; min-width: 0; }
.step.lit { border-color: var(--ok); box-shadow: 0 0 0 3px rgba(95,211,141,.14); }
.step.new { animation: pop .35s ease-out; }
@keyframes pop { from { transform: translateY(-6px); opacity: 0; } }
.hd { display: flex; align-items: stretch; gap: 0; }
.tog { flex: 1; min-width: 0; display: grid; grid-template-columns: 32px minmax(0, 1fr) 16px; gap: 2px 10px; align-items: center; text-align: left; background: none; border: 0; padding: 10px 12px; border-radius: 6px; }
.chip { grid-row: span 2; width: 32px; height: 32px; border-radius: 6px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 18%, transparent); color: var(--c); border: 1px solid color-mix(in srgb, var(--c) 45%, transparent); }
.kind { display: flex; align-items: center; gap: 6px; min-width: 0; }
.kind svg { width: 12px; height: 12px; flex: none; color: var(--ink); }
.ttl { font-size: 14px; color: var(--ink); grid-column: 2; min-width: 0; overflow-wrap: anywhere; }
.ttl b { font-weight: 600; }
.car { grid-row: 1 / span 2; grid-column: 3; color: var(--mut); transition: transform .2s; }
.tog[aria-expanded="false"] .car { transform: rotate(-90deg); }
.ok { display: none; color: var(--ok); }
.step.lit .ok { display: inline; }
.rm { flex: none; width: 34px; background: none; border: 0; color: var(--mut); border-radius: 6px; display: grid; place-items: center; }
.rm:hover { color: var(--ink); }
.bd { border-top: 1px solid var(--line); padding: 4px 12px 10px; display: grid; gap: 2px; }
.sec { padding-top: 8px; }
.sh { margin: 0 0 6px; }
dl { margin: 0; display: grid; grid-template-columns: minmax(84px, max-content) minmax(0, 1fr); gap: 6px 12px; font-size: 13px; }
dt { color: var(--mut); } dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
.tok { display: inline-block; font: 500 11.5px/1.5 var(--f-mono, ui-monospace, monospace); color: #cdd6ff; background: rgba(142,164,255,.14); border: 1px solid rgba(142,164,255,.35); border-radius: 3px; padding: 0 5px; }
.data { background: #15191c; border: 1px solid var(--line); border-radius: 4px; padding: 10px; margin-top: 8px; }
details summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 6px; padding: 6px 0 2px; border-radius: 3px; }
details summary::-webkit-details-marker { display: none; }
details summary svg { transition: transform .2s; transform: rotate(-90deg); }
details[open] summary svg { transform: none; }
details dl { padding: 6px 0 2px 18px; }
.num { display: inline-flex; align-items: center; gap: 4px; }
.num input { width: 96px; font: inherit; font-variant-numeric: tabular-nums; color: var(--ink); background: var(--bg); border: 1px solid var(--line2); border-radius: 4px; padding: 3px 6px; }
.num input:focus-visible { outline: 2px solid var(--acc); outline-offset: 1px; }

/* channel search */
.lib { border-left: 1px solid var(--line); background: #161b1e; padding: 16px; display: grid; gap: 10px; align-content: start; min-width: 0; }
.lib h3 { margin: 0; font-size: 14px; font-weight: 600; }
.to { margin: 0; font-size: 12.5px; color: var(--mut); } .to b { color: var(--ink); font-weight: 600; }
.sb { position: relative; } .sb svg { position: absolute; left: 9px; top: 50%; margin-top: -8px; color: var(--mut); pointer-events: none; }
.sb input { width: 100%; font: inherit; font-size: 13.5px; color: var(--ink); background: var(--bg); border: 1px solid var(--line2); border-radius: 4px; padding: 8px 10px 8px 32px; }
.sb input:focus-visible { outline: 2px solid var(--acc); outline-offset: 1px; }
.cnt { margin: 0; font-size: 12px; color: var(--mut); min-height: 1.2em; }
.res { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.grp { display: grid; gap: 2px; }
.gh { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.gh .chip { width: 22px; height: 22px; border-radius: 4px; grid-row: auto; } .gh .chip svg { width: 13px; height: 13px; }
.pick { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: 1px solid transparent; border-radius: 4px; padding: 6px 8px; font-size: 13px; }
.pick:hover { background: var(--card); border-color: var(--line2); }
.pick svg { color: var(--mut); flex: none; }
mark { background: rgba(142,164,255,.3); color: inherit; border-radius: 2px; }
.status { margin: 0; padding: 10px 16px; border-top: 1px solid var(--line); font-size: 13px; color: #c9d0cc; min-height: 2.6em; }
@container (max-width: 760px) {
  .body { grid-template-columns: minmax(0, 1fr); }
  .lib { border-left: 0; border-top: 1px solid var(--line); }
  .res { max-height: 300px; overflow: auto; }
}
@container (max-width: 540px) {
  .split { grid-template-columns: minmax(0, 1fr); padding-top: 22px; gap: 22px; }
  .split > i { display: none; } .split::before { height: 22px; }
  .br::before { display: none; } .br + .br::before { display: block; top: -22px; height: 22px; }
  .top { padding: 12px; }
}
@media (prefers-reduced-motion: reduce) { .step.new { animation: none; } * { transition: none !important; } }
`;

let seq = 0;
class QbPipeline extends HTMLElement {
  connectedCallback() {
    const u = Math.random().toString(36).slice(2, 7);
    this.u = u;
    const root = mount(this, css, `
      <div class="app">
        <div class="top">
          <div class="name"><span class="mono">Pipeline</span><b>New project kickoff</b></div>
          <div class="acts">
            <button type="button" class="btn all">Collapse all</button>
            <button type="button" class="btn run">${ico('<path d="M5 3l8 5-8 5z"/>')}Run test</button>
          </div>
        </div>
        <div class="body">
          <div class="ws">
            <div class="flow">
              <ol class="main" aria-label="Steps">${MAIN.map((s, i) => this.card(s, i + 1)).join('')}</ol>
              <div class="split"><i aria-hidden="true"></i>
                ${['yes', 'no'].map((b) => `
                <section class="br" data-br="${b}" aria-label="If ${b}">
                  <span class="bl mono">If ${b}</span>
                  <ol class="list" aria-label="Steps if ${b}"></ol>
                  <button type="button" class="add" data-br="${b}" aria-pressed="${b === 'yes'}" aria-controls="q-${u}">${ico(VERB.create)}Add step</button>
                </section>`).join('')}
              </div>
            </div>
          </div>
          <div class="lib">
            <h3>Add a step</h3>
            <p class="to">Adds to the end of <b class="tgt">If yes</b></p>
            <div class="sb">${ico(VERB.search)}<input id="q-${u}" type="search" placeholder="Search all channels" aria-label="Search all channels and actions" autocomplete="off"></div>
            <p class="cnt" aria-live="polite"></p>
            <ul class="res"></ul>
          </div>
        </div>
        <p class="status" role="status" aria-live="polite">Open a step to see its data, search the channels to add one, then run a test.</p>
      </div>`);
    if (!root) return;
    this.root = root;
    this.target = 'yes';
    this.branches = { yes: START.yes.map((x) => this.fromLib(x.lib, false)), no: START.no.map((x) => this.fromLib(x.lib, false)) };
    ['yes', 'no'].forEach((b) => this.drawBranch(b));
    this.wireCards(root.querySelector('.main'));
    this.drawResults('');

    root.querySelector('.run').addEventListener('click', () => this.run());
    const all = root.querySelector('.all');
    all.addEventListener('click', () => {
      const open = all.textContent === 'Expand all';
      root.querySelectorAll('.tog').forEach((t) => this.setOpen(t, open));
      all.textContent = open ? 'Collapse all' : 'Expand all';
    });
    root.querySelector('.split').addEventListener('click', (e) => {
      const add = e.target.closest('.add');
      if (add) { this.setTarget(add.dataset.br); root.querySelector('input[type=search]').focus(); return; }
      const rm = e.target.closest('.rm');
      if (rm) this.remove(rm.closest('.step').dataset.id);
    });
    const q = root.querySelector('input[type=search]');
    q.addEventListener('input', () => this.drawResults(q.value));
    root.querySelector('.res').addEventListener('click', (e) => {
      const p = e.target.closest('.pick');
      if (p) this.insert(Number(p.dataset.lib));
    });
  }
  fromLib(i, fresh) {
    const a = LIB[i];
    return { id: `x${++seq}`, ch: a.ch, verb: a.verb, kind: a.name, data: a.data, conn: CONN[a.ch], removable: true, fresh };
  }
  card(s, n) {
    const ch = CH[s.ch], u = this.u, bid = `b-${u}-${s.id}`;
    const val = (v) => v === '__budget__'
      ? `<span class="num">$<input type="number" inputmode="numeric" min="0" step="1000" value="72000" class="budget" aria-label="Test record budget, dollars"></span>`
      : v === '__limit__'
        ? `<span class="num">$<input type="number" inputmode="numeric" min="0" step="1000" value="50000" class="limit" aria-label="Budget limit, dollars"></span>`
        : v;
    const rows = (r) => `<dl>${r.map(([k, v]) => `<dt>${k}</dt><dd>${val(v)}</dd>`).join('')}</dl>`;
    return `<li class="step${s.fresh ? ' new' : ''}" data-id="${s.id}" style="--c:${ch.c}">
      <div class="hd">
        <button type="button" class="tog" aria-expanded="true" aria-controls="${bid}">
          <span class="chip">${ico(ch.g)}</span>
          <span class="kind mono">${ch.name} · ${n ? s.kind : 'Action'}<span class="ok">${ico('<path d="m3 8.5 3 3 7-7"/>')}</span></span>
          <span class="ttl">${n ? s.title : s.kind}</span>
          <span class="car">${ico('<path d="m4 6 4 4 4-4"/>')}</span>
        </button>
        ${s.removable ? `<button type="button" class="rm" aria-label="Remove ${s.kind} step">${ico('<path d="M4 4l8 8M12 4l-8 8"/>')}</button>` : ''}
      </div>
      <div class="bd" id="${bid}">
        <div class="sec data"><p class="sh mono">${ico(VERB[s.verb], ' style="width:11px;height:11px;vertical-align:-1px;margin-right:4px"')}Data</p>${rows(s.data)}</div>
        ${s.conn ? `<details class="sec"><summary class="mono">${ico('<path d="m4 6 4 4 4-4"/>', ' style="width:12px;height:12px"')}Connection</summary>${rows(s.conn)}</details>` : ''}
      </div>
    </li>`;
  }
  wireCards(scope) {
    scope.querySelectorAll('.tog').forEach((t) => {
      if (t.dataset.w) return; t.dataset.w = 1;
      t.addEventListener('click', () => this.setOpen(t, t.getAttribute('aria-expanded') !== 'true'));
    });
  }
  setOpen(t, open) {
    t.setAttribute('aria-expanded', String(open));
    this.root.getElementById(t.getAttribute('aria-controls')).hidden = !open;
  }
  drawBranch(b) {
    const ol = this.root.querySelector(`.br[data-br="${b}"] .list`);
    ol.innerHTML = this.branches[b].map((s) => this.card(s)).join('');
    this.branches[b].forEach((s) => { s.fresh = false; });
    this.wireCards(ol);
  }
  setTarget(b) {
    this.target = b;
    this.root.querySelectorAll('.add').forEach((a) => a.setAttribute('aria-pressed', String(a.dataset.br === b)));
    this.root.querySelector('.tgt').textContent = `If ${b}`;
  }
  drawResults(q) {
    const term = q.trim().toLowerCase();
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hi = (s) => term ? s.replace(new RegExp(`(${esc(term)})`, 'ig'), '<mark>$1</mark>') : s;
    const hits = LIB.map((a, i) => ({ a, i })).filter(({ a }) => !term || `${CH[a.ch].name} ${a.name}`.toLowerCase().includes(term));
    const groups = [...new Set(hits.map((h) => h.a.ch))];
    this.root.querySelector('.res').innerHTML = groups.map((g) => `
      <li class="grp" style="--c:${CH[g].c}">
        <p class="gh"><span class="chip">${ico(CH[g].g)}</span><span class="mono">${hi(CH[g].name)}</span></p>
        ${hits.filter((h) => h.a.ch === g).map(({ a, i }) => `<button type="button" class="pick" data-lib="${i}">${ico(VERB[a.verb])}<span>${hi(a.name)}</span></button>`).join('')}
      </li>`).join('');
    const n = hits.length;
    this.root.querySelector('.cnt').textContent = n
      ? `${n} action${n === 1 ? '' : 's'} in ${groups.length} channel${groups.length === 1 ? '' : 's'}`
      : `No actions match “${q.trim()}”.`;
  }
  clearRun() {
    this.root.querySelectorAll('.lit, .skip').forEach((x) => x.classList.remove('lit', 'skip'));
  }
  insert(i) {
    const b = this.target, s = this.fromLib(i, !reducedMotion());
    this.branches[b].push(s);
    this.clearRun();
    this.drawBranch(b);
    this.root.querySelector(`.step[data-id="${s.id}"] .tog`).focus();
    this.say(`Added ${LIB[i].name} in ${CH[LIB[i].ch].name} to the end of If ${b}.`);
  }
  remove(id) {
    const b = this.branches.yes.some((s) => s.id === id) ? 'yes' : 'no';
    const s = this.branches[b].find((x) => x.id === id);
    this.branches[b] = this.branches[b].filter((x) => x.id !== id);
    this.clearRun();
    this.drawBranch(b);
    this.root.querySelector(`.add[data-br="${b}"]`).focus();
    this.say(`Removed ${s.kind} from If ${b}.`);
  }
  say(t) { this.root.querySelector('.status').textContent = t; }
  async run() {
    const r = this.root, btn = r.querySelector('.run');
    const bIn = r.querySelector('.budget'), lIn = r.querySelector('.limit');
    const budget = Number(bIn.value), limit = Number(lIn.value);
    for (const [el, v] of [[bIn, budget], [lIn, limit]]) {
      if (el.value === '' || !Number.isFinite(v)) {
        const tog = el.closest('.step').querySelector('.tog');
        this.setOpen(tog, true); el.focus();
        this.say('Enter a dollar amount, like 72000.'); return;
      }
    }
    btn.disabled = true;
    this.clearRun();
    const yes = budget > limit, b = yes ? 'yes' : 'no';
    const wait = () => new Promise((res) => setTimeout(res, reducedMotion() ? 0 : 380));
    const path = [...MAIN.map((s) => s.id), ...this.branches[b].map((s) => s.id)];
    r.querySelector(`.br[data-br="${yes ? 'no' : 'yes'}"]`).classList.add('skip');
    for (let k = 0; k < path.length; k++) {
      if (k === MAIN.length) r.querySelector(`.br[data-br="${b}"]`).classList.add('lit');
      r.querySelector(`.step[data-id="${path[k]}"]`).classList.add('lit');
      await wait();
    }
    const tail = this.branches[b].map((s) => `${s.kind} in ${CH[s.ch].name}`);
    this.say(`Ran ${path.length} steps. $${fmt(budget)} is ${yes ? 'over' : 'not over'} $${fmt(limit)}, so it took If ${b}` +
      (tail.length ? `: ${tail.join(', then ')}.` : ', which has no steps yet.'));
    btn.disabled = false;
  }
}
customElements.define('qb-pipeline', QbPipeline);
