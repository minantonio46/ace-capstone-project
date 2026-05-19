package com.medical.skeleton.domain.medication.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 약물 처방 엔티티 — medications 테이블과 매핑.
 *
 * <p>의사가 환자에게 내린 처방 정보를 나타냅니다.
 * 실제 투여 기록은 {@link MedicationRecord}에 따로 저장됩니다.</p>
 *
 * <h3>주요 필드 관계</h3>
 * <pre>
 * Medication (처방 정보)
 *   └── MedicationRecord (실제 투여할 때마다 1건씩 생성)
 *         └── nextDueAt = 투여 시각 + intervalHours
 * </pre>
 *
 * <h3>처방 중단 방법</h3>
 * {@link #discontinue()} 호출 → status = DISCONTINUED, endAt = 현재 시각
 */
@Entity
@Table(name = "medications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 대상 환자 ID */
    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "drug_name", nullable = false, length = 100)
    private String drugName;

    /** 1회 투여 용량 */
    @Column(nullable = false)
    private Double dosage;

    /** 용량 단위 예) "mg", "ml" */
    @Column(length = 20)
    private String unit;

    /**
     * 투여 주기 (시간 단위).
     * 예) 8 → 8시간마다 투여
     * MedicationRecord 저장 시 nextDueAt = administeredAt + intervalHours
     */
    @Column(name = "interval_hours", nullable = false)
    private Integer intervalHours;

    /** 처방 시작일시 */
    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    /** 처방 종료일시 — null이면 의사가 중단할 때까지 계속 유효 */
    @Column(name = "end_at")
    private LocalDateTime endAt;

    /** 처방한 의사 ID */
    @Column(name = "prescribed_by", nullable = false)
    private Long prescribedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MedicationStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = MedicationStatus.ACTIVE;
    }

    // ─── 도메인 메서드 ────────────────────────────────────────

    /**
     * 처방 중단 처리.
     * status를 DISCONTINUED로 변경하고 종료일시를 현재로 설정합니다.
     * 이후 이 처방으로는 투여 기록을 추가할 수 없습니다.
     */
    public void discontinue() {
        this.status = MedicationStatus.DISCONTINUED;
        this.endAt = LocalDateTime.now();
    }

    /**
     * 처방 정보 수정.
     * null 값으로 전달된 항목은 변경하지 않습니다.
     */
    public void update(String drugName, Double dosage, String unit, Integer intervalHours) {
        if (drugName != null && !drugName.isBlank()) this.drugName = drugName;
        if (dosage != null && dosage > 0)            this.dosage = dosage;
        if (unit != null && !unit.isBlank())         this.unit = unit;
        if (intervalHours != null && intervalHours > 0) this.intervalHours = intervalHours;
    }
}
