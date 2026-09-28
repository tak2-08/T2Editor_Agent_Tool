# 90 — 알려진 함정 색인

"이거 저번에 밟았나" 를 위한 목록. **모두 실측 근거가 있다.** 새 함정을 발견하면 여기에 한 줄로 넣고 `datasets/citations.csv` 에 인용을 건다.

## A. 문서가 코드를 앞서는 함정 (가장 위험 — 조용히 틀린 답을 준다)

| 함정 | 실체 | 근거 |
|---|---|---|
| `AGENTS.md:45` 의 `t2-visual-system.css:446` / `1.5s` / "19개" | `:496-502`, **`:498` = `3s`**, 19 중 14 | `T2Editor/css/t2-visual-system.css:496-502` |
| `AGENTS.md:69` 의 `t2-foundation.css:308` | `:375`(가드) / `:366,376,428,433`(정의) | `T2Editor/css/t2-foundation.css:366,376,428,433` |
| `AGENTS.md:23` 의 `--quick` | **인자 파싱이 없다.** 주석 `tools/t2-release-gate.sh:11` 에만 존재 | `tools/t2-release-gate.sh:11` |
| `AGENTS.md:43` 의 공개 어휘 갱신 대상 | `T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md` | `tools/t2-css-contract.mjs:77` |
| 권한 수치 | 가이드 775 / 코어 UI 707 / 코드 0755 **3자 불일치** | `T2Editor/guide.txt:63` vs `T2Editor/extend/admin/js/t2_first_run_guide.js:31,34,47,51,81,82,482,570` |
| 플러그인 수 | 디렉터리 **17**, 기본 등록 배열 **16** | `T2Editor/core/editor.core.php:138-160` |
| "워드프레스 지원" | v11 에 어댑터 없음 (`grep` 0건) | `T2Editor/integration/cms/adapters/` = 3개만 |
| `published_at` 을 배포일로 | 전 판본 8분 51초 안에 아카이브 재게시 | `datasets/release-history.csv` 의 `real_deploy_date` |
| `readme.txt` 의 `Version: 3.0.0` | 라이선스 판본이지 에디터 판본이 아니다 | `T2Editor/readme.txt:11` vs `:2` |
| "v10=707, v11=775" | 절반만 옳다. v10 도 707, v11 코어도 707, **가이드만 775** | `skills/60-security-review.md` §2 |

## B. 게이트·시험 함정

| 함정 | 실체 |
|---|---|
| `bash tools/t2-release-gate.sh \| head` | 종료 코드가 0 이 되어 **실패가 통과로 읽힌다** (SIGPIPE). 파이프 뒤 `&&` 로 성공 판정 금지 |
| `tools/*.baseline.json` 에 위반 추가 | 허용 목록이 아니라 **추적 부채**다. 고쳐라 |
| 집계형 위반(C8)의 건수를 지문에 넣기 | 건수를 줄이는 순간 지문이 달라져 신규로 잡힌다. **넣지 마라** |
| `node tests/run.mjs` | 이 환경에서 5819/5823 에서 **크래시** — `tests/js/editor-skin-tab.test.mjs:38` 의 `spawnSync('php')` 무가드 |
| 임시 브랜치에서 CI 미실행 | `claude/**` `agent/**` `probe/**` `bot/**` 는 GitHub Actions push 트리거에서 제외. 로컬 게이트가 대신한다 |
| 검사 항목을 한쪽에만 추가 | `ci.yml` 과 `t2-release-gate.sh` 를 **같은 변경에서** 고쳐라. `tests/js/release-gate-parity.test.mjs` 가 막는다 |

## C. 환경 함정 (2026-09-28 실측)

- `php` 없음 · `python3` 없음 · **Playwright 전무** · cgroup 2 GiB
- ⇒ 시각 검증이 불가능하다. **대체 축 6개**를 채우고 "시각 검증 미수행" 을 명시한다 (`skills/10-work-on-v11.md` §4.3)
- `AGENTS.md:75` 의 "Playwright 전역 설치" 서술은 **이 환경에서 거짓**이다. `/opt/pw-browsers` 도 없다.

## D. CSS·레이어 함정

- `--t2-u` 는 `@supports (width:1cqi)` 안에서만 산다. 밖에서는 **0 → 크롬 전체 붕괴**
- `container-type: inline-size` → flex/grid 부모에서 폭 0
- 모달 비율(`13:6`)은 **상한**이지 하한이 아니다
- `pending` 제거 → 저속 기기에서 버튼 19개 2초 노출 (안전망은 3초)
- `100vh` 금지는 **기계 규칙이 아니라 규약**이다 — `tools/t2-css-contract.mjs` 에 없음
- `C16`·`C17` 은 없다 · `C22` 는 폐기(`tools/t2-css-contract.mjs:711-719`). **규칙 번호를 지어내지 마라** — `datasets/css-contract.csv` 가 진실

## E. 설계·구조 함정

