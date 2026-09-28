# 80 — 레거시 v1~v10 조회와 v10→v11 마이그레이션

> 심층 근거는 `knowledge/legacy-v1-v10.md` (829줄, 전수 93건). 기계 원본은 `data/legacy/` · `datasets/`.

## 1. 🚨 가장 먼저 알아야 할 함정

**`published_at` 은 배포일이 아니다.**

93건 전부가 `2026-09-27T14:21:06Z ~ 14:29:57Z` — **8분 51초** 안에 게시됐다. 이건 아카이브 재게시다.
진짜 배포일(2025-02-15 ~ 2026-07-27)은 릴리즈 **본문의 메타표 `| 배포일 |` 행** 에만 있다.
v1~v9 저장소 9개도 당일 9분 안에 연속 생성됐다(14:20~14:29). EOL 고지는 **사후 아카이브 행위**다.

→ 이 저장소는 `tools/lib/legacy.mjs` 가 본문 메타표를 파싱해 `data/legacy/release-index.json` 의 `realDate` 로 만든다. CSV 의 `archive_published_at` 과 `real_deploy_date` **두 열이 따로 있다** — 전자는 쓰지 마라.

## 2. 계열 계보 (전수)

| 계열 | 판본 수 | 범위 | 실제 배포일 | 상태 |
|---|---|---|---|---|
| v1 | 19 | 1.0.0-beta ~ 1.6.3 | 2025-02-15 ~ 2025-05-01 | EOL |
| v2 | 3 | 2.0.0 ~ 2.0.0C-1.0.0 | 2025-06-02 ~ 2025-06-03 | EOL |
| v3 | 10 | 3.0.0 ~ 3.0.9 | 2025-06-07 ~ 2025-10-06 | EOL |
| v4 | 3 | 4.0.0 ~ 4.0.2 | 2025-10-07 ~ 2025-10-08 | EOL |
| v5 | 32 | 5.0.0 ~ 5.10.0 | 2025-10-08 ~ 2025-12-08 | EOL |
| v6 | 1 | 6.0.0 | 2025-12-09 | EOL |
| v7 | 3 | 7.0.0 ~ 7.0.2 | 2025-12-14 ~ 2025-12-19 | EOL |
| v8 | 6 | 8.0.0 ~ 8.2.0 | 2025-12-30 ~ 2026-03-26 | EOL |
| v9 | 7 | 9.0.0 ~ 9.3.0 | 2026-04-07 ~ 2026-05-29 | EOL |
| v10 | 9 | 10.0.0 ~ 10.5.1 | 2026-06-24 ~ 2026-07-27 | **현행 공개** |
| v11 | — | 개발 중 (private) | — | 개발 |

**합계 93.** A2 가 말한 "94" 는 틀림(계열 없는 `tak2-08/T2Editor` 저장소의 릴리즈 0건).

전수: `datasets/families.csv` · `datasets/release-history.csv` (93행)

## 3. EOL 비대칭 — "v10 이 EOL 인가" 는 릴리즈로 답이 안 된다

- **v1~v9**: 저장소 설명 + 릴리즈 제목 + 릴리즈 본문 — **3중 표기**
- **v10**: **3곳 어디에도 EOL 표기가 없다**

⇒ "v10 은 아직 현행" 은 저장소 설명(`계열 상태 현행 공개 판본`)으로만 성립한다.

## 4. 버전 판별법 (가장 자주 틀림)

`readme.txt` 안에 **버전 숫자가 두 개** 있고 서로 다른 세대다.

```
T2Editor/readme.txt:2   ver_11.0.0     ← 에디터 판본
T2Editor/readme.txt:11  Version: 3.0.0 ← 라이선스 계약 판본
```

- 판독 코드: `T2Editor/core/editor.core.php` · 표시 경로 `T2Editor/admin/api.core.php`
- 라이선스 절 숫자를 에디터 버전으로 읽지 마라.
- v10/v11 의 `readme.txt` 는 3줄만 다르고 라이선스 본문은 바이트 동일하다.

## 5. 라이선스 세대

```
none 1건 · 1.0 31건 · 1.0.1 27~28건 · 2.0.0 24~25건 · 3.0.0 9건
```

