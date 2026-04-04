package com.medical.skeleton.domain.medication.scheduler;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import com.medical.skeleton.domain.alert.service.AlertService;
import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import com.medical.skeleton.domain.medication.repository.MedicationRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 약물 투여 기한 관련 스케줄러.
 *
 * <p>{@link com.medical.skeleton.SkeletonMedicalApplication}의
 * {@code @EnableScheduling}으로 활성화됩니다.</p>
 *
 * <h3>실행 주기 요약</h3>
 * <table border="1">
 *   <tr><th>메서드</th><th>주기</th><th>동작</th></tr>
 *   <tr><td>checkOverdueMedications</td><td>5분</td><td>기한 초과 감지 → WARNING 알림</td></tr>
 *   <tr><td>checkUpcomingMedications</td><td>10분</td><td>30분 내 투여 예정 → INFO 알림</td></tr>
 * </table>
 *
 * <p>fixedDelay 방식이므로 이전 실행이 끝난 후 지정 시간이 지나면 다음 실행을 시작합니다.
 * (fixedRate와 달리 처리가 오래 걸려도 중복 실행되지 않음)</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MedicationScheduler {

    private final MedicationRecordRepository medicationRecordRepository;
    private final AlertService alertService;

    /**
     * 투여 기한 초과 감지 — 5분마다 실행.
     *
     * <p>마지막 투여 기록의 {@code nextDueAt}이 현재 시각보다 이전인데
     * 그 이후에 새 투여 기록이 없는 케이스를 찾아 알림을 발송합니다.</p>
     *
     * <p>쿼리 로직은 {@link MedicationRecordRepository#findOverdueMedications}를 참고하세요.</p>
     */
    @Scheduled(fixedDelay = 300_000) // 300,000ms = 5분
    public void checkOverdueMedications() {
        LocalDateTime now = LocalDateTime.now();
        List<MedicationRecord> overdueList = medicationRecordRepository.findOverdueMedications(now);

        for (MedicationRecord record : overdueList) {
            long overdueMinutes = java.time.Duration.between(record.getNextDueAt(), now).toMinutes();
            log.warn("투여 기한 초과 - 환자 ID: {}, 약물: {}, {}분 초과",
                    record.getPatientId(), record.getDrugName(), overdueMinutes);

            alertService.sendAlert(
                    record.getPatientId(),
                    AlertMessage.AlertType.MEDICATION_OVERDUE,
                    AlertMessage.Severity.WARNING,
                    String.format("%s 투여 예정 시간이 %d분 초과되었습니다.",
                            record.getDrugName(), overdueMinutes)
            );
        }
    }

    /**
     * 투여 임박 알림 — 10분마다 실행.
     *
     * <p>지금으로부터 30분 이내에 {@code nextDueAt}이 도래하는 기록을 찾아
     * INFO 등급 알림을 발송합니다. 간호사가 미리 준비할 수 있도록 합니다.</p>
     */
    @Scheduled(fixedDelay = 600_000) // 600,000ms = 10분
    public void checkUpcomingMedications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusMinutes(30);

        // nextDueAt이 지금~30분 사이인 전체 환자 투여 기록 조회
        List<MedicationRecord> upcomingList = medicationRecordRepository
                .findByNextDueAtBetween(now, soon);

        for (MedicationRecord record : upcomingList) {
            long minutesLeft = java.time.Duration.between(now, record.getNextDueAt()).toMinutes();
            alertService.sendAlert(
                    record.getPatientId(),
                    AlertMessage.AlertType.MEDICATION_DUE_SOON,
                    AlertMessage.Severity.INFO,
                    String.format("%s 투여 예정 %d분 전입니다.", record.getDrugName(), minutesLeft)
            );
        }
    }
}
