# 50 — 플러그인과 공개 진입점

## 1. 플러그인 수: 17 vs 16 (자주 틀림)

```
플러그인 디렉터리        17   T2Editor/plugin/*/
기본 등록 배열           16   T2Editor/core/editor.core.php:138-160  ($T2EDITOR_PLUGINS)
전용 로더로 실리는 것      1   paste_migrate  → T2Editor/extend/editor/php/t2paste_migrate_loader.php:2
```

"등록된 플러그인 수"를 물으면 **16** 이 정답이다. 17 은 디렉터리 수다.

`paste_migrate` 는 예외:
- 등록 배열에 없다
- 전용 로더가 싣는다
- 매니페스트가 `button.json` 이 아니라 **`plugin.json`** 이다

자동 등록도 있다: `T2Editor/extend/editor/php/t2z_plugin_autoregister.php` 가 `t2_extend_plugin_index()` (`T2Editor/config/extend.php:2174`) 에서 **`autoload` 플래그가 켜진 것만** 배열에 보탠다.

## 2. 플러그인 목록 (기계 판정 `data/catalog/plugins.json`)

| id | 역할 | 기본 등록 | 매니페스트 |
|---|---|---|---|
| `ai_complex` | AI (T2LLM) — ai + ai_rearrange 통폐합 | ✅ | `button.json` |
| `clipurl` | URL 클리핑/붙여넣기 가져오기 | ✅ | `button.json` |
| `code` | 코드 블록 | ✅ | `button.json` |
| `collab` | 실시간 협업 (peerjs / p2p-media-loader) | ✅ | `button.json` |
| `draw` | 그림 그리기 | ✅ | `button.json` |
| `export` | 본문 내보내기 | ✅ | `button.json` |
| `file` | 파일 첨부 · PDF 뷰어 | ✅ | `button.json` |
| `image` | 이미지 업로드·삽입·리사이즈 | ✅ | `button.json` |
| `link` | 본문 링크 | ✅ | `button.json` |
| `linkcard` | URL 미리보기 카드 | ✅ | `button.json` |
| `meme` | 밈 생성 | ✅ | `button.json` |
| `paste_migrate` | 붙여넣기 마이그레이션 | ❌ 전용 로더 | **`plugin.json`** |
| `search` | 본문 검색 | ✅ | `button.json` |
| `t2captcha` | 번들 봇 방지(툴바 단추 없는 서비스 플러그인) | ✅ | — |
| `t2search` | T2 통합 검색 | ✅ | `button.json` |
| `table` | 표 편집 | ✅ | `button.json` |
| `video` | 비디오/임베드 | ✅ | `button.json` |

전수(파일 목록·바이트·hooks): `datasets/plugins.csv` · `node tools/t2at.mjs query "<id>"`

## 3. 🚨 공개 진입점 = ABI 계약

`T2Editor/endpoints/` 의 11개 파일은 전부 `X.php` + `X.core.php` **브리지 쌍**이다.

```
install-check · plugin-sandbox-worker · run · t2_content_style · t2_css_min · t2_js_min
```

- `T2Editor/admin/update_api.core.php:430-441` 가 이 쌍을 **자동 발견**해 불변 목록에 넣는다.
- `T2Editor/admin/update_api.core.php:457-467` 이 목록에 없는 신규 진입점을 `RuntimeException` 으로 **막는다.**

⇒ **새 공개 진입점을 만들면 갱신 경로가 깨진다.** 계약이 필요하면 이슈를 세워 승인을 받는다(`needs-human`).

## 4. 대안 — 엔드포인트를 늘리지 않고 하는 일

| 하고 싶은 것 | 있는 자리 |
|---|---|
| 요청 전처리 | `T2Editor/config/extend.php` (139KB, 런타임 슬롯 5겹 검증 `:203-255`) |
| CMS 연동 | `T2Editor/integration/cms/adapters/` 에 어댑터 등록 |
| 필터 | `T2Editor/integration/sanitize/providers/` 에 공급자 등록 |
| 단어 금지 | `T2Editor/integration/wordfilter/providers/` |
| 권한 | `T2Editor/integration/permission/providers/` |
| 설정 | `T2Editor/config/t2_hard_config.php` (→ `skills/40-setting-key.md`) |
| 스타일 | 번들 엔드포인트 `t2_css_min.php?bundle=content&scope=…&format=…` (정규표현식으로 재조립) |

## 5. 어댑터는 3개뿐 (워드프레스는 v11 에 없다)

```
T2Editor/integration/cms/adapters/  →  gnuboard5.php · rhymix.php · standalone.php
```

- `grep -r wordpress T2Editor/` → **0건**.
- v10 문서가 "워드프레스 또는 웹 프로젝트의 editor 디렉터리" 를 안내한다면 **v11 기준 존재하지 않는 경로**다.
- 워드프레스는 v10 브리지에만 있는 선택적 업로드 capability 설명이며, v11 어댑터가 아니다.
- 그누보드5·라이믹스에서 업로드는 CMS 어댑터가 아니라 **CMS 자체 창구**로 넘긴다. CMS 관리자 연동·데이터 경로 분리는 받지 못한다.

## 6. 확인

```bash
cd <T2Editor_Agent_Tool>
node tools/t2at.mjs refresh --write
node tools/t2at.mjs query "paste_migrate"
node tools/t2at.mjs doctor
git diff data/catalog/plugins.json datasets/plugins.csv
```

디렉터리 수가 안 늘었으면 `SKIP_DIR` 규칙(`data`, `node_modules`, `.git`, `.cache`)에 걸린 것이다. 정본에 새 디렉터리를 만들었다면(ext), 여기를 먼저 본다.
