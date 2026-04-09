package com.medical.skeleton.domain.ward.controller;

import com.medical.skeleton.domain.ward.dto.DashboardResponse;
import com.medical.skeleton.domain.ward.service.WardDashboardService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "병동 대시보드")
@RestController
@RequestMapping("/api/wards")
@RequiredArgsConstructor
public class WardController {

    private final WardDashboardService wardDashboardService;

    @Operation(summary = "병동 대시보드 조회")
    @GetMapping("/{wardId}/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(@PathVariable Long wardId) {
        return ResponseEntity.ok(ApiResponse.ok(wardDashboardService.getDashboard(wardId)));
    }
}
