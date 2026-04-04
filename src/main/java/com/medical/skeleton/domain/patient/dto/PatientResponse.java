package com.medical.skeleton.domain.patient.dto;

import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.entity.PatientStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class PatientResponse {
    private Long id;
    private String name;
    private LocalDate birthDate;
    private String gender;
    private Long wardId;
    private String bedNumber;
    private LocalDate admissionDate;
    private LocalDate dischargeDate;
    private PatientStatus status;
    private Long doctorId;
    private LocalDateTime createdAt;

    public static PatientResponse from(Patient patient) {
        return PatientResponse.builder()
                .id(patient.getId())
                .name(patient.getName())
                .birthDate(patient.getBirthDate())
                .gender(patient.getGender())
                .wardId(patient.getWardId())
                .bedNumber(patient.getBedNumber())
                .admissionDate(patient.getAdmissionDate())
                .dischargeDate(patient.getDischargeDate())
                .status(patient.getStatus())
                .doctorId(patient.getDoctorId())
                .createdAt(patient.getCreatedAt())
                .build();
    }
}
