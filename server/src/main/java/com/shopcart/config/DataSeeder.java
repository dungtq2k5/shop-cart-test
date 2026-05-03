package com.shopcart.config;

import com.shopcart.entity.*;
import com.shopcart.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }

        log.info("Seeding database with mock data...");

        // ── Users ─────────────────────────────────────────────
        User user1 = userRepository.save(User.builder()
                .email("test1@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .build());
        User user2 = userRepository.save(User.builder()
                .email("test2@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .build());

        // ── Products ──────────────────────────────────────────
        List<Product> products = productRepository.saveAll(List.of(
            product("Wireless Noise-Cancelling Headphones", "Premium over-ear headphones with 30-hour battery life and active noise cancellation.", 29999, 45),
            product("Mechanical Keyboard", "Tenkeyless mechanical keyboard with Cherry MX Red switches and RGB backlight.", 8999, 120),
            product("4K USB-C Monitor", "27-inch 4K IPS display with USB-C power delivery and 99% sRGB coverage.", 49999, 30),
            product("Ergonomic Office Chair", "Breathable mesh chair with lumbar support and adjustable armrests.", 39999, 15),
            product("Laptop Stand (Aluminium)", "Foldable aluminium stand compatible with all 11–17 inch laptops.", 3499, 200),
            product("Smart LED Desk Lamp", "Touch-controlled desk lamp with 5 colour temperatures and USB-A charging port.", 2999, 88),
            product("Portable SSD 1TB", "USB 3.2 Gen 2 portable SSD with read speeds up to 1050 MB/s.", 11999, 60),
            product("Webcam 4K 60fps", "Ultra-HD webcam with autofocus, dual microphone, and low-light correction.", 9499, 40),
            product("USB-C Hub 7-in-1", "Multiport hub with HDMI, USB-A x3, SD card reader, and 100W PD pass-through.", 4299, 150),
            product("Mouse Pad XL", "Extended desk mat (90×40 cm) with non-slip rubber base and stitched edges.", 1999, 300),
            product("Wireless Gaming Mouse", "High-precision 25K DPI sensor with 70-hour battery and customisable RGB.", 7499, 75),
            product("Smart Plug 4-Pack", "Wi-Fi smart plugs with energy monitoring, compatible with Alexa and Google Home.", 3999, 50),
            product("Portable Bluetooth Speaker", "Waterproof IPX7 speaker with 360-degree sound and 24-hour playback.", 6999, 65),
            product("Action Camera 4K", "Waterproof action camera with EIS stabilisation and 170-degree wide angle.", 19999, 25),
            product("Noise-Cancelling Earbuds", "True wireless earbuds with ANC, transparency mode, and 28-hour total battery.", 14999, 55),
            product("Smart Watch Series 5", "Health & fitness smartwatch with GPS, ECG, SpO2, and 7-day battery.", 24999, 35),
            product("E-reader 10-inch", "Glare-free e-ink display with adjustable warm light and 32 GB storage.", 17999, 20),
            product("Robot Vacuum Cleaner", "LiDAR-mapped robot vacuum with mop function and 180-minute runtime.", 34999, 12),
            product("Air Purifier HEPA H13", "360-degree air purifier covering up to 60m² with PM2.5 display.", 22999, 18),
            product("Standing Desk Converter", "Height-adjustable desk converter with dual-monitor shelf and keyboard tray.", 27999, 10)
        ));

        // ── Coupons ───────────────────────────────────────────
        Coupon save10 = couponRepository.save(Coupon.builder()
                .code("SAVE10")
                .discountPercentage(10)
                .isActive(true)
                .validUntil(Instant.now().plus(365, ChronoUnit.DAYS))
                .build());
        Coupon summer50 = couponRepository.save(Coupon.builder()
                .code("SUMMER50")
                .discountPercentage(50)
                .isActive(true)
                .validUntil(Instant.now().plus(180, ChronoUnit.DAYS))
                .build());

        // ── Cart Items for user1 ───────────────────────────────
        cartItemRepository.saveAll(List.of(
            CartItem.builder().user(user1).product(products.get(0)).quantity(1).build(),
            CartItem.builder().user(user1).product(products.get(1)).quantity(2).build(),
            CartItem.builder().user(user1).product(products.get(4)).quantity(1).build()
        ));

        // ── Orders for user1 ──────────────────────────────────
        // Order 1: COMPLETED with SAVE10 coupon
        Product p0 = products.get(0); // Headphones 29999 cents
        Product p2 = products.get(2); // Monitor 49999 cents
        int subtotal1 = p0.getPriceCents() * 1 + p2.getPriceCents() * 1;
        int discount1 = Math.round((subtotal1 * save10.getDiscountPercentage()) / 100.0f);
        Order order1 = orderRepository.save(Order.builder()
                .user(user1)
                .coupon(save10)
                .totalAmountCents(subtotal1 - discount1)
                .discountAmountCents(discount1)
                .deliveryAddress("123 Main Street, Springfield, IL 62701")
                .status(Order.OrderStatus.COMPLETED)
                .build());
        order1.getOrderItems().addAll(List.of(
            OrderItem.builder().order(order1).product(p0).quantity(1).unitPriceCents(p0.getPriceCents()).build(),
            OrderItem.builder().order(order1).product(p2).quantity(1).unitPriceCents(p2.getPriceCents()).build()
        ));
        orderRepository.save(order1);

        // Order 2: PENDING — no coupon
        Product p5 = products.get(5); // Desk Lamp 2999
        Product p9 = products.get(9); // Mouse Pad 1999
        int subtotal2 = p5.getPriceCents() * 2 + p9.getPriceCents() * 1;
        Order order2 = orderRepository.save(Order.builder()
                .user(user1)
                .totalAmountCents(subtotal2)
                .discountAmountCents(0)
                .deliveryAddress("456 Oak Avenue, Austin, TX 78701")
                .status(Order.OrderStatus.PENDING)
                .build());
        order2.getOrderItems().addAll(List.of(
            OrderItem.builder().order(order2).product(p5).quantity(2).unitPriceCents(p5.getPriceCents()).build(),
            OrderItem.builder().order(order2).product(p9).quantity(1).unitPriceCents(p9.getPriceCents()).build()
        ));
        orderRepository.save(order2);

        // Order 3: COMPLETED with SUMMER50 coupon
        Product p13 = products.get(13); // Action Camera 19999
        int subtotal3 = p13.getPriceCents() * 1;
        int discount3 = Math.round((subtotal3 * summer50.getDiscountPercentage()) / 100.0f);
        Order order3 = orderRepository.save(Order.builder()
                .user(user1)
                .coupon(summer50)
                .totalAmountCents(subtotal3 - discount3)
                .discountAmountCents(discount3)
                .deliveryAddress("789 Pine Road, Seattle, WA 98101")
                .status(Order.OrderStatus.COMPLETED)
                .build());
        order3.getOrderItems().add(
            OrderItem.builder().order(order3).product(p13).quantity(1).unitPriceCents(p13.getPriceCents()).build()
        );
        orderRepository.save(order3);

        log.info("Database seeded successfully. Users: test1@example.com / test2@example.com (password: password123)");
    }

    private Product product(String name, String description, int priceCents, int stockQty) {
        return Product.builder()
                .name(name)
                .description(description)
                .priceCents(priceCents)
                .stockQty(stockQty)
                .isActive(true)
                .build();
    }
}
