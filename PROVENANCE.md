# PROVENANCE — 누가 무엇을 언제 실측했는가

지식의 출처를 한 곳에서 본다. **"그럴듯해서" 는 출처로 인정하지 않는다.**

## 기준선

| 항목 | 값 |
|---|---|
| 구축일 | 2026-09-28 |
| 코드 정본 | `tak2-08/T2Editor-v11` @ `57a8b5f0fb7d5a68d771cd598c992861ba513e3e` (private, branch `main`, **dirty**) |
| 자산 기준 커밋 | `57a8b5f0fb7d` |
| 구조/코드 증거 확보 수단 | 로컬 파일 직접 판독 · `grep`/`sed`/`find` · `node` 인라인 측정 |
| 외부 정보 | `gh api` (릴리즈·저장소 메타) 만 사용. **web 검색 0회** |
| 정본 변경 | **0건** — 이 작업은 `T2Editor-v11` 을 수정하지 않았다 |

> ⚠ 기준 시점에 정본이 **dirty**였다. 즉 `57a8b5f` 커밋이 아니라 **작업 트리 상태**를 쟀다. 인용 검증도 그 상태를 기준으로 한다. 정본이 깨끗해진 뒤 재확인하려면 `refresh --write` → `verify` 를 다시 돌린다.

## 조직

| 역할 | 담당 | 범위 |
|---|---|---|
| 사장(사람) | — | 요구 정의 · 모델 계층 지정 |
| 부장(팀장) | **이 세션(CEO/PM)** | 구조 결정 · 도구 구현 · 통합 · 감사 · **전 쓰기** |
| 과장 A1 | 서브에이전트 | v11 전체 구조 맵 |
| 과장 A2 | 서브에이전트 | v1~v10 레거시 데이터셋 |
| 과장 B1 | 서브에이전트 | v11 보안 모델 심층 |
| 과장 B2 | 서브에이전트 | 검증·작업 플레이북 |

과장은 **읽기·재현·보고만** 했다. 정본 수정 0, `gh` 쓰기 0, 커밋 0.

### 모델 계층 (이 세션 한정 — 사용자 지시)

```
사장: Space Bunny Xhigh   ·   부장/과장: Space Bunny high~Xhigh   ·   대리: medium~high
```

이것은 **이 세션의 운영 원칙**이며, 기존 조직 설정·기억·규약은 변경하지 않았다.
Space Bunny free 모델의 지원이 2026-09-30 종료이므로 이 세션에 한해VOC를 몰아 쓴다는 지시였다.
> 구현 메모: 이 환경의 `opencode` 설정에는 **에이전트별 모델 고정 기능이 없다**(`agent` 타입 선택이 실질 수단이다). 따라서 위 계층은 지시로만 고정되었고, 모델 ID 를 강제하는 설정은 추가하지 않았다. 강제하려면 provider/model 매핑 설정이 별도로 필요하다.

## 산출물별 출처

| 산출물 | 작성 | 근거 수단 | 검증 |
|---|---|---|---|
| `knowledge/v11-structure.md` | A1 | 파일 판독 499 경로 토큰 대조 | 줄번호 115건 스팟체크 → 오류 25건 정정 후 재통과. **존재하지 않는 파일 0건** |
| `knowledge/legacy-v1-v10.md` | A2 | `gh api repos/tak2-08/T2Editor-v{vN}/releases --paginate` | 판본 93건 전수. 로컬 코퍼스와 바이트 일치 10/10 계열 |
| `knowledge/v11-security.md` | B1 | 파일 판독 | 라인 스팟체크 66건 → 오류 2건 정정. **미확인 5건을 명시 격리** |
| `knowledge/v11-playbook.md` | B2 | 스크립트·워크플로 실독 + `command -v` 환경 측정 | A1 재검증 포함. **문서 오류 4건을 실측으로 확정** |
| `knowledge/v11-hotspots.md` | **부장** | 정본에서 직접 재현 (B1/B2 교차 확인) | 아래 §부정정 참조 |
| `data/catalog/*.json` | **부장(도구)** | `tools/lib/extract.mjs` | 결정적. 같은 커밋에서 같은 결과 |
| `data/legacy/*.json` | **부장(도구)** | `tools/lib/legacy.mjs` | A2 판독과 독립 재현(계열 수·날짜 범위 일치) |
| `datasets/*.csv` | **부장(도구)** | `tools/lib/csv.mjs` | JSON 에서 생성 |
| `skills/*.md` | **부장** | 위 자산 + 정본 재확인 | 전 스킬 실행 명령 존재(`doctor` 검사) |

## 부장이 직접 재현한 것 (A/B 과장 보고를 믿지 않고)

