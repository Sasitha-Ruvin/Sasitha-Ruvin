// Builds the profile SVGs from git history. Only aggregates are written:
// no private repository, organization or file names are logged or published.
//   CI:    STATS_TOKEN=... node scripts/stats.mjs
//   Local: node scripts/stats.mjs --local <folder of clones>
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const USER = 'Sasitha-Ruvin';
const TOKEN = process.env.STATS_TOKEN;
const localRoot = process.argv[2] === '--local' ? process.argv[3] : null;
const OUT = new URL('../assets/', import.meta.url).pathname;
// EXTRA_EMAILS (optional secret, comma separated) covers other commit addresses.
const EMAILS = new Set([
  '143161107+sasitha-ruvin@users.noreply.github.com',
  'sasitha-ruvin@users.noreply.github.com',
  'sasitharuween@gmail.com',
  ...(process.env.EXTRA_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
]);
const LANG = {
  go: 'Go', ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
  mjs: 'JavaScript', cjs: 'JavaScript', kt: 'Kotlin', kts: 'Kotlin', java: 'Java', cs: 'C#', py: 'Python',
  php: 'PHP', dart: 'Dart', c: 'C/C++', h: 'C/C++', cpp: 'C/C++', hpp: 'C/C++', ino: 'C/C++', html: 'HTML',
  css: 'CSS', scss: 'CSS', sql: 'SQL', prisma: 'Prisma', swift: 'Swift', rs: 'Rust', sh: 'Shell',
};
const SKIP = /(^|\/)(node_modules|vendor|dist|build|out|\.next|generated|gen|bin|obj|target|bower_components)\/|\.min\.|\.(designer|g)\.cs$|\.d\.ts$|\.sql\.go$|\.pb\.go$/i;
const MAX_FILE_LINES = 2000; // a single change this large is an import or generated file

async function api(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { accept: 'application/vnd.github+json', ...(TOKEN && { authorization: `Bearer ${TOKEN}` }) },
  });
  if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
  return r.json();
}

async function listRepos() {
  const urls = new Set();
  const base = TOKEN ? '/user/repos?affiliation=owner,collaborator,organization_member' : `/users/${USER}/repos?type=owner`;
  for (let p = 1; ; p++) {
    const page = await api(`${base}&per_page=100&page=${p}`);
    page.filter(r => !r.fork).forEach(r => urls.add(`https://github.com/${r.full_name}.git`));
    if (page.length < 100) break;
  }
  // Repositories contributed to without being a member.
  for (let p = 1; p <= 10; p++) {
    const { items } = await api(`/search/commits?q=author:${USER}&sort=author-date&per_page=100&page=${p}`);
    items.filter(i => !i.repository.fork).forEach(i => urls.add(`https://github.com/${i.repository.full_name}.git`));
    if (items.length < 100) break;
  }
  return [...urls];
}

const seen = new Set();
const commits = [];
let repoCount = 0;

function readRepo(dir, refs) {
  const log = execFileSync('git', ['-C', dir, 'log', refs, '--no-merges', '--no-renames', '--numstat',
    '--format=%x01%ae%x02%at%x02%s'], { encoding: 'utf8', maxBuffer: 1 << 30, stdio: ['ignore', 'pipe', 'ignore'] });
  let found = false;
  for (const block of log.split('\x01').slice(1)) {
    const [head, ...rows] = block.split('\n');
    const [email, at, subject] = head.split('\x02');
    if (!EMAILS.has(email.toLowerCase())) continue;
    const key = `${at}|${subject}`; // the same commit rebased, or copied to another repo
    if (seen.has(key)) continue;
    seen.add(key);
    found = true;
    const lines = {};
    for (const row of rows) {
      const [add, , file] = row.split('\t');
      const lang = file && LANG[file.replace(/"$/, '').split('.').pop().toLowerCase()];
      if (!lang || SKIP.test(file) || !(+add <= MAX_FILE_LINES)) continue;
      lines[lang] = (lines[lang] ?? 0) + +add;
    }
    commits.push({ at: +at, lines });
  }
  if (found) repoCount++;
}

function localRepos(root, depth = 0) {
  return readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).flatMap(e => {
    const dir = join(root, e.name);
    return [...(existsSync(join(dir, '.git')) ? [dir] : []), ...(depth < 1 ? localRepos(dir, depth + 1) : [])];
  });
}

if (!TOKEN && !localRoot) throw new Error('STATS_TOKEN is not set: private and organization work would be missing.');
if (localRoot) for (const d of localRepos(localRoot)) readRepo(d, '--remotes');

const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
if (TOKEN) Object.assign(env, {
  GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
  GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${TOKEN}`).toString('base64')}`,
});
const tmp = mkdtempSync(join(tmpdir(), 'stats-'));
try {
  const repos = await listRepos();
  for (const [i, url] of repos.entries()) {
    const dir = join(tmp, String(i));
    try {
      execFileSync('git', ['clone', '--bare', '--quiet', url, dir], { env, stdio: 'ignore', timeout: 300000 });
      readRepo(dir, '--branches');
    } catch { throw new Error(`Could not read repository ${i + 1} of ${repos.length}`); } // name withheld
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(`Read ${repos.length} remote repositories`);
} finally { rmSync(tmp, { recursive: true, force: true }); }

// ---- aggregate
const DAY = 86400, now = Date.now() / 1000;
const recent = days => commits.filter(c => c.at > now - days * DAY);
const day = at => new Date((at + 19800) * 1000).toISOString().slice(0, 10); // Colombo, UTC+5:30
function languages(list) {
  // Each commit counts once, split by the lines it added per language, so a
  // bulk import cannot outweigh months of ordinary work.
  const t = {};
  for (const c of list) {
    const total = Object.values(c.lines).reduce((a, b) => a + b, 0);
    if (total) for (const [l, n] of Object.entries(c.lines)) t[l] = (t[l] ?? 0) + n / total;
  }
  const sum = Object.values(t).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, n]) => ({ name, pct: n / sum * 100 }));
}
const weeks = Array(52).fill(0);
for (const c of commits) {
  const w = 51 - Math.floor((now - c.at) / (7 * DAY));
  if (w >= 0 && w < 52) weeks[w]++;
}
const data = {
  updated: day(now), commits: commits.length, commitsYear: recent(364).length, repositories: repoCount,
  activeDays: new Set(commits.map(c => day(c.at))).size, weeks,
  languagesAll: languages(commits), languagesRecent: languages(recent(90)),
};
const statsFile = join(OUT, 'stats.json');
if (existsSync(statsFile) && !process.env.ALLOW_DROP) {
  const prev = JSON.parse(readFileSync(statsFile, 'utf8'));
  if (data.commits < prev.commits * 0.95)
    throw new Error(`Commits fell from ${prev.commits} to ${data.commits}; the token has probably lost access. Set ALLOW_DROP=1 to accept.`);
}
writeFileSync(statsFile, JSON.stringify(data, null, 2) + '\n');

