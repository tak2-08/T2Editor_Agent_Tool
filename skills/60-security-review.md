# 60 — 보안 리뷰

> 심층 근거는 `knowledge/v11-security.md` (960줄, 인용 66개 고유 파일:라인) 에 있다. 이 스킬은 **그 문서를 어떻게 쓰고 어떻게 의심하는가**다.

## 0. 먼저 읽을 함정 3건

1. **`knowledge/v11-security.md` 의 미확인 5건은 "미확인" 이라는 뜻이다.** B1 이 git 사용 금지 지침 때문에 못 본 것이다. 추정으로 메우지 마라.
2. **B1 이 스스로 만든 오류 2건이 그 문서에 남아 있다**: `guide.txt` 장 라인번호(전량 추정 → `grep -n` 으로 교체), 그리고 **존재하지 않는 `admin_auth.php`** 를 한 번 지어냈다가 `T2Editor/admin/api.core.php:44` `T2ADMIN_AUTH_FILE` 로 정정했다.
3. **권한 수치는 3자 불일치 상태다** (아래 §2).

## 1. 신뢰 경계 4층

```
브라우저(신뢰 불가) → PHP 엔드포인트 → CMS 호스트 → 데이터 저장
```

각 층에서 누가 무슨 검사를 하는지는 `knowledge/v11-security.md` §1 의 표를 본다. **검사하지 않는 층이 어딘가 있다는 것은 보통이다** — 그 빈틈이 공격면이다.

## 2. 🚨 권한 수치 3자 불일치

| 출처 | 값 | 위치 |
|---|---|---|
| 배포 가이드 | `chmod -R 775` | `T2Editor/guide.txt:63` |
| 코어 설치 UI | **707** | `T2Editor/extend/admin/js/t2_first_run_guide.js:31,34,47,51,81,82,482,570` |
| 코드가 만드는 값 | **0755** | `T2Editor/config/t2_storage.php:225,298` · `T2Editor/config/t2_cms_data.php:29` · `T2Editor/integration/cms/adapters/standalone.php:5-13` |

- 코드는 `chmod` 을 **강제하지 않는다.** 0755 로 만들고 쓰기 시험이 실패하면 UI 가 707 을 권한다.
- "v10=707, v11=775" 라는 서술은 **절반만 옳다.** v10 도 707 이었고 v11 코어 UI 도 707 이며, **가이드만 775 다.**
- 고치는 쪽을 정하기 전에 어느 쪽이 의도인지 확인한다. 가이드가 유일하게 틀린 것 같지만, 이건 사용자 안내이므로 함부로 바꾸지 않는다 → `needs-human`.

## 3. 🚨 pdf.js CVE-2024-4367 (v11 미패치, 확신 99%)

```
T2Editor/vendor/pdfjs/pdf.min.js              apiVersion:"3.11.174"   (영향 < 4.2.67)
T2Editor/vendor/pdfjs/pdf.min.js:110580       isEvalSupported:e=!0    ← 기본값이 참
T2Editor/vendor/pdfjs/pdf.min.js:112026       ...&&s.FeatureTest.isEvalSupported){  ← eval 경로 개방
T2Editor/plugin/file/pdf_view.core.php:226-232 getDocument({...})      ← isEvalSupported 미전달
```

도달 경로: 저권한 사용자가 올린 PDF를 다른 사용자가 파일 플러그인에서 열면 도메인 컨텍스트에서 JS 실행.
**고침은 1줄** — `getDocument({... isEvalSupported: false ...})`.

인용이 **오프셋**이라는 점에 주의하라. 이 저장소의 인용 검증기는 압축 파일(줄 < 200 · 바이트 > 100KB)을 자동으로 오프셋 모드로 읽고 **latin1** 로 연다(바이트 인덱스 = 문자 인덱스). utf8 로 읽으면 멀티바이트 뒤에서 모든 오프셋이 어긋난다.

## 4. 🚨 `data/` 는 웹에서 노출될 수 있다

- 패키지 안 `.htaccess` 는 **루트 1개뿐**이고 내용도 캐시 규칙이다. `data/` 전용 차단이 아니다.
- 자체 가드 `T2Editor/config/t2_storage.php:222-235` 는 private DB(`t2editor_db/`)에만 기록을 남긴다.
- nginx 는 `.htaccess` 를 안 읽는다. `T2Editor/guide.txt:41` 이 요구하는 `location ^~ /t2editor/data/ { deny all; }` 를 **호스트에 넣어야 한다.** 에디터가 대신 해주지 않는다.

## 5. 🚨 업로드에 신원 판정이 없다

`T2Editor/config/t2_upload_ticket.php:487-488` — `T2Euploadsessionstart(){ return true; }` 이고 **호출자가 0**인 죽은 스텁이다.
실제 관문은: 출처 검사(`T2Editor/config/t2_upload.php:705`) + bootstrap 티켓(`:349`) + 선택적 캡차.
권한 게이트는 `T2Editor/config/t2_permissions.php:223` `enabled=false` 가 기본.

