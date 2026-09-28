# T2Editor 코드 리뷰 체크리스트

## 1. 코드 품질

### PHP
- [ ] `declare(strict_types=1)` 사용 여부
- [ ] 타입 힌트 (parameter, return) 적용
- [ ] 예외 처리 (try/catch) 적절성
- [ ] SQL 인jection 방지 (prepared statements)
- [ ] XSS 방지 (htmlspecialchars, ENT_QUOTES)
- [ ] CSRF 토큰 검증
- [ ] 파일 업로드 보안 (MIME 검사, 확장자 검사)

### JavaScript
- [ ] ES6+ 문법 사용 (const/let, arrow functions)
- [ ] 비동기 처리 (async/await, Promise)
- [ ] 메모리 누수 확인 (이벤트 리스너 정리)
- [ ] DOM 조작 최소화
- [ ] 에러 바운더리 적용

### CSS
- [ ] CSS 변수 사용 (테마 대응)
- [ ] 반응형 디자인 (미디어 쿼리)
- [ ] 접근성 (aria 속성, 포커스 표시)
- [ ] 성능 (불필요한 중복 제거)

## 2. 보안

### 인증/인가
- [ ] 관리자 인증 로직 검증
- [ ] 권한 검증 (role-based access control)
- [ ] 세션 관리 (secure, httponly)

### 데이터 보안
- [ ] 입력 값 검증 (server-side)
- [ ] 출력 값 인코딩 (context-aware)
- [ ] 파일 경로 검증 (path traversal 방지)
- [ ] 업로드 파일 실행 방지

### 통신 보안
- [ ] HTTPS 강제
- [ ] CORS 설정 적절성
- [ ] CSP (Content Security Policy)

## 3. 성능

### 로딩 성능
- [ ] 코드 스플리팅
- [ ] 레이지 로딩
- [ ] 이미지 최적화 (WebP, lazy loading)
- [ ] CSS/JS 압축

### 런타임 성능
- [ ] 불필요한 DOM 조작 최소화
- [ ] 디바운스/스로틀 적용
- [ ] 메모이제이션
- [ ] 가비지 컬렉션 고려

## 4. 호환성

### 브라우저
- [ ] Chrome, Firefox, Safari, Edge
- [ ] 모바일 브라우저 (iOS Safari, Android Chrome)
- [ ] IE11 지원 여부 (필요시)

### CMS
- [ ] 그누보드5
- [ ] 라이믹스
- [ ] 스탠드얼론

### PHP 버전
- [ ] PHP 7.4 호환성
- [ ] PHP 8.0+ 호환성

## 5. 접근성

- [ ] 키보드 네비게이션
- [ ] 스크린리더 지원
- [ ] 색상 대비 (WCAG 2.1 AA)
- [ ] 포커스 표시

## 6. 테스트

- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] E2E 테스트
- [ ] 시각적 회귀 테스트

## 7. 문서화

- [ ] README 업데이트
- [ ] API 문서
- [ ] 변경 로그
- [ ] 주석 (complexity 설명)
