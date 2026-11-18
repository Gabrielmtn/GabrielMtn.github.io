# gabrielmartin.dev site spec

The rules every page follows. When a change breaks one of these, change the rule here first or don't make the change.
Shared styles live in `css/site.css`; each page's own `<style>` (or `case-studies/study.css`) only adds to them.

## What each page is for

| Page | Job | Not |
| --- | --- | --- |
| Home (`/`) | Who Gabriel is, in one screen: the hero, the badge wall, the About section | A full work history |
| Case studies (`/case-studies/`) | Three projects in depth: Virgin Pulse, Putnam, Akamai | A gallery |
| Portfolio (`/portfolio/`) | Visual work and rebuilt artifacts, one collapsible panel per project | A resume |

Every page shares the same header (name, then Case studies / Portfolio / Contact) and the same footer (email,
Home / Case studies / Portfolio, Gabriel Martin · Boston, MA). The homepage header is the hero itself.

## Color

One dark ground, one accent. No other hues except inside artifacts that reproduce a client's UI, and the badges.

| Token | Value | Use |
| --- | --- | --- |
| `--wall` | #13171a | Page background |
| `--panel` | #1a1f22 | Raised surfaces: cards, figures, dialogs |
| `--ink` | #e7ebe9 | Headings, links, emphasis |
| `--body` | #c6cdc9 | Running text |
| `--muted` | #9aa39f | Labels, captions, secondary text |
| `--line` | #2d3437 | Hairlines and borders |
| `--accent` | #8ea4ff | Link underlines, focus rings, primary buttons. Nothing else. |
| `--accent-ink` | #0b1020 | Text on the accent |

Contrast: text is at least 4.5:1 on its surface (`--muted` is 6.4:1 or better on `--wall` and `--panel`).

## Type

- **Display** (Anybody, stretched 112–125%, weight 750–800): page titles and client names only.
- **Body** (Instrument Sans): everything you read. 17px running text, line height about 1.6, about 65 characters per line.
- **Mono label** (IBM Plex Mono, 13px, uppercase, 0.1em tracking, `--muted`): eyebrows, captions, nav, metadata.
  Nothing smaller than 12px, ever.
- Section headings (h2) are Instrument Sans 600, and state the point of the section rather than naming its topic.

## Spacing and layout

- Text column: 760px max on case studies and the About section. Portfolio panels run wider for artifacts.
- Side gutter at least 16px at every width; nothing scrolls sideways.
- Sections are separated by hairlines (`--line`), not boxes. Boxes are for artifacts and figures.
- Loud moments get quiet space around them: the badge wall is the only maximal element on the site.

## Motion

- Every animation respects `prefers-reduced-motion` and the site's Reduce motion toggle: fades stay, movement goes.
- Fades 0.8–1.4s with ease-out; nothing bounces except the badges, which are physics.
- Nothing moves on its own more than once (the deck zoom runs once, the load-in runs once).
- No autoplaying sound. Video in the viewer plays muted, and not at all for reduced motion.

## Artifacts and images

- Image groups are a row of same-size thumbnails that open in the viewer; one artifact per figure otherwise.
- Captions are "What it is, year" in the label style.
- Rebuilt client artifacts are labelled "Obfuscated as per client request". Only the partner API rebuild offers
  "Compare original".
- Reference material that isn't Gabriel's work is tagged "For reference · not my work".

## Copy

- The words are Gabriel's. Code changes never rewrite copy; a wording change is proposed and approved first.
- Job titles match the resume: Virgin Pulse UX Design Engineer; Akamai Sr. UI/UX Developer / Designer;
  Pearson Sr. UI/UX Developer; Putnam Accessibility UX Engineer; Innovative Driven Product Architect / UX Designer.
- One title for Gabriel everywhere: UX Architect / Designer / Engineer.
- Email is written Gabriel@GabrielMartin.dev.
- Results come first: every case study opens with the problem, what he did, and the result.
- Numbers where they exist; a plain sentence where they don't. Never an input dressed up as an outcome.
- Avoid: "not X, but Y", "didn't just X, it Y", "the hardest part", one-line zingers (about one per page at most),
  runs of three, em dashes. "·" separates items in labels.

## Accessibility

- Everything works by keyboard, with a visible focus ring (2px `--accent`).
- Interactive rebuilds use real buttons and native elements before ARIA.
- Every image has alt text that says what it shows in a sentence; long specs go in visible text, not alt text.
- Dialogs return focus to what opened them.
