# T2Editor PR 관리 절차

## PR 생성

### 브랜치 전략
```
main (보호)
├── feature/새기능
├── bugfix/버그수정
├── refactor/리팩터링
├── perf/성능개선
└── docs/문서
```

### PR 제목 형식
```
<type>: <description>

feat: 슬래시 메뉴 기능 추가
fix: 파일 모달 깨짐 수정
refactor: 코어 모듈 리팩터링
```

### PR 본문 템플릿
```markdown
## 변경 내용
- 변경 사항 설명

## 이유
- 왜 이 변경이 필요한지

## 테스트
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 수동 테스트

## 영향 범위
- 영향받는 모듈/기능

## 스크린샷 (UI 변경 시)
| Before | After |
|--------|-------|
| ...    | ...   |
```

## PR 리뷰

### 리뷰 체크리스트
1. **기능 정확성**: 요구사항 충족
2. **코드 품질**: 가독성, 일관성
3. **보안**: 취약점 검토
4. **성능**: 성능 저하 여부
5. **호환성**: 브라우저/CMS/PHP 버전
6. **테스트**: 테스트 커버리지

### 리뷰 코멘트 형식
```
[승인] 문제 없음
[수정 요청] 이 부분을 수정해주세요 (이유: ...)
[질문] 이 코드의 의도가 궁금합니다
[제안] 이렇게 개선하면 어떨까요?
```

## PR 머지

### 머지 조건
- [ ] 최소 1명 이상 리뷰 승인
- [ ] CI 통과
- [ ] 충돌 해결
- [ ] 테스트 통과

### 머지 방법
1. **Squash and merge**: 단일 커밋으로 합치기 (기본)
2. **Rebase and merge**: 리베이스 후 합치기
3. **Create a merge commit**: 머지 커밋 생성

## PR 반송

### 반송 사유
- 테스트 실패
- 보안 문제
- 성능 저하
- 코드 품질 미달
- 요구사항 불충족

### 반송 절차
1. 반송 사유 명시
2. 수정 가이드 제공
3. 재검토 요청

## 자동화

### GitHub Actions
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: PHP 테스트
        run: php vendor/bin/phpunit
      - name: JS 테스트
        run: npm test
```

### 봇 설정
- **Dependabot**: 의존성 업데이트
- **Stale Bot**: 오래된 이슈/PR 정리
- **CodeQL**: 코드 보안 분석
