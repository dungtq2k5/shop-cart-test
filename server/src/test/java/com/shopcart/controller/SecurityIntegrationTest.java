package com.shopcart.controller;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopcart.dto.AuthDto;
import com.shopcart.dto.CartDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.CouponRepository;
import com.shopcart.repository.OrderRepository;
import com.shopcart.repository.ProductRepository;
import com.shopcart.repository.UserRepository;
import com.shopcart.security.JwtUtils;

import jakarta.servlet.http.Cookie;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Security Integration Tests")
class SecurityIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private CartItemRepository cartItemRepository;

	@Autowired
	private OrderRepository orderRepository;

	@Autowired
	private CouponRepository couponRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtUtils jwtUtils;

	@Value("${app.api.prefix:/api/v1}")
	private String apiPrefix;

	private User user1;
	private User user2;
	private Product product;
	private String token1;

	@BeforeEach
	@SuppressWarnings("unused")
	void setUp() {
		orderRepository.deleteAll();
		cartItemRepository.deleteAll();
		couponRepository.deleteAll();
		userRepository.deleteAll();
		productRepository.deleteAll();

		user1 = userRepository.save(User.builder()
				.email("user1@example.com")
				.passwordHash(passwordEncoder.encode("password123"))
				.build());

		user2 = userRepository.save(User.builder()
				.email("user2@example.com")
				.passwordHash(passwordEncoder.encode("password123"))
				.build());

		product = productRepository.save(Product.builder()
				.name("Test Product")
				.priceCents(1000)
				.stockQty(10)
				.isActive(true)
				.build());

		token1 = jwtUtils.generateToken(user1.getId());
	}

	// ── 1. SQL Injection Tests ─────────────────────────────────────────────

	@Test
	@DisplayName("SQL Injection: Login with malicious payload")
	void testSQLInjection_Login() throws Exception {
		AuthDto.LoginRequest request = new AuthDto.LoginRequest();
		request.setEmail("' OR '1'='1");
		request.setPassword("anything");

		mockMvc.perform(post(apiPrefix + "/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest()); // Rejected by @Email validation
	}

	@Test
	@DisplayName("CSRF Mitigation: Verify SameSite=Lax in login cookie")
	void testCSRF_SameSiteLaxEnabled() throws Exception {
		AuthDto.LoginRequest request = new AuthDto.LoginRequest();
		request.setEmail("user1@example.com");
		request.setPassword("password123");

		mockMvc.perform(post(apiPrefix + "/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Lax")));
	}

	@Test
	@DisplayName("SQL Injection: Product search with malicious payload")
	void testSQLInjection_ProductSearch() throws Exception {
		mockMvc.perform(get(apiPrefix + "/products")
				.param("name", "' OR 1=1 --"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.content").isEmpty());
	}

	// ── 2. XSS Tests ────────────────────────────────────────────────────────

	@Test
	@DisplayName("XSS: Malicious script in search parameter")
	void testXSS_ProductSearch() throws Exception {
		String xssPayload = "<script>alert('xss')</script>";
		mockMvc.perform(get(apiPrefix + "/products")
				.param("name", xssPayload))
				.andExpect(status().isOk())
				// Verify that the response is JSON, not HTML, and the content is empty/safe
				.andExpect(jsonPath("$.data.content").isEmpty());
	}

	// ── 3. IDOR Tests ───────────────────────────────────────────────────────

	@Test
	@DisplayName("IDOR: User A trying to update User B's cart item")
	void testIDOR_UpdateOtherUserCart() throws Exception {
		// Create cart item for User 2
		CartItem user2Item = cartItemRepository.save(CartItem.builder()
				.user(user2)
				.product(product)
				.quantity(1)
				.build());

		CartDto.UpdateCartRequest updateRequest = new CartDto.UpdateCartRequest();
		updateRequest.setQuantity(5);

		// Try to update it using User 1's token
		mockMvc.perform(patch(apiPrefix + "/cart/" + user2Item.getId())
				.cookie(new Cookie("jwt", token1))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updateRequest)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("Cart item does not belong to current user"));
	}

	@Test
	@DisplayName("IDOR: User A trying to remove User B's cart item")
	void testIDOR_RemoveOtherUserCart() throws Exception {
		CartItem user2Item = cartItemRepository.save(CartItem.builder()
				.user(user2)
				.product(product)
				.quantity(1)
				.build());

		mockMvc.perform(delete(apiPrefix + "/cart/" + user2Item.getId())
				.cookie(new Cookie("jwt", token1)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.message").value("Cart item does not belong to current user"));
	}

	// ── 4. API Role / Authentication Tests ──────────────────────────────────

	@Test
	@DisplayName("Authentication: Accessing cart without token")
	void testUnauthenticatedAccess_Cart() throws Exception {
		mockMvc.perform(get(apiPrefix + "/cart"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Authentication: Updating cart without token")
	void testUnauthenticatedAccess_UpdateCart() throws Exception {
		CartDto.UpdateCartRequest updateRequest = new CartDto.UpdateCartRequest();
		updateRequest.setQuantity(2);

		mockMvc.perform(patch(apiPrefix + "/cart/" + UUID.randomUUID())
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(updateRequest)))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Authentication: Removing cart item without token")
	void testUnauthenticatedAccess_RemoveCart() throws Exception {
		mockMvc.perform(delete(apiPrefix + "/cart/" + UUID.randomUUID()))
				.andExpect(status().isUnauthorized());
	}

	@Test
	@DisplayName("Authentication: Accessing checkout without token")
	void testUnauthenticatedAccess_Checkout() throws Exception {
		mockMvc.perform(post(apiPrefix + "/orders/checkout")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"deliveryAddress\": \"Test Addr\"}"))
				.andExpect(status().isUnauthorized());
	}

	// ── 5. CSRF Simulation ──────────────────────────────────────────────────

	@Test
	@DisplayName("CSRF Mitigation: Documented state of protection")
	void testCSRF_ProtectionAnalysis() throws Exception {
		// Mitigation implemented: SameSite=Lax on JWT Cookie.
		// Modern browsers will NOT send this cookie in cross-site POST requests.

		CartDto.AddToCartRequest addRequest = new CartDto.AddToCartRequest();
		addRequest.setProductId(product.getId());
		addRequest.setQuantity(1);

		// Within-site request still works:
		mockMvc.perform(post(apiPrefix + "/cart")
				.cookie(new Cookie("jwt", token1))
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(addRequest)))
				.andExpect(status().isOk());
	}

	// ── 6. Token Tampering Tests ───────────────────────────────────────────

	@Test
	@DisplayName("Authentication: Modifying JWT signature")
	void testTokenTampering_InvalidSignature() throws Exception {
		// Tamper with the token by changing a character in the signature part
		String tamperedToken = token1.substring(0, token1.length() - 5) + "abcde";

		mockMvc.perform(get(apiPrefix + "/cart")
				.cookie(new Cookie("jwt", tamperedToken)))
				.andExpect(status().isUnauthorized());
	}

	// ── 7. CORS Tests ───────────────────────────────────────────────────────

	@Test
	@DisplayName("CORS: Request from unauthorized origin")
	void testCORS_BlockedUnauthorizedOrigin() throws Exception {
		mockMvc.perform(get(apiPrefix + "/products")
				.header("Origin", "http://malicious.com")
				.header("Access-Control-Request-Method", "GET"))
				.andExpect(status().isForbidden());
	}
}
