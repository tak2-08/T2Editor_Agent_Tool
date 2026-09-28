# 40 — 설정 키를 추가할 때

## 1. 규약 (정본 `AGENTS.md` §55-61)

`T2Editor/config/t2_hard_config.php` 는 **값의 파일이 아니라, 이 배포본이 아는 설정 표면의 선언**이다.

- 거기 적히지 않은 키는 관리 화면에서 저장해도 **읽는 쪽에서 벗겨진다** (`T2Editor/config/t2_hard_contract.php`).
- 관리자를 쓰지 않는 배포본(`Lite`)에는 그 파일 말고 설정이 올 곳이 없다. `Lite`·`tLite` 에서는 강제를 끌 수도 없다.
- **설정 키가 하나라도 생기면 같은 변경에서 하드 설정에 코드 기본값과 같은 값으로 적는다.**

## 2. 현재 표면 (기계 판정 `data/catalog/config-keys.json`)

```
리프(실제 키) 239개 · 최상위 그룹 3개 · 중첩 그룹 83개 · 루트 배열 T2Editor/config/t2_hard_config.php:4
  settings              233 키 / 80 하위 그룹   (:44)
  surface                 2 키                  (:36)
  trusted_proxy_ips       0 키(빈 배열)          (:43)
```

경로는 점으로 이어 붙인다: `settings.editor.css_min` 처럼.
전수: `datasets/config-keys.csv` (239행) · `node tools/t2at.mjs query "<키 이름>"`

## 3. 추가 절차 (체크리스트)

```bash
# 1. 키가 이미 있는지 확인 (이 저장소)
node tools/t2at.mjs query "<키이름>"
grep -n "'<키이름>'" T2Editor/config/t2_hard_config.php
grep -n "'<키이름>'" T2Editor/admin/api.core.php        # t2a_default_settings()

# 2. 코드 기본값을 t2a_default_settings() 에 넣는다
# 3. 같은 변경에서 t2_hard_config.php 의 같은 키 자리에 같은 값으로 적는다
# 4. 데이터가 들어가는 자리는 빈 배열로 열어 둔다
grep -n "hard" T2Editor/tests/php/hard-declaration.test.php
```

- **키가 데이터인 자리**(플러그인 id, 아이콘 목록)는 **빈 배열**로 적어 문을 연다.
- 카탈로그가 매니페스트에서 나오는 구획만 `T2Ehardcontractopenpaths()` 에 둔다.
- 규약 원문: `T2Editor/docs/hard-config-contract.md`

## 4. 게이트가 잡는 것

`T2Editor/tests/php/hard-declaration.test.php` 가 `T2Editor/admin/api.core.php` 의 `t2a_default_settings()` **전체**를 하드 설정 대장과 대조한다.
**빠뜨리면 게이트가 그 키 이름을 찍고 멈춘다.** ⇒ 실패 메시지에 나온 키 이름을 그대로 고쳐라.

## 5. 함정: 값이 두 종류다

| 종류 | 예 | 빠뜨리면 |
|---|---|---|
| 불리언/스칼라 | `settings.editor.css_min => true` | 관리 화면 저장값이 버려진다 |
| 배열(구성 목록) | `surface => array('format' => 1, 'enforce' => true)` | 구성이 하드 설정과 어긋난다 |
| 빈 배열(열린 문) | `trusted_proxy_ips => array()` | 나중에 채울 때 선언을 못 한다 |

`data/catalog/config-keys.json` 의 `keys[]` 항목에 `kind: 'group' | 'leaf'` 와 `value`, `line` 이 들어 있다. **leaf 수는 곧 "키 수"이고, group 은 문이다.**

## 6. 확인

```bash
cd <T2Editor_Agent_Tool>
node tools/t2at.mjs refresh --write     # 키 수가 늘었는지
node tools/t2at.mjs doctor
git diff --stat data/catalog/config-keys.json datasets/config-keys.csv
```

키 수가 의도대로 안 늘었으면 **파서가 놓친 것**이다(내 파서는 한 줄짜리 인라인 배열 안의 키도 세지만, 여러 줄에 걸친 평면 값은 세지 않는다). 그 경우 수동으로 `data/catalog/config-keys.json` 을 확인하고 이 저장소에 이슈를 남긴다.
