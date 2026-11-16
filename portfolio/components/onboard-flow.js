// <onboard-flow> Innovative Driven's client onboarding, drawn as the org flowchart it was: a top-to-bottom node graph
// from a contract closing in Salesforce to the setup-complete notification. The steps themselves are redacted, as the
// client asked, but the chart still shows which part of the company is involved (by color) and what kind of node each
// is (by shape): departments feeding data in are slanted source shapes, the steps are plain boxes, case setup is the
// cylinder the data lands in, and the start and end are rounded terminals. Connections are bezier curves. On narrow
// screens each source gets its own row above the step it feeds, and each row keeps one step per department.
import { mount } from './shared.js';

const DEPT = {
  client: { name: 'Client Services', c: '#e88f8f' },
  platform: { name: 'Platform Engineering', c: '#6fa8dc' },
  it: { name: 'IT', c: '#b38be0' },
  hr: { name: 'HR', c: '#e3a857' },
  cases: { name: 'Cases', c: '#7cc79a' },
};
// the main column, top to bottom: a named node { label, kicker, shape } or a redacted step (its department)
const ROWS = [
  [{ label: 'Contract closed', kicker: 'Salesforce Sales Cloud', shape: 'terminal' }],
  [{ label: 'Contract details', shape: 'step' }],
  ['platform', 'it', 'hr', 'cases'],
  ['platform', 'platform', 'it', 'hr', 'hr', 'cases'],
  ['platform', 'it', 'hr', 'cases', 'cases'],
  ['platform', 'it', 'it', 'hr', 'cases', 'cases'],
  ['platform', 'hr', 'cases', 'cases'],
  ['platform', 'cases'],
  [{ label: 'Case setup', shape: 'sink', dept: 'cases' }],
  [{ label: 'Setup complete notification', shape: 'terminal' }],
];
// data sources: which department, which row they feed and which side they sit on
const SOURCES = [
  { dept: 'client', row: 1, side: 'left', label: 'Client Services' },
  { dept: 'platform', row: 2, side: 'left', label: 'Platform Engineering' },
  { dept: 'it', row: 3, side: 'left', label: 'IT' },
  { dept: 'hr', row: 3, side: 'right', label: 'HR', sub: ['Contractor IDs,', 'several types'], all: true },
];

const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
const MONO = 'IBM Plex Mono, ui-monospace, monospace', SANS = 'Instrument Sans, system-ui, sans-serif';

const css = `
:host { display: block; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 10px 20px; margin: 0 0 18px; }
.legend { display: grid; gap: 8px; margin: 0; }
.legend ul { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0; padding: 0; list-style: none;
  font: 500 11px/1.4 var(--f-mono, ui-monospace, monospace); letter-spacing: .06em; text-transform: uppercase; color: #9aa39f; }
.legend li { display: flex; align-items: center; gap: 7px; }
.legend i { width: 10px; height: 10px; border-radius: 2px; }
.legend svg { width: 22px; height: 14px; display: inline; }
.tag { order: -1; margin: 0 0 0 auto; font: 600 11px/1.3 var(--f-mono, ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase;
  color: #f0b85c; border: 1px solid rgba(240, 184, 92, .55); background: rgba(240, 184, 92, .08); border-radius: 4px; padding: 6px 10px; }
@media (min-width: 720px) { .tag { order: 0; } }
`;

const shapeIcon = {
  source: '<polygon points="4,1 21,1 18,13 1,13" fill="none" stroke="#c6cdc9" stroke-width="1.2"/>',
  step: '<rect x="1" y="1" width="20" height="12" rx="3" fill="none" stroke="#c6cdc9" stroke-width="1.2"/>',
  sink: '<path d="M2 3.5 A9 2.5 0 0 1 20 3.5 V10.5 A9 2.5 0 0 1 2 10.5 Z M2 3.5 A9 2.5 0 0 0 20 3.5" fill="none" stroke="#c6cdc9" stroke-width="1.2"/>',
  terminal: '<rect x="1" y="1" width="20" height="12" rx="6" fill="none" stroke="#c6cdc9" stroke-width="1.2"/>',
};

