package com.shopcart.controller;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.dto.OrderDto;
import com.shopcart.security.JwtAuthEntryPoint;
import com.shopcart.security.JwtAuthFilter;
import com.shopcart.service.OrderService;

@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false) // Bypass security filters for unit testing controllers
@DisplayName("Order API Integration Tests")
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OrderService orderService;

    // Mock security beans to satisfy context
    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private JwtAuthEntryPoint jwtAuthEntryPoint;

    @Test
    @DisplayName("Test POST /api/v1/orders/checkout - success")
    void testCheckout_Success() throws Exception {
        // Arrange
        OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
        request.setDeliveryAddress("123 Main St");
        request.setCouponCode("DISCOUNT10");

        OrderDto.OrderResponse response = new OrderDto.OrderResponse();
        response.setId(UUID.randomUUID());
        response.setDeliveryAddress("123 Main St");
        response.setTotalAmountCents(10000); // 100 USD

        when(orderService.checkout(any(), any())).thenReturn(response);

        // Act & Assert
        mockMvc.perform(post("/api/v1/orders/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Order placed successfully"))
                .andExpect(jsonPath("$.data.deliveryAddress").value("123 Main St"))
                .andExpect(jsonPath("$.data.totalAmountCents").value(10000));
    }

    @Test
    @DisplayName("Test GET /api/v1/orders/me - retrieve my orders")
    void testGetMyOrders_Success() throws Exception {
        // Arrange
        OrderDto.OrderResponse order = new OrderDto.OrderResponse();
        order.setId(UUID.randomUUID());
        order.setDeliveryAddress("456 Elm St");

        when(orderService.getMyOrders(any())).thenReturn(List.of(order));

        // Act & Assert
        mockMvc.perform(get("/api/v1/orders/me")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].deliveryAddress").value("456 Elm St"));
    }
}
