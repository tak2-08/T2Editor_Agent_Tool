# T2Editor v11 — 현재 사실 오리진트 (Hotspots)

> **이 문서의 성격**: `data/catalog/` 가 "무엇이 있는가"를 세고, `knowledge/v11-*.md` 가 "어떻게 동작하는가"를 설명한다면, 이 문서는 **"무엇이 지금 참인가"** 를 담는다.
> 모든 항목은 부장(CEO)이 정본에서 직접 확인했거나 기계 도구가 확인했다. 확인하지 못한 것은 **"미확인" 이라고 적었다** — 추측으로 채우지 않는다.
> 스캔 기준: 정본 `tak2-08/T2Editor-v11` @ `57a8b5f` (2026-09-28), 브랜치 `main`.

```bash
node tools/t2at.mjs status     # 이 기준이 지금도 유효한지
node tools/t2at.mjs doctor     # 부패 여부
```

---

## 0. 한 문장 요약

T2Editor v11 은 **821파일 · 29.1MB** 배포 패키지이고, 공개 진입점은 **11개**이며, 설정 표면은 **설정키 239개**로 하드 설정에 선언되어야만 관리 화면에서 저장된다. 그리고 **정본 규범 문서(`AGENTS.md`) 자체가 4곳에서 라인이 낡고 1곳에서 내용이 틀렸다** — 그래서 이 저장소의 도구가 존재한다.

---

## 1. 숫자 요약 (기계 판정, `data/catalog/`)

| 항목 | 값 | 근거 |
|---|---|---|
| 패키지 파일 수 | 821 | `T2Editor/` 전체, `data/` 제외 |
| 패키지 부피 | 29,113,952 B | 동일 |
| 최상위 계층 | 20개 디렉터리 | `inventory.csv` |
| JS / PHP / CSS / JSON | 245 / 235 / 65 / 129 | 확장자 분포 |
| 플러그인 디렉터리 | **17** | `plugin/*/` |
| 기본 등록 배열 | **16** | `T2Editor/core/editor.core.php:138-160` |
| 전용 로더로 실리는 플러그인 | **1** (`paste_migrate`) | `T2Editor/extend/editor/php/t2paste_migrate_loader.php:2` |
| 설정 키(리프) | **239** | `T2Editor/config/t2_hard_config.php` root `:4` |
| 설정 최상위 그룹 | 3 (`settings` · `surface` · `trusted_proxy_ips`) | 동일 |
| 공개 진입점 | 11 | `T2Editor/endpoints/` |
| 릴리즈 게이트 단계 | 10 | `tools/t2-release-gate.sh:84-94` |
| CSS 계약 규칙 | 16 | `tools/t2-css-contract.mjs` |
| 시험 | 304 파일 | `tests/` (저장소 루트, 패키지 밖) |
| 로케일 | 5 | `T2Editor/locales/` |
| 번들 라이브러리 | 12종 · 13.1 MB | `T2Editor/vendor/` |
| v1~v10 릴리즈 | **93** (A2가 말한 94는 틀림) | `data/legacy/release-index.json` |
| 실제 배포일 범위 | 2025-02-15 ~ 2026-07-27 | 릴리즈 본문 메타표 |

> ⚠ **플러그인 17 vs 16 함정.** 디렉터리 개수(17)와 기본 등록 배열 개수(16)는 다르다. `paste_migrate` 는 `button.json` 이 아니라 `plugin.json` 을 쓰고 전용 로더가 싣는다. "등록된 플러그인 수"를 물으면 16 이 정답이다.

---

## 2. 🚨 즉시 알아야 할 것 5가지

### 2.1 pdf.js CVE-2024-4367 — v11 에서도 미패치 (확신 99%, 부장 독립 재현)

- 번들: `T2Editor/vendor/pdfjs/pdf.min.js` — `apiVersion:"3.11.174"` (CVE 영향 범위 `< 4.2.67`)
- 근거: `T2Editor/vendor/pdfjs/pdf.min.js:110580` — `FontFaceObject{constructor(t,{isEvalSupported:e=!0, ...}` → **기본값이 참**
- 근거: `T2Editor/vendor/pdfjs/pdf.min.js:112026` — `...sEvalSupported&&s.FeatureTest.isEvalSupported){const t=[];` → eval 경로가 실제로 열린다
- 호출부: `T2Editor/plugin/file/pdf_view.core.php:226-232` — `getDocument({url, withCredentials:false, maxImageSize:16777216, disableAutoFetch:false, disableStream:false})`. **`isEvalSupported` 를 넘기지 않는다.**
- 도달 경로: 저권한 사용자가 올린 PDF를 관리자/다른 사용자가 파일 플러그인에서 열면 도메인 컨텍스트에서 JS 실행.
- **고치려면 1줄**: `getDocument({... isEvalSupported: false ...})`
- v10에서도 동일 결함이었다(`T2Editor-v10` 배포판 기준 별도 확인 필요 — 이 저장소의 v10 스냅샷은 없음).

