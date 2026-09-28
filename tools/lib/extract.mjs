// 정본에서 카탈로그를 뽑는다. 의존성 0, 파서 없음, 정규식 + 얕은 스캔만.
// 원칙: 확실히 뽑히는 것만 뽑는다. 애매하면 미추출로 남기고 그 사실을 기록한다.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { packageRoot, requireV11Root } from './config.mjs';

const SKIP_DIR = new Set(['.git', 'node_modules', 'data', '.cache']);

export function walk(dir, out = [], depth = 0) {
  if (depth > 12) return out;
  let ents = [];
  try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.name.startsWith('.') && e.name !== '.htaccess') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue;
      walk(p, out, depth + 1);
    } else if (e.isFile()) {
      out.push(p);
    }
  }
  return out;
}

function sizeOf(p) {
  try { return statSync(p).size; } catch { return 0; }
}

function lineCount(p) {
  try { return readFileSync(p, 'utf8').split(/\r?\n/).length; } catch { return 0; }
}

/* ── 1. 계층 인벤토리 ─────────────────────────────────────────── */
export function inventory() {
  const root = requireV11Root();
  const pkg = packageRoot();
  const files = walk(pkg);
  const ext = {};
  let bytes = 0;
  for (const f of files) {
    const e = (extname(f) || '(none)').toLowerCase();
    ext[e] = (ext[e] ?? 0) + 1;
    bytes += sizeOf(f);
  }
  const top = {};
  for (const f of files) {
    const r = relative(pkg, f);
    const d = r.includes('/') ? r.split('/')[0] : '(root)';
    if (!top[d]) top[d] = { files: 0, bytes: 0, ext: {} };
    top[d].files++;
    top[d].bytes += sizeOf(f);
    const e = (extname(f) || '(none)').toLowerCase();
    top[d].ext[e] = (top[d].ext[e] ?? 0) + 1;
  }
  // 저장소 루트 밖 영역 (검사 도구·시험·별도 배포 표면)
  const outside = {};
  for (const d of ['tools', 'tests', 'server', '.github', 'backups']) {
    const p = join(root, d);
    if (!existsSync(p)) { outside[d] = { exists: false }; continue; }
    const fs2 = walk(p);
    outside[d] = {
      exists: true,
      files: fs2.length,
      bytes: fs2.reduce((a, f) => a + sizeOf(f), 0),
    };
  }
  return {
    packageRoot: relative(root, pkg) || 'T2Editor',
    files: files.length,
    bytes,
    ext: Object.fromEntries(Object.entries(ext).sort((a, b) => b[1] - a[1])),
    top: Object.fromEntries(Object.entries(top).sort((a, b) => b[1].files - a[1].files)),
    outside,
  };
}

/* ── 2. 플러그인 계약 ─────────────────────────────────────────── */
const PLUGIN_ROLES = {
  link: '본문 링크 삽입/편집',
  image: '이미지 업로드·삽입·리사이즈',
  video: '비디오/임베드 삽입',
  file: '파일 첨부·다운로드·PDF 뷰어',
  table: '표 편집(행/열/병합/정렬)',
  code: '코드 블록 강조//language 지정',
  linkcard: 'URL 미리보기 카드(fetch+DOMDocument)',
  export: '본문 내보내기',
  search: '본문 검색',
  t2search: 'T2 통합 검색',
  draw: '그림 그리기',
  collab: '실시간 협업(peerjs/p2p-media-loader)',
  ai_complex: 'AI (T2LLM) — ai + ai_rearrange 통폐합',
  clipurl: 'URL 클리핑/붙여넣기 가져오기',
  meme: '밈 생성',
  t2captcha: '번들 봇 방지 공급자(툴바 단추 없음 — 서비스 플러그인)',
};

