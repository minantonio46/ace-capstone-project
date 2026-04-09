package com.medical.skeleton.domain.camera.controller;

import com.medical.skeleton.domain.camera.entity.Camera;
import com.medical.skeleton.domain.camera.repository.CameraRepository;
import com.medical.skeleton.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "카메라 관리")
@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
public class CameraController {

    private final CameraRepository cameraRepository;

    @Operation(summary = "전체 카메라 목록")
    @GetMapping
    public ResponseEntity<ApiResponse<List<Camera>>> getCameras() {
        return ResponseEntity.ok(ApiResponse.ok(cameraRepository.findAll()));
    }

    @Operation(summary = "카메라에 환자 배정")
    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Camera>> assignPatient(
            @PathVariable Long id,
            @RequestParam Long patientId) {
        Camera camera = cameraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카메라를 찾을 수 없습니다: " + id));
        camera.assignPatient(patientId);
        return ResponseEntity.ok(ApiResponse.ok(cameraRepository.save(camera)));
    }

    @Operation(summary = "카메라 환자 배정 해제")
    @PostMapping("/{id}/unassign")
    public ResponseEntity<ApiResponse<Camera>> unassignPatient(@PathVariable Long id) {
        Camera camera = cameraRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("카메라를 찾을 수 없습니다: " + id));
        camera.unassignPatient();
        return ResponseEntity.ok(ApiResponse.ok(cameraRepository.save(camera)));
    }
}
