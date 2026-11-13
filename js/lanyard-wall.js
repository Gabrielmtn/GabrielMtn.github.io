/*!
 * Lanyard Portfolio · <lanyard-wall>
 * Hanging ID badges on lanyards, with real rope physics, for portfolios and about pages.
 * https://github.com/Gabrielmtn/lanyard-portfolio · MIT License · (c) 2026 Gabriel Martin
 *
 * Rendering: three.js (peer dependency) with canvas-drawn card faces.
 * Physics: hand-written XPBD at 480 Hz substeps. Each strap is a Verlet rope, each card a rigid body.
 * Accessibility: the canvas is aria-hidden. A real button sits over every badge and pin, follows it as it
 * swings, and announces both sides of the badge. Reduced motion is honored, and without WebGL the same
 * content renders as a plain list.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const swagWhen = s => s.note || '';
function rgb(hex) { const h = hex.replace('#', ''); return [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16)); }
function lum(hex) { return rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, k) => a + v * [0.2126, 0.7152, 0.0722][k], 0); }
function contrast(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }
function inkOn(hex) { return contrast(hex, '#ffffff') >= contrast(hex, '#14171a') ? '#ffffff' : '#14171a'; }
function shade(hex, amt) { const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return '#' + rgb(hex).map(v => Math.round(v + (t - v) * p).toString(16).padStart(2, '0')).join(''); }
const buildColor = b => b.band2 || shade(b.band, -0.32);

/* dates: "MM/YYYY" */
function parseMY(s) { const m = /^\s*(\d{1,2})\s*\/\s*(\d{4})\s*$/.exec(s || ''); return m ? { m: +m[1], y: +m[2] } : null; }
function fmtRange(b) {
  const a = parseMY(b.start), z = parseMY(b.end);
  if (!a && !z) return '';
  if (a && z) return a.y === z.y ? String(a.y) : `${a.y} - ${String(z.y).slice(-2)}`; // e.g. 2014 - 15
  return a ? `${a.y}–present` : String(z.y);
}
function tenure(b) {
  const a = parseMY(b.start), z = parseMY(b.end); if (!a || !z) return '';
  const n = (z.y - a.y) * 12 + (z.m - a.m) + 1; if (n <= 0) return '';
  const y = Math.floor(n / 12), mo = n % 12;
  return [y ? `${y} yr` : '', mo ? `${mo} mo` : ''].filter(Boolean).join(' ');
}

/* ---------- card textures ---------- */
const TW = 1024, TH = 1536;

function wrap(c, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w;
    if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function cover(c, img, W, H) { const s = Math.max(W / img.width, H / img.height);
  c.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s); }
function stretch(c, v) { try { c.fontStretch = v; } catch {} }

function topLabels(c, i, right, ink, o) {
  // Sits above the slot punch (which starts ~85px down), so long date ranges don't run into it.
  c.save(); c.fillStyle = ink; c.globalAlpha = 0.72; c.font = `500 34px ${o.f.mono}`; c.textBaseline = 'alphabetic';
  c.textAlign = 'right'; c.fillText(right, TW - 64, 62); c.restore();
}

// Security-print details: guilloché lines, microprinted edges, a holographic seal.
function guilloche(c, x, y, w, h, color, alpha, seed) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.strokeStyle = color; c.globalAlpha = alpha; c.lineWidth = 1.6;
  for (let k = 0; k < 28; k++) {
    c.beginPath();
    for (let s = 0; s <= 240; s++) {
      const t = s / 240, px = x + t * w;
      const py = y + h * 0.5 + Math.sin(t * Math.PI * 6 + k * 0.23 + seed) * h * 0.3 * Math.cos(t * Math.PI * 2 + k * 0.11)
        + (k - 14) * h * 0.011;
      s ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
  }
  c.restore();
}
function microtext(c, b, ink, o) {
  const unit = [b.printLabel || (b.org || '').toUpperCase(), b.name.toUpperCase(), b.tag].filter(Boolean).join(' · ') + ' · ';
  c.save(); c.fillStyle = ink; c.globalAlpha = 0.34; c.font = `500 17px ${o.f.mono}`; c.textBaseline = 'middle';
  for (const [x, rot] of [[26, -Math.PI / 2], [TW - 26, Math.PI / 2]]) {
    c.save(); c.translate(x, TH / 2); c.rotate(rot);
    const w = c.measureText(unit).width; let s = -TH / 2 + 40;
    while (s < TH / 2 - 40) { c.fillText(unit, s, 0); s += w; }
    c.restore();
  }
  c.restore();
}
const SEAL = { x: 868, y: 772, r: 92 };
function seal(c, ink, o, b) {
  const { x, y, r } = SEAL;
  c.save();
  let g;
  try { g = c.createConicGradient(0, x, y); ['#ff9ad5', '#ffe58a', '#9dffc4', '#8fd3ff', '#c7a6ff', '#ff9ad5'].forEach((col, k, a) => g.addColorStop(k / (a.length - 1), col)); }
  catch { g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, '#e9f7ff'); g.addColorStop(1, '#c7a6ff'); }
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(20,23,26,0.35)'; c.lineWidth = 2;
  for (const rr2 of [r - 8, r - 40]) { c.beginPath(); c.arc(x, y, rr2, 0, 7); c.stroke(); }
  c.lineWidth = 1.4;
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; c.beginPath();
    c.moveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); c.quadraticCurveTo(x + Math.cos(a + 0.5) * 40, y + Math.sin(a + 0.5) * 40, x + Math.cos(a + 0.9) * (r - 42), y + Math.sin(a + 0.9) * (r - 42)); c.stroke(); }
  c.fillStyle = 'rgba(20,23,26,0.7)'; c.font = `600 15px ${o.f.mono}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const unit = `${b.seal} · `, ring = unit.repeat(Math.max(1, Math.round(46 / unit.length)));
  [...ring].forEach((ch, k) => { const a = k / ring.length * Math.PI * 2 - Math.PI / 2;
    c.save(); c.translate(x + Math.cos(a) * (r - 24), y + Math.sin(a) * (r - 24)); c.rotate(a + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); });
  c.restore();
}

function drawFront(b, i, cv, o) {
  cv.width = TW; cv.height = TH; const c = cv.getContext('2d');
  c.fillStyle = b.color; c.fillRect(0, 0, TW, TH);
  if (b.frontImg) { cover(c, b.frontImg, TW, TH); return; }
  const ink = inkOn(b.color);
  const g = c.createLinearGradient(0, 0, TW, TH);
  g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
  c.fillStyle = g; c.fillRect(0, 0, TW, TH);
  guilloche(c, 40, 214, TW - 80, 440, ink, 0.07, i * 1.7);
  microtext(c, b, ink, o);
  topLabels(c, i, b.tag, ink, o);
  c.fillStyle = b.band; c.fillRect(64, 204, TW - 128, 6);
  c.fillStyle = buildColor(b); c.fillRect(TW / 2, 204, TW / 2 - 64, 6);

  // logo on a white plate when we have one; otherwise the organization name set in type
  if (b.logoImg) {
    const pY = 230, pH = b.sub ? 320 : 360, pad = 40;
    rr(c, 52, pY, TW - 104, pH, 26); c.fillStyle = '#ffffff'; c.fill();
    const bw = TW - 104 - pad * 2, bh = pH - pad * 2, k = Math.min(bw / b.logoImg.width, bh / b.logoImg.height);
    const lw = b.logoImg.width * k, lh = b.logoImg.height * k;
    c.drawImage(b.logoImg, 52 + pad + (bw - lw) / 2, pY + pad + (bh - lh) / 2, lw, lh);
    if (b.subLogoImg) { // second logo under the plate (e.g. the company that was in the incubator)
      const sh = 64, sw = b.subLogoImg.width * sh / b.subLogoImg.height;
      c.drawImage(b.subLogoImg, 60, pY + pH + 26, sw, sh);
    } else if (b.sub) { c.textBaseline = 'top'; c.textAlign = 'left'; c.fillStyle = ink; c.font = `500 50px ${o.f.body}`; c.globalAlpha = 0.85; c.fillText(b.sub, 60, pY + pH + 22); c.globalAlpha = 1; }
  } else {
  stretch(c, 'expanded');
  let size = 176, lines = [];
  for (; size >= 80; size -= 4) {
    c.font = `850 ${size}px ${o.f.display}`; lines = wrap(c, b.org || ' ', TW - 128);
    if (lines.length <= 2 && lines.every(l => c.measureText(l).width <= TW - 128)) break;
  }
  c.textBaseline = 'top'; c.textAlign = 'left'; c.fillStyle = ink;
  let y = 236; lines.forEach(l => { c.fillText(l, 58, y); y += size * 0.94; });
  stretch(c, 'normal');
  if (b.sub) { c.font = `500 52px ${o.f.body}`; c.globalAlpha = 0.8; c.fillText(b.sub, 64, y + 8); c.globalAlpha = 1; }
  }

  // name on one line beside the seal
  c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = ink;
  const nameW = SEAL.x - SEAL.r - 64 - 36;
  if (b.name) { let ns = 84; for (; ns > 56; ns -= 2) { c.font = `600 ${ns}px ${o.f.body}`; if (c.measureText(b.name).width <= nameW) break; }
    c.fillText(b.name, 62, SEAL.y + ns * 0.34); }
  seal(c, ink, o, b);

  // from | to | title
  const dy = 884;
  c.fillStyle = ink; c.globalAlpha = 0.22; c.fillRect(64, dy, TW - 128, 3); c.globalAlpha = 1;
  const dateTxt = fmtRange(b) || '—';
  c.globalAlpha = 0.62; c.font = `500 26px ${o.f.mono}`; c.fillText(b.dateLabel, 64, dy + 50); c.globalAlpha = 1;
  c.font = `600 44px ${o.f.mono}`; c.fillText(dateTxt, 64, dy + 104);
  const tX = Math.max(300, 64 + c.measureText(dateTxt).width + 56), tW = TW - 64 - tX;
  c.globalAlpha = 0.62; c.font = `500 26px ${o.f.mono}`; c.fillText(b.titleLabel, tX, dy + 50); c.globalAlpha = 1;
  // one line if it fits at a readable size, otherwise two
  let ts = 46, tl = [];
  for (; ts >= 36; ts -= 2) { c.font = `600 ${ts}px ${o.f.body}`; if (c.measureText(b.role || '—').width <= tW) { tl = [b.role || '—']; break; } }
  if (!tl.length) for (ts = 44; ts >= 30; ts -= 2) { c.font = `600 ${ts}px ${o.f.body}`; tl = wrap(c, b.role || '—', tW); if (tl.length <= 2 && tl.every(l => c.measureText(l).width <= tW)) break; }
  tl.slice(0, 2).forEach((l, k) => c.fillText(l, tX, dy + 104 + k * ts * 1.1));

  // split band: what I designed | what I built
  // Taller band with large type: each item may wrap to two lines rather than shrinking.
  const bY = 1066, half = TW / 2, bc = buildColor(b);
  [[0, b.band, b.labels[0], b.designList], [half, bc, b.labels[1], b.buildList]].forEach(([x0, fill, label, list]) => {
    c.fillStyle = fill; c.fillRect(x0, bY, half, TH - bY);
    const tInk = inkOn(fill);
    guilloche(c, x0, bY, half, TH - bY, tInk, 0.06, x0 * 0.01 + i);
    c.fillStyle = tInk; c.font = `600 42px ${o.f.mono}`; c.fillText(label, x0 + 40, bY + 50);   // full-strength ink: a readable heading, not a watermark
    const items = (list || []).filter(Boolean).slice(0, 4);
    if (!items.length) { c.font = `600 54px ${o.f.body}`; c.fillText('—', x0 + 40, bY + 150); return; }
    const avail = TH - bY - 104 - 26;
    let size = 56, laid = [], tx = 0;
    for (; size >= 36; size -= 2) {
      c.font = `600 ${size}px ${o.f.body}`; tx = x0 + 40 + size * 0.28 + 16;
      const maxW = x0 + half - 26 - tx;
      laid = items.map(t => wrap(c, t, maxW));
      const h = laid.reduce((a, ls) => a + ls.length * size * 1.08 + size * 0.42, 0) - size * 0.42;
      if (laid.every(ls => ls.length <= 2 && ls.every(l => c.measureText(l).width <= maxW)) && h <= avail) break;
    }
    let yy = bY + 104 + size * 0.8;
    laid.forEach(ls => {
      c.globalAlpha = 0.85; c.fillRect(x0 + 42, yy - size * 0.38, size * 0.28, size * 0.28); c.globalAlpha = 1;
      ls.slice(0, 2).forEach((l, j) => c.fillText(l, tx, yy + j * size * 1.08));
      yy += Math.min(ls.length, 2) * size * 1.08 + size * 0.42;
    });
  });
}

function drawBack(b, i, cv, o) {
  cv.width = TW; cv.height = TH; const c = cv.getContext('2d');
  const bg = lum(b.color) > 0.45 ? shade(b.color, -0.07) : shade(b.color, -0.38);
  c.fillStyle = bg; c.fillRect(0, 0, TW, TH);
  if (b.backImg) { cover(c, b.backImg, TW, TH); return; }
  const ink = inkOn(bg);
  topLabels(c, i, fmtRange(b).toUpperCase() || (b.org || '').toUpperCase().slice(0, 22), ink, o);
  c.textBaseline = 'top'; c.textAlign = 'left';

  const groups = [[b.labels[0], b.band, b.design || []], [b.labels[1], buildColor(b), b.build || []]]
    // an accent too close to the card's back colour gets lifted so its label and bullets stay visible
    .map(([l, col, items]) => [l, contrast(col, bg) < 1.8 ? shade(col, 0.5) : col, items.filter(Boolean)]).filter(gr => gr[2].length);
  if (!groups.length) {
    c.fillStyle = ink; stretch(c, 'expanded'); c.font = `850 88px ${o.f.display}`; c.fillText(b.emptyHeading, 58, 240); stretch(c, 'normal');
    c.globalAlpha = 0.7; c.font = `500 56px ${o.f.body}`;
    wrap(c, b.emptyText, TW - 140)
      .forEach((l, k) => c.fillText(l, 64, 400 + k * 76));
    c.globalAlpha = 1;
  } else {
    let size = 60, laid;
    for (; size >= 30; size -= 2) {
      c.font = `500 ${size}px ${o.f.body}`; const lh = size * 1.34; let y = 200; laid = [];
      groups.forEach(([label, col, items], gi) => {
        if (gi) y += 44;                                   // clear break between UX design and UX engineering
        laid.push({ chip: { label, col, y } }); y += 98;
        items.forEach((it, ii) => { const ls = wrap(c, it, TW - 182); laid.push({ col, y, ls }); y += ls.length * lh + (ii < items.length - 1 ? size * 0.95 : 0); });
      });
      if (y <= 1360) break;
    }
    const lh = size * 1.34;
    for (const row of laid) {
      if (row.chip) {
        const { label, col, y } = row.chip;
        c.font = `600 34px ${o.f.mono}`; const w = c.measureText(label).width + 48;
        rr(c, 62, y, w, 62, 31); c.fillStyle = col; c.fill();
        c.fillStyle = inkOn(col); c.textBaseline = 'middle'; c.fillText(label, 86, y + 33); c.textBaseline = 'top';
      } else {
        c.font = `500 ${size}px ${o.f.body}`;
        c.fillStyle = row.col; c.fillRect(66, row.y + size * 0.36, size * 0.34, size * 0.34);
        c.fillStyle = ink; row.ls.forEach((l, k) => c.fillText(l, 118, row.y + k * lh));
      }
    }
  }
  c.fillStyle = ink; c.globalAlpha = 0.22; c.fillRect(64, 1396, TW - 128, 3); c.globalAlpha = 0.6;
  c.globalAlpha = 0.9; c.textBaseline = 'alphabetic';
  if (b.contact) { const t = b.contact; let fs = 44;
    for (; fs > 30; fs -= 2) { c.font = `600 ${fs}px ${o.f.body}`; if (c.measureText(t).width <= TW - 128) break; }
    c.fillText(t, 64, 1462); }
  c.globalAlpha = 1; c.fillStyle = b.band; c.fillRect(0, 1500, TW / 2, 36); c.fillStyle = buildColor(b); c.fillRect(TW / 2, 1500, TW / 2, 36);
}

function drawStrap(b, cv, o) {
  // The canvas length is a whole number of text repeats, so the pattern tiles without a seam.
  const font = `600 40px ${o.f.mono}`, unit = `${b.strapText.toUpperCase()} · `;
  let c = cv.getContext('2d'); c.font = font;
  const w = c.measureText(unit).width, reps = Math.max(1, Math.round(512 / w));
  cv.width = 128; cv.height = Math.round(w * reps); c = cv.getContext('2d');
  const H2 = cv.height;
  c.fillStyle = b.strap; c.fillRect(0, 0, 128, H2);
  // faint lengthwise ribs in the dye, so it reads as webbing even where the light is flat
  c.fillStyle = 'rgba(0,0,0,0.07)'; for (let x = 4; x < 128; x += 8) c.fillRect(x, 0, 3, H2);
  c.fillStyle = 'rgba(255,255,255,0.035)'; for (let x = 0; x < 128; x += 8) c.fillRect(x, 0, 2, H2);
  c.save(); c.translate(64, 0); c.rotate(Math.PI / 2);
  c.fillStyle = b.strapInk || inkOn(b.strap); c.globalAlpha = b.strapInk ? 1 : 0.85; c.font = font; c.textBaseline = 'middle';
  for (let k = 0; k < reps; k++) c.fillText(unit, k * (H2 / reps), 0);
  c.restore();
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, 0, 6, H2); c.fillRect(122, 0, 6, H2);
}

function drawSwag(s, cv, o) {
  const N2 = 512, R = 256; cv.width = cv.height = N2; const c = cv.getContext('2d');
  const ink = inkOn(s.color);
  c.fillStyle = s.color; c.fillRect(0, 0, N2, N2);
  const g = c.createRadialGradient(170, 150, 10, 256, 256, 260);
  g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
  c.fillStyle = g; c.fillRect(0, 0, N2, N2);
  c.strokeStyle = ink; c.globalAlpha = 0.55; c.lineWidth = 4;
  for (const r of [222]) { c.beginPath(); c.arc(R, R, r, 0, 7); c.stroke(); }
  c.globalAlpha = 0.9; c.fillStyle = ink; c.font = `600 26px ${o.f.mono}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const ring = s.ring.repeat(Math.max(1, Math.round(54 / s.ring.length)));
  [...ring].forEach((ch, k) => { const a = k / ring.length * Math.PI * 2 - Math.PI / 2;
    c.save(); c.translate(R + Math.cos(a) * 195, R + Math.sin(a) * 195); c.rotate(a + Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); });
  c.globalAlpha = 1;
  const lines = s.big, maxW = 318;
  let size = 150;
  for (; size > 40; size -= 4) { c.font = `850 ${size}px ${o.f.display}`; if (lines.every(l => c.measureText(l).width <= maxW) && lines.length * size * 0.95 <= (s.small ? 230 : 280)) break; }
  const smallH = s.small ? 44 : 0, total = lines.length * size * 0.92 + smallH;
  let y = R - total / 2 + size * 0.46;
  lines.forEach(l => { c.fillText(l, R, y); y += size * 0.92; });
  if (s.small) { c.font = `600 44px ${o.f.body}`; c.fillText(s.small, R, y - size * 0.46 + 26); }
}

