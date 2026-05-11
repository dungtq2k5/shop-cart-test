/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProductModal from "../components/ProductModal";
import CartPage from "../pages/CartPage";
import { useCartStore } from "../stores/useCartStore";
import { useAuthStore } from "../stores/useAuthStore";
import toast from "react-hot-toast";

// Mock external dependencies for Cart component
vi.mock("../stores/useCartStore");
vi.mock("../stores/useAuthStore");
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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Cart Mock Tests", () => {
  const mockAddToCart = vi.fn();
  const mockOnClose = vi.fn();
  const mockProduct = {
    id: "prod-1",
    name: "Laptop Dell",
    description: "High performance laptop",
    priceCents: 15000000,
    stockQty: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useCartStore as any).mockReturnValue({
      cartItems: [],
      addToCart: mockAddToCart,
    });
    // Assume user is authenticated
    (useAuthStore as any).mockReturnValue({
      isAuth: true,
    });
  });

  test("Mock cartService.addToCart & Test success responses: Add product to cart successfully", async () => {
    mockAddToCart.mockResolvedValueOnce(undefined);

    renderWithRouter(
      <ProductModal product={mockProduct} onClose={mockOnClose} />,
    );

    // Trigger add to cart
    const addToCartBtn = document.getElementById(
      "product-modal-add-to-cart",
    ) as HTMLButtonElement;
    fireEvent.click(addToCartBtn);

    await waitFor(() => {
      // Verify mock call
      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: "prod-1",
        quantity: 1,
      });
      expect(mockAddToCart).toHaveBeenCalledTimes(1);

      // Verify UI feedback
      expect(toast.success).toHaveBeenCalledWith("Laptop Dell added to cart!");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("Test with mocked failed responses: Failed to add product to cart", async () => {
    mockAddToCart.mockRejectedValueOnce(new Error("Network Error"));

    renderWithRouter(
      <ProductModal product={mockProduct} onClose={mockOnClose} />,
    );

    // Trigger add to cart
    const addToCartBtn = document.getElementById(
      "product-modal-add-to-cart",
    ) as HTMLButtonElement;
    fireEvent.click(addToCartBtn);

    await waitFor(() => {
      // Verify mock call was made
      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: "prod-1",
        quantity: 1,
      });

      // Verify UI feedback for error
      expect(toast.error).toHaveBeenCalledWith("Network Error");
      // Verify onClose is NOT called on failure
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});

describe("Cart Management Mock Tests", () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockFetchCart = vi.fn();

  const baseProduct = {
    name: "Test Product",
    priceCents: 1000,
    stockQty: 5,
  };

  const renderCartPage = () => renderWithRouter(<CartPage />);

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      isAuth: true,
      user: { email: "test@example.com" },
    });
  });

  test("Mock update cart API success: update quantity", async () => {
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: baseProduct,
          quantity: 1,
          subtotalCents: 1000,
        },
      ],
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    mockUpdateQuantity.mockResolvedValueOnce(undefined);
    renderCartPage();

    const incButton = document.getElementById("cart-qty-inc-item-1");
    fireEvent.click(incButton as HTMLElement);

    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 2);
    });
  });

  test("Mock update cart API fail: shows error message", async () => {
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: baseProduct,
          quantity: 1,
          subtotalCents: 1000,
        },
      ],
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    mockUpdateQuantity.mockImplementationOnce(async () => {
      toast.error("Stock not available");
      throw new Error("Stock not available");
    });

    renderCartPage();

    const incButton = document.getElementById("cart-qty-inc-item-1");
    fireEvent.click(incButton as HTMLElement);

    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 2);
      expect(toast.error).toHaveBeenCalledWith("Stock not available");
    });
  });

  test("Mock remove cart API success: shows success toast", async () => {
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: baseProduct,
          quantity: 1,
          subtotalCents: 1000,
        },
      ],
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    mockRemoveFromCart.mockResolvedValueOnce(undefined);
    renderCartPage();

    const removeButton = document.getElementById("cart-remove-item-1");
    fireEvent.click(removeButton as HTMLElement);

    await waitFor(() => {
      expect(mockRemoveFromCart).toHaveBeenCalledWith("item-1");
      expect(toast.success).toHaveBeenCalledWith(
        "Test Product removed from cart",
      );
    });
  });

  test("Mock remove cart API fail: shows error toast", async () => {
    (useCartStore as any).mockReturnValue({
      cartItems: [
        {
          id: "item-1",
          product: baseProduct,
          quantity: 1,
          subtotalCents: 1000,
        },
      ],
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    mockRemoveFromCart.mockRejectedValueOnce(new Error("Network Error"));
    renderCartPage();

    const removeButton = document.getElementById("cart-remove-item-1");
    fireEvent.click(removeButton as HTMLElement);

    await waitFor(() => {
      expect(mockRemoveFromCart).toHaveBeenCalledWith("item-1");
      expect(toast.error).toHaveBeenCalledWith("Network Error");
    });
  });
});
