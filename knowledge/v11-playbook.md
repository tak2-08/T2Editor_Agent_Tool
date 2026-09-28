# T2Editor v11 — 검증·작업 플레이북 (과장 B2)
---

<!-- T2Editor_Agent_Tool · 정본 지식 자산 -->

# T2Editor v11 — 검증·작업 플레이북

> **출처** B2(플레이북 과장) 작성 2026-09-28 · 1537줄 · A1 재검증 포함 · 부장 감사 2026-09-28 완료
>
> **감사 기록 (부장)**
> ✅ **4건의 문서 오류를 실측으로 확정** — 이 저장소가 왜 필요한가의 직접 증거: (F1) `t2-release-gate.sh` 에 **인자 파싱이 없어 `--quick` 이 존재하지 않는다**(주석 `tools/t2-release-gate.sh:11` 에만 있음). `AGENTS.md:23` 도 같은 오류를 옮겼다. (F2) 이 컨테이너에 `php`·`python3` 가 없어 게이트 3단계에서 즉시 실패. (F3) Playwright 전무. (F4) `_probe_*.php` 4개가 이미 커밋돼 있어 ignore 규칙이 무효.
> ✅ **`| head` 파이프 함정 실측** — 게이트 출력을 `| head` 로 자르면 `$?` 가 0 이 되어 실패가 통과로 읽힌다(정직한 값 1 / 거짓 0 / SIGPIPE 141). 후배 에이전트가 가장 쉽게 저지르는 실수라 §2.2 에 격리했다.
> ✅ **A1 재검증 결과**: CSS 계약 규칙 주장 3건(C16/C17 부재·C22 폐기) 전부 정확. `AGENTS.md` 인용 라인 6건 중 **4건 STALE·2건 정확**, 그중 `AGENTS.md:45` 는 라인뿐 아니라 **내용도 오류**(`1.5s`→실측 `3s`, "19개"→"19 중 14개"). 이 오염이 `GITHUB-ISSUE-BODY-KO.md:19` 로 전파됐다.
> ✅ **부장 보충**: `t2-css-contract.mjs:76` 이 가리키는 갱신 대상은 `AGENTS.md:43` 이 아니라 **`T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md`** 다(공개 어휘 목록 `tools/t2-css-contract.mjs:77` `PUBLISHED_VOCAB`).
> ⚠ `tests/php/custom-profile.test.php` 의 두 본문 대조는 `is_file()` 로 감싸여 **파일만 사라지면 조용히 통과하는 vacuous 경로** 가 있다. 통과를 증거로 인용하지 마라.

---


> **읽기 전용 조사 산출물.** 모든 명령·경로·라인·라벨은 `/workspace/T2Editor-v11/` 에서
> 실제 소스를 읽고 `command -v` · `node` · `git check-ignore` · `grep` 로 **실측**해 옮겼다.
> 추측한 명령은 하나도 없다. 원문 줄번호는 규범 파일의 것을 유지했고, 실제 코드의
> 라인이 다른 곳은 **⚠ STALE** 로 표시했다.
>
> 조사 일시 2026-09-28 · 대상 커밋 `57a8b5f` (main) · 정본 무수정·커밋 0

---

## 🚨 먼저 알아야 할 4가지 (이 문서를 쓰면서 실측한 함정)

| # | 함정 | 실측 결과 | 규범 파일 상태 |
|---|---|---|---|
| **F1** | **`--quick` 플래그가 존재하지 않는다** | `bash tools/t2-release-gate.sh --quick` 이 **10단계 전부**를 돈다. 인자 파싱 코드가 없다. 실측 완료(§2.3) | `AGENTS.md:23` + `t2-release-gate.sh:11` **둘 다 거짓 문서**. `CLAUDE.md` 는 이 플래그를 안 적어 그쪽이 정본 |
| **F2** | **`php` 와 `python3` 가 없다** | `command -v php` / `python3` → 둘 다 없음. 게이트 10단계 중 3단계 즉시 실패 + `node tests/run.mjs` 도 **4건 실패** | `AGENTS.md:28` 은 "필요: Node ≥18, php-cli, python3" 라고만 적음. 이 컨테이너는 **조건 미충족** |
| **F3** | **Playwright 가 아예 없다** | `/opt/pw-browsers` 없음. `node_modules` 에 playwright 없음. `@playwright/test` = `ERR_MODULE_NOT_FOUND`. chrome/chromium/chromedriver 전부 없음 | `AGENTS.md:75` "Playwright 전역, Chromium `/opt/pw-browsers`" 는 **이 환경에서 거짓** |
| **F4** | **스크래치 프로브 4개가 이미 커밋됨** | `_probe_real.php` `_probe_surface.html` `_probe_surface2.html` `_probe_wf.html` — `.gitignore` 미등록 + `git ls-files` 로 **추적 중 확인** | A1의 "등록 안 됨"은 **절반만 맞음**(§3.5). 등록 없다는 건 맞으나 **사고는 이미 났다** |

**이 네 가지 때문에 "일단 돌려보자"는 여기서 즉시 막힌다.** §2.6·§3.6 의 대체 경로를 따라가라.

---

# 1. 세션 시작 60초 프로토콜

## 1.1 정본은 GitHub — 로컬 스냅샷이 아니다

`AGENTS.md:6-17` 원문:

> ## 정본은 GitHub — 로컬 디렉터리가 아니다
> 로컬 `opencode` 디렉터리 스냅샷을 정본으로 삼지 않는다. **매 작업 시작 시 GitHub 정본을 기준으로 한다.**
> ```bash
> git fetch origin
> git log --oneline origin/main -5   # 최신 정본 확인
> git rev-parse HEAD && git rev-parse origin/main  # 뒤처졌는지 확인
> ```
> - 작업 기준은 `origin/main` 최신. 로컬 `agent/*` 등이 뒤처졌으면 `origin/main`에서 새로 분기하거나 rebase — **로컬 HEAD 맹신 금지.**
> - 파일 읽기·패치 전에도 GitHub가 최신인지 확인하고, 커밋·PR도 원격과 대조. **로컬에만 있는 상태는 정본이 아니다.**

`CLAUDE.md:4-12` 가 같은 내용을 브랜치 제외 규칙과 묶어 다시 적는다.

**운영 규율:**
- `git rev-parse HEAD` 와 `git rev-parse origin/main` 이 **다르면 파일을 읽기 전에 멈춘다.** 다르면 미push 커밋가 있다는 뜻이고, 그 위의 어떤 라인 인용도 신뢰할 수 없다.
- **`git reset --hard origin/main` 으로 맹신하지 마라.** 미push 커밋가 날아간다. 맹신이 금지된 이유다.

## 1.2 백로그 확인

`AGENTS.md:204` (2번 항목):

```bash
gh issue list --label agent:t2editor --state open --limit 100
```

`AGENTS.md:205` — *"this remains the actual backlog; don't rebuild it from scratch, and **don't let memory notes substitute for it**."*
**메모리에 적은 백로그를 대신 쓰지 마라.** 이슈가 정본이다.

`AGENTS.md:216` — 가장 높은 심각도의 open 이슈 중 `in-progress` 가 아닌 것을 골라 `in-progress` 를 붙이고 작업한다.

## 1.3 이 저장소의 라벨 체계 전체 (`AGENTS.md:227-232` 원문)

```markdown
- Always label `agent:t2editor`, plus:
  - severity: `sev:critical` / `sev:high` / `sev:medium` / `sev:low`
  - area: `area:design`, `area:responsive`, `area:mobile`, `area:ux`, `area:a11y`, `area:admin-dev`,
    `area:admin-nontech`, `area:bug`, `area:legacy`, `area:perf`, `area:compat`
  - status: `in-progress` while actively working it (remove once the PR opens); `needs-human` if
    escalated
```

**전수 17개:**

| 계열 | 값 |
|---|---|
| 소유 (필수) | `agent:t2editor` |
| 심각도 (4) | `sev:critical` `sev:high` `sev:medium` `sev:low` |
| 영역 (11) | `area:design` `area:responsive` `area:mobile` `area:ux` `area:a11y` `area:admin-dev` `area:admin-nontech` `area:bug` `area:legacy` `area:perf` `area:compat` |
| 상태 (2) | `in-progress` `needs-human` |

- `AGENTS.md:175` — 브라우저·환경·입력 엣지 케이스는 **반드시 `area:compat`**. 심각도는 "몇 명에게 얼마나 나쁜가"로 정한다.
- `in-progress` 는 **PR 이 열리면 제거**한다. 남겨두면 다른 에이전트가 그 이슈를 못 집는다.
- `needs-human` 는 §7.8 의 6개 에스컬레이션에 대응하는 라벨이다. 라벨만 붙이고 멈추면 안 된다 — 이슈 본문에 접근법 2~3개 + 권고를 한국어로 적는다(`AGENTS.md:326-327`).
- 이슈 본문은 **한국어**(`AGENTS.md:234`). 유지자는 기술자가 아니다(`AGENTS.md:109-111`).
- 본문 필수(`AGENTS.md:233`): 무엇이 잘못 / 어디가(file·component) / 왜 중요한가 / 제안하는 접근.

---

# 2. 검증 게이트 — 실측

## 2.1 게이트는 10단계 (`tools/t2-release-gate.sh:84-94` — 이 10줄이 전부)

`SCAN='T2Editor tools tests'`(`:42`), `*/vendor` 제외(`:45,49,53`).

| # | 단계명 (그대로) | 라인 | 실제 명령/함수 | 무엇을 잡는가 |
|---|---|---|---|---|
| 1 | `PHP 구문 검사` | `:84`→`:44-47` | `find $SCAN -name '*.php' \| xargs -n1 -P4 php -l` | PHP 파싱 실패 |
| 2 | `JS 구문 검사` | `:85`→`:48-51` | `find $SCAN -name '*.js' \| xargs -n1 -P4 node --check` | JS 파싱 실패 |
| 3 | `JSON 구문 검사` | `:86`→`:52-55` | `node -e 'JSON.parse(...)'` | JSON 파싱 실패 |
| 4 | `매니페스트 스키마` | `:87`→`:56-62` | `node T2Editor/developer/tools/t2e-capability-lint.mjs T2Editor/modules/*/*/module.json …` | manifest 스키마 |
| — | *(전처리)* | `:88`→`:72-76` | `clean_runtime_dir()` — 추적 안 된 `T2Editor/data` 를 `rm -rf` | (§2.1.1 주석) |
| 5 | `정적 검사` | `:89` | `node tools/t2-static-check.mjs` | postMessage 가드, 장치 지문, 릴리즈 아티팩트 |
| 6 | `CSS 계약 검사` | `:90` | `node tools/t2-css-contract.mjs` | C1~C21 (§6) |
| 7 | `발행 본문 시트 일치` | `:91` | `node tools/t2-content-css-build.mjs` | `css/content.css` ↔ 원천 어긋남 |
| 8 | `회귀 시험 (JS)` | `:92` | `node tests/run.mjs` | `tests/js/*.test.mjs` 전수 |
| 9 | `회귀 시험 (PHP)` | `:93` | `php tests/run.php` | `tests/php/*.test.php` 전수 |
| 10 | `런타임 산출물 미커밋` | `:94`→`:63-66` | `! git ls-files --error-unmatch T2Editor/data` | `T2Editor/data/` 추적 중이면 실패 |

### 2.1.1 `clean_runtime_dir` 가 왜 있는가 (`:68-76` 원문)

> CI 는 매번 새 체크아웃에서 돌기 때문에 정적 검사 시점에 data/ 가 없다. 로컬은 직전 실행이 만든 data/ 가 남아 있어 release-artifact 규칙에 걸린다. 그 전제를 맞춰 준다. **추적되는 data/ 는 그 자체가 위반이므로 건드리지 않고** 아래 '런타임 산출물 미커밋' 검사가 잡게 둔다.

⇒ **`clean_runtime_dir` 는 추적 중인 `data/` 를 지우지 않는다.** 10단계가 잡는다.

### 2.1.2 `AGENTS.md` 와의 대조 — 차이 3건

| 항목 | `AGENTS.md` | 실측 | 판정 |
|---|---|---|---|
| 단계 수 | 미기재 ("전체 재현") | 10단계 | 일치 |
| 순서 규약 | `:29` "정적 검사 → PHP 시험" | `:89`(정적)→`:93`(PHP), 그 사이에 JS 회귀 | **부분 일치** — "정적이 PHP보다 먼저"만 규약 |
| `--quick` | `:23` "PHP 매트릭스 없이 한 판만" | **없음** | **⚠ 거짓 문서 (F1)** |
| 단계 4·7 | 언급 없음 | 존재 (`:87`,`:91`) | 문서가 덜 씀 — 무해 |

## 2.2 실행과 종료 코드 — ⚠ 파이프가 종료 코드를 삼킨다

**반드시 저장소 루트에서** (`AGENTS.md:4`; 스크립트가 `cd "$(dirname "$0")/.."`(`:21`)로 강제).
**출력은 항목당 한 줄**(`:16-17`). **실패 항목 로그만 마지막 40줄**(`:104-107`). **종료 코드 0=통과, 1=실패**(`:19`).

실측:

| 방법 | 결과 |
|---|---|
| `bash tools/t2-release-gate.sh > /dev/null 2>&1; echo $?` | `real exit=1` ✔ 정직 |
| `... \| head -3; echo $?` | `naive $?=0` ✘ **거짓** (head 의 코드) |
| `... \| head -3; echo ${PIPESTATUS[0]}` | `141` (SIGPIPE) — 게이트 실패가 아니라 head 가 조기에 닫음 |

**규칙: 판정할 때 파이프를 쓰지 마라.**

```bash
bash tools/t2-release-gate.sh > /tmp/gate.txt 2>&1
rc=$?; tail -40 /tmp/gate.txt; echo "게이트 판정: rc=$rc"
```

`AGENTS.md:30` — *"종료 코드 0 아니면 **푸시 금지**."*

## 2.3 `--quick` 은 존재하지 않는다 (F1)

`t2-release-gate.sh:10-11` 헤더 주석:
```
#   bash tools/t2-release-gate.sh          전체
#   bash tools/t2-release-gate.sh --quick  PHP 매트릭스 없이 대표 한 판만
```

그런데 본문에 인자 파싱이 없다. 유일한 `$1` 은 `step()` 의 지역변수다(`:29`).

```
$ grep -n 'quick' tools/t2-release-gate.sh
11:#   bash tools/t2-release-gate.sh --quick  PHP 매트릭스 없이 대표 한 판만
$ grep -nE '\$1|\$@' tools/t2-release-gate.sh
29:  local name="$1"; shift
31:  if "$@" > "$log" 2>&1; then
```

**실측 — `--quick` 를 줬을 때 실제로 실행된 것:**
```
T2Editor 릴리즈 게이트 (ci.yml 재현)
  FAIL PHP 구문 검사
  ok   JS 구문 검사
  ok   JSON 구문 검사
  ok   매니페스트 스키마
  ok   정적 검사
  ok   CSS 계약 검사
  ok   발행 본문 시트 일치
  FAIL 회귀 시험 (JS)
  FAIL 회귀 시험 (PHP)
  ok   런타임 산출물 미커밋
검사 10건 중 통과 7, 실패 3.
```

**10단계 전부 돌았다.** 인자는 조용히 버려진다. `CLAUDE.md:13` 은 `--quick` 를 **안 적는다** — 그러므로 `CLAUDE.md` 쪽이 정본이다(`AGENTS.md:4` — "CLAUDE.md가 같은 규범을 더 길게 담고 있다").

**후배 지시:** `--quick` 를 **쓰지 마라.** 시간이 낭비되고 "빨라진 줄 알고" PHP 검사를 건너뛴 착각을 만든다.

## 2.4 `--quick` 이 빠져야 할 것은 **CI 매트릭스**다

`.github/workflows/ci.yml:49-52` 의 `strategy.matrix.php: ['7.4','8.0','8.2','8.4']` 와 `:79,85,91,99,108,112` 의 `if: matrix.php == '8.2'` 에서 온 개념이다. **로컬 스크립트에는 매트릭스 개념이 아예 없다** — php-cli 한 판만 돈다. 그래서 로컬에서 뺄 수 있는 것은 매트릭스의 다른 3판이지 로컬의 어떤 단계도 아니었다.

## 2.5 개별 단계만 돌리기 (실제로 권장)

```bash
node tools/t2-static-check.mjs          # ⑤
node tools/t2-css-contract.mjs          # ⑥
node tools/t2-content-css-build.mjs     # ⑦
node tests/run.mjs                      # ⑧
node tests/run.mjs autosave             # ⑧ 이름 필터
```

- `node tools/t2-css-contract.mjs --baseline`(`:34`) 은 위반을 기록하고 **exit 0** 한다(`:736-737`). **판정에 쓰지 마라** — 새 위반을 숨긴다.
- `T2_DUMP=/tmp/v.json` 이면 신규 위반 전체가 JSON dump(`:757`).

## 2.6 이 컨테이너의 실측 환경 (F2 · F3)

| 명령 | 상태 | 위치 |
|---|---|---|
| `node` | ✅ | `/usr/local/bin/node` — **v20.20.2** (요구 ≥18 충족) |
| `git` `gh` `curl` `bash` `sh` | ✅ | `/usr/bin/` |
| **`php`** | ❌ **없음** | `ls /usr/bin \| grep -i ^php` → `(none)` |
| **`python3`** | ❌ **없음** | `python` 도 없음 |
| `jq` `unzip` | ❌ 없음 | — |

`AGENTS.md:28` 원문: *"의존성 설치 없음. 필요: Node ≥18, php-cli, python3 (`tests/js/merge-integrity.test.mjs`가 `tools/css_dead_decl.py` 실행)"*

**현실:**
- 게이트 10단계 중 **3단계 실패** — ① (`xargs: php: No such file or directory`), ⑧, ⑨.
- ④ 는 통과 — `t2e-capability-lint.mjs` 는 node 다.
- **의존성 설치는 규범이 금지한다.** ⇒ **이 컨테이너에서 게이트를 통과시킬 방법은 없다.** 시도하지 마라.

### 2.7 `php` 부재가 `node tests/run.mjs` 를 죽이는 실제 경로 (실측)

```
$ node tests/run.mjs > /tmp/jsrun.txt 2>&1 ; echo "exit=$?"
exit=1
검증 5823건 중 통과 5819, 실패 4.
```

