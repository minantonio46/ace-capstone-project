package com.medical.skeleton.security;

import com.medical.skeleton.domain.user.entity.User;
import com.medical.skeleton.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Spring Security가 인증 시 사용자 정보를 조회하는 서비스.
 *
 * <p>Spring Security 내부에서 username으로 {@link UserDetails}를 로드할 때 호출됩니다.
 * 직접 호출하는 일은 거의 없고, {@link JwtTokenProvider#getAuthentication} 에서
 * 토큰에 담긴 username으로 DB 조회할 때 사용됩니다.</p>
 *
 * <p>역할(Role)은 Spring Security 관례에 따라 "ROLE_" 접두사를 붙여 등록합니다.
 * 예) NURSE → ROLE_NURSE → @PreAuthorize("hasRole('NURSE')") 에서 체크됨</p>
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * @throws UsernameNotFoundException DB에 해당 username이 없을 때
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                // Role enum → "ROLE_NURSE" 형태로 권한 등록
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
}
