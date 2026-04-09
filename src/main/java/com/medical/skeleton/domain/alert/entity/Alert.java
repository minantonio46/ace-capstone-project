package com.medical.skeleton.domain.alert.entity;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 알림 이력 엔티티 — alerts 테이블과 매핑.
 *
 * <p>알림은 두 가지 경로로 생성됩니다:</p>
 * <ol>
 *   <li>실시간 감지 — 낙상({@code FALL_DETECTED}), 비정상 바이탈({@code ABNORMAL_VITAL})</li>
 *   <li>스케줄러 — 약물 투여 기한 초과({@code MEDICATION_OVERDUE}),
 *       투여 임박({@code MEDICATION_DUE_SOON})</li>
 * </ol>
 *
 * <p>알림 발생 시 {@link com.medical.skeleton.domain.alert.service.AlertService}가</p>
 * <ol>
 *   <li>이 엔티티를 DB에 저장 (이력 보존)</li>
 *   <li>WebSocket으로 해당 병동 간호사에게 실시간 푸시</li>
 * </ol>
 *
 * <p>간호사가 확인하면 {@link #resolve(Long)}를 호출해 resolved = true 로 변경합니다.</p>
 */
@Entity
@Table(name = "alerts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    /** 알림이 속한 병동 ID — WebSocket 구독 경로(/topic/ward/{wardId}/alerts)에 사용 */
    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    @Enumerated(EnumType.STRING)
    @Column(name = "alert_type", nullable = false)
    private AlertMessage.AlertType alertType;

    /** 심각도: INFO < WARNING < HIGH < CRITICAL */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertMessage.Severity severity;

    @Column(nullable = false, length = 300)
    private String message;

    /** 간호사가 확인 처리를 했는지 여부. 기본값 false */
    @Column(name = "is_resolved", nullable = false)
    private boolean resolved;

    /** 해결 처리한 사용자 ID */
    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @PrePersist
    protected void onCreate() {
        if (occurredAt == null) occurredAt = LocalDateTime.now();
        resolved = false;
    }

    // ─── 도메인 메서드 ────────────────────────────────────────

    /**
     * 알림 해결 처리.
     * {@code POST /api/alerts/{id}/resolve} 에서 호출됩니다.
     *
     * @param userId 해결 처리한 사용자(간호사) ID
     */
    public void resolve(Long userId) {
        this.resolved = true;
        this.resolvedBy = userId;
        this.resolvedAt = LocalDateTime.now();
    }
}
