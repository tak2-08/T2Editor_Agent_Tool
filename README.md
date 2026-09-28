# T2Editor Agent Tool

T2Editor v1~v11 전문 자동화 에이전시 도구 모음. AI 에이전트가 T2Editor 코드베이스를 이해, 리뷰, PR 관리, 이슈 분류, 코드 수정을 수행하기 위한 지식 베이스.

## 구조

```
T2Editor_Agent_Tool/
├── README.md                    # 이 파일
├── CHANGELOG.md                 # 변경 로그
├── data/
│   ├── versions/                # 버전별 메타데이터 (JSON)
│   ├── releases/                # 릴리즈 노트 (v1~v10)
│   ├── metrics/                 # 코드 메트릭 (JSON)
│   └── issues/                  # 이슈 히스토리 (JSON)
├── skills/                      # 에이전트 스킬 (Markdown)
│   ├── code-review.md           # 코드 리뷰 체크리스트
│   ├── pr-management.md         # PR 생성/머지/반송 절차
│   ├── issue-triage.md          # 이슈 분류 기준
│   └── release-management.md    # 릴리즈 관리 절차
├── tools/                       # 자동화 도구 (Shell)
│   ├── metrics-collector.sh     # 코드 메트릭 수집
│   └── release-notes.sh         # 릴리즈 노트 생성
├── analysis/                    # 분석 문서 (Markdown)
│   ├── architecture.md          # 아키텍처 분석
│   ├── security.md              # 보안 분석
│   └── performance.md           # 성능 분석
└── datasets/                    # 데이터셋 (CSV)
    ├── code-metrics.csv         # 코드 메트릭 데이터
    └── release-history.csv      # 릴리즈 히스토리
```

## 버전별 상태

| 버전 | 상태 | 판본 수 | 설명 |
|------|------|---------|------|
| v1 | EOL | 19 | 1.0.0-beta~1.6.3 |
| v2 | EOL | 3 | 2.0.0~2.0.0_B |
| v3 | EOL | 10 | 3.0.0~3.0.9 |
| v4 | EOL | 3 | 4.0.0~4.0.2 |
| v5 | EOL | 32 | 5.1.0~5.10.0 |
| v6 | EOL | 1 | 6.0.0 |
| v7 | EOL | 3 | 7.0.0~7.0.2 |
| v8 | EOL | 6 | 8.0.0~8.2.0 |
| v9 | EOL | 7 | 9.0.0~9.3.0 |
| v10 | 현행 공개 | 9 | 10.0.0~10.5.1 |
| v11 | 개발 중 | - | 현행 개발 |

## 사용 방법

### 코드 리뷰
```bash
# 메트릭 수집
bash tools/metrics-collector.sh /path/to/T2Editor-v11

# 릴리즈 노트 생성
bash tools/release-notes.sh v11
```

### 에이전트 스킬 로드
```bash
# 코드 리뷰 체크리스트
cat skills/code-review.md

# PR 관리 절차
cat skills/pr-management.md

# 이슈 분류 기준
cat skills/issue-triage.md
```

## 데이터셋

### code-metrics.csv
버전별 코드 메트릭 (PHP/JS/CSS 파일 수, 커밋 수, 라인 수)

### release-history.csv
릴리즈 히스토리 (버전, 날짜, 주요 변경사항)

## 라이선스

T2Editor와 동일: 무료 재배포, 상업적 판매 금지