class OnboardFlow extends HTMLElement {
  connectedCallback() {
    const root = mount(this, css, `
      <div class="head">
        <div class="legend" aria-hidden="true">
          <ul>${Object.values(DEPT).map((d) => `<li><i style="background:${d.c}"></i>${d.name}</li>`).join('')}</ul>
          <ul>${[['source', 'Data source'], ['step', 'Step'], ['sink', 'Data sink'], ['terminal', 'Start / end']]
            .map(([k, t]) => `<li><svg viewBox="0 0 22 14">${shapeIcon[k]}</svg>${t}</li>`).join('')}</ul>
        </div>
        <p class="tag" aria-hidden="true">Obfuscated as per client request</p>
      </div>
      <div class="art"></div>`);
    if (!root) return;
    this.art = root.querySelector('.art');
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', 'Client onboarding flowchart, top to bottom, obfuscated as per client request. A contract closes in Salesforce Sales Cloud, and Client Services feeds in the contract details. Platform Engineering, IT and HR are data sources for the steps that follow; HR inputs contractor IDs of several types. The steps themselves are redacted. Everything lands in case setup, and the flow ends with a setup complete notification.');
    let last = 0;
    new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w && Math.abs(w - last) > 2) { last = w; this.draw(w); }
    }).observe(this);
  }

  draw(W) {
    const narrow = W < 720;
    // rows of the main column; on narrow screens one step per department, and the sources become their own rows
    const rows = ROWS.map((row, r) => ({ r, items: row.map((it) => (typeof it === 'object' ? { ...it } : { dept: it })) }));
    if (narrow) rows.forEach((row) => { if (!row.items[0].label) { const seen = new Set(); row.items = row.items.filter((n) => !seen.has(n.dept) && seen.add(n.dept)); } });
    const layout = [];
    rows.forEach((row) => {
      const src = SOURCES.filter((s) => s.row === row.r);
      if (narrow && src.length) layout.push({ src: true, r: row.r, items: src.map((s) => ({ ...s })) });
      layout.push({ ...row, srcSide: narrow ? [] : src });
    });

    const side = narrow ? 0 : Math.min(190, W * 0.2);
    const mainW = W - side * 2;
    const most = Math.max(...layout.filter((l) => !l.src).map((l) => l.items.length));
    const gap = narrow ? 8 : 14, rowGap = narrow ? 32 : 58;
    const stepW = Math.min(140, (mainW - gap * (most - 1)) / most);
    const bigW = Math.min(mainW, 270);

    const nodes = []; let y = 0;
    layout.forEach((row, li) => {
      const named = !!row.items[0].label && !row.src;
      const h = row.src ? (row.items.some((s) => s.sub) ? 60 : 40) : named ? (row.items[0].kicker ? 54 : 44) : 38;
      const w = row.src ? Math.min(200, (W - gap * (row.items.length - 1)) / row.items.length) : named ? bigW : stepW;
      const span = row.items.length * w + (row.items.length - 1) * gap;
      row.items.forEach((it, i) => {
        // narrow source rows sit to the sides, so the main line can run down the middle past them
        const sw = Math.min(200, W * 0.44);
        const x = row.src ? (i === 0 ? 0 : W - sw) : side + (mainW - span) / 2 + i * (w + gap);
        if (row.src) { nodes.push({ ...it, li, r: row.r, i, x, y, w: sw, h, src: true, shape: 'source' }); return; }
        nodes.push({ ...it, li, r: row.r, i, x, y, w, h, named, src: !!row.src, shape: row.src ? 'source' : it.shape || 'step' });
      });
      // sources beside their row on wide screens
      // sources beside the main column on wide screens: level with a single named step, otherwise in the gap above
      // the row they feed, so their curves come down into the steps from above instead of cutting across the row
      (row.srcSide || []).forEach((s) => {
        const sw = side - 26, sh = s.sub ? 60 : 40;
        const sy = row.items.length === 1 ? y + (h - sh) / 2 : y - rowGap / 2 - sh / 2;
        nodes.push({ ...s, li, r: row.r, x: s.side === 'left' ? 0 : W - sw, y: sy, w: sw, h: sh, src: true, beside: s.side, shape: 'source' });
      });
      y += h + rowGap;
    });
    const H = y - rowGap;
    const cx = (n) => n.x + n.w / 2;

    // flow edges between rows of the main column: nearest parent in the same department first; every third step
    // also takes a parent from another department, the way handoffs cross the org; no parent is left without a child
    const edges = [];
    const mainRows = [...new Set(nodes.filter((n) => !n.src).map((n) => n.li))];
    const main = (li) => nodes.filter((n) => n.li === li && !n.src);
    for (let k = 1; k < mainRows.length; k++) {
      const up = main(mainRows[k - 1]), here = main(mainRows[k]);
      const used = new Set();
      here.forEach((n, j) => {
        const near = [...up].sort((a, b) => Math.abs(cx(a) - cx(n)) - Math.abs(cx(b) - cx(n)));
        const same = near.find((p) => p.dept && p.dept === n.dept) || near[0];
        edges.push({ a: same, b: n }); used.add(same);
        const other = near.find((p) => p !== same && p.dept !== n.dept);
        if (other && (j + k) % 3 === 0) { edges.push({ a: other, b: n }); used.add(other); }
      });
      up.forEach((p) => {
        if (used.has(p)) return;
        edges.push({ a: p, b: [...here].sort((a, b) => Math.abs(cx(a) - cx(p)) - Math.abs(cx(b) - cx(p)))[0] });
      });
    }
    // source edges: into the row they feed, to the step(s) of their own department (Client Services: contract details)
    nodes.filter((n) => n.src).forEach((s) => {
      const target = nodes.filter((n) => !n.src && n.r === s.row);
      const mine = target.filter((n) => n.dept === s.dept);
      const into = mine.length ? (s.all ? mine : [mine[0]]) : target.slice(0, 1);
      into.forEach((t) => edges.push({ a: s, b: t, source: true }));
    });

    const path = ({ a, b }) => {
      if (a.beside) {   // from the side of a source, across and down into the top of its step
        const x1 = a.beside === 'left' ? a.x + a.w : a.x, y1 = a.y + a.h / 2, x2 = cx(b), y2 = b.y;
        if (y1 > y2) {   // level with its step: straight into the side
          const xe = a.beside === 'left' ? b.x : b.x + b.w, ye = b.y + b.h / 2, dx = (xe - x1) * 0.5;
          return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(xe - dx).toFixed(1)} ${ye.toFixed(1)} ${xe.toFixed(1)} ${ye.toFixed(1)}`;
        }
        return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + (x2 - x1) * 0.75).toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${(y1 + (y2 - y1) * 0.2).toFixed(1)} ${x2.toFixed(1)} ${y2}`;
      }
      const x1 = cx(a), y1 = a.y + a.h, x2 = cx(b), y2 = b.y, d = (y2 - y1) * 0.55;
      return `M${x1.toFixed(1)} ${y1} C${x1.toFixed(1)} ${y1 + d} ${x2.toFixed(1)} ${y2 - d} ${x2.toFixed(1)} ${y2}`;
    };
    const colorOf = (n) => (n.dept ? DEPT[n.dept].c : '#7d878b');

    const shape = (n, fill, stroke, sw = 1.2) => {
      const { x, y, w, h } = n;
      if (n.shape === 'terminal') return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
      if (n.shape === 'source') { const k = 10; return `<polygon points="${x + k},${y} ${x + w},${y} ${x + w - k},${y + h} ${x},${y + h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`; }
      if (n.shape === 'sink') { const ry = 6; return `<path d="M${x} ${y + ry} A${w / 2} ${ry} 0 0 1 ${x + w} ${y + ry} V${y + h - ry} A${w / 2} ${ry} 0 0 1 ${x} ${y + h - ry} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><path d="M${x} ${y + ry} A${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`; }
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    };
    const text = (x, y, s, size, weight, fill, family = SANS, extra = '') =>
      `<text x="${x}" y="${y}" text-anchor="middle" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}"${extra}>${s}</text>`;

    const node = (n) => {
      if (n.src) {
        const c = DEPT[n.dept].c, mid = cx(n);
        return `<g>${shape(n, '#1c2226', c, 1.4)}
          ${text(mid, n.y + (n.sub ? 22 : 25), n.label, 13.5, 600, '#e7ebe9')}
          ${n.sub ? n.sub.map((t, k) => text(mid, n.y + 38 + k * 13, t, 10.5, 500, c, MONO)).join('') : ''}</g>`;
      }
      if (n.named) {
        const stroke = n.dept ? DEPT[n.dept].c : n.shape === 'terminal' ? '#8ea4ff' : '#59646a';
        const mid = cx(n), top = n.shape === 'sink' ? 4 : 0;
        return `<g>${shape(n, '#1c2226', stroke)}
          ${n.kicker ? text(mid, n.y + 21, n.kicker.toUpperCase(), 10.5, 500, '#9aa39f', MONO, ' letter-spacing=".8"') : ''}
          ${text(mid, n.y + (n.kicker ? 40 : 28) + top, n.label, 15, 600, '#e7ebe9')}</g>`;
      }
      const c = DEPT[n.dept].c, pad = 12, inner = n.w - pad * 2 - 4;
      const b1 = inner * (0.45 + rnd(n.li, n.i) * 0.5), b2 = inner * (0.25 + rnd(n.i + 7, n.li) * 0.4);
      return `<g>${shape(n, '#1a1f22', '#353e42', 1)}
        <rect x="${n.x}" y="${n.y + 6}" width="3" height="${n.h - 12}" rx="1.5" fill="${c}"/>
        <rect x="${n.x + pad + 4}" y="${n.y + 11}" width="${b1.toFixed(1)}" height="6" rx="3" fill="#465156"/>
        <rect x="${n.x + pad + 4}" y="${n.y + 22}" width="${b2.toFixed(1)}" height="5" rx="2.5" fill="#363f43"/></g>`;
    };

    const edgeSvg = (e) => {
      const c = e.source ? DEPT[e.a.dept].c : colorOf(e.b);
      return `<path d="${path(e)}" stroke="${c}" stroke-opacity="${e.source ? 0.9 : 0.55}"${e.source ? ' stroke-dasharray="5 4"' : ''}/>`;
    };
    this.art.innerHTML = `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}" aria-hidden="true" focusable="false">
      <g fill="none" stroke-width="1.6" stroke-linecap="round">${edges.map(edgeSvg).join('')}</g>
      ${nodes.map(node).join('')}
    </svg>`;
  }
}
customElements.define('onboard-flow', OnboardFlow);
