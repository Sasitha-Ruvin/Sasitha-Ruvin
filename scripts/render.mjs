// README charts in the avatar's palette: coral sun, cream sky, black silhouettes.
// GitHub strips scripts from READMEs, so everything animates with CSS only.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ICONS = JSON.parse(readFileSync(new URL('./icons.json', import.meta.url), 'utf8')); // simple-icons, CC0
const LANGS = ['TypeScript', 'Go', 'JavaScript', 'HTML', 'Kotlin'];
const T = {
  light: { bg: '#f6ecd9', hi: '#fdf6e8', lo: '#efdfc3', edge: '#fffaf0', sky: ['#fdf1dc', '#f7d9b8', '#f0b592'], m: ['#dd9f86', '#b3604f', '#6f3830'], water: ['#b5523f', '#2a1a18'], ink: '#1d1918', sub: '#6b5d51', line: '#dccdb3', hill1: '#cf8a72', hill2: '#1d1918', sun: '#e2604d', coral: '#d9503f', s: ['#d9503f', '#00908a', '#d99a1c', '#7a56a8', '#6f8f2f'], other: '#a3937f', towers: [['#f0c9a4', '#dcae86', '#c99a72'], ['#ee9b76', '#d9805c', '#c36d4b'], ['#e2604d', '#c44a3a', '#a83b2e'], ['#3a2a28', '#2a1e1c', '#1d1514']] },
  dark: { bg: '#1b1716', hi: '#221b19', lo: '#1a1513', edge: '#4a3c36', sky: ['#17100f', '#3a1b19', '#7a3329'], m: ['#5c2a24', '#3a1b18', '#1e0f0e'], water: ['#6b2a22', '#0c0807'], ink: '#f6ecd9', sub: '#b5a592', line: '#3b322e', hill1: '#7c3b31', hill2: '#0c0a09', sun: '#e2604d', coral: '#e8604c', s: ['#e8604c', '#00a198', '#bd8110', '#9a78cc', '#7c9c38'], other: '#85776a', towers: [['#6b352d', '#552a24', '#43211c'], ['#a8483a', '#8a392d', '#702e24'], ['#e8604c', '#c44a3a', '#a03a2d'], ['#f9d9a8', '#e0b983', '#c79d68']] },
};
const FLAME = 'M32 2C36 18 58 28 58 52C58 68 46 78 32 78C18 78 6 68 6 52C6 40 14 34 18 24C20 32 24 36 28 36C34 28 30 14 32 2Z';
const CORE = 'M32 44C35 51 44 55 44 64C44 72 39 77 32 77C25 77 20 72 20 64C20 56 29 52 32 44Z';
const TONGUE = 'M-13 0C-13 -12 -4 -17 1 -34C5 -20 13 -13 13 0Z';
const W = 860, DAY = 864e5, GROUPS = ['public', 'private', 'org'];
const fmt = n => n.toLocaleString('en-US');
const f1 = n => n.toFixed(1);
const utc = (d, o) => new Date(d).toLocaleDateString('en-US', { ...o, timeZone: 'UTC' });