### 2.2 권한 수치 3자 불일치 — 후배가 가장 자주 틀리는 것

| 출처 | 값 | 라인 |
|---|---|---|
| 배포 가이드 | `chmod -R 775` | `T2Editor/guide.txt:63` |
| 코어 설치 UI (사용자에게 말하는 값) | **707** | `T2Editor/extend/admin/js/t2_first_run_guide.js:31,34,47,51,81,82,482,570` |
| 코드가 실제로 만드는 값 | **0755** | `T2Editor/config/t2_storage.php:225,298` · `T2Editor/config/t2_cms_data.php:29` |

- 코드는 `chmod` 을 강제하지 않는다. 0755 로 만들고 **쓰기 시험이 실패하면 UI가 707 을 권한다.**
- 따라서 "v10 은 707, v11 은 775" 라는 서술은 **절반만 옳다**. 진짜는: **v10 도 707 이었고, v11 도 코어 UI 는 707 이며, 가이드만 775 다.**
- 전면 배치: 가이드를 고치거나 코어를 바꾸거나. 지금은 가이드가 유일하게 틀렸다.

### 2.3 `--quick` 플래그가 존재하지 않는다

- `tools/t2-release-gate.sh` 에 **인자 파싱이 없다**. `getopts`·`case "$1"`·`$# -gt 0` 전부 없음.
- `--quick` 은 **주석 `tools/t2-release-gate.sh:11` 에만** 적혀 있다. `bash tools/t2-release-gate.sh --quick` 은 플래그를 무시하고 **10단계를 전부** 돈다.
- `AGENTS.md:23` 도 같은 오류를 옮겼다. **`CLAUDE.md` 가 이 항목의 정본이다**(거기엔 없다).
- 참고: `bash tools/t2-release-gate.sh | head` 로 출력을 자르면 종료 코드가 0 이 된다(SIGPIPE). **파이프 뒤에 `&&` 를 붙여 성공 판정을 하지 마라.**

### 2.4 워드프레스 어댑터가 v11 에 없다

- `T2Editor/integration/cms/adapters/` = `gnuboard5.php` · `rhymix.php` · `standalone.php` **3개뿐**.
- `grep -r wordpress T2Editor/` 결과 0건.
- v10 문서가 "워드프레스 또는 웹 프로젝트의 editor 디렉터리" 를 안내한다면 **v11 기준으로는 존재하지 않는 경로**다.
- 그누보드5·라이믹스에서 업로드는 CMS 어댑터가 아니라 CMS 자체 창구로 넘긴다. CMS 관리자 연동·데이터 경로 분리는 받지 못한다.

### 2.5 `data/` 는 웹에서 노출될 수 있다

- 패키지 안 `.htaccess` 는 **루트 1개뿐**이고 내용도 캐시 규칙이다. `data/` 전용 차단 규칙이 아니다.
- 자체 가드 `T2Editor/config/t2_storage.php:222-235` 는 private DB(`t2editor_db/`)에만 기록을 남긴다.
- nginx 는 `.htaccess` 를 안 읽는다. `T2Editor/guide.txt:41` 이 요구하는 `location ^~ /t2editor/data/ { deny all; }` 를 호스트에 넣어야 한다. **에디터가 대신 해주지 않는다.**

---

## 3. 구조 규약 (깨면 게이트가 멈춘다)

### 3.1 `X.php` + `X.core.php` 브리지 쌍 = updater ABI 계약

- `T2Editor/endpoints/` 는 전부 이 쌍이다 (`install-check` · `plugin-sandbox-worker` · `run` · `t2_content_style` · `t2_css_min` · `t2_js_min`).
- `T2Editor/admin/update_api.core.php:430-441` 가 이 쌍을 **자동 발견**해 불변 목록에 넣고, `:457-467` 이 목록에 없는 신규 진입점을 `RuntimeException` 으로 막는다.
- **새 공개 진입점을 만들면 갱신 경로가 깨진다.** 계약이 필요하면 이슈를 세우고 승인을 받는다.

