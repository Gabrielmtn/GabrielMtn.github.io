// <pf-artifact> wraps one live rebuild. It finds the original screenshot
// (the <img> fallback inside the child component) and offers a toggle to
// compare the rebuild against it.
const css = `
:host { display: block; container-type: inline-size; }
@container (max-width: 340px) { .x { display: none; } }
.bar { white-space: nowrap; display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 0 0 10px;
  font: 500 11.5px/1.2 var(--f-mono, ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; color: var(--muted, #a3aca8); }
.state { display: inline-flex; align-items: center; gap: 8px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #5fd38d; box-shadow: 0 0 0 3px rgba(95,211,141,.16); }
:host([showing="original"]) .dot { background: var(--muted, #a3aca8); box-shadow: none; }
button { font: inherit; letter-spacing: inherit; text-transform: inherit; color: var(--ink, #e7ebe9); background: transparent;
  border: 1px solid var(--line, #2d3437); border-radius: 3px; padding: 6px 10px; cursor: pointer; }
button:hover { border-color: var(--muted, #a3aca8); }
button:focus-visible { outline: 2px solid var(--accent, #8ea4ff); outline-offset: 2px; }
.orig { background: var(--panel, #1a1f22); border: 1px solid var(--line, #2d3437); border-radius: 4px; padding: clamp(10px, 2vw, 22px); display: grid; place-items: center; }
.orig img { max-width: 100%; height: auto; display: block; border-radius: 2px; }
[hidden] { display: none !important; }
`;

class PfArtifact extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    const img = this.querySelector('img');
    root.innerHTML = `<style>${css}</style>
      <div class="bar">
        <span class="state"><span class="dot" aria-hidden="true"></span><span class="lbl">Live<span class="x"> rebuild</span></span></span>
        <button type="button" aria-pressed="false"><span class="x">Compare </span>original</button>
      </div>
      <div class="stage"><slot></slot></div>
      <div class="orig" hidden></div>`;
    const btn = root.querySelector('button');
    const stage = root.querySelector('.stage');
    const orig = root.querySelector('.orig');
    const lbl = root.querySelector('.lbl');
    if (!img) { btn.hidden = true; return; }
    const copy = img.cloneNode();
    copy.loading = 'lazy';
    orig.append(copy);
    btn.addEventListener('click', () => {
      const showOriginal = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(showOriginal));
      stage.hidden = showOriginal;
      orig.hidden = !showOriginal;
      lbl.innerHTML = showOriginal ? 'Original<span class="x"> screenshot</span>' : 'Live<span class="x"> rebuild</span>';
      this.setAttribute('showing', showOriginal ? 'original' : 'live');
    });
  }
}
customElements.define('pf-artifact', PfArtifact);
