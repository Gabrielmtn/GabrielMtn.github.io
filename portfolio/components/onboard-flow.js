// <onboard-flow> eDiscovery client onboarding, from a Closed Won deal in
// Salesforce to a working review workspace. Toggle between the manual
// process and the automated flow, then play or step through it. The panel
// below fills in the workspace setup (in Relativity's terms) as steps finish.
import { mount, reducedMotion, focusCss } from './shared.js';

const LANES = {
  sales: 'Sales · Salesforce',
  cs: 'Client Services',
  it: 'IT / Ops',
  lit: 'Litigation Support',
  auto: 'Onboarding automation',
  client: 'Law firm',
};

const SPEC = [
  { k: 'matter', label: 'Client and Matter', value: 'Example Law Group · Smith v. Example Corp.' },
  { k: 'team', label: 'Case team', value: 'Client Manager and project team assigned' },
  { k: 'workspace', label: 'Workspace', value: 'Created from the review template, with resource pool and file repository' },
  { k: 'groups', label: 'Groups and permissions', value: 'Case Admins · Review Team · Client Viewers' },
  { k: 'processing', label: 'Processing profile', value: 'deNIST on · global deduplication · time zone set' },
  { k: 'custodians', label: 'Custodians and data sources', value: 'Entered once, on the onboarding form' },
  { k: 'upload', label: 'Secure upload', value: 'Upload link issued to the firm' },
  { k: 'welcome', label: 'Users and logins', value: 'Firm users invited by email' },
];

const FLOWS = {
  before: {
    name: 'Before', lanes: ['sales', 'cs', 'it', 'lit', 'client'], time: 'Weeks', timeNote: 'Typical, depending on queues and calendars',
    steps: [
      { lane: 'sales', t: 'Opportunity marked Closed Won', n: 'Contract signed in Salesforce' },
      { lane: 'sales', t: 'Email Client Services about the new client', wait: 'Sits in an inbox' },
      { lane: 'cs', t: 'Schedule a kickoff call with the firm', wait: 'Waits on calendars' },
      { lane: 'client', t: 'Kickoff call: matter, custodians, users' },
      { lane: 'cs', t: 'Fill out intake form, open an IT ticket', wait: 'Waits in the ticket queue', fills: ['team'] },
      { lane: 'it', t: 'Create Client, Matter, and workspace', fills: ['matter', 'workspace'] },
      { lane: 'it', t: 'Create groups, users, and permissions', fills: ['groups'] },
      { lane: 'lit', t: 'Build processing profile, add custodians', wait: 'Waits on a second review', fills: ['processing', 'custodians'] },
      { lane: 'it', t: 'Set up a secure upload site', fills: ['upload'] },
      { lane: 'cs', t: 'Email welcome letter and logins', fills: ['welcome'] },
      { lane: 'client', t: 'Firm logs in and starts uploading data' },
    ],
  },
  after: {
    name: 'After', lanes: ['sales', 'auto', 'cs', 'client'], time: 'Under 15 min', timeNote: 'With everyone online and standing by',
    steps: [
      { lane: 'sales', t: 'Opportunity marked Closed Won', n: 'Starts onboarding' },
      { lane: 'auto', t: 'Notify the Client Manager', n: 'Onboarding form and team assignment' },
      { lane: 'cs', t: 'Complete the onboarding form, assign the team', check: true, fills: ['team', 'custodians'] },
      { lane: 'auto', t: 'Create Client and Matter', fills: ['matter'] },
      { lane: 'auto', t: 'Create workspace from template', fills: ['workspace'] },
      { lane: 'auto', t: 'Create groups, users, and permissions', fills: ['groups'] },
      { lane: 'auto', t: 'Apply the processing profile', fills: ['processing'] },
      { lane: 'auto', t: 'Issue upload link, invite users', fills: ['upload', 'welcome'] },
      { lane: 'client', t: 'Firm logs in and starts uploading data' },
    ],
  },
};

// Handoffs: a step passes from one group of people to a different one.
const handoffs = (f) => f.steps.reduce((n, s, i) => {
  const p = f.steps[i - 1];
  return n + (p && p.lane !== s.lane && p.lane !== 'auto' && s.lane !== 'auto' ? 1 : 0);
}, 0);
const byPeople = (f) => f.steps.filter((s) => s.lane !== 'auto').length;

