# A2 — T2Editor v1~v10 레거시 버전 데이터셋
---

<!-- T2Editor_Agent_Tool · 정본 지식 자산 -->

# T2Editor v1~v10 레거시 버전 데이터셋

> **출처** A2(레거시 과장) 작성 2026-09-28 · `gh api` 전수 93건 · 부장 감사 2026-09-28 완료
>
> **감사 기록 (부장)**
> ✅ **장，陪가장 중요한 발견**: `published_at` 은 배포일이 아니다. 93건 전부가 `2026-09-27T14:21:06Z~14:29:57Z`(8분 51초) = 아카이브 재게시. 진짜 배포일(2025-02-15~2026-07-27)은 릴리즈 본문 메타표 `| 배포일 |` 에만 있다. → 기계화: `tools/lib/legacy.mjs` 가 이 표를 파싱해 `data/legacy/release-index.json` 의 `realDate` 로 만든다.
> ✅ 판본 계보·계열 수·EOL 비대칭·라이선스 세대가 부장 파이프라인(`tools/t2at.mjs refresh`)으로 **독립 재현**됨.
> ⚠ **수치 불일치 1건(기록만, 미해소)**: 라이선스 1.0.1 세대 수를 A2는 28건, 부장 파서는 27건으로 센다(2.0.0 은 24 vs 25). 합계는 둘 다 93으로 같다 — 1건이 두 세대 중 어디로 분류되는지가 갈린다. 판정: A2는 릴리즈 본문 수기 판독, 부장 파서는 메타표 정규식 판독. **정본은 `data/catalog/` 가 아니라 사람 판독**이며, 판정 근거는 각 문서에 남긴다.
> ⚠ **작업원 지정을 정정한 것**: 부장 브리프는 `extend/js/t2_first_run_guide.js` 를 경로로 주었으나 v11 실경로는 **`T2Editor/extend/admin/js/`** 다. `backups/2026-08-13-first-run-visual/` 아래에 옛 경로 사본이 있어 오인하기 쉽다.

---


> **문서 종류**: 레거시(과거 판본) 전문 데이터셋
> **기준 코드**: `/workspace/T2Editor-v11/T2Editor/` (v11 배포 패키지)
> **원본 데이터**: `T2Editor_Agent_Tool/data/releases/v1.json`~`v10.json` (GitHub releases API 원문)
> **작성 방식**: 모든 수치는 `gh api` / 실물 ZIP 해제로 실측. 추측 금지. 못 얻은 것은 "미확인"으로 표기.
> **대상 독자**: "과거 판본이 어떻게 생겼는가"를 알아야 하는 후배 에이전트.
> **계열 전수 판본 수**: v1~v10 합계 **93개** (v1=19 v2=3 v3=10 v4=3 v5=32 v6=1 v7=3 v8=6 v9=7 v10=9)

---

## 목차

