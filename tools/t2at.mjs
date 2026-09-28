#!/usr/bin/env node
// T2Editor_Agent_Tool — 단일 CLI 진입점.
//
//   node tools/t2at.mjs status                 현재 지식 자산 상태 요약
//   node tools/t2at.mjs refresh [--write]       정본에서 카탈로그 재생성
//   node tools/t2at.mjs verify [--doc <경로>]   file:line 인용 검증 (드리프트 탐지)
//   node tools/t2at.mjs doctor                staleness/무결성 진단 (exit code 있음)
//   node tools/t2at.mjs query "<키워드>"        지식 질의
//   node tools/t2at.mjs catalog                카탈로그 요약 출력
//
// 설계 규약
//   - 의존성 0. Node ≥18. ESM.
//   - 읽기 명령은 어떤 경우에도 파일을 쓰지 않는다.
//   - 쓰기 명령은 --write 없이는 stdout 만 출력한다(안전 기본값).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  TOOL_ROOT, paths, requireV11Root, v11Root, v11Commit, readJSONOrFail, fail,
} from './lib/config.mjs';
import { parseCitations, verifyAll, summarize, loadHints } from './lib/cite.mjs';
import { buildLegacy } from './lib/legacy.mjs';
import { writeCSVs } from './lib/csv.mjs';
import * as X from './lib/extract.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = Object.fromEntries(
  argv.slice(1).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const positional = argv.slice(1).filter((a) => !a.startsWith('--'));

const C = {
  r: '\x1b[31m', g: '\x1b[32m', y: '\x1b[33m', b: '\x1b[34m',
  d: '\x1b[2m', x: '\x1b[0m', B: '\x1b[1m',
};
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = new Proxy(C, { get: (t, k) => (useColor ? t[k] : '') });
const p = (s = '') => process.stdout.write(s + '\n');
const pad = (s, n) => String(s).padEnd(n);
const num = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

try {
  switch (cmd) {
    case 'status': await status(); break;
    case 'refresh': await refresh(); break;
    case 'verify': await verify(); break;
    case 'doctor': await doctor(); break;
    case 'query': await query(); break;
    case 'catalog': await catalog(); break;
    case undefined:
    case 'help':
    case '--help': help(); break;
    default:
      p(`${c.r}알 수 없는 명령: ${cmd}${c.x}`);
      help();
      process.exit(1);
  }
} catch (e) {
  if (e?.t2at) {
    p(`${c.r}✗ ${e.t2at.title}${c.x}`);
    if (e.t2at.hint) p(`  힌트: ${e.t2at.hint}`);
    if (e.t2at.detail) p(`  ${c.d}${e.t2at.detail}${c.x}`);
  } else {
    p(`${c.r}✗ ${e.message}${c.x}`);
    if (process.env.T2AT_TRACE) p(e.stack);
  }
  process.exit(2);
}

/* ══════════════════════════════════════════════════════════════ */

function help() {
  p(`${c.B}T2Editor_Agent_Tool${c.x} — T2Editor v1~v11 전문 지식 베이스 CLI

${c.B}명령${c.x}
  status              지식 자산 상태 요약 (정본 연결 여부 포함)
  refresh [--write]   정본에서 카탈로그 재생성. --write 없으면 stdout 만
  verify [--doc P]    문서의 file:line 인용을 정본과 대조해 드리프트 탐지
  doctor              staleness 진단. 문제가 있으면 exit 1
  query "<키워드>"    카탈로그 + 지식 문서 + 스킬 검색
  catalog             카탈로그 요약

${c.B}환경${c.x}
  T2EDITOR_V11_ROOT   정본 T2Editor-v11 저장소 루트 (자동 탐색됨)
  NO_COLOR            색상 끄기
  T2AT_TRACE          예외 스택 출력

${c.B}왜 verify 가 있나${c.x}
  정본 헌장(AGENTS.md) 자체가 2026-09-28 기준 라인 드리프트 4건 + 내용 오류 1건을
  갖고 있었다. 문서에 적힌 파일:라인은 저절로 낡으므로 기계가 본다.`);
}

