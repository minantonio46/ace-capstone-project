package com.medical.skeleton.domain.camera.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * AI 서버로부터 수신한 스켈레톤 분석 이벤트 엔티티 — skeleton_events 테이블과 매핑.
 *
 * <p>AI 서버(COME-HVLM)가 CCTV 영상을 분석한 결과를
 * {@code POST /api/ai/skeleton-event} 로 전송하면 이 엔티티로 변환되어 저장됩니다.</p>
 *
 * <h3>이벤트 처리 흐름</h3>
 * <pre>
 * AI 서버 → POST /api/ai/skeleton-event
 *         → AiEventController
 *         → AiEventService
 *              ├── SkeletonEvent DB 저장 (이력 보존)
 *              ├── FALL_DETECTED → AlertService.sendAlert(CRITICAL)
 *              └── NO_MOVEMENT(30분+) → AlertService.sendAlert(WARNING)
 * </pre>
 *
 * <p>이벤트가 쌓이면 환자의 활동 패턴 분석 자료로도 활용할 수 있습니다.</p>
 */
@Entity
@Table(name = "skeleton_events")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class SkeletonEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** AI 서버가 보내는 카메라 식별 코드 예) "CAM_101" */
    @Column(name = "camera_code", nullable = false, length = 30)
    private String cameraCode;

    /**
     * 이벤트 대상 환자 ID.
     * AI 서버가 patientId를 직접 보내거나, 백엔드가 카메라 배정 정보에서 조회합니다.
     */
    @Column(name = "patient_id")
    private Long patientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    /** AI 모델의 예측 신뢰도 (0.0 ~ 1.0) */
    @Column(nullable = false)
    private Double confidence;

    /** AI 서버가 판단한 이벤트 발생 시각 (백엔드 수신 시각과 다를 수 있음) */
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    /**
     * 스켈레톤 분석 결과 이벤트 유형.
     *
     * <ul>
     *   <li>FALL_DETECTED — 낙상 감지 → 즉시 CRITICAL 알림</li>
     *   <li>NO_MOVEMENT   — 움직임 없음 → 30분 지속 시 WARNING 알림</li>
     *   <li>NORMAL        — 정상 활동</li>
     * </ul>
     */
    public enum EventType {
        FALL_DETECTED, NO_MOVEMENT, NORMAL
    }
}
