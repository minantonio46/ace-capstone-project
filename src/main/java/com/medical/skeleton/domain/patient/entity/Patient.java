package com.medical.skeleton.domain.patient.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 환자 엔티티 — patients 테이블과 매핑.
 *
 * <p>환자 등록 시 status = ADMITTED로 시작하고,
 * 퇴원 처리 시 {@link #discharge()}를 호출해 DISCHARGED로 변경합니다.
 * 실제 DB 행은 삭제되지 않아 기록이 보존됩니다.</p>
 *
 * <p>병동(wardId)·담당의(doctorId)는 FK 대신 ID만 저장합니다.
 * 조인이 필요하면 서비스 계층에서 각 Repository를 통해 조회하세요.</p>
 */
@Entity
@Table(name = "patients")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // JPA 전용 — 외부에서 직접 new 금지, Builder 사용
@Builder
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    /** 성별: "M" (남성) / "F" (여성) */
    @Column(nullable = false, length = 1)
    private String gender;

    /** 소속 병동 ID — Ward 엔티티의 PK */
    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    /** 병상 번호 예) "302-1" (302호 첫 번째 병상) */
    @Column(name = "bed_number", nullable = false, length = 20)
    private String bedNumber;

    @Column(name = "admission_date", nullable = false)
    private LocalDate admissionDate;

    /** 퇴원일 — 입원 중에는 null */
    @Column(name = "discharge_date")
    private LocalDate dischargeDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PatientStatus status;

    /** 담당 의사 ID — User 엔티티의 PK (null 가능) */
    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ─── 도메인 메서드 ────────────────────────────────────────

    /**
     * 변경 가능한 기본 정보 수정.
     * 병동 이동이나 입원일 변경은 별도 처리 필요.
     */
    public void updateInfo(String name, String bedNumber, Long doctorId) {
        this.name = name;
        this.bedNumber = bedNumber;
        this.doctorId = doctorId;
    }

    /**
     * 퇴원 처리 — status를 DISCHARGED로 변경하고 퇴원일을 오늘로 설정.
     * DB 행은 삭제되지 않아 추후 이력 조회가 가능합니다.
     */
    public void discharge() {
        this.status = PatientStatus.DISCHARGED;
        this.dischargeDate = LocalDate.now();
    }

    public void updateStatus(PatientStatus status) {
        this.status = status;
    }
}
