package com.medical.skeleton.domain.ward.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Ward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String wardCode;   // ex: W_3F

    @Column(nullable = false, length = 50)
    private String wardName;   // ex: 3층 일반병동

    @Column(nullable = false)
    private Integer floor;

    @Column(length = 100)
    private String description;
}
