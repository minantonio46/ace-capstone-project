package com.medical.skeleton.domain.alert.repository;

import com.medical.skeleton.domain.alert.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByWardIdAndResolvedFalseOrderByOccurredAtDesc(Long wardId);
    List<Alert> findByPatientIdAndResolvedFalseOrderByOccurredAtDesc(Long patientId);
    long countByPatientIdAndResolvedFalse(Long patientId);
}
