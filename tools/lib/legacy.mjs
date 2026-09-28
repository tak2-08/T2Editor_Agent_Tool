// v1~v10 레거시 데이터셋 빌더.
//
// 함정(2026-09-28 실측):
//   1. data/releases/vN.json 은 JSON 배열이 아니라 **JSONL** 이다. 한 줄이 한 릴리즈.
//   2. 릴리즈 본문의 `## 배포 설명` 절 첫 문장이 실제 배포일이다.
//      `published_at` 은 전 판본이 2026-09-27 (아카이브 재게시) 이므로 쓰면 안 된다.
//   3. 필드명이 GitHub 표준이 아니다: `tag` 이지 `tag_name` 이 아니다. `version` 은 계열명.
//   4. 판본 번호는 본문 메타표 `| 판본 |` 에 백틱으로 들어 있다.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { paths } from './config.mjs';

const FAMILIES = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'];

export function loadRaw(fam) {
  const p = join(paths.releases, fam + '.json');
  if (!existsSync(p)) return [];
  const txt = readFileSync(p, 'utf8');
  const out = [];
  for (const line of txt.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    try { out.push(JSON.parse(s)); } catch { /* 깨진 줄은 조용히 넘기고 아래에서 집계한다 */ }
  }
  return out;
}

function meta(body, label) {
  const re = new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.+?)\\s*\\|\\s*$`, 'm');
  const m = (body || '').match(re);
  return m ? m[1].replace(/\*\*/g, '').replace(/`/g, '').trim() : null;
}

/** 배포 설명 절의 첫 substantive 문장 = 사람이 쓴 변경 요약 */
function lede(body) {
  if (!body) return null;
  const m = body.match(/##\s*배포\s*설명\s*\n+([\s\S]*?)(?=\n\n\||\n\n---|\n\n##|$)/);
  if (!m) return null;
  const txt = m[1]
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('>') && !l.startsWith('|') && !/^[-=]{3,}$/.test(l));
  return txt.length ? txt.slice(0, 3).join(' ') : null;
}

function bodySections(body) {
  if (!body) return [];
  return [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
}

const REMOVAL_HINTS = [
  '제거', '삭제', '중단', '취소', '되돌', '롤백', '복구', '폐기', '더 이상', '미사용',
];

export function buildLegacy() {
  const families = [];
  const all = [];
  const parseErrors = [];

  for (const fam of FAMILIES) {
    const raw = loadRaw(fam);
    const rows = raw.map((r) => {
      const body = r.body || '';
      const edition = meta(body, '판본') || (r.tag || '').replace(/^v/, '');
      const realDate = meta(body, '배포일');
      const license = meta(body, '배포 시점 유효 라이선스');
      const zip = meta(body, '원본 ZIP');
      const sha = meta(body, 'sha256');
      const state = (meta(body, '상태') || '').replace(/\*/g, '').trim();
      const secs = bodySections(body);
      const ledeTxt = lede(body);
      // 후퇴(기능 제거/중단) 신호 — 신설보다 위험하므로 별도 표시
      let regression = null;
      if (ledeTxt) {
        for (const h of REMOVAL_HINTS) {
          const at = ledeTxt.indexOf(h);
          if (at < 0) continue;
          regression = {
            suspected: true,
            keyword: h,
            excerpt: ledeTxt.slice(Math.max(0, at - 26), at + 30).trim(),
          };
          break;
        }
      }
      const row = {
        id: `${fam}-${edition}`,
        family: fam,
        edition,
        tag: r.tag ?? null,
        releaseName: r.name ?? null,
        realDate: realDate ?? null,
        archivePublishedAt: r.published_at ?? null,
        state: state || null,
        licenseAtRelease: license ?? null,
        zip: zip ?? null,
        sha256: sha ?? null,
        lede: ledeTxt,
        sections: secs,
        regressionSignal: regression,
        bodySha: shaOf(body),
        body,
      };
      all.push(row);
      return row;
    });
    rows.sort((a, b) => cmpEdition(a.edition, b.edition));
    families.push({
      family: fam,
      count: rows.length,
      first: rows[0]?.edition ?? null,
      last: rows[rows.length - 1]?.edition ?? null,
      firstDate: rows[0]?.realDate ?? null,
      lastDate: rows[rows.length - 1]?.realDate ?? null,
      states: [...new Set(rows.map((r) => r.state).filter(Boolean))],
      licenses: [...new Set(rows.map((r) => r.licenseAtRelease).filter(Boolean))],
      missingRealDate: rows.filter((r) => !r.realDate).length,
    });
  }

  // 라이선스 세대
  const licMap = new Map();
  for (const r of all) {
    if (!r.licenseAtRelease) continue;
    const k = r.licenseAtRelease.split(' ')[0];
    if (!licMap.has(k)) licMap.set(k, []);
    licMap.get(k).push(r.id);
  }
  const licenseGenerations = [...licMap.entries()]
    .map(([ver, ids]) => ({ license: ver, count: ids.length, versions: ids }))
    .sort((a, b) => b.count - a.count);

  // 회귀 신호
  const regressions = all.filter((r) => r.regressionSignal).map((r) => ({
    id: r.id, family: r.family, edition: r.edition, date: r.realDate,
    keyword: r.regressionSignal.keyword,
    excerpt: r.regressionSignal.excerpt,
    lede: r.lede,
  }));

  return {
    schema: 't2at/legacy@1',
    note: 'published_at 은 아카이브 재게시 시각이다. realDate 가 진짜 배포일이다.',
    counts: {
      families: FAMILIES.length,
      releases: all.length,
      missingRealDate: all.filter((r) => !r.realDate).length,
      parseErrors: parseErrors.length,
    },
    families,
    licenseGenerations,
    regressions,
    releases: all.map(({ body, ...r }) => r),
  };
}

function shaOf(s) {
  // 의존성 0 해시 (FNV-1a 64bit → 16진 16자). 충돌 검사용으로 충분.
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (Math.imul(h2 ^ s.charCodeAt(i), 0x85ebca6b) >>> 0);
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'));
}

function cmpEdition(a, b) {
  const pa = String(a).split(/[.\-]/).map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split(/[.\-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return d;
  }
  return String(a).localeCompare(String(b));
}