| 실패 | 원인 | 근거 |
|---|---|---|
| `editor-skin-tab :: config/t2_editor_skin.php 를 읽을 수 있다` (기대 0 / **실제 null**) | `tests/js/editor-skin-tab.test.mjs:38-42` 가 `spawnSync('php', [...])` 를 **가드 없이** 호출 | ENOENT → `php.status === null` |
| `editor-skin-tab :: 실행 중 예외` — `TypeError: Cannot read properties of null (reading 'defaults')` (`:46`) | `:43` `JSON.parse(php.stdout)` → `null` → `:46` `server.defaults` 접근에서 터짐 | **가드가 없어 스킵이 아니라 크래시** |
| `merge-integrity :: 교차 컨텍스트 CSS 감사 프로브가 실행된다` | `tools/css_dead_decl.py` 실행 (python3 없음) | `AGENTS.md:28` |
| `merge-integrity :: …감사 도구가 검출한다` | 위 프로브 미실행 → `"죽은 외형 선언 2건"` 문자열 없음 | — |

**⚠ 규범 불일치:** `merge-integrity` 는 php 부재를 **스킵**한다(`php-cli 없음 — 최소화 구문 검사를 건너뜁니다`). `editor-skin-tab` 은 **크래시**. 같은 스위트에 두 철학. 후배가 고칠 때는 `merge-integrity` 방식을 따른다.

### 2.8 이 환경에서 **실제로 통과하는** 것 (실측 rc)

| 명령 | rc | 마지막 출력 |
|---|---|---|
| `node tools/t2-static-check.mjs` | **0** | `배포 조건은 충족하지만 부채가 남아 있습니다…` |
| `node tools/t2-css-contract.mjs` | **0** | `신규 위반 없음.` |
| `node tools/t2-content-css-build.mjs` | **0** | `css/content.css 는 원천과 일치한다.` |
| `node tests/run.mjs` | **1** | `검증 5823건 중 통과 5819, 실패 4.` |
| `node tools/ux/t2-i18n-coverage.mjs` | **0** | `ko: 1711/1712 누락 1 예: _meta.default` |

**정리: 정적 3종은 신뢰할 수 있다. 회귀 시험은 못 믿는다.** 보고서엔 이 구분을 반드시 밝힌다 — "게이트 통과"라고 말하면 거짓이다.

## 2.9 `tools/*.baseline.json` = 허용 목록이 아니라 추적 부채

파일 2개: `t2-css-contract.baseline.json`, `t2-static-check.baseline.json`.

`AGENTS.md:30` — *"허용 목록이 아니라 **추적 부채** — 새 위반을 baseline에 넣지 말고 고친다"*
`t2-css-contract.mjs:721-722` — *"baseline 은 '괜찮다'는 뜻이 아니라 '추적 중인 부채'라는 뜻이다. 줄여 나간다."*

| 파일 | count | 내용 |
|---|---|---|
| `t2-css-contract.baseline.json` | **0** (`"entries": []`) | **비어 있다.** note 에 2026-08-10(버그) → 08-11(`1157건→221건`) → 08-22(C22 폐기 → 0건) 이력 |
| `t2-static-check.baseline.json` | **5** (`known`) | 전부 `[manifest-privacy] plugin/{export,file,image,linkcard,paste_migrate}/plugin.json` — 원인이 파일 안에 적힘: *"remote API를 쓰지만 privacy 선언이 `uses_personal_data:false` 이고 `optional_services` 도 없습니다"* |

**동작 원리 (`:728-740`):** fingerprint = `` `${code}|${file}|${detail.replace(/\d+건/g,'N건')}` `` — **집계형 위반의 건수를 지문에서 지운다**(그래야 부채 축소가 신규로 잡히지 않는다). `fresh = violations.filter(v => !baseline.has(...))` — **신규만** exit 1(`:755-761`).
**추가로 `C1`·`C2` 는 baseline 무시하고 항상 실패**(`:760,763-768`) — 문법/캐스케이드 파괴는 부채로 봉인 불가.

**후배 규칙:** ① `--baseline` 으로 새 위반 흡수 금지 ② 게이트 통과로 적지 말고 "미해결 부채"로 적기 ③ 부채를 줄이면 note 에 사유 기록(`:731` 관례).

## 2.10 `tests/js/release-gate-parity.test.mjs` 가 막는 것 (62줄)

주석(`:2-8`): *"검사가 두 곳에 적히면 한쪽만 고쳐지고, 그때부터 **'로컬은 녹색인데 PR 은 빨강'**이 된다. **사람이 기억하는 규칙은 규범이 아니다** — 여기가 그걸 확인한다."*

| # | 라인 | 무엇을 잡는가 |
|---|---|---|
| 1 | `:18-43` | `CHECKS` 10개 토큰(`php -l`,`node --check`,`JSON.parse`,`t2e-capability-lint.mjs`,`t2-static-check.mjs`,`t2-css-contract.mjs`,`t2-content-css-build.mjs`,`tests/run.mjs`,`tests/run.php`,`git ls-files --error-unmatch`)이 **ci.yml 과 로컬 게이트 양쪽**에 존재하는지 |
| 2 | `:45-51` | 양쪽 모두에서 `t2-static-check.mjs` 인덱스 < `tests/run.php` 인덱스 (정적 → PHP) |
| 3 | `:53-61` | `WORKFLOWS = ['ci.yml','spacing-normalize-once.yml','visual-ui-audit.yml']` 3개가 ①`branches-ignore` ②`'claude/**' 'agent/**' 'probe/**' 'bot/**'` 4개 전부 포함 ③`^\s{2}pull_request:` 로 PR 에서는 그대로 도는가 |

**이 테스트가 막지 못하는 것:** 단계 **개수**를 세지 않는다(토큰 존재만). 순서를 단계 단위로 전수 대조하지 않는다(정적<PHP 한 쌍만). **`--quick` 존재를 안 본다** — 그래서 F1 이 unnoticed 였다. 라벨 이름을 안 본다.

⇒ `AGENTS.md:31` / `CLAUDE.md:26-29` — 검사 추가·순서 변경 시 **`ci.yml` 과 `t2-release-gate.sh` 를 함께 고쳐야 한다.** 이 테스트는 그 대-charg을 하되 **완전하지 않다** — 한쪽만 고친 뒤 **양쪽 단계 수를 손으로 세어라.**

## 2.11 임시 브랜치에서 CI가 돌지 않는다

`AGENTS.md:33-35`: *"`claude/**`, `agent/**`, `probe/**`, `bot/**` push는 `.github/workflows/` **3개 워크플로**에서 제외. 그 브랜치 검증은 로컬 게이트가 대신하고 `main` PR에서는 그대로 돈다."*

실측 — `.github/workflows/` 4개 파일 중 **3개**가 `branches-ignore`:

| 워크플로 | 트리거 | `branches-ignore` | `paths` 필터 |
|---|---|---|---|
| `ci.yml` | `push`+`pull_request`+`workflow_dispatch` (`:20-31`) | ✅ `:25-29` | **없음** — 모든 push |
| `spacing-normalize-once.yml` | `push`+`pull_request`+`workflow_dispatch` (`:6-43`) | ✅ `:11-15` | ✅ `:16-28` |
| `visual-ui-audit.yml` | `push`+`pull_request`+`workflow_dispatch` (`:5-38`) | ✅ `:10-14` | ✅ `:15-25` |
| `opencode.yml` | `issue_comment`+`pull_request_review_comment` (`:2-6`) | ❌ push 트리거 없음 | — |

⇒ **`AGENTS.md:35` 의 "3개 워크플로" 는 정확하다.** `CLAUDE.md:6-8` 도 4개 네임스페이스/3개 워크플로를 정확히 구분한다.
`CLAUDE.md:6-8` 이유: *"에이전트가 중간 커밋을 밀 때마다 GitHub Actions 를 태우지 않기 위해서다. 그래서 **그 브랜치의 기계적 검증은 푸시 전에 이 저장소 안에서 직접 한다.**"*

**⚠ `spacing-normalize-once.yml`·`visual-ui-audit.yml` 은 `paths:` 필터가 있다** — `bot/**` 브랜치에 CSS만 바꿔도 이 둘은 돈다.

---

# 3. Playwright 함정 — 실기기 기준으로 검증

`AGENTS.md:63` 제목: **"Playwright는 녹색 거짓말을 한다 — 실기기 기준으로 검증"**
`AGENTS.md:65` — *"agent Playwright에서는 정상, 실제 Android·iOS Safari/Chrome에서는 비정상인 결함이 반복됐다. **Chromium 단일 통과는 통과가 아니다.**"*

## 3.1 `tools/ux/README.md` 규약 전문 요약 (121줄 실독)

**목적**(`:4-6`): `/law` 해설 704~709 와 `developer/t2-design-system.md` 중 **기계 판정 가능한 것**을 검사. 정적 CSS 검사(`t2-css-contract.mjs`)가 볼 수 없는 것 — **실제로 렌더된 화면의 기하, 대비, 스크롤 소유권, 레이어 가림** — 을 대상으로 한다.

**근거 문장**(`:10`): *"UI 주장은 렌더된 화면에서 측정되기 전까지 검증된 것이 아니다."*

**`t2-ux-check.mjs` 의 성격**(`:16-17`): *"렌더된 한 '상태'를 받아 위반 후보를 반환하는 **라이브러리**다. 상태를 만드는 일(어떤 다이얼로그를 열지, 어디까지 스크롤할지)은 **호출자가 한다**."*

### 검사 항목 9종 (README `:33-43` → 코드 `delta()` `:230-236`)

| # | 항목 | 근거 | `delta()` 키 |
|---|---|---|---|
| 1 | radius 단계 이탈 (역할 사다리 `{0,1,2,3,6,8,12,16}px` 밖) | design-system *Geometry scale*, 해설 704 제3항, 711 A | `radius` |
| 2 | 블록 상하 패딩 비대칭 | 해설 708 C-1·C-2 | `asym` |
| 3 | 사다리 밖 간격값 | 해설 708 A-1 | `ladder` |
| 4 | 이중축 스크롤 | 해설 706 제1항 | `dualAxis` |
| 5 | 잘려서 도달 불가한 콘텐츠 | 해설 706 제7항, 704 제20항 | `clipped`, `offscreen` |
| 6 | coarse pointer 44×44 미만 | design-system *Controls*, 해설 708 H-3 | `tinyTarget` |
| 7 | 텍스트 대비 (WCAG AA) | 해설 704 제10항, 705 제12항 | `contrast` |
| 8 | 흐름 밖 표면의 가림 | 해설 708 F | `occlusion` |
| 9 | 형제 간 1~8px 어긋난 정렬 | 해설 707 C | `nearMiss` |

+ `rootOverflow` — `count()` 에 1점(`:250`).

### 오탐을 줄이기 위해 도구가 **의도적으로 제외**하는 7가지 (`:45-64`)

이것이 `t2-ux-check.mjs` 를 읽어야 하는 진짜 이유다. 빼지 않으면 정상 동작이 결함으로 보고된다.

1. **modal / backdrop / scrim 은 가림 검사에서 제외** — 해설 708 F-4. *"이것을 빼지 않으면 모든 모달이 툴바를 가린다고 보고된다."*
2. **배경은 조상 레이어를 알파 합성** — 불투명 배경만 인정하면 `rgba(0,0,0,.75)` 버튼 위 흰 글리프를 "흰 배경 위 흰 글자"로 오판.
3. **gradient/이미지 배경 위의 텍스트는 판정 안 함** — 로고 주황 gradient 위 흰 `T2` 가 이 경우.
4. **원형 컨트롤은 radius 검사에서 제외** — 손잡이·아바타·토글 트랙.
5. **로고 lockup 안쪽 여백은 사다리 검사에서 제외** — 해설 710 C-2, 값이 높이의 함수(H/26).
6. **글 기둥 가운데 정렬용 가로 안쪽 여백은 제외** — `config/t2_editor_skin.php` 의 `canvas_column: measure` = `(100% - 72ch)/2`. `margin:auto` 로 바꾸면 캔버스가 굴림 상자여서 스크롤바가 글 옆에 선다. **세로 여백은 그대로 본다.**
7. **비례 격자에서 나온 간격(u 계열)은 사다리 검사에서 제외** — *"이것을 빼지 않으면 정상 동작인 툴바·하단 바·모달이 매 화면 수십 건의 위반으로 보고된다."*

### 도구가 **판정할 수 없는** 3가지 (`:66-74`)

1. **스크롤 중 지나가는 가림 vs 진짜 갇힘.** sticky 바 아래로 지나가는 것은 정상. 결함은 *최대 스크롤 지점에서도* 빠져나오지 못하는 경우 — **호출자가 끝까지 스크롤한 상태를 만들어 준 뒤** 검사해야 한다.
2. **의미가 있는 비대칭.** 해설 708 C-1 은 "그 비대칭이 무엇을 설명하는지 말할 수 있으면" 허용. 도구는 **값의 차이만** 알려주고 정당한지는 사람이 판단한다.
3. **비활성 컨트롤의 대비.** WCAG 는 inactive 를 면제하는데 도구는 구분하지 않는다. `:disabled` 보고는 사람이 걸러야 한다.

### 잘못된 화면을 재면 도구가 거부한다 (`:108-117`)

```js
if (!d.stage) {
  return `!! ${label}: T2Editor 화면이 아니다 (${d.nodes} nodes) — URL·서버 docroot 를 확인하십시오. 이 결과는 판정에 쓸 수 없다.`;
}
```

`SURFACE` 가 무엇을 쟀는지(`stage`)를 결과에 실고, T2Editor 화면이 아니면 `clean` 대신 경고를 돌려준다(`:257-259`). **404 화면도 위반 0건**이라 — README `:110-111` — *"실제로 `BASE` 가 404 를 가리키는 동안 그랬다."*

## 3.2 delta 판정 방식과 baseline 위치

**baseline 은 "파일"이 아니라 "이전 상태"다.** README `:24` 예시:

```js
import { SURFACE, delta, report, newPage, BASE, ADMIN, ADMIN_PW } from './t2-ux-check.mjs';
const { ctx, page } = await newPage(browser, { w: 1280, h: 900, dark: true, touch: false });
await page.goto(BASE, { waitUntil: 'networkidle' });
const baseline = await page.evaluate(SURFACE);          // ← 수정 전 상태
await page.click('.t2-toolbar .t2-btn[data-command="insertTable"]');
const now = await page.evaluate(SURFACE);               // ← 수정 후 상태
console.log(report('표 삽입', delta(now, baseline)));   // baseline 대비 새로 생긴 것만
```

**`delta()` 구현** (`t2-ux-check.mjs:230-245`):
```js
export function delta(now, base) {
  const key = {
    radius: x => x.el + x.value, asym: x => x.el + x.top + x.bottom,
    dualAxis: x => x.el, clipped: x => x.el, offscreen: x => x.el,
    tinyTarget: x => x.el, contrast: x => x.el + x.text,
    nearMiss: x => x.parent + x.side + x.spread,
    occlusion: x => x.cover + x.hidden + x.text,
  };
  const out = { rootOverflow: now.rootOverflow, nodes: now.nodes, stage: now.stage, ladder: {} };
  for (const k of Object.keys(key)) {
    const seen = new Set((base?.[k] || []).map(key[k]));
    out[k] = (now[k] || []).filter(x => !seen.has(key[k](x)));   // ← "신규만"
  }
  for (const [k, v] of Object.entries(now.ladder || {})) if (!base?.ladder?.[k]) out.ladder[k] = v;
  return out;
}
```

**핵심 3가지:**
1. **fingerprint 기반 세트 차집합.** `key` 맵이 항목별 고유 키를 정의하고, `base` 에 있던 키를 뺀다.
2. **`ladder` 는 항목 키가 아니라 사다리 값 키** — `base.ladder[k]` 자체의 존재 여부로만 판정. 같은 값이 새로 생기면 잡히고 남아 있으면 무시.
3. **`rootOverflow` 는 delta 하지 않는다** — `out.rootOverflow = now.rootOverflow`(`:238`). 지금도 넘치면 그대로 보고.

**`report()`**(`:253-`): `stage` 없으면 경고(`:257-259`) → `count()` 0 이면 `clean (N nodes, stage)`(`:260`) → 그 외 위반 나열(기본 최대 6건, `{ max = 6 }`).
**`count()`**(`:247-251`): 9개 배열 길이 + `ladder` 키 수 + `rootOverflow ? 1 : 0`.

### baseline 파일 위치 — **서로 다르다**

| 대상 | 경로 | 근거 |
|---|---|---|
| `t2-ux-check` delta 비교 | **메모리의 JS 객체. 파일에 없다.** `page.evaluate(SURFACE)` 결과를 변수로 들고 간다 | `t2-ux-check.mjs` 의 import 가 `node:fs` 뿐 — **파일 IO 없음** |
| Playwright 스크린샷 | `tests/visual/.baseline` | `lost-pixel.config.ts:13` |
| 현재 스크린샷 | `tests/visual/.current` | `lost-pixel.config.ts:14` |
| 차분 | `tests/visual/.diff` | `lost-pixel.config.ts:15` |
| 정적 계약 부채 | `tools/*.baseline.json` | §2.9 |

`AGENTS.md:71` — *"판정은 `tools/ux/t2-ux-check.mjs` **delta**로: 스크린샷 `...` 넘침·가림은 `SURFACE`→`delta`→`report` baseline 대비 **신규 위반만**으로 판정."*

**⚠ 후배 주의:** `delta()` 는 **"새로 생긴 것"만** 본다. **"이미 있던 것이 사라지지 않았다"** 는 못 잡는다. 회귀를 볼 때는 base 를 **패치 후** 로, now 를 **패치 전** 으로 뒤집어 써야 한다.

### 스크린샷 넘침 / 가림 판정

- `rootOverflow` — 문서 루트 자체의 가로 넘침. `count()` 에 1점.
- `clipped` — 컨테이너에 잘려 도달 불가. `offscreen` — 화면 밖에 나간 요소.
- `occlusion` — fingerprint `x.cover + x.hidden + x.text` — **가린 요소 + 왜 그려지지 않았는지 + 텍스트** 를 함께. 사람이 triage 하려고.
- **차트 이미지(PNG) 회귀는 CI 게이트로 작동하지 않는다** — `lost-pixel.config.ts:31-32` 에서 `failOnDifference: false`, 주석: *"CI에서는 Docker 대신 t2-ux-check delta 로 판정하므로 failOnDifference 는 꺼둠"*. `threshold: 0.05`(`:23`).

## 3.3 `tools/ux/` 프로브·스크립트 전체 목록 (10개 파일)

