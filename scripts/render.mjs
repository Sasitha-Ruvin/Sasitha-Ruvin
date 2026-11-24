// README cards. GitHub strips scripts from READMEs, so these animate with CSS only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LANGS = ['TypeScript', 'Go', 'Kotlin', 'JavaScript', 'Java', 'C#', 'HTML'];
const T = {
  light: { ink: '#1f2328', sub: '#59636e', line: '#d1d9e0', card: '#f6f8fa', ramp: ['#e6eaef', '#b7d3f6', '#6da7ec', '#2a78d6', '#184f95'], s: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'], other: '#8c959f' },
  dark: { ink: '#f0f6fc', sub: '#9198a1', line: '#3d444d', card: '#151b23', ramp: ['#21262d', '#184f95', '#2a78d6', '#6da7ec', '#b7d3f6'], s: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9'], other: '#7d8590' },
};
const FLAME = 'M32 2C36 18 58 28 58 52C58 68 46 78 32 78C18 78 6 68 6 52C6 40 14 34 18 24C20 32 24 36 28 36C34 28 30 14 32 2Z';
const CORE = 'M32 44C35 51 44 55 44 64C44 72 39 77 32 77C25 77 20 72 20 64C20 56 29 52 32 44Z';
const W = 860, fmt = n => n.toLocaleString('en-US');
const pct = p => p < 1 ? '&lt;1%' : `${Math.round(p)}%`;
const date = d => new Date(d + 'T00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function render(d) {
  const out = fileURLToPath(new URL('../assets/', import.meta.url));
  mkdirSync(out, { recursive: true });
  const wrap = (h, label, t, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${label}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${t.ink}}.s{fill:${t.sub};font-size:15px}.h{font-size:19px;font-weight:600}.n{font-size:40px;font-weight:650;letter-spacing:-1px}
.up{transform-box:fill-box;transform-origin:bottom;animation:up .8s cubic-bezier(.2,.7,.2,1) backwards}.rt{transform-box:fill-box;transform-origin:left;animation:rt .9s cubic-bezier(.2,.7,.2,1) backwards}.in{animation:in .6s backwards}
@keyframes up{from{transform:scaleY(0)}}@keyframes rt{from{transform:scaleX(0)}}@keyframes in{from{opacity:0}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
${body}
</svg>\n`;
  const cur = new Date(d.updated + 'T00:00Z'), monthKeys = [];
  for (let i = 11; i >= 0; i--) monthKeys.push(new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
  const langs = (groups, keys = Object.keys(d.months)) => {
    const t = {};
    for (const k of keys) for (const g of groups) for (const [l, v] of Object.entries(d.months[k]?.[g]?.langs ?? {})) t[l] = (t[l] ?? 0) + v;
    const sum = Object.values(t).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([n, v]) => [n, v / sum * 100]);
  };
  const ALL = ['public', 'private', 'org'], color = (t, l) => t.s[LANGS.indexOf(l)] ?? t.other;

  const cards = {
    overview: t => {
      const st = d.streak;
      const flame = (lit, delay = 0) => lit
        ? `<g class="fl" style="animation-delay:-${delay}s"><path d="${FLAME}" fill="#f0441e"/><g class="fl2" style="animation-delay:-${delay + .4}s"><path d="${FLAME}" transform="translate(9.6 23.4) scale(.7)" fill="#ff8a1f"/></g><g class="fl3" style="animation-delay:-${delay + .2}s"><path d="${CORE}" fill="#ffd75e"/></g></g>`
        : `<path d="${FLAME}" fill="${t.line}"/>`;
      const embers = [[18, 0], [30, .7], [42, 1.3], [24, 1.9], [38, 2.4]].map(([x, w]) => `<circle class="em" cx="${x}" cy="26" r="2.4" fill="#ff8a1f" style="animation-delay:${w}s"/>`).join('');
      const days = n => n === 1 ? 'day' : 'days';
      const counts = d.calendar.counts, end = Date.parse(d.updated + 'T00:00Z');
      const week = Array.from({ length: 7 }, (_, i) => {
        const v = counts[counts.length - 7 + i] ?? 0, x = 238 + i * 64;
        const name = new Date(end - (6 - i) * 864e5).toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' });
        return `<g class="in" style="animation-delay:${(.4 + i * .1).toFixed(2)}s"><g transform="translate(${x - 14} 262) scale(.44)">${flame(v > 0, i * .23)}</g><text x="${x}" y="324" class="s" text-anchor="middle">${name}</text></g>`;
      }).join('');
      const side = (x, n, l) => `<g class="in" style="animation-delay:.3s"><text x="${x}" y="134" font-size="38" font-weight="650" text-anchor="middle" style="letter-spacing:-1px">${fmt(n)}</text><text x="${x}" y="163" class="s" text-anchor="middle">${l}</text></g>`;
      const anim = `<style>.fl,.fl2,.fl3{transform-box:fill-box;transform-origin:50% 100%}.fl{animation:fl 1.5s ease-in-out infinite}.fl2{animation:fl2 1.1s ease-in-out infinite}.fl3{animation:fl2 .8s ease-in-out infinite}.em{opacity:0;animation:em 3s ease-out infinite}
@keyframes fl{0%,100%{transform:scale(1) skewX(0)}25%{transform:scale(.96,1.05) skewX(-3deg)}50%{transform:scale(1.03,.96) skewX(2deg)}75%{transform:scale(.97,1.06) skewX(3deg)}}
@keyframes fl2{0%,100%{transform:scale(1)}40%{transform:scale(.9,1.1) skewX(4deg)}70%{transform:scale(1.06,.92) skewX(-4deg)}}
@keyframes em{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(8px,-48px) scale(.2);opacity:0}}</style>`;
      return wrap(344, `Current streak ${st.current} ${days(st.current)}, longest ${st.longest.n} days, ${fmt(d.contributions)} contributions`, t, anim +
        `<g transform="translate(380.4 12) scale(1.55)">${st.current ? embers : ''}${flame(st.current > 0)}</g>
<text x="430" y="196" font-size="62" font-weight="700" text-anchor="middle" style="letter-spacing:-2px" class="in">${fmt(st.current)}</text><text x="430" y="228" class="s" text-anchor="middle">day streak</text>` +
        side(140, d.contributions, 'contributions') + side(720, st.longest.n, 'longest streak') + week);
    },
    calendar: t => {
      const n = d.calendar.counts, from = Date.parse(d.calendar.from + 'T00:00Z');
      const end = Date.parse(d.updated + 'T00:00Z'), first = end - (364 + new Date(end).getUTCDay()) * 864e5;
      let body = '', total = 0, lastM = -1; const p = 16.2;
      for (let i = 0; ; i++) {
        const day = first + i * 864e5; if (day > end) break;
        const v = n[(day - from) / 864e5] ?? 0, w = Math.floor(i / 7), x = w * p; total += v;
        const lv = !v ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
        const D = new Date(day);
        if (i % 7 === 0 && D.getUTCMonth() !== lastM) { if (D.getUTCDate() < 8 && w < 51) body += `<text x="${x}" y="72" class="s">${D.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`; lastM = D.getUTCMonth(); }
        body += `<rect x="${x.toFixed(1)}" y="${84 + (i % 7) * p}" width="13.4" height="13.4" rx="3" fill="${t.ramp[lv]}" class="in" style="animation-delay:${(w * .012).toFixed(2)}s"/>`;
      }
      return wrap(236, `${fmt(total)} contributions in the last year`, t, `<text x="0" y="28" class="h">${fmt(total)} contributions in the last year</text>${body}<text x="640" y="218" class="s">Less</text>${t.ramp.map((c, i) => `<rect x="${684 + i * 20}" y="206" width="14" height="14" rx="3" fill="${c}"/>`).join('')}<text x="792" y="218" class="s">More</text>`);
    },
    languages: t => {
      const cols = [['Personal, public', ['public']], ['Personal, private', ['private']], ['Organizations', ['org']]];
      return wrap(306, 'Languages across personal and organization repositories', t, `<text x="0" y="28" class="h">Languages</text>` + cols.map(([title, g], c) => {
        const x = c * 305;
        const rows = langs(g).slice(0, 4);
        return `<text x="${x}" y="80" class="s">${title}</text>` + rows.map(([l, p], i) => { const y = 116 + i * 48;
          return `<text x="${x}" y="${y}" font-size="16">${l}</text><text x="${x + 250}" y="${y}" class="s" text-anchor="end">${pct(p)}</text><rect x="${x}" y="${y + 9}" width="250" height="8" rx="4" fill="${t.ramp[0]}"/><rect x="${x}" y="${y + 9}" width="${Math.max(8, p * 2.5).toFixed(1)}" height="8" rx="4" fill="${color(t, l)}" class="rt" style="animation-delay:${i * .07}s"/>`; }).join('');
      }).join(''));
    },
    months: t => {
      const rows = monthKeys.map(k => { const r = {}; for (const g of ALL) for (const [l, v] of Object.entries(d.months[k]?.[g]?.langs ?? {})) { const n = LANGS.includes(l) ? l : 'Other'; r[n] = (r[n] ?? 0) + v; } return r; });
      const sums = rows.map(r => Object.values(r).reduce((a, b) => a + b, 0)), max = Math.max(...sums, 1), names = [...LANGS, 'Other'].filter(l => rows.some(r => r[l] >= .5));
      let x = 28;
      const legend = names.map(l => { const s = `<rect x="${x}" y="58" width="11" height="11" rx="3" fill="${color(t, l)}"/><text x="${x + 17}" y="69" class="s">${l}</text>`; x += 40 + l.length * 8.2; return s; }).join('');
      return wrap(336, 'Commits per month by language', t, `<text x="0" y="28" class="h">Commits per month, by language</text>${legend}` + rows.map((r, i) => {
        let y = 290; const bx = 34 + i * 67.5;
        const seg = names.map(l => { const h = (r[l] ?? 0) / max * 180; if (h < 1) return ''; y -= h; return `<rect x="${bx}" y="${y.toFixed(1)}" width="44" height="${Math.max(h - 2, 1).toFixed(1)}" rx="2" fill="${color(t, l)}"/>`; }).join('');
        return `<g class="up" style="animation-delay:${i * .04}s">${seg}</g><text x="${bx + 22}" y="${(y - 7).toFixed(1)}" class="s" text-anchor="middle">${sums[i] >= .5 ? Math.round(sums[i]) : ''}</text><text x="${bx + 22}" y="314" class="s" text-anchor="middle">${new Date(monthKeys[i] + '-01T00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`;
      }).join('') + `<rect x="28" y="290" width="${W - 56}" height="1" fill="${t.line}"/>`);
    },
  };
  for (const [mode, t] of Object.entries(T)) for (const [n, f] of Object.entries(cards)) writeFileSync(`${out}${n}-${mode}.svg`, f(t));
}
