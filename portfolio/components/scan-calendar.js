// <scan-calendar> Rebuild of the high-risk product cadence wireframe.
// Each marker is a button; choosing one shows its detail below the grid.
import { mount, focusCss } from './shared.js';

const DAYS = ['May 1', 'May 2', 'May 3', 'May 4', 'May 5', 'May 6', 'May 7', 'May 8'];
const TODAY = 5; // index of May 6
const ROWS = [
  { name: 'Testnet#123 · Scan #1', marks: [{ d: 5, kind: 'progress', text: '95%', detail: 'Scan in progress, 95% complete. Results land in the tracker when it finishes.' }] },
  { name: 'Masternet · Scan #22', marks: [{ d: 2, kind: 'ok', text: 'Scanned', detail: 'Scanned on May 3, on schedule. Next scan due June 2.' }] },
  { name: 'FakeNet · Scan #5', marks: [{ d: 6, kind: 'due', text: '1 day to scan', detail: 'Due tomorrow. The 30-day FedRAMP window closes May 7, so this product needs a scan today.' }] },
  { name: 'FakeNet · Scan #6', marks: [{ d: 3, kind: 'missed', text: 'Scan missed!', detail: 'Missed on May 4. The product owner and the compliance lead were both notified.' }] },
];

const css = `
:host { display: block; }
${focusCss}
.card { background: #f7f8f8; color: #5a6168; border-radius: 4px; font-family: var(--f-body, system-ui, sans-serif); padding: 14px 16px 16px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.toggle { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; padding: 4px 2px; font: inherit; font-size: 16px; color: #4c535a; cursor: pointer; }
.chev { transition: transform .2s; display: inline-block; font-size: 12px; }
.toggle[aria-expanded="false"] .chev { transform: rotate(-90deg); }
.filter { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; cursor: pointer; }
.filter input { accent-color: #3c4650; width: 15px; height: 15px; }
.scroll { overflow-x: auto; margin-top: 8px; }
.grid { display: grid; grid-template-columns: minmax(150px, 1.6fr) repeat(8, minmax(44px, 1fr)); min-width: 500px; position: relative; }
.day { font-size: 12.5px; text-align: center; padding: 8px 0; color: #6f777e; }
.day.today { color: #2f363c; font-weight: 600; }
.row-name { font-size: 12.5px; padding: 0 8px 0 0; display: flex; align-items: center; min-height: 64px; border-top: 1px solid #e6e8ea; }
.cell { border-top: 1px solid #e6e8ea; display: grid; place-items: center; position: relative; }
.cell.today { background: rgba(60,70,80,.05); }
.mark { border: 0; cursor: pointer; font: inherit; display: grid; justify-items: center; gap: 3px; background: none; padding: 4px; border-radius: 4px; }
.pill { font-size: 11px; white-space: nowrap; padding: 4px 7px; border-radius: 3px; background: #626a71; color: #fff; }
.mark[data-kind="progress"] .pill { background: transparent; color: #4c535a; font-size: 14px; }
.mark[data-kind="ok"] .pill { background: #e2efe6; color: #23633a; }
.mark[aria-pressed="true"] .pill { box-shadow: 0 0 0 2px #2f363c; }
.warn { width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 13px solid #d93a35; position: relative; }
.warn::after { content: "!"; position: absolute; left: -2px; top: 2px; font-size: 9px; font-weight: 700; color: #fff; }
.detail { margin: 12px 0 0; padding: 10px 12px; background: #fff; border: 1px solid #e3e6e8; border-radius: 4px; font-size: 13px; color: #3f474e; min-height: 1.5em; }
[hidden] { display: none !important; }
`;

class ScanCalendar extends HTMLElement {
  connectedCallback() {
    const id = 'cal-' + Math.random().toString(36).slice(2, 7);
    const root = mount(this, css, `
      <div class="card">
        <div class="head">
          <button type="button" class="toggle" aria-expanded="true" aria-controls="${id}"><span class="chev" aria-hidden="true">▼</span>High Risk Product Cadence</button>
          <label class="filter"><input type="checkbox" id="${id}-f"> At risk only</label>
        </div>
        <div id="${id}">
          <div class="scroll">
            <div class="grid" role="table" aria-label="Scan schedule for May 1 to May 8">
              <div role="row" style="display:contents"><span role="columnheader" class="row-name" style="border:0;min-height:0"><span class="visually">Product</span></span>
                ${DAYS.map((d, i) => `<span role="columnheader" class="day${i === TODAY ? ' today' : ''}">${d}${i === TODAY ? '<br>Today' : ''}</span>`).join('')}</div>
              ${ROWS.map((r, ri) => `<div role="row" style="display:contents" data-risk="${r.marks.some((m) => m.kind === 'due' || m.kind === 'missed')}">
                <span role="rowheader" class="row-name">${r.name}</span>
                ${DAYS.map((_, di) => {
                  const m = r.marks.find((x) => x.d === di);
                  return `<span role="cell" class="cell${di === TODAY ? ' today' : ''}">${m ? `<button type="button" class="mark" data-kind="${m.kind}" data-r="${ri}" aria-pressed="false" aria-label="${r.name}, ${DAYS[di]}: ${m.text}"><span class="pill">${m.text}</span>${m.kind === 'due' || m.kind === 'missed' ? '<span class="warn" aria-hidden="true"></span>' : ''}</button>` : ''}</span>`;
                }).join('')}
              </div>`).join('')}
            </div>
          </div>
          <p class="detail" role="status" aria-live="polite">Choose a marker to see what it means for the product owner.</p>
        </div>
      </div>`);
    if (!root) return;
    root.querySelector('.visually').style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
    const toggle = root.querySelector('.toggle');
    const body = root.getElementById(id);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
    });
    root.getElementById(id + '-f').addEventListener('change', (e) => {
      root.querySelectorAll('[data-risk="false"]').forEach((r) => { r.hidden = e.target.checked; r.style.display = e.target.checked ? 'none' : 'contents'; });
    });
    const detail = root.querySelector('.detail');
    root.querySelectorAll('.mark').forEach((b) => b.addEventListener('click', () => {
      root.querySelectorAll('.mark').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      const r = ROWS[b.dataset.r], m = r.marks[0];
      detail.textContent = `${r.name}: ${m.detail}`;
    }));
  }
}
customElements.define('scan-calendar', ScanCalendar);
