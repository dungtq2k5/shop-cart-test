import { test, expect } from "@playwright/test";
import { CartPage } from "./pages/CartPage";

test.describe("Cart E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the /auth/check to simulate logged-in user
    await page.route(`**/api/v1/auth/check`, async (route) => {
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

    // Mock products API
    await page.route("**/api/v1/products*", async (route) => {
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
                priceCents: 10000, // $100.00
                stockQty: 5,
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

    // Mock the cart API (initially empty, then handle POST to add item)
    await page.route("**/api/v1/cart", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [],
          },
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: "cart-item-1",
              product: {
                id: "prod-1",
                name: "Test Product 1",
                priceCents: 10000,
                stockQty: 5,
              },
              quantity: 1,
              subtotalCents: 10000,
            },
          },
        });
      } else {
        route.continue();
      }
    });

    // Set token to bypass local checks before first load
    await page.addInitScript(() => localStorage.setItem("token", "mock-token"));
    await page.goto("/");

    // Wait for auth check to finish
    await page.waitForSelector("#navbar-cart-link");
  });

  test("Add product to cart successfully", async ({ page }) => {
    // We already mocked POST in beforeEach, but we need the GET /cart to return the new item after adding
    await page.route("**/api/v1/cart", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: [
              {
                id: "cart-item-1",
                product: {
                  id: "prod-1",
                  name: "Test Product 1",
                  priceCents: 10000,
                  stockQty: 5,
                },
                quantity: 1,
                subtotalCents: 10000,
              },
            ],
          },
        });
      } else if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            data: {
              id: "cart-item-1",
              product: {
                id: "prod-1",
                name: "Test Product 1",
                priceCents: 10000,
                stockQty: 5,
              },
              quantity: 1,
              subtotalCents: 10000,
            },
          },
        });
      } else {
        route.continue();
      }
    });

    // 1. Click on the product card to open modal
    await page.locator("#product-card-prod-1").click();

    // 2. Click Add to Cart in modal
    await page.locator("#product-modal-add-to-cart").click();

    // 3. Verify success toast message
    const toastMessage = page.getByRole("status");
    await expect(toastMessage).toContainText("added to cart!");

    // 4. Verify cart badge updates
    const cartPage = new CartPage(page);
    await expect(cartPage.cartBadge).toContainText("1");
  });

  test("Display validation error when exceeding stock quantity", async ({
    page,
  }) => {
    // 1. Click on the product card to open modal
    await page.locator("#product-card-prod-1").click();

    // 2. Increase quantity to exceed stock (stock is 5, max out to 5)
    const incBtn = page.locator("#product-modal-qty-inc");
    await incBtn.click();
    await incBtn.click();
    await incBtn.click();
    await incBtn.click();

    // 3. Verify button is disabled when quantity reaches stock limit
    await expect(incBtn).toBeDisabled();

    // We can also test the backend validation by forcing a bad request if we bypassed frontend
    await page.route("**/api/v1/cart", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 400,
          json: {
            success: false,
            message: "Insufficient stock",
          },
        });
      } else {
        route.continue();
      }
    });

    // Try adding to cart to see error message
    await page.locator("#product-modal-add-to-cart").click();
    const toastMessage = page.getByRole("status");
    await expect(toastMessage).toContainText("Insufficient stock");
  });
});
