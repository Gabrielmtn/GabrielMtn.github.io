// <onboard-flow> Innovative Driven's client onboarding, drawn as the org flowchart it was: a top-to-bottom node graph
// from a contract closing in Salesforce to the setup-complete notification. Only the major events are named; every
// step in between is redacted to grey bars, colored by the part of the org it belongs to (infrastructure, people,
// cases). Connections are bezier curves. On narrow screens each row keeps one step per lane, so it stays readable.
import { mount } from './shared.js';

const LANES = {
  infra: { name: 'Infrastructure', c: '#6fa8dc' },
  people: { name: 'People and HR', c: '#e3a857' },
  cases: { name: 'Cases', c: '#7cc79a' },
};
// rows from top to bottom: a named event { label, kicker } or a redacted step (its lane)
const ROWS = [
  [{ label: 'Contract closed', kicker: 'Salesforce Sales Cloud', start: true }],
  [{ label: 'Contract details' }],
  ['infra', 'infra', 'people', 'cases'],
  ['infra', 'infra', 'infra', 'people', 'people', 'cases'],
  ['infra', 'infra', 'people', 'cases', 'cases'],
  ['infra', 'infra', 'people', 'people', 'cases', 'cases'],
  ['infra', 'people', 'cases', 'cases'],
  ['infra', 'cases'],
  [{ label: 'Case setup', lane: 'cases' }],
  [{ label: 'Setup complete notification', end: true }],
];

// small deterministic hash so the redaction bars keep their lengths from load to load
const rnd = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

const css = `
:host { display: block; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 14px; padding: 0; list-style: none;
  font: 500 11px/1.4 var(--f-mono, ui-monospace, monospace); letter-spacing: .06em; text-transform: uppercase; color: #9aa39f; }
.legend li { display: flex; align-items: center; gap: 7px; }
.legend i { width: 10px; height: 10px; border-radius: 2px; }
`;

