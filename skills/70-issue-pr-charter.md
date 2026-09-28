# 70 — 이슈 · PR 헌장

정본은 `T2Editor-v11/AGENTS.md` (337줄) · `T2Editor-v11/CLAUDE.md` (59줄) 이다. 이 스킬은 **그 두 문서 사이의 충돌과 알려진 오류**를 정리한 것이다.

## 1. 규범 정본이 둘이다 — 충돌 시 따를 것

| 문서 | 정본인 것 | ⚠ 알려진 오류 |
|---|---|---|
| `AGENTS.md` 337줄 | 프론트엔드 보수 패치 원칙 · Playwright 규율 · 설정 키 계약 · 코드 관행 · **Autonomous Maintenance Charter** | `:23` `--quick` 존재하지 않음 · `:45` 라인·내용 둘 다 틀림 · `:69` 라인 낡음 |
| `CLAUDE.md` 59줄 | 임시 브랜치 CI 제외 · 게이트 재현 · 검사 항목 동시 수정 | — |

**`--quick` 항목은 `CLAUDE.md` 가 정본이다**(거기엔 없다).

## 2. `AGENTS.md` 의 알려진 오류 (2026-09-28 실측)

| 인용 | 적혀 있는 것 | 실제로는 |
|---|---|---|
| `AGENTS.md:45` | `t2-visual-system.css:446`, `0s 1.5s forwards`, "19개 버튼" | `t2-visual-system.css:496-502`, **`:498` = `0s linear 3s`**, 버튼 19 중 14 |
| `AGENTS.md:69` | `t2-foundation.css:308` | `:375` (가드) / `:366,376,428,433` (정의) |
| `AGENTS.md:23` | `--quick` 플래그 | 인자 파싱 없음 — 플래그 무시 |
| `AGENTS.md:43` | 공개 어휘 갱신 대상 | `T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md` (코드는 `tools/t2-css-contract.mjs:76-77` 을 가리킨다) |

오염 전파: `AGENTS.md:45` 의 잘못된 수치가 **`GITHUB-ISSUE-BODY-KO.md:19`** 로 복사됐다.

⇒ **`AGENTS.md` 를 인용하기 전에 `node tools/t2at.mjs verify` 로 확인하라.** 이 저장소가 있는 이유가 이것이다.

## 3. 라벨

```
필수    agent:t2editor
심각도  sev:critical · sev:high · sev:medium · sev:low
영역    area:design  area:responsive  area:mobile  area:ux  area:a11y
        area:admin-dev  area:admin-nontech  area:bug  area:legacy  area:perf  area:compat
상태    in-progress  (작업 중, PR 열면 제거)   needs-human  (에스컬레이션)
```

## 4. 이슈 본문 (한국어 — 비전문 관리자가 읽는다)

무엇이 잘못되었는지 · 어디가`(파일/컴포넌트)` · 왜 중요한지 · 제안하는 접근.
**빠른 수정(fast-track)은 이슈를 만들지 않는다** — 커밋 메시지가 그 기록이다.

## 5. PR 본문 (한국어)

무엇이 깨졌는지 · 근본 원인 · 무엇을 바꿨는지 · 왜 이 방법인가 · **무엇을 어떻게 검증했는지** · 관리자/UX 변경이면 **2인페르소나 메모**(전공자 개발자에게 도움되는가 / 비전공자가 문서 없이 이해 가능한가) · `Closes #<번호>`.

- 동시 open PR 상한 **2~3개**.
- 새 브랜치 전, 열린 PR이 **같은 파일**을 만지는지 확인. 만지면 경합하지 않는다.
- 브랜치: `fix/<이슈번호>-<짧은-slug>`
- 머지 전 `origin/main` 으로 rebase.

## 6. 관리자 2인페르소나 (필수 체크)

관리자 패널은 **전공자 개발자**와 **비전공자 웹마스터**에게 서로 다른 화면을 준다. 관리자 UI/UX 변경은 두 사람을 모두 놓고 판단하고 **답을 PR 에 적어라**.

> `t2editor_admin_requires_local_credentials()` 는 **standalone 일 때만 true** 다. 즉 그누보드5·라이믹스에서 CMS 인증이 실패해도 자체 로그인은 자동 요구되지 않는다.

## 7. 에스컬레이션 (`needs-human`, PR 열지 말 것)

- 프로젝트 자신의 규범/디자인 철학 문서를 바꾸거나 그것과 충돌
- 공개 API · 플러그인 계약 · 저장 스키마의 호환성 깨짐
- **인증 · 권한/역량 게이팅 · 라이선스/키 검증** 접촉
- 의존성 메이저 업그레이드 / 신규 외부 의존성
- 파괴적 마이그레이션, 롤백 불가
- 규범이 침묵하는 지점의 진짜 취향 판단

→ **문제 + 접근 2~3가지(트레이드오프) + 추천안**을 한국어로 쓰고 멈춘다.

## 8. 리소스만 남기고 시간은 쓰지 마라

Autonomous Maintenance Charter 의 조항: 관리자는 코드를 직접 쓰지 않고 **이슈·PR·커밋 메시지가工作的 창**이다. ⇒ 메시지를 비전문가가 읽을 수 있게 쓴다. 그리고 **당장 고칠 수 없는 것은 이슈로 남기고**, 그 대신 survey pass·edge-case 스윕·연구에 예산을 쓴다.

## 9. 세션 종료

```bash
git status --porcelain
gh issue list --label in-progress
gh pr list
```
고아 이슈/PR 에 진행 현황을 한국어로 남긴다. **fast-track 직접 커밋은 이슈가 없으므로 한 줄로 모아서** 보고한다.
고아 추적 이슈는 제목 `[Agent] 진행 현황` 이다(없으면 한 번 만든다).
