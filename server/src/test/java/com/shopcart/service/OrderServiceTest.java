package com.shopcart.service;

import java.time.Instant;
import java.util.ArrayList;
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

import com.shopcart.dto.OrderDto;
import com.shopcart.entity.CartItem;
import com.shopcart.entity.Coupon;
import com.shopcart.entity.Order;
import com.shopcart.entity.Order.OrderStatus;
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

/**
 * Unit tests for {@link OrderService}.
 *
 * Coverage areas:
 * 1. checkout() – create order, deduct stock, clear cart, apply coupon
 * 2. getMyOrders() – retrieve order history
 * 3. cancelOrder() – cancel PENDING order and refund stock
 *
 * Test pattern: AAA (Arrange → Act → Assert)
 * Isolation: All repository calls are mocked — no real database is used.
 *
 * @see OrderService
 */
@DisplayName("OrderService – Unit Tests")
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderServiceTest {

	// ── Mocks ──────────────────────────────────────────────────────────────────

	@Mock
	private OrderRepository orderRepository;

	@Mock
	private CartItemRepository cartItemRepository;

	@Mock
	private ProductRepository productRepository;

	@Mock
	private CouponRepository couponRepository;

	@Mock
	private ProductService productService; // used inside toOrderResponse()

	// ── System Under Test ─────────────────────────────────────────────────────

	@InjectMocks
	private OrderService orderService;

	// ── Shared Test Fixtures ──────────────────────────────────────────────────

	private User testUser;
	private Product productA;
	private Product productB;
	private CartItem cartItemA;
	private CartItem cartItemB;

	/**
	 * Create fresh test data before each test method.
	 * Using @BeforeEach ensures tests are independent of each other.
	 */
	@BeforeEach
	@SuppressWarnings("unused")
	void setUp() {
		testUser = User.builder()
				.id(UUID.randomUUID())
				.email("buyer@example.com")
				.passwordHash("hashed")
				.build();

		// Product A: $50.00, 10 in stock
		productA = Product.builder()
				.id(UUID.randomUUID())
				.name("Wireless Mouse")
				.priceCents(5000)
				.stockQty(10)
				.isActive(true)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		// Product B: $200.00, 5 in stock
		productB = Product.builder()
				.id(UUID.randomUUID())
				.name("Mechanical Keyboard")
				.priceCents(20000)
				.stockQty(5)
				.isActive(true)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		// Cart item: 2 × Wireless Mouse
		cartItemA = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(productA)
				.quantity(2)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		// Cart item: 1 × Mechanical Keyboard
		cartItemB = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(productB)
				.quantity(1)
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: checkout()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_PURCHASE_001: Happy path — place an order successfully.
	 *
	 * Verifies the full checkout sequence:
	 * 1. Cart items are loaded.
	 * 2. Stock is deducted.
	 * 3. Order + OrderItems are persisted.
	 * 4. Cart is cleared.
	 * 5. Response reflects correct totals.
	 */


	//TestcreateOrder()–tạođơnhàng, trừtồnkho
	@Test
	@DisplayName("TC_PURCHASE_001 – checkout: places order successfully and deducts stock")
	void checkout_validCart_createsOrderAndDeductsStock() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("123 Main St, City");
		// No coupon code → no discount

		// The user's cart contains two items
		when(cartItemRepository.findByUserId(testUser.getId()))
				.thenReturn(List.of(cartItemA, cartItemB));

		// productRepository.save is called per product (to deduct stock)
		when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

		// orderRepository.save returns the order we give it
		when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

		// productService.toProductResponse is needed inside toOrderResponse()
		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		OrderDto.OrderResponse response = orderService.checkout(testUser, request);

		// ── Assert ─────────────────────────────────────────────────────────────
		// 2×$50 + 1×$200 = $300 → 30000 cents + 500 shipping = 30500 cents
		assertThat(response.getTotalAmountCents()).isEqualTo(30500);
		assertThat(response.getDiscountAmountCents()).isZero();
		assertThat(response.getDeliveryAddress()).isEqualTo("123 Main St, City");
		assertThat(response.getStatus()).isEqualTo("PENDING");

		// Verify stock deduction: productRepository.save called twice (one per product)
		verify(productRepository, times(2)).save(any(Product.class));

		// Verify stock was actually reduced (productA had 10, we ordered 2 → now 8)
		assertThat(productA.getStockQty()).isEqualTo(8);
		assertThat(productB.getStockQty()).isEqualTo(4);

		// Verify order was saved exactly once
		verify(orderRepository, times(1)).save(any(Order.class));

		// Verify cart was cleared
		verify(cartItemRepository, times(1)).deleteByUserId(testUser.getId());
	}

	//•TestgetOrderById()–lấythôngtinđơnhàng

	@Test
	@DisplayName("TC_PUR_GET_003 – getOrderById: returns specific order details successfully")
	void getOrderById_returnsOrderDetails() {
		// 1. Arrange (Chuẩn bị dữ liệu): Tạo 1 đơn hàng ảo
		final UUID orderId = UUID.randomUUID();
		final Order mockOrder = Order.builder()
				.id(orderId)
				.user(testUser)
				.status(OrderStatus.PENDING)
				.totalAmountCents(15000)
				.deliveryAddress("999 Verified Street")
				.build();

		// Giả lập (Mock) khi tìm ID này thì trả về đơn hàng ảo
		when(orderRepository.findByIdAndUserId(orderId, testUser.getId()))
				.thenReturn(Optional.of(mockOrder));

		// 2. Act (Thực thi): Gọi hàm lấy đơn hàng
		// Lưu ý: Nếu trong OrderService của bạn tên hàm là getOrderDetail thì sửa lại nhé
		final OrderDto.OrderResponse result = orderService.getOrderById(testUser, orderId);

		// 3. Assert (Xác nhận): Kiểm tra xem kết quả trả về có đúng địa chỉ và trạng thái không
		assertThat(result).isNotNull();
		assertThat(result.getStatus()).isEqualTo("PENDING");
		assertThat(result.getDeliveryAddress()).isEqualTo("999 Verified Street");
	}
	/**
	 * TC_PURCHASE_002: Happy path — apply a percentage-based coupon (SAVE10 = 10%
	 * off).
	 *
	 * Cart total = $100.00 (10000 cents)
	 * Coupon 10% → discount = 1000 cents
	 * Final total = 9000 cents ($90.00)
	 */

	//•TestcalculateOrderTotal()–tínhtổnggiáchínhxác

	@Test
	@DisplayName("TC_PURCHASE_002 – checkout: applies percentage coupon and calculates correct discount")
	void checkout_withPercentageCoupon_calculatesDiscountCorrectly() {
		// ── Arrange ────────────────────────────────────────────────────────────
		// Single cart item: 1 × productA (5000 cents), qty=2 → subtotal 10000
		when(cartItemRepository.findByUserId(testUser.getId()))
				.thenReturn(List.of(cartItemA)); // 2 × 5000 = 10000

		// Set up an active 10% coupon named "SAVE10"
		final Coupon save10Coupon = Coupon.builder()
				.id(UUID.randomUUID())
				.code("SAVE10")
				.discountPercentage(10)
				.isActive(true)
				.validUntil(null) // no expiry date
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("456 Oak Ave");
		request.setCouponCode("SAVE10");

		when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(save10Coupon));
		when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
		when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		final OrderDto.OrderResponse response = orderService.checkout(testUser, request);

		// ── Assert ─────────────────────────────────────────────────────────────
		assertThat(response.getTotalAmountCents()).isEqualTo(9500); // 10000 - 10% + 500
		assertThat(response.getDiscountAmountCents()).isEqualTo(1000); // 10% of 10000
		assertThat(response.getCouponCode()).isEqualTo("SAVE10");
	}

	/**
	 * TC_PURCHASE_NEG_001: Negative — checkout with an empty cart.
	 *
	 * Users should not be able to place an order with no items.
	 */
	@Test
	@DisplayName("TC_PUR_NEG_001 – checkout: throws BadRequestException when cart is empty")
	void checkout_emptyCart_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		// Cart is empty
		when(cartItemRepository.findByUserId(testUser.getId())).thenReturn(List.of());

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("789 Pine Rd");

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.checkout(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Cart is empty");

		// No order should have been saved
		verify(orderRepository, never()).save(any());
	}

	/**
	 * TC_PURCHASE_003: Negative — insufficient stock at checkout time (race
	 * condition).
	 *
	 * Scenario: user has 3 units of Product B in cart, but stock drops to 2
	 * before checkout completes (another user bought one).
	 * The transaction must roll back — no partial order should be created.
	 */

	//•TestcheckStockBeforeOrder()–kiểmtratồnkho
	@Test
	@DisplayName("TC_PUR_003 – checkout: throws InsufficientStockException when stock is insufficient")
	void checkout_insufficientStock_throwsInsufficientStockException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		// Create a cart item requesting MORE than available stock
		final CartItem oversizedItem = CartItem.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.product(productB)
				.quantity(10) // Requesting 10, but productB only has 5 in stock
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findByUserId(testUser.getId())).thenReturn(List.of(oversizedItem));

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("101 Elm St");

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.checkout(testUser, request))
				.isInstanceOf(InsufficientStockException.class);

		// Because of @Transactional, the order should NOT be saved
		verify(orderRepository, never()).save(any());
	}

	/**
	 * TC_PUR_NEG_005: Negative — coupon code does not exist.
	 */
	@Test
	@DisplayName("TC_PUR_NEG_005 – checkout: throws BadRequestException for non-existent coupon")
	void checkout_invalidCoupon_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		when(cartItemRepository.findByUserId(testUser.getId()))
				.thenReturn(List.of(cartItemA));

		// Mock: coupon not found in DB
		when(couponRepository.findByCode("FAKE100")).thenReturn(Optional.empty());

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("202 Birch Blvd");
		request.setCouponCode("FAKE100");

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.checkout(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("Coupon code not found");
	}

	/**
	 * TC_PUR_NEG_006: Negative — coupon is inactive (soft-disabled by admin).
	 */
	@Test
	@DisplayName("TC_PUR_NEG_006 – checkout: throws BadRequestException for inactive coupon")
	void checkout_inactiveCoupon_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final Coupon inactiveCoupon = Coupon.builder()
				.id(UUID.randomUUID())
				.code("OLD10")
				.discountPercentage(10)
				.isActive(false) // ← inactive!
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findByUserId(testUser.getId()))
				.thenReturn(List.of(cartItemA));
		when(couponRepository.findByCode("OLD10")).thenReturn(Optional.of(inactiveCoupon));

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("303 Cedar Ct");
		request.setCouponCode("OLD10");

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.checkout(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("inactive");
	}

	/**
	 * TC_PUR_NEG_007: Negative — coupon has an expiry date in the past.
	 */
	@Test
	@DisplayName("TC_PUR_NEG_007 – checkout: throws BadRequestException for expired coupon")
	void checkout_expiredCoupon_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final Coupon expiredCoupon = Coupon.builder()
				.id(UUID.randomUUID())
				.code("EXPIRED")
				.discountPercentage(20)
				.isActive(true)
				.validUntil(Instant.now().minusSeconds(86400)) // expired 1 day ago
				.createdAt(Instant.now())
				.updatedAt(Instant.now())
				.build();

		when(cartItemRepository.findByUserId(testUser.getId()))
				.thenReturn(List.of(cartItemA));
		when(couponRepository.findByCode("EXPIRED")).thenReturn(Optional.of(expiredCoupon));

		final OrderDto.CheckoutRequest request = new OrderDto.CheckoutRequest();
		request.setDeliveryAddress("404 Maple Dr");
		request.setCouponCode("EXPIRED");

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.checkout(testUser, request))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("expired");
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: cancelOrder()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_PURCHASE_003 / TC_PUR_06: Happy path — cancel a PENDING order.
	 *
	 * Verifies:
	 * - Status changes from PENDING → CANCELLED
	 * - Stock is refunded for each order item
	 */

	//•TestcancelOrder()–hủyđơn,hoàntồnkho
	@Test
	@DisplayName("TC_PUR_006 – cancelOrder: cancels PENDING order and refunds product stock")
	void cancelOrder_pendingOrder_cancelsAndRefundsStock() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID orderId = UUID.randomUUID();

		// Create an order item referencing productA (qty=2, productA stock is currently
		// 8)
		productA.setStockQty(8); // after a previous purchase

		final OrderItem orderItem = OrderItem.builder()
				.id(UUID.randomUUID())
				.product(productA)
				.quantity(2)
				.unitPriceCents(productA.getPriceCents())
				.build();

		// Build a PENDING order containing that item
		final Order pendingOrder = Order.builder()
				.id(orderId)
				.user(testUser)
				.status(OrderStatus.PENDING)
				.totalAmountCents(10000)
				.discountAmountCents(0)
				.deliveryAddress("123 Main St")
				.orderItems(new ArrayList<>(List.of(orderItem)))
				.build();
		// Link the item back to the order
		orderItem.setOrder(pendingOrder);

		when(orderRepository.findByIdAndUserId(orderId, testUser.getId()))
				.thenReturn(Optional.of(pendingOrder));

		when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

		// save() returns the order — simulate DB returning it
		when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

		when(productService.toProductResponse(any(Product.class)))
				.thenReturn(new com.shopcart.dto.ProductDto.ProductResponse());

		// ── Act ────────────────────────────────────────────────────────────────
		final OrderDto.OrderResponse response = orderService.cancelOrder(testUser, orderId);

		// ── Assert ─────────────────────────────────────────────────────────────
		// Status must now be CANCELLED
		assertThat(response.getStatus()).isEqualTo("CANCELLED");

		// Stock should be refunded: productA was at 8, we cancelled 2 → now 10
		assertThat(productA.getStockQty()).isEqualTo(10);

		// Verify productRepository.save was called once for the refunded product
		verify(productRepository, times(1)).save(productA);

		// Verify the updated order was saved
		verify(orderRepository, times(1)).save(pendingOrder);
	}

	/**
	 * TC_PUR_NEG_008: Negative — trying to cancel an already COMPLETED order.
	 *
	 * Only PENDING orders can be cancelled.
	 */
	@Test
	@DisplayName("TC_PUR_NEG_008 – cancelOrder: throws BadRequestException for COMPLETED order")
	void cancelOrder_completedOrder_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID orderId = UUID.randomUUID();

		final Order completedOrder = Order.builder()
				.id(orderId)
				.user(testUser)
				.status(OrderStatus.COMPLETED) // ← already completed
				.totalAmountCents(5000)
				.discountAmountCents(0)
				.deliveryAddress("123 Main St")
				.orderItems(new ArrayList<>())
				.build();

		when(orderRepository.findByIdAndUserId(orderId, testUser.getId()))
				.thenReturn(Optional.of(completedOrder));

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.cancelOrder(testUser, orderId))
				.isInstanceOf(BadRequestException.class)
				.hasMessageContaining("PENDING") // message should tell user why it failed
				.hasMessageContaining("COMPLETED");

		// Stock should NOT be modified
		verify(productRepository, never()).save(any());
	}

	/**
	 * TC_PUR_NEG_009: Negative — trying to cancel an already CANCELLED order.
	 */
	@Test
	@DisplayName("TC_PUR_NEG_009 – cancelOrder: throws BadRequestException for already CANCELLED order")
	void cancelOrder_alreadyCancelledOrder_throwsBadRequestException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID orderId = UUID.randomUUID();

		final Order cancelledOrder = Order.builder()
				.id(orderId)
				.user(testUser)
				.status(OrderStatus.CANCELLED) // ← already cancelled
				.totalAmountCents(5000)
				.discountAmountCents(0)
				.deliveryAddress("456 Oak Ave")
				.orderItems(new ArrayList<>())
				.build();

		when(orderRepository.findByIdAndUserId(orderId, testUser.getId()))
				.thenReturn(Optional.of(cancelledOrder));

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.cancelOrder(testUser, orderId))
				.isInstanceOf(BadRequestException.class);

		verify(productRepository, never()).save(any());
	}

	/**
	 * TC_PUR_NEG_010: Security — user cannot cancel another user's order.
	 *
	 * findByIdAndUserId ensures the order belongs to the requesting user.
	 * If not found, an EntityNotFoundException is thrown (appears as 404).
	 */
	@Test
	@DisplayName("TC_PUR_NEG_010 – cancelOrder: throws EntityNotFoundException when order not found/not owned")
	void cancelOrder_orderNotFound_throwsEntityNotFoundException() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final UUID orderId = UUID.randomUUID();

		// findByIdAndUserId returns empty → either the ID doesn't exist
		// OR the order belongs to a different user (both return 404 for security
		// reasons)
		when(orderRepository.findByIdAndUserId(orderId, testUser.getId()))
				.thenReturn(Optional.empty());

		// ── Act & Assert ───────────────────────────────────────────────────────
		assertThatThrownBy(() -> orderService.cancelOrder(testUser, orderId))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("Order not found");
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Test group: getMyOrders()
	// ══════════════════════════════════════════════════════════════════════════

	/**
	 * TC_PUR_GET_001: Happy path — retrieve user's order history.
	 */
	@Test
	@DisplayName("TC_PUR_GET_001 – getMyOrders: returns list of user's orders")
	void getMyOrders_returnsOrdersForUser() {
		// ── Arrange ────────────────────────────────────────────────────────────
		final Order order1 = Order.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.status(OrderStatus.PENDING)
				.totalAmountCents(5000)
				.discountAmountCents(0)
				.deliveryAddress("123 Main St")
				.orderItems(new ArrayList<>())
				.build();

		final Order order2 = Order.builder()
				.id(UUID.randomUUID())
				.user(testUser)
				.status(OrderStatus.COMPLETED)
				.totalAmountCents(12000)
				.discountAmountCents(1200)
				.deliveryAddress("456 Oak Ave")
				.orderItems(new ArrayList<>())
				.build();

		when(orderRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId()))
				.thenReturn(List.of(order1, order2));

		// ── Act ────────────────────────────────────────────────────────────────
		final List<OrderDto.OrderResponse> result = orderService.getMyOrders(testUser);

		// ── Assert ─────────────────────────────────────────────────────────────
		assertThat(result).hasSize(2);
		assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
		assertThat(result.get(1).getStatus()).isEqualTo("COMPLETED");
		assertThat(result.get(1).getDiscountAmountCents()).isEqualTo(1200);
	}

	/**
	 * TC_PUR_GET_002: Edge case — user with no orders returns empty list.
	 */
	@Test
	@DisplayName("TC_PUR_GET_002 – getMyOrders: returns empty list when user has no orders")
	void getMyOrders_noOrders_returnsEmptyList() {
		// ── Arrange ────────────────────────────────────────────────────────────
		when(orderRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId()))
				.thenReturn(List.of());

		// ── Act ────────────────────────────────────────────────────────────────
		final List<OrderDto.OrderResponse> result = orderService.getMyOrders(testUser);

		// ── Assert ─────────────────────────────────────────────────────────────
		assertThat(result).isNotNull().isEmpty();
	}
}