class OnboardFlow extends HTMLElement {
  connectedCallback() {
    const root = mount(this, css, `
      <ul class="legend" aria-hidden="true">${Object.values(LANES).map((l) => `<li><i style="background:${l.c}"></i>${l.name}</li>`).join('')}</ul>
      <div class="art"></div>`);
    if (!root) return;
    this.art = root.querySelector('.art');
    let last = 0;
    new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      if (w && Math.abs(w - last) > 2) { last = w; this.draw(w); }
    }).observe(this);
  }

  rows(narrow) {
    return ROWS.map((row) => {
      if (!narrow || typeof row[0] === 'object') return row;
      const seen = new Set();
      return row.filter((lane) => (seen.has(lane) ? false : seen.add(lane)));
    });
  }

  draw(W) {
    const narrow = W < 560;
    const rows = this.rows(narrow);
    const most = Math.max(...rows.map((r) => r.length));
    const gap = narrow ? 10 : 14, rowGap = narrow ? 34 : 44;
    const nodeW = Math.min(150, (W - gap * (most - 1)) / most);
    const bigW = Math.min(W, 270);
    const nodes = []; let y = 0;
    rows.forEach((row, r) => {
      const named = typeof row[0] === 'object';
      const h = named ? (row[0].kicker ? 54 : 44) : 38;
      const w = named ? bigW : nodeW;
      const span = row.length * w + (row.length - 1) * gap;
      row.forEach((item, i) => {
        const x = (W - span) / 2 + i * (w + gap);
        nodes.push({ r, i, x, y, w, h, named, item, lane: named ? item.lane : item });
      });
      y += h + rowGap;
    });
    const H = y - rowGap;
    const byRow = rows.map((_, r) => nodes.filter((n) => n.r === r));

    // edges: each step takes its nearest parent, preferring its own lane; every third step also takes a second parent
    // from another lane, the way handoffs cross the org; any parent left without a child links to its nearest step
    const edges = [];
    const cx = (n) => n.x + n.w / 2;
    for (let r = 1; r < byRow.length; r++) {
      const up = byRow[r - 1], here = byRow[r];
      const used = new Set();
      here.forEach((n, k) => {
        const near = [...up].sort((a, b) => Math.abs(cx(a) - cx(n)) - Math.abs(cx(b) - cx(n)));
        const same = near.find((p) => p.lane && p.lane === n.lane) || near[0];
        edges.push([same, n]); used.add(same);
        const other = near.find((p) => p !== same && p.lane !== n.lane);
        if (other && (k + r) % 3 === 0) { edges.push([other, n]); used.add(other); }
      });
      up.forEach((p) => {
        if (used.has(p)) return;
        const near = [...here].sort((a, b) => Math.abs(cx(a) - cx(p)) - Math.abs(cx(b) - cx(p)))[0];
        edges.push([p, near]);
      });
    }

    const path = ([a, b]) => {
      const x1 = cx(a), y1 = a.y + a.h, x2 = cx(b), y2 = b.y, d = (y2 - y1) * 0.55;
      return `M${x1.toFixed(1)} ${y1} C${x1.toFixed(1)} ${y1 + d} ${x2.toFixed(1)} ${y2 - d} ${x2.toFixed(1)} ${y2}`;
    };
    const edgeColor = ([, b]) => (b.lane ? LANES[b.lane].c : '#7d878b');

    const node = (n) => {
      if (n.named) {
        const { label, kicker, start, end } = n.item;
        const stroke = start || end ? '#8ea4ff' : n.lane ? LANES[n.lane].c : '#4a5458';
        return `<g>
          <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="7" fill="#1c2226" stroke="${stroke}" stroke-width="1.2"/>
          ${kicker ? `<text x="${cx(n)}" y="${n.y + 21}" text-anchor="middle" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10.5" letter-spacing=".8" fill="#9aa39f">${kicker.toUpperCase()}</text>` : ''}
          <text x="${cx(n)}" y="${n.y + (kicker ? 40 : 28)}" text-anchor="middle" font-family="Instrument Sans, system-ui, sans-serif" font-size="15" font-weight="600" fill="#e7ebe9">${label}</text>
        </g>`;
      }
      const c = LANES[n.lane].c, pad = 12, inner = n.w - pad * 2 - 4;
      const b1 = inner * (0.45 + rnd(n.r, n.i) * 0.5), b2 = inner * (0.25 + rnd(n.i + 7, n.r) * 0.4);
      return `<g>
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="#1a1f22" stroke="#353e42"/>
        <rect x="${n.x}" y="${n.y + 6}" width="3" height="${n.h - 12}" rx="1.5" fill="${c}"/>
        <rect x="${n.x + pad + 4}" y="${n.y + 11}" width="${b1.toFixed(1)}" height="6" rx="3" fill="#465156"/>
        <rect x="${n.x + pad + 4}" y="${n.y + 22}" width="${b2.toFixed(1)}" height="5" rx="2.5" fill="#363f43"/>
      </g>`;
    };

    this.art.innerHTML = `<svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W + 4}" height="${H + 4}" aria-hidden="true" focusable="false">
      <g fill="none" stroke-width="1.6" stroke-linecap="round">${edges.map((e) => `<path d="${path(e)}" stroke="${edgeColor(e)}" stroke-opacity=".55"/>`).join('')}</g>
      ${nodes.map(node).join('')}
    </svg>`;
    // a plain-language version for screen readers; the same whatever the width
    this.setAttribute('role', 'img');
    this.setAttribute('aria-label', 'Client onboarding flowchart, top to bottom. A contract closes in Salesforce Sales Cloud and its details are recorded. Most of the steps in between are redacted; they cover infrastructure, people and HR, and cases, and hand off to one another. It ends with case setup and a setup complete notification.');
  }
}
customElements.define('onboard-flow', OnboardFlow);