async function status() {
  const root = v11Root();
  const cm = root ? v11Commit(root) : { sha: null, dirty: null };
  p(`${c.B}T2Editor_Agent_Tool 상태${c.x}`);
  p(`  도구 루트      ${TOOL_ROOT}`);
  p(`  정본 연결      ${root ? `${c.g}✓${c.x} ${root}` : `${c.r}✗ 미연결${c.x}`}`);
  if (cm.sha) p(`  정본 커밋      ${cm.sha.slice(0, 12)}${cm.dirty ? ` ${c.y}(dirty)${c.x}` : ''}`);

  const man = readJSONOrFail(paths.manifest, '`node tools/t2at.mjs refresh --write` 를 먼저 돌려라.');
  p(`  자산 생성      ${c.d}${man.generated_at}${c.x}`);
  p(`  생성 시 커밋   ${c.d}${(man.v11_commit || '?').slice(0, 12)}${c.x}`);
  p(`  정본이 그 뒤에 ${man.v11_commit && cm.sha ? (man.v11_commit === cm.sha ? `${c.g}변화 없음${c.x}` : `${c.y}${ahead(man.v11_commit, cm.sha)}${c.x}`) : '—'}`);

  p('');
  p(`${c.B}자산${c.x}`);
  for (const row of man.inventory ?? []) {
    const kind = row.n > 0 ? `${c.g}${pad(row.n, 3)}${c.x}` : `${c.d}${pad(row.n, 3)}${c.x}`;
    p(`  ${kind}  ${pad(row.kind, 14)} ${c.d}${row.note}${c.x}`);
  }
  p('');
  p(`${c.B}다음${c.x}`);
  p(`  ${c.d}신뢰성 확인   node tools/t2at.mjs verify${c.x}`);
  p(`  ${c.d}부패 확인     node tools/t2at.mjs doctor${c.x}`);
  p(`  ${c.d}지식 갱신     node tools/t2at.mjs refresh --write${c.x}`);
}

