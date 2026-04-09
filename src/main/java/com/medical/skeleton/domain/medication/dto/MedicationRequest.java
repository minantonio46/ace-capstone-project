package com.medical.skeleton.domain.medication.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class MedicationRequest {
    @NotBlank
    private String drugName;

    @NotNull
    @Positive
    private Double dosage;

    private String unit;

    @NotNull
    @Positive
    private Integer intervalHours;

    @NotNull
    private LocalDateTime startAt;

    private LocalDateTime endAt;

    @NotNull
    private Long prescribedBy;
}
