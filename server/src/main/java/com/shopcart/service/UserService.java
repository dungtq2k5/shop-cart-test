package com.shopcart.service;

import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopcart.dto.AuthDto;
import com.shopcart.dto.UserDto;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthDto.UserResponse updateProfile(@NonNull User currentUser, UserDto.UpdateProfileRequest request) {
        boolean hasEmailChange = request.getEmail() != null && !request.getEmail().isBlank();
        boolean hasPasswordChange = request.getNewPassword() != null && !request.getNewPassword().isBlank();

        if (!hasEmailChange && !hasPasswordChange) {
            throw new BadRequestException("No changes requested");
        }

        if (hasEmailChange) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(currentUser.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new BadRequestException("Email is already in use");
            }
            currentUser.setEmail(newEmail);
        }

        if (hasPasswordChange) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new BadRequestException("Current password is required to set a new password");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash())) {
                throw new BadCredentialsException("Current password is incorrect");
            }
            currentUser.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        }

        Objects.requireNonNull(userRepository.save(currentUser), "userRepository.save returned null");
        return AuthService.toUserResponse(currentUser);
    }
}