function startGL(ctx) {
  const { host: hero, canvas, data, pins: SWAG, o, $ } = ctx;
  // hero: the whole element (header slot, badge area and any overhang); the canvas covers all of it.
  // wall: the badge area, sized to the layout. The lanyards hang from the very top of the hero, behind the header.
  const wall = $('area'), headEl = $('head'), overCanvas = $('over');
  let reduce = ctx.reduce;   // switchable at runtime with the reduced-motion toggle (setReduced below)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Overhang (--lanyard-overhang): the element reaches that far below the badges, under whatever the page lays over
  // it there, so a badge dragged or swung low slides behind that content instead of being cut off. A second, see-through
  // canvas above the page draws just those low or dragged badges on top. Made only when there is an overhang. It needs
  // its own environment map, since GPU textures don't cross WebGL contexts.
  let overlay = null, overlayEnv = null, overlayDirty = false;
  const overhangPx = () => parseFloat(getComputedStyle(hero).paddingBottom) || 0;
  function ensureOverlay() {
    if (overlay || !overhangPx()) return;
    overlay = new THREE.WebGLRenderer({ canvas: overCanvas, antialias: true, alpha: true });
    overlay.setClearColor(0x000000, 0); overlay.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    overlay.toneMapping = THREE.NeutralToneMapping;
    overlayEnv = new THREE.PMREMGenerator(overlay).fromScene(new RoomEnvironment(), 0.04).texture;
    overCanvas.hidden = false;
  }
  scene.environmentIntensity = 0.75;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 0, 10);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f8c, 0.5); hemi.layers.enable(1); hemi.layers.enable(2); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(2.5, 4, 8); sun.castShadow = true; sun.layers.enable(1); sun.layers.enable(2); sun.shadow.camera.layers.enableAll();
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 6;
  scene.add(sun, sun.target);
  const shadowMat = new THREE.ShadowMaterial({ opacity: 0.24, depthWrite: false }); // never hides a card that swings back
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), shadowMat); backdrop.position.z = -2.5; backdrop.receiveShadow = true; backdrop.layers.set(2);
  scene.add(backdrop);
  // polished chrome for the badge hardware: low roughness plus a clearcoat so it picks up crisp highlights
  const shadowOnly = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); // casts shadow, draws nothing
  // Webbing, as a small tiling bump map (x across the strap, y along it): dense lengthwise threads (the warp), a fine
  // diagonal twill line running across them, and fibre noise stretched along each thread so the threads look slightly
  // uneven. No offset bump grid, which reads as a honeycomb. Light catches the threads and shifts as the strap
  // twists. Stored as a normal map; mipmapping averages it away when the strap is small on screen.
  const weave = (() => {
    const n = 64, P = 4, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const c = cv.getContext('2d'), img = c.createImageData(n, n);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // per-thread unevenness that changes slowly along its length (tiles: 8 knots per thread, smoothly interpolated)
    const knots = Array.from({ length: n / P }, () => Array.from({ length: 8 }, rnd));
    const fibre = (x, y) => { const k = knots[Math.floor(x / P)], f = y / n * 8, i = Math.floor(f), u = f - i, s2 = u * u * (3 - 2 * u);
      return k[i % 8] * (1 - s2) + k[(i + 1) % 8] * s2; };
    const ht = (x, y) => {
      x = (x + n) % n; y = (y + n) % n;
      const warp = Math.sin(Math.PI * (x % P + 0.5) / P) ** 0.8;                       // a rounded thread, edge to edge
      const twill = 0.5 + 0.5 * Math.cos(2 * Math.PI * (x + y) / 16);                // fine diagonal ridges, 4 per tile
      return warp * (0.8 + 0.2 * twill) + 0.18 * fibre(x, y);
    };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = (ht(x + 1, y) - ht(x - 1, y)) * 2.2, dy = (ht(x, y + 1) - ht(x, y - 1)) * 2.2, l = Math.hypot(dx, dy, 1), o = (y * n + x) * 4;
      img.data[o] = (-dx / l * 0.5 + 0.5) * 255; img.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.NoColorSpace;
    return t;
  })();
  // Each strap's print tile is a different length, so each gets its own copy of the weave scaled to match:
  // 16 ribs across the strap, and square weave cells along it.
  const weaveFor = cvS => { const t = weave.clone(); t.needsUpdate = true; t.repeat.set(2, 2 * cvS.height / 128); return t; };
  // The strap's cross-section, as one closed loop: a gently domed front, a round edge, a domed back, the other round
  // edge. Points are [across, through, u]: across in half-widths (-1..1), through in half-thicknesses, u for the print.
  // Shared vertices all the way round, so light rolls over the edges the way it does on woven webbing instead of
  // catching hard corners, and the print's dark border stripe wraps round the edges like binding.
  const STRAP_PROFILE = (() => {
    const T = 0.11, a = 1 - T, F = 7, A = 6, pts = [];   // T: edge radius, as a fraction of the half-width
    const dome = x => 1 + 0.35 * (1 - (x / a) ** 2);    // fullest in the middle
    for (let k = 0; k < F; k++) { const x = -a + 2 * a * k / (F - 1); pts.push([x, dome(x)]); }            // front, left to right
    for (let k = 1; k < A; k++) { const g = Math.PI / 2 - Math.PI * k / A; pts.push([a + T * Math.cos(g), Math.sin(g)]); }    // round the right edge
    for (let k = 0; k < F; k++) { const x = a - 2 * a * k / (F - 1); pts.push([x, -dome(x)]); }            // back, right to left
    for (let k = 1; k < A; k++) { const g = -Math.PI / 2 - Math.PI * k / A; pts.push([-a + T * Math.cos(g), Math.sin(g)]); }  // round the left edge
    return pts.map(([x, y]) => [x, y, Math.min(0.995, Math.max(0.005, 0.5 + 0.5 * x))]);
  })();
  const metal = new THREE.MeshPhysicalMaterial({ color: 0xc3c9d1, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.9 });
  // Foil over the printed seal: thin-film iridescence, so it shifts colour as the card turns.
  const holoMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.75, roughness: 0.2, iridescence: 1,
    iridescenceIOR: 1.9, iridescenceThicknessRange: [180, 900], transparent: true, opacity: 0.55, depthWrite: false });

  // Pin-back buttons: a shallow dome with a rolled rim, pinned to the wall behind the lanyards.
  const swagGeo = (() => {
    const prof = [];
    for (let k = 0; k <= 20; k++) { const t = k / 20; prof.push(new THREE.Vector2(t, 0.03 + 0.11 * (1 - t * t))); }
    prof.push(new THREE.Vector2(1.025, 0.0), new THREE.Vector2(1.02, -0.05), new THREE.Vector2(0.95, -0.07));
    const g = new THREE.LatheGeometry(prof, 64); g.rotateX(Math.PI / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / 2.06 + 0.5, p.getY(k) / 2.06 + 0.5);
    g.computeVertexNormals(); return g;
  })();
  const swagMeshes = SWAG.map((s, k) => {
    const cv = document.createElement('canvas'); drawSwag(s, cv, o);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const m = new THREE.Mesh(swagGeo, new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide }));
    m.castShadow = true; m.layers.set(2); // wall layer: drawn in the first pass, see renderMain()
    m.userData = { k, r: 0.3, s: 1, tilt: [-0.14, 0.1, -0.06, 0.16, -0.1][k % 5], wob: 0 };
    scene.add(m); return m;
  });
  const tip = $('tip');
  let hoverSwag = -1, tipTimer = 0;
  function setHover(k) {
    if (k === hoverSwag) return;
    hoverSwag = k; tip.hidden = k < 0;
    if (k >= 0) { $('tip-name').textContent = SWAG[k].name; $('tip-when').textContent = swagWhen(SWAG[k]); swagMeshes[k].userData.wob = 1; }
  }
  const tipV = new THREE.Vector3();
  function animateSwag() {
    for (const m of swagMeshes) {
      // hover: the pin swells a little and wobbles; with reduced motion it stays still (the tooltip still shows)
      const u = m.userData, target = u.k === hoverSwag && !reduce ? 1.12 : 1;
      u.s += (target - u.s) * 0.18; u.wob = reduce ? 0 : u.wob * 0.92;
      m.scale.setScalar(u.r * u.s);
      m.rotation.set(0, Math.sin(performance.now() / 70) * 0.12 * u.wob, u.tilt);
    }
    if (hoverSwag >= 0) {
      const m = swagMeshes[hoverSwag];
      // positioned in the hero (not the clipped wall); flips below the pin when there's no room above
      const w = hero.clientWidth, h = hero.clientHeight;
      tipV.set(m.position.x, m.position.y + m.userData.r * 1.15, m.position.z).project(camera);
      let y = (1 - tipV.y) / 2 * h;
      const x = THREE.MathUtils.clamp((tipV.x + 1) / 2 * w, tip.offsetWidth / 2 + 8, w - tip.offsetWidth / 2 - 8);
      const below = y - tip.offsetHeight - 14 < 0;
      if (below) { tipV.set(m.position.x, m.position.y - m.userData.r * 1.15, m.position.z).project(camera); y = (1 - tipV.y) / 2 * h; }
      tip.classList.toggle('below', below);
      tip.style.left = `${x}px`; tip.style.top = `${y}px`;
    }
  }
  // Buttons are sized in screen pixels (so they stay readable) and placed by layout().
  function placeSwag(lay) {
    // Pins sit on the wall well behind the furthest a swinging or flipping card can reach (about -1.2),
    // scaled out by the perspective factor so they keep the same on-screen size and position.
    const zP = -2.35, k = (camera.position.z - zP) / camera.position.z;
    swagMeshes.forEach((m, j) => { const [x, y] = lay.pins[j % lay.pins.length]; m.position.set(x * k, y * k, zP); m.userData.r = lay.pinR * k; });
  }

  // Build-view overlay materials (drawn on top of everything)
  const dbgLine = new THREE.LineBasicMaterial({ color: 0x2447c9, depthTest: false, transparent: true });
  const dbgPts = new THREE.PointsMaterial({ color: 0x2447c9, size: 7, sizeAttenuation: false, depthTest: false, transparent: true });
  let buildView = false;

  const G = -18, H = 1 / 480, N = 8, WP = 1 / 0.06, AR = 1e-6, AD = 1.6e-5; // AD: a slightly springy grip
  let worldW = 1, worldH = 1, S = 1, lanyards = [], simT = 0;
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpD = new THREE.Vector3();
  const qInv = new THREE.Quaternion(), dq = new THREE.Quaternion(), fwd = new THREE.Vector3();
  // Easter egg: wind 7 half-twists into a strap and it lets go, unspinning front side out.
  const WOUND = 7 * Math.PI;
  // Centrifugal flare while a strap unwinds. The badge spins about a line through its middle; the clip at the top is
  // the heaviest part, sitting off that line, so spinning fast it's thrown outward: the badge leans over about its
  // middle, the clip end out, and the clip circles round the middle as it turns. The lean grows with the spin rate
  // squared (FLARE radians per (rad/s)^2, so about 30 degrees at full spin) and is gone once it slows. The middle stays
  // put; this is drawn on top of the physics, so it can't knock anything or leave the badge in an odd state.
  const FLARE = 0.0009, FLARE_MAX = 0.6;
  const flareQ = new THREE.Quaternion(), flareAxis = new THREE.Vector3(1, 0, 0), drawQ = new THREE.Quaternion();
  // The goal a badge rests at: its current face (front 0, back π), on whichever turn of the strap it's already on.
  const anchorGoal = L => { const f = data[L.i].face ? Math.PI : 0; return f + 2 * Math.PI * Math.round((L.twist - f) / (2 * Math.PI)); };
  function startUnwind(L) {
    L.armed = false; L.unspin = true; L.unspinT = 0; data[L.i].face = 0; L.targetYaw = 0; L.goal = 0;
    ctx.unwound?.(L.i);
  }

  // The wall first (shadow plane + pins, layer 2), so a badge can never slip behind a pin. Shadows render once per
  // frame, in that first pass, with every badge present.
  // Then the badges (layer 0) one at a time, back to front, each with its own strap, clearing depth in between: a
  // badge further forward is painted over everything behind it. A strap crossing a neighbour therefore lies cleanly
  // over it or hides cleanly behind it, never half poking through. This is drawing only; the physics doesn't change.
  let drawOrder = [];
  function orderLanyards() {
    if (drawOrder.length !== lanyards.length || drawOrder.some((L, k) => lanyards[L.i] !== L)) drawOrder = [...lanyards];
    // Badges hanging in different layers keep their layer's order, held or not, so a badge never jumps in front of
    // the layers ahead of it. Within one layer (the single row), the deeper one draws first, and the one in hand on top.
    const key = L => L.anchor.z * 1000 + L.pos.z + (grab && grab.i === L.i ? 100 : 0);
    // Insertion sort with a small dead band, so two badges at nearly the same depth don't trade places every frame.
    for (let a = 1; a < drawOrder.length; a++)
      for (let b = a; b > 0 && key(drawOrder[b - 1]) > key(drawOrder[b]) + 0.03 * S; b--)
        [drawOrder[b - 1], drawOrder[b]] = [drawOrder[b], drawOrder[b - 1]];
  }
  const partsOf = L => [L.group, L.strap, L.strap2, L.ropeLine, L.ropePts];
  function renderMain() {
    renderer.shadowMap.needsUpdate = true; renderer.clear();
    camera.layers.set(2); renderer.render(scene, camera);
    camera.layers.set(0);
    orderLanyards();
    const shown = new Map();
    for (const L of lanyards) for (const o of partsOf(L)) { shown.set(o, o.visible); o.visible = false; }
    const dragShown = dragLine.visible; dragLine.visible = false;
    for (const L of drawOrder) {
      for (const o of partsOf(L)) o.visible = shown.get(o);
      renderer.clearDepth(); renderer.render(scene, camera);
      for (const o of partsOf(L)) o.visible = false;
    }
    for (const [o, v] of shown) o.visible = v;
    if (dragShown) {   // build view: the drag line goes over everything
      for (const o of shown.keys()) o.visible = false;
      dragLine.visible = true; renderer.clearDepth(); renderer.render(scene, camera);
      for (const [o, v] of shown) o.visible = v;
    }
  }
  function measure() {
    const w = Math.max(1, hero.clientWidth), h = Math.max(1, hero.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    ensureOverlay(); if (overlay) overlay.setSize(w, h, false);
    // one badge width = one world unit at every screen size, so physics, depth and shadows look the same everywhere
    worldH = h / plan().W; worldW = worldH * camera.aspect;
    camera.position.z = worldH / 2 / Math.tan(THREE.MathUtils.degToRad(15)); camera.far = camera.position.z + 50; camera.updateProjectionMatrix();
    const sc = sun.shadow.camera; sc.left = -worldW; sc.right = worldW; sc.top = worldH; sc.bottom = -worldH; sc.updateProjectionMatrix();
    const cs = getComputedStyle(hero);
    shadowMat.opacity = parseFloat(cs.getPropertyValue('--lanyard-shadow')) || 0.24;
    const acc = cs.getPropertyValue('--lanyard-accent').trim();
    if (acc) { dbgLine.color.set(acc); dbgPts.color.set(acc); }
  }

  // Responsive plan, worked out in CSS pixels so the card text stays readable at every width:
  //   row    (>= 1100px): one row, alternate badges hang a little lower
  //   grid   (700-1099px): two columns, the right column dropped half a step
  //   column (< 700px): one zig-zag column of full-size badges on long straps
  // The wall's height follows the plan; the volunteer buttons get their own rows under the badges.
  function plan() {
    const vw = Math.max(320, hero.clientWidth), n = data.length, P = SWAG.length;
    const mode = vw >= 1200 ? 'row' : vw >= 700 ? 'grid' : 'column';
    const clampPx = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const W = mode === 'row' ? clampPx((vw - 64) / n * 0.72, 250, 320)
      : mode === 'grid' ? clampPx(vw * 0.4, 300, 370)
      : clampPx(vw - 72, 220, 340);
    const CH = W * 1.5, gap = Math.round(W * 0.18), top = Math.round(W * 0.5);
    const cards = [];
    let bottom = 0;
    // Overlapping badges hang in layers this far apart (in badge widths), front to back. A badge turned edge-on reaches
    // half a width each way (plus its clip), so this keeps a spinning badge clear of the one in front of it, and each strap clearly
    // runs behind the badges in the layers ahead of it.
    // Long lists squeeze the layers so the deepest stays in front of the wall.
    const LAYER = Math.min(0.58, 1.75 / Math.max(1, (mode === 'grid' ? Math.ceil(n / 2) : n) - 1));
    if (mode === 'row') {
      const sp = vw / n, drop = CH * 0.16;
      for (let i = 0; i < n; i++) cards.push({ x: sp * (i + 0.5), y: top + CH / 2 + (i % 2 ? drop : 0), z: 0, row: 0 });
      bottom = top + CH + drop;
    } else if (mode === 'grid') {
      const stepY = CH + gap, edge = 24 + W / 2; // columns pushed toward the edges, leaving a channel for the pins
      for (let i = 0; i < n; i++) {
        const col = i % 2, row = Math.floor(i / 2);
        cards.push({ x: col ? vw - edge : edge, y: top + CH / 2 + row * stepY + (col ? stepY * 0.42 : 0), z: -LAYER * row, row: i });
      }
      bottom = Math.max(...cards.map(c => c.y)) + CH / 2;
    } else {
      const stepY = CH + gap, off = Math.max(0, (vw - W) / 2 - 16) * 0.6;
      for (let i = 0; i < n; i++) cards.push({ x: vw / 2 + (i % 2 ? off : -off), y: top + CH / 2 + i * stepY, z: -LAYER * i, row: i });
      bottom = top + CH / 2 + (n - 1) * stepY + CH / 2;
    }
    // Volunteer pins: in the gaps between lanyards when they fit with clear space around them,
    // otherwise in rows under the badges with enough clearance that a hanging card can't cover them.
    const pins = [];
    let pinD, height;
    const rowGap = mode === 'row' ? vw / n - W : mode === 'grid' ? vw - 48 - 2 * W : 0;
    if (mode === 'row' && n >= 3 && rowGap >= 92) {
      pinD = Math.min(118, rowGap - 22);
      const sp = vw / n, g = k => sp * (k + 1);
      const yHi = top + CH * 0.32, yLo = top + CH * 0.32 + pinD * 1.35;
      const spots = [[g(0), yHi], [g(1), yLo], [g(n - 2), yHi], [g(1), yHi - pinD * 1.35 < top ? yLo + pinD * 1.35 : yHi - pinD * 1.35], [g(0), yLo]];
      for (let k = 0; k < P; k++) pins.push({ x: spots[k % spots.length][0], y: spots[k % spots.length][1] });
      height = Math.round(Math.max(bottom, ...pins.map(p => p.y + pinD / 2)) + 90);
    } else if (mode === 'grid' && rowGap >= 84) {
      pinD = Math.min(110, rowGap - 20);
      const pitchY = pinD * 1.35, y0 = top + CH * 0.35;
      for (let k = 0; k < P; k++) pins.push({ x: vw / 2, y: y0 + k * pitchY });
      height = Math.round(Math.max(bottom, ...pins.map(p => p.y + pinD / 2)) + 90);
    } else {
      pinD = mode === 'column' ? clampPx(vw * 0.22, 80, 104) : clampPx(vw * 0.075, 88, 120);
      const pitch = pinD * 1.3, perRow = Math.max(1, Math.min(P, Math.floor((vw - 32) / pitch))), pinRows = Math.ceil(P / perRow);
      const clear = 34 + CH * 0.03; // a little room under the last card (it sits a touch higher than planned: it hangs further back)
      for (let k = 0; k < P; k++) {
        const r = Math.floor(k / perRow), cnt = Math.min(perRow, P - r * perRow), idx = k - r * perRow;
        pins.push({ x: vw / 2 + (idx - (cnt - 1) / 2) * pitch, y: bottom + clear + pinD / 2 + r * pitch });
      }
      height = Math.round(bottom + clear + pinRows * pitch + 40);
    }
    return { mode, W, cards, pins, pinD, height };
  }
  function layout() {
    const pl = plan(), pxU = hero.clientHeight / worldH, head = wall.offsetTop;
    const wx = x => -worldW / 2 + x / pxU, wy = y => worldH / 2 - (head + y) / pxU;
    const S = pl.W / pxU;
    // A badge hung further back looks closer to the middle of the view, so place it out by the same factor: then it
    // shows where the plan put it, and the gap above the pins stays what the plan meant, however deep the layers go.
    const camZ = worldH / 2 / Math.tan(THREE.MathUtils.degToRad(15)), deep = z => (camZ - z) / camZ;
    const slots = pl.cards.map(c => ({ row: c.row, center: new THREE.Vector3(wx(c.x) * deep(c.z), wy(c.y) * deep(c.z), c.z),
      anchor: new THREE.Vector3(wx(c.x) * deep(c.z), (worldH / 2) * deep(c.z) + 0.55, c.z) })); // just above the top edge, so the twisted part of the strap stays in view (shadows: see shadowTail)
    return { cols: pl.mode, S, slots, pins: pl.pins.map(p => [wx(p.x), wy(p.y)]), pinR: pl.pinD / 2 / pxU };
  }
  // size the wall to the plan before measuring the canvas
  // Wall height = planned layout + any extra the fit check below found was needed. The extra resets when the width changes.
  let extraPad = 0, padForW = 0;
  function sizeWall() {
    const w = hero.clientWidth; if (w !== padForW) { padForW = w; extraPad = 0; }
    const h = (plan().height + extraPad) + 'px'; if (wall.style.height !== h) wall.style.height = h;
  }
  // Safety net: if any card corner hangs closer than 28px to the bottom of the hero, grow the wall to fit.
  const corner = new THREE.Vector3();
  function lowestCardPx() {
    const pxU = hero.clientHeight / worldH; let lowest = 0;
    for (const L of lanyards) for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) {
      corner.set(sx * L.CW, sy * L.CH, 0).applyQuaternion(L.q).add(L.pos);
      const y = (corner.y - (L.introOff || 0)) * camera.position.z / (camera.position.z - corner.z);   // as seen, in perspective
      lowest = Math.max(lowest, (worldH / 2 - y) * pxU);   // where it will rest, ignoring the load-in lift
    }
    return lowest;
  }
  // Cards being dragged, or hanging below the badge area into the overhang, also join layer 1 so the overlay draws
  // them over the page there. The overlay is clipped below the header, so a badge never pops in front of it.
  function renderOverlay() {
    if (!overlay) return;
    const pxU = hero.clientHeight / worldH, limit = wall.offsetTop + wall.clientHeight - 2;
    let any = false;
    for (const L of lanyards) {
      let low = 0;
      for (const sx of [-0.5, 0.5]) for (const sy of [-0.5, 0.5]) {
        corner.set(sx * L.CW, sy * L.CH, 0).applyQuaternion(L.q).add(L.pos);
        low = Math.max(low, (worldH / 2 - corner.y * camera.position.z / (camera.position.z - corner.z)) * pxU);
      }
      const lift = (grab && grab.i === L.i) || low > limit;
      if (lift !== !!L.lifted) { L.lifted = lift; L.group.traverse(o => lift ? o.layers.enable(1) : o.layers.disable(1)); }
      any = any || lift;
    }
    if (!any) { if (overlayDirty) { overlay.clear(); overlayDirty = false; } return; }
    overCanvas.style.clipPath = `inset(${Math.max(0, Math.round(headEl.offsetTop + headEl.offsetHeight))}px 0 0 0)`;
    const env = scene.environment; scene.environment = overlayEnv; camera.layers.set(1);
    const vis = lanyards.map(L => L.group.visible); lanyards.forEach(L => { L.group.visible = !!L.lifted; });
    overlay.render(scene, camera);
    lanyards.forEach((L, k) => { L.group.visible = vis[k]; });
    camera.layers.set(0); scene.environment = env; overlayDirty = true;
  }
  // Keep each keyboard hit box laid over its badge (rotated rectangle) and pin (circle), in hero-relative pixels.
  const hitP = new THREE.Vector3(), hitA = new THREE.Vector3(), hitB = new THREE.Vector3(), hitR = new THREE.Vector3();
  const toPx = v => { v.project(camera); return [(v.x + 1) / 2 * hero.clientWidth, (1 - v.y) / 2 * hero.clientHeight]; };
  function placeHits() {
    const bh = ctx.root.querySelectorAll('.badge-hit');
    lanyards.forEach((L, i) => {
      const el = bh[i]; if (!el) return;
      const [cx, cy] = toPx(hitP.copy(L.pos));
      const [ax, ay] = toPx(hitA.set(L.CW / 2, 0, 0).applyQuaternion(L.q).add(L.pos));
      const [bx, by] = toPx(hitB.set(0, L.CH / 2, 0).applyQuaternion(L.q).add(L.pos));
      const w = Math.max(24, 2 * Math.hypot(ax - cx, ay - cy)), h = Math.max(24, 2 * Math.hypot(bx - cx, by - cy));
      const ang = Math.atan2(cx - bx, cy - by);   // the card's tilt on screen
      el.style.width = `${w}px`; el.style.height = `${h}px`;
      el.style.transform = `translate(${cx - w / 2}px, ${cy - h / 2}px) rotate(${-ang}rad)`;
    });
    const ph = ctx.root.querySelectorAll('.pin-hit');
    swagMeshes.forEach((m, k) => {
      const el = ph[k]; if (!el) return;
      const [cx, cy] = toPx(hitP.copy(m.position));
      const [ex] = toPx(hitA.copy(m.position).add(hitR.set(m.userData.r, 0, 0)));
      const d = Math.max(24, 2 * Math.abs(ex - cx));
      el.style.width = el.style.height = `${d}px`;
      el.style.transform = `translate(${cx - d / 2}px, ${cy - d / 2}px)`;
    });
  }
  function fitCheck(first) {
    if (grab) return; // a card being dragged can go anywhere; only settled cards count
    // A swinging or tilted card dips lower than it will rest, so growing the wall for it would make the page taller (and
    // can add a scrollbar) every time someone pushed a badge sideways. Only measure once every card has come to rest.
    if (!first) for (const L of lanyards) if (L.vel.length() > 0.3 * S || L.ang.length() > 0.3 || L.unspin) return;
    const lowest = lowestCardPx();
    const need = lowest + 28 - (wall.offsetTop + wall.clientHeight); // settled cards stay inside the badge area, above any overhang
    if (need > 0) { extraPad += Math.ceil(need) + 24; sizeWall(); }
  }

  function cardShape(w, h, r) {
    const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function slotPath(cx, cy, w, h) {
    const p = new THREE.Path(), r = h / 2;
    p.moveTo(cx - w / 2 + r, cy - r); p.lineTo(cx + w / 2 - r, cy - r); p.absarc(cx + w / 2 - r, cy, r, -Math.PI / 2, Math.PI / 2, false);
    p.lineTo(cx - w / 2 + r, cy + r); p.absarc(cx - w / 2 + r, cy, r, Math.PI / 2, Math.PI * 1.5, false); return p;
  }

  let builtS = 1, builtCols = 0;
  function build(intro) {
    lanyards.forEach(L => {
      L.group.traverse(o => { o.geometry?.dispose(); });
      scene.remove(L.group, L.strap, L.strap2, L.shadowTail, L.ropeLine, L.ropePts);
      L.strap.geometry.dispose(); L.strap2.geometry.dispose(); L.ropeGeo.dispose();
    });
    lanyards = []; const lay = layout(); S = lay.S; builtS = S; builtCols = lay.cols;
    const CW = 1 * S, CH = 1.5 * S, D = 0.012 * S, BEV = 0.006 * S, slotY = CH / 2 - 0.11 * S;
    const shape = cardShape(CW, CH, 0.07 * S); shape.holes.push(slotPath(0, slotY, 0.3 * S, 0.055 * S));
    const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: BEV, bevelSize: BEV, bevelSegments: 3, curveSegments: 14 });
    bodyGeo.translate(0, 0, -D / 2);
    const faceGeo = new THREE.ShapeGeometry(shape, 14);
    const pos = faceGeo.attributes.position, uv = faceGeo.attributes.uv;
    for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + CW / 2) / CW, (pos.getY(k) + CH / 2) / CH);
    const FZ = D / 2 + BEV + 0.0015;
    // Hardware: a strap clip like a real ID-badge clip, in polished chrome. A front plate sits on the card face over
    // the slot, its tongue passes through the slot to a small back tab, a D-ring threads through the top of the plate,
    // and the strap ends in a metal cap on that ring.
    const plateW = 0.12 * S, plateH = 0.17 * S, plateD = 0.02 * S, plateBot = slotY + 0.008 * S, plateTop = plateBot + plateH;
    const plateGeo = new RoundedBoxGeometry(plateW, plateH, plateD, 4, 0.0095 * S);
    const panelGeo = new RoundedBoxGeometry(plateW * 0.62, plateH * 0.52, 0.008 * S, 2, 0.003 * S);    // raised centre panel
    const ridgeGeo = new RoundedBoxGeometry(plateW * 0.62, 0.008 * S, 0.006 * S, 2, 0.002 * S);         // grip ridges
    const tongueGeo = new RoundedBoxGeometry(plateW * 0.75, 0.03 * S, 2 * FZ + 0.05 * S, 2, 0.006 * S); // through the slot
    // back plate mirrors the front, and a bridge over the card's top edge joins them, so it's one clip from either side
    const backH = plateTop - (slotY - 0.012 * S);
    const backGeo = new RoundedBoxGeometry(plateW * 0.96, backH, plateD * 0.8, 4, 0.0085 * S);
    const edgeY = CH / 2 + 0.004 * S, bridgeH = plateTop - edgeY;
    const bridgeGeo = new RoundedBoxGeometry(plateW, bridgeH, 2 * (FZ + plateD) + 0.006 * S, 4, Math.min(0.0095 * S, bridgeH * 0.45));
    const dR = 0.03 * S, dCy = plateTop + 0.012 * S, dTop = dCy + dR;
    const dGeo = new THREE.TorusGeometry(dR, 0.0085 * S, 10, 28);
    const capH = 0.055 * S, capCy = dTop + capH / 2 - 0.012 * S;
    const capGeo = new RoundedBoxGeometry(0.13 * S, capH, 0.03 * S, 4, 0.013 * S);
    const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 30);
    const holoGeo = new THREE.CircleGeometry(SEAL.r / TW * CW, 48);
    const c = 0.09 * S;
    const comGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-c, 0, 0), new THREE.Vector3(c, 0, 0), new THREE.Vector3(0, -c, 0), new THREE.Vector3(0, c, 0)]);
    const hang = new THREE.Vector3(0, capCy + capH * 0.2, 0);
    const tailGeo = new THREE.BoxGeometry(0.16 * S, 8, 0.03 * S).translate(0, 4, 0);  // from the anchor up, well past the top // strap ends inside the cap, so no gap shows
    const mass = 1, T = 2 * (D / 2 + BEV);
    const Iinv = new THREE.Vector3(12 / (mass * (CH * CH + T * T)), 12 / (mass * (CW * CW + T * T)), 12 / (mass * (CW * CW + CH * CH)));

    data.forEach((b, i) => {
      const cvF = document.createElement('canvas'), cvB = document.createElement('canvas'), cvS = document.createElement('canvas');
      drawFront(b, i, cvF, o); drawBack(b, i, cvB, o); drawStrap(b, cvS, o);
      const mkTex = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
      const tF = mkTex(cvF), tB = mkTex(cvB), tS = mkTex(cvS); tS.wrapT = THREE.RepeatWrapping; tS.flipY = false;
      const faceMat = map => new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.14, iridescence: 0.22, iridescenceIOR: 1.3 });
      const edgeMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(shade(b.color, -0.12)), roughness: 0.4, clearcoat: 0.8 });
      const group = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, edgeMat); body.castShadow = true;
      const front = new THREE.Mesh(faceGeo, faceMat(tF)); front.position.z = FZ;
      const back = new THREE.Mesh(faceGeo, faceMat(tB)); back.position.z = -FZ; back.rotation.y = Math.PI;
      const clip = new THREE.Group();
      const part = (geo, x, y, z) => { const m = new THREE.Mesh(geo, metal); m.position.set(x, y, z); m.castShadow = true; clip.add(m); return m; };
      const pz = FZ + plateD / 2 + 0.002 * S;
      part(plateGeo, 0, plateBot + plateH / 2, pz);
      part(panelGeo, 0, plateBot + plateH * 0.52, pz + plateD / 2 + 0.002 * S);
      for (const k of [-1, 1]) part(ridgeGeo, 0, plateBot + plateH * (0.52 + k * 0.36), pz + plateD / 2 + 0.002 * S);
      part(tongueGeo, 0, slotY, 0);
      part(backGeo, 0, plateTop - backH / 2, -(FZ + plateD * 0.4 + 0.002 * S));
      part(bridgeGeo, 0, edgeY + bridgeH / 2, 0);
      part(dGeo, 0, dCy, 0).rotation.y = Math.PI / 2;   // centred on the clip, front to back, under the cap
      part(capGeo, 0, capCy, 0);
      const ring = clip;
      const outline = new THREE.LineSegments(edgeGeo, dbgLine); outline.renderOrder = 10;
      const com = new THREE.LineSegments(comGeo, dbgLine); com.renderOrder = 10;
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.set((SEAL.x / TW - 0.5) * CW, (0.5 - SEAL.y / TH) * CH, FZ + 0.0008);
      [body, front, back].forEach(m => m.userData.idx = i);
      group.add(body, front, back, holo, ring, clip, outline, com); scene.add(group);

      const SEG = 260; // fine enough that 7+ tight twists stay smooth (and sampled densest near the clip, see syncMeshes)
      const sg = new THREE.BufferGeometry();
      // A thin band with a rounded cross-section (STRAP_PROFILE): edge-on twists show a soft, solid edge, not a hairline.
      const RV = STRAP_PROFILE.length;
      sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * RV * 3), 3));
      sg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((SEG + 1) * RV * 2), 2));
      const idx = [];
      for (let k = 0; k < SEG; k++) for (let a = 0; a < RV; a++) {
        const b = (a + 1) % RV, a0 = k * RV + a, b0 = k * RV + b, a1 = a0 + RV, b1 = b0 + RV;
        idx.push(a0, b0, a1, b0, b1, a1);
      }
      sg.setIndex(idx);
      // Fabric: matte, with a soft sheen at grazing angles (the fuzzy glow along a fold, not a hard highlight), so a
      // twist shades gradually from lit to dark. The weave adds texture that moves with the light.
      const strapMat = new THREE.MeshPhysicalMaterial({ map: tS, roughness: 0.88, normalMap: weaveFor(cvS), normalScale: new THREE.Vector2(0.55, 0.55),
        sheen: 0.7, sheenRoughness: 0.55, sheenColor: new THREE.Color(shade(b.strap, 0.45)), envMapIntensity: 0.55, side: THREE.DoubleSide });
      const strap = new THREE.Mesh(sg, strapMat);
      strap.castShadow = true; strap.frustumCulled = false; scene.add(strap);
      // a lanyard is a loop: the second strap is drawn from the same simulated rope, offset behind the first
      const strap2 = new THREE.Mesh(sg.clone(), strapMat);
      strap2.castShadow = true; strap2.frustumCulled = false; scene.add(strap2);
      // The straps attach just above the top edge, but their shadows fall lower than the straps themselves, so the
      // shadow tops would show. An invisible column above each anchor carries the shadow on up and off the page:
      // it writes no colour or depth, so it draws nothing, but it still renders into the shadow map.
      const shadowTail = new THREE.Mesh(tailGeo, shadowOnly);
      shadowTail.castShadow = true; shadowTail.frustumCulled = false; scene.add(shadowTail);

      const ropeGeo = new THREE.BufferGeometry();
      ropeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((N + 1) * 3), 3));
      const ropeLine = new THREE.Line(ropeGeo, dbgLine), ropePts = new THREE.Points(ropeGeo, dbgPts);
      [ropeLine, ropePts].forEach(o => { o.renderOrder = 11; o.frustumCulled = false; scene.add(o); });

      const slot = lay.slots[i], anchor = slot.anchor.clone();
      const strapLen = anchor.y - (slot.center.y + hang.y);
      const rest = strapLen / (N - 1);
      const dir = intro && !reduce ? new THREE.Vector3(0.92, -0.38, 0).normalize() : new THREE.Vector3(0, -1, 0);
      const x = [], prev = [];
      for (let k = 0; k < N; k++) { const p = anchor.clone().addScaledVector(dir, rest * k); x.push(p); prev.push(p.clone()); }
      const q = new THREE.Quaternion(); if (b.face) q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      const posB = x[N - 1].clone().sub(hang.clone().applyQuaternion(q));
      lanyards.push({
        i, row: slot.row, group, strap, strap2, shadowTail, SEG, RV, holo, tex: { tF, tB, tS, cvF, cvB, cvS }, edgeMat,
        mats: [edgeMat, front.material, back.material, strapMat], overlays: [outline, com, ropeLine, ropePts],
        ropeGeo, ropeLine, ropePts, pick: [body, front, back],
        anchor, x, prev, rest, hang, mass, Iinv, CW, CH,
        half: new THREE.Vector3(CW / 2, CH / 2, T / 2 + 0.006 * S), reach: Math.hypot(CW, CH) / 2 + 0.05 * S,
        pos: posB, prevPos: posB.clone(), vel: new THREE.Vector3(), q, prevQ: q.clone(), ang: new THREE.Vector3(),
        targetYaw: b.face ? Math.PI : 0, goal: b.face ? Math.PI : 0, twist: b.face ? Math.PI : 0, lastYaw: b.face ? Math.PI : 0, holdUntil: intro && !reduce ? 0.25 + i * 0.16 : 0,
        curve: new THREE.CatmullRomCurve3(x.map(v => v.clone()), false, 'centripetal'),
      });
    });
    placeSwag(lay);
    applyView();
  }

  function applyView() {
    for (const L of lanyards) {
      L.overlays.forEach(o => { o.visible = buildView; });
      L.holo.visible = !buildView && !data[L.i].frontImg;
      L.mats.forEach(m => { m.transparent = buildView; m.opacity = buildView ? 0.32 : 1; m.depthWrite = !buildView; m.needsUpdate = true; });
    }
    for (const m of swagMeshes) { const mt = m.material; mt.transparent = buildView; mt.opacity = buildView ? 0.32 : 1; mt.depthWrite = !buildView; mt.needsUpdate = true; }
    dragLine.visible = false;
    $('hud-n').textContent = String(lanyards.length);
  }

  /* physics helpers */
  // Oriented-box overlap by separating-axis test. Returns 0 when apart; otherwise the overlap depth, with satN set to
  // the push direction (unit length, pointing from A toward B).
  const satA = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], satB = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const satT = new THREE.Vector3(), satN = new THREE.Vector3(), satC = new THREE.Vector3(), satM = new THREE.Matrix4();
  const satProj = (ax, hf, n) => Math.abs(ax[0].dot(n)) * hf.x + Math.abs(ax[1].dot(n)) * hf.y + Math.abs(ax[2].dot(n)) * hf.z;
  // Let the strap stretch while dragging (it's part of the feel), but only so far: past ~40% the stored stretch
  // would slingshot the card on release.
  const reachV = new THREE.Vector3();
  function clampReach(L, p) {
    if (!grab) return;
    const max = L.rest * (N - 1) * 1.4 + reachV.copy(grab.local).sub(L.hang).length(); // up to 40% stretch
    reachV.subVectors(p, L.anchor); const d = reachV.length();
    if (d > max) p.copy(L.anchor).addScaledVector(reachV, max / d);
  }
  // a card's half-extent along each world axis (accounting for tilt and spin)
  const extA = new THREE.Vector3(), extB = new THREE.Vector3(), extM = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  function worldExtent(L, out) {
    satM.makeRotationFromQuaternion(L.q).extractBasis(extM[0], extM[1], extM[2]);
    const hx = L.half.x, hy = L.half.y, hz = L.half.z, [u, v, w] = extM;
    return out.set(Math.abs(u.x) * hx + Math.abs(v.x) * hy + Math.abs(w.x) * hz,
                   Math.abs(u.y) * hx + Math.abs(v.y) * hy + Math.abs(w.y) * hz,
                   Math.abs(u.z) * hx + Math.abs(v.z) * hy + Math.abs(w.z) * hz);
  }
  // how far a card reaches along world z (half its depth, accounting for tilt and spin)
  function zExtent(L) {
    satM.makeRotationFromQuaternion(L.q).extractBasis(satA[0], satA[1], satA[2]);
    return Math.abs(satA[0].z) * L.half.x + Math.abs(satA[1].z) * L.half.y + Math.abs(satA[2].z) * L.half.z;
  }
  function boxOverlap(A, B) {
    satM.makeRotationFromQuaternion(A.q).extractBasis(satA[0], satA[1], satA[2]);
    satM.makeRotationFromQuaternion(B.q).extractBasis(satB[0], satB[1], satB[2]);
    satT.subVectors(B.pos, A.pos);
    let best = Infinity;
    const test = n => {
      const len = n.length(); if (len < 1e-3) return true; // near-parallel edges: covered by the face axes
      n.divideScalar(len);
      const d = satT.dot(n), o = satProj(satA, A.half, n) + satProj(satB, B.half, n) - Math.abs(d);
      if (o <= 0) return false;
      if (o < best) { best = o; satN.copy(n); if (d < 0) satN.negate(); }
      return true;
    };
    for (let i = 0; i < 3; i++) { if (!test(satC.copy(satA[i])) || !test(satC.copy(satB[i]))) return 0; }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (!test(satC.crossVectors(satA[i], satB[j]))) return 0;
    return best;
  }
  function iInvWorld(L, v, out) { qInv.copy(L.q).invert(); out.copy(v).applyQuaternion(qInv).multiply(L.Iinv).applyQuaternion(L.q); return out; }
  function genInvMass(L, r, n) { tmpC.crossVectors(r, n); iInvWorld(L, tmpC, tmpD); return 1 / L.mass + tmpC.dot(tmpD); }
  function correctBody(L, r, P) {
    L.pos.addScaledVector(P, 1 / L.mass);
    tmpC.crossVectors(r, P); iInvWorld(L, tmpC, tmpD);
    dq.set(tmpD.x, tmpD.y, tmpD.z, 0).multiply(L.q);
    L.q.x += 0.5 * dq.x; L.q.y += 0.5 * dq.y; L.q.z += 0.5 * dq.z; L.q.w += 0.5 * dq.w; L.q.normalize();
  }
  function integrateQ(q, w, h) {
    dq.set(w.x, w.y, w.z, 0).multiply(q);
    q.x += 0.5 * h * dq.x; q.y += 0.5 * h * dq.y; q.z += 0.5 * h * dq.z; q.w += 0.5 * h * dq.w; q.normalize();
  }
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));

  let grab = null; // { i, local, z, target, sx, sy, t, moved }
  const dragGeo = new THREE.BufferGeometry(); dragGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const dragLine = new THREE.Line(dragGeo, dbgLine); dragLine.renderOrder = 12; dragLine.frustumCulled = false; dragLine.visible = false;
  scene.add(dragLine);

  function step(h) {
    simT += h;
    const breeze = reduce ? 0 : 0.5;
    for (const L of lanyards) {
      L.x[0].copy(L.anchor); L.prev[0].copy(L.anchor);
      if (L.holdUntil > simT) continue;
      for (let k = 1; k < N; k++) {
        const x = L.x[k], p = L.prev[k];
        tmpA.subVectors(x, p).multiplyScalar(1 - (reduce ? 6 : 0.8) * h); p.copy(x); x.add(tmpA);
        x.y += G * h * h; x.x += Math.sin(simT * 0.8 + k * 0.6 + L.i * 2.1) * breeze * h * h;
      }
      L.prevPos.copy(L.pos); L.prevQ.copy(L.q);
      L.vel.y += G * h; L.vel.x += Math.sin(simT * 0.55 + L.i * 1.7) * breeze * 0.4 * h;
      fwd.set(0, 0, 1).applyQuaternion(L.q);
      const err = wrapA(Math.atan2(fwd.x, fwd.z) - L.targetYaw);
      // When a hard pull tips the card nearly flat, its facing has almost no horizontal part and the yaw angle is
      // noise that flips by ±π. Fade the face-out spring to zero there so it can't fire a wild spin.
      const flat = Math.hypot(fwd.x, fwd.z), trust = Math.min(1, Math.max(0, (flat - 0.25) / 0.35));
      const held = grab && grab.i === L.i;
      const K = held ? 4 : 36;
      if (L.unspin) {
        // Unwinding: the wound strap acts as a torsion spring releasing its tension. The pull eases in over the first
        // 0.7 s, as a twisted strap takes a beat to start turning, then it accelerates to full speed. Over the last
        // turn and a half, drag builds, so it slows a little before the end and eases into its rest position with
        // only a slight settle past straight (about 1.4 s of spin, 2.5 s in all, not a fixed speed).
        L.unspinT = (L.unspinT || 0) + h;
        const r = Math.min(1, L.unspinT / 0.7), ease = r * r * (3 - 2 * r);
        const near = Math.min(1, Math.abs(L.twist) / (3 * Math.PI)), brake = 1 - near * near * (3 - 2 * near);
        const kU = reduce ? 1.2 : 2.6 * ease, cU = reduce ? 2 : 2.8 * brake;
        L.ang.y += (-kU * L.twist - cU * L.ang.y) * h;
        if ((Math.abs(L.twist) < 0.25 && Math.abs(L.ang.y) < 0.6) || L.unspinT > 8) { L.unspin = false; L.unspinT = 0; L.goal = anchorGoal(L); }
      } else if (reduce) L.ang.y += (-K * err * trust - 4.5 * L.ang.y) * h;
      else {
        // Clicks wind toward an unwrapped goal, a half-turn further the same way each time. Fast clicks therefore
        // stack up and speed the spin (the pull grows with how far behind the badge is) instead of undoing each other.
        if (held) { L.goal = anchorGoal(L); L.armed = false; }   // turning it by hand resets what counts as wound
        if (L.armed && Math.abs(L.twist) >= WOUND - 0.05) {
          // Past the 7th half-turn: no more pull, so a fast spin coasts on a little further. Once it stalls, the strap lets go.
          L.ang.y -= 2.5 * L.ang.y * h;
          if (L.ang.y * Math.sign(L.twist) < 1.5) startUnwind(L);
        } else {
          const e = Math.max(-2 * Math.PI, Math.min(2 * Math.PI, L.twist - L.goal));
          // The 7th half-turn (armed) is pulled in harder and whips round faster, so the unwind reads as its bounce back.
          const Kt = L.armed ? K * 1.6 : K;
          L.ang.y += (-Kt * e * trust - 4.5 * L.ang.y) * h;
          if (L.armed && Math.abs(e) < 0.3 && Math.abs(L.ang.y) < 1) startUnwind(L);   // a slow arrival at the 7th
        }
      }
      L.vel.multiplyScalar(1 - 0.3 * h); L.ang.multiplyScalar(1 - 1.4 * h);
      // reduced motion: critically damped (about 2x the pendulum's natural frequency), so a badge glides straight
      // back to rest without swinging past it; together with no fling on release, ~95% less movement
      if (reduce) { L.vel.multiplyScalar(1 - 5.5 * h); L.ang.multiplyScalar(1 - 8 * h); }
      // The held point acts like a pin the card could whip around under strap tension, so a held card gets heavy
      // rotational damping and a low spin cap: it eases into its new angle instead of pivoting violently.
      if (held) L.ang.multiplyScalar(1 - 9 * h);
      const cap = held ? 7 : 24, spin = L.ang.length(); if (spin > cap) L.ang.multiplyScalar(cap / spin);
      L.pos.addScaledVector(L.vel, h); integrateQ(L.q, L.ang, h);
    }
    for (let it = 0; it < 2; it++) for (const L of lanyards) {
      if (L.holdUntil > simT) continue;
      // Twisting takes up length, as it does in a real lanyard: each half-turn hitches the badge up a little.
      // Eased, so the badge rises (and drops back as it unwinds) instead of jumping. The twisted stretch is about the
      // same length on every strap, so the lift is a set distance per half-turn, not a share of the strap: a badge on
      // a long strap (lower in a stack) rises no more than one on a short one.
      if (it === 0) {
        const lift = Math.min(0.15, 0.03 * Math.abs(L.twist) / Math.PI) * S / (L.rest * (N - 1));
        L.shrink = (L.shrink || 0) + (Math.min(0.17, lift) - (L.shrink || 0)) * Math.min(1, 5 * h);
      }
      const rest = L.rest * (1 - L.shrink);
      for (let k = 0; k < N - 1; k++) {
        const a = L.x[k], b = L.x[k + 1], wa = k === 0 ? 0 : WP;
        tmpA.subVectors(b, a); const len = tmpA.length(); if (len < 1e-6) continue;
        const lam = -(len - rest) / (wa + WP + AR / (h * h));
        tmpA.multiplyScalar(lam / len); a.addScaledVector(tmpA, -wa); b.addScaledVector(tmpA, WP);
      }
      const p = L.x[N - 1];
      const r = tmpB.copy(L.hang).applyQuaternion(L.q);
      tmpA.copy(L.pos).add(r).sub(p); const C = tmpA.length();
      if (C > 1e-7) {
        tmpA.divideScalar(C);
        const lam = -C / (WP + genInvMass(L, r, tmpA));
        tmpA.multiplyScalar(lam); const P = tmpA.clone();
        correctBody(L, r, P); p.addScaledVector(P, -WP);
      }
      if (grab && grab.i === L.i && grab.target) {
        const r2 = tmpB.copy(grab.local).applyQuaternion(L.q);
        tmpA.copy(L.pos).add(r2).sub(grab.target); const C2 = tmpA.length();
        if (C2 > 1e-7) {
          tmpA.divideScalar(C2);
          const lam = -C2 / (genInvMass(L, r2, tmpA) + AD / (h * h));
          correctBody(L, r2, tmpA.multiplyScalar(lam).clone());
        }
      }
    }
    // Card contact, two ways. Side by side (they meet edge to edge, roughly in the same plane): the original sideways
    // bump, with momentum, so a neighbour gets knocked and swings. Shoved deep into each other or meeting face to face:
    // layered in depth with no momentum (the held card comes forward), so they never visibly intersect.
    const contacts = [], handContacts = [];
    for (let a = 0; a < lanyards.length; a++) for (let b = a + 1; b < lanyards.length; b++) {
      const A = lanyards[a], B = lanyards[b]; if (A.holdUntil > simT || B.holdUntil > simT) continue;
      if (A.pos.distanceTo(B.pos) > A.reach + B.reach) continue;
      const eA = worldExtent(A, extA), eB = worldExtent(B, extB);
      const ox = eA.x + eB.x - Math.abs(B.pos.x - A.pos.x), oy = eA.y + eB.y - Math.abs(B.pos.y - A.pos.y);
      if (ox <= 0 || oy <= 0) continue;                   // not overlapping on screen
      const ga = grab && grab.i === A.i, gb = grab && grab.i === B.i; // the dragged card doesn't yield
      const wa = ga ? 0 : gb ? 1 : 0.5, wb = gb ? 0 : ga ? 1 : 0.5;
      if (Math.abs(B.pos.z - A.pos.z) < 0.3 * S && ox < 0.35 * Math.min(A.CW, B.CW)) {
        const sx = Math.sign(B.pos.x - A.pos.x) || 1;
        if (ga || gb) {
          // A hand far outweighs a badge: the badge it pushes just moves out of the way. The push moves its previous
          // position too, so it adds no speed of its own; the badge is then carried at the hand's speed (see below).
          const P = ga ? B : A, dir = ga ? sx : -sx, c = Math.min(ox, 0.02 * S);
          P.pos.x += c * dir; P.prevPos.x += c * dir;
          handContacts.push([P, ga ? A : B, dir, 'x']);
        } else {
          const corr = Math.min(ox * 0.04, 0.0015 * S);
          A.pos.x -= corr * sx * wa; B.pos.x += corr * sx * wb;
          contacts.push([A, B, sx]);
        }
      } else if (boxOverlap(A, B)) {
        const need = eA.z + eB.z - Math.abs(B.pos.z - A.pos.z); if (need <= 0) continue;
        // +1: B goes in front of A. Badges from different layers keep their layers' order; in the same layer the
        // one in hand comes forward.
        const dl = B.anchor.z - A.anchor.z;
        const sgn = Math.abs(dl) > 0.01 ? Math.sign(dl) : ga ? -1 : gb ? 1 : Math.sign(B.pos.z - A.pos.z) || 1;
        const dz = Math.min(need + 0.004 * S, 0.012 * S) * sgn;
        A.pos.z -= dz * wa; A.prevPos.z -= dz * wa; B.pos.z += dz * wb; B.prevPos.z += dz * wb;
        if (ga) handContacts.push([B, A, sgn, 'z']); else if (gb) handContacts.push([A, B, -sgn, 'z']);
      }
    }
    for (const L of lanyards) { L.pos.z = Math.min(0.7, Math.max(-2.2, L.pos.z)); } // stays off the wall and doesn't lunge at the viewer
    for (const L of lanyards) {
      if (L.holdUntil > simT) continue;
      L.vel.subVectors(L.pos, L.prevPos).divideScalar(h);
      dq.copy(L.q).multiply(qInv.copy(L.prevQ).invert());
      L.ang.set(dq.x, dq.y, dq.z).multiplyScalar(2 / h); if (dq.w < 0) L.ang.negate();
    }
    // A badge pushed by the hand moves at least as fast as the hand pushes it, and the push itself adds nothing more.
    // Its strap pulling back against the hand can't store up speed either, so when the hand eases off, or slides
    // past its edge, the badge doesn't spring away: it just swings from where it was left. A fast hit still knocks it
    // on a little faster than the hand moved (up to 30% more, from 1 badge-width a second up to 3).
    for (const [P, Hd, dir, ax] of handContacts) {
      const vH = Hd.vel[ax] * dir, vP = P.vel[ax] * dir;
      const hit = Math.min(1, Math.max(0, (vH / S - 1) / 2)), want = vH * (1 + 0.3 * hit);
      if (vP < want) P.vel[ax] += (want - vP) * dir;
    }
    for (const [A, B, sx] of contacts) {
      const rel = (B.vel.x - A.vel.x) * sx;          // < 0 means they're closing
      if (rel < 0) { const imp = rel * 0.45; A.vel.x += imp * sx; B.vel.x -= imp * sx; }
      const sep = (B.vel.x - A.vel.x) * sx;          // cap how fast contact can push them apart
      const maxSep = 0.6 * S;
      if (sep > maxSep) { const k = (sep - maxSep) * 0.5; A.vel.x += k * sx; B.vel.x -= k * sx; }
      A.ang.multiplyScalar(0.996); B.ang.multiplyScalar(0.996);
    }
  }

  const spD = new THREE.Vector3(), spA = new THREE.Vector3(), spB = new THREE.Vector3(), SPIRAL = 3 * Math.PI;
  const latV = new THREE.Vector3(), nrm = new THREE.Vector3(), thick = new THREE.Vector3(), sideV = new THREE.Vector3(), cardX = new THREE.Vector3(), worldX = new THREE.Vector3(1, 0, 0), tan = new THREE.Vector3(), pt = new THREE.Vector3();
  function syncMeshes() {
    for (const L of lanyards) {
      const want = L.unspin && !reduce ? Math.min(FLARE_MAX, FLARE * L.ang.y * L.ang.y) : 0;
      L.flare = (L.flare || 0) + (want - (L.flare || 0)) * 0.2;   // eased, so the lean grows and fades smoothly
      drawQ.copy(L.q).multiply(flareQ.setFromAxisAngle(flareAxis, L.flare));   // lean about the badge's own middle, clip end toward its front
      L.group.position.copy(L.pos); L.group.quaternion.copy(drawQ);
      L.shadowTail.position.copy(L.anchor);
      const pts = L.curve.points;
      for (let k = 0; k < N - 1; k++) pts[k].copy(L.x[k]);
      // The rope ends at the clip where the physics has it; the flare's lean moves the drawn clip off that point, round
      // in a circle as the badge spins. Rather than bend only the last stretch to reach it, the whole strap follows the
      // clip round in a spiral: the swing grows from nothing at the anchor to the clip's own (a parabola down the strap,
      // with a little linear lift so the top stays lively too) and lags behind it further up, about one and a half coils, as the spinning mass drags the strap after it.
      pts[N - 1].copy(L.hang).applyQuaternion(L.q).add(L.pos);
      spD.copy(L.hang).applyQuaternion(drawQ).add(L.pos).sub(pts[N - 1]);
      const spOn = spD.lengthSq() > 1e-10, spSgn = L.ang.y < 0 ? -1 : 1;
      cardX.set(1, 0, 0).applyQuaternion(drawQ);
      // Track how far the card has spun (unwrapped), so the strap winds and unwinds a twist as it flips.
      fwd.set(0, 0, 1).applyQuaternion(L.q);
      const yaw = Math.atan2(fwd.x, fwd.z);
      // The twist always matches the way the card faces (twist and yaw agree, give or take whole turns), so the badge
      // can never come to rest part-way round. Steps of under half a turn per frame keep the count of whole turns.
      // While the card is tipped nearly flat its facing is noise, so the twist holds still and catches up after.
      // (It used to add up frame-to-frame changes and skip the flat frames, which lost whatever turning happened
      // meanwhile: the badge then settled at an odd angle, stuck "half-way" with its strap still wound.)
      if (Math.hypot(fwd.x, fwd.z) > 0.35) L.twist += wrapA(yaw - L.twist);
      L.lastYaw = yaw;
      const posA = L.strap.geometry.attributes.position, uvA = L.strap.geometry.attributes.uv;
      // more accumulated twist spreads over more of the strap, so the turns don't bunch up
      // (tension also pulls the twist out along the strap, so a stretched strap spreads it further)
      // Twists form one at a time from the clip upward, like a real rope's, and share the strap evenly: the first
      // half-turn is long and lazy, and each one added shortens all of them equally as the twisted stretch grows
      // up the strap. Tension stretches the twisted stretch out further.
      const tw = Math.abs(L.twist), twS = Math.sign(L.twist), pin = L.pinch || 0, n = tw / Math.PI;
      const reach = Math.min(0.8, 0.34 + 0.075 * n) * (1 + 0.3 * pin);   // how far up the strap the twisting extends
      const pitch = reach / Math.max(1, n), base = 1;                      // length of each half-turn; the lowest ends in the clip
      const zones = Math.min(12, Math.ceil(n));
      // Each half-turn is a steady helix, so the strap rolls through edge-on gradually instead of lying flat and then
      // flipping (which made the light jump). Where one half-turn meets the next, the turning rate carries straight
      // on. At the two ends of the twisted stretch the rate eases to nothing: a sudden stop there creases the strap,
      // and on a dark strap that crease shows as a hard diagonal line in the shading. The lower end runs into the
      // clip, so what's left of it is hidden in the cap.
      const R = 0.85;                                                    // turning rate inside the twisted stretch
      const ease = (u, a, b) => {   // Hermite curve from 0 to 1, with slope a at the start and b at the end
        const u2 = u * u, u3 = u2 * u;
        return 3 * u2 - 2 * u3 + a * (u3 - 2 * u2 + u) + b * (u3 - u2);
      };
      const twistAt = t => {
        let th = 0;
        for (let z = 0; z < zones; z++) {
          const amt = Math.min(Math.PI, tw - z * Math.PI); if (amt <= 0) break;
          const lo = Math.max(0.04, base - (z + 1) * pitch), hi = Math.max(lo + 0.01, base - z * pitch);
          const u = Math.min(1, Math.max(0, (t - lo) / (hi - lo)));
          // Matching slopes: a half-turn's rate is amt / its length, so a short top turn steepens to meet the one below.
          // Where a turn meets the one above, its start blends from eased to full rate as that turn grows, so the shape
          // never jumps when the twist crosses a whole half-turn (a settled badge sits right on one, and the breeze
          // rocks it back and forth across it).
          const next = Math.min(1, Math.max(0, (tw - (z + 1) * Math.PI) / (0.5 * Math.PI)));
          const top = z === zones - 1, mid = Math.min(2.5, R * Math.PI / amt);
          th += amt * ease(u, R * next, z === 0 ? 0 : top ? mid : R);
        }
        return th * twS;
      };
      const posB = L.strap2.geometry.attributes.position, uvB = L.strap2.geometry.attributes.uv;
      const hw = 0.06 * S, repeat = 0.12 * S * (L.tex.cvS.height / 128); let arc = 0;
      // Squash and stretch: measure how stretched the strap is against its rest length, and thin it toward the
      // middle as it stretches (ends stay full width at the anchor and the clip). Smoothed so it eases in and out.
      let len = 0; for (let k = 1; k < N; k++) len += pts[k].distanceTo(pts[k - 1]);
      const ratio = len / (L.rest * (N - 1));
      L.pinch = (L.pinch || 0) + (Math.min(0.55, Math.max(0, ratio - 1.02) * 1.7) - (L.pinch || 0)) * 0.25;
      // How far the clip's own angle is from where the twist ends (a strap looks the same turned 180°, so at most a
      // quarter turn either way). Measured once, at the clip, and rolled smoothly up the strap's lower stretch below.
      const clipAng = Math.atan2(-cardX.z, cardX.x), dEnd = clipAng - twistAt(1), clipFix = dEnd - Math.PI * Math.round(dEnd / Math.PI);
      for (let k = 0; k <= L.SEG; k++) {
        // slices about twice as dense at the clip end as at the top, where the twists bunch up
        const s = k / L.SEG, t = s + 0.45 * s * (1 - s);
        const at = (tt, out) => {
          L.curve.getPoint(tt, out);
          if (spOn) {
            const a = -spSgn * SPIRAL * (1 - tt), c = Math.cos(a), sn = Math.sin(a), w = tt * (0.35 + 0.65 * tt);
            out.x += w * (spD.x * c + spD.z * sn); out.y += w * spD.y; out.z += w * (spD.z * c - spD.x * sn);
          }
          return out;
        };
        at(t, pt);
        if (spOn) tan.subVectors(at(Math.min(1, t + 0.002), spA), at(Math.max(0, t - 0.002), spB)).normalize();
        else L.curve.getTangent(t, tan);
        if (k > 0) arc += pt.distanceTo(tmpA); tmpA.copy(pt);
        // Lettering is pinned to the strap material, not to measured distance: each rope segment has the same rest
        // length and the same share of t, so v follows t and the print stretches and twists with the strap.
        const vMat = t * L.rest * (N - 1) / repeat;
        // twist eases in over the lower half of the strap (where it's visible): none above, the card's full spin at the clip
        // Over its lower stretch the strap turns to meet the clip (the clip leads the twist mid-spin, and a
        // reduced-motion flip turns the card without twisting the strap). One correction, measured at the clip and
        // eased in, so the strap rolls into the clip. Averaging two direction vectors, or correcting each point
        // against its own twist, both folded the strap into hard creases wherever the difference wrapped around.
        const u = Math.min(1, Math.max(0, (t - 0.72) / 0.28)), th = twistAt(t) + clipFix * u * u * (3 - 2 * u);
        sideV.set(Math.cos(th), 0, -Math.sin(th));
        // the last sliver also follows the clip's tilt (a tipped or flaring badge), now that the angles agree
        const wt = t ** 40; if (wt > 1e-4) sideV.multiplyScalar(1 - wt).addScaledVector(cardX, sideV.dot(cardX) < 0 ? -wt : wt);
        const waist = 1 - L.pinch * Math.sin(Math.PI * t);   // narrowest mid-strap
        sideV.addScaledVector(tan, -sideV.dot(tan)).normalize();
        nrm.crossVectors(tan, sideV).normalize();            // which way the ribbon faces
        // The two straps sit one behind the other along the facing direction. That direction turns with the twist,
        // so as the card spins the pair winds around each other (side by side at a quarter turn, swapped at a half).
        // They converge into the clip, and stretching pulls them together.
        // snug: just over a strap's thickness apart, and tighter still where they're twisted around each other
        const snug = Math.min(1, Math.abs(th) / (Math.PI / 2));
        const gap = S * (0.0135 - 0.005 * snug) * (0.75 + 0.25 * (1 - t)) * (1 - t ** 6) * (1 - 0.6 * L.pinch);
        // Pursing: where the twist is loose, the two straps ease apart sideways in a gentle lens (widest mid-strap,
        // closing at the clip) so you can see it's two sides of a loop. Tight twists close it; as a twist unwinds it opens.
        const purse = S * 0.034 * (1 - snug) * Math.sin(Math.PI * t) * (1 - t ** 6) * (1 - L.pinch);
        latV.copy(sideV);
        sideV.multiplyScalar(hw * waist); thick.copy(nrm).multiplyScalar(hw * 0.11 * waist);
        for (const [P, U, sgn] of [[posA, uvA, 1], [posB, uvB, -1]]) {
          const ox = (nrm.x * gap + latV.x * purse) * sgn, oy = (nrm.y * gap + latV.y * purse) * sgn, oz = (nrm.z * gap + latV.z * purse) * sgn;
          const base = k * L.RV;
          STRAP_PROFILE.forEach(([sx, nx, u], j) => {
            P.setXYZ(base + j, pt.x + ox + sideV.x * sx + thick.x * nx, pt.y + oy + sideV.y * sx + thick.y * nx, pt.z + oz + sideV.z * sx + thick.z * nx);
            U.setXY(base + j, u, vMat);
          });
        }
      }
      posA.needsUpdate = true; uvA.needsUpdate = true; L.strap.geometry.computeVertexNormals();
      posB.needsUpdate = true; uvB.needsUpdate = true; L.strap2.geometry.computeVertexNormals();
      if (buildView) {
        const rp = L.ropeGeo.attributes.position;
        for (let k = 0; k < N; k++) rp.setXYZ(k, L.x[k].x, L.x[k].y, L.x[k].z);
        rp.setXYZ(N, L.pos.x, L.pos.y, L.pos.z); // last segment: hang point to centre of mass
        rp.setXYZ(N - 1, pts[N - 1].x, pts[N - 1].y, pts[N - 1].z);
        rp.needsUpdate = true;
      }
    }
    if (buildView && grab && grab.target) {
      const L = lanyards[grab.i], dp = dragGeo.attributes.position;
      tmpB.copy(grab.local).applyQuaternion(L.q).add(L.pos);
      dp.setXYZ(0, tmpB.x, tmpB.y, tmpB.z); dp.setXYZ(1, grab.target.x, grab.target.y, grab.target.z); dp.needsUpdate = true;
      dragLine.visible = true;
    } else dragLine.visible = false;
  }

  /* pointer */
  const ray = new THREE.Raycaster(); ray.layers.enableAll();
  const ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  function hitAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(lanyards.flatMap(L => L.pick), false)[0] || null;
  }
  function rayPoint(cx, cy, z) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); plane.constant = -z;
    return ray.ray.intersectPlane(plane, new THREE.Vector3());
  }
  canvas.addEventListener('touchstart', e => { const t = e.touches[0]; if (e.touches.length === 1 && t && hitAt(t.clientX, t.clientY)) e.preventDefault(); }, { passive: false });
  function swagAt(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const h = ray.intersectObjects(swagMeshes, false)[0]; return h ? h.object.userData.k : -1;
  }
  canvas.addEventListener('pointerleave', () => setHover(-1));
  canvas.addEventListener('pointerdown', e => {
    const h = hitAt(e.clientX, e.clientY);
    if (!h) { // tap a pin-back button on touch screens to see its date
      const k = swagAt(e.clientX, e.clientY);
      if (e.pointerType !== 'mouse') { clearTimeout(tipTimer); setHover(k); if (k >= 0) tipTimer = setTimeout(() => setHover(-1), 2600); }
      return;
    }
    e.preventDefault(); setHover(-1);
    const L = lanyards[h.object.userData.idx];
    L.holdUntil = 0;
    const local = h.point.clone().sub(L.pos).applyQuaternion(L.q.clone().invert());
    grab = { i: L.i, local, z: h.point.z, target: h.point.clone(), sx: e.clientX, sy: e.clientY, t: e.timeStamp, moved: false };
    canvas.setPointerCapture?.(e.pointerId); canvas.style.cursor = 'grabbing'; wake();
  });
  canvas.addEventListener('pointermove', e => {
    if (grab) {
      if (Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > 10) grab.moved = true;
      const p = rayPoint(e.clientX, e.clientY, grab.z);
      if (p) {
        // keep the held point high enough that the whole card stays inside the drawing area
        const L = lanyards[grab.i], pxU = hero.clientHeight / worldH;
        p.y = Math.max(p.y, -worldH / 2 + 24 / pxU + L.CH * 1.05);
        // and sideways, keep it at least half a card in from either edge, so a drag off the side can't carry the card out
        const xMax = Math.max(0, worldW / 2 - L.CW * 0.5); p.x = Math.min(xMax, Math.max(-xMax, p.x));
        clampReach(L, p);
        grab.target = p;
      }
      wake(); return;
    }
    if (e.pointerType === 'mouse') {
      if (hitAt(e.clientX, e.clientY)) { canvas.style.cursor = 'grab'; setHover(-1); }
      else { const k = swagAt(e.clientX, e.clientY); setHover(k); canvas.style.cursor = k >= 0 ? 'pointer' : ''; }
    }
  });
  const release = e => {
    if (!grab) return;
    const g = grab; grab = null;
    if (reduce) { const L = lanyards[g.i]; L.vel.set(0, 0, 0); L.ang.set(0, 0, 0); L.prevPos.copy(L.pos); }   // no fling on release
    { const L = lanyards[g.i]; const v = L.vel.length(), a = L.ang.length();
      if (v > 6) { const k = 6 / v; L.vel.multiplyScalar(k); L.prevPos.copy(L.pos).addScaledVector(L.vel, -H); }
      if (a > 8) L.ang.multiplyScalar(8 / a); } canvas.style.cursor = e.pointerType === 'mouse' ? 'grab' : '';
    // a press that barely moved is a tap; no time limit, so slow frames on weak devices can't swallow a flip
    if (!g.moved) ctx.flip(g.i);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('lostpointercapture', e => { if (grab) release(e); });
  canvas.addEventListener('pointercancel', () => { grab = null; canvas.style.cursor = ''; });

  /* Load-in: each badge (with its strap) lowers into place on an ease-out curve, staggered left to right. It's a pure
     translation applied outside the physics, so nothing swings or bounces; it simply settles where it hangs.
     Reduced motion skips the lowering (the canvas still fades in). */
  // Its clock advances by at most 1/30 s per frame, so a stutter on the first frames (shader compiles, image decodes)
  // slows the lowering down instead of skipping it.
  const INTRO = { on: true, go: false, t: 0, dur: 1.6, stagger: 0.12, drop: 0.55 };
  function applyIntro(dt) {
    if (!INTRO.on) return;
    const t = INTRO.t; if (INTRO.go) INTRO.t += Math.min(dt, 1 / 30); let done = true;
    for (const L of lanyards) {
      const u = Math.min(1, Math.max(0, (t - L.i * INTRO.stagger) / INTRO.dur));
      const off = reduce ? 0 : INTRO.drop * Math.pow(1 - u, 4);          // easeOutQuart: quick start, long soft landing
      const d = off - (L.introOff || 0);
      if (d) for (const v of [...L.x, ...L.prev, L.pos, L.prevPos, L.anchor]) v.y += d;
      L.introOff = off; if (off > 1e-5) done = false;
    }
    if (done && INTRO.go) INTRO.on = false;
  }

  /* loop */
  let drawn = 0, fitTick = 0, running = false, visible = true, last = performance.now(), acc = 0, raf = 0, msAvg = 0, hudT = 0;
  const hudMs = $('hud-ms');
  function frame(now) {
    raf = 0; const t0 = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000); last = now; acc += dt;
    applyIntro(dt);
    let n = 0; while (acc >= H && n < 24) { step(H); acc -= H; n++; } if (n === 24) acc = 0;
    syncMeshes(); animateSwag(); renderMain(); renderOverlay(); placeHits();
    // first frames are drawn while the page is still hidden (shaders compile, textures upload); once two are done and
    // the wall has sized itself around the badges' resting places, start the whole reveal
    if (++drawn === 2) { fitCheck(true); ctx.onReady(); }
    if (++fitTick % 20 === 0) fitCheck();
    msAvg = msAvg * 0.9 + (performance.now() - t0) * 0.1;
    if (buildView && now - hudT > 500) { hudT = now; hudMs.textContent = `${msAvg.toFixed(1)} ms CPU · ${n} substeps`; }
    if (running) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!running && visible && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } }
  function sleep() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  // the load-in starts the first time the wall scrolls into view
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) INTRO.go = true; visible ? wake() : sleep(); });
  io.observe(hero);
  const onVis = () => document.hidden ? sleep() : wake();
  document.addEventListener('visibilitychange', onVis);

  sizeWall(); measure(); build(false); // badges load already hanging; no drop-in swing
  const ro = new ResizeObserver(() => {
    const oldH = worldH;
    sizeWall(); measure();
    const dy = (worldH - oldH) / 2; // screen positions are pinned to the top edge, so shift the world to match
    if (dy) for (const L of lanyards) {
      for (const v of [...L.x, ...L.prev, L.pos, L.prevPos, L.anchor]) v.y += dy;
    }
    const lay = layout();
    if (lay.cols !== builtCols || Math.abs(lay.S - builtS) / builtS > 0.12) build(false);
    else { lanyards.forEach(L => { L.anchor.copy(lay.slots[L.i].anchor); L.anchor.y += L.introOff || 0; }); placeSwag(lay); }   // keep any load-in lift
    syncMeshes(); animateSwag(); renderMain(); wake();
  });
  ro.observe(hero);
  // The badges never scroll. Where a browser lacks overflow: clip, the wall and its button layer fall back to
  // overflow: hidden, which focus or a drag can still nudge sideways; put them straight back.
  const layerEl = $('focus-layer');
  const unscroll = e => { const t = e.currentTarget; if (t.scrollLeft || t.scrollTop) { t.scrollLeft = 0; t.scrollTop = 0; } };
  hero.addEventListener('scroll', unscroll); layerEl.addEventListener('scroll', unscroll);
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const retheme = () => { measure(); wake(); };
  mq.addEventListener?.('change', retheme);
  const mo = new MutationObserver(retheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  wake();

  return {
    flip(i) {
      const L = lanyards[i]; if (!L) return;
      L.holdUntil = 0;
      if (L.unspin) return 'busy';   // unwinding: clicks wait until it settles
      if (reduce) {
        // Reduced motion: turn the badge over in place, no spin, no strap twist, no easter egg
        L.armed = false; L.unspin = false; L.targetYaw = data[i].face ? Math.PI : 0;
        L.q.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)); L.prevQ.copy(L.q); L.ang.set(0, 0, 0);
        fwd.set(0, 0, 1).applyQuaternion(L.q); L.lastYaw = Math.atan2(fwd.x, fwd.z);
        wake(); return;
      }
      // Every flip winds one more half-turn the same way (the way the strap is already twisted), so the twists add up.
      // The easter egg goes off when the strap really holds 7 of them, however fast they were clicked in.
      const dir = L.goal < 0 ? -1 : 1;
      L.goal += dir * Math.PI;
      if (Math.abs(L.goal) >= WOUND - 0.01) L.armed = true;
      L.targetYaw = data[i].face ? Math.PI : 0;
      L.ang.y += dir * 5;   // a nudge per click; the pull toward the goal does the rest
      wake();
    },
    refresh(i) {
      const L = lanyards[i], b = data[i]; if (!L) return;
      drawFront(b, i, L.tex.cvF, o); drawBack(b, i, L.tex.cvB, o);
      L.tex.tF.needsUpdate = L.tex.tB.needsUpdate = true;
      // the strap canvas can change length, so it gets a fresh texture
      const cvS = document.createElement('canvas'); drawStrap(b, cvS, o);
      const tS = new THREE.CanvasTexture(cvS); tS.colorSpace = THREE.SRGBColorSpace; tS.wrapT = THREE.RepeatWrapping; tS.flipY = false;
      tS.anisotropy = renderer.capabilities.getMaxAnisotropy();
      L.strap.material.map = tS; L.tex.tS.dispose(); L.tex.tS = tS; L.tex.cvS = cvS;
      L.strap.material.normalMap?.dispose(); L.strap.material.normalMap = weaveFor(cvS); L.strap.material.sheenColor.set(shade(b.strap, 0.45));
      L.strap.material.needsUpdate = true;
      L.edgeMat.color.set(shade(b.color, -0.12));
      L.holo.visible = !buildView && !b.frontImg;
      wake();
    },
    setView(on) { buildView = on; applyView(); wake(); },
    // keyboard swing: a sideways push, as if nudged by hand
    nudge(i, dir) { const L = lanyards[i]; if (!L) return; L.holdUntil = 0; L.vel.x += dir * (reduce ? 1.2 : 2.4); wake(); },
    showPin(k) { setHover(k); wake(); },
    // reduced-motion toggle: switch modes and calm anything already moving
    setReduced(on) {
      reduce = on;
      if (on) for (const L of lanyards) { L.unspin = false; L.ang.multiplyScalar(0.2); L.vel.multiplyScalar(0.2); L.prevPos.copy(L.pos).addScaledVector(L.vel, -H); }
      for (const L of lanyards) { L.armed = false; L.goal = anchorGoal(L); L.targetYaw = data[L.i].face ? Math.PI : 0; }
      wake();
    },
    dispose() {
      sleep(); io.disconnect(); ro.disconnect(); mo.disconnect();
      hero.removeEventListener('scroll', unscroll); layerEl.removeEventListener('scroll', unscroll);
      document.removeEventListener('visibilitychange', onVis); mq.removeEventListener?.('change', retheme);
      scene.traverse(obj => { obj.geometry?.dispose?.(); const m = obj.material; (Array.isArray(m) ? m : m ? [m] : []).forEach(x => { x.map?.dispose(); x.dispose(); }); });
      pmrem.dispose(); renderer.dispose(); renderer.forceContextLoss();
      if (overlay) { overlayEnv.dispose(); overlay.dispose(); overlay.forceContextLoss(); }
    },
  };
}
/* ---------- the element ---------- */

