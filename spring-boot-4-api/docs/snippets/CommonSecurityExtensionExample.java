// CANONICAL pattern for extending <<org>>-common-security.
// 99% of the time you do NOTHING here — security is fully configured by the lib.
// This file shows the RARE cases.

// =====================================================================
// Case 1: configure the lib via properties (the default — preferred).
// No Java code at all. Just application.yml:
// =====================================================================
/*
<<org-prefix>>:
  security:
    audience: api://<<service-name>>
    issuer-uri: https://login.microsoftonline.com/<tenant>/v2.0
    public-paths:
      - /actuator/health
      - /actuator/prometheus
      - /v3/api-docs/**
      - /swagger-ui/**
    cors:
      allowed-origins:
        - https://app.example.com
      allowed-methods: [GET, POST, PUT, PATCH, DELETE]
      allowed-headers: [Authorization, Content-Type, Idempotency-Key]
      max-age: 3600
    method-security:
      enabled: true
*/

// =====================================================================
// Case 2: register a SpEL bean used inside @PreAuthorize (allowed,
// no SecurityFilterChain involved).
// =====================================================================
package <<org>>.<<service_name>>.config;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import <<org>>.<<service_name>>.application.port.OrderRepository;

import java.util.UUID;

@Component("accessGuard")
public class AccessGuard {
    private final OrderRepository repo;

    public AccessGuard(OrderRepository repo) { this.repo = repo; }

    public boolean canRead(UUID orderId, Authentication auth) {
        return repo.findById(orderId)
            .map(o -> o.customerId().toString().equals(auth.getName()))
            .orElse(false);
    }
}
// Usage: @PreAuthorize("@accessGuard.canRead(#orderId, authentication)")

// =====================================================================
// Case 3: a NARROW service-local SecurityFilterChain for a special path.
// Allowed only with the @AllowLocalSecurityFilterChain marker AND a linked ADR.
// =====================================================================
/*
@Configuration
@AllowLocalSecurityFilterChain  // marker; CI gate fails without it. Document in docs/adr/NNN-*.md
public class WebhookSecurityConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    SecurityFilterChain webhookChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/v1/webhooks/**")  // narrow!
            .csrf(CsrfConfigurer::disable)
            .authorizeHttpRequests(a -> a.anyRequest().permitAll())
            .addFilterBefore(new HmacSignatureFilter(), UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
*/

// =====================================================================
// BANNED — every one of these is a bug:
// =====================================================================
/*
- Service-local SecurityFilterChain without @AllowLocalSecurityFilterChain marker + ADR.
- Service-local SecurityFilterChain that overrides the lib's chain globally
  (no securityMatcher) — would silently disable JWT validation.
- Custom JwtDecoder (skips lib's audience/issuer validation).
- Custom CorsFilter when <<org-prefix>>.security.cors.* would suffice.
- WebSecurityConfigurerAdapter (removed in Spring Security 6+).
- @EnableGlobalMethodSecurity (use @EnableMethodSecurity inside the lib's config).
*/