export function render(d) {
  const out = fileURLToPath(new URL('../docs/assets/', import.meta.url));
  mkdirSync(out, { recursive: true });
  const end = Date.parse(d.updated + 'T00:00Z'), from = Date.parse(d.calendar.from + 'T00:00Z');
  const count = t => d.calendar.counts[(t - from) / DAY] ?? 0;

  // tiles: [x, y, w, h] panels with a lit top edge, gradient face and shadow
  const wrap = (h, label, t, tiles, body, css = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${label}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${t.ink}}.s{fill:${t.sub};font-size:15px}.h{font-size:20px;font-weight:600}.in{animation:in .7s backwards}@keyframes in{from{opacity:0}}${css}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<defs><linearGradient id="face" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${t.hi}"/><stop offset="1" stop-color="${t.lo}"/></linearGradient><linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.edge}"/><stop offset="1" stop-color="${t.line}"/></linearGradient><filter id="sh" color-interpolation-filters="sRGB" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#3a1b10" flood-opacity=".22"/></filter></defs>
${tiles.map(([x, y, w, hh]) => `<rect x="${x + 4}" y="${y + 2}" width="${w - 8}" height="${hh - 16}" rx="20" fill="url(#face)" stroke="url(#edge)" stroke-width="1.5" filter="url(#sh)"/>`).join('')}${body}
</svg>\n`;

  const flame = (lit, t, w = 0) => lit
    ? `<g class="fl" style="animation-delay:-${w}s"><path d="${FLAME}" fill="#ef4423"/><g class="f2" style="animation-delay:-${w + .4}s"><path d="${FLAME}" transform="translate(9.6 23.4) scale(.7)" fill="#ff8a1f"/></g><g class="f2" style="animation-delay:-${w + .2}s"><path d="${CORE}" fill="#ffd75e"/></g></g>`
    : `<path d="${FLAME}" fill="${t.line}"/>`;

  function scene(t) {
    const H = 560, cx = 636, cy = 196, R = 104, st = d.streak, lit = st.current > 0, hz = 372;
    const ring = (n, r, scale, color, speed) => Array.from({ length: n }, (_, i) => {
      const a = i * 360 / n + (scale < 1 ? 180 / n : 0), k = scale * (.85 + ((i * 7) % 5) * .1);
      return `<g transform="translate(${cx} ${cy}) rotate(${f1(a)}) translate(0 -${r}) scale(${k.toFixed(2)})"><path class="to" d="${TONGUE}" fill="${color}" style="animation-duration:${(speed + (i % 4) * .17).toFixed(2)}s;animation-delay:-${((i * 37) % 100 / 60).toFixed(2)}s"/></g>`;
    }).join('');
    const embers = Array.from({ length: 18 }, (_, i) => {
      const a = i * 137.5 * Math.PI / 180, q = R + 12;
      return `<circle class="em" cx="${f1(cx + Math.cos(a) * q)}" cy="${f1(cy + Math.sin(a) * q)}" r="${f1(2 + i % 3 * .7)}" fill="${i % 2 ? '#ff8a1f' : '#ffc24a'}" style="animation-delay:${(i * .29).toFixed(2)}s"/>`;
    }).join('');
    const pr = R - 11, C = 2 * Math.PI * pr, frac = st.longest.n ? Math.min(1, st.current / st.longest.n) : 0;
    const cloud = (x, y, k, dur) => `<g class="cl" style="animation-duration:${dur}s"><path transform="translate(${x} ${y}) scale(${k})" d="M0 20C2 6 20 4 26 12C32-4 58-4 64 10C76 2 94 8 94 20Z" fill="${t.hi}" opacity=".5"/></g>`;
    const bird = (x, y, k, w) => `<g class="fly" style="animation-delay:-${w}s"><g transform="translate(${x} ${y}) scale(${k})"><path class="wing" style="animation-delay:-${w / 5}s" d="M-16-6C-9-10-3-6 0 0C3-6 9-10 16-6C9-5 4-1 0 5C-4-1-9-5-16-6Z" fill="${t.ink}"/></g></g>`;
    // deterministic branching tree, as in the avatar
    let wood = '', leaves = '', seed = 7;
    const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const grow = (x, y, a, len, w) => {
      const X = x + Math.cos(a) * len, Y = y + Math.sin(a) * len;
      wood += `<path d="M${f1(x)} ${f1(y)}Q${f1((x + X) / 2 + (rnd() - .5) * 8)} ${f1((y + Y) / 2)} ${f1(X)} ${f1(Y)}" stroke-width="${f1(w)}"/>`;
      if (w < 2.2) { leaves += `<ellipse cx="${f1(X)}" cy="${f1(Y)}" rx="${f1(10 + rnd() * 8)}" ry="${f1(4 + rnd() * 3)}"/>`; return; }
      const n = rnd() > .6 ? 3 : 2;
      for (let i = 0; i < n; i++) grow(X, Y, a + (i - (n - 1) / 2) * .78 + (rnd() - .5) * .35, len * (.7 + rnd() * .14), w * .64);
    };
    grow(806, hz + 22, -Math.PI / 2 + .04, 50, 12);
    const black = t === T.dark ? '#080504' : '#1d1211';
    const glints = Array.from({ length: 15 }, (_, i) => { const y = hz + 22 + i * 11, w = 112 - Math.abs(i - 4) * 5 + (i * 29) % 26; return `<rect class="gl" x="${f1(cx - w / 2)}" y="${y}" width="${w}" height="4" rx="2" fill="${i % 3 ? '#ff9a55' : '#ffd27a'}" opacity="${(.75 - i * .035).toFixed(2)}" style="animation-delay:-${(i * .37).toFixed(2)}s"/>`; }).join('');
    const waves = Array.from({ length: 12 }, (_, i) => `<rect class="wv" x="${(i * 173) % 800}" y="${hz + 30 + i * 13}" width="${50 + (i * 31) % 70}" height="2" rx="1" fill="#ffd9b0" opacity=".2" style="animation-delay:-${i * .6}s"/>`).join('');
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = end - (6 - i) * DAY, x = 64 + i * 58;
      return `<g class="in" style="animation-delay:${(.4 + i * .1).toFixed(1)}s"><g transform="translate(${x - 18} 438) scale(.56)">${flame(count(day) > 0, { line: '#6a4a40' }, i * .23)}</g><text x="${x}" y="508" font-size="15" text-anchor="middle" style="fill:#fdeed6">${utc(day, { weekday: 'narrow' })}</text></g>`;
    }).join('');
    return wrap(H, `Sasitha Ruvin, full-stack software engineer in Colombo, building ERP, CRM, POS and AI systems with Go and TypeScript. Current streak ${st.current} days, longest ${st.longest.n}`, t, [], `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${t.sky.map((c, i) => `<stop offset="${i / 2}" stop-color="${c}"/>`).join('')}</linearGradient><linearGradient id="wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.water[0]}"/><stop offset=".75" stop-color="${t.water[1]}"/></linearGradient>
<radialGradient id="glow"><stop offset=".3" stop-color="#ff7a2e" stop-opacity=".75"/><stop offset=".6" stop-color="#ff7a2e" stop-opacity=".25"/><stop offset="1" stop-color="#ff7a2e" stop-opacity="0"/></radialGradient><radialGradient id="sun" cx=".4" cy=".32" r=".8"><stop offset="0" stop-color="#f58a62"/><stop offset=".6" stop-color="#e2604d"/><stop offset="1" stop-color="#b83a2b"/></radialGradient>
${t.m.map((c, i) => `<linearGradient id="m${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${t.water[0]}" stop-opacity=".9"/></linearGradient>`).join('')}<clipPath id="c"><rect width="${W}" height="${H - 6}" rx="22"/></clipPath></defs><g clip-path="url(#c)">
<rect width="${W}" height="${hz + 10}" fill="url(#sky)"/><circle class="pu" cx="${cx}" cy="${cy}" r="250" fill="url(#glow)"/>${cloud(60, 250, 1.1, 46)}${cloud(330, 40, .8, 60)}${cloud(420, 270, .9, 52)}
<path d="M0 340 70 292 130 318 230 262 320 322 400 296 470 332 560 290 660 336 760 288 860 330V${hz + 10}H0Z" fill="url(#m0)"/>
${lit ? ring(32, R - 2, 1.2, '#d93a1e', 1.1) + ring(32, R - 3, .88, '#ff8a1f', .9) + ring(28, R - 4, .54, '#ffd75e', .75) : ''}
<circle cx="${cx}" cy="${cy}" r="${R}" fill="${lit ? 'url(#sun)' : t.line}"/><circle cx="${cx}" cy="${cy}" r="${pr}" fill="none" stroke="#1d1918" stroke-opacity=".25" stroke-width="7"/><circle class="arc" cx="${cx}" cy="${cy}" r="${pr}" fill="none" stroke="#fff4dc" stroke-width="7" stroke-linecap="round" stroke-dasharray="${f1(C * frac)} ${f1(C)}" transform="rotate(-90 ${cx} ${cy})"/>${lit ? embers : ''}
<text x="${cx}" y="${cy + 20}" font-size="86" font-weight="700" text-anchor="middle" style="fill:#fff4dc;letter-spacing:-3px">${st.current}</text><text x="${cx}" y="${cy + 48}" font-size="17" font-weight="600" text-anchor="middle" style="fill:#1d1211">day streak</text><text x="${cx}" y="${cy + 70}" font-size="15" text-anchor="middle" style="fill:#1d1211">best ${st.longest.n}</text>
<path d="M0 366 90 326 180 352 290 318 390 358 520 340 640 362 740 330 860 352V${hz + 12}H0Z" fill="url(#m1)"/>
<rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#wa)"/>${waves}${glints}
<path d="M690 ${hz + 34}C720 ${hz + 8} 760 ${hz + 14} 786 ${hz + 4}S840 ${hz + 2} 860 ${hz - 4}V${hz + 46}C810 ${hz + 52} 740 ${hz + 50} 690 ${hz + 34}Z" fill="${black}"/><g class="tr"><g fill="none" stroke="${black}" stroke-linecap="round">${wood}</g><g fill="${black}">${leaves}</g></g>
${bird(470, 110, .9, 1)}${bird(500, 92, .7, 3)}${bird(440, 84, .6, 5)}${bird(410, 130, .55, 8)}${bird(530, 140, .5, 6)}
<text x="36" y="98" font-size="60" font-weight="700" style="letter-spacing:-2px" class="in">Sasitha Ruvin</text><text x="38" y="140" font-size="22" font-weight="600" class="in" style="animation-delay:.2s">Full-stack software engineer</text><text x="38" y="172" font-size="18" class="in" style="animation-delay:.35s">ERP, CRM, POS and AI systems</text><text x="38" y="198" font-size="18" class="in" style="animation-delay:.45s">with Go and TypeScript</text><text x="38" y="228" font-size="16" class="in" style="animation-delay:.55s">Colombo, Sri Lanka</text>${week}</g>`,
    `.to{transform-origin:0 0;animation:to 1s ease-in-out infinite alternate}.arc{animation:arc 1.4s backwards}.em{opacity:0;animation:em 4s ease-out infinite}.fl,.f2{transform-box:fill-box;transform-origin:50% 100%}.fl{animation:fl 1.5s ease-in-out infinite}.f2{animation:f2 1s ease-in-out infinite}.pu{transform-box:fill-box;transform-origin:center;animation:pu 3s ease-in-out infinite}.cl{animation:cl 50s ease-in-out infinite alternate}.fly{animation:fly 22s linear infinite}.wing{animation:wing .9s ease-in-out infinite}.tr{transform-origin:800px ${hz + 22}px;animation:tr 6s ease-in-out infinite}.gl{transform-box:fill-box;transform-origin:center;animation:gl 2.6s ease-in-out infinite}.wv{animation:wv 7s ease-in-out infinite}
@keyframes to{0%{transform:scale(1,.7) skewX(-9deg)}50%{transform:scale(.9,1.12) skewX(5deg)}100%{transform:scale(1.06,.86) skewX(13deg)}}@keyframes arc{from{stroke-dasharray:0 ${f1(C)}}}@keyframes em{0%{transform:none;opacity:0}12%{opacity:1}100%{transform:translate(14px,-100px);opacity:0}}@keyframes fl{0%,100%{transform:none}30%{transform:scale(.95,1.06) skewX(-3deg)}65%{transform:scale(1.03,.96) skewX(3deg)}}@keyframes f2{0%,100%{transform:none}50%{transform:scale(.9,1.1) skewX(4deg)}}@keyframes pu{0%,100%{transform:none;opacity:.85}50%{transform:scale(1.08);opacity:1}}@keyframes cl{to{transform:translateX(120px)}}@keyframes fly{0%,100%{transform:none}50%{transform:translate(70px,-26px)}}@keyframes wing{50%{transform:scaleY(-.5)}}@keyframes tr{0%,100%{transform:rotate(-.7deg)}50%{transform:rotate(.9deg)}}@keyframes gl{50%{transform:scaleX(.72) translateX(5px)}}@keyframes wv{50%{transform:translateX(34px);opacity:.05}}`);
  }

  function skyline(t) {
    const a = 13.0, b = 5.2, ox = 112, oy = 90;
    const first = end - (364 + new Date(end).getUTCDay()) * DAY, cells = [];
    let total = 0;
    for (let i = 0; first + i * DAY <= end; i++) { const v = count(first + i * DAY); total += v; cells.push({ w: Math.floor(i / 7), k: i % 7, v }); }
    const body = cells.sort((p, q) => (p.w + p.k) - (q.w + q.k)).map(({ w, k, v }) => {
      const x = ox + (w - k) * a, y = oy + (w + k) * b, h = v ? 5 + Math.min(v, 30) * 2.6 : 0, g = .9, A = a * g, B = b * g;
      const top = `${f1(x)} ${f1(y - B - h)} ${f1(x + A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x - A)} ${f1(y - h)}`;
      if (!v) return `<polygon points="${top}" fill="${t.line}"/>`;
      const c = t.towers[v < 3 ? 0 : v < 6 ? 1 : v < 12 ? 2 : 3];
      return `<g class="up${v >= 12 ? ' hot' : ''}" style="animation-delay:${(w * .02).toFixed(2)}s"><polygon points="${f1(x - A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x)} ${f1(y + B)} ${f1(x - A)} ${f1(y)}" fill="${c[1]}"/><polygon points="${f1(x + A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x)} ${f1(y + B)} ${f1(x + A)} ${f1(y)}" fill="${c[2]}"/><polygon points="${top}" fill="${c[0]}"/></g>`;
    }).join('');
    return wrap(460, `${fmt(total)} contributions in the last year`, t, [[0, 0, W, 460]], `<text x="824" y="52" class="h" text-anchor="end">A year of work</text><text x="824" y="78" class="s" text-anchor="end">${fmt(total)} contributions</text>${body}`,
      `.up{transform-box:fill-box;transform-origin:50% 100%;animation:up .8s cubic-bezier(.2,.8,.2,1) backwards}@keyframes up{from{transform:scaleY(0);opacity:0}}.hot{animation:up .8s cubic-bezier(.2,.8,.2,1) backwards,hot 3.4s ease-in-out 2s infinite}@keyframes hot{50%{transform:scaleY(1.12)}}`);
  }

  function work(t) {
    const H = 452, sum = {}, where = { public: 0, private: 0, org: 0 };
    for (const m of Object.values(d.months)) for (const g of GROUPS) { const c = m[g]; if (!c) continue; where[g] += c.commits; for (const [l, v] of Object.entries(c.langs)) sum[l] = (sum[l] ?? 0) + v; }
    const e = new Date(end), recent = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth() - 11 + i, 1)).toISOString().slice(0, 7));
    const inMonth = (k, l) => GROUPS.reduce((n, g) => n + (d.months[k]?.[g]?.langs[l] ?? 0), 0);
    const all = Object.values(sum).reduce((p, q) => p + q, 0) || 1, ranked = Object.entries(sum).sort((p, q) => q[1] - p[1]);
    const color = l => t.s[LANGS.indexOf(l)] ?? t.other, pct = v => v / all < .01 ? '&lt;1%' : `${Math.round(v / all * 100)}%`;
    const R = 72, C = 2 * Math.PI * R, cx = 126, cy = 198, main = ranked.filter(([l]) => LANGS.includes(l)), rest = all - main.reduce((n, q) => n + q[1], 0);
    let at = 0;
    const arcs = [...main, ['Other', rest]].map(([l, v], i) => { const p = v / all, s = `<circle class="do" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${color(l)}" stroke-width="30" stroke-dasharray="${f1(Math.max(2, p * C - 3))} ${f1(C)}" transform="rotate(${f1(at * 360 - 90)} ${cx} ${cy})" style="animation-delay:${f1(i * .15)}s"/>`; at += p; return s; }).join('');
    const rows = ranked.slice(0, 8).map(([l, v], i) => {
      const y = 84 + i * 34, vals = recent.map(k => inMonth(k, l)).map(n => n < .05 ? 0 : n), m = Math.max(...vals);
      const spark = vals.map((n, k) => { const h = m ? Math.max(2, n / m * 21) : 2; return `<rect x="${414 + k * 9}" y="${f1(y + 3 - h)}" width="7" height="${f1(h)}" rx="1.5" fill="${n ? color(l) : t.line}" class="gr" style="animation-delay:${(i * .05 + k * .03).toFixed(2)}s"/>`; }).join('');
      return `<circle cx="248" cy="${y - 5}" r="6" fill="${color(l)}"/><text x="263" y="${y}" font-size="16">${l === 'PLpgSQL' ? 'SQL' : l}</text><text x="397" y="${y}" font-size="16" font-weight="600" text-anchor="end">${pct(v)}</text>${spark}`;
    }).join('');
    const total = where.public + where.private + where.org || 1, fills = [t.towers[1][0], t.sun, t.towers[3][0]];
    let x = 30;
    const split = [['Public', where.public], ['Private', where.private], ['Organization', where.org]].map(([n, v], i) => { const w = v / total * 492, s = `<rect x="${f1(x)}" y="366" width="${f1(Math.max(2, w - 3))}" height="18" rx="5" fill="${fills[i]}" class="rt"/>`; x += w; return s + `<circle cx="${36 + i * 160}" cy="407" r="6" fill="${fills[i]}"/><text x="${49 + i * 160}" y="412" font-size="15">${n} <tspan style="fill:${t.sub}">${fmt(v)}</tspan></text>`; }).join('');
    const hours = Array(24).fill(0);
    for (const g of GROUPS) (d.hours[g] ?? []).forEach((v, i) => { hours[i % 24] += v; });
    const hm = Math.max(...hours, 1), peak = hours.indexOf(hm), kx = 707, ky = 232;
    const bars = hours.map((v, i) => { const l = Math.max(12, v / hm * 62); return `<g transform="rotate(${i * 15} ${kx} ${ky})"><rect x="${kx - 5.5}" y="${ky - 112}" width="11" height="62" rx="5.5" fill="${t.line}" opacity=".6"/>${v ? `<rect class="gr" x="${kx - 5.5}" y="${f1(ky - 50 - l)}" width="11" height="${f1(l)}" rx="5.5" fill="${i === peak ? t.ink : t.coral}" style="animation-delay:${(i * .04).toFixed(2)}s"/>` : ''}</g>`; }).join('');
    const marks = [[0, 0, -120], [6, 125, 5], [12, 0, 131], [18, -125, 5]].map(([h, dx, dy]) => `<text x="${kx + dx}" y="${ky + dy}" class="s" text-anchor="middle">${h}</text>`).join('');
    return wrap(H, 'Languages: ' + ranked.slice(0, 8).map(([l, v]) => `${l} ${pct(v)}`).join(', ') + `. Most commits at ${peak}:00`, t, [[0, 0, 552, H], [554, 0, 306, H]], `<text x="30" y="44" class="h">Languages</text><text x="521" y="44" class="s" text-anchor="end">Last 12 months</text>${arcs}<text x="${cx}" y="${cy + 5}" font-size="30" font-weight="650" text-anchor="middle">${fmt(d.commits)}</text><text x="${cx}" y="${cy + 26}" class="s" text-anchor="middle">commits</text>${rows}${split}
<text x="${kx}" y="44" class="h" text-anchor="middle">When I commit</text>${bars}<g class="sw"><circle cx="${kx}" cy="${ky - 42}" r="4.5" fill="${t.coral}"/></g>${marks}<text x="${kx}" y="${ky + 4}" font-size="22" font-weight="650" text-anchor="middle">${peak}:00</text><text x="${kx}" y="${ky + 24}" class="s" text-anchor="middle">peak</text><text x="${kx}" y="412" class="s" text-anchor="middle">Colombo time</text>`,
    `.do{animation:do 1.2s cubic-bezier(.2,.7,.2,1) backwards}@keyframes do{from{stroke-dasharray:0 ${f1(C)}}}.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gr .8s backwards}@keyframes gr{from{transform:scaleY(0)}}.rt{transform-box:fill-box;transform-origin:0 50%;animation:rt .9s backwards}@keyframes rt{from{transform:scaleX(0)}}.sw{transform-origin:${kx}px ${ky}px;animation:sw 12s linear infinite}@keyframes sw{to{transform:rotate(360deg)}}`);
  }

  function commits(t) {
    const H = 392, N = 24, e = new Date(end), fills = [t.towers[1][0], t.sun, t.towers[3][0]], names = ['Public', 'Private', 'Organization'];
    const keys = Array.from({ length: N }, (_, i) => new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth() - N + 1 + i, 1)).toISOString().slice(0, 7));
    const rows = keys.map(k => GROUPS.map(g => d.months[k]?.[g]?.commits ?? 0)), sums = rows.map(r => r[0] + r[1] + r[2]);
    const max = Math.max(...sums, 1), best = sums.indexOf(max), X = i => 34 + i * 530 / N, bw = 530 / N - 5;
    const bars = rows.map((r, i) => {
      let y = 320;
      const seg = r.map((v, g) => { if (!v) return ''; const h = Math.max(2, v / max * 196); y -= h; return `<rect x="${f1(X(i))}" y="${f1(y)}" width="${f1(bw)}" height="${f1(Math.max(1.5, h - 1.5))}" rx="3" fill="${fills[g]}"/>`; }).join('');
      return `<g class="gr${i === best ? ' top' : ''}" style="animation-delay:${(i * .05).toFixed(2)}s">${seg || `<rect x="${f1(X(i))}" y="317" width="${f1(bw)}" height="3" rx="1.5" fill="${t.line}"/>`}</g>${i % 4 === 3 ? `<text x="${f1(X(i) + bw / 2)}" y="346" class="s" text-anchor="middle">${utc(keys[i] + '-01', { month: 'short' })} ${keys[i].slice(2, 4)}</text>` : ''}`;
    }).join('');
    const top = 320 - 196, bx = X(best) + bw / 2;
    const legend = names.map((n, g) => `<circle cx="${40 + g * 98 + (g > 1 ? 4 : 0)}" cy="76" r="6" fill="${fills[g]}"/><text x="${52 + g * 98 + (g > 1 ? 4 : 0)}" y="81" class="s">${n}</text>`).join('');
    const week = Array(7).fill(0);
    for (const g of GROUPS) (d.hours[g] ?? []).forEach((v, i) => { week[Math.floor(i / 24)] += v; });
    const wm = Math.max(...week, 1), bd = week.indexOf(wm);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((n, i) => { const y = 88 + i * 39, w = Math.max(10, week[i] / wm * 112); return `<text x="630" y="${y + 5}" font-size="16"${i === bd ? ' font-weight="700"' : ''}>${n}</text><rect x="674" y="${y - 9}" width="112" height="18" rx="9" fill="${t.line}" opacity=".6"/><rect class="rt" x="674" y="${y - 9}" width="${f1(w)}" height="18" rx="9" fill="${i === bd ? t.coral : t.towers[1][0]}" style="animation-delay:${(i * .08).toFixed(2)}s"/><text x="832" y="${y + 5}" class="s" text-anchor="end">${fmt(week[i])}</text>`; }).join('');
    return wrap(H, `Commits per month over two years, busiest month ${max}. Commits by weekday`, t, [[0, 0, 600, H], [602, 0, 258, H]], `<text x="34" y="44" class="h">Commits over two years</text>${legend}<rect x="34" y="320" width="530" height="1" fill="${t.line}"/>${bars}<text x="${f1(Math.min(540, Math.max(60, bx)))}" y="${top - 10}" font-size="16" font-weight="600" text-anchor="middle">${max}</text>
<text x="630" y="44" class="h">By weekday</text>${days}`,
    `.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gr .9s cubic-bezier(.2,.8,.2,1) backwards}@keyframes gr{from{transform:scaleY(0)}}.top{animation:gr .9s backwards,tp 2.6s ease-in-out 2.4s infinite}@keyframes tp{50%{opacity:.72}}.rt{transform-box:fill-box;transform-origin:0 50%;animation:rt .9s cubic-bezier(.2,.8,.2,1) backwards}@keyframes rt{from{transform:scaleX(0)}}`);
  }

  function growth(t) {
    const H = 372, by = {};
    d.calendar.counts.forEach((v, i) => { const y = utc(from + i * DAY, { year: 'numeric' }); by[y] = (by[y] ?? 0) + v; });
    const ys = Object.entries(by).slice(-5), max = Math.max(...ys.map(y => y[1]), 1), sw = 268 / ys.length;
    const towers = ys.map(([y, v], i) => { const h = Math.max(6, v / max * 200), x = 30 + i * sw + (sw - 42) / 2, top = 312 - h, c = t.towers[Math.min(i, 3)]; return `<g class="gr" style="animation-delay:${i * .18}s"><polygon points="${f1(x)} ${f1(top)} ${f1(x + 21)} ${f1(top + 9)} ${f1(x + 21)} 321 ${f1(x)} 312" fill="${c[1]}"/><polygon points="${f1(x + 42)} ${f1(top)} ${f1(x + 21)} ${f1(top + 9)} ${f1(x + 21)} 321 ${f1(x + 42)} 312" fill="${c[2]}"/><polygon points="${f1(x)} ${f1(top)} ${f1(x + 21)} ${f1(top - 9)} ${f1(x + 42)} ${f1(top)} ${f1(x + 21)} ${f1(top + 9)}" fill="${c[0]}"/></g><text x="${f1(x + 21)}" y="${f1(top - 16)}" font-size="16" font-weight="600" text-anchor="middle">${fmt(v)}</text><text x="${f1(x + 21)}" y="344" class="s" text-anchor="middle">${y}</text>`; }).join('');
    const wk = Array.from({ length: 52 }, (_, i) => { let s = 0; for (let k = 0; k < 7; k++) s += count(end - ((51 - i) * 7 + k) * DAY); return s; });
    const wm = Math.max(...wk, 1), best = wk.indexOf(wm), X = i => 364 + i * 462 / 51, Y = v => 306 - v / wm * 190;
    let path = `M${f1(X(0))} ${f1(Y(wk[0]))}`;
    for (let i = 1; i < 52; i++) { const m = (X(i - 1) + X(i)) / 2; path += `C${f1(m)} ${f1(Y(wk[i - 1]))} ${f1(m)} ${f1(Y(wk[i]))} ${f1(X(i))} ${f1(Y(wk[i]))}`; }
    const months = Array.from({ length: 6 }, (_, i) => { const w = 4 + i * 9; return `<text x="${f1(X(w))}" y="340" class="s" text-anchor="middle">${utc(end - (51 - w) * 7 * DAY, { month: 'short' })}</text>`; }).join('');
    return wrap(H, 'Contributions by year: ' + ys.map(([y, v]) => `${y} ${v}`).join(', '), t, [[0, 0, 328, H], [330, 0, 530, H]], `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.coral}" stop-opacity=".65"/><stop offset="1" stop-color="${t.coral}" stop-opacity="0"/></linearGradient></defs><text x="30" y="44" class="h">Contributions by year</text>${towers}
<text x="364" y="44" class="h">Weekly pulse</text><path class="in" style="animation-delay:.9s" d="${path}L${f1(X(51))} 306L${f1(X(0))} 306Z" fill="url(#g)"/><path class="ln" pathLength="1" d="${path}" fill="none" stroke="${t.coral}" stroke-width="3" stroke-linejoin="round"/><path class="run" pathLength="1" d="${path}" fill="none" stroke="#ffd75e" stroke-width="4" stroke-linecap="round"/><rect x="364" y="306" width="462" height="1" fill="${t.line}"/><circle class="ping" cx="${f1(X(best))}" cy="${f1(Y(wm))}" r="7" fill="${t.coral}"/><circle cx="${f1(X(best))}" cy="${f1(Y(wm))}" r="6" fill="${t.ink}" stroke="${t.hi}" stroke-width="2"/><text x="${f1(Math.min(800, Math.max(390, X(best))))}" y="${f1(Y(wm) - 16)}" font-size="16" font-weight="600" text-anchor="middle">${wm}</text>${months}`,
    `.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gr 1s cubic-bezier(.2,.8,.2,1) backwards}@keyframes gr{from{transform:scaleY(0)}}.ln{stroke-dasharray:1;animation:ln 2s backwards}@keyframes ln{from{stroke-dashoffset:1}}.run{stroke-dasharray:.04 .96;opacity:0;animation:run 6s linear 2s infinite}@keyframes run{0%{stroke-dashoffset:.04;opacity:0}6%,90%{opacity:1}100%{stroke-dashoffset:-.96;opacity:0}}.ping{transform-box:fill-box;transform-origin:center;animation:ping 2s ease-out infinite}@keyframes ping{from{opacity:.7}to{transform:scale(3.4);opacity:0}}`);
  }

  function badges(t) {
    const floor = (n, steps) => steps.filter(s => s <= n).pop() ?? n;
    const langs = new Set(); let night = 0;
    for (const m of Object.values(d.months)) for (const g of Object.values(m)) for (const [l, v] of Object.entries(g.langs)) if (v >= .5) langs.add(l);
    for (const g of GROUPS) (d.hours[g] ?? []).forEach((v, i) => { if (i % 24 >= 22 || i % 24 < 4) night += v; });
    const tens = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 3000, 5000, 10000];
    const list = [
      ['On fire', `${d.streak.longest.n} day streak`, '<path d="M12 1C13 7 21 10 21 17C21 21 17 24 12 24S3 21 3 17C3 13 6 11 7 8C8 10 9 11 11 11C12 8 11 5 12 1Z"/>'],
      ['Big day', `${d.best.n} in one day`, '<path d="M14 0 3 14h7L8 24 21 9h-8z"/>'],
      ['Summit', `${fmt(floor(d.contributions, tens))}+ contributions`, '<path d="M0 22 9 5l4 7 3-4 8 14z"/>'],
      ['Polyglot', `${langs.size} languages`, '<path d="M8 4 1 12l7 8 2-2-5-6 5-6zM16 4l7 8-7 8-2-2 5-6-5-6z"/>'],
      ['Builder', `${fmt(floor(d.repos.public + d.repos.private + d.repos.org, tens))}+ repositories`, '<path d="M12 0 24 6 12 12 0 6zM0 9.5 12 15.500 24 9.500V12L12 18 0 12zM0 15.500 12 21.500 24 15.500V18L12 24 0 18z"/>'],
      ['Teammate', `${fmt(floor(d.prs, tens))}+ pull requests`, '<path d="M4 2a3 3 0 0 1 1.500 5.600v8.800A3 3 0 1 1 2.500 16.400V7.600A3 3 0 0 1 4 2zM12 4l5-4v3h1a4 4 0 0 1 4 4v9.400a3 3 0 1 1-3 0V7a1 1 0 0 0-1-1h-1v3z"/>'],
      ['Steady', `${fmt(floor(d.activeDays, tens))}+ active days`, '<path d="M3 3h3V0h3v3h6V0h3v3h3v21H3zM6 10v11h12V10zM8 15l2-2 2 2 4-4 2 2-6 6z"/>'],
      ['Night owl', `${fmt(floor(night, tens))}+ late commits`, '<path d="M15 1A12 12 0 1 0 23 17 10 10 0 0 1 15 1z"/>'],
    ];
    const H = 416, body = list.map(([n, s, icon], i) => {
      const x = 117 + i % 4 * 209, y = 120 + Math.floor(i / 4) * 160;
      return `<g class="in" style="animation-delay:${(i * .1).toFixed(1)}s"><g class="bob" style="animation-delay:-${(i * .5).toFixed(1)}s"><path transform="translate(${x} ${y})" d="M0-44 38-22V22L0 44-38 22V-22Z" fill="url(#md)" stroke="#ffd79a" stroke-width="2" stroke-linejoin="round" filter="url(#sh)"/><g clip-path="url(#hx${i})"><rect class="shine" x="${x - 70}" y="${y - 60}" width="20" height="120" fill="#fff" opacity=".4" style="animation-delay:${(i * .4).toFixed(1)}s"/></g><g transform="translate(${x - 18} ${y - 18}) scale(1.5)" fill="#fff4dc" fill-rule="evenodd">${icon}</g></g><text x="${x}" y="${y + 68}" font-size="17" font-weight="600" text-anchor="middle">${n}</text><text x="${x}" y="${y + 89}" class="s" text-anchor="middle">${s}</text></g><clipPath id="hx${i}"><path transform="translate(${x} ${y})" d="M0-44 38-22V22L0 44-38 22V-22Z"/></clipPath>`;
    }).join('');
    return wrap(H, 'Achievements: ' + list.map(l => `${l[0]}, ${l[1]}`).join('; '), t, [[0, 0, W, H]], `<defs><linearGradient id="md" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f58a52"/><stop offset=".5" stop-color="#d9503f"/><stop offset="1" stop-color="#8f2c22"/></linearGradient></defs><text x="30" y="44" class="h">Achievements</text>${body}`,
    `.bob{animation:bob 4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-5px)}}.shine{animation:shine 5s ease-in-out infinite}@keyframes shine{0%,55%{transform:translateX(0) skewX(-16deg)}85%,100%{transform:translateX(190px) skewX(-16deg)}}`);
  }

  function stack(t) {
    const H = 336, body = ICONS.map(([n, p], i) => {
      const x = 76 + i % 9 * 88.5, y = 112 + Math.floor(i / 9) * 128;
      return `<g class="bob" style="animation-delay:-${((i % 9) * .28 + Math.floor(i / 9) * .6).toFixed(2)}s"><rect x="${f1(x - 30)}" y="${y - 30}" width="60" height="60" rx="16" fill="url(#ic)" filter="url(#sh)"/><path transform="translate(${f1(x - 16)} ${y - 16}) scale(1.333)" d="${p}" fill="#fff4dc"/></g><text x="${f1(x)}" y="${y + 56}" font-size="14" text-anchor="middle">${n}</text>`;
    }).join('');
    return wrap(H, 'Tech stack: ' + ICONS.map(i => i[0]).join(', '), t, [[0, 0, W, H]], `<defs><linearGradient id="ic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9745c"/><stop offset="1" stop-color="#a83b2e"/></linearGradient></defs><text x="30" y="44" class="h">Tech stack</text>${body}`,
    `.bob{animation:bob 3.4s ease-in-out infinite}@keyframes bob{50%{transform:translateY(-7px)}}`);
  }

  // Half-width tiles, one image each so each can link to its repository.
  function project(t, name, lines, art, css) {
    return wrap(430, `${name}: ${lines.join(' ')}`, t, [[0, 0, W, 430]], `<g transform="translate(560 70)">${art}</g><text x="44" y="104" font-size="44" font-weight="650" style="letter-spacing:-1px">${name.split('|').map((l, i) => `<tspan x="44" dy="${i ? 50 : 0}">${l}</tspan>`).join('')}</text>${lines.map((l, i) => `<text x="44" y="${238 + i * 42}" font-size="30" style="fill:${t.sub}">${l}</text>`).join('')}`, css);
  }
  const holidays = t => project(t, 'lk-holidays', ['Sri Lankan public, bank and', 'mercantile holidays, with', 'working-day helpers.'],
    `<rect width="236" height="230" rx="22" fill="#fff4dc" filter="url(#sh)"/><path d="M0 60V22Q0 0 22 0H214Q236 0 236 22V60Z" fill="${t.sun}"/>` + Array.from({ length: 20 }, (_, i) => `<rect class="${[3, 8, 14, 17].includes(i) ? 'pop' : ''}" x="${20 + i % 5 * 41}" y="${80 + Math.floor(i / 5) * 36}" width="30" height="25" rx="6" fill="${[3, 8, 14, 17].includes(i) ? '#d99a1c' : '#ecd9b8'}" style="animation-delay:-${i * .2}s"/>`).join(''),
    `.pop{transform-box:fill-box;transform-origin:center;animation:pop 2.4s ease-in-out infinite}@keyframes pop{50%{transform:scale(1.22)}}`);
  const students = t => project(t, 'student-|management-system', ['Students, batches,', 'attendance and admin', 'workflows.'],
    [0, 1, 2].map(i => `<g class="sl" style="animation-delay:${i * .25}s"><rect x="-24" y="${96 + i * 78}" width="262" height="64" rx="16" fill="#fff4dc" filter="url(#sh)"/><circle cx="14" cy="${128 + i * 78}" r="18" fill="${[t.sun, '#00908a', '#d99a1c'][i]}"/><rect x="46" y="${114 + i * 78}" width="${[110, 84, 124][i]}" height="10" rx="5" fill="#b5a592"/><rect x="46" y="${132 + i * 78}" width="${[70, 96, 60][i]}" height="8" rx="4" fill="#e0cfae"/><path class="ck" pathLength="1" style="animation-delay:${i * .5}s" d="M196 ${128 + i * 78}l9 10 17-20" fill="none" stroke="#00908a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>`).join(''),
    `.sl{animation:sl .8s backwards}@keyframes sl{from{transform:translateX(40px);opacity:0}}.ck{stroke-dasharray:1;animation:ck 5s ease-in-out infinite}@keyframes ck{0%{stroke-dashoffset:1}14%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}`);

  for (const [mode, t] of Object.entries(T)) for (const [n, fn] of Object.entries({ scene, skyline, commits, work, growth, badges, stack, holidays, students })) writeFileSync(`${out}${n}-${mode}.svg`, fn(t));
}