const DEFAULT_FONTS = {
  display: '"Arial Black", "Helvetica Neue", system-ui, sans-serif',
  body: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
};
const DEFAULT_LABELS = ['UX design', 'UX engineering'];
// Every printed label, with the wall-wide default. Each can be set on <lanyard-wall> for all badges,
// or on a single <lanyard-badge> (or JSON badge) to override it there.
const DEFAULTS = { name: '', contact: '', seal: 'Lanyard Portfolio · Alumni', tag: 'Alumni', dateLabel: 'Date', titleLabel: 'Title',
  emptyHeading: 'On the job', emptyText: 'Nothing listed yet.' };
const LABEL_ATTRS = { name: 'name', contact: 'contact', seal: 'seal', tag: 'tag', dateLabel: 'date-label', titleLabel: 'title-label',
  emptyHeading: 'empty-heading', emptyText: 'empty-text' };
const attr = (el, n) => el.hasAttribute(n) ? el.getAttribute(n) : undefined;
const up = v => String(v ?? '').toUpperCase();

// One badge, from markup or JSON, with the wall's defaults (d) filling whatever it leaves out. A badge has up to two
// sections; each has a heading, short items for the front and sentences for the back.
function normalizeBadge(b, i, d) {
  const h = b.highlights || {}, dt = b.details || {}, sec = (b.sections || []).slice(0, 2);
  const pick = k => b[k] ?? d[k];
  const spoken = [0, 1].map(k => String(sec[k]?.label ?? b.labels?.[k] ?? d.labels[k]));
  const color = b.color || '#2b3440', name = pick('name') || '';
  return {
    id: b.id || `badge-${i}`, org: b.org || '', displayName: b.displayName || '', role: b.role || '',
    start: b.start || '', end: b.end || '', printLabel: b.printLabel || '', sub: b.sub || '',
    logo: b.logo || '', subLogo: b.subLogo || '', frontSrc: b.frontImage || '', backSrc: b.backImage || '',
    color, band: b.band || '#8ea4ff', band2: b.band2 || '', strap: b.strap || shade(color, -0.3), strapInk: b.strapInk || '',
    // printed labels: set per badge, or inherited from the wall
    name, contact: pick('contact') || '', seal: up(pick('seal')), tag: up(pick('tag')),
    dateLabel: up(pick('dateLabel')), titleLabel: up(pick('titleLabel')),
    emptyHeading: pick('emptyHeading') || '', emptyText: pick('emptyText') || '',
    strapText: b.strapText ?? [name, b.printLabel || b.org].filter(Boolean).join(' · '),
    spoken, labels: spoken.map(up),   // headings as written (read aloud) and as printed
    designList: [...(sec[0]?.front ?? h.left ?? [])], buildList: [...(sec[1]?.front ?? h.right ?? [])],
    design: [...(sec[0]?.back ?? dt.left ?? [])], build: [...(sec[1]?.back ?? dt.right ?? [])],
    face: 0,
  };
}
function normalizePin(p, i) {
  const name = p.name || `Pin ${i + 1}`;
  return { id: p.id || `pin-${i}`, name, big: p.big?.length ? p.big : [name], small: p.small || '',
    ring: `${up(p.ring || name).replace(/[\s·]+$/, '')} · `, color: p.color || '#8ea4ff', note: p.note || '' };
}

