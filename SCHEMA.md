# SCHEMA — 데이터 계약

이 저장소의 모든 `data/` · `datasets/` 파일은 **생성물**이며 아래 계약을 따른다. 계약이 바뀌면 `schema` 필드 버전을 올리고 `CHANGELOG.md` 에 적는다.

## 0. 원칙

1. **생성물만 손으로 쓴다.** 원본은 정본 저장소(`T2Editor-v11`)와 GitHub 릴리즈 API다.
2. **숫자는 재현 가능해야 한다.** 같은 정본 커밋에서 같은 커밋이 나오면 `refresh --write` 결과가 동일하다(추출기가 결정적).
3. **모르는 것은 비워 둔다.** 값을 추정해서 채우지 않는다. 필드 자체를 넣지 않거나 `null` 이다.
4. **모든 줄에 출처가 있다.** 카탈로그 항목은 `source` / `line` 을, 레거시는 `body` 원문과 `bodySha` 를 가진다.

---

## 1. `data/MANIFEST.json` — `t2at/manifest@1`

```jsonc
{
  "schema": "t2at/manifest@1",
  "generated_at": "2026-09-28T…Z",
  "generated_by": "tools/t2at.mjs refresh",
  "v11_commit": "57a8b5f0…",     // 자산의 기준 커밋
  "v11_dirty": true,              // 기준 시점에 정본에 미커밋 변경이 있었는가
  "extractor": "tools/lib/extract.mjs",
  "inventory": [ { "n": 821, "kind": "패키지 파일", "note": "…" } ]
}
```

`doctor` 는 `v11_commit` 과 현재 정본 커밋을 비교한다. 다르면 실패.

---

## 2. `data/catalog/*.json` — 정본 추출물 (11종)

공통 규칙:
- `source` 또는 파일별 `source` 필드에 **저장소 루트 기준 경로**를 쓴다.
- 줄 번호는 **1-based**.
- 파서가 못 뽑은 것은 필드를 넣지 않는다(빈 배열이 아니라 빈 객체/필드 생략).

| 파일 | 핵심 필드 | 추출기 |
|---|---|---|
| `inventory.json` | `files` `bytes` `ext{}` `top{}` `outside{}` | `inventory()` |
| `plugins.json` | `registrationLine` `registeredCount` `directoryCount` `registered[]` `notInDefaultRegistration[]` `autoRegistrar{}` `plugins[].{id,role,inDefaultRegistration,registration,files,bytes,hooksFiles,button,manifest,topFiles}` | `plugins()` |
| `config-keys.json` | `rootArrayLine` `total` `groupCount` `subgroupCount` `topGroups[]` `keys[].{path,kind,value,line,depth,inline}` | `configKeys()` |
| `endpoints.json` | `endpoints[].{file,pair,bytes,lines,functions[],hasAbortGuard}` | `endpoints()` |
| `cms-adapters.json` | 4개 그룹별 `file bytes lines functions[] registerCalls[]` | `cmsAdapters()` |
| `css-tokens.json` | 파일별 `defCount` `families{}` `atLayers[]` `defs[]` | `cssTokens()` |
| `css-contract.json` | `rules[]` `labels{}` `retired[]` `publishedVocab[]` `hardFail` | `cssContract()` |
| `gate.json` | `stepCount` `steps[].{n,name,command,line}` `hasArgParsing` `supportsQuickFlag` `quickMentionLines[]` `baselines[]` | `gate()` |
| `tests.json` | `total` `byArea{}` `runners[]` | `tests()` |
| `i18n.json` | `locales[].{file,bytes,keys}` | `i18n()` |
| `vendor.json` | `packages[].{package,files,bytes,versions[],largest[]}` `totalBytes` | `vendor()` |

### 알려진 추출 한계 (정직하게)

| 대상 | 한계 |
|---|---|
| `config-keys.json` | 여러 줄에 걸친 평면 값은 세지 않는다. 한 줄 인라인 배열 안의 키는 센다 |
| `vendor.json` `versions` | 정규식 문자열 탐지. `VERSIONS.json` 기재분만 잡힐 수 있다 → **CVE 판단엔 부적합** |
| `tests.json` `families` | 러너 파일 안의 `'name': [` 패턴만. 시험 이름의 정식 목록이 아님 |
| `css-contract.json` `rules` | 주석 헤더(`C1. …`) 기준. 코드만 있고 헤더가 없으면 누락 |
| `inventory` | `data/` `node_modules` `.git` `.cache` `backups` 는 제외 |

---

## 3. `data/legacy/release-index.json` — `t2at/legacy@1`

