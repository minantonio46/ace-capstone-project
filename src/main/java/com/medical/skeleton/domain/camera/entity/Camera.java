package com.medical.skeleton.domain.camera.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cameras")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Camera {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String cameraCode;   // ex: CAM_101

    @Column(name = "ward_id", nullable = false)
    private Long wardId;

    @Column(length = 50)
    private String location;    // ex: 302호

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CameraStatus status;

    // 현재 배정된 환자 (null이면 미배정)
    @Column(name = "assigned_patient_id")
    private Long assignedPatientId;

    public void assignPatient(Long patientId) {
        this.assignedPatientId = patientId;
    }

    public void unassignPatient() {
        this.assignedPatientId = null;
    }

    public void updateStatus(CameraStatus status) {
        this.status = status;
    }
}
