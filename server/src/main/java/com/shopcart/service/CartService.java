package com.shopcart.service;

import com.shopcart.dto.CartDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<CartDto.CartItemResponse> getCart(User user) {
        return cartItemRepository.findByUserId(user.getId()).stream()
                .map(this::toCartItemResponse)
                .toList();
    }

    @Transactional
    public CartDto.CartItemResponse addToCart(User user, CartDto.AddToCartRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        if (!product.getIsActive()) {
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

        cartItem = cartItemRepository.save(cartItem);
        return toCartItemResponse(cartItem);
    }

    @Transactional
    public CartDto.CartItemResponse updateQuantity(User user, UUID cartItemId, CartDto.UpdateCartRequest request) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new EntityNotFoundException("Cart item not found"));

        if (!cartItem.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Cart item does not belong to current user");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItem = cartItemRepository.save(cartItem);
        return toCartItemResponse(cartItem);
    }

    @Transactional
    public void removeFromCart(User user, UUID cartItemId) {
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
