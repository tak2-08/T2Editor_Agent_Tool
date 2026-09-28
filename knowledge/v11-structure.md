# T2Editor v11 — 전체 구조 맵 (A1)
---

<!-- T2Editor_Agent_Tool · 정본 지식 자산 -->

# T2Editor v11 — 전체 구조 맵

> **출처** A1(구조 과장) 작성 2026-09-28 · 정본 57a8b5f · 인용 621회 · 부장 감사 2026-09-28 완료
>
> **감사 기록 (부장)**
> ✅ 절두 검증: 인용 파일경로 499토큰 대조 — **존재하지 않는 파일 0건**. 줄번호 115건 스팟체크 후 오류 25건 정정 후 재통과.
> ⚠ **부장 정정 1건 (플러그인 등록)**: §4 는 `plugin/` 디렉터리 17개를 정확히 셌다. 그러나 **기본 등록 배열 \`$T2EDITOR_PLUGINS\`(`core/editor.core.php:138-160`) 에는 16개만 있다.** 나머지 `paste_migrate` 는 전용 로더 `T2Editor/extend/editor/php/t2paste_migrate_loader.php:2` 가 싣고, 매니페스트도 `button.json` 이 아니라 `plugin.json` 이다. 자동 등록은 `t2z_plugin_autoregister.php` 가 `t2_extend_plugin_index()`(`T2Editor/config/extend.php:2174`) 의 `autoload` 플래그만 본다. → 기계 판정: `data/catalog/plugins.json` 의 `in_default_registration` 과 `registration` 필드.
> ⚠ **부장 정정 2건 (인용 라인)**: §10-R1 표의 라인 번호는 A1 단독 실측값이다. B2 가 독립 재검증한 결과 **4건 STALE · 2건 정확** 이었고, 더 나아가 `AGENTS.md:45` 의 **내용 자체가 틀렸다**(`1.5s` → 실측 `t2-visual-system.css:498` 의 `3s`). A1 표의 `:496-502` 는 옳으나 "1.5s" 를 그대로 옮기지 않았어야 한다. 정본: `knowledge/v11-playbook.md` §6.5.
> ⚠ **부장 정정 3건 (_probe 커밋)**: §10-R3 의 "`.gitignore` 미등록" 은 반만 맞다. `_probe_editor.php`·`_probe_embed.php` 는 **등록돼 있다**(`.gitignore:13,16`). 진짜 문제는 `_probe_real.php` 등 4개가 **이미 커밋돼 있다**는 것이며, ignore 규칙은 추적 파일에 무효다.

---


> **투명 고지.** 이 문서는 `/workspace/T2Editor-v11/` 를 **읽기 전용으로** 실측한 결과다.
> 모든 수치(파일수·바이트·키 수·줄번호)는 이 세션에서 실제로 센 값이며, 추정이 들어간 항목은
> 전부 `[미확인]` 또는 "미측정"으로 적었다.
> **AGENTS.md(저장소 루트) 안의 줄번호 인용은 현재 코드와 어긋난다** — §10-R1 참조.
> 작업 범위 밖이라 파일 수정·git 명령은 실행하지 않았다.

경로 표기 규칙: 아래에서 `T2Editor/…` 는 정본 패키지(`/workspace/T2Editor-v11/T2Editor/`) 기준이고,
`tools/…` `tests/…` `server/…` 는 저장소 루트(`/workspace/T2Editor-v11/`) 기준이다.

---

## 1. 부팅/진입점 체인

### 1.1 불변(immutable) 부트스트랩 — `editor.lib.php` → `core/editor.core.php`

v11 의 진입점은 **두 파일**이다. `editor.lib.php` 는 22줄짜리 얇은 껍데기고 실제 런타임은
`core/editor.core.php`(2,359줄, 151,090 B)다.

| 단계 | 위치 | 실제 코드 |
|---|---|---|
| 1 | `T2Editor/editor.lib.php:10` | `require_once __DIR__ . '/config/extend.php';` |
| 2 | `T2Editor/editor.lib.php:16-18` | `t2_extend_admin_auth_facade_path()` 로 경로만 계산 → **파일 스코프에서** `require_once`. 그누보드5의 `$config/$member/$is_admin` 전역을 살리기 위해 함수 안이 아니라 이 자리에 둔다(주석 `editor.lib.php:12-15`) |
| 3 | `T2Editor/editor.lib.php:20` | `t2_extend_bootstrap_editor(__FILE__);` |

`config/extend.php`(139,584 B, 가장 큰 설정 파일)가 하는 첫 일:

- `T2Editor/config/extend.php:16-20` — `t2_security.php` → `t2_compat.php` → `t2_storage.php` → `t2_cms_data.php` → `t2_plugin_platform.php` 순으로 require
- `T2Editor/config/extend.php:25` — `t2editor_bootstrap_host_cms()` — 경로 상수를 만들기 **전에** 실행되어야 한다(주석 `:22-24`)
- `T2Editor/config/extend.php:99-109` — `t2_extend_minimal_config()` 결과로 `T2EDITOR_BASE_PATH` `T2EDITOR_BASE_URL` `T2EDITOR_DATA_PATH` `T2EDITOR_DATA_URL` `T2EDITOR_DB_PATH` `T2EDITOR_DB_URL` `T2EDITOR_PRIVATE_PATH` `T2EDITOR_LEGACY_PRIVATE_PATH` `T2EDITOR_DIR_PERMISSION` `T2EDITOR_FILE_PERMISSION` 을 define
- `T2Editor/config/extend.php:110` — `t2editor_storage_prepare()` (구버전 data 트리 이관 + 잠금)
- `T2Editor/config/extend.php:113-114` — `t2_private_store.php` require → `t2editor_storage_rewrite_runtime_state()`

런타임 슬롯(t2pack) 해석:

- `T2Editor/config/extend.php:203-255` — `t2_extend_runtime_pointer()`. `T2EDITOR_PRIVATE_PATH/runtime.php` 를 읽고, `runtime_path` 가 `…/t2pack/releases` 안인지(`:224-233`), `release_id` 형식(`:235`), **부트스트랩 ABI 일치**(`:236`), 계약 파일 30개 존재(`:239-242`, 목록은 `:137-172`), `asset_url` 접두사(`:243-249`)를 다섯 겹으로 검사. 하나라도 어긋나면 `t2_extend_reject_runtime()`(`:184-193`)로 base 폴백.
- `T2Editor/config/extend.php:386-397` — `t2_extend_editor_core_path()`. **`core/editor.core.php` 자리 단 하나만** 인정한다. 없으면 빈 문자열이고 호출부가拒绝한다.
- `T2Editor/config/extend.php:399-411` — `t2_extend_bootstrap_editor()` → `T2_EXTEND_RUNTIME_INTERNAL` 을 define 하고 `require $target`.

`core/editor.core.php` 안에서의 실제 include 순서:

- `T2Editor/core/editor.core.php:7` — 직접 URL 접근 차단: `T2_EXTEND_RUNTIME_INTERNAL` 없으면 404
- `:8` — `t2_extend_load_php()`
- `:10` `include T2EDITOR_PATH . '/config/t2_config.php';`
- `:11` `require_once dirname(__DIR__) . '/config/t2_editor_modules.php';`
- `:12-15` — `t2_ai.php` · `t2_ai_image.php` · `t2_privacy.php` · `t2_captcha.php`
- `:18` — `t2_permissions.php` (툴바 조립 전에 실려야 함, 주석 `:16-17`)
- `:21` — `t2_word_filter.php` (단어 목록은 브라우저로 안 나감)
- `:26-41` — `t2_license.php` 를 `@include_once` **의도적으로 중복** 로드. `T2Elicenseok()` 내 인라인 검사가 `readme.txt` 첫 4줄 해시를 `84f16df0…5c7ad` 와 비교(`:35`). 이 블록을 지우는 것은 라이선스 위반(llms.txt 참조).
- `:51-52` — `T2EDITOR_PATH` / `T2EDITOR_URL` 폴백
- `:56-59` — `config/upload_config.php`
- `:86-93` — `T2_CSS_MIN`/`T2_JS_MIN`/`T2_ASSET_BUNDLE` 기본값 전부 `true`
- `:95-96` — `t2_editor_cache.php`(코어 시트/스크립트 목록 단일 원천) · `t2_upload.php`

### 1.2 공개 진입점 브리지 패턴 — `X.php` + `X.core.php`

공개 URL은 `endpoints/`·`admin/`·`config/`·`plugin/`에 남기고 구현은 활성 런타임 슬롯의
`.core.php`로 넘긴다. 규칙:

- 브리지 본체는 3~4줄. 예 `T2Editor/endpoints/t2_css_min.php:5-6`:
  `require_once dirname(__DIR__) . '/config/extend.php';` + `require t2_extend_endpoint_target(__FILE__);`
- `T2Editor/config/extend.php:413-420` — `t2_extend_runtime_core_relative()`: `foo.php` → `foo.core.php`. `.php`가 아니거나 `..`가 있으면 빈 문자열.
- `T2Editor/config/extend.php:422-483` — `t2_extend_endpoint_target()`가 하는 게이트:
  - 설치 루트 밖 경로 → 예외(`:434`)
  - `admin/` 접두 + `T2Eadminenabled()` 거짓 → 404(`:438-442`)
  - `plugin/<id>/` 접두 + `T2Epluginaccessblocked()` → 403 `PLUGIN_IP_BLOCKED`(`:443-451`)
  - `plugin/<id>/` 접두 + `T2Epluginisactive()` 거짓 → 404 `PLUGIN_INACTIVE`(`:456-462`) — 주석 `:452-455`가 "관리자가 UI에서 끄면 서버 엔드포인트도 사라져야 한다"고 이유를 밝힌다
  - API 게이트 매핑(`:467-471`): `upload`/`ai`/`nsfw`/`remote` 네 종류
  - `T2Eapiisallowed()` 또는 `T2Esecurityfileallowed()` 실패 → 403(`:472-478`)
- **새 `X.php`+`X.core.php` 쌍을 만들 수 없다.** `T2Editor/endpoints/t2_content_style.core.php:8-17` 주석이 근거를 밝힌다 — 새 쌍은 업데이터의 부트스트랩 ABI 계약(`admin/update_api.core.php` 의 `t2u_assert_bootstrap_contract`)에 걸려 데이터 슬롯 업데이트가 거부된다. 그래서 발행 본문 시트는 `?bundle=content` 로 `t2_css_min` 에서 넘긴다(`T2Editor/endpoints/t2_css_min.core.php:15-19` + 분기 `:20`).

### 1.3 `endpoints/` 실측 (11개 파일, 51,990 B, 전부 php)

| 브리지 | 구현 | 비고 |
|---|---|---|
| `install-check.php` | `install-check.core.php` (9,669 B) | 설치 진단 HTML. `T2EDITOR_PATH/URL/BASE_URL/CMS` 상수표 + 파일 19개 존재 표 + 아이콘 폰트 실제 요청 링크 |
| `run.php` | `run.core.php` (2,929 B) | 패키지 엔트리 라우터. `?package=&entry=` → `package.json`/`plugin.json` 의 `entries` 맵. `run.core.php:6-9` 는 주석이고 require 는 `:10` — `t2_policy.php` 를 강제 require(없으면 `function_exists` 가드가 조용히 통과해 비활성 패키지 서버 엔트리가 실행됨) |
| `plugin-sandbox-worker.php` | `plugin-sandbox-worker.core.php` (10,075 B) | 샌드박스 Web Worker 조립. CSP 헤더, `plugin-sandbox-worker.js` 템플릿 4개 토큰(`/*__T2E_PLUGIN_ID__*/''` 등) 치환, 50개 전역 차단 목록 |
| `t2_css_min.php` | `t2_css_min.core.php` (10,137 B) | `?f=` 단일 / `?g=core-head\|core-tail` 묶음 / `?g=manifest&k=` 동적 / `?bundle=content` 위임 |
| `t2_js_min.php` | `t2_js_min.core.php` (8,538 B) | `?f=` 단일 / `?g=core-bootstrap\|core-runtime` 묶음 / `?g=manifest&k=` 동적 |
| — | `t2_content_style.core.php` (8,469 B) | **쌍이 없는 구현 전용 파일.** `t2_css_min` 이 위임 |

> `t2_content_style.core.php` 는 스코프 `published`(기본) / `editor`(`@layer t2.content`),
> 포맷 `css` / `js`(로더), `?when=content`(DOM 판정 게이트), `?v=<지문>` 을 받는다(`:19-27` 주석).
> `format=js` 응답은 `js/content-style-loader.js` 를 읽어 마지막에 `T2ContentStyleApply({...})` 를 붙인다(`:120-137`).

### 1.4 `admin/` 공개 진입 가능 파일 (`.php` 브리지 12개)

`api.php` · `assistant_api.php` · `builder_test_editor.php` · `environment_api.php` · `index.php` ·
`model_catalog_api.php` · `module_asset.php` · `profile_api.php` · `runtime_config.php` ·
`search_api.php` · `third_party_api.php` · `update_api.php`
(모두 `T2Editor/admin/*.php`, 대응 `.core.php` 존재. `t2admin.key.php` 는 설정 파일이라 브리지 아님)

- `T2Editor/admin/index.core.php` = 517,611 B — 관리자 셸 단일 파일
- `T2Editor/admin/api.core.php` = 135,962 B, `t2a_default_settings()` 정의는 `:485`
- `T2Editor/admin/update_api.core.php` = 211,127 B — 코어 직접 업데이트
- `T2Editor/admin/third_party_api.core.php` = 144,946 B — 서드파티 패키지 설치/제거

`config/` 쪽 공개 브리지도 같은 형태다: `ai.php` `ai_image.php` `editor_guard.php` `first_run_api.php`
`get_client_ip.php` `get_locale.php` `get_upload_config.php` `get_webrtc_config.php` `nsfw_api_browser.php`
`privacy_consent.php` `remote_proxy.php` `upload.php` `upload_ticket.php` (14개).

### 1.5 `editor.html` / `config.blade.php` / `skin.xml` — 라이믹스 전용

이 셋은 **Rhymix 에디터 스킨 규약**이며 스탠드얼론/그누보드5 경로에서는 쓰이지 않는다.

- `T2Editor/skin.xml:4-9` — `<skin version="0.2">` · `<title>` ko/en · `<version>11.0.0</version>` · `<date>2026-07-21</date>`. 주석 `:3` 이 "스킨 ID·경로는 Rhymix 등록값과 연결"이라 명시.
- `T2Editor/skin.xml:15-28` — `<colorset>` 에 `auto` / `light` / `dark` 3종.
- `T2Editor/editor.html:3` — `<config autoescape="on" />`; `:5` — `<include target="config.blade.php" />`
- `T2Editor/editor.html:8-10` — Rhymix 런타임 의존: `../../tpl/js/editor_common.js`, `xeicon.min.css`, `js/rhymix.js`
- `T2Editor/editor.html:12-18` — 인스턴스 컨테이너. `id="t2editor_instance_{$editor_sequence}"`, `data-editor-config` 에 `{$t2editor_config_json}` 주입, 본문은 `{$t2editor_rendered_html|noescape}`
- `T2Editor/editor.html:20-26` — 제출 훅 등록. `window.T2EditorRhymixSubmitters[sequence] = _submitContent`
- `T2Editor/editor.html:28-35` — `@if($enable_autosave)` 분기: `_saved_doc_title/content/document_srl/message` 숨은 입력 4개 + `window.auto_saved_msg`
- `T2Editor/editor.html:37-39` — `@if($allow_fileupload)` 분기: `../ckeditor/file_upload.html` include

`T2Editor/config.blade.php` (6,687 B)는 Rhymix 스킨 컴파일러가 `editor.html` 에 주입하는 변수
제공자다(Phinx/Blade 템플릿).

### 1.6 스탠드얼론에서 화면을 그리는 공개 함수

- `T2Editor/core/editor.core.php:787` — `editor_html($id, $content, $is_dhtml_editor = true)` — 본문 공개 진입점
- `T2Editor/core/editor.core.php:2223` — `get_editor_js($id, $is_dhtml_editor = true)` — `_submitContent` JS 블록 생성
- `T2Editor/core/editor.core.php:2330` — `chk_editor_js($id, $is_dhtml_editor = true)`
- `T2Editor/core/editor.core.php:501` `537` `581` — `_t2e_css_link()` / `_t2e_js_url()` / `_t2e_js_script()`
- `T2Editor/core/editor.core.php:601` `671` `696` `722` — `_t2e_group_endpoint_ready()` / `_t2e_manifest_group()` / `_t2e_js_core_group()` / `_t2e_css_core_group()`
- `T2Editor/core/editor.core.php:751` — `_t2e_current_admin_link()`

`get_editor_js()` 안의 발행 본문 시트 결정(`:2239-2259`): `content_style_delivery` 가
`auto`면 `T2Econtentstylehostattached()` 참일 때 `none`·아니면 `link`, `link`면 `<link data-t2-content-style="1">`,
`script`면 지문 없는 로더 `<script>`. `none` 은 아무것도 안 넣는다.

---

## 2. 계층별 실측 인벤토리

`T2Editor/` 전체: **821개 파일 · 29,113,952 B**.

| 최상위 디렉터리 | 파일수 | 총 바이트 | 확장자 분포 |
|---|---:|---:|---|
| `admin/` | 86 | 2,100,903 | php 56 · js 15 · css 14 · json 1 |
| `config/` | 92 | 1,697,163 | php 89 · js 1 · json 1 · md 1 |
| `core/` | **1** | 151,090 | php 1 |
| `css/` | 12 | 371,309 | css 11 · md 1 |
| `data/` | **0** | **0** | (빈 디렉터리. 첫 요청에서 생성 — `guide.txt` 2.1) |
| `developer/` | 30 | 203,260 | md 23 · json 3 · php 2 · mjs 2 |
| `docs/` | 45 | 428,366 | md 44 · txt 1 |
| `endpoints/` | 11 | 51,990 | php 11 |
| `examples/` | 7 | 7,777 | json 3 · js 2 · md 1 · css 1 |
| `extend/` | 20 | 241,863 | php 6 · js 6 · json 4 · css 2 · inc 1 · txt 1 |
| `fonts/` | 16 | 2,586,772 | woff2 14 · txt 1 · LICENSE 1 |
| `integration/` | 24 | 178,089 | php 21 · js 2 · xml 1 |
| `js/` | 156 | 3,210,986 | js 144 · css 10 · json 2 |
| `law/` | 34 | 232,239 | txt 34 |
| `locales/` | 5 | 113,549 | json 4 · txt 1 |
| `modules/` | 11 | 80,748 | json 8 · js 2 · css 1 |
| `plugin/` | 232 | 4,115,984 | json 96 · js 60 · php 47 · css 26 · txt 1 · md 1 · html 1 |
| `schemas/` | 5 | 163,259 | json 5 |
| `tests/` | **0** | **0** | (빈 디렉터리) |
| `vendor/` | 26 | 13,122,715 | js 13 · LICENSE 5 · wasm 3 · json 2 · bin 2 · markdown 1 |

저장소 루트 밖(패키지 외부):

| 위치 | 파일수 | 총 바이트 | 비고 |
|---|---:|---:|---|
| `tools/` | 27 | 289,272 | 검사 도구. `__pycache__/*.pyc` 2개 포함 |
| `tests/` | 623 | 4,888,899 | js 211 · php 81 · visual/ 324 + 러너 2 |
| `server/` | 22 | 643,612 | dsc-api-v2 · market-api-v2 · moderation |
| `backups/` | 10 | 125,273 | 검사 제외(§10-R2) |
| `.github/` | 4 | 24,117 | 워크플로 4개 |

큰 파일 상위(실측): `admin/index.core.php` 517,611 · `config/t2_ai_moderation.php` 205,395 ·
`admin/update_api.core.php` 211,127 · `config/extend.php` 139,584 · `admin/api.core.php` 135,962 ·
`config/t2_policy.php` 139,887 · `admin/third_party_api.core.php` 144,946 · `config/t2_privacy.php` 55,992 ·
`js/runtime/plugin-runtime.js` 94,056 · `js/utils/modal.js` 67,902 · `js/engine/plugin-sandbox.js` 70,868 ·
`js/utils/content-block.js` 133,821 · `js/utils/privacy-consent.js` 112,567 · `js/utils.js` 58,963.

서브디렉터리 실측: `js/` 아래 `editor-engine/` 8 · `engine/` 40 · `platform/` 6 · `runtime/` 23 ·
`utils/` 20(그 안 `utils/ai/` 12, `utils/ai/skills/` 2, `utils/ai/tools/` 30, `utils/markdown/` 3).
`admin/` 아래 `css/` 13 · `js/` 15 · `partials/` 1 · `sections/` 30.

---

## 3. 코어 모듈 계약

### 3.1 `core/`

파일 **하나**뿐이다: `T2Editor/core/editor.core.php` (2,359줄 · 151,090 B).
ABI 3 부트스트랩이 지정한 런타임 구현 자리(`config/extend.php:392-397`)이며,
`config/extend.php:141` 에 계약 파일 목록의 첫 항목으로 고정돼 있다.

공개 심볼: `editor_html()`(`:787`) · `get_editor_js()`(`:2223`) · `chk_editor_js()`(`:2330`) ·
`get_readme_version()`(`:497`) · `get_video_extensions()`(`:55`) ·
`T2Elicenseok()`(`:28`) · `T2Elicensenotice()`(`:37`) · `T2Etoolbarcommandkeys()`(`:220` ·
`toggleT2EditorTheme()`(`:1978`) · `toggleT2EditorTranslate()`(`:1994`) ·
`T2EtranslateMenuMoveFocus()`(`:2030`) · `T2EtranslateMenuConfigureItem()`(`:2043`) ·
`populateT2TranslateMenu()`(`:2084`) · `closeAllT2TranslateMenus()`(`:2130`) ·
`showT2TranslateToast()`(`:2139`).
내부 함수: `_t2e_load_plugin_buttons()`(`:195`) · `_t2e_render_button()`(`:243`) ·
`_t2e_button_permission_id()`(`:310`) · `_t2e_button_hidden()`(`:319`) ·
`_t2e_build_toolbar_html()`(`:329`) · `_t2e_validate_readme()`(`:442`) · `_t2e_get_status()`(`:491`).

### 3.2 `js/core.js` (4,961 B, 92줄) — 전역 심볼과 initialize 플로우

클래스 `T2Editor` 하나와 등록 API 네 개를 전역에 붙인다.

- `T2Editor/js/core.js:46-77` — `class T2Editor` 생성자. 순서:
  1. `container.querySelector('.t2-editor')` / `('.t2-toolbar')` 확보 (`:50-51`)
  2. `setupEditor()` / `init()` 이 없으면 `T2Editor runtime lifecycle module is missing` 로 throw (`:53-55`)
  3. `this.setupEditor()` — 모델 엔진이 부트스트랩 스냅샷을 뜨기 전에 편집 가능 면을 정규화 (`:57-58`)
  4. `this.engine = root.T2EcreateEditorEngine(this.editor, { compatibility: '10.5.0', editor: this })` (`:59`)
  5. 엔진 하위 핸들 붙임: `api` `uploads` `data` `autosave` `nsfw` `ai` `documentCommands` (`:60-66`)
  6. `T2ErunEditorInitializers(this)` (`:67`)
  7. `this.init()` (`:68`)
  8. 실패 시 `destroy()` 또는 `engine.T2Edestroy()` 를 시도하고 원래 예외를 다시 던진다 (`:69-75`)

공개 전역 심볼(`T2Editor/js/core.js:79-89`):
`root.T2EdefineEditorMethods` · `root.T2EdefineEditorStatics` · `root.T2EregisterEditorInitializer` ·
`root.T2EDITOR_PLUGIN_CLASSES` · `T2Editor.registerPluginClass(name, PluginClass)` · `root.T2Editor`

- `T2EdefineEditorMethods(moduleName, methods)`(`:9-17`) — `T2Editor.prototype` 에 정의. 중복 모듈/중복 메서드는 throw.
- `T2EdefineEditorStatics(moduleName, methods)`(`:19-27`) — `T2Editor` 정적 쪽.
- `T2EregisterEditorInitializer(layer, moduleName, callback)`(`:29-38`) — `layer` 는 `'engine'` 또는 `'runtime'` 만 통과(`:32`), 없으면 `TypeError`.
- `T2ErunEditorInitializers(editor)`(`:40-44`) — `['engine','runtime']` 순으로 전부 실행.
- `T2Editor.registerPluginClass`(`:83-88`) — 이름은 `/^[a-zA-Z0-9_-]+$/` 만, 생성자 함수만 받는다.

### 3.3 `js/document-model.js` (11,252 B) — Plan/Apply 블록 재조정

파일 머리말이 설계 근거를 명시한다(`:1-33`): 브라우저 DOM을 신뢰하는 레거시 방식 대신,
IME 조합 구간만 네이티브 `contenteditable` 에 맡기고 그 바깥 구조 편집만 자체 모델로 계산한다.
`format-engine.js` 와 같은 strangler-fig 패턴.

설계 원칙 3개(`:26-33`): `plan*()` 는 순수 함수(DOM 을 읽기만) · `apply*()` 만 DOM 을 바꾼다 ·
브라우저 호환성 지식은 여전히 `core.js` 가 소유.

- `T2DocumentModel.logicalLength(node)` — `:36-44`
- `T2DocumentModel.planSplit(range, currentBlock)` — `:53`. 비-collapse 선택은 `{type:'collapsed-split'}` 반환(삭제 처리는 caller 책임, `:54-58`).
- `planMerge` / `apply*` 계열이 같은 클래스 안에 이어진다 — 정확한 시그니처 목록은 이 문서 범위 밖이라 `[미확인]`.

### 3.4 `js/format-engine.js` (22,663 B) — `document.execCommand` 폴백 설계

머리말(`:4-21`): `document.execCommand` / `queryCommandState` / `queryCommandValue` 는 MDN "Deprecated".
이 파일은 표준 Selection/Range 로 재구현한 **1차 경로**이고, 실패하면 기존 execCommand 로 **폴백**한다.

- `T2FormatEngine.INLINE_TAGS`(`:25-30`) — `bold:[B,STRONG]` `italic:[I,EM]` `underline:[U]` `strikeThrough:[S,STRIKE,DEL]`
- `T2FormatEngine.WRAP_TAG`(`:32-37`) — `bold:'strong'` `italic:'em'` `underline:'u'` `strikeThrough:'s'`
- `isSupportedCommand(command)`(`:39`)
- **`_nativeToggleSelection(command)`(`:215-221`)** — 이게 폴백 경로다.
  `typeof document.execCommand !== 'function'` 이면 `false` (`:216`),
  아니면 `styleWithCSS` 를 false 로 먼저 내리고 본 명령을 호출하며(`:218-219`),
  예외는 잡아 `false` 로 접는다(`:220`).
- **폴백이 실제로 쓰이는 유일한 자리** — `toggleInline()` 안의 부분 선택 해제 분기(`:300-303`).
  주석(`:300-302`): 조상 태그 전체를 벗기면 선택 밖 서식까지 파괴되므로,
  "브라우저의 네이티브 편집 명령을 정밀 해제 경로로 한정 사용하고, 지원되지 않을 때만 기존 구조적 폴백을 유지한다".
  즉 **execCommand 는 남아 있으나 "정밀 해제" 한 용도로 한정**되어 있다.
- `queryState(editorRoot, command)`(`:225`) — 선택 시작점에서 `editorRoot` 까지 조상 노드를 훑어 태그/computed style 로 판별
- `applyColor`(`:419-432`) — 실패 시 `console.warn('[T2FormatEngine] applyColor 실패, 레거시 execCommand로 폴백:', err)` 후 `false`(`:429-431`)
- `toggleInline` 실패 경고(`:308-310`) — 동일 패턴
- `applyFontSize(pxValue, explicitRoot = null)`(`:440`) — `fontSize` 는 원래부터 execCommand 없이 `Range.surroundContents` 로 구현돼 있었고, 여기 옮기며 `applyColor()` 의 extractContents 폴백 안전망도 함께 붙었다(`:434-439`).

### 3.5 `js/toolbar.js` (49,582 B) — 셸 / pending / reveal

- `T2_SUBTOOLBAR_KEEP_OPEN_COMMANDS`(`:20-23`) — `fontSize, bold, italic, underline, strikeThrough, justifyContent, foreColor, backColor`. 나머지 명령은 서브툴바를 닫아 모달/블록 위에 겹친 아이콘 행이 남지 않게 한다(배경 설명 `:15-19`).
- **`<style>` 주입 금지 명시**(`:6-12`) — 예전엔 여기서 `<style>` 을 주입했는데 주입 스타일은 레이어 밖이라 제품 레이어를 무조건 이겼다. "배치 체계가 두 벌 살아 있었고 항상 이쪽이 이겨서" — 지금은 `css/t2-visual-system.css` 단독 소유.
- `T2Toolbar.T2Emodes()`(`:35`) — `['comfortable','compact','rail','grouped']`
- `T2Toolbar.T2Enormalizemode(value)`(`:36-41`) — 구 이름 매핑 `{balanced:comfortable, wrap:comfortable, fit:compact, scroll:rail}`, 기본 `rail`. **설정 마이그레이션 없이 삭제 금지(#268)** 주석(`:29-34`).
- `this.config = window.T2_TOOLBAR_GROUPS || this.getT2DefaultConfig()`(`:56`) — 반응형 그룹은 서버가 전역으로 심는다
- `normalizeT2LayoutConfig(value)`(`:173-180`) — `min_button_size` 를 28~40 으로 클램프, `pointer: coarse` 면 `max(44, configured)` 로 올린다
- `initT2Toolbar()`(`:182-207`) — 스킨이 밴드를 숨긴 형상(`toolbar_placement=hidden`)이면 `pending` 만 떼고 반환(`:191-193`), 아니면 8단계 초기화 후 **첫 수용량 판정 종료 시점에** `this.toolbar.classList.remove('t2-toolbar-pending')`(`:204-206`)

pending/reveal 실측 위치:
- 서버 마크업이 pending 으로 시작 — `T2Editor/core/editor.core.php:1657`(주석) · `:1662`(`<div class="t2-toolbar t2-toolbar-pending">`)
- CSS — `T2Editor/css/t2-visual-system.css:496-499` `.t2-toolbar.t2-toolbar-pending { visibility: hidden; animation: t2-toolbar-reveal 0s linear 3s forwards; }` · `:500-502` `@keyframes t2-toolbar-reveal { to { visibility: visible; } }`
- 지연 3초인 이유가 주석(`:490-494`)에 실측치로 적혀 있다: 1× 469ms · 2× 612ms · 4× 1,104ms · 6× 1,737ms.

### 3.6 `js/i18n.js` (36,959 B) + `locales/`

- 로케일 4종: `ko.json` · `en.json` · `ja.json` · `zh.json`. **각각 평탄화 키 435개, 최상위 네임스페이스 19개** (실측).
- `T2Editor/js/i18n.js:14-33` — 전역 상태: `SUPPORTED_LANGS` `DEFAULT_LANG` `I18N_MODE` `FORCED_LANG` `STORAGE_KEY='t2editor-lang'` `INJECTED_MESSAGES` `INJECTED_USER_LANG` `LANGUAGE_ALIASES` `LANGUAGE_FALLBACKS` `LANGUAGE_DIRECTIONS` `LANGUAGE_REGISTRY` `LOCALE_URLS` `LOCALE_ENDPOINT` `LOCALE_FALLBACK_URL` `LOCALE_FALLBACK_LOAD` `LOCALE_LOADS` `currentLang`
- `T2Editor/js/i18n.js:11` — 중복 로드 방지: `if (root.T2I18N) return;`
- `normalizeLang(lang)`(`:35-40`) — 소문자·`_`→`-` 정규화 후 `/^[a-z0-9]{1,8}(?:-[a-z0-9]{1,8})*$/` 검증, 63자 초과 거부
- 포맷 폴백 3단(`:290` 주석): 정적 번들 polyfill(`vendor/formatjs/t2i18n-polyfill.js`) → 네이티브 `Intl` → 단순 치환 폴백(`:338`). polyfill 부재 시 `console.warn('[T2I18N] statically bundled polyfill is unavailable, using simple format fallback:', ...)`(`:642`)
- `T2Etf` 노출 — `T2Editor/js/i18n.js:708-711`. `root.T2Utils.tf` 가 있으면 그것을, 없으면 자체 구현을 쓴다. 실제 구현은 `T2Editor/js/utils.js:17` `tf: function(key, vars, fallback)`.
- 로케일 폴백 경로 — `T2Editor/js/i18n.js:392` · `:401` · `:413` (`locale fallback unavailable` / `invalid locale fallback`)

`T2Editor/locales/README.txt:9-13` 규약: 이 폴더는 **순수 코어만** 번역한다(`js/ config/ editor.lib.php`, `common/editor/toolbar/translation/license/error` 네임스페이스). `plugin/<name>` 과 `extend/` 번역은 **포함 금지**.
플러그인 로케일: 16개 플러그인이 `locales/{en,ja,ko,zh}.json` 보유, `t2captcha` 는 `locales/` 대신 `langs/` 디렉터리.

### 3.7 설정 표면 — `config/t2_hard_config.php` 배열 리터럴 파싱 결과

`T2Editor/config/t2_hard_config.php` 는 `return array(...)` 한 개다(`:4`). 최상위 키 6개:

| 키 | 줄 | 값 |
|---|---:|---|
| `profile` | `:17` | `'max'` (또는 `'lite'`) — 관리자 화면에 노출되지 않음 |
| `surface` | `:36` | `array('format' => 1, 'enforce' => true)` |
| `admin_enabled` | `:38` | `true` |
| `cms_admin_api_enabled` | `:39` | `true` |
| `admin_ip_access_bypass` | `:41` | `false` |
| `trusted_proxy_ips` | `:43` | `array()` |
| `settings` | `:44` | 아래 26개 그룹 |

**`settings` 아래 그룹 26개 · 전 깊이 합계 635개 키** (배열 리터럴을 재귀 파싱해 실측):

| 그룹 | 키 수(전 깊이) | 선언 줄 |
|---|---:|---:|
| `ai` | 155 | `:85` |
| `upload` | 76 | `:160` |
| `editor` | 46 | `:45` |
| `ai_image` | 43 | `:126` |
| `security` | 39 | `:260` |
| `editor_design` | 36 | `:212` |
| `editor_skin` | 31 | `:221` |
| `storage` | 26 | `:190` |
| `apis` | 25 | `:243` |
| `captcha` | 21 | `:299` |
| `admin_assistant` | 18 | `:149` |
| `toast` | 16 | `:247` |
| `editor_brand` | 16 | `:232` |
| `privacy` | 14 | `:140` |
| `sanitize` | 14 | `:367` |
| `nsfw` | 13 | `:78` |
| `permissions` | 13 | `:334` |
| `translation` | 6 | `:242` |
| `toolbar_layout` | 4 | `:208` |
| `modal_behavior` | 4 | `:241` |
| `editor_snippets` | 3 | `:240` |
| `extend` | 3 | `:381` |
| `access` | 2 | `:327` |
| `word_filter` | 10 | `:352` |
| `icons` | 0 (빈 배열) | `:206` |
| `toolbar_groups` | 1 (null) | `:207` |

`config/t2_hard_contract.php` 가 이 표를 **거르는 규칙**이다. 공개 함수 20개:
`T2Ehardcontractformat()`(`:58`) · `T2Ehardcontractopenpaths()`(`:73`) · `T2Ehardcontractismeta()`(`:92`) ·
`T2Ehardcontractsurface()`(`:102`) · `T2Ehardcontractavailable()`(`:121`) · `T2Ehardcontractenforced()`(`:138`) ·
`T2Ehardcontractislist()`(`:150`) · `T2Ehardcontractisleaf()`(`:169`) · `T2Ehardcontractdeclaration()`(`:184`) ·
`T2Ehardcontractopenindex()`(`:192`) · `T2Ehardcontractwalk()`(`:210`) · `T2Ehardcontractfilter()`(`:234`) ·
`T2Ehardcontractundeclared()`(`:251`) · `T2Ehardcontractsections()`(`:265`) · `T2Ehardcontractreport()`(`:283`) ·
`T2Ehardcontractmessage()`(`:299`).

핵심 계약(:19-23): **"하드 설정에 선언되지 않은 키는 존재하지 않는다."** 값이 아니라 **키**를 본다.
값이 데이터인 구획(플러그인 id·아이콘·모듈 카탈로그·AI Tool 목록)은 두 가지로 열린다 —
하드 설정에 **빈 배열**로 적거나(`sanitize.sources` `word_filter.terms` `permissions.roles` `access.editor_blocked_ips`
`captcha.keys` `security.allowed_domains` `extend.files` 등), 코드가 `T2Ehardcontractopenpaths()` 에 적거나.
Lite·tLite 에서는 강제를 끌 수 없다(`T2Ehardcontractenforced`, :44-46).
`tests/php/hard-declaration.test.php` 가 `admin/api.core.php:485` 의 `t2a_default_settings()` 전체를 대장에 대조한다(AGENTS.md 규약).

`config/t2_config.php`(18,044 B)는 **값**의 자리다 — CMS·경로·상수. 등록/로드 순서는 여기 없다
(`:4` 주석 "Plugin registration and manual load order remain in core/editor.core.php").
상수 상향 폴리필 `str_starts_with`(`:16`) `str_ends_with`(`:23`) `str_contains`(`:30`) 를 직접 정의한다.

### 3.8 `modules/` — `t2.product` / `t2.module` / `t2.plugin` 레이어

`T2Editor/modules/` 는 **11개 파일, 8개 `module.json` 매니페스트 + 3개 js/css** 다.
레이어 이름은 CSS `@layer` 이름이며 코드가 아니라 스타일 시트에 있다.

| 경로 | id | category | order |
|---|---|---|---:|
| `modules/common/modal/module.json` | `modal` | ui | 10 |
| `modules/common/toggle/module.json` | `toggle` | ui | 20 |
| `modules/common/toast/module.json` | `toast` | ui | 50 |
| `modules/content/content-block/module.json` | `content-block` | content | 10 |
| `modules/content/upload/module.json` | `upload` | media | 20 |
| `modules/content/image-editor/module.json` | `image-editor` | media | 30 |
| `modules/content/nsfw-ui/module.json` | `nsfw-ui` | media | 40 |
| `modules/admin/admin-assistant/module.json` | `admin-assistant` | admin-consumer | 70 |

- 모듈 런타임 함수 15개 — `T2Editor/config/t2_editor_modules.php`:
  `T2Eeditormodulemanifestpaths()`(`:6`) · `T2Eeditormoduleid()`(`:34`) · `T2Eeditormoduletext()`(`:51`) ·
  `T2Eeditormodulepathvalue()`(`:58`) · `T2Eeditormodulenormalizefield()`(`:70`) · `T2Eeditormodulemanifests()`(`:78`) ·
  `T2Eeditormodedefaultlayout()`(`:165`) · `T2Eeditormodelayoutfallback()`(`:186`) ·
  `T2Eeditormodenormalizelayout()`(`:198`) · `T2Eeditormodenormalizevalue()`(`:265`) ·
  `T2Eeditormodenormalizesettings()`(`:276`) · `T2Eeditormodulecatalog()`(`:302`) · `T2Eeditormoduleruntimeconfig()`(`:350`)
- `T2Editor/config/t2_modules.php` 는 전부 `T2Eeditormodule*` 로 위임하는 구 호환 브리지다(`:2` 주석).

**레이어 선언(단일 원천)** — `T2Editor/css/t2-foundation.css:51`:
```
@layer t2.token, t2.content, t2.legacy, t2.module, t2.product, t2.plugin, t2.contract;
```
- `t2.token` = `t2-foundation.css:53-552`
- `t2.product` = `t2-foundation.css:555-639` + `t2-visual-system.css:23-4177`
- `t2.contract` = `t2-foundation.css:643-932`
- `t2.legacy` = `css/core.css:1` · `css/dark.css:1`
- `t2.module` = `js/utils/{toggle,modal,privacy-consent,content-block,content-block-group,upload-container,form-controls}.css:1` · `js/engine/nsfw-ui.css`
- `t2.content` = 발행 본문 시트(`css/content/*.css`), `t2-foundation.css:42`
- `t2.plugin` = 서드파티 플러그인 시트
- `js/engine/document-search-api.js:584` 가 이 순서를 `<style>` 로 한 번 더 선언한다(네이티브 `::highlight()` 격리용).

소유권 규칙이 파일 안에 적혀 있다: `js/utils/content-block.css:7` "이 파일은 t2.module 레이어다. t2.product(t2-visual-system.css)가 뒤에 오므로…",
`:120` "t2.module 의 margin 은 특이성과 무관하게 t2.product 의 margin-block 에 진다",
`js/runtime/word-filter.css:7` "레이어가 t2.module 이 아니라 t2.product 인 이유는 실측에서 드러났다".

---

## 4. 플러그인 시스템 계약

### 4.1 실측 — 플러그인은 **17개**(브리프의 "18개"와 다르다)

`T2Editor/plugin/` 아래 디렉터리 17개 + `readme-locales.txt` 1개.
브리프가 나열한 이름(`ai_complex clipurl code collab draw export file image link linkcard meme paste_migrate search t2captcha t2search table video`)은 정확히 17개이고 실측과 일치한다.

| id | 파일수 | 바이트 | execution_mode | platform.kind | button.json | hooks.js | plugin.json | 서버 엔드포인트 |
|---|---:|---:|---|---|---|---|---|---|
| `ai_complex` | 23 | 1,107,945 | direct | service | 1 버튼 | 있음 | 있음 | `api.php`/`api.core.php` |
| `clipurl` | 9 | 66,102 | direct | service | 1 버튼 | 있음 | 있음 | — |
| `code` | 10 | 44,361 | direct | content | 1 버튼 | 있음 | 있음 | — |
| `collab` | 30 | 833,787 | direct | service | 1 버튼 | 있음 | 있음 | `collab_number.php` `collab_number_delete.php` `collab_store.core.php` `collab_verification.php` `room.php` |
| `draw` | 10 | 79,606 | direct | content | 1 버튼 | 있음 | 있음 | — |
| `export` | 9 | 57,957 | direct | service | 1 버튼 | 있음 | 있음 | — |
| `file` | 17 | 152,550 | direct | content | 1 버튼 | 있음 | 있음 | `file_upload.php` `audio_player.php` `pdf_view.php` |
| `image` | 12 | 290,117 | direct | content | 1 버튼 | 있음 | 있음 | `image_upload.php` |
| `link` | 9 | 56,318 | direct | content | 1 버튼 | 있음 | 있음 | — |
| `linkcard` | 12 | 83,918 | direct | content | 1 버튼 | 있음 | 있음 | `linkcard_fetch.php` |
| `meme` | 13 | 81,643 | direct | service | 1 버튼 | 있음 | 있음 | `meme_api_proxy.php` `meme_proxy.php` |
| `paste_migrate` | 7 | 39,820 | direct | service | **없음** | **없음** | 있음 | — |
| `search` | 9 | 111,952 | direct | content | 1 버튼 | **없음** | 있음 | — |
| `t2captcha` | 23 | 582,577 | direct | service | **없음** | **없음** | 있음(ver 3.0.0) | `t2captcha_generate.php` `t2captcha_render.php` `t2captcha_verify.php` `entry_generate.php` `entry_verify.php` |
| `t2search` | 8 | 20,027 | direct | service | **없음** | **없음** | 있음 | `search_proxy.php` |
| `table` | 10 | 128,274 | direct | content | 1 버튼 | 있음 | 있음 | — |
| `video` | 20 | 377,217 | direct | content | 1 버튼 | 있음 | 있음 | `video_player.php` `video_view.php` |

`execution_mode` 는 17개 전부 `direct`, `platform.api_version` 전부 `1` 이다. `capabilities` 키를 선언한
번들 플러그인은 **0개**(전부 `plugin-adapter`/`sandbox` 경로). `modules` 배열(런타임 모듈 목록)은
`ai_complex`(12개)와 `collab`(11개)만 가진다.

### 4.2 등록 — 어디에 있는가

**PHP 등록 배열** — `T2Editor/core/editor.core.php:138-160`:
```php
if (!isset($T2EDITOR_PLUGINS)) $T2EDITOR_PLUGINS = [
  'link','image','video','file','table','code','linkcard','export','search',
  't2search','draw','collab','ai_complex','clipurl','meme','t2captcha'
];
```
- `T2Editor/core/editor.core.php:162-167` — 관리자가 켠 플러그인(`$GLOBALS['_T2EDITOR_AUTO_PLUGINS']`)은 중복 없이 덧붙는다. `_T2EDITOR_ADMIN_PLUGIN_ACTIVE_OVERRIDE` 가 있으면 이 경로가 통째로 죽는다.
- `T2Editor/core/editor.core.php:172` `T2EDITOR_PLUGIN_PRIORITY` · `:178` `T2EDITOR_BUTTON_ORDER` · `:183` `T2EDITOR_LEGACY_BUTTONS` — 전부 기본 `[]`
- `T2Editor/core/editor.core.php:185-188` — 네 변수를 `$GLOBALS` 로 승격
- `t2captcha` 를 목록에 넣어야 하는 이유가 주석(`:154-158`)에 있다: 빠지면 `T2Epluginisactive()` 가 거짓이 되어 공급자 스크립트도 패키지 진입점도 안 붙는다.

**디스크립터 해석** — `T2Editor/config/extend.php:2153-2174` `t2_extend_plugin_descriptor($name)`.
이름은 `/^[A-Za-z0-9_-]+$/` 만. 런타임 인덱스(`t2_extend_runtime_index()`)에 있으면 그것을, 없으면 `t2_extend_dynamic_plugin_map()` 에서 찾고 `_T2_EXTEND_PLUGIN_DESCRIPTORS` 전역에 캐시한다.
`T2Editor/config/extend.php:2176-2183` `t2_extend_plugin_index()`.

**API 시그니처 (등록 함수 4종)**

| 등록 API | 위치 | 시그니처 | 규약 |
|---|---|---|---|
| `T2Esanregisterprovider` | `T2Editor/integration/sanitize/registry.php:35` | `($id, array $provider): bool` | `label` · `priority`(int, 큰 것 먼저) · `available`(fn) · `clean`(fn(string,array):?string, `null`=의견없음) · `engine`. id는 `/^[a-z0-9_-]{1,40}$/`, 같은 id 는 나중 것이 이김 |
| `T2Epermregisterprovider` | `T2Editor/integration/permission/registry.php:31` | `($id, array $provider): bool` | `label` · `priority` · `available` · `subject` · `roles` · `decide` · `ip_rules` · `ip_decide` |
| `T2Ewfregisterprovider` | `T2Editor/integration/wordfilter/registry.php:29` | `($id, array $provider): bool` | 위와 같은 형태 |
| `T2EditorHooks.onSubmit` / `onRestore` | `T2Editor/js/hooks.js:18` / `:31` | `(pluginName, fn, priority=100)` | `fn(tempDiv)`. 같은 플러그인 재평가 시 **마지막 등록으로 교체**(중복 실행 방지, `:42-56`). 실행은 `priority` 오름차순 → `sequence` 오름차순 |

`T2Editor/js/hooks.js:6` 전역은 `window.T2EditorHooks` 한 개, 내부 배열은 `_submit` `_restore` `_sequence`.

**JS 쪽 플러그인 클래스 등록** — `T2Editor/js/core.js:83-88` `T2Editor.registerPluginClass(name, PluginClass)`.
저장소는 `root.T2EDITOR_PLUGIN_CLASSES[name]`. 이름은 `/^[a-zA-Z0-9_-]+$/`, 생성자 함수만.

**플러그인 스스로 내미는 API** — `T2Editor/config/extend.php:1136` `t2_extend_plugin_provides_api($manifest)`.
`code` 와 `table` 만 `provides_api` 를 가진다. 예 `T2Editor/plugin/code/plugin.json` 의 `provides_api.methods` = `insert`(caps `write`, risk `low`) · `read`(caps `read`).

**샌드박스 실행 모드** — `T2Editor/config/extend.php:1781` `t2_extend_plugin_execution_descriptor($name, $pluginDescriptor = null)`.
`endpoints/plugin-sandbox-worker.core.php` 는 여기서 `mode` 가 `sandbox` 또는 `split` 이고 `policy_valid`·`available` 이 참이며 `api_version === 2` 인 경우에만 워커를 조립한다.

### 4.3 매니페스트 구조 — 실제로 존재하는 것만

**`plugin/<id>/button.json` — 14개 플러그인에 존재**(paste_migrate·t2captcha·t2search 에 없음).
전부 `{"version":"1.0","buttons":[…]}` 이고 **버튼은 정확히 1개**다.

| 플러그인 | command | order | icon.type | icon.name |
|---|---|---:|---|---|
| `link` | `createLink` | 11 | material-icons | link |
| `image` | `insertImage` | 12 | material-icons | image |
| `video` | `insertYouTube` | 13 | material-icons | smart_display |
| `table` | `insertTable` | 14 | material-icons-outlined | table_chart |
| `file` | `attachFile` | 15 | material-icons | attach_file |
| `code` | `insertCodeBlock` | 16 | material-icons | code |
| `search` | `search` | 17 | material-icons | manage_search |
| `ai_complex` | `openAiComplex` | 18 | material-icons | auto_awesome (`style: "animation: t2AicShimmer 3s ease-in-out infinite;"`) |
| `linkcard` | `insertLinkCard` | 19 | material-icons | add_link |
| `meme` | `insertMeme` | 20 | material-icons | sentiment_very_satisfied |
| `clipurl` | `createClipUrl` | 21 | material-icons | qr_code_2 |
| `collab` | `collab` | 22 | material-icons | group |
| `draw` | `insertDrawing` | 23 | material-icons | brush |
| `export` | `exportHTML` | 24 | material-icons-outlined | ios_share |

- 로더 — `T2Editor/core/editor.core.php:195-215` `_t2e_load_plugin_buttons()`. 경로는 `t2_extend_plugin_descriptor()` 우선, 없으면 `T2EDITOR_PATH/plugin/<name>/button.json`(`:201`). JSON 오류는 `error_log` 로만 남기고 빈 배열(`:207-210`).
- 렌더러 — `T2Editor/core/editor.core.php:243-…` `_t2e_render_button()`. `i18nKey` 가 없으면 `T2Etoolbarcommandkeys()` 맵으로 한국어 이름을 찾는다(`:250-251`).
- 코어 버튼 10개는 하드코딩 — `T2Editor/core/editor.core.php:335-345` (`undo redo bold italic underline strikeThrough justifyContent fontSize foreColor backColor`).
- 조립 — `T2Editor/core/editor.core.php:329-397` `_t2e_build_toolbar_html()`. `order` 결정 규칙은 `$button_order` 배열 인덱스 → `btn_def['order']` → 기본 999(`:360-365`). 동점은 입력 순 유지(`:392`).
- 정본이 아닌 사본 — `T2Editor/config/extend.php:763-776` `t2_extend_plugin_button_commands()`. 262,144 B 초과 `button.json` 은 거부(`:768`). 이 목록은 `ai_launcher` 검증(`config/extend.php:826-827`)에만 쓴다.

**`plugin/<id>/plugin.json` — 17개 전부 존재.** 공통 스키마(키 이름 실측):
`id` `name` `description` `developer{name,email,site}` `version` `developed_at`
`admin{settings_supported,settings[]}` `execution_mode` `platform{api_version,kind}` `consumes_apis[]`.
선택 키: `command_effects{}` (13개) · `modules[]` (2개) · `ai_launcher{}` (12개) ·
`ai_surface{}` (10개) · `ai{}` (1개 — ai_complex) · `privacy{}` (16개) ·
`markdown{}` (6개) · `provides_api{}` (2개) · `content_block_ui` (1개 — table) · `autoload` (1개 — paste_migrate, `true`).

`consumes_apis` 허용 목록은 `T2Editor/config/extend.php:786` 의 폴백 배열(21개)과
`T2Eapicatalog()` 이다(정본이 카탈로그, `:787`). `tests/js/promoted-api-contract.test.mjs` 가 둘이
갈라지는 것을 막는다(`extend.php:784-785` 주석).

**`schemas/` 5종** — `bundled-plugin-manifest.schema.json`(42,340) · `plugin-manifest-v2.schema.json`(53,414) ·
`third-party-plugin-manifest.schema.json`(46,647) · `module-manifest.schema.json`(14,869) ·
`admin-module-manifest.schema.json`(5,989).

---

## 5. CMS 통합 계약

### 5.1 `integration/cms/adapters/` — **어댑터 3개뿐**(브리프가 든 wordpress 는 v11 에 **없다**)

`T2Editor/integration/cms/adapters/` 실측: `gnuboard5.php`(595줄) · `rhymix.php`(830줄) · `standalone.php`(15줄).
`grep -rn "wordpress" integration/ config/ core/` 결과 **0건**. v10 의 워드프레스 브리지는 v11 트리에 없다.

등록 함수 — `t2editor_cms_register_adapter($id, array $spec)` (정의는 `T2Editor/integration/cms/registry.php`).

**`standalone`** — `T2Editor/integration/cms/adapters/standalone.php:5-13`.
`priority => -1000` 이라 항상 최종 fallback. `validate_context` 는 무조건 `true`(`:8`).
`data_layout` = `$editorPath . '/data'`, `dir_permission 0755`, `file_permission 0644`(`:9-12`).

**`gnuboard5`** — `T2Editor/integration/cms/adapters/gnuboard5.php:532-592`. `priority 300`.
- `runtime_root` = `G5_PATH`(`:534`)
- `session_bootstrap` = `t2editor_g5_bootstrap` · `auth_require_path` = `t2editor_g5_common_path` · `auth_authorize` = `t2editor_g5_is_admin`(`:558-560`)
- `data_layout`(`:543-556`): `data_path` = `{G5_DATA_PATH}/editor`, `db_path` = `{G5_DATA_PATH}/t2editor_db`,
  권한은 `G5_DIR_PERMISSION`(기본 0755) · `G5_FILE_PERMISSION`(기본 0644)
- 보안 표면 7종(`:564-571`): `sanitize_html` `csrf_token` `csrf_verify` `request_origin_ok` `safe_filename` `upload_content_safe` `editor_html`.
  주석(`:562-563`): "선언하지 않으면 그 다리는 조용히 침묵하고 편집기의 자체 검사만 남는다".
- 발행 시트 부착(`:579-590`): `$GLOBALS['g5']['head_script']` 에 `<link>` 한 줄을 얹는다. `headers_sent()` 면 `false` 를 돌려 본문 표식 쪽으로 떨어진다(`:583`).

**`rhymix`** — `T2Editor/integration/cms/adapters/rhymix.php:793-829`. `priority 250`.
- `runtime_root` = `RX_BASEDIR`(`:795`)
- `data_layout`(`:802-804`): `data_path` = `{root}/files`, `db_path` 는 어댑터에 없어 `t2_cms_data.php:34` 폴백이 `…/files/t2editor_db` 가 된다
- 보안 표면 8종(`:813-820`) — gnuboard5 에 `iframe_domains` 이 추가
- 업로드는 편집기가 파일을 두지 않는다 — `handles_upload`(`:821-825`) + `upload` = `t2editor_rx_upload`(`:826`)로 네이티브 첨부 시스템에 넘긴다
- `attach_content_style` / `content_style_attached`(`:827-828`)

공통 규약 — `T2Editor/integration/cms/registry.php:3`:
"코어는 CMS 이름을 분기하지 않는다. 새 CMS는 어댑터 capability만 등록한다."
`validate_context` 로 판정하고 `data_layout` 을 받는다. 경로 정규화는 `t2editor_cms_normalize_path()`(`:7`).
`T2Editor/integration/cms/bootstrap.php` · `browser.js` · `legacy-auth-api.php` · `legacy-browser-api.js` · `legacy-php-api.php` 가 보조 층이다.

### 5.2 공급자 레지스트리 3종

| 축 | bootstrap | registry | providers | 등록 API |
|---|---|---|---|---|
| sanitize | `integration/sanitize/bootstrap.php` | `registry.php` | `host-bridge.php`(`'host'` 등록 `:79`) · `standalone.php`(`'editor'` 등록 `:14`) | `T2Esanregisterprovider` — `integration/sanitize/registry.php:35` |
| permission | `integration/permission/bootstrap.php` | `registry.php` | `host-bridge.php`(`'host'` `:66`) · `standalone.php`(`'standalone'` `:73`) | `T2Epermregisterprovider` — `integration/permission/registry.php:31` |
| wordfilter | `integration/wordfilter/bootstrap.php` | `registry.php` | `host-bridge.php`(`'host'` `:62`) · `standalone.php`(`'editor'` `:11`) | `T2Ewfregisterprovider` — `integration/wordfilter/registry.php:29` |

세 축 모두 "같은 id 는 나중 것이 이긴다(드롭인 교체)" 주석이 있다. 조회 헬퍼는
`T2Esanproviders()`(`integration/sanitize/registry.php:49`) · `T2Epermproviders()`(`integration/permission/registry.php:48`)
로, 우선순위 내림차순 + 등록 순 유지 정렬이다.

호스트 브리지 함수 — `T2Editor/integration/sanitize/providers/host-bridge.php`:
`T2Esanhostcontext()`(`:14`) · `T2Esanhostadapter()`(`:33`) · `T2Esanhostcapable()`(`:43`) ·
`T2Esanhostlabel()`(`:52`) · `T2Esanhostiframedomains()`(`:70`).
호스트 감지가 실패하면 `error_log('[T2Editor] Host detection failed inside the sanitizer bridge: ' …)`(`:23`)하고 조용히 넘어간다.

`T2Ehostsecuritysnapshot()` 이 세 축을 한 장으로 모아 주는 공개 진입점이다 — `T2Editor/config/t2_cms_security.php` (7,169 B, §8 게이트). 함수 시그니처는 `[미확인]`.

### 5.3 `integration/rhymix/`

- `integration/rhymix/addons/t2editor_content_style/t2editor_content_style.addon.php` + `conf/info.xml` — 애드온 본체
- `integration/rhymix/iframe_autoregister.php` — 임베드 호스트 자동 등록
- `T2Editor/extend/editor/php/t2_rhymix_iframe_autoregister.php` — 배포판 쪽 호출부
- 애드온을 켜면 `guide.txt` 7.3 기준으로 본문에 아무것도 안 들어가고, 꺼져 있으면 `<link>` 표식으로 자연히 떨어진다(`guide.txt` §7.3)

---

## 6. 데이터 저장 위치 매핑

### 6.1 결정 규칙 — `config/t2_cms_data.php` (53줄, 전체)

- `T2Editor/config/t2_cms_data.php:5` — `t2_cms.php` require
- `T2Editor/config/t2_cms_data.php:8-17` — `t2editor_cms_editor_url($context, $editorPath)`. `root_url` 이 있고 mount 가 root 안에 있으면 `root_url + 상대경로`, 아니면 경로에서 URL 을 만든다.
- `T2Editor/config/t2_cms_data.php:20-50` — **`t2editor_resolve_data_layout($editorPath, $editorUrl, $context)`** 가 유일한 결정점.
  - `:26` — `t2editor_cms_adapter($context['id'] ?? 'standalone')`
  - `:27` — 어댑터의 `data_layout` 을 부른다
  - `:28-30` — 비어 있으면 스탠드얼론 기본(`$editorPath/data`, 0755/0644)
  - `:31-37` — 이미 define 된 상수는 **어댑터보다 우선**. `db_path` 가 없으면 `data_path` 아래 `t2editor_db`, `private_path` 은 `db_path` 아래 `t2admin-private`
  - `:38-49` — 반환 키: `cms` `base_path` `base_url` `data_path` `data_url` `db_path` `db_url` `private_path` `dir_permission` `file_permission`

| CMS | `data_path` | `db_path` | 근거 |
|---|---|---|---|
| standalone | `<editor>/data` | `<data_path>/t2editor_db` | `integration/cms/adapters/standalone.php:9-12` + `config/t2_cms_data.php:34` |
| gnuboard5 | `<G5_DATA_PATH>/editor` | `<G5_DATA_PATH>/t2editor_db` | `integration/cms/adapters/gnuboard5.php:551-552` |
| rhymix | `<root>/files` | `<data_path>/t2editor_db` (폴백) | `integration/cms/adapters/rhymix.php:803` + `config/t2_cms_data.php:34` |
| wordpress | **해당 없음** | — | 어댑터 파일 자체가 없음 |

### 6.2 `config/t2_storage.php` (23,752 B) — 준비/이관/보호

- `T2Editor/config/t2_storage.php:12` — `t2_cms.php` require
- `T2Editor/config/t2_storage.php:17-22` — `t2editor_bootstrap_host_cms_url_base()`
- `T2Editor/config/t2_storage.php:24-29` — `t2editor_bootstrap_host_cms()` → `t2editor_cms_bootstrap_compat_constants()`
- `T2Editor/config/t2_storage.php:47-58` — `t2editor_storage_mkdir($path, $mode)`. **`is_link($path)` 면 무조건 `false`** — 심볼릭 링크를 쓰기 가능한 저장소로 받지 않는다(주석 `:48-51`).
- `T2Editor/config/t2_storage.php:289-…` — `t2editor_storage_prepare($basePath, $dataPath, $dbPath, $privatePath)`.
  `storage-layout-v2` 표식 파일(`:301`)이 있고 잔여 레거시 상태가 없으면 fast path(`:303-308`).
  아니면 `storage-migration.lock` flock 으로 이관(`:310-…`). 업로드 미디어는 **옮기지 않는다**(`:325-327` 주석 — 발행 본문이 그 주소를 그대로 들고 있다).
- `T2Editor/config/t2_storage.php:402-…` — `t2editor_storage_rewrite_runtime_state()` (런타임 포인터를 새 경로로 다시 씀)

### 6.3 `config/t2_storage_routing.php` (32,713 B) — **이름이 함정**

이 파일은 CMS 데이터 경로가 아니라 **외부 저장 서버 라우팅**이다. 머리말(`:6-30`):
(1) 이 서버 `data/` 안의 유형별 배치 — `t2editor_image/20260906` 형태. **이미 올라간 파일은 움직이지 않는다.**
(2) 유형별 외부 웹 서버 전송. 수신기는 `developer/external-storage/t2-remote-store.php` 하나뿐.

- 프로토콜 `T2E_STORAGE_PROTOCOL = 'T2E.store/v1'`(`:33`) · 시계 허용 오차 `T2E_STORAGE_CLOCK_SKEW = 300`(`:35`)
- 함수 22개: `T2Estoragecategories()`(`:39`) · `T2Estoragelayouts()`(`:47`) · `T2Estoragedefaults()`(`:61`) ·
  `T2Estoragenormalize()`(`:84`) · `T2Estoragecleanurl()`(`:126`) · `T2Estoragesettings()`(`:145`) ·
  `T2Estoragedestination()`(`:161`) · `T2Estoragenormalizecategory()`(`:173`) · `T2Estoragelocalfolder()`(`:184`) ·
  `T2Estoragesecretfile()`(`:200`) · `T2Estoragereadsecret()`(`:209`) · `T2Estoragewritesecret()`(`:224`) ·
  `T2Estorageensuresecret()`(`:243`) · `T2Estoragesignature()`(`:257`) · `T2Estorageb64url()`(`:265`) ·
  `T2Estoragetransport()`(`:283`) · `T2Estoragestreambodylimit()`(`:403`) · `T2Estoragecall()`(`:420`) ·
  `T2Estoragepublicurl()`(`:479`) · `T2Estoragestore()`(`:510`) · `T2Estoragedelete()`(`:531`) ·
  `T2Estorageexternalhost()`(`:539`) · `T2Estoragediagnose()`(`:563`)
- 비밀값은 설정 파일이 아니라 `T2EDITOR_PRIVATE_PATH` 비공개 저장소에 둔다(`:4-5`).

---

## 7. 개발 도구 · 시험 · CI

### 7.1 `tools/` 전체 파일 목록 + 1줄 목적

| 파일 | 목적 |
|---|---|
| `tools/README.md` | 도구 안내서 |
| `tools/t2-release-gate.sh` | `.github/workflows/ci.yml` 전체를 로컬 재현하는 게이트 (109줄) |
| `tools/t2-static-check.mjs` | 정적 계약 검사. 실제 사고가 난 결함 유형만 본다. 17개 검사 id (§7.5) |
| `tools/t2-static-check.baseline.json` | 정적 검사 baseline. `known` 항목 **5개** |
| `tools/t2-css-contract.mjs` | CSS 계약 검사. C계열 **20개** 식별자 (§8.4) |
| `tools/t2-css-contract.baseline.json` | CSS 계약 baseline. **`count: 0`, `entries: []`** — 부채 0 |
| `tools/t2-content-css-build.mjs` | 발행 본문 시트가 원천 파일과 일치하는지 |
| `tools/css_dead_decl.py` | 죽은 CSS 선언 보고 |
| `tools/css_dedupe_decl.py` | 파일 내 중복 선언 보고 |
| `tools/css_ghost_prune.py` | 유령 클래스 정리 |
| `tools/css_spacing_ladder.py` | 여백 사다리 이탈 보고 |
| `tools/agent-context-index.mjs` | 에이전트 컨텍스트 인덱스 |
| `tools/interactive_qa.mjs` | 대화형 QA 하네스 |
| `tools/mod-import.php` / `tools/mod-seed.php` | 모듈 가져오기/씨앗 |
| `tools/ux/README.md` | 시각 QA 규약 |
| `tools/ux/_probe_editor.php` / `tools/ux/_probe_embed.php` | 에디터 단독 / flex·grid 부모 안 임베드 프로브 원본 |
| `tools/ux/visual-qa.mjs` | 시각 QA 기본 |
| `tools/ux/t2-ux-check.mjs` | `SURFACE`→`delta`→`report` baseline 판정 |
| `tools/ux/t2-capture-emulate.mjs` | 캡처·에뮬레이션 |
| `tools/ux/t2-i18n-coverage.mjs` | 로케일 커버리지 |
| `tools/ux/t2-patch-verify.mjs` | 패치 검증 |
| `tools/ux/t2-surface-diagnose.mjs` | 표면 진단 |
| `tools/ux/mobile2-qa.mjs` | 모바일 2차 QA |
| `tools/__pycache__/*.pyc` (2개) | 파이썬 부산물. `.gitignore` 의 `__pycache__/` 가 새 것만 막고 기존 것은 추적 중 |

패키지 안 배포본 도구 **2개** — `T2Editor/developer/tools/t2e-capability-lint.mjs` · `T2Editor/developer/tools/t2e-plugin-scaffold.mjs`.
`AGENTS.md`가 명시한다: "`tools/`는 개발 도구일 뿐 `T2Editor/js/utils/ai/tools/`와 무관하다."

### 7.2 `tests/` 구조 (623 파일)

- `tests/run.mjs` — JS 러너. `ROOT` = `../T2Editor`(`:20`), `DIR` = 러너 옆 `js/`(`:24`).
  `node tests/run.mjs` 전체 · `node tests/run.mjs autosave` 이름 필터(`:5-6`).
  컨텍스트는 `eq` `ok` `includes` `excludes` 네 개(`:34-54`). 각 파일은 `default export async function(t)`.
  **종료 코드 0 = 통과, 1 = 실패.** 목적은 "고친 결함이 조용히 되돌아오지 않는 것"(`:10`).
  브라우저가 필요한 검증(IME·selection·실제 레이아웃)은 여기서 **대체할 수 없다**(`:12-13`, `tests/README.md` 에 경계 명시).
- `tests/run.php` — PHP 러너. `T2TEST_ROOT` = `dirname(__DIR__) . '/T2Editor'`(`:14`).
  `php tests/run.php` 전체 · `php tests/run.php minify` 이름 필터(`:5-6`).
  각 파일은 `t2test_case(설명, 클로저)` 호출. `T2TestContext` 는 `eq` `ok` `includes` `excludes`(`:23-45`).
  기준 상태: **최초 설정을 끝낸 Max**(`:47-55`) — 게이트가 `T2Editor/data` 를 지우므로 확인 표식이 없으면 실질 프로필 tLite 로 돈다.
- `tests/js/` — `*.test.mjs` **211개**
- `tests/php/` — `*.test.php` **81개**
- `tests/visual/` — **324개**(Playwright TS). `admin-surfaces.html` `modal-surfaces.html` `modal-surfaces-mobile.html` `video-player-surface.html` `axe-accessibility.test.ts`
- `tests/README.md`
- `T2Editor/tests/` 는 **빈 디렉터리**(0 파일). 배포 패키지 안에는 시험이 없다.

### 7.3 `.github/workflows/` 4개

| 파일 | name | 트리거 |
|---|---|---|
| `ci.yml` | `CI` (`:18`) | `push` (branches-ignore: `claude/**` `agent/**` `probe/**` `bot/**`) · `pull_request` · `workflow_dispatch` (`:20-32`) |
| `opencode.yml` | `opencode` (`:1`) | `issue_comment`(created) · `pull_request_review_comment`(created) (`:2-5`) — 본문에 `/oc` 또는 `/opencode` 가 있을 때만(`:16-19`) |
| `visual-ui-audit.yml` | `Interactive UI visual audit` (`:3`) | 위와 같은 branches-ignore + `paths:` `T2Editor/css/**` `T2Editor/admin/**` `T2Editor/js/**` `T2Editor/plugin/**` 등 (`:5-…`) |
| `spacing-normalize-once.yml` | `Law UI contract audit` (`:4`) | 위와 같은 branches-ignore + `paths:` `T2Editor/css/**` `T2Editor/admin/**/*.css` 등 (`:6-…`) |

`ci.yml` 매트릭스 — `:50-52` `php: ['7.4', '8.0', '8.2', '8.4']`, `fail-fast: false`, `ubuntu-latest`, Node 20.
주석(`:44-49`): 8.2 한 판만 돌리면 지원 범위 양 끝을 아무도 검증하지 않는다. **"여기 목록과 코드가 선언한 지원 범위는 같이 움직여야 한다."**

`ci.yml` 스텝(`:71-122`): PHP 구문 → JS 구문 → JSON 구문 → 매니페스트 스키마 → 정적 계약 검사 → 발행 본문 시트 일치 → 회귀(JS) → 회귀(PHP) → 런타임 산출물 미커밋.

### 7.4 `tools/t2-release-gate.sh` 이 돌리는 단계 (정확히 11단계)

`SCAN='T2Editor tools tests'`(`:42`) — 저장소 전체를 훑지 않는다(`:40-41` 주석: `backups/` 와 추적되지 않는 스크래치 프로브가 들어오므로).

| # | 줄 | 단계 | 실제 명령 |
|---:|---:|---|---|
| 1 | `:84` | PHP 구문 검사 | `find $SCAN -path '*/vendor' -prune -o -name '*.php' -print0 \| xargs -0 -n1 -P4 php -l` (`:44-47`) |
| 2 | `:85` | JS 구문 검사 | `… -name '*.js' -print0 \| xargs -0 -n1 -P4 node --check` (`:48-51`) |
| 3 | `:86` | JSON 구문 검사 | `… -name '*.json' -print0 \| xargs -0 -n1 node -e 'JSON.parse(...)'` (`:52-55`) |
| 4 | `:87` | 매니페스트 스키마 | `node T2Editor/developer/tools/t2e-capability-lint.mjs T2Editor/modules/*/*/module.json T2Editor/examples/external-sandbox-poll/poll-demo/plugin.json T2Editor/examples/external-sandbox-poll/market-manifest.example.json` (`:56-62`) |
| — | `:88` | `clean_runtime_dir` (단계 아님) | 추적되지 않은 `T2Editor/data` 를 지운다(`:72-76`) |
| 5 | `:89` | 정적 검사 | `node tools/t2-static-check.mjs` |
| 6 | `:90` | CSS 계약 검사 | `node tools/t2-css-contract.mjs` |
| 7 | `:91` | 발행 본문 시트 일치 | `node tools/t2-content-css-build.mjs` |
| 8 | `:92` | 회귀 시험 (JS) | `node tests/run.mjs` |
| 9 | `:93` | 회귀 시험 (PHP) | `php tests/run.php` |
| 10 | `:94` | 런타임 산출물 미커밋 | `! git ls-files --error-unmatch T2Editor/data` (`:63-66`) |

- 순서가 규약인 이유(`:81-83`): 구문이 깨진 파일은 아래 검사를 전부 무의미하게 만들고, 정적 검사의 release-artifact 규칙은 PHP 시험이 만드는 `data/` 를 위반으로 잡으므로 **정적 검사가 PHP 시험보다 먼저** 와야 한다.
- `tests/js/release-gate-parity.test.mjs` 가 `ci.yml` 과 이 스크립트의 항목/순서 불일치를 잡는다(`:6-8`).
- 종료 코드 0 = 통과, 1 = 실패(`:19`).
- **주의: 이 스크립트는 `git ls-files` 를 실행한다.** 이 문서를 만든 세션은 git 명령을 실행하지 않았고 이 스크립트도 실행하지 않았다.

### 7.5 `tools/t2-static-check.mjs` 검사 id 17종

`release-artifact` · `manifest` · `manifest-json` · `manifest-required` · `manifest-api` ·
`manifest-privacy` · `manifest-launcher` · `locale-json` · `locale-drift` · `json-parse` ·
`js-syntax` · `inline-js-syntax` · `postmessage-target` · `postmessage-guard` · `device-fingerprint` ·
`css-self-cycle` · `token-role`(2회 호출).
baseline 에 `known` **5개**가 있다 — "baseline 은 '괜찮다'는 뜻이 아니라 '추적 중인 부채'라는 뜻"(`:23-25`).

---

## 8. 디자인 시스템 토큰 (프론트엔드 에이전트 필수)

### 8.1 레이어 순서 — 단일 원천

`T2Editor/css/t2-foundation.css:51`
```
@layer t2.token, t2.content, t2.legacy, t2.module, t2.product, t2.plugin, t2.contract;
```
블록 구간(실측):
- `t2.token` — `css/t2-foundation.css:53` ~ `:552`
- `t2.product` — `css/t2-foundation.css:555` ~ `:639`
- `t2.contract` — `css/t2-foundation.css:643` ~ `:932`
- `t2.product`(제품 크롬) — `css/t2-visual-system.css:23` ~ `:4177`
- `t2.legacy` — `css/core.css:1` · `css/dark.css:1`
- `t2.token`(폰트) — `css/fonts.css:17`

### 8.2 `--t2-s*` 4px 사다리 (콘텐츠 흐름)

`T2Editor/css/t2-foundation.css:179-180`
```css
--t2-s1:4px; --t2-s2:8px; --t2-s3:12px; --t2-s4:16px;
--t2-s5:20px; --t2-s6:24px; --t2-s8:32px; --t2-s10:40px;
```
주석(`:176-178`): 4px 기준 사다리, 콘텐츠 흐름 안의 간격은 여기서 고른다(해설 708 A). **기하 수치(`--t2-hit`/`--t2-face`)는 이 사다리와 별개다.**

관계 이름 토큰 — `:183-198`:
`--t2-inset-{shell:5,section:4,island:3,control:2,chip:1}` · `--t2-gap-{tight:1,related:2,group:4,section:6}` ·
`--t2-lead-title` `--t2-trail-title` `--t2-lead-subtitle` `--t2-trail-subtitle` `--t2-trail-locator`

### 8.3 `--t2-u*` 비례 사다리 (공식 크롬·모달)

`T2Editor/css/t2-foundation.css:366` — `:root { --t2-u: calc(100vw / 15); }`
`T2Editor/css/t2-foundation.css:375-377` — `@supports (width: 1cqi) { .t2-editor-container > * { --t2-u: calc(100cqi / 15); } }`
`T2Editor/css/t2-foundation.css:381-387` — 파생 스텝:
`--t2-u8`(1/8) · `--t2-u316`(3/16) · `--t2-u4`(1/4) · `--t2-u38`(3/8) · `--t2-u2`(1/2) ·
`--t2-u34`(3/4) · `--t2-u78`(7/8) — 총 7스텝.
`T2Editor/css/t2-foundation.css:389-391` — `--t2-chrome-inset: var(--t2-u316)` · `--t2-chrome-face: var(--t2-u78)` ·
`--t2-chrome-hit: max(var(--t2-u78), var(--t2-hit))`

**폰 10u 분기** — `T2Editor/css/t2-foundation.css:428` `:root { --t2-u: calc(100vw / 10); }` ·
`:432-433` `@supports (width: 1cqi)` 안에서 컨테이너가 `100cqi / 10`.

**`@supports` 가드 의존(중요 함정)** — `T2Editor/css/t2-foundation.css:368-374` 주석이 근거를 준다:
custom property 는 파싱 단계에서 값을 검사하지 않으므로, 미지원 엔진에서도 `--t2-u` 에 `calc(100cqi / 15)` 토큰열이 그대로 들어앉고,
실제 속성에서 쓰는 순간 **그리고 거기서 파생된 모든 토큰이 무효화되어 크롬 여백과 기하가 한꺼번에 0** 이 된다.
`@supports` 로 감싸면 그런 엔진은 `:root` 의 뷰포트 u 를 물려받는다.
> `AGENTS.md` 는 이 위치를 `t2-foundation.css:299`/`:308` 로 인용하는데 **현재는 `:366`/`:375` 다** (§10-R1).

### 8.4 `--t2-plugin-*` 계열 (서드파티 공개 계약)

`T2Editor/css/t2-foundation.css:469-489` — 21개 토큰:
`--t2-plugin-product` `-product-strong` `-product-soft` `-product-ring` ·
`--t2-plugin-action` `-action-hover` `-on-action` · `--t2-plugin-dsc` `-dsc-ink` ·
`--t2-plugin-surface` `-surface-muted` `-surface-raised` `-surface-inset` ·
`--t2-plugin-text` `-text-muted` `-text-soft` · `--t2-plugin-border` `-border-strong` ·
`--t2-plugin-danger` `-success`

### 8.5 그 밖의 토큰 계열 (실측 정의 라인)

| 계열 | 대표 정의 | 줄 |
|---|---|---|
| 제품색 | `--t2-product` `--t2-product-strong` `--t2-product-soft` `--t2-product-selection` `--t2-product-ink` `--t2-product-tone` `--t2-product-select` `--t2-product-wash` `--t2-product-rgb` `--t2-on-product` | `:74-84`, `:87` |
| 표면 | `--t2-base` `--t2-workspace` `--t2-surface` `--t2-inset` `--t2-floating` `--t2-line` `--t2-line-strong` | `:87-93` |
| 도구 타일 | `--t2-tool-tile` `-tile-hover` `-tile-active` `--t2-tool-ink` | `:105-108` |
| 크롬 | `--t2-chrome-fill` `--t2-canvas-fill` | `:113-114` |
| 토글 | `--t2-toggle-on` `--t2-toggle-off` `--t2-toggle-thumb` | `:120-122` |
| 잉크 | `--t2-ink` `--t2-ink-muted` `--t2-ink-faint` | `:124-126` |
| 상태 | `--t2-danger` `-soft` `--t2-success` `-soft` `--t2-warning` `-soft` `--t2-info` `-soft` | `:128-132` |
| 다크 오버라이드 | 위 상태색 밝은 쪽 + `--t2-shadow-overlay` `--t2-shadow-modal` `--t2-scrim` | `:293-302` |
| **radius 사다리** | `--t2-radius-{structural:0px, edge:3px, field:6px, control:6px, tile:6px, brand:6px, inner:7px, island:8px, overlay:8px, shell:12px, modal:12px, popover:14px, sheet:16px, pill:999px}` | `:161-174` |
| 기하 | `--t2-rail-w:2px` `--t2-rail-inset:7px` `--t2-chamfer:9px` `--t2-tick:6px` `--t2-hit:44px` `--t2-face:30px` | `:202-208` |
| 모션 | `--t2-motion-fast:110ms` `--t2-motion:130ms` `--t2-ease-spring` `--t2-motion-spring:160ms` | `:210-217` |
| 그림자 | `--t2-shadow-overlay` `--t2-shadow-modal` `--t2-shadow-float` `--t2-scrim` | `:219-225`, `:466` |
| 포커스 | `--t2-focus` `--t2-focus-outline` `--t2-focus-halo` `--t2-block-focus` | `:463-468` |

`t2-foundation.css` 안 `--t2*` 선언 **188개** (실측).
`--t2-hit: 44px` 이 터치 타깃 하한이고, `js/toolbar.js:177-179` 가 `pointer:coarse` 일 때 `max(44, configured)` 로 재적용한다.

### 8.6 `developer/t2-design-system.md` — 존재한다 (23 KB)

- 머리말(`:1-3`): "`/law`, Commentary 704-711, `developer/design-formula.md` 를 구체 시각 규칙으로 옮긴 것. `/law` 의 위계는 바꾸지 않는다."
- Identity(`:5-15`): Light 제품 액센트 `#356FC0` · Dark `#7FA8FF` · DSc/T2 계보색 `#ff6600`.
  Azure는 선택·포커스·현재 위치·진행·주요 편집 동작을, DSc 주황은 계보·출처·책임을 갖는다(`:12-13`).
  **"Product color is an operational signal, not a broad theme fill."**(`:14`)
