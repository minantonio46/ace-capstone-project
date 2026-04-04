package com.medical.skeleton.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * 실시간 알림을 위한 WebSocket + STOMP 설정.
 *
 * <h3>프론트엔드 연결 방법</h3>
 * <pre>
 * // SockJS + @stomp/stompjs 라이브러리 사용
 * const client = new Client({
 *   webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
 *   onConnect: () => {
 *     // 병동 ID 1번의 알림 구독
 *     client.subscribe('/topic/ward/1/alerts', msg => {
 *       const alert = JSON.parse(msg.body);
 *     });
 *   }
 * });
 * client.activate();
 * </pre>
 *
 * <h3>알림 발송 흐름</h3>
 * {@link com.medical.skeleton.domain.alert.service.AlertService}가
 * {@code SimpMessagingTemplate.convertAndSend("/topic/ward/{wardId}/alerts", alertMessage)}
 * 를 호출 → 해당 병동을 구독한 모든 클라이언트에게 메시지 전달
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 메시지 브로커 설정.
     *
     * <ul>
     *   <li>{@code /topic} — 서버 → 클라이언트 단방향 브로드캐스트 경로 prefix</li>
     *   <li>{@code /app}   — 클라이언트 → 서버 메시지 전송 시 prefix (현재는 미사용)</li>
     * </ul>
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 서버가 클라이언트에게 메시지를 보낼 때 사용하는 prefix
        // 예) /topic/ward/1/alerts
        registry.enableSimpleBroker("/topic");
        // 클라이언트가 서버로 메시지를 보낼 때 사용하는 prefix (향후 확장용)
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * STOMP 연결 엔드포인트 등록.
     *
     * <p>SockJS를 통한 Fallback(롱폴링 등)을 지원해 WebSocket을 지원하지 않는
     * 환경에서도 동작합니다.</p>
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // 개발 환경 — 운영 시 도메인 지정 필요
                .withSockJS();
    }
}
