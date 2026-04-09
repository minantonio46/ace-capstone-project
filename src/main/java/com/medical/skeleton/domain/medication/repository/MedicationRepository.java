package com.medical.skeleton.domain.medication.repository;

import com.medical.skeleton.domain.medication.entity.Medication;
import com.medical.skeleton.domain.medication.entity.MedicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicationRepository extends JpaRepository<Medication, Long> {
    List<Medication> findByPatientIdAndStatus(Long patientId, MedicationStatus status);
    List<Medication> findByPatientId(Long patientId);
}
