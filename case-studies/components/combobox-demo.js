// <combobox-demo> A working select-only combobox, built to the ARIA Authoring Practices Guide pattern the Putnam
// components followed. Beside it, the same attributes a screen reader reads (aria-expanded, aria-activedescendant,
// aria-selected) update live as you use it, along with what the last key did. Everything lives in one shadow root,
// so aria-activedescendant and aria-controls resolve normally.
const OPTIONS = ['Individual', 'Joint', 'Retirement', 'Trust', 'Education', 'Custodial'];
const KEYS = [
  ['↓ / ↑', 'open, then move through options'],
  ['Home / End', 'first or last option'],
  ['Enter / Space', 'select and close'],
  ['Esc', 'close without changing'],
  ['A–Z', 'jump to an option by its first letters'],
];

const css = `
:host { display: block; color: var(--ink, #e7ebe9); font-family: var(--f-body, system-ui, sans-serif); }
* { box-sizing: border-box; }
.wrap { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px 36px; align-items: start; }
@media (max-width: 720px) { .wrap { grid-template-columns: minmax(0, 1fr); } }
.lbl { display: block; font-size: 15px; font-weight: 600; margin: 0 0 8px; }
.field { position: relative; max-width: 340px; }
.cb { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 46px; padding: 10px 14px;
  font: 500 16px/1.3 inherit; color: var(--ink, #e7ebe9); background: #10151a; border: 1.5px solid #5b6a74; border-radius: 6px; cursor: pointer; user-select: none; }
.cb:hover { border-color: #8fc7ef; }
.cb:focus-visible, .cb.open { outline: 2px solid var(--accent, #8ea4ff); outline-offset: 2px; border-color: #8fc7ef; }
.cb svg { width: 16px; height: 16px; flex: none; overflow: visible; transition: transform .15s; }
.cb.open svg { transform: rotate(180deg); }
[role=listbox] { list-style: none; margin: 6px 0 0; padding: 4px; background: #10151a; border: 1.5px solid #5b6a74; border-radius: 6px;
  position: absolute; left: 0; right: 0; top: 100%; z-index: 2; box-shadow: 0 12px 28px rgba(0,0,0,.45); }
[role=listbox][hidden] { display: none; }
[role=option] { padding: 9px 12px; border-radius: 4px; font-size: 15px; cursor: pointer; display: flex; justify-content: space-between; gap: 8px; }
[role=option]:hover { background: rgba(255,255,255,.06); }
[role=option].active { background: #23527a; color: #fff; }
[role=option][aria-selected=true]::after { content: "✓"; color: #8fc7ef; }
[role=option].active[aria-selected=true]::after { color: #fff; }
.hint { font-size: 13px; color: var(--muted, #9aa39f); margin: 12px 0 0; max-width: 340px; }
.state { font: 500 13px/1.6 var(--f-mono, ui-monospace, monospace); background: #10151a; border: 1px solid var(--line, #2d3437); border-radius: 6px; padding: 14px 16px; }
.state h3, .keys h3 { font: 500 12px/1.4 var(--f-mono, ui-monospace, monospace); letter-spacing: .1em; text-transform: uppercase; color: var(--muted, #9aa39f); margin: 0 0 8px; }
.state dl { margin: 0; display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 2px 12px; }
.state dt { color: #8fc7ef; } .state dd { margin: 0; color: var(--ink, #e7ebe9); overflow-wrap: anywhere; }
.state dd.flash { animation: flash .6s ease-out; }
@keyframes flash { from { background: rgba(142,164,255,.28); } to { background: transparent; } }
.last { margin: 10px 0 0; padding-top: 10px; border-top: 1px solid var(--line, #2d3437); color: var(--ink, #e7ebe9); min-height: 1.6em; }
.last b { color: #f0b85c; font-weight: 500; }
.keys { margin-top: 18px; }
.keys ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 13.5px; color: var(--body, #c6cdc9); }
.keys kbd { display: inline-block; min-width: 120px; font: 500 12px/1.5 var(--f-mono, ui-monospace, monospace); color: var(--ink, #e7ebe9); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .cb svg { transition: none; } .state dd.flash { animation: none; } }
`;

