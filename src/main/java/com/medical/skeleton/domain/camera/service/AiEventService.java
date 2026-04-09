package com.medical.skeleton.domain.camera.service;

import com.medical.skeleton.domain.alert.dto.AlertMessage;
import com.medical.skeleton.domain.alert.service.AlertService;
import com.medical.skeleton.domain.camera.dto.SkeletonEventRequest;
import com.medical.skeleton.domain.camera.entity.Camera;
import com.medical.skeleton.domain.camera.entity.SkeletonEvent;
import com.medical.skeleton.domain.camera.repository.CameraRepository;
import com.medical.skeleton.domain.camera.repository.SkeletonEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AI 서버로부터 스켈레톤 분석 이벤트를 수신·처리하는 서비스.
 *
 * <h3>호출 흐름</h3>
 * <pre>
 * AI 서버 → POST /api/ai/skeleton-event (X-AI-API-Key 헤더)
 *         → AiEventController
 *         → AiEventService.processSkeletonEvent()
 *              1. cameraCode로 Camera 조회 → assignedPatientId 확인
 *              2. SkeletonEvent DB 저장 (이력 보존)
 *              3. 이벤트 타입에 따라 알림 처리
 * </pre>
 *
 * <h3>이벤트 타입별 처리</h3>
 * <ul>
 *   <li>FALL_DETECTED — 즉시 CRITICAL 알림 발송</li>
 *   <li>NO_MOVEMENT   — 직전 30분간 연속으로 NO_MOVEMENT 이벤트가 쌓인 경우에만 WARNING 발송
 *                       (일시적 움직임 없음은 무시)</li>
 *   <li>NORMAL        — 아무 알림 없음</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiEventService {

    /** NO_MOVEMENT가 이 시간(분) 이상 지속되면 경고 알림 발송 */
    private static final int NO_MOVEMENT_THRESHOLD_MINUTES = 30;

    private final SkeletonEventRepository skeletonEventRepository;
    private final CameraRepository cameraRepository;
    private final AlertService alertService;

    /**
     * AI 서버로부터 수신한 이벤트를 처리합니다.
     *
     * <p>카메라에 배정된 환자가 없으면 이벤트를 무시하고 로그만 남깁니다.
     * 배정된 환자가 있으면 이벤트를 저장하고 타입에 따라 알림을 발송합니다.</p>
     *
     * @throws IllegalArgumentException 등록되지 않은 cameraCode일 때
     */
    @Transactional
    public void processSkeletonEvent(SkeletonEventRequest request) {
        // 카메라 코드로 카메라 조회 — 등록되지 않은 카메라면 예외
        Camera camera = cameraRepository.findByCameraCode(request.getCameraId())
                .orElseThrow(() -> new IllegalArgumentException("등록되지 않은 카메라: " + request.getCameraId()));

        Long patientId = camera.getAssignedPatientId();
        if (patientId == null) {
            // 카메라에 환자가 배정되지 않은 경우 — 이벤트 무시
            log.debug("카메라 {}에 배정된 환자 없음, 이벤트 무시", request.getCameraId());
            return;
        }

        // 모든 이벤트를 DB에 저장 (향후 활동 패턴 분석 자료로 활용)
        SkeletonEvent event = SkeletonEvent.builder()
                .cameraCode(request.getCameraId())
                .patientId(patientId)
                .eventType(request.getEventType())
                .confidence(request.getConfidence())
                .occurredAt(request.getTimestamp())
                .build();
        skeletonEventRepository.save(event);

        // 이벤트 타입에 따라 알림 처리
        switch (request.getEventType()) {
            case FALL_DETECTED ->
                // 낙상은 한 번이라도 감지되면 즉시 최고 등급 알림
                alertService.sendAlert(patientId,
                        AlertMessage.AlertType.FALL_DETECTED,
                        AlertMessage.Severity.CRITICAL,
                        "낙상이 감지되었습니다! 즉시 확인이 필요합니다.");

            case NO_MOVEMENT ->
                // 일시적 움직임 없음은 무시, 30분 이상 지속 시에만 경고
                checkProlonogedNoMovement(patientId, request.getTimestamp());

            case NORMAL ->
                log.debug("환자 {} 정상 상태", patientId);
        }
    }

    /**
     * NO_MOVEMENT 이벤트가 임계 시간 이상 지속되는지 확인.
     *
     * <p>현재 시각으로부터 {@value #NO_MOVEMENT_THRESHOLD_MINUTES}분 이전 이후의
     * NO_MOVEMENT 이벤트를 조회합니다.
     * 가장 이른 이벤트가 임계 시간 이전이면 "연속으로 감지된 것"으로 판단해 경고를 발송합니다.</p>
     *
     * @param patientId  대상 환자 ID
     * @param eventTime  현재 이벤트 발생 시각
     */
    private void checkProlonogedNoMovement(Long patientId, LocalDateTime eventTime) {
        LocalDateTime thresholdTime = eventTime.minusMinutes(NO_MOVEMENT_THRESHOLD_MINUTES);

        // 임계 시간 이후로 기록된 NO_MOVEMENT 이벤트 목록 조회
        List<SkeletonEvent> noMovementEvents = skeletonEventRepository
                .findByPatientIdAndEventTypeAndOccurredAtAfterOrderByOccurredAtAsc(
                        patientId, SkeletonEvent.EventType.NO_MOVEMENT, thresholdTime);

        if (!noMovementEvents.isEmpty()) {
            LocalDateTime firstEvent = noMovementEvents.get(0).getOccurredAt();
            // 가장 이른 이벤트가 임계 시각보다 같거나 이전이면 → 30분 이상 지속됨
            if (!firstEvent.isAfter(thresholdTime)) {
                alertService.sendAlert(patientId,
                        AlertMessage.AlertType.NO_MOVEMENT,
                        AlertMessage.Severity.WARNING,
                        NO_MOVEMENT_THRESHOLD_MINUTES + "분 이상 움직임이 감지되지 않습니다.");
            }
        }
    }
}
