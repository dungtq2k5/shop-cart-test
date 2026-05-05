package com.shopcart.controller;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.dto.CartDto;
import com.shopcart.security.JwtAuthEntryPoint;
import com.shopcart.security.JwtAuthFilter;
import com.shopcart.security.RateLimitingFilter;
import com.shopcart.service.CartService;

@WebMvcTest(CartController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("Cart Controller Mock Tests")
class CartControllerMockTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.api.prefix:/api/v1}")
    private String apiPrefix;

    @MockitoBean
    private CartService cartService;

    // Mock security beans
    @MockitoBean
    @SuppressWarnings("unused")
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    @SuppressWarnings("unused")
    private JwtAuthEntryPoint jwtAuthEntryPoint;

    @MockitoBean
    @SuppressWarnings("unused")
    private RateLimitingFilter rateLimitingFilter;

    @Test
    @DisplayName("Test controller with mocked service: Add product to cart successfully")
    void testAddToCartWithMockedService() throws Exception {
        // Arrange
        CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
        request.setProductId(UUID.randomUUID());
        request.setQuantity(2);

        CartDto.CartItemResponse mockResponse = new CartDto.CartItemResponse();
        mockResponse.setId(UUID.randomUUID());
        mockResponse.setQuantity(2);
        mockResponse.setSubtotalCents(30000000);

        when(cartService.addToCart(any(), any())).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(post(apiPrefix + "/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Item added to cart"))
                .andExpect(jsonPath("$.data.quantity").value(2))
                .andExpect(jsonPath("$.data.subtotalCents").value(30000000));

        verify(cartService, times(1)).addToCart(any(), any());
    }
}
