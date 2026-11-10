// <akamai-traffic> Rebuild of the 2019 Akamai traffic statistics board.
// Figures count up once when the board scrolls into view.
import { mount, onFirstView, reducedMotion, fmt, focusCss } from './shared.js';

const totals = [
  ['Total Networks', '1,538'], ['Total Locations', '3,974'], ['Total Countries', '137'],
  ['Total Servers', '252,881'], ['Total Domains Active', '130,287'], ['Global NOCCs', '3'],
];
const peak = [
  ['Bit Rate', '03/12/19', '82.4 Tbps'],
  ['Request Rate', '07/24/18', '101,597,981 hits/sec'],
  ['Bytes Delivered', '09/13/18', '10,762,499 TB'],
  ['Requests Delivered', '10/04/18', '10,275 billion'],
  ['Unique Client IPv4', '04/14/18', '683 million'],
  ['Unique Client IPv6', '12/23/18', '3.12 billion'],
  ['Largest Attack', '2/28/18', '1.3 Tbps'],
];
const lifetime = [
  ['Bits Delivered', '911,902,103 Tb'],
  ['Hits Delivered', '2,831,017 billion'],
  ['Live Events Delivered', '52,023,159'],
  ['Live Streams Delivered', '3.325 trillion'],
  ['On Demand Streams Delivered', '22.3 trillion'],
];

const css = `
:host { display: block; --o: #f7942a; --k: #0d0d0d; --k2: #1b1b1b; --hd: #4a4a4a; --t: #f2f2f2; --m: #b9b9b9; container-type: inline-size; }
${focusCss}
.board { background: var(--k); color: var(--t); border-radius: 4px; overflow: hidden; font-family: var(--f-body, system-ui, sans-serif); }
.top { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; background: linear-gradient(100deg, #262626 0 62%, #141414 62%); }
h3 { margin: 0; font-weight: 400; font-size: 17px; letter-spacing: .01em; }
.mark { font-family: var(--f-mono, monospace); font-size: 11px; color: var(--o); letter-spacing: .08em; text-transform: uppercase; }
.totals { display: flex; flex-wrap: wrap; gap: 12px 26px; padding: 18px 18px 14px; margin: 0; align-items: flex-end; }
.totals div { min-width: 0; }
dt { color: var(--o); font-size: 11px; margin-bottom: 4px; }
.totals dd { margin: 0; font-size: clamp(18px, 3cqi, 25px); font-weight: 300; font-variant-numeric: tabular-nums; }
.saved { text-align: right; margin-left: auto; }
.saved dd { white-space: nowrap; }
.saved dd { font-size: clamp(18px, 3.4cqi, 27px); }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 18px 10px; }
section { min-width: 0; }
h4 { margin: 0; background: var(--hd); font-weight: 400; font-size: 12.5px; padding: 12px 12px; }
ul { list-style: none; margin: 0; padding: 0; }
li { display: flex; justify-content: space-between; gap: 12px; padding: 12px 10px; border-bottom: 1px solid #2c2c2c; font-size: 13px; transition: background .15s; }
li:hover { background: var(--k2); }
li span:first-child { color: var(--o); }
li span:last-child { font-variant-numeric: tabular-nums; text-align: right; }
.foot { text-align: right; font-size: 10px; color: var(--m); padding: 6px 18px 12px; }
@container (max-width: 640px) {
  .totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .saved { grid-column: 1 / -1; text-align: left; margin-left: 0; }
  .cols { grid-template-columns: 1fr; }
}
`;

class AkamaiTraffic extends HTMLElement {
  connectedCallback() {
    const root = mount(this, css, `
      <div class="board">
        <div class="top"><h3>Akamai Traffic Statistics</h3><span class="mark">Rebuild</span></div>
        <dl class="totals">
          ${totals.map(([k, v]) => `<div><dt>${k}</dt><dd data-n="${v}">${v}</dd></div>`).join('')}
          <div class="saved"><dt>Time Saved vs. Public Internet</dt><dd><span data-n="101.917">101.917</span> billion hours</dd></div>
        </dl>
        <div class="cols">
          <section aria-label="Peak daily usage"><h4>Peak Daily Usage</h4><ul>
            ${peak.map(([k, d, v]) => `<li><span>${k} (${d})</span><span>${v}</span></li>`).join('')}
          </ul></section>
          <section aria-label="Lifetime statistics"><h4>Lifetime Statistics</h4><ul>
            ${lifetime.map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`).join('')}
          </ul></section>
        </div>
        <p class="foot">Last updated on Aug 14th, 2019</p>
      </div>`);
    if (!root || reducedMotion()) return;
    const nums = [...root.querySelectorAll('[data-n]')];
    onFirstView(this, () => {
      const t0 = performance.now(), dur = 1400;
      const targets = nums.map((el) => {
        const raw = el.dataset.n;
        return { el, raw, v: parseFloat(raw.replace(/,/g, '')), d: (raw.split('.')[1] || '').length };
      });
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        for (const n of targets) n.el.textContent = p === 1 ? n.raw : fmt(n.v * e, n.d);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
}
customElements.define('akamai-traffic', AkamaiTraffic);
