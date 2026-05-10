import { test, expect } from "@playwright/test";
import { CheckoutPage } from "./pages/CheckoutPage";
import { CartPage } from "./pages/CartPage";

test.describe("Purchase E2E Tests", () => {
  let checkoutPage: CheckoutPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    cartPage = new CartPage(page);

    // Mock auth check
    await page.route("**/api/v1/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: { id: "user-1", email: "testuser@example.com", role: "USER" },
        },
      });
    });

    // Mock users me to prevent 401
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: { id: "user-1", name: "Test User", email: "testuser@example.com" },
        },
      });
    });

    // Mock cart API with items (Total: $300.00)
    await page.route("**/api/v1/cart", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: [
            {
              id: "cart-item-1",
              product: {
                id: "prod-1",
                name: "Test Product",
                priceCents: 15000, // $150.00
                stockQty: 10,
              },
              quantity: 2,
              subtotalCents: 30000, // $300.00
            },
          ],
        },
      });
    });

    await page.goto("http://localhost:5173");
    await page.evaluate(() => localStorage.setItem("token", "mock-token"));
    await page.reload();

    // Wait for auth check to finish
    await page.waitForSelector("#navbar-cart-link");
  });

  // ---------------------------------------------------------
  // ĐÃ SỬA: Thêm thao tác nhập mã giảm giá và check UI thay đổi
  // ---------------------------------------------------------
  test("Check accurate price calculation (subtotal, shipping, discount)", async ({ page }) => {
    // Go to cart, then to checkout
    await cartPage.goToCart();
    await cartPage.proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/.*\/checkout/);

    // 1. Kiểm tra giá ban đầu chưa có mã giảm giá (300 + 5 ship)
    const initialTotal = await checkoutPage.getTotalPrice();
    expect(initialTotal).toBe("$305.00");
    await expect(checkoutPage.shippingFeeDisplay).toBeVisible();

    // 2. Mock API áp dụng mã giảm giá (nếu frontend của bạn có gọi API lúc apply)
    await page.route("**/api/v1/coupons/validate", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: { type: "percentage", value: 10 } // Giảm 10%
        },
      });
    });

    // 3. Thực hiện thao tác nhập mã trên UI
    await checkoutPage.applyCoupon("SAVE10");

    // 4. Expect tổng tiền thay đổi TRÊN MÀN HÌNH UI (300 - 30 + 5 = 275)
    await expect(checkoutPage.totalDisplay).toHaveText("$275.00");
  });

  // (Test case 2: Place order successfully from Checkout - GIỮ NGUYÊN CỦA BẠN)
  test("Place order successfully from Checkout", async ({ page }) => {
    await cartPage.goToCart();
    await cartPage.proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/.*\/checkout/);

    await checkoutPage.fillAddress("123 Testing Ave, Test City");

    await page.route("**/api/v1/orders/checkout", async (route) => {
      const payload = route.request().postDataJSON();
      expect(payload.deliveryAddress).toBe("123 Testing Ave, Test City");

      await route.fulfill({
        status: 200,
        json: {
          success: true,
          message: "Order placed successfully",
          data: { id: "order-123" },
        },
      });
    });

    await page.route("**/api/v1/orders/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, data: [] },
      });
    });

    await checkoutPage.placeOrder();

    const toastMessage = page.getByRole("status");
    await expect(toastMessage).toContainText("Order placed successfully! 🎉");
    await expect(page).toHaveURL(/.*\/profile/);
  });

  // ---------------------------------------------------------
  // ĐÃ THÊM: Test case mới để check cảnh báo hết hàng
  // ---------------------------------------------------------
  test("Show inventory warning when product is out of stock during checkout", async ({ page }) => {
    await cartPage.goToCart();
    await cartPage.proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/.*\/checkout/);

    await checkoutPage.fillAddress("456 Out Of Stock Blvd");

    // Mock API checkout trả về lỗi 400 - Thiếu tồn kho
    await page.route("**/api/v1/orders/checkout", async (route) => {
      await route.fulfill({
        status: 400,
        json: {
          success: false,
          message: "Insufficient stock for Test Product",
        },
      });
    });

    // Bấm nút đặt hàng (Chỉ click, không xài placeOrder() vì hàm đó đang đợi toast success)
    await checkoutPage.submitBtn.click();

    // Expect component InventoryWarning xuất hiện trên màn hình
    await expect(checkoutPage.inventoryWarning).toBeVisible();
    await expect(checkoutPage.inventoryWarning).toContainText("Insufficient stock");
  });
});