| 파일 | playwright 필요? | 역할 | 쿼리 파라미터 / 상수 |
|---|---|---|---|
| `README.md` (121줄) | — | 규약 전문 | — |
| `t2-ux-check.mjs` | ❌ **순수** (import 0개) | 위반 검사 라이브러리 | `BASE='http://127.0.0.1:8899/_probe_editor.php'`(`:8`) · `ADMIN='http://127.0.0.1:8899/T2Editor/admin/index.php'`(`:9`) · `ADMIN_PW='ProbeAdmin2026!'`(`:10`) |
| `_probe_editor.php` (903 B) | — | `editor_html()` **단독** 렌더. **body 직계 블록** | — |
| `_probe_embed.php` (5195 B) | — | **임베드** 프로브. flex·grid 부모 안에서 렌더 | **`?layout=flex` `?layout=grid` `?layout=inline`** · `?hostile=1`(호스트 리셋 `#90` 재현) · `?hostile=g5`(그누보드5 `css/default.css`) · `?css=empty`(빈 호스트 시트) |
| `t2-capture-emulate.mjs` | ✅ `import { chromium, webkit } from 'playwright'`(`:5`) | 기기 에뮬레이션+캡처 | — |
| `t2-surface-diagnose.mjs` | ❌ 순수 (`delta`/`count`/`report` 만, `:4`) | 위반 지문 진단 | threshold 가 `lost-pixel.config.ts:23` 과 일치 |
| `t2-patch-verify.mjs` | ✅ (전환자) | 패치 전/후 캡처→진단 종합 | — |
| `mobile2-qa.mjs` (31 KB) | ✅ `require('/workspace/node_modules/playwright')`(`:8`) | 모바일 전 뷰포트 (25 matrix + 42 modal) | — |
| `visual-qa.mjs` (17 KB) | ✅ `spawn`(`:17`) | 대화형 시각 QA | — |
| `t2-i18n-coverage.mjs` | ❌ **순수** (`node:fs`,`node:path` 만) | 로케일 전수 대조 | `node tools/ux/t2-i18n-coverage.mjs` — **이 컨테이너에서 실행 가능** |

### ⚠ `mobile2-qa.mjs:8` 의 하드코딩 (실측)

```js
const { chromium } = require('/workspace/node_modules/playwright');
```

`T2Editor-v11/node_modules` 가 아니라 **`/workspace/node_modules`** 를 절대경로로 박았다. 실측: `/workspace/node_modules/playwright` 는 **존재한다**(그래서 이 컨테이너에서 이 경로는 살아있다). 하지만:
- 저장소 밖을 가리키므로 **저장소만 옮겨 재현하면 깨진다.**
- 다른 스크립트들은 `from 'playwright'` (bare) 인데 **이것만** 절대경로. 표기가 두 갈래.
- `AGENTS.md:8` "정본은 GitHub" 과 정면으로 어긋남 — 코드가 워크스페이스 레이아웃에 종속.

**후배:** 이 파일을 건드리면 절대경로를 남기지 마라. 지금 환경에서 고치면 바로 못 돌아간다. **보고만 하고 부장 판단을 받는다.**

### ⚠ `AGENTS.md:67` 가 지시한 경로가 두 곳에 있다 (실측)

`AGENTS.md:67` 원문: *"`_probe_editor.php`는 body 직계라 flex/grid 부모 붕괴를 못 본다(fec735d). 반드시 **`tools/ux/_probe_embed.php`**를 `/_probe_embed.php?layout=flex|grid|inline`으로 함께 잰다."*

| 위치 | `_probe_editor.php` | `_probe_embed.php` | 용도 |
|---|---|---|---|
| `tools/ux/` (원본) | 903 B, mtime 08-25 | 5195 B, mtime 09-09 | 규범 |
| 저장소 루트 (복사본) | 903 B, mtime **09-25** | 5195 B, mtime **09-25** | 실행용 스크래치 |

`tools/ux/README.md:102` — *"원본은 `tools/ux/_probe_editor.php`, **저장소 루트로 복사해 쓴다**"*.
`AGENTS.md:78` — *"`_probe_editor.php`·`_probe_embed.php`는 `tools/ux/` 원본을 루트로 복사해 쓰는 스크래치 — `.gitignore` 대상, 커밋 금지"*

**규칙: `tools/ux/` 원본을 고치고 루트로 복사한다. 루트 사본을 직접 고치면 원본과 뒤집힌다.**

## 3.4 실기기 분기 규칙 4종 — 실제 CSS 라인

### ① `100vh` 금지 → `100dvh` + `env(safe-area-inset-*)`

`AGENTS.md:68`: *"`100vh` 금지 — `100dvh`(+`100vh` 폴백) + `env(safe-area-inset-*)` + `--t2-privacy-notice-inset`(`modal.css:29,65`). iOS 동적 뷰포트·키보드·노치가 `100vh`/고정 `height`를 깨뜨린다."*

**⚠ 정본 파일은 `T2Editor/js/utils/modal.css`** (AGENTS.md 는 짧은 이름만 적었다):

| `AGENTS.md` 인용 | 실제 | 검증 |
|---|---|---|
| `modal.css:29` | `T2Editor/js/utils/modal.css:29` → `padding-bottom: calc(var(--t2-s4) + var(--t2-privacy-notice-inset, 0px));` | ✅ **정확** |
| `modal.css:65` | `.../modal.css:65` → `calc(100dvh - var(--t2-u) - var(--t2-privacy-notice-inset, 0px)));` | ✅ **정확** |

**모달 표면 기본 규칙 (`js/utils/modal.css:59-70`):**
```css
.t2-modal-surface-default {
  --t2-modal-grid-cap: calc(var(--t2-u) * 6);
  width: fit-content;
  min-width: min(calc(var(--t2-u) * 5), calc(100vw - var(--t2-u)));
  max-width: min(calc(var(--t2-u) * 13), calc(100vw - var(--t2-u)));
  max-height: min(calc(var(--t2-u) * 6),
                  calc(100dvh - var(--t2-u) - var(--t2-privacy-notice-inset, 0px)));  /* :64-65 */
  overflow-x: hidden;
  overflow-y: auto;
```

`env(safe-area-inset-*)` 실사용: `modal.css:309`(bottom), `:390`(top/right), `:391`(4방향 + `100dvh`).
`--t2-privacy-notice-inset` 총 12곳 — `js/utils/modal.css` 6(`:29,65,279,299,390,391`) · `css/t2-visual-system.css` 6(`:2467,2491,2493,2501,2662,2670`) · `plugin/draw/draw.css` 2(`:71,72`) · `plugin/ai_complex/ai_complex.css` 2(`:2565,2586`) · `plugin/file/file.css` 1(`:11`).

**후배:** 새 모달/시트에 `100vh` 를 쓰면 게이트가 잡을 여지가 있다 — `t2-css-contract.mjs:299` 의 `NEWER_FEATURE` 정규식:
```js
const NEWER_FEATURE = /(?<![a-zA-Z])(dvh|svh|lvh|dvw|svw|lvw)\b|color-mix\(|env\(|clamp\(|\bmax\(|\bmin\(|:has\(|oklch\(|lab\(/;
```

### ② `--t2-u` `@supports` 가드 — ⚠ 라인 낡음

`AGENTS.md:69`: *"`--t2-u: calc(100cqi/15)` 등은 `@supports (width:1cqi)` 가드 안에서만 유효(`t2-foundation.css:308`)"*

**⚠ `@supports (width: 1cqi)` 의 실제 위치는 `t2-foundation.css:375`**다. `:308` 은 `color-scheme` 표면 스코프 **주석 한 줄**이다.

**실제 코드 (`css/t2-foundation.css:366-377`):**
```css
:root { --t2-u: calc(100vw / 15); }                       /* :366  뷰포트 u */
 /* cqi 를 모르는 엔진에서는 이 줄을 아예 걸지 않는다.
    custom property 는 파싱 단계에서 값을 검사하지 않으므로, 지원하지 않는
    엔진에서도 --t2-u 에는 `calc(100cqi / 15)` 라는 토큰열이 그대로 들어앉는다.
    그리고 그것을 실제 속성에서 쓰는 순간(그리고 그것에서 파생된 --t2-u2·u4·
    u8·chrome-*·status-* 를 쓰는 모든 순간) 전부 무효가 된다 — 크롬의 여백과
    기하가 한꺼번에 0 이 되어 도구·라벨·닫기가 서로 붙고 화면 끝에 밀린다.
    @supports 로 감싸면 그런 엔진은 :root 의 뷰포트 u 를 그대로 물려받는다. */
@supports (width: 1cqi) {                                /* :375  ★ 실제 위치 */
  .t2-editor-container > * { --t2-u: calc(100cqi / 15); }  /* :376 */
}
```

**메커니즘 (후배가 외워야 할 것):** custom property 는 **파싱 단계에서 값을 검사하지 않는다.** 가드 없이 `--t2-u: calc(100cqi/15)` 를 선언하면 미지원 엔진에서도 "선언은 성공"하고, **파생 토큰을 실제 속성에서 쓰는 순간** 전부 무효가 된다. 가드는 **선언 단계가 아니라 덮어쓰기 단계**를 막는다.

**두 번째 대역**: `:428`(`100vw/10`) / `:432`(`@supports`) / `:433`(`100cqi/10`).
`@supports` 는 `t2-foundation.css` 에 2개뿐(`:375`, `:432`).

### ③ `pointer:coarse` 44px 히트

`AGENTS.md:70` — *"`pointer:coarse` 44px 히트(`t2-visual-system.css` media에서만 동작)"*

**실측 — `t2-visual-system.css` 의 media:** `@media (pointer: coarse)` 5개(`:158,271,527,663,2251`) + `@media (hover: none), (pointer: coarse)` 3개(`:1527,1800,1821`).

| 라인 | 내용 |
|---|---|
| `:1399` | `@media (pointer: coarse) { .t2-translate-menu-item { min-height: 44px; } }` |
| `:1433` | `@media (pointer: coarse) { .t2-slash-item { min-height: 44px; } }` |
| `:1527-1528` | media 안에서 `.t2-admin-link { … min-height: 44px; }` |
| `:1822-1826` | `/* [iOS⚠️] Keep touch controls at or above the 44×44px target size. … */` |
| `:257` | `::after 44px` 확장 활성 (`GITHUB-ISSUE-BODY-KO.md:42,52` 가 인용) |

**실측사례 — 이 규칙이 실제로 밤을 새운 곳** (`css/t2-visual-system.css:274-275` 주석):
> 버튼 쪽에만 빠져 있었다 — 실측(390×844)에서 설치의 마지막 단추 `[관리자 설정 완료](#setup-btn)`가 **37.7px** 로 44px 바닥에 못 미쳤다.

`tools/ux/README.md:40` — `tinyTarget` 근거는 design-system *Controls*, 해설 708 H-3.

### ④ `container-type: inline-size` — ⚠ 라인 낡음

`AGENTS.md:46`: *"`container-type: inline-size`는 `contain:inline-size`를 걸어 셸을 shrink-to-fit 자리(flex/grid/inline-block/table)에서 폭 0으로 만든다. `width:100%`+`min-width:0` 등으로 끊어야 한다(fec735d, `t2-visual-system.css:342`)."*

**⚠ `t2-visual-system.css:342` 는 낡았다. 실제는 `:382`.** `:342` 의 실물은 `:where(.admin-wrap) .btn-danger:hover:not(:disabled) { background: var(--t2-danger-soft); }`.

| 실제 위치 | 내용 |
|---|---|
| `css/t2-visual-system.css:357-361` | **메커니즘 주석** — *"이 요소의 가로 크기는 내용에 의존해서는 안 된다. 그래서 … shrink-to-fit 이 되는 모든 자리 — 에 놓이면 폭이 0 으로 무너진다. … flex/grid 부모 안에서 셸은 **테두리 2px 만 남고**"* |
| `css/t2-visual-system.css:382` | **실제 선언** `container-type: inline-size;` |
| `css/t2-visual-system.css:1223` | `@supports not (container-type: inline-size) {` 폴백 |

## 3.5 ⚠ `_probe_*.php` 와 `.gitignore` — A1 보고 검증 (F4)

**A1의 주장:** "`_probe_*.php` 스크래치 파일이 `.gitignore`에 등록돼 있지 않다."

**직접 읽은 판정 — A1은 절반만 맞다.**

`.gitignore:10-16` **원문:**
```
# 스크래치 프로브. _probe_editor.php 는 editor_html() 을 단독으로 렌더링해
# 브라우저 검증에 쓰는 파일이며 저장소에 들어가지 않는다. _probe_embed.php 는
# 같은 방식으로 flex·grid 부모 안의 임베드를 렌더링한다(원본은 tools/ux/).
/_probe_editor.php
/_probe_modal.php
/_probe_profile.php
/_probe_embed.php
```

**`git check-ignore -v` 실측 (루트에 실제 존재하는 6개 기준):**

| 파일 | 판정 | 근거 |
|---|---|---|
| `_probe_editor.php` | ✅ **IGNORED** | `.gitignore:13` |
| `_probe_modal.php` | ✅ IGNORED | `.gitignore:14` |
| `_probe_profile.php` | ✅ IGNORED | `.gitignore:15` |
| `_probe_embed.php` | ✅ **IGNORED** | `.gitignore:16` |
| `_probe_real.php` | ❌ **NOT IGNORED** | 규칙 없음 |
| `_probe_surface.html` | ❌ **NOT IGNORED** | 규칙 없음 |
| `_probe_surface2.html` | ❌ **NOT IGNORED** | 규칙 없음 |
| `_probe_wf.html` | ❌ **NOT IGNORED** | 규칙 없음 |

**① `AGENTS.md:78` 은 정확하다.** 4개가 등록돼 있고 그 안이다. A1의 "등록 안 됨" 단정은 틀렸다.

**② 그러나 사고는 이미 났다.** `git ls-files` 실측:
```
tracked: _probe_real.php
tracked: _probe_surface.html
tracked: _probe_surface2.html
tracked: _probe_wf.html
```

**4개 스크래치가 이미 커밋되어 있다.** `.gitignore` 는 **커밋된 파일에 영향을 주지 않는다** — 추적 중이면 규칙이 있어도 커밋된다. `AGENTS.md:78` 이 경고하는 사고가 **이미 발생했고, 경고 문서만 살아 있다.**

**구체적 사고 경로:**
1. `git add -A` / `git add .` 를 쓰면 이 4개가 **stage된다** (`.gitignore` 는 추적 파일에 무효).
2. `.gitignore` 규칙은 **파일별로 정확히 나열**돼 있다. `_probe_*.php` 와일드카드가 **아니다** ⇒ 새 프로브 이름이 나오면 자동으로 막히지 않는다.
3. `php_syntax`/`js_syntax` 의 `SCAN='T2Editor tools tests'`(`:42`)에는 루트가 **포함 안 되**므로 게이트가 이들을 잡지도 못한다.

**후배 지시:** 루트에 새 `_probe_*` 스크래치를 만들면 **반드시 `.gitignore` 에 한 줄 추가**하고, 그전에 `git check-ignore -v <파일>` 로 확인. **`git add .` / `git add -A` 를 쓰지 마라** — 명시적으로 파일을 나열한다. 위 4개는 **커밋 사고 — 부장 판단 필요** (이 문서 작성자는 읽기 전용이라 고치지 않았다).

## 3.6 이 환경 제약 — 무엇을 못 하는지 (F3)

| 항목 | 실측 결과 |
|---|---|
| `/opt/pw-browsers` | **존재하지 않음.** `/opt/` 안에는 `yarn-v1.22.22` 하나뿐 |
| `command -v playwright` | 없음 |
| `@playwright/test` 해석 | `ERR_MODULE_NOT_FOUND` |
| `T2Editor-v11/node_modules` | `axe-core` `pixelmatch` `pngjs` **3개뿐.** playwright 없음 |
| `/workspace/node_modules/playwright` | **존재한다** (repo 밖) — `mobile2-qa.mjs:8` 하드코딩 경로 |
| `google-chrome` `google-chrome-stable` `chromium` `chromedriver` | **4개 전부 MISSING** |
| `php -S 127.0.0.1:8899` | **불가** — php 없음 |
| `python -m http.server 4173` | **불가** — python3 없음 |
| cgroup 메모리 | `2147483648` = **2 GiB** (`/sys/fs/cgroup/memory.max`) |
| CPU | `nproc` = 4 |

**`playwright install` 은 금지** — `AGENTS.md:75`, `playwright.config.ts:4`, `CLAUDE.md:53-54`. **설치로 해결하려 하지 마라.**

### 이 컨테이너에서 **불가능한** 것 (전수)

| # | 못 하는 것 | 이유 |
|---|---|---|
| 1 | **릴리즈 게이트 통과** | php 없음 → ①⑨ 실패 |
| 2 | **`node tests/run.mjs` 통과** | php·python3 없음 → 4건 실패 |
| 3 | **로컬 서버 기동** | `php -S`·`python -m http.server` 둘 다 불가 ⇒ **`BASE`/`ADMIN` URL 이 살아나지 않는다** |
| 4 | **`SURFACE` 수집** | 서버 없음 + 브라우저 없음 |
| 5 | **`tools/ux/*.mjs` 4종 실행** | `t2-capture-emulate` `t2-patch-verify` `mobile2-qa` `visual-qa` — playwright 필요 |
| 6 | **Playwright 스크린샷 / lost-pixel** | 브라우저 바이너리 0 |
| 7 | **실기기 분기 검증 (dvh/safe-area/cqi)** | 렌더 없음 |
| 8 | **관리자 2인 페르소나 실측** | 관리자는 PHP 필수. `GITHUB-ISSUE-BODY-KO.md:57-61` 도 같은 결론: *"Node-static로는 **php 소스 코드 노출 (HTTP 200 but stage='')**"* |

### 이 컨테이너에서 **가능한** 것 (대체 경로)

| # | 할 수 있는 것 | 명령 |
|---|---|---|
| 1 | 정적 계약 전수 | `node tools/t2-static-check.mjs` → rc 0 |
| 2 | CSS 계약 전수 | `node tools/t2-css-contract.mjs` → rc 0 |
| 3 | 발행 본문 시트 일치 | `node tools/t2-content-css-build.mjs` → rc 0 |
| 4 | i18n 커버리지 | `node tools/ux/t2-i18n-coverage.mjs` → rc 0 |
| 5 | JS 회귀시험 (해석 필요) | `node tests/run.mjs` → rc 1. **php 부재 4건만 실패인지 확인**하고 나머지 5819건을 신뢰 |
| 6 | 게이트 단계/순서 대조 | `release-gate-parity.test.mjs` 는 `tests/run.mjs` 에 포함되어 **통과** |
| 7 | 소스 수치 단정 | `node -e` 토큰 파싱. **추측 금지** |
| 8 | CSS 규칙 목록 추출 | `grep -oE "C[0-9]+[a-z]?" tools/t2-css-contract.mjs \| sort -uV` |
| 9 | git 추적/무시 판정 | `git check-ignore -v`, `git ls-files` (읽기 전용) |

