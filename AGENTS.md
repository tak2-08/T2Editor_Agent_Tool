# AGENTS.md — T2Editor_Agent_Tool 사용 헌장

<!-- 이 파일은 이 저장소를 클론한 에이전트에게 자동으로 주입된다. -->

## 1. 이 저장소의 정본성

- **정본은 GitHub**: `https://github.com/tak2-08/T2Editor_Agent_Tool` (main)
- **코드의 정본은 별개**: `https://github.com/tak2-08/T2Editor-v11` (private). 이 저장소가 만드는 모든 측정값은 **그쪽**에서 나온다.
- 이 저장소에 `T2Editor` 소스는 없다. `data/` · `datasets/` 는 **정본에서 추출한 생성물**이다. 손으로 고치면 드리프트다.

## 2. 첫 행동을 이것으로

```bash
node tools/t2at.mjs status     # 정본 연결 + 자산 기준 커밋
node tools/t2at.mjs doctor     # 이 자산이 아직 신뢰할 수 있는가
```

`doctor` 가 `exit 1` 이면 **이 저장소의 내용을 근거로 인용하지 마라.** 먼저 갱신하거나, 문제를 적고 넘어가라.

## 3. 절대 규칙

1. **추측하지 않는다.** 이 저장소에서 "미확인" 은 검증 부재가 아니라 **정직한 표시**다. `knowledge/v11-hotspots.md` §6 과 `knowledge/v11-security.md` §11 에 격리된 항목은 **모른다**는 뜻이다. 추정으로 메우지 마라.
2. **인용에 `파일:라인` 을 단다.** 그리고 `datasets/citations.csv` 에 `must_contain` 토큰을 건다. 그래야 **내용 변경**이 잡힌다.
3. **`must_contain` 을 고쳐서 검사를 통과시키지 마라.** `NO_MATCH` 는 정본이 진짜 바뀌었다는 신호다. 설명을 고쳐라.
4. **숫자는 손으로 쓰지 않는다.** `node tools/t2at.mjs refresh --write` 가 만든다.
5. **정본이 GitHub이다.** 작업 시작 시 `git fetch origin` 후 `origin/main` 기준.
6. **증거 없는 보고를 하지 않는다.** 파일:라인 · 수치 · 확신도 · 기각한 대안.

## 4. 읽는 순서

```
1. knowledge/v11-hotspots.md        ← 지금 무엇이 참인가 (3분)
2. skills/00-start-here.md          ← 전체 지도
3. 목적에 맞는 skills/xx-*.md
4. 필요할 때 knowledge/v11-*.md      ← 심층 근거
5. 기계 원본 data/catalog/*.json · datasets/*.csv
```

`skills/` 는 **실행 가능한 절차**, `knowledge/` 는 **근거**, `data/`·`datasets/` 는 **기계 판정**이다. 셋의 역할을 섞지 마라.

## 5. 이 저장소에 지식을 추가할 때

```bash
node tools/t2at.mjs refresh --write    # 정본이 바뀌었다면 먼저
# … 지식 문서/스킬에 파일:라인 인용을 쓰고 …
$EDITOR datasets/citations.csv         # must_contain 토큰 등록 (쉼표로 토큰 여러 개 가능)
node tools/t2at.mjs verify --json      # 전수 검증 + 미결합 힌트 경고
node tools/t2at.mjs doctor             # 종합 진단
git add -A && git commit               # COMMIT_PROVENANCE 에 누가 언제 실측했는지 남긴다
```

`datasets/citations.csv` 형식:

```
n,문서경로,경로,라인[,resolve_to][,must_contain,이유]
1,knowledge/v11-hotspots.md,T2Editor/guide.txt,63,,chmod -R 775,가이드가 코어와 어긋나는 지점
```

- 열(쉼표) 수가 헤더와 다르면 **즉시 오류**로 뱉는다. 이전엔 조용히 `must_contain` 가 빈 칸이 되어 감지가 죽었었다.
- `must_contain` 에는 그 줄에 **반드시 있는 문자열**을 쓴다. 없으면 안 통한다.
- basename 이 중복되면 `resolve_to` 로 정본 경로를 고정한다.

## 6. 이 저장소가 이미 알고 있는 함정

`skills/90-pitfalls.md` 에 8절로 정리돼 있다. 특히:

- **A절 (문서가 코드를 앞서는 함정)** — `AGENTS.md` 자체가 5곳에서 틀렸다. 인용하기 전에 `verify` 로 확인.
- **H절 (도구 자체의 함정)** — 이 저장소를 만들 때 우리가 실제로 밟은 것들.

## 7. 회피해야 할 일

- ❌ `data/` · `datasets/` 를 손으로 수정 — 생성물이다
- ❌ 근거 없는 "일반적인 개발 조언" 을 `knowledge/` 에 추가 — 이 저장소가 처음에 가지고 있던 바로 그 병
- ❌ README 에 없는 파일을 언급 — `doctor` 가 잡지만, 애초에 하지 마라
- ❌ 실행 명령 없는 스킬 — `doctor` 가 잡는다
- ❌ "보통 ~다" 식의 서술 — `미확인` 이라고 쓴다
- ❌ `verify` 실패를 무시하고 진행 — `NO_MATCH` 는 정본이 바뀌었다는 뜻이다

## 8. 이 저장소가 하지 않는 것 (정직하게)

- **v1~v10 소스는 없다.** 레거시 서술의 v10 쪽 근거는 **문서**다(이 저장소가 v10 코드를 직접 읽은 게 아니다).
- **브라우저 시각 검증은 없다.** Playwright·`php`·`python3` 부재. 정적·카탈로그·인용 축만 채운다.
- **`published_at` 은 날짜가 아니다.** 전 판본이 8분 51초 안에 아카이브 재게시됐다. `real_deploy_date` 를 써라.
- **후퇴(기능 제거) 목록은 불완전**하다. 릴리즈에 "제거" 기록이 없는 판본이 여럿이다.
- **번들 라이브러리 버전 감지는 불완전**하다. CVE 판단 전 파일 안 문자열을 직접 grep 할 것.

## 9. 확신 규칙

이 저장소의 모든 수치에는 출처가 있다. **"그럴듯하다" 는 근거가 아니다.**
자신이 만든 결론도 예외가 아니며, 특히 통계를 만들면 negative control 을 돌려 "실패할 수 없는 검증"이 아닌지 확인한다. (이 저장소의 인용 검증기를 만들 때 실제로 2번 vacuous Assertion이 나왔고, 그걸 기록하지 않았다면 감지기가 조용히 죽은 채 배포될 뻔했다.)
