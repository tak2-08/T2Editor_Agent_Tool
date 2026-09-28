# 10 — v11 에서 일하는 실행 루프

## 1. 세션 시작 (반드시)

```bash
cd <T2Editor-v11 루트>
git fetch origin
git rev-parse HEAD && git rev-parse origin/main   # 뒤처졌으면 지금 맞춘다
git status --porcelain                            # 남은 변경이 있는지
gh issue list --label agent:t2editor --state open --limit 100   # 진짜 백로그
```

로컬에만 있는 상태는 정본이 아니다. 브랜치는 **방금** origin/main 에서 분기한다(세션 중간에 pull 받은 tip 말고).

이 저장소 쪽도 확인:

```bash
cd <T2Editor_Agent_Tool>
node tools/t2at.mjs status
node tools/t2at.mjs doctor
```

## 2. 고르기

라벨 체계(정본 `AGENTS.md` 원문 기준):

- 필수: `agent:t2editor`
- 심각도: `sev:critical` · `sev:high` · `sev:medium` · `sev:low`
- 영역: `area:design` `area:responsive` `area:mobile` `area:ux` `area:a11y` `area:admin-dev` `area:admin-nontech` `area:bug` `area:legacy` `area:perf` `area:compat`
- 상태: `in-progress` (작업 중) · `needs-human` (에스컬레이션)

우선순위: 같은 영역 안에서 critical → important → easy. 그리고 **폭발 반경이 넓은 곳부터** (코어·관리자 → 개별 플러그인).

## 3. fast-track 과 PR-track 의 경계

**fast-track** (이슈 없이 default 브랜치에 직접 커밋): 오타·공백·주석/문서 수정·**직접 확인한** 미사용 코드 제거·형제 요소와 이미 같은 패턴인 CSS 값 하나.
→ **금지**: 인증/권한/스키마/API 접촉, reason 없이 판단이 필요했던 것, 에스컬레이션 목록 항목.
→ 그래도 린트/빌드는 돌리고, CSS·마크업이면 스크린샷 1장이면 된다(전체 검증 대신).

**PR-track** (이슈 + PR): 위 나머지 전부. 실제 행동 위험이 있거나, 자명하지 않거나, "자명한지 판정이 필요한" 것.

**경계에 있는 실제 판정 5가지:**

| 상황 | 판정 | 이유 |
|---|---|---|
| 주석에 틀린 라인번호가 적혀 있다 | fast-track | 동작 변화 없음. 다만 이 저장소의 `citations.csv` 에도 등록한다 |
| CSS 값 하나가 형제와 다르다 | fast-track | 같은 패턴 확인이 됐다면 자명 |
| `require_once` 를 추가한다 | **PR-track** | 로딩 순서 = 부팅 체인. 판단 필요 |
| 조건문을 하나 고쳐 버그를 없앤다 | **PR-track** | 실제 행동 변경 |
| `T2Esanhtml` 의 허용목록에 태그를 추가한다 | **PR-track + needs-human 검토** | 공개 API 표면·보안 정책 |

## 4. 구현 → 검증 → 게시

### 4.1 구현 규약
- `// Path: T2Editor/...` 주석을 **보존**한다. 파일을 옮기면 같이 갱신하고, 지우지 않는다.
- 고친 결함은 **같은 변경에** 재현 시험을 넣고, **고치기 전에 그 시험이 실패하는 것을 먼저 확인**한다(적색 우선).
- `targetOrigin:'*'` 가 필요하면 파일 안에 사유 주석 **과** `event.source === …` 동일성 검사가 **둘 다** 있어야 통과한다(`tools/t2-static-check.mjs` postmessage 규칙).

### 4.2 검증 (구현한 세션이 곧 유일한 검증자가 되지 않게)

이 환경에는 브라우저가 없다. 그래도 **3축**을 나눠서 말하라.

```bash
# 축 1 — 정적/기계
bash tools/t2-release-gate.sh          # 종료 코드 0 이어야 한다 (이 환경에서는 php 부재로 3단계에서 멈춘다)
node tools/t2-css-contract.mjs         # CSS 를 건드렸을 때
node tools/t2-static-check.mjs
node tests/run.mjs <name-filter>       # 이 환경에서 5819/5823 에서 크래시한다 (php 무가드 호출)

# 축 2 — 코드 인스펙션 (파일:라인 으로 근거를 남긴다)
grep -n '<심볼>' T2Editor/<경로>

# 축 3 — 이 저장소의 카탈로그 대조
cd <T2Editor_Agent_Tool> && node tools/t2at.mjs refresh --write && node tools/t2at.mjs doctor
```

