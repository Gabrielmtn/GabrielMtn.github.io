// <reanimate-demo> Rebuild of the ReAnimate.css demo page: the "small"
// animation types, with duration, easing and iteration controls.
import { mount, focusCss } from './shared.js';

// ReAnimate.css itself, not a copy: the demo loads the real stylesheet the site hosts (../reanimate/reanimate.css from
// the portfolio page; set the css attribute to point elsewhere) and plays its classes, the way the original page does.
const GROUPS = [
  ['Bouncing entrances', ['bounceInSmall', 'bounceInDownSmall', 'bounceInLeftSmall', 'bounceInRightSmall', 'bounceInUpSmall']],
  ['Bouncing exits', ['bounceOutSmall', 'bounceOutDownSmall', 'bounceOutLeftSmall', 'bounceOutRightSmall', 'bounceOutUpSmall']],
  ['Fading entrances', ['fadeInDownSmall', 'fadeInLeftSmall', 'fadeInRightSmall', 'fadeInUpSmall']],
  ['Fading exits', ['fadeOutDownSmall', 'fadeOutLeftSmall', 'fadeOutRightSmall', 'fadeOutUpSmall']],
  ['New ideas', ['flash2x', 'flash3x', 'pulse2x', 'pulse3x', 'pulseBig', 'pulseSmall', 'tiltBack', 'tiltBackBig', 'tiltForward', 'tiltForwardBig', 'nodYes', 'nodNo']],
  ['Rotates', ['rotate', 'rotateSmall', 'rotateReverse', 'rotateReverseSmall']],
];
const TIMES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000];
const EASES = ['Cubic', 'Circ', 'Expo', 'Quad', 'Quart', 'Quint', 'Sine', 'Back'].flatMap(k => [`easeIn${k}`, `easeOut${k}`, `easeInOut${k}`]);

const css = `
:host { display: block; }
${focusCss}
.page { background: #fff; color: #555; border-radius: 4px; padding: 22px 18px 18px; text-align: center; font-family: var(--f-body, system-ui, sans-serif); }
h3 { margin: 0 0 8px; font-weight: 400; font-size: clamp(30px, 6vw, 44px); line-height: 1.05; display: inline-block;
  background: linear-gradient(90deg, #a35cf0, #f0478c 60%, #a35cf0); -webkit-background-clip: text; background-clip: text; color: transparent; }
p { margin: 0 0 4px; font-size: 13px; }
.sm { font-size: 11.5px; color: #777; margin-bottom: 14px; }
.ctl { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
select { font: inherit; font-size: 12.5px; color: #333; padding: 6px 8px; border: 1px solid #c9c9c9; border-radius: 3px; background: #fff; }
button { font: inherit; font-size: 12.5px; font-weight: 600; color: #e0367a; background: #fff; border: 1px solid #e0367a; border-radius: 3px; padding: 6px 14px; cursor: pointer; }
button:hover { background: #fdf0f5; }
`;

class ReanimateDemo extends HTMLElement {
  connectedCallback() {
    const u = Math.random().toString(36).slice(2, 7);
    const href = new URL(this.getAttribute('css') || '../reanimate/reanimate.css', document.baseURI).href;
    const opt = (v, t, sel) => `<option value="${v}"${v === sel ? ' selected' : ''}>${t}</option>`;
    const root = mount(this, css, `
      <link rel="stylesheet" href="${href}">
      <div class="page">
        <h3 class="logo" id="logo-${u}">ReAnimate.css</h3>
        <p>For your consideration:</p>
        <p>The missing "small" type for Animate.css</p>
        <p class="sm">(as well as iteration and timing concepts)</p>
        <div class="ctl">
          <label for="a-${u}">Animation</label><select id="a-${u}">${GROUPS.map(([g, list]) => `<optgroup label="${g}">${list.map(v => opt(v, v, 'bounceInSmall')).join('')}</optgroup>`).join('')}</select>
          <label for="d-${u}">Duration</label><select id="d-${u}">${TIMES.map(t => opt(String(t), `${(t / 1000).toFixed(1)} second${t === 1000 ? '' : 's'}`, '1000')).join('')}</select>
          <label for="e-${u}">Easing</label><select id="e-${u}">${EASES.map(v => opt(v, v, 'easeInCubic')).join('')}</select>
          <button type="button">Animate it</button>
        </div>
      </div>`);
    if (!root) return;
    const g = id => root.getElementById(`${id}-${u}`).value;
    const logo = root.getElementById(`logo-${u}`);
    // the original page's trick: put the classes on, then take them off when the animation is done
    let timer = 0;
    const play = () => {
      clearTimeout(timer); logo.className = 'logo'; void logo.offsetWidth;
      logo.className = `logo ${g('a')} animated-${g('d')} ${g('e')}`;
      timer = setTimeout(() => { logo.className = 'logo'; }, +g('d') * 3 + 50);   // the 2x and 3x ones run longer
    };
    root.querySelector('button').addEventListener('click', play);
    root.querySelectorAll('select').forEach(s => s.addEventListener('change', play));
  }
}
customElements.define('reanimate-demo', ReanimateDemo);
