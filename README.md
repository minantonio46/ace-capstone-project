# 스켈레톤 기반 의료 서비스 — 백엔드

> COME-HVLM 기반 병실 내 환자 시계열 데이터 수집 및 바이탈 기록 프로그램

---

## 프로젝트 개요

병실 CCTV에 COME-HVLM 기술을 적용해 환자의 외형을 가리고 움직임·상태만 분석한다.  
분석 결과를 백엔드가 수신해 체온·혈압·약물 투여 정보와 함께 간호사에게 실시간으로 제공한다.

```
CCTV 카메라
    ↓ 영상 스트림
AI 서버 (COME-HVLM · 스켈레톤 처리)
    ↓ 분석 결과 전송
Spring Boot 백엔드  ←→  MySQL
    ↓ REST API / WebSocket
간호사용 프론트엔드 앱
```

---

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프레임워크 | Spring Boot 3.2.3 / Java 17 |
| 인증 | Spring Security + JWT (jjwt 0.12.5) |
| 실시간 알림 | Spring WebSocket + STOMP |
| 스케줄러 | Spring `@Scheduled` |
| 데이터베이스 | MySQL 8 + JPA/Hibernate |
| API 문서 | Swagger UI (SpringDoc 2.3.0) |
| 빌드 도구 | Maven |

---

## 실행 방법

### 1. DB 생성
```sql
CREATE DATABASE medical_db CHARACTER SET utf8mb4;
```

### 2. 환경변수 설정 (또는 application.yml 직접 수정)
```bash
DB_USERNAME=root
DB_PASSWORD=비밀번호
JWT_SECRET=256비트이상의시크릿키
AI_API_KEY=AI서버용API키
```

### 3. 서버 실행
```bash
./mvnw spring-boot:run
```

### 4. Swagger UI 접속
```
http://localhost:8080/swagger-ui.html
```

---

## 프로젝트 구조

```
src/main/java/com/medical/skeleton/
├── SkeletonMedicalApplication.java     # 메인 클래스 (@EnableScheduling)
│
├── config/
│   ├── SecurityConfig.java             # JWT 필터 체인, 접근 권한 설정
│   ├── WebSocketConfig.java            # STOMP 엔드포인트 /ws
│   └── SwaggerConfig.java              # Swagger Bearer 인증 설정
│
├── security/
│   ├── JwtTokenProvider.java           # 토큰 생성·검증·파싱
│   ├── JwtAuthenticationFilter.java    # 요청마다 토큰 검사
│   └── CustomUserDetailsService.java   # DB에서 사용자 조회
│
├── domain/
│   ├── user/                           # 인증 (로그인·토큰 갱신)
│   ├── patient/                        # 환자 CRUD·퇴원 처리
│   ├── ward/                           # 병동·대시보드 API
│   ├── medication/                     # 처방·투여·스케줄러
│   ├── vital/                          # 바이탈 기록·이상 감지
│   ├── note/                           # 메모 CRUD
│   ├── alert/                          # 알림 저장·WebSocket 발송
│   └── camera/                         # CCTV 배정·AI 이벤트 수신
│
└── global/
    ├── dto/ApiResponse.java            # 공통 응답 포맷
    └── exception/GlobalExceptionHandler.java
```

---

## 구현 기능

### 1. 인증 / 인가
- Spring Security + JWT Stateless 인증
- Access Token (1시간) + Refresh Token (7일)
- 역할 분리: `NURSE` / `DOCTOR` / `ADMIN`
- 병동별 접근 제어 (담당 병동 환자만 조회)

```
POST /api/auth/login      로그인
POST /api/auth/refresh    토큰 갱신
POST /api/auth/logout     로그아웃
```

### 2. 환자 관리
- 환자 등록·수정·퇴원 처리 (소프트 삭제 — `status = DISCHARGED`)
- 병동별 입원 환자 목록 조회

```
GET    /api/patients?wardId=1    병동 환자 목록
GET    /api/patients/{id}        상세 조회
POST   /api/patients             환자 등록
PUT    /api/patients/{id}        정보 수정
DELETE /api/patients/{id}        퇴원 처리
```

### 3. 약물 관리 (핵심)
- 처방 등록 · 투여 기록 저장
- **중복 투여 방지** — 투여 주기 절반 이내 재투여 시 400 오류
- `next_due_at` 자동 계산 (`투여 시각 + 주기`)
- **스케줄러** — 5분마다 기한 초과 감지 → WARNING 알림 자동 발송
- **스케줄러** — 10분마다 30분 내 투여 예정 → INFO 알림 자동 발송