```jsonc
{
  "schema": "t2at/legacy@1",
  "note": "published_at 은 아카이브 재게시 시각이다. realDate 가 진짜 배포일이다.",
  "counts": { "families": 10, "releases": 93, "missingRealDate": 0, "parseErrors": 0 },
  "families":  [ { "family":"v1", "count":19, "first":"1.0.0-beta", "last":"1.6.3",
                   "firstDate":"2025-02-15", "lastDate":"2025-05-01",
                   "states":["EOL"], "licenses":["1.0 (판본 안 License_ko.txt)","none"],
                   "missingRealDate":0 } ],
  "licenseGenerations": [ { "license":"1.0", "count":31, "versions":["v1-1.6.3", …] } ],
  "regressions": [ { "id":"v5-5.7.0", "edition":"5.7.0", "date":"…",
                     "keyword":"롤백", "excerpt":"…", "lede":"…" } ],
  "releases": [ { "id":"v1-1.6.3", "family":"v1", "edition":"1.6.3", "tag":"v1.6.3",
                  "realDate":"2025-05-01", "archivePublishedAt":"2026-09-27T14:22:03Z",
                  "state":"EOL", "licenseAtRelease":"…", "zip":"…", "sha256":"…",
                  "lede":"…", "sections":["배포 설명","저작권 안내"],
                  "regressionSignal":null, "bodySha":"42984c71cd3a0f63" } ]
}
```

- `id` = `{계열}-{판본}` — 안정 키.
- `regressions` 는 **키워드 매칭 신호**다. 오탐이 있다. 확정하려면 `lede` 를 읽는다.
- 본문 전문은 `data/legacy/releases.json` 의 `releases[].body`.

### 원본 파싱 함정 (파서가 처리한다)

| 함정 | 처리 |
|---|---|
| `data/releases/vN.json` 은 **JSON 배열이 아니라 JSONL** | 줄 단위 파싱 |
| GitHub 표준이 아님: `tag` (표준은 `tag_name`), `version` 은 계열명 | 그대로 읽음 |
| 진짜 배포일은 본문 `\| 배포일 \|` 행 | `meta(body,'배포일')` |
| `published_at` 은 전 판본 아카이브 재게시 | `realDate` 와 분리 저장 |

---

## 4. `datasets/*.csv`

전부 `tools/lib/csv.mjs` 가 생성한다. **손으로 고치지 않는다.** (drift 원천)

| 파일 | 행 수(2026-09-28) | 키 |
|---|---|---|
| `config-keys.csv` | 239 | `path,kind,value,line,source` |
| `plugins.csv` | 17 | `id,role,in_default_registration,registration,files,bytes,button_manifest,hook_files,top_files` |
| `release-history.csv` | 93 | `id,family,edition,tag,real_deploy_date,archive_published_at,state,license_at_release,regression_signal,zip,sha256,lede,body_sha` |
| `families.csv` | 10 | `family,releases,first_edition,last_edition,first_date,last_date,states,licenses,missing_real_date` |
| `css-contract.csv` | 규칙+폐기 | `code,title,kind,line,source` |
| `endpoints.csv` | 11 | `file,pair,bytes,lines,functions,has_request_guard` |
| `release-gate.csv` | 10 | `n,name,command,line` |
| `inventory.csv` | 계층별 | `area,files,bytes,top_exts` |
| `vendor.csv` | 12 | `package,files,bytes,detected_versions,largest_files` |
| `citations.csv` | 20 | `citations,doc,path,spec,resolve_to,must_contain,why` |

`citations.csv` 는 **생성물이 아니다** — 사람이 관리하는 계약 파일이다 (`tools/lib/csv.mjs` 가 건드리지 않는다).

---

## 5. `datasets/citations.csv` — 계약 파일 (수동 관리)

```
n,doc,path,spec,resolve_to,must_contain,why
```

| 열 | 뜻 |
|---|---|
| `n` | 일련번호 (참고용) |
| `doc` | 이 저장소 안의 문서 경로 (`knowledge/…`, `skills/…`) |
| `path` | **문서에 실제로 적힌** 인용 문자열의 경로 |
| `spec` | 라인/구간/복수 (`47`, `31,34,47`, `711-719`, `1,2`) |
| `resolve_to` | basename 이 모호할 때 정본 경로로 고정 |
| `must_contain` | 그 자리에 **반드시 있어야 할 문자열**. `\|` 로 여러 개 가능 |
| `why` | 왜 감지가 필요한지 |

### 계약 규칙

