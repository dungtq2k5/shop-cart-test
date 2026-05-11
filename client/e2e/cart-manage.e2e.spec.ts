import { test, expect } from "@playwright/test";
import { CartPage } from "./pages/CartPage";

test.describe("Cart Management E2E", () => {
  let cartItems: Array<{
    id: string;
    product: {
      id: string;
      name: string;
      priceCents: number;
      stockQty: number;
    };
    quantity: number;
    subtotalCents: number;
  }>;
  let forceDeleteNotFound = false;

  test.beforeEach(async ({ page }) => {
    cartItems = [
      {
        id: "cart-item-1",
        product: {
          id: "prod-1",
          name: "Test Product 1",
          priceCents: 10000,
          stockQty: 3,
        },
        quantity: 1,
        subtotalCents: 10000,
      },
    ];
    forceDeleteNotFound = false;

    await page.route("**/api/v1/auth/check", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            id: "user-1",
            email: "testuser@example.com",
            role: "USER",
          },
        },
      });
    });

    await page.route("**/api/v1/products**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            content: [
              {
                id: "prod-1",
                name: "Test Product 1",
                description: "A product for testing",
                priceCents: 10000,
                stockQty: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            page: {
              size: 10,
              number: 0,
              totalElements: 1,
              totalPages: 1,
            },
          },
        },
      });
    });

    await page.route("**/api/v1/cart**", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          json: { success: true, data: cartItems },
        });
        return;
      }

      if (method === "PATCH") {
        const body = route.request().postDataJSON() as { quantity?: number };
        const cartItemId = route.request().url().split("/").pop();
        const target = cartItems.find((item) => item.id === cartItemId);

        if (!target || typeof body.quantity !== "number") {
          await route.fulfill({
            status: 400,
            json: { success: false, message: "Cart item not found" },
          });
          return;
        }

        if (body.quantity > target.product.stockQty) {
          await route.fulfill({
            status: 400,
            json: { success: false, message: "Stock not available" },
          });
          return;
        }

        target.quantity = body.quantity;
        target.subtotalCents = target.product.priceCents * body.quantity;
        await route.fulfill({
          status: 200,
          json: { success: true, data: target },
        });
        return;
      }

      if (method === "DELETE") {
        const cartItemId = route.request().url().split("/").pop();
        const existingIndex = cartItems.findIndex(
          (item) => item.id === cartItemId,
        );

        if (forceDeleteNotFound || existingIndex < 0) {
          await route.fulfill({
            status: 404,
            json: { success: false, message: "Cart item not found" },
          });
          return;
        }

        cartItems = cartItems.filter((item) => item.id !== cartItemId);
        await route.fulfill({
          status: 200,
          json: { success: true, message: "Item removed from cart", data: null },
        });
        return;
      }

      await route.continue();
    });

    // Login setup: set token before first load and wait for navbar.
    await page.addInitScript(() => localStorage.setItem("token", "mock-token"));
    await page.goto("/");
    await page.waitForSelector("#navbar-cart-link");
  });

  test("Update quantity successfully", async ({ page }) => {
    const cartPage = new CartPage(page);

    // Arrange: open cart with 1 item
    await cartPage.goToCart();
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveText("1");

    // Act: increase quantity
    await page.locator("#cart-qty-inc-cart-item-1").click();

    // Assert: quantity and subtotal reflect the new value
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveText("2");
    await expect(page.getByTestId("cart-item-subtotal-cart-item-1")).toHaveText(
      "$200.00",
    );
    await expect(page.getByTestId("cart-summary-total")).toHaveText("$200.00");

    // Assert: cart badge updates
    await expect(cartPage.cartBadge).toContainText("2");

    // NOTE: No explicit success toast for updateQuantity in current UI.
    const toastCount = await page.getByRole("status").count();
    if (toastCount > 0) {
      await expect(page.getByRole("status")).toContainText(/updated|success/i);
    }
  });

  test("Remove item successfully", async ({ page }) => {
    const cartPage = new CartPage(page);

    // Arrange: open cart with 1 item
    await cartPage.goToCart();
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveText("1");

    // Act: remove the item
    await page.locator("#cart-remove-cart-item-1").click();

    // Assert: item disappears and success toast shows
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveCount(0);
    await expect(page.getByTestId("cart-summary-total")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("removed from cart");
    await expect(page.getByText("Your cart is empty")).toBeVisible();
    await expect(cartPage.cartBadge).toHaveCount(0);
  });

  test("Update quantity exceeds stock", async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goToCart();

    // Simulate backend validation failure when quantity increases
    await page.route("**/api/v1/cart/**", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 400,
          json: { success: false, message: "Stock not available" },
        });
        return;
      }
      await route.continue();
    });

    // Act: attempt to increase quantity
    await page.locator("#cart-qty-inc-cart-item-1").click();

    // Assert: quantity remains unchanged
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveText("1");

    // NOTE: No error toast for updateQuantity in current UI.
    const toastCount = await page.getByRole("status").count();
    if (toastCount > 0) {
      await expect(page.getByRole("status")).toContainText("Stock not available");
    }
  });
});

test.describe("Cart Management E2E - Unauthorized", () => {
  test("Unauthorized user is redirected to login", async ({ page }) => {
    await page.route("**/api/v1/auth/check", async (route) => {
      await route.fulfill({ status: 401, json: { success: false } });
    });

    await page.route("**/api/v1/products**", async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            content: [],
            page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
          },
        },
      });
    });

    // Clear auth token before visiting cart
    await page.addInitScript(() => localStorage.removeItem("token"));
    await page.goto("/");
    await page.goto("/cart");
    await page.waitForURL("**/login");
    await expect(page.locator("#login-form")).toBeVisible();
  });
});