## 6. 서버측 XSS 필터 (11.0)

- 공개 함수: `T2Esanhtml()` / `T2Esanclean()` / `T2Esanregisterprovider()` — `T2Editor/config/t2_sanitize.php`
- `skipped` 4형: `disabled` / `too_large` / `no_provider` / `too_complex` — **저장 지점에서 `T2Esanhtml()` 을 써라.** `T2Esanclean()` 은 거르지 못한 경우 원본을 그대로 돌려준다(= 검증 통과로 읽으면 안 된다).
- 두 엔진: `dom`(ext-dom) / `regex`. **DOM → regex 강등 없음, fail-closed.**
- `guide.txt:296` 의 "DOM 판은 URL 속성의 비ASCII 를 퍼센트 인코딩한다" 는 **재현된다**(`/글/1` → `/%EA%B8%80/1`). 코드가 아니라 libxml `saveHTML()` 의 부수효과다(`T2Editor/config/t2_sanitize.php:533`).
- 공급자 계약: `clean` 이 `null` = 의견 없음(원본 유지) / `''` = "전부 걸렀다". **다르다.**

## 7. 호스트 보안 다리

`T2Ehostsecuritysnapshot()` — `T2Editor/config/t2_cms_security.php`.
- **standalone 은 9 capability 전부 `false`(모름)** — 거부도 허용도 아니다.
- 그누보드5는 9종, 라이믹스는 9종 + `iframe_domains` 을 선언한다.
- `T2Ehostcsrfverify('')` → `NULL`, `T2Ehostsafefilename()` → 무변경 통과.

## 8. 🚨 `T2_NSFW_MODE='server'` 는 조용히 죽는다

`T2Editor/core/editor.core.php:1367` 이 서버 NSFW URL을 주는데 **`T2Editor/config/nsfw_api_server.php` 파일이 없다** → 404 호출로 필터가 조용히 작동하지 않는다.
v9.1.0 에서 서버 모드가 중단된 것과 연결되는지는 **미확인**(§11 미확인 목록).

## 9. CSRF · 출처

- CMS 위임: 그누보드5 `get_token()` / 라이믹스 `Session::createToken()` — 어댑터별 위치는 `knowledge/v11-security.md` §5
- `G5_DISABLE_ORIGIN_CHECK` 로 Gnuboard5 출처 검사를 끈 뒤 **편집기 자체 동일 출처 검사(`T2Esameorigin`)가 남는가** → **미확인**
- `targetOrigin:'*'` 허용 규칙: 파일 안에 사유 주석 **과** `event.source === …` 동일성 검사가 **둘 다** 있어야 `tools/t2-static-check.mjs` 를 통과한다

## 10. 번들 라이브러리 (12종 · 13.1MB)

`datasets/vendor.csv` 에 전수(패키지·바이트·탐지된 버전·최대 파일).
⚠ `detected_versions` 는 정규식으로 파일 내 문자열을 찾은 것이고 **불완전**하다. `hls.js`·`p2p-media-loader`·`peerjs`·`jsqr` 의 실제 내부 버전은 미확인. CVE 를 판단하기 전에 `VERSIONS.json` 만 믿지 마라 — `pdf.min.js` 처럼 **파일 안 문자열을 직접 grep** 하는 것이 이 저장소의 방식이다.

## 11. 미확인 목록 — 여기 있는 것을 추정으로 메우지 마라

1. 커밋 `6a50052` 의 실제 변경 내용
2. `T2Editor/config/get_upload_config.php` 가 인증을 요구하는가
3. `G5_DISABLE_ORIGIN_CHECK` opt-out 후 대체 검사 여부
4. 그누보드5 `t2editor_g5_ip_decide` 내부 로직
5. `hls.js`·`p2p-media-loader`·`peerjs`·`jsqr` 번들 내부 버전
6. `T2_NSFW_MODE='server'` 중단과 현재 죽은 참조의 연결
7. v10 배포판 스냅샷 부재로 인한 v10 비교 문서 의존
8. 라이선스 세대 1.0.1/2.0.0 경계 1건 (A2 수기 판독 vs 도구 파서)

**이 중 하나를 해결하면 §6 목록에서 빼고, 근거를 `file:line` 으로 남겨라.**

## 12. 검증

```bash
cd <T2Editor_Agent_Tool>
node tools/t2at.mjs query "sanitize"
node tools/t2at.mjs verify --doc knowledge/v11-security.md
node tools/t2at.mjs doctor
```

보안 문서의 인용이 `NO_MATCH` 로 떴다는 것은 **정본 코드가 그_security 설명과 달라졌다는 뜻**이다. 설명을 고치거나, "이제 다름"을 적어라. 기대 토큰을 고쳐서 통과시키면 감지가 죽는다.