- Visual character(`:17-29`): radius 는 역할을 말하는 것이지 장식이 아니다. **"Radius never signals state, elevation, or importance."**(`:23`)
  가짜 금속·텍스처·글래스·스큐어모피즘 금지(`:25`) · 현대성/AI/프리미엄을 예고한 그라디언트 금지(`:26`)
- Proportional grid(`:31-…`): 크롬·모달 기하는 픽셀이 아니라 단일 단위에서 나온다.
  ```css
  --t2-u: calc(var(--t2-editor-width) / 15);   /* 데스크톱/태블릿 15:10 */
  --t2-u: calc(100vw / 10);                    /* 폰 10:16 (340px 기기에서 1U = 34px) */
  ```
  스텝은 `1/16` 의 배수이고 사용 중은 `3/32` `1/8` `3/16` `1/4` `3/8` `1/2` `3/4` `7/8` `1` 9개(`:41`).
  **`3/32` 은 토스트 안전 여백 하나只为, `3/16` 과 `7/8` 은 툴바 밴드 인셋과 도구 하나只为**(`:42`).
- Editor vertical budget(`:44-56`): 세 밴드 합이 정확히 `10`.
  toolbar `1¼`(인셋 `3/16` + 도구 `7/8` + 인셋 `3/16`) · content `7¾`(**유일하게 높이를 흡수하는 밴드**) · bottom bar `1`(인셋 `1/4` + 요소 `1/2` + 인셋 `1/4`).
  **"툴바와 콘텐츠 사이의 간격은 예산 밖이며 합을 `10¼` 로 만든다"**(`:51-52`).
  서브툴바는 네 번째 밴드가 아니라 **아일랜드**다 — 툴바 아래 `3/16` 에 떠서 높이 `1`(`:57-58`).
  폰은 `1¼ + 13¾ + 1 = 16`. **`7¾` 를 10u 프레임에 재사용하면 작성면이 절반이 되고 화면 아래쪽이 비므로 쓰지 않는다**(`:62-63`).