- **공개 진입점을 늘리면 갱신이 깨진다.** `X.php`+`X.core.php` 쌍이 updater ABI 계약이다 (`T2Editor/admin/update_api.core.php:430-441`, 차단 `:457-467`)
- 설정 키는 **같은 변경에서** `T2Editor/config/t2_hard_config.php` 에 선언해야 한다. 안 그러면 `T2Editor/tests/php/hard-declaration.test.php` 가 게이트를 멈춘다
- 외형은 `t2.product` 소유. `t2.module`·`t2.plugin` 의 `appearance`·`margin`·`display`·`position` 은 죽는다
- JS `<style>` 주입 금지, unlayered 시트 금지

## F. 보안 함정

- pdf.js CVE-2024-4367 **v11 미패치** (`skills/60-security-review.md` §3)
- `data/` 는 웹에서 노출될 수 있다 — `.htaccess` 는 루트 1개뿐
- 업로드에 신원 판정 없음 — `T2Euploadsessionstart()` 는 죽은 스텁
- `T2_NSFW_MODE='server'` 는 404 로 조용히 죽는다 — `T2Editor/config/nsfw_api_server.php` 파일 없음
- 번들 라이브러리 버전은 `VERSIONS.json` 만 믿지 마라 — **파일 안 문자열을 grep** 한다

## G. Git·작업 함정

- **정본은 GitHub.** 작업 시작 시 `git fetch origin`, 로컬 HEAD 맹신 금지
- 2026-09-24 사고: `/tmp` 정리 후 동기화 중 `git reset --hard origin/main` 으로 미커밋 4건을 잃었다. AGENTS.md 헌장(244줄)이 337줄 바이트 복구됐다
- `admin/t2admin.key*` 는 **검사 후 반드시 원복** — 비밀 커밋 전례 있음
- `_probe_editor.php`·`_probe_embed.php` 는 `.gitignore:13,16` 에 등록돼 있으나 **`_probe_real.php` 등 4개가 이미 커밋**돼 있어 ignore 가 무효. 새 프로브 이름은 자동 보호되지 않는다
- 커밋 메시지와 PR 은 **한국어** (비전문 관리자가 읽는다)

## H. 이 저장소 도구 자체의 함정

| 함정 | 대응 |
|---|---|
| `citations.csv` 에 쉼표 하나가 많으면 `must_contain` 가 밀려 **조용히 빈 칸**이 되고 내용 변경 감지가 죽는다 | `verify` 가 열 수를 검사한다. `verify --json` 은 미결합 힌트도 보고한다 |
| 오프셋 인용을 utf8 로 읽으면 멀티바이트 뒤에서 전부 어긋난다 | 도구가 압축 파일은 **latin1** 로 읽는다 |
| 경로 정규식이 **게으르면** `api` `·` `core` `·` `php` 와 `:4` 조합이 앞부분을 잃고 `.core` `·` `php` 만 남는다 | 탐욕적으로 고쳐놨다. 그래도 `verify` 로 확인 |
| `must_contain` 을 고쳐서 통과시키면 감지가 죽는다 | **정본이 바뀐 것**이다. 지식 문서의 설명을 고쳐라 |
| basename 이 중복되면 아무거나 고르면 지문이 된다 | 도구가 `UNRESOLVED` 로 남기고 후보를 보여준다. `citations.csv` 의 `resolve_to` 로 고정 |
| 테스트가 통과한다는 것이 정확하다는 뜻은 아니다 | negative control 을 돌려 봐라. 이 저장소를 만들 때도 그랬다(3종 NC 작성) |

## I. 이 목록을 갱신하는 법

새 함정을 발견하면:

```bash
# 1. 정본에서 직접 확인한다 (추측 금지)
grep -n '<심볼>' /workspace/T2Editor-v11/T2Editor/<경로>
sed -n '<line>p' /workspace/T2Editor-v11/T2Editor/<경로>

# 2. 표에 한 줄을 쓰되 반드시 파일:라인을 인용 형식으로 단다
#    예: | 새 함정 | 실체 | `T2Editor/config/t2_x.php:123` |

# 3. 내용 변경까지 감지되게 하 datasets/citations.csv 에 토큰을 건다
$EDITOR datasets/citations.csv
#   한 행:  n,문서경로,경로,라인[,resolve_to][,must_contain,이유]
#   must_contain 에는 그 줄에 **반드시 있는 문자열**을 쓴다 (내용 변경 시 NO_MATCH 로 잡힌다)

# 4. 검증한다
node tools/t2at.mjs verify --json     # 665건 전수 + 미결합 힌트 경고
node tools/t2at.mjs doctor             # 종합 진단
```

**must_contain 을 고쳐서 통과시키지 마라.** `NO_MATCH` 는 정본이 진짜 바뀌었다는 신호다.
열(쉼표) 수가 헤더와 다르면 도구가 즉시 오류로 뱉는다 — 그건 이전에 조용히 실패했던 버그다.
