// T2Editor_Agent_Tool — 경로/설정 해석
// 규약: 의존성 0. Node ≥18. CommonJS 금지(ESM).
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const TOOL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** 정본 T2Editor-v11 저장소 루트 후보. 첫 번째로 존재하는 것을 쓴다. */
const V11_CANDIDATES = [
  process.env.T2EDITOR_V11_ROOT,
  '/workspace/T2Editor-v11',
  join(process.cwd(), 'T2Editor-v11'),
  resolve(process.cwd(), '..', 'T2Editor-v11'),
].filter(Boolean);

export function v11Root() {
  for (const c of V11_CANDIDATES) {
    if (existsSync(join(c, 'T2Editor', 'editor.lib.php'))) return c;
  }
  return null;
}

export function requireV11Root() {
  const r = v11Root();
  if (!r) {
    fail(
      'T2Editor-v11 정본을 찾지 못했다.',
      'T2EDITOR_V11_ROOT 환경변수로 저장소 루트를 지정하거나, /workspace/T2Editor-v11 에 체크아웃해라.',
      `검사한 경로: ${V11_CANDIDATES.join(', ')}`
    );
  }
  return r;
}

/** 배포 패키지 루트 (…/T2Editor). 저장소 루트와 혼동하지 말 것. */
export function packageRoot() {
  return join(requireV11Root(), 'T2Editor');
}

/** 정본 커밋. dirty면 '(dirty)' 를 붙인다 — 인용 검증은 커밋에 대해 의미가 있다. */
export function v11Commit(root = requireV11Root()) {
  try {
    const sha = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    let dirty = false;
    try {
      const s = execFileSync('git', ['-C', root, 'status', '--porcelain'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      dirty = s.length > 0;
    } catch { /* git 없이도 굴러가야 한다 */ }
    return { sha, dirty };
  } catch {
    return { sha: null, dirty: null };
  }
}

export const paths = {
  data: join(TOOL_ROOT, 'data'),
  catalog: join(TOOL_ROOT, 'data', 'catalog'),
  legacy: join(TOOL_ROOT, 'data', 'legacy'),
  releases: join(TOOL_ROOT, 'data', 'releases'),
  versions: join(TOOL_ROOT, 'data', 'versions'),
  knowledge: join(TOOL_ROOT, 'knowledge'),
  skills: join(TOOL_ROOT, 'skills'),
  datasets: join(TOOL_ROOT, 'datasets'),
  staging: join(TOOL_ROOT, '_staging'),
  manifest: join(TOOL_ROOT, 'data', 'MANIFEST.json'),
};

export function readJSON(p, fallback = null) {
  try { return JSONFile(p); } catch { return fallback; }
}

function JSONFile(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function readJSONOrFail(p, hint) {
  if (!existsSync(p)) {
    fail(`${p} 가 없다.`, hint, '이 저장소의 `tools/t2at.mjs` 를 쓸 수 있는 위치에서 실행했는지 확인하라.');
  }
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { fail(`${p} JSON 파싱 실패: ${e.message}`, '손으로 편집하다 중간에 잘렸을 수 있다. git checkout 으로 복원하라.'); }
}

export function isAbs(p) { return isAbsolute(p); }

export function fail(title, hint, detail) {
  const e = new Error(title);
  e.t2at = { title, hint, detail };
  throw e;
}