보조 문서: `T2Editor/developer/core-visual-style.md` · `design-formula.md` · `css/DESIGN-SYSTEM-VOCABULARY.md`.
`css/DESIGN-SYSTEM-VOCABULARY.md:1-5`: "`t2-foundation.css`·`t2-visual-system.css` 가 서드파티 플러그인에 제공하는 클래스·속성 어휘다.
**이 트리의 마크업이 쓰지 않아도 계약이므로 지우지 않는다.**"

### 8.7 `law/` — 34개 txt 전부 원문

`T2Editor/law/` 최상위 9개 + `case/` :
- `00-fundamental-charter.txt` · `01-creator-sovereignty.txt` · `02-coexistence-and-autonomy.txt` ·
  `03-trust-and-continuity.txt` · `04-interpretation-and-balance.txt` · `05-experiment-and-evolution.txt` ·
  `06-order-and-application.txt` · `07-commenting-and-documentation.txt` · `08-file-naming-and-paths.txt`
- `law/case/` — `README.txt` + 8개 디렉터리: `autonomy_and_core` `continuity_and_succession` `creator_platform` `experiments` `identity_and_heritage` `operations_and_accountability` `privacy_and_transparency` `value_conflicts`
- 해설 번호 **704-711** 이 코드 주석에서 반복 인용된다(예: `css/t2-foundation.css:176` "해설 708 A", `:183` "해설 708 B·D·E", `developer/t2-design-system.md:3` "Commentary 704-711").
  `AGENTS.md` 는 "`law/case` 해설 수치는 비규범 예시"라 명시한다 — **규범이 아니라 해설**이고, 코드로 옮긴 전례가 있다.
