import type { Page, Locator } from "@playwright/test";

export class CartPage {
  readonly page: Page;
  readonly cartBadge: Locator;
  readonly proceedCheckoutBtn: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator("#navbar-cart-link span.animate-pulse");
    this.proceedCheckoutBtn = page.locator("#proceed-checkout-btn");
    this.emptyCartMessage = page.locator("text=Your cart is empty");
  }

  async goToCart() {
    await this.page.locator("#navbar-cart-link").click();
    await this.page.waitForURL("**/cart");
  }

  async updateQuantity(cartItemId: string, action: "inc" | "dec") {
    const btn = this.page.locator(`#cart-qty-${action}-${cartItemId}`);
    await btn.click();
    // Wait for network request to complete (simulated by waiting a bit or wait for toast/state)
    await this.page.waitForTimeout(1000);
  }

  async removeCartItem(cartItemId: string) {
    await this.page.locator(`#cart-remove-${cartItemId}`).click();
    await this.page.waitForSelector("role=status", { state: "attached" }); // wait for react-hot-toast
  }

  async getCartCount(): Promise<string> {
    if (await this.cartBadge.isVisible()) {
      return await this.cartBadge.innerText();
    }
    return "0";
  }
}

export default CartPage;
