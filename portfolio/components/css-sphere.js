// <css-sphere> Rebuild of Art@60fps: a sphere of dashes built from plain
// elements and CSS 3D transforms. It turns on its own, so it has a pause
// button, and it starts paused for people who prefer reduced motion.
import { mount, reducedMotion, focusCss } from './shared.js';

const LAT = 13, PER = 22, R = 120;
const COLORS = ['#e53935', '#f4511e', '#fb8c00', '#fdd835'];

const css = `
:host { display: block; }
${focusCss}
.stage { position: relative; background: #808080; border-radius: 4px; aspect-ratio: 1 / 0.92; max-width: 100%; display: grid; place-items: center; overflow: hidden; perspective: 900px; }
.tilt { transform: rotateX(-14deg) rotateZ(6deg); transform-style: preserve-3d; }
.ball { position: relative; width: 0; height: 0; transform-style: preserve-3d; animation: spin 14s linear infinite; }
:host([paused]) .ball { animation-play-state: paused; }
.ball i { position: absolute; left: -9px; top: -2px; width: 18px; height: 4px; border-radius: 2px; }
@keyframes spin { to { transform: rotateY(360deg); } }
button { position: absolute; right: 10px; bottom: 10px; font: 600 12px var(--f-body, system-ui, sans-serif); color: #fff; background: rgba(20,20,20,.55); border: 1px solid rgba(255,255,255,.35); border-radius: 4px; padding: 6px 10px; cursor: pointer; }
`;

class CssSphere extends HTMLElement {
  connectedCallback() {
    let dashes = '';
    for (let a = 1; a < LAT; a++) {
      const lat = -90 + (180 / LAT) * a;
      const ring = Math.round(PER * Math.cos((lat * Math.PI) / 180)) + 4;
      for (let b = 0; b < ring; b++) {
        const lon = (360 / ring) * b + a * 7;
        const c = COLORS[(a * 3 + b) % COLORS.length];
        const w = 10 + ((a * 7 + b * 5) % 12);
        dashes += `<i style="background:${c};width:${w}px;transform:rotateY(${lon}deg) rotateX(${lat}deg) translateZ(${R}px)"></i>`;
      }
    }
    const root = mount(this, css, `
      <div class="stage" role="img" aria-label="A slowly turning sphere drawn from red, orange and yellow dashes on grey.">
        <div class="tilt"><div class="ball">${dashes}</div></div>
        <button type="button" aria-pressed="false">Pause</button>
      </div>`);
    if (!root) return;
    const btn = root.querySelector('button');
    const set = (paused) => {
      this.toggleAttribute('paused', paused);
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Play' : 'Pause';
    };
    set(reducedMotion());
    btn.addEventListener('click', () => set(!this.hasAttribute('paused')));
  }
}
customElements.define('css-sphere', CssSphere);
