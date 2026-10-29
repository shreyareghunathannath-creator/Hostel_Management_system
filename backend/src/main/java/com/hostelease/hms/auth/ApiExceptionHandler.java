package com.hostelease.hms.auth;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        for (var error : exception.getBindingResult().getGlobalErrors()) {
            fields.putIfAbsent("form", error.getDefaultMessage());
        }
        return response(HttpStatus.BAD_REQUEST, "Please correct the highlighted fields.", fields);
    }

    @ExceptionHandler({InvalidRegistrationException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(Exception exception) {
        String message = exception instanceof InvalidRegistrationException
                ? exception.getMessage()
                : "Request body is invalid or contains an unsupported account role.";
        return response(HttpStatus.BAD_REQUEST, message, Map.of());
    }

    @ExceptionHandler(DuplicateAccountException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateAccountException exception) {
        return response(HttpStatus.CONFLICT, exception.getMessage(), Map.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintConflict(DataIntegrityViolationException exception) {
        return response(HttpStatus.CONFLICT, "That username or email address is already registered.", Map.of());
    }

    private ResponseEntity<Map<String, Object>> response(
            HttpStatus status, String message, Map<String, String> fields) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        body.put("fieldErrors", fields);
        return ResponseEntity.status(status).body(body);
    }
}
