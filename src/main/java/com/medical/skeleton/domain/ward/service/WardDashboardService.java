package com.medical.skeleton.domain.ward.service;

import com.medical.skeleton.domain.alert.repository.AlertRepository;
import com.medical.skeleton.domain.camera.entity.SkeletonEvent;
import com.medical.skeleton.domain.camera.repository.SkeletonEventRepository;
import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import com.medical.skeleton.domain.medication.repository.MedicationRecordRepository;
import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.entity.PatientStatus;
import com.medical.skeleton.domain.patient.repository.PatientRepository;
import com.medical.skeleton.domain.vital.entity.VitalSign;
import com.medical.skeleton.domain.vital.repository.VitalSignRepository;
import com.medical.skeleton.domain.ward.dto.DashboardResponse;
import com.medical.skeleton.domain.ward.entity.Ward;
import com.medical.skeleton.domain.ward.repository.WardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 병동 대시보드 API 서비스.
 *
 * <p>간호사 메인 화면({@code GET /api/wards/{wardId}/dashboard})에서
 * 병동 내 입원 환자 전체를 한 번에 조회할 때 사용합니다.</p>
 *
 * <h3>응답 구성 요소 (환자 1명당)</h3>
 * <ul>
 *   <li>최신 바이탈 — VitalSignRepository에서 최근 1건</li>
 *   <li>다음 투여 예정 약물 — 현재 시각 이후 nextDueAt이 가장 빠른 기록</li>
 *   <li>스켈레톤 상태 — SkeletonEventRepository에서 최근 이벤트 타입</li>
 *   <li>미해결 알림 수 — AlertRepository에서 resolved=false 카운트</li>
 * </ul>
 *
 * <p>각 정보를 N+1 쿼리로 조회합니다. 환자가 많아 성능 문제가 발생하면
 * Redis 캐싱 또는 JOIN 쿼리 최적화를 고려하세요.</p>
 */
@Service
@RequiredArgsConstructor
public class WardDashboardService {

    private final WardRepository wardRepository;
    private final PatientRepository patientRepository;
    private final VitalSignRepository vitalSignRepository;
    private final MedicationRecordRepository medicationRecordRepository;
    private final SkeletonEventRepository skeletonEventRepository;
    private final AlertRepository alertRepository;

    /**
     * 병동 전체 현황 조회.
     * 입원 중인 환자(ADMITTED)만 포함합니다.
     *
     * @throws IllegalArgumentException wardId에 해당하는 병동이 없을 때
     */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long wardId) {
        Ward ward = wardRepository.findById(wardId)
                .orElseThrow(() -> new IllegalArgumentException("병동을 찾을 수 없습니다: " + wardId));

        List<Patient> patients = patientRepository.findByWardIdAndStatus(wardId, PatientStatus.ADMITTED);

        List<DashboardResponse.PatientSummary> summaries = patients.stream()
                .map(this::buildPatientSummary)
                .toList();

        return DashboardResponse.builder()
                .wardId(wardId)
                .wardName(ward.getWardName())
                .totalPatients(patients.size())
                .patients(summaries)
                .build();
    }

    /**
     * 환자 1명의 요약 카드 데이터를 조합합니다.
     * 각 정보가 없을 경우 null로 처리 — 프론트에서 null 체크 필요.
     */
    private DashboardResponse.PatientSummary buildPatientSummary(Patient patient) {
        Long patientId = patient.getId();

        // 최신 바이탈 1건 (없으면 null)
        DashboardResponse.VitalSummary vitalSummary = vitalSignRepository
                .findTopByPatientIdOrderByRecordedAtDesc(patientId)
                .map(this::toVitalSummary)
                .orElse(null);

        // 현재 시각 이후 nextDueAt이 가장 빠른 투여 예정 (없으면 null)
        DashboardResponse.MedicationSummary medicationSummary = medicationRecordRepository
                .findByPatientIdOrderByAdministeredAtDesc(patientId)
                .stream()
                .filter(r -> r.getNextDueAt() != null && r.getNextDueAt().isAfter(LocalDateTime.now()))
                .findFirst()
                .map(this::toMedicationSummary)
                .orElse(null);

        // 가장 최근 스켈레톤 이벤트 타입 (없으면 NORMAL로 기본값 처리)
        SkeletonEvent.EventType skeletonStatus = skeletonEventRepository
                .findTopByPatientIdOrderByOccurredAtDesc(patientId)
                .map(SkeletonEvent::getEventType)
                .orElse(SkeletonEvent.EventType.NORMAL);

        // 미해결 알림 수 (대시보드 카드에 뱃지로 표시)
        long unresolvedAlerts = alertRepository.countByPatientIdAndResolvedFalse(patientId);

        return DashboardResponse.PatientSummary.builder()
                .patientId(patientId)
                .name(patient.getName())
                .bedNumber(patient.getBedNumber())
                .latestVitals(vitalSummary)
                .nextMedication(medicationSummary)
                .skeletonStatus(skeletonStatus)
                .unresolvedAlerts(unresolvedAlerts)
                .build();
    }

    /** VitalSign 엔티티 → 대시보드용 요약 DTO 변환 */
    private DashboardResponse.VitalSummary toVitalSummary(VitalSign vital) {
        // 혈압은 "수축기/이완기" 형태의 문자열로 합쳐서 전달
        String bp = (vital.getBpSystolic() != null && vital.getBpDiastolic() != null)
                ? vital.getBpSystolic() + "/" + vital.getBpDiastolic()
                : null;

        return DashboardResponse.VitalSummary.builder()
                .bp(bp)
                .temperature(vital.getTemperature())
                .oxygenSaturation(vital.getOxygenSaturation())
                .heartRate(vital.getHeartRate())
                .recordedAt(vital.getRecordedAt())
                .build();
    }

    /** MedicationRecord → 대시보드용 다음 투여 예정 DTO 변환 */
    private DashboardResponse.MedicationSummary toMedicationSummary(MedicationRecord record) {
        if (record.getNextDueAt() == null) return null;

        // 남은 시간(분) 계산 — 음수이면 이미 기한 초과
        long minutesLeft = Duration.between(LocalDateTime.now(), record.getNextDueAt()).toMinutes();

        return DashboardResponse.MedicationSummary.builder()
                .drugName(record.getDrugName())
                .minutesLeft(minutesLeft)
                .nextDueAt(record.getNextDueAt())
                .build();
    }
}