const css = `
:host { display: block; --bg: #12161a; --card: #1a1f22; --line: #3a4246; --ink: #e7ebe9; --mut: #a3aca8; --acc: #8ea4ff; --amber: #f2b45a; --ok: #5fd38d; }
${focusCss}
.wrap { background: var(--bg); color: var(--ink); border: 1px solid #2d3437; border-radius: 4px; font-family: var(--f-body, system-ui, sans-serif); font-size: 13px; }
.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; padding: 12px 14px; border-bottom: 1px solid #2d3437; }
.seg { display: inline-flex; border: 1px solid var(--line); border-radius: 5px; overflow: hidden; }
.seg button { font: inherit; font-weight: 600; border: 0; background: transparent; color: var(--mut); padding: 7px 14px; cursor: pointer; }
.seg button + button { border-left: 1px solid var(--line); }
.seg button[aria-pressed="true"] { background: var(--acc); color: #0b1020; }
.ctl { display: flex; gap: 8px; }
.ctl button { font: inherit; font-weight: 600; border-radius: 4px; padding: 7px 12px; cursor: pointer; border: 1px solid var(--line); background: transparent; color: var(--ink); }
.ctl .play { background: var(--ink); color: #12161a; border-color: var(--ink); min-width: 70px; }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-bottom: 1px solid #2d3437; }
.stat { padding: 10px 14px; min-width: 0; }
.stat + .stat { border-left: 1px solid #2d3437; }
.stat b { display: block; font-size: 22px; font-weight: 600; line-height: 1.15; font-variant-numeric: tabular-nums; }
.stat span { color: var(--mut); font-size: 11.5px; }
.body { position: relative; display: grid; grid-template-columns: 150px minmax(0, 1fr); }
.lanes, .grid { display: grid; grid-auto-rows: 100px; row-gap: 10px; padding-block: 14px 16px; }
.lanes { border-right: 1px solid #2d3437; }
.lane { display: flex; align-items: center; padding: 0 12px 0 14px; font: 600 10.5px var(--f-mono, ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; color: var(--mut); }
.scroll { overflow-x: auto; position: relative; min-width: 0; }
.grid { position: relative; column-gap: 26px; padding-inline: 22px 14px; align-items: center; }
.band { grid-column: 1 / -1; align-self: stretch; border-top: 1px dashed #262c30; pointer-events: none; }
.fade { position: absolute; right: 0; top: 0; bottom: 0; width: 56px; pointer-events: none; background: linear-gradient(to right, transparent, var(--bg)); opacity: 0; transition: opacity .2s; }
.body.more .fade { opacity: 1; }
.card { position: relative; z-index: 1; background: var(--card); border: 1px solid var(--line); border-radius: 5px; padding: 8px 10px; min-height: 64px; transition: opacity .25s, border-color .25s, background .25s; }
.card.auto { border-color: #4a5a9a; }
.card p { margin: 0; line-height: 1.35; }
.card .n { color: var(--mut); font-size: 11.5px; margin-top: 4px; }
.chip { display: inline-block; margin-top: 6px; font: 600 10px var(--f-mono, monospace); letter-spacing: .04em; padding: 2px 6px; border-radius: 3px; }
.chip.wait { color: #1b1305; background: var(--amber); }
.chip.check { color: #0b1020; background: var(--acc); }
.no { position: absolute; top: -8px; left: -8px; width: 18px; height: 18px; border-radius: 50%; background: #2d3437; color: var(--mut); font: 600 10px var(--f-mono, monospace); display: grid; place-items: center; }
.playing .card { opacity: .35; }
.playing .card.done { opacity: 1; }
.playing .card.now { opacity: 1; border-color: var(--ok); background: #1b2a22; box-shadow: 0 0 0 3px rgba(95,211,141,.15); }
.card.done .no, .card.now .no { background: var(--ok); color: #0b1a10; }
svg.wires { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 0; overflow: visible; }
.w { fill: none; stroke: #4a5458; stroke-width: 1.6; }
.w.hand { stroke: var(--amber); stroke-dasharray: 5 4; }
.w.lit { stroke: var(--ok); stroke-dasharray: none; }
.spec { border-top: 1px solid #2d3437; padding: 12px 14px 14px; }
.spec h4 { margin: 0 0 8px; font: 600 10.5px var(--f-mono, monospace); letter-spacing: .08em; text-transform: uppercase; color: var(--mut); }
.spec ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; }
.spec li { display: grid; grid-template-columns: 16px minmax(0, 1fr); gap: 8px; align-items: start; padding: 5px 0; border-bottom: 1px solid #22282b; }
.tick { width: 14px; height: 14px; margin-top: 2px; border-radius: 3px; border: 1px solid var(--line); display: grid; place-items: center; font-size: 10px; color: transparent; }
li.on .tick { background: var(--ok); border-color: var(--ok); color: #0b1a10; }
.spec b { font-weight: 600; }
.spec .v { display: block; color: var(--mut); font-size: 12px; }
li:not(.on) .v { opacity: .55; }
.by { font: 10px var(--f-mono, monospace); color: var(--mut); margin-left: 6px; letter-spacing: .04em; }
.status { margin: 0; padding: 0 14px 12px; color: #c9d0cc; min-height: 1.4em; font-size: 12.5px; }
.foot { margin: 0; padding: 0 14px 12px; color: var(--mut); font-size: 11.5px; }
@media (max-width: 560px) {
  .stats { grid-template-columns: 1fr 1fr 1fr; }
  .stat b { font-size: 17px; }
  .body { grid-template-columns: 92px minmax(0, 1fr); }
  .lane { font-size: 9.5px; padding: 0 8px 0 10px; letter-spacing: .05em; }
  .spec ul { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .card { transition: none; } }
`;

