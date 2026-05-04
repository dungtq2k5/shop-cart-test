package com.shopcart.service;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.shopcart.dto.OrderDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Order;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.OrderRepository;
import com.shopcart.repository.ProductRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("Order Service Mock Tests")
class OrderServiceMockTest {

    // Mock OrderRepository and ProductRepository
    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductService productService;

    @InjectMocks
    private OrderService orderService;

    @Test
    @DisplayName("Test service layer with mocked repositories: Order success")
    void testCheckoutWithMockedRepositories() {
        // Arrange
        User mockUser = User.builder().id(UUID.randomUUID()).build();

        Product mockProduct = new Product();
        mockProduct.setId(UUID.randomUUID());
        mockProduct.setName("Laptop Dell");
        mockProduct.setPriceCents(15000000);
        mockProduct.setStockQty(10);

        CartItem mockCartItem = new CartItem();
        mockCartItem.setProduct(mockProduct);
        mockCartItem.setQuantity(2); // Total: 30000000

        when(cartItemRepository.findByUserId(mockUser.getId())).thenReturn(List.of(mockCartItem));

        // When save is called on orderRepository, return the saved order with an ID
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            savedOrder.setId(UUID.randomUUID());
            return savedOrder;
        });

        // Mock product mapping
        when(productService.toProductResponse(any(Product.class)))
                .thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

        OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
        request.setDeliveryAddress("123 Test Street");

        // Act
        OrderDto.OrderResponse response = orderService.checkout(mockUser, request);

        // Assert and verify repository interactions and check data after service processing
        assertEquals(30000000, response.getTotalAmountCents());
        assertEquals("123 Test Street", response.getDeliveryAddress());

        // Verify product stock was reduced
        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository).save(productCaptor.capture());
        assertEquals(8, productCaptor.getValue().getStockQty()); // 10 - 2 = 8

        // Verify order was saved
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(orderRepository).save(orderCaptor.capture());
        assertEquals(30000000, orderCaptor.getValue().getTotalAmountCents());

        // Verify cart was cleared
        verify(cartItemRepository).deleteByUserId(mockUser.getId());
    }
}
