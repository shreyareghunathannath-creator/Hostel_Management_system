package com.hostelease.hms.auth.dto;

public record LoginResponse(String username, String fullName, String email, String role, String redirectUrl) {
}
