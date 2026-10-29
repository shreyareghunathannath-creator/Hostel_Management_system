package com.hostelease.hms.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostelease.hms.auth.dto.LoginResponse;
import com.hostelease.hms.user.UserAccount;
import java.io.IOException;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
public class SecurityConfig {

    private final ObjectMapper objectMapper;

    public SecurityConfig(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CookieCsrfTokenRepository csrfTokenRepository() {
        CookieCsrfTokenRepository repository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        repository.setCookiePath("/");
        return repository;
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CookieCsrfTokenRepository csrfTokenRepository) throws Exception {
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();
        csrfRequestHandler.setCsrfRequestAttributeName(null);

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(csrfRequestHandler))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(fixation -> fixation.migrateSession()))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/", "/index.html", "/signup.html", "/forgot-password.html",
                                "/css/**", "/js/**", "/favicon.ico")
                        .permitAll()
                        .requestMatchers("/admin-dashboard.html").hasAnyRole("ADMIN", "WARDEN")
                        .requestMatchers("/student-dashboard.html").hasRole("STUDENT")
                        .requestMatchers("/api/auth/csrf", "/api/auth/register", "/api/auth/login", "/api/auth/logout").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/warden/**").hasAnyRole("ADMIN", "WARDEN")
                        .requestMatchers("/api/student/**").hasRole("STUDENT")
                        .requestMatchers("/api/auth/me").authenticated()
                        .anyRequest().denyAll())
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler(authenticationSuccessHandler())
                        .failureHandler(authenticationFailureHandler()))
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID", "XSRF-TOKEN")
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(200);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            objectMapper.writeValue(response.getOutputStream(), Map.of("message", "Signed out."));
                        }))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            if (request.getRequestURI().endsWith("-dashboard.html")) {
                                response.sendRedirect("/index.html");
                            } else {
                                writeError(response, 401, "Authentication is required.");
                            }
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            if (request.getRequestURI().endsWith("-dashboard.html")) {
                                response.sendRedirect("/index.html");
                            } else {
                                writeError(response, 403, "You do not have permission to access this resource.");
                            }
                        }))
                .httpBasic(basic -> basic.disable());

        return http.build();
    }

    private AuthenticationSuccessHandler authenticationSuccessHandler() {
        return (request, response, authentication) -> {
            if (!(authentication.getPrincipal() instanceof UserAccount account)) {
                throw new IllegalStateException("Authenticated principal is not a HostelEase user account.");
            }
            String redirectUrl = switch (account.getRole()) {
                case ADMIN, WARDEN -> "/admin-dashboard.html";
                case STUDENT -> "/student-dashboard.html";
            };
            LoginResponse body = new LoginResponse(
                    account.getUsername(),
                    account.getFullName(),
                    account.getEmail(),
                    account.getRole().name(),
                    redirectUrl);
            response.setStatus(200);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), body);
        };
    }

    private AuthenticationFailureHandler authenticationFailureHandler() {
        return (request, response, exception) -> writeError(response, 401, "Invalid username or password.");
    }

    private void writeError(jakarta.servlet.http.HttpServletResponse response, int status, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of("message", message));
    }
}
