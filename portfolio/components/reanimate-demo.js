// <reanimate-demo> Rebuild of the ReAnimate.css demo page: the "small"
// animation types, with duration, easing and iteration controls.
import { mount, focusCss } from './shared.js';

const ANIMS = {
  bounceInSmall: [
    { transform: 'scale(.85)', opacity: 0 }, { transform: 'scale(1.06)', opacity: 1, offset: .5 },
    { transform: 'scale(.97)', offset: .75 }, { transform: 'scale(1)', opacity: 1 }],
  fadeInUpSmall: [{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
  zoomInSmall: [{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
  shakeSmall: [0, -6, 6, -6, 6, -3, 3, 0].map((x) => ({ transform: `translateX(${x}px)` })),
  pulseSmall: [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
  wobbleSmall: [0, -3, 2, -2, 1, 0].map((d, i) => ({ transform: `translateX(${d * 3}px) rotate(${d}deg)`, offset: i / 5 })),
};
const EASE = { easeOutCubic: 'cubic-bezier(.215,.61,.355,1)', easeInCubic: 'cubic-bezier(.55,.055,.675,.19)', easeOutBack: 'cubic-bezier(.175,.885,.32,1.275)', linear: 'linear' };

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
    const sel = (id, label, opts, val) => `<label for="${id}-${u}">${label}</label><select id="${id}-${u}">${opts.map(([v, t]) => `<option value="${v}"${v === val ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
    const root = mount(this, css, `
      <div class="page">
        <h3 class="logo">ReAnimate.css</h3>
        <p>For your consideration:</p>
        <p>The missing "small" type for Animate.css</p>
        <p class="sm">(as well as iteration and timing concepts)</p>
        <div class="ctl">
          ${sel('a', 'Animation', Object.keys(ANIMS).map((k) => [k, k]), 'bounceInSmall')}
          ${sel('d', 'Duration', [['500', '0.5 Second'], ['1000', '1.0 Second'], ['1500', '1.5 Seconds']], '1000')}
          ${sel('e', 'Easing', Object.keys(EASE).map((k) => [k, k]), 'easeOutCubic')}
          ${sel('i', 'Iterations', [['1', 'Once'], ['2', 'Twice'], ['3', '3 times']], '1')}
          <button type="button">Animate it</button>
        </div>
      </div>`);
    if (!root) return;
    const g = (id) => root.getElementById(`${id}-${u}`).value;
    root.querySelector('button').addEventListener('click', () => {
      root.querySelector('.logo').animate(ANIMS[g('a')], { duration: +g('d'), easing: EASE[g('e')], iterations: +g('i') });
    });
  }
}
customElements.define('reanimate-demo', ReanimateDemo);
