package com.medical.skeleton.domain.camera.repository;

import com.medical.skeleton.domain.camera.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CameraRepository extends JpaRepository<Camera, Long> {
    Optional<Camera> findByCameraCode(String cameraCode);
    List<Camera> findByWardId(Long wardId);
    Optional<Camera> findByAssignedPatientId(Long patientId);
}
