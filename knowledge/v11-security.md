# B1 — T2Editor v11 보안 모델 심층 분석
---

<!-- T2Editor_Agent_Tool · 정본 지식 자산 -->

# T2Editor v11 — 보안 모델 심층 분석

> **출처** B1(보안 과장) 작성 2026-09-28 · 인용 66개 고유 파일:라인 · 라인 스팟체크 66건(오류 2건 정정) · 부장 감사 2026-09-28 완료
>
> **감사 기록 (부장)**
> ✅ **가장 시급한 발견 2건은 부장이 정본에서 부분 재현 확인함**: (1) `guide.txt:63` 의 `chmod -R 775` 와 코어 UI(`T2Editor/extend/admin/js/t2_first_run_guide.js:31,34,47,51,81,82,482,570` = `707`) 의 불일치. (2) `T2Editor/css/t2-visual-system.css:498` 실측 `0s linear 3s`.
> ✅ 탐욕적 삭제 규율 준수 — 미확인 5건을 명시 격리했다. **이 문서에서 "미확인" 이라는 단어는 검증 부재가 아니라 정직한 표시다.**
> ⚠ **B1 이 스스로 잡은 오류 2건이 남아 있다**: `guide.txt` 장 라인번호는 전량 추정이었다가 `grep -n` 실측값으로 교체(총 584줄, 6장=`:243`, 8장=`:536`). 그리고 존재하지 않는 `admin_auth.php` 를 한 번 지어냈다가 `admin/api.core.php:44` `T2ADMIN_AUTH_FILE` 로 정정했다. → 읽을 때 두 곳을 의심하라.
> 🚨 **작업 부재(미실측)**: 커밋 `6a50052` 의 변경 내용, `get_upload_config.php` 인증 유무, `G5_DISABLE_ORIGIN_CHECK` opt-out 시 대체 검사 여부. B1 이 git 사용 금지 지침 때문에 못 봤다. 후속 작업자용 과제로 §12 에 남아 있다.

---


> **과장**: B1 (보안축). **정본**: `/workspace/T2Editor-v11/T2Editor/`. **규범**: 읽기 전용, 파일 수정 0, git 0, `gh` 0.
> **검증 방식**: 코드 독해 + **PHP 8.4.23 실측 실행**(`/home/node/.local/php/php`)으로 허용목록·엔진·상태값을 직접 확인.
> **[주관적 판단]** 본 문서는 확신에 찬 정본이 아닌 **과장 B1의 실측 결과**이며 오판 가능성 있음. 확신도: 개별 주장마다 표기.

---

## 0. 먼저 읽어야 할 함정 3건 (요약)

| # | 함정 | 판정 | 근거 |
|---|---|---|---|
| **F-1** | **pdf.js CVE-2024-4367 이 v11에서 패치되지 않았다** | **확정 (바이트 수준)** | `vendor/pdfjs/pdf.min.js` `isEvalSupported` 11곳 존재·기본값 `true` / `plugin/file/pdf_view.core.php:226-232` 미전달 |
| **F-2** | **권한 수치가 문서·안내UI·코드 3자에서 모두 다르다** | **확정 (775 / 707 / 0755)** | `guide.txt:63` vs `extend/admin/js/t2_first_run_guide.js:47` vs `config/t2_storage.php:225` |
| **F-3** | **업로드 경로에 세션·신원 판정이 없다** | **확정** | `T2Euploadsessionstart(){return true;}` (호출자 0), `config/t2_upload.php:700-728` |

> ⚠ **브리프의 전제 정정 1건**: 브리프는 "`extend/js/t2_first_run_guide.js` 는 707이라고 한다"고 했으나, **v11 에 그 경로는 없다.** 실경로는 `extend/admin/js/t2_first_run_guide.js`. (v10 경로가 v11 브리프로 넘어온 것으로 보인다.)

---

## 1. 신뢰 경계 지도

### 1.1 4층 구조와 경계 위치

```
[0] 브라우저 (신뢰 불가)  ── POST multipart / JSON ──┐
[1] PHP 엔드포인트 (config/*.core.php)                │
[2] CMS 호스트 (gnuboard5 / rhymix)                   │
[3] 데이터 저장 (data/, CMS files/, t2editor_db/)    ─┘
```

| 층 | 대표 진입점 | 경계에서 무슨 검사를 하는가 | `file:line` |
|---|---|---|---|
| **[0]→[1]** | `config/upload.core.php`, `config/t2_upload_ticket.php` | HTTP 메서드 강제 + **동일 출처** + API 허용 여부 | `config/t2_upload.php:704-706`, `config/t2_upload_ticket.php:322-324` |
| **[0]→[1]** | `config/first_run_api.core.php` | 내부 런타임 심볼 + first-run 토큰 + 출처 | `config/first_run_api.core.php:5,36-39,50-52` |
| **[0]→[1]** | `config/privacy_consent.core.php` | 내부 런타임 심볼 + POST + 동일출처(`$requireEvidence=true`) + 16KB 상한 | `config/privacy_consent.core.php:4,23,24,26` |
| **[0]→[1]** | `config/search_meta_service.php` | `search_meta`(POST)만 동일 출처. **`search_meta_icon`(GET)은 우회** | `config/search_meta_service.php:268` vs `:272` |
| **[1] 전역** | 모든 엔드포인트 | `T2_EXTEND_RUNTIME_INTERNAL` 없으면 404 | `config/first_run_api.core.php:5`, `config/privacy_consent.core.php:4`, `endpoints/*.core.php:4` |
| **[1] 전역** | 보안 헤더 | `nosniff` / `Referrer-Policy` / `X-Frame-Options` / `Cache-Control` | `config/t2_security.php:5-11` |
| **[1]→[2]** | `integration/sanitize/providers/host-bridge.php` | 어댑터가 `sanitize_html` 선언 시 CMS 필터를 **먼저** 돌림(priority 800) | `integration/sanitize/providers/host-bridge.php:79-99` |
| **[1]→[2]** | `config/t2_cms_security.php` | capability 3형(허용/거부/모름) 중계 | `config/t2_cms_security.php:62-72` |
| **[2]→[3]** | `config/t2_storage.php` | private DB에 `.htaccess` + `index.html` 자체가드 | `config/t2_storage.php:222-235` |

### 1.2 진입점별 검사 표

| 진입점 | 내부 심볼 | 출처 | 인증 | sanit |
|---|---|---|---|---|
| `config/upload.core.php` | — | `T2Euploadoriginallowed()` `t2_upload.php:705` | 티켓만 (`t2_upload.php:720`) | 자체 검사 `t2_upload.php:749` |
| `config/t2_upload_ticket.php` | — | `:323` | bootstrap capability (`:349`) + 캡차 (`:355-358`) | manifest (`:367`) |
| `config/first_run_api.core.php` | `:5` | `:50` `check_request_origin` | first-run 토큰 `:37` | 미적용 |
| `config/privacy_consent.core.php` | `:4` | `:24` `T2Esameorigin` | 없음(동의 영수증) | 미적용 |
| `config/search_meta_service.php` | — | `:272` | 없음 (세션 레이트리밋 `:215`) | 미적용 |
| `config/remote_proxy.core.php` | — | `t2proxy_require_same_origin()` `:18` | 없음 | 미적용 |
| `config/get_upload_config.php` | — | 미확인(§9) | 없음 | 미적용 |
| `admin/api.core.php` | — | `t2a_require_auth` 계열 `:155` | 관리자 (`:1319` 401) | 미적용 |

---

## 2. 서버측 XSS 필터 (11.0 핵심)

### 2.1 공개 API 3종

| 함수 | 시그니처 | 반환 | `file:line` |
|---|---|---|---|
| `T2Esanhtml` | `(mixed $html, ?array $settings = null): array` | `{html:string, changed:bool, engines:array, skipped:string}` | `config/t2_sanitize.php:801-858` (선언 `:801`) |
| `T2Esanclean` | `(mixed $html, ?array $settings = null): string` | `$row['html']` **만** | `config/t2_sanitize.php:866-870` |
| `T2Esanregisterprovider` | `(string $id, array $provider): bool` | id 유효성 bool | `integration/sanitize/registry.php:35-46` |
| (보조) `T2Esansources` | `(?array): array` | 관리화면용 대장 | `config/t2_sanitize.php:875-891` |
| (보조) `T2Esansnapshot` | `(?array): array` | 진단 스냅샷 | `config/t2_sanitize.php:895-909` |

**반환 구조 실측** (`T2Esanhtml('<a href="/글/1">링크</a>')`, PHP 8.4.23):

```
html    = <a href="/%EA%B8%80/1">링크</a>
changed = true
skipped = ''
engines = [{"id":"editor","engine":"dom","changed":true}]
```

> ⚠ `engines[].engine` 는 **"설치가 가진 엔진"이 아니라 "이 요청이 탄 엔진"** 이다 (`config/t2_sanitize.php:436-446`, `:837-840`). 2026-09-26 감사 #314 는 이 필드가 설치된 ext-dom 유무만 말해 **거짓말**했다고 기록되었으나, **v11 현재 코드는 수정되어 있다.** 아래 2.4 참조.

### 2.2 `skipped` 4종의 실제 발생 조건

| 값 | 분기 지점 | 조건 | 실측 결과 |
|---|---|---|---|
| `disabled` | `config/t2_sanitize.php:807` | `!$config['enabled']` | `T2Esanhtml($h,['sanitize'=>['enabled'=>false]])` → `disabled` ✅ |
| `too_large` | `config/t2_sanitize.php:810` | `strlen($input) > max_bytes` (기본 `2097152`, 상한 `4194304`) | `max_bytes=1024` + 400,000자 → `too_large` ✅ |
| `no_provider` | `config/t2_sanitize.php:853` | 공급자 루프가 0개 실행 (`!$ran`) | 통합 계층 부재 + 자체 필터 미등록 시. **v11 기본 배포에서는 사실상 도달 불가** |
| `too_complex` | `config/t2_sanitize.php:818` (통합 계층 없는 경로), **`:845-850` (정상 경로)** | `T2Esanrecordengine(..., demoted:true)` | `<i>` 60,050개 → `too_complex` ✅ |

`too_complex` 의 demote 지점 (3곳, 모두 원본 반환 후 fail-closed):
- `config/t2_sanitize.php:469` — `loadHTML()` 실패
- `config/t2_sanitize.php:473` — `<body>` 없음
- `config/t2_sanitize.php:491` — 요소 수 > `T2Esanlimits()['nodes']` (= 60000, `:54`)

> **v10 대비 핵심 변화**: `#314` 는 "6만노드 초과 시 DOM→regex **강등**"이었으나, v11 은 **강등하지 않고 원본을 그대로 둔 채 `too_complex` 로 닫는다** (`config/t2_sanitize.php:466-468` 주석 + `:845-850`). 이는 가이드 2.3 "걸러지지 않았다는 이 경우다"를 코드화한 것이며 **올바른 방향의 수정**이다.

### 2.3 두 엔진

| 항목 | DOM | regex |
|---|---|---|
| 선택 로직 | `config/t2_sanitize.php:780` `T2Esanengineid() === 'dom'` | 같은 `:784` |
| 판정 | `:406` `class_exists('DOMDocument') && class_exists('DOMXPath')` | — |
| 구현 | `T2Esanfilterdom` `:448-538` | `T2Esanfilterregex` `:735-773` |
| 주입 옵션 | `:456-457` `LIBXML_NONET` (+`LIBXML_COMPACT`) | 해당 없음 |
| charset | `:461` `<meta charset=utf-8>` 래핑 (없으면 ISO-8859-1로 깨짐) | 해당 없음 |

**폴백 조건 = DOM이 없을 뿐이다.** `config/t2_sanitize.php:780-786` 의 `T2Esanfilter()` 는 **두 경우만** 나눈다. 실측: `T2Esanengineid()` = `dom` (ext-dom 존재).

**regex 판 실측** (직접 호출, PHP 8.4.23):

