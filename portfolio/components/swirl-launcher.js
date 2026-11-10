// <swirl-launcher> A poster for Swirl Together that opens the live app in a
// modal dialog. The iframe loads only when opened and unloads on close, so
// the WebGL canvas doesn't keep the GPU busy in the background.
import { mount, focusCss } from './shared.js';

const css = `
:host { display: block; }
${focusCss}
.poster { position: relative; display: block; width: 100%; padding: 0; border: 1px solid var(--line, #2d3437); border-radius: 4px; overflow: hidden; background: #0d0f10; cursor: pointer; color: #fff; }
.poster img { display: block; width: 100%; height: auto; transition: transform .5s ease, filter .3s; }
.poster:hover img, .poster:focus-visible img { transform: scale(1.02); filter: brightness(.8); }
.play { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px 12px 14px;
  background: rgba(10,12,14,.78); border: 1px solid rgba(255,255,255,.28); border-radius: 999px; font: 600 15px var(--f-body, system-ui, sans-serif); white-space: nowrap; backdrop-filter: blur(4px); }
.tri { width: 26px; height: 26px; border-radius: 50%; background: var(--accent, #8ea4ff); display: grid; place-items: center; }
.tri::before { content: ""; border-left: 9px solid #0b1020; border-top: 6px solid transparent; border-bottom: 6px solid transparent; margin-left: 3px; }
dialog { width: min(1200px, calc(100vw - 32px)); height: min(820px, calc(100dvh - 32px)); max-width: none; max-height: none; padding: 0; border: 1px solid #3a4246; border-radius: 8px; background: #0d0f10; color: #e7ebe9; overflow: hidden; }
dialog::backdrop { background: rgba(5,7,9,.82); }
.shell { display: grid; grid-template-rows: auto 1fr; height: 100%; }
header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px 10px 16px; border-bottom: 1px solid #2d3437; font-family: var(--f-body, system-ui, sans-serif); }
h3 { margin: 0; font-size: 15px; font-weight: 600; }
.acts { display: flex; gap: 8px; align-items: center; }
a, .close { font: 600 13px var(--f-body, system-ui, sans-serif); color: #e7ebe9; text-decoration: none; border: 1px solid #3a4246; border-radius: 4px; padding: 7px 11px; background: transparent; cursor: pointer; }
a:hover, .close:hover { border-color: #a3aca8; }
.frame { position: relative; }
.frame p { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: #a3aca8; font: 14px var(--f-body, system-ui, sans-serif); text-align: center; padding: 20px; }
iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: transparent; }
@media (prefers-reduced-motion: reduce) { .poster img { transition: none; } }
`;

class SwirlLauncher extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src') || 'https://swirltogether.com';
    const img = this.querySelector('img');
    const root = mount(this, css, `
      <button type="button" class="poster" aria-haspopup="dialog">
        ${img ? img.outerHTML : ''}
        <span class="play"><span class="tri" aria-hidden="true"></span>Play Swirl Together</span>
      </button>
      <dialog aria-labelledby="h">
        <div class="shell">
          <header>
            <h3 id="h">Swirl Together · live playtest</h3>
            <div class="acts">
              <a href="${src}" target="_blank" rel="noopener">Open in new tab <span aria-hidden="true">↗</span></a>
              <button type="button" class="close">Close</button>
            </div>
          </header>
          <div class="frame"><p>Loading the paint canvas. If it doesn't appear, open it in a new tab.</p></div>
        </div>
      </dialog>`);
    if (!root) return;
    const dlg = root.querySelector('dialog');
    const frame = root.querySelector('.frame');
    root.querySelector('.poster').addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = src;
      f.title = 'Swirl Together, a multiplayer fluid painting app';
      f.allow = 'fullscreen; autoplay; clipboard-write; gamepad';
      frame.append(f);
      dlg.showModal();
      root.querySelector('.close').focus();
    });
    root.querySelector('.close').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => frame.querySelector('iframe')?.remove());
  }
}
customElements.define('swirl-launcher', SwirlLauncher);
