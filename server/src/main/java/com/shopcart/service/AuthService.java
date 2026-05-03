package com.shopcart.service;

import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopcart.dto.AuthDto;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.repository.UserRepository;
import com.shopcart.security.JwtUtils;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    /**
     * Controls whether JWT cookies are sent with the Secure flag.
     * Set to {@code true} in production (HTTPS). Defaults to {@code false} for
     * local dev.
     */
    @Value("${server.ssl.enabled:false}")
    private boolean secureCookies;

    @Transactional
    public AuthDto.UserResponse register(AuthDto.RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        @SuppressWarnings("null")
        User saved = userRepository.save(user);

        setJwtCookie(response, jwtUtils.generateToken(saved.getId()));
        return toUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public AuthDto.UserResponse login(AuthDto.LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        setJwtCookie(response, jwtUtils.generateToken(user.getId()));
        return toUserResponse(user);
    }

    public void logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwt", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookies);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    @Transactional(readOnly = true)
    public AuthDto.UserResponse checkAuth(User currentUser) {
        return toUserResponse(currentUser);
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("jwt", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(secureCookies);
        cookie.setPath("/");
        cookie.setMaxAge((int) (jwtExpirationMs / 1000));
        response.addCookie(cookie);
    }

    public static AuthDto.UserResponse toUserResponse(User user) {
        Instant createdAt = user.getCreatedAt();
        return AuthDto.UserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .createdAt(createdAt != null ? createdAt.toString() : Instant.now().toString())
                .build();
    }
}