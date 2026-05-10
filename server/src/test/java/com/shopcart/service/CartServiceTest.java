package com.shopcart.service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.shopcart.dto.CartDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Product;
import com.shopcart.entity.User;
import com.shopcart.exception.BadRequestException;
import com.shopcart.exception.EntityNotFoundException;
import com.shopcart.repository.CartItemRepository;
import com.shopcart.repository.ProductRepository;

/**
 * Unit tests for {@link CartService}.
 *
 * What is a Unit Test?
 * A unit test verifies a single "unit" of business logic in isolation.
 * We use Mockito to replace real databases (repositories) with "fakes" (mocks)
 * so the test runs fast and doesn't need a running server or database.
 *
 * Pattern: AAA (Arrange → Act → Assert)
 * - Arrange: set up the test data and mock behaviors.
 * - Act: call the method under test.
 * - Assert: verify the result is what we expected.
 *
 * @see CartService
 */
@DisplayName("CartService – Unit Tests")
@ExtendWith(MockitoExtension.class) // Tells JUnit to initialize @Mock and @InjectMocks automatically
@SuppressWarnings("null")
class CartServiceTest {

	// ── Mocks ──────────────────────────────────────────────────────────────────
	// @Mock creates a fake object — calls on it do nothing unless we program them
	// with `when(...).thenReturn(...)`.

	@Mock
	private CartItemRepository cartItemRepository;

	@Mock
	private ProductRepository productRepository;

	@Mock
	private ProductService productService; // dependency of CartService

	// ── System Under Test ─────────────────────────────────────────────────────
	// @InjectMocks creates the real CartService and injects the mocks above into
	// it.

	@InjectMocks
	private CartService cartService;

	// ── Shared Test Data ──────────────────────────────────────────────────────
	// These objects are re-created before each test by @BeforeEach.

	private User testUser;
	private Product testProduct;

	/**
	 * Runs before every single @Test method to set up fresh test data.
	 * This prevents one test's state from leaking into another.
	 */
	@BeforeEach
	@SuppressWarnings("unused")
	void setUp() {
		// Build a test user entity (no DB needed — just plain Java objects)
		testUser = User.builder()
				.id(UUID.randomUUID())
				.email("test@example.com")
				.passwordHash("hashed")
				.build();

		// Build a test product entity
		testProduct = Product.builder()
				.id(UUID.randomUUID())
				.name("Laptop Dell")
				.priceCents(150000) // $1,500.00
				.stockQty(10)
				.isActive(true)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: addToCart()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_CART_001: Happy path — add a valid product to an empty cart.
	 *
	 * The product exists, is active, has enough stock, and the cart is empty
	 * (no existing cart item for this product). A new CartItem should be created.
	 */
	@Test
	@DisplayName("TC_CART_001 – addToCart: creates new cart item for valid product")
	void addToCart_validProduct_createsNewCartItem() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(testProduct.getId());
		request.setQuantity(2);

		// Mock: productRepository.findById returns our test product
		when(productRepository.findById(testProduct.getId()))
				.thenReturn(Optional.of(testProduct));

		// Mock: no existing cart item for this user+product combo (empty cart)
		when(cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getId()))
				.thenReturn(Optional.empty());

		// Mock: cartItemRepository.save returns the item we give it
		when(cartItemRepository.save(any(CartItem.class)))
				.thenAnswer(invocation -> {
					// Simulate what the DB would do — assign an ID and return it
					CartItem item = invocation.getArgument(0);
					item = CartItem.builder()
							.id(UUID.randomUUID())
							.user(testUser)
							.product(testProduct)
							.quantity(item.getQuantity())
							.createdAt(Instant.now())
							.updatedAt(Instant.now())
							.build();
					return item;
				});

		// Mock: productService.toProductResponse (needed by toCartItemResponse helper)
		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		CartDto.CartItemResponse response = cartService.addToCart(testUser, request);

		// ── Assert ─────────────────────────────────────────────────────────────
		// The response should reflect the quantity we requested
		assertThat(response.getQuantity()).isEqualTo(2);

