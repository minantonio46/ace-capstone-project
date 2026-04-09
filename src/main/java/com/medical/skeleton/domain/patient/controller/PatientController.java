package com.medical.skeleton.domain.patient.controller;

import com.medical.skeleton.domain.patient.dto.PatientRequest;
import com.medical.skeleton.domain.patient.dto.PatientResponse;
import com.medical.skeleton.domain.patient.service.PatientService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "환자 관리")
@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    @Operation(summary = "병동 환자 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PatientResponse>>> getPatients(
            @RequestParam Long wardId) {
        return ResponseEntity.ok(ApiResponse.ok(patientService.getPatientsByWard(wardId)));
    }

    @Operation(summary = "환자 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientResponse>> getPatient(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(patientService.getPatient(id)));
    }

    @Operation(summary = "환자 등록")
    @PostMapping
    public ResponseEntity<ApiResponse<PatientResponse>> register(
            @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(patientService.register(request)));
    }

    @Operation(summary = "환자 정보 수정")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PatientResponse>> update(
            @PathVariable Long id, @Valid @RequestBody PatientRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(patientService.update(id, request)));
    }

    @Operation(summary = "퇴원 처리")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> discharge(@PathVariable Long id) {
        patientService.discharge(id);
        return ResponseEntity.ok(ApiResponse.ok("퇴원 처리되었습니다.", null));
    }
}
