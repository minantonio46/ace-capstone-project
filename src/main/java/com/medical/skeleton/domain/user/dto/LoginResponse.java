package com.medical.skeleton.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String username;
    private String name;
    private String role;
    private Long wardId;
    private Long userId;
}