**2 GiB 제약의 실질:** 브라우저를 띄우면 OOM으로 **다른 세션까지 죽을 수 있다.** 시도하지 마라. `GITHUB-ISSUE-BODY-KO.md:8` 도 *"pids.max=256 제한하에 **직렬** 브라우저 실행"* 으로 우회했다.

## 3.7 브라우저 없이 "실기기 분기"를 검증하는 대체 절차

`AGENTS.md:238-252` Verification 1번이 요구하는 "독립 검사 위임"을 정적 축으로 대체한다. **후배가 브라우저 없음 보고서를 올릴 때 이 축들을 대신 제시하라.**

| 축 | 브라우저 없이 | 근거 |
|---|---|---|
| 토큰 실재 | `grep -n -- '--t2-u:' css/t2-foundation.css` → `@supports` 안/밖 판정 | `:366,376,428,433` |
| 계약 일치 | `node tools/t2-css-contract.mjs` rc 0 (C1~C21 전 항목) | §6 |
| 형제 패턴 parity | 같은 역할의 패턴이 가드 안에 있는지 직접 대조 | `:366-377` vs `:428-433` |
| 기하 수치 | 토큰 정의 라인 인용 | `js/utils/modal.css:64-65` |
| 실기기 실패 전례 대조 | `docs/ux-patch-plan-2026-08-25.md`, `docs/ux-audit-note-2026-08-10.md` | §9 |
| **한계 명시** | "Chromium 단일 통과는 통과가 아니다"(`AGENTS.md:65`) — 브라우저 0건은 그보다 나쁘다 | **보고서에 반드시 적는다** |

`MEMORY.md` 규약과 일치: *"브라우저 없는 환경에서는 **토큰 실재·컨트랙트·형제 패턴 parity 대조**가 최소 대체선."*

---

# 4. 관리자 페이지 진입 절차

## 4.1 실제 절차 (소스 확인)

`AGENTS.md:79` 원문:
> - 관리자 검사: `admin/t2admin.key.php` 12자+ 설정 → `api.php?action=setup` → 로그인 쿠키 재사용. **검사 후 키 파일 원복** — 비밀 커밋 전례 있음

`tools/ux/README.md:119-121`:
> 관리자 검사에는 세션이 필요하다. `admin/t2admin.key.php` 에 12자 이상 비밀값을 넣고 `api.php?action=setup` 으로 설정한 뒤 브라우저에서 로그인한다. **검사가 끝나면 키 파일을 원래대로 되돌린다** — 시험용 비밀값이 커밋된 전례가 있다.

**엔드포인트·액션명 실측:**

| 단계 | 실제 값 | 근거 |
|---|---|---|
| 키 파일 | `T2Editor/admin/t2admin.key.php` | `admin/api.core.php:44` `define('T2ADMIN_KEY_FILE', T2EDITOR_BASE_PATH . '/admin/t2admin.key.php');` |
| 현재 내용 | `return array('secret' => '');` | 5줄, 256 B. `:3-4` — *"Standalone first setup only: replace the empty value with a private 12+ character secret. After admin_auth.php is created, the saved administrator password takes precedence."* |
| 12자 강제 | `'먼저 admin/t2admin.key.php의 secret 값을 12자 이상으로 설정하세요.'` (409) | `config/first_run_api.core.php:69` |
| setup 액션 | `$action === 'setup' && $method === 'POST'` | `admin/api.core.php:1249` |
| setup 처리 | `$expectedSecret = t2a_setup_secret();`(`:1258`) → 불일치 시 `'설치 비밀값이 올바르지 않습니다. admin/t2admin.key.php를 확인하세요.'`(`:1263`) | |
| 성공 시 | `$_SESSION['t2admin_auth_source']='local'`(`:1280`), 세대 기록(`:1281`), `csrf` 동봉(`:1293`) | |
| 인증 파일 | `T2EDITOR_DATA_PATH . '/admin_auth.php'`(`:43`) | 저장되면 관리자 비밀번호가 우선 |
| 속도 제한 | `t2a_auth_rate_require('setup')`(`:1254`), `T2ADMIN_AUTH_RATE_FILE`(`:45`), `T2ADMIN_AUTH_RATE_GUARDED_FILE`(`:48`) | |
| 화면 | `admin/index.core.php:29` `$KEY_FILE`, `:247` 화면 노출, `:273` `<input type="password" id="setup-secret" … placeholder="t2admin.key.php의 secret 값">` | |

**자동화 도구 — `tools/ux/t2-ux-check.mjs:291-299`:**
```js
export async function loginAdmin(page) {
  await page.goto(ADMIN, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  if (await page.$('input[type=password]')) {
    await page.fill('input[type=password]', ADMIN_PW);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
}
```
`ADMIN_PW = 'ProbeAdmin2026!'`(`:10`) — **저장소에 박혀 있는 시험용 비밀.** `ADMIN` 상수로 재사용한다(하드코딩 금지).

## 4.2 ⚠ 키 파일 원복 — 하드코딩 위험이 실재한다 (실측)

**`AGENTS.md:79` 와 `tools/ux/README.md:121` 이 같은 말을 두 번 한다. 그건 실수가 있었다는 뜻이다.**

| 확인 | 결과 |
|---|---|
| `git check-ignore -v T2Editor/admin/t2admin.key.php` | 일치 없음 → **NOT IGNORED** |
| `git ls-files --error-unmatch T2Editor/admin/t2admin.key.php` | **TRACKED** |
| `.gitignore` 의 `key`/`secret` 규칙 | **없음** (`:4` 는 주석에만 "admin_settings.php 와 capability_key.php" 언급) |
| `tools/t2-static-check.mjs` 의 비밀 규칙 | `first_run_secret.php`·`capability` 계열만(`:353-364`). **`t2admin.key.php` 를 잡는 규칙 없다** |

`admin/update_api.core.php:299` 실측:
```php
foreach (array('data','admin/t2admin.key','admin/t2admin.key.txt','admin/t2admin.key.php') as $relative) {
```
업데이터는 이 4개를 **배포 아카이브에서 제외**한다. 즉 **배포물에는 안 나가지만 git에는 올라간다.** 그 차이가 위험이다.

**정리: `t2admin.key.php` 는 추적 파일이고 무방어다.**
1. 지금은 `secret => ''` 이므로 무해.
2. 12자 값을 넣는 순간 `git status` 에 **MODIFIED**.
3. `git add -A` / `git add .` 를 쓴 순간 **그 값이 커밋된다.**
4. `.gitignore` 는 **이미 추적된 파일에 영향이 없다** — §3.5 와 같은 메커니즘.
5. `t2-static-check.mjs` 가 잡아주지 않는다.

**후배 절대 규칙 5개:**
1. 검사를 마치면 **반드시** `return array('secret' => '');` 로 되돌린다.
2. 되돌린 뒤 `git status --short T2Editor/admin/t2admin.key.php` 로 **빈 출력 확인.** (확인 안 하면 원복 실패를 모른다.)
3. 원복 **전**에는 절대 `git add` 하지 않는다.
4. 비밀을 **인자로 넘기지 않는다** — 파일에 쓰고 되돌린다. 셸 히스토리·대화 로그에 남기지 않는다.
5. 이슈 본문·커밋 메시지·PR 본문에 비밀을 절대 쓰지 않는다.

**이 환경에서는 §4.1 전체가 불가**하다 — `php -S` 도 `api.php?action=setup` POST 도 못 한다. **이것을 명시하고 넘어가라.**

## 4.3 관리자 2인 페르소나 체크 (PR 필수)

`AGENTS.md:129-133` 원문 (operating principle 3):
> 3. **Two-persona check on every admin-facing change.** The admin panel serves both professional developers and non-technical webmasters through different views/permissions. For any admin UI/UX change, explicitly consider both: does this help or hurt a developer's efficiency, and does it help or hurt a non-technical user's ability to understand a control without documentation? Note the answer in the PR description.

**영역 라벨과 페르소나가 1:1 대응:**

| 라벨 | 페르소나 | 질문 |
|---|---|---|
| `area:admin-dev` | 전문 개발자 | 이控件이 개발자의 효율을 **올리는가**? |
| `area:admin-nontech` | 비전공 웹마스터 | 문서 없이 이控件의 의미를 **이해하게 하는가**? |

**PR 본문 필수 (`AGENTS.md:311-313`):** *"The PR description must cover: **what was broken, root cause, what changed, why this approach, what you verified**, and — for **admin/UX changes** — the two-persona note from operating principle 3."*

**왜 사有余한가:** `AGENTS.md:109-111` — *"The maintainer … does not write code directly. **Your issues, PRs, and commit messages are their main window into what changed** — make them clear and readable for a **non-technical reviewer**."* `AGENTS.md:234` 이슈 본문도 한국어. `AGENTS.md:93` 문서·커밋 메시지 한국어 기본.

**실제 적용 이력 (커밋 실측):** `1ff817f 관리자 UX 묶음 — 폭 게이팅·빈 select·저장 힌트 (Refs #352)` · `8059f55 캡차 위젯 다크 테마 대응 (Closes #254)` · `a8e142a 높이 조절 핸들에 separator 역할 — 보조기기 인식 (Closes #371)`

---

# 5. 설정 키 추가 절차

`AGENTS.md:49-61` 과 `CLAUDE.md:34-46` 이 같은 내용을 두 번 적는다. 규범 원문은 `T2Editor/docs/hard-config-contract.md`.

## 5.1 왜 이 계약이 있는지 (시험 주석에서 추출한 진짜 이유)

`tests/php/hard-declaration.test.php:5-9` 원문:
> 이 계약이 막으려는 사고는 하나다 — 기능을 더하면서 `config/t2_hard_config.php` 를 빠뜨리는 것. 그것이 빠지면 **관리자를 쓰는 설치에서는 아무 일도 일어나지 않고, 관리자를 쓰지 않는 설치(Lite)에서만 그 기능이 조용히 사라진다.** 그 사고는 실제로 났다: `admin/api.core.php` 의 `t2a_default_settings()` 는 `ai.budget`·`ai.sub_agents`·`privacy`·`ai_image`·`editor.html_cache_enabled` 를 알고 있었지만 하드 설정은 몰랐다.

**즉 "조용한 성공"이 가장 나쁜 실패 형태다.** 관리자가 켜도 lite 에서 안 먹는다.

## 5.2 세 파일의 역할

| 파일 | 역할 | 근거 |
|---|---|---|
| `T2Editor/config/t2_hard_config.php` | **값의 파일이 아니라 "이 배포본이 아는 설정 표면의 선언"** | `AGENTS.md:51-52`, `t2_hard_config.php:19-23` |
| `T2Editor/config/t2_hard_contract.php` | 판정기. 선언에 없는 키를 **벗겨낸다** | `AGENTS.md:52-53` |
| `tests/php/hard-declaration.test.php` | 4축 대조 (§5.4) | 게이트 ⑨ |

## 5.3 `t2_hard_config.php` 구조 (실측)

```php
return array(
    'profile' => 'max',                                    // :17  'max'|'lite' — 여기 말고 바꾸는 곳은 없다
    'surface' => array('format' => 1, 'enforce' => true),  // :36  ★ 선언 대장
    'admin_enabled' => true,                               // :38
    'cms_admin_api_enabled' => true,                       // :39
    'admin_ip_access_bypass' => false,                     // :41
    'trusted_proxy_ips' => array(),                        // :43
    'settings' => array(                                   // :44  ★ 값 + 표면 선언
        'editor' => array( 'css_min' => true, 'js_min' => true,
                           'asset_bundle' => true, 'html_cache_enabled' => true,
                           'content_style_delivery' => 'auto', … ),
    ),
);
```

**`surface` 블록 주석(`:25-31`):**
- `format` — 코드가 아는 판(`config/t2_hard_contract.php`). **이 블록이 아예 없는 옛 파일에서는 강제하지 않고 진단으로만 알린다** — 없는 대장으로 거르면 저장해 둔 설정이 통째로 초기화된다.
- `enforce` — 강제 여부. 옛 설치를 옮기는 중이면 잠시 `false`. **Lite·tLite 에서는 이 값과 무관하게 언제나 강제된다** — 그 배포본에는 관리 web UI 가 없어 이 파일이 유일한 원본이고, 선언 안 된 키를 허용하면 "켤 수 없는 설정"만 남기 때문이다.

## 5.4 `hard-declaration.test.php` 가 대조하는 것 (4축)

### 축 1 — 배포본이 대장을 갖고 있는가 (`:56-61`)
```php
$t->ok(is_array($shipped['surface'] ?? null), '배포본 하드 설정에 surface 블록이 있다');
$t->eq((int)($shipped['surface']['format'] ?? 0), T2Ehardcontractformat(), 'surface.format 이 코드가 아는 판과 같다');
$t->eq($shipped['surface']['enforce'] ?? null, true, '배포본은 선언 계약을 강제한다');
$t->ok(t2test_with_hard_config($shipped, 'T2Ehardcontractenforced'), '배포본 그대로에서 계약이 강제된다');
```

### 축 2 — **관리자가 저장할 수 있는 표면 전체가 대장 안에 있는가** (`:63-134`) ← ★ 핵심

`:65-66` 원문: *"이 단언이 이 시험의 **핵심**이다. 관리 화면에 스위치를 더하면서 하드 설정을 빠뜨리면 여기가 빨개진다 — 그것이 이 계약의 **유일한 목적**이다."*

| 하위 | 라인 | **무엇과 무엇을** 대조하는가 | 잡는 사고 |
|---|---|---|---|
| **(가)** | `:72-95` | `admin/api.core.php` 의 `function t2a_default_settings(): array {` **함수 본문을 소스에서 잘라 eval**(`:87-89`) → `T2Ehardcontractundeclared($defaults)` | 관리자 기본 설정에 하드 설정이 모르는 키. `:70-71` — *"목록을 시험이 따로 적으면 둘이 갈라지고, **갈라지는 것이 바로 이 사고다**"* |
| **(가-2)** | `:102-121` | `T2Ecaptchanormalizeadmin()` **정규화기가 내놓는 모양** → `T2Ehardcontractundeclared(array('captcha' => …))` | `:97-101` — *"정규화기는 `keys`·`score_threshold`·`t2captcha` 를 내놓는데 하드 설정은 그 셋을 몰라, **관리자가 사이트 키를 넣고 저장하면 저장 직전에 벗겨져 다음 화면에서 빈 칸으로 돌아왔다**"* |
| **(나)** | `:124-126` | `T2Ecustomprofilesections()` 전 구획 ∈ `T2Ehardcontractsections()` | 프로필 파일이 다루는 구획이 선언 안 됨 |
| **(다)** | `:130-134` | `T2Eprofileoverlay('lite')` 의 모든 점 표기 경로 ∈ 파일이 선언한 점 표기 경로 | `:128-129` — *"그 키를 파일이 모르면 **Lite 는 '파일에 없는 값으로 도는 배포본'이 된다**"* |

**점 표기 경로 추출기 `t2test_setting_paths()`(`:41-51`) — "어떤 배열을 대장과 맞추는지"의 답:**
```php
function t2test_setting_paths($value, string $prefix = ''): array
{
    if (!is_array($value) || $value === array() || T2Ehardcontractislist($value)) return array();
    $out = array();
    foreach ($value as $key => $child) {
        $path = $prefix === '' ? (string)$key : $prefix . '.' . $key;
        $out[] = $path;
        $out = array_merge($out, t2test_setting_paths($child, $path));
    }
    return $out;
}
```
**`$value === array()` 에서 즉시 반환 = 잎(leaf) 안쪽으로 들어가지 않는다.** 이것이 §5.6 의 기계적 구현이다.

### 축 3 — 판정이 실제로 동작하는가 (`:136-175`)

`:160-169` 의 8개 단언이 필터의 계약을 고정한다:

| 단언 | 고정하는 것 |
|---|---|
| `content_height == 420` | 선언된 키의 값은 관리자가 덮는다 |
| `!isset(brand_new_toggle)` | 선언되지 않은 **키**는 벗겨진다 |
| `!isset(brand_new_section)` | 선언되지 않은 **구획**은 통째로 벗겨진다 |
| `$_version` 남음 | 밑줄로 시작하는 최상위 키는 **표면이 아니므로** 남는다 (`T2Ehardcontractismeta`, `t2_hard_contract.php:92-95`) |
| `icons == $incoming['icons']` | **빈 배열로 선언한 자리의 안쪽은 세지 않는다** |
| `allowed_domains == [a.test, b.test]` | 리스트는 통째로 덮인다 |
| `plugins` / `editor_modules` 통과 | **코드가 연 구획**은 통과한다 |
| `$dropped == ['editor.brand_new_toggle','brand_new_section']` | 벗긴 경로를 **점 표기**로 보고한다 |

`:171-175` — 하드 설정에서 구획을 지우면 저장 가능 구획 목록에서도 사라진다. *"구획 목록이 코드가 아니라 **파일에서 나온다** — 파일에서 지우면 목록에서도 사라진다."*

### 축 4 — 배포 프로필과의 연계 (`:177-231`)

| 단언 | 고정 |
|---|---|
| `:179-180` | Max 에서는 파일이 `enforce:false` 로 강제를 끌 수 있다 |
| `:184` | 강제를 끄면 선언 안 된 키도 남는다 |
| `:185-188` | **강제를 꺼도 진단은 그대로 나온다** — *"침묵은 '괜찮다'로 읽힌다"* |
| `:192-198` | **Lite 는 강제를 끌 수 없다.** `profile=>'lite'` 면 `enforce:false` 라고 적어도 강제되고, 선언 안 된 구획이 **실제로** 벗겨진다 |
| `:202-212` | `surface` 가 없으면 대장 없는 것. **Max 에서도 Lite 에서도** 강제하지 않고 아무것도 벗기지 않는다 — *"없는 대장으로 거르면 갱신만으로 그 설치의 설정이 통째로 초기화된다"* |
| `:217-220` | **아무것도 적혀 있지 않은 대장은 대장이 아니다** — `settings=>[]` 면 아무것도 벗기지 않는다. *"파일 하나를 읽지 못한 것이 그 설치의 설정을 통째로 날리는 일이 된다"* |
| `:229-231` | **코드보다 높은 판의 대장은 읽지 않는다** — `format = T2Ehardcontractformat()+1` 이면 없는 것 |

