# CHANGELOG

이 저장소의 형식은 **_semver_ 를 따르지 않는다.** 대신 지식이 **얼마나 오래 진짜인지**가 버전이다.
모든 변경은 `PROVENANCE.md` 에 근거를 남기고, 도구 변경은 `SCHEMA.md` 의 계약 변경으로 기록한다.

---

## 2026-09-28 — v0.1.0 · 정본 `57a8b5f0fb7d`

**첫 구축.** T2Editor v11 코드베이스 전체 리뷰 → v1~v11 전문 지식 베이스.

### 이 저장소가 대체한 것

기존 스켈레톤(단일 커밋 `17f0fea`)이 있었고 **근거 없는 일반론이 대부분**이었다:

| 발견 | 처리 |
|---|---|
| `README.md` 가 `tools/metrics-collector.sh`·`tools/release-notes.sh` 를 광고하나 **`tools/` 는 빈 디렉터리** | 삭제 · 실제 도구로 교체. `doctor` 에 검사 추가 |
| `analysis/performance.md` 의 수치(2MB→200KB "90% 감소" 등)가 **측정값이 아님** | 파일 삭제. 측정 없는 수치는 자산이 아니다 |
| `analysis/security.md` 가 **T2Editor 고유 내용이 0** — 11.0 서버측 XSS 필터·호스트 보안 다리·권한·저장 라우팅을 전부 놓침 | 실측 기반 `knowledge/v11-security.md` 로 교체 |
| `analysis/architecture.md` 에 `file:line` 근거 0건 | 근거 621회 · 검증된 구조 맵으로 교체 |
| `datasets/code-metrics.csv` 의 열 대부분이 빈칸 | 제거 |
| `datasets/release-history.csv` 의 날짜가 전부 저장소 생성일(`2026-09-27`) | 본문 메타표 파서로 **실제 배포일** 추출 |
| `data/versions/v11.json` 외 대량 — 부분만 유효 | 유지(유일하게 기계 판정 값) |

### 추가한 것

**도구 (`tools/`, 의존성 0, Node ≥18 ESM)**

- `t2at.mjs` — `status` `refresh` `verify` `doctor` `query` `catalog`
- `lib/extract.mjs` — 정본 → 카탈로그 11종 추출
- `lib/cite.mjs` — **인용 파서 + 검증기**. 659건 전수 대조, **내용 변경까지** 검지
- `lib/legacy.mjs` — v1~v10 파서 (`published_at` 함정 처리)
- `lib/csv.mjs` — 카탈로그 → CSV 9종
- `lib/config.mjs` — 경로·커밋 해석
- `selftest/cite-test.mjs` — 인용 파서 자기시험

**지식 (`knowledge/`, 인용 100% 검증됨)**

- `v11-hotspots.md` — 지금 무엇이 참인가. 부장이 직접 재현한 사실만
- `v11-structure.md` — 부팅 체인 · 계층 인벤토리 · 코어 계약 · 플러그인 · CMS · 문서 색인
- `v11-security.md` — 신뢰경계 · sanitizer 2엔진 · 호스트 다리 · 업로드 공격면 · `data/` 노출
- `v11-playbook.md` — 게이트 10단계 · CSS 계약 규칙 전수 · CI · 과거 결함 사고 로그
- `legacy-v1-v10.md` — 판본 93건 전수 · 판별법 · EOL 비대칭 · v10→v11 파손 12곳 · 후퇴 4건

**스킬 (`skills/`, 10종 · 전부 실행 명령 포함)**

`00-start-here` `10-work-on-v11` `20-verify-and-gate` `30-css-and-visual` `40-setting-key`
`50-plugin-and-endpoint` `60-security-review` `70-issue-pr-charter` `80-legacy-lookup` `90-pitfalls`

**데이터**

- `data/catalog/` 11종 · `data/legacy/` 2종 · `datasets/` 10종(생성 9 + 계약 1)
- `data/MANIFEST.json` — 자산 기준 커밋 추적

**유동성 (레거시화 방지 장치)**

- 인용 자동 검증 — 파일 존재 + 라인 범위 + **`must_contain` 내용 토큰**
- `doctor` 6종 진단 (`exit 1`)
- `citations.csv` **열 수 검사** — 조용히 죽던 감지를 오류로 전환
- 미결합 힌트 경고 — 죽은 감지 보고
- `.github/workflows/staleness.yml` — 매주 정본 대조

### 실측된 사실 중 특히 중요한 것

- 🚨 **pdf.js CVE-2024-4367 이 v11 에서도 미패치** (`pdf.min.js:110580` 기본값 참 + `pdf_view.core.php:226-232` 미전달). 고치면 1줄
- 🚨 **정본 헌장 `AGENTS.md` 자체가 낡았다** — 라인 4곳 + 내용 1곳(`:498` 은 `3s` 인데 문서는 `1.5s`). 이 저장소의 존재 이유
- 🚨 **게이트에 `--quick` 플래그가 없다** — 주석에만 있다. `AGENTS.md:23` 도 이를 옮겼다
- 🚨 **권한 수치 3자 불일치** — 가이드 775 / 코어 UI 707 / 코드 0755
- 🚨 **`data/` 가 웹에서 노출될 수 있다** — `.htaccess` 는 루트 1개뿐
- 플러그인 **17(디렉터리) vs 16(등록 배열)** — `paste_migrate` 만 전용 로더
- 워드프레스 어댑터 **v11 에 없음**
- v1~v10 **93건**(94 아님) · `published_at` 은 **배포일이 아님**

### 도구를 만들면서 밟은 함정 (PROVENANCE §오류 7~10)

1. 인용 정규식에 콜론 구분자 누락 → 592건이 0건으로 검출
2. 오프셋 인용을 utf8 로 읽음 → 멀티바이트 뒤에서 어긋남
3. **`citations.csv` 쉼표 하나가 많아 `must_contain` 5건이 빈 칸으로 소실** — negative control 이 잡아내기 전까지 감지기가 조용히 죽어 있었다
4. 정규식 게으름으로 `api.core.php:4` → `.core.php:4` 절단

### 다음

- 정본이 private 이라 `staleness.yml` 은 `secrets.T2_V11_OWNER` + `secrets.GH_TOKEN` 이 필요하다
- 미확인 8건은 `knowledge/v11-hotspots.md` §6 에 격리돼 있다 — 해결하면 해당 항목을 지우고 근거를 남긴다