function ahead(from, to) {
  try {
    const n = execFileSync('git', ['-C', requireV11Root(), 'rev-list', '--count', `${from}..${to}`], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return `정본이 ${n}커밋 진행 (자산은 뒤처짐)`;
  } catch {
    return '커밋이 다름 (git 없이 비교 불가)';
  }
}

async function refresh() {
  const root = requireV11Root();
  const cm = v11Commit(root);
  const data = X.buildAll();
  const legacy = buildLegacy();
  const stamp = new Date().toISOString();
  const manifest = {
    schema: 't2at/manifest@1',
    generated_at: stamp,
    generated_by: 'tools/t2at.mjs refresh',
    v11_commit: cm.sha,
    v11_dirty: cm.dirty,
    extractor: 'tools/lib/extract.mjs',
    inventory: [
      { n: data.inventory.files, kind: '패키지 파일', note: `T2Editor/ · ${num(data.inventory.bytes)} B` },
      { n: data.plugins.directoryCount, kind: '플러그인', note: `등록 배열 ${data.plugins.registeredCount}개 · core/editor.core.php:${data.plugins.registrationLine}` },
      { n: data.configKeys.total, kind: '설정 키', note: `최상위 그룹 ${data.configKeys.groupCount}개 · ${data.configKeys.source}` },
      { n: data.endpoints.endpoints.length, kind: '공개 진입점', note: 'endpoints/ (X.php + X.core.php 쌍)' },
      { n: data.gate.stepCount, kind: '게이트 단계', note: data.gate.supportsQuickFlag ? 't2-release-gate.sh' : 't2-release-gate.sh — --quick 없음(문서 오류)' },
      { n: data.cssContract.rules.length, kind: 'CSS 계약 규칙', note: 'tools/t2-css-contract.mjs' },
      { n: data.tests.total, kind: '시험', note: 'tests/ (저장소 루트)' },
      { n: data.i18n.count, kind: '로케일', note: 'locales/' },
      { n: data.vendor.packages.length, kind: '번들 라이브러리', note: `vendor/ · ${num(data.vendor.totalBytes)} B` },
      { n: legacy.counts.releases, kind: '레거시 릴리즈', note: `v1~v10 · 실제 배포일 ${legacy.counts.missingRealDate === 0 ? '전수 확보' : legacy.counts.missingRealDate + '건 미확인'}` },
    ],
  };

  if (!flags.write) {
    p(`${c.y}--write 없음 — stdout 만 출력한다(파일 안 씀).${c.x}`);
    p(JSON.stringify(manifest, null, 2));
    return;
  }

  mkdirSync(paths.catalog, { recursive: true });
  const write = (p2, o) => writeFileSync(join(paths.catalog, p2), JSON.stringify(o, null, 2) + '\n');
  write('inventory.json', data.inventory);
  write('plugins.json', data.plugins);
  write('config-keys.json', data.configKeys);
  write('endpoints.json', data.endpoints);
  write('cms-adapters.json', data.cmsAdapters);
  write('css-tokens.json', data.cssTokens);
  write('css-contract.json', data.cssContract);
  write('gate.json', data.gate);
  write('tests.json', data.tests);
  write('i18n.json', data.i18n);
  write('vendor.json', data.vendor);

  mkdirSync(paths.legacy, { recursive: true });
  writeFileSync(join(paths.legacy, 'release-index.json'), JSON.stringify(legacy, null, 2) + '\n');
  writeFileSync(join(paths.legacy, 'releases.json'),
    JSON.stringify({ schema: 't2at/legacy-bodies@1', note: '본문 전문. 질의는 t2at.mjs query 로 본다.', releases: legacy.releases }, null, 2) + '\n');

  const csvs = writeCSVs({ ...data, legacy });
  mkdirSync(paths.datasets, { recursive: true });
  for (const [name, txt] of Object.entries(csvs)) writeFileSync(join(paths.datasets, name), txt);
  for (const stale of ['code-metrics.csv']) {
    const sp = join(paths.datasets, stale);
    if (existsSync(sp)) rmSync(sp);      // 구 스켈레톤의 빈 CSV — 대체됨
  }

  writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + '\n');

  p(`${c.g}✓${c.x} 카탈로그 11종 → data/catalog/`);
  p(`${c.g}✓${c.x} 레거시  ${legacy.counts.releases}건 → data/legacy/`);
  p(`${c.g}✓${c.x} CSV      ${Object.keys(csvs).length}종 → datasets/`);
  for (const r of manifest.inventory) p(`   ${pad(String(r.n), 5)} ${pad(r.kind, 16)} ${c.d}${r.note}${c.x}`);
  p(`${c.g}✓${c.x} 매니페스트 → data/MANIFEST.json (커밋 ${String(cm.sha).slice(0, 12)})`);
}

