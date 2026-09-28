# 20 — 검증 게이트와 시험

## 1. 릴리즈 게이트 = 10단계 (정본 `tools/t2-release-gate.sh:84-94`)

| # | 이름 | 명령 | 줄 |
|---|---|---|---|
| 1 | PHP 구문 검사 | `php_syntax` | 84 |
| 2 | JS 구문 검사 | `js_syntax` | 85 |
| 3 | JSON 구문 검사 | `json_syntax` | 86 |
| 4 | 매니페스트 스키마 | `manifest_schema` | 87 |
| 5 | 정적 검사 | `node tools/t2-static-check.mjs` | 89 |
| 6 | CSS 계약 검사 | `node tools/t2-css-contract.mjs` | 90 |
| 7 | 발행 본문 시트 일치 | `node tools/t2-content-css-build.mjs` | 91 |
| 8 | 회귀 시험 (JS) | `node tests/run.mjs` | 92 |
| 9 | 회귀 시험 (PHP) | `php tests/run.php` | 93 |
| 10 | 런타임 산출물 미커밋 | `runtime_artifacts` | 94 |

**순서가 규약이다**: 정적 검사의 release-artifact 규칙이 PHP 시험이 만드는 `T2Editor/data/` 를 위반으로 잡는다. 그래서 정적이 PHP 보다 먼저다.

## 2. 🚨 `--quick` 은 존재하지 않는다

`tools/t2-release-gate.sh` 에 **인자 파싱이 없다.** `getopts` · `case "$1" in` · `$# -gt 0` 전부 없고, `--quick` 은 **주석 한 줄(`tools/t2-release-gate.sh:11`)** 에만 적혀 있다.

```bash
bash tools/t2-release-gate.sh --quick    # ← 플래그를 조용히 무시하고 10단계 전부를 돈다
```

정본 `AGENTS.md:23` 도 같은 오류를 옮겼다. 이 항목의 정본은 `CLAUDE.md` 다(거기엔 없다).

## 3. 🚨 파이프가 종료 코드를 삼킨다

```bash
bash tools/t2-release-gate.sh | head -20      # 실패해도 $? 가 0 이 된다 (SIGPIPE)
```

실측(2026-09-28): 정직한 값 1 / 파이프 후 거짓 0 / SIGPIPE 141.
⇒ 성공 판정을 하려면 출력을 자르지 마라. 자르려면 파일에 받고 그 파일의 내용을 봐라.

## 4. baseline 은 허용 목록이 아니라 **추적 부채**

`tools/*.baseline.json` 은 "이미 있는 위반이라 봐준다"는 뜻이 아니라 **줄여 나가는 부채**다.
- 새 위반을 baseline 에 **추가하지 마라.** 고쳐라.
- 집계형 위반(C8 처럼 "중복 선언 46건" 을 한 줄로 요약하는 것)의 **건수를 지문에 넣지 마라.** 건수를 줄이는 순간 지문이 달라져 신규 위반으로 잡히고, 게이트가 부채 축소를 막는다. (`tools/t2-css-contract.mjs:721-722`)

## 5. 검사 항목을 늘리면 두 곳을 같이 고친다

`.github/workflows/ci.yml` 과 `tools/t2-release-gate.sh` 를 **같은 변경에서** 고친다. 하나만 하면 "로컬은 녹색인데 PR 은 빨강" 이 된다.
`tests/js/release-gate-parity.test.mjs` 가 두 곳이 갈라지는 것을 막는다.

## 6. 이 컨테이너에서 실제로 되는 것 / 안 되는 것 (2026-09-28 실측)

| 항목 | 상태 | 근거 |
|---|---|---|
| `php` | ❌ 없음 | 게이트 1·3·4·9단계 불가 |
| `python3` | ❌ 없음 | `tests/js/merge-integrity.test.mjs` 가 그것을 쓴다(우아하게 스킵) |
| Playwright / `/opt/pw-browsers` | ❌ 전무 | `playwright install` 금지 규칙 + 실제 부재가 겹친다 |
| `node` | ✅ v20 | |
| cgroup memory.max | 2 GiB | 병렬·브라우저 제약 |
| `node tests/run.mjs` | ⚠ 5819/5823 에서 크래시 | `tests/js/editor-skin-tab.test.mjs:38` 의 `spawnSync('php')` **무가드** → `JSON.parse(null)` → `TypeError` |

**이 크래시는 "테스트 버그"로 보고해야 한다.** 같은 스위트에서 `merge-integrity` 는 php 부재를 우아하게 처리하므로 비교군이 된다. 버그로 고치려면 `spawnSync` 결과를 확인하고 스킵하도록 감싸라.

## 7. 임시 브랜치에서는 CI 가 돌지 않는다

`claude/**` · `agent/**` · `probe/**` · `bot/**` 네임스페이스는 `.github/workflows/` 세 워크플로의 `push` 트리거에서 제외된다(에이전트가 커밋마다 Actions 를 태우지 않기 위해).
⇒ 그 브랜치의 기계 검증은 **로컬 게이트가 대신한다.** `main` PR 에서는 그대로 돈다.

## 8. 이 저장소의 도구로 대신 검증하기

```bash
node tools/t2at.mjs doctor        # 인용 부패 · 자산 신선도 · README 광고 파일 실재 · 스킬에 실행 명령 존재
node tools/t2at.mjs verify        # 594건 인용 전수 대조
```

`doctor` 가 잡는 4종:
1. 자산이 정본 커밋보다 뒤처짐
2. 인용 부패 (`NO_MATCH` 내용 변경 / `LINE_OOB` 줄 밀림 / `UNRESOLVED` 경로 해석 실패)
3. **README 가 광고하는데 파일이 없음** ← 레거시화의 대표 증상
4. 실행 명령이 없는 스킬

## 9. 변경 후 이 저장소도 같이 본다

정본을 바꿨다면 이 저장소의 카탈로그가 낡는다.

```bash
node tools/t2at.mjs refresh --write
node tools/t2at.mjs verify --json     # NO_MATCH 가 떴다면 정본이 진짜 바뀐 것 → 지식 문서도 고쳐야 한다
node tools/t2at.mjs doctor
```

`NO_MATCH` 는 **기계가 잡아낸 정본 변화**다. 이때 `datasets/citations.csv` 의 기대 토큰을 고치는 게 아니라, **지식 문서의 설명을 고쳐야 한다** — 토큰을 고쳐서 통과시키면 감지가 죽는다(열 수 오류는 가드가 막는다).
