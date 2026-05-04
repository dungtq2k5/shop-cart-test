/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter, useLocation } from "react-router-dom";
import CheckoutPage from "../pages/CheckoutPage";
import { useCartStore } from "../stores/useCartStore";
import api from "../lib/api";
import toast from "react-hot-toast";

// Mock dependencies
vi.mock("../stores/useCartStore");
vi.mock("../lib/api");
vi.mock("react-hot-toast");

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

describe("Purchase Mock Tests", () => {
  const mockClearCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useLocation as any).mockReturnValue({ state: null });

    // Mock cart store to contain items so it doesn't redirect
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: { id: "P001", name: "Laptop Dell", priceCents: 15000000 },
          quantity: 2,
          subtotalCents: 30000000,
        },
      ],
      subtotalCents: 30000000,
      clearCart: mockClearCart,
    });
  });

  test("Mock orderService.createOrder() (api.post) & b) Test success scenario", async () => {
    // Mock the api call
    (api.post as any).mockResolvedValueOnce({ data: { success: true } });

    renderWithRouter(<CheckoutPage />);

    const addressInput = document.getElementById(
      "checkout-address",
    ) as HTMLTextAreaElement;
    const form = document.getElementById("checkout-form") as HTMLFormElement;

    // Fill the address and submit
    fireEvent.change(addressInput, { target: { value: "123 Delivery St" } });
    fireEvent.submit(form);

    await waitFor(() => {
      // Verify mock calls
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith("/orders/checkout", {
        deliveryAddress: "123 Delivery St",
        couponCode: undefined,
      });

      // Verify UI behavior on success
      expect(mockClearCart).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        "Order placed successfully! 🎉",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/profile", {
        state: { tab: "orders" },
      });
    });
  });

  test("Test failure scenario", async () => {
    // Mock api call to reject
    (api.post as any).mockRejectedValueOnce({
      response: { data: { message: "Out of stock" } },
    });

    renderWithRouter(<CheckoutPage />);

    const addressInput = document.getElementById(
      "checkout-address",
    ) as HTMLTextAreaElement;
    const form = document.getElementById("checkout-form") as HTMLFormElement;

    // Fill the address and submit
    fireEvent.change(addressInput, { target: { value: "123 Delivery St" } });
    fireEvent.submit(form);

    await waitFor(() => {
      // Verify mock calls
      expect(api.post).toHaveBeenCalledTimes(1);
      expect(api.post).toHaveBeenCalledWith("/orders/checkout", {
        deliveryAddress: "123 Delivery St",
        couponCode: undefined,
      });

      // Verify UI behavior on failure
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Out of stock");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