// <lanyard-badge> markup, read into the same shape as a JSON badge.
//   <lanyard-badge org="…" role="…" start="MM/YYYY" end="MM/YYYY" color="#…" tag="…" strap-text="…">
//     <lanyard-section label="UX design">
//       <ul data-side="front"><li>…</li></ul>   short items on the front (up to 4)
//       <ul data-side="back"><li>…</li></ul>    sentences on the back
//     </lanyard-section>
//   </lanyard-badge>
// Without data-side, the first list is the front and the second is the back.
function readBadgeEl(el) {
  const a = n => attr(el, n);
  const items = list => list ? [...list.querySelectorAll(':scope > li')].map(li => li.textContent.trim()).filter(Boolean) : [];
  const sections = [...el.querySelectorAll(':scope > lanyard-section')].slice(0, 2).map(sec => {
    const lists = [...sec.querySelectorAll(':scope > ul, :scope > ol')], plain = lists.filter(l => !l.dataset.side);
    const front = lists.find(l => l.dataset.side === 'front') || plain[0];
    const back = lists.find(l => l.dataset.side === 'back') || plain.find(l => l !== front);
    return { label: attr(sec, 'label'), front: items(front), back: items(back) };
  });
  const b = { id: a('id'), org: a('org'), displayName: a('display-name'), role: a('role'), start: a('start'), end: a('end'),
    sub: a('sub'), printLabel: a('print-label'), logo: a('logo'), subLogo: a('sub-logo'), frontImage: a('front-image'), backImage: a('back-image'),
    color: a('color'), band: a('band'), band2: a('band2'), strap: a('strap'), strapInk: a('strap-ink'), strapText: a('strap-text') };
  for (const [k, n] of Object.entries(LABEL_ATTRS)) b[k] = a(n);
  if (sections.length) b.sections = sections;
  return b;
}
//   <lanyard-pin name="Design Meetup" text="Design|Meetup" ring="Design Meetup · Organizer" color="#ffb31a" note="Organizer · 2018">
function readPinEl(el) {
  const a = n => attr(el, n);
  return { id: a('id'), name: a('name') || el.textContent.trim(), big: a('text')?.split('|').map(t => t.trim()).filter(Boolean),
    small: a('small'), ring: a('ring'), color: a('color'), note: a('note') };
}
const orgName = b => b.displayName || b.org;
const loadImg = src => new Promise(r => { if (!src) return r(null); const i = new Image(); i.crossOrigin = 'anonymous';
  i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });

