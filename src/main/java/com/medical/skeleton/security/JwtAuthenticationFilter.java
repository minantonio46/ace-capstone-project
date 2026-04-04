package com.medical.skeleton.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 모든 HTTP 요청에서 JWT 토큰을 검사하는 필터.
 *
 * <p>{@link OncePerRequestFilter}를 상속하므로 한 요청에 정확히 한 번만 실행됩니다.</p>
 *
 * <p>처리 흐름:</p>
 * <ol>
 *   <li>요청 헤더 {@code Authorization: Bearer {token}} 에서 토큰 추출</li>
 *   <li>{@link JwtTokenProvider#validateToken}으로 토큰 유효성 검사</li>
 *   <li>유효하면 {@link JwtTokenProvider#getAuthentication}으로 Authentication 객체 생성</li>
 *   <li>SecurityContext에 등록 → 이후 컨트롤러에서 @AuthenticationPrincipal로 접근 가능</li>
 * </ol>
 *
 * <p>토큰이 없거나 유효하지 않으면 SecurityContext에 아무것도 등록하지 않고 다음 필터로 넘깁니다.
 * 인증이 필요한 엔드포인트는 {@link com.medical.skeleton.config.SecurityConfig}에서
 * 자동으로 401을 반환합니다.</p>
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            // SecurityContext에 인증 정보 등록 — 이 요청의 사용자가 누구인지 스프링이 인식
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Authorization 헤더에서 Bearer 토큰만 추출합니다.
     * 헤더가 없거나 "Bearer "로 시작하지 않으면 null 반환.
     */
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // "Bearer " (7글자) 이후 순수 토큰 문자열
        }
        return null;
    }
}
