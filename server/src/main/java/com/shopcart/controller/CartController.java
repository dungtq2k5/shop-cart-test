package com.shopcart.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.CartDto;
import com.shopcart.entity.User;
import com.shopcart.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartDto.CartItemResponse>>> getCart(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.ok(cartService.getCart(currentUser)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartDto.CartItemResponse>> addToCart(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CartDto.AddToCartRequest request) {
        CartDto.CartItemResponse item = cartService.addToCart(currentUser, request);
        return ResponseEntity.ok(ApiResponse.ok("Item added to cart", item));
    }

    @PatchMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDto.CartItemResponse>> updateQuantity(
            @AuthenticationPrincipal User currentUser,
            @PathVariable @NonNull UUID cartItemId,
            @Valid @RequestBody CartDto.UpdateCartRequest request) {
        CartDto.CartItemResponse item = cartService.updateQuantity(currentUser, cartItemId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cart updated", item));
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<ApiResponse<Void>> removeFromCart(
            @AuthenticationPrincipal User currentUser,
            @PathVariable @NonNull UUID cartItemId) {
        cartService.removeFromCart(currentUser, cartItemId);
        return ResponseEntity.ok(ApiResponse.ok("Item removed from cart", null));
    }
}
