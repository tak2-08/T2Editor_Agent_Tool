# 30 — CSS · 시각 · 반응형

## 1. 토큰은 두 사다리이고 섞지 않는다

| 계열 | 뜻 | 정의 위치 | 쓰는 곳 |
|---|---|---|---|
| `--t2-s*` | 2px 리듬 · 4px 사다리 | `T2Editor/css/t2-foundation.css` | 콘텐츠 흐름 (간격·패딩) |
| `--t2-u*` | u/16 배수 | `T2Editor/css/t2-foundation.css:366,376,428,433` | 크롬·모달 |

- **새 CSS/JS에 임의 px 리터럴을 쓰지 마라.** 수치의 단일 소스는 `T2Editor/developer/t2-design-system.md` + `T2Editor/css/t2-foundation.css` 토큰이다.
- `T2Editor/law/case` 의 해설 수치는 **비규범 예시**다. 코드로 옮긴 전례가 있다.
- 섞으면 `tools/t2-css-contract.mjs` 의 C 계열이 위배로 잡는다.

## 2. 🚨 `--t2-u` 는 `@supports` 안에서만 산다

`T2Editor/css/t2-foundation.css:368-374` — `--t2-u: calc(100cqi/15)` 계열은 `@supports (width:1cqi)` 가드 **안**에서만 유효하다.
가드 밖 엔진에서는 **u 가 0 이 되어 크롬 전체가 0으로 붕괴**한다.
⇒ 가드 밖 `100vw` 폴백이 살아 있는지 항상 확인하라. (`T2Editor/css/t2-foundation.css:366` 이 폴백 정의)

## 3. 레이어 소유권

외형은 `t2.product` 가 소유한다.

```
t2.product  >  t2.module  >  t2.plugin
```

- `t2.module` / `t2.plugin` 이 `appearance` · `margin` · `display` · `position` 을 선언하면 **레이어에 져서 죽는다.**
- JS `<style>` 주입 금지 (`T2Editor/js/toolbar.js` 전례), unlayered 시트 금지 → `tools/t2-css-contract.mjs` 의 C1/C2/C7b 가 잡는다.
- 하드 실패 규칙: `tools/t2-css-contract.mjs:763` `hardFail = C1 · C2`
- 공개 어휘(삭제 금지): `tools/t2-css-contract.mjs:77` `PUBLISHED_VOCAB` = `css/t2-foundation.css` · `css/t2-visual-system.css`.
  갱신 대상 문서는 **`T2Editor/css/DESIGN-SYSTEM-VOCABULARY.md`** 다. (`AGENTS.md:43` 이 아니라 — 코드가 가리키는 곳이 다르다)

## 4. 규칙 식별자 — 지어내지 마라

기계 원본은 `datasets/css-contract.csv` 다. 현재 상태:
- 존재: C1~C15, C18~C21 (16종)
- **C16 · C17 은 없다**
- **C22 는 폐기** — `tools/t2-css-contract.mjs:711-719` 에 제거 주석 전문이 있다. 폐기 이유는 "규칙이 디자인 원본과 정면으로 어긋났다"는 것. baseline 이 아니라 **규칙 자체를 버렸다.**

## 5. 기하를 뒤집지 마라 (실제 사고 3건)

| 사고 | 규칙 |
|---|---|
| 모달 비율을 **하한**처럼 고정 → 390px 에서 버튼이 잘림 | 비율(`13:6` 등)은 **max-height 상한**이다. `T2Editor/js/utils/modal.js` `fitSurfaceToContent` 가 `max-height` 까지만 `minHeight` 로 늘리고, 남는 넘침은 표면 내부 스크롤 + 마지막 실행행 sticky(`T2Editor/js/utils/modal.css:162` `t2-modal-pinned-actions`)로 고정 |
| `container-type: inline-size` → flex/grid 부모에서 폭 0 붕괴 | `contain:inline-size` 가 상속되어 셸이 shrink-to-fit 자리에서 폭 0 이 된다. `width:100%` + `min-width:0` 등으로 끊어야 한다 (`T2Editor/css/t2-visual-system.css:382`) |
| pending 을 제거 → 저속 기기에서 버튼 19개가 2초 노출 | 서버 마크업이 `t2-toolbar-pending` 으로 시작하고 첫 수용량 판정 전까지 셸 밖 넘침을 숨긴다. `T2Editor/css/t2-visual-system.css:496-502` — `:498` 이 안전망 `0s linear 3s forwards` |

> 위 `:446` 은 정본 `AGENTS.md:45` 의 낡은 인용이다. **실제는 `:498` 이고 시간도 `1.5s` 가 아니라 `3s` 다.** 이 저장소가 인용 검증기를 둔 이유가 이것이다.

## 6. 실기기 분기 (Chromium 통과는 통과가 아니다)

이 저장소에서 반복된 패턴: **에이전트 Playwright 에서 정상, 실제 Android·iOS Safari/Chrome 에서 비정상.**

- `100vh` 금지 → `100dvh`(+`100vh` 폴백) + `env(safe-area-inset-*)` + `--t2-privacy-notice-inset` (`T2Editor/js/utils/modal.css:29,65`)
- 터치: `pointer:coarse` 44px 히트 — media 쿼리 안에서만 동작
- 폰트: `document.fonts.ready` 전/후, woff2 차단 상태를 모두 잰다
- 다크/라이트 · 1280/390/360 · 임베드 셸 폭 스윕
- **단독 프로브만 믿지 마라.** `tools/ux/_probe_embed.php` 를 `/_probe_embed.php?layout=flex|grid|inline` 으로 함께 잰다. 루트 직계 프로브는 flex/grid 부모 붕괴를 못 본다.

## 7. 판정 방법

`tools/ux/t2-ux-check.mjs` 의 **delta** 로 판정한다: 스크린샷 `...` 넘침·가림을 `SURFACE` → `delta` → `report` baseline 대비 **신규 위반만**으로 본다.
규약 전문은 `T2Editor/tools/ux/README.md`.

## 8. 환경이 없을 때 (이 컨테이너)

Playwright 가 없다. 대신 아래를 하고 **"시각 검증 미수행" 을 PR 에 명시**한다.

```bash
node tools/t2-css-contract.mjs          # 기계가 잡는 것만
grep -n 't2.product\|t2.module\|t2.plugin' T2Editor/css/*.css   # 레이어 귀속 확인
grep -n 'container-type\|100vh\|@supports' T2Editor/css/*.css  # 분기 확인
node tools/t2at.mjs doctor              # 이 저장소 자산까지
```
