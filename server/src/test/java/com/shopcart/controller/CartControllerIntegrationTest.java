package com.shopcart.controller;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.dto.CartDto;
import com.shopcart.security.JwtAuthEntryPoint;
import com.shopcart.security.JwtAuthFilter;
import com.shopcart.security.RateLimitingFilter;
import com.shopcart.service.CartService;

@WebMvcTest(CartController.class)
@AutoConfigureMockMvc(addFilters = false) // Bypass security filters for unit testing controllers
@DisplayName("Cart API Integration Tests")
class CartControllerIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Value("${app.api.prefix:/api/v1}")
	private String apiPrefix;

	@MockitoBean
	private CartService cartService;

	// Mock security beans so context loads successfully
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
	@DisplayName("Test POST /cart - success")
	void testAddToCart_Success() throws Exception {
		// Arrange
		CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(UUID.randomUUID());
		request.setQuantity(2);

		CartDto.CartItemResponse response = new CartDto.CartItemResponse();
		response.setId(UUID.randomUUID());
		com.shopcart.dto.ProductDto.ProductResponse mockProduct = new com.shopcart.dto.ProductDto.ProductResponse();
		mockProduct.setId(request.getProductId());
		response.setProduct(mockProduct);
		response.setQuantity(2);

		// When bypassing filters, @AuthenticationPrincipal is null unless we inject it
		// manually,
		// however, we can use `any()` to match it since our test focuses on controller
		// mapping and response structure.
		when(cartService.addToCart(any(), any())).thenReturn(response);

		// Act & Assert
		mockMvc.perform(post(apiPrefix + "/cart")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andDo(print())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Item added to cart"))
				.andExpect(jsonPath("$.data.quantity").value(2));
	}

	@Test
	@DisplayName("Test POST /cart - validation failure")
	void testAddToCart_ValidationFailure() throws Exception {
		// Arrange
		CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(null); // Invalid: productId is required
		request.setQuantity(0); // Invalid: quantity must be at least 1

		// Act & Assert
		mockMvc.perform(post(apiPrefix + "/cart")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andDo(print())
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.success").value(false));
	}
}