0. [이 문서를 쓰기 전에 반드시 읽는 3가지](#0-이-문서를-쓰기-전에-반드시-읽는-3가지)
1. [판본 계보(계열) 표 — 전수 93개](#1-판본-계보계열-표--전수-93개)
2. [버전 판별법](#2-버전-판별법--후배가-가장-자주-틀리는-구간)
3. [계열별 EOL 상태와 실제 근거](#3-계열별-eol-상태와-실제-근거--고지가-어디에-있는가)
4. [v10 → v11 마이그레이션 경로](#4-v10--v11-마이그레이션-경로-가장-중요)
5. [라이선스 계약 이력](#5-라이선스-계약-이력--4세대--무효-1건)
6. [기능 신설/제거 연표](#6-기능-신설-연표--릴리즈-노트-기준)
7. [데이터셋 기계화 조언](#7-데이터셋-기계화-조언)
8. [미확인 목록](#8-미확인-목록--이-문서가-답하지-못하는-것)
9. [인용한 URL](#9-인용한-url-실제로-get-성공한-것만)

---

## 0. 이 문서를 쓰기 전에 반드시 읽는 3가지

### ⚠ 함정 1 — `published_at` 은 배포일이 아니다 (가장 많이 틀리는 지점)

GitHub 릴리즈 API의 `published_at` 값은 **아카이브 재게시 시각**이다.

| 항목 | 실측값 |
|---|---|
| v1~v10 전체 93개 릴리즈의 `published_at` 범위 | `2026-09-27T14:21:06Z` ~ `2026-09-27T14:29:57Z` |
| 그 폭 | **8분 51초** |
| 같은 판본들의 **실제 배포일** 범위 | `2025-01-31` ~ `2026-07-27` (**약 18개월**) |

v1~v9 저장소 9개는 모두 `created_at` = `2026-09-27T14:2x:xx`다. 즉 **저장소가 2026-09-27 당일 일괄 생성**되었다.

**실제 배포일은 릴리즈 본문 안 메타표의 `| 배포일 |` 행에서 읽어야 한다.** 본문 예(v10.5.1):

```
| 항목 | 값 |
|---|---|
| 상태 | **현행 공개 판본** |
| 판본 | `10.5.1` |
| 배포일 | 2026-07-27 |
```

→ 후배가 요약문을 만들 때 `published_at`을 쓰면 93개 전부 "2026-09-27"로 뭉개진다.

### ⚠ 함정 2 — 판본 수는 93개다

계열별 실측: v1=19 · v2=3 · v3=10 · v4=3 · v5=32 · v6=1 · v7=3 · v8=6 · v9=7 · v10=9 = **93**.

`gh api repos/tak2-08/T2Editor-v{N}/releases?per_page=100` 로 전 계열 확인했고 `link: rel="next"` 헤더가 없어 **페이지네이션 누락 없음**. `tak2-08/T2Editor`(v계열 없음, 2025-03-19 생성, 커밋 2개) 릴리즈는 **0개**이므로 94개가 아니다.

### ⚠ 함정 3 — 릴리즈 본문 39개에 캐리지 리턴(`\r`)이 들어 있다

`body` 에 `\r` 이 섞인 릴리즈가 **39/93건**이고, 이 중 **3건은 판본 숫자가 줄바꿈으로 쪼개져 있다**:

- `v5.4.2` → 본문에 `5.\n4.\n2` 형태로 흩어짐
- `v9.1.2` → `9.1.2-alpha1.0.5` 가 `9.\r\n1.\r\n2-alpha\r\n1.\r\n0.\r\n5` 로 분해
- `v9.1.3` → `9.1.3-alpha1.1.0` 가 같은 방식으로 분해

즉 **원본 데이터 자체의 손상**이며 내 파싱 탓이 아니다. 후배가 v9.1.2 / v9.1.3 노트를 읽을 때 `9. 1. 2-alpha 1. 0. 5` 로 보이면서 "무슨 이상한 버전이냐" 하고 멈추지 말 것 — 원래는 `9.1.2-alpha1.0.5` 다. 판본 식별은 **메타표 `| 판본 |` 행**으로 하고 본문은 참고로만 쓸 것.

---

## 1. 판본 계보(계열) 표 — 전수 93개

**열 설명**
- `실제 배포일` — 릴리즈 본문 메타표 `| 배포일 |` 행 (신뢰 가능한 유일한 날짜)
- `상태` — 릴리즈 본문 메타표 `| 상태 |` 행 (`EOL` / `현행 공개 판본`)
- `라이선스` — 본문 메타표 `| 배포 시점 유효 라이선스 |` 행
- `ZIP 자산` — 릴리즈 `assets[]` 배열. **93개 전부 자산 1개씩 존재** (draft 0건, 빈 본문 0건)
- `요약` — 릴리즈 노트 원문 첫 줄(또는 번호 목록 상위 3개). **추측으로 채운 칸 0개**

> `prerelease=true` 2건: `v1.0.0-beta`(v1), `v5.1.0-beta1.0.2`(v5)
> `노트 없음` 7건: 릴리즈 본문 원문이 `_배포 페이지에 변경 내역이 기재되어 있지 않다_`

> **정렬 규칙**: 아래 표는 **실제 배포일 오름차순**이다(동일 날짜면 판본 문자열 오름차순).
> GitHub API 반환 순서(`published_at`)와 다르다. 특히 `_B` 계열은 예외다 — `v2.0.0_B` 의 실제 배포일은 **2025-05-01** 로, `v2.0.0`(2025-06-03)보다 **33일 앞선다**. 버전 문자열로 정렬하면 뒤로 밀린다.
> 또 `v5.1.0-beta1.0.2`(2025-10-11)는 `v5.1.0`(2025-10-21)보다 10일 앞선 체험판이다.

#### 계열 v1 — 19개 (2025-01-31 ~ 2025-05-01)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v1 | `1.0.0-beta` | 2025-01-31 | EOL | none | `1.0.0-beta.zip` | 베타/체험판 — 정식 판본이 아니다. |
| v1 | `1.0.0` | 2025-02-15 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.0.0.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.1.0` | 2025-02-20 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.1.0.zip` | 파일 첨부 기능 추가, pdf 뷰어 추가, 자동 저장기능 on/off 기능 추가 |
| v1 | `1.2.0` | 2025-02-24 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.2.0.zip` | 폰트 색상 직접 입력, 이미지 복사/붙여넣기 기능 추가 텍스트 링크 걸기, 텍스트 붙여넣기 오류 수정 |
| v1 | `1.3.0` | 2025-02-25 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.3.0.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.3.1` | 2025-02-27 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.3.1.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.4.0` | 2025-03-02 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.4.0.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.4.1` | 2025-03-09 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.4.1.zip` | 툴바 사용성 향상 및 게시글 수정 시 미디어 블록 위 아래로 줄바꿈 추가되던 문제 수정 |
| v1 | `1.4.2` | 2025-03-15 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.4.2.zip` | 파일 첨부 기능을 통한 파일 아이콘 삽입 후 작성 완료된 게시글을 수정할 때 파일 아이콘의 구조가 비정상적으로 되는 문제 수정 |
| v1 | `1.5.0` | 2025-03-15 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.0.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.5.1` | 2025-03-16 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.1.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v1 | `1.5.2` | 2025-03-16 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.2.zip` | 푸른산타(https://sir.kr/bbs/profile.php?mb_id=bodr)님의 게시판 관리자모드 에러 수정 버전을 적용 |
| v1 | `1.5.3` | 2025-03-23 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.3.zip` | 현재 작성중인 텍스트/선택한 텍스트의 글자 크기를 감지하여 글자 크기 리스트의 해당 값을 호버 처리하도록 기능 추가 |
| v1 | `1.5.4` | 2025-03-25 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.4.zip` | 권한 문제로 이미지 업로드 오류가 발생 하는 환경이 있는 것으로 파악되어 image_upload.php에 755 권한을 부여하는 기능을 추가하였습니다. |
| v1 | `1.5.4_B` | 2025-03-25 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.5.4b.zip` | B(Branch) 계열 — 그누보드5 외의 사용자를 위해 만들어진 커스텀 버전. 기본 T2Editor 과 달리 꾸준한 업데이트를 보장하지 않는다. |
| v1 | `1.6.0` | 2025-03-26 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.6.0.zip` | 자동 다크모드(버튼을 통해 on/off 가능)를 추가하였습니다. |
| v1 | `1.6.1` | 2025-03-30 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.6.1.zip` | editor.lib.php에서 다크모드 버튼 사용 여부 선택 및 강제 다크모드/라이트모드 적용 기능을 추가하였습니다. (주석의 지시를 따르면 됩니다.) |
| v1 | `1.6.2` | 2025-04-18 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.6.2.zip` | (푸른 산타님의 제보) 게시글 내용 없이 게시 가능한 문제 수정 |
| v1 | `1.6.3` | 2025-05-01 | EOL | 1.0 (판본 안 `License_ko.txt`) | `1.6.3.zip` | 외부 라이브러리를 자체 호스팅하도록 수정, |

#### 계열 v2 — 3개 (2025-05-01 ~ 2025-06-03)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v2 | `2.0.0_B` | 2025-05-01 | EOL | 1.0 (판본 안 `License_ko.txt`) | `2.0.0b.zip` | B(Branch) 계열 — 그누보드5 외의 사용자를 위해 만들어진 커스텀 버전. 기본 T2Editor 과 달리 꾸준한 업데이트를 보장하지 않는다. |
| v2 | `2.0.0C-1.0.0` | 2025-06-02 | EOL | 1.0 (판본 안 `License_ko.txt`) | `2.0.0c-1-0-0.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v2 | `2.0.0` | 2025-06-03 | EOL | 1.0 (판본 안 `License_ko.txt`) | `2.0.0.zip` | v2 정식 출시: REST API + HTMX/Alpine 프론트엔드 + SQLite. |

#### 계열 v3 — 10개 (2025-06-07 ~ 2025-10-06)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v3 | `3.0.0` | 2025-06-07 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.0.zip` | T2Editor 2.0.0에서의 플러그인 및 관리 파일의 비일관적인 구조 개선 / 기존 이미지 및 파일 업로드 용량과 허용 확장자를 개별 파일을 통해 수정해야 하던 것을 Path: T2Editor/config/upload_config.php 를 통해 통합 관리가 가능하도록 수정 / Claude Ai를 통해 T2Editor 유지 보수가 쉽도록 Ai를 위한 가이드 문서 추가 |
| v3 | `3.0.1` | 2025-06-08 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.1.zip` | 코드 블럭에 아이콘 삽입되며 코드의 일부가 회손되는 문제 수정 |
| v3 | `3.0.2` | 2025-06-21 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.2.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v3 | `3.0.3` | 2025-08-24 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.3.zip` | 이미지 블록의 공백 줄바꿈이 중복 추가되거나 사라지는 등의 이미지 블록 간격 처리 문제 수정 |
| v3 | `3.0.4` | 2025-08-29 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.4.zip` | 노트 없음 (원문: "배포 페이지에 변경 내역이 기재되어 있지 않다") |
| v3 | `3.0.5` | 2025-08-30 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.5.zip` | 코드블럭이 두 개 이상일 경우 공백 줄바꿈의 개수가 늘어나는 오류 해결. (js/core.js, plugin/code/code.js 수정됨) |
| v3 | `3.0.6` | 2025-08-31 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.6.zip` | 이미지 블록, 파일 블록, 비디오 블록의 공백 줄바꿈의 개수가 늘어나는 오류 해결. (js/core.js, plugin/image/image.js, plugin/file/file.js, plugin/video/video.js 수정됨) |
| v3 | `3.0.7` | 2025-10-03 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.7.zip` | 코드블럭에 HTML 코드를 입력하고 게시하면, 텍스트로 표시되어야 할 HTML이 실제로 실행되는 XSS 취약점이 발견되어 |
| v3 | `3.0.8` | 2025-10-03 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.8.zip` | 링크 클릭 팝업 메뉴 (plugin/link.js, css/dark.css, css/core.css) / 텍스트 붙여넣기 (js/core.js) |
| v3 | `3.0.9` | 2025-10-06 | EOL | 1.0 (판본 안 `License_ko.txt`) | `3.0.9.zip` | 에디터에서 텍스트를 붙여넣을 경우, 커서가 붙여넣은 텍스트의 끝으로 이동하지 않고 기존 선택 위치에 머무르는 현상을 수정하였습니다. |

#### 계열 v4 — 3개 (2025-10-07 ~ 2025-10-08)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v4 | `4.0.0` | 2025-10-07 | EOL | 1.0.1 (판본 안 `readme.txt`) | `4.0.0.zip` | 에디터 콘텐츠 html로 내보내기 스킨 호환성 향상 (plugin/export/export_html_skin.html) / 라이센스 검증 방식 및 라이센스 파일 변경 (editor.lib.php, reademe.txt, License_ko.txt&License_en.txt -> Old로 이동) |
| v4 | `4.0.1` | 2025-10-08 | EOL | 1.0.1 (판본 안 `readme.txt`) | `4.0.1.zip` | editor.lib.php의 reademe.txt 라이선스 검증 코드 강화 |
| v4 | `4.0.2` | 2025-10-08 | EOL | 1.0.1 (판본 안 `readme.txt`) | `4.0.2.zip` | 이미지 업로드 시간 및 지연에 따른 이미지 블록 추가 대기시간 단축 (/plugin/image/image.js) |

#### 계열 v5 — 32개 (2025-10-08 ~ 2025-12-08)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v5 | `5.0.0` | 2025-10-08 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.0.0.zip` | 그누보드5 환경뿐만아니라 다른 apache/nginx & php7.5+ 환경에서 호환 가능하도록 기존 호환 코드를 강화. (editor.lib.php, config/t2_config.php) |
| v5 | `5.1.0-beta1.0.2` | 2025-10-11 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.1.0beta1-0-2.zip` | 베타/체험판 — 정식 판본이 아니다. |
| v5 | `5.0.1` | 2025-10-19 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.0.1.zip` | 라이센스 검증 오작동 및 에디터 경로 오류 수정 (/config/t2_config.php) |
| v5 | `5.1.0` | 2025-10-21 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.1.0.zip` | [협업 기능 추가] - /plugin/collab/collab.js, /collab 추가 |
| v5 | `5.1.1` | 2025-10-21 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.1.1.zip` | 협업 플러그인의 방 생성 파일 collab_number.php의 권한 부여 실패로 인한 방 생성 오류 문제 해결 (/plugin/collab/collab_number.php) |
| v5 | `5.1.2` | 2025-11-03 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.1.2.zip` | 협업 플러그인 권한 부여 관련 수정 / 협업 플러그인 사용성 수정 / 테이블 플러그인 수정 |
| v5 | `5.1.3` | 2025-11-03 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.1.3.zip` | 링크 플러그인 작동 불가 오류 해결 (/t2editor/plugin/link/link.js) |
| v5 | `5.2.0` | 2025-11-04 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.2.0.zip` | 그림 플러그인과의 호환성 수정 (/t2editor/editor.lib.php) |
| v5 | `5.2.1` | 2025-11-05 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.2.1.zip` | 그림 플러그인 스타일 향상 (/t2editor/plugin/draw.js, /t2editor/css/core.css, /t2editor/css/dark.css) |
| v5 | `5.2.2` | 2025-11-06 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.2.2.zip` | 텍스트 색상 및 텍스트 배경색 적용 색상 팔레트의 스타일 및 사용성 향상 (/t2editor/js/core.js, /t2editor/css/core.css) |
| v5 | `5.3.0` | 2025-11-07 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.3.0.zip` | Ai기능 도입: |
| v5 | `5.4.0` | 2025-11-08 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.0.zip` | Ai기능 도입: |
| v5 | `5.4.1` | 2025-11-09 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.1.zip` | 새로 업데이트된 T2Editor interaction AI V1.4.0 API의 유저 및 도메인 사용량 제한을 표시하도록 수정 (1.4.0은 기존 1.0.0 대비 콘텐츠 추가 오류 현상과 부적절한 발언을 대폭 줄인 버전입니다.) / 모바일 디자인 개선 / powered by Ai의 모델 리스트 출력을 하드 코딩 방식에서 dsclub의 model_list.json에서 가져오도록 개선 |
| v5 | `5.4.2` | 2025-11-10 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.2.zip` | 새로 업데이트 된 T2Editor Ai API / 0의 보안 라이선스 요구를 충족하도록 ai플러그인 수정 (/t2editor/plugin/ai/ai.js) ( / 2 미만의 버전은 신속히 ai플러그인을 업데이트 하시길 바랍니다. |
| v5 | `5.4.3` | 2025-11-10 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.3.zip` | api 사용 제한 데이터 정보 가져오지 못하는 오류에 대한 ai플러그인 수정 (/t2editor/plugin/ai/ai.js) / 그림 그리기 플러그인 좀 더 고해상도 + 그리는 선 부드럽게 처리 (/t2editor/plugin/draw/draw.js) |
| v5 | `5.4.4` | 2025-11-13 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.4.zip` | 미디어 블록 추가 시 자동으로 삽입되는 줄바꿈 영역에서, 사용자가 자동 줄바꿈 영역의 맨 처음에 텍스트를 입력하지 않을 경우 추가적인 줄바꿈이 정상적으로 동작하지 않는 문제가 확인되었습니다. |
| v5 | `5.4.5` | 2025-11-13 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.4.5.zip` | 에디터에서 텍스트 붙여넣기 동작이 안되는 문제를 해결하였습니다. |
| v5 | `5.5.0` | 2025-11-14 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.5.0.zip` | 0 |
| v5 | `5.5.1` | 2025-11-15 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.5.1.zip` | 안드로이드 환경에서 Ai플러그인이 에디터에 콘텐츠를 추가하지 못하는 문제 해결 (t2editor/plugin/ai/ai.js) |
| v5 | `5.6.0` | 2025-11-16 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.6.0.zip` | 0으로 안정화 업데이트 (코드블럭, 테이블 블럭 등의 콘텐츠 블록 전달 오류 수정)AI 콘텐트 재배치 플러그인의 블록 추가 오류 문제 해결 및 선택 편집하기 기능 추가(t2editor/plugin/ai_rearrange/ai_rearrange.js)*선택 편집하기 기능을 소개합니다.AI 콘텐트 재배치 플러그인의 선택 편집하기를 누르면 에디터 안의 콘텐트들을 선택하고 AI에게 해당 부분만 세부 편집을 할 수 있는 기능입니다.단일 또는 여러개의 텍스트, 콘텐트 블록들을 클릭하여 AI에게 수정 요청을 할 수 있습니다. |
| v5 | `5.6.1` | 2025-11-17 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.6.1.zip` | T2Editor Ai interaction 안정화 업데이트&스타일 수정 (코드블럭, 테이블 블럭 등의 콘텐츠 블록 전달 오류 수정) (t2editor/plugin/ai/ai.js)AI 콘텐츠 재배치 플러그인 스타일 및 사용성 향상 (t2editor/plugin/ai_rearrange/ai_rearra… |
| v5 | `5.6.2` | 2025-11-18 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.6.2.zip` | 이미지 붙여넣기 시 이미지블록으로 추가 기능 추가(t2editor/plugin/imeage/imeage.js) |
| v5 | `5.7.0` | 2025-11-22 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.7.0.zip` | 2 -&gt; / 2 버전 (t2editor/plugin/draw/draw.js)검색 기능 추가 (t2editor/plugin/search/search.js)- T2Search API 적용 ( https://dsclub.kr/service/search )- 에디터 내의 텍스트 검색가능- T2Search API로 검색한 검색 결과를 클릭하여 에디터에 제목-본문(코드블럭)-링크로 추가 가능 |
| v5 | `5.7.1` | 2025-11-23 | EOL | 1.0.1 (판본 안 `readme.txt`) | `5.7.1.zip` | 캐시 도입을 통한 검색 속도 개선 (t2editor/plugin/search/search.js)- T2Search API 캐시 도입- 검색 결과 없음 안내 표시 추가- API 응답 불가 안내 표시 추가 |
| v5 | `5.7.2` | 2025-11-26 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.7.2.zip` | 0 Initial development period: / 23 - / 11 Copyright (c) 2025 Tak2 (dsclub.kr) [한국어 버전] 저작권 및 소유권: T2Editor의 저작권은 Tak2(dsclub.kr)에게 있습니다. |
| v5 | `5.8.0` | 2025-11-29 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.8.0.zip` | 에디터의 가로 사이즈에 따른 반응형 툴바 기능을 추가했습니다.반응형 툴바 - 그룹 버튼이란 에디터 너비에 따라 버튼을 자동 그룹화하여 서브 툴바로 대체하는 기능입니다.모바일, 테블릿 환경에서 툴바의 버튼 수가 과다하게 많아져 사용 경험과 심미성이 저하되는 문제를 해결합니다.반응형 툴바 - 그룹 버튼 … |
| v5 | `5.8.1` | 2025-12-01 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.8.1.zip` | 0으로 롤백 (t2editor/plugin/file/file.js) |
| v5 | `5.8.2` | 2025-12-05 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.8.2.zip` | 0에서의 설정 방법과 같습니다. / 0과 / 1 이용자분들은 기존 설정을 복사&amp;붙여넣기 하시면 됩니다.)반응형 툴바 - 그룹 버튼 설정 안내:t2editor/js/toolbar.js의 getDefaultConfig 안에 원하는 범위의 그룹을 설정합니다.- 키: ‘WidthA-WidthB’ (에디터 너비 범위, px 단위) - 값: 배열로 그룹 목록. |
| v5 | `5.8.3` | 2025-12-06 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.8.3.zip` | 0에서의 설정 방법과 같습니다. / 0과 / 1, |
| v5 | `5.8.4` | 2025-12-07 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.8.4.zip` | 이미지 추가 불가 오류를 해결하였습니다 (/t2editor/plugin/image/image.js) |
| v5 | `5.9.0` | 2025-12-07 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.9.0.zip` | 각 블록(이미지 블록, 동영상 블록, 코드 블록, 테이블 블록, 그림 블록)들을 위, 아래로 이동할 수 있는 알약형 이동 바를 블록 하단에 추가하도록 구현하였습니다. |
| v5 | `5.10.0` | 2025-12-08 | EOL | 2.0.0 (판본 안 `readme.txt`) | `5.10.0.zip` | 블록 이동 버튼 기능 안정화 (t2editor/js/core.js, t2editor/plugin/image/image.js, t2editor/plugin/video/video.js, t2editor/plugin/code/code.js, t2editor/plugin/table/table.js, t2editor/plugin/draw/draw.js)(게시글 편집 시 삭제/편집/리사이즈/이동 버튼 안뜨는 오류 해결) / 파일 블록에도 이동 버튼 기능 추가 (t2editor/plugin/file/file.js) / 플러그인 순차 로딩 기능 추가 (t2editor/editor.lib.php)editor.lib.php의 $plugin_priority에서 순서 설정 가능.0 = 즉시, 1,2, |

#### 계열 v6 — 1개 (2025-12-09 ~ 2025-12-09)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v6 | `6.0.0` | 2025-12-09 | EOL | 2.0.0 (판본 안 `readme.txt`) | `6.0.0.zip` | 플러그인 등록 간소화 및 핵심 파일 구조 일부 변경 (t2editor/editor.lib.php, t2editor/js/core.js) / 파일 플러그인 로딩 안되는 오류 수정 (t2editor/plugin/file/file.js) / 링크 단축+qr코드 생성 T2ClipURL 플러그인 추가 |

#### 계열 v7 — 3개 (2025-12-14 ~ 2025-12-19)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v7 | `7.0.0` | 2025-12-14 | EOL | 2.0.0 (판본 안 `readme.txt`) | `7.0.0.zip` | 플러그인 별 독립 css 파일 사용 기능 추가- 기존 core.css, dark.css, 플러그인 js파일에 삽입되어있던 스타일들을 각 플러그인이름.css로 변경하여 유지보수성 향상 (t2editor/editor.lib.php, t2editor/css/core.css, t2editor/css/dark.css, t2editor/plugin/대부분 플러그인)- 플러그인 스타일 작성 시 T2Editor/plugin/plugin_name/plugin_name.css에 추가해두면 자동으로 editor.lib.php에 추가 / 이미지 플러그인 사용성 개선 |
| v7 | `7.0.1` | 2025-12-16 | EOL | 2.0.0 (판본 안 `readme.txt`) | `7.0.1.zip` | 업데이트 중 제거된 텍스트&amp;텍스트 배경 색상 선택기 복구 |
| v7 | `7.0.2` | 2025-12-19 | EOL | 2.0.0 (판본 안 `readme.txt`) | `7.0.2.zip` | 순차 css로드 기능에 오류가 발생하여 ios환경을 제외한 안드로이드 및 윈도우, 리눅스 브라우저에서 스타일이 적용되지 않던 문제를 해결하였습니다. |

#### 계열 v8 — 6개 (2025-12-30 ~ 2026-03-26)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v8 | `8.0.0` | 2025-12-30 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.0.0.zip` | t2_css_min.php와 t2_js_min.js를 통해 core.css, dark.css를 비롯한 플러그인들의 css파일들, core.js, utils.js, toolbar.js, 플러그인 js파일들을 min.css, min.js처럼 압축로딩할 수 있는 기능을 추가하였습니다.사용법:true/fal… |
| v8 | `8.0.1` | 2026-01-04 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.0.1.zip` | T2Editor 로고 수정(개선) |
| v8 | `8.1.0` | 2026-01-05 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.1.0.zip` | 검색 플러그인 개선 (t2editor/plugin/search/search.js)- 기존 검색 옵션 토글 기능 변경(에디터 내 콘텐츠 검색 on/off -&gt; T2Search 검색 on/off)(T2Search가 켜져있으면 검색창 아래에 powered by T2Search 로 출력되며, off 시… |
| v8 | `8.1.1` | 2026-01-05 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.1.1.zip` | ai 플러그인 작동 불가 해결 (dsclub.kr과의 연결 문제)(t2editor/plugin/ai/ai.js, t2editor/plugin/ai_rerrange/ai_rerrange.js) |
| v8 | `8.1.2` | 2026-03-26 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.1.2.zip` | ai 플러그인 작동 불가 해결 (dsclub.kr과의 연결 문제)(t2editor/plugin/ai/ai.js, t2editor/plugin/ai_rerrange/ai_rerrange.js, dsclub.kr서버)작성중이던 게시글 자동 저장 불가 오류 해결 |
| v8 | `8.2.0` | 2026-03-26 | EOL | 2.0.0 (판본 안 `readme.txt`) | `8.2.0.zip` | T2Editor 외의 에디터로 작성한 콘텐츠에 대한 마이그레이션 지원editor.lib.php의 ‘마이그레이션 옵션’에서 아래와 같이 선택가능. / T2Editor 로고 디자인 수정- 'T2'에 볼드 효과 추가. |

#### 계열 v9 — 7개 (2026-04-07 ~ 2026-05-29)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v9 | `9.0.0` | 2026-04-07 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.0.0.zip` | T2Editor SafeAI추가- 자체 개발 nsfw필터로 유저가 악의적인 19금 이미지를 게시할 때 필터링 가능 (editor.lib.php에서 원하는 옵션으로 수정, 서버에서의 실행&브라우저에서의 실행 전부 지원)- 아직까지는 정확도가 매우 높은편은 아닌 베타버전으로, 문서와 19금 웹툰, 여성의 가슴 이미지 정도를 구분하며 필터링 가능 / T2Meme 플러그인 추가 |
| v9 | `9.1.0` | 2026-04-19 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.1.0.zip` | T2Editor SafeAI업그레이드 및 패치- NSFWJS의 v2-mid모델을 사용하여 (기대)정확도 향상(93%)- 경고 및 차단 관련 모달 디자인 개선&T2Editor SafeAI관련 안내 추가- 서버버전 nsfw모드 지원중단 |
| v9 | `9.1.1` | 2026-04-20 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.1.1.zip` | 그누보드5 환경에서 자동 저장 기능이 활성화된 상태로 관리자 페이지 게시판 관리를 사용할 경우, 이전에 저장된 에디터 내용이 의도치 않게 복원되어 게시판 설정 폼이 오염되거나 잘못된 스타일이 적용되는 문제가 있었습니다.이번 패치는 editor_lib.php 단독 수정으로, 그누보드5 관리자 페이지(/… |
| v9 | `9.1.2` | 2026-04-23 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.1.2.zip` | 2-alpha / 5와 동일합니다.*상세 업데이트 및 패치 감사 보고서: https://dsclub.kr/service/editor/document/?action=view&slug=t2editor- / 1-대비- |
| v9 | `9.1.3` | 2026-04-27 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.1.3.zip` | 2- / 3-alpha / 0-chatgpt업데이트-감사서요약: |
| v9 | `9.2.0` | 2026-04-30 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.2.0.zip` | 일부 플러그인들 오작동 패치 / 일부 필수 플러그인들 보안 패치 완료 / 일부 플러그인들의 스타일 작동 미흡 패치 |
| v9 | `9.3.0` | 2026-05-29 | EOL | 2.0.0 (판본 안 `readme.txt`) | `9.3.0.zip` | 이미지 플러그인 - 사진 간편 편집 기능 추가    패치 사항: / ios/safari 엔터키 및 공백 추가 버그 해결개선: / 에디터 툴바 버튼 비율 및 사이즈 조정 |

#### 계열 v10 — 9개 (2026-06-24 ~ 2026-07-27)

| 계열 | 판본 | 실제 배포일 | 상태 | 라이선스 | ZIP 자산 | 요약(릴리즈 노트 원문 기반) |
|---|---|---|---|---|---|---|
| v10 | `10.0.0` | 2026-06-24 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.0.0.zip` | php권장 사양이 기존 7.4에서 8.0 이상으로 변경되었습니다. |
| v10 | `10.0.1` | 2026-06-27 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.0.1.zip` | php권장 사양이 기존 7.4에서 8.0 이상으로 변경되었습니다. |
| v10 | `10.1.0` | 2026-06-29 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.1.0.zip` | php7.4 호환 추가! |
| v10 | `10.2.0` | 2026-07-05 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.2.0.zip` | 업데이트: |
| v10 | `10.3.0` | 2026-07-16 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.3.0.zip` | 다국어 인터페이스 지원 (한국어, 영어, 일본어, 중국어 간체) |
| v10 | `10.3.1` | 2026-07-20 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.3.1.zip` | 개발자 도구 팝업 기능으로 인한 모바일 툴바 안보임 이슈 해결 - 라이믹스 / extend/t2ext_toolbar_toggle.js - 기여&저작권. DIGWB(https://rhymix.org/member/member_info?member_srl=1911515) |
| v10 | `10.4.0` | 2026-07-20 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.4.0.zip` | T2Editor 10.4.0은 크게 두 가지 방향으로 개선됐습니다. 하나는 사이트 운영자가 에디터를 설치하고 관리하기 편하게 만든 부분이고, 다른 하나는 실제로 글을 쓸 때 느껴지는 기능 개선입니다. 관리자 입장에서는 설치할 때 뭘 놓쳤는지 알려주는 안내, 모든 설정을 한곳에서 관리하는 화면, 클릭 … |
| v10 | `10.5.0` | 2026-07-22 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.5.0.zip` | CMS 관리자 권한 연동 |
| v10 | `10.5.1` | 2026-07-27 | 현행 공개 판본 | 3.0.0 (판본 안 `readme.txt`) | `10.5.1.zip` | cms(그누보드5, 라이믹스)에서 로그인 시 cms 자동 로그인 뿐만아니라 T2Editor 자체적인 로그인이 가능하도록 기능 추가 |
### 1.1 계열 총괄

| 계열 | 판본 수 | 최초 실제 배포일 | 최종 실제 배포일 | 릴리즈 상태 | 저장소 상태 | 저장소 description |
|---|---|---|---|---|---|---|
| v1 | 19 | 2025-01-31 | 2025-05-01 | EOL | public | `[EOL] … 계열 상태 EOL` |
| v2 | 3 | 2025-05-01 | 2025-06-03 | EOL | public | `[EOL] …` |
| v3 | 10 | 2025-06-07 | 2025-10-06 | EOL | public | `[EOL] …` |
| v4 | 3 | 2025-10-07 | 2025-10-08 | EOL | public | `[EOL] …` |
| v5 | 32 | 2025-10-08 | 2025-12-08 | EOL | public | `[EOL] …` |
| v6 | 1 | 2025-12-09 | 2025-12-09 | EOL | public | `[EOL] …` |
| v7 | 3 | 2025-12-14 | 2025-12-19 | EOL | public | `[EOL] …` |
| v8 | 6 | 2025-12-30 | 2026-03-26 | EOL | public | `[EOL] …` |
| v9 | 7 | 2026-04-07 | 2026-05-29 | EOL | public | `[EOL] …` |
| **v10** | **9** | **2026-06-24** | **2026-07-27** | **현행 공개 판본** | public | `계열 상태 현행 공개 판본` (EOL 표기 없음) |
| v11 | 0 (private) | — | — | 개발 중 | **private** | `T2Editor Dev` |

저장소 메타 실측 (`gh api repos/tak2-08/T2Editor-v{N}`):

| 계열 | created_at | pushed_at | default_branch | private |
|---|---|---|---|---|
| v1 | 2026-09-27T14:20:55Z | 2026-09-27T15:16:51Z | main | false |
| v2 | 2026-09-27T14:22:53Z | 2026-09-27T15:17:12Z | main | false |
| v3 | 2026-09-27T14:23:17Z | 2026-09-27T15:17:36Z | main | false |
| v4 | 2026-09-27T14:24:03Z | 2026-09-27T15:17:48Z | main | false |
| v5 | 2026-09-27T14:24:55Z | 2026-09-27T15:17:54Z | main | false |
| v6 | 2026-09-27T14:27:11Z | 2026-09-27T15:28:53Z | main | false |
| v7 | 2026-09-27T14:27:26Z | 2026-09-27T15:28:59Z | main | false |
| v8 | 2026-09-27T14:27:49Z | 2026-09-27T15:29:06Z | main | false |
| v9 | 2026-09-27T14:28:25Z | 2026-09-27T15:29:19Z | main | false |
| v10 | 2026-09-27T14:29:15Z | 2026-09-27T15:29:30Z | main | false |
| v11 | 2026-08-10T06:59:10Z | 2026-09-28T13:55:00Z | main | **true** |

**해석**: v1~v9 저장소는 **2026-09-27 당일 9분 안에** 연속 생성·생성·push 됐다(14:20~14:29). 즉 EOL 고지는 **사후 아카이브 행위**이며, 판본이的那一刻에 내려간 게 아니다. v11만 `created_at`이 2026-08-10으로 정상이며 계속 push 중이다.

---

## 2. 버전 판별법 — 후배가 가장 자주 틀리는 구간

### 2.1 `readme.txt` 안에 버전 숫자가 **2개** 있다 (v10·v11 실물 확인)

v10.5.1 배포본 ZIP을 실제 내려받아(`browser_download_url`, sha256 `9ded2e84…c3196` — 릴리즈 노트 기재값과 일치) 해제한 `t2editor/readme.txt` 10,793 B와, v11 워크트리 `readme.txt` 10,793 B를 **바이트 단위로 대조**했다. 차이는 3줄뿐이다:

```
  2c2,3
  < ver_10.5.1          ← v10
  < date_2026.07.27
  ---
  > ver_11.0.0          ← v11
  > date_2026.09.08
  131c131
  < 자세한 내용: locales/README.txt, plugin/README_LOCALES.txt
  ---
  > 자세한 내용: locales/README.txt, plugin/readme-locales.txt
```

즉 **라이선스 본문(3.0.0)은 v10과 v11이 바이트 동일**하고, 달라지는 건 머리 3줄뿐이다.

**`readme.txt` 1~6행 (v10·v11 동일 구조, 라인 번호 실측)**:

```
1: Path: T2Editor/readme.txt
2: ver_11.0.0                      ← ⓐ 에디터 판본
3: date_2026.09.08                 ← ⓑ 빌드 날짜
4: Copyright (c) 2025 Tak2 (dsclub.kr)
5: The_first.license_License_ko.txt & License_en.txt
6: email_dsclub2023@gmail.com
```

**`readme.txt` 10~13행과 69~72행 — 라이선스 계약 판본**:

```
10: T2Editor License_Ko
11: Version: 3.0.0                  ← ⓒ 라이선스 계약 판본 (에디터 판본과 무관)
12: Initial development period: 2025.01.23 - 2025.02.11
13: Copyright (c) 2025 Tak2 (dsclub.kr)
…
69: T2Editor License_En
70: Version: 3.0.0
71: Initial development period: 2025.01.23 - 2025.02.11
72: Copyright (c) 2025 Tak2 (dsclub.kr)
```

→ **ⓐ `ver_11.0.0` 과 ⓒ `Version: 3.0.0` 은 서로 다른 세대다.** v11에서 11을 기대하는데 라이선스에서 3을 읽으면 실수다.

### 2.2 판독 코드 위치 (v11 실물, file:line)

| 역할 | 파일:라인 | 내용 |
|---|---|---|
| **에디터 판본 판독(정본)** | `config/t2_policy.php:886-894` | `function T2Ereadmeversion()` — `/^ver_(...)$/mi` 정규식으로 `ver_` 뒤 숫자 추출 |
| 판독 진입점 | `core/editor.core.php:497-499` | `function get_readme_version() { return T2Ereadmeversion(T2EDITOR_PATH); }` |
| 판독 결과 사용 | `core/editor.core.php:822` · `:1802` | `$ver = get_readme_version();` |
| JS 노출 | `core/editor.core.php:1206` | `window.T2EDITOR_VERSION = <ver>;` |
| 관리자 화면 표시 | `admin/api.core.php:2124` | `$editorVersion = get_readme_version() ?: T2Ereadmeversion(dirname(__DIR__));` |
| 라이선스 머리 검증 | `core/editor.core.php:28-40` | `T2Elicenseok()` — readme.txt **1~4행**을 정규화 후 sha256 대조 |
| 라이선스 정규화 | `config/t2_license.php:25-35` | `T2Elicensecanon()` — 1~4행만 |

`core/editor.core.php:33-34` 정규화 규칙:

```php
$c = rtrim($l[0]) . "\n" . (strncmp($l[1], 'ver_', 4) === 0 ? 'ver_' : '?') . "\n"
    . (strncmp($l[2], 'date_', 5) === 0 ? 'date_' : '?') . "\n" . rtrim($l[3]);
return hash_equals('84f16df0…c7ad', hash('sha256', $c));
```

**즉 `readme.txt` 의 1~4행은 해시로 묶여 있다.** 1~4행을 손대면 `T2Elicenseok()` 가 `false` 가 되고, `core/editor.core.php:38` 의 문구가 화면에 뜬다:

> `T2Editor 라이선스 정본(readme.txt)의 저작자 표시가 없거나 변경되었습니다. 이 배포본은 T2Editor 라이선스를 위반한 상태입니다.`

**주의(경고)**: `core/editor.core.php` 경로는 v11 전용이다. **v10 배포판 ZIP에는 `core/editor.core.php` 가 없고 루트 `t2editor/editor.core.php`(97,337 B)만 있다.** v10의 판독 경로를 찾으려면 v10 ZIP을 직접 해제해야 한다. (v11 쪽 지시로 v10을 읽으면 안 된다.)

### 2.3 "이 숫자는 판본이 아니다" 함정 목록

| # | 함정 | 근거 | 실수 결과 |
|---|---|---|---|
| 1 | `readme.txt:11` `Version: 3.0.0` | `readme.txt:2` `ver_11.0.0` 과 다른 세대 | "v11 라이선스가 3.0.0인데 왜 11이 아니라 3인가" → 라이선스 판본을 에디터 판본으로 오독 |
| 2 | 릴리즈 API `published_at` | 93건 전부 8분 51초 창 | 모든 판본이 2026-09-27那一天로 기록 |
| 3 | `tag` vs `tag_name` | 로컬 JSONL은 `tag`, GitHub API는 `tag_name` | 로컬 파일을 파싱하면 tag가 전부 `undefined` |
| 4 | 로컬 `data/releases/vN.json` 은 **JSON 배열이 아니라 JSONL** | 줄 단위로 `JSON.parse` 해야 함 | `Unexpected non-whitespace character after JSON` |
| 5 | `data/versions/vN.json` 에 `private` 필드 없음 | 로컬에는 `private` 가 저장되지 않음 | "public 저장소가 private이다" 라는 거짓 판정 |
| 6 | 태그의 `_B` = Branch 계열 | `v1.5.4_B`, `v2.0.0_B` 본문 원문: *"B(Branch) 계열 — 그누보드5 외의 사용자를 위해 만들어진 커스텀 버전. 기본 T2Editor 과 달리 꾸준한 업데이트를 보장하지 않는다."* | `_B`를 정상 다음 판본으로 순서 매김 |
| 7 | `-beta` / `beta` = 체험판 | `v1.0.0-beta`(prerelease=true), `v5.1.0-beta1.0.2`(prerelease=true). 본문 원문: *"베타/체험판 — 정식 판본이 아니다."* | 체험판을 정식 판본 목록에 포함 |
| 8 | `v5.1.0-beta1.0.2` > `v5.0.0` 인가? | 실제 배포일: `5.0.0`=2025-10-08, `5.1.0-beta1.0.2`=2025-10-11. **버전 문자열 비교로 정렬하면 베타가 정식보다 앞선다** | 계보 순서 뒤집힘 |
| 9 | `v9.1.2` 본문의 `9.1.2-alpha1.0.5` | 원본 데이터에 `\r` 개행이 박혀 `9. / 1. / 2-alpha / 1. / 0. / 5` 로 쪼개짐 | 존재하지 않는 판본으로 오독 (위 §0 함정 3) |
| 10 | `v1.0.0-beta` 라이선스 = `none` | 메타표 `| 배포 시점 유효 라이선스 | none` + `| readme.txt |` **이 판본 배포본에 없음** | "라이선스 1.0이 적용된다"고 단정 |
| 11 | v1 판본 라이선스 원문 위치 | 메타표: `1.0 (판본 안 \`License_ko.txt\`)` — `readme.txt` 가 아니라 별도 파일 | `readme.txt` 만 읽고 라이선스를 놓침 |
| 12 | v11 루트에 `t2_css_min.php` 없음 | v11은 `endpoints/t2_css_min.php`(436 B). 루트 파일은 v10에만 존재 (2,691 B) | 존재하지 않는 파일을 열람 |
| 13 | v11 `admin/t2admin.key.php` | v10은 `.key.txt` → `.key` 이름변경 방식. **v11은 `.php` 파일 안에 `return array('secret' => '')`** | v10 절차(`이름을 변경합니다`)를 v11에 적용하면 실패 |

---

## 3. 계열별 EOL 상태와 실제 근거 — "고지가 어디에 있는가"

### 3.1 실측 결과

`gh api repos/tak2-08/T2Editor-v{N}` 의 `description` 필드와 `releases[].body`/`releases[].name`를 계열별로 대조했다.

| 계열 | 저장소 `description`에 EOL? | 릴리즈 **제목**에 EOL? | 릴리즈 **본문**에 EOL 배너? | 본문 `\| 상태 \|` 값 |
|---|---|---|---|---|
| v1 | ✅ `[EOL]` 접두 | ✅ 19/19 (`T2Editor 1.0.0-beta [EOL]`) | ✅ 19/19 | `EOL` 19/19 |
| v2 | ✅ | ✅ 3/3 | ✅ 3/3 | `EOL` 3/3 |
| v3 | ✅ | ✅ 10/10 | ✅ 10/10 | `EOL` 10/10 |
| v4 | ✅ | ✅ 3/3 | ✅ 3/3 | `EOL` 3/3 |
| v5 | ✅ | ✅ 32/32 | ✅ 32/32 | `EOL` 32/32 |
| v6 | ✅ | ✅ 1/1 | ✅ 1/1 | `EOL` 1/1 |
| v7 | ✅ | ✅ 3/3 | ✅ 3/3 | `EOL` 3/3 |
| v8 | ✅ | ✅ 6/6 | ✅ 6/6 | `EOL` 6/6 |
| v9 | ✅ | ✅ 7/7 | ✅ 7/7 | `EOL` 7/7 |
| **v10** | ❌ `계열 상태 현행 공개 판본` | ❌ **0/9** | ❌ **0/9** | `현행 공개 판본` 9/9 |

**요약: EOL 고지는 v1~v9에 한해 "3중"(저장소 설명 + 릴리즈 제목 + 릴리즈 본문)이고, v10은 3곳 어디에도 없다.**

- v1~v9 저장소 `description` 원문 예(v1): `"[EOL] T2Editor v1 계열 배포본 19개(1.0.0-beta~1.6.3) 원본 아카이브 · 계열 상태 EOL · Copyright (c) 2025 Tak2 (dsclub.kr) · 무료 재배포, 상업적 판매 금지"`
- v10 저장소 `description` 원문: `"T2Editor v10 계열 배포본 9개(10.0.0~10.5.1) 원본 아카이브 · 계열 상태 현행 공개 판본 · …"` — **`[EOL]` 접두가 없다.**

### 3.2 릴리즈 본문 EOL 배너 원문 (v1~v9 공통)

```
> **⚠️ EOL (지원 종료)** — T2Editor v{N} 계열은 지원이 끝났다. 이 판본에는 기능 추가·버그 수정·보안 패치를 하지 않으며,
> 이 계열은 더 이상 배포되지 않는다.
> 신규 설치·마이그레이션은 [v10](https://github.com/tak2-08/T2Editor-v10)(현행 공개 판본)
> 또는 [v11](https://github.com/tak2-08/T2Editor-v11)(개발 중) 을 본다.
```

### 3.3 ⚠ 후배가 반드시 짚어야 할 비대칭 — **계열 단위 고지가 없다**

**릴리즈 본문은 "판본" 단위로 EOL 을 말하지 않는다.** 전 문구가 `v{N} 계열은` 이다.
- v10의 93개 중 **어느 것도 v10을 EOL 이라고 말하지 않는다.**
- v11은 `private` 이라 **릴리즈 자체가 0건**이다. 따라서 "v10은 현행 공개 판본"이라는 사실은 오직 **저장소 `description`** 에만 있고, **릴리즈 노트로는 확인할 수 없다.**

→ 후배가 "v10은 EOL 이냐"고 물으면: **GitHub 릴리즈로는 답할 수 없다.** 답은 저장소 `description` 에 있다. 그리고 그 저장소는 2026-09-27에 만들어졌다.

---

## 4. v10 → v11 마이그레이션 경로 (가장 중요)

> **전제 명시**: v10 배포판 소스를 **실제로 확보했다**(10.5.1 ZIP, sha256 `9ded2e84dee85ee79650e428fdad42be53bd62520b841d6e2593bf9d277c3196`, 릴리즈 노트 기재값과 일치, 291 엔트리).
> v10 계열 9개 중 **10.5.1만 직접 확인**했다. 10.0.0~10.5.0은 아래 인용이 없다면 "미확인"으로 둔다.

### 4.1 발행 본문 스타일 — `css/content.css` 자동 삽입이 사라졌다

**v10 실측 (v10.5.1 배포본 `t2editor/editor.core.php:1829-1837`)** — 저장 시 본문 HTML 끝에 `<link>` 를 코드상 자동 삽입한다:

```php
1829:    // finalContent 조합
1830:    var contentStyle = '<link href=\"' + {$js_editor_url} + '/css/content.css\" rel=\"stylesheet\">';
1831:    var finalContent = tempDiv.innerHTML;
1832:    // Append content.css only when absent so repeated edit/publish cycles do not accumulate duplicate links.
1833:    if ((finalContent.indexOf('t2-media-block') !== -1 || finalContent.indexOf('t2-table') !== -1 || finalContent.indexOf('t2-code-block') !== -1 || finalContent.indexOf('t2-drawing-block') !== -1)
1834:        && finalContent.indexOf('/css/content.css') === -1) {
1835:        finalContent += contentStyle;
1836:    }
1837:    document.getElementById({$js_id}).value = finalContent;
```

조건: 본문에 `t2-media-block` / `t2-table` / `t2-code-block` / `t2-drawing-block` 중 하나가 있고, 아직 링크가 없을 때만 붙인다.
**v10에는 `css/content.css` (12,725 B) 가 배포본에 실물로 존재한다** (ZIP 인벤토리 확인).

**v11 (guide.txt:343-354, 「7.1 v10 에서 무슨 일이 있었나」)** — v11 문서 원문:

```
v10 은 저장할 때 css/content.css 를 가리키는 <link> 를 본문 HTML 끝에 이어
붙였다. 그런데 CMS 의 HTML 필터가 그 <link> 를 지운다 …
그래서 운영자가 사이트 레이아웃·스킨에 같은 <link> 를 손으로 넣어야 했다.
```

**단정 범위 구분 (중요)**:
- **v10 쪽**: ZIP 실물 + `editor.core.php:1830-1836` — **직접 검증 완료**
- **v11 쪽**: `guide.txt` 문서 + `config/t2_content_styles.php` 코드 — **코드/문서로만 확인, v11 배포 ZIP은 미확보**

**v11의 대체 경로 (v11 실파일 + 라인)**:

| 항목 | v11 위치 | 내용 |
|---|---|---|
| 태그 생성 | `config/t2_content_styles.php:386-395` | `function T2Econtentstyletag(string $mode='link', string $scope='published', string $when='always'): string` — `mode='script'`면 `<script>` , 그 외 `<link rel="stylesheet" data-t2-content-style="1" …>` |
| head 등록 | `config/t2_content_styles.php:441` | `function T2Econtentstyleattach(): bool` |
| 엔드포인트 | `endpoints/t2_css_min.php` (436 B) | 공개 URL 유지 브리지. `config/extend.php` 경유 |
| 진단 | `endpoints/install-check.php` (453 B) | 설치 진단 브리지 |
| URL 규격 | `guide.txt:361` | `GET endpoints/t2_css_min.php?bundle=content&scope=published&format=css&v=<지문>` |
| 로더 | `guide.txt:467` | `<script src="/t2editor/endpoints/t2_css_min.php?bundle=content&amp;format=js"></script>` |
| 조건부 로더 | `guide.txt:486` | `…&amp;when=content` (본문 블록 없는 페이지에는 시트 미전송) |
| 관리 화면 설정값 | `guide.txt:~430` | `auto`(기본) · `link` · `script` · `none` |
| 레거시 호환 파일 | `css/content.css` (20,414 B) | v10 링크용 **생성물**. 손으로 고치지 말 것 (`guide.txt:7.4`) |
| 라이믹스 애드온 | `integration/rhymix/addons/t2editor_content_style/` | 실물 확인 |

`config/t2_content_styles.php` 안에서 `T2Econtentstyletag` / `T2Econtentstyleattach` 심볼이 등장하는 파일은 **자기 자신 하나뿐** (grep 5건 전부 동일 파일). 즉 **v11 코어 내부에서 이를 호출하는 코드가 없다** — 호스트(CMS 어댑터/스킨)가 부르는 진입점이다.

### 4.2 v11 신규 — 서버측 XSS 필터 (v10에는 아예 없음)

| 항목 | v11 위치 | 비고 |
|---|---|---|
| 구현 | `config/t2_sanitize.php` (46,203 B) | |
| `T2Esanhtml()` | `config/t2_sanitize.php:801` | `array` 반환 |
| `T2Esanclean()` | `config/t2_sanitize.php:866` | `string` 반환 |
| 반환 키 | `config/t2_sanitize.php:805` | `array('html'=>…, 'changed'=>false, 'engines'=>array(), 'skipped'=>'')` |
| `skipped` 값 | `:807`(disabled) `:809`(too_large) | 그 외 `no_provider` · `too_complex` 는 `guide.txt:6.2` |
| 호출 예 | `guide.txt:80-82`, `guide.txt:258-260` | `require_once …/config/t2_sanitize.php;` → `$row = T2Esanhtml($_POST['content'] ?? '');` |
| **중요 경고** | `guide.txt:6.2` | *"T2Esanclean() 는 거르지 못한 경우에도 원본을 그대로 돌려주므로, **저장 지점에서는 `T2Esanhtml()` 를 쓴다**"* |
| 중요 경고 2 | `guide.txt:~79` | `skipped !== ''` 를 **"통과했다"로 읽지 않는다** → HTTP 400 처리 |

**v10 배포판 실측**: `config/t2_sanitize.php` **없음**(291 엔트리 전수 확인). `t2_css_min.php` 는 루트에 있고 `?f=` 단일파일 축소기(2,691 B).

### 4.3 v11 신규 — 호스트 보안 다리

| 항목 | v11 위치 |
|---|---|
| 구현 | `config/t2_cms_security.php` (7,169 B) |
| `T2Ehostsecuritysnapshot()` | `config/t2_cms_security.php:137` |
| 사용법 | `guide.txt:551-552` — `require_once '/경로/t2editor/config/t2_cms_security.php'; print_r(T2Ehostsecuritysnapshot());` |
| 정본 문서 | `docs/host-security-bridge.md` (4,476 B, 실물 확인) |

답은 3값(허용/거부/모름)이며 스탠드얼론은 전부 "모름"=`guide.txt:543`.

### 4.4 v11 신규 — 최초 실행 게이트 (v10과 파일명부터 다르다)

| 항목 | v11 | v10(실측) |
|---|---|---|
| 키 파일 | `admin/t2admin.key.php` | `admin/t2admin.key.txt` → `.key` 로 **이름변경** |
| v11 키 파일 내용 | `return array('secret' => '');` (`admin/t2admin.key.php:5`) | (해당 없음 — ZIP에 `t2admin.key*` 파일 0개) |
| 상수 | `admin/api.core.php:44` — `define('T2ADMIN_KEY_FILE', T2EDITOR_BASE_PATH . '/admin/t2admin.key.php');` | — |
| v11 안내 | `extend/admin/js/t2_first_run_guide.js:32` — *"`admin/t2admin.key.php`의 secret 값에 본인만 아는 **12자 이상**의 설치 비밀값을 입력합니다."* | `extend/js/t2_first_run_guide.js:19` — *"`admin/t2admin.key.txt` 파일의 이름을 `admin/t2admin.key`로 변경합니다."* |
| 저장 | `admin/index.core.php:247,273` | — |
| 미설정 시 | `config/first_run_api.core.php:69` — HTTP 409 *"먼저 admin/t2admin.key.php의 secret 값을 12자 이상으로 설정하세요."* | — |
| 게이트 설명 | `guide.txt:117` — *"첫 접속에서 관리자 비밀번호를 정한다. 최초 설정을 마치기 전까지 이 설치는 **tLite 자세로** 돈다"* | — |

**⚠ v10 절차를 v11에 그대로 쓰면 실패한다.** v10은 "파일 이름 바꾸기"이고 v11은 "파일 안에 secret 값 채우기"다. `guide.txt` 에는 최초 실행 게이트 절 자체가 없다 — **2.6 관리 화면**(`guide.txt:117`) 한 줄이 전부다.

### 4.5 ⚠ 권한 계약 — **v11 안에서 서로 다른 두 값이 공존한다**

이건 후배가 반드시 알아야 할 **v11 내부 모순**이다. 단정하지 않고 두 근거를 나란히 둔다.

**근거 A — `guide.txt:61-63` (775)**:
```
61:     chown -R www-data:www-data /var/www/html/t2editor
62:     chmod -R 755 /var/www/html/t2editor
63:     chmod -R 775 /var/www/html/t2editor/data
```

**근거 B — v11 코어 내 최초 설치 안내 스크립트 (707)**, `extend/admin/js/t2_first_run_guide.js`:
```
31: required_body: '관리자 기능을 활성화하고 공용 데이터 디렉터리를 최소 권장 707부터 설정한 뒤 …'
34: step_data: '공용 데이터 디렉터리를 최소 권장 707부터 설정하고 PHP 실제 쓰기 시험을 확인합니다.'
47: command_body: '… T2Editor의 최소 권장 권한은 707이며, 777은 필요하지 않습니다.'
51: ftp_perm_note: '… 공용 데이터 디렉터리를 먼저 707로 설정하세요. … 777은 사용하지 마세요.'
81: permission_minimum: '최소 권장 707',
82: permission_note: '… 실패할 때는 707부터 적용하면 충분합니다. 777도 설치를 막지는 않지만 …'
482: pathRow(t('permission_detected'), (status.permissions.data_mode || t('unavailable')) + ' / 707')
```

**v10 실측(ZIP 해제)** — v10 스크립트도 **707**:
`t2editor/extend/js/t2_first_run_guide.js:18,21,33,37,66,67,343` 에서 `최소 권장 707` / `777은 사용하지 마세요`. 그리고 v10.5.0 릴리즈 노트 원문: *"설치 권한은 777이 아니라 707을 최소 권장값으로 명확하게 안내합니다."*

→ **판정**: `707` 은 **코어가 실제로 안내·권장하는 값**(v10·v11 공통)이고, `775` 는 **`guide.txt` 한 줄에만 있는 값**이다. `grep -rn "775"` 결과 v11 트리에서 `guide.txt:63` **1건만**이고 나머지 775 는 `law/case/*.md` 의 해설 번호(704/707/708)나 커밋 해시와 무관한 문자열이다. **따라서 "v10은 707이고 v11은 775로 바뀌었다"는 서술은 절반만 맞다.** 서술은 "v10·v11 모두 코어는 707을 안내한다. `guide.txt` 만 775를 쓴다"로 써야 정확하다.

### 4.6 ⚠ v10 지시를 v11에 그대로 쓰면 깨지는 지점 (근거 있는 것만)

| # | v10에서 존재 | v11에서 | 근거 | 깨지는 이유 |
|---|---|---|---|---|
| 1 | `t2editor/t2_css_min.php` (2,691 B) | 루트에 **없음** | v11 `ls t2_css_min.php` → No such file. v11은 `endpoints/t2_css_min.php`(436 B) | 다른 경로라 404 |
| 2 | `t2editor/config/t2_sanitize.php` | **없음** | v10 ZIP 291 엔트리 전수, v11은 46,203 B로 존재 | 존재하지 않는 파일 require |
| 3 | `t2editor/config/t2_cms_security.php` | **없음** | 동일 | 동일 |
| 4 | `t2editor/config/t2_content_styles.php` | **없음** | 동일 | 동일 |
| 5 | `t2editor/endpoints/` 디렉터리 | **없음** | v10 ZIP 인벤토리 | 디렉터리 자체가 존재하지 않음 |
| 6 | `t2editor/editor.core.php` (97,337 B, 루트) | `core/editor.core.php` (하위 디렉터리로 이동) | v10 ZIP에 `t2editor/core/editor.core.php` 없음 / v11에 루트 `editor.core.php` 없음 | 파일 경로 기반 지시 전부 무효 |
| 7 | `admin/t2admin.key.txt` → `.key` 이름변경 | `admin/t2admin.key.php` + `secret` 값 | §4.4 | rename 대상이 없음 |
| 8 | (해당 개념 없음) | `T2Esanhtml()` 의 `skipped` 처리 | `guide.txt:6.2` | v10 문서를 그대로 옮기면 **저장 지점에 서버 필터가 아예 없다**. v10 배포본에 `t2_sanitize.php` 가 없기 때문에 |
| 9 | `collab/` 루트 폴더 | `data/t2editor_db/collab` | `guide.txt` 3.3 / v11.5.0 노트 *"기존 `data/editor/t2editor_db` 데이터는 새 위치로 자동 이전"* | 존재하지 않는 경로 지시 |
| 10 | `$plugin_priority` 를 `editor.lib.php` 에 수동 편집 | v10.2.0부터 플러그인 등록 방식 확장 | v10.2.0 노트 + `guide.txt:4.1`의 `t2editor_rhymix_local_config.php` | 수동 편집 지시 자체가 폐기됨 |
| 11 | 그누보드5·라이믹스 어댑터가 root `t2_css_min.php` 기준 | `integration/cms/adapters/{gnuboard5,rhymix,standalone}.php` + `T2Econtentstyleattach()` | v11 실물 디렉터리 | 어댑터 경로 변경 |
| 12 | 그누보드5 MIME/파일명 검사 위임 | 그누보드5/라이믹스/워드프레스가 **v11.0에서 명시적으로 연결** | `guide.txt:3.4` / `4.4` 표 | host-security-bridge 계약이 없던 판본에서 이를 단정하면 과잉 |

**반대 방향(v11 지시를 v10에 쓰면 깨짐) — 후배가 경계를 지킬 때 필요**:
- `endpoints/t2_css_min.php?bundle=content` · `T2Econtentstyletag()` · `T2Econtentstyleattach()` · `t2_sanitize.php` · `install-check.php` — **모두 v10.5.1에 존재하지 않는다**(291 엔트리 확인).
- v10에서 실행하면 전부 실패. v10은 `css/content.css` 수동 `<link>` 가 정답이다.

### 4.7 PHP 요구 사양 이력 (v10 내부에서 두 번 뒤집힘)

| 판본 | 릴리즈 노트 원문 |
|---|---|
| 10.0.0 / 10.0.1 | *"**php권장 사양이 기존 7.4에서 8.0 이상으로 변경되었습니다.**"* |
| 10.1.0 | *"**php7.4 호환 추가!**"* |
| 10.5.0 | *"PHP 7.4부터 8.4까지의 호환 범위를 유지하면서 …"* |

→ **v10 계열 안에서 요구 사양이 올라갔다 다시 내려왔다.** "v10은 PHP 8.0 이상_REQUIRE"로 요약하면 틀린다. 최소 7.4다.

### 4.8 v11 참조 문서 실물 확인 (10종 전부 존재)

`guide.txt:10장`이 인용하는 문서 — v11 워크트리에서 전부 확인:

```
docs/content-sanitizer.md            8,333 B  ✅
docs/host-security-bridge.md         4,476 B  ✅
docs/content-style-architecture.md   9,667 B  ✅
docs/permission-system.md           10,598 B  ✅
docs/word-filter.md                 11,129 B  ✅
docs/deployment-profiles.md         11,299 B  ✅
docs/hard-config-contract.md         7,318 B  ✅
docs/captcha-integration.md          8,875 B  ✅
developer/README.md                  3,112 B  ✅
readme.txt                          10,793 B  ✅
```

**주의**: 이 목록의 "v10에 있다/없다"를主张하려면 v10 ZIP을 해제해 확인해야 한다. **본 문서는 v10에 대해 10.5.1만 실물 확인했고 나머지 8개 판본은 릴리즈 노트 원문만 근거로 삼았다.**

---

## 5. 라이선스 계약 이력 — 4세대 + 무효 1건

릴리즈 본문 메타표 `| 배포 시점 유효 라이선스 |` 행을 93건 전수 추출했다. **결과는 4세대다.**

| 라이선스 판본 | 계열 | 판본 수 | 실제 배포일 범위 | 원문 위치(메타표 기재) | `readme.txt` |
|---|---|---|---|---|---|
| **none** (라이선스 파일 자체 없음) | v1 | **1건** (1.0.0-beta만) | 2025-01-31 | `판본에 라이선스 파일 없음` | **이 판본 배포본에 없음** |
| **1.0** | v1(18) · v2(3) · v3(10) | 31 | 2025-02-15 ~ 2025-10-06 | `판본 안 \`License_ko.txt\`` | 포함 |
| **1.0.1** | v4(3) · v5(25) | 28 | 2025-10-07 ~ 2025-11-25 | `판본 안 \`readme.txt\`` | 포함 |
| **2.0.0** | v5(7) · v6(1) · v7(3) · v8(6) · v9(7) | 24 | 2025-11-26 ~ 2026-05-29 | `판본 안 \`readme.txt\`` | 포함 |
| **3.0.0** | v10(9) | 9 | 2026-06-24 ~ 2026-07-27 | `판본 안 \`readme.txt\`` | 포함 |

(v1 계열 19 = none 1 + 1.0 18. v5 계열 32 = 1.0.1 25 + 2.0.0 7.)

### 5.1 ⚠ "최신 라이선스를 과거 판본에 일괄 적용"하면 틀린다

`readme.txt` 「약관의 우선순위 및 서비스 종료 시 적용 기준」(v11 `readme.txt:53-54`) 원문:

```
약관의 우선순위 및 서비스 종료 시 적용 기준:
T2Editor를 비롯한 dsclub 산하의 모든 T2 서비스는 dsclub.kr 공지사항 게시판에 게시된 약관 및 그 개정 내용을
우선적으로 따릅니다. … 이미 배포된 소프트웨어 제품은 해당 배포본을 다운로드한 시점에 유효했던 약관 및
라이선스를 따릅니다. … 해당 소프트웨어 배포본에 포함된 라이선스 파일(readme.txt 등)을 최후의 기준으로 삼아
적용합니다.
```

→ **판본이 배포본에 끼운 라이선스가 그 판본의 실제 조건이다.** v10에 3.0.0을 적용하고 v3에 1.0을 적용하면 둘 다 틀린다.

### 5.2 v11 라이선스 — 실물 라인 인용

`/workspace/T2Editor-v11/T2Editor/readme.txt` (10,793 B):

```
10: T2Editor License_Ko
11: Version: 3.0.0
65: 이 라이선스는 2026년 6월 29일부터 유효합니다.
70: Version: 3.0.0
124: This license is valid from June 29, 2026.
```

**상업적 사용 제한 문구 원문 (`readme.txt:56-59`)**:

```
56: 제한사항:
57: - 저작권 고지 제거 또는 수정 금지
58: - dsclub.kr 기본 배포 파일의 상업적 판매 금지
59: - readme.txt 변경·삭제 또는 누락 후 재배포 금지
```

영문 대조 (`readme.txt:116`): `- Removal or modification of copyright notices is prohibited`
배포 문의 (`readme.txt:61-63`): `최신 버전: https://dsclub.kr/service/editor` · `사용 안내: https://dsclub.kr/service/editor`

**주의 — `download_url` 접근 금지**: `readme.txt` 는 `dsclub.kr` 배포 API(`?action=download&version=…`)를 가리킨다. 이 문서 작성 과정에서 **배포 API URL은 접근하지 않았다.** 라이선스 판본·판본·배포일은 전부 GitHub 릴리즈 메타표에서 읽었다.

### 5.3 라이선스 판독 코드 (v11)

`core/editor.core.php:28-40` 의 `T2Elicenseok()` 는 `readme.txt` **1~4행만** 읽어 sha256 `84f16df0ec65be15544c6191cb4733a7d16350b5ab0bfbc2236b16a88f95c7ad` 와 대조한다. 정규화는 `config/t2_license.php:25-35` `T2Elicensecanon()`.
→ **`readme.txt` 의 1~4행은 판본 식별과 라이선스 검증에 동시에 쓰인다.** 줄을 사이에 넣거나 주석을 달면(바이트가 달라지므로) 검증이 깨진다. 정규화가 `?` 로 대체하는 이유다.

### 5.4 판본별 라이선스 원문 위치 — 한눈에

| 판본대 | 라이선스 | 원문 위치 |
|---|---|---|
| 10.0.0 ~ 10.5.1 (9건) | 3.0.0 | 배포본 `readme.txt` |
| 5.7.2 ~ 9.3.0 (24건) | 2.0.0 | 배포본 `readme.txt` |
| 4.0.0 ~ 5.7.1 (28건) | 1.0.1 | 배포본 `readme.txt` |
| 1.0.0 ~ 3.0.9 (31건) | 1.0 | 배포본 **`License_ko.txt` / `License_en.txt`** (`readme.txt` 가 128바이트 포인터) |
| 1.0.0-beta (1건) | 없음 | — |

**1.0 판본이 `readme.txt` 를 읽으면 라이선스를 놓친다.** 31건이 이 함정에 있다. 메타표가 `License_ko.txt` 를 명시하는 이유다.

---

## 6. 기능 신설 연표 — 릴리즈 노트 기준

### 6.1 추출 방법과 한계 (반드시 먼저 읽을 것)

- 93개 중 **86개에 실제 변경 내역**이 있다. 나머지 **7개는 본문 원문이** `_배포 페이지에 변경 내역이 기재되어 있지 않다_`.
- 각 본문에서 아카이브 보일러플레이트(版权 안내 절, `| 항목 | 값 |` 메타표, EOL 배너)를 제거한 뒤 **변경 내역 본문만** 대조했다.版权 고지 절에는 93건 전부 "상업적 판매 금지"가 들어 있어 제거 전 대조하면 **모든 판본이 보안 관련으로 잡힌다**.
- 기준은 **`| 배포일 |` 메타표 값의 오름차순**(문자열 정렬이 아니라 날짜 정렬).
- **"처음 등장"은 릴리즈 노트에 그 기능명이 처음 쓰였다는 뜻이지, 기능이 그때 구현됐다는 뜻은 아니다.** 코드를 역추적하지 않았다.

### 6.2 계열별 첫 등장 (86건 변경 내역 기준)

| 기능 | 첫 등장 판본 | 실제 배포일 | 계열 | 이후 언급 판본 |
|---|---|---|---|---|
| 자동 저장 | `1.1.0` | 2025-02-20 | v1 | 1.1.0 8.1.0 8.1.2 9.1.1 9.1.2 10.3.0 10.5.0 (7) |
| PDF 뷰어 | `1.1.0` | 2025-02-20 | v1 | 1.1.0 9.1.2 10.3.0 (3) |
| HTML 가져오기 / 붙여넣기 | `1.2.0` | 2025-02-24 | v1 | 15건 |
| 파일 업로드 | `1.5.1` | 2025-03-16 | v1 | 12건 |
| 그누보드5 연동 | `1.5.4_B` | 2025-03-25 | v1 | 6건 |
| **AI** | `3.0.0` | 2025-06-07 | v3 | 18건 |
| iframe / 임베드 | `3.0.6` | 2025-08-31 | v3 | 3.0.6 9.1.3 10.3.0 10.5.1 (4) |
| **XSS / 보안 패치** | `3.0.7` | 2025-10-03 | v3 | 3.0.7 9.1.2 9.2.0 (3) |
| **협업** | `5.1.0-beta1.0.2` | 2025-10-11 | v5 | 10건 |
| 그림 그리기 | `5.2.0` | 2025-11-04 | v5 | 5건 |
| 모바일 / 반응형 | `5.4.1` | 2025-11-09 | v5 | 11건 |
| 성능 / 캐시 | `5.7.1` | 2025-11-23 | v5 | 5건 |
| 반응형 툴바 | `5.8.0` | 2025-11-29 | v5 | 5.8.0 5.8.2 5.8.3 (3) |
| **메모** | `8.0.0` | 2025-12-30 | v8 | 8.0.0 10.3.0 (2) |
| 접근성 | `8.0.0` | 2025-12-30 | v8 | 8.0.0 10.3.0 10.5.0 (3) |
| **대량 이미지** | `8.1.0` | 2026-01-05 | v8 | 8.1.0 (1) |
| **NSFW(SafeAI)** | `9.0.0` | 2026-04-07 | v9 | 9.0.0 9.1.0 10.4.0 (3) |
| 관리자 페이지 | `9.1.1` | 2026-04-20 | v9 | 4건 |
| 표 편집(개선) | `10.3.0` | 2026-07-16 | v10 | 10.3.0 10.4.0 (2) |
| 라이믹스 | `10.3.0` | 2026-07-16 | v10 | 4건 |
| 워드프레스 | `10.3.0` | 2026-07-16 | v10 | 10.3.0 (1) |
| 다국어 인터페이스 | `10.3.0` | 2025-07-16 → 실제 `2026-07-16` | v10 | 10.3.0 10.4.0 (2) |
| **GIF** | `10.4.0` | 2026-07-20 | v10 | 10.4.0 10.5.0 (2) |
| **RTL** | **미상** | — | — | 릴리즈 노트에 "RTL" 문자열 0건 |
| **마크다운** | **미상** | — | — | 릴리즈 노트에 "마크다운"/"markdown" 0건 |
| **이모지** | **미상** | — | — | 릴리즈 노트에 "이모지"/"emoji" 0건 |
| **서버측 본문 필터** | **미상 (v1~v10 전체)** | — | — | v10 ZIP에 `t2_sanitize.php` 없음. v11에서 처음 등장 |

**"미상"의 뜻**: 93개 릴리즈 노트 본문 전체에서 그 문자열이 0회 등장했다는 뜻이며, **기능이 없다는 뜻이 아니다.**

### 6.3 ⚠ 기능 **제거/후퇴** — 신설보다 위험하다

릴리즈 노트에서 제거·중단·비활성 표현을 찾은 결과. **후퇴 4건이 실측됐다.**

| 판본 | 실제 배포일 | 유형 | 릴리즈 노트 원문 (발췌) |
|---|---|---|---|
| **`5.2.1`** | 2025-11-05 | **기능 제거** | *"이미지 플러그인의 이미지 링크를 통한 이미지 업로드 기능 **제거** (수요 적음으로 판단) (`/t2editor/plugin/image/image.js`)"* |
| **`5.7.0`** | 2025-11-22 | **기능 롤백** | *"그림 그리기 플러그인 **롤백**"* |
| **`7.0.1`** | 2025-12-16 | **기능 제거 후 복구** | *"업데이트 중 **제거된** 텍스트&텍스트 배경 색상 선택기 **복구**"* |
| **`9.1.0`** | 2026-04-19 | **지원 중단** | *"- 서버버전 nsfw모드 **지원중단**"* (브라우저 모드는 유지) |
| **`9.1.1`** | 2026-04-20 | **기능 제한** | *"자동 저장된 내용을 에디터에 복원하지 않음. 자동 저장 토글을 **비활성화 상태로 표시**하여 현재 기능이 제한됨을 시각적으로 안내"* |
| **`5.1.2`** | 2025-11-03 | 코드 제거 | *"collab_number.php의 `/collab` 권한 부여 코드 삭제"* |
| **`10.2.0`** | 2026-07-05 | 절차 변경 | *"`/admin/t2admin.key.txt`에서 `.txt`확장자 제거 후 업로드 시 t2editor/admin으로 접속하여 셋팅 가능"* — v11에서 다시 `.php` 로 바뀜 (§4.4) |
| **`5.7.2`** | 2025-11-26 | **라이선스 완화된 변경** | *"T2Editor 외의 자체 개발 플러그인 및 관련 서비스: 독자 개발 플러그인의 유료 판매 허용 / 구독형 유료 서비스 제공 허용 — 단, dsclub.kr 기본 제공 소프트웨어는 무료로 유지되어야 함"* ← **라이선스 1.0.1 → 2.0.0 전환 지점** |
| **`5.8.1`** | 2025-12-01 | 결함 발견 | *"파일 플러그인의 코드가 그림 그리기 플러그인의 코드로 **대체되어있는 것**을 발견하여"* |

**후퇴 목록에서 후배가 특히 볼 것**: `5.2.1` 의 이미지 링크 업로드 제거, `9.1.0` 의 서버 NSFW 모드 중단, `9.1.1` 의 자동 저장 복원 비활성화. **셋 다 릴리즈 노트 한 줄짜리이고 릴리즈 제목에는 드러나지 않는다.**

---

## 7. 데이터셋 기계화 조언

### 7.1 안정 ID 규칙

**권장 ID = `{계열}-{판본}`** — 예: `v1-1.0.0-beta`, `v5-5.4_B`, `v10-10.5.1`

규칙 상세:
1. 계열은 저장소 이름에서 `T2Editor-v` 접두를 제거한 값. `v1`~`v10`.
2. 판본은 **릴리즈 본문 메타표 `| 판본 |` 의 백틱 제거 값**. `tag_name`에서 `v` 접두를 뗀 값과 동일함을 93건 전수 확인했다.
3. **ID에 절대로 쓰지 말 것**: `published_at`(전부 2026-09-27), GitHub release ID(재게시 시 바뀜), `tag`(로컬 JSONL) / `tag_name`(API) — **필드명이 두 갈래다.**
4. 결측 처리: ID 구성 요소가 비면 `미확인`. 추정 금지.

**검증한 사실**: 93건 전부에서 `tag_name.replace(/^v/,'')` === 메타표 `| 판본 |` 값. 불일치 0건.

### 7.2 필드별 자동 추출 가능 여부

| 필드 | 자동 추출 | 출처 | 비고 |
|---|---|---|---|
| `id` | ✅ **완전 자동** | `tag_name` → 계열/판본 분리 | 93/93 |
| `series` | ✅ **완전 자동** | 저장소명 | |
| `version` | ✅ **완전 자동** | 메타표 `\| 판본 \|` | `\r\n` 제거 필요 |
| `release_date` | ✅ **완전 자동** | 메타표 `\| 배포일 \|` | **`published_at` 사용 금지** |
| `status` | ✅ **완전 자동** | 메타표 `\| 상태 \|` | `EOL` / `현행 공개 판본` |
| `license` | ✅ **완전 자동** | 메타표 `\| 배포 시점 유효 라이선스 \|` | 5종 |
| `asset_name` | ✅ **완전 자동** | `assets[0].name` | 93/93 자산 1개 |
| `asset_count` | ✅ **완전 자동** | `assets \| length` | 전부 1 |
| `asset_size_bytes` | ✅ **완전 자동** | `assets[0].size` | |
| `sha256` | ✅ **완전 자동** | 메타표 `\| sha256 \|` | |
| `github_published` | ✅ **완전 자동** | API `published_at` | **날짜로 쓰지 말 것** |
| `prerelease` / `draft` | ✅ **완전 자동** | API 불리언 필드 | |
| `source_branch` | ✅ **완전 자동** | 메타표 `\| 소스 \|` | `releases/{판본}` 패턴 |
| `download_api_url` | ✅ 자동 | 메타표 `\| 배포 API 원본 \|` | **접근 금지** — 문자열만 보관 |
| `eol_in_title` | ✅ **완전 자동** | `name` 에 `[EOL]` | v1~v9 84건 / v10 0건 |
| `has_changelog` | ✅ **완전 자동** | 본문에 `배포 페이지에 변경 내역이 기재되어 있지 않다` 부재 | 86/93 |
| `body_has_cr` | ✅ **완전 자동** | `body` 에 `\r` 존재 | 39/93 — 손상 지표 |
| **`summary`** | ⚠ **사람이 써야 함** | 릴리즈 노트 원문 | 자동 추출은 헤더/표 잔재를 집어먹는다(예: v10.2.0 → `"업데이트:"`, v5.3.0 → `"Ai기능 도입:"`). 번호 목록 상위 3개 규칙으로 시작하되 검수 필수 |
| **`first_feature_appearance`** | ⚠ **사람이 써야 함** | 릴리즈 노트 + 계열 추론 | 자동 대조는 저작권 고지 절을 잡는다 |
| **`migration_break_points`** | ⚠ **사람이 써야 함** | v10 ZIP 해제 + v11 소스 대조 | §4.6 참조 |
| `notes_raw` | ✅ 기계 보관 | `body` 전문 | 판정 금지, 보관용 |

### 7.3 자동 추출이 실패하는 실제 사례 (검수 없이 쓰면 생기는 일)

| 판본 | 순수 자동 추출 결과 | 정답 | 원인 |
|---|---|---|---|
| `v10.2.0` | `업데이트:` | 본문 첫 문장(`자신있는 T2Editor complex AI...!`) | 라벨 줄이 본문보다 먼저 나옴 |
| `v5.3.0` / `v5.4.0` | `Ai기능 도입:` | 그 아래 목록 | 라벨 줄만 남음 |
| `v1.5.4` | `수정사항:` | 이미지 업로드 권한 추가 | 동일 |
| `v9.1.2` | `2-alpha / 5와 동일합니다.…` | XSS 대규모 보안 패치 | 원본에 `\r` 개행 (§0 함정 3) |
| `v9.1.3` | `2- / 3-alpha / 0-chatgpt업데이트-감사서요약:` | 미디어 블록 저장 복구 강화 | 동일 |
| **93건 전부** | `보안` 93/93 히트 | 실제 보안 관련 3건 | **저작권 고지 절의 "상업적 판매 금지"를 잡음** |

### 7.4 파이프라인 체크리스트 (재현용)

```
1. gh api "repos/tak2-08/T2Editor-v{N}/releases?per_page=100"
   → rel-v{N}.json  (link: rel="next" 없음 확인 = 누락 없음)
2. 각 release.body 에서:
   - "## 저작권 안내" 이후 제거 (보일러플레이트)
   - "| 항목 | 값 | … | 배포 API 원본 | … |" 메타표 제거
   - "| 판본 |" / "| 배포일 |" / "| 상태 |" / "| 배포 시점 유효 라이선스 |" 은 따로 캡처 후 제거
   - "\r" 제거 (39/93건 손상)
3. has_changelog = 변경내역 본문 길이 > 40 이고 미상 문구 부재
4. summary = 번호 목록 상위 3개 → 없으면 첫 비어있지 않은 줄
5. eol_in_title = name 에 "[EOL]"
6. **published_at 은 날짜 필드로 절대 쓰지 않는다**
```

### 7.5 로컬 원본 코퍼스 검증 결과 (읽기만, 수정 0)

`T2Editor_Agent_Tool/data/releases/v{N}.json` 와 라이브 API를 **바이트 단위로 대조**했다.

| 계열 | 로컬(줄 단위) | 라이브 | 태그 | `body` 바이트 | `published_at` | 판정 |
|---|---|---|---|---|---|---|
| v1 | 19 | 19 | 일치 | 19/19 동일 | 19/19 동일 | **MATCH** |
| v2 | 3 | 3 | 일치 | 3/3 동일 | 3/3 동일 | **MATCH** |
| v3 | 10 | 10 | 일치 | 10/10 동일 | 10/10 동일 | **MATCH** |
| v4 | 3 | 3 | 일치 | 3/3 동일 | 3/3 동일 | **MATCH** |
| v5 | 32 | 32 | 일치 | 32/32 동일 | 32/32 동일 | **MATCH** |
| v6 | 1 | 1 | 일치 | 1/1 동일 | 1/1 동일 | **MATCH** |
| v7 | 3 | 3 | 일치 | 3/3 동일 | 3/3 동일 | **MATCH** |
| v8 | 6 | 6 | 일치 | 6/6 동일 | 6/6 동일 | **MATCH** |
| v9 | 7 | 7 | 일치 | 7/7 동일 | 7/7 동일 | **MATCH** |
| v10 | 9 | 9 | 일치 | 9/9 동일 | 9/9 동일 | **MATCH** |

**10/10 계열 완전 일치. 불일치 0건.** 로컬 코퍼스는 재사용 가능한 정본이다.

**단 로컬 파일 2가지 함정**:
- 형식은 **JSON 배열이 아니라 JSONL**(줄마다 JSON 객체 1개)
- 태그 필드명이 **`tag`**(API는 `tag_name`)

`data/versions/v{N}.json` 도 `created_at`·`pushed_at` 11개 전부 라이브와 일치. 단 **`private` 필드는 로컬에 없다**(v10을 public으로 오독할 수 있음).

---

## 8. 미확인 목록 (이 문서가 답하지 못하는 것)

| 항목 | 상태 | 이유 |
|---|---|---|
| v10.0.0~10.5.0 (8판본) 배포본 내부 구조 | **미확인** | ZIP 미확보. 10.5.1만 직접 해제 확인 |
| v1~v9 전체 (84판본) 배포본 파일 목록 | **미확인** | ZIP 미확보. 라이선스 원문 위치는 릴리즈 메타표만 근거 |
| v1.0.0-beta 의 실제 라이선스 조건 | **미확인** | 메타표가 `none` 으로만 기록. 파일이 배포본에 없음 |
| `dsclub.kr` 배포 API 응답 실제 내용 | **미확인 (의도적 미접근)** | 배포 API URL 접근 금지 |
| v10 계열 각 판본의 개별 PHP 요구 사양 | **미확인** | 코드 미확보. 10.5.1 노트만 "7.4~8.4" 언급 |
| `version` 필드의 "에디터 버전" = 릴리즈 판본이라는 보장이 v1~v9에서도 성립하는지 | **부분 확인** | 93/93에서 메타표 판본 = tag_name. 10.5.1에서 readme `ver_10.5.1` 일치 확인 |
| v11 릴리즈 목록 | **해당 없음** | private 저장소, releases 0건 |

---

## 9. 인용한 URL (실제로 GET 성공한 것만)

| URL | 결과 | 용도 |
|---|---|---|
| `https://api.github.com/repos/tak2-08/T2Editor-v{N}` (N=1..11) | 200 × 11 | 저장소 메타 |
| `https://api.github.com/repos/tak2-08/T2Editor-v{N}/releases?per_page=100` (N=1..10) | 200 × 10, 총 93객체 | 판본 계보 |
| `https://github.com/tak2-08/T2Editor-v10/releases/download/v10.5.1/10.5.1.zip` | 200, 6,863,693 B, sha256 `9ded2e84…c3196` | v10 실물 대조 |
| `https://github.com/tak2-08/T2Editor` | 200 | v계열 없음 확인 (releases 0) |

`gh api -H "Accept: application/octet-stream"` 경로는 **실패했다**(HTTP 415 `Unsupported 'Accept' header`). ZIP은 `browser_download_url` + Bearer 토큰 `curl`로 받았고, sha256이 릴리즈 노트 기재값과 일치함을 확인했다.

**가동한 명령**: `gh api` 21회 · `curl` 1회(ZIP) · **`git` 명령 0회** · **`T2Editor_Agent_Tool/` 내 파일 수정 0건**(읽기만).
