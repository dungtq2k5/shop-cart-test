package com.shopcart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.AuthDto;
import com.shopcart.entity.User;
import com.shopcart.service.AuthService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDto.UserResponse>> register(
            @Valid @RequestBody AuthDto.RegisterRequest request,
            HttpServletResponse response) {
        AuthDto.UserResponse user = authService.register(request, response);
        return ResponseEntity.ok(ApiResponse.ok("Registered successfully", user));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.UserResponse>> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            HttpServletResponse response) {
        AuthDto.UserResponse user = authService.login(request, response);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", user));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully", null));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<AuthDto.UserResponse>> check(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(authService.checkAuth(currentUser)));
    }
}
