package com.medical.skeleton.domain.vital.controller;

import com.medical.skeleton.domain.vital.dto.VitalRequest;
import com.medical.skeleton.domain.vital.entity.VitalSign;
import com.medical.skeleton.domain.vital.service.VitalSignService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "바이탈 관리")
@RestController
@RequestMapping("/api/patients/{patientId}/vitals")
@RequiredArgsConstructor
public class VitalSignController {

    private final VitalSignService vitalSignService;

    @Operation(summary = "바이탈 기록")
    @PostMapping
    public ResponseEntity<ApiResponse<VitalSign>> record(
            @PathVariable Long patientId,
            @Valid @RequestBody VitalRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(vitalSignService.record(patientId, request)));
    }

    @Operation(summary = "최신 바이탈 조회")
    @GetMapping("/latest")
    public ResponseEntity<ApiResponse<VitalSign>> getLatest(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(vitalSignService.getLatest(patientId)));
    }

    @Operation(summary = "기간별 바이탈 이력 조회")
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<VitalSign>>> getHistory(
            @PathVariable Long patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(ApiResponse.ok(vitalSignService.getHistory(patientId, from, to)));
    }
}