const CSS = `
:host { display: block; position: relative; overflow: hidden; overflow: clip; padding-bottom: var(--lanyard-overhang, 0px);
  color: var(--lanyard-ink, #e7ebe9); -webkit-user-select: none; user-select: none;
  --_accent: var(--lanyard-accent, #8ea4ff); --_focus: var(--lanyard-focus, #ffd166);
  --_panel: var(--lanyard-panel, #1a1f22); --_line: var(--lanyard-line, #2d3437); --_muted: var(--lanyard-muted, #9aa39f);
  --_body: var(--lanyard-font-body, ${DEFAULT_FONTS.body}); --_mono: var(--lanyard-font-mono, ${DEFAULT_FONTS.mono});
  --_ink: var(--lanyard-ink, #e7ebe9); }
:host([hidden]) { display: none; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: pan-y; z-index: 0; }
/* Stacking (the element makes no stacking context of its own, so these share the page's): the canvas at 0, the
   header slot at 2, page content laid over the overhang at 3 (the page's to set), the overlay canvas at 4, the
   keyboard layer and tooltip at 5. */
canvas.over { z-index: 4; pointer-events: none; touch-action: auto; }
.head { position: relative; z-index: 2; pointer-events: none; }
::slotted(*) { pointer-events: auto; }
.area { position: relative; z-index: 1; min-height: 420px; pointer-events: none; }
/* The hero: a title panel over the top of the wall, with the lanyards hanging behind it (from <lanyard-hero>). */
.hero { padding: var(--lanyard-hero-pad, 40px max(16px, env(safe-area-inset-right, 0px)) 8px max(16px, env(safe-area-inset-left, 0px))); }
.hero-in { max-width: var(--lanyard-hero-max, 1180px); margin: 0 auto; }
.hero-panel { pointer-events: auto; max-width: 820px; -webkit-user-select: text; user-select: text; color: var(--lanyard-ink, #e7ebe9);
  background: var(--lanyard-hero-bg, rgba(13, 16, 19, 0.84)); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 14px; padding: 22px 26px 24px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  text-shadow: 0 1px 12px #13171a, 0 0 2px #13171a; }
.hero-eyebrow { font: 12px var(--_mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--_muted); margin: 0 0 10px; }
.hero-title { font-family: var(--lanyard-font-display, ${DEFAULT_FONTS.display}); font-stretch: 125%; font-weight: 850; font-size: clamp(40px, 7vw, 84px);
  line-height: 0.92; letter-spacing: -0.01em; margin: 0; text-wrap: balance; overflow-wrap: anywhere; }
.hero-text { max-width: 60ch; color: var(--lanyard-hero-text, #d6ddd9); margin: 14px 0 0; font: 17px/1.5 var(--_body); }
.hero-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin: 22px 0 0; }
.hero-links:empty { display: none; }
.hero-link { text-shadow: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.3rem; border-radius: 5px;
  font: 700 16px/1.5 var(--_body); text-decoration: none; color: var(--_ink); box-shadow: inset 0 0 0 1px var(--_muted); }
.hero-link:hover { box-shadow: inset 0 0 0 1px var(--_ink); }
.hero-link.primary { background: var(--_accent); color: var(--lanyard-accent-ink, #0b1020); box-shadow: none; }
.hero-link.primary:hover { filter: brightness(1.08); }
.hero-mail { color: var(--_ink); font: 14px var(--_mono); text-underline-offset: 4px; }
.hero a:focus-visible { outline: 2px solid var(--_ink); outline-offset: 3px; }
@media (max-width: 600px) { .hero-panel { padding: 18px 18px 20px; border-radius: 12px; } }
[hidden] { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.focus-layer { position: absolute; inset: 0; z-index: 5; pointer-events: none; overflow: hidden; overflow: clip; }
.badge-hit, .pin-hit { position: absolute; left: 0; top: 0; margin: 0; padding: 0; border: 0; background: transparent; color: transparent;
  pointer-events: none; transform-origin: 50% 50%; border-radius: 14px; font: inherit; cursor: pointer; }
.pin-hit { border-radius: 50%; }
.badge-hit:focus { outline: none; }
.badge-hit:focus-visible, .pin-hit:focus-visible { outline: 3px solid var(--_focus); outline-offset: 4px; box-shadow: 0 0 0 9px rgba(13, 16, 19, 0.85); }
.tip { position: absolute; z-index: 5; left: 0; top: 0; transform: translate(-50%, calc(-100% - 10px)); background: var(--lanyard-tip-bg, #e7ebe9);
  color: var(--lanyard-tip-ink, #13171a); font: 14px/1.35 var(--_body); padding: 8px 12px; border-radius: 8px; pointer-events: none; white-space: nowrap;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25); }
.tip strong { display: block; font-weight: 600; }
.tip span { display: block; font-family: var(--_mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.8; }
.tip span:empty { display: none; }
.tip::after { content: ""; position: absolute; left: 50%; bottom: -5px; width: 10px; height: 10px; background: inherit; transform: translateX(-50%) rotate(45deg); }
.tip.below { transform: translate(-50%, 10px); }
.tip.below::after { bottom: auto; top: -5px; }
.hint { position: absolute; bottom: 16px; left: 16px; margin: 0; font: 12.5px var(--_mono); letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--_muted); pointer-events: none; }
.hint:empty { display: none; }
/* slot="corner": a small line of your own (a credit, a link) in the bottom-right corner of the badge area */
.corner { position: absolute; bottom: 16px; right: max(16px, env(safe-area-inset-right, 0px)); max-width: calc(100% - 32px); margin: 0;
  font: 12.5px var(--_mono); letter-spacing: 0.04em; color: var(--_muted); text-align: right; pointer-events: auto; }
.corner ::slotted(a) { color: inherit; text-underline-offset: 3px; }
.corner ::slotted(a:hover) { color: var(--_ink); }
.hud { position: absolute; bottom: 14px; right: 16px; max-width: min(360px, calc(100% - 32px)); font: 11.5px/1.55 var(--_mono);
  background: color-mix(in srgb, #13171a 82%, transparent); border: 1px solid var(--_accent); border-radius: 6px; padding: 10px 12px; pointer-events: none; }
.hud dl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 2px 12px; margin: 0; }
.hud dt { color: var(--_accent); text-transform: uppercase; letter-spacing: 0.06em; }
.hud dd { margin: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
:host(.no-gl) { min-height: 0; height: auto !important; padding-bottom: 0; -webkit-user-select: text; user-select: text; }
:host(.no-gl) .hint, :host(.no-gl) .focus-layer, :host(.no-gl) canvas { display: none; }
:host(.no-gl) .area { min-height: 0; height: auto !important; pointer-events: auto; }
.fallback { font: 16px/1.5 var(--_body); padding: 8px 0 24px; }
.fallback > p { margin: 0 0 14px; color: var(--_muted); }
.gl-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); }
.gl-list > li { background: var(--_panel); border: 1px solid var(--_line); border-left: 4px solid var(--c, var(--_line)); border-radius: 12px; padding: 16px 18px; }
.gl-list h3 { margin: 0; font-size: 18px; }
.gl-list .meta { margin: 2px 0 10px; color: var(--_muted); font-size: 14px; }
.gl-list h4 { margin: 10px 0 4px; font: 500 11px var(--_mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--_muted); }
.gl-list ul { margin: 0; padding-left: 18px; }
.gl-pins { margin: 16px 0 0; color: var(--_muted); }
`;

