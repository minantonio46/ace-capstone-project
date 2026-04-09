package com.medical.skeleton.domain.camera.dto;

import com.medical.skeleton.domain.camera.entity.SkeletonEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class SkeletonEventRequest {
    @NotBlank
    private String cameraId;   // 명세서의 camera_id

    private Long patientId;

    @NotNull
    private SkeletonEvent.EventType eventType;

    @NotNull
    private LocalDateTime timestamp;

    @NotNull
    private Double confidence;
}
