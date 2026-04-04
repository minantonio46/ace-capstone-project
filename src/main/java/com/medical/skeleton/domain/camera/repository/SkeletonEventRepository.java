package com.medical.skeleton.domain.camera.repository;

import com.medical.skeleton.domain.camera.entity.SkeletonEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SkeletonEventRepository extends JpaRepository<SkeletonEvent, Long> {
    Optional<SkeletonEvent> findTopByPatientIdOrderByOccurredAtDesc(Long patientId);

    // NO_MOVEMENT 이벤트가 특정 시간 이후에도 계속되는지 확인
    List<SkeletonEvent> findByPatientIdAndEventTypeAndOccurredAtAfterOrderByOccurredAtAsc(
            Long patientId, SkeletonEvent.EventType eventType, LocalDateTime after);
}