## 5.5 `T2Ehardcontractopenpaths()` 의 역할 (실측)

`AGENTS.md:60-61` — *"키가 데이터인 자리(플러그인 id, 아이콘 등)는 **빈 배열**로 적어 열고, **카탈로그가 매니페스트에서 나오는 구획만** `T2Ehardcontractopenpaths()` 에 둔다."*

`T2Editor/config/t2_hard_contract.php:73-84` **원문 전문:**
```php
    function T2Ehardcontractopenpaths(): array
    {
        return array(
            // 플러그인 id 로 색인되는 것들. 설치된 플러그인은 파일이 셀 수 없다.
            'plugins',
            // 모듈 카탈로그. modules/<area>/<id>/module.json 이 정본이다.
            'editor_modules',
            'admin_modules',
            // 관리 화면이 쓰는 옛 이름. T2Eadminapinormalize 가 editor_modules 로 옮긴다.
            'modules',
        );
    }
```

**두 가지 개방 방식:**

| 방식 | 어디에 적는가 | 언제 | 예 |
|---|---|---|---|
| **① 빈 배열로 열기** | `t2_hard_config.php` 의 `settings` 안에 `'icons' => array()` | 데이터는 있으나 **구조가 정해져 있고** 코드가 직접 개방해야 하는 자리 | `hard-declaration.test.php:143` — *"빈 배열은 잎이다 — '여기 안쪽은 데이터다' 를 파일이 말하는 문법"* |
| **② `openpaths()` 에 추가** | `t2_hard_contract.php` 의 함수 본문 | **카탈로그가 매니페스트에서 나오는** 자리. 파일이 셀 수 없다 | 4개 경로 |

**왜 구분하는가:** `settings` 배열은 `t2_hard_config.php` **한 파일**에서 읽혀야 정본이 하나다. 그런데 플러그인 목록의 정본은 `plugin/<id>/` 와 manifest이지 하드 설정 파일이 아니다. 그래서 코드의 개방 목록이 정본이 된다.

**후배 절차 — 설정 키 추가:**
1. `t2a_default_settings()` 에 키가 있으면 → `t2_hard_config.php` 의 `settings` 에 **같은 키, 같은 기본값**으로 적는다.
2. 키가 **카탈로그**이고 manifest가 정본이면 → `T2Ehardcontractopenpaths()` 에 **경로 문자열** 추가. (`settings` 쪽이 아니라 함수 쪽.)
3. 그 외 데이터 자리면 → `settings` 에 `'key' => array()` 로 빈 배열.
4. `php tests/run.php hard-declaration` 로 축 2 확인. (**이 컨테이너엔 php 가 없어 못 돌린다** — §2.6. 이 축은 통과했다고 보고할 수 없다. 명시하라.)
5. `AGENTS.md:58` — *"빠뜨리면 **게이트가 그 키 이름을 찍고 멈춘다**."* → 실패 메시지의 키 이름을 그대로 이슈/커밋에 옮긴다.

## 5.6 "빈 배열로 열어 두는 키"의 의미 (기계적으로)

**`t2test_setting_paths()`(`:43`):** `if (!is_array($value) || $value === array() || T2Ehardcontractislist($value)) return array();`

세 가지가 잎을 만든다: ① 스칼라 ② **빈 배열** ③ **리스트**(연속 정수 키).

⇒ **빈 배열로 선언하면 그 아래는 아예 검사 대상이 되지 않는다.** 파일이 "여기 안쪽은 데이터다"라고 선언하는 문법.
**대조 단언(`:164`):** `$t->eq($filtered['icons'], $incoming['icons'], '빈 배열로 선언한 자리의 안쪽은 세지 않는다')`
**⚠ 역방향도 고정(`:171-175`):** 하드 설정에서 `'icons'` 를 **지우면** 저장 가능 구획 목록에서도 사라진다. 빈 배열은 "열어 둔 것"이면서 동시에 "선언한 것"이다.

---

# 6. CSS 계약 규칙 (기계 판정)

## 6.1 규칙 식별자 전수 (A1 재확인 — **A1 전부 정확**)

```
$ grep -oE "C[0-9]+[a-z]?" tools/t2-css-contract.mjs | sort -uV | tr '\n' ' '
C1 C2 C3 C4 C5 C6 C7 C7b C8 C9 C10 C11 C12 C13 C14 C15 C18 C19 C20 C21 C22
```

| A1 주장 | 실측 | 판정 |
|---|---|---|
| **C16 부재** | `LABEL` 맵(`:743-749`)에도 `add('C…')` 에도 없음 | ✅ **정확** |
| **C17 부재** | 동일 | ✅ **정확** |
| **C22 폐기** | `:711-719` 에 **제거 주석 전문** 존재. `LABEL` 맵에 **`C22` 항목이 없다** | ✅ **정확** |

**C22 제거 주석(`:711-719`) 원문:**
```
/* ── C22 는 없어졌다 ────────────────────────────────────────────────────
   있던 규칙은 "결정적 action 은 넓은 색면을 갖지 않는다" 였다. primary/confirm
   계열의 배경을 지우고 ink + 하단 rail 만 남기게 했고, 그 결과 모달 발치의
   "확인"이 본문 글자와 구분되지 않았다.

   UI 스펙은 반대로 그린다 — .bm-footer-btn.confirm 과 .cp-apply-btn 이 둘 다
   accent 를 통째로 칠하고 잉크를 뒤집는다. 규칙이 디자인 원본과 정면으로
   어긋나므로 규칙 쪽을 버린다. 채우는 일은 t2-foundation.css 의 t2.contract
   층이 한 곳에서 맡고, 그 아래 층에 남은 transparent 선언들은 덮인다. */
```

**왜 C16/C17 이 비었는지는 코드에 기록이 없다.** C15 다음이 C18. 추측하지 않는다.

## 6.2 규칙별 의미 1줄 + 라인 (전수 21종)

`LABEL` 맵(`:743-749`)이 공식 설명이다.

| ID | `LABEL` 원문 | 실물 라인 | 무엇을 금지/강제하나 |
|---|---|---|---|
| **C1** | 중괄호 무결성 | `:114, :117` | `{`/`}` 균형. 과잉 `}`·미닫힘 → **문법 파괴. baseline 무시하고 항상 실패**(`:760,763`) |
| **C2** | 레이어 이탈 | `:164` | `@layer` 밖 규칙. **baseline 무시하고 항상 실패**(`:763`) |
| **C3** | 레이어 미선언 | `UNLAYERED_OK`(`:46-49`) | `UNLAYERED_OK` 에 없는 파일이 `@layer` 없이 규칙. 예외 4개: `t2-foundation.css` `t2-visual-system.css` `content.css` `typeface.css` |
| **C4** | 금지된 세로 rail | `VERTICAL_RAIL_ALLOW`(`:354`), `SEMANTIC_RAIL_VALUE`(`:357`) | 세로 rail 규칙 |
| **C5** | 유령 선택자 | `PUBLISHED_VOCAB`(`:77`) | 마크업이 쓰지 않는 선택자 = 죽은 CSS. **두 파일은 공개 어휘 계약으로 예외**(§6.6) |
| **C6** | 미정의 변수 | — | 정의되지 않은 `var(--…)` |
| **C7** | 레이어 소유권 위반(죽은 선언) | `APPEARANCE`(`:279`) | `t2.module`/`t2.plugin` 이 `t2.product` 소유 외형을 선언 → **계층에 져서 죽는 선언** |
| **C7b** | 속성 별칭·한정자 죽은 선언 | `:551` | C7 의 **축약형** — 속성 별칭·한정자 때문에 못 잡던 것 |
| **C8** | 파일 내 중복 선언 | — | 같은 파일에 같은 선언 두 번. **집계형** — detail 에 건수(`:723-727`) |
| **C9** | 여백 사다리 이탈 | `LADDER`(`:571`) | 간격이 사다리 밖. `AGENTS.md:47` — *"40px 이상은 기하로 보고 사다리 제외"* |
| **C10** | 터치 타깃 회귀 | — | coarse pointer 44px 미만 |
| **C11** | 다크 토큰 역할 역전 | `DARK_BACKGROUND_FOREGROUND`(`:378`), `DARK_FOREGROUND_SURFACE`(`:379`) | 다크 배경에 foreground 토큰 / 그 반대 |
| **C12** | 자기 참조 폴백 | `SELF_FALLBACK`(`:216`) | `var(--x, var(--x))` — 폴백이 자기 자신 |
| **C13** | 공통 토큰 다중 소유자 | `SHARED_PLUGIN_TOKEN`(`:228`) | 공통 토큰을 플러그인 레이어가 재정의 |
| **C14** | 상대 자산 경로 | — | 상대 경로 자산 참조 |
| **C15** | 범용 안전망의 modal 기하 침범 | `:261`, `MODAL_GEOMETRY_LEAK`(`:256`) | `max-width:100%` 안전망이 `[data-t2-modal-surface]` root 를 예외 처리 안 함 |
| **C18** | transition all 금지 | `:642` | `transition: all` — 변화 속성 명시 |
| **C19** | 상태 토큰 역할 충돌 | `LOAD_GROUPS`(`:398`) | 상태 토큰 역할 충돌 |
| **C20** | radius 사다리 이탈 | `RADIUS_STEPS`(`:673`) | `new Set([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,999])` |
| **C21** | overshoot motion | `:706-707` | overshoot cubic-bezier. `--t2-ease-spring` 하나만 쓴다 |

**`LADDER` 실제 값(`:571`):** `new Set([1, 3, 5, 7, 9, ...Array.from({ length: 21 }, (_, i) => i * 2)])` = **0,2,4,…,40 (짝수 전부) + 1,3,5,7,9 (홀수 10 미만)**. `AGENTS.md:42` 의 "2px 리듬·4px 사다리" 와 맞는다.

**⚠ `C20`(정적, `RADIUS_STEPS` 0~16) vs `tools/ux/README.md:35`(런타임, 역할 사다리 `{0,1,2,3,6,8,12,16}`)는 다른 축이다.** 정적은 전체 0~16, 런타임은 역할별 제한.

## 6.3 토큰 계열 `--t2-s*` vs `--t2-u*`

`AGENTS.md:42`: *"사다리를 섞지 않는다: 콘텐츠 흐름은 `--t2-s*`(2px 리듬·4px 사다리), 크롬/모달은 `--t2-u*`(u/16 배수, `t2-foundation.css:299`~). 섞으면 `t2-css-contract.mjs` C계열 위배."*

### `--t2-s*` — 스 레더

**정의: `T2Editor/css/t2-foundation.css:179`**
```css
  --t2-s1:4px; --t2-s2:8px; --t2-s3:12px; --t2-s4:16px;
```
실사용: `--t2-s4`(`js/utils/modal.css:29`), `--t2-s6`(`plugin/file/file.css:11`), `--t2-s1 --t2-s2`(`t2-visual-system.css:349`).

### `--t2-u*` — u 계열 (⚠ AGENTS.md 의 `:299` 는 낡았다)

| 토큰 | 값 | 라인 | 분수 |
|---|---|---|---|
| `--t2-u` | `calc(100vw / 15)` | `:366` (`:428` 에서 `/10`) | 1u = 뷰포트의 1/15 |
| `--t2-u8` | `calc(var(--t2-u) / 8)` | `:381` | 1/8 |
| `--t2-u316` | `calc(var(--t2-u) * 3 / 16)` | `:382` | **3/16** ← 가장 fine |
| `--t2-u4` | `calc(var(--t2-u) / 4)` | `:383` | 1/4 |
| `--t2-u38` | `calc(var(--t2-u) * 3 / 8)` | `:384` | 3/8 |
| `--t2-u2` | `calc(var(--t2-u) / 2)` | `:385` | 1/2 |
| `--t2-u34` | `calc(var(--t2-u) * 3 / 4)` | `:386` | 3/4 |
| `--t2-u78` | `calc(var(--t2-u) * 7 / 8)` | `:387` | 7/8 |

**`--t2-u16` 은 없다** (실측). 가장 fine 은 `u316 = 3×(1/16)u`. ⇒ `AGENTS.md:42` 의 **"u/16 배수"는 사실이지만 최고 분모가 16이라는 뜻은 아니다** — 8분의 1까지 내려간다.

**유도 크롬 토큰(`:389-397`):**
```css
  --t2-chrome-inset: var(--t2-u316);
  --t2-chrome-face:  var(--t2-u78);
  --t2-chrome-hit:   max(var(--t2-u78), var(--t2-hit));
  --t2-chrome-band:  calc(var(--t2-chrome-hit) + 2 * var(--t2-chrome-inset));
  --t2-toolbar-gap: var(--t2-design-toolbar-gap, var(--t2-chrome-inset));
```

**왜 섞으면 안 되는가 (`t2-foundation.css:399-400` 원문):** *"하단 바의 요소는 1/2u 다(710 C-2·C-3). **툴바의 7/8u 와 다른 것은 계층이 다르기 때문이다.** 밴드는 1u 이고 인셋 1/4u 가 그 차이를 흡수한다."*

**후배:** 콘텐츠 흐름 = `--t2-s*`, 크롬/모달 = `--t2-u*`. **임의 px 리터럴 금지**(`AGENTS.md:41` — *"구현 값은 `T2Editor/developer/t2-design-system.md` + `T2Editor/css/t2-foundation.css` 토큰에서만"*). **`law/case` 해설 수치는 비규범 예시 — 코드로 옮긴 전례가 있다**(`AGENTS.md:41`) ⇒ 그대로 쓰지 마라.

## 6.4 레이어 소유권 — `CSS @layer` 정의 위치

`AGENTS.md:43`: *"**`t2.product`가 외형을 소유.** `t2.module`/`t2.plugin`에 `appearance`·`margin`·`display`·`position`을 선언하면 **레이어에 져서 죽는다.**"*

**레이어 순서 선언 — `css/t2-foundation.css:51`:**
```css
@layer t2.token, t2.content, t2.legacy, t2.module, t2.product, t2.plugin, t2.contract;
```
**기계 판정 배열 — `tools/t2-css-contract.mjs:36`:**
```js
const LAYER_ORDER = ['t2.token', 't2.content', 't2.legacy', 't2.module', 't2.product', 't2.plugin', 't2.contract', 'UNLAYERED'];
```
선언(`:51`)과 판정 배열(`:36`)의 순서는 **일치**. 8번째 `UNLAYERED` 는 판정 전용.

**레이어를 여는 실제 위치:**

| 파일 | 시작 | 끝 | 레이어 |
|---|---|---|---|
| `css/t2-foundation.css` | `:53` | `:552` | `@layer t2.token` |
| `css/t2-foundation.css` | `:555` | `:639` | `@layer t2.product` |
| `css/t2-foundation.css` | `:643` | `:932` | `@layer t2.contract` |
| `css/t2-visual-system.css` | `:23` | `:4177` | `@layer t2.product` (파일 전체) |

`css/t2-visual-system.css:9` — *"전체를 `@layer t2.product` 로 감싸 `!important` 559개를 **0개로** 줄였다."*

**C7 이 막는 속성 — `APPEARANCE`(`t2-css-contract.mjs:279`):** `background|background-color|background-image|border|border-color|border-width|border-style|border-top/right/bottom/left(-color/-width/-style)|border-radius|box-shadow|padding|padding-*|margin|margin-*|gap|row-gap|column-gap|color|fill|stroke|font|font-size|font-weight|font-family|line-height|letter-spacing|text-transform|min-height|min-width|width|height|opacity|display|visibility`

**`AGENTS.md:43`:** JS `<style>` 주입 금지(`js/toolbar.js` 전례), unlayered 시트 금지 — **C1/C2/C7b** 가 잡는다.

**`css/content.css` 의 예외 처리(`:51-63`):** 발행 본문 시트는 소스에 `@layer` 가 없다(발행 페이지에 T2 레이어 선언이 없으므로). 편집 화면에서 서버가 같은 바이트를 `@layer t2.content` 로 감싸 싣는다(`config/t2_content_styles.php`) ⇒ 캐스케이드 판정에서는 `UNLAYERED` 가 아니라 `t2.content` 로 읽어야 한다. 그러지 않으면 살아 있는 플러그인 선언을 "죽은 선언"으로 오판한다.

## 6.5 실행과 판정 (실측 rc=0)

```bash
node tools/t2-css-contract.mjs
```
실측 출력: `신규 위반 없음.` (rc=0). `t2-css-contract.baseline.json` 의 `count: 0` 과 일치 — **부채 0.**

**C1·C2 는 baseline 무시**(`:760-768`): `// C1 은 문법 파괴이므로 baseline 여부와 무관하게 항상 실패시킨다.` / `const hardFail = violations.filter((v) => v.code === 'C1' || v.code === 'C2');`

**환경변수:** `T2_DUMP=/tmp/v.json` → 신규 위반 전체 JSON dump(`:757`).
**`--baseline`(`:34`)** → 위반 기록 후 exit 0. **판정에 쓰지 마라.**

## 6.6 공개 어휘 — **코드에 있다** (A1 질문: "있음")

`AGENTS.md:43`: *"`t2-foundation.css`/`t2-visual-system.css` 클래스는 **공개 어휘라 삭제 금지**, 런타임 조합 클래스(`t2-notification-<type>` 등) **allowlist 없이 ghost prune 금지**."*

**코드 위치 — `tools/t2-css-contract.mjs:74-77`:**
```js
// 디자인 시스템이 서드파티 플러그인에 제공하는 공개 어휘를 담은 파일.
// 이 트리가 쓰지 않는 클래스도 계약이므로 C5(유령 선택자) 대상에서 제외한다.
// 새 어휘를 추가할 때는 css/DESIGN-SYSTEM-VOCABULARY.md 에 같이 적는다.
const PUBLISHED_VOCAB = new Set(['css/t2-foundation.css', 'css/t2-visual-system.css']);
```

**⚠ `t2-css-contract.mjs:76` 과 `AGENTS.md:43` 이 가리키는 문서가 다르다** — 코드가 정확한 곳은:

**`T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md` (11,935 B) — 실재.** `:1-9` 원문:
```
# T2Editor 디자인 시스템 공개 어휘

`css/t2-foundation.css`(레이어 `t2.token`, `t2.product`)와
`css/t2-visual-system.css`(레이어 `t2.product`)가 서드파티 플러그인에 제공하는
클래스·속성 어휘다. **이 트리의 마크업이 쓰지 않아도 계약이므로 지우지 않는다.**

CSS 계약 검사(`tools/t2-css-contract.mjs`)는 이 두 파일을 C5(유령 선택자)
대상에서 제외한다. 대신 여기에 적히지 않은 어휘를 두 파일에 추가하면 그건 계약
없는 사문이므로, **새 어휘를 추가할 때는 이 문서에 같이 적는다.**
```

