package com.medical.skeleton.domain.alert.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AlertMessage {

    public enum AlertType {
        FALL_DETECTED,        // 낙상 감지
        NO_MOVEMENT,          // 장시간 움직임 없음
        MEDICATION_OVERDUE,   // 약물 투여 기한 초과
        MEDICATION_DUE_SOON,  // 투여 30분 전
        ABNORMAL_VITAL        // 비정상 바이탈
    }

    public enum Severity {
        INFO, WARNING, HIGH, CRITICAL
    }

    private AlertType type;
    private Long patientId;
    private String patientName;
    private String bedNumber;
    private String message;
    private Severity severity;
    private LocalDateTime occurredAt;
}