// ---- render
const THEMES = {
  light: { ink: '#1f2328', sub: '#59636e', line: '#d1d9e0', track: '#eff2f5', accent: '#0f766e' },
  dark: { ink: '#f0f6fc', sub: '#9198a1', line: '#3d444d', track: '#21262d', accent: '#2bb5a6' },
};
const W = 720;
const svg = (h, label, t, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="${label}">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;fill:${t.ink}}.s{fill:${t.sub};font-size:16px}.h{font-size:18px;font-weight:600}.n{font-size:38px;font-weight:650;letter-spacing:-1px}</style>
${body}
</svg>\n`;
const pct = p => p < 1 ? '&lt;1%' : `${Math.round(p)}%`;
const fmt = n => n.toLocaleString('en-US');

function hero(t) {
  return svg(170, 'Sasitha Ruvin, software engineer, Colombo, Sri Lanka', t, `
<text x="0" y="66" font-size="62" font-weight="700" style="letter-spacing:-2.5px">Sasitha Ruvin</text>
<rect x="2" y="92" width="56" height="5" rx="2.5" fill="${t.accent}"/>
<text x="1" y="132" font-size="22">Software engineer. Go, TypeScript and the systems around them.</text>
<text x="1" y="161" class="s">Colombo, Sri Lanka</text>`);
}
function activity(t) {
  const tiles = [[data.commits, 'commits'], [data.commitsYear, 'in the last year'], [data.repositories, 'repositories'], [data.activeDays, 'active days']];
  const max = Math.max(...weeks, 1), step = W / 52, base = 232;
  const bars = weeks.map((n, i) => n ? `<rect x="${(i * step + 1).toFixed(1)}" y="${(base - n / max * 84).toFixed(1)}" width="${(step - 2).toFixed(1)}" height="${(n / max * 84).toFixed(1)}" rx="2" fill="${t.accent}"/>` : '').join('');
  return svg(268, `${fmt(data.commits)} commits across ${data.repositories} repositories`, t,
    tiles.map(([n, l], i) => `<text x="${i * 184}" y="40" class="n">${fmt(n)}</text><text x="${i * 184 + 1}" y="66" class="s">${l}</text>`).join('') +
    `<text x="0" y="122" class="h">Commits per week</text><text x="${W}" y="122" class="s" text-anchor="end">busiest week: ${max}</text>
${bars}<rect x="0" y="${base}" width="${W}" height="1" fill="${t.line}"/>
<text x="0" y="258" class="s">a year ago</text><text x="${W}" y="258" class="s" text-anchor="end">this week</text>`);
}
function langs(t) {
  const col = (x, title, list) => `<text x="${x}" y="20" class="h">${title}</text>` + list.map((l, i) => {
    const y = 56 + i * 46;
    return `<text x="${x}" y="${y}" font-size="17">${l.name}</text><text x="${x + 335}" y="${y}" class="s" text-anchor="end">${pct(l.pct)}</text>
<rect x="${x}" y="${y + 10}" width="335" height="8" rx="4" fill="${t.track}"/><rect x="${x}" y="${y + 10}" width="${Math.max(8, l.pct * 3.35).toFixed(1)}" height="8" rx="4" fill="${t.accent}"/>`;
  }).join('');
  const label = 'Last 90 days: ' + data.languagesRecent.map(l => `${l.name} ${pct(l.pct)}`).join(', ') + '. All time: ' + data.languagesAll.map(l => `${l.name} ${pct(l.pct)}`).join(', ');
  return svg(404, label, t, col(0, 'Last 90 days', data.languagesRecent) + col(385, 'All time', data.languagesAll));
}
for (const [mode, t] of Object.entries(THEMES))
  for (const [name, fn] of Object.entries({ hero, activity, langs })) writeFileSync(join(OUT, `${name}-${mode}.svg`), fn(t));
console.log(`${data.commits} commits, ${data.repositories} repositories`);
