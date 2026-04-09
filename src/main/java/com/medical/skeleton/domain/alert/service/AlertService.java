package com.medical.skeleton.domain.alert.service;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import com.medical.skeleton.domain.alert.entity.Alert;
import com.medical.skeleton.domain.alert.repository.AlertRepository;
import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 알림 발송 서비스 — 모든 알림의 진입점.
 *
 * <p>알림 발생이 필요한 모든 곳(스케줄러, VitalSignService, AiEventService)에서
 * 이 서비스의 {@link #sendAlert}를 호출합니다.</p>
 *
 * <h3>알림 처리 흐름</h3>
 * <pre>
 * sendAlert(patientId, type, severity, message)
 *   1. patients 테이블에서 환자명·병상번호·wardId 조회
 *   2. Alert 엔티티 생성 → alerts 테이블에 저장 (이력 보존)
 *   3. SimpMessagingTemplate으로 WebSocket 메시지 발행
 *      → 구독 경로: /topic/ward/{wardId}/alerts
 *      → 해당 병동을 구독 중인 모든 클라이언트에게 즉시 전달
 * </pre>
 *
 * <h3>알림 등급별 발생 시나리오</h3>
 * <ul>
 *   <li>CRITICAL — 낙상 감지 (AI 서버 → AiEventService)</li>
 *   <li>HIGH     — 비정상 바이탈 (VitalSignService)</li>
 *   <li>WARNING  — 약물 기한 초과, 장시간 움직임 없음 (스케줄러, AiEventService)</li>
 *   <li>INFO     — 약물 투여 30분 전 알림 (스케줄러)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertService {

    private final SimpMessagingTemplate messagingTemplate;
    private final AlertRepository alertRepository;
    private final PatientRepository patientRepository;

    /**
     * 알림을 DB에 저장하고 WebSocket으로 즉시 발송합니다.
     *
     * @param patientId 알림 대상 환자 ID
     * @param type      알림 유형 (AlertMessage.AlertType)
     * @param severity  심각도
     * @param message   간호사에게 표시될 메시지 내용
     */
    @Transactional
    public void sendAlert(Long patientId, AlertMessage.AlertType type,
                          AlertMessage.Severity severity, String message) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("환자를 찾을 수 없습니다: " + patientId));

        // 1. DB에 이력 저장
        Alert alert = Alert.builder()
                .patientId(patientId)
                .wardId(patient.getWardId())
                .alertType(type)
                .severity(severity)
                .message(message)
                .occurredAt(LocalDateTime.now())
                .build();
        alertRepository.save(alert);

        // 2. WebSocket 메시지 객체 생성 (프론트엔드에 전달될 JSON)
        AlertMessage alertMessage = AlertMessage.builder()
                .type(type)
                .patientId(patientId)
                .patientName(patient.getName())
                .bedNumber(patient.getBedNumber())
                .message(message)
                .severity(severity)
                .occurredAt(alert.getOccurredAt())
                .build();

        // 3. 해당 병동을 구독 중인 모든 클라이언트에게 브로드캐스트
        String destination = "/topic/ward/" + patient.getWardId() + "/alerts";
        messagingTemplate.convertAndSend(destination, alertMessage);

        log.info("알림 발송 - 병동: {}, 환자: {}, 타입: {}, 등급: {}",
                patient.getWardId(), patient.getName(), type, severity);
    }

    /**
     * 알림 해결 처리 — 간호사가 확인 후 호출.
     * resolved = true, resolvedBy, resolvedAt 업데이트.
     */
    @Transactional
    public void resolveAlert(Long alertId, Long userId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다: " + alertId));
        alert.resolve(userId);
    }
}