class OnboardFlow extends HTMLElement {
  connectedCallback() {
    const root = mount(this, css, `
      <div class="wrap">
        <div class="top">
          <div class="seg" role="group" aria-label="Process">
            <button type="button" data-m="before" aria-pressed="true">Before: manual</button>
            <button type="button" data-m="after" aria-pressed="false">After: automated</button>
          </div>
          <div class="ctl">
            <button type="button" class="play">Play</button>
            <button type="button" class="step">Step</button>
            <button type="button" class="reset">Reset</button>
          </div>
        </div>
        <div class="stats" aria-live="polite"></div>
        <div class="body">
          <div class="lanes" aria-hidden="true"></div>
          <div class="scroll" tabindex="0" role="group" aria-label="Swimlane diagram, scrolls sideways">
            <div class="grid"></div>
          </div>
          <span class="fade" aria-hidden="true"></span>
        </div>
        <section class="spec" aria-label="Workspace setup">
          <h4>Workspace setup</h4>
          <ul></ul>
        </section>
        <p class="status" role="status" aria-live="polite"></p>
        <p class="foot">Generalized from my process map, with no client data. Setup items use Relativity's terms.</p>
      </div>`);
    if (!root) return;
    this.root = root;
    this.mode = 'before';
    this.i = -1;
    this.timer = null;
    root.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => this.setMode(b.dataset.m)));
    root.querySelector('.play').addEventListener('click', () => (this.timer ? this.pause() : this.play()));
    root.querySelector('.step').addEventListener('click', () => { this.pause(); this.advance(); });
    root.querySelector('.reset').addEventListener('click', () => { this.pause(); this.i = -1; this.update(); this.say('Reset.'); });
    this.render();
    root.querySelector('.scroll').addEventListener('scroll', () => this.edge(), { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(() => { this.wires(); this.edge(); }).observe(root.querySelector('.scroll'));
  }
  get flow() { return FLOWS[this.mode]; }
  say(t) { this.root.querySelector('.status').textContent = t; }
  setMode(m) {
    if (m === this.mode) return;
    this.pause();
    this.mode = m; this.i = -1;
    this.root.querySelectorAll('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    this.render();
    this.say(m === 'after' ? 'Showing the automated flow.' : 'Showing the manual process.');
  }
  render() {
    const f = this.flow, r = this.root;
    r.querySelector('.stats').innerHTML = `
      <div class="stat"><b>${handoffs(f)}</b><span>Handoffs between teams</span></div>
      <div class="stat"><b>${byPeople(f)} of ${f.steps.length}</b><span>Steps done by people</span></div>
      <div class="stat"><b>${f.time}</b><span>${f.timeNote}</span></div>`;
    const grid = r.querySelector('.grid');
    grid.style.gridTemplateColumns = `repeat(${f.steps.length}, 158px)`;
    r.querySelector('.lanes').innerHTML = f.lanes.map((l) => `<div class="lane">${LANES[l]}</div>`).join('');
    grid.innerHTML = f.lanes.map((l, li) => `<div class="band" style="grid-row:${li + 1}"></div>`).join('')
      + f.steps.map((s, i) => `<div class="card${s.lane === 'auto' ? ' auto' : ''}" data-i="${i}" style="grid-row:${f.lanes.indexOf(s.lane) + 1};grid-column:${i + 1}">
          <span class="no" aria-hidden="true">${i + 1}</span>
          <p>${s.t}</p>${s.n ? `<p class="n">${s.n}</p>` : ''}
          ${s.wait ? `<span class="chip wait">⧗ ${s.wait}</span>` : ''}${s.check ? '<span class="chip check">Human check</span>' : ''}
        </div>`).join('')
      + '<svg class="wires" aria-hidden="true"></svg>';
    this.update();
    r.querySelector('.scroll').scrollLeft = 0;
    requestAnimationFrame(() => { this.wires(); this.edge(); });
  }
  edge() {
    const sc = this.root.querySelector('.scroll');
    this.root.querySelector('.body').classList.toggle('more', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4);
  }
  wires() {
    const grid = this.root.querySelector('.grid'), svg = grid.querySelector('svg.wires');
    if (!svg) return;
    svg.setAttribute('width', grid.scrollWidth); svg.setAttribute('height', grid.scrollHeight);
    const cards = [...grid.querySelectorAll('.card')], f = this.flow;
    let d = '';
    for (let i = 1; i < cards.length; i++) {
      const a = cards[i - 1], b = cards[i];
      const x1 = a.offsetLeft + a.offsetWidth, y1 = a.offsetTop + a.offsetHeight / 2;
      const x2 = b.offsetLeft, y2 = b.offsetTop + b.offsetHeight / 2, mx = (x1 + x2) / 2;
      const p = f.steps[i - 1], s = f.steps[i];
      const hand = p.lane !== s.lane && p.lane !== 'auto' && s.lane !== 'auto';
      d += `<path class="w${hand ? ' hand' : ''}${this.i >= i ? ' lit' : ''}" d="M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}"/>`;
    }
    svg.innerHTML = d;
  }
  update() {
    const r = this.root, f = this.flow;
    r.querySelector('.grid').classList.toggle('playing', this.i >= 0);
    r.querySelectorAll('.card').forEach((c) => {
      const n = +c.dataset.i;
      c.classList.toggle('done', n < this.i);
      c.classList.toggle('now', n === this.i);
    });
    const filled = {};
    f.steps.slice(0, this.i + 1).forEach((s) => (s.fills || []).forEach((k) => { filled[k] = s.lane; }));
    r.querySelector('.spec ul').innerHTML = SPEC.map((x) => `<li class="${filled[x.k] ? 'on' : ''}"><span class="tick" aria-hidden="true">✓</span><span><b>${x.label}</b>${filled[x.k] ? `<span class="by">${filled[x.k] === 'auto' ? 'automated' : LANES[filled[x.k]]}</span>` : ''}<span class="v">${x.value}</span></span></li>`).join('');
    r.querySelector('.play').textContent = this.timer ? 'Pause' : (this.i >= f.steps.length - 1 ? 'Replay' : 'Play');
    this.wires();
  }
  advance() {
    const f = this.flow;
    if (this.i >= f.steps.length - 1) this.i = -1;
    this.i += 1;
    const s = f.steps[this.i];
    this.update();
    const card = this.root.querySelector(`.card[data-i="${this.i}"]`), sc = this.root.querySelector('.scroll');
    const target = card.offsetLeft - 24;
    if (card.offsetLeft + card.offsetWidth > sc.scrollLeft + sc.clientWidth - 20 || target < sc.scrollLeft) sc.scrollTo({ left: Math.max(0, target), behavior: reducedMotion() ? 'auto' : 'smooth' });
    const who = s.lane === 'auto' ? 'Automated' : LANES[s.lane];
    let msg = `Step ${this.i + 1} of ${f.steps.length}. ${who}: ${s.t}.`;
    if (s.wait) msg += ` Then it ${s.wait.charAt(0).toLowerCase() + s.wait.slice(1)}.`;
    if (this.i === f.steps.length - 1) msg += this.mode === 'before' ? ` Done after ${handoffs(f)} handoffs.` : ' Done. The workspace is ready for data.';
    this.say(msg);
    if (this.i === f.steps.length - 1) this.pause();
  }
  play() {
    if (this.i >= this.flow.steps.length - 1) this.i = -1;
    const ms = this.mode === 'before' ? 1100 : 650;
    this.advance();
    this.timer = setInterval(() => this.advance(), ms);
    this.update();
  }
  pause() { clearInterval(this.timer); this.timer = null; if (this.root) this.update(); }
  disconnectedCallback() { clearInterval(this.timer); }
}
customElements.define('onboard-flow', OnboardFlow);