		// Verify the repository was called exactly once to save the new item
		verify(cartItemRepository, times(1)).save(any(CartItem.class));
	}

	/**
	 * TC_CART_007: Edge case — adding the same product again should merge (upsert),
	 * not create a duplicate cart entry.
	 *
	 * If product P001 is already in the cart with qty=2, and the user adds 3 more,
	 * the result should be qty=5 (not two separate entries of qty=2 and qty=3).
	 */
	@Test
	@DisplayName("TC_CART_007 – addToCart: increments quantity when product already in cart (upsert)")
	void addToCart_existingProduct_incrementsQuantity() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(testProduct.getId());
		request.setQuantity(3); // User wants to add 3 more

		// There is already a cart item with quantity=2 in the cart
		CartItem existingItem = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(testProduct)
				.quantity(2) // existing quantity
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(productRepository.findById(testProduct.getId()))
				.thenReturn(Optional.of(testProduct));

		// Mock: an existing item IS found in the cart
		when(cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getId()))
				.thenReturn(Optional.of(existingItem));

		// Mock: save returns the item (with updated quantity)
		when(cartItemRepository.save(any(CartItem.class)))
				.thenAnswer(inv -> inv.getArgument(0));

		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		CartDto.CartItemResponse response = cartService.addToCart(testUser, request);

		// ── Assert ─────────────────────────────────────────────────────────────
		// The quantity should be 2 (existing) + 3 (new) = 5
		assertThat(response.getQuantity()).isEqualTo(5);

		// Verify save was called (to persist the updated quantity)
		verify(cartItemRepository, times(1)).save(any(CartItem.class));
	}

	/**
	 * TC_CART_NEG_007: Negative — product does not exist in the database.
	 *
	 * When a non-existent product ID is submitted, the service should throw
	 * EntityNotFoundException, which the GlobalExceptionHandler converts to a 404.
	 */
	@Test
	@DisplayName("TC_CART_NEG_007 – addToCart: throws EntityNotFoundException for non-existent product")
	void addToCart_productNotFound_throwsEntityNotFoundException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		final UUID nonExistentId = UUID.randomUUID();
		request.setProductId(nonExistentId);
		request.setQuantity(1);

		// Mock: no product found in the database
		when(productRepository.findById(nonExistentId)).thenReturn(Optional.empty());

		// ── Act & Assert ───────────────────────────────────────────────────────
		// assertThatThrownBy is cleaner than try/catch in tests
		assertThatThrownBy(() -> cartService.addToCart(testUser, request))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("Product not found");

		// Verify the repository was queried but save was NEVER called (no partial
		// state)
		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_004: Negative — product exists but isActive = false.
	 *
	 * Inactive/retired products must not be purchasable.
	 */
	@Test
	@DisplayName("TC_CART_004 – addToCart: throws BadRequestException for inactive product")
	void addToCart_inactiveProduct_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		// Make the product inactive
		testProduct.setIsActive(false);

		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(testProduct.getId());
		request.setQuantity(1);

		when(productRepository.findById(testProduct.getId()))
				.thenReturn(Optional.of(testProduct));

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> cartService.addToCart(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("not available");

		// Cart should NOT be modified
		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_NEG_012: Negative — product stock is insufficient.
	 */
	@Test
	@DisplayName("TC_CART_NEG_012 – addToCart: throws BadRequestException when quantity exceeds stock")
	void addToCart_exceedsStock_throwsBadRequestException() {
		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(testProduct.getId());
		request.setQuantity(testProduct.getStockQty() + 1); // Exceeds stock

		when(productRepository.findById(testProduct.getId()))
				.thenReturn(Optional.of(testProduct));
		when(cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getId()))
				.thenReturn(Optional.empty());

		assertThatThrownBy(() -> cartService.addToCart(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Stock not available");

		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_NEG_013: Negative — adding to existing cart item exceeds stock.
	 */
	@Test
	@DisplayName("TC_CART_NEG_013 – addToCart: throws BadRequestException when combined quantity exceeds stock")
	void addToCart_existingItemExceedsStock_throwsBadRequestException() {
		final CartDto.AddToCartRequest request = new CartDto.AddToCartRequest();
		request.setProductId(testProduct.getId());
		request.setQuantity(5); // Add 5

		CartItem existingItem = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(testProduct)
				.quantity(testProduct.getStockQty() - 2) // Existing is stock - 2
				.build();

		when(productRepository.findById(testProduct.getId()))
				.thenReturn(Optional.of(testProduct));
		when(cartItemRepository.findByUserIdAndProductId(testUser.getId(), testProduct.getId()))
				.thenReturn(Optional.of(existingItem));

		// existing (8) + new (5) = 13 > stock (10)
		assertThatThrownBy(() -> cartService.addToCart(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Stock not available");

		verify(cartItemRepository, never()).save(any());
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: updateQuantity()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_CART_003: Happy path — update the quantity of an existing cart item.
	 */
	@Test
	@DisplayName("TC_CART_003 – updateQuantity: successfully updates cart item quantity")
	void updateQuantity_validRequest_updatesQuantity() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID cartItemId = UUID.randomUUID();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(testProduct)
				.quantity(1)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(5); // Change quantity from 1 to 5

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));
		when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		CartDto.CartItemResponse response = cartService.updateQuantity(testUser, cartItemId, request);

		// ── Assert ─────────────────────────────────────────────────────────────
		assertThat(response.getQuantity()).isEqualTo(5);
		verify(cartItemRepository, times(1)).save(any(CartItem.class));
	}

	/**
	 * TC_CART_NEG_008: Security check — a user must not be able to update
	 * another user's cart items (authorization check).
	 */
	@Test
	@DisplayName("TC_CART_NEG_008 – updateQuantity: throws AccessDeniedException when item belongs to another user")
	void updateQuantity_differentUser_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID cartItemId = UUID.randomUUID();

		// Create a DIFFERENT user who owns the cart item
		final User anotherUser = User.builder()
				.id(UUID.randomUUID())
				.email("other@example.com")
				.passwordHash("hash")
				.build();

		// The cart item belongs to anotherUser, not testUser
		final CartItem itemOwnedByOtherUser = CartItem.builder()
				.id(cartItemId)
				.user(anotherUser) // ← different owner
				.product(testProduct)
				.quantity(1)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(3);

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(itemOwnedByOtherUser));

		// ── Act & Assert ───────────────────────────────────────────────────────
		// testUser trying to modify anotherUser's item → should be rejected
		assertThatThrownBy(() -> cartService.updateQuantity(testUser, cartItemId, request))
				.isInstanceOf(AccessDeniedException.class)
				.hasMessageContaining("does not belong");
	}

	/**
	 * TC_CART_NEG_009: Negative — cart item ID not found during quantity update.
	 */
	@Test
	@DisplayName("TC_CART_NEG_009 – updateQuantity: throws EntityNotFoundException for non-existent cart item")
	void updateQuantity_cartItemNotFound_throwsEntityNotFoundException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID nonExistentId = UUID.randomUUID();
		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(2);

		when(cartItemRepository.findById(nonExistentId)).thenReturn(Optional.empty());

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> cartService.updateQuantity(testUser, nonExistentId, request))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("Cart item not found");
	}

	/**
	 * TC_CART_NEG_014: Negative — update quantity exceeds stock.
	 */
	@Test
	@DisplayName("TC_CART_NEG_014 – updateQuantity: throws BadRequestException when quantity exceeds stock")
	void updateQuantity_exceedsStock_throwsBadRequestException() {
		final UUID cartItemId = UUID.randomUUID();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(testProduct)
				.quantity(1)
				.build();

		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(testProduct.getStockQty() + 1); // Exceeds stock

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));

		assertThatThrownBy(() -> cartService.updateQuantity(testUser, cartItemId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Stock not available");

		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_NEG_015: Negative — quantity is zero (invalid).
	 */
	@Test
	@DisplayName("TC_CART_NEG_015 – updateQuantity: throws BadRequestException when quantity is zero")
	void updateQuantity_zeroQuantity_throwsBadRequestException() {
		final UUID cartItemId = UUID.randomUUID();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(testProduct)
				.quantity(1)
				.build();

		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(0);

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));

		assertThatThrownBy(() -> cartService.updateQuantity(testUser, cartItemId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Quantity must be at least 1");
		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_NEG_016: Negative — quantity is negative (invalid).
	 */
	@Test
	@DisplayName("TC_CART_NEG_016 – updateQuantity: throws BadRequestException when quantity is negative")
	void updateQuantity_negativeQuantity_throwsBadRequestException() {
		final UUID cartItemId = UUID.randomUUID();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(testProduct)
				.quantity(1)
				.build();

		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(-3);

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));

		assertThatThrownBy(() -> cartService.updateQuantity(testUser, cartItemId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Quantity must be at least 1");
		verify(cartItemRepository, never()).save(any());
	}

	/**
	 * TC_CART_NEG_017: Negative — product is inactive when updating quantity.
	 */
	@Test
	@DisplayName("TC_CART_NEG_017 – updateQuantity: throws BadRequestException when product is inactive")
	void updateQuantity_inactiveProduct_throwsBadRequestException() {
		final UUID cartItemId = UUID.randomUUID();
		final Product inactiveProduct = Product.builder()
				.id(testProduct.getId())
				.name(testProduct.getName())
				.priceCents(testProduct.getPriceCents())
				.stockQty(testProduct.getStockQty())
				.isActive(false)
				.build();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(inactiveProduct)
				.quantity(1)
				.build();

		final CartDto.UpdateCartRequest request = new CartDto.UpdateCartRequest();
		request.setQuantity(2);

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));

		assertThatThrownBy(() -> cartService.updateQuantity(testUser, cartItemId, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Product is not available");
		verify(cartItemRepository, never()).save(any());
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: removeFromCart()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_CART_005: Happy path — successfully remove an item from the cart.
	 */
	@Test
	@DisplayName("TC_CART_005 – removeFromCart: deletes item when user owns it")
	void removeFromCart_ownedItem_deletesSuccessfully() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID cartItemId = UUID.randomUUID();
		final CartItem existingItem = CartItem.builder()
				.id(cartItemId)
				.user(testUser)
				.product(testProduct)
				.quantity(1)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(existingItem));
		// delete() is void — no need to mock its return value

		// ── Act ────────────────────────────────────────────────────────────────
		cartService.removeFromCart(testUser, cartItemId);

		// ── Assert ─────────────────────────────────────────────────────────────
		// Verify that delete was called with the correct item
		verify(cartItemRepository, times(1)).delete(existingItem);
	}

	/**
	 * TC_CART_NEG_010: Security — user cannot delete another user's cart item.
	 */
	@Test
	@DisplayName("TC_CART_NEG_010 – removeFromCart: throws AccessDeniedException for item belonging to another user")
	void removeFromCart_itemOwnedByOtherUser_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID cartItemId = UUID.randomUUID();

		final User anotherUser = User.builder()
				.id(UUID.randomUUID())
				.email("other@example.com")
				.passwordHash("hash")
				.build();

		final CartItem itemOwnedByOtherUser = CartItem.builder()
				.id(cartItemId)
				.user(anotherUser)
				.product(testProduct)
				.quantity(1)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(itemOwnedByOtherUser));

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> cartService.removeFromCart(testUser, cartItemId))
				.isInstanceOf(AccessDeniedException.class);

		// Verify delete was NEVER called — we stopped before deleting
		verify(cartItemRepository, never()).delete(any());
	}

	/**
	 * TC_CART_NEG_011: Negative — trying to remove a cart item that doesn't exist.
	 */
	@Test
	@DisplayName("TC_CART_NEG_011 – removeFromCart: throws EntityNotFoundException for non-existent item")
	void removeFromCart_itemNotFound_throwsEntityNotFoundException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID nonExistentId = UUID.randomUUID();
		when(cartItemRepository.findById(nonExistentId)).thenReturn(Optional.empty());

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> cartService.removeFromCart(testUser, nonExistentId))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("Cart item not found");

		verify(cartItemRepository, never()).delete(any());
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: getCart()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_CART_GET_001: Happy path — retrieve a user's cart (non-empty).
	 */
	@Test
	@DisplayName("TC_CART_GET_001 – getCart: returns list of cart items for user")
	void getCart_returnsAllItemsForUser() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final CartItem item = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(testProduct)
				.quantity(3)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findByUserId(testUser.getId())).thenReturn(List.of(item));
		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		final List<CartDto.CartItemResponse> result = cartService.getCart(testUser);

		// ── Assert ─────────────────────────────────────────────────────────────
		assertThat(result).hasSize(1);
		assertThat(result.get(0).getQuantity()).isEqualTo(3);
	}

	/**
	 * TC_CART_GET_002: Edge case — empty cart returns an empty list (not null).
	 */
	@Test
	@DisplayName("TC_CART_GET_002 – getCart: returns empty list when cart is empty")
	void getCart_emptyCart_returnsEmptyList() {
		// ── Arrange ────────────────────────────────────────────────────────────
		when(cartItemRepository.findByUserId(testUser.getId())).thenReturn(List.of());

		// ── Act ────────────────────────────────────────────────────────────────
		final List<CartDto.CartItemResponse> result = cartService.getCart(testUser);

		// ── Assert ─────────────────────────────────────────────────────────────
		// Must return an empty collection — NOT null (that would cause
		// NullPointerException in callers)
		assertThat(result).isNotNull().isEmpty();
	}
}
