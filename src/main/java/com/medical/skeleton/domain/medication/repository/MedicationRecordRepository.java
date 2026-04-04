package com.medical.skeleton.domain.medication.repository;

import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 약물 투여 기록 레포지토리.
 *
 * <p>가장 복잡한 쿼리는 {@link #findOverdueMedications}입니다.
 * 스케줄러가 5분마다 이 쿼리를 실행해 기한 초과 투여를 감지합니다.</p>
 */
public interface MedicationRecordRepository extends JpaRepository<MedicationRecord, Long> {

    /** 특정 환자의 전체 투여 기록 (최신순) */
    List<MedicationRecord> findByPatientIdOrderByAdministeredAtDesc(Long patientId);

    /**
     * 특정 처방의 가장 최근 투여 기록 1건.
     * 중복 투여 방지 체크 및 대시보드의 nextMedication 계산에 사용합니다.
     */
    Optional<MedicationRecord> findTopByMedicationIdOrderByAdministeredAtDesc(Long medicationId);

    /**
     * 투여 기한이 초과된 기록 조회 — 스케줄러 전용.
     *
     * <h4>로직 설명</h4>
     * <ul>
     *   <li>nextDueAt &lt; 현재시각 : 이미 기한이 지난 기록</li>
     *   <li>NOT EXISTS (이후 투여 기록) : 기한이 지난 후 새로 투여된 기록이 없음</li>
     * </ul>
     * 두 조건을 모두 만족하는 마지막 투여 기록을 오래된 순으로 반환합니다.
     *
     * @param now 현재 시각 (스케줄러에서 LocalDateTime.now() 전달)
     */
    @Query("""
        SELECT mr FROM MedicationRecord mr
        WHERE mr.nextDueAt < :now
          AND NOT EXISTS (
              SELECT 1 FROM MedicationRecord mr2
              WHERE mr2.medicationId = mr.medicationId
                AND mr2.administeredAt > mr.administeredAt
          )
        ORDER BY mr.nextDueAt ASC
    """)
    List<MedicationRecord> findOverdueMedications(@Param("now") LocalDateTime now);

    /** 특정 환자의 오늘 투여 스케줄 (nextDueAt 범위 조건) */
    List<MedicationRecord> findByPatientIdAndNextDueAtBetween(
            Long patientId, LocalDateTime start, LocalDateTime end);

    /** 전체 환자 대상 지정 시간대 투여 예정 기록 (스케줄러의 임박 알림에 사용) */
    List<MedicationRecord> findByNextDueAtBetween(LocalDateTime start, LocalDateTime end);
}
