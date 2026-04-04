package com.medical.skeleton.domain.medication.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class AdministerRequest {
    @NotNull
    private Long administeredBy;  // 투여 간호사 ID

    private String note;
}
