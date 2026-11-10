// <qb-pipeline> A small node editor in the spirit of the LiteGraph prototype.
// Drag nodes with a pointer, or focus one and move it with the arrow keys.
// "Run" sends a pulse down the wires and the condition picks a branch.
import { mount, reducedMotion, fmt, focusCss } from './shared.js';

const W = 760, H = 360;
const NODES = [
  { id: 'trigger', x: 20, y: 40, w: 168, kind: 'Trigger · Quickbase', lines: ['When a record is', 'added to Projects'], head: 'accent' },
  { id: 'search', x: 240, y: 40, w: 178, kind: 'Step · Quickbase', lines: ['Search records in', 'Budgets by project'] },
  { id: 'cond', x: 470, y: 128, w: 186, kind: 'Condition', lines: ['If budget is over', '$50,000'] },
  { id: 'slack', x: 300, y: 280, w: 200, kind: 'Step · Slack', lines: ['Message #finance'] },
  { id: 'cal', x: 545, y: 280, w: 195, kind: 'Step · Calendar', lines: ['Schedule a kickoff'] },
];
const EDGES = [
  { from: 'trigger', fp: 'r', to: 'search', tp: 'l' },
  { from: 'search', fp: 'r', to: 'cond', tp: 'l' },
  { from: 'cond', fp: 'by', to: 'slack', tp: 't', label: 'yes' },
  { from: 'cond', fp: 'bn', to: 'cal', tp: 't', label: 'no', alt: true },
];
const nodeH = (n) => 30 + n.lines.length * 17 + 8;

const css = `
:host { display: block; }
${focusCss}
.wrap { background: #12161a; border: 1px solid #2d3437; border-radius: 4px; font-family: var(--f-body, system-ui, sans-serif); color: #e7ebe9; }
.scroll { overflow-x: auto; }
svg { display: block; width: 100%; min-width: 640px; height: auto; user-select: none; -webkit-user-select: none; }
.node { cursor: grab; touch-action: none; }
.node.drag { cursor: grabbing; }
.node rect.box { fill: #1a1f22; stroke: #3a4246; transition: stroke .2s; }
.node:focus { outline: none; }
.node:focus-visible rect.box, .node.drag rect.box { stroke: #8ea4ff; stroke-width: 2; }
.node.lit rect.box { stroke: #5fd38d; stroke-width: 2; }
.node.skip { opacity: .4; }
.hd { fill: #2d3437; }
.hd.accent { fill: #8ea4ff; }
.kind { font: 600 10.5px var(--f-body, system-ui); letter-spacing: .06em; text-transform: uppercase; fill: #a3aca8; }
.hd.accent + .hd2 + .kind, .kind.on-accent { fill: #0b1020; }
.ln { font: 13px var(--f-body, system-ui); fill: #e7ebe9; }
.port { fill: #8ea4ff; }
.port.alt { fill: #a3aca8; }
.wire { fill: none; stroke: #8ea4ff; stroke-width: 2; }
.wire.alt { stroke: #a3aca8; stroke-dasharray: 4 4; }
.wire.lit { stroke: #5fd38d; stroke-width: 3; stroke-dasharray: none; }
.wl { font: 11px var(--f-mono, monospace); fill: #a3aca8; }
.pulse { fill: #5fd38d; }
.bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 12px 14px; border-top: 1px solid #2d3437; font-size: 13px; }
label { display: inline-flex; align-items: center; gap: 8px; color: #a3aca8; }
input { width: 110px; font: inherit; color: #e7ebe9; background: #1a1f22; border: 1px solid #3a4246; border-radius: 4px; padding: 6px 8px; font-variant-numeric: tabular-nums; }
button { font: inherit; font-weight: 600; border-radius: 4px; padding: 7px 12px; cursor: pointer; border: 1px solid #3a4246; background: transparent; color: #e7ebe9; }
button.run { background: #8ea4ff; border-color: #8ea4ff; color: #0b1020; }
button:disabled { opacity: .5; cursor: default; }
.status { flex-basis: 100%; margin: 0; color: #c9d0cc; min-height: 1.4em; font-size: 12.5px; }
.help { margin: 0; padding: 0 14px 12px; color: #a3aca8; font-size: 12px; }
`;

