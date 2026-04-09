package com.medical.skeleton.domain.vital.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 바이탈 사인 엔티티 — vital_signs 테이블과 매핑.
 *
 * <p>간호사가 측정값을 입력할 때마다 새 행이 추가되는 시계열 데이터입니다.
 * 삭제·수정 없이 append-only로 운영합니다.</p>
 *
 * <p>저장 직후 {@link #isAbnormal()}로 이상 여부를 판단하고,
 * 이상 감지 시 {@link com.medical.skeleton.domain.vital.service.VitalSignService}가
 * {@link com.medical.skeleton.domain.alert.service.AlertService}를 통해 즉시 알림을 보냅니다.</p>
 *
 * <h3>정상 범위 기준</h3>
 * <ul>
 *   <li>체온: ≤ 38.0°C</li>
 *   <li>혈압 수축기: 90 ~ 140 mmHg</li>
 *   <li>산소포화도: ≥ 95%</li>
 *   <li>맥박: 60 ~ 100 bpm</li>
 * </ul>
 */
@Entity
@Table(name = "vital_signs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class VitalSign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    /** 체온 (°C) — 미측정 시 null */
    private Double temperature;

    /** 혈압 수축기 (mmHg) — 이완기와 함께 입력 권장 */
    @Column(name = "bp_systolic")
    private Integer bpSystolic;

    /** 혈압 이완기 (mmHg) */
    @Column(name = "bp_diastolic")
    private Integer bpDiastolic;

    /** 맥박 (bpm) */
    @Column(name = "heart_rate")
    private Integer heartRate;

    /** 산소포화도 (%) */
    @Column(name = "oxygen_saturation")
    private Integer oxygenSaturation;

    /** 호흡수 (회/분) */
    @Column(name = "respiratory_rate")
    private Integer respiratoryRate;

    /** 기록한 간호사 ID */
    @Column(name = "recorded_by", nullable = false)
    private Long recordedBy;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    /** 특이사항 메모 (선택) */
    @Column(length = 200)
    private String note;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }

    // ─── 도메인 메서드 ────────────────────────────────────────

    /**
     * 하나라도 이상 범위를 벗어나면 true 반환.
     * {@link com.medical.skeleton.domain.vital.service.VitalSignService#record} 에서
     * 저장 후 즉시 호출되어 알림 발송 여부를 결정합니다.
     */
    public boolean isAbnormal() {
        if (temperature != null && temperature > 38.0) return true;
        if (bpSystolic != null && (bpSystolic > 140 || bpSystolic < 90)) return true;
        if (oxygenSaturation != null && oxygenSaturation < 95) return true;
        if (heartRate != null && (heartRate > 100 || heartRate < 60)) return true;
        return false;
    }
}
