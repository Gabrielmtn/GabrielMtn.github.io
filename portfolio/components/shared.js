// Small helpers shared by the portfolio components.
export const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Attach a shadow root once, with styles and markup.
export function mount(el, css, html) {
  if (el.shadowRoot) return null;
  const root = el.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${css}</style>${html}`;
  return root;
}

// Run fn the first time el scrolls into view.
export function onFirstView(el, fn) {
  if (!('IntersectionObserver' in window)) return fn();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
  }, { threshold: 0.35 });
  io.observe(el);
}

export const fmt = (n, digits = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// Shared focus ring used inside shadow roots.
export const focusCss = `
:focus { outline: none; }
:focus-visible { outline: 2px solid var(--accent, #8ea4ff); outline-offset: 2px; }
`;
