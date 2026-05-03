package com.shopcart.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class OrderDto {

    private OrderDto() {
        // Private constructor to hide the implicit public one
    }

    @Data
    public static class CheckoutRequest {
        @NotBlank(message = "Delivery address is required")
        private String deliveryAddress;

        private String couponCode;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemResponse {
        private UUID id;
        private ProductDto.ProductResponse product;
        private Integer quantity;
        private Integer unitPriceCents;
        private Integer lineTotalCents;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderResponse {
        private UUID id;
        private String status;
        private Integer totalAmountCents;
        private Integer discountAmountCents;
        private String deliveryAddress;
        private String couponCode;
        private List<OrderItemResponse> items;
        private String createdAt;
        private String updatedAt;
    }
}
