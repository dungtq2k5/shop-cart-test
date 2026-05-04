package com.shopcart.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shopcart.dto.OrderDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Coupon;
import com.shopcart.entity.Order;
import com.shopcart.entity.OrderItem;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.exception.InsufficientStockException;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.CouponRepository;
import com.shopcart.repository.OrderRepository;
import com.shopcart.repository.ProductRepository;

@Service
public class OrderService {
    public static final int HARD_CODED_SHIPPING_FEE_CENTS = 500;

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final ProductService productService;

    public OrderService(OrderRepository orderRepository, CartItemRepository cartItemRepository,
            ProductRepository productRepository,
            CouponRepository couponRepository, ProductService productService) {
        this.orderRepository = orderRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.productService = productService;
    }

    @Transactional
    public OrderDto.OrderResponse checkout(User user, OrderDto.CheckoutRequest request) {
        // 1. Retrieve cart items
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty. Add items before checkout.");
        }

        // 2. Resolve and validate coupon
        Coupon coupon = null;
        int discountPercentage = 0;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCode(request.getCouponCode().trim().toUpperCase())
                    .orElseThrow(() -> new BadRequestException("Coupon code not found: " + request.getCouponCode()));
            if (!Boolean.TRUE.equals(coupon.getIsActive())) {
                throw new BadRequestException("Coupon is inactive");
            }
            if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(Instant.now())) {
                throw new BadRequestException("Coupon has expired");
            }
            discountPercentage = coupon.getDiscountPercentage();
        }

        // 3. Validate stock and 4. Deduct inventory
        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            if (product.getStockQty() < cartItem.getQuantity()) {
                throw new InsufficientStockException(product.getName(), cartItem.getQuantity(), product.getStockQty());
            }
            product.setStockQty(product.getStockQty() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // 5. Calculate totals (all integer cents arithmetic)
        int subtotalCents = cartItems.stream()
                .mapToInt(ci -> ci.getProduct().getPriceCents() * ci.getQuantity())
                .sum();
        int discountAmountCents = Math.round((subtotalCents * discountPercentage) / 100.0f);
        int totalAmountCents = subtotalCents - discountAmountCents + HARD_CODED_SHIPPING_FEE_CENTS;

        // 6. Persist Order and OrderItems
        Order order = Order.builder()
                .user(user)
                .coupon(coupon)
                .totalAmountCents(totalAmountCents)
                .discountAmountCents(discountAmountCents)
                .deliveryAddress(request.getDeliveryAddress())
                .status(Order.OrderStatus.PENDING)
                .build();

        List<OrderItem> orderItems = cartItems.stream()
                .map(ci -> OrderItem.builder()
                        .order(order)
                        .product(ci.getProduct())
                        .quantity(ci.getQuantity())
                        .unitPriceCents(ci.getProduct().getPriceCents())
                        .build())
                .toList();
        order.getOrderItems().addAll(orderItems);
        orderRepository.save(order);

        // 7. Clear cart
        cartItemRepository.deleteByUserId(user.getId());

        return toOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto.OrderResponse> getMyOrders(User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toOrderResponse)
                .toList();
    }

    @Transactional
    public OrderDto.OrderResponse cancelOrder(User user, UUID orderId) {
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));

        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new BadRequestException(
                    "Only PENDING orders can be cancelled. Current status: " + order.getStatus());
        }

        // Refund stock for every item in the order
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStockQty(product.getStockQty() + item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus(Order.OrderStatus.CANCELLED);
        Order saved = orderRepository.save(order);
        return toOrderResponse(saved);
    }

    private OrderDto.OrderResponse toOrderResponse(Order order) {
        List<OrderDto.OrderItemResponse> items = order.getOrderItems().stream()
                .map(oi -> OrderDto.OrderItemResponse.builder()
                        .id(oi.getId())
                        .product(productService.toProductResponse(oi.getProduct()))
                        .quantity(oi.getQuantity())
                        .unitPriceCents(oi.getUnitPriceCents())
                        .lineTotalCents(oi.getUnitPriceCents() * oi.getQuantity())
                        .build())
                .toList();

        return OrderDto.OrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus().name())
                .totalAmountCents(order.getTotalAmountCents())
                .discountAmountCents(order.getDiscountAmountCents())
                .deliveryAddress(order.getDeliveryAddress())
                .couponCode(order.getCoupon() != null ? order.getCoupon().getCode() : null)
                .items(items)
                .createdAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : Instant.now().toString())
                .updatedAt(order.getUpdatedAt() != null ? order.getUpdatedAt().toString() : Instant.now().toString())
                .build();
    }
}
