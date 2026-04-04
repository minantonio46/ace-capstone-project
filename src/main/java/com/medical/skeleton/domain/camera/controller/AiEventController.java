package com.medical.skeleton.domain.camera.controller;

import com.medical.skeleton.domain.camera.dto.SkeletonEventRequest;
import com.medical.skeleton.domain.camera.service.AiEventService;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "AI 서버 연동")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiEventController {

    private final AiEventService aiEventService;

    @Value("${ai-server.api-key}")
    private String aiApiKey;

    @Operation(summary = "스켈레톤 분석 이벤트 수신 (AI 서버 전용)")
    @PostMapping("/skeleton-event")
    public ResponseEntity<ApiResponse<Void>> receiveSkeletonEvent(
            @RequestHeader("X-AI-API-Key") String apiKey,
            @Valid @RequestBody SkeletonEventRequest request) {

        if (!aiApiKey.equals(apiKey)) {
            return ResponseEntity.status(403).body(ApiResponse.error("인증 실패"));
        }

        aiEventService.processSkeletonEvent(request);
        return ResponseEntity.ok(ApiResponse.ok("이벤트 처리 완료", null));
    }
}
