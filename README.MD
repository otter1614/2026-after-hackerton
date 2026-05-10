<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# GHOST_NET — 창원 야간 안전 통합 시스템

**범죄 통계 + AI 비전 분석 + 게임화 UX**로 도시 사각지대를 시각화하는 해커톤 프로토타입

</div>

---

## 프로젝트 목적

야간·심야 시간대 도시 사각지대(저조도, 폐건물, 사각지대, 인적 드문 구간)는 범죄 위험과 시민 불안의 주요 원인입니다. **GHOST_NET**은 이 위험을 다음 세 축으로 가시화하고, 시민 참여를 유도합니다.

1. **AI 비전 분석** — 시민이 찍은 사진을 Gemini Vision으로 6개 환경 요소(조도·폐건물·낙서·유동인구·음산함·구조위험)로 분석하여 정량 점수화
2. **공공 안전 데이터 결합** — 행정안전부 생활안전지도(safemap.go.kr)의 범죄주의구간을 지도에 오버레이, 행정구별 범죄밀도 기반 위험도 산출
3. **게임화 인터랙션** — 사각지대를 "영체(고스트)"로 시각화. 범죄밀도가 높을수록 강한 영체가 출현하여 시민의 자연스러운 제보·관심을 유도하고, 데이터를 누적

수집된 데이터는 **경찰 통합 관제 대시보드**에서 범죄 유형별 은닉 추정 장소 TOP 10 분석으로 활용됩니다.

---

## 핵심 기능

### 시민 측

- **사진 업로드 → AI 분석** — 의심 구역 사진 업로드 시 Gemini Vision이 6개 환경 요소를 0-100 점수화
- **공포도/위험도 자동 산출** — 서버 가중치 합산으로 등급(S/A/B/C) + 위험점수(0-100) 계산, DB 저장
- **실시간 인터랙티브 지도** — Leaflet 다크 테마 + 생활안전지도 범죄주의구간 WMS 오버레이
- **현재 위치 자동 인식** — Geolocation + OSM Nominatim 역지오코딩으로 한국어 행정주소 자동 표시
- **행정구 밀도 기반 영체 출현** — 5개 행정구 범죄밀도 가중 랜덤으로 등급·HP·ATK 차등 영체 5마리 생성
- **사용자 랭킹** — 누적 공포 지수로 TOP 10 헌터 랭킹 실시간 갱신

### 경찰 측 (대시보드)

- **행정구역별 위험지수** — 차트 시각화
- **범죄 유형 기반 은닉 추정 장소 분석** — 범죄 유형(절도/폭행/마약/성범죄/도주/강도/방화) 입력 시, DB에 누적된 환경 분석 결과를 범죄별 가중치로 재계산해 매칭 점수 TOP 10 반환

---

## 기술 스택

### Frontend
- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** (다크 택티컬 테마)
- **Leaflet** + **react-leaflet** (인터랙티브 지도, WMS 오버레이)
- **motion** (Framer Motion) (페이지 전환·모달 애니메이션)
- **recharts** (대시보드 차트)
- **lucide-react** (아이콘)
- **react-router-dom 7** (SPA 라우팅)

### Backend
- **Node.js** + **tsx** (TypeScript 직접 실행)
- **Express 4** (REST API + Vite 미들웨어 통합 단일 포트)
- **better-sqlite3** (동기 SQLite, WAL 모드)
- **multer** (사진 multipart 업로드)
- **dotenv** (환경 변수 로딩)

### AI / 외부 API
| API | 용도 | 인증 |
|---|---|---|
| **Google Gemini** (`gemini-2.5-flash`) | 사진 환경 비전 분석 | `GEMINI_API_KEY` |
| **safemap.go.kr WMS** | 범죄주의구간 지도 오버레이 | `SAFEMAP_API_KEY` (서버 프록시) |
| **OSM Nominatim** | 좌표 → 한국어 행정주소 | 키 불필요 |
| **CartoDB Dark Matter** | 다크 베이스맵 타일 | 키 불필요 |

### 보안 / 운영 설계
- **API 키 100% 서버사이드 보관** — 프록시(`/api/safemap/wms`)로 클라이언트 노출 차단
- **단일 포트 동시 서빙** — Express가 Vite를 미들웨어로 끼워 한 프로세스에서 SPA + API 모두 처리
- **무료 티어 우선** — 외부 의존성 최소화

---

## 아키텍처 한눈에 보기

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (React SPA)                     │
│  Home  ·  Explore  ·  Police Dashboard  ·  Ranking          │
└──────────────────────────────────────────────────────────────┘
                             │ HTTP (port 3000)
                             ▼
