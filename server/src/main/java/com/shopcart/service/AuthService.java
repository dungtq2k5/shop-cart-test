package com.shopcart.service;

import com.shopcart.dto.AuthDto;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.repository.UserRepository;
import com.shopcart.security.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Transactional
    public AuthDto.UserResponse register(AuthDto.RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        user = userRepository.save(user);
        setJwtCookie(response, jwtUtils.generateToken(user.getId()));
        return toUserResponse(user);
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
        cookie.setPath("/");
        cookie.setMaxAge((int) (jwtExpirationMs / 1000));
        // cookie.setSecure(true); // Uncomment in production (HTTPS only)
        response.addCookie(cookie);
    }

    public static AuthDto.UserResponse toUserResponse(User user) {
        return AuthDto.UserResponse.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }
}