- 해석 안내: `T2Editor/developer/law-guide.md`

### 8.8 `tools/t2-css-contract.mjs` 가 강제하는 규칙 — 실제 식별자 **20개**

`C1` `C2` `C3` `C4` `C5` `C6` `C7` `C7b` `C8` `C9` `C10` `C11` `C12` `C13` `C14` `C15` `C18` `C19` `C20` `C21`.
`add('C…')` 호출 24회. **`C16`·`C17` 은 없고 `C22` 는 "없어졌다"는 주석만 남았다**(`:711`).

| id | 줄 | 규칙 |
|---|---:|---|
| `C1` | `:103-118` | 중괄호 무결성. 조기 종료(`:114`) · 미닫힘/과잉(`:117`) |
| `C2` | `:120-165` | 레이어 이탈. `@layer` 선언 없는 파일 = 모든 레이어를 이김(`:149`) · 레이어 밖 규칙(`:164`) |
| `C3` | `:149` | (C2 블록 안에서) 레이어 선언 없음 |
| `C4` | `:349-369` | 금지된 세로 semantic rail — `box-shadow`(`:364`) · 다른 속성(`:368`) |
| `C5` | `:169-193` | 유령 클래스 — 마크업이 만들지 않음(`:192`) |
| `C6` | `:198-212` | 미정의 변수 — 폴백 없음(`:209`) |
| `C7` | `:265-467` | 레이어 소유권 위반. 같은 at-rule 컨텍스트·같은 선택자·같은 속성이 더 낮은 레이어에 있음. 실제 51건(`:272` 주석) |
| `C7b` | `:470-556` | 속성 별칭·한정자 죽은 선언 — C7 이 못 잡는 경로. dedupe 키 `sel+prop`(`:551`) |
| `C8` | `:265-445` | 동일 컨텍스트·선택자·속성 중복 선언(`:442`) |
| `C9` | `:557-591` | 여백 사다리 이탈 — "law 708 리듬" 밖 토큰(`:590`) |
| `C10` | `:595-629` | 터치 타깃 회귀 — 뒤 규칙이 미디어 쿼리 규칙을 덮음(`:628`) |
| `C11` | `:373-390` | 다크 테마 토큰 역할 역전 — surface 토큰을 ink 자리에 사용(`:384`·`:387`) |
| `C12` | `:213-222` | 자기 자신으로 돌아오는 무효 폴백(`:221`) |
| `C13` | `:225-236` | 공통 토큰 재정의 — `css/t2-foundation.css` 만 소유(`:234`) |
| `C14` | `:238-250` | 없는 상대 자산(`:249`) |
| `C15` | `:253-262` | 범용 overflow 안전망이 modal 기하를 침범 — `[data-t2-modal-surface]` root 제외(`:261`) |
| `C18` | `:632-641` | `transition: all` 금지(`:642` 이후) |
| `C19` | `:646-655` | 투명 action 토큰을 상태 표시에 재사용 금지(`:654`) |
| `C20` | `:658-690` | 비정규 radius(`:681`) · radius 토큰 사다리 이탈(`:688`) |
| `C21` | `:693-708` | overshoot `cubic-bezier` — `var(--t2-ease-spring)` 하나로만(`:707`) |

