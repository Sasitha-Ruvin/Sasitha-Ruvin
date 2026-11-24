// Collects GitHub activity into docs/stats.json, then renders the README cards.
// Uses the GitHub API only; nothing is cloned. Only aggregates are published:
// private repository and organization names are never logged or written.
//   CI:    STATS_TOKEN=... node scripts/stats.mjs
//   Local: node scripts/stats.mjs --local <folder>   (reads clones already on disk)
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from './render.mjs';

const USER = 'Sasitha-Ruvin';
const TOKEN = process.env.STATS_TOKEN;
const localRoot = process.argv[2] === '--local' ? process.argv[3] : null;
const FILE = fileURLToPath(new URL('../docs/stats.json', import.meta.url));
const EMAILS = ['143161107+sasitha-ruvin@users.noreply.github.com', 'sasitha-ruvin@users.noreply.github.com', 'sasitharuween@gmail.com',
  ...(process.env.EXTRA_EMAILS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)];
const year = new Date().getUTCFullYear(), FIRST = 2023;
const years = Array.from({ length: year - FIRST + 1 }, (_, i) => FIRST + i);

// Each repo: { group, langs: {name: bytes}, commits: [{ at: unix seconds, key }] }
const groupOf = (owner, isPrivate) => owner !== USER ? 'org' : isPrivate ? 'private' : 'public';