async function verify() {
  const root = v11Root();
  if (!root) fail('정본 미연결이라 인용을 검증할 수 없다.', 'T2EDITOR_V11_ROOT 를 지정하거나 체크아웃하라.');
  const cm = v11Commit(root);

  const docs = flags.doc
    ? [String(flags.doc)]
    : knowledgeDocs();
  if (!docs.length) fail('검증할 문서가 없다.', 'knowledge/ 에 md 를 넣거나 --doc 로 경로를 준다.');

  const { rows: hints, errors: hintErrors } = loadHints(join(paths.datasets, 'citations.csv'));
  if (hintErrors.length) {
    p(`${c.r}✗ citations.csv 열 수 오류 ${hintErrors.length}건 — must_contain 가 밀려 조용히 비고, 내용 변경 감지가 죽는다${c.x}`);
    for (const e of hintErrors.slice(0, 10)) p(`   ${c.d}${e.line}행: ${e.got}열(기대 ${e.expected})${c.x} ${c.d}${e.hint}${c.x}  ${e.raw}`);
    if (flags.strict) process.exit(1);
  }
  const hintIdx = new Map();
  for (const h of hints) hintIdx.set(`${h.doc}|${h.path}|${h.spec}`, h);
  const usedHints = new Set();

  let all = [];
  for (const d of docs) {
    const full = isAbsolute(d) ? d : join(TOOL_ROOT, d);
    if (!existsSync(full)) { p(`${c.r}✗${c.x} ${d} 없음`); continue; }
    const rel = relative(TOOL_ROOT, full) || full;
    const text = readFileSync(full, 'utf8');
    const cits = parseCitations(text);
    const withHints = cits.map((x) => {
      const h = withHint(x, rel, hintIdx);
      if (h.mustContain || h.resolveTo) usedHints.add(`${rel}|${x.path}|${x.spec}`);
      return h;
    });
    const res = verifyAll(withHints);
    all = all.concat(res);
    const s = summarize(res);
    const bad = s.by.NO_MATCH + s.by.LINE_OOB + s.by.FILE_MISSING + s.by.UNRESOLVED;
    const mark = bad === 0 ? `${c.g}✓${c.x}` : `${c.y}!${c.x}`;
    p(`${mark} ${pad(rel, 42)} ${pad(String(res.length), 4)} 인용  ` +
      `${bad ? c.r + bad + '건 문제' : c.g + '정상' + c.x}`);
  }

  const s = summarize(all);
  p('');
  p(`${c.B}인용 총계${c.x}  ${s.total}건  (정본 ${String(cm.sha).slice(0, 12)}${cm.dirty ? ' dirty' : ''})`);
  p(`  ${c.g}OK          ${s.by.OK}${c.x}`);
  if (s.by.NO_MATCH) p(`  ${c.r}NO_MATCH    ${s.by.NO_MATCH}${c.x}  ← 줄에 기대 토큰이 없음(내용 변경). 가장 위험.`);
  if (s.by.LINE_OOB) p(`  ${c.y}LINE_OOB    ${s.by.LINE_OOB}${c.x}  ← 파일은 있으나 라인 범위 밖(줄이 밀림)`);
  if (s.by.FILE_MISSING) p(`  ${c.r}FILE_MISSING${s.by.FILE_MISSING}${c.x}  ← 경로가 사라짐`);
  if (s.by.UNRESOLVED) p(`  ${c.d}UNRESOLVED  ${s.by.UNRESOLVED}${c.x}  ← 정본 미연결 또는 오타`);

  if (flags.json) {
    mkdirSync(paths.datasets, { recursive: true });
    const unused = hints.filter((h) => !usedHints.has(`${h.doc}|${h.path}|${h.spec}`));
    const out = join(paths.datasets, 'citation-report.json');
    writeFileSync(out, JSON.stringify({
      checked_at: new Date().toISOString(),
      v11_commit: cm.sha,
      summary: s,
      hints: { total: hints.length, bound: usedHints.size, unused: unused.map((h) => ({ doc: h.doc, path: h.path, spec: h.spec })) },
      results: all.map(strip),
    }, null, 2) + '\n');
    p(`\n${c.g}✓${c.x} → datasets/citation-report.json`);
    // 죽은 설정 — 문서에 인용이 없어 결합되지 않은 힌트. Content-drift 감지가 조용히 죽는다.
    if (unused.length) {
      p(`${c.y}!${c.x} citations.csv 힌트 ${hints.length}건 중 ${unused.length}건이 문서에 결합되지 않았다 (내용 변경 감지가 죽는다):`);
      for (const u of unused.slice(0, 12)) p(`   ${c.d}${u.doc}  ${u.path}:${u.spec}${c.x}`);
      if (flags.strict) process.exit(1);
    }
  } else {
    const probs = all.filter((r) => r.status !== 'OK');
    if (probs.length) {
      p('');
      p(`${c.B}문제 인용 (상위 40)${c.x}`);
      for (const r of probs.slice(0, 40)) {
        p(`  ${c.y}${r.status.padEnd(12)}${c.x} ${r.doc}  ${c.d}${r.path}:${r.spec}${c.x}` +
          (r.fileLines ? ` ${c.d}(파일 ${r.fileLines}줄, 최대 ${r.end})${c.x}` : '') +
          (r.missing ? ` ${c.r}누락: ${r.missing.slice(0, 3).join(', ')}${c.x}` : ''));
      }
    }
  }
  if (flags.strict && (s.by.NO_MATCH + s.by.LINE_OOB + s.by.FILE_MISSING) > 0) process.exit(1);
}

