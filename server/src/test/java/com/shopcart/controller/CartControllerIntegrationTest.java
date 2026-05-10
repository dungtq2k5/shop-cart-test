package com.shopcart.controller;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.dto.CartDto;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
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
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Item added to cart"))
				.andExpect(jsonPath("$.data.quantity").value(2));
	}

	@Test
	@DisplayName("Test PUT /cart/update - success")
	void testUpdateCart_Success() throws Exception {
		UUID cartItemId = UUID.randomUUID();
		CartDto.UpdateCartItemRequest request = new CartDto.UpdateCartItemRequest();
		request.setCartItemId(cartItemId);
		request.setQuantity(3);

		CartDto.CartItemResponse response = new CartDto.CartItemResponse();
		response.setId(cartItemId);
		response.setQuantity(3);

		when(cartService.updateQuantity(any(), eq(cartItemId), any())).thenReturn(response);

		mockMvc.perform(put(apiPrefix + "/cart/update")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Cart updated"))
				.andExpect(jsonPath("$.data.quantity").value(3));
	}

	@Test
	@DisplayName("Test PUT /cart/update - validation error")
	void testUpdateCart_InvalidQuantity() throws Exception {
		CartDto.UpdateCartItemRequest request = new CartDto.UpdateCartItemRequest();
		request.setCartItemId(UUID.randomUUID());
		request.setQuantity(0);

		mockMvc.perform(put(apiPrefix + "/cart/update")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Quantity must be at least 1"));
	}

	@Test
	@DisplayName("Test PUT /cart/update - quantity exceeds stock")
	void testUpdateCart_ExceedsStock() throws Exception {
		UUID cartItemId = UUID.randomUUID();
		CartDto.UpdateCartItemRequest request = new CartDto.UpdateCartItemRequest();
		request.setCartItemId(cartItemId);
		request.setQuantity(99);

		when(cartService.updateQuantity(any(), eq(cartItemId), any()))
				.thenThrow(new BadRequestException("Stock not available"));

		mockMvc.perform(put(apiPrefix + "/cart/update")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest())
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Stock not available"));
	}

	@Test
	@DisplayName("Test DELETE /cart/remove - success")
	void testRemoveFromCart_Success() throws Exception {
		CartDto.RemoveCartRequest request = new CartDto.RemoveCartRequest();
		request.setCartItemId(UUID.randomUUID());

		mockMvc.perform(delete(apiPrefix + "/cart/remove")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Item removed from cart"));
	}

	@Test
	@DisplayName("Test DELETE /cart/remove - item not found")
	void testRemoveFromCart_NotFound() throws Exception {
		UUID cartItemId = UUID.randomUUID();
		CartDto.RemoveCartRequest request = new CartDto.RemoveCartRequest();
		request.setCartItemId(cartItemId);

		doThrow(new EntityNotFoundException("Cart item not found"))
				.when(cartService).removeFromCart(any(), eq(cartItemId));

		mockMvc.perform(delete(apiPrefix + "/cart/remove")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isNotFound())
				.andExpect(content().contentType(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.message").value("Cart item not found"));
	}
}
