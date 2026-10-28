package com.hostelease.hms.auth.dto;

import com.hostelease.hms.user.UserRole;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;

public record RegistrationRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Size(min = 3, max = 50)
                @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Use letters, numbers, dots, underscores, or hyphens.")
                String username,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotBlank String confirmPassword,
        @NotNull UserRole role) {

    @AssertTrue(message = "Passwords do not match.")
    public boolean isPasswordConfirmed() {
        return password != null && password.equals(confirmPassword);
    }

    @AssertTrue(message = "Password must not exceed 72 UTF-8 bytes.")
    public boolean isPasswordWithinBcryptLimit() {
        return password != null && password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}