export function plugins() {
  const pkg = packageRoot();
  const pdir = join(pkg, 'plugin');
  if (!existsSync(pdir)) return { plugins: [] };
  const regSrc = readSafe(join(pkg, 'core', 'editor.core.php'));
  const reg = [];
  const re = /\$T2EDITOR_PLUGINS\s*=\s*\[([\s\S]*?)\];/;
  const m = regSrc.match(re);
  let regLine = 0;
  if (m) {
    regLine = lineOf(regSrc, regSrc.indexOf(m[0]));
    for (const mm of m[1].matchAll(/'([a-z0-9_]+)'/g)) reg.push(mm[1]);
  }

  // 전용 로더 탐색: extend/editor/php/t2<id>_loader.php 처럼 플러그인 전용 로더
  const loaderScan = {};
  const extDir = join(pkg, 'extend', 'editor', 'php');
  if (existsSync(extDir)) {
    for (const f of readdirSync(extDir)) {
      if (!f.endsWith('.php')) continue;
      const full = join(extDir, f);
      const src = readSafe(full);
      for (const id of readdirSync(pdir, { withFileTypes: true })) {
        if (!id.isDirectory()) continue;
        if (src.includes(`plugin/${id.name}/`) || f.includes(id.name)) {
          loaderScan[id.name] ??= { file: 'T2Editor/extend/editor/php/' + f, line: lineOf(src, src.indexOf(id.name)) };
        }
      }
    }
  }

  const list = readdirSync(pdir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const out = list.map((id) => {
    const base = join(pdir, id);
    const files = walk(base).map((f) => relative(pkg, f)).sort();
    const bj = join(base, 'button.json');
    const pj = join(base, 'plugin.json');
    let button = null;
    if (existsSync(bj)) {
      try {
        const j = JSON.parse(readFileSync(bj, 'utf8'));
        button = { file: relative(pkg, bj), keys: Object.keys(j), count: Array.isArray(j) ? j.length : 1 };
      } catch (e) { button = { file: relative(pkg, bj), parseError: e.message }; }
    }
    let manifest = null;
    if (existsSync(pj)) {
      try { manifest = { file: relative(pkg, pj), keys: Object.keys(JSON.parse(readFileSync(pj, 'utf8'))) }; }
      catch (e) { manifest = { file: relative(pkg, pj), parseError: e.message }; }
    }
    const hooks = files.filter((f) => /hooks?\.js$/.test(f));
    // 전용 로더가 있는 플러그인은 등록 배열에 없더라도 실로드된다 (예: paste_migrate)
    const loader = loaderScan[id] ?? null;
    return {
      id,
      role: PLUGIN_ROLES[id] ?? '미분류(등록 배열 대응 없음)',
      inDefaultRegistration: reg.includes(id),
      registration: reg.includes(id)
        ? `$T2EDITOR_PLUGINS 배열 (core/editor.core.php:${regLine})`
        : (loader
          ? `전용 로더 (${loader.file}:${loader.line}) — 등록 배열에 없음`
          : '등록 배열에 없음 · 전용 로더도 못 찾음 ← 확인 필요'),
      files: files.length,
      bytes: files.reduce((a, f) => a + sizeOf(join(pkg, f)), 0),
      hooksFiles: hooks,
      button,
      manifest,
      topFiles: files.filter((f) => !f.includes('/') || f.split('/').length <= 3).slice(0, 40),
    };
  });
  const orphans = out.filter((x) => !x.inDefaultRegistration).map((x) => x.id);
  return {
    registrationSource: 'T2Editor/core/editor.core.php',
    registrationLine: regLine,
    registeredCount: reg.length,
    directoryCount: out.length,
    registered: reg,
    notInDefaultRegistration: orphans,
    autoRegistrar: {
      file: 'T2Editor/extend/editor/php/t2z_plugin_autoregister.php',
      note: 'extend 매니페스트에서 autoload 플래그가 켜진 것만 자동 등록 배열에 보탠다',
      indexFn: 't2_extend_plugin_index() @ T2Editor/config/extend.php:2174',
    },
    plugins: out,
  };
}

/* ── 3. 설정 표면 (t2_hard_config.php 중첩 배열 파싱) ────────── */
export function configKeys() {
  const pkg = packageRoot();
  const p = join(pkg, 'config', 't2_hard_config.php');
  if (!existsSync(p)) return { source: null, keys: [], total: 0 };
  const src = readFileSync(p, 'utf8');
  const lines = src.split(/\r?\n/);

  // root array( 를 찾는다 — 그 배열이 이 배포본이 아는 설정 표면 전체다
  let rootLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(return\s+)?\$?\w+\s*=\s*array\(/.test(lines[i]) || /^\s*return\s*array\(/.test(lines[i])) {
      rootLine = i; break;
    }
  }
  if (rootLine < 0) return { source: 'T2Editor/config/t2_hard_config.php', keys: [], total: 0, note: 'root array( 를 못 찾음 — 파싱 미수행' };

  const keys = [];              // { path, kind, value, line }
  const stack = [];             // { depth, name }
  const baseIndent = 4;
  for (let i = rootLine + 1; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (!line) continue;
    const indent = raw.match(/^\s*/)[0].length;
    if (indent < baseIndent) break;                       // root 배열 종료
    const m = line.match(/^'([A-Za-z0-9_]+)'\s*=>/);
    if (!m) continue;
    const name = m[1];
    const depth = ((indent - baseIndent) / 4) | 0;
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    const path = [...stack.map((s) => s.name), name].join('.');
    const isArr = /=>\s*array\(|=>\s*\[/.test(line);
    let value = null;
    const inline = line.match(/=>\s*(array\([^)]*\))/);       // 한 줄짜리 인라인 배열도 세라
    if (isArr && !inline && /=>\s*array\(\s*$|=>\s*\[\s*$/.test(line)) {
      // 여러 줄에 걸친 배열 — 그룹으로만 세고 내부 키는 각 줄에서 따로 잡는다
    } else if (isArr) {
      value = inline ? inline[1].slice(0, 120) : (line.match(/=>\s*(.+?),?$/) || [, ''])[1].slice(0, 120);
      if (inline) {
        for (const im of inline[1].matchAll(/'([A-Za-z0-9_]+)'\s*=>\s*([^,)]*)/g)) {
          keys.push({ path: path + '.' + im[1], kind: 'leaf', value: im[2].trim().slice(0, 80), line: i + 1, depth: depth + 1, inline: true });
        }
      }
    } else {
      value = (line.match(/=>\s*(.+?),?$/) || [, ''])[1].trim().slice(0, 80);
    }
    keys.push({ path, kind: isArr ? 'group' : 'leaf', value, line: i + 1, depth, inline: !!inline });
    if (isArr) stack.push({ depth, name });
  }

  const leaves = keys.filter((k) => k.kind === 'leaf');
  const groups = keys.filter((k) => k.kind === 'group');
  const topGroups = new Map();
  for (const g of groups) {
    const top = g.path.split('.')[0];
    if (!topGroups.has(top)) topGroups.set(top, { group: top, line: g.line, subgroups: 0, leaves: 0 });
    topGroups.get(top).subgroups++;
  }
  for (const t of topGroups.values()) {
    const pre = t.group + '.';
    t.leaves = leaves.filter((l) => l.path.startsWith(pre)).length;
  }
  return {
    source: 'T2Editor/config/t2_hard_config.php',
    rootArrayLine: rootLine + 1,
    total: leaves.length,
    groupCount: topGroups.size,
    subgroupCount: groups.length,
    topGroups: [...topGroups.values()].sort((a, b) => b.leaves - a.leaves),
    keys,
    note: '키 경로는 점으로 이어 붙였다. 그룹은 값이 array( 인 항목이다.',
  };
}

/* ── 4. CMS 어댑터 ───────────────────────────────────────────── */
export function cmsAdapters() {
  const pkg = packageRoot();
  const base = join(pkg, 'integration');
  const groups = {
    'integration/cms/adapters': [],
    'integration/sanitize/providers': [],
    'integration/permission/providers': [],
    'integration/wordfilter/providers': [],
  };
  for (const g of Object.keys(groups)) {
    const d = join(pkg, g);
    if (!existsSync(d)) continue;
    for (const f of readdirSync(d).sort()) {
      const full = join(d, f);
      if (!statSync(full).isFile()) continue;
      const src = readSafe(full);
      groups[g].push({
        file: full.replace(pkg + '/', 'T2Editor/'),
        bytes: sizeOf(full),
        lines: lineCount(full),
        functions: [...src.matchAll(/^\s*function\s+([a-z0-9_]+)/gim)].map((m) => m[1]),
        registerCalls: [...src.matchAll(/T2E([a-z0-9]+)register(provider|source|filter)\s*\(/g)].map((m) => m[0]),
      });
    }
  }
  return groups;
}

/* ── 5. 공개 진입점(endpoints) ────────────────────────────────── */
export function endpoints() {
  const pkg = packageRoot();
  const d = join(pkg, 'endpoints');
  if (!existsSync(d)) return { endpoints: [] };
  const out = readdirSync(d).sort().filter((f) => f.endsWith('.php')).map((f) => {
    const full = join(d, f);
    const src = readSafe(full);
    return {
      file: 'T2Editor/endpoints/' + f,
      pair: f.endsWith('.core.php') ? f.replace(/\.core\.php$/, '.php') : (f.replace(/\.php$/, '.core.php')),
      bytes: sizeOf(full),
      lines: lineCount(full),
      functions: [...src.matchAll(/^\s*function\s+([a-z0-9_]+)/gim)].map((m) => m[1]),
      hasAbortGuard: /\b(exit|die)\b/.test(src) && /REQUEST_METHOD/.test(src),
    };
  });
  return { endpoints: out };
}

/* ── 6. CSS 토큰 ─────────────────────────────────────────────── */
export function cssTokens() {
  const pkg = packageRoot();
  const files = ['css/t2-foundation.css', 'css/t2-visual-system.css'];
  const out = {};
  for (const rel of files) {
    const p = join(pkg, rel);
    if (!existsSync(p)) continue;
    const lines = readFileSync(p, 'utf8').split(/\r?\n/);
    const defs = [];
    const atLayers = [];
    for (let i = 0; i < lines.length; i++) {
      let m = lines[i].match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
      if (m) defs.push({ token: m[1], value: m[2].trim().slice(0, 160), line: i + 1 });
      m = lines[i].match(/@layer\s+([a-z0-9.\s,]+)/i);
      if (m) atLayers.push({ layer: m[1].trim(), line: i + 1 });
    }
    const byFamily = {};
    for (const d of defs) {
      const fam = d.token.startsWith('--t2-u') ? '--t2-u*'
        : d.token.startsWith('--t2-s') ? '--t2-s*'
        : d.token.startsWith('--t2-plugin') ? '--t2-plugin-*'
        : d.token.startsWith('--t2-toolbar') ? '--t2-toolbar-*'
        : d.token.startsWith('--t2-modal') ? '--t2-modal-*'
        : '기타';
      (byFamily[fam] ??= []).push(d.token);
    }
    out[rel] = {
      lines: lines.length,
      defCount: defs.length,
      families: Object.fromEntries(Object.entries(byFamily).map(([k, v]) => [k, { count: v.length, sample: v.slice(0, 6) }])),
      atLayers,
      defs: defs.slice(0, 400),
    };
  }
  return out;
}

/* ── 7. CSS 계약 규칙 (t2-css-contract.mjs) ──────────────────── */
export function cssContract() {
  const root = requireV11Root();
  const p = join(root, 'tools', 't2-css-contract.mjs');
  if (!existsSync(p)) return { available: false };
  const src = readFileSync(p, 'utf8');
  const lines = src.split(/\r?\n/);
  const rules = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(?:\/\* ─+\s*)?(C\d+)\.\s*([^\n─*]+)/);
    if (m) rules.push({ code: m[1], title: m[2].trim().slice(0, 90), line: i + 1 });
  }
  const labels = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(C\d+):\s*'([^']+)'/);
    if (m) labels[m[1]] = { title: m[2], line: i + 1 };
  }
  const retired = [...src.matchAll(/C(\d+)\s*는\s*없어졌다[^\n]*/g)].map((m) => ({ code: 'C' + m[1], note: m[0].trim().slice(0, 200) }));
  return {
    available: true,
    source: 'tools/t2-css-contract.mjs',
    rules,
    labels,
    retired,
    publishedVocab: (src.match(/PUBLISHED_VOCAB\s*=\s*new Set\(\[([^\]]*)\]/) || [, ''])[1].replace(/'/g, '').split(',').map((s) => s.trim()).filter(Boolean),
    hardFail: (src.match(/hardFail\s*=\s*[^\n]+/) || [''])[0].trim(),
  };
}

