// README cards. GitHub strips scripts from READMEs, so these animate with CSS only.
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LANGS = ['TypeScript', 'Go', 'Kotlin', 'JavaScript', 'Java', 'C#', 'HTML'];
const T = {
  light: { ink: '#1f2328', sub: '#59636e', line: '#d1d9e0', card: '#f6f8fa', ramp: ['#e6eaef', '#b7d3f6', '#6da7ec', '#2a78d6', '#184f95'], s: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'], other: '#8c959f' },
  dark: { ink: '#f0f6fc', sub: '#9198a1', line: '#3d444d', card: '#151b23', ramp: ['#21262d', '#184f95', '#2a78d6', '#6da7ec', '#b7d3f6'], s: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9'], other: '#7d8590' },
};
const W = 860, fmt = n => n.toLocaleString('en-US');
const pct = p => p < 1 ? '&lt;1%' : `${Math.round(p)}%`;
const date = d => new Date(d + 'T00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function render(d) {
  const out = fileURLToPath(new URL('../assets/', import.meta.url));
  mkdirSync(out, { recursive: true });
  const wrap = (h, label, t, body, card = true) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${label}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${t.ink}}.s{fill:${t.sub};font-size:15px}.h{font-size:19px;font-weight:600}.n{font-size:40px;font-weight:650;letter-spacing:-1px}
.up{transform-box:fill-box;transform-origin:bottom;animation:up .8s cubic-bezier(.2,.7,.2,1) backwards}.rt{transform-box:fill-box;transform-origin:left;animation:rt .9s cubic-bezier(.2,.7,.2,1) backwards}.in{animation:in .6s backwards}
@keyframes up{from{transform:scaleY(0)}}@keyframes rt{from{transform:scaleX(0)}}@keyframes in{from{opacity:0}}@media(prefers-reduced-motion:reduce){*{animation:none!important}}</style>
${card ? `<rect x=".5" y=".5" width="${W - 1}" height="${h - 1}" rx="14" fill="${t.card}" stroke="${t.line}"/>` : ''}${body}
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
    hero: t => wrap(172, 'Sasitha Ruvin, software engineer, Colombo', t, `<text x="0" y="72" font-size="68" font-weight="700" style="letter-spacing:-3px" class="in">Sasitha Ruvin</text>
<rect x="2" y="98" width="72" height="5" rx="2.5" fill="${t.s[0]}" class="rt"/>
<text x="1" y="140" font-size="23">Software engineer. Go, TypeScript and the systems around them.</text><text x="1" y="167" class="s">Colombo, Sri Lanka</text>`, false),
    overview: t => {
      const tiles = [[d.contributions, 'contributions'], [d.commits, 'commits'], [d.prs, 'pull requests'], [d.repos.public + d.repos.private + d.repos.org, 'repositories'], [d.activeDays, 'active days']];
      const st = d.streak;
      const streaks = [[st.current, 'Current streak', st.current ? `since ${date(st.from)}` : 'starts with the next commit'], [st.longest.n, 'Longest streak', st.longest.n ? `${date(st.longest.from)} to ${date(st.longest.to)}` : ''], [d.best.n, 'Best day', date(d.best.date)]];
      return wrap(252, `Current streak ${st.current} days, longest ${st.longest.n} days, ${fmt(d.contributions)} contributions`, t,
        streaks.map(([n, l, s], i) => `<g class="in" style="animation-delay:${i * .12}s"><text x="${28 + i * 275}" y="38" class="s">${l}</text><text x="${28 + i * 275}" y="92" font-size="54" font-weight="700" style="letter-spacing:-2px">${fmt(n)}<tspan font-size="18" font-weight="400" dx="8" style="letter-spacing:0;fill:${t.sub}">${i < 2 ? (n === 1 ? 'day' : 'days') : 'contributions'}</tspan></text><text x="${28 + i * 275}" y="120" class="s">${s}</text></g>`).join('') +
        `<rect x="28" y="144" width="${W - 56}" height="1" fill="${t.line}"/>` +
        tiles.map(([n, l], i) => `<g class="in" style="animation-delay:${.3 + i * .08}s"><text x="${28 + i * 165}" y="200" font-size="32" font-weight="650">${fmt(n)}</text><text x="${28 + i * 165}" y="226" class="s">${l}</text></g>`).join(''));
    },
    calendar: t => {
      const n = d.calendar.counts, from = Date.parse(d.calendar.from + 'T00:00Z');
      const end = Date.parse(d.updated + 'T00:00Z'), first = end - (364 + new Date(end).getUTCDay()) * 864e5;
      let body = '', total = 0, lastM = -1; const p = 15.2;
      for (let i = 0; ; i++) {
        const day = first + i * 864e5; if (day > end) break;
        const v = n[(day - from) / 864e5] ?? 0, w = Math.floor(i / 7), x = 28 + w * p; total += v;
        const lv = !v ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
        const D = new Date(day);
        if (i % 7 === 0 && D.getUTCMonth() !== lastM) { if (D.getUTCDate() < 8 && w < 51) body += `<text x="${x}" y="72" class="s">${D.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`; lastM = D.getUTCMonth(); }
        body += `<rect x="${x.toFixed(1)}" y="${84 + (i % 7) * p}" width="12.8" height="12.8" rx="3" fill="${t.ramp[lv]}" class="in" style="animation-delay:${(w * .012).toFixed(2)}s"/>`;
      }
      return wrap(236, `${fmt(total)} contributions in the last year`, t, `<text x="28" y="40" class="h">${fmt(total)} contributions in the last year</text>${body}<text x="640" y="218" class="s">Less</text>${t.ramp.map((c, i) => `<rect x="${684 + i * 20}" y="206" width="14" height="14" rx="3" fill="${c}"/>`).join('')}<text x="792" y="218" class="s">More</text>`);
    },
    languages: t => {
      const cols = [['Personal, public', ['public']], ['Personal, private', ['private']], ['Organizations', ['org']]];
      return wrap(402, 'Languages across personal and organization repositories', t, `<text x="28" y="40" class="h">Languages by where I work</text>` + cols.map(([title, g], c) => {
        const x = 28 + c * 276;
        const rows = langs(g).slice(0, 6);
        return `<text x="${x}" y="80" font-size="16" font-weight="600">${title}</text><text x="${x + 250}" y="80" class="s" text-anchor="end">${d.repos[g[0]]} repos</text>` + rows.map(([l, p], i) => { const y = 116 + i * 48;
          return `<text x="${x}" y="${y}" font-size="16">${l}</text><text x="${x + 250}" y="${y}" class="s" text-anchor="end">${pct(p)}</text><rect x="${x}" y="${y + 9}" width="250" height="8" rx="4" fill="${t.ramp[0]}"/><rect x="${x}" y="${y + 9}" width="${Math.max(8, p * 2.5).toFixed(1)}" height="8" rx="4" fill="${color(t, l)}" class="rt" style="animation-delay:${i * .07}s"/>`; }).join('');
      }).join(''));
    },
    months: t => {
      const rows = monthKeys.map(k => { const r = {}; for (const g of ALL) for (const [l, v] of Object.entries(d.months[k]?.[g]?.langs ?? {})) { const n = LANGS.includes(l) ? l : 'Other'; r[n] = (r[n] ?? 0) + v; } return r; });
      const sums = rows.map(r => Object.values(r).reduce((a, b) => a + b, 0)), max = Math.max(...sums, 1), names = [...LANGS, 'Other'].filter(l => rows.some(r => r[l] >= .5));
      let x = 28;
      const legend = names.map(l => { const s = `<rect x="${x}" y="58" width="11" height="11" rx="3" fill="${color(t, l)}"/><text x="${x + 17}" y="69" class="s">${l}</text>`; x += 40 + l.length * 8.2; return s; }).join('');
      return wrap(336, 'Commits per month by language', t, `<text x="28" y="40" class="h">Commits per month, by language</text>${legend}` + rows.map((r, i) => {
        let y = 290; const bx = 34 + i * 67.5;
        const seg = names.map(l => { const h = (r[l] ?? 0) / max * 180; if (h < 1) return ''; y -= h; return `<rect x="${bx}" y="${y.toFixed(1)}" width="44" height="${Math.max(h - 2, 1).toFixed(1)}" rx="2" fill="${color(t, l)}"/>`; }).join('');
        return `<g class="up" style="animation-delay:${i * .04}s">${seg}</g><text x="${bx + 22}" y="${(y - 7).toFixed(1)}" class="s" text-anchor="middle">${sums[i] >= .5 ? Math.round(sums[i]) : ''}</text><text x="${bx + 22}" y="314" class="s" text-anchor="middle">${new Date(monthKeys[i] + '-01T00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`;
      }).join('') + `<rect x="28" y="290" width="${W - 56}" height="1" fill="${t.line}"/>`);
    },
  };
  for (const [mode, t] of Object.entries(T)) for (const [n, f] of Object.entries(cards)) writeFileSync(`${out}${n}-${mode}.svg`, f(t));
}