**이 문서가 왜 필요했는가(`:11-23`) — ⚠ "추측한 이름" 사고의 실재 증거:**
> 2026-08 감사에서 "Law-Aligned Design System 2026-08" 일괄 패치가 실제 클래스명이 아니라 **추측한 이름**을 겨냥해 작성된 것이 드러났다.

| 패치가 겨냥한 이름 | 마크업의 실제 이름 | 결과 |
|---|---|---|
| `.t2-privacy-surface` | `.t2privacy-dialog` | 개인정보 모달이 제품 규칙 11개 그룹을 전부 비껴감 |
| `.t2-nsfw-overlay` / `.t2-nsfw-panel` | `.t2-nsfw-dialog-overlay` / `.t2-nsfw-dialog` | NSFW 대화상자가 디자인 시스템 밖에 남음 |
| `.t2-privacy-consent` / `-notice` / `-gate` | **(없음)** | 규칙 전체가 사문 |

⇒ **"지워야 할 죽은 CSS"와 "지키기로 한 공개 어휘"의 구분선이 이 문서다.**

**후배:** 두 파일에 클래스를 **추가**할 때 → `css/DESIGN-SYSTEM-VOCABULARY.md` 를 **같은 변경에서** 갱신. 안 하면 "계약 없는 사문"이 된다. **삭제**할 때는 C5 가 예외로 두므로 **코드 리뷰로만 막힌다.**

## 6.7 ⚠ A1 발견 "AGENTS.md 줄번호 낡음 6건" — B2 독립 재검증

| # | `AGENTS.md` 인용 | **실제 라인** | 그 자리에 실제로 있는 것 | 판정 |
|---|---|---|---|---|
| **1** | `:42` `t2-foundation.css:299`~ (`--t2-u*` 정의) | **`:366, 376, 428, 433`** | `:299` 은 `t2-css-contract.mjs` 의 `APPEARANCE` 정규식. foundation 의 `:299` 은 주석 영역 | **⚠ STALE** |
| **2** | `:69` `t2-foundation.css:308` (`@supports (width:1cqi)`) | **`:375`**(블록) `:376`(선언) | `:308` 은 `color-scheme` 표면 스코프 **주석 한 줄** — 가드가 아예 없다 | **⚠ STALE** |
| **3** | `:46` `t2-visual-system.css:342` (`container-type`) | **`:382`**(선언) `:357-361`(메커니즘 주석) | `:342` 은 `.btn-danger:hover` 배경 규칙 | **⚠ STALE** |
| **4** | `:45` `t2-visual-system.css:446` (`t2-toolbar-reveal`) | **`:496-502`** | `:446` 은 `.t2-toolbar` 의 `padding` 선언 | **⚠ STALE + 내용 오류** |
| **5** | `:44` `modal.css:162` (`t2-modal-pinned-actions`) | **`:162`** ✔ | `.t2-modal-surface-default > .t2-modal-pinned-actions { position: sticky; bottom: 0; z-index: 1; }` | **✅ 정확** |
| **6** | `:68` `modal.css:29,65` (`--t2-privacy-notice-inset`) | **`:29`, `:65`** ✔ | 둘 다 정확히 해당 | **✅ 정확** |

⇒ **6건 중 4건 STALE, 2건 정확.** A1 의 "6건" 숫자와 판정이 대체로 맞다.

### ⚠ 4번이 가장 위험하다 — **라인뿐 아니라 내용도 틀렸다**

`AGENTS.md:45` 원문:
> … **`t2-toolbar-reveal 0s 1.5s forwards`**로 JS 사망 시 자동 공개(`t2-visual-system.css:446`, `editor.core.php`, 58726d9). pending을 빼면 저속 기기에서 **19개 버튼이 2초간** 노출된다.

**실제 코드 (`css/t2-visual-system.css:490-502`):**
```css
   판정까지 걸리는 실측 시간이 1x(스로틀 없음) 469ms, 2x 612ms, 4x 1104ms,
   6x 1737ms — 6x 에서 이미 기존 1.5s 를 넘는다. 그 보고가 재현한 Moto G4 +
   3G 환경은 이 6x 보다도 느릴 가능성이 크다. 델레이를 줄이면 안전망이 더
   일찍 터져 판정 전 날것이 노출되는 창이 넓어질 뿐이다(0.8s 로는 6x 기준
   0.8~1.7s 구간, 약 900ms 노출 — 기존보다 더 나쁘다). 그래서 반대로 3s 로
   늘려 정상 동작(수백 ms)에는 체감 차이가 없이 저속 기기의 오탐 창만 줄인다. */
.t2-toolbar.t2-toolbar-pending {
  visibility: hidden;
  animation: t2-toolbar-reveal 0s linear 3s forwards;    /* ← 1.5s 가 아니라 3s */
}
@keyframes t2-toolbar-reveal { to { visibility: visible; } }
```

| 항목 | `AGENTS.md:45` | 실제 |
|---|---|---|
| animation 지연 | `1.5s` | **`3s`** (`0s linear 3s forwards` — `linear` 도 빠짐) |
| 노출 규모 | "**19개** 버튼이 2초간" | `docs/ux-patch-plan-2026-08-25.md:57` — *"패치 전 첫 프레임 **19버튼 중 14개** 셸 밖 ~2초 노출"* ⇒ 19개 전부가 아니라 **14개** |
| 실측 근거 | 없음 | 1x 469ms / 2x 612ms / 4x 1104ms / **6x 1737ms**, Moto G4+3G 보고 |

**후배: `AGENTS.md:45` 를 인용해 안전망 타이밍을 논하지 마라.** 주석이 이미 **0.8s 로 낮추면 더 나빠진다**고 계산을 남겼다. 3s 는 실측 기반이다.

**참고 — 3번이 커밋된 문서까지 오염시켰다:** `GITHUB-ISSUE-BODY-KO.md:19` 도 `t2-visual-system.css:342` 를 인용. ⇒ 낡은 라인이 AGENTS.md 밖으로 전파됐다.

---

# 7. PR · 이슈 · 브랜치 규약

## 7.1 브랜치 네임스페이스와 CI 제외 (실측)

`AGENTS.md:35`: `claude/**`, `agent/**`, `probe/**`, `bot/**` — **3개 워크플로**에서 제외.

| 워크플로 | `push` 트리거 | `branches-ignore` 라인 | `paths` 필터 |
|---|---|---|---|
| `.github/workflows/ci.yml` | ✅ (`:21-29`) | `:25-29` | **없음** — 모든 push |
| `.github/workflows/spacing-normalize-once.yml` | ✅ (`:7-15`) | `:11-15` | ✅ `:16-28` |
| `.github/workflows/visual-ui-audit.yml` | ✅ (`:6-14`) | `:10-14` | ✅ `:15-25` |
| `.github/workflows/opencode.yml` | ❌ (`:3-6` `issue_comment`/`pull_request_review_comment`) | — | — |

**parity 테스트가 강제** (`tests/js/release-gate-parity.test.mjs:32-33,57-58`):
```js
const WORKFLOWS = ['ci.yml', 'spacing-normalize-once.yml', 'visual-ui-audit.yml'];
const AGENT_BRANCHES = ['claude/**', 'agent/**', 'probe/**', 'bot/**'];
const missing = AGENT_BRANCHES.filter((branch) => !source.includes(`'${branch}'`));
t.eq(missing, [], `${file} 이 에이전트 브랜치 네임스페이스를 모두 제외한다`);
```
⇒ 네 개 네임스페이스 중 **하나라도 빠지면 게이트 ⑧ 이 빨개진다.**

`CLAUDE.md:4-8` 이유: *"에이전트가 중간 커밋을 밀 때마다 GitHub Actions 를 태우지 않기 위해서다. 그래서 **그 브랜치의 기계적 검증은 푸시 전에 이 저장소 안에서 직접 한다.**"*

`ci.yml` 의 3중 보호(`:20-31,36-38`): `branches-ignore` 4개 / `pull_request:`(제한 없음 — 4개 네임스페이스라도 돈다) / `concurrency: cancel-in-progress: true`.

## 7.2 브랜치 이름 규칙

`AGENTS.md:307`: *"One branch per issue (or per small cluster of closely related, **file-disjoint** issues): **`fix/<issue-number>-<short-slug>`**"*

**이 저장소의 실제 이름 (커밋 실측):**
```
fix/353-data-url-bound
fix/378-379-slash-menu-a11y-position      ← 이슈 2개 (file-disjoint 묶음)
fix/331-lite-ai-blocked-not-removed
fix/254-captcha-dark
fix/272-slash-menu
fix/284-captcha-tailwind
fix/371-resize-role
fix/351-nsfw-mode
fix/352-admin-ux
fix/353b2-dead-paste-cleaner              ← 변형: 이슈 353 의 하위 분할
fix/308-debug-gate
fix/332-nginx-guard
fix/334-chunk-category
```
**관례 3가지:** ① `353b2` — 큰 이슈 하위 분할 시 `이슈번호+문자+번호` ② `378-379` — **파일이 무관한** 이슈 묶음 ③ slug 은 짧은 영어 kebab-case.

## 7.3 동시 open PR 상한 2~3

`AGENTS.md:297-305` 원문:
> Run `gh pr list` before opening a new one:
> - Keep at most **~2–3 PR-track PRs** open at a time. At the cap, spend remaining budget on **backlog items that don't need a PR yet** — survey work, edge-case sweeps, research.
> - **check whether any currently-open PR already touches the same file(s).** If it does, don't open a competing branch: either wait for that PR to merge and branch from the new tip, **or fold the new fix into the existing PR if they're closely related.** Only run PRs in parallel when they touch **genuinely disjoint** parts.
> - Branch from the **current tip** of the default branch **right before you start** (not from a tip you pulled earlier in the session).

**실무 순서:**
```bash
gh pr list                                     # ← ① 새 브랜치 전에 반드시
git fetch origin && git log --oneline origin/main -3   # ← ② 최신 tip
git checkout -b fix/<N>-<slug>                 # ← ③ 그 다음에야
```

