# T2Editor v11 아키텍처 분석

## 개요

T2Editor v11은 PHP 기반 웹 에디터로, 그누보드5/라이믹스/스탠드얼론 환경을 지원한다.

## 디렉터리 구조

```
T2Editor/
├── admin/              # 관리자 페이지
│   ├── api.core.php    # API 엔드포인트
│   ├── index.core.php  # 메인 페이지
│   └── *.core.php      # 기능별 모듈
├── config/             # 설정 파일
│   ├── t2_config.php   # 메인 설정
│   ├── t2_hard_config.php  # 하드 설정
│   └── *.core.php      # 기능별 설정
├── core/               # 코어 모듈
│   └── editor.core.php # 에디터 코어
├── css/                # 스타일시트
├── data/               # 데이터 저장소
├── developer/          # 개발자 문서
├── docs/               # 문서
├── endpoints/          # 엔드포인트
├── extend/             # 확장 기능
├── fonts/              # 폰트
├── integration/        # CMS 연동
│   ├── cms/            # CMS 어댑터
│   ├── gnuboard5/      # 그누보드5
│   └── rhymix/         # 라이믹스
├── js/                 # JavaScript
│   ├── core.js         # 코어 로직
│   ├── editor-engine/  # 에디터 엔진
│   ├── engine/         # 엔진
│   ├── platform/       # 플랫폼
│   ├── runtime/        # 런타임
│   ├── utils/          # 유틸리티
│   └── *.js            # 기능별 모듈
├── law/                # 법적 문서
├── locales/            # 다국어
├── modules/            # 모듈
├── plugin/             # 플러그인
│   ├── ai_complex/     # AI 복합 기능
│   ├── clipurl/        # URL 클립
│   ├── code/           # 코드 블록
│   ├── collab/         # 협업
│   ├── draw/           # 그리기
│   ├── export/         # 내보내기
│   ├── file/           # 파일
│   ├── image/          # 이미지
│   ├── link/           # 링크
│   ├── linkcard/       # 링크 카드
│   ├── meme/           # 밈
│   ├── paste_migrate/  # 붙여넣기 마이그레이션
│   ├── search/         # 검색
│   ├── t2captcha/      # 캡차
│   ├── t2search/       # T2 검색
│   ├── table/          # 표
│   └── video/          # 비디오
├── schemas/            # 스키마
├── tests/              # 테스트
└── vendor/             # 외부 라이브러리
```

## 핵심 모듈

### 1. 에디터 코어 (core/editor.core.php)
- 에디터 초기화
- 플러그인 로딩
- 이벤트 처리

### 2. 설정 시스템 (config/t2_config.php)
- 기본 설정
- 사용자 정의 설정
- 환경별 설정

### 3. 플러그인 시스템 (plugin/*)
- 플러그인 등록
- 플러그인 로딩
- 플러그인 훅

### 4. CMS 연동 (integration/cms/*)
- 그누보드5 어댑터
- 라이믹스 어댑터
- 스탠드얼론

### 5. 보안 시스템 (config/t2_security.php)
- 인증/인가
- XSS 필터
- CSRF 방지

### 6. 업로드 시스템 (config/t2_upload.php)
- 파일 업로드
- 이미지 처리
- 보안 검증

## 데이터 흐름

```
사용자 입력
    ↓
에디터 엔진 (js/editor-engine)
    ↓
코어 로직 (js/core.js)
    ↓
플러그인 훅 (plugin/*)
    ↓
서버 API (admin/api.core.php)
    ↓
데이터 저장 (data/)
```

## 확장 포인트

### 플러그인 개발
```php
class MyPlugin {
    public function register() {
        // 플러그인 등록
    }
    
    public function hook($event, $data) {
        // 이벤트 처리
    }
}
```

### CMS 어댑터 개발
```php
class MyCmsAdapter {
    public function detect() {
        // CMS 감지
    }
    
    public function auth() {
        // 인증 처리
    }
}
```

## 성능 최적화

### 로딩 최적화
- 코드 스플리팅
- 레이지 로딩
- 이미지 최적화

### 런타임 최적화
- DOM 조작 최소화
- 디바운스/스로틀
- 메모이제이션

## 보안 고려사항

### 입력 검증
- 서버 측 검증
- 화이트리스트 방식
- 컨텍스트별 인코딩

### 출력 인코딩
- HTML 엔티티 인코딩
- JavaScript 인코딩
- URL 인코딩

### 파일 업로드
- MIME 타입 검사
- 확장자 검사
- 파일 내용 검사
