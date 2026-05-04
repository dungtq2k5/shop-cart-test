import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import CartPage from "../pages/CartPage";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

// Mock the cart store and toast notifications
vi.mock("../stores/useCartStore");
vi.mock("react-hot-toast");

// Mock the react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// A helper wrapper to provide routing context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Cart Component Integration", () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockFetchCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCartStore as any).mockReturnValue({
      cartItems: [],
      subtotalCents: 0,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });
  });

  test("a) Test rendering and user interactions: Empty cart state", () => {
    renderWithRouter(<CartPage />);

    // Check if the empty cart message is displayed
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Add some products to get started!"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse Products/i }),
    ).toBeInTheDocument();
  });

  test("b) Test form submission and API calls: Updating quantity and removing items", async () => {
    // Mock store with 1 item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: { name: "Test Product", priceCents: 1000 },
          quantity: 2,
          subtotalCents: 2000,
        },
      ],
      subtotalCents: 2000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    renderWithRouter(<CartPage />);

    // Item should be rendered
    expect(screen.getByText("Test Product")).toBeInTheDocument();

    // Find quantity control buttons by ID to be robust
    const incButton = document.getElementById("cart-qty-inc-item-1");
    const decButton = document.getElementById("cart-qty-dec-item-1");
    const removeButton = document.getElementById("cart-remove-item-1");

    expect(incButton).not.toBeNull();
    expect(decButton).not.toBeNull();
    expect(removeButton).not.toBeNull();

    // Increment quantity
    fireEvent.click(incButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 3);

    // Decrement quantity
    fireEvent.click(decButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 1);

    // Remove item
    mockRemoveFromCart.mockResolvedValueOnce(undefined);
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(mockRemoveFromCart).toHaveBeenCalledWith("item-1");
    });
  });

  test("c) Test error handling and success messages: Removing item success/error", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: { name: "Test Product", priceCents: 1000 },
          quantity: 1,
          subtotalCents: 1000,
        },
      ],
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    renderWithRouter(<CartPage />);
    const removeButton = document.getElementById("cart-remove-item-1");

    // Success removal
    mockRemoveFromCart.mockResolvedValueOnce(undefined);
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Test Product removed from cart",
      );
    });

    // Error removal
    mockRemoveFromCart.mockRejectedValueOnce(new Error("Failed"));
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to remove item");
    });
  });
});
