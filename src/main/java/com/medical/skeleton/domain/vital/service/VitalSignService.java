package com.medical.skeleton.domain.vital.service;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import com.medical.skeleton.domain.alert.service.AlertService;
import com.medical.skeleton.domain.vital.dto.VitalRequest;
import com.medical.skeleton.domain.vital.entity.VitalSign;
import com.medical.skeleton.domain.vital.repository.VitalSignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 바이탈 사인 기록 및 조회 서비스.
 *
 * <h3>이상 감지 자동 알림</h3>
 * <p>바이탈을 저장한 직후 {@link VitalSign#isAbnormal()}로 정상 범위 초과 여부를 확인합니다.
 * 이상이 감지되면 {@link AlertService}를 통해 WebSocket으로 즉시 경고 알림을 보냅니다.</p>
 *
 * <pre>
 * POST /api/patients/{id}/vitals
 *     → VitalSign 저장
 *     → isAbnormal() 체크
 *     → 이상 시: AlertService.sendAlert(ABNORMAL_VITAL, HIGH)
 *             → DB 저장 + WebSocket 푸시 (/topic/ward/{wardId}/alerts)
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class VitalSignService {

    private final VitalSignRepository vitalSignRepository;
    private final AlertService alertService;

    /**
     * 바이탈 기록 저장.
     * 저장 후 이상 감지 시 자동으로 알림을 발송합니다.
     *
     * @return 저장된 VitalSign 엔티티
     */
    @Transactional
    public VitalSign record(Long patientId, VitalRequest request) {
        VitalSign vital = VitalSign.builder()
                .patientId(patientId)
                .temperature(request.getTemperature())
                .bpSystolic(request.getBpSystolic())
                .bpDiastolic(request.getBpDiastolic())
                .heartRate(request.getHeartRate())
                .oxygenSaturation(request.getOxygenSaturation())
                .respiratoryRate(request.getRespiratoryRate())
                .recordedBy(request.getRecordedBy())
                .recordedAt(LocalDateTime.now())
                .note(request.getNote())
                .build();

        VitalSign saved = vitalSignRepository.save(vital);

        // 정상 범위 초과 항목이 하나라도 있으면 즉시 경고 알림 발송
        if (saved.isAbnormal()) {
            alertService.sendAlert(
                    patientId,
                    AlertMessage.AlertType.ABNORMAL_VITAL,
                    AlertMessage.Severity.HIGH,
                    buildAbnormalMessage(saved)  // 어떤 항목이 이상인지 구체적으로 메시지 생성
            );
        }

        return saved;
    }

    /**
     * 가장 최근 바이탈 1건 조회.
     * 대시보드 화면에서 환자 요약 카드에 표시할 때 사용합니다.
     *
     * @throws IllegalArgumentException 바이탈 기록이 한 건도 없을 때
     */
    @Transactional(readOnly = true)
    public VitalSign getLatest(Long patientId) {
        return vitalSignRepository.findTopByPatientIdOrderByRecordedAtDesc(patientId)
                .orElseThrow(() -> new IllegalArgumentException("바이탈 기록이 없습니다."));
    }

    /**
     * 기간별 바이탈 이력 조회 (시계열 그래프용).
     * 오름차순(recordedAt ASC)으로 반환하므로 프론트에서 그대로 차트에 넣으면 됩니다.
     */
    @Transactional(readOnly = true)
    public List<VitalSign> getHistory(Long patientId, LocalDateTime from, LocalDateTime to) {
        return vitalSignRepository.findByPatientIdAndRecordedAtBetweenOrderByRecordedAtAsc(
                patientId, from, to);
    }

    // ─── private ────────────────────────────────────────────

    /**
     * 이상 항목을 나열한 알림 메시지를 조합합니다.
     * 예) "비정상 바이탈 감지: 체온 38.5°C 혈압 155/95 mmHg"
     */
    private String buildAbnormalMessage(VitalSign vital) {
        StringBuilder sb = new StringBuilder("비정상 바이탈 감지: ");
        if (vital.getTemperature() != null && vital.getTemperature() > 38.0)
            sb.append(String.format("체온 %.1f°C ", vital.getTemperature()));
        if (vital.getBpSystolic() != null && (vital.getBpSystolic() > 140 || vital.getBpSystolic() < 90))
            sb.append(String.format("혈압 %d/%d mmHg ", vital.getBpSystolic(), vital.getBpDiastolic()));
        if (vital.getOxygenSaturation() != null && vital.getOxygenSaturation() < 95)
            sb.append(String.format("산소포화도 %d%% ", vital.getOxygenSaturation()));
        if (vital.getHeartRate() != null && (vital.getHeartRate() > 100 || vital.getHeartRate() < 60))
            sb.append(String.format("맥박 %d bpm", vital.getHeartRate()));
        return sb.toString().trim();
    }
}
