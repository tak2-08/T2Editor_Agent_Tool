# 00 — 여기서부터 시작하라

후배 AI 에이전트가 T2Editor 를 처음 맡았을 때 **3분 안에** 알아야 하는 것만 있다. 나머지는 이 저장소가 전부 들고 있다.

## 0.1 이 저장소가 왜 있는가

T2Editor v11 의 규범 정본인 `AGENTS.md` (337줄) 자체가 2026-09-28 기준 **라인 4곳이 낡고 내용 1곳이 틀렸다.** 문서에 적힌 `파일:라인`은 저절로 부패한다.
⇒ 이 저장소의 도구는 **인용을 기계로 검증한다.** 새 지식을 쓰면 반드시 인용을 걸고 `doctor` 를 돌린다.

## 0.2 60초 오리엔테이션

```bash
node tools/t2at.mjs status     # 정본 연결 + 자산 기준 커밋 + 자산 개요
node tools/t2at.mjs doctor     # 부패 진단. 실패하면 exit 1
node tools/t2at.mjs query "sanitize"   # 무엇이든 물어본다
```

`status` 의 **정본 커밋**이 바뀌었으면 자산이 뒤처진 것이다. `refresh --write` → `verify` → `doctor` 순으로 돌린다.

## 0.3 읽는 순서 (목적별로)

| 하고 싶은 것 | 먼저 읽을 것 |
|---|---|
| v11 전체 구조 파악 | `knowledge/v11-structure.md` §1~§3 |
| **지금 무엇이 참인가** (먼저 이것) | `knowledge/v11-hotspots.md` |
| 보안을 건드리거나 위험을 판단해야 함 | `knowledge/v11-security.md` |
| 실제로 코드를 고치고 검증해야 함 | `knowledge/v11-playbook.md` + `skills/10-work-on-v11.md` |
| CSS 를 건드림 | `skills/30-css-and-visual.md` |
| 설정 키를 추가함 | `skills/40-setting-key.md` |
| 플러그인·공개 진입점을 만듦 | `skills/50-plugin-and-endpoint.md` |
| 이슈·PR 를 올림 | `skills/70-issue-pr-charter.md` |
| 과거 판본(v1~v10)을 알아야 함 | `skills/80-legacy-lookup.md` |
| "이거 저번에 밟았나" | `skills/90-pitfalls.md` |

## 0.4 절대 규칙 5가지

1. **추측하지 않는다.** 모르면 "미확인" 이라고 적는다. 근거 없는 서술은 이 저장소의敌人이다.
2. **인용에는 `파일:라인` 을 단다.** 그리고 `datasets/citations.csv` 에 `must_contain` 토큰을 걸어 **내용 변경까지** 감지되게 한다.
3. **정본은 GitHub** 이다. 작업 시작 시 `git fetch origin` 후 `origin/main` 을 기준으로 한다.
4. **게이트 종료 코드가 0 아니면 푸시하지 않는다.** (`bash tools/t2-release-gate.sh` — 단, 이 저장소 밖 정본 안에서)
5. **이 환경에는 `php`·`python3`·Playwright 가 없다.** 시각 검증이 필요하면 그것을 못 한다고 **명시하고** 대체 축(정적 검사·카탈로그 대조·인용 검증)을 채운다.

## 0.5 숫자 요약 (2026-09-28 · `57a8b5f`)

```
패키지 821파일 / 29.1MB · 플러그인 17(등록 16) · 설정키 239 · 공개 진입점 11
게이트 10단계 · CSS 계약 규칙 16 · 시험 304 · 로케일 5 · 번들 라이브러리 12(13.1MB)
v1~v10 릴리즈 93건 (실제 배포일 2025-02-15 ~ 2026-07-27)
```

전체 근거: `knowledge/v11-hotspots.md` §1 · 기계 원본 `data/catalog/`

## 0.6 이 저장소 안에서 쓸 수 있는 명령 (전수)

```bash
node tools/t2at.mjs status                 # 자산 상태
node tools/t2at.mjs refresh                # 재생성 미리보기(파일 안 씀)
node tools/t2at.mjs refresh --write        # 재생성
node tools/t2at.mjs verify                 # 인용 검증
node tools/t2at.mjs verify --json          # 리포트 생성 + 미결합 힌트 경고
node tools/t2at.mjs doctor                 # 종합 진단 (실패 exit 1)
node tools/t2at.mjs query "<키워드>"        # 통합 질의
node tools/t2at.mjs catalog                # 카탈로그 요약
node tools/t2at.mjs --help
```

환경변수: `T2EDITOR_V11_ROOT` (정본 위치) · `NO_COLOR` · `T2AT_TRACE` (스택)
