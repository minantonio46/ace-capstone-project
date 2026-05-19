package com.medical.skeleton.domain.medication.controller;

import com.medical.skeleton.domain.medication.dto.AdministerRequest;
import com.medical.skeleton.domain.medication.dto.MedicationRequest;
import com.medical.skeleton.domain.medication.dto.UpdateMedicationRequest;
import com.medical.skeleton.domain.medication.entity.Medication;
import com.medical.skeleton.domain.medication.entity.MedicationRecord;
import com.medical.skeleton.domain.medication.service.MedicationService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "약물 관리")
@RestController
@RequestMapping("/api/patients/{patientId}/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;

    @Operation(summary = "현재 처방 약물 목록")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Medication>>> getMedications(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(medicationService.getActiveMedications(patientId)));
    }

    @Operation(summary = "약물 처방 추가")
    @PostMapping
    public ResponseEntity<ApiResponse<Medication>> prescribe(
            @PathVariable Long patientId,
            @Valid @RequestBody MedicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(medicationService.prescribe(patientId, request)));
    }

    @Operation(summary = "약물 투여 기록")
    @PostMapping("/{medicationId}/administer")
    public ResponseEntity<ApiResponse<MedicationRecord>> administer(
            @PathVariable Long patientId,
            @PathVariable Long medicationId,
            @Valid @RequestBody AdministerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(medicationService.administer(patientId, medicationId, request)));
    }

    @Operation(summary = "처방별 최근 투여 기록 조회 (시계 게이지용)")
    @GetMapping("/latest-records")
    public ResponseEntity<ApiResponse<List<MedicationRecord>>> getLatestRecords(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(
                medicationService.getLatestRecordsPerMedication(patientId)));
    }

    @Operation(summary = "약물 처방 수정")
    @PutMapping("/{medicationId}")
    public ResponseEntity<ApiResponse<Medication>> update(
            @PathVariable Long patientId,
            @PathVariable Long medicationId,
            @RequestBody UpdateMedicationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                medicationService.updateMedication(patientId, medicationId, request)));
    }

    @Operation(summary = "약물 처방 중단")
    @DeleteMapping("/{medicationId}")
    public ResponseEntity<ApiResponse<Void>> discontinue(
            @PathVariable Long patientId,
            @PathVariable Long medicationId) {
        medicationService.discontinueMedication(patientId, medicationId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @Operation(summary = "오늘 투여 스케줄")
    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<MedicationRecord>>> getSchedule(
            @PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(medicationService.getTodaySchedule(patientId)));
    }
}
