package com.medical.skeleton.domain.vital.repository;

import com.medical.skeleton.domain.vital.entity.VitalSign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface VitalSignRepository extends JpaRepository<VitalSign, Long> {
    Optional<VitalSign> findTopByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<VitalSign> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<VitalSign> findByPatientIdAndRecordedAtBetweenOrderByRecordedAtAsc(
            Long patientId, LocalDateTime from, LocalDateTime to);
}