| 주장 | 확인 방법 | 결과 |
|---|---|---|
| pdf.js CVE-2024-4367 미패치 | `pdf.min.js` 오프셋 110580·112026 · 226-232 직접 확인 | ✅ **확인** (기본값 `e=!0`, 호출부 미전달) |
| 권한 수치 3자 불일치 | `guide.txt:63` · `t2_first_run_guide.js:31,34,47,51,81,82,482,570` · `t2_storage.php:225,298` | ✅ **확인** (775 / 707 / 0755) |
| `AGENTS.md:45` 내용 오류 | `t2-visual-system.css:496-502` 직접 확인 | ✅ **확인** (`:498` = `0s linear 3s`, `1.5s` 아님) |
| `--quick` 부재 | `t2-release-gate.sh:11` 주석 + 인자 파싱 패턴 전수 탐색 | ✅ **확인** (`getopts`/`case $1`/`$# -gt 0` 0건) |
| 게이트 10단계 | `t2-release-gate.sh:84-94` | ✅ **확인** |
| CSS 계약 C16/C17 부재 · C22 폐기 | `t2-css-contract.mjs:711-719` · `:744` · `:763` | ✅ **확인** |
| 워드프레스 어댑터 부재 | `T2Editor/integration/cms/adapters/` = 3개 | ✅ **확인** |
| 플러그인 17 / 등록 16 | `core/editor.core.php:138-160` · `t2paste_migrate_loader.php:2` | ✅ **확인** (과장 A1 의 "17개 등록" 은 정정) |
| 릴리즈 93건 · 실제 배포일 2025-02-15~2026-07-27 | `tools/lib/legacy.mjs` | ✅ **확인** (A2 의 "94" 는 정정) |

## 부장이 발견한 자기/과장 오류 (숨기지 않는다)

| # | 오류 | 어떻게 잡았나 | 처리 |
|---|---|---|---|
| 1 | 기존 스켈레톤의 `README.md` 가 `tools/metrics-collector.sh`·`tools/release-notes.sh` 를 광고하나 `tools/` 는 **빈 디렉터리** | 직접 `ls` | 삭제하고 실제 도구로 교체. `doctor` 에 "README 광고 파일 실재" 검사를 추가 |
| 2 | 기존 `analysis/performance.md` 의 수치(2MB→200KB, 90% 감소 등)가 **측정값이 아님** | 출처 부재 | 파일 삭제. 측정 없는 수치는 자산이 아니다 |
| 3 | 기존 `datasets/release-history.csv` 의 날짜가 전부 `2026-09-27` (= 저장소 생성일) | `published_at` 의미 착각 | 파서를 만들어 **본문 메타표**의 `실제 배포일`을 추출하도록 교체 |
| 4 | 과장 A1 "등록 플러그인 17개" | 도구가 기본 등록 배열 16개를 세면서 드러남 | `knowledge/v11-structure.md` 감사 블록에 정정 기록 |
| 5 | 과장 A1 "`_probe_*.php` 는 .gitignore 미등록" | B2 가 독립 재검증 | 반만 맞다고 정정(등록돼 있으나 **이미 커밋**되어 ignore 무효) |
| 6 | 과장 A1 "AGENTS.md 라인 6건 낡음" | B2 재검증 | **4건 STALE · 2건 정확** 으로 정정, 그중 1건은 내용 오류 |
| 7 | **도구 버그 1** — 인용 정규식에 콜론 구분자가 없었음 | `verify` 가 0건 검출 | 정규식에 `:` 추가. 그 전까지 592건이 전부 0건이었다 |
| 8 | **도구 버그 2** — 오프셋 인용을 utf8 로 읽어 멀티바이트 뒤에서 어긋남 | `NO_MATCH` 1건 | latin1 로 변경 |
| 9 | **도구 버그 3 (가장 위험)** — `citations.csv` 에 쉼표가 하나 많아 `must_contain` 5건이 **빈 칸으로 조용히 소실** | negative control 실패 | CSV 열 수 검사를 `loadHints` 에 넣어 즉시 오류로 전환 |
| 10 | **도구 버그 4** — 정규식 게으름으로 `api.core.php:4` → `.core.php:4` | `UNRESOLVED` 보고 | 탐욕적 매칭으로 교체. 코드펜스 제외도 추가 |

## 자기검증 (negative control)

검증기가 **실패할 수 없는** 상태가 아니라 실제로 잡는다는 것을 실측했다.

| NC | 조작 | 기대 | 실제 |
|---|---|---|---|
| NC1 | `must_contain` 토큰을 오염(`dir_permission`→`dir_permissionXX`) | `NO_MATCH` + 누락 토큰 명시 | ✅ `NO_MATCH` |
| NC2 | 문서 인용 라인을 EOF 밖(`guide.txt:63`→`:60000`) | `LINE_OOB` + 파일 총 줄 수 표시 | ✅ `LINE_OOB (585줄)` |
| NC3 | 경로 오타(`guide.txt`→`guideXXX.txt`) | `UNRESOLVED` | ✅ `UNRESOLVED` |
| NC4 | `citations.csv` 열 수를 8로 늘림 | 즉시 오류 | ✅ 열 수 오류 보고 |

**NC1 은 NC3 을 돌리기 전에 실패했다.** 즉 그 시점의 검증기는 "토큰이 있어도 못 잡는" 상태였고, 고치지 않았다면 감지기가 조용히 죽은 채 배포될 뻔했다.

## 미확인 (이 저장소가 답하지 못하는 것)

`knowledge/v11-hotspots.md` §6 과 `knowledge/v11-security.md` §11 에 8건이 격리돼 있다. 그중:

- 커밋 `6a50052` 의 실제 변경 내용 (과장에게 git 사용 금지 지침이 있었다)
- `get_upload_config.php` 의 인증 여부
- `G5_DISABLE_ORIGIN_CHECK` opt-out 후 대체 검사
- `hls.js`·`p2p-media-loader`·`peerjs`·`jsqr` 번들 내부 버전
- 라이선스 1.0.1/2.0.0 경계 1건 (A2 수기 판독 vs 도구 파서가 갈린다 — 합계는 둘 다 93)

**이 목록은 추정으로 메우지 않는다.** 해결하면 해당 항목을 지우고 근거를 `파일:라인` 으로 남긴다.
