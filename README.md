# T2Editor Agent Tool

T2Editor **v1~v11을 다룰 줄 아는 에이전트**를 위한 지식 베이스. 구조·계약·데이터셋·검증 도구를 한 곳에 모아 두고, **스스로 낡음을 감지하게** 만든다.

> **이 저장소가 없는 세상에 왜 이것이 있나** — 2026-09-28 실측:
> 정본 규범 문서 `T2Editor-v11/AGENTS.md` (337줄) 자체가 **라인 인용 4곳이 낡고 내용 1곳이 틀렸다.**
> `AGENTS.md:45` 는 `t2-visual-system.css:446` 과 `1.5s` 를 적었지만 실제로는 `:496-502` / `:498` = **`3s`** 다. 이 오염은 `GITHUB-ISSUE-BODY-KO.md:19` 로 전파됐다.
> 또 게이트 스크립트에는 **인자 파싱이 없어** 주석에 적힌 `--quick` 플래그가 존재하지 않는다(`AGENTS.md:23` 도 이를 옮겼다).
>
> **문서에 적힌 파일:라인은 저절로 부패한다.** 그래서 이 저장소의 도구는 인용 657건을 매번 정본과 대조하고, **내용이 바뀌었는지까지** 본다.

---

## 빠른 시작

```bash
git clone https://github.com/tak2-08/T2Editor_Agent_Tool.git
cd T2Editor_Agent_Tool

# 정본이 필요하다. 자동으로 탐색하고, 안 되면 지정한다.
export T2EDITOR_V11_ROOT=/path/to/T2Editor-v11

node tools/t2at.mjs status     # 자산 상태 + 정본 커밋 + 개요
node tools/t2at.mjs doctor     # 부패 진단 (실패하면 exit 1)
node tools/t2at.mjs query "sanitize"   # 무엇이든 물어본다
```

## 이것이 무엇을 하는가

| 명령 | 하는 일 |
|---|---|
| `t2at.mjs status` | 정본 연결 여부 · 자산 기준 커밋 · 자산 10종 개요 |
| `t2at.mjs refresh --write` | 정본을 읽어 카탈로그·레거시·CSV 를 재생성 |
| `t2at.mjs verify [--json] [--strict]` | 657건 인용을 정본과 대조. **내용 변경**까지 검지 |
| `t2at.mjs doctor` | 종합 진단 6종. 실패 시 `exit 1` |
| `t2at.mjs query "<키워드>"` | 카탈로그 + 레거시 + 지식 문서 + 스킬 통합 질의 |
| `t2at.mjs catalog` | 카탈로그 요약 |

의존성 **0**. Node ≥18. ESM. 쓰기 명령은 `--write` 없이는 stdout 만 출력한다.

## `doctor` 가 잡는 6가지

1. 자산이 정본 커밋보다 뒤처짐
2. **인용 부패** — `NO_MATCH`(내용 변경) · `LINE_OOB`(줄 밀림) · `UNRESOLVED`(경로 해석 실패)
3. **README 가 광고하는데 파일이 없음** ← 레거시화의 대표 증상
4. 실행 명령이 없는 스킬
5. `citations.csv` 열 수 오류 (내용 변경 감지가 **조용히 죽는** 상태)
6. 사실상 빈 자산

## 구조