async function gql(query, variables = {}) {
  for (let i = 0; ; i++) {
    const r = await fetch('https://api.github.com/graphql', {
      method: 'POST', headers: { authorization: `Bearer ${TOKEN}` }, body: JSON.stringify({ query, variables }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.data && !j.errors) return j.data;
    const why = j.errors?.[0]?.type ?? r.status;
    if (i === 3 || r.status === 401) throw new Error(`GitHub GraphQL failed: ${why}`); // messages can contain repo names
    await new Promise(f => setTimeout(f, 2000 * 2 ** i));
  }
}

async function fromApi() {
  const { viewer } = await gql('{viewer{id login}}');
  if (viewer.login !== USER) throw new Error('STATS_TOKEN belongs to a different account');
  const REPO = 'id isFork isPrivate isEmpty owner{login} stargazerCount languages(first:20,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}';
  const found = new Map();
  for (let after = null; ;) {
    const c = (await gql(`query($after:String){viewer{repositories(first:50,after:$after,affiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER],ownerAffiliations:[OWNER,COLLABORATOR,ORGANIZATION_MEMBER]){pageInfo{hasNextPage endCursor} nodes{${REPO}}}}}`, { after })).viewer.repositories;
    c.nodes.forEach(n => found.set(n.id, n));
    if (!c.pageInfo.hasNextPage) break;
    after = c.pageInfo.endCursor;
  }
  for (let after = null; ;) {
    const c = (await gql(`query($after:String){viewer{repositoriesContributedTo(first:50,after:$after,includeUserRepositories:true,contributionTypes:[COMMIT,PULL_REQUEST]){pageInfo{hasNextPage endCursor} nodes{${REPO}}}}}`, { after })).viewer.repositoriesContributedTo;
    c.nodes.forEach(n => found.set(n.id, n));
    if (!c.pageInfo.hasNextPage) break;
    after = c.pageInfo.endCursor;
  }
  const calendar = {}, totals = { prs: 0, issues: 0, reviews: 0 };
  for (const y of years) {
    const c = (await gql(`query($from:DateTime!,$to:DateTime!){viewer{contributionsCollection(from:$from,to:$to){
      totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions
      contributionCalendar{weeks{contributionDays{date contributionCount}}}
      commitContributionsByRepository(maxRepositories:100){repository{${REPO}}}}}}`,
    { from: `${y}-01-01T00:00:00Z`, to: `${y}-12-31T23:59:59Z` })).viewer.contributionsCollection;
    for (const w of c.contributionCalendar.weeks) for (const d of w.contributionDays) calendar[d.date] = d.contributionCount;
    c.commitContributionsByRepository.forEach(r => found.set(r.repository.id, r.repository));
    totals.prs += c.totalPullRequestContributions; totals.issues += c.totalIssueContributions; totals.reviews += c.totalPullRequestReviewContributions;
  }
  const todo = [...found.values()].filter(r => !r.isFork && !r.isEmpty);
  const HIST = 'history(first:100,after:$h,author:{id:$me}){pageInfo{hasNextPage endCursor} nodes{authoredDate messageHeadline parents{totalCount}}}';
  const repos = [];
  for (const r of todo) {
    const commits = [];
    const add = h => h.nodes.forEach(n => n.parents.totalCount < 2 && commits.push({ at: Date.parse(n.authoredDate) / 1000, key: n.messageHeadline }));
    for (let refs = null; ;) { // every branch, so unmerged work counts
      const page = (await gql(`query($id:ID!,$me:ID!,$refs:String,$h:String){node(id:$id){...on Repository{refs(refPrefix:"refs/heads/",first:20,after:$refs){pageInfo{hasNextPage endCursor} nodes{id target{...on Commit{${HIST}}}}}}}}`,
        { id: r.id, me: viewer.id, refs, h: null })).node.refs;
      for (const ref of page.nodes) {
        let h = ref.target?.history;
        if (!h) continue;
        add(h);
        while (h.pageInfo.hasNextPage) {
          h = (await gql(`query($id:ID!,$me:ID!,$h:String){node(id:$id){...on Ref{target{...on Commit{${HIST}}}}}}`, { id: ref.id, me: viewer.id, h: h.pageInfo.endCursor })).node.target.history;
          add(h);
        }
      }
      if (!page.pageInfo.hasNextPage) break;
      refs = page.pageInfo.endCursor;
    }
    repos.push({ group: groupOf(r.owner.login, r.isPrivate), langs: Object.fromEntries(r.languages.edges.map(e => [e.node.name, e.size])), commits });
  }
  const stars = todo.filter(r => r.owner.login === USER).reduce((s, r) => s + r.stargazerCount, 0);
  return { repos, calendar, totals: { ...totals, stars } };
}

// Preview without a token: public API + GitHub's public contribution graph + clones on disk.
async function fromLocal(root) {
  const rest = async p => { const r = await fetch('https://api.github.com' + p); if (!r.ok) throw new Error(`REST ${r.status}`); return r.json(); };
  const calendar = {};
  for (const y of years) {
    const html = await (await fetch(`https://github.com/users/${USER}/contributions?from=${y}-01-01&to=${y}-12-31`)).text();
    const date = {};
    for (const m of html.matchAll(/data-date="([\d-]+)" id="([^"]+)"/g)) { date[m[2]] = m[1]; calendar[m[1]] = 0; }
    for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>(\d+) contribution/g)) calendar[date[m[1]]] = +m[2];
  }
  const meta = {}, map = new Map();
  for (const r of await rest(`/users/${USER}/repos?per_page=100`)) meta[r.full_name] = r;
  const get = (name, group, langs) => map.get(name) ?? map.set(name, { group, langs, commits: [] }).get(name);
  const EXT = { go: 'Go', ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', kt: 'Kotlin', java: 'Java', cs: 'C#', py: 'Python', css: 'CSS', scss: 'SCSS', html: 'HTML', sql: 'PLpgSQL', cpp: 'C++', dart: 'Dart', php: 'PHP' };
  const scan = (d, depth = 0) => readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory() && e.name !== 'node_modules').flatMap(e => {
    const p = join(d, e.name); return [...(existsSync(join(p, '.git')) ? [p] : []), ...(depth < 1 ? scan(p, depth + 1) : [])]; });
  for (const dir of scan(root)) {
    const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
    let name; try { name = git('remote', 'get-url', 'origin').trim().replace(/\.git$/, '').split(/[/:]/).slice(-2).join('/'); } catch { continue; }
    const langs = {};
    let tree; try { tree = git('ls-tree', '-r', '-l', 'origin/HEAD'); } catch { tree = git('ls-tree', '-r', '-l', 'HEAD'); }
    for (const l of tree.split('\n')) {
      const [m, f] = l.split('\t'); const lang = EXT[f?.split('.').pop()];
      if (lang && !/(^|\/)(generated|vendor|dist)\//.test(f)) langs[lang] = (langs[lang] ?? 0) + +m.trim().split(/\s+/)[3];
    }
    const repo = get(name, groupOf(name.split('/')[0], !meta[name]), langs);
    for (const l of git('log', '--remotes', '--no-merges', '--format=%ae%x02%at%x02%s').split('\n')) {
      const [e, at, key] = l.split('\x02');
      if (EMAILS.includes(e?.toLowerCase())) repo.commits.push({ at: +at, key });
    }
  }
  for (let p = 1; p <= 8; p++) {
    const { items } = await rest(`/search/commits?q=author:${USER}&sort=author-date&per_page=100&page=${p}`);
    for (const i of items) {
      if (i.repository.fork || i.parents.length > 1) continue;
      const n = i.repository.full_name, lang = meta[n]?.language;
      get(n, groupOf(n.split('/')[0], false), lang ? { [lang]: 1 } : {}).commits.push({ at: Date.parse(i.commit.author.date) / 1000, key: i.commit.message.split('\n')[0] });
    }
    if (items.length < 100) break;
  }
  const count = async t => (await rest(`/search/issues?q=author:${USER}+type:${t}&per_page=1`)).total_count;
  return { repos: [...map.values()], calendar, totals: { prs: await count('pr'), issues: await count('issue'), reviews: 0, stars: Object.values(meta).reduce((s, r) => s + r.stargazers_count, 0) } };
}

if (!TOKEN && !localRoot) throw new Error('STATS_TOKEN is not set: private and organization work would be missing.');
const { repos, calendar, totals } = localRoot ? await fromLocal(localRoot) : await fromApi();

// ---- aggregate (Colombo time, UTC+5:30)
const local = at => new Date((at + 19800) * 1000);
const today = local(Date.now() / 1000).toISOString().slice(0, 10);
const seen = new Set(), months = {}, hours = {}, repoCount = { public: 0, private: 0, org: 0 };
let commits = 0;
for (const r of repos) {
  const sum = Object.values(r.langs).reduce((a, b) => a + b, 0);
  let mine = 0;
  for (const c of r.commits) {
    const k = `${c.at}|${c.key}`; // same commit on another branch, rebased, or copied to another repo
    if (seen.has(k)) continue;
    seen.add(k); commits++; mine++;
    const d = local(c.at), m = d.toISOString().slice(0, 7);
    const cell = ((months[m] ??= {})[r.group] ??= { commits: 0, langs: {} });
    cell.commits++;
    for (const [l, b] of Object.entries(r.langs)) cell.langs[l] = (cell.langs[l] ?? 0) + b / sum;
    const h = (hours[r.group] ??= Array(168).fill(0));
    h[((d.getUTCDay() + 6) % 7) * 24 + d.getUTCHours()]++;
  }
  if (mine) repoCount[r.group]++;
}
for (const m of Object.values(months)) for (const g of Object.values(m)) for (const l in g.langs) g.langs[l] = +g.langs[l].toFixed(3);
const days = Object.entries(calendar).filter(([d]) => d <= today).sort((a, b) => a[0] < b[0] ? -1 : 1);
while (days.length && !days[0][1]) days.shift();
let run = 0, start = null, longest = { n: 0 };
for (const [d, n] of days) {
  if (n) { if (!run++) start = d; if (run > longest.n) longest = { n: run, from: start, to: d }; } else if (d !== today) run = 0;
}
const best = days.reduce((a, b) => b[1] > a[1] ? b : a, ['', 0]);
const data = {
  updated: today, complete: !localRoot, commits, repos: repoCount, ...totals,
  contributions: days.reduce((s, d) => s + d[1], 0), activeDays: days.filter(d => d[1]).length,
  streak: { current: run, from: run ? start : null, longest }, best: { date: best[0], n: best[1] },
  calendar: { from: days[0][0], counts: days.map(d => d[1]) }, months, hours,
};
if (existsSync(FILE) && !process.env.ALLOW_DROP) {
  const prev = JSON.parse(readFileSync(FILE, 'utf8'));
  if (commits < prev.commits * 0.9) throw new Error(`Commits fell from ${prev.commits} to ${commits}; the token may have lost access. Set ALLOW_DROP=1 to accept.`);
}
writeFileSync(FILE, JSON.stringify(data) + '\n');
render(data);
console.log(`${commits} commits; repos: ${JSON.stringify(repoCount)}; streak ${run}, longest ${longest.n}; contributions ${data.contributions}`);
