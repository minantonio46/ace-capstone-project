package com.medical.skeleton.domain.medication.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 약물 투여 기록 엔티티 — medication_records 테이블과 매핑.
 *
 * <p>간호사가 {@code POST /api/patients/{id}/medications/{medId}/administer} 를 호출할 때마다
 * 1건씩 생성됩니다.</p>
 *
 * <h3>핵심 필드</h3>
 * <ul>
 *   <li>{@code administeredAt} — 실제 투여한 시각</li>
 *   <li>{@code nextDueAt}      — 다음 투여 예정 시각 = administeredAt + intervalHours</li>
 * </ul>
 *
 * <p>{@link com.medical.skeleton.domain.medication.scheduler.MedicationScheduler}가
 * 5분마다 nextDueAt을 기준으로 초과 투여를 감지하고 알림을 발송합니다.</p>
 */
@Entity
@Table(name = "medication_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MedicationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 처방 ID — Medication 엔티티의 PK */
    @Column(name = "medication_id", nullable = false)
    private Long medicationId;

    /** 환자 ID (빠른 조회를 위해 비정규화) */
    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    /** 약물명 (처방 변경에 대비해 투여 시점의 이름을 snapshot으로 저장) */
    @Column(name = "drug_name", nullable = false, length = 100)
    private String drugName;

    /** 실제 투여 용량 (처방 용량과 다를 수 있음) */
    @Column(nullable = false)
    private Double dosage;

    /** 실제 투여 시각 */
    @Column(name = "administered_at", nullable = false)
    private LocalDateTime administeredAt;

    /**
     * 다음 투여 예정 시각.
     * = administeredAt + Medication.intervalHours
     * 스케줄러가 이 값을 기준으로 기한 초과를 감지합니다.
     */
    @Column(name = "next_due_at")
    private LocalDateTime nextDueAt;

    /** 투여를 수행한 간호사 ID */
    @Column(name = "administered_by", nullable = false)
    private Long administeredBy;

    /** 투여 시 특이사항 메모 (선택) */
    @Column(length = 200)
    private String note;
}