1. **열 수가 헤퍼와 같아야 한다.** 다르면 `verify` 가 즉시 오류를 뱉는다. (이전 버그: 쉼표 하나가 많아 `must_contain` 가 빈 칸이 되고 **내용 변경 감지가 조용히 죽었다**.)
2. **`must_contain` 은 그 줄에 실제로 있는 문자열이어야 한다.** 없으면 `NO_MATCH` 로 영구 실패한다.
3. **미결합 힌트는 죽은 감지다.** `verify --json` 이 보고한다. 문서에 인용을 넣거나 행을 지운다.
4. **`must_contain` 을 통과시키려고 고치지 마라.** 정본이 바뀐 것이다.

---

## 6. `datasets/citation-report.json` — 마지막 검증 결과

```jsonc
{
  "checked_at": "…", "v11_commit": "…",
  "summary": { "total": 657, "by": { "OK": 657, "NO_MATCH": 0, "LINE_OOB": 0, "UNRESOLVED": 0 } },
  "hints": { "total": 20, "bound": 20, "unused": [] },
  "results": [ { "doc":"…", "path":"…", "spec":"…", "status":"OK",
                 "resolved":"/abs/path", "how":"direct|basename|pinned|glob",
                 "fileLines": 384, "note": "…" } ]
}
```

### 판정 코드

| 코드 | 뜻 | 심각도 |
|---|---|---|
| `OK` | 해석 성공 + 범위 안 + 기대 토큰 일치 | — |
| `NO_MATCH` | 기대 토큰이 그 자리에 없음 → **내용이 바뀜** | 가장 위험 |
| `LINE_OOB` | 파일은 있으나 라인 범위 밖 → 줄이 밀림 | 높음 |
| `UNRESOLVED` | 경로 해석 실패: basename 모호 / 오타 / 정본 미연결 | 중간 |

`how` 필드: `direct`(경로 직접 일치) · `basename`(유일 일치) · `pinned`(`resolve_to` 고정) · `glob`(글로브 확장).

### 인용 문법

```
`T2Editor/config/t2_upload.php:705`         단일 라인
`tools/t2-release-gate.sh:84-94`            구간
`endpoints/run.php:1, run.core.php:2`       복수
`endpoints/*.core.php:4`                    글로브
T2Editor/vendor/pdfjs/pdf.min.js:110580     압축 파일 = 문자 오프셋
```

구현 규약(모두 실측에서 온 것):
- 경로는 **탐욕적**으로 먹는다. 게우르면 `api.core.php:4` → `.core.php:4` 로 잘린다.
- 경로와 라인 사이는 **반드시 콜론**.
- **코드펜스 안은 긁지 않는다** (명령 인자와 정규식 예시가 인용으로 잡히는 것을 막는다).
- 압축 파일(줄 < 200 · 바이트 > 100KB)은 **오프셋**으로 읽고 **latin1** 로 연다(바이트 인덱스 = 문자 인덱스). utf8 로 읽으면 멀티바이트 뒤에서 전부 어긋난다.

---

## 7. 버전 관리

| 스키마 | 상태 |
|---|---|
| `t2at/manifest@1` | 현재 |
| `t2at/legacy@1` | 현재 |
| `t2at/legacy-bodies@1` | 현재 |

계약을 깨는 변경이 필요하면: 기존 필드는 **삭제하지 않는다**(deprecated 로 두어 1버전), `schema` 를 `@2` 로 올리고 `CHANGELOG.md` 에迁移 항목을 적는다.

---

## 8. 단일 진실 원칙

같은 내용을 두 형식으로 저장하지 않는다. 2026-09-28 에서 `data/releases/vN.json` 과 그를 그대로 감싼 `data/releases/vN.md` 가 동시에 있었다 — 언제든 어긋날 수 있는 쌍이며, 실제로 `.json` 이 JSONL 이라는 사실과 형식이 달랐다.

⇒ **원본은 JSONL(`data/releases/vN.json`) 하나뿐**이다. 사람이 읽는视图가 필요하면:

```bash
node -e '
const fs=require("fs");
const fam=process.argv[1];
for (const l of fs.readFileSync("data/releases/"+fam+".json","utf8").split(/\n/).filter(Boolean)) {
  const j=JSON.parse(l);
  console.log("## " + (j.tag||"") + "\n" + j.body + "\n");
}' v6
```

레거시 릴리즈 본문을 **전수** 보려면 `data/legacy/releases.json` 의 `releases[].body` 를 쓴다. 요약·변환 결과가 필요하면 `node tools/t2at.mjs query` 를 쓴다.
