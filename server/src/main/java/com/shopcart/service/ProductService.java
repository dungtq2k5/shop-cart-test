package com.shopcart.service;

import com.shopcart.dto.ProductDto;
import com.shopcart.entity.Product;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductDto.ProductResponse> getProducts(String name, Integer priceCentsMin,
                                                         Integer priceCentsMax, Pageable pageable) {
        return productRepository.findByFilters(name, priceCentsMin, priceCentsMax, pageable)
                .map(this::toProductResponse);
    }

    @Transactional(readOnly = true)
    public ProductDto.ProductResponse getProduct(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found with id: " + id));
        return toProductResponse(product);
    }

    public ProductDto.ProductResponse toProductResponse(Product product) {
        return ProductDto.ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .priceCents(product.getPriceCents())
                .stockQty(product.getStockQty())
                .isActive(product.getIsActive())
                .createdAt(product.getCreatedAt().toString())
                .updatedAt(product.getUpdatedAt().toString())
                .build();
    }
}