class QbPipeline extends HTMLElement {
  connectedCallback() {
    const uid = Math.random().toString(36).slice(2, 7);
    const root = mount(this, css, `
      <div class="wrap">
        <div class="scroll">
          <svg viewBox="0 0 ${W} ${H}" aria-labelledby="t-${uid}">
            <title id="t-${uid}">Pipeline canvas with five steps</title>
            <defs><pattern id="g-${uid}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#2d3437"/></pattern></defs>
            <rect width="${W}" height="${H}" fill="url(#g-${uid})"/>
            <g class="wires"></g><g class="labels"></g><g class="nodes"></g><circle class="pulse" r="6" opacity="0"/>
          </svg>
        </div>
        <div class="bar">
          <label for="b-${uid}">Project budget $</label><input id="b-${uid}" type="number" inputmode="numeric" min="0" step="1000" value="72000">
          <button type="button" class="run">Run pipeline</button>
          <button type="button" class="reset">Reset layout</button>
          <p class="status" role="status" aria-live="polite"></p>
        </div>
        <p class="help">Drag a step to rearrange the canvas, or focus it and use the arrow keys. Hold Shift to move faster.</p>
      </div>`);
    if (!root) return;
    this.root = root;
    this.nodes = NODES.map((n) => ({ ...n }));
    this.uid = uid;
    this.buildNodes();
    this.drawWires();
    root.querySelector('.run').addEventListener('click', () => this.run());
    root.querySelector('.reset').addEventListener('click', () => {
      this.nodes.forEach((n, i) => { n.x = NODES[i].x; n.y = NODES[i].y; this.place(n); });
      this.drawWires();
      this.say('Layout reset.');
    });
  }
  say(t) { this.root.querySelector('.status').textContent = t; }
  port(n, p) {
    const h = nodeH(n);
    if (p === 'r') return [n.x + n.w, n.y + h / 2];
    if (p === 'l') return [n.x, n.y + h / 2];
    if (p === 't') return [n.x + n.w / 2, n.y];
    if (p === 'by') return [n.x + n.w * 0.32, n.y + h];
    if (p === 'bn') return [n.x + n.w * 0.72, n.y + h];
  }
  pathFor(e) {
    const a = this.nodes.find((n) => n.id === e.from), b = this.nodes.find((n) => n.id === e.to);
    const [x1, y1] = this.port(a, e.fp), [x2, y2] = this.port(b, e.tp);
    const d = Math.max(30, Math.abs(e.fp === 'r' ? x2 - x1 : y2 - y1) * 0.5);
    const c1 = e.fp === 'r' ? [x1 + d, y1] : [x1, y1 + d];
    const c2 = e.tp === 'l' ? [x2 - d, y2] : [x2, y2 - d];
    return { d: `M${x1} ${y1} C${c1} ${c2} ${x2} ${y2}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2] };
  }
  drawWires() {
    const ns = 'http://www.w3.org/2000/svg';
    const g = this.root.querySelector('.wires'), lg = this.root.querySelector('.labels');
    g.textContent = ''; lg.textContent = '';
    EDGES.forEach((e, i) => {
      const { d, mid } = this.pathFor(e);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d); p.setAttribute('class', 'wire' + (e.alt ? ' alt' : '')); p.dataset.i = i;
      g.append(p);
      if (e.label) {
        const t = document.createElementNS(ns, 'text');
        t.setAttribute('x', mid[0] + 6); t.setAttribute('y', mid[1]); t.setAttribute('class', 'wl'); t.textContent = e.label;
        lg.append(t);
      }
    });
  }
  buildNodes() {
    const g = this.root.querySelector('.nodes');
    g.innerHTML = this.nodes.map((n) => {
      const h = nodeH(n), accent = n.head === 'accent';
      const ins = EDGES.filter((e) => e.to === n.id).map((e) => this.localPort(n, e.tp, e.alt)).join('');
      const outs = EDGES.filter((e) => e.from === n.id).map((e) => this.localPort(n, e.fp, e.alt)).join('');
      return `<g class="node" data-id="${n.id}" tabindex="0" role="button" aria-roledescription="draggable step" aria-label="${n.kind}: ${n.lines.join(' ')}">
        <rect class="box" width="${n.w}" height="${h}" rx="5"/>
        <path class="hd${accent ? ' accent' : ''}" d="M0 5a5 5 0 0 1 5-5h${n.w - 10}a5 5 0 0 1 5 5v17h-${n.w}z"/>
        <text class="kind${accent ? ' on-accent' : ''}" x="10" y="15">${n.kind}</text>
        ${n.lines.map((l, i) => `<text class="ln" x="10" y="${42 + i * 17}">${l}</text>`).join('')}
        ${ins}${outs}
      </g>`;
    }).join('');
    this.nodes.forEach((n) => this.place(n));
    g.querySelectorAll('.node').forEach((el) => this.makeDraggable(el));
  }
  localPort(n, p, alt) {
    const h = nodeH(n);
    const pos = { r: [n.w, h / 2], l: [0, h / 2], t: [n.w / 2, 0], by: [n.w * 0.32, h], bn: [n.w * 0.72, h] }[p];
    return `<circle class="port${alt ? ' alt' : ''}" cx="${pos[0]}" cy="${pos[1]}" r="5"/>`;
  }
  place(n) {
    const el = this.root.querySelector(`.node[data-id="${n.id}"]`);
    el.setAttribute('transform', `translate(${n.x} ${n.y})`);
  }
  clamp(n) {
    n.x = Math.max(0, Math.min(W - n.w, n.x));
    n.y = Math.max(0, Math.min(H - nodeH(n), n.y));
  }
  makeDraggable(el) {
    const n = this.nodes.find((x) => x.id === el.dataset.id);
    const svg = this.root.querySelector('svg');
    let start = null;
    const toSvg = (ev) => { const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [pt.x, pt.y]; };
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      el.setPointerCapture(ev.pointerId);
      const [x, y] = toSvg(ev);
      start = { dx: x - n.x, dy: y - n.y };
      el.classList.add('drag');
      el.parentNode.append(el); // bring to front
    });
    el.addEventListener('pointermove', (ev) => {
      if (!start) return;
      const [x, y] = toSvg(ev);
      n.x = x - start.dx; n.y = y - start.dy; this.clamp(n);
      this.place(n); this.drawWires();
    });
    const end = () => { if (!start) return; start = null; el.classList.remove('drag'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', (ev) => {
      const step = ev.shiftKey ? 40 : 10;
      const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[ev.key];
      if (!mv) return;
      ev.preventDefault();
      n.x += mv[0]; n.y += mv[1]; this.clamp(n);
      this.place(n); this.drawWires();
    });
  }
  async run() {
    const r = this.root, btn = r.querySelector('.run');
    const input = r.querySelector('input');
    const budget = Number(input.value);
    if (!Number.isFinite(budget) || input.value === '') { this.say('Enter a budget in dollars, like 72000.'); input.focus(); return; }
    btn.disabled = true;
    r.querySelectorAll('.node').forEach((x) => x.classList.remove('lit', 'skip'));
    r.querySelectorAll('.wire').forEach((x) => x.classList.remove('lit'));
    const yes = budget > 50000;
    const route = [0, 1, yes ? 2 : 3];
    const lit = (id) => r.querySelector(`.node[data-id="${id}"]`).classList.add('lit');
    const pulse = r.querySelector('.pulse');
    lit('trigger');
    for (const i of route) {
      const wire = r.querySelector(`.wire[data-i="${i}"]`);
      if (!reducedMotion()) {
        const len = wire.getTotalLength(), t0 = performance.now(), dur = 520;
        pulse.setAttribute('opacity', '1');
        await new Promise((res) => {
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / dur), pt = wire.getPointAtLength(len * p);
            pulse.setAttribute('cx', pt.x); pulse.setAttribute('cy', pt.y);
            p < 1 ? requestAnimationFrame(tick) : res();
          };
          requestAnimationFrame(tick);
        });
      }
      wire.classList.add('lit');
      lit(EDGES[i].to);
    }
    pulse.setAttribute('opacity', '0');
    r.querySelector(`.node[data-id="${yes ? 'cal' : 'slack'}"]`).classList.add('skip');
    this.say(yes
      ? `Ran 4 steps. $${fmt(budget)} is over $50,000, so the pipeline messaged #finance.`
      : `Ran 4 steps. $${fmt(budget)} is under $50,000, so the pipeline scheduled a kickoff.`);
    btn.disabled = false;
  }
}
customElements.define('qb-pipeline', QbPipeline);