### 3.2 설정 키는 하드 설정에 같이 선언한다

- `T2Editor/config/t2_hard_config.php` 는 값 파일이 아니라 **이 배포본이 아는 설정 표면의 선언**이다(총 384줄, root 배열 `:4`).
- 거기 없으면 관리 화면에서 저장해도 읽는 쪽에서 벗겨진다(`T2Editor/config/t2_hard_contract.php:19-23`).
- `T2Editor/tests/php/hard-declaration.test.php` 가 `T2Editor/admin/api.core.php` 의 `t2a_default_settings()` 전체를 대장과 대조한다. **빠뜨리면 게이트가 그 키 이름을 찍고 멈춘다.**
- 키가 데이터인 자리(플러그인 id·아이콘)는 **빈 배열**로 열어 둔다.

### 3.3 CSS 는 두 사다리를 섞지 않는다

- `--t2-s*` = 2px 리듬·4px 사다리 (콘텐츠 흐름)
- `--t2-u*` = u/16 배수 (크롬·모달). 정의: `T2Editor/css/t2-foundation.css:366,376,428,433` — **`@supports (width:1cqi)` 가드 안에서만 유효**(`:368-374`). 가드 밖 엔진에서는 u 가 0 이 되어 크롬 전체가 붕괴한다.
- 하드 실패 규칙: `tools/t2-css-contract.mjs:763` `hardFail = C1 · C2`
- 공개 어휘 목록: `tools/t2-css-contract.mjs:77` `PUBLISHED_VOCAB` = `css/t2-foundation.css`, `css/t2-visual-system.css`. 갱신 대상 문서는 **`T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md`** 다(`AGENTS.md:43` 이 아니라).
- `C22` 는 폐기되었다(`:711-719` 제거 주석 전문). `C16`·`C17` 은 없다. **새 규칙 번호를 지어내지 마라 — 목록은 `datasets/css-contract.csv` 가 진실이다.**

### 3.4 外형 소유권은 `t2.product` 레이어에 있다

- `t2.module` / `t2.plugin` 이 `appearance`·`margin`·`display`·`position` 을 선언하면 레이어에 지고 죽는다.
- JS `<style>` 주입 금지(`T2Editor/js/toolbar.js` 전례), unlayered 시트 금지 — `C1`/`C2`/`C7b` 가 잡는다.

---

## 4. 정본 문서(`AGENTS.md`)의 알려진 오류 — 인용하기 전에 반드시 확인

2026-09-28 부장·A1·B2가 독립 실측한 결과. **이 표가 이 저장소의 존재 이유다.**

| 인용처 | 적혀 있는 것 | 실제로는 | 판정 |
|---|---|---|---|
| `AGENTS.md:45` | `t2-visual-system.css:446`, `0s 1.5s forwards`, "19개 버튼" | `t2-visual-system.css:496-502`, **`:498` = `0s linear 3s`**, 버튼 19 중 14 | 🚨 **라인 + 내용 둘 다 틀림** |
| `AGENTS.md:69` | `t2-foundation.css:308` | `:375` (`@supports` 가드) / `:366,376,428,433` (정의) | ⚠ STALE |
| `AGENTS.md:68` | `modal.css:29,65` | ✅ 일치 | ✅ 정확 |
| `AGENTS.md:23` | `--quick` 플래그 | 인자 파싱 없음 — 플래그 무시 | 🚨 **존재하지 않는 기능** |
| `AGENTS.md:45` 오염 전파 | — | `GITHUB-ISSUE-BODY-KO.md:19` 로 복사됨 | ⚠ 전파됨 |

- 부장 확인: `tools/t2-css-contract.mjs:711` "C22 는 없어졌다" 주석 전문 존재. `:744` 에서 C1~C4 라벨 확인.
- `_probe_editor.php`·`_probe_embed.php` 는 `.gitignore:13,16` 에 **등록돼 있다**. 그러나 `_probe_real.php` 등 4개가 **이미 커밋**돼 있어 ignore 가 무효다 — 새 프로브를 만들 때 이름이 자동 보호되지 않는다는 뜻.

---

## 5. 이 환경에서 못 하는 일 (측정값, 2026-09-28)

