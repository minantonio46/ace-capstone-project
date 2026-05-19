package com.medical.skeleton.domain.medication.dto;

import lombok.Getter;

/**
 * 약물 처방 수정 요청 DTO.
 * 모든 필드는 선택사항이며, null이면 해당 필드는 변경하지 않습니다.
 */
@Getter
public class UpdateMedicationRequest {
    private String  drugName;
    private Double  dosage;
    private String  unit;
    private Integer intervalHours;
}