| 입력 | regex 판 출력 |
|---|---|
| `<script>alert(1)</script>ok` | `ok` |
| `<img src=x onerror=alert(1)>` | `<img src=x>` |
| `<img/onerror=alert(1)>` | `<img>` ← **solidus 구분 (#315) 수정 확인** |
| `<a href="jav&#x61;script:alert(1)">x</a>` | `<a href="blocked:alert(1)">x</a>` ← **#319 수정 확인** |
| `<a href="java script:alert(1)">x</a>` | `<a href="blocked:alert(1)">x</a>` (오탐 우선, 차단) |
| `<svg onload=alert(1)>` | `` (빈 문자열) |

> ⚠ **regex 판의 잔여 한계 (실측)**: `<img src=x>` 에서 **`src` 속성이 검증되지 않는다.** regex 판에는 URL 스킴 검사가 `javascript:` 계열(`T2Esanschemeneutralize`, `:642-733`)뿐이고 `src="data:text/html,…"` 류는 걸리지 않는다. DOM 판(`T2Esanurlsafe`, `:338-383`)에는 있으나, regex 판은 `ext-dom` 없는 설치에만 돈다. **`guide.txt:294`(6.4) "거칠지만 실행되는 것은 지운다"** 가 이 한계의 근거다.

### 2.4 ⚠ #313 (`<noembed>` → `<script>` DOM 우회) — v11 상태: **수정됨**

2026-09-26 감사에서 critical 1건으로 등록됐던 건. v11 코드 3중 방어 확인:

1. `config/t2_sanitize.php:262` — `noembed` 가 `T2Esandroptags()` **제거목록에 들어있다** (`noframes,noembed,noscript,…`)
2. `config/t2_sanitize.php:532` — CDATA 섹션을 순회 출력에서 **무조건 건너뛴다** (`if ($child->nodeType === XML_CDATA_SECTION_NODE) continue;`, 주석 `:528-531`에 #313 원인 기술)
3. `config/t2_sanitize.php:433` `T2Esanunwrap()` — 껍데기만 벗기되 자식은 올바른 위치로

**실측**: `T2Esanclean('<noembed><script>alert(1)</script></noembed>')` → `` (빈 문자열). ✅

### 2.5 허용목록 구조

**태그 수 = 58.** `config/t2_sanitize.php:206-243` 배열 리터럴을 파싱해 전수 추출 (위치:행):

```
p div span br hr                                     :208
h1..h6 section article aside header footer           :209-210
main nav address figure figcaption details summary   :211-212
blockquote q pre                                      :213
b strong i em u s strike del ins sub sup small       :215-217
mark code kbd samp var abbr cite time wbr bdi bdo     :217-219
ruby rt rp font center                               :220-221
ul ol li dl dt dd                                    :223-224
table caption colgroup col thead tbody tfoot tr      :226-228
th td                                               :229-230
a img picture source video audio track iframe        :232-238
input                                               :242
```

**전역 속성 10종** — `config/t2_sanitize.php:195`:
`class, id, title, dir, lang, align, hidden, role, translate, style`

**태그별 속성** (`config/t2_sanitize.php:206-243`):
- `details`→`open` (`:212`) · `blockquote`/`q`→`cite` (`:213`) · `del`/`ins`→`cite,datetime` (`:216`) · `time`→`datetime` (`:219`) · `font`→`color,face,size` (`:221`)
- `ol`→`start,reversed,type` · `li`→`value` (`:223`) · `table`→`border,cellpadding,cellspacing,summary,width` (`:226`) · `colgroup`/`col`→`span,width` (`:227`)
- `th`/`td`→`colspan,rowspan,headers,[th:scope,abbr,nowrap,bgcolor]/width,height,valign,nowrap,bgcolor` (`:229-230`)
- `a`→`href,target,rel,name,download,hreflang,type` (`:232`) · `img`→`src,alt,width,height,loading,decoding,srcset,sizes,usemap` (`:233`) · `source`→`src,srcset,type,media,sizes` (`:234`)
- `video`→`src,poster,controls,autoplay,loop,muted,playsinline,preload,width,height` (`:235`) · `audio` (`:236`) · `track` (`:237`)
- **`iframe`→`src,width,height,allow,allowfullscreen,frameborder,scrolling,loading,referrerpolicy,sandbox`** (`:238`)
- **`input`→`type,checked,disabled`** (`:242`) — checkbox/radio 만, 그 외 제거 `:617-624`

**특수 속성 규칙** (`config/t2_sanitize.php:540-630`):
- **이벤트 속성 무조건 제거**: `:560-562` `strncmp($lower,'on',2)===0` → `removeAttribute`
- **`data-*` / `aria-*` 통과** (단 이름 모양 검증): `:564-565` `/^(?:data|aria)-[a-z0-9_.:-]+$/`
- **`style`**: `:570-576` — `allow_style_attribute=false` 면 제거, 아니면 `T2Esanitizestyle()` 재작성. **전역 속성이라 여기서 따로 본다** (`:591-592`)
- **`srcset`**: `:577-582` → `T2Esansrcsetsafe()` (`:385-400`) — 후보별 검사 후 **막힌 후보만 뺀다**
- **URL 속성 분류**: `:550-552` `href,cite`→`link` / `src,poster,longdesc`→`media` / **iframe 의 `src`→`frame`** / `a` 의 `href`→`link`
- **`target="_blank"` → `rel="noopener noreferrer"` 강제**: `:594-606`
- **iframe**: src 없으면 통째 제거 `:608-611` → **`sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"` 강제 `:613`**, `referrerpolicy="strict-origin-when-cross-origin"` `:614`, `loading="lazy"` `:615`
- **video/audio `autoplay` → `muted` 강제**: `:625-629`
- **이름공간 태그(`o:p`) → unwrap**: `:501-507`
- **주석/처리지시자 제거**: `:479-486` — 조건부 주석(`<!--[if IE]>`) 예외 없이 삭제

**`strip_comments`** 처리 라인: DOM `:482-485` (설정 false라도 `[if|endif]` 조건부 주석은 삭제), regex `:739-740`.

### 2.6 URL 스킴 차단

**`T2Esanurlsafe($url, $context, $config)`** — `config/t2_sanitize.php:338-383`.

1. **선행 정규화** `:345-347`: 제어문자·공백 제거, `&colon; &#58; &#x3a; &#X3A;` → `:` (브라우저 해독 규칙 선취)
2. **블랙리스트 스킴** `:349-351` — 15종:
   `javascript vbscript jscript livescript mocha behavior view-source about file jar applescript wscript chrome resource blob filesystem`
   > ✅ `guide.txt:269`(6.3)가 나열한 `javascript: vbscript: data:text/html blob: file:` **전부 포함** (data: 는 별도 처리)
3. **`data:`** `:356-360` — `context !== 'media'` 또는 `allow_data_uri_images=false` → 거부. 허용 시 **`data:image/(png|jpeg|jpg|gif|webp|bmp|avif|x-icon)` + base64 만** (`svg+xml` 제외, 주석 `:358`)
4. **스킴 없음(상대경로)** `:362-370` — `frame` 컨텍스트는 무조건 거부, 그 외 통과. `//host/…` 는 host 판정 필요
5. **`frame`** `:372-377` — `http(s)` + 허용 호스트여야
6. **`media`** `:379` — `http(s)` 만
7. **`link`** `:381` — `http https mailto tel sms ftp ftps news irc xmpp`

**실측**:
```
<a href="javascript:alert(1)">x</a>        → <a>x</a>
<a href="jav&#x61;script:alert(1)">x</a>   → <a>x</a>
<img srcset="/a.png 1x, javascript:x 2x">  → <img srcset="/a.png 1x">
```

### 2.7 iframe 허용 호스트 — 3자 합집합

**합집합 로직**: `config/t2_sanitize.php:299`
```php
foreach (array_merge(T2Esanbuiltiniframedomains(), $host, (array)($config['iframe_domains'] ?? array())) as $entry)
```
- ① 코드 기본 목록: `T2Esanbuiltiniframedomains()` `:273-288` — 단, `t2a_builtin_iframe_domains()` 존재하면 그것을 우선 `:275-278`
- ② CMS 제공 목록: `T2Esanhostiframedomains()` `:298` → `integration/sanitize/providers/host-bridge.php:70-76` → 어댑터 `iframe_domains`
- ③ 설정 목록: `$config['iframe_domains']`, 정규화 `:135-143` (`T2Esannormalizedomain` `:90-100`, 상한 200 `:142`)

**실측 (standalone) = 25개**:
`youtube.com, www.youtube.com, m.youtube.com, youtube-nocookie.com, www.youtube-nocookie.com, youtu.be, player.vimeo.com, vimeo.com, dailymotion.com, www.dailymotion.com, geo.dailymotion.com, tv.naver.com, serviceapi.nmv.naver.com, play-tv.kakao.com, tv.kakao.com, w.soundcloud.com, open.spotify.com, docs.google.com, drive.google.com, calendar.google.com, www.google.com, codepen.io, codesandbox.io, jsfiddle.net, gist.github.com`

**호스트 매칭** `T2Esanhostallowed()` `:309-325` — 정확 일치 또는 하위 도메인. `'*.example.com'` 은 **하위만** (`:316-319`). 실측:
```
a.example.com  vs ['*.example.com'] → true
example.com    vs ['*.example.com'] → false   ← apex 불가
notexample.com vs ['example.com']   → false   ← 접미사 조작 차단
```
> CMS ②번 목록: rhymix만 채운다 — `integration/cms/adapters/rhymix.php:703-715` (`MediaFilter::getIframeWhitelist()`). **gnuboard5 어댑터는 `iframe_domains` capability를 선언하지 않는다** (`integration/cms/adapters/gnuboard5.php:566-575` 목록에 없음) ⇒ 그누보드5 설치는 ①+③ 만 합집합된다. 이는 `guide.txt:299`(6.5)의 "호스트 CMS 가 이미 허용한 목록"이 그누보드5에서 비는 것이며 **문서-코드 불일치**다 (확신 85%).

### 2.8 ⚠ `guide.txt:296` (6.4) "DOM 판은 URL 속성의 비ASCII를 퍼센트 인코딩한다" — **실측 재현 확인**

- **가드 코드**: `config/t2_sanitize.php:533` `$piece = $doc->saveHTML($child);` — 이 파일에는 `rawurlencode`/`urlencode` 호출이 **없다**. 인코딩은 **libxml `saveHTML()` 의 부수효과**다.
- **코드 내 문서화**: `config/t2_sanitize.php:638-640` 주석이 정확히 같은 사실을 기술한다.
- **실측 (PHP 8.4.23)**:
  ```
  입력 : <a href="/글/1">링크</a><img src="/사진/한.png">
  출력 : <a href="/%EA%B8%80/1">링크</a><img src="/%EC%82%AC%EC%A7%84/%ED%95%9C.png">
  ```
  **⇒ 주장 성립. 단 "코드가 하는 것"이 아니라 "파서가 하는 것"** 이므로 libxml 버전 변경에 의존한다 (확신 95%).

### 2.9 provider 계약 — `clean` 이 `null` vs `''`

**정본 계약**: `integration/sanitize/registry.php:32` — `clean  fn(string,array):?string  거른 HTML. **null = 의견 없음(원본 유지)**`

**코드가 실제로 어떻게 처리하는가**:
1. `integration/sanitize/registry.php:80-89` `T2Esancall()` — capability 를 `try/catch(Throwable)` 로 감싸 **던지면 `error_log` 후 `$default`**(= `null`). `:83` `call_user_func_array`, `:84-87` catch.
2. `integration/sanitize/providers/host-bridge.php:93-97` —
   ```php
   $out = t2editor_cms_call($adapter,'sanitize_html', array($html,$config,$ctx), null);
   return is_string($out) ? $out : null;   // ← 문자열이면 '' 도 통과
   ```
   주석 `:94-96`: *"빈 문자열은 '전부 걸렀다'이고 null 은 '의견 없음'이다 — 후자를 빈 본문으로 읽으면 필터 고장이 글 유실이 된다."*
3. `config/t2_sanitize.php:831-833` —
   ```php
   $out = T2Esancall($provider,'clean', array($current,$config), null);
   if (!is_string($out)) continue;   // null → 이 공급자는 현재를 그대로 통과
   ```

**판정**: 계약대로다. `null` → **원본 유지 후 다음 공급자로**(호스트 800 → 자체 500, `host-bridge.php:87` / `standalone.php:16`). `''` → **"전부 걸렀다"로 인정되어 본문이 빈 문자열이 된다.** 차이는 코드에 실제로 구현되어 있다.

**공급자 목록 (v11 실제 2종)**:

| id | priority | 파일 | `sanitize_html` 원천 |
|---|---|---|---|
| `host` | **800** | `integration/sanitize/providers/host-bridge.php:79` | CMS 어댑터 (gu: `clean_xss_tags()` / rx: `HTMLFilter::clean()`) |
| `editor` | **500** | `integration/sanitize/providers/standalone.php:14` | `T2Esanfilter()` |

순서 근거: `integration/sanitize/registry.php:55-57` `uasort` priority 내림차순. 부트 시 드롭인 자동 적재: `integration/sanitize/bootstrap.php:6-20` (심볼릭 링크 디렉터리 이탈 차단 `:16`).

---

## 3. 호스트 보안 다리 (CMS capability)

### 3.1 `T2Ehostsecuritysnapshot()`

`config/t2_cms_security.php:137-150`
- 시그니처: `(): array`
- 반환: `{host: string, label: string, capabilities: array<string,bool>}`
- 검사 대상 9 capability: `sanitize_html, csrf_token, csrf_verify, request_origin_ok, safe_filename, upload_content_safe, iframe_domains, ip_decide, wordfilter_terms` (`:142`)

**실측 (standalone, PHP 8.4.23)**:
```
host=standalone  label=독립환경
  sanitize_html        false      csrf_token           false
  csrf_verify          false      request_origin_ok    false
  safe_filename        false      upload_content_safe  false
  iframe_domains       false      ip_decide            false
  wordfilter_terms     false
```

**3형 판정 함수** (`config/t2_cms_security.php`):

| 값 | 함수 | 의미 |
|---|---|---|
| **허용(true)** | `T2Ehostcsrfverify(): ?bool` `:85-91` | `is_bool($ok) ? $ok : null` |
| **거부(false)** | 동일 | 동일 |
| **모름(null)** | 동일 | 어댑터 없음 / capability 미선언 / 호출부 `null` |

파사드 6종: `T2Ehostcsrftoken` `:76-81`, `T2Ehostcsrfverify` `:85-91`, `T2Ehostoriginok` `:95-100`, `T2Ehostsafefilename` `:114-119`, `T2Ehostuploadcontentsafe` `:128-133`.

**실측 (standalone)**:
```
T2Ehostcsrfverify('')        → NULL
T2Ehostoriginok()           → NULL
T2Ehostuploadcontentsafe(...)→ NULL
T2Ehostsafefilename('../a b.php') → '../a b.php'   ← 무변경 통과 (:117 폴백)
```

### 3.2 어댑터 3자 capability 실측표

**선언 위치**: `integration/cms/adapters/gnuboard5.php:566-575`, `rhymix.php:810-820`, `standalone.php:5-13` (**standalone 은 보안 capability를 하나도 선언하지 않는다**).

| capability | standalone | gnuboard5 | rhymix |
|---|---|---|---|
| `sanitize_html` | ✗ (선언 없음) | ✓ `t2editor_g5_sanitize_html` `:570` → `clean_xss_tags($html,1,0,0,0)` `:417` | ✓ `t2editor_rx_sanitize_html` `:814` → `HTMLFilter::clean($h,true,true,false)` `:690` |
| `csrf_token` | ✗ | ✓ `get_token()` `:431` | ✓ `Session::createToken()` `:725` |
| `csrf_verify` | ✗ | ✓ **이중 판정** `:446-462` — `time.hmac`(HMAC-SHA256, `_get_token_secret()`+`_get_token_key()`) 우선 `:455-456`, 없으면 세션 `ss_token` 비교 `:458-460` | ✓ `Session::verifyToken($t,'',true)` `:739` |
| `request_origin_ok` | ✗ | ✓ `t2editor_g5_origin_ok` `:475-502` — **`G5_DISABLE_ORIGIN_CHECK` opt-out `:478`**, GET/HEAD/OPTIONS 허용 `:480`, `Origin`→`Referer` 폴백 `:484`, `null` 거부 `:485` | ✓ `Security::checkCSRF()` `:759`, GET 계열 조기 허용 `:758` |
| `safe_filename` | ✗ | ✓ `get_safe_filename()` `:508` | ✓ (`:763` 이후) |
| `upload_content_safe` | ✗ | ✓ (`:575`) | ✓ `FileContentFilter::check()` `:789` |
| `iframe_domains` | ✗ | **✗ 미선언** | ✓ `MediaFilter::getIframeWhitelist()` `:708` |
| `ip_decide` | ✗ | ✓ `t2editor_g5_ip_decide` `:566` | ✓ `t2editor_rx_ip_decide` `:810` |
| `wordfilter_terms` | ✗ | ✓ `t2editor_g5_wordfilter_terms` `:567` | ✓ `t2editor_rx_wordfilter_terms` `:811` |

**CMS 미탐지 = 미탐지**: `config/t2_cms_security.php:38` — `standalone` 이면 `T2Ehostsecuritycontext()` 가 `null` (§9 위험).

### 3.3 standalone 에서 "모름"이 왜 거부도 허용도 아닌가

**코드 근거 3줄**:
- `config/t2_cms_security.php:11-18` 주석:
  > *"호스트가 없는 설치(스탠드얼론)에서는 모든 답이 모름이다. 그것을 거부로 읽으면 스탠드얼론에서 파일을 하나도 올릴 수 없게 되고, 허용으로 읽으면 CMS 위에서 호스트 필터가 죽었을 때 그 사실이 조용히 통과가 된다."*
- 각 파사드가 `null` 을 **그대로 올려보내고** 결정을 하지 않는다 (`:90`, `:99`, `:132`).
- **판정을 내리는 것은 호출자**다. 사용 계약이 주석에 명시:
  - 업로드: `T2Ehostuploadcontentsafe()` 주석 `:125-127` — *"**업로드 경로는 이것을 통과로 읽지 말고 자기 검사만으로 판단한다**"*
  - 본문: `config/t2_cms_security.php:18` — "본문 필터는 편집기의 자체 필터로 메운다"
  - CSRF: `:18` — "편집기의 자체 동일 출처 검사(`T2Esameorigin`)가 이미 서 있다"

**⇒ `null` 은 세 값 중 어느 것도 아니고, **판정 책임의 이전**이다. 파사드는 사실을 보고만 하고 정책은 두지 않는다.** (확신 95%)

---

## 4. 인증 · 인가

### 4.1 관리자 인증 흐름

```
[요청] → config/t2_cms_auth.php:t2editor_admin_auth_bootstrap()  (:124)
          ├─ T2Eadminaccessallowed() 실패 → 403 + JSON/HTML (:126-139)
          ├─ CMS 부트스트랩 (:149) — forceLocal 아니고 runtime/admin 요청일 때만
          ├─ CMS 세션 실패 → **자체 경 hardened PHP 세션** 폴백 (:157-166)
          │     use_strict_mode=1, httponly=1, samesite=Lax, secure=스킴 판정
[판정] → t2editor_admin_cms_is_authorized() (:184-…)
          ├─ 로컬 강제 요청이면 false (:186)
          ├─ CMS 어댑터 없으면 false (:190)
          ├─ adapter.authorize() (:192)
          └─ 권한층 있으면 T2Epermallowed('admin.access') (:198)
[설치] → admin/api.core.php:?action=setup (POST) (:1249-1286)
          ├─ 자체 자격증명 요구 판정 (:1250-1252)
          ├─ 키 파일 활성 확인 t2a_key_active() (:1255, 정의 :144)
          ├─ setup_secret hash_equals (:1259) + 실패 시 usleep 지수백오프 (:1261-1263)
          ├─ password_hash(PASSWORD_DEFAULT) (:1269)
          └─ T2ADMIN_AUTH_FILE 로 private 저장 (:1272) + session_regenerate_id(true) (:1278)
```

> ⚠ **초고 정정 1건**: `admin_auth.php` 라는 파일은 **v11 에 존재하지 않는다**(전 패키지 `find` 결과 0). 관리자 인증 상태는 `admin/api.core.php:44` `T2ADMIN_AUTH_FILE` 상수가 가리키는 **private store** 파일에 저장된다(`admin/api.core.php:1272` `t2_private_store_write`). `admin_auth.php` 는 2026-09-26 감사 메모(v10 컨텍스트)에서 넘어온 이름이며 v11 에서 실재하지 않는다.

- **`t2editor_admin_endpoint_request()`** `:31-36` — `SCRIPT_NAME` 에 `/admin/` 포함 여부
- **`t2editor_admin_local_request_requested()`** `:39-53` — `?auth=local` / `?auth_mode=local` / `first_run_api.php?mode=local`
- **함수 스코프 포함 방화벽** `t2editor_in_function_scope()` `:21-26` — `config/extend.php` 의 함수 안 include로 그누보드 전역이 지역변수가 되는 사고 차단 (주석 `:12-19`)
- **설치 비밀** `admin/t2admin.key.php:5` — `return array('secret' => '');` (12자+ 규칙 주석 `:3`). 상수 정의 `admin/api.core.php:44`. **v11 배포본에서 비어 있음** = 최초 설정 필요. 갱신 시 키 파일은 제외 대상 `admin/update_api.core.php:299`
- **관리자 로그인 레이트리밋** `admin/api.core.php:97-119` — 창 600초, 최대 5회, 차단 900초 (`:97`), 429 + `Retry-After` (`:119`). 키는 `sha256(action|ip)` (`:52`)
- **로그인 실패 401** `admin/api.core.php:1303` · **인증 필요 401** `admin/api.core.php:1319`
- **설정 시 세션 고정 방어** `admin/api.core.php:1278` `session_regenerate_id(true)` + `session_generation` 무작위 32바이트(`:1270,1271`)

### 4.2 ⚠ `t2editor_admin_requires_local_credentials()` — **standalone에서만 true 인가?**

**코드**: `config/t2_cms_auth.php:176-181`
```php
function t2editor_admin_requires_local_credentials()
{
    $context = t2editor_admin_auth_context();
    return ($context['id'] ?? 'standalone') === 'standalone'
        || t2editor_admin_auth_adapter($context['id'] ?? '') === null;
}
```

**정밀 판정 — 주장의 "standalone에서만" 은 부정확하다:**

| 조건 | 반환 |
|---|---|
| `id === 'standalone'` | `true` |
| **`id !== 'standalone'` 이지만 `auth_authorize` capability가 없는 CMS** | **`true`** |
| `id !== 'standalone'` 이고 어댑터 있음 | `false` |

즉 실제 조건은 "**자체 자격증명을 요구한다**" 이고, standalone 은 그 조건의 한 경우일 뿐이다. `t2editor_admin_auth_adapter()` `:81-92` 는 `$adapter['auth_authorize']` 가 callable 아니면 `null` 을 준다. **CMS 어댑터가 인증 capability를 내줄 수 없는 환경(예: 그누보드5 런타임 미활성)에서 same CMS 안에서도 `true` 가 된다.** (확신 90%)

> 이 함수의 실사용 지점은 `config/first_run_api.core.php:68,71` — 자체 자격증명이 필요한 설치에서 key/password 미설정을 409로 막는다.

### 4.3 최초 실행 게이트 (4단계 / 3단계)

**서버**: `config/first_run_api.core.php` (88줄 전체 확인)
- 내부 심볼 가드 `:5` · Lite 프로필이면 **엔드포인트 자체 404** `:17-20` (주석 `:14-16`: "아무도 쓰지 않는 설치용 진입점을 열어 두는 것은 그 자체로 공격 표면")
- 토큰 검증 `:36-39` → 실패 시 403 `'설치 안내 인증 정보가 없거나 만료되었습니다.'`
- 출처 `:50-52` → 403 `'요청 출처 확인에 실패했습니다.'`
- 확인 체크박스 강제 `:63-65` → 409 `'안내를 끝까지 읽고 확인 체크박스를 선택하세요.'`

**차단 사유 한국어 문장 (전수)**:

| 위치 | 문장 |
|---|---|
| `config/first_run_api.core.php:69` | `먼저 admin/t2admin.key.php의 secret 값을 12자 이상으로 설정하세요.` |
| `config/first_run_api.core.php:72` | `관리자 페이지에서 관리자 비밀번호를 먼저 설정하세요.` |
| `config/first_run_api.core.php:75` | `공용 데이터 디렉터리에 PHP 실행 계정의 쓰기 권한을 부여하세요.` |
| `config/first_run_api.core.php:79` | `T2Editor 데이터 디렉터리를 준비하거나 쓰기 권한을 확인하세요.` |
| `config/first_run_api.core.php:82` | `t2editor_db/에 최초 설치 확인 상태를 저장하지 못했습니다.` |

**UI**: `extend/admin/js/t2_first_run_guide.js` (884줄). 단계 분기는 `config/first_run_api.core.php:30` `$forceLocalSetup` (`?mode=local`) + 어댑터 존재 여부. UI 상태 키 `:352` (`check_php / check_data / check_db_write`), 게이트 `:362-364`. 4단계·3단계 문자열은 서버 `t2_first_run_status_payload()` 안에서 분기하며 **그 정의는 `extend/common/php/t2_first_run_setup.php`(317줄) / `t2_first_run_setup_full.inc`(305줄) 안** — 이번 검증에서 단계별 라벨 원문은 미확인(§미확인).

### 4.4 🚨 **⚠ 권한 계약 모순 — 최종 판정 (이 문서의 핵심 발견)**

브리프 전제("`extend/js/t2_first_run_guide.js` 의 707")는 **v11 경로 오류**였으나, **모순 자체는 실재하며 3자 불일치**다:

| # | 출처 | 값 | `file:line` | 성격 |
|---|---|---|---|---|
| **A** | 설치 가이드 | **775** | **`guide.txt:63`** `chmod -R 775 /var/www/html/t2editor/data` | 운영자 지시 |
| **B** | 최초설치 안내 UI | **707** | **`extend/admin/js/t2_first_run_guide.js:47`** "T2Editor의 최소 권장 권한은 **707**이며, 777은 필요하지 않습니다."<br>`:51` "…먼저 **707**로 설정하세요. 777은 사용하지 마세요."<br>`:81` `'permission_minimum': '최소 권장 707'`<br>`:82` "…실패할 때는 **707**부터 적용하면 충분합니다."<br>`:482` `(status.permissions.data_mode) + ' / 707'` | 사용자 화면 (5곳) |
| **C** | **실제 코드** | **0755 / 0644 / 0700** | `config/t2_storage.php:225` `t2editor_storage_mkdir($root, 0755)`<br>`config/t2_storage.php:298` `$dataPath` mkdir **0755**<br>`config/t2_storage.php:302` private mkdir **0700**<br>`config/t2_storage.php:231-232` `chmod($htaccess/$index, 0644)`<br>`config/t2_cms_data.php:29,47` `'dir_permission'=>0755,'file_permission'=>0644`<br>`integration/cms/adapters/standalone.php:11` `0755/0644`<br>`integration/cms/adapters/gnuboard5.php:555` `G5_DIR_PERMISSION ?: 0755`<br>`integration/cms/adapters/rhymix.php:804` `0755/0644`<br>`config/t2_asset_delivery.php:128` `T2EDITOR_DIR_PERMISSION ?: 0755`<br>`config/t2_i18n_loader.php:628` `chmod($publicPath, 0755)` | 11곳 |

**추적 결론 — "실제 코드가 무엇을 강제/권장하는가"**:

1. **코드는 `chmod()` 로 데이터 디렉터리를 775/707로 만드는 곳이 어디에도 없다.** 검색 결과 0755/0644/0700만 존재.
2. **코드가 만드는 값은 0755** (`config/t2_storage.php:225,298`). 즉 `owner=rwx, group=r-x, other=r-x`.
3. **가이드(A)의 `775` 는 코드가 만들지 않는 모드를 만든다.** 이건 막연한 위험이 아니라 **모순**이다 — 운영자가 775를 주면 코드(0755 기대)와 어긋나 "쓰기 시험 실패"가 날 수 있고(반대로 775면 실제로는 쓰기가 된다), 진단 화면이 0755를 보고하면 운영자는 자기 설정을 의심하게 된다.
4. **UI(B)의 `707` 은 코드와 다른 두 번째 모드다.** 게다가 `707 = rwx---rwx` 은 **그룹이 읽지도 못한다.** 같은 그룹의 다른 사용자(파일 편집기, 배포 스크립트, CI)가 `ls`조차 못 한다. 코드가 `0755` 를 만드는 것과 정반대 방향이다.
5. **결론: 코드가 강제하는 것은 `0755` 뿐이고, "권장"은 문서 2곳이 서로 다르게 말한다.** `T2EDITOR_DIR_PERMISSION` 상수(`config/t2_asset_delivery.php:128`)는 유일한 런타임 오버라이드 지점이며, 그누보드5만 `G5_DIR_PERMISSION` 을 쓴다(`gnuboard5.php:555`).

> **후배 에이전트용 한 줄**: *"T2Editor 데이터 디렉터리 권한을 말할 때 `guide.txt`(775)·최초설치 UI(707)·실제 코드(0755) 세 값이 모두 다르다. 셋 중 어느 것도 정본이라 할 수 없고, **코드가 실제로 만드는 값은 0755** 이다."* (확신 95% — 11곳 `file:line` 전수 확인)

### 4.5 권한 시스템

- **`config/t2_permissions.php`** (628줄) — 등급 모델
  - `T2Epermroles()` `:43-54` / `T2Epermrolerank()` `:65-70` / `T2Epermnormalizeroles()` `:74-86`
  - `T2Epermcorefeatures()` `:125-141` / `T2Epermdiscoveredfeatures()` `:163-190` (플러그인에서 자동 수집)
  - `T2Epermsubject()` `:351-388` — 현재 주체 결정
  - `T2Epermdecide($featureId)` `:432-…` — 최종 판정
- **기본값** `T2Epermdefaults()` `:219-241`:
  - `'enabled' => false` **`:223`** (주석 `:222` "끄면 판정을 하지 않는다 — 갱신 직후의 기본 상태다")
  - `'visibility' => 'hide'` `:225` · `'guest_role' => 'guest'` `:233`
  - `'host_decides' => true` `:236` · `'host_ip_rules' => true` `:238`
- **CMS 등급 매핑**
  - **그누보드5**: `integration/cms/adapters/gnuboard5.php:248` 주석 — *"그누보드의 등급 체계는 mb_level 1~10 과 is_admin('super'|'group'|'board') 이다"* / 실제 클램프 `:271` `max(1, min(10, (int)($member['mb_level'] ?? 1)))`
  - **라이믹스**: `integration/cms/adapters/rhymix.php:449` 주석 — *"그룹 번호를 등급으로 읽으면 안 된다 — 여기서는 `group:5` 처럼 키로만 내놓고…"* / 실제 `:489-493` `$groups[] = 'group:' . $srl;` + 관리자면 `'admin'` 추가 `:493`. 그룹 목록은 `get_session()['group_list']` 에서만 읽어 회원 모듈을 호출하지 않음(`:487-489` 주석)
- **제공자**: `integration/permission/providers/{host-bridge,standalone}.php`, 레지스트리 `integration/permission/registry.php`, 부트 `integration/permission/bootstrap.php`
- **IP 규칙** `config/t2_ip_access.php` — 차단 상태 파일 `T2Eipblockfile()` `:5-7` (`T2EDITOR_PRIVATE_PATH` 하위 `ip_access_blocks.php`), 잠금 `T2Eipaccesswithlock()` `:11-27`, 지속시간 `T2Eipblockdurations()` `:28-49`, 만료 `T2Eipblockexpiresat()` `:57-70`, 조회 `T2Eipblockrecords()` `:142-163`, 추가 `:165-186`, 수정 `:188-214`, 삭제 `:216-…`
- **클라이언트 IP** `config/t2_security.php:238-258` `T2Eclientip()` — **`X-Forwarded-For` 는 신뢰 프록시가 있을 때만** `:241`. 신뢰 판정 `T2Etrustedproxyrequest()` `:127-135`:
  - `:129` `T2EDITOR_TRUST_PROXY_HEADERS` 상수가 **`true` 로 정의되어야** 하고
  - `:133` `trusted_proxy_ips` 목록이 **비어 있지 않아야** 한다
  - **실측**: 패키지 전체에서 `T2EDITOR_TRUST_PROXY_HEADERS` **정의 0회**(읽기 1회 = `config/t2_security.php:129`), `trusted_proxy_ips` 기본값 **빈 배열**(`config/t2_hard_config.php:43`).
  - ⇒ **기본 설정에서 XFF는 신뢰되지 않는다 = 관리자 레이트리밋 IP 스푸핑이 막혀 있다.** (2026-09-26 감사가 확인한 "막혀있음" 상태 v11에서도 **유지**)

---

## 5. CSRF · 요청 출처

### 5.1 CSRF 토큰 발급 · 검증

| 층 | 위치 | 위임 대상 |
|---|---|---|
| 파사드 | `config/t2_cms_security.php:76-81` `T2Ehostcsrftoken()` | 비어 있으면 `''` (주석 `:75` "편집기가 자기 토큰을 쓴다") |
| 파사드 | `config/t2_cms_security.php:85-91` `T2Ehostcsrfverify()` | 빈 토큰 → `null`; `is_bool` 아니면 `null` |
| 그누보드5 | `integration/cms/adapters/gnuboard5.php:428-434` 발급 (`get_token()`) / **`:446-462` 검증** | `time.hmac` HMAC-SHA256 (`:455-456`, 만료 `$expire=7200` `:446,454`) 우선, 없으면 세션 `ss_token` (`:458-460`) |
| 라이믹스 | `integration/cms/adapters/rhymix.php:721-728` 발급 (`Session::createToken()`) / **`:734-741` 검증** | `Session::verifyToken($t,'',true)` `:739` |

### 5.2 동일 출처 검사

- **편집기 자체** `T2Esameorigin($origin=null, bool $requireEvidence=false)` — `config/t2_security.php:198-220`
  - `Origin` 없으면 `Referer` 폴백 `:202`; 둘 다 없으면 `$requireEvidence=true` 일 때 **`false`** `:203`
  - **userinfo 포함 Origin 거부** `:211` (주석 `:209-210`: "`user@host` 형태가 자기 출처로 통과한다")
  - 호스트 `hash_equals` + **스킴 일치** + **포트 일치** `:217-218`
- `T2Eallowedorigin($origin, $additionalDomains=[])` `:223-235` — `T2Esameorigin` 우선 `:225`, 그 외 http(s) + 명시 도메인
- `T2Enormalizehost()` `:59-71` — 소문자 `:61`, 대괄호 IPv6 `:63-66`, **후행 도트 제거 `:69`** (주석 `:67-68`: #336 — "여기서 안 떼면 자기 출처가 서로 어긋나 정상 요청이 막힌다"), 포트 제거 `:70`
- **실측** (`HTTP_HOST=example.com`, `HTTPS=''`):
  ```
  sameorigin('https://example.com')       = false  (스킴 불일치 — 올바름)
  sameorigin('https://example.com.')      = false  (스킴 불일치가 먼저)
  sameorigin('https://user@example.com')  = false  (userinfo 거부 ✅)
  sameorigin('http://example.com')        = true   ✅
  sameorigin('null')                      = false  ✅
  sameorigin('')                          = false  (requireEvidence=true) ✅
  ```
  > **#336(userinfo 통과)은 v11에서 수정됨** — `:211` 과 `:228` 두 곳에 동일 규칙이 있다.

### 5.3 `G5_DISABLE_ORIGIN_CHECK` opt-out

**위치: `integration/cms/adapters/gnuboard5.php:478`** (단 1곳)
```php
if (defined('G5_DISABLE_ORIGIN_CHECK') && G5_DISABLE_ORIGIN_CHECK) return true;
```
- 리버스 프록시가 `Origin`·`Referer` 를 지우는 그누보드5 배포를 위한 탈출구
- **주의**: 반환이 `true` = **무조건 통과**. opt-out 이면 그누보드 출처 검사가 **완전히 사라진다** (`guide.txt:168-174`(3.5)는 "편집기 자신의 동일 출처 검사만 남는다" 고 서술하지만, 그누보드 어댑터 경로에서는 CMS 판정이 `true` 로 돌아가므로 **편집기의 `T2Esameorigin` 이 그 자리를 대신하지 않는다** — 확인 필요, §미확인)

### 5.4 `targetOrigin:'*'` 규칙 — 두 가지 요구사항

**규칙 파일: `tools/t2-static-check.mjs`** (저장소 루트, 배포본 밖)

| 줄 | 내용 |
|---|---|
| `:103` | 규칙 선언 — *"targetOrigin '*' 발신과, origin/source 검사 없는 message 수신을 잡는다"* |
| `:106` | *"`targetOrigin` 에 쓸 수 있는 값이 '*' 밖에 없다. 이 경우의 올바른 경계는 …"* |
| `:120` | 예외 — Worker/sandbox 스코프의 `postMessage(payload)` 는 targetOrigin 인자가 없으므로 … |
| `:124` | **선언 방법: 파일에 `@t2-postmessage-opaque-origin` 주석을 남기고 …** |
| `:126` | `const opaqueSandbox = /@t2-postmessage-opaque-origin/.test(src);` |
| `:138` | 실패 — `` fail('postmessage-target', `${rel(f)} :: targetOrigin 이 '*' 입니다.`) `` |

**요구되는 두 가지 (`:124-126` 문맥)**:
1. **사유 주석** — 파일에 `@t2-postmessage-opaque-origin` 주석을 남긴다 (사유 명시)
2. **`event.source` 동일성 검사** — 동일 주석을 남기고 **실제로 `event.source === …` 비교가 코드에 존재**해야 한다

관련 규약: `AGENTS.md` "코드 관행" 절 — *"`targetOrigin:'*'`는 파일에 `@t2-postmessage-opaque-origin` 사유 + `event.source === …` 동일성 검사가 둘 다 있어야 통과"* (저장소 루트 `AGENTS.md`).

---

## 6. 업로드 공격면

### 6.1 파일 구성

| 파일 | 역할 |
|---|---|
| `config/upload.core.php` / `config/upload.php` | 엔드포인트 진입 |
| `config/upload_config.php` | **정책 정본** (확장자·MIME·서명) |
| `config/t2_upload.php` (806줄) | 업로드 파이프라인 |
| `config/t2_upload_ticket.php` (491줄) | **presigned 티켓** |
| `config/t2_upload_chunks.php` | 청크(대용량) 업로드 |
| `config/t2_upload_adaptive.php` | 적응형 프로파일 |

### 6.2 확장자 · MIME · 서명 검사

**확장자 허용 목록** `t2editor_default_upload_extensions()` — `config/upload_config.php:90-108`
| 묶음 | 확장자 | `file:line` |
|---|---|---|
| document | `pdf txt doc docx xls xlsx ppt pptx hwp odt ods odp rtf` | `:92-95` |
| image | `jpg jpeg png gif webp bmp` | `:96-98` |
| video | `mp4 webm ogg mov avi mkv wmv flv m4v` | `:99-101` |
| other | `zip rar 7z tar gz bz2 mp3 m4a wav flac aac wma json xml csv` | `:102-106` |

> **SVG 는 의도적으로 제외** — `config/upload_config.php:88` 주석: *"SVG is excluded for active content/XSS; ICO is excluded because MIME/GD handling is inconsistent across servers."* **ICO 도 제외.** 이 판단은 `config/t2_sanitize.php:358`("svg+xml 은 그림이 아니라 문서다")·`:263`(svg 제거목록)과 **일관**하다.

**MIME**: `get_ext_mime_map()` `config/upload_config.php:118-…` — 주석 `:117` *"MIME maps drive browser accept/response metadata **only**; server validation uses signatures **without Fileinfo**"*

**서명 검사 체인** (`config/upload_config.php`):
1. `t2editor_image_signature_mime(string $bytes)` `:193-…` — 시그니처 판정 (finfo 불필요, `:34`)
2. `t2editor_validate_image_info(array $info, string $signature_mime)` `:211-227` — **서명 MIME == getimagesizefromstring TYPE MIME** 교차검증 `:217`, 폭·높이 ≥1
3. `t2editor_inspect_image_string()` `:229-…` / `t2editor_inspect_image_file()` `:242-…`
4. `validate_upload_file()` `:487-…` — 주석 `:486`: *"filename/size/category are legacy checks; supplying `$tmp_path` adds **signature and image-structure validation**"* / MIME 불일치 `:529`

> **ext-fileinfo 는 v11 코드에서 불필요하다.** `config/upload_config.php:31-34, 117` 이 명시. (v10 위키의 "php.ini에서 extension=fileinfo 활성화" 지시는 v11 근거 없음.)

### 6.3 🚨 presigned 티켓 흐름

| 단계 | 위치 | 내용 |
|---|---|---|
| 정책 | `T2Euploadpolicy()` `:25-…` | `'ticket_ttl'=>max(45, min(900, T2EDITOR_UPLOAD_TICKET_TTL))` **`:33`**, `'bootstrap_ttl'=>21600` **`:34`** |
| 매니페스트 | `T2Euploadmanifest()` `:90-…` / 해시 `T2Euploadmanifesthash()` `:109-…` | `{name,size,mime}` 정규화 |
| 매니페스트 검증 | `T2Evalidateuploadmanifest()` `:255-…` | 프로파일별 용량·개수 |
| **발급** | `T2Eissueuploadticket()` `:274-309` | `exp = now + ticket_ttl` **`:278`**, claim에 `manifest_hash` **`:287`**, 상태 파일에 `state=>'issued'` **`:296-300`**, 반환 `{ticket, expiresAt, policyVersion}` **`:309`** |
| bootstrap 발급 | `T2Euploadbootstrap($documentId)` `:197-…` | `exp = now + 21600` **`:204`** |
| bootstrap 검증 | `T2Everifyuploadbootstrap()` `:212-…` | |
| **소비** | `T2Everifyuploadticket()` `:379-…` | 아래 5중 바인딩 |
| 확정/반납 | `T2Ecommituploadticket()` `:479-481` / `T2Ereleaseuploadticket()` `:483-485` | → `T2Efinalizeuploadticket($auth, bool)` |

**5중 바인딩 (실측 코드)** `config/t2_upload_ticket.php:389-394`:
```php
hash_equals(T2Euploadcleanid($documentId), $claims['document'])
&& hash_equals($profile,                        $claims['profile'])
&& hash_equals($manifestHash,                    $claims['manifest'])
&& count($manifest) ===                          $claims['count']
&& $bytes       ===                              $claims['bytes']
```
+ 정책 해시 staleness `:396-398` (409 `ticket_policy_stale`) + `ticket_id` 형식 `^[a-f0-9]{40}$` `:400` + 만료 `:407` (`ticket_expired`)

> **2026-09-26 감사 #321 "티켓 비바인딩" 은 v11에서 수정되었다.** 매니페스트 해시·개수·바이트수가 모두 claim에 서명되어 있다.
> 잔여: 만료 정리 `:183-186` 는 `expires < now - 600` 일 때만 제거(600초 유예).

### 6.4 🚨 `data:` URI 이미지 상한 (커밋 `6a50052` 후속 상태)

- **저장 필터 측**: `config/t2_sanitize.php:359` — `data:image/(png|jpeg|jpg|gif|webp|bmp|avif|x-icon)` + `;\s*base64\s*,[a-z0-9+/=\s]+` **형식 강제만 있고 길이 상한은 없다.**
- **AI 이미지 생성 측**: `config/t2_ai_image.php:23` `'max_images_per_request' => 4` (정규화 `:97` `max(1,min(10,…))`), 프롬프트 상한 `:183` `strlen($prompt) > 4000` → 예외. 크기 `:189-190` `max(64,min(2048,…))`.
- **엔드포인트 입력 상한**: `config/ai_image.core.php:11` `T2Ereadjson(1048576)` = 1MB.
- **제공자 base64 조립**: `config/ai/image_providers/{openai,google,stability}.php` — `data:image/png;base64,` 접두 (`openai.php:26`, `google.php:17`, `stability.php:23`), `custom.php:37` 정규화. `config/t2_ai_image.php:203` 은 `data:image/` 또는 `https?://` 만 통과.
- **판정**: 브리프가 지목한 **"이미지 data URL 모델 상한"** 은 `config/t2_ai_image.php:189-190` 의 **픽셀 차원 상한(64~2048)** 으로 실재한다. **base64 문자열 바이트 수 상한은 v11 코드에서 확인 못 했다** (§미확인). `config/t2_sanitize.php:342` `url_length` 4096 상한이 URL 속성 전체에 걸리지만(`T2Esanlimits()['url_length']` `:57`), 이것은 `T2Esanurlsafe` 가 **content와 무관하게 모든 URL 속성에 적용**되므로 data URL 본문도 4096자로 잘린다. → **실질 상한 존재 (4096자)**, 단 이는 의도된 "모델 상한"이 아니라 URL 일반 한계다. (확신 70%)

### 6.5 NSFW 필터 — 브라우저 모드 확정

- **기능 플래그 기본 off**: `core/editor.core.php:108` `define('T2_NSFW_ENABLED', false)`
- **모드 기본 `'browser'`**: `core/editor.core.php:112` `define('T2_NSFW_MODE', 'browser')`
- **관리자가 서버 모드로 바꿀 수 있음**: `extend/common/php/t2admin_settings_loader.php:205-207`, 관리 화면 `admin/sections/nsfw.php:24` (`T2_NSFW_MODE` 라벨)
- **🚨 서버 모드 대상 파일이 존재하지 않는다**: `core/editor.core.php:1367` 이 `window.T2EDITOR_NSFW_SERVER_URL = ".../config/nsfw_api_server.php"` 를 주는데, **`config/nsfw_api_server.php` 는 파일이 없다**(확인: `ls` 실패). ⇒ `'server'` 모드로 설정하면 클라이언트는 **404 URL을 호출**한다(`js/engine/nsfw.js:296`).
- **브리프 검증 결과**: *"v9.1.0에서 서버 모드가 중단되었다"* 는 **현재 코드에서 재현된다** — 서버 모드 구현 파일 부재 + 기본값 browser + 관리 화면에 **遗留 선택지**(`admin/sections/nsfw.php:24`)가 남은 형태로 나타난다. 다만 v9.1.0 릴리즈 노트가 이 저장소에 **없어** 버전 귀속은 **미확인**(확신 75% — 코드 상태는 확실, 버전 귀속은 미확인).
- **모델 번들 실재**: `vendor/nsfwjs/models/mobilenet_v2_mid/` 존재. 서버 계산은 sandbox worker 에서: `endpoints/plugin-sandbox-worker.core.php:123` `trustedLibraries` 조건 — `image` 플러그인 + `external` 아님 + `image.nsfw` capability = `worker` + `T2_NSFW_ENABLED` + `T2_NSFW_MODE==='browser'` 전부 만족. **서버 모드이면 `trustedLibraries=false`** ⇒ 번들 모델은 모듈 못 읽음.
- **Fallback 엔드포인트**: `config/nsfw_api_browser.core.php` (44줄) — 내부 심볼 가드 `:13-16`, 심볼릭 링크 거부 `:19`, ETag `:28`, 304 `:36-40`. 주석 `:6-10`: CMS rewrite 가 ES module URL을 404/HTML 로 돌려줄 때만 쓰인다.

### 6.6 번들 서드파티 라이브러리 — **실측 버전**

**`vendor/VERSIONS.json`** (기재일 `2026-08-11`) 실존 확인.

| 라이브러리 | VERSIONS.json 기재 | **파일 내 실측 근거** | sha256 (앞 16자) |
|---|---|---|---|
| **pdf.js** | `3.11.174`, 판정 `retained-compatible`, `latest_audited: 6.1.200` | `vendor/pdfjs/pdf.min.js` `apiVersion:"3.11.174"` (grep 실측) | `bf4134578665cf3b` |
| **hls.js** | `1.6.16` | 버전 문자열 미발견 (§미확인) | — |
| **jszip** | `3.10.1` | `vendor/jszip/jszip.min.js` `version="3.10.1"` (grep 실측) | — |
| **p2p-media-loader** | `3.0.1` | 버전 문자열 미발견 (§미확인) | — |
| **tensorflow.js** | `4.22.0` | `vendor/tfjs/tf.min.js` `tfjs:"4.22.0"` (grep 실측) | — |
| **nsfwjs** | `legacy UMD bundle`, `latest_audited: 4.3.0` | `vendor/nsfwjs/nsfwjs.min.js` `version="n/a"` (grep 실측) | — |
| **peerjs** | `1.5.4` (self-hosted) | 버전 문자열 미발견 (§미확인) | `ad5d8870d1e38991` |
| **jsqr** | `1.4.0` (self-hosted) | 버전 문자열 미발견 (§미확인) | `32214c74ee92d37d` |
| tfjs-backend-webgl / -wasm / -webgpu | (기재 없음) | 버전 문자열 미발견 (§미확인) | — |
| formatjs | (기재 없음) | `vendor/formatjs/t2i18n-polyfill.js` 16,651B 자체 빌드 | — |

> `VERSIONS.json` 은 peerjs·jsqr 에 대해 **sha384 다이제스트를 인용**하고 그것이 vendored 바이트와 같다고 기술한다. (로컬 sha256만 계산했고 sha384 검증은 하지 않았다 — §미확인)

### 6.7 🚨 **pdf.js CVE-2024-4367 — v11 패치 여부: 바이트 수준 실측**

**결론: ❌ 패치되지 않았다. v10과 동일 상태.** (확신 99%)

**(1) 라이브러리가 옵션을 지원하는가 — YES**

`vendor/pdfjs/pdf.min.js` 에 `isEvalSupported` **11회** 등장 (grep `-o -b` 실측, 바이트 오프셋):

| 오프셋 | 문자열 | 해석 |
|---|---|---|
| 11359 | `isEvalSupported(){return shadow(this` | FeatureTest 게터 |
| 11397 | `isEvalSupported"` | 키 이름 |
| 11423 | `isEvalSupported(){try{new Function("")` | **실제 eval 지원 검사** |
| 18660 | `isEvalSupported` | |
| 20091 / 20266 | `isEvalSupported:v` | 기본값 주입 |
| 45079 | `isEvalSupported:n.isEvalSupported` | 게터→DocumentInit 전달 |
| **110580** | **`isEvalSupported:e=!0`** | ⭐ **기본값 `true`** |
| 110736 | `isEvalSupported=!1!==e` | 정규화 |
| **111995** | `isEvalSupported&&s.FeatureTest.isEvalSupporte` | ⭐ **실제 사용 지점** |

`pdf.worker.min.js` 도 1회(라인 단위) 보유.

**(2) 호출부가 옵션을 넘기는가 — NO** ⭐

`plugin/file/pdf_view.core.php:226-232` 전문:
```php
const loadingTask = pdfjsLib.getDocument({
    url: '<?php echo htmlspecialchars($pdf_url, ENT_QUOTES, 'UTF-8'); ?>',
    withCredentials: false,
    maxImageSize: 16777216,
    disableAutoFetch: false,
    disableStream: false
});
```
**`isEvalSupported` 키 없음.** (grep `isEvalSupported` on this file → 0 hits)

**(3) 결론**
- `pdf.min.js:110580` 이 기본값을 `true`(`e=!0`) 로 두고, `:111995` 가 그것을 **실제로 소비**한다.
- 호출부가 넘기지 않으므로 **`isEvalSupported=true` 로 실행**된다.
- CVE-2024-4367(GHSA-wgrm-67xf-hhpq, introduced 0 → fixed 4.2.67, CVSS HIGH)의 전제 조건이 그대로 성립: **저권한 사용자가 올린 PDF 를 여는 관리자/사용자**의 도메인 컨텍스트에서 JavaScript 실행.
- 도달 경로: `config/upload_config.php:93` 에서 `pdf` 가 document 그룹에 **허용** → 파일 플러그인 기본 등록으로 `plugin/file/pdf_view.core.php` 진입.

**수정은 1줄** (`isEvalSupported: false` 추가) 또는 **라이브러리 버전 상승**(고정판 ≥ 4.2.67). `VERSIONS.json` 은 `latest_audited: "6.1.200"` 을 인지하면서도 `"decision": "retained-compatible"` 로 **의도적으로 유지**하고 그 이유(모듈 우선 릴리스라 classic `window.pdfjsLib` 빌드에 drop-in 아님)를 적어 두었다 — 즉 **知情の取舍**이며 사고다.

> 후배 에이전트용: **"v11로 올리면 pdf.js CVE가 해결된다" 는 서사는 성립하지 않는다.** v10·v11 양쪽 모두 `isEvalSupported` 미전달.

---

## 7. 금지어 · AI 예산 · 개인정보

### 7.1 금지어 (word filter)

- **정본**: `config/t2_word_filter.php` — `T2Ewfbootstrap()` `:27`, `T2Ewflimits()` `:42`, `T2Ewfdefaults()` `:61`, 정규화 `:89/:137/:155/:162`, 설정 `:184`, 공급자 켜짐 `:201`, 대장 `:213`, 카탈로그 `:241`
- **제공자 2종** (모듈 구조는 sanitize 와 동일 — `integration/wordfilter/{bootstrap,registry}.php` + `providers/`)
  - `editor` priority **900** — `integration/wordfilter/providers/standalone.php:11-13`
  - `host` priority **100** — `integration/wordfilter/providers/host-bridge.php:62-68`
  - (sanitize 와 **반대 순서** — 금지어는 편집기 규칙이 먼저, 호스트는 나중. 편집기의 규칙을 호스트가 되살리지 못하게 하려는 의도로 보이나 코드 주석 확인 필요 §미확인)
- **CMS 위임**: `integration/wordfilter/providers/host-bridge.php:9-10` 주석 — *"그누보드의 `cf_filter` 와 라이믹스의 `spamfilter_denied_word` 를 읽는 코드는 그 어댑터 파일 안에만 있다"*
  - 그누보드5: `integration/cms/adapters/gnuboard5.php:567` `wordfilter_terms` → `t2editor_g5_wordfilter_terms`
  - 라이믹스: `integration/cms/adapters/rhymix.php:811` → `t2editor_rx_wordfilter_terms`
  - **standalone 실측**: `T2Ehostsecuritysnapshot()['capabilities']['wordfilter_terms'] = false`
- **기본값은 꺼짐**: `config/t2_sanitize.php:65-70` 주석이 sanitize 와 반대 논리를 명시 — *"금지 단어의 기본이 꺼짐인 것은 그것이 그 사이트의 취향이기 때문이고, [sanitize] 이것의 기본이 켜짐인 것은 이것이 취향이 아니기 때문이다"*

### 7.2 AI 예산

`config/t2_ai_budget.php` (338줄)

| 기능 | `file:line` |
|---|---|
| 기간 정의 `T2Eaibudgetperiods()` | `:22-31` |
| 기본 정책 | `:33-35` |
| 정책 정규화 (총량 + 플러그인별) | `:37-81` |
| **총량 대비 플러그인 한도 산출** `T2Eaibudgetplugineffectivelimit()` | `:92-107` |
| 잔여량 계산 `T2Eaibudgetreserved()` | `:189-196` |
| **일일 한도 도달 시 차단** `T2Eaibudgetpluginblocked()` | `:249-252` |
| **예약** `T2Eaibudgetreserve($plugin,$tokens,$meta)` | `:254-278` |
| **정산** `T2Eaibudgetcommit($reservationId,$actualTokens)` | `:280-299` |
| **반납** `T2Eaibudgetrelease($reservationId)` | `:301-313` |
| 수동 리셋 | `:315-322` |
| 토큰 추정 `T2Eaibudgetestimatechars()` | `:324-327` / 실측값 `T2Eaibudgetactualtokens()` `:329-…` |
| 창(윈도우) 계산 `T2Eaibudgetwindow()` / 다음 경계 `T2Eaibudgetnext()` | `:124-150` / `:114-122` |
| 상태 파일 + 락 | `:109-112` / `T2Eaibudgetwithlock()` `:174-182` |
| 비율 계산 | `:83-90` |

> 설계: **예약(reserve) → 정산(commit) / 반납(release)** 2단계. 동시 요청이 한도를 넘지 못하게 한다. 예외 class `T2Eaibudgeterror` `:15-20` (`budgetStatus()` `:19`).

### 7.3 개인정보 동의 게이트

- **`config/t2_privacy.php`** (1015줄) — `T2Eprivacycatalog()` / `T2Eprivacysettings()` / `T2Eprivacyrecord()` 등
- **`config/privacy_consent.core.php`** (83줄) — 실제 엔드포인트
  | 순서 | `file:line` | 판정 |
  |---|---|---|
  | 1 | `:4` | 내부 런타임 심볼 없으면 404 |
  | 2 | `:23` | **POST만** (그 외 405) |
  | 3 | `:24` | **`T2Esameorigin(null, true)`** — 증거 요구 모드 |
  | 4 | `:26` | 본문 16,384바이트 상한 (413) |
  | 5 | `:27-28` | JSON 파싱 (400) |
  | 6 | `:31` | service id 형식 `/^[a-z0-9][a-z0-9_-]{0,63}$/` |
  | 7 | `:34` | 카탈로그에 없는 서비스 404 |
  | 8 | `:40` | `clientPolicyVersion` 일치 확인 |
- **프라이버시 원칙** `:3` 주석 — *"동의 영수증은 동일 출처·선언 서비스·정책·브라우저 설치에 결합하고 **원문 개인정보를 저장하지 않는다**"*
- **문서**: `docs/privacy-data-catalog.md`, `docs/privacy-module-policy.md` (둘 다 실존)
- **설계 메모** `:7-9` — AI 설정도 읽는 이유: *"에디터 화면과 이 엔드포인트가 같은 지문을 봐야 한다(어긋나면 무한 409)"*

---

## 8. 패키지 · 설치 무결성

### 8.1 `config/t2_package_security.php` (265줄) — 배포본 정적 스캔

| 기능 | `file:line` |
|---|---|
| 켜짐 판정 | `:5-11` |
| **규칙 목록** | `:13-44` |
| 위험도 high 규칙: `php-disable-tls` | **`:38`** — 패턴 `CURLOPT_SSL_VERIFYPEER\s*,\s*false` / `verify_peer'=>false` / `CURLOPT_SSL_VERIFYHOST\s*,\s*0`; 확장자 `php phtml php3 php4 php5 phar inc`; 제목 "TLS 인증서 검증 비활성화" |
| 문자열 마스킹 | `:46-51` `T2Epackage_security_mask_segment()` |
| PHP 소스 추출 | `:53-68` |
| 문맥（前後行） 캡처 | `:70-83` |
| 경로 상대화 | `:85-92` |
| 스킵 대상 | `:94-101` / 축소 텍스트 `:103-110` |
| **스캔 실행** | `:123-257` |
| 지문 (비활성) | `:133` `hash('sha256','disabled')` |
| 지문 (활성) | **`:253`** `hash('sha256', json_encode(['files'=>$fileDigests,'findings'=>$fingerprintRows]))` |
| 개별 파일 다이제스트 | `:159` `hash_file('sha256', …)` |
| **설치 차단** | `:259-…` `T2Epackage_security_assert_installable($report, $acknowledged)` |

**검증 대상 = 정적 패턴 스캔 + 파일 sha256 목록**, **서버 통신 없음** (curl/http client 호출 없음 — 파일 전체 grep 결과).

### 8.2 `config/t2_license.php` (90줄) — **순수 로컬 판정**

- **검사 대상**: `readme.txt` **앞 4줄만** (`config/t2_license.php:6-9`) — 경로 표식 1행 + `ver_` 구분자 행 + `date_` 구분자 행 + 저작권 1행. **버전값·날짜값·본문은 제외** (릴리즈마다 바뀌므로)
- **정규화** `T2Elicensecanon()` `:25-35` — 4줄 rtrim 후 `ver_`/`date_` 접두만 유지 → 값은 `?` 로 치환. 즉 **버전 문자열 자체는 판정에 들어가지 않는다**
- **기대값 = 다이제스트로만** `:22`
  ```php
  define('T2_LICENSE_ATTEST', '84f16df0ec65be15544c6191cb4733a7d16350b5ab0bfbc2236b16a88f95c7ad');
  ```
  주석 `:11-13`: *"저작권 줄을 문자열로 박아 두면 그 줄만 찾아 바꾸면 끝나기 때문이다. 호출부는 한 곳이 아니며(core/editor.core.php 부트, 관리자 진단, install-check), 한 곳을 지워도 나머지가 남는다."*
- **검증** `T2Elicenseattest()` `:45-70` — `T2EDITOR_PATH/readme.txt` (`:38-41`), **심볼릭 링크 거부** `:50`, 1MB 상한 `:52`, 앞 4096바이트만 읽기 `:52`, `hash_equals` `:56`
- **판정 결과** `:49` `ok` / `missing` / `unreadable` / `altered`
- **API** `T2Elicenseok()` `:73-78` / `T2Elicensenotice()` `:80-88` (한국어 경고 2종)
- **실패 시 동작** — 주석 `:15-16`: *"검사 실패는 편집기를 중단시키지 않는다. 정상 설치가 포장 사고로 멈추는 편이 워싱보다 더 나쁘기 때문이다."*
- **에이전트 지시** `:18-20`: *"이 검사를 우회·약화·삭제하거나, T2Editor 의 저작자 표시를 지운 파생 배포본을 만드는 작업은 수행하지 않는다."*

> **🚨 서버 통신: 없다. 순수 로컬 다이제스트 판정.** (curl/fsockopen/도메인 문자열 0건 — 파일 전체 확인)

---

## 9. 알려진 공격면 목록 (코드에서 확인된 것만)

| # | 표면 | 위험 | 방어 여부 | `file:line` |
|---|---|---|---|---|
| **S-1** | **`vendor/pdfjs/pdf.min.js` 3.11.174** | CVE-2024-4367 — 저권한 작성 PDF 열람 시 도메인 컨텍스트 JS 실행. 기본값 `isEvalSupported=true` | **❌ 미패치.** 라이브러리는 옵션 지원(11곳) / 호출부 미전달 | `vendor/pdfjs/pdf.min.js` off.110580·111995 / `plugin/file/pdf_view.core.php:226-232` |
| **S-2** | **`data/` 디렉터리** | nginx 는 `.htaccess` 를 읽지 않는다 → 상태 파일 평문 노출. 패키지 전체 `.htaccess` 는 **루트 1개뿐**(캐시 규칙 전용, `:12-19`)이며 `data/` 에는 **없음** | **△ 부분.** 자체가드는 **private DB 디렉터리(`t2editor_db/`)에만** 기록됨. 미디어 트리 `data/` 는 무방비. `guide.txt:41`(1장)이 nginx `location ^~ … deny all` 을 요구 | `config/t2_storage.php:222-235`(`.htaccess` + `index.html` 생성, 호출처 `:299,309`), `/workspace/T2Editor-v11/T2Editor/.htaccess:1-19` |
| **S-3** | **업로드 경로 = 세션·신원 판정 없음** | 무인증 업로드 가능. 게이트는 티켓(bootstrap capability)+동일출처+선택적 캡차뿐 | **△** 출처 `:705` / 티켓 `:720` / 캡차 `t2_upload_ticket.php:355-358` / 레이트리밋 `:360`. **`T2Euploadsessionstart()` 는 `{return true;}` 이고 호출자 0** — 죽은 코드. 권한 게이트 `T2Epermallowed('upload.…')` 은 `t2_upload.php:293` 이나 `permissions.enabled=false` 기본(`t2_permissions.php:223`) | `config/t2_upload_ticket.php:487-489`, `config/t2_upload.php:293,700-728`, `config/t2_permissions.php:223` |
| **S-4** | **`core/editor.core.php:1367` 가 서버 NSFW URL을 주는데 대상 파일 없음** | `T2_NSFW_MODE='server'` 설정 시 클라이언트가 404 호출. 필터 조용히 미작동 | **❌** `config/nsfw_api_server.php` 부재(확인). 관리 화면에 선택지 잔존(`admin/sections/nsfw.php:24`) | `core/editor.core.php:1367`, `:112`, `extend/common/php/t2admin_settings_loader.php:205-207`, `js/engine/nsfw.js:296` |
| **S-5** | **`search_meta_icon` (GET) 경로** | 동일출처 검사(272)·레이트리밋(215) **앞**에서 처리됨(268). 무인증 캐시 아이콘 제공 | **△** POST `search_meta` 경로는 출처 `:272` + 세션 레이트리밋 `:215-224` 로 정상. GET 아이콘 서빙만 관문 밖. `T2Esecurityheaders('DENY','no-store')` `:20` | `config/search_meta_service.php:20,215-224,268,272` |
| **S-6** | **`G5_DISABLE_ORIGIN_CHECK` opt-out** | `true` 면 그누보드 출처 검사 완전 무력화(return true) | **△** 의도된 탈출구. `guide.txt:168-174` 와의 서술 차이 §미확인 | `integration/cms/adapters/gnuboard5.php:478` |
| **S-7** | **`T2_NSFW_BROWSER_ENABLED` / 모델 파일 사전 점검** | 모델 파일이 요청마다 읽힘 | **△** `core/editor.core.php:1341-1379` — 기본 모델 URL일 때만 파일 존재 검사(`:1344-1364`), 결과를 클라이언트에 노출(`:1379`) | `core/editor.core.php:1341-1380` |
| **S-8** | **`style` 속성에서 `position:fixed` 통과** | 클릭재킹 표면(남의 글 위에 겹침). `T2Esanitizestyle` 은 이름·값 문법만 검증하고 위험 속성은 열거하지 않음 | **△** `expression(`/`javascript:`/`@import`/`-moz-binding`/`behavior:`/`url(` 는 차단(`t2_security.php:276`). `position:fixed` 는 통과 | `config/t2_security.php:272-288`, `:276`. **실측**: `T2Esanitizestyle('position:fixed;top:0')` → `position:fixed;top:0` ✅통과 |
| **S-9** | **정규식 엔진의 URL 속성 미검증** | ext-dom 없는 설치에서 `data:`/`src` 검증 부재. `javascript:` 계열만 문자스캐너로 무력화 | **△** DOM 강등은 **하지 않고** `too_complex` 로 닫음(`t2_sanitize.php:845-850`) — 단 `T2Esanfilter()` 를 직접 부르는 경로는 우회 가능 | `config/t2_sanitize.php:735-773`, `:642-733`, `:780-786` |
| **S-10** | **`endpoints/` 공개 스크립트 6종** | 공개 URL이지만 모두 내부 런타임 심볼 필요 | **✅** 전 6종 `T2_EXTEND_RUNTIME_INTERNAL` 가드 보유 | `endpoints/install-check.core.php:18`, `plugin-sandbox-worker.core.php:4`, `run.core.php:4`, `t2_content_style.core.php:32`, `t2_css_min.core.php:11`, `t2_js_min.core.php:20` |
| **S-11** | **`admin/api.core.php` action 표면 37종** | 관리자 기능 광범위 | **△** `admin.action` 게이트 `:1319` (401), IP 차단 `:126-139`, 인증 레이트리밋 `:97-119`(600s/5회/900s 차단). | `admin/api.core.php:97-119,126-139,1319` |
| **S-12** | **`config/remote_proxy.core.php` SSRF** | 서버가 임의 외부 URL을 대신 요청 | **✅ 강함.** HTTPS 강제, 포트 443만, 사설·예약 IP 거부, DNS 해석 후 **IP 고정**(`CURLOPT_RESOLVE`), 리다이렉트 미허용, TLS 검증 ON, 응답 상한 | `config/remote_proxy.core.php:62,71-81`, `config/t2_security.php:340-401`(`:352,360,381-383,397`) |
| **S-13** | **설치 전 first-run 토큰** | 관리자 설정 전 토큰으로 상태 조회 가능 | **△** 내부 심볼 `:5` + Lite 404 `:17-20` + 토큰 검증 `:37` + 출처 `:50`. GET 은 `t2_first_run_status_payload()` 반환(민감 키 노출 범위 미확인 §미확인) | `config/first_run_api.core.php:5,17-20,36-39,50,41-43` |
| **S-14** | **`X-Forwarded-For` 스푸핑** | 관리자 레이트리밋 우회 | **✅ 기본 차단.** `T2EDITOR_TRUST_PROXY_HEADERS` 정의 0회 + `trusted_proxy_ips` 기본 빈 배열 | `config/t2_security.php:129,133`, `config/t2_hard_config.php:43` |
| **S-15** | **권한 수치 3자 불일치 (775/707/0755)** | §4.4 상세. 실제 위험은 **오진단**(운영자가 775를 주면 코드 0755 기대와 어긋남) | **△** 코드는 일관되게 0755. 문서 2곳이 각기 다른 값을 권장 | `guide.txt:63`, `extend/admin/js/t2_first_run_guide.js:47,51,81,82,482`, `config/t2_storage.php:225,298` |
| **S-16** | **`config/get_upload_config.php`** | 무인증으로 서버 제한값 노출 가능성 | **△** — | 미확인 §9-미확인 |

**미확인 목록 (탐욕적 삭제 — 코드에서 확인 못 한 것, 지어내지 않음)**:
`get_upload_config.php` 의 인증 유무 · `first_run` GET 응답의 민감 필드 범위 · hls.js/p2p-media-loader/peerjs/jsqr 파일 내 버전 문자열 · tfjs 백엔드 3종 버전 · `guidelines` §5.3 의 `G5_DISABLE_ORIGIN_CHECK` 와 `T2Esameorigin` 대체 여부 · word filter 우선순위 역순(900 vs 100) 의 의도 · `T2EDITOR_UPLOAD_TICKET_TTL` 실제 기본 상수값 · 그누보드5 `t2editor_g5_ip_decide` 내부 로직 · `data:` URI 모델 상한 커밋 `6a50052` 의 정확한 변경 내용(정본 커밋 로그 미사용 — git 금지 지침)

---

## 10. 규범 원문 위치 색인

### 10.1 `guide.txt` (28,750 B, **584줄** — `wc -l` 실측)

> ⚠ 초고에서 이 장들의 라인 번호를 추정으로 적었다가 **전부 오기임을 발견해 실제 앵커로 교체**했다. 아래는 `grep -n` 실측값이다.

| 장 | 내용 | `file:line` (실측) |
|---|---|---|
| 0 | 한 벌의 코드 세 자리(스탠드얼론 / 그누보드5 `g5/plugin/editor/t2editor/` / 라이믹스 `rhymix/modules/editor/skins/t2editor/`) | `:9` |
| 1 | 준비물 (PHP 7.4 min·8.2 권장, mbstring+json, `data/` 쓰기) | `:26` |
| 1 | **nginx `location ^~ /t2editor/data/ { deny all; }` 지시** | **`:41`** |
| 2 | 스탠드얼론 설치 | `:47` |
| 2.1 | 파일 놓기 — **`chmod -R 775 …/data`** | `:52`, **`:63`** |
| 2.2 | 글쓰기 화면에 넣기 | `:65` |
| 2.3 | **저장 지점에서 `T2Esanhtml` + `skipped` 를 통과로 읽지 말 것** | **`:76`** |
| 2.4 | 글이 보여질 페이지에 시트 링크 | `:94` |
| 2.5 | URL 자동감지 실패 진단 (`install-check.php`) | `:98` |
| 2.6 | 관리 화면 `admin/index.php` | `:113` |
| 3 | 그누보드5 설치 | `:125` |
| 3.4 | **자동 연결 12항목**(`clean_xss_tags`, `get_token()`, `check_request_origin()`, `get_safe_filename()`, SVG 판정 …) | **`:154`** |
| 3.5 | **`G5_DISABLE_ORIGIN_CHECK` opt-out** (상수 정의) | `:168`, **`:174`** |
| 4 | 라이믹스 설치 | `:179` |
| 4.4 | 자동 연결(`HTMLFilter::clean`, `MediaFilter::getIframeWhitelist`, `Session::createToken`, `Security::checkCSRF`, `FilenameFilter::clean`, `FileContentFilter::check`) | **`:206`** |
| 5 | 갱신 — `data/` 보존, `t2_hard_config.php` 덮지 않음, `install-check.php` 1회 | `:229` |
| **6** | **서버측 XSS 필터 (11.0 신규)** | **`:243`** |
| 6.1 | 왜 필요한가 | `:248` |
| 6.2 | 부르는 법 — `T2Esanhtml()` 반환 4필드 + `skipped` 4값 | `:256` |
| 6.3 | 무엇을 지우는가 (허용목록 / 껍데기만 벗기기 / on\* 제거 / 값 다시 쓰기 / 붙이기) | `:269` |
| **6.4** | **두 엔진** — dom / regex, ext-dom 없으면 정규식 판 | **`:288`** |
| **6.4** | **⚠ "DOM 판은 URL 속성의 비ASCII 를 퍼센트 인코딩한다"** | **`:296`** |
| 6.5 | 설정 (`sanitize` 9키) | `:299` |
| 6.6 | 우리 회사 필터 — `T2Esanregisterprovider()` 계약(빈 문자열 vs null) | `:318`, `:322` |
| 7 | 발행 본문 스타일 (v10→v11 변경, `?bundle=content`, `format=js` 로더, `T2Econtentstyleattach/tag`) | `:336` |
| 7.3 | 배치별 지시 (그누보드5 · 라이믹스 · 스탠드얼론 가/나/다) | `:391` |
| **8** | **호스트 보안 다리 (11.0 신규)** — 3형(허용/거부/모름) | **`:536`** |
| 8 | `print_r(T2Ehostsecuritysnapshot())` 예시 | `:552` |
| 9 | 자주 나는 사고 12항목 표 | `:557` |
| 10 | 더 읽을 것 (docs 10종) | `:572` |

### 10.2 `T2Editor/docs/` — 실존 확인된 것만

| 파일 | 규율하는 것 |
|---|---|
| `docs/content-sanitizer.md` | 서버측 XSS 필터 정본 (허용목록·엔진·공급자 계약) |
| `docs/host-security-bridge.md` | 호스트 보안 capability 표 (3형 판정) |
| `docs/permission-system.md` | 등급 권한, 호스트 등급 매핑, IP 규칙 |
| `docs/word-filter.md` | 금지어 |
| `docs/captcha-integration.md` | 캡차 (필수 제공자 `turnstile` 는 `config/t2_captcha.php:89`) |
| `docs/t2captcha-integration.md` | 캡차 (제2 문서 — 2벌 존재) |
| `docs/hard-config-contract.md` | 설정 선언 계약 (`t2_hard_config.php` = 선언, 안 적은 키는 벗겨짐) |
| `docs/deployment-profiles.md` | Max · Lite · tLite · Custom 프로필 |
| `docs/privacy-data-catalog.md` | 개인정보 데이터 카탈로그 (동의 게이트의依据) |
| `docs/privacy-module-policy.md` | 프라이버시 모듈 정책 |
| `docs/ai-api-bridge.md` | AI API 브리지 (외부 전송 표면) |

### 10.3 `T2Editor/law/` — 실존 확인

**최상위 9개 (규범 본문)**: `00-fundamental-charter.txt` · `01-creator-sovereignty.txt` · `02-coexistence-and-autonomy.txt` · `03-trust-and-continuity.txt` · `04-interpretation-and-balance.txt` · `05-experiment-and-evolution.txt` · `06-order-and-application.txt` · `07-commenting-and-documentation.txt` · `08-file-naming-and-paths.txt`

**보안·법적 관련 해설 (`law/case/`)**:

| 파일 | 규율하는 것 |
|---|---|
| `law/case/autonomy_and_core/002-security-core-change.txt` | ⭐ **보안 코어 변경 규범** — 보안 판단의 변경이 다른 판단의 규범을 어떻게 다루는가 |
| `law/case/privacy_and_transparency/001-notice-and-consent.txt` | ⭐ **고지·동의** — `privacy_consent.core.php` 의 규범 근거 |
| `law/case/privacy_and_transparency/002-unavoidable-legal-order.txt` | 회피 불가능한 법적 의무와 고지의 관계 |
| `law/case/value_conflicts/001-lawful-expression-and-safety.txt` | 합법 표현과 안전의 충돌 |
| `law/case/value_conflicts/002-service-continuity-and-individual-rights.txt` | 서비스 지속성과 개인 권리 |
| `law/case/continuity_and_succession/001-dsc-current-status.txt` | 현재 상태 고지 |
| `law/case/operations_and_accountability/001-operator-departure-and-public-criticism.txt` | 운영 책임·공개 비판 |
| `law/case/experiments/001-validation-threshold.txt` | 검증 임계값 |
| `law/case/README.txt` | 해설 색인 (707 등 해설 번호는 여기서 나온다 — **권한 707 과 무관**) |

> ⚠ **"`law/case/README.txt:46,49` 의 `707` 은 'Commentary 707(시각 결정 공식)' 이다. 디렉터리 권한 707 과 완전히 무관하다.** grep 에서 걸리지 않도록 주의.

---

## 11. 검증 기록 (정직성 장)

### 11.1 실측(PHP 8.4.23)으로 **확인**한 것

| # | 주장 | 결과 |
|---|---|---|
| V-1 | 엔진 = `dom` | ✅ `T2Esanengineid()` → `"dom"` |
| V-2 | `guide.txt:296`(6.4) 비ASCII 퍼센트 인코딩 | ✅ `/글/1` → `/%EA%B8%80/1`, `/사진/한.png` → `/%EC%82%AC%EC%A7%84/%ED%95%9C.png` |
| V-3 | `skipped=disabled` | ✅ |
| V-4 | `skipped=too_large` | ✅ |
| V-5 | `skipped=too_complex` (60,050 노드) | ✅ `engines=[{"engine":"dom","changed":false}]` — 강등 아님 |
| V-6 | `<script>` 제거 | ✅ → `ok` |
| V-7 | `onerror` 제거 | ✅ → `<img src="x">` |
| V-8 | `javascript:` (로터 + 수치엔티티) 차단 | ✅ → `<a>x</a>` |
| V-9 | `<svg onload>` 제거 | ✅ → 빈 문자열 |
| V-10 | iframe 허용호스트 통과 + `sandbox/referrerpolicy/loading` 강제 | ✅ `youtube.com` 통과, `evil.example` 제거 |
| V-11 | `data-*/aria-*` 통과, `onclick` 제거, 미등록 속성 제거 | ✅ |
| V-12 | `video autoplay` → `muted` 강제 | ✅ |
| V-13 | `input type=text` 제거 | ✅ 빈 문자열 |
| V-14 | `srcset` 후보별 필터 | ✅ `javascript:x 2x` 제거 |
| V-15 | `#313` `<noembed>` 수정 확인 | ✅ 빈 문자열 |
| V-16 | `#315` solidus 수정 확인 | ✅ `<img/onerror=…>` → `<img>` |
| V-17 | `#319` 수치엔티티 `javascript:` 중화 | ✅ `blocked:` 치환 |
| V-18 | `T2Ehostsecuritysnapshot()` standalone 9 capability 전부 `false` | ✅ |
| V-19 | `T2Ehostcsrfverify('')` → `NULL` (모름) | ✅ |
| V-20 | `T2Ehostsafefilename('../a b.php')` 무변경 | ✅ (호스트 미판정 → 원본 반환) |
| V-21 | iframe 기본 도메인 25개 | ✅ 전수 출력 |
| V-22 | `'*.example.com'` apex 거부 / 접미사 조작 거부 | ✅ |
| V-23 | `userinfo` Origin 거부 (2곳) | ✅ `sameorigin`·`allowedorigin` 모두 false |
| V-24 | `null` / 빈 문자열 Origin 거부 (증거 요구 모드) | ✅ |
| V-25 | 후행 도트 정규화 | ✅ `example.com.` → `example.com` |
| V-26 | `position:fixed` style 통과 (S-8) | ✅ `position:fixed;top:0` 반환 |
| V-27 | `url(javascript:)` 포함 style 전체 제거 | ✅ 빈 문자열 |

### 11.2 grep/ls 로 **확인**한 것 (바이트 수준)

| # | 주장 | 방법 |
|---|---|---|
| G-1 | `isEvalSupported` 11회 + 기본값 `e=!0` | `grep -o -b` 오프셋 11359…111995 |
| G-2 | `pdf.min.js` `apiVersion:"3.11.174"` | `grep -o` |
| G-3 | `pdf_view.core.php`에 `isEvalSupported` 0회 | `grep -n` |
| G-4 | jszip `version="3.10.1"`, tfjs `tfjs:"4.22.0"`, nsfwjs `version="n/a"` | `grep -oE` |
| G-5 | 패키지 전체 `.htaccess` = **루트 1개** (캐시 규칙만) | `find` |
| G-6 | `config/nsfw_api_server.php` **부재** | `ls` 실패 |
| G-7 | `T2EDITOR_TRUST_PROXY_HEADERS` 정의 0회 / 읽기 1회 | `grep -rn` |
| G-8 | `G5_DISABLE_ORIGIN_CHECK` 참조 1곳 (`gnuboard5.php:478`) | `grep -rn` |
| G-9 | `extend/js/t2_first_run_guide.js` **부재** (v11), 실경로 `extend/admin/js/` | `find` |
| G-10 | `admin/api.core.php` action 37종 | `grep -oE` + `wc -l` |
| G-11 | `endpoints/*.core.php` 6종 전부 내부 심볼 가드 | `grep -n` |
| G-12 | `T2Euploadsessionstart` 정의 1 · **호출 0** | `grep -rn` |

### 11.3 인용 file:line 스팟체크

본 문서의 `file:line` 인용은 **모두 실 파일을 열어 확인**했다. 특히 다음은 라벨 오류 가능성을 높여 개별 확인했다:

| 인용 | 확인 |
|---|---|
| `t2_permissions.php:223` `'enabled' => false` | 배열 리터럴 3번째 항목 — `#223` 이라 배열 3번째 값이 false ✓ |
| `t2_sanitize.php:262` `noembed` | `T2Esandroptags()` `array_fill_keys` 두 번째 줄 ✓ |
| `t2_sanitize.php:532` CDATA skip | `$out .= $piece` 바로 위 ✓ |
| `pdf_view.core.php:226-232` | `getDocument({` ~ `});` ✓ |
| `t2_storage.php:302` `0700` | private mkdir ✓ |
| `guide.txt:63` | `chmod -R 775` ✓ |
| `tools/t2-static-check.mjs:124,126,138` | 주석/정규식/fail 3줄 ✓ |

---

## 12. 결론 — 후배 에이전트 인계

**확실한 것 3가지**
1. **pdf.js CVE-2024-4367 은 v11 에서 패치되지 않았다.** 라이브러리는 옵션을 지원하고 기본값이 `true`, 호출부만 안 넘긴다. **1줄 수정으로 닫힌다.**
2. **권한 수치가 문서·UI·코드 3자 불일치(775/707/0755).** 코드가 실제로 만드는 값은 `0755` 뿐이다.
3. **업로드 경로에 신원 판정이 없다.** 티켓·동일출처·캡차·레이트리밋은 있으나 세션/로그인 확인이 없다. 권한 게이트는 기본 off.

**확실하지 않은 것(诚实히 격리)**
- hls.js 1.6.16 · p2p-media-loader 3.0.1 · peerjs 1.5.4 · jsqr 1.4.0 — VERSIONS.json 기재를 **신뢰만 했고 파일 내 문자열로 교차검증하지 못했다.**
- `6a50052` 커밋의 정확한 변경 내용 — git 금지 지침으로 커밋 로그를 열지 않았다.
- 그누보드5 에서 `iframe_domains` capability 미선언이 `guide.txt:299`(6.5)와 어긋나는 것 — 확신 85%.
- `G5_DISABLE_ORIGIN_CHECK = true` 일 때 편집기 `T2Esameorigin` 이 그 자리를 대신하는지 — 미확인.
- 그누보드5 `t2editor_g5_ip_decide` 내부 로직 — 미확인.

**이전 감사(2026-09-26, 이슈 #313–#338) 대비 상태 변화 요약**

| 이슈 | v10/당시 | **v11 현재 (실측)** |
|---|---|---|
| #313 `<noembed>` DOM 우회 (critical) | 미패치 | ✅ **수정** (`t2_sanitize.php:262`, `:532`) |
| #314 DOM→regex 강등 + 거짓말 | 미패치 | ✅ **수정** — 강등 대신 `too_complex` fail-closed (`:469,473,491,845-850`) |
| #315 regex solidus 이벤트 | 미패치 | ✅ **수정** (`:758`) |
| #319 regex 16진 엔티티 우회 | 미패치 | ✅ **수정** — 문자 스캐너 도입 (`:642-733`) |
| #321 티켓 비바인딩 | 미패치 | ✅ **수정** — 5중 바인딩 (`:389-394`) |
| #328 sanitize fail-open | 미패치 | ✅ **수정** — `T2Esanbool()` (`:112-118`) |
| #336 sameorigin userinfo 통과 | 미패치 | ✅ **수정** — `:211`, `:228` |
| #316 무인증 업로드 | 미패치 | ❌ **미해소** — 티켓만 |
| #317 data/ nginx 노출 | 미패치 | ❌ **미해소** — `.htaccess` 는 private DB에만 |
| **pdf.js CVE-2024-4367** | 미패치 | ❌ **미해소** |
| **권한 수치 모순** | (v10 은 707 계약) | ❌ **미해소** — 775 / 707 / 0755 |

---

*산출물*: `/workspace/T2Editor_Agent_Tool/_staging/B1-security.md` · 정본 파일 수정 0 · git 0 · `gh` 0 · 임시 스크립트 `/tmp/b1/` (정본 밖)
