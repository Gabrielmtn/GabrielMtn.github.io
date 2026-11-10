// <vp-api-docs> Rebuild of the Partner API documentation prototype:
// three-pane docs where the example response follows the section you read.
import { mount, focusCss } from './shared.js';

const SECTIONS = [
  { group: 'API Basics', id: 'apps', title: 'Partner Applications',
    body: `<p>The Partner API is available to authorized Partners. Applications belonging to these Partners are referred to as Partner Applications. A Partner Application is assigned a Client ID and a Client Secret, which must be kept confidential.</p>
      <h5>Obtaining your client credentials</h5>
      <p>Partners must obtain a Client ID and Client Secret before calling the Partner API. A valid Client ID is required for all user authentication requests.</p>
      <aside><b>Note</b> If you have not yet received a Client ID and Client Secret, reach out to your contact at Virgin Pulse.</aside>`,
    req: 'POST /oauth/token', res: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "access_token": "eyJhbGciOiJSUzI1NiIs…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "partner.read"
}` },
  { group: 'API Basics', id: 'urls', title: 'Base Resource URLs',
    body: `<p>Use these base URLs when making requests to the Partner API. All API resources and endpoints are relative to them. Pilot and Production have different URLs.</p>
      <table><thead><tr><th>Environment</th><th>URL</th></tr></thead><tbody>
      <tr><td>Pilot</td><td><code>https://edge-pilot.virginpulse.com/</code></td></tr>
      <tr><td>Production</td><td><code>https://edge.virginpulse.com/</code></td></tr></tbody></table>
      <p>The Pilot environment is a standalone instance, separate from Production, so Partners can test integrations without affecting production data.</p>`,
    req: 'GET /partner/v1/ping', res: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "environment": "pilot",
  "status": "ok",
  "version": "1.4.2"
}` },
  { group: 'Authentication', id: 'iam', title: 'Identity Service URLs',
    body: `<p>The identity service (IAM) handles all user authorization and API authentication. It uses this URL structure for Partner access:</p>
      <pre>https://&lt;identity_host&gt;/auth/realms/&lt;realm_name&gt;</pre>
      <table><thead><tr><th>Environment</th><th>Identity host</th></tr></thead><tbody>
      <tr><td>Pilot</td><td><code>iam.stage2.virginpulse.com</code></td></tr>
      <tr><td>Production</td><td><code>iam.virginpulse.com</code></td></tr></tbody></table>`,
    req: 'GET /partner/v1/members/me', res: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "sponsor_display_name": "Example Company, Inc.",
  "external_member_id": 123456,
  "language": "en_us",
  "enabled": true,
  "first_name": "John",
  "email": "john.doe@example.com",
  "status": "activated"
}` },
  { group: 'Error Handling', id: 'errors', title: 'HTTP Status Codes',
    body: `<p>The API uses standard HTTP status codes. Every error response includes a machine-readable <code>code</code> and a sentence that says how to fix it.</p>
      <table><thead><tr><th>Status</th><th>Meaning</th></tr></thead><tbody>
      <tr><td>401</td><td>The access token is missing or expired. Request a new one.</td></tr>
      <tr><td>403</td><td>This Client ID can't reach the resource.</td></tr>
      <tr><td>429</td><td>Too many requests. Retry after the time in <code>Retry-After</code>.</td></tr></tbody></table>`,
    req: 'GET /partner/v1/members/me', res: `HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "code": "token_expired",
  "message": "The access token expired. Request a new token and retry."
}` },
];

const css = `
:host { display: block; container-type: inline-size; }
${focusCss}
.docs { display: grid; grid-template-columns: 150px minmax(0, 1fr) minmax(0, .85fr); background: #fff; color: #333b41; border-radius: 4px; overflow: hidden; font-family: var(--f-body, system-ui, sans-serif); font-size: 12.5px; min-height: 420px; }
nav { background: #f4f6f7; border-right: 1px solid #e3e7ea; padding: 12px 0; }
.g { font-size: 11px; font-weight: 600; color: #22303a; padding: 10px 12px 4px; margin: 0; }
nav ul { list-style: none; margin: 0; padding: 0; }
nav button { display: block; width: 100%; text-align: left; border: 0; background: none; font: inherit; font-size: 12px; color: #48535b; padding: 5px 12px 5px 16px; cursor: pointer; border-left: 3px solid transparent; }
nav button:hover { background: #e9edf0; }
nav button[aria-current="true"] { border-left-color: #1f7a95; color: #10232d; background: #e3edf1; font-weight: 600; }
article { padding: 16px 18px; min-width: 0; }
h4 { margin: 0 0 10px; font-size: 16px; color: #22303a; }
h5 { margin: 14px 0 6px; font-size: 12.5px; }
p { margin: 0 0 10px; line-height: 1.55; }
aside { border: 1px solid #d9e1e5; border-radius: 4px; padding: 8px 10px; background: #f7fafb; }
aside b { margin-right: 6px; }
table { border-collapse: collapse; width: 100%; margin: 4px 0 12px; font-size: 11.5px; }
th, td { text-align: left; padding: 6px 8px; border: 1px solid #e3e7ea; }
th { background: #f4f6f7; }
code, pre { font-family: var(--f-mono, ui-monospace, monospace); font-size: 11px; }
pre { background: #f2f4f5; padding: 8px 10px; border-radius: 3px; overflow-x: auto; margin: 0 0 10px; }
.ex { background: #2b2f33; color: #f2a541; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.ex-h { display: flex; justify-content: space-between; align-items: center; color: #d6dadd; font-size: 11.5px; }
.ex-h code { color: #9fd2e6; }
.copy { font: inherit; font-size: 11px; color: #e8ebed; background: transparent; border: 1px solid #555c62; border-radius: 3px; padding: 4px 8px; cursor: pointer; }
.ex pre { background: transparent; color: #f2a541; padding: 0; margin: 0; white-space: pre-wrap; word-break: break-word; line-height: 1.55; font-size: 11.5px; }
@container (max-width: 640px) {
  .docs { grid-template-columns: 1fr; }
  nav { border-right: 0; border-bottom: 1px solid #e3e7ea; padding: 6px 8px; display: flex; gap: 2px; overflow-x: auto; }
  .g { display: none; }
  nav ul { display: flex; }
  nav button { white-space: nowrap; border-left: 0; border-bottom: 3px solid transparent; padding: 6px 10px; }
  nav button[aria-current="true"] { border-bottom-color: #1f7a95; }
}
`;

class VpApiDocs extends HTMLElement {
  connectedCallback() {
    const groups = [...new Set(SECTIONS.map((s) => s.group))];
    const root = mount(this, css, `
      <div class="docs">
        <nav aria-label="Partner API documentation">
          ${groups.map((g) => `<p class="g">${g}</p><ul>${SECTIONS.filter((s) => s.group === g).map((s) => `<li><button type="button" data-id="${s.id}">${s.title}</button></li>`).join('')}</ul>`).join('')}
        </nav>
        <article tabindex="-1" aria-live="polite"></article>
        <div class="ex" aria-label="Example response" role="region">
          <div class="ex-h"><code class="req"></code><button type="button" class="copy">Copy</button></div>
          <pre class="res"></pre>
        </div>
      </div>`);
    if (!root) return;
    this.root = root;
    root.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => this.show(b.dataset.id)));
    const copy = root.querySelector('.copy');
    copy.addEventListener('click', async () => {
      const text = root.querySelector('.res').textContent;
      try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied'; }
      catch { const r = document.createRange(); r.selectNodeContents(root.querySelector('.res')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); copy.textContent = 'Selected'; }
      setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
    });
    this.show('iam', true);
  }
  show(id, initial) {
    const s = SECTIONS.find((x) => x.id === id), r = this.root;
    r.querySelectorAll('nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === id)));
    const art = r.querySelector('article');
    if (initial) art.removeAttribute('aria-live');
    art.innerHTML = `<h4>${s.title}</h4>${s.body}`;
    if (initial) art.setAttribute('aria-live', 'polite');
    r.querySelector('.req').textContent = s.req;
    r.querySelector('.res').textContent = s.res;
  }
}
customElements.define('vp-api-docs', VpApiDocs);
