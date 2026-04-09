package com.medical.skeleton.domain.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class PatientRequest {
    @NotBlank
    private String name;

    @NotNull
    private LocalDate birthDate;

    @NotBlank
    private String gender;

    @NotNull
    private Long wardId;

    @NotBlank
    private String bedNumber;

    @NotNull
    private LocalDate admissionDate;

    private Long doctorId;
}