┌──────────────────────────────────────────────────────────────┐
│             Express Server (server.ts, tsx)                  │
│  ─ /api/analyze-horror  (multer + Gemini Vision)             │
│  ─ /api/hideouts        (범죄별 가중치 매칭)                  │
│  ─ /api/ghosts          (행정구 밀도 영체 생성)               │
│  ─ /api/safemap/wms     (safemap WMS 프록시)                 │
│  ─ /api/ranking, /api/my-stats, /api/spots, /api/analyze ... │
└──────────────────────────────────────────────────────────────┘
        │                      │                       │
        ▼                      ▼                       ▼
   SQLite (data.db)      Gemini Vision API     safemap.go.kr WMS
   ─ users               (이미지 → 6요소 점수)   (범죄주의구간 PNG)
   ─ horror_reports
   ─ ghost_spots
```

---

## 설치 방법

### 사전 요구사항
- **Node.js 20 이상**
- npm
- (선택) **GEMINI_API_KEY** — Google AI Studio에서 발급
- (선택) **SAFEMAP_API_KEY** — safemap.go.kr 마이페이지에서 인증키 발급

### 1) 저장소 클론 & 의존성 설치
```bash
git clone <repository-url>
cd hackerton
npm install
```

### 2) 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:

```env
# 필수 (없으면 AI 분석은 더미 점수로 폴백)
GEMINI_API_KEY=your_gemini_api_key_here

# 선택 (없으면 지도에 범죄주의구간 표시 안 됨)
SAFEMAP_API_KEY=your_safemap_service_key_here
```

> ⚠️ `.env`는 `.gitignore`에 등록되어 있어 절대 커밋되지 않습니다. **`.env.example`에 실키를 넣지 마세요** (그건 git에 추적됨).

### 3) 개발 서버 실행
```bash
npm run dev
```

서버가 시작되면 콘솔에 다음과 같이 표시됩니다:
```
Server running on http://localhost:3000
AI: Gemini 활성화
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

### 4) 프로덕션 빌드
```bash
npm run build      # → dist/
npm run preview    # 빌드 결과 미리보기
```

---

## 사용 방법

### 시민용 — 사각지대 제보
1. 메인 페이지에서 지도로 현재 위치·주변 영체 확인
2. **Explore** 탭 이동 → "사진 업로드 분석" 버튼
3. 의심 구역 사진 선택 → 자동으로 위치 + 주소 함께 전송
4. AI가 6개 환경 요소를 0-100으로 점수화하여 공포 등급(S/A/B/C) + 위험 점수 표시
5. 결과 확인 후 "사냥 개시" 버튼으로 인터랙션

### 경찰용 — 은닉 장소 추정
1. **PoliceDashboard** 탭 이동
2. "범죄 유형 기반 은닉 추정 장소 분석" 섹션
3. 프리셋 칩(절도·폭행·마약 등) 선택 또는 자유 입력
4. "추적 개시" → DB에 누적된 환경 분석 데이터 중 해당 범죄와 환경 패턴이 매칭되는 TOP 10 위치 반환

### API 호출 예시
```bash
# 영체 5마리 조회
curl http://localhost:3000/api/ghosts

# 절도 범죄 은닉 추정 장소 TOP 10
curl "http://localhost:3000/api/hideouts?crime=절도&limit=10"

# 사진 업로드 + AI 분석
curl -X POST http://localhost:3000/api/analyze-horror \
  -F "photo=@suspicious_alley.jpg" \
  -F "lat=35.2540" \
  -F "lng=128.6748" \
  -F "address=경상남도 창원시 의창구 봉림로"
```

---

## 프로젝트 구조

```
hackerton/
├── server.ts                  # Express 서버 (API + Vite 미들웨어)
├── db.ts                      # SQLite 초기화·스키마·시드
├── ai.ts                      # Gemini Vision 분석 모듈
├── ghosts.ts                  # 행정구 밀도 기반 영체 생성기
├── data.db                    # SQLite 파일 (자동 생성, gitignored)
├── uploads/                   # 업로드 사진 저장소 (gitignored)
├── .env                       # 환경 변수 (gitignored)
├── src/
│   ├── main.tsx              # React 진입점 + Leaflet CSS
│   ├── App.tsx               # 라우팅
│   ├── index.css             # Tailwind + 글로벌 스타일
│   └── pages/
│       ├── Home.tsx          # 메인: 지도 + 영체 + 대시보드
│       ├── Explore.tsx       # 사진 분석 + 카메라 스캔
│       ├── PoliceDashboard.tsx  # 경찰 관제 대시보드
│       ├── Ranking.tsx       # 헌터 랭킹
│       └── Alternate.tsx
└── vite.config.ts
```

### 데이터 모델 (SQLite)
- **`users`** — `id`, `name`, `cumulativeScore`, `averageBrightnessGrade`
- **`horror_reports`** — `id`, `userId`, `photoPath`, `scores(JSON)`, `horrorGrade`, `horrorScore`, `dangerScore`, `lat`, `lng`, `address`, `timestamp`
- **`ghost_spots`** — `id`, `userId`, `lat`, `lng`, `grade`, `createdAt`

서버 첫 실행 시 자동 시드:
- 'me' + 더미 에이전트 10명
- 창원 곳곳 가상 분석 리포트 10건 (대시보드 데모용)

