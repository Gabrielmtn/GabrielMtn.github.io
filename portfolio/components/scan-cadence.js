// <scan-cadence> The scan summary card from the Akamai prototyping rounds, redrawn as it was: a static radial chart,
// one ring per severity. Each ring starts at twelve o'clock and runs clockwise over three quarters of a turn, its
// colored part showing how far that severity is through remediation, with the total in the middle. Drawn as one SVG
// at the card's original size (304 by 315), so it stays sharp and keeps its proportions at any width.
import { mount } from './shared.js';

const CX = 152, CY = 186, SWEEP = 270;
// ring: radius, share of its track filled (as drawn in the original), gradient stops, count and label
const RINGS = [
  { r: 94, fill: 0.84, from: '#2b00ee', to: '#6f52f6', n: 40, label: 'Low' },
  { r: 77, fill: 0.73, from: '#f7821f', to: '#f25a2c', n: 19, label: 'Medium' },
  { r: 60, fill: 0.57, from: '#c9154b', to: '#f0647f', n: 10, label: 'Critical' },
];
const W = 11;

const pt = (r, deg) => {   // deg clockwise from twelve o'clock
  const a = ((deg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const arc = (r, deg) => {
  const [x0, y0] = pt(r, 0), [x1, y1] = pt(r, deg);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

const css = `
:host { display: block; max-width: 340px; margin: 0 auto; }
svg { display: block; width: 100%; height: auto; border-radius: 4px; }
`;

class ScanCadence extends HTMLElement {
  connectedCallback() {
    const label = 'Scan 1 summary: 58% of findings completed. ' + RINGS.map(g => `${g.n} ${g.label.toLowerCase()}`).join(', ') + '.';
    mount(this, css, `
      <svg viewBox="0 0 304 315" role="img" aria-label="${label}" font-family="Inter, 'Instrument Sans', system-ui, sans-serif">
        <defs>${RINGS.map((g, i) => `<linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>`).join('')}</defs>
        <rect x="0.5" y="0.5" width="303" height="314" rx="4" fill="#fff" stroke="#d5dae0"/>
        <path d="M 0.5 4.5 a 4 4 0 0 1 4 -4 h 295 a 4 4 0 0 1 4 4 V 58 H 0.5 Z" fill="#e3e8ef"/>
        <line x1="0.5" y1="58" x2="303.5" y2="58" stroke="#d5dae0"/>
        <text x="12" y="36" font-size="17" fill="#55606b" letter-spacing=".5">SCAN #1</text>
        ${RINGS.map((g, i) => `
          <path d="${arc(g.r, SWEEP)}" fill="none" stroke="#dcdcdc" stroke-width="${W}" stroke-linecap="round"/>
          <path d="${arc(g.r, SWEEP * g.fill)}" fill="none" stroke="url(#g${i})" stroke-width="${W}" stroke-linecap="round"/>
          <text x="95" y="${CY - g.r + 4}" font-size="10" fill="#5a6470" text-anchor="end">${g.n}</text>
          <text x="101" y="${CY - g.r + 4}" font-size="10" fill="#9aa3ab">${g.label}</text>`).join('')}
        <text x="${CX}" y="${CY + 6}" font-size="26" font-weight="300" fill="#5a6470" text-anchor="middle">58%</text>
        <text x="${CX}" y="${CY + 19}" font-size="8.5" fill="#9aa3ab" text-anchor="middle">completed</text>
      </svg>`);
  }
}
customElements.define('scan-cadence', ScanCadence);
