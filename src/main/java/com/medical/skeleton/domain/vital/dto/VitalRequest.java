package com.medical.skeleton.domain.vital.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class VitalRequest {
    private Double temperature;
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private Integer heartRate;
    private Integer oxygenSaturation;
    private Integer respiratoryRate;

    @NotNull
    private Long recordedBy;

    private String note;
}