`NEWER_FEATURE` 정규식(`:299`)은 `dvh|svh|lvh|dvw|svw|lvw|color-mix(|env(|clamp(|max(|min(|:has(|oklch(|lab(` 다.
주석(`:297-298`): `(?<![a-zA-Z])` 로 시작하는 이유는 `\b` 를 쓰면 `100dvh` 의 `0`-`d` 사이에 경계가 생기기 때문이다.
**`100vh` 를 기계 금지하는 규칙은 css-contract 에 없다** — §10-R5 참조.

---

## 9. 문서 인벤토리

### 9.1 `T2Editor/docs/` — 45개 (md 44 · txt 1)

| 파일 | 주제 (H1 실측) |
|---|---|
| `admin-dual-mode.md` | 관리자 모드 — 통합 / 개발자 |
| `admin-module-platform.md` | T2Editor Administrator Module Platform |
| `ai-api-bridge.md` | T2Editor AI API 브릿지 |
| `architecture-r13.md` | T2Editor v11 R13 편집 아키텍처 |
| `asset-delivery.md` | 자산 전달 — 압축·묶음·캐시 |
| `branch-history-reconciliation-2026-08-12.md` | 세 작업 브랜치 변경의 main 합병 기록 (2026-08-12) |
| `browser-compute-api.md` | 브라우저 연산 API |
| `browser-llm.md` | 브라우저 구동 LLM |
| `builtin-plugin-execution-policies.md` | v11 번들 플러그인 실행 정책 |
| `captcha-integration.md` | 봇 방지(CAPTCHA) 연결 |
| `collaboration-scale.md` | 10~15인 협업 |
| `component-admin-declaration.md` | 플러그인·모듈 관리자 선언 계약 |
| `content-block-group.md` | 나란히 선 블록의 묶음 |
| `content-sanitizer.md` | 서버단 XSS 필터 (11.0 신규) |
| `content-style-architecture.md` | 발행 본문 스타일 구조 (11.0 신규) |
| `custom-profile.md` | Custom 프로필 — 설정을 파일 하나로 옮기기 |
| `deployment-profiles.md` | 배포 프로필 (Max / Lite / tLite / Custom) |
| `document-coordinates.md` | 문서 좌표계 (y=줄, x=낱말) |
| `editor-skin.md` | 편집기 겉모양 — 코드를 고치지 않고 다른 편집기의 형태로 |
| `editor-snippets.md` | 편집기 HTML 조각 |
| `extend-buckets.md` | Extend 갈래 — editor · admin · common |
| `hard-config-contract.md` | 하드 설정 선언 계약 |
| `host-security-bridge.md` | 호스트 보안 다리 (11.0 신규) |
| `image-editor-api.md` | Shared Image Editor API |
| `insertion-api.md` | T2Editor 중앙 커서·삽입 API |
| `markdown-ai-plan-2026-08-31.md` | 마크다운 저작 · 플러그인 AI 선언 — 설계와 작업 계획 (2026-08-31) |
| `markdown-authoring-architecture.md` | 마크다운 저작 아키텍처 — 유지보수자 노트 |
| `module-admin-api.md` | 선언형 모듈 관리자 API |
| `nsfw-ui-api.md` | NSFW 공용 UI API |
| `performance-boundary-governor.md` | Core–Plugin Performance Boundary |
| `permission-system.md` | 등급 권한 계약 |
| `plugin-builder-distribution.md` | Plugin Builder distribution boundary |
| `plugin-history-contract.md` | 플러그인 콘텐츠 실행 취소 계약 |
| `plugin-model-commands-r13.md` | R13 플러그인 모델 명령 지침 |
| `plugin-sandbox.md` | v11 통합 플러그인 Sandbox SDK |
| `privacy-data-catalog.md` | T2Editor 개인정보 카탈로그 |
| `privacy-module-policy.md` | T2Editor 개인정보 보호 모듈 정책 |
| `style-isolation.md` | 스타일 격리 계약 — 편집기와 호스트 문서의 양방향 오염 방지 |
| `t2captcha-integration.md` | t2CAPTCHA — T2Editor 이식 |
| `toast-api.md` | 토스트 API |
| `ux-audit-note-2026-08-10.md` | UX/UI audit notes — 2026-08-10 |
| `ux-patch-plan-2026-08-25.md` | UX 패치 계획 — 2026-08-25 (렌더 실측 기반) |
| `ux-sweep-2026-08-24.md` | 플러그인 표면 여백 전수 측정 (2026-08-24) |
| `word-filter.md` | 금지 단어 |
| `plugin-platform-architecture.txt` | 플러그인 플랫폼 아키텍처 (ABI 57, Platform API v1 네이티브 이관 완료) |

