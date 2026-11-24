// README charts in the avatar's palette: coral sun, cream sky, black silhouettes.
// GitHub strips scripts from READMEs, so everything animates with CSS only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LANGS = ['TypeScript', 'Go', 'JavaScript', 'HTML', 'Kotlin'];
const T = {
  light: { bg: '#f6ecd9', ink: '#1d1918', sub: '#6b5d51', line: '#dccdb3', hill1: '#cf8a72', hill2: '#1d1918', sun: '#e2604d', coral: '#d9503f', s: ['#d9503f', '#00908a', '#d99a1c', '#7a56a8', '#6f8f2f'], other: '#a3937f', towers: [['#f0c9a4', '#dcae86', '#c99a72'], ['#ee9b76', '#d9805c', '#c36d4b'], ['#e2604d', '#c44a3a', '#a83b2e'], ['#3a2a28', '#2a1e1c', '#1d1514']] },
  dark: { bg: '#1b1716', ink: '#f6ecd9', sub: '#b5a592', line: '#3b322e', hill1: '#7c3b31', hill2: '#0c0a09', sun: '#e2604d', coral: '#e8604c', s: ['#e8604c', '#00a198', '#bd8110', '#9a78cc', '#7c9c38'], other: '#85776a', towers: [['#6b352d', '#552a24', '#43211c'], ['#a8483a', '#8a392d', '#702e24'], ['#e8604c', '#c44a3a', '#a03a2d'], ['#f9d9a8', '#e0b983', '#c79d68']] },
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

  const wrap = (h, label, t, body, css = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${label}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${t.ink}}.s{fill:${t.sub};font-size:15px}.h{font-size:20px;font-weight:600}.in{animation:in .7s backwards}@keyframes in{from{opacity:0}}${css}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
<clipPath id="c"><rect width="${W}" height="${h}" rx="20"/></clipPath><g clip-path="url(#c)"><rect width="${W}" height="${h}" fill="${t.bg}"/>${body}</g>
</svg>\n`;

  const flame = (lit, t, w = 0) => lit
    ? `<g class="fl" style="animation-delay:-${w}s"><path d="${FLAME}" fill="#ef4423"/><g class="f2" style="animation-delay:-${w + .4}s"><path d="${FLAME}" transform="translate(9.6 23.4) scale(.7)" fill="#ff8a1f"/></g><g class="f2" style="animation-delay:-${w + .2}s"><path d="${CORE}" fill="#ffd75e"/></g></g>`
    : `<path d="${FLAME}" fill="${t.line}"/>`;

  function streak(t) {
    const cx = 430, cy = 226, R = 132, st = d.streak, lit = st.current > 0;
    const ring = (n, r, scale, color, speed) => Array.from({ length: n }, (_, i) => {
      const a = i * 360 / n + (scale < 1 ? 180 / n : 0), k = scale * (.85 + ((i * 7) % 5) * .1);
      return `<g transform="translate(${cx} ${cy}) rotate(${f1(a)}) translate(0 -${r}) scale(${k.toFixed(2)})"><path class="to" d="${TONGUE}" fill="${color}" style="animation-duration:${(speed + (i % 4) * .17).toFixed(2)}s;animation-delay:-${((i * 37) % 100 / 60).toFixed(2)}s"/></g>`;
    }).join('');
    const embers = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 137.5) * Math.PI / 180, r = R + 14;
      return `<circle class="em" cx="${f1(cx + Math.cos(a) * r)}" cy="${f1(cy + Math.sin(a) * r)}" r="${2 + i % 3 * .7}" fill="${i % 2 ? '#ff8a1f' : '#ffc24a'}" style="animation-delay:${(i * .31).toFixed(2)}s"/>`;
    }).join('');
    const pr = R - 12, C = 2 * Math.PI * pr, frac = st.longest.n ? Math.min(1, st.current / st.longest.n) : 0;
    const week = Array.from({ length: 7 }, (_, i) => {
      const day = end - (6 - i) * DAY, x = 226 + i * 68;
      return `<g class="in" style="animation-delay:${(.4 + i * .1).toFixed(1)}s"><g transform="translate(${x - 16} 474) scale(.5)">${flame(count(day) > 0, { line: '#5a4a44' }, i * .23)}</g><text x="${x}" y="536" font-size="15" text-anchor="middle" style="fill:#f6ecd9">${utc(day, { weekday: 'narrow' })}</text></g>`;
    }).join('');
    return wrap(560, `Current streak ${st.current} days, longest streak ${st.longest.n} days`, t, `
<path d="M0 392 120 340 210 372 330 318 450 366 590 312 700 360 790 330 860 356V560H0Z" fill="${t.hill1}" opacity=".55"/>
${lit ? ring(34, R - 2, 1.3, '#d93a1e', 1.1) + ring(34, R - 3, .95, '#ff8a1f', .9) + ring(30, R - 4, .58, '#ffd75e', .75) : ''}
<circle cx="${cx}" cy="${cy}" r="${R}" fill="${lit ? t.sun : t.line}"/>
<circle cx="${cx}" cy="${cy}" r="${pr}" fill="none" stroke="#1d1918" stroke-opacity=".22" stroke-width="8"/>
<circle class="arc" cx="${cx}" cy="${cy}" r="${pr}" fill="none" stroke="#fff4dc" stroke-width="8" stroke-linecap="round" stroke-dasharray="${f1(C * frac)} ${f1(C)}" transform="rotate(-90 ${cx} ${cy})"/>
${lit ? embers : ''}
<text x="${cx}" y="${cy + 22}" font-size="104" font-weight="700" text-anchor="middle" style="fill:#fff4dc;letter-spacing:-4px">${st.current}</text>
<text x="${cx}" y="${cy + 56}" font-size="18" font-weight="600" text-anchor="middle" style="fill:#1d1918">day streak</text>
<text x="${cx}" y="${cy + 80}" font-size="15" text-anchor="middle" style="fill:#1d1918">best ${st.longest.n}</text>
<path d="M0 452C90 420 150 446 240 436S400 452 520 440 700 420 860 446V560H0Z" fill="${t.hill2}"/>${week}`,
    `.to{transform-origin:0 0;animation:to 1s ease-in-out infinite alternate}.arc{animation:arc 1.4s cubic-bezier(.2,.7,.2,1) backwards}.em{opacity:0;animation:em 4s ease-out infinite}.fl,.f2{transform-box:fill-box;transform-origin:50% 100%}.fl{animation:fl 1.5s ease-in-out infinite}.f2{animation:f2 1s ease-in-out infinite}
@keyframes to{0%{transform:scale(1,.7) skewX(-9deg)}50%{transform:scale(.9,1.12) skewX(5deg)}100%{transform:scale(1.06,.86) skewX(13deg)}}
@keyframes arc{from{stroke-dasharray:0 ${f1(C)}}}@keyframes em{0%{transform:none;opacity:0}12%{opacity:1}100%{transform:translate(14px,-110px);opacity:0}}
@keyframes fl{0%,100%{transform:none}30%{transform:scale(.95,1.06) skewX(-3deg)}65%{transform:scale(1.03,.96) skewX(3deg)}}@keyframes f2{0%,100%{transform:none}50%{transform:scale(.9,1.1) skewX(4deg)}}`);
  }

  function skyline(t) {
    const a = 13.2, b = 5.4, ox = 110, oy = 92;
    const first = end - (364 + new Date(end).getUTCDay()) * DAY, cells = [];
    let total = 0;
    for (let i = 0; first + i * DAY <= end; i++) { const v = count(first + i * DAY); total += v; cells.push({ w: Math.floor(i / 7), k: i % 7, v }); }
    const body = cells.sort((p, q) => (p.w + p.k) - (q.w + q.k)).map(({ w, k, v }) => {
      const x = ox + (w - k) * a, y = oy + (w + k) * b, h = v ? 5 + Math.min(v, 30) * 2.6 : 0, g = .9, A = a * g, B = b * g;
      const top = `${f1(x)} ${f1(y - B - h)} ${f1(x + A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x - A)} ${f1(y - h)}`;
      if (!v) return `<polygon points="${top}" fill="${t.line}"/>`;
      const c = t.towers[v < 3 ? 0 : v < 6 ? 1 : v < 12 ? 2 : 3];
      return `<g class="up" style="animation-delay:${(w * .02).toFixed(2)}s"><polygon points="${f1(x - A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x)} ${f1(y + B)} ${f1(x - A)} ${f1(y)}" fill="${c[1]}"/><polygon points="${f1(x + A)} ${f1(y - h)} ${f1(x)} ${f1(y + B - h)} ${f1(x)} ${f1(y + B)} ${f1(x + A)} ${f1(y)}" fill="${c[2]}"/><polygon points="${top}" fill="${c[0]}"/></g>`;
    }).join('');
    return wrap(460, `${fmt(total)} contributions in the last year`, t, `<text x="824" y="52" class="h" text-anchor="end">A year of work</text><text x="824" y="78" class="s" text-anchor="end">${fmt(total)} contributions</text>${body}`,
      `.up{transform-box:fill-box;transform-origin:50% 100%;animation:up .8s cubic-bezier(.2,.8,.2,1) backwards}@keyframes up{from{transform:scaleY(0);opacity:0}}`);
  }

  function languages(t) {
    const sum = {}, last = {}, where = { public: 0, private: 0, org: 0 }, keys = Object.keys(d.months).sort();
    const recent = Array.from({ length: 12 }, (_, i) => { const e = new Date(end); return new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth() - 11 + i, 1)).toISOString().slice(0, 7); });
    const inMonth = (k, l) => GROUPS.reduce((n, g) => n + (d.months[k]?.[g]?.langs[l] ?? 0), 0);
    for (const k of keys) for (const g of GROUPS) {
      const c = d.months[k][g]; if (!c) continue;
      where[g] += c.commits;
      for (const [l, v] of Object.entries(c.langs)) { sum[l] = (sum[l] ?? 0) + v; if (v >= .05) last[l] = k; }
    }
    const all = Object.values(sum).reduce((p, q) => p + q, 0) || 1, ranked = Object.entries(sum).sort((p, q) => q[1] - p[1]);
    const color = l => t.s[LANGS.indexOf(l)] ?? t.other, pct = v => v / all < .01 ? '&lt;1%' : `${Math.round(v / all * 100)}%`;
    const R = 112, C = 2 * Math.PI * R, cx = 172, cy = 240;
    const main = ranked.filter(([l]) => LANGS.includes(l)), rest = all - main.reduce((n, r) => n + r[1], 0);
    let at = 0;
    const arcs = [...main, ['Other', rest]].map(([l, v], i) => { const p = v / all, s = `<circle class="do" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${color(l)}" stroke-width="40" stroke-dasharray="${f1(Math.max(2, p * C - 3))} ${f1(C)}" transform="rotate(${f1(at * 360 - 90)} ${cx} ${cy})" style="animation-delay:${f1(i * .15)}s"/>`; at += p; return s; }).join('');
    const rows = ranked.slice(0, 8).map(([l, v], i) => {
      const y = 94 + i * 44, vals = recent.map(k => inMonth(k, l)).map(n => n < .05 ? 0 : n), m = Math.max(...vals);
      const spark = vals.map((n, k) => `<rect x="${564 + k * 12}" y="${f1(y + 5 - (m ? Math.max(2, n / m * 24) : 2))}" width="9" height="${f1(m ? Math.max(2, n / m * 24) : 2)}" rx="2" fill="${n ? color(l) : t.line}" class="gr" style="animation-delay:${(i * .05 + k * .03).toFixed(2)}s"/>`).join('');
      return `<circle cx="352" cy="${y - 5}" r="7" fill="${color(l)}"/><text x="370" y="${y}" font-size="17">${l === 'PLpgSQL' ? 'SQL' : l}</text><text x="532" y="${y}" font-size="17" font-weight="600" text-anchor="end">${pct(v)}</text>${spark}<text x="824" y="${y}" class="s" text-anchor="end">${last[l] ? utc(last[l] + '-01', { month: 'short', year: 'numeric' }) : ''}</text>`;
    }).join('');
    const total = where.public + where.private + where.org || 1, fills = [t.towers[1][0], t.sun, t.towers[3][0]];
    let x = 36;
    const split = [['Public', where.public], ['Private', where.private], ['Organizations', where.org]].map(([n, v], i) => { const w = v / total * 788, s = `<rect x="${f1(x)}" y="456" width="${f1(Math.max(2, w - 3))}" height="22" rx="5" fill="${fills[i]}" class="rt"/><text x="${f1(x)}" y="504" font-size="16">${n} <tspan style="fill:${t.sub}">${fmt(v)} commits</tspan></text>`; x += w; return s; }).join('');
    return wrap(536, 'Languages: ' + ranked.slice(0, 8).map(([l, v]) => `${l} ${pct(v)}`).join(', '), t, `<text x="36" y="48" class="h">Languages</text><text x="532" y="48" class="s" text-anchor="end">Share</text><text x="564" y="48" class="s">Last 12 months</text><text x="824" y="48" class="s" text-anchor="end">Last used</text>
${arcs}<text x="${cx}" y="${cy + 6}" font-size="38" font-weight="650" text-anchor="middle" style="letter-spacing:-1px">${fmt(d.commits)}</text><text x="${cx}" y="${cy + 30}" class="s" text-anchor="middle">commits</text>${rows}${split}`,
      `.do{animation:do 1.2s cubic-bezier(.2,.7,.2,1) backwards}@keyframes do{from{stroke-dasharray:0 ${f1(C)}}}.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gr .7s backwards}@keyframes gr{from{transform:scaleY(0)}}.rt{transform-box:fill-box;transform-origin:0 50%;animation:rt .9s backwards}@keyframes rt{from{transform:scaleX(0)}}`);
  }

  function rhythm(t) {
    const hours = Array(24).fill(0);
    for (const g of GROUPS) (d.hours[g] ?? []).forEach((v, i) => { hours[i % 24] += v; });
    const hm = Math.max(...hours, 1), peak = hours.indexOf(hm), cx = 168, cy = 208;
    const bars = hours.map((v, i) => { const l = v / hm * 66; return `<g transform="rotate(${i * 15} ${cx} ${cy})"><rect x="${cx - 6}" y="${cy - 54 - 66}" width="12" height="66" rx="6" fill="${t.line}" opacity=".55"/>${v ? `<rect class="gr" x="${cx - 6}" y="${f1(cy - 54 - Math.max(l, 12))}" width="12" height="${f1(Math.max(l, 12))}" rx="6" fill="${i === peak ? t.ink : t.coral}" style="animation-delay:${(i * .04).toFixed(2)}s"/>` : ''}</g>`; }).join('');
    const marks = [[0, 0, -130], [6, 138, 5], [12, 0, 141], [18, -138, 5]].map(([h, x, y]) => `<text x="${cx + x}" y="${cy + y}" class="s" text-anchor="middle">${h}</text>`).join('');
    const wk = Array.from({ length: 52 }, (_, i) => { let s = 0; for (let k = 0; k < 7; k++) s += count(end - ((51 - i) * 7 + k) * DAY); return s; });
    const max = Math.max(...wk, 1), best = wk.indexOf(max), X = i => 372 + i * 448 / 51, Y = v => 320 - v / max * 190;
    let path = `M${f1(X(0))} ${f1(Y(wk[0]))}`;
    for (let i = 1; i < 52; i++) { const m = (X(i - 1) + X(i)) / 2; path += `C${f1(m)} ${f1(Y(wk[i - 1]))} ${f1(m)} ${f1(Y(wk[i]))} ${f1(X(i))} ${f1(Y(wk[i]))}`; }
    const months = Array.from({ length: 6 }, (_, i) => { const w = 4 + i * 9; return `<text x="${f1(X(w))}" y="348" class="s" text-anchor="middle">${utc(end - (51 - w) * 7 * DAY, { month: 'short' })}</text>`; }).join('');
    return wrap(380, `Most commits at ${peak}:00. Busiest week ${max} contributions`, t, `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.coral}" stop-opacity=".6"/><stop offset="1" stop-color="${t.coral}" stop-opacity="0"/></linearGradient></defs>
<text x="${cx}" y="46" class="h" text-anchor="middle">Hours</text>${bars}${marks}<text x="${cx}" y="${cy + 5}" font-size="22" font-weight="650" text-anchor="middle">${peak}:00</text><text x="${cx}" y="${cy + 24}" class="s" text-anchor="middle">peak</text>
<text x="372" y="46" class="h">Weeks</text><path class="in" style="animation-delay:.9s" d="${path}L${f1(X(51))} 320L${f1(X(0))} 320Z" fill="url(#g)"/><path class="ln" pathLength="1" d="${path}" fill="none" stroke="${t.coral}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="372" y="320" width="448" height="1" fill="${t.line}"/>
<circle cx="${f1(X(best))}" cy="${f1(Y(max))}" r="6" fill="${t.ink}" stroke="${t.bg}" stroke-width="2"/><text x="${f1(Math.min(780, Math.max(400, X(best))))}" y="${f1(Y(max) - 16)}" font-size="16" font-weight="600" text-anchor="middle">${max}</text>${months}`,
      `.gr{transform-box:fill-box;transform-origin:50% 100%;animation:gr .9s cubic-bezier(.2,.8,.2,1) backwards}@keyframes gr{from{transform:scaleY(0)}}.ln{stroke-dasharray:1;animation:ln 2s ease-out backwards}@keyframes ln{from{stroke-dashoffset:1}}`);
  }

  for (const [mode, t] of Object.entries(T)) for (const [n, fn] of Object.entries({ streak, skyline, languages, rhythm })) writeFileSync(`${out}${n}-${mode}.svg`, fn(t));
}
