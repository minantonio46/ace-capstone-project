package com.medical.skeleton.domain.camera.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.medical.skeleton.domain.camera.service.SkeletonDataService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Skeleton data")
@RestController
@RequestMapping("/api/skeleton")
@RequiredArgsConstructor
public class SkeletonDataController {

    private final SkeletonDataService skeletonDataService;

    @Operation(summary = "Decrypt and return authenticated skeleton data")
    @GetMapping("/{dataId}")
    public ResponseEntity<ApiResponse<JsonNode>> getSkeletonData(@PathVariable String dataId) {
        return ResponseEntity.ok(ApiResponse.ok(skeletonDataService.load(dataId)));
    }
}
