package com.medical.skeleton.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 토큰 생성 · 검증 · 파싱을 담당하는 컴포넌트.
 *
 * <p>로그인 성공 시 {@link #createAccessToken}으로 Access Token을,
 * {@link #createRefreshToken}으로 Refresh Token을 발급합니다.</p>
 *
 * <p>이후 모든 API 요청에서 {@link JwtAuthenticationFilter}가 이 클래스의
 * {@link #validateToken}·{@link #getAuthentication}을 호출해 인증 처리합니다.</p>
 *
 * <pre>
 * 토큰 흐름:
 *   로그인 → Access Token(1시간) + Refresh Token(7일) 발급
 *   API 요청 → Authorization: Bearer {accessToken} 헤더 확인
 *   Access Token 만료 → POST /api/auth/refresh 로 재발급
 * </pre>
 *
 * 설정값 위치: application.yml → jwt.secret / jwt.access-token-expiration / jwt.refresh-token-expiration
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final CustomUserDetailsService userDetailsService;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration,
            CustomUserDetailsService userDetailsService) {
        // HMAC-SHA256 키 생성 (secret은 256비트 이상이어야 함)
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Access Token 발급.
     * payload에 username과 role(NURSE/DOCTOR/ADMIN)을 담습니다.
     *
     * @param username 사용자 아이디
     * @param role     사용자 역할 (예: "NURSE")
     * @return 서명된 JWT 문자열
     */
    public String createAccessToken(String username, String role) {
        return buildToken(username, role, accessTokenExpiration);
    }

    /**
     * Refresh Token 발급.
     * Access Token 재발급에만 사용하므로 role 클레임은 포함하지 않습니다.
     *
     * @param username 사용자 아이디
     * @return 서명된 JWT 문자열
     */
    public String createRefreshToken(String username) {
        return buildToken(username, null, refreshTokenExpiration);
    }

    /**
     * JWT 토큰에서 Spring Security Authentication 객체를 생성합니다.
     * {@link JwtAuthenticationFilter}가 SecurityContext에 등록할 때 사용합니다.
     */
    public Authentication getAuthentication(String token) {
        String username = getUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        return new UsernamePasswordAuthenticationToken(userDetails, "", userDetails.getAuthorities());
    }

    /**
     * 토큰 payload의 subject(username) 추출.
     */
    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * 토큰 유효성 검증.
     * 만료·위변조·형식 오류 등을 모두 체크합니다.
     *
     * @return 유효하면 true, 그 외 false
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("만료된 JWT 토큰: {}", e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("유효하지 않은 JWT 토큰: {}", e.getMessage());
        }
        return false;
    }

    // ─── private ────────────────────────────────────────────

    private String buildToken(String username, String role, long expiration) {
        Date now = new Date();
        JwtBuilder builder = Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(secretKey);

        if (role != null) {
            builder.claim("role", role);
        }

        return builder.compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