const TEMPLATE = `<style>${CSS}</style>
<canvas aria-hidden="true" part="canvas" class="main"></canvas>
<div class="head" id="head" part="header"><header class="hero" id="hero" part="hero" hidden></header><slot name="header"></slot></div>
<div class="area" id="area" part="area">
<p class="hint" id="hint" part="hint" aria-hidden="true"></p>
<div class="corner" part="corner"><slot name="corner"></slot></div>
<div class="hud" id="hud" part="hud" hidden>
  <dl>
    <dt>Render</dt><dd>three.js r<span id="hud-r"></span> · WebGL2 · canvas textures</dd>
    <dt>Solver</dt><dd>XPBD, 480 Hz substeps</dd>
    <dt>Strap</dt><dd><span id="hud-n">0</span> Verlet ropes × 8 nodes</dd>
    <dt>Card</dt><dd>Rigid body with an inverse-inertia tensor</dd>
    <dt>Frame</dt><dd id="hud-ms">–</dd>
  </dl>
</div>
<div class="fallback" id="fallback" hidden></div>
</div>
<canvas aria-hidden="true" part="overlay" class="over" id="over" hidden></canvas>
<div class="tip" id="tip" hidden aria-hidden="true"><strong id="tip-name"></strong><span id="tip-when"></span></div>
<div class="focus-layer" id="focus-layer" role="group"><p class="sr-only" id="live" aria-live="polite"></p></div>`;