```
GET  /api/patients/{id}/medications                       처방 목록
POST /api/patients/{id}/medications                       처방 추가
POST /api/patients/{id}/medications/{mid}/administer      투여 기록
GET  /api/patients/{id}/medications/schedule              오늘 스케줄
```

### 4. 바이탈 관리
- 체온·혈압·맥박·산소포화도·호흡수 기록
- 저장 즉시 이상 범위 자동 판단 → WebSocket 경고 알림

| 항목 | 이상 범위 |
|---|---|
| 체온 | > 38.0°C |
| 혈압 수축기 | > 140 또는 < 90 mmHg |
| 산소포화도 | < 95% |
| 맥박 | > 100 또는 < 60 bpm |

```
POST /api/patients/{id}/vitals           바이탈 기록
GET  /api/patients/{id}/vitals/latest    최신 수치
GET  /api/patients/{id}/vitals/history   기간별 이력
```

### 5. 메모 관리
- 유형 구분: `PATIENT`(환자) / `GUARDIAN`(보호자) / `CAUTION`(주의사항)

```
GET    /api/patients/{id}/notes           목록
POST   /api/patients/{id}/notes           작성
PUT    /api/patients/{id}/notes/{nid}     수정
DELETE /api/patients/{id}/notes/{nid}     삭제
```

### 6. 실시간 알림 (WebSocket)
- STOMP 프로토콜, SockJS fallback 지원
- 구독 경로: `/topic/ward/{wardId}/alerts`
- 알림 발생 시 DB 저장 + WebSocket 동시 발송

| 알림 타입 | 트리거 | 심각도 |
|---|---|---|
| `FALL_DETECTED` | 낙상 감지 (AI 서버) | CRITICAL |
| `ABNORMAL_VITAL` | 비정상 바이탈 | HIGH |
| `MEDICATION_OVERDUE` | 투여 기한 초과 | WARNING |
| `NO_MOVEMENT` | 30분 이상 움직임 없음 | WARNING |
| `MEDICATION_DUE_SOON` | 투여 30분 전 | INFO |

```javascript
// 프론트엔드 연결 예시
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    client.subscribe('/topic/ward/1/alerts', msg => {
      const alert = JSON.parse(msg.body);
    });
  }
});
client.activate();
```

### 7. AI 서버 이벤트 수신
- AI 서버 전용 엔드포인트 (JWT 대신 `X-AI-API-Key` 헤더 인증)
- 이벤트 전량 DB 저장 (활동 패턴 분석 자료)
- `FALL_DETECTED` → 즉시 CRITICAL 알림
- `NO_MOVEMENT` 30분 지속 → WARNING 알림

```
POST /api/ai/skeleton-event
Header: X-AI-API-Key: {apiKey}

{
  "cameraId":   "CAM_101",
  "eventType":  "FALL_DETECTED",
  "timestamp":  "2026-04-01T14:30:00",
  "confidence": 0.95
}
```

### 8. 병동 대시보드
- 간호사 메인 화면용 병동 전체 현황 1개 API
- 환자별 최신 바이탈·다음 투여 예정·스켈레톤 상태·미해결 알림 수 포함

```
GET /api/wards/{wardId}/dashboard
```

```json
{
  "wardId": 1,
  "wardName": "3층 일반병동",
  "totalPatients": 12,
  "patients": [
    {
      "patientId": 1,
      "name": "홍길동",
      "bedNumber": "302-1",
      "latestVitals": { "bp": "130/85", "temperature": 37.2 },
      "nextMedication": { "drugName": "혈압약", "minutesLeft": 45 },
      "skeletonStatus": "NORMAL",
      "unresolvedAlerts": 0
    }
  ]
}
```

### 9. CCTV 카메라 관리

```
GET  /api/cameras                         카메라 목록
POST /api/cameras/{id}/assign?patientId=  환자 배정
POST /api/cameras/{id}/unassign           배정 해제
```

---

## API 문서

- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **상세 명세서**: `API_명세서_v1.0.docx`
- **ERD 설계**: `ERD_설계.md`

---

## 관련 문서

| 파일 | 내용 |
|---|---|
| `API_명세서_v1.0.docx` | 프론트엔드용 전체 API 명세 (Word) |
| `ERD_설계.md` | 테이블 설계 및 관계 설명 |
