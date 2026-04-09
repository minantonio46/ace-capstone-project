package com.medical.skeleton.domain.ward.dto;

import com.medical.skeleton.domain.camera.entity.SkeletonEvent;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class DashboardResponse {

    private Long wardId;
    private String wardName;
    private int totalPatients;
    private List<PatientSummary> patients;

    @Getter
    @Builder
    public static class PatientSummary {
        private Long patientId;
        private String name;
        private String bedNumber;
        private VitalSummary latestVitals;
        private MedicationSummary nextMedication;
        private SkeletonEvent.EventType skeletonStatus;
        private long unresolvedAlerts;
    }

    @Getter
    @Builder
    public static class VitalSummary {
        private String bp;           // "130/85"
        private Double temperature;
        private Integer oxygenSaturation;
        private Integer heartRate;
        private LocalDateTime recordedAt;
    }

    @Getter
    @Builder
    public static class MedicationSummary {
        private String drugName;
        private long minutesLeft;
        private LocalDateTime nextDueAt;
    }
}