class ComboboxDemo extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${css}</style>
      <div class="wrap">
        <div>
          <span class="lbl" id="lbl">Account type</span>
          <div class="field">
            <div class="cb" id="cb" role="combobox" tabindex="0" aria-labelledby="lbl" aria-haspopup="listbox" aria-controls="lb" aria-expanded="false">
              <span id="val">${OPTIONS[0]}</span>
              <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 6 5 5 5-5"/></svg>
            </div>
            <ul role="listbox" id="lb" aria-labelledby="lbl" tabindex="-1" hidden>
              ${OPTIONS.map((o, i) => `<li role="option" id="opt-${i}" aria-selected="${i === 0}">${o}</li>`).join('')}
            </ul>
          </div>
          <p class="hint">Tab to it and use the keyboard, the way a screen reader user would. The panel shows what assistive technology hears.</p>
        </div>
        <div>
          <div class="state" aria-hidden="true">
            <h3>Live state</h3>
            <dl>
              <dt>aria-expanded</dt><dd data-k="exp">false</dd>
              <dt>aria-activedescendant</dt><dd data-k="ad">(none)</dd>
              <dt>aria-selected</dt><dd data-k="sel">${OPTIONS[0]}</dd>
            </dl>
            <p class="last" data-k="last">Waiting for a key.</p>
          </div>
          <div class="keys" aria-hidden="true"><h3>Keyboard</h3><ul>${KEYS.map(([k, t]) => `<li><kbd>${k}</kbd>${t}</li>`).join('')}</ul></div>
        </div>
      </div>`;
    this.$ = (s) => root.querySelector(s);
    this.cb = this.$('#cb'); this.lb = this.$('#lb'); this.opts = [...root.querySelectorAll('[role=option]')];
    this.sel = 0; this.act = -1; this.typed = ''; this.typeT = 0;
    this.cb.addEventListener('keydown', (e) => this.key(e));
    this.cb.addEventListener('click', () => (this.isOpen() ? this.close() : this.open(this.sel)));
    this.cb.addEventListener('blur', () => { if (this.isOpen()) this.close(); });
    this.lb.addEventListener('mousedown', (e) => e.preventDefault());   // keep focus on the combobox
    this.opts.forEach((o, i) => o.addEventListener('click', () => { this.choose(i); this.close(); this.say('click', 'selected ' + OPTIONS[i]); }));
  }
  isOpen() { return this.cb.getAttribute('aria-expanded') === 'true'; }
  set(k, v) { const d = this.$(`[data-k="${k}"]`); if (d.textContent === v) return; d.textContent = v; d.classList.remove('flash'); void d.offsetWidth; d.classList.add('flash'); }
  say(key, what) { this.$('[data-k="last"]').innerHTML = `<b>${key}</b> → ${what}`; }
  open(i) {
    this.lb.hidden = false; this.cb.classList.add('open'); this.cb.setAttribute('aria-expanded', 'true'); this.set('exp', 'true'); this.move(i);
  }
  close() {
    this.lb.hidden = true; this.cb.classList.remove('open'); this.cb.setAttribute('aria-expanded', 'false'); this.set('exp', 'false');
    this.cb.removeAttribute('aria-activedescendant'); this.act = -1; this.opts.forEach((o) => o.classList.remove('active')); this.set('ad', '(none)');
  }
  move(i) {
    this.act = Math.max(0, Math.min(OPTIONS.length - 1, i));
    this.opts.forEach((o, k) => o.classList.toggle('active', k === this.act));
    this.cb.setAttribute('aria-activedescendant', 'opt-' + this.act); this.set('ad', `opt-${this.act} (${OPTIONS[this.act]})`);
    this.opts[this.act].scrollIntoView({ block: 'nearest' });
  }
  choose(i) {
    this.sel = i; this.opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === i)));
    this.$('#val').textContent = OPTIONS[i]; this.set('sel', OPTIONS[i]);
  }
  type(ch) {
    clearTimeout(this.typeT); this.typed += ch.toLowerCase(); this.typeT = setTimeout(() => { this.typed = ''; }, 600);
    const from = this.isOpen() ? this.act : this.sel;
    const order = [...OPTIONS.keys()].map((k) => (from + 1 + k) % OPTIONS.length);
    const hit = order.find((k) => OPTIONS[k].toLowerCase().startsWith(this.typed)) ?? order.find((k) => OPTIONS[k].toLowerCase().startsWith(ch.toLowerCase()));
    return hit;
  }
  key(e) {
    const open = this.isOpen(), last = OPTIONS.length - 1, k = e.key;
    const done = (label, what) => { e.preventDefault(); this.say(label, what); };
    if (!open) {
      if (k === 'ArrowDown' && e.altKey) { this.open(this.sel); return done('Alt + ↓', 'open, focus stays on the selected option'); }
      if (k === 'ArrowDown' || k === 'Enter' || k === ' ') { this.open(this.sel); return done(k === 'ArrowDown' ? '↓' : k === ' ' ? 'Space' : 'Enter', 'open, highlight the selected option'); }
      if (k === 'ArrowUp') { this.open(this.sel); return done('↑', 'open, highlight the selected option'); }
      if (k === 'Home') { this.open(0); return done('Home', 'open on the first option'); }
      if (k === 'End') { this.open(last); return done('End', 'open on the last option'); }
      if (k.length === 1 && /\S/.test(k) && !e.ctrlKey && !e.metaKey) { const h = this.type(k); if (h != null) { this.open(h); return done(k.toUpperCase(), 'open and jump to ' + OPTIONS[h]); } }
      return;
    }
    if (k === 'ArrowDown') { this.move(this.act + 1); return done('↓', 'next option'); }
    if (k === 'ArrowUp' && e.altKey) { this.choose(this.act); this.close(); return done('Alt + ↑', 'select ' + OPTIONS[this.sel] + ' and close'); }
    if (k === 'ArrowUp') { this.move(this.act - 1); return done('↑', 'previous option'); }
    if (k === 'Home') { this.move(0); return done('Home', 'first option'); }
    if (k === 'End') { this.move(last); return done('End', 'last option'); }
    if (k === 'Enter' || k === ' ') { this.choose(this.act); this.close(); return done(k === ' ' ? 'Space' : 'Enter', 'select ' + OPTIONS[this.sel] + ' and close'); }
    if (k === 'Escape') { this.close(); return done('Esc', 'close, selection unchanged'); }
    if (k === 'Tab') { this.choose(this.act); this.close(); this.say('Tab', 'select ' + OPTIONS[this.sel] + ', close, and move on'); return; }
    if (k.length === 1 && /\S/.test(k) && !e.ctrlKey && !e.metaKey) { const h = this.type(k); if (h != null) { this.move(h); return done(k.toUpperCase(), 'jump to ' + OPTIONS[h]); } }
  }
}
customElements.define('combobox-demo', ComboboxDemo);
