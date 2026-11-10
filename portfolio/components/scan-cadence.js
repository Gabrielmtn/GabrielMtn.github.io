// <scan-cadence> Rebuild of the scan summary card: one ring per severity,
// showing findings remediated out of findings found. "Remediate next" works
// the queue in priority order, critical first.
import { mount, focusCss } from './shared.js';

const SEV = [
  { key: 'low', label: 'Low', found: 40, fixed: 26, color: '#4b3fe0', r: 82 },
  { key: 'medium', label: 'Medium', found: 19, fixed: 11, color: '#f26b21', r: 66 },
  { key: 'critical', label: 'Critical', found: 10, fixed: 3, color: '#d42e5b', r: 50 },
];
const SWEEP = 270; // degrees, gauge opens at the bottom left
const arcLen = (r) => (2 * Math.PI * r * SWEEP) / 360;

const css = `
:host { display: block; }
${focusCss}
.card { background: #fff; color: #39424a; border-radius: 4px; overflow: hidden; font-family: var(--f-body, system-ui, sans-serif); height: 100%; display: flex; flex-direction: column; }
h3 { margin: 0; padding: 12px 14px; background: #e3e8ef; font-weight: 400; font-size: 18px; letter-spacing: .04em; color: #4b5560; }
.body { padding: 10px 14px 14px; display: grid; gap: 10px; flex: 1; }
.gauge { position: relative; width: 100%; max-width: 230px; margin: 0 auto; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.track { fill: none; stroke: #e2e4e7; stroke-width: 9; stroke-linecap: round; }
.val { fill: none; stroke-width: 9; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.2,.7,.2,1), opacity .2s; }
.center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; }
.pct { font-size: 30px; font-weight: 300; color: #3e4852; line-height: 1; font-variant-numeric: tabular-nums; }
.sub { font-size: 10px; color: #8a939b; letter-spacing: .06em; }
.legend { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.legend button { width: 100%; display: grid; grid-template-columns: 10px 1fr auto; gap: 8px; align-items: center; border: 0; background: transparent; padding: 5px 6px; border-radius: 3px;
  font: inherit; font-size: 12.5px; color: #4b5560; cursor: pointer; text-align: left; font-variant-numeric: tabular-nums; }
.legend button:hover, .legend button[aria-pressed="true"] { background: #eef1f5; }
.sw { width: 10px; height: 10px; border-radius: 2px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.act { font: inherit; font-size: 12.5px; font-weight: 600; border-radius: 4px; padding: 7px 11px; cursor: pointer; border: 1px solid #c8ced6; background: #fff; color: #39424a; }
.act.primary { background: #3b2fc4; border-color: #3b2fc4; color: #fff; }
.act:disabled { opacity: .5; cursor: default; }
.status { font-size: 12px; color: #5f6870; min-height: 1.5em; margin: 0; }
@media (prefers-reduced-motion: reduce) { .val { transition: none; } }
`;

class ScanCadence extends HTMLElement {
  connectedCallback() {
    // Arcs start at 135° (bottom left) and sweep clockwise.
    const arc = (r) => {
      const a0 = (135 * Math.PI) / 180, a1 = ((135 + SWEEP) * Math.PI) / 180;
      const p = (a) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
      return `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
    };
    const root = mount(this, css, `
      <div class="card">
        <h3>SCAN #1</h3>
        <div class="body">
          <div class="gauge">
            <svg viewBox="0 0 200 200" role="img" aria-label="Remediation progress by severity">
              ${SEV.map((s) => `<path class="track" d="${arc(s.r)}"/><path class="val" data-k="${s.key}" d="${arc(s.r)}" stroke="${s.color}" stroke-dasharray="${arcLen(s.r)}"/>`).join('')}
            </svg>
            <div class="center"><span class="pct" aria-hidden="true"></span><span class="sub" aria-hidden="true">COMPLETED</span></div>
          </div>
          <ul class="legend">
            ${SEV.map((s) => `<li><button type="button" aria-pressed="false" data-k="${s.key}"><span class="sw" style="background:${s.color}"></span><span>${s.label}</span><span class="n"></span></button></li>`).join('')}
          </ul>
          <div class="actions">
            <button type="button" class="act primary" data-act="fix">Remediate next</button>
            <button type="button" class="act" data-act="reset">Reset</button>
          </div>
          <p class="status" role="status" aria-live="polite"></p>
        </div>
      </div>`);
    if (!root) return;
    this.state = SEV.map((s) => ({ ...s }));
    this.root = root;
    root.querySelector('[data-act="fix"]').addEventListener('click', () => this.fix());
    root.querySelector('[data-act="reset"]').addEventListener('click', () => {
      this.state = SEV.map((s) => ({ ...s }));
      this.render('Reset to the scan as reported.');
    });
    root.querySelectorAll('.legend button').forEach((b) => b.addEventListener('click', () => {
      const on = b.getAttribute('aria-pressed') !== 'true';
      root.querySelectorAll('.legend button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(on));
      root.querySelectorAll('.val').forEach((p) => { p.style.opacity = !on || p.dataset.k === b.dataset.k ? '1' : '.18'; });
    }));
    this.render('');
  }
  fix() {
    const next = [...this.state].reverse().find((s) => s.fixed < s.found);
    if (!next) return;
    next.fixed += 1;
    this.render(`Patched one ${next.label.toLowerCase()} finding. ${next.found - next.fixed} ${next.label.toLowerCase()} left.`);
  }
  render(msg) {
    const r = this.root;
    let found = 0, fixed = 0;
    for (const s of this.state) {
      found += s.found; fixed += s.fixed;
      const len = arcLen(s.r);
      r.querySelector(`.val[data-k="${s.key}"]`).style.strokeDashoffset = String(len * (1 - s.fixed / s.found));
      r.querySelector(`.legend [data-k="${s.key}"] .n`).textContent = `${s.fixed} / ${s.found} fixed`;
    }
    const pct = Math.round((fixed / found) * 100);
    r.querySelector('.pct').textContent = `${pct}%`;
    r.querySelector('svg').setAttribute('aria-label', `Scan 1 is ${pct}% remediated: ` + this.state.map((s) => `${s.label} ${s.fixed} of ${s.found}`).join(', '));
    r.querySelector('[data-act="fix"]').disabled = fixed === found;
    r.querySelector('.status').textContent = fixed === found ? 'Every finding is remediated.' : msg;
  }
}
customElements.define('scan-cadence', ScanCadence);
