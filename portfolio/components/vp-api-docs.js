// <vp-api-docs> Rebuild of the Partner API documentation prototype, as the scrolling page it was: a fixed nav on
// the left, every section one after another in the middle, and the dark example column on the right, with each
// example response lined up beside its section and holding its place while you read it. The nav jumps to a section
// and marks the one you're reading.
import { mount, focusCss } from './shared.js';

const SECTIONS = [
  { group: 'API Basics', id: 'basics', title: 'API Basics',
    body: `<p>The Virgin Pulse Partner API enables applications to interact with the Virgin Pulse platform programmatically.</p>
      <p>The Partner API is organized around the principles of REST, with all requests and responses encoded as JSON. Standard HTTP response codes are used to indicate API errors and successful requests. All requests to the API should be made over SSL. API calls made over plain HTTP will fail.</p>` },
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
  { group: 'API Basics', id: 'pilot', title: 'Pilot Testing Environment',
    body: `<p>Virgin Pulse provides a Pilot Testing Environment which should be used while developing or testing integrations with the Partner API. The Pilot Environment is a standalone instance which is separate from Virgin Pulse's Production servers. This enables Partners to make API requests without affecting production data.</p>` },
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
      <tr><td>Production</td><td><code>iam.virginpulse.com</code></td></tr></tbody></table>
      <p>And one of the following values for <code>&lt;realm_name&gt;</code>:</p>
      <table><thead><tr><th>Realm name</th><th>Description</th></tr></thead><tbody>
      <tr><td>VirginPulse</td><td>All Virgin Pulse program members. Partners should use this realm unless otherwise instructed by Virgin Pulse.</td></tr></tbody></table>`,
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

// the documentation's full outline, as in the original; only the sections above are written out
const OUTLINE = [
  ['API Basics', ['basics', 'apps', 'pilot', 'urls', 'Authentication & Authorization', 'Libraries and SDKs', 'Error Responses']],
  ['Authentication', ['iam', 'Getting an Access Token', 'Making API Calls', 'Authentication Errors', 'General Guidelines']],
  ['Error Handling', ['errors', 'Error Response Format']],
  ['User Profile Information', ['Standard User Attributes', 'Additional User Attributes', 'Organizational Hierarchy']],
  ['Events API', ['Event Scope', 'Event Types', 'Source Type (Login Type)', 'Resources/Endpoints']],
  ['Subscriptions API', ['Resources/Endpoints']],
  ['Frequently Asked Questions', ['Sponsors', 'User Attributes']],
];

const css = `
:host { display: block; container-type: inline-size; }
${focusCss}
.win { background: #fff; color: #333b41; border-radius: 4px; overflow: hidden; font-family: var(--f-body, system-ui, sans-serif); font-size: 12.5px; }
.chrome { display: flex; gap: 8px; align-items: center; padding: 8px 10px; background: #fff; border-bottom: 1px solid #e3e7ea; }
.chrome i { display: block; height: 10px; border-radius: 5px; background: #d9dde0; }
/* the page scrolls inside this window */
.page { height: 560px; overflow: auto; display: grid; grid-template-columns: 158px minmax(0, 1fr); scroll-behavior: smooth; overscroll-behavior: contain; }
@media (prefers-reduced-motion: reduce) { .page { scroll-behavior: auto; } }
nav { position: sticky; top: 0; align-self: start; max-height: 560px; overflow: auto; background: #f4f6f7; border-right: 1px solid #e3e7ea; padding: 10px 0 14px; }
.g { font-size: 11px; font-weight: 600; color: #22303a; padding: 9px 10px 3px; margin: 0; }
nav ul { list-style: none; margin: 0; padding: 0; }
nav a, nav span { display: block; font-size: 11px; color: #48535b; padding: 3px 10px 3px 14px; border-left: 3px solid transparent; text-decoration: none; }
nav span { color: #8b959c; }
nav a:hover { background: #e9edf0; }
nav a[aria-current="true"] { border-left-color: #1f7a95; color: #10232d; background: #e3edf1; font-weight: 600; }
/* each section: its text on the left, its example on the dark column to the right */
.sections { min-width: 0; background: linear-gradient(90deg, #fff 0 56%, #2b2f33 56%); }
section { display: grid; grid-template-columns: 56fr 44fr; border-bottom: 1px solid #e3e7ea; }
section:last-child { min-height: 560px; }
.txt { padding: 18px 18px 22px; min-width: 0; background: #fff; }
.ex { padding: 18px 16px; min-width: 0; color: #f2a541; }
.ex-in { position: sticky; top: 12px; display: grid; gap: 8px; }
.ex-h { display: flex; justify-content: space-between; align-items: center; gap: 8px; color: #d6dadd; font-size: 11px; }
.ex-h code { color: #9fd2e6; }
h4 { margin: 0 0 10px; font-size: 15px; color: #1f6f87; }
h5 { margin: 14px 0 6px; font-size: 12px; }
p { margin: 0 0 10px; line-height: 1.6; }
aside { border: 1px solid #d9e1e5; border-radius: 4px; padding: 8px 10px; background: #f7fafb; }
aside b { margin-right: 6px; }
table { border-collapse: collapse; width: 100%; margin: 4px 0 12px; font-size: 11px; }
th, td { text-align: left; padding: 6px 8px; border: 1px solid #e3e7ea; vertical-align: top; }
th { background: #f4f6f7; }
code, pre { font-family: var(--f-mono, ui-monospace, monospace); font-size: 10.5px; }
.txt pre { background: #f2f4f5; padding: 8px 10px; border-radius: 3px; overflow-x: auto; margin: 0 0 10px; }
.copy { font: inherit; font-size: 10.5px; color: #e8ebed; background: transparent; border: 1px solid #555c62; border-radius: 3px; padding: 3px 8px; cursor: pointer; }
.ex pre { background: transparent; color: #f2a541; padding: 0; margin: 0; white-space: pre-wrap; word-break: break-word; line-height: 1.55; font-size: 11px; }
@container (max-width: 640px) {
  .page { grid-template-columns: 1fr; height: 520px; }
  nav { display: none; }
  .sections { background: #fff; }
  section { grid-template-columns: 1fr; }
  section:last-child { min-height: 0; }
  .ex { background: #2b2f33; }
  .ex-in { position: static; }
}
`;

class VpApiDocs extends HTMLElement {
  connectedCallback() {
    const byId = Object.fromEntries(SECTIONS.map(s => [s.id, s]));
    const u = Math.random().toString(36).slice(2, 7);
    const root = mount(this, css, `
      <div class="win">
        <div class="chrome" aria-hidden="true"><i style="width:44px"></i><span style="flex:1"></span><i style="width:42px"></i><i style="width:42px"></i><i style="width:42px"></i><i style="width:42px"></i></div>
        <div class="page" tabindex="0" aria-label="Partner API documentation, scrollable">
          <nav aria-label="Partner API documentation">
            ${OUTLINE.map(([g, items]) => `<p class="g">${g}</p><ul>${items.map(k => byId[k] && k !== 'basics'
              ? `<li><a href="#${k}-${u}" data-id="${k}">${byId[k].title}</a></li>`
              : byId[k] ? '' : `<li><span>${k}</span></li>`).join('')}</ul>`).join('')}
          </nav>
          <div class="sections">
            ${SECTIONS.map(s => `<section id="${s.id}-${u}" data-id="${s.id}" aria-labelledby="h-${s.id}-${u}">
              <div class="txt"><h4 id="h-${s.id}-${u}">${s.title}</h4>${s.body}</div>
              <div class="ex">${s.res ? `<div class="ex-in" role="group" aria-label="Example response for ${s.title}">
                <div class="ex-h"><code>${s.req}</code><button type="button" class="copy">Copy</button></div>
                <pre>${s.res}</pre></div>` : ''}</div>
            </section>`).join('')}
          </div>
        </div>
      </div>`);
    if (!root) return;
    const page = root.querySelector('.page');
    // the nav jumps within the page's own scroll, not the whole site
    root.querySelectorAll('nav a').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const sec = root.getElementById(a.getAttribute('href').slice(1));
      page.scrollTo({ top: sec.offsetTop - page.offsetTop });
      // keyboard users land on the section they chose (a mouse click just scrolls)
      if (e.detail === 0) { const h = sec.querySelector('h4'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    }));
    // mark the section being read
    const links = [...root.querySelectorAll('nav a')];
    const mark = () => {
      const y = page.scrollTop + 40;
      let cur = SECTIONS[0].id;
      for (const sec of root.querySelectorAll('section')) if (sec.offsetTop - page.offsetTop <= y) cur = sec.dataset.id;
      links.forEach(a => a.setAttribute('aria-current', String(a.dataset.id === cur)));
    };
    page.addEventListener('scroll', mark, { passive: true }); mark();
    root.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
      const pre = b.closest('.ex-in').querySelector('pre');
      try { await navigator.clipboard.writeText(pre.textContent); b.textContent = 'Copied'; }
      catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; }
      setTimeout(() => { b.textContent = 'Copy'; }, 1600);
    }));
  }
}
customElements.define('vp-api-docs', VpApiDocs);
