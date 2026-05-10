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

    // Set token to bypass local checks and wait for auth check to complete.
    await page.goto("http://localhost:5173");
    await page.evaluate(() => localStorage.setItem("token", "mock-token"));
    await page.reload();
    await page.waitForSelector("#navbar-cart-link");
  });

  test("Update quantity and remove item", async ({ page }) => {
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

    // Act: remove the item
    await page.locator("#cart-remove-cart-item-1").click();

    // Assert: item disappears and success toast shows
    await expect(page.getByTestId("cart-qty-cart-item-1")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("removed from cart");
  });

  test("Quantity exceeds stock disables increment", async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goToCart();

    // Act: increment until stock limit (stockQty is 3)
    await page.locator("#cart-qty-inc-cart-item-1").click();
    await page.locator("#cart-qty-inc-cart-item-1").click();

    // Assert: the button is disabled at max stock
    await expect(page.locator("#cart-qty-inc-cart-item-1")).toBeDisabled();
  });

  test("Remove non-existent item shows error toast", async ({ page }) => {
    const cartPage = new CartPage(page);

    await cartPage.goToCart();

    // Force the next DELETE to return 404
    forceDeleteNotFound = true;

    await page.locator("#cart-remove-cart-item-1").click();
    await expect(page.getByRole("status")).toContainText("Cart item not found");
  });
});

test.describe("Cart Management E2E - Unauthorized", () => {
  test("Unauthorized user is redirected to login", async ({ page }) => {
    await page.route("**/api/v1/auth/check", async (route) => {
      await route.fulfill({ status: 401, json: { success: false } });
    });

    await page.goto("http://localhost:5173/cart");
    await page.waitForURL("**/login");
    await expect(page.locator("#login-form")).toBeVisible();
  });
});
