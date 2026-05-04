/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { BrowserRouter, useLocation } from "react-router-dom";
import CheckoutPage from "../pages/CheckoutPage";
import { useCartStore } from "../stores/useCartStore";
import api from "../lib/api";
import toast from "react-hot-toast";

// Mock the cart store, api, and toast notifications
vi.mock("../stores/useCartStore");
vi.mock("../lib/api");
vi.mock("react-hot-toast");

// Mock react-router-dom to control useLocation state and useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: vi.fn(),
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Checkout Component Integration", () => {
  const mockClearCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default location state
    (useLocation as any).mockReturnValue({ state: null });

    // Provide default non-empty cart so it doesn't redirect
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: { name: "Test Product", priceCents: 150000 },
          quantity: 2,
          subtotalCents: 300000,
        },
      ],
      subtotalCents: 300000,
      clearCart: mockClearCart,
    });
  });

  test("Test CheckoutSummary component with cart data: Rendering cart data", () => {
    renderWithRouter(<CheckoutPage />);

    // Check if item details are correctly rendered in the summary section
    expect(screen.getByText("Order Summary")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("× 2")).toBeInTheDocument();
  });

  test("Test PriceCalculator component with real-time price calculation: Correct totals are shown", () => {
    // If state has couponCode, it should be rendered
    (useLocation as any).mockReturnValue({ state: { couponCode: "SAVE10" } });

    renderWithRouter(<CheckoutPage />);

    // Total subtotal from store should be correctly formatted to currency
    const subtotalElements = screen.getAllByText("$3,000.00"); // 300000 cents
    expect(subtotalElements.length).toBeGreaterThan(0);

    // Shipping fee should be displayed
    expect(screen.getByText("$5.00")).toBeInTheDocument();

    // Total should include shipping fee (300000 + 500 = 300500)
    expect(screen.getByText("$3,005.00")).toBeInTheDocument();

    // Coupon code should be pre-filled
    const couponInput = document.getElementById(
      "checkout-coupon",
    ) as HTMLInputElement;
    expect(couponInput.value).toBe("SAVE10");
  });

  test("Test API calls and error handling: form submission", async () => {
    renderWithRouter(<CheckoutPage />);

    const addressInput = document.getElementById(
      "checkout-address",
    ) as HTMLTextAreaElement;
    // const submitBtn = document.getElementById("checkout-submit") as HTMLButtonElement;

    const form = document.getElementById("checkout-form") as HTMLFormElement;

    // Empty address should show error
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalledWith("Delivery address is required");

    // Fill the form correctly
    fireEvent.change(addressInput, { target: { value: "123 Test Street" } });

    // Successful submission
    (api.post as any).mockResolvedValueOnce({ data: { success: true } });
    fireEvent.submit(form);

    await waitFor(() => {
      // Expect api to be called with correct arguments
      expect(api.post).toHaveBeenCalledWith("/orders/checkout", {
        deliveryAddress: "123 Test Street",
        couponCode: undefined, // no coupon added here
      });
      expect(mockClearCart).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        "Order placed successfully! 🎉",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile", {
        state: { tab: "orders" },
      });
    });
  });
});
