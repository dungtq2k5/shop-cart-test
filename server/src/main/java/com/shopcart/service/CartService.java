package com.shopcart.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopcart.dto.CartDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.ProductRepository;

@Service
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public CartService(CartItemRepository cartItemRepository, ProductRepository productRepository,
            ProductService productService) {
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    @Transactional(readOnly = true)
    public List<CartDto.CartItemResponse> getCart(User user) {
        return cartItemRepository.findByUserId(user.getId()).stream()
                .map(this::toCartItemResponse)
                .toList();
    }

    @Transactional
    public CartDto.CartItemResponse addToCart(User user, CartDto.AddToCartRequest request) {
        Product product = productRepository.findById(Objects.requireNonNull(request.getProductId()))
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        if (product.getIsActive().equals(false)) {
            throw new BadRequestException("Product is not available");
        }

        CartItem cartItem = cartItemRepository
                .findByUserIdAndProductId(user.getId(), product.getId())
                .map(existing -> {
                    existing.setQuantity(existing.getQuantity() + request.getQuantity());
                    return existing;
                })
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(request.getQuantity())
                        .build());

        @SuppressWarnings("null")
        CartItem saved = cartItemRepository.save(cartItem);
        return toCartItemResponse(saved);
    }

    @Transactional
    public CartDto.CartItemResponse updateQuantity(User user, @NonNull UUID cartItemId,
            CartDto.UpdateCartRequest request) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found"));

        if (!cartItem.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Cart item does not belong to current user");
        }

        cartItem.setQuantity(request.getQuantity());
        CartItem saved = Objects.requireNonNull(cartItemRepository.save(cartItem));
        return toCartItemResponse(saved);
    }

    @Transactional
    public void removeFromCart(User user, @NonNull UUID cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found"));

        if (!cartItem.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Cart item does not belong to current user");
        }

        cartItemRepository.delete(cartItem);
    }

    private CartDto.CartItemResponse toCartItemResponse(CartItem item) {
        return CartDto.CartItemResponse.builder()
                .id(item.getId())
                .product(productService.toProductResponse(item.getProduct()))
                .quantity(item.getQuantity())
                .subtotalCents(item.getProduct().getPriceCents() * item.getQuantity())
                .build();
    }
}
