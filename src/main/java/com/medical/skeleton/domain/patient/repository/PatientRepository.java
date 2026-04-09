package com.medical.skeleton.domain.patient.repository;

import com.medical.skeleton.domain.patient.entity.Patient;
import com.medical.skeleton.domain.patient.entity.PatientStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    List<Patient> findByWardIdAndStatus(Long wardId, PatientStatus status);
    List<Patient> findByWardId(Long wardId);
}
