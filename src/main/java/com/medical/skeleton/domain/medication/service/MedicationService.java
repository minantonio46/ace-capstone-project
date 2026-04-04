package com.medical.skeleton.domain.medication.service;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import com.medical.skeleton.domain.alert.service.AlertService;
import com.medical.skeleton.domain.medication.dto.AdministerRequest;
import com.medical.skeleton.domain.medication.dto.MedicationRequest;
import com.medical.skeleton.domain.medication.entity.Medication;
import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import com.medical.skeleton.domain.medication.entity.MedicationStatus;
import com.medical.skeleton.domain.medication.repository.MedicationRecordRepository;
import com.medical.skeleton.domain.medication.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 약물 처방 및 투여 기록 서비스.
 *
 * <h3>핵심 비즈니스 규칙</h3>
 * <ol>
 *   <li>중단된 처방({@code DISCONTINUED})에는 투여 기록을 추가할 수 없습니다.</li>
 *   <li>투여 주기의 절반보다 짧은 간격으로 재투여 시 400 오류를 반환합니다.
 *       (예: 8시간 주기 약물 → 4시간 이내 재투여 차단)</li>
 *   <li>투여 기록 저장 시 {@code nextDueAt}을 자동 계산합니다.</li>
 * </ol>
 *
 * <p>투여 기한 초과 감지는 이 서비스가 아닌
 * {@link com.medical.skeleton.domain.medication.scheduler.MedicationScheduler}가
 * 5분마다 자동 수행합니다.</p>
 */
@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final MedicationRecordRepository medicationRecordRepository;
    private final AlertService alertService;

    /**
     * 현재 활성 처방 약물 목록 조회.
     * 중단된 처방은 포함하지 않습니다.
     */
    @Transactional(readOnly = true)
    public List<Medication> getActiveMedications(Long patientId) {
        return medicationRepository.findByPatientIdAndStatus(patientId, MedicationStatus.ACTIVE);
    }

    /**
     * 신규 약물 처방 등록 (의사 권한).
     * 처방 직후 첫 투여는 별도로 {@link #administer}를 호출해야 합니다.
     */
    @Transactional
    public Medication prescribe(Long patientId, MedicationRequest request) {
        Medication medication = Medication.builder()
                .patientId(patientId)
                .drugName(request.getDrugName())
                .dosage(request.getDosage())
                .unit(request.getUnit())
                .intervalHours(request.getIntervalHours())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .prescribedBy(request.getPrescribedBy())
                .status(MedicationStatus.ACTIVE)
                .build();
        return medicationRepository.save(medication);
    }

    /**
     * 약물 투여 기록 저장.
     *
     * <h4>처리 순서</h4>
     * <ol>
     *   <li>처방 유효성 확인 (존재 여부, 대상 환자 일치, 활성 상태)</li>
     *   <li>중복 투여 방지 — 마지막 투여 후 주기의 절반 이내면 예외 발생</li>
     *   <li>MedicationRecord 저장 (administeredAt = 지금, nextDueAt = 지금 + intervalHours)</li>
     * </ol>
     *
     * @throws IllegalArgumentException 처방을 찾을 수 없거나 대상 환자 불일치
     * @throws IllegalStateException    중단된 처방이거나 재투여 간격 미달
     */
    @Transactional
    public MedicationRecord administer(Long patientId, Long medicationId, AdministerRequest request) {
        Medication medication = medicationRepository.findById(medicationId)
                .orElseThrow(() -> new IllegalArgumentException("약물 처방을 찾을 수 없습니다: " + medicationId));

        if (!medication.getPatientId().equals(patientId)) {
            throw new IllegalArgumentException("해당 환자의 처방이 아닙니다.");
        }

        if (medication.getStatus() != MedicationStatus.ACTIVE) {
            throw new IllegalStateException("중단된 처방입니다.");
        }

        // 중복 투여 방지 — 주기의 절반(최소 안전 간격) 이내면 차단
        // 예) 8시간 주기 → 마지막 투여 후 4시간 이내 재투여 시 오류
        medicationRecordRepository.findTopByMedicationIdOrderByAdministeredAtDesc(medicationId)
                .ifPresent(lastRecord -> {
                    LocalDateTime minNextTime = lastRecord.getAdministeredAt()
                            .plusHours(medication.getIntervalHours() / 2L);
                    if (LocalDateTime.now().isBefore(minNextTime)) {
                        throw new IllegalStateException(
                                "이전 투여 후 너무 짧은 시간입니다. 다음 최소 투여 가능 시간: " + minNextTime);
                    }
                });

        LocalDateTime administeredAt = LocalDateTime.now();
        // 다음 투여 예정 시각 자동 계산 — 스케줄러가 이 값으로 기한 초과를 판단
        LocalDateTime nextDueAt = administeredAt.plusHours(medication.getIntervalHours());

        MedicationRecord record = MedicationRecord.builder()
                .medicationId(medicationId)
                .patientId(patientId)
                .drugName(medication.getDrugName())
                .dosage(medication.getDosage())
                .administeredAt(administeredAt)
                .nextDueAt(nextDueAt)
                .administeredBy(request.getAdministeredBy())
                .note(request.getNote())
                .build();

        return medicationRecordRepository.save(record);
    }

    /**
     * 오늘 투여 스케줄 조회.
     * nextDueAt이 오늘(00:00 ~ 23:59) 범위인 기록을 반환합니다.
     */
    @Transactional(readOnly = true)
    public List<MedicationRecord> getTodaySchedule(Long patientId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return medicationRecordRepository.findByPatientIdAndNextDueAtBetween(
                patientId, startOfDay, endOfDay);
    }
}
