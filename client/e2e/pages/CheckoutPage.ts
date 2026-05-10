import type { Page, Locator } from "@playwright/test";

export class CheckoutPage {
  readonly page: Page;
  readonly checkoutForm: Locator;
  readonly addressInput: Locator;
  readonly couponInput: Locator;
  readonly submitBtn: Locator;
  readonly totalDisplay: Locator;
  readonly shippingFeeDisplay: Locator;
  readonly inventoryWarning: Locator;
  constructor(page: Page) {
    this.page = page;
    this.checkoutForm = page.locator("#checkout-form");
    this.addressInput = page.locator("#checkout-address");
    this.couponInput = page.locator("#checkout-coupon");
    this.submitBtn = page.locator("#checkout-submit");

    this.totalDisplay = page.locator('#checkout-total-price');
    // Shipping fee displays as $5.00
    this.shippingFeeDisplay = page.locator("text=$5.00");
    this.inventoryWarning = page.locator("#inventory-warning");
  }

  async fillAddress(address: string) {
    await this.addressInput.fill(address);
  }

  async applyCoupon(code: string) {
    await this.couponInput.fill(code);
  }

  async placeOrder() {
    await this.submitBtn.click();
    // Wait for the success toast
    await this.page.waitForSelector("role=status", { state: "attached" });
  }

  async getTotalPrice(): Promise<string> {
    const text = await this.totalDisplay.innerText();
    return text.trim();
  }
}

export default CheckoutPage;
