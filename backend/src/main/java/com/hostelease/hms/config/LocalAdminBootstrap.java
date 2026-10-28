package com.hostelease.hms.config;

import com.hostelease.hms.user.UserAccount;
import com.hostelease.hms.user.UserAccountRepository;
import com.hostelease.hms.user.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@ConditionalOnProperty(name = "app.bootstrap-admin.enabled", havingValue = "true")
public class LocalAdminBootstrap implements ApplicationRunner {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String fullName;
    private final String email;
    private final String password;

    public LocalAdminBootstrap(
            UserAccountRepository userAccountRepository,
            PasswordEncoder passwordEncoder,
            @Value("${BOOTSTRAP_ADMIN_USERNAME}") String username,
            @Value("${BOOTSTRAP_ADMIN_NAME}") String fullName,
            @Value("${BOOTSTRAP_ADMIN_EMAIL}") String email,
            @Value("${BOOTSTRAP_ADMIN_PASSWORD}") String password) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.fullName = fullName;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
            return;
        }
        if (userAccountRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("The bootstrap administrator email is already in use.");
        }
        if (password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 12
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("The bootstrap administrator password must be 12 to 72 UTF-8 bytes.");
        }
        userAccountRepository.save(new UserAccount(
                fullName,
                username,
                email,
                passwordEncoder.encode(password),
                UserRole.ADMIN));
    }
}