`guide.txt`(28,750 B) — 브리프에 따라 요약만: 10장 구성(배포 배치 3곳 / 준비물 / 설치 3종 / 갱신 / 서버단 XSS 필터 / 발행 본문 스타일 / 호스트 보안 다리 / 사고 11종 / 더 읽을 것). §2.5 `install-check.php` 진단, §2.6 관리자 `admin/index.php`, §6.5 `sanitize` 설정 9키, §7.3 배치별 지시, §9 사고 표.

### 9.2 `T2Editor/developer/` — 30개 (md 23 · json 3 · php 2 · mjs 2)

| 파일 | 주제 (H1) |
|---|---|
| `README.md` | T2Editor Developer Guide / 개발자 안내서 |
| `quickstart.md` | Quick Start / 빠른 시작 — 외부 sandbox 플러그인 |
| `ai-context.md` | AI Context Guide / AI 코딩 도구용 컨텍스트 |
| `law-guide.md` | /law 개발자 해석 안내 |
| `plugin-guide.md` | Plugin Guide / 플러그인 구조 안내 |
| `plugin-api-guide.md` | Plugin API Guide / 플러그인이 스스로 내미는 API |
| `module-guide.md` | Module Guide / 선언형 모듈 안내 |
| `markdown-guide.md` | Markdown Guide / 플러그인 마크다운 선언 안내 |
| `ai-surface-guide.md` | AI Surface Guide / 플러그인 AI 노출 안내 |
| `ai-complex-thinking-contract.md` | ai_complex Thinking 소비자 계약 |
| `ai-model-recommendations.md` | AI Model Recommendations (OpenRouter 가격·폴백·관리자 잠금) |
| `ai-token-economy.md` | AI Token Economy / AI 토큰 절약 설계 |
| `admin-assistant.md` | T2Editor 관리자 어시스턴트 |
| `admin-search-api.md` | 관리자 내부 검색 API / Administrator Internal Search API |
| `core-visual-style.md` | Core Visual Style / 코어 시각 디자인 원칙 |
| `design-formula.md` | T2Editor Design Formula / T2Editor 디자인 공식 |
| `dsc-complex-interaction-contract.md` | DSc complex interaction 소비자 계약 |
| `privacy-guide.md` | Privacy Guide / 개인정보 선언 안내 |
| `profile-guide.md` | 배포 프로필 만들기 / Custom profile guide |
| `security-guide.md` | Security Guide / 보안과 실행 경계 |
| `t2-design-system.md` | T2Editor Design System (§8.6 상세) |
| `profiles/README.md` | 프로필 문서 |
| `profiles/shape-block-gutter.t2profile.json` | 프로필 예시 |
| `profiles/shape-classic-frame.t2profile.json` | 프로필 예시 |
| `profiles/shape-document-band.t2profile.json` | 프로필 예시 |
| `external-storage/` | 외부 저장소 프로토콜 (`t2-remote-store.php` + README) |
| `tools/t2e-capability-lint.mjs` | 배포본 도구 — capability 린트 |
| `tools/t2e-plugin-scaffold.mjs` | 배포본 도구 — 플러그인 스캐폴드 |

