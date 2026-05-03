package com.shopcart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

public class ProductDto {

    private ProductDto() {
        // Private constructor to hide the implicit public one
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProductResponse {
        private UUID id;
        private String name;
        private String description;
        private Integer priceCents;
        private Integer stockQty;
        private Boolean isActive;
        private String createdAt;
        private String updatedAt;
    }
}
