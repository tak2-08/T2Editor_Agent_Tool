// 인용 파서 + 검증기 — 이 저장소의 핵심.
//
// 왜 이것이 존재하는가: T2Editor-v11 의 규범 정본(AGENTS.md) 자체가 라인 드리프트를
// 갖고 있다(2026-09-28 실측 4건 라인 낡음 + 1건 내용 오류). 즉 "문서에 적힌
// 파일:라인"은 사람이 아무리 diligent해도 저절로 낡는다. 지식 에셋이 자동으로
// 드리프트를 보고하도록 만드는 것이 이 저장소의 존재 이유다.
//
// 판정 코드
//   OK           파일 존재 + 라인(또는 오프셋) 범위 안 + 기대 토큰 일치
//   NO_MATCH     must_contain 토큰이 그 자리에 없음 (내용이 바뀜 — 가장 위험)
//   LINE_OOB     파일은 있으나 라인이 범위 밖 (위로 밀림 / 줄 삭제)
//   UNRESOLVED   경로 해석 실패. basename 이 여러 개이거나 정본 미연결
//
// 인용 형식
//   `T2Editor/config/t2_upload.php:705`        단일 라인
//   `tools/t2-release-gate.sh:84-94`           구간
//   `endpoints/run.php:1, run.core.php:2`      복수
//   `endpoints/*.core.php:4`                   글로브
//   (압축 파일은 라인이 아니라 문자 오프셋으로 읽는다)
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { join, basename, relative } from 'node:path';
import { TOOL_ROOT, v11Root, requireV11Root } from './config.mjs';

const EXTS = [
  'php', 'js', 'mjs', 'cjs', 'ts', 'css', 'json', 'md', 'markdown', 'txt', 'html',
  'xml', 'yml', 'yaml', 'sh', 'inc', 'blade', 'woff2', 'wasm', 'bin', 'sql', 'po',
];

/** 이 저장소(tools/ 등) 쪽 경로로 먼저 해석해도 되는 접두어 — 둘 다 실재할 수 있다. */
const TOOL_PREFIXES = ['tools/', 'skills/', 'knowledge/', 'datasets/', '_staging/', 'data/'];

export const STATUS_ORDER = ['UNRESOLVED', 'LINE_OOB', 'NO_MATCH', 'OK'];

/**
 * 경로는 **탐욕적**으로 먹어야 한다. `api.core.php:4` 에서 게으르면 `.core.php:4`
 * 로 잘려 나간다(실측 함정). dot-directory(`.github/…`) 만 접두어로 허용.
 * 경로와 라인 사이는 반드시 콜론 — 이걸 빠뜨리면 정규식이 아무것도 못 잡는다.
 */
const RE = new RegExp(
  '`?' +
    '((?:\\.[A-Za-z0-9_-]+\\/)?[A-Za-z0-9_][A-Za-z0-9_.*/-]*\\.(?:' + EXTS.join('|') + '))' +
    ':' +
    '(\\d+(?:-\\d+)?(?:\\s*[,;]\\s*\\d+(?:-\\d+)?)*)' +
    '(?::[a-z]{2,6})?' +
    '`?',
  'g'
);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function parseCitations(text) {
  // 코드펜스 안은 긁지 않는다. 펜스 안의 path:number 는 보통 명령 인자거나
  // "이런 식으로 파싱된다" 는 예시이지, 문서의 주장 근거가 아니다.
  // (실측: `api.core.php:4` 라는 정규식 함정 예시가 그대로 인용으로 잡혔다)
  const stripped = String(text).replace(/^```[\s\S]*?^```/gm, '').replace(/^~~~[\s\S]*?^~~~/gm, '');
  const out = [];
  const seen = new Set();
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(stripped)) !== null) {
    const path = m[1].replace(/^\.\//, '');
    const specRaw = m[2];
    const ranges = specRaw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.split('-').map((n) => parseInt(n, 10)))
      .filter(([a, b]) => Number.isFinite(a) && (b === undefined || Number.isFinite(b)));
    if (!ranges.length) continue;
    const key = path + '|' + specRaw;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      path,
      spec: specRaw,
      ranges,
      start: Math.min(...ranges.map(([a]) => a)),
      end: Math.max(...ranges.map(([a, b]) => b ?? a)),
    });
  }
  return out;
}

/* ── 인덱스 ───────────────────────────────────────────────────── */
let basenameIndex = null;
let relIndex = null;
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'backups', 'data', 'locale', 'locales', 'models',
  'wasm', 'cmaps', 'standard_fonts', 'web', 'ui',
]);
const INDEX_ROOTS = ['T2Editor', 'tools', 'tests', 'server'];

