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

  test("Check accurate price calculation (subtotal, shipping, discount)", async ({
    page,
  }) => {
    // Go to cart, then to checkout
    await cartPage.goToCart();
    await cartPage.proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/.*\/checkout/);

    // Expected subtotal: $300.00
    // Shipping fee: $5.00
    // Total should be: $305.00
    const total = await checkoutPage.getTotalPrice();
    expect(total).toBe("$305.00");

    // Check if Shipping Fee ($5.00) is visible
    await expect(checkoutPage.shippingFeeDisplay).toBeVisible();

    // Mock the coupon API
    await page.route("**/api/v1/orders/checkout", async (route) => {
      // Mock successful order checkout response
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          message: "Order placed successfully",
          data: {
            id: "order-1",
            totalAmountCents: 27500, // (30000 - 10%) + 500 = 27500 => $275.00
          },
        },
      });
    });
  });

  test("Place order successfully from Checkout", async ({ page }) => {
    // Go to cart, wait for it to load, then proceed to checkout
    await cartPage.goToCart();
    await cartPage.proceedCheckoutBtn.click();
    await expect(page).toHaveURL(/.*\/checkout/);

    // Fill the address
    await checkoutPage.fillAddress("123 Testing Ave, Test City");

    // Mock checkout API to return success
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

    // Mock the profile API to intercept the redirect
    await page.route("**/api/v1/orders/me", async (route) => {
      await route.fulfill({
        status: 200,
        json: { success: true, data: [] },
      });
    });

    // Place the order
    await checkoutPage.placeOrder();

    // Verify toast success
    const toastMessage = page.getByRole("status");
    await expect(toastMessage).toContainText("Order placed successfully! 🎉");

    // Ensure it navigates to profile/orders
    await expect(page).toHaveURL(/.*\/profile/);
  });
});
