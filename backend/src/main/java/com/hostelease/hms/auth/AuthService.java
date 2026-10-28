package com.hostelease.hms.auth;

import com.hostelease.hms.auth.dto.LoginResponse;
import com.hostelease.hms.auth.dto.RegistrationRequest;
import com.hostelease.hms.auth.dto.RegistrationResponse;
import com.hostelease.hms.user.UserAccount;
import com.hostelease.hms.user.UserAccountRepository;
import com.hostelease.hms.user.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userAccountRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid username or password."));
    }

    @Transactional
    public RegistrationResponse register(RegistrationRequest request) {
        if (request.role() != UserRole.STUDENT) {
            throw new InvalidRegistrationException(
                    "Public registration is limited to student accounts. Contact the hostel administrator for staff access.");
        }

        String normalizedUsername = request.username().trim();
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new DuplicateAccountException("That username is already registered.");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateAccountException("That email address is already registered.");
        }

        UserAccount account = new UserAccount(
                request.fullName().trim(),
                normalizedUsername,
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                UserRole.STUDENT);
        userAccountRepository.save(account);
        return new RegistrationResponse("Account created. You can now sign in.", account.getUsername(), account.getRole().name());
    }

    @Transactional(readOnly = true)
    public LoginResponse toLoginResponse(Authentication authentication) {
        UserAccount account = userAccountRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Authenticated account could not be found."));
        return new LoginResponse(
                account.getUsername(),
                account.getFullName(),
                account.getEmail(),
                account.getRole().name(),
                dashboardPath(account.getRole()));
    }

    private String dashboardPath(UserRole role) {
        return switch (role) {
            case ADMIN, WARDEN -> "/admin-dashboard.html";
            case STUDENT -> "/student-dashboard.html";
        };
    }
}