```
T2Editor_Agent_Tool/
├── AGENTS.md                    헌장 — 후배 에이전트가 이 저장소를 쓸 때의 규약
├── README.md                    이 파일
├── SCHEMA.md                    데이터 계약(스키마) 문서
├── CHANGELOG.md                 변경 이력
├── PROVENANCE.md                누가 무엇을 언제 실측했는가
│
├── knowledge/                   심층 지식 (인용 100% 검증됨)
│   ├── v11-hotspots.md          ★ 지금 무엇이 참인가 — 먼저 읽을 것
│   ├── v11-structure.md         전체 구조 맵 (부팅·계층·코어 계약·플러그인·CMS)
│   ├── v11-security.md          보안 모델 심층 (신뢰경계·sanitizer·업로드·공격면)
│   ├── v11-playbook.md          검증·작업 플레이북 (게이트·CSS 계약·CI·과거 결함)
│   └── legacy-v1-v10.md         레거시 데이터셋 (93건 전수·계보·마이그레이션)
│
├── skills/                      실행 가능한 스킬 (모두 실행 명령 포함)
│   ├── 00-start-here.md         3분 오리엔테이션
│   ├── 10-work-on-v11.md        세션 루프 · fast-track/PR-track 경계 · 검증 3축
│   ├── 20-verify-and-gate.md    게이트 10단계 · baseline 부채 · 환경 실측
│   ├── 30-css-and-visual.md     토큰 2계열 · 레이어 소유권 · 기하 사고 3건
│   ├── 40-setting-key.md        하드 설정 선언 계약
│   ├── 50-plugin-and-endpoint.md 플러그인 17/16 · updater ABI 계약
│   ├── 60-security-review.md    보안 리뷰 절차와 함정
│   ├── 70-issue-pr-charter.md   라벨·이슈·PR·에스컬레이션
│   ├── 80-legacy-lookup.md      v1~v10 조회 · v10→v11 파손 12곳
│   └── 90-pitfalls.md           함정 색인 8절
│
├── data/
│   ├── MANIFEST.json            자산 생성 시각 + 기준 커밋
│   ├── catalog/                 정본에서 추출한 기계 판정 (11종)
│   ├── legacy/                  v1~v10 릴리즈 93건 구조화
│   ├── releases/                v1~v10 릴리즈 원문 (JSONL)
│   └── versions/                계열 저장소 메타
│
├── datasets/                    전부 도구 생성 (손으로 고치지 않는다)
│   ├── config-keys.csv          설정 키 239행
│   ├── plugins.csv              플러그인 17행
│   ├── css-contract.csv         CSS 계약 규칙
│   ├── endpoints.csv            공개 진입점 11행
│   ├── release-gate.csv         게이트 10단계
│   ├── release-history.csv      릴리즈 93행 (실제 배포일 기준)
│   ├── families.csv             계열 10행
│   ├── inventory.csv            계층별 파일·바이트
│   ├── vendor.csv               번들 라이브러리 12종
│   ├── citations.csv            ★ 인용 기대 토큰 (내용 변경 감지용)
│   └── citation-report.json     마지막 검증 리포트
│
├── tools/
│   ├── t2at.mjs                 단일 CLI 진입점
│   ├── lib/extract.mjs          정본 → 카탈로그 추출기
│   ├── lib/cite.mjs             인용 파서 + 검증기
│   ├── lib/legacy.mjs           v1~v10 파서 (published_at 함정 처리)
│   ├── lib/csv.mjs              카탈로그 → CSV
│   ├── lib/config.mjs           경로·커밋 해석
│   └── selftest/cite-test.mjs   인용 파서 자기시험
│
└── .github/workflows/staleness.yml   정본이 움직이면 이 자산이 낡았는지 자동 알림
```

## 유동성 설계 — "레거시화되지 않으려면"

이 저장소가 처음에 가지고 있던 문제는 **그럴듯한 일반론이 쌓여 아무도 못 믿는 것**이었다
(기존 스켈레톤은 README가 `tools/*.sh` 를 광고하면서 `tools/` 가 비어 있었고, 성능 문서의 수치가 측정값이 아니었다).
그래서 다음을 지킨다.

| 원칙 | 구현 |
|---|---|
| **숫자는 손으로 쓰지 않는다** | `refresh --write` 만 쓴다. `data/` · `datasets/` 는 전부 생성물 |
| **인용은 기계로 본다** | `verify` 가 657건을 대조. `must_contain` 토큰으로 **내용 변경**까지 |
| **문서가 파일을 광고하면 그 파일이 있어야 한다** | `doctor` 가 검사한다 |
| **스킬에는 실행 명령이 있어야 한다** | `doctor` 가 검사한다 |
| **기록하지 않은 것은 추정하지 않는다** | `knowledge/v11-hotspots.md` §6 과 `knowledge/v11-security.md` §11 에 격리 |
| **정본이 움직이면 자동으로 알린다** | `.github/workflows/staleness.yml` (매주) |
| **백로그가 보인다** | `doctor` 의 `exit 1` 을 CI 에 물린다 |

## 숫자 요약 (2026-09-28 · 정본 `57a8b5f`)

```
패키지 821파일 / 29,113,952 B · 최상위 계층 20
JS 245 · PHP 235 · CSS 65 · JSON 129
플러그인 17(등록 배열 16, 전용 로더 1) · 설정 키 239 · 공개 진입점 11
게이트 10단계 · CSS 계약 규칙 16 · 시험 304 · 로케일 5 · 번들 라이브러리 12(13,120,719 B)
v1~v10 릴리즈 93건 · 실제 배포일 2025-02-15 ~ 2026-07-27 · 라이선스 세대 5종
인용 657건 전수 검증
```

## 라이선스

T2Editor 와 동일 — **무료 재배포, 상업적 판매 금지.** T2Editor 배포판 안의 라이선스 원문이 정본이다.
저장한 `data/releases/*.json` 은 T2Editor 공개 저장소(`tak2-08/T2Editor-v1` ~ `v10`) 의 릴리즈 노트 원문이며, 해당 저장소 설명에 같은 조건이 적혀 있다.
