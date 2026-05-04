package com.shopcart.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.OrderDto;
import com.shopcart.entity.User;
import com.shopcart.service.OrderService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/orders")
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

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderDto.OrderResponse>> cancelOrder(
            @AuthenticationPrincipal User currentUser,
            @PathVariable @NonNull UUID id) {
        OrderDto.OrderResponse order = orderService.cancelOrder(currentUser, id);
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled successfully", order));
    }
}
