package com.medical.skeleton.domain.alert.controller;

import com.medical.skeleton.domain.alert.entity.Alert;
import com.medical.skeleton.domain.alert.repository.AlertRepository;
import com.medical.skeleton.domain.alert.service.AlertService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "알림 관리")
@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertRepository alertRepository;
    private final AlertService alertService;

    @Operation(summary = "병동 미해결 알림 목록")
    @GetMapping("/ward/{wardId}")
    public ResponseEntity<ApiResponse<List<Alert>>> getWardAlerts(@PathVariable Long wardId) {
        return ResponseEntity.ok(ApiResponse.ok(
                alertRepository.findByWardIdAndResolvedFalseOrderByOccurredAtDesc(wardId)));
    }

    @Operation(summary = "환자 미해결 알림 목록")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ApiResponse<List<Alert>>> getPatientAlerts(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.ok(
                alertRepository.findByPatientIdAndResolvedFalseOrderByOccurredAtDesc(patientId)));
    }

    @Operation(summary = "알림 해결 처리")
    @PostMapping("/{alertId}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolve(
            @PathVariable Long alertId,
            @RequestParam Long userId) {
        alertService.resolveAlert(alertId, userId);
        return ResponseEntity.ok(ApiResponse.ok("알림이 해결 처리되었습니다.", null));
    }
}
