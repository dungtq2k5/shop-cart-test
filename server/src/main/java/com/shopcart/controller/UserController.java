package com.shopcart.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.AuthDto;
import com.shopcart.dto.UserDto;
import com.shopcart.entity.User;
import com.shopcart.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<AuthDto.UserResponse>> updateProfile(
            @AuthenticationPrincipal @NonNull User currentUser,
            @Valid @RequestBody UserDto.UpdateProfileRequest request) {
        AuthDto.UserResponse updated = userService.updateProfile(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }
}
