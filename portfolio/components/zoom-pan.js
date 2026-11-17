// <zoom-pan> A wide image you can zoom into and drag around. Once it has been on screen for a third of a second it
// eases into its leftmost fifth (zoom="5") and shows its controls: zoom out, zoom in, and fit. Drag to pan, or focus it
// and use the arrow keys, + and -, and 0 to fit. A sharper copy (hd="...") is swapped in the first time it zooms.
// The image stays in the page's own markup, so its alt text is read as usual. For people who prefer reduced motion
// it does not zoom on its own; the controls are there from the start.
import { mount, reducedMotion, focusCss } from './shared.js';

const css = `
:host { display: block; position: relative; overflow: hidden; touch-action: pan-y; }
${focusCss}
.view { position: relative; overflow: hidden; outline: none; cursor: default; }
:host([zoomed]) .view { cursor: grab; }
:host([dragging]) .view { cursor: grabbing; }
.view:focus-visible { outline: 2px solid var(--accent, #8ea4ff); outline-offset: -2px; }
::slotted(img) { display: block; width: 100%; height: auto; transform-origin: 0 0; will-change: transform; user-select: none; -webkit-user-drag: none; }
.ctl { position: absolute; right: 10px; bottom: 10px; display: flex; gap: 4px; align-items: center; padding: 4px; border-radius: 6px;
  background: rgba(14, 18, 20, .82); border: 1px solid rgba(255, 255, 255, .18); opacity: 0; transform: translateY(6px);
  transition: opacity .25s, transform .25s; pointer-events: none; }
:host([controls]) .ctl { opacity: 1; transform: none; pointer-events: auto; }
button { font: 600 13px/1 var(--f-body, system-ui, sans-serif); color: #e7ebe9; background: transparent; border: 0; border-radius: 4px;
  min-width: 32px; height: 32px; padding: 0 8px; cursor: pointer; }
button:hover { background: rgba(255, 255, 255, .1); }
button:disabled { opacity: .4; cursor: default; background: none; }
.lvl { font: 500 12px/1 var(--f-mono, ui-monospace, monospace); color: #9aa39f; min-width: 3.5em; text-align: center; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .ctl { transition: none; } }
`;

class ZoomPan extends HTMLElement {
  connectedCallback() {
    const id = 'zp' + Math.random().toString(36).slice(2, 7);
    const root = mount(this, css, `
      <div class="view" tabindex="0" role="group" aria-roledescription="zoomable image" aria-describedby="${id}"><slot></slot></div>
      <p class="sr" id="${id}">Drag or use the arrow keys to move around. Plus and minus zoom, 0 fits the whole image.</p>
      <div class="ctl" role="toolbar" aria-label="Zoom">
        <button type="button" data-z="out" aria-label="Zoom out">−</button>
        <span class="lvl" aria-live="polite">100%</span>
        <button type="button" data-z="in" aria-label="Zoom in">+</button>
        <button type="button" data-z="fit">Fit</button>
      </div>`);
    if (!root) return;
    this.img = this.querySelector('img');
    if (!this.img) return;
    this.view = root.querySelector('.view');
    this.lvl = root.querySelector('.lvl');
    this.btns = Object.fromEntries([...root.querySelectorAll('button')].map((b) => [b.dataset.z, b]));
    this.s = 1; this.x = 0; this.y = 0;
    this.max = Math.max(2, Number(this.getAttribute('max')) || 8);

    root.querySelector('.ctl').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.z === 'fit') this.set(1, 0, 0, true);
      else this.zoomBy(b.dataset.z === 'in' ? 1.5 : 1 / 1.5);
    });
    this.view.addEventListener('keydown', (e) => this.key(e));
    this.drag();
    new ResizeObserver(() => this.set(this.s, this.x, this.y, false)).observe(this);

    if (reducedMotion()) { this.toggleAttribute('controls', true); this.update(); return; }
    this.update();
    // zoom in once it has been on screen for a third of a second
    let timer = 0;
    const io = new IntersectionObserver(([en]) => {
      clearTimeout(timer);
      if (!en.isIntersecting) return;
      timer = setTimeout(() => { io.disconnect(); this.intro(); }, 333);
    }, { threshold: 0.6 });
    io.observe(this);
  }
  intro() {
    const z = Number(this.getAttribute('zoom')) || 5;
    this.sharpen();
    this.set(z, 0, 0, true, 900);
    this.toggleAttribute('controls', true);
  }
  sharpen() {
    const hd = this.getAttribute('hd');
    if (hd && !this._hd) { this._hd = true; const pre = new Image(); pre.onload = () => { this.img.src = hd; }; pre.src = hd; }
  }
  zoomBy(f) {
    // zoom about the middle of what's showing
    const w = this.view.clientWidth, h = this.view.clientHeight;
    const s = Math.min(this.max, Math.max(1, this.s * f));
    const cx = (w / 2 - this.x) / this.s, cy = (h / 2 - this.y) / this.s;
    if (s > 1) this.sharpen();
    this.set(s, w / 2 - cx * s, h / 2 - cy * s, true);
  }
  set(s, x, y, animate, ms = 300) {
    const w = this.view.clientWidth, h = this.view.clientHeight;
    this.s = s;
    this.x = Math.min(0, Math.max(w - w * s, x));
    this.y = Math.min(0, Math.max(h - h * s, y));
    const ease = animate && !reducedMotion() ? `transform ${ms}ms cubic-bezier(.2,.7,.2,1)` : 'none';
    this.img.style.transition = ease;
    this.img.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.s})`;
    this.update();
  }
  update() {
    this.lvl.textContent = Math.round(this.s * 100) + '%';
    this.btns.out.disabled = this.s <= 1.001;
    this.btns.fit.disabled = this.s <= 1.001;
    this.btns.in.disabled = this.s >= this.max - 0.001;
    this.toggleAttribute('zoomed', this.s > 1.001);
  }
  key(e) {
    const step = 60, k = e.key;
    if (k === '+' || k === '=') this.zoomBy(1.5);
    else if (k === '-' || k === '_') this.zoomBy(1 / 1.5);
    else if (k === '0') this.set(1, 0, 0, true);
    else if (this.s > 1 && k === 'ArrowLeft') this.set(this.s, this.x + step, this.y, true, 150);
    else if (this.s > 1 && k === 'ArrowRight') this.set(this.s, this.x - step, this.y, true, 150);
    else if (this.s > 1 && k === 'ArrowUp') this.set(this.s, this.x, this.y + step, true, 150);
    else if (this.s > 1 && k === 'ArrowDown') this.set(this.s, this.x, this.y - step, true, 150);
    else return;
    e.preventDefault();
    this.toggleAttribute('controls', true);
  }
  drag() {
    let p = null;
    this.view.addEventListener('pointerdown', (e) => {
      if (this.s <= 1 || e.button !== 0) return;
      p = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: this.x, y: this.y };
      this.view.setPointerCapture(e.pointerId);
      this.toggleAttribute('dragging', true);
    });
    this.view.addEventListener('pointermove', (e) => {
      if (!p || e.pointerId !== p.id) return;
      this.set(this.s, p.x + e.clientX - p.sx, p.y + e.clientY - p.sy, false);
    });
    const end = (e) => { if (p && e.pointerId === p.id) { p = null; this.toggleAttribute('dragging', false); } };
    this.view.addEventListener('pointerup', end);
    this.view.addEventListener('pointercancel', end);
  }
}
customElements.define('zoom-pan', ZoomPan);
