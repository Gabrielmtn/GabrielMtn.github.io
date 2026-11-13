// <vp-rewards> Rebuild of the "How to earn" rewards-for-steps prototype.
// The daily total counts only the activity with the most points; logging
// activity moves the "Active" flag to whichever one leads.
import { mount, fmt, focusCss } from './shared.js';

const MAX = 140;
const ACTS = [
  { key: 'steps', label: 'Steps', unit: '', goal: 14000, val: 3000, step: 1000, verb: '1,000 steps', icon: '<path d="M12 4a2 2 0 1 1 0 .01M9 21l2-6 2 2v4m-4-9 3-3 3 3 3 1M9 11l-3 4"/>' },
  { key: 'active', label: 'Active Minutes', unit: '', goal: 45, val: 0, step: 5, verb: '5 active minutes', icon: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/>' },
  { key: 'workout', label: 'Workout Minutes', unit: '', goal: 45, val: 0, step: 5, verb: '5 workout minutes', icon: '<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>' },
];
const pts = (a) => Math.round(Math.min(1, a.val / a.goal) * MAX);

const css = `
:host { display: block; }
/* A phone screen: laid out at a real phone width (375px) like the original, then scaled as a whole to fit the column,
   so it never reflows into a squeezed layout. */
.fit { position: relative; margin: 0 auto; }
.fit > .phone { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
${focusCss}
.phone { width: 387px; background: #fff; color: #2b3338; border-radius: 26px; overflow: hidden; border: 6px solid #0f1416; font-family: var(--f-body, system-ui, sans-serif); font-size: 14px; box-sizing: border-box; }
.nav { background: #24323a; color: #fff; display: grid; grid-template-columns: 28px 1fr 28px; align-items: center; padding: 12px 8px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; text-align: center; }
.band { width: 100%; display: flex; justify-content: space-between; align-items: center; background: #127a8f; color: #fff; border: 0; font: inherit; font-size: 14px; letter-spacing: .08em; text-transform: uppercase; padding: 11px 16px; cursor: pointer; text-align: left; }
.band .chev { transition: transform .2s; }
.band[aria-expanded="false"] .chev { transform: rotate(-90deg); }
.pad { padding: 14px 16px; }
.note { margin: 0 0 14px; color: #4a5358; font-size: 13px; line-height: 1.45; }
.total { display: flex; justify-content: space-between; font-weight: 600; font-size: 13.5px; margin-bottom: 8px; }
.coin { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: #e6b417; margin-right: 4px; vertical-align: -1px; }
.bar { height: 9px; background: #e5eaec; border-radius: 4px; overflow: hidden; }
.bar i { display: block; height: 100%; background: #127a8f; border-radius: 4px; transition: width .4s ease; }
.acts { list-style: none; margin: 12px 0 0; padding: 0; }
.acts li + li { margin-top: 2px; }
.or { text-align: center; font-size: 11px; color: #7d878c; letter-spacing: .1em; margin: 2px 0; }
.act { width: 100%; display: grid; grid-template-columns: 56px 26px 1fr auto; gap: 8px; align-items: center; background: none; border: 0; padding: 10px 2px; font: inherit; color: inherit; cursor: pointer; text-align: left; border-radius: 6px; }
.act:hover { background: #f1f5f6; }
.flag { visibility: hidden; background: #127a8f; color: #fff; font-size: 11px; padding: 4px 8px; clip-path: polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%); }
.act[data-active="true"] .flag { visibility: visible; }
svg { width: 24px; height: 24px; fill: none; stroke: #127a8f; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.name { font-weight: 600; }
.val { font-variant-numeric: tabular-nums; font-size: 13px; color: #4a5358; }
.hint { font-size: 12px; color: #6c767b; margin: 6px 0 0; }
.item { padding: 11px 16px; border-bottom: 1px solid #e7ecee; }
.item .t { display: flex; justify-content: space-between; gap: 10px; color: #127a8f; font-size: 13px; }
.item .t b { color: #2b3338; font-weight: 600; }
.item .s { display: grid; grid-template-columns: 1fr auto 80px; gap: 10px; align-items: center; margin-top: 8px; font-size: 12.5px; color: #4a5358; }
.mini { height: 5px; background: #e5eaec; border-radius: 3px; overflow: hidden; }
.mini i { display: block; height: 100%; background: #127a8f; }
.check { width: 18px; height: 18px; border-radius: 50%; background: #3fae49; color: #fff; display: grid; place-items: center; font-size: 9px; justify-self: end; }
[hidden] { display: none !important; }
@media (prefers-reduced-motion: reduce) { .bar i, .band .chev { transition: none; } }
`;

const sections = [
  { title: 'Monthly', open: true, items: [
    { t: '20-Day Triple Tracker: 7,000 steps / 15 active minutes / 15 workout minutes', p: 400, s: 'Monthly', v: 0, g: 20 },
    { t: '20-Day Triple Tracker: 10,000 steps / 30 active minutes / 30 workout minutes', p: 500, s: 'Monthly', v: 0, g: 20 },
  ] },
  { title: 'One time', open: false, items: [{ t: 'Connect first activity device', p: 200, s: 'One time', done: true }] },
  { title: 'Cards', open: false, items: [
    { t: 'Do your daily cards', p: 60, s: 'Daily', v: 0, g: 3 },
    { t: 'Complete 10 daily cards in a month', p: 100, s: 'Monthly', v: 7, g: 10 },
  ] },
];

class VpRewards extends HTMLElement {
  connectedCallback() {
    const uid = Math.random().toString(36).slice(2, 7);
    const root = mount(this, css, `
      <div class="fit"><div class="phone">
        <div class="nav"><span aria-hidden="true">‹</span><span>How to earn</span><span></span></div>
        <button type="button" class="band" aria-expanded="true" aria-controls="a-${uid}">Activity <span class="chev" aria-hidden="true">▾</span></button>
        <div class="pad" id="a-${uid}">
          <p class="note">Your Daily Exercise Total reflects the <b>one activity</b> with the most points among Steps, Active Minutes, or Workout Minutes.</p>
          <div class="total"><span>Daily Exercise Total</span><span><span class="coin" aria-hidden="true"></span><span class="tv"></span></span></div>
          <div class="bar" role="progressbar" aria-label="Daily exercise total" aria-valuemin="0" aria-valuemax="${MAX}"><i></i></div>
          <ul class="acts">
            ${ACTS.map((a, i) => `${i ? '<li class="or" aria-hidden="true">OR</li>' : ''}<li><button type="button" class="act" data-k="${a.key}"><span class="flag">Active</span><svg viewBox="0 0 24 24" aria-hidden="true">${a.icon}</svg><span class="name">${a.label}</span><span class="val"></span></button></li>`).join('')}
          </ul>
          <p class="hint">Tap an activity to log some. The flag follows whichever earns the most.</p>
          <p class="hint" role="status" aria-live="polite" style="min-height:1.4em;margin:2px 0 0"></p>
        </div>
        ${sections.map((s, si) => `
          <button type="button" class="band" aria-expanded="${s.open}" aria-controls="s${si}-${uid}">${s.title} <span class="chev" aria-hidden="true">▾</span></button>
          <div id="s${si}-${uid}" ${s.open ? '' : 'hidden'}>
            ${s.items.map((it) => `<div class="item"><div class="t"><span>${it.t}</span><b>${it.p}</b></div><div class="s"><span>${it.s}</span>${it.done ? '<span></span><span class="check" aria-label="Done">✓</span>' : `<span>${it.v} / ${it.g}</span><span class="mini"><i style="width:${(it.v / it.g) * 100}%"></i></span>`}</div></div>`).join('')}
          </div>`).join('')}
      </div></div>`);
    if (!root) return;
    // scale the whole phone to the column, and keep the space it takes in step (sections open and close)
    const fit = root.querySelector('.fit'), phone = root.querySelector('.phone');
    const size = () => {
      const k = Math.min(1, this.clientWidth / phone.offsetWidth);
      phone.style.transform = `scale(${k})`;
      fit.style.width = `${phone.offsetWidth * k}px`; fit.style.height = `${phone.offsetHeight * k}px`;
    };
    new ResizeObserver(size).observe(this); new ResizeObserver(size).observe(phone); size();
    this.acts = ACTS.map((a) => ({ ...a }));
    this.root = root;
    root.querySelectorAll('.band').forEach((b) => b.addEventListener('click', () => {
      const open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', String(open));
      root.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    }));
    root.querySelectorAll('.act').forEach((b) => b.addEventListener('click', () => {
      const a = this.acts.find((x) => x.key === b.dataset.k);
      if (a.val >= a.goal) { this.say(`${a.label} goal already met.`); return; }
      a.val = Math.min(a.goal, a.val + a.step);
      this.render();
      const lead = this.lead();
      this.say(`Logged ${a.verb}. ${lead.label} leads with ${pts(lead)} points.`);
    }));
    this.render();
  }
  lead() { return this.acts.reduce((m, a) => (pts(a) > pts(m) ? a : m), this.acts[0]); }
  say(t) { this.root.querySelector('[role="status"]').textContent = t; }
  render() {
    const r = this.root, lead = this.lead(), total = pts(lead);
    r.querySelector('.tv').textContent = `${total} / ${MAX}`;
    r.querySelector('.bar i').style.width = `${(total / MAX) * 100}%`;
    r.querySelector('.bar').setAttribute('aria-valuenow', String(total));
    for (const a of this.acts) {
      const b = r.querySelector(`.act[data-k="${a.key}"]`);
      b.dataset.active = String(a === lead);
      b.querySelector('.val').textContent = `${fmt(a.val)} / ${fmt(a.goal)}`;
      b.setAttribute('aria-label', `${a.label}, ${fmt(a.val)} of ${fmt(a.goal)}, ${pts(a)} points${a === lead ? ', counts toward today' : ''}. Log ${a.verb}.`);
    }
  }
}
customElements.define('vp-rewards', VpRewards);