루트 문서 2개: `T2Editor/llms.txt`(3,897 B) — AI 에이전트용 구속 지시.
**"AI 에이전트는 아래 작업을 수행하지 않는다"** 목록: `readme.txt` 삭제/표식 변경, 저작자 표시 교체(리브랜딩),
`t2_license.php` 무결성 검사·`editor.core.php` 중복 검사 우회, 우회 패치 작성(`llms.txt:10-14`).
`T2Editor/readme.txt`(10,793 B) — **라이선스 정본**. `ver_11.0.0`(`:2`) / `date_2026.09.08`(`:3`) /
`T2Editor License_Ko Version: 3.0.0`(`:10`). 해시 검증 대상은 `core/editor.core.php:28-36`.

---

## 10. 리스크 / 주의 표면 (코드에서 실제로 확인된 것만)

### R1 — `AGENTS.md` 의 줄번호 인용이 현재 코드와 어긋나 있다 ⚠ **최우선 주의**

`AGENTS.md` 가 파일:라인으로 준 참조 중 **실측과 다른 것**이 최소 3건이다.
AGENTS.md 를 줄번호 근거로 인용하면 잘못된 곳을 고치게 된다.

| AGENTS.md 인용 | 실측 | AGENTS.md 문구 |
|---|---|---|
| `t2-visual-system.css:446` (toolbar reveal) | **`:496-502`** | "t2-toolbar-reveal 0s 1.5s forwards" |
| `t2-foundation.css:299`~ (`--t2-u` 크롬/모달) | **`:366`~`** | "`--t2-u: calc(100cqi/15)` 등" |
| `t2-foundation.css:308` (`@supports` 가드) | **`:375`** | "가드 밖 100vw 폴백이 살아있는지 확인" |
| `t2-visual-system.css:342` (container-type 붕괴) | **`:357`(주석)·`:382`(선언)** | "width:100%+min-width:0 으로 끊어야 한다" |
| `modal.css:162` (t2-modal-pinned-actions) | `[미확인 — 미측정]` | "sticky bottom" |
| `modal.css:29,65` (`--t2-privacy-notice-inset`) | `[미확인 — 미측정]` | "env(safe-area-inset-*)" |

> 추가로 `AGENTS.md` 는 "`t2-toolbar-reveal 0s 1.5s forwards`" 라고 적었으나 실측 값은 **`3s`** 다
> (`css/t2-visual-system.css:498`) — 지연이 늘어난 것이 아니라 3초 안전망이고, 늘린 이유(1×469ms~6×1737ms 실측)가 `:490-494` 에 있다.
> **파일·심볼 이름은 그대로 유효하고 줄번호만 낡았다.**

### R2 — `backups/` 는 검사 대상이 아니다
`/workspace/T2Editor-v11/backups/` = 3개 디렉터리(`2026-08-13-audio-message-boundary` `2026-08-13-first-run-visual` `2026-08-13-linkcard-userinfo`), 10파일 125,273 B.
`AGENTS.md` "구조 메모": "`backups/`는 패치 직전 바이트 사본 — 검사 제외, 손대지 않음."
`tools/t2-release-gate.sh:42` 가 `SCAN='T2Editor tools tests'` 로 루트를 훑지 않으며, 이유를 `:40-41` 에 적는다("저장소 전체를 훑으면 backups/ 와 추적되지 않는 스크래치 프로브까지 들어온다").
**주의: `backups/` 안에는 검사되지 않은 CSS/JS 사본이 있을 수 있다. 계층 실측 수치에 포함하지 않았다.**

### R3 — `_probe_*.php` 는 gitignore 스크래치다
`.gitignore:13-16` — `/_probe_editor.php` `/_probe_modal.php` `/_probe_profile.php` `/_probe_embed.php` 가 커밋 금지.
`.gitignore:10-12` 주석: "저장소에 들어가지 않는다". 원본은 `tools/ux/`.
작업 트리에 **실제로 존재하는 것**: `_probe_editor.php`(903 B) `_probe_embed.php`(5,195 B) `_probe_real.php`(1,685 B) `_probe_surface.html`(15,823 B) `_probe_surface2.html`(1,083 B) `_probe_wf.html`(2,088 B).
→ `_probe_real.php` `_probe_surface.html` `_probe_surface2.html` `_probe_wf.html` **4개는 `.gitignore` 규칙에 없음.**
`AGENTS.md` 도 `_probe_embed.php` 단독으로는 flex/grid 부모 붕괴를 못 본다고 명시한다("단독 프로브만 믿지 않는다").

### R4 — `admin/t2admin.key.php` 는 비밀 커밋 위험 파일이다
`T2Editor/admin/t2admin.key.php` 5줄, `return array('secret' => '');` — 현재는 **빈 값**이라 위험하지 않다.
파일 머리말(`:3-4`): "Standalone first setup only: replace the empty value with a private 12+ character secret."
`AGENTS.md`: "관리자 검사: `admin/t2admin.key.php` 12자+ 설정 → … **검사 후 키 파일 원복** — 비밀 커밋 전례 있음".
같은 위험군이 `.gitignore:3-9` 에 적혀 있다: `T2Editor/data/` 는 캐시·잠금뿐 아니라 `admin_settings.php` 와 `capability_key.php` 같은 **설치별 비밀**을 담고, 커밋되면 배포 아카이브에 그대로 실려 나간다.
`.gitignore:20-25` 는 `T2Editor/plugin/t2captcha/storage/` 도 같은 이유로 막는다.
게이트가 잡는 곳은 `tools/t2-static-check.mjs` 의 `release-artifact` 검사(`tools/t2-release-gate.sh:63-66` 는 `git ls-files` 로 확인).

### R5 — `100vh` 금지는 규약이지 기계 규칙이 아니다
`AGENTS.md` "실기기 분기": "`100vh` 금지 — `100dvh`(+`100vh` 폴백)".
**실측: `tools/t2-css-contract.mjs` 에 `100vh` 를 금지하는 규칙이 없다.** `NEWER_FEATURE`(`:299`)는 `dvh` 등 **신한 기능을 권장**할 뿐 `vh` 를 막지 않는다. `t2-static-check.mjs` 에도 없다.
코드 속 실제 사용은 대체로 폴백 순서를 지킨다:
- `T2Editor/js/engine/nsfw-ui.css:65` — `height:min(700px,calc(100vh - 32px)); height:min(700px,calc(100dvh - 32px));` (dvh 가 뒤)
- `T2Editor/js/utils/ai/tools/artifact.js:164` 등 — `min-height:100vh; min-height:100dvh;`
- **예외 1건** — `T2Editor/js/utils/privacy-consent.js:973` `forceStyle(element, 'max-height', 'calc(100vh - 32px)')` — dvh 폴백이 없다. 폰에서 키보드가 뜨면 이 요소가 문제 될 수 있다(재현 미실측).

### R6 — `--t2-u` 는 `@supports` 가드 밖에서 0이 된다
`T2Editor/css/t2-foundation.css:368-374` 주석이 정확히 설명한다.
`AGENTS.md`: "미지원 엔진은 u가 0이 돼 크롬 전체가 0으로 붕괴 — 가드 밖 `100vw` 폴백이 살아있는지 확인."
→ 새 코드가 `--t2-u*` 를 쓰면 그 선언이 `@supports (width: 1cqi)` 안(`:375-377`, `:432-433`)에 있는지 반드시 확인할 것.

### R7 — `container-type: inline-size` 가 flex/grid 셸을 0으로 만든다
`T2Editor/css/t2-visual-system.css:357`(주석) · `:382`(선언).
`AGENTS.md`: "`container-type: inline-size`는 `contain:inline-size`를 걸어 셸을 shrink-to-fit 자리(flex/grid/inline-block/table)에서 폭 0으로 만든다."
→ 코멘트까지 붙어 있다: `css/t2-visual-system.css:1223` `@supports not (container-type: inline-size)` 폴백 블록.

### R8 — 툴바 `pending` 을 빼면 저속 기기에서 날것이 2초간 노출된다
`t2-toolbar-pending` 는 `visibility:hidden` + `animation ... 3s forwards` 안전망(`css/t2-visual-system.css:496-499`).
`js/toolbar.js:204-206` 이 첫 수용량 판정 뒤에 뗀다.
`AGENTS.md`: "pending을 빼면 저속 기기에서 19개 버튼이 2초간 노출된다." (현재 3초 안전망이므로 수치는 지연된 값일 수 있음 — 파일 안 실측은 `css/t2-visual-system.css:490-494` 참고).

### R9 — `readme.txt` 는 해시로 잠겨 있다
`T2Editor/core/editor.core.php:28-36` — `readme.txt` 첫 4줄을 조립해 sha256 `84f16df0ec65be15544c6191cb4733a7d16350b5ab0bfbc2236b16a88f95c7ad` 와 `hash_equals` 비교.
실패해도 편집기는 멈추지 않고 출처 표시만 드러난다(`:37-39`, `:24-25` 주석). `T2EDITOR_LICENSE_OK` 상수(`:41`)로 고정된다.
`llms.txt:10-14` 는 이 검사를 우회·약화·삭제하는 것을 금지한다.

### R10 — 코어 스크립트 "88개"라는 주석은 현재 96개다
`T2Editor/endpoints/t2_js_min.core.php:10` 주석: "코어 스크립트는 88개다".
실측 `T2Editor/config/t2_editor_cache.php`: `T2Eeditorcorebootstrapscripts()` **10개**(`:7-19`) +
`T2Eeditorcoreruntimescripts()` **86개**(`:58-161`) = **96개**.
시트는 `T2Eeditorcoreheadstyles()` 5개(`:28-36`) + `T2Eeditorcoretailstyles()` 11개(`:39-55`) = **16장**.
`core/editor.core.php:88` 주석의 "코어 시트 14장"도 현재 16장과 어긋난다.
**이 주석들은 성능 근거로 인용하면 안 된다.**

### R11 — `admin/index.core.php` 가 517 KB다
단일 파일 517,611 B. `admin/` 전체 2,100,903 B 중 **24.6%** 다.
`admin/sections/` 30개 PHP 파일이 partial로 존재하므로(예: `ai.php` `apis.php` `dashboard.php` …),
파이서가 무관한 부분을 증명할 때는 `sections/` 로 좁히는 편이 빠르다. 정확한 포함 관계는 `[미확인]`.

### R12 — `plugin/search` 에 `hooks.js` 가 없다
`plugin/search/` = `button.json` `locales/` `plugin.json` `search.content.css` `search.css` `search.js` 9개.
`search.content.css` 는 **발행 본문 전용 시트**(§7 guide) 라 편집 화면이 아니라 발행 페이지용이다.
`plugin/paste_migrate` 는 `hooks.js` 도 `button.json` 도 없다 — 대신 `plugin.json` 의 `autoload: true` 로 붙는다.

### R13 — `t2_content_style.core.php` 에 짝 브리지가 없다
`T2Editor/endpoints/t2_content_style.core.php:8-17` 주석이 근거를 명시한다.
**새 `X.php` + `X.core.php` 쌍을 추가하면 `admin/update_api.core.php` 의 부트스트랩 ABI 계약에 걸려 데이터 슬롯 업데이트가 거부된다.**
`T2Editor/config/extend.php:137-172` 의 계약 파일 목록 30개는 데이터 슬롯이 갖춰야 할 구현 파일 그대로다.
`T2Editor/config/extend.php:174-182` `t2_extend_distribution_bootstrap_abi()` 가 대상의 `T2_EXTEND_BOOTSTRAP_ABI` 상수를 첫 4,096 B 안에서 정규식으로 읽어 비교한다(`:179`).

### R14 — `t2_storage_routing.php` 는 이름과 역할이 다릅니다
CMS 데이터 경로가 아니라 **외부 저장 서버 라우팅**이다(§6.3). 데이터 경로를 찾으려면 `config/t2_cms_data.php:20` `t2editor_resolve_data_layout()` 이다.

### R15 — 워드프레스 어댑터가 없다
`T2Editor/integration/cms/adapters/` = `gnuboard5.php` `rhymix.php` `standalone.php` 3개뿐.
`grep -rn "wordpress" integration/ config/ core/` **0건**.
v10 wiki의 워드프레스 지시를 v11 코드에 대입하면 존재하지 않는 대상으로 보낸다.

### R16 — `AGENTS.md` 의 "18개 플러그인"은 17개다
실측 디렉터리 17개. 브리프가 나열한 이름 17개와 정확히 일치. AGENTS.md 는 플러그인 수를 세지 않는다.

### R17 — baseline 은 허용 목록이 아니라 부채다
`AGENTS.md`: "`tools/*.baseline.json`은 허용 목록이 아니라 추적 부채 — 새 위반을 baseline에 넣지 말고 고친다."
`tools/t2-css-contract.baseline.json` 은 현재 `count: 0`, `entries: []` (부채 0).
`tools/t2-static-check.baseline.json` 은 `known` **5건** 남아 있다.
`tools/t2-css-contract.baseline.json` 의 `note` 필드도 기록한다: "집계형 위반의 지문에서 건수를 뺐다. 건수가 지문에 들어 있으면 부채를 줄이는 순간 지문이 달라져 신규 위반으로 잡히고, 게이트가 부채 축소를 막는다."

### R18 — `T2Editor/data/` 와 `T2Editor/tests/` 는 비어 있다
`data/` 0파일 — `guide.txt` 2.1 "없으면 첫 요청에서 만들어진다".
`tests/` 0파일 — 시험은 전부 저장소 루트 `tests/` 에 있다. 배포 패키지에서 시험을 찾지 말 것.
`tools/t2-release-gate.sh:72-76` 의 `clean_runtime_dir` 는 추적되지 않은 `T2Editor/data` 를 **시험 전에 지운다**.

### R19 — `T2_CSS_MIN`·`T2_JS_MIN`·`T2_ASSET_BUNDLE` 기본값이 전부 켜짐
`T2Editor/core/editor.core.php:86-93`. 주석(`:82-85`): "요청마다 다시 계산하던 시절에는 '사양이 낮은 서버의 경우 과부하'가 실제 이유였고 그래서 기본값이 꺼짐이었다. 그 비용이 사라졌으므로 기본값을 켠다 — 꺼 두면 편집기 첫 화면이 압축도 묶음도 없이 2.8MB 로 나간다."
같은 블록(`:90-92`)이 구 이름 `T2_JS_BUNDLE` 을 **읽는 곳이 없다**며 경고한다 — "이름이 둘이면 어느 쪽이 실제로 도는지 알 수 없다."

### R20 — `extend.php` 는 설정 파일이 아니라 부트스트랩이다
139,584 B 로 패키지 내 두 번째로 큰 설정 파일이고, 플러그인 매니페스트 검증(`ai_surface` `ai_launcher` `provides_api` `consumes_apis` `capabilities`),
런타임 포인터 검증, 엔드포인트 게이트, 파일 감시 해시 검증까지 담고 있다.
`T2Editor/config/extend.php:3`: "extend discovery order is ABI-sensitive; add roots/packages through this bootstrap instead of absolute-path patches."
여기 절대경로 패치를 넣으면 데이터 슬롯 경로가 깨진다.

### R21 — `run.core.php` 는 정책 파일 없이가 구동된다
`T2Editor/endpoints/run.core.php:6-9` 주석: `t2_policy.php` 를 빼면 `T2Epluginaccessblocked` / `T2Epluginisactive` 가 정의되지 않아
`function_exists` 가드가 **조용히 통과해버리고** 비활성·차단 패키지의 서버 entry 가 그대로 실행된다("검사하는 척만 하는 상태").
같은 함정이 `config/extend.php:445`·`:456` 에서는 `function_exists` 로 감싸져 있고, 거기서도 같은 문제가 방어로 이어진다.

### R22 — `data/` 는 자산 엔드포인트에서 명시 차단된다
`T2Editor/endpoints/t2_css_min.core.php:88-96`(주석) — 패키지 루트 포함 판정만으로는 스탠드얼론의 `data/` 파일이 그대로 새어나간다(#335).
그래서 `t2_css_resolve()`(동 파일)와 `t2_js_resolve()`(`endpoints/t2_js_min.core.php`)가 **data/ 안쪽을 명시적으로 거부**한다.
`guide.txt` 1장: "nginx 는 .htaccess 를 읽지 않으므로 `data/` 아래 상태 파일이 그대로 노출된다. 반드시 `location ^~ /t2editor/data/ { deny all; }` 를 넣는다."
`T2Editor/.htaccess` 은 Apache `mod_expires` 용이고 `data/` 차단 규칙이 **없다** — nginx 는 이 파일을 아예 읽지 않는다.

---

## 부록 — 인용 검증

이 문서의 모든 `파일경로:줄번호` 인용은 세션 중 실제 파일을 읽거나
`grep -n` / `sed -n` / `node` 로 찍어서 확인했다. 존재하지 않는 파일명·줄번호를 쓰지 않았고,
확인 못 한 항목은 전부 `[미확인 — 미측정]` 로 적었다.

인용 파일 경로 대조 결과: 전부 존재 확인.
단, `AGENTS.md` 안의 줄번호 인용 6건은 **그 파일 안의 인용이 낡았다**는 사실이 §10-R1의 내용이며,
이 문서는 현재 실측 라인(예: `css/t2-visual-system.css:496`)을 썼다.