---

## 점수 산출 공식

### AI 응답 (Gemini Vision)
```
{
  brightness:        0-100  (어두울수록 높음)
  abandoned:         0-100  (폐건물 정도)
  graffiti:          0-100  (낙서·훼손)
  lowPopulation:     0-100  (유동인구 부족)
  eerieEnvironment:  0-100  (음산함)
  structuralHazard:  0-100  (구조 위험)
  rationale:         한 문장 근거
}
```

### 서버 가중치 합산
```
공포도 (0-100)
  = 조도 × 0.30  +  폐건물 × 0.25  +  음산함 × 0.25  +  구조위험 × 0.20

위험도 (0-100)
  = 조도 × 0.20  +  폐건물 × 0.25  +  유동인구 × 0.15
  + 낙서 × 0.10  +  범죄프록시 × 0.30

공포 등급:  ≥80 = S,  ≥60 = A,  ≥40 = B,  그 외 C
```

### 범죄 유형별 은닉 매칭 (`/api/hideouts`)
```
절도:    폐건물(0.25) + 낙서(0.20) + 유동인구(0.30) + 조도(0.10) + 구조(0.15)
폭행:    조도(0.30) + 유동인구(0.30) + 음산함(0.20) + 구조(0.20)
마약:    폐건물(0.35) + 구조(0.25) + 유동인구(0.30) + 낙서(0.10)
성범죄:  조도(0.30) + 유동인구(0.35) + 폐건물(0.20) + 음산함(0.15)
도주:    폐건물(0.30) + 유동인구(0.25) + 구조(0.25) + 조도(0.20)
강도:    조도(0.25) + 유동인구(0.30) + 폐건물(0.20) + 구조(0.15) + 음산함(0.10)
방화:    폐건물(0.40) + 구조(0.25) + 유동인구(0.20) + 낙서(0.15)
```

---

## API 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| POST | `/api/analyze-horror` | 사진 업로드 + AI 분석 + DB 저장 |
| POST | `/api/analyze` | 환경 변수 기반 위험 점수 (사진 없음) |
| GET | `/api/ranking` | 누적 점수 TOP 10 |
| GET | `/api/my-stats` | 내 통계 |
| GET | `/api/my-reports` | 내 리포트 히스토리 |
| GET | `/api/spots` | 고스트 스팟 전체 |
| POST | `/api/spots` | 고스트 스팟 등록 |
| DELETE | `/api/spots` | 고스트 스팟 전체 삭제 |
| GET | `/api/hideouts?crime=&limit=` | 범죄별 은닉 추정 TOP N |
| GET | `/api/ghosts` | 행정구 밀도 영체 5마리 |
| POST | `/api/ghosts/respawn` | 영체 리스폰 |
| GET | `/api/safemap/wms` | 생활안전지도 WMS 프록시 |
| GET | `/api/hotspots` | (정적) 핫스팟 |

---

## 기여 방법

이 프로젝트는 **해커톤 프로토타입**으로 시작되어 적극적인 기여를 환영합니다.

### 기여 절차
1. 이슈 생성 또는 기존 이슈에 의견 추가
2. fork → feature 브랜치 생성 (`feat/your-feature` 또는 `fix/issue-num`)
3. 커밋 메시지는 한국어 또는 영어, 무엇을 왜 바꾸는지 한 줄로
4. PR 생성 시 변경 요약 + 스크린샷 (UI 변경 시)

### 개선 아이디어
- [ ] **safemap WFS** 연동 — WMS 이미지 대신 벡터 데이터로 정밀 점수 반영
- [ ] **사용자 인증** — 현재 단일 'me' 사용자, JWT/OAuth 도입
- [ ] **사진 클라우드 저장** — 로컬 `uploads/` 대신 S3/Supabase Storage
- [ ] **실시간 알림** — 고위험 영체 출현 시 WebSocket 푸시
- [ ] **다국어 지원** — i18n 적용

### 코딩 규칙
- TypeScript 엄격 모드 준수
- Tailwind 유틸리티 클래스 우선, 인라인 스타일 최소화
- 커밋 전 `npm run build`로 빌드 통과 확인
- 새 API 추가 시 README 표 갱신

---

## 라이선스

MIT License

이 프로젝트는 학습·연구·해커톤 목적으로 자유롭게 사용·수정·배포할 수 있습니다. 다만 다음 사항을 유의해주세요:

- **safemap.go.kr API**는 별도 이용약관을 따릅니다 — 상업적 사용 시 행정안전부 이용 가이드 확인 필수
- **Google Gemini API**는 Google AI Studio 약관을 따릅니다
- 본 프로젝트의 **범죄밀도 추정치**는 데모용 하드코딩으로, 실제 통계가 아닙니다

```
MIT License

Copyright (c) 2026 GHOST_NET Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

<div align="center">

**Built for 해커톤 2026** · Made with React, TypeScript, Express, Gemini Vision

</div>