| 항목 | 상태 | 근거 |
|---|---|---|
| `php` | **없음** | `command -v php` 실패 |
| `python3` | **없음** | `command -v python3` 실패 |
| Playwright | **없음** | `/opt/pw-browsers` 없음, `@playwright/test` `ERR_MODULE_NOT_FOUND`, 크롬 4종 전무 |
| cgroup memory.max | 2 GiB | 브라우저·병렬에 제약 |
| `node tests/run.mjs` | **5819/5823 에서 크래시** | `tests/js/editor-skin-tab.test.mjs:38` 의 `spawnSync('php')` 가 무가드 — `JSON.parse(null)` → `TypeError`. 같은 스위트에서 `merge-integrity` 는 우아하게 스킵하므로 **이건 버그다** |

→ 이 환경에서 할 수 있는 검증 축은 **정적 검사 + 카탈로그 대조 + 인용 검증** 세 가지다. `node tools/t2at.mjs doctor` 가 그 셋을 한 번에 돌린다.

---

## 6. 미확인 목록 (아무도 아직 못 본 것 — 탐욕적 삭제)

이 목록에 있는 것을 추정으로 채워 쓰지 마라. 채우면 이 저장소가 처음에abay 있던 문제(근거 없는 서술)로 되돌아간다.

1. 커밋 `6a50052` "이미지 data URL 모델 상한·업로드 전환" 의 실제 변경 내용 — git 사용 금지 지침으로 B1 이 못 봄.
2. `T2Editor/config/get_upload_config.php` 가 인증을 요구하는가.
3. `G5_DISABLE_ORIGIN_CHECK` 로 Gnuboard5 출처 검사를 끈 뒤, 편집기 자체 동일 출처 검사(`T2Esameorigin`)가 남는가.
4. 그누보드5 어댑터의 `t2editor_g5_ip_decide` 내부 로직.
5. `hls.js` · `p2p-media-loader` · `peerjs` · `jsqr` 의 번들 내부 실제 버전 문자열 (기재된 `VERSIONS.json` 만으로는 불충분 — `data/catalog/vendor.json` 도 동일 한계).
6. `T2Editor/core/editor.core.php:1367` 이 참조하는 서버 NSFW URL — `T2Editor/config/nsfw_api_server.php` **파일 없음**(404 호출로 조용히 필터가 죽는다). v9.1.0 서버 모드 중단과 연결되는지 미확인.
7. v10 배포판 스냅샷이 이 환경에 없어 §2.1·§2.2 의 v10 비교는 문서 근거다.
8. 라이선스 세대 1.0.1 / 2.0.0 경계의 1건 — A2 수기 판독과 부장 파서가 갈린다(`knowledge/legacy-v1-v10.md` 감사 블록 참조).

---

## 7. 자주 쓰는 명령 (복사해 둬라)

```bash
# 이 저장소 안에서
node tools/t2at.mjs status                       # 기준 유효성
node tools/t2at.mjs doctor                       # 부패 진단 (실패 시 exit 1)
node tools/t2at.mjs verify --json                # 인용 전수 검증 + 리포트 생성
node tools/t2at.mjs query "sanitize"              # 카탈로그·지식·스킬 통합 질의
node tools/t2at.mjs refresh --write              # 정본에서 카탈로그 재생성

# 정본 안에서 (T2Editor-v11 루트)
git fetch origin && git log --oneline origin/main -5
bash tools/t2-release-gate.sh                    # 종료 코드 0 아니면 푸시 금지
node tools/t2-css-contract.mjs                   # CSS 계약 단독
node tests/run.mjs <name-filter>
php tests/run.php <name-filter>                  # 이 환경에서는 php 부재로 불가
```

---

## 8. 이 문서를 갱신하는 규칙

1. **숫자는 손으로 쓰지 마라.** `node tools/t2at.mjs refresh --write` 가 만든다. 손으로 고치면 드리프트다.
2. **문장에 붙은 `파일:라인` 은 반드시 `datasets/citations.csv` 에 `must_contain` 토큰을 등록하라.** 그러면 `verify` 가 **내용 변경까지** 잡는다. 라인 존재만 확인하는 것은 약한 검증이다.
3. **확인 못 한 것은 §6 에 격리하라.** 본문에 "보통 …이다" 식으로 쓰지 않는다.
4. 정본 커밋이 바뀌면 `refresh --write` → `verify` → `doctor` 순으로 돌리고 결과를 커밋 메시지에 남긴다.
