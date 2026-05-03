package com.shopcart.controller;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.OrderDto;
import com.shopcart.entity.User;
import com.shopcart.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderDto.OrderResponse>> checkout(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody OrderDto.CheckoutRequest request) {
        OrderDto.OrderResponse order = orderService.checkout(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Order placed successfully", order));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<OrderDto.OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getMyOrders(currentUser)));
    }
}