/* ── 8. 릴리즈 게이트 단계 ──────────────────────────────────── */
export function gate() {
  const root = requireV11Root();
  const p = join(root, 'tools', 't2-release-gate.sh');
  if (!existsSync(p)) return { available: false };
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);
  const steps = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*step\s+['"]([^'"]+)['"]\s+(\S.*?)\s*$/);
    if (m) steps.push({ n: steps.length + 1, name: m[1], command: m[2], line: i + 1 });
  }
  // 인자 파싱이 실제로 있는지, 그리고 플래그가 주석 밖에 있는지로 판정한다.
  // 주석 한 줄에 적힌 "--quick" 만으로는 플래그가 아니다 (2026-09-28 실측 함정).
  const code = lines.filter((l) => !/^\s*#/.test(l)).join('\n');
  // 좁은 정의다. 함수 안의 local name="$1" 같은 것은 인자 파싱이 아니다.
  const hasArgParsing = /getopts/.test(code)
    || /\[\s*\$\#\s*-gt\s*0/.test(code)
    || /case\s+"?\$\{?1"?\s+in/.test(code)
    || /^\s*\[\s*-z\s+"\$\{1:-/m.test(code);
  const quickInCode = /--quick/.test(code);
  return {
    available: true,
    source: 'tools/t2-release-gate.sh',
    lines: lines.length,
    stepCount: steps.length,
    steps,
    hasArgParsing,
    supportsQuickFlag: hasArgParsing && quickInCode,
    quickMentionLines: lines.map((l, i) => (/--quick/.test(l) ? i + 1 : 0)).filter(Boolean),
    note: quickInCode && !hasArgParsing
      ? '소스 주석에 --quick 이 적혀 있으나 인자 파싱이 없다 — 문서가 실제 동작보다 앞선다 (AGENTS.md:23 도 같은 오류)'
      : (hasArgParsing ? '인자 파싱 있음' : '인자 파싱 없음 (플래그 전부 무시된다)'),
    baselines: existsSync(join(root, 'tools'))
      ? readdirSync(join(root, 'tools')).filter((f) => f.endsWith('.baseline.json'))
      : [],
  };
}

/* ── 9. 시험 인벤토리 ────────────────────────────────────────── */
export function tests() {
  const root = requireV11Root();
  const t = join(root, 'tests');
  if (!existsSync(t)) return { available: false };
  const files = walk(t);
  const byArea = {};
  for (const f of files) {
    const r = relative(root, f);
    const area = r.split('/')[1] ?? '(root)';
    (byArea[area] ??= { files: 0, bytes: 0 });
    byArea[area].files++;
    byArea[area].bytes += sizeOf(f);
  }
  const runners = ['tests/run.mjs', 'tests/run.php'].filter((r) => existsSync(join(root, r)));
  return {
    available: true,
    root: 'tests/',
    total: files.length,
    byArea,
    runners: runners.map((r) => {
      const src = readSafe(join(root, r));
      return {
        file: r,
        lines: lineCount(join(root, r)),
        families: [...src.matchAll(/'([a-z0-9-]+)':\s*\[/g)].map((m) => m[1]).slice(0, 40),
      };
    }),
  };
}

/* ── 10. i18n ────────────────────────────────────────────────── */
export function i18n() {
  const pkg = packageRoot();
  const d = join(pkg, 'locales');
  if (!existsSync(d)) return { available: false };
  const out = [];
  for (const f of readdirSync(d).sort()) {
    const p = join(d, f);
    if (!statSync(p).isFile()) continue;
    const src = readSafe(p);
    out.push({
      file: 'T2Editor/locales/' + f,
      bytes: sizeOf(p),
      keys: (src.match(/^\s*"[^"]+"\s*:/gm) || []).length,
    });
  }
  return { available: true, locales: out, count: out.length };
}

/* ── 11. 번들 서드파티 버전 ──────────────────────────────────── */
export function vendor() {
  const pkg = packageRoot();
  const d = join(pkg, 'vendor');
  if (!existsSync(d)) return { available: false };
  const out = [];
  for (const name of readdirSync(d).sort()) {
    const sub = join(d, name);
    if (!statSync(sub).isDirectory()) continue;
    const files = walk(sub);
    const big = files.map((f) => ({ f: relative(pkg, f), b: sizeOf(f) })).sort((a, b) => b.b - a.b).slice(0, 4);
    const verHits = [];
    for (const f of files.filter((x) => /\.(js|json)$/.test(x) && sizeOf(x) < 3e6).slice(0, 40)) {
      const src = readSafe(f);
      const m = src.match(/["']?(?:version|apiVersion|VERSION)["']?\s*[:=]\s*["']?(\d+\.\d+\.\d+)/);
      if (m) verHits.push({ file: relative(pkg, f), version: m[1] });
    }
    out.push({ package: name, files: files.length, bytes: files.reduce((a, f) => a + sizeOf(f), 0), versions: verHits, largest: big });
  }
  return { available: true, packages: out, totalBytes: out.reduce((a, x) => a + x.bytes, 0) };
}

/* ── helpers ─────────────────────────────────────────────────── */
function readSafe(p) {
  try { return readFileSync(p, 'utf8'); } catch { return ''; }
}
function lineOf(src, idx) {
  return src.slice(0, idx).split(/\r?\n/).length;
}

export function buildAll() {
  return {
    inventory: inventory(),
    plugins: plugins(),
    configKeys: configKeys(),
    cmsAdapters: cmsAdapters(),
    endpoints: endpoints(),
    cssTokens: cssTokens(),
    cssContract: cssContract(),
    gate: gate(),
    tests: tests(),
    i18n: i18n(),
    vendor: vendor(),
  };
}