function withHint(x, doc, hintIdx) {
  const h = hintIdx.get(`${doc}|${x.path}|${x.spec}`);
  return { ...x, doc, mustContain: h?.mustContain ?? null, resolveTo: h?.resolveTo ?? null };
}

function strip(r) {
  return {
    doc: r.doc, path: r.path, spec: r.spec, status: r.status,
    resolved: r.resolved ?? null, how: r.how ?? null, note: r.note ?? null,
    fileLines: r.fileLines ?? null, missing: r.missing ?? null,
    globParts: r.parts ? r.parts.map(strip) : null,
  };
}

function knowledgeDocs() {
  const out = [];
  for (const d of ['knowledge', 'skills']) {
    const base = join(TOOL_ROOT, d);
    if (!existsSync(base)) continue;
    const rec = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) rec(join(dir, e.name));
        else if (e.name.endsWith('.md')) out.push(relative(TOOL_ROOT, join(dir, e.name)));
      }
    };
    rec(base);
  }
  return out.sort();
}

async function doctor() {
  const problems = [];
  const warns = [];
  p(`${c.B}진단${c.x}`);

  // 1. 정본 연결
  const root = v11Root();
  if (!root) {
    p(`  ${c.r}✗${c.x} 정본 미연결 — verify/refresh 불가`);
    problems.push('정본 미연결');
  } else {
    const cm = v11Commit(root);
    p(`  ${c.g}✓${c.x} 정본 ${String(cm.sha).slice(0, 12)}${cm.dirty ? c.y + ' (dirty)' + c.x : ''}`);
    if (cm.dirty) warns.push('정본에 미커밋 변경이 있다 — 인용 검증이 dirty 상태를 기준으로 한다');
  }

  // 2. 매니페스트 신선도
  const man = readJSONOrFail(paths.manifest, 'refresh --write 를 먼저 돌려라.');
  if (root) {
    const cm = v11Commit(root);
    if (man.v11_commit && cm.sha && man.v11_commit !== cm.sha) {
      p(`  ${c.y}!${c.x} 자산이 정본 커밋보다 뒤처졌다`);
      p(`      ${c.d}자산 ${String(man.v11_commit).slice(0, 12)} → 정본 ${String(cm.sha).slice(0, 12)}${c.x}`);
      p(`      ${c.d}해소: node tools/t2at.mjs refresh --write && git commit${c.x}`);
      problems.push('자산이 정본 커밋보다 뒤처짐');
    } else {
      p(`  ${c.g}✓${c.x} 자산이 정본 커밋과 일치`);
    }
  }

  // 3. 인용 검증
  const docs = knowledgeDocs();
  const { rows: hints, errors: hintErrors } = loadHints(join(paths.datasets, 'citations.csv'));
  if (hintErrors.length) {
    p(`  ${c.r}✗${c.x} citations.csv 열 수 오류 ${hintErrors.length}건 — must_contain 가 밀려 조용히 비고, 내용 변경 감지가 죽는다`);
    problems.push(`citations.csv 열 수 오류 ${hintErrors.length}건`);
  }
  const hintIdx = new Map();
  for (const h of hints) hintIdx.set(`${h.doc}|${h.path}|${h.spec}`, h);
  const all = [];
  for (const d of docs) {
    const text = readFileSync(join(TOOL_ROOT, d), 'utf8');
    for (const x of parseCitations(text)) all.push(withHint(x, d, hintIdx));
  }
  const res = verifyAll(all);
  const s = summarize(res);
  const bad = s.by.NO_MATCH + s.by.LINE_OOB;
  if (s.by.UNRESOLVED === 0) {
    if (bad === 0) p(`  ${c.g}✓${c.x} 인용 ${s.total}건 전부 유효`);
    else {
      p(`  ${c.r}✗${c.x} 인용 ${bad}건 부패  ${c.d}(전체 ${s.total})  NO_MATCH ${s.by.NO_MATCH} · LINE_OOB ${s.by.LINE_OOB}${c.x}`);
      problems.push(`인용 ${bad}건 부패`);
    }
  } else {
    p(`  ${c.r}✗${c.x} 인용 ${s.total}건 중 ${s.by.UNRESOLVED}건 경로 해석 실패 (오타·모호 basename·정본 미체크아웃)`);
    problems.push(`인용 ${s.by.UNRESOLVED}건 경로 해석 실패`);
  }

  // 4. README가 광고하는 파일이 실제로 있는가 (레거시화의 대표 증상)
  const readme = readFileSync(join(TOOL_ROOT, 'README.md'), 'utf8');
  const advertised = [...readme.matchAll(/`((?:tools|skills|knowledge|data|datasets)\/[A-Za-z0-9_./-]+)`/g)]
    .map((m) => m[1])
    .filter((x) => /\.(mjs|sh|json|csv|md)$/.test(x) && !x.includes('*'));
  const ghost = [...new Set(advertised)].filter((x) => !existsSync(join(TOOL_ROOT, x)));
  if (ghost.length) {
    p(`  ${c.r}✗${c.x} README가 광고하는데 없는 파일 ${ghost.length}건`);
    for (const g of ghost.slice(0, 10)) p(`      ${c.d}${g}${c.x}`);
    problems.push(`README 광고 파일 ${ghost.length}건이 실재하지 않음`);
  } else {
    p(`  ${c.g}✓${c.x} README 광고 파일 전부 실재 (${new Set(advertised).size}건)`);
  }

  // 5. 빈 파일
  const empties = [];
  for (const d of ['knowledge', 'skills', 'data/catalog', 'data/legacy']) {
    const base = join(TOOL_ROOT, d);
    if (!existsSync(base)) continue;
    const rec = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const f = join(dir, e.name);
        if (e.isDirectory()) rec(f);
        else if (extname(e.name) === '.md' || extname(e.name) === '.json') {
          if (readFileSync(f, 'utf8').trim().length < 120) empties.push(relative(TOOL_ROOT, f));
        }
      }
    };
    rec(base);
  }
  if (empties.length) {
    p(`  ${c.y}!${c.x} 사실상 빈 자산 ${empties.length}건  ${c.d}${empties.slice(0, 6).join(', ')}${c.x}`);
    warns.push(`빈 자산 ${empties.length}건`);
  }

  // 6. 스킬이 검증 명령을 갖는가
  const skillDir = join(TOOL_ROOT, 'skills');
  if (existsSync(skillDir)) {
    const noCmd = [];
    for (const e of readdirSync(skillDir, { withFileTypes: true })) {
      if (e.isDirectory()) continue;
      if (!e.name.endsWith('.md')) continue;
      const t = readFileSync(join(skillDir, e.name), 'utf8');
      const has = /```(?:bash|sh|console)/.test(t) || /node tools\/t2at\.mjs/.test(t);
      if (!has) noCmd.push(e.name);
    }
    if (noCmd.length) {
      p(`  ${c.y}!${c.x} 실행 명령이 없는 스킬 ${noCmd.length}건  ${c.d}${noCmd.join(', ')}${c.x}`);
      warns.push('실행 명령 없는 스킬 존재');
    } else {
      p(`  ${c.g}✓${c.x} 스킬 전부에 실행 명령 있음`);
    }
  }

  p('');
  if (problems.length) {
    p(`${c.r}진단 실패${c.x} — ${problems.length}건`);
    for (const x of problems) p(`  · ${x}`);
    process.exit(1);
  }
  p(`${c.g}진단 통과${c.x}${warns.length ? ` ${c.y}(권고 ${warns.length}건)${c.x}` : ''}`);
  for (const w of warns) p(`  ${c.y}·${c.x} ${w}`);
}

async function catalog() {
  const files = existsSync(paths.catalog) ? readdirSync(paths.catalog).sort() : [];
  if (!files.length) { p('카탈로그가 없다. refresh --write 를 먼저 돌려라.'); return; }
  p(`${c.B}data/catalog/${c.x}`);
  for (const f of files) {
    const j = readJSONOrFail(join(paths.catalog, f), '');
    const size = JSON.stringify(j).length;
    p(`  ${pad(f, 22)} ${pad(num(size) + ' B', 12)} ${c.d}${topKeys(j).slice(0, 6).join(', ')}${c.x}`);
  }
  const man = readJSONOrFail(paths.manifest, '');
  p('');
  p(`${c.B}요약${c.x}`);
  for (const r of man.inventory) p(`  ${pad(String(r.n), 6)} ${pad(r.kind, 16)} ${c.d}${r.note}${c.x}`);
}

function topKeys(j) {
  return Object.keys(j).slice(0, 8);
}

async function query() {
  const q = positional.join(' ').trim();
  if (!q) { p('사용법: node tools/t2at.mjs query "<키워드>"'); process.exit(1); }
  const ql = q.toLowerCase();
  const hits = [];

  // 1. 카탈로그 값 매칭
  for (const f of (existsSync(paths.catalog) ? readdirSync(paths.catalog) : [])) {
    const j = readJSONOrFail(join(paths.catalog, f), '');
    scanJson(j, `data/catalog/${f}`, ql, hits);
  }
  for (const f of (existsSync(paths.legacy) ? readdirSync(paths.legacy) : [])) {
    const j = readJSONOrFail(join(paths.legacy, f), '');
    scanJson(j, `data/legacy/${f}`, ql, hits);
  }
  // 2. 지식 문서
  for (const d of knowledgeDocs()) {
    const t = readFileSync(join(TOOL_ROOT, d), 'utf8');
    const lines = t.split(/\r?\n/);
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes(ql)) hits.push({ file: d, line: i + 1, text: l.trim().slice(0, 150) });
    });
  }

  const uniq = dedupe(hits);
  p(`${c.B}"${q}" 검색 결과${c.x} — ${uniq.length}건`);
  for (const h of uniq.slice(0, 60)) {
    if (h.file.includes('/catalog/') || h.file.includes('/legacy/')) {
      p(`  ${c.b}${h.file}${c.x} ${c.d}${h.path}${c.x}`);
    } else {
      p(`  ${c.b}${h.file}:${h.line}${c.x}  ${h.text}`);
    }
  }
  if (uniq.length > 60) p(`  ${c.d}… 외 ${uniq.length - 60}건. 좀 좁히거나 knowledge/ 를 직접 grep하라.${c.x}`);
}

function scanJson(obj, file, ql, out, path = '') {
  if (out.length > 4000) return;
  if (obj === null || typeof obj !== 'object') {
    if (String(obj).toLowerCase().includes(ql)) out.push({ file, path });
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => scanJson(v, file, ql, out, `${path}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(obj)) scanJson(v, file, ql, out, path ? `${path}.${k}` : k);
}

function dedupe(hits) {
  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const k = h.file + '|' + (h.line ?? '') + '|' + (h.path ?? '') + '|' + (h.text ?? '');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
  }
  return out;
}

function isAbsolute(p2) { return p2.startsWith('/'); }
