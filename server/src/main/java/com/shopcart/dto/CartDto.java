package com.shopcart.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class CartDto {

    private CartDto() {
        // Private constructor to hide the implicit public one
    }

    @Data
    public static class AddToCartRequest {
        @NotNull(message = "Product ID is required")
        private UUID productId;

        @Min(value = 1, message = "Quantity must be at least 1")
        private int quantity = 1;
    }

    @Data
    public static class UpdateCartRequest {
        @Min(value = 1, message = "Quantity must be at least 1")
        private int quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CartItemResponse {
        private UUID id;
        private ProductDto.ProductResponse product;
        private Integer quantity;
        private Integer subtotalCents;
    }
}