export class LanyardWall extends HTMLElement {
  static get observedAttributes() { return ['debug', 'reduced-motion', 'hint', 'label', 'labels', ...Object.values(LABEL_ATTRS)]; }

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML = TEMPLATE;
    this._input = { badges: undefined, pins: undefined, labels: undefined };
    this._gl = null; this._token = 0; this._timers = [];
    this.data = []; this.pinData = [];
    this._$ = id => this._root.getElementById(id);
    this._mq = matchMedia('(prefers-reduced-motion: reduce)');
    this._onMQ = () => this._applyMotion();
    // Edits to the <lanyard-badge> / <lanyard-pin> markup redraw the affected cards in place.
    // (Attribute changes on the wall itself go through attributeChangedCallback, and include its own ready/style updates.)
    this._mo = new MutationObserver(recs => {
      if (recs.some(r => !(r.type === 'attributes' && r.target === this))) { this._renderHero(); this._queueSync(); }
    });
    const layer = this._$('focus-layer');
    layer.addEventListener('click', e => {
      const f = e.target.closest('[data-flip]'); if (f) return this.flip(+f.dataset.flip);
      const p = e.target.closest('[data-pin]'); if (p) this._gl?.showPin(+p.dataset.pin);
    });
    layer.addEventListener('keydown', e => {   // arrow keys give a focused badge a sideways push
      const f = e.target.closest('[data-flip]'); if (!f || !this._gl) return;
      const dir = { ArrowLeft: -1, ArrowRight: 1 }[e.key]; if (!dir) return;
      e.preventDefault(); this._gl.nudge(+f.dataset.flip, dir);
    });
    layer.addEventListener('focusin', e => { const p = e.target.closest('[data-pin]'); this._gl?.showPin(p ? +p.dataset.pin : -1); });
    layer.addEventListener('focusout', () => this._gl?.showPin(-1));
  }

  /* data: <lanyard-badge> and <lanyard-pin> markup, JSON in a child <script type="application/json">, or these
     properties (in that order of precedence: properties win, then markup, then JSON) */
  get badges() { return this._input.badges; }
  set badges(v) { this._input.badges = v; this._queueSync(); }
  get pins() { return this._input.pins; }
  set pins(v) { this._input.pins = v; this._queueSync(); }
  get labels() { return this._input.labels; }
  set labels(v) { this._input.labels = v; this._queueSync(); }

  // reduced-motion: present turns it on, reduced-motion="off" turns it off even when the system asks for it (for a
  // page's own motion switch), and absent follows the system setting.
  get reducedMotion() {
    const a = this.getAttribute('reduced-motion');
    return a === null ? this._mq.matches : !/^(off|false)$/i.test(a);
  }
  set reducedMotion(on) { this.toggleAttribute('reduced-motion', !!on); }

  connectedCallback() {
    this._connected = true;
    this._mq.addEventListener?.('change', this._onMQ);
    this._mo.observe(this, { childList: true, subtree: true, attributes: true, characterData: true });
    this._renderHero();
    this._start();
  }
  disconnectedCallback() {
    this._connected = false;
    this._mq.removeEventListener?.('change', this._onMQ);
    this._mo.disconnect();
    this._stop();
  }
  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV || !this._connected) return;
    if (name === 'debug') return this._applyDebug();
    if (name === 'reduced-motion') return this._applyMotion();
    if (name === 'hint') return this._applyHint();
    if (name === 'label') return this._$('focus-layer').setAttribute('aria-label', this._label());
    this._queueSync();   // a printed label changed: redraw the cards
  }

  /* public methods */
  flip(i, announce = true) {
    const b = this.data[i]; if (!b) return;
    b.face ^= 1;
    if (this._gl?.flip(i) === 'busy') { b.face ^= 1; return; }   // it's unwinding; the click waits
    const el = this._root.querySelector(`[data-flip="${i}"]`); if (el) this._syncFlipBtn(el, i);
    // Rapid clicks wind the strap up; announce once, when they stop, with the side that ended up showing.
    clearTimeout(this._announceT);
    if (announce) this._announceT = setTimeout(() => this._announce(i), 400);
    this.dispatchEvent(new CustomEvent('lanyard-flip', { bubbles: true, composed: true,
      detail: { index: i, id: b.id, side: b.face ? 'back' : 'front' } }));
  }
  // The physics calls this when a strap wound 7 half-twists lets go.
  _unwound(i) {
    const b = this.data[i]; if (!b) return;
    clearTimeout(this._announceT);
    const el = this._root.querySelector(`[data-flip="${i}"]`); if (el) this._syncFlipBtn(el, i);
    this._say(`${orgName(b)} badge unwound itself, front side out.`);
    this.dispatchEvent(new CustomEvent('lanyard-unwind', { bubbles: true, composed: true, detail: { index: i, id: b.id } }));
  }
  flipAll(toBack = this.data.some(b => !b.face)) {
    this.data.forEach((b, i) => { if (!!b.face !== toBack) this._timers.push(setTimeout(() => this.flip(i, false), i * 140)); });
    this._timers.push(setTimeout(() => this._say(toBack ? 'All badges now show their details.' : 'All badges now show their fronts.'), this.data.length * 140));
  }
  nudge(i, dir = 1) { this._gl?.nudge(i, dir); }

  /* internals */
  _say(t) { this._$('live').textContent = t; }
  _label() { return this.getAttribute('label') || 'Work history badges'; }
  _json() {
    const s = this.querySelector(':scope > script[type="application/json"]');
    if (s) try { return JSON.parse(s.textContent) || {}; } catch (e) { console.warn('<lanyard-wall>: the JSON config could not be parsed.', e); }
    return {};
  }
  // Wall-wide defaults for every printed label: attributes on <lanyard-wall>, then JSON, then built-in.
  _defaults(json) {
    const d = {};
    for (const [k, n] of Object.entries(LABEL_ATTRS)) d[k] = attr(this, n) ?? json[k] ?? DEFAULTS[k];
    const labels = (this._input.labels || attr(this, 'labels')?.split('|').map(t => t.trim()).filter(Boolean) || json.labels || DEFAULT_LABELS)
      .slice(0, 2).map(String);
    while (labels.length < 2) labels.push(DEFAULT_LABELS[labels.length]);
    d.labels = labels;
    return d;
  }
  _config() {
    const json = this._json(), d = this._defaults(json);
    const badgeEls = [...this.querySelectorAll(':scope > lanyard-badge')], pinEls = [...this.querySelectorAll(':scope > lanyard-pin')];
    const badges = this._input.badges ?? (badgeEls.length ? badgeEls.map(readBadgeEl) : json.badges) ?? [];
    const pins = this._input.pins ?? (pinEls.length ? pinEls.map(readPinEl) : json.pins) ?? [];
    return { badges: badges.map((b, i) => normalizeBadge(b, i, d)), pins: pins.map(normalizePin) };
  }
  _opts() {
    const cs = getComputedStyle(this), v = (n, d) => cs.getPropertyValue(n).trim() || d;
    return { f: { display: v('--lanyard-font-display', DEFAULT_FONTS.display), body: v('--lanyard-font-body', DEFAULT_FONTS.body), mono: v('--lanyard-font-mono', DEFAULT_FONTS.mono) } };
  }
  _queueSync() {
    if (!this._connected || this._syncQueued) return;
    this._syncQueued = true;
    queueMicrotask(() => { this._syncQueued = false; this._sync(); });
  }
  // Apply a config change. Same number of badges and the same pins: redraw just the cards that changed, keeping
  // the physics running (and each badge's flip state). Anything else starts over.
  async _sync() {
    if (!this._connected) return;
    if (!this._gl) return this._restart();
    const cfg = this._config();
    if (cfg.badges.length !== this.data.length || JSON.stringify(cfg.pins) !== JSON.stringify(this.pinData)) return this._restart();
    const token = this._token;
    const IMGS = [['frontSrc', 'frontImg'], ['backSrc', 'backImg'], ['logo', 'logoImg'], ['subLogo', 'subLogoImg']];
    await Promise.all(cfg.badges.map(async (nb, i) => {
      const ob = this.data[i];
      if (!Object.keys(nb).some(k => k !== 'face' && JSON.stringify(nb[k]) !== JSON.stringify(ob[k]))) return;
      for (const [src, img] of IMGS) nb[img] = nb[src] === ob[src] ? ob[img] : await loadImg(nb[src]);
      if (token !== this._token || !this._gl) return;
      nb.face = ob.face;
      Object.assign(ob, nb);   // the physics holds this same object
      this._gl.refresh(i);
    }));
    if (token !== this._token) return;
    this._root.querySelectorAll('.badge-hit').forEach((el, i) => this._syncFlipBtn(el, i));
    this._root.querySelectorAll('.badge-desc').forEach((el, i) => { el.textContent = this._describe(this.data[i]); });
  }
  _restart() { if (this._connected) this._start(); }
  _stop() {
    this._timers.forEach(clearTimeout); this._timers = []; clearTimeout(this._announceT);
    this._gl?.dispose(); this._gl = null;
    // a fresh canvas each start, so listeners from a previous run can't touch a disposed scene
    for (const cv of this._root.querySelectorAll('canvas')) cv.replaceWith(cv.cloneNode());
  }
  async _start() {
    const token = ++this._token;
    this._stop();
    this.classList.remove('no-gl'); this._$('fallback').hidden = true; this.removeAttribute('ready');
    const cfg = this._config();
    this.data = cfg.badges;
    this.pinData = cfg.pins;
    this._$('focus-layer').setAttribute('aria-label', this._label());
    this._renderHits();
    this._applyHint();
    if (!this.data.length) return;
    const o = this._opts();
    await Promise.all(this.data.flatMap(b => [loadImg(b.frontSrc).then(im => b.frontImg = im), loadImg(b.backSrc).then(im => b.backImg = im),
      loadImg(b.logo).then(im => b.logoImg = im), loadImg(b.subLogo).then(im => b.subLogoImg = im)]));
    await Promise.race([
      Promise.all([document.fonts.load(`850 120px ${o.f.display}`), document.fonts.load(`600 60px ${o.f.body}`), document.fonts.load(`500 30px ${o.f.mono}`)]).catch(() => {}),
      new Promise(r => setTimeout(r, 2500)),
    ]);
    if (token !== this._token || !this._connected) return;   // config changed or removed while loading
    try {
      this._gl = startGL({
        host: this, root: this._root, canvas: this._root.querySelector('canvas.main'), $: this._$, data: this.data, pins: this.pinData, o,
        reduce: this.reducedMotion, say: t => this._say(t), flip: i => this.flip(i), unwound: i => this._unwound(i),
        onReady: () => { this.setAttribute('ready', ''); this.dispatchEvent(new CustomEvent('lanyard-ready', { bubbles: true, composed: true })); },
      });
      this._$('hud-r').textContent = THREE.REVISION;
      this._applyDebug();
    } catch (err) {
      console.warn('<lanyard-wall>: WebGL is unavailable, showing the list instead.', err);
      this._noGL();
    }
  }
  _applyMotion() {
    const on = this.reducedMotion;
    this._gl?.setReduced(on);
  }
  _applyDebug() {
    const on = this.hasAttribute('debug');
    this._$('hud').hidden = !on || !this._gl;
    this._gl?.setView(on);
  }
  // <lanyard-hero>: a title panel at the top of the wall, built from its attributes (or its own <p> and <a> children).
  //   eyebrow   small label over the title          heading  the title (an <h1>; heading-level="2" for an <h2>)
  //   text      the body text                       email    shown as a mailto link after the buttons
  //   links     "Label url | Label url": buttons, the first one filled
  _renderHero() {
    const el = this.querySelector(':scope > lanyard-hero'), box = this._$('hero');
    if (!el) { box.hidden = true; box.textContent = ''; return; }
    const a = n => el.getAttribute(n) || '';
    const lvl = Math.min(6, Math.max(1, parseInt(a('heading-level'), 10) || 1));
    const mk = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; n.setAttribute('part', cls); if (text != null) n.textContent = text; return n; };
    const panel = mk('div', 'hero-panel');
    if (a('eyebrow')) panel.append(mk('p', 'hero-eyebrow', a('eyebrow')));
    if (a('heading')) panel.append(mk(`h${lvl}`, 'hero-title', a('heading')));
    // body: the text attribute, or the <p> children (as plain text, one paragraph each)
    const paras = el.querySelectorAll(':scope > p').length ? [...el.querySelectorAll(':scope > p')].map(p => p.textContent.trim()) : a('text') ? [a('text')] : [];
    for (const t of paras) if (t) panel.append(mk('p', 'hero-text', t));
    // links: <a> children, or the links attribute ("Label url" pairs split by "|"; the url is the last word)
    const anchors = [...el.querySelectorAll(':scope > a[href]')];
    const links = anchors.length ? anchors.map(x => ({ label: x.textContent.trim(), href: x.getAttribute('href'), target: x.getAttribute('target') }))
      : a('links').split('|').map(t => t.trim()).filter(Boolean).map(t => { const k = t.lastIndexOf(' '); return k < 0 ? { label: t, href: t } : { label: t.slice(0, k).trim(), href: t.slice(k + 1) }; });
    const row = mk('p', 'hero-links');
    links.forEach((l, k) => {
      const link = mk('a', `hero-link${k ? '' : ' primary'}`, l.label); link.setAttribute('part', k ? 'hero-link' : 'hero-link primary');
      link.href = l.href; if (l.target) { link.target = l.target; link.rel = 'noopener'; }
      if (!k) { const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→'; link.append(arrow); }
      row.append(link);
    });
    if (a('email')) { const m = mk('a', 'hero-mail', a('email')); m.href = `mailto:${a('email')}`; row.append(m); }
    panel.append(row);
    const inner = mk('div', 'hero-in'); inner.append(panel);
    box.replaceChildren(inner); box.hidden = false;
  }
  _applyHint() {
    this._$('hint').textContent = this.hasAttribute('hint') ? this.getAttribute('hint') : 'Drag to swing · Tap to flip';
  }
  _describe(b) {
    const [l1, l2] = b.spoken;
    const list = a => (a || []).filter(Boolean).join('. ');
    return [`Front: ${orgName(b)}. ${[b.role, fmtRange(b)].filter(Boolean).join(', ')}.`,
      b.designList.length ? `${l1}: ${b.designList.join(', ')}.` : '', b.buildList.length ? `${l2}: ${b.buildList.join(', ')}.` : '',
      `Back: ${l1}: ${list(b.design) || 'nothing listed'}.`, `${l2}: ${list(b.build) || 'nothing listed'}.`].filter(Boolean).join(' ');
  }
  _announce(i) {
    const b = this.data[i];
    const [l1, l2] = b.spoken;
    const list = a => (a || []).filter(Boolean).join('. ') || 'nothing listed yet';
    this._say(b.face
      ? `${orgName(b)} badge, back. ${l1}: ${list(b.design)}. ${l2}: ${list(b.build)}.`
      : `${orgName(b)} badge, front. ${[b.role, fmtRange(b)].filter(Boolean).join(', ')}. ${l1}: ${b.designList.join(', ') || 'none listed'}. ${l2}: ${b.buildList.join(', ') || 'none listed'}.`);
  }
  _syncFlipBtn(el, i) {
    const b = this.data[i];
    el.setAttribute('aria-label', `${orgName(b)} badge${b.role ? ', ' + b.role : ''}${fmtRange(b) ? ', ' + fmtRange(b) : ''}. Showing the ${b.face ? 'back, with details' : 'front'}. Press to flip.`);
    el.textContent = `${orgName(b)}: show ${b.face ? 'front' : 'details'}`;
  }
  // One real button over each badge and pin. Mouse and touch pass through to the canvas; keyboard focus lands here.
  _renderHits() {
    const layer = this._$('focus-layer');
    layer.querySelectorAll('.badge-hit, .badge-desc, .pin-hit').forEach(e => e.remove());
    this.data.forEach((b, i) => {
      const d = document.createElement('p'); d.id = `badge-desc-${i}`; d.className = 'sr-only badge-desc'; d.textContent = this._describe(b);
      const el = document.createElement('button'); el.type = 'button'; el.className = 'badge-hit'; el.dataset.flip = i;
      el.setAttribute('aria-describedby', d.id);
      this._syncFlipBtn(el, i);
      layer.append(el, d);
    });
    this.pinData.forEach((s, k) => {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'pin-hit'; el.dataset.pin = k;
      el.setAttribute('aria-label', [s.name, swagWhen(s)].filter(Boolean).join('. ') + '.');
      el.textContent = s.name;
      layer.append(el);
    });
  }
  // Without WebGL, the same content as a readable list.
  _noGL() {
    this.classList.add('no-gl'); this.style.height = '';
    const fb = this._$('fallback'); fb.hidden = false; fb.textContent = '';
    const note = document.createElement('p'); note.textContent = 'This browser couldn’t start WebGL, so here are the same badges as a list.';
    const ul = document.createElement('ul'); ul.className = 'gl-list';
    const items = a => (a || []).filter(Boolean).map(t => { const li = document.createElement('li'); li.textContent = t; return li; });
    this.data.forEach(b => {
      const li = document.createElement('li'); li.style.setProperty('--c', b.band || b.color);
      const h = document.createElement('h3'); h.textContent = orgName(b);
      const m = document.createElement('p'); m.className = 'meta'; m.textContent = [b.role, fmtRange(b)].filter(Boolean).join(' · ');
      li.append(h, m);
      for (const [title, list] of [[b.spoken[0], b.design.length ? b.design : b.designList], [b.spoken[1], b.build.length ? b.build : b.buildList]]) {
        if (!list.filter(Boolean).length) continue;
        const t = document.createElement('h4'); t.textContent = title;
        const u = document.createElement('ul'); u.append(...items(list));
        li.append(t, u);
      }
      ul.append(li);
    });
    fb.append(note, ul);
    if (this.pinData.length) {
      const pins = document.createElement('p'); pins.className = 'gl-pins';
      pins.textContent = this.pinData.map(s => s.note ? `${s.name} (${s.note})` : s.name).join(', ') + '.';
      fb.append(pins);
    }
  }
}

if (!customElements.get('lanyard-wall')) customElements.define('lanyard-wall', LanyardWall);
