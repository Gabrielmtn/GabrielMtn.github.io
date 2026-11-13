// <css-sphere> Art@60fps (2015), from its original HAML and SCSS: 60 rings, each a 450px circle cut to a star with
// clip-path, colored along a red-to-yellow ramp and turned through its own 25-second loop of 3D rotations. The SCSS
// @for loop is expanded here into the same CSS it compiled to. Hovering a ring lights it up, as in the pen. It turns on
// its own, so it has a pause button, and it starts paused for people who prefer reduced motion.
import { mount, reducedMotion, focusCss } from './shared.js';

const N = 60, SIZE = 450;

// what the pen's `@for $i from 1 through 61` loop compiled to, ring by ring
function ringCss(i) {
  const tilt = -3 * i * 0.5;
  return `
.o:nth-child(${i}) { animation: ring-${i} 25s ease infinite normal;
  border-color: hsl(${-15 + 1.2 * i}deg ${69 + 0.5 * i}% ${50 + 0.25 * i}%); }
@keyframes ring-${i} {
  3% { transform: rotateZ(0deg) rotateX(${tilt}deg) rotateY(0deg); }
  5% { transform: rotateZ(0deg) rotateX(0deg) rotateY(0deg); }
  7% { transform: rotateZ(0deg) rotateX(${tilt}deg) rotateY(0deg); }
  46% { transform: rotateZ(${90 - 2.5 * i}deg) rotateX(0deg) rotateY(${-22.5 * i}deg); }
  55% { transform: rotateZ(90deg) rotateY(${-22.5 * i}deg); }
  66% { transform: rotateX(90deg) rotateY(${-13.5 * 10 * i}deg); }
  76% { transform: rotateX(${-10 * 0.3 * i}deg) rotateZ(${-3.5 * 10 * i}deg); }
}`;
}

const css = `
:host { display: block; }
${focusCss}
.stage { position: relative; background: #111111; border-radius: 4px; aspect-ratio: 1 / 0.92; max-width: 100%; overflow: hidden; container-type: size; }
.wrapper { position: absolute; left: 50%; top: 50%; width: ${SIZE}px; height: ${SIZE}px; margin: ${-SIZE / 2}px 0 0 ${-SIZE / 2}px;
  transform: scale(var(--k, 0.6)); }
.o { width: ${SIZE}px; height: ${SIZE}px; position: absolute; inset: 0; margin: auto; box-sizing: content-box;
  border: 5px solid rgba(255, 2, 2, 1); border-radius: 50%;
  -webkit-clip-path: polygon(50% -10%, 63% 38%, 110% 38%, 69% 59%, 82% 110%, 50% 75%, 18% 110%, 31% 59%, -10% 40%, 37% 38%);
  clip-path: polygon(50% -10%, 63% 38%, 110% 38%, 69% 59%, 82% 110%, 50% 75%, 18% 110%, 31% 59%, -10% 40%, 37% 38%); }
.o:hover { border: 7px solid rgb(241, 255, 255); transition-duration: .2s; }
:host([paused]) .o { animation-play-state: paused; }
${Array.from({ length: N }, (_, k) => ringCss(k + 1)).join('')}
button { position: absolute; right: 10px; bottom: 10px; z-index: 1; font: 600 12px var(--f-body, system-ui, sans-serif); color: #fff; background: rgba(20,20,20,.7); border: 1px solid rgba(255,255,255,.35); border-radius: 4px; padding: 6px 10px; cursor: pointer; }
`;

class CssSphere extends HTMLElement {
  connectedCallback() {
    const root = mount(this, css, `
      <div class="stage" role="img" aria-label="Sixty star-cut rings in red, orange and yellow, turning through each other in 3D on black.">
        <div class="wrapper">${'<div class="o"></div>'.repeat(N)}</div>
        <button type="button" aria-pressed="false">Pause</button>
      </div>`);
    if (!root) return;
    // the pen fills a full window; here the 450px rings are scaled to fit the frame, with room for them to swing out
    const stage = root.querySelector('.stage'), wrap = root.querySelector('.wrapper');
    const fit = () => wrap.style.setProperty('--k', String(Math.min(stage.clientWidth, stage.clientHeight) / (SIZE * 1.55)));
    new ResizeObserver(fit).observe(stage); fit();
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