- **1.0 판본은 `readme.txt` 가 아니라 `License_ko.txt` 에 있다** (31건 함정).
- 1.0.1 / 2.0.0 경계의 1건은 A2 수기 판독과 도구 파서가 갈린다 — `knowledge/legacy-v1-v10.md` 감사 블록 참조.
- v11 라이선스 계약: `T2Editor/readme.txt:65` "이 라이전스는 2026년 6월 29일부터 유효합니다"
- 제한: 상업적 판매 금지 · 저작권 고지 제거/수정 금지 · `readme.txt` 변경/삭제/누락 후 재배포 금지 · 모든 배포는 무료

## 6. 🚨 기능 후퇴 4건 (신설보다 위험)

릴리즈 **제목**에 드러나지 않는다. `data/legacy/release-index.json` 의 `regressions` 배열이 잡아낸다.

| 판본 | 후퇴 |
|---|---|
| 5.2.1 | 이미지 링크 업로드 제거 |
| 5.7.0 | 그림 플러그인 롤백 |
| 7.0.1 | 색상 선택기 제거 → 복구 |
| 9.1.0 | 서버 NSFW 모드 중단 |

⇒ 도구 신호는 `regression_signal`(키워드 매칭)라 오탐이 있다. **확인 후** `knowledge/legacy-v1-v10.md` §6 과 대조하라.

## 7. v10 → v11 파손 12곳 (요약, 전문은 `knowledge/legacy-v1-v10.md` §4)

가장 자주 밟는 것만:

| v10 지시 | v11 실체 |
|---|---|
| `config/t2_sanitize.php`, `endpoints/`, `T2Econtentstyleattach()` | v10 배포판에 **없다**. v11 에 처음 생김 |
| `T2Editor/core/editor.core.php` 위치 | v11 에서 **이동** |
| `admin/t2admin.key.txt` → `.key` 로 이름 변경 | v11 은 `admin/t2admin.key.php` — **rename 이 아니라 secret 값 입력** |
| v10 권한 707 | v11 코어 UI 도 707. **가이드만 775** (`skills/60-security-review.md` §2) |
| `css/content.css` 본문 `<link>` 자동 삽입 | v11 은 번들 엔드포인트(`?bundle=content`) + 로더(`format=js`) |
| "워드프레스 지원" | v11 에 어댑터가 **없다** (`skills/50-plugin-and-endpoint.md` §5) |

**역방향도 위험하다**: v11 지시를 v10 문서에 넣으면 존재하지 않는 기능으로 보내게 된다(예: `endpoints/`, `T2Esanhtml`).

## 8. 조회 방법

```bash
# 계열 요약
node tools/t2at.mjs query "7.0.1"

# 판본 하나 찾기 (machine)
node -e '
const L=require("./data/legacy/release-index.json");
const r=L.releases.find(x=>x.edition==="7.0.1");
console.log(r.id, r.realDate, r.state);
console.log(r.lede);
console.log(r.sections.join(" | "));
console.log(r.regressionSignal);
'

# 후퇴 신호 전수
node -e '
const L=require("./data/legacy/release-index.json");
L.regressions.forEach(r=>console.log(r.id, r.date, r.keyword, "|", r.excerpt));
'

# 라이선스 세대
node -e 'console.log(require("./data/legacy/release-index.json").licenseGenerations)'
```

## 9. 이 데이터셋의 한계 (정직하게)

- 릴리즈 **본문**은 `data/legacy/releases.json` 에 있지만 `lede`(요약 1줄)는 자동 추출이다. 판독이 아니라 **본문 첫 substantive 문장**이다.
- 기능 신설 연표는 릴리즈 노트에 명시된 것만 잡는다. "기능이 사라졌다" 는 기록이 없는 판본이 여럿이라 **후퇴 목록은 불완전**하다.
- v10 배포판 스냅샷이 이 환경에 없다 → v10 쪽 서술은 **문서 근거**다(이 저장소가 v10 코드를 직접 읽은 게 아니다).
- `published_at` 을 날짜로 쓴 자료는 전부 틀렸다. 본 저장소의 `archive_published_at` 도 참고용이다.
