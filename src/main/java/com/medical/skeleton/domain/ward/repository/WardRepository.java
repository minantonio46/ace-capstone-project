package com.medical.skeleton.domain.ward.repository;

import com.medical.skeleton.domain.ward.entity.Ward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WardRepository extends JpaRepository<Ward, Long> {
    Optional<Ward> findByWardCode(String wardCode);
}
