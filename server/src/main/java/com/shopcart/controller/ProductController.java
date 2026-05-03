package com.shopcart.controller;

import com.shopcart.dto.ApiResponse;
import com.shopcart.dto.ProductDto;
import com.shopcart.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductDto.ProductResponse>>> getProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer priceCentsMin,
            @RequestParam(required = false) Integer priceCentsMax,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<ProductDto.ProductResponse> products = productService.getProducts(
                name, priceCentsMin, priceCentsMax, pageable);
        return ResponseEntity.ok(ApiResponse.ok(products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDto.ProductResponse>> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getProduct(id)));
    }
}