**실측 리듬:** merge 커밋이 연속 — `57a8b5f`(#381) → `48302db`(#380) → `459ca02`(#377) → `00c3628`(#376) … ⇒ **상한 2~3 을 지키며 하나씩 머지하는 패턴이 실제로 작동 중.**

## 7.4 fast-track vs PR-track 경계

**Fast-track (`AGENTS.md:278-289`):** *"changes that are **close to risk-free and trivial to confirm just by looking** — typos, whitespace/formatting, comment/doc fixes, **removing code you've directly confirmed is unused**, or a **single CSS value corrected to match the pattern already used by its siblings**. **No behavioral logic change, and no real judgment call** about whether it's correct."*

**금지선 (`:283-289`):** *"Never fast-track anything from the **escalation list**, anything touching **auth/permissions/schema/API**, or **anything you had to reason your way to** rather than simply notice."* + *"Still run lint/build … and still do a **quick one-shot sanity check** (a single screenshot is enough for anything CSS/markup-adjacent) — lighter than the full Verification section, but **not skipped**."* + *"**Write a clear Korean commit message** — it's the entire record for this change. Don't file an issue per typo; **roll fast-tracked changes up in aggregate in the 'Ending a session' summary** instead."*

**PR track (`:290-292`):** *"everything else — anything with **real behavioral risk**, anything **non-obvious**, anything where 'trivial' would be a **judgment call rather than a plain observation**."*

## 7.5 ⚠ 이 저장소에서 고른 판정 사례 5개 (실측 커밋)

최근 60건 중 `Refs` 5 / `Closes` 22.

| # | 커밋 | 메시지 | 판정 | 이유 |
|---|---|---|---|---|
| **1** | `a42bcf7` | `설정 불리언 정규화 fail-open 제거 (Closes #328)` | **PR track** | "fail-open 제거"는 **보안 동작 변경**. `AGENTS.md:284` — auth/permissions |
| **2** | `7d8dfbc` | `정규식 스킴 판정을 문자 스캐너로 교체 — 엔티티·제어문자 우회 차단 (Closes #319)` | **PR track** | 스킴 판정만 보면 fast-track 같지만 **알고리즘 교체**다. 동작 동등성 증명 필요. `AGENTS.md:282` 의 "single CSS value" 아님 |
| **3** | `7ac9d70` | `캡차 tailwind 벤더 opt-out — **407KB 조건부 출력** (Closes #284)` | **PR track** | 번들 크기와 로드 순서 변화 = 성능·호환 영향 |
| **4** | `4a58afb` | `에디터 가드 배치-B — image 슬라이더·코드 펜스·캐럿 가드 (과장-B 발견)` | **PR track, ⚠ 이슈 없음** | `Refs`/`Closes` **둘 다 없다**. behavior 변경. `AGENTS.md:221-222` — 이슈는 fast-track 가 아닌 모든 distinct problem 에. **⚠ 절차 결함 — 후배는 이렇게 하지 마라** |
| **5** | `8c4c2b1` | `로더 대비책 href를 경로형으로 — **Host 반사 제거** (Closes #325)` | **PR track** | Host 헤더 반사는 **보안 경계** |

### ⚠ 애매한 사례 3개 (규범이 명시적으로 답하지 않는다)

| # | 커밋 | 어디에 걸리는가 | 판단 |
|---|---|---|---|
| **A** | `48507ec` `배열형 쿼리 경고를 is_string 가드로 — **헤더 무효화 제거** (Closes #329)` | "경고 고치기"는 fast-track 같으나 결과가 **헤더 무효화**라 요청 경로가 바뀐다 | **PR track 가 옳다.** 사용자에게 보이는 행동 변화 |
| **B** | `a8e142a` `높이 조절 핸들에 separator 역할 — 보조기기 인식 (Closes #371)` | 역할 추가만 보면 단일 속성. **접근성**이라 검증 방식이 다르다 | **PR track 가 옳다.** `AGENTS.md:263-265` — 키보드 전용 도달성 요구 |
| **C** | `61afd7e` `저장된 nsfw 추론 방식 보존 — **다음 저장 덧씌움 제거** (Closes #351)` | "값 보존"은 국소적. **저장 경로**가 바뀐다 | **PR track 가 옳다.** 스키마/저장 형식은 `AGENTS.md:319` 에스컬레이션에도 걸림 |

**후배 판정 규칙 3문장:**
1. **"알아서 눈에 보였다"가 아니면 PR track** (`AGENTS.md:284`).
2. **auth / permission / schema / API 에 닿으면 무조건 PR track** (`AGENTS.md:284`).
3. **사용자에게 보이는 행동이 바뀌면 PR track** — 토큰 추가·헤더 소멸·저장 경로 변경 모두 해당.

## 7.6 `Refs` vs `Closes` — 실측 관행

| 접두사 | 실측 사례 | 의미 |
|---|---|---|
| `Closes #N` | `a42bcf7 … (Closes #328)` | 머지 시 자동 종료 (`AGENTS.md:314`) |
| `Closes #N, #M` | `1ccd025 … (Closes #378, #379)` | 이슈 2개 |
| `Closes #N-M` | `319969b … (Closes #337-1)` | 범위 표기 |
| **`Refs #N`** | `6a50052`(#353) `459ca02`(#331) `5ac69ba`(#272) `1ff817f`(#352) `0fbdaae`(#353) | **이슈를 닫지 않는다.** 커밋이 일부이거나 이슈에 남은 작업이 있다 |
| **없음** | `4a58afb`, `885c911` | ⚠ 절차 결함 |

**후배:** 이슈를 **완전히** 해결했으면 `Closes`, **일부만** 했으면 `Refs` (이슈가 열려 다음 세션이 이어받는다). **두 접두사를 섞지 마라.** `AGENTS.md:314` 는 `Closes` 를 요구하지만 `Refs` 를 금지하지 않는다 — 실적이 정당화한다.

## 7.7 PR 본문 필수 항목

`AGENTS.md:311-314` — *"**Write commit messages and the PR title/description in Korean.** The PR description must cover: **what was broken, root cause, what changed, why this approach, what you verified**, and — for **admin/UX changes** — the two-persona note from operating principle 3."* + *"Include `Closes #<issue-number>` so the issue auto-closes on merge."*

**7 슬롯 (전부 한국어):** ① 무엇이 깨졌는가 ② 근본 원인 ③ 무엇을 바꿨는가 ④ 왜 이 접근인가 ⑤ 무엇을 검증했는가 ⑥ **[admin/UX 한정]** 2인 페르소나 노트 ⑦ `Closes #N`

추가: `AGENTS.md:270-271` — *"Note the **before/after result** in the PR description so the maintainer can see it without re-running anything."* / `AGENTS.md:310` — *"If none exist for the area you touched, **describe in the PR exactly what you verified manually instead.**"*

## 7.8 에스컬레이션 (`needs-human`) 6개 항목

`AGENTS.md:316-327`. **파일로 이슈를 남기고 `needs-human` 를 붙이고, PR 을 열지 않는다.**

| # | 항목 (라인) |
|---|---|
| 1 | **The project's own governance/design-philosophy docs 를 바꾸거나 그 stated direction 과 충돌하는 것** (`:318`) |
| 2 | **public API, plugin contract, stored-data schema/format 의 breaking change** (`:319`) |
| 3 | **authentication, permission/capability gating, license/key validation 에 닿는 것** (`:320`) |
| 4 | **dependency major-version upgrade, 또는 새 external dependency** (`:321`) |
| 5 | **Destructive data migrations, 또는 rollback 이 자명하지 않은 것** (`:322`) |
| 6 | **기존 governance/style docs 가 이미 settle 하지 않은 brand/design-direction taste 판단** (일관성 수정이 아니라면) (`:323-324`) |

**절차 (`:326-327`):** *"describe the problem, **2–3 possible approaches with trade-offs, and your recommendation** in the issue — **in Korean** — then **stop and wait** rather than implementing."*

보충: `AGENTS.md:122` — *"If a fix would require **changing or conflicting with** the project's own governance/style docs, that is an escalation — **don't silently reinterpret them.**"* / `AGENTS.md:137-138` — *"**Never break working functionality to fix cosmetics.** If a fix's **blast radius is unclear, file an issue instead of guessing.**"*

**`needs-human` 이 실제로 쓰인 이력은 `git log` 에 없다** ⇒ **지금까지 전부 자체 해결했다.** 그러니 "이건 에스컬레이션하려고"를 가볍게 넘기지 마라 — 6개 목록은 **진짜로 막고 있던**界线다.

## 7.9 세션 마무리 (`AGENTS.md:329-337`)

1. 워킹 트리 clean — 전부 커밋·푸시됨, 미완성 브랜치 없음
2. 끝내지 못한 이슈의 `in-progress` 라벨 **제거**
3. 영구 메모리 업데이트(구조 맵, 관례, 엣지 케이스 커버리지, 해소된 에스컬레이션)
4. 고정 추적 이슈에 **한국어** 상태 코멘트 — 제목 `[Agent] 진행 현황`, 없으면 **한 번만** 생성(`:334-335`)
5. 그 코멘트에 **fast-track 직접 푸시 커밋의 1줄 롤업** 포함(`:335-336` — 이슈/PR 흔적이 없으므로)
6. 다음에 queued了什么

`AGENTS.md:139-140` (principle 6): *"**Assume you'll be cut off mid-session.** Keep the repo in a safe, committed, pushed state at all times — **never let uncommitted work be the only copy of anything**."*
`AGENTS.md:196-197`: 메모리 노트는 **`[T2Editor]` 같은 일관된 태그**로 시작 — 이 저장소 전용이 아니므로.

---

# 8. 구조 변경의 ABI 계약

## 8.1 `X.php` + `X.core.php` 브리지 쌍이 updater ABI 계약이다 — A1 주장 검증

**A1 주장:** "`X.php` + `X.core.php` 브리지 쌍이 updater ABI 계약이다."
**검증: ✅ 정확.** 근거는 `T2Editor/admin/update_api.core.php` 의 두 함수.

### 브리지 쌍의 자동 발견 — `t2u_bootstrap_contract_files()` (`:430-441`)

```php
foreach (array('admin','config') as $directory) {
    foreach ((array)glob(rtrim(T2EDITOR_BASE_PATH, '/\\') . '/' . $directory . '/*.php') as $wrapper) {
        if (substr($wrapper, -9) === '.core.php' || !is_file(substr($wrapper, 0, -4) . '.core.php')) continue;
        $files[] = $directory . '/' . basename($wrapper);
    }
}
foreach ((array)glob(rtrim(T2EDITOR_BASE_PATH, '/\\') . '/plugin/*/*.php') as $wrapper) {
    if (substr($wrapper, -9) === '.core.php' || !is_file(substr($wrapper, 0, -4) . '.core.php')) continue;
    $relative = …;
    $coreRelative = substr($relative, 0, -4) . '.core.php';
    if (is_file(… '/' . $relative) || is_file(… '/' . $coreRelative)) $files[] = $relative;
}
```

**동작:** `admin/` `config/` `plugin/*/` 의 모든 `*.php` 를 훑어, **`X.core.php` 짝이 존재하는 `X.php` 만** 불변 부트스트랩 목록(`$files`)에 넣는다. 명시 목록이 아니라 **자동 발견**이다.

**하드코딩된 최소 목록(`:363-372`)** — `t2u_data_release_looks_complete()`:
```php
'admin/index.core.php', 'config/upload.core.php', 'js/core.js',
'js/engine/engine.js', 'js/runtime/plugin-runtime.js', 'css/core.css',
'css/t2-visual-system.css', 'locales/ko.json',
```
+ 부트스트랩 엔트리 목록(`:418-429`): `integration/cms/adapters/{gnuboard5,rhymix,standalone}.php`, `config.blade.php`, `editor.html`, `skin.xml`, `endpoints/{run,install-check,plugin-sandbox-worker,t2_css_min,t2_js_min}.php`

### 강제 — `t2u_assert_bootstrap_contract()` (`:445-468`)

```php
// (1) 목록의 모든 파일이 설치본과 **바이트 동일**해야 한다 (:452-455)
if (!is_file($baseFile) || !is_file($stageFile) || is_link($stageFile)
    || !hash_equals(t2u_hash_file($baseFile), t2u_hash_file($stageFile))) {
    throw new RuntimeException('데이터 방식으로 바꿀 수 없는 부트스트랩 파일이 현재 설치본과 다릅니다: ' . $relative
        . '. 이 배포본은 부트스트랩 ABI를 올리고 해당 파일을 직접 교체해야 합니다.');
}
// (2) **새** 공개 PHP 진입점은 데이터 슬롯으로 추가 불가 (:457-467)
if (substr($info->getFilename(), -9) === '.core.php' || substr($info->getFilename(), -4) !== '.php') continue;
$wrapper = $info->getPathname();
$core = substr($wrapper, 0, -4) . '.core.php';
if (!is_file($core)) continue;                        // ← 쌍이 있어야 대상
$relative = …;
if (!is_file($base . '/' . $relative)) {              // ← 설치본에 없으면 = 신규
    throw new RuntimeException('새 공개 PHP 진입점은 데이터 슬롯만으로 추가할 수 없습니다: ' . $relative
        . '. endpoints/run.php 패키지 라우터를 사용하거나 부트스트랩 ABI 업데이트로 배포하세요.');
}
```

## 8.2 ⚠ 새 쌍을 만들면 왜 깨지는가 — 업데이트 경로의 가정

**추적한 경로 3단계:**

1. **배포 데이터 릴리스가 만들어질 때** `t2u_bootstrap_contract_files($stage)` 가 자동 발견으로 `X.php` 를 목록에 넣는다. — 설치본에 `X.php` 가 없는데 stage 에 있으므로 조건 ②가 발동한다.
2. **`t2u_assert_bootstrap_contract()`** 가 그 목록을 훑다가 `!is_file($base . '/' . $relative)` 를 만나면 `RuntimeException` 을 던진다:
   > `'새 공개 PHP 진입점은 데이터 슬롯만으로 추가할 수 없습니다: X.php. endpoints/run.php 패키지 라우터를 사용하거나 부트스트랩 ABI 업데이트로 배포하세요.'`
3. **해결책 2개만 제시된다** — ① `endpoints/run.php` 패키지 라우터로 새 기능을 추가 ② 부트스트랩 ABI 를 올리고 `X.php` 를 **직접 교체**(데이터 슬롯 아님).

**추가로 — 이미 존재하는 쌍을 *수정*해도 깨진다** (조건 ①). `hash_equals` 로 **바이트 동일**을 요구하므로, `X.php` 를 한 줄이라도 고치면:
> `'데이터 방식으로 바꿀 수 없는 부트스트랩 파일이 현재 설치본과 다릅니다: X.php. 이 배포본은 부트스트랩 ABI를 올리고 해당 파일을 직접 교체해야 합니다.'`

**ABI 버전 축도 있다 — `:591`:**
```php
throw new RuntimeException('이번 배포본의 T2 Extend Bootstrap ABI(' . $requiredAbi . ')와 현재 설치본(' . $installedAbi . ')이 다릅니다. editor.lib.php, config/extend.php, 루트 PHP 브리지와 admin/update_api.core.php를 먼저 직접 교체하세요.');
```

**후배 규칙 3가지:**
1. **새 공개 PHP 진입점이 필요하면 `endpoints/run.php` 를 쓴다.** 새 `X.php` + `X.core.php` 쌍을 **만들지 마라** — 애초에 쌍이 있으면 자동 발견에 걸린다.
2. **기존 `X.php` 를 고치면 게이트는 통과해도 실제 업데이트는 깨진다.** 반드시 ABI 올림 절차를 밟는다. (이건 게이트가 못 잡는다 — §2.10 의 한계.)
3. **`X.core.php` 만 고치는 것은 데이터 슬롯으로 갈 수 있다** (`:459` 가 `.core.php` 를 건너뛴다). 공개 진입점(`X.php`)이 **아닐 때만** 해당.

**보고 시:** 이 축은 `php tests/run.php` 로 검증되지만 **이 컨테이너엔 php 가 없다** → 축 ② 는 **미검증**임을 명시한다.

## 8.3 `server/dsc-api-v2/` · `server/market-api-v2/`

**실측 디렉터리 (`find server -maxdepth 2 -type d`):**
```
server/dsc-api-v2/      index.php 53,114 B + README.md 5,237 B
server/market-api-v2/   index.php 56,582 B + README.md 9,065 B
server/moderation/      data/
```

`AGENTS.md:90-91` 원문:
> - `server/dsc-api-v2/`는 별도 배포 AI API 표면. **v1 라우팅 유지**
> - `server/market-api-v2/`는 별도 배포 마켓 API 표면(v2). **v1(`third_party/index.php`) 유지, `X-T2-Market-Api` 로 세대 협상.** 판 조건 구현은 `T2Editor/config/t2_custom_profile.php` 와 **같이** 고친다 — `tests/php/custom-profile.test.php` 가 두 본문을 글자로 대조한다

### v1 라우팅 유지 — 실측 근거

| 참조 | 라인 | 값 |
|---|---|---|
| `T2Editor/admin/third_party_api.core.php:73` | `define('T2TP_LEGACY_MARKET', 'https://dsclub.kr/api/t2editor/third_party/index.php');` | v1 상수 |
| `T2Editor/admin/third_party_api.core.php:412` | `in_array($path, array('/api/t2editor/third_party/index.php','/api/t2editor/third_party/v2/index.php'), true)` | **v1 + v2 둘 다** |
| `T2Editor/admin/environment_api.core.php:39` | `const T2ENV_THIRD_PARTY_PROBE_URL = 'https://dsclub.kr/api/t2editor/third_party/index.php?action=spec';` | 진단이 v1 을 본다 |
| `T2Editor/admin/profile_api.core.php:293` | `if ($url === 'https://dsclub.kr/api/t2editor/third_party/index.php'` | v1 비교 |
| `server/market-api-v2/index.php:639` | `'legacy_url' => 'https://dsclub.kr/api/t2editor/third_party/index.php',` | v2 가 v1 을 **자기 응답에 노출** |
| `server/market-api-v2/README.md:75` | 같은 값 | 문서 |

⇒ **v1 은 v2 응답 안에 `legacy_url` 로 명시되고, 클라이언트는 두 경로를 모두 인정한다.** v1 을 지우면 `third_party_api.core.php:412` 의 경로 매칭과 `environment_api.core.php:39` 의 진단이 함께 죽는다.

### `X-T2-Market-Api` 세대 협상 — 실측

| 위치 | 라인 | 내용 |
|---|---|---|
| `server/market-api-v2/index.php:39` | — | *"`X-T2-Market-Api: 2` 또는 `?api=2` → v2 봉투 (api_version 2.0.0, 필드 추가)"* |
| `server/market-api-v2/index.php:135` | — | `header('X-T2-Market-Api: ' . (int)$T2V2_GENERATION);` — **응답 헤더로 세대 알림** |
| `server/market-api-v2/index.php:636` | — | `'negotiate_header' => 'X-T2-Market-Api',` (spec 노출) |
| `server/market-api-v2/index.php:969` | — | *"'…' 은 마켓 API 세대 N 부터입니다. 요청에 `X-T2-Market-Api: N` 헤더를 실어 보내세요."* — **세대 부족 오류 메시지** |
| `T2Editor/admin/third_party_api.core.php:496,524` | — | `'X-T2-Market-Api: ' . T2TP_MARKET_API_PREFERRED,` — **클라이언트가 v2 를 요청** |
| `T2Editor/admin/third_party_api.core.php:69` | — | *"이 판의 편집기는 요청에 `X-T2-Market-Api: 2` 를 실어 보내고, 서버가…"* |
| `server/market-api-v2/README.md:54,73` | — | 문서화 |

### `custom-profile.test.php` 가 두 본문을 글자로 대조한다 — A1 주장 검증

**✅ 정확하다. 그런데 "글자"보다 더 엄격하다 — 공백과 주석을 지운 뒤 대조한다.**

`tests/php/custom-profile.test.php:262-290`:
```php
// 같은 문법을 두 곳이 구현한다 — 편집기(여기)와 마켓 API v2(server/market-api-v2).
// … 여기서 글자 그대로 대조해 한쪽만 고치는 일을 막는다.
$serverApi = dirname(__DIR__, 2) . '/server/market-api-v2/index.php';
if (is_file($serverApi)) {
  $bodyOf = static function (string $source, string $name): string {
    $start = strpos($source, 'function ' . $name . '(');
    …brace depth 매칭…
    $body = substr($source, $open + 1, $end - $open - 1);
    $body = preg_replace('#/\*.*?\*/#s', '', $body);      // 블록 주석 제거
    $body = preg_replace('#^\s*//.*$#m', '', $body);      // 라인 주석 제거
    return preg_replace('/\s+/', '', (string)$body) ?? ''; // ★ 공백 전부 제거
  };
  $editorBody = $bodyOf(… '/config/t2_custom_profile.php', 'T2Ecustomprofileversionsatisfies');
  $serverBody = $bodyOf(… $serverApi,                            't2v2_version_satisfies');
  $t->ok($editorBody !== '', '편집기 쪽 판 조건 구현을 찾았다');
  $t->eq($serverBody, $editorBody, '마켓 API v2 의 판 조건 구현이 편집기와 같다');
  $t->includes(… $serverApi, 'T2Ecustomprofileversionsatisfies',
      '서버가 이 문법의 정본이 어디인지 적어 둔다');
}
```

**대조 대상 2개 함수:**

| 파일 | 함수 |
|---|---|
| `T2Editor/config/t2_custom_profile.php` | `T2Ecustomprofileversionsatisfies` |
| `server/market-api-v2/index.php` | `t2v2_version_satisfies` |

**⇒ `T2Ecustomprofileversionsatisfies` 를 고치면 `server/market-api-v2/index.php` 의 `t2v2_version_satisfies` 도 같은 변경에서 고쳐야 한다.** 안 하면 게이트 ⑨ 가 빨개진다.

**⚠⚠ 이 테스트의 vacuous 경로 (후배가 알아야 할 함정):** `if (is_file($serverApi))` 로 감싸져 있다. **`server/market-api-v2/index.php` 를 삭제하거나 이름만 바꾸면 4개 단언이 통째로 사라지고 테스트는 통과한다.** "게이트 통과"를 "두 구현이 일치한다"의 증거로 쓰지 마라. 이 테스트는 `t2e_assert_bootstrap_contract` 처럼 `if (is_file())` 로 감싸져 **있지 않음**과 대조한다 — 그건 `t2u_bootstrap_contract_files()` 가 `is_file` 로 걸러내는 게 아니라 `t2u_assert_bootstrap_contract()` 의 `is_file($baseFile)` 로 **명시적으로 실패**시킨다. **두 설계의 안전성 차이가 크다.**

**부수 검증(`:292-305`)** — 판정만 있고 아무도 부르지 않으면 문서일 뿐:
```php
$t->includes($installer, 't2tp_profile_scope_markets',  '마켓 API 가 프로필용 마켓 범위를 따로 좁힌다');
$t->includes($installer, "T2Ecustomprofilemarketscopes", '그 범위를 프로필 쪽 판정에서 가져온다');
$t->includes($installer, "if (!in_array(\$group, \$allowed, true)) continue;", '허용 범위 밖 마켓은 건너뛴다');
$t->includes($installer, 'T2Ecustomprofilenormalizestep', 'install 단계도 프로필 쪽 정규화기로 다시 읽는다');
$t->includes($installer, "\$input['step']", '화면이 보낸 단계를 서버가 다시 좁힌다');
$t->excludes($api, 'curl_init',   '프로필 API 는 스스로 내려받지 않는다');
$t->excludes($api, 'ZipArchive',  '프로필 API 는 스스로 압축을 풀지 않는다');
```

**후배:** `server/` 는 **별개 배포 표면**이다. `AGENTS.md:90-91` — "v1 라우팅 유지". `server/` 안의 수정이 필요하면 (a) v1 호환 유지 (b) `X-T2-Market-Api` 세대 협상 유지 (c) 판 조건은 **두 파일 동시 수정** (d) **`server/` 수정은 `AGENTS.md:319` 에스컬레이션(public API breaking)에 걸릴 수 있다** — 판단 후 부장 확인.

---

# 9. 알려진 사고·함정 로그

`AGENTS.md`/`CLAUDE.md`/`docs/`/`GITHUB-ISSUE-BODY-KO.md` 에서 **실제로 언급된** 과거 결함만 뽑았다.

| # | 무엇이 깨졌나 | 왜 | 어떻게 막았나 | 커밋 / file:line |
|---|---|---|---|---|
| **1** | **저속 기기에서 툴바 버튼 날것 노출 ~2초** | 서버 마크업이 즉시 렌더되는 반면 첫 수용량 판정(측정 ~469ms~1737ms)이 늦음. 저속 기기(Moto G4+3G)에서 판정 전 셸 밖으로 도구가 보인다 | 서버 마크업부터 `t2-toolbar-pending` 로 시작해 **셸 밖 넘침을 숨김**. JS 가 `t2-toolbar-reveal` 애니메이션으로 공개. **JS 사망 시 자동 공개 안전망** | `58726d9` "첫 수용량 판정 전 툴바 날것 노출을 서버 마크업부터 막는다" · `css/t2-visual-system.css:496-502` · `editor.core.php` · 실측 수치 `docs/ux-patch-plan-2026-08-25.md:57` (*"패치 전 첫 프레임 19버튼 중 14개 셸 밖 ~2초 노출 → 패치 후 첫 프레임부터 7버튼 안정"*) |
| **2** | **flex/grid 부모 안에서 에디터 셸 폭 0 붕괴** | `container-type: inline-size` ⇒ `contain: inline-size` 가 걸려 **"이 요소의 가로 크기는 내용에 의존해서는 안 된다"**. 셸이 shrink-to-fit 자리(flex/grid/inline-block/table/float)에 놓이면 **테두리 2px 만 남고** 안의 도구가 격자가 된다 | `width:100%` + `min-width:0` 등으로 **크기 결정권을 끊음** | `fec735d` "셸이 flex·grid 부모 안에서 폭을 잃고 무너지던 것을 고친다" · `css/t2-visual-system.css:357-361`(메커니즘 주석), `:382`(선언), `:1223`(`@supports not` 폴백) · `AGENTS.md:46` · `GITHUB-ISSUE-BODY-KO.md:14-21` |
| **3** | **모달 비율을 하한처럼 고정 → 390px 에서 동의 버튼 잘림** | `13:6` 등 비례를 `min-height` 처럼 고정하면 좁은 화면에서 내용이 넘치는데 표면이 안 커진다 | 비율을 **`max-height` 상한**으로 되돌림. `js/utils/modal.js:602` `fitSurfaceToContent()` 가 `max-height` 까지 `minHeight` 로만 늘리고, 남는 넘침은 **표면 내부 스크롤 + 마지막 실행행 `t2-modal-pinned-actions`(sticky bottom)** 로 고정 | `0eac269` "모달 표준 비율을 상한으로 되돌려 폰에서 동의 버튼이 잘리지 않게 한다" · `js/utils/modal.css:162` · `js/utils/modal.css:64-65` · `js/utils/modal.js:566,608,668,676,1222` · `AGENTS.md:44` · `tests/js/modal-basic-content-fit.test.mjs` · 실측 `docs/ux-patch-plan-2026-08-25.md:58`(*"390×844 실측: 표면 273×215 에 본문 잘림, 액션 버튼 미표시 (#79)"*) |
| **4** | **`targetOrigin:'*'`** | 문서 경계를 넘는 `postMessage` 가 **모든 출처에 신원을 알린다** | **`@t2-postmessage-opaque-origin` 사유 주석 + `event.source === …` 창 동일성 검사, 둘 다 있어야 통과**. 게다가 `sandbox` 속성 문자열을 **추측으로 예외 찾지 않는다** — 파일이 스스로 선언해야만 인정 | `tools/t2-static-check.mjs:120-139`(targetOrigin), `:159-170`(수신 가드) · `AGENTS.md:85` |
| **4b** | **broadcastChannel 수신을 Window 수신으로 오인한 오탐** | `'message'` 라는 이벤트 이름만 보고 검사하면 **서로 다른 메시징 원시타입이 한 규칙으로 뭉개진다** | 수신자 종류 구분. `BroadcastChannel`·`Worker`·`SharedWorker`·`MessageChannel`·`port1/2` 는 **`nonWindowReceivers` 로 수집해 면제**. `BroadcastChannel` 은 명세상 동일 출처끼리만 연결되고 `event.origin` 이 항상 자기 출처이며 `source` 는 `null` | `tools/t2-static-check.mjs:140-162` · `t2-static-check.baseline.json` 의 `_comment` — *"privacy-consent: BroadcastChannel 수신을 Window 수신으로 오인한 오탐이었다. 검사기가 수신자 종류를 구분하도록 고쳤다"* |
| **5** | **`t2admin.key` 비밀 커밋 전례** | 시험용 12자 비밀을 `admin/t2admin.key.php` 에 넣고 **원복을 잊은 채 커밋** | 원문 예고 — *"**검사 후 키 파일 원복** — 비밀 커밋 전례 있음"* / *"시험용 비밀값이 커밋된 전례가 있다"*. **자동 방어선은 없음** (§4.2 실측) | `AGENTS.md:79` · `tools/ux/README.md:121` · `admin/api.core.php:44,1249,1263` · `admin/index.core.php:29,247,273` · `config/first_run_api.core.php:69` |
| **6** | **설정 키를 하드 설정에 빠뜨림 → Lite 에서만 기능이 조용히 사라짐** | `t2a_default_settings()` 는 `ai.budget`·`ai.sub_agents`·`privacy`·`ai_image`·`editor.html_cache_enabled` 를 알지만 하드 설정은 몰랐다. **관리자를 쓰는 설치에서는 아무 일도 안 보인다** | `tests/php/hard-declaration.test.php` 가 `t2a_default_settings()` **함수 본문을 소스에서 잘라 eval** 해 대장에 대조. **시험이 목록을 따로 적지 않는다** — 갈라지는 것이 사고 그 자체 | `tests/php/hard-declaration.test.php:5-9,72-95` · `AGENTS.md:56-59` · 게이트 ⑨ |
| **7** | **새 공개 PHP 진입점이 데이터 릴리스로 배포 불가** | `X.php` + `X.core.php` 쌍이 **자동으로** 불변 부트스트랩 목록에 들어가고, 설치본에 없으면 하드 에러 | `t2u_assert_bootstrap_contract()` 가 `RuntimeException`. 해법 2개 제시: `endpoints/run.php` 패키지 라우터 / 부트스트랩 ABI 업데이트로 직접 교체 | `admin/update_api.core.php:430-441,452-455,457-467,591` |
| **8** | **C22 규칙이 디자인 원본을 막고 있었다** | C22("결정적 action 은 넓은 색면을 갖지 않는다")가 primary/confirm 배경을 지워 **모달 발치의 "확인"이 본문 글자와 구분되지 않게** 만들었다. 그런데 UI 스펙은 `.bm-footer-btn.confirm`·`.cp-apply-btn` 둘 다 **accent 를 통째로 칠하고 잉크를 뒤집는** 반대로 그린다 | **규칙을 버렸다.** 채우는 일은 `t2-foundation.css` 의 `t2.contract` 층이 한 곳에서 맡음. 2026-08-22 에 사다리도 다시 놓음(간격 4px 배수 → **2px 리듬**, radius 0~16). 남은 173건이 전부 규칙 쪽 문제로 밝혀짐 ⇒ **부채가 아니라 검사가 디자인 원본을 막고 있었다** | `tools/t2-css-contract.mjs:711-719` · `t2-css-contract.baseline.json` `note` |
| **9** | **`declarations()` 가 닫는 중괄호 앞 공백 때문에 at-rule 스택을 비우지 못함** | 파일 뒤쪽 선언 **전부**가 엉뚱한 컨텍스트를 달고 있었음. 2026-08-11 에 **죽은 선언 656건 + 파일 내 중복 143건** 을 실제 제거해 1157건→221건. 같은 날 **집계형 위반의 지문에서 건수를 뺐다** — 건수가 지문에 있으면 부채를 줄이는 순간 지문이 달라져 신규로 잡히고, **게이트가 부채 축소를 막는 셈** | `declarations()` 수정 + fingerprint 정규화(`:728`) | `tools/t2-css-contract.mjs:731`(note) · `:723-727` |
| **10** | **"Law-Aligned Design System 2026-08" 일괄 패치가 추측한 클래스명을 겨냥** | `.t2-privacy-surface`(실제 `.t2privacy-dialog`) · `.t2-nsfw-overlay`/`.t2-nsfw-panel`(실제 `.t2-nsfw-dialog-overlay`/`.t2-nsfw-dialog`) · `.t2-privacy-consent`/`-notice`/`-gate`(**없음**) ⇒ 개인정보 모달이 제품 규칙 11개 그룹을 전부 빗나감 | **공개 어휘 문서 생성** — `css/DESIGN-SYSTEM-VOCABULARY.md`. "지워야 할 죽은 CSS"와 "지키기로 한 공개 어휘"의 구분선 | `T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md:11-23` · `tools/t2-css-contract.mjs:74-77` |
| **11** | **`fonts.css` 의 unlayered `.material-icons{display}` 가 레이어 안 모든 아이콘 규칙을 이김** | 테마 아이콘 교체가 죽어 있었다 | `UNLAYERED_OK` 4개 목록으로 명시적 관리 | `tools/t2-css-contract.mjs:44-49` |
| **12** | **분할 표면 iframe 은 opaque origin 이라 origin 비교가 불가능** | 같은 출처 허용 토큰이 없는 분할 표면. `origin` 비교가 불가능한 경계라 **어떤 검사를 해도 신뢰를 세울 수 없다** | **양쪽 모두 창 동일성 검사**(`event.source === parent`)로 신뢰를 세우고 `@t2-postmessage-opaque-origin` 으로 선언. 자식 쪽에는 없던 `event.source === parent` 검사를 **추가**했다 | `t2-static-check.baseline.json` `_comment` 2026-08-11 해소 항목 |
| **13** | **검증 도구의 거짓말 3건** (`docs/ux-patch-plan-2026-08-25.md:69-77`) | ① 스크린샷에서 아이콘 전부 빈 박스 + 폰트 페이스 `error` — **측정 환경에 fontconfig·시스템 폰트가 없었다.** 제품 결함 아님 ② `setAttribute of null` + 다크 미적용 — 에이전트의 `addInitScript` 가 `documentElement` 생성 **전**에 도는 자기 버그 ③ "터치로는 오버플로가 안 열린다"(오판 직전) — `.t2-toolbar` 안만 세던 지표 탓. **서브툴바는 별도 컨테이너에 열고 터치로 정상 개방** | 잡은 방법: `data:` URL 폰트는 로드됨 → 환경 특정 / **스택이 내 스크립트 줄을 가리킴** / **컨테이너 상태 직접 측정** | `docs/ux-patch-plan-2026-08-25.md:69-77` |
| **14** | **도구 서명이 정확하지 않은 화면을 clean 으로 돌려준다** | 404 도 페이지이므로 위반 0건. URL 하나만 어긋나도 생김 — **실제로 `BASE` 가 404 를 가리키는 동안 그랬다** | `SURFACE` 가 `stage` 를 결과에 실고, T2Editor 화면이 아니면 `report()` 가 clean 대신 경고를 돌려준다 | `tools/ux/t2-ux-check.mjs:257-259` · `tools/ux/README.md:108-117` |
| **15** | **`AGENTS.md` 의 CSS 라인 인용 6건 중 4건이 낡음** (본 조사 신규) | 파일이 이동/삽입되면 줄번호가 무声으로 어긋난다 | — | §6.7 표. **3번이 `GITHUB-ISSUE-BODY-KO.md:19` 로 전파** |
| **16** | **이 컨테이너에서 `node tests/run.mjs` 가 4건 실패** (본 조사 신규) | `editor-skin-tab.test.mjs:38` 의 `spawnSync('php')` 가 **가드 없음** → `php.status === null` → `JSON.parse(null)` → `TypeError`. `merge-integrity` 는 스킵하는데 이건 **크래시** | (아직 미수정 — 부장 판단) | `tests/js/editor-skin-tab.test.mjs:38-46` · §2.7 |

---

# 10. 새 에이전트 온보딩 체크리스트 (20개)

**순서대로 실행하라.** 각 항목의 "왜" 는 생략하면 후배가 건너뛴다.

| # | 행동 | 왜 |
|---|---|---|
| **1** | `cd /workspace/T2Editor-v11` — **저장소 루트에서 모든 명령을 돌린다** | 도구·시험은 패키지 밖(`tools/ tests/`)이고 검사 대상만 `T2Editor/` 다. 루트를 벗어나면 `find` 스캔이 빗나간다 (`AGENTS.md:4`, `t2-release-gate.sh:42`) |
| **2** | `git fetch origin && git rev-parse HEAD && git rev-parse origin/main` — **다르면 멈춘다** | 다르면 미push 커밋가 있다. 그 위의 어떤 라인 인용도 신뢰 불가 (`AGENTS.md:16-17`) |
| **3** | `gh issue list --label agent:t2editor --state open --limit 100` | 이것이 실제 백로그. **메모리를 대신 쓰지 마라** (`AGENTS.md:204-205`) |
| **4** | `command -v node php python3` 를 직접 쳐본다 | **`php`·`python3` 없으면 게이트를 통과할 방법이 없다**(§2.6). 모르고 돌리면 "게이트가 빨갛다"를 환경 탓으로 잘못 진단한다 |
| **5** | `bash tools/t2-release-gate.sh > /tmp/gate.txt 2>&1; echo $?` — **파이프 금지** | 파이프로 `head` 하면 `$?` 가 0 으로 나와 실패를 통과로 읽는다(§2.2 실측) |
| **6** | **`--quick` 를 쓰지 않는다** | **존재하지 않는다.** 10단계 전부 돈다 (`t2-release-gate.sh`에 인자 파싱 없음, §2.3) |
| **7** | `node tools/t2-static-check.mjs` · `node tools/t2-css-contract.mjs` · `node tools/t2-content-css-build.mjs` 를 **따로** 돌려 각 단계 결과를 본다 | 이 3개는 이 컨테이너에서 rc 0 이다. 단계 단위로 보면 무엇이 깨졌는지 즉시 보인다 |
| **8** | `node tests/run.mjs` 실패 시 **php 부재 4건인지 먼저 확인**한다 | `editor-skin-tab`·`merge-integrity` 의 4건은 환경 탓이다. 그 외 실패가 있으면 진짜 회귀다 (§2.7) |
| **9** | CSS를 건드리기 전 `node tools/t2-css-contract.mjs` 를 **먼저** 돌려 **녹색을 확인**한다 | 게이트는 baseline 5건 privacy 부채가 있어도 exit 0 이다. "녹색"을 "결함 없음"으로 읽지 마라 (§2.9) |
| **10** | **`AGENTS.md` 의 CSS 라인 인용을 쓰기 전에 실제 라인을 `awk -v s=N -v e=N 'NR>=s&&NR<=e'` 로 뽑아 대조**한다 | 6건 중 4건이 낡았다. 특히 `:45` 의 `1.5s` 는 실제로는 `3s` 이고 `:46` 의 `342` 는 `.btn-danger:hover` 다 (§6.7) |
| **11** | 토큰을 쓸 때 `--t2-s*`(콘텐츠) vs `--t2-u*`(크롬/모달)를 **구분**한다 | 섞으면 C계열 위배. u 는 `100vw/15`, 파생은 `u8 u316 u4 u38 u2 u34 u78` — `u16` 은 없다 (§6.3) |
| **12** | `t2.module`/`t2.plugin` 에 `appearance`·`margin`·`display`·`position` 을 **쓰지 않는다** | `t2.product` 소유 → **계층에 져서 죽는다**(C7/C7b) (`AGENTS.md:43`) |
| **13** | `t2-foundation.css`/`t2-visual-system.css` 에 클래스 추가 시 `css/DESIGN-SYSTEM-VOCABULARY.md` 를 **같은 변경에서** 갱신 | 안 하면 "계약 없는 사문"이 된다. C5 가 예외로 두므로 **리뷰로만 막힌다** (§6.6) |
| **14** | **관리자 화면을 건드리기 전에 php 가 있는지 확인** | 없다면 §4.1 전체가 불가. `GITHUB-ISSUE-BODY-KO.md:57-61` — Node-static 으로는 php 소스가 그대로 노출된다 |
| **15** | 관리자 키를 설정했다면 **즉시** `return array('secret' => '');` 로 원복하고 `git status --short T2Editor/admin/t2admin.key.php` 가 **빈 출력**임을 확인 | 이 파일은 **추적 중이고 `.gitignore`·static-check 어느 쪽도 막아주지 않는다**(§4.2 실측) |
| **16** | **`git add .` / `git add -A` 를 쓰지 않는다** — 파일을 명시한다 | `_probe_real.php` 등 **4개 스크래치가 이미 추적 중**이라 ignore 규칙이 통하지 않는다(§3.5) |
| **17** | 새 브랜치는 `gh pr list` 를 확인한 **뒤에** `fix/<issue-number>-<short-slug>` 으로 만든다 | 상한 2~3, 같은 파일을 건드리는 PR 과 충돌 금지 (`AGENTS.md:297-307`) |
| **18** | fast-track 인지 PR-track 인지 **먼저 분류**한다 | fast-track 는 "눈에 보이는" 것만. auth/permission/schema/API 접촉, 추론이 필요했던 것, 사용자 보임 행동 변화는 PR-track (`AGENTS.md:278-292`) |
| **19** | 결함을 고치면 **같은 변경에 재현 시험**을 넣고 **고치기 전 실패를 확인**한다 | `AGENTS.md:84` — *"결함을 고치면 같은 변경에 재현 시험을 넣고 고치기 전 실패를 확인한다"*. 실패를 확인하지 않은 시험은 아무것도 지키지 않는다 (`tests/README.md:71-73`) |
| **20** | 세션이 끝나기 전 `AGENTS.md:329-337` 의 6단계를 수행한다 — worktree clean, `in-progress` 라벨 제거, 메모리 갱신, `[Agent] 진행 현황` 코멘트(한국어, fast-track 롤업 포함) | `AGENTS.md:139-140` — *"**Assume you'll be cut off mid-session.** never let uncommitted work be the only copy."* |

**⚠ 이 컨테이너에서 반드시 보고서에 적을 3가지:**
1. **php-cli 없음** ⇒ 게이트 10단계 중 3단계 미실행(`--quick` 로 우회 불가).
2. **Playwright·브라우저 없음** ⇒ `tools/ux` 시각 검증 전량 미실행. `AGENTS.md:65` — *"Chromium 단일 통과는 통과가 아니다"* — 브라우저 0건은 그보다 나쁘다. **§3.7 의 대체 축으로 보고하고, 그 사실을 명시하라.**
3. **A1 의 `.gitignore` 단정은 절반만 맞다** — `_probe_editor.php`·`_probe_embed.php` 는 **등록돼 있다**(`:13,16`). 문제는 **다른 4개가 이미 커밋되었다**는 것이다.

---

## 부록 — 이 문서의 조사 방법 (재현 가능)

모두 **읽기 전용**이었다. 파일 수정 0, 커밋 0, 서버 실행 0, 브라우저 실행 0.

| 목적 | 명령 |
|---|---|
| 환경 실측 | `command -v node php python3 gh git curl bash sh jq unzip` · `node --version` · `nproc` · `cat /sys/fs/cgroup/memory.max` |
| 게이트 단계 추출 | `awk 'NR>=84 && NR<=94 {printf "%d: %s\n", NR, $0}' tools/t2-release-gate.sh` |
| `--quick` 부재 증명 | `grep -nE 'quick\|\$1\|\$@' tools/t2-release-gate.sh` + 실제 실행 |
| 종료 코드 함정 | `bash tools/t2-release-gate.sh \| head -3; echo $?` vs `> /dev/null 2>&1; echo $?` |
| CSS 규칙 전수 | `grep -oE "C[0-9]+[a-z]?" tools/t2-css-contract.mjs \| sort -uV` |
| C22 폐기 증명 | `grep -n "C22" tools/t2-css-contract.mjs` → `:711` 주석 |
| 라인 대조 | `awk 'NR>=N && NR<=M {printf "%d: %s\n", NR, $0}' <file>` |
| gitignore 판정 | `git check-ignore -v <file>` (읽기 전용) · `git ls-files <pat>` |
| 프로브 실재 | `ls -la _probe*` |
| 커밋 검증 | `git log --oneline -1 <hash>` (3개 해시 전부 실재 확인) |
| 브랜치/라벨 관행 | `git log --oneline -30`, `git log --no-merges --oneline -30`, `grep -c 'Refs #'` / `'Closes #'` |
| playwright 가용성 | `node -e "import('@playwright/test')…"`, `ls node_modules`, `ls /opt/` |

**`git` 을 쓴 명령은 전부 읽기 전용**(`log`·`ls-files`·`check-ignore`·`rev-parse`·`ls-tree`)이다. `add`·`commit`·`push`·`checkout`·`reset` 은 **한 번도 실행하지 않았다.**