function buildIndexes() {
  const v11 = v11Root();
  if (!v11) return;
  const byName = new Map();
  const rels = [];
  const walk = (d, depth = 0) => {
    if (depth > 8) return;
    let ents = [];
    try { ents = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (e.name.startsWith('.') && e.name !== '.htaccess') continue;
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(full, depth + 1);
      } else if (e.isFile()) {
        if (!byName.has(e.name)) byName.set(e.name, []);
        if (byName.get(e.name).length < 16) byName.get(e.name).push(full);
        rels.push(relative(v11, full).split('\\').join('/'));
      }
    }
  };
  for (const r of INDEX_ROOTS) {
    const p = join(v11, r);
    if (existsSync(p)) walk(p);
  }
  basenameIndex = byName;
  relIndex = rels;
}

export function clearIndexes() {
  basenameIndex = null;
  relIndex = null;
  lineCache.clear();
}

/* ── 후보 경로 ───────────────────────────────────────────────── */
function candidateRoots(rel) {
  const v11 = v11Root();
  const pkg = v11 ? join(v11, 'T2Editor') : null;
  const roots = [];
  const clean = rel.replace(/^\/+/, '');
  const stripped = clean.replace(/^T2Editor\//, '');
  for (const p of TOOL_PREFIXES) {
    if (clean.startsWith(p)) roots.push(join(TOOL_ROOT, clean));
  }
  if (v11) {
    roots.push(join(v11, clean));               // 저장소 루트 기준 (tools/…, .github/…)
    if (pkg) roots.push(join(pkg, stripped));   // 배포 패키지 기준
  }
  roots.push(join(TOOL_ROOT, clean));            // 이 저장소 루트 기준
  return [...new Set(roots)];
}

/* ── 라인 캐시 ───────────────────────────────────────────────── */
const lineCache = new Map();
function linesOf(p) {
  if (lineCache.has(p)) return lineCache.get(p);
  let arr = null;
  try {
    if (statSync(p).size < 8 * 1024 * 1024) arr = readFileSync(p, 'utf8').split(/\r?\n/);
  } catch { arr = null; }
  lineCache.set(p, arr);
  return arr;
}

/* ── 검증 ────────────────────────────────────────────────────── */
export function verifyCitation(c) {
  const v11 = v11Root();

  // 1) 글로브: `endpoints/*.core.php:4` — 저장소 루트 기준과 패키지 기준 둘 다 시도
  if (c.path.includes('*')) {
    if (!v11) return { ...c, status: 'UNRESOLVED', resolved: null, note: '정본 미연결 — 글로브 미해석' };
    if (!relIndex) buildIndexes();
    const re = new RegExp('^' + c.path.split('*').map(escapeRe).join('[^/]*') + '$');
    const pkgRel = (r) => r.replace(/^T2Editor\//, '');
    const matches = relIndex.filter((rel) => re.test(rel) || re.test(pkgRel(rel)));
    if (!matches.length) {
      return { ...c, status: 'UNRESOLVED', resolved: null, note: `글로브가 정본에서 0건 일치 (${c.path})` };
    }
    const parts = matches.slice(0, 80).map((rel) => verifyCitation({ ...c, path: rel }));
    const worst = STATUS_ORDER.find((s) => parts.some((p) => p.status === s)) ?? 'OK';
    return {
      ...c, status: worst, resolved: null, glob: true,
      note: `글로브 ${matches.length}건 중 ${parts.filter((x) => x.status !== 'OK').length}건 문제`,
      parts,
    };
  }

  // 2) 직접 해석 → resolve_to 고정 → basename 유일 일치
  let hit = null;
  let how = null;
  const direct = candidateRoots(c.path).find((p) => existsSync(p) && statSync(p).isFile());
  if (direct) { hit = direct; how = 'direct'; }
  if (!hit && c.resolveTo) {
    const fixed = candidateRoots(c.resolveTo).find((p) => existsSync(p) && statSync(p).isFile());
    if (fixed) { hit = fixed; how = 'pinned'; }
  }
  if (!hit) {
    if (!basenameIndex) buildIndexes();
    const list = basenameIndex?.get(basename(c.path)) ?? [];
    if (list.length === 1) { hit = list[0]; how = 'basename'; }
    else if (list.length > 1) {
      return {
        ...c, status: 'UNRESOLVED', resolved: null,
        note: `basename 후보 ${list.length}개 — 문서에 경로를 쓰거나 citations.csv 에 resolve_to 를 넣어라`,
        candidates: list,
      };
    }
  }
  if (!hit) return { ...c, status: 'UNRESOLVED', resolved: null, note: '경로를 어느 루트에서도 못 찾음' };

  // 3) 압축 파일은 라인이 아니라 문자 오프셋.
  //    오프셋은 **바이트** 기준이다 → latin1 로 읽어야 문자 인덱스==바이트 인덱스가 된다.
  //    utf8 로 읽으면 멀티바이트 구간 이후 모든 오프셋이 어긋난다(실측 함정).
  const bytes = (() => { try { return statSync(hit).size; } catch { return 0; } })();
  const arr = linesOf(hit);
  if (arr && arr.length < 200 && bytes > 100_000) {
    const txt = readFileSync(hit, 'latin1');
    const res = {
      ...c, status: 'OK', resolved: hit, how, fileLines: arr.length,
      note: `오프셋 인용으로 해석 (파일 ${arr.length}줄 / ${bytes}B)`,
    };
    if (checkToken(c, txt.slice(Math.max(0, c.start - 1), c.end + 60))) return res;
    res.status = 'NO_MATCH';
    return res;
  }
  if (!arr) return { ...c, status: 'OK', resolved: hit, how, note: 'binary/oversize — 라인 미검사' };
  if (c.end > arr.length) {
    return { ...c, status: 'LINE_OOB', resolved: hit, how, fileLines: arr.length };
  }

  const res = { ...c, status: 'OK', resolved: hit, how, fileLines: arr.length };
  if (!c.mustContain) return res;
  const hay = [];
  for (const [a, b] of c.ranges) {
    for (let i = a; i <= (b ?? a); i++) hay.push(arr[i - 1] ?? '');
  }
  if (!checkToken(c, hay.join('\n'))) {
    res.status = 'NO_MATCH';
    res.haystack = hay.join('\n').slice(0, 300);
  }
  return res;
}

function checkToken(c, hay) {
  if (!c.mustContain) return true;
  const toks = Array.isArray(c.mustContain) ? c.mustContain : [c.mustContain];
  const missing = toks.filter((t) => !hay.includes(t));
  if (missing.length) { c.__missing = missing; return false; }
  return true;
}

export function verifyAll(cits) {
  lineCache.clear();
  return cits.map((c) => {
    const r = verifyCitation(c);
    if (r.status === 'NO_MATCH' && c.__missing) { r.missing = c.__missing; delete c.__missing; }
    return r;
  });
}

export function summarize(results) {
  const by = { OK: 0, NO_MATCH: 0, LINE_OOB: 0, UNRESOLVED: 0 };
  for (const r of results) if (r.status in by) by[r.status]++;
  return { total: results.length, by };
}

/* ── datasets/citations.csv ──────────────────────────────────── */
// header: citations,doc,path,spec,resolve_to,must_contain,why
export function loadHints(csvPath) {
  if (!existsSync(csvPath)) return { rows: [], errors: [] };
  const lines = readFileSync(csvPath, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'));
  if (!lines.length) return { rows: [], errors: [] };
  const head = splitCsv(lines[0]).map((h) => h.trim());
  const out = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsv(lines[i]);
    // 열 수가 헤더와 다르면 must_contain 가 한 칸 밀려 **조용히 비게 된다**.
    // 그러면 내용 변경 감지가 죽는데 아무도 모른다. 따라서 이것은 오류다. (실측 함정)
    if (cells.length !== head.length) {
      errors.push({
        line: i + 1,
        got: cells.length,
        expected: head.length,
        raw: lines[i].slice(0, 120),
        hint: cells.length > head.length ? '쉼표가 하나 더 있다' : '필드가 비었다',
      });
      continue;
    }
    const rec = {};
    head.forEach((h, k) => (rec[h] = (cells[k] ?? '').trim()));
    if (!rec.path || !rec.spec) continue;
    const ranges = rec.spec.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      .map((s) => s.split('-').map((n) => parseInt(n, 10)))
      .filter(([a, b]) => Number.isFinite(a));
    if (!ranges.length) continue;
    out.push({
      doc: rec.doc || '',
      path: rec.path,
      spec: rec.spec,
      ranges,
      start: Math.min(...ranges.map(([a]) => a)),
      end: Math.max(...ranges.map(([a, b]) => b ?? a)),
      resolveTo: rec.resolve_to || null,
      mustContain: rec.must_contain ? rec.must_contain.split('|').map((s) => s.trim()).filter(Boolean) : null,
      why: rec.why || null,
    });
  }
  return { rows: out, errors };
}

function splitCsv(line) {
  const out = [];
  let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') { q = !q; continue; }
    if (ch === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export { requireV11Root };
