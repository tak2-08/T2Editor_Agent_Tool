# T2Editor 이슈 분류 기준

## 심각도 (Severity)

### Critical (P0)
- 보안 취약점 (RCE, SQL Injection, XSS)
- 데이터 손실/손상
- 시스템 다운
- 개인정보 유출

### High (P1)
- 주요 기능 장애
- 성능 심각 저하
- 호환성 문제 (주요 브라우저/CMS)

### Medium (P2)
- 일부 기능 오작동
- UI/UX 문제
- 성능 경미한 저하

### Low (P3)
- 코드 품질
- 문서 오류
- 사소한 UI 문제

## 유형 (Type)

### bug
- 기능 오작동
- 에러 발생
- 예상치 못한 동작

### enhancement
- 기능 개선
- 성능 최적화
- 사용성 개선

### feature
- 신규 기능 요청
- 플러그인 추가

### documentation
- 문서 오류/누락
- 주석 추가

### question
- 사용법 문의
- 기능 확인

## 라벨

### 우선순위
- `priority: critical` - 즉시 처리
- `priority: high` - 24시간 이내
- `priority: medium` - 1주일 이내
- `priority: low` - 다음 스프린트

### 상태
- `status: triage` - 분류 중
- `status: confirmed` - 확인됨
- `status: in-progress` - 처리 중
- `status: needs-info` - 추가 정보 필요
- `status: wontfix` - 처리 불가
- `status: duplicate` - 중복

### 영역
- `area: core` - 코어 모듈
- `area: plugin` - 플러그인
- `area: admin` - 관리자 페이지
- `area: ui` - UI/UX
- `area: security` - 보안
- `area: performance` - 성능
- `area: docs` - 문서

### 환경
- `env: gnuboard5` - 그누보드5
- `env: rhymix` - 라이믹스
- `env: standalone` - 스탠드얼론
- `env: php74` - PHP 7.4
- `env: php80` - PHP 8.0+
- `env: chrome` - Chrome
- `env: firefox` - Firefox
- `env: safari` - Safari
- `env: mobile` - 모바일

## 분류 절차

1. **이슈 접수** → `status: triage`
2. **심각도 판정** → `priority: *` 라벨 부여
3. **유형 판정** → `type: *` 라벨 부여
4. **영역 판정** → `area: *` 라벨 부여
5. **중복 확인** → `status: duplicate` (중복 시)
6. **담당자 할당** → 이슈 할당
7. **상태 업데이트** → `status: confirmed`

## 자동 분류 규칙

### 키워드 기반
- "보안", "취약", "XSS", "인jection" → `area: security`, `priority: critical`
- "느려", "성능", "로딩" → `area: performance`
- "깨짐", "오류", "에러" → `type: bug`
- "추가", "기능", "요청" → `type: feature`

### 환경 기반
- "그누보드" → `env: gnuboard5`
- "라이믹스" → `env: rhymix`
- "PHP 7" → `env: php74`
- "모바일", "iPhone" → `env: mobile`