> 이 환경에서 `node tests/run.mjs` 가 `tests/js/editor-skin-tab.test.mjs:38` 에서 크래시하는 것은 **테스트 버그다** (`spawnSync('php')` 무가드 → `JSON.parse(null)` → `TypeError`). 같은 스위트의 `merge-integrity` 는 우아하게 스킵하므로 비교 대상이다. 이건 "환경 탓"이 아니라 보고해야 할 결함이다.

### 4.3 시각 검증이 필요할 때 (환경에 없을 때의 대체)

`php`·Playwright 가 없는 컨테이너라면 **아래 6축으로 대체하고 그 사실을 PR 에 쓴다**:
1. 토큰 실재 여부 — 새 값이 `css/t2-foundation.css` / `t2-visual-system.css` 토큰인지 (`skills/30-css-and-visual.md`)
2. 컨트랙트 — 함수가 약속한 시그니처가 유지되는지
3. 형제 패턴 parity — 같은 레이어의 형제 요소와 값/선택자가 같은가
4. 레이어 귀속 — `t2.product` / `t2.module` / `t2.plugin` 중 어디 소유인가
5. 반응형 분기 — `@media` 안의 분기가 필요한데 밖에 있지 않은가
6. 기하 — 상한/하한을 뒤집지 않았는가 (예: 모달 비율을 하한처럼 고정하면 390px 에서 버튼이 잘린다)

## 5. PR

```bash
git switch -c fix/<이슈번호>-<짧은-slug> origin/main
# … 작업 …
bash tools/t2-release-gate.sh || echo "종료 코드 0 이 아니면 푸시 금지"
git rebase origin/main
gh pr create --title "…" --body "…"
```

- 동시 open PR 은 **2~3개 상한**. 그 이상이면 survey·edge-case 스윕에 예산을 쓴다.
- 새 브랜치를 만들기 전에 **열린 PR이 같은 파일을 만지는지** 본다. 만지면 경합하지 않는다(기다리거나 기존 PR에 접는다).
- 본문은 **한국어**: 무엇이 깨졌는지 · 근본 원인 · 무엇을 바꿨는지 · 왜 이 방법인가 · 무엇을 검증했는지(명령+결과) · 관리자/UX 변경이면 2인페르소나 메모.
- `Closes #<번호>` 를 넣는다.
- **경험상 주의**: 게이트 출력을 `| head` 로 자르면 종료 코드가 0 이 되어 실패가 통과로 읽힌다(SIGPIPE). 파이프 뒤 `&&` 로 성공 판정을 붙이지 마라.

## 6. 에스컬레이션 (직접 고치지 말고 `needs-human`)

- 프로젝트 자신의 규범/디자인 철학 문서를 바꾸거나 그것과 충돌하는 변경
- 공개 API · 플러그인 계약 · 저장 데이터 스키마의 호환성 깨지는 변경
- **인증 · 권한/역량 게이팅 · 라이선스/키 검증** 접촉
- 의존성 메이저 업그레이드 또는 신규 외부 의존성
- 파괴적 데이터 마이그레이션, 롤백이 안 되는 것
- 기존 규범이 침묵하는 지점의 진짜 브랜드/디자인 취향 판단

→ 이슈에 **문제 + 접근 2~3가지와 트레이드오프 + 추천안**을 한국어로 쓰고 멈춘다.

## 7. 세션 종료

```bash
git status --porcelain                 # 비어 있어야 한다
gh issue list --label in-progress      # 못 끝낸 것의 라벨을 되돌린다
# 이 저장소에 쓴 게 있으면
node tools/t2at.mjs refresh --write && node tools/t2at.mjs verify --json && node tools/t2at.mjs doctor
```

그리고 고어의 `AGENTS.md` §329-337 이 말하는 대로: 고아 이슈/PR 에 진행 현황을 한국어로 남긴다. fast-track 직접 커밋은 이슈가 없으므로 **그 커밋들도 한 줄로 모아서** 보고한다.
