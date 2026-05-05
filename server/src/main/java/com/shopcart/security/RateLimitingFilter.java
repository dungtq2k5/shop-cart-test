package com.shopcart.security;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.config.AppProperties;
import com.shopcart.dto.ApiResponse;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    @Value("${app.api.prefix:/api/v1}")
    private String apiPrefix;

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> productBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        if (isAuthEndpoint(path)) {
            if (!tryConsume(authBuckets, clientIp, appProperties.getRateLimit().getAuth())) {
                sendErrorResponse(response);
                return;
            }
        } else if (isProductEndpoint(path)
                && !tryConsume(productBuckets, clientIp, appProperties.getRateLimit().getProduct())) {
            sendErrorResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String path) {
        return path.startsWith(apiPrefix + "/auth/login") || path.startsWith(apiPrefix + "/auth/register");
    }

    private boolean isProductEndpoint(String path) {
        // Limit both /products (search) and /products/{id} (single product)
        return path.startsWith(apiPrefix + "/products");
    }

    private boolean tryConsume(Map<String, Bucket> buckets, String key, AppProperties.RateLimit.Auth config) {
        Bucket bucket = buckets.computeIfAbsent(key,
                k -> createBucket(config.getCapacity(), config.getRefillDurationMinutes()));
        return bucket.tryConsume(1);
    }

    private boolean tryConsume(Map<String, Bucket> buckets, String key, AppProperties.RateLimit.Product config) {
        Bucket bucket = buckets.computeIfAbsent(key,
                k -> createBucket(config.getCapacity(), config.getRefillDurationMinutes()));
        return bucket.tryConsume(1);
    }

    private Bucket createBucket(long capacity, long refillMinutes) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(capacity)
                        .refillGreedy(capacity, Duration.ofMinutes(refillMinutes))
                        .build())
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private void sendErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiResponse<Void> apiResponse = ApiResponse.error("Too many requests. Please try again later.");
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
