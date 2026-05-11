import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import CartPage from "../pages/CartPage";
import { useCartStore } from "../stores/useCartStore";
import { useAuthStore } from "../stores/useAuthStore";
import toast from "react-hot-toast";

// Mock the cart store and toast notifications
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

// A helper wrapper to provide routing context
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("Cart Component Integration", () => {
  const mockUpdateQuantity = vi.fn();
  const mockRemoveFromCart = vi.fn();
  const mockFetchCart = vi.fn();
  const mockLogout = vi.fn();

  const baseProduct = {
    name: "Test Product",
    priceCents: 1000,
    stockQty: 5,
  };

  const renderUi = () => (
    <>
      <Navbar />
      <CartPage />
    </>
  );

  const setCartStore = (state: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useCartStore as any).mockReturnValue(state);
  };

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useAuthStore as any).mockReturnValue({
      isAuth: true,
      user: { email: "test@example.com" },
      logout: mockLogout,
    });
  });

  test("Test rendering and user interactions: Empty cart state", () => {
    renderWithRouter(renderUi());

    // Check if the empty cart message is displayed
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    expect(
      screen.getByText("Add some products to get started!"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Browse Products/i }),
    ).toBeInTheDocument();
  });

  test("Test rendering: Cart items, subtotal, and cart badge", () => {
    const cartItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 2,
        subtotalCents: 2000,
      },
    ];

    setCartStore({
      cartItems,
      subtotalCents: 2000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    renderWithRouter(renderUi());

    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByTestId("cart-qty-item-1")).toHaveTextContent("2");
    expect(screen.getByTestId("cart-item-subtotal-item-1")).toHaveTextContent(
      "$20.00",
    );
    expect(screen.getByTestId("cart-summary-total")).toHaveTextContent(
      "$20.00",
    );

    const cartLink = screen.getByLabelText("Shopping cart");
    const badge = within(cartLink).getByText("2");
    expect(badge).toBeInTheDocument();
  });

  test("Test increase quantity: calls service, updates subtotal and badge", () => {
    const initialItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 1,
        subtotalCents: 1000,
      },
    ];

    setCartStore({
      cartItems: initialItems,
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    const utils = renderWithRouter(renderUi());
    const incButton = document.getElementById("cart-qty-inc-item-1");
    expect(incButton).not.toBeNull();

    fireEvent.click(incButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 2);

    const updatedItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 2,
        subtotalCents: 2000,
      },
    ];

    setCartStore({
      cartItems: updatedItems,
      subtotalCents: 2000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    utils.unmount();
    renderWithRouter(renderUi());

    expect(screen.getByTestId("cart-qty-item-1")).toHaveTextContent("2");
    expect(screen.getByTestId("cart-item-subtotal-item-1")).toHaveTextContent(
      "$20.00",
    );
    expect(screen.getByTestId("cart-summary-total")).toHaveTextContent(
      "$20.00",
    );

    const cartLink = screen.getByLabelText("Shopping cart");
    const badge = within(cartLink).getByText("2");
    expect(badge).toBeInTheDocument();
  });

  test("Test decrease quantity: calls service and updates totals", () => {
    const initialItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 2,
        subtotalCents: 2000,
      },
    ];

    setCartStore({
      cartItems: initialItems,
      subtotalCents: 2000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    const utils = renderWithRouter(renderUi());
    const decButton = document.getElementById("cart-qty-dec-item-1");
    expect(decButton).not.toBeNull();

    fireEvent.click(decButton);
    expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 1);

    const updatedItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 1,
        subtotalCents: 1000,
      },
    ];

    setCartStore({
      cartItems: updatedItems,
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    utils.rerender(<BrowserRouter>{renderUi()}</BrowserRouter>);

    expect(screen.getByTestId("cart-qty-item-1")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-item-subtotal-item-1")).toHaveTextContent(
      "$10.00",
    );
    expect(screen.getByTestId("cart-summary-total")).toHaveTextContent(
      "$10.00",
    );
  });

  test("Test remove item: calls service and shows empty cart", async () => {
    const cartItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 1,
        subtotalCents: 1000,
      },
    ];

    setCartStore({
      cartItems,
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    const utils = renderWithRouter(renderUi());
    const removeButton = document.getElementById("cart-remove-item-1");

    mockRemoveFromCart.mockResolvedValueOnce(undefined);
    fireEvent.click(removeButton as HTMLElement);

    await waitFor(() => {
      expect(mockRemoveFromCart).toHaveBeenCalledWith("item-1");
      expect(toast.success).toHaveBeenCalledWith(
        "Test Product removed from cart",
      );
    });

    setCartStore({
      cartItems: [],
      subtotalCents: 0,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    utils.rerender(<BrowserRouter>{renderUi()}</BrowserRouter>);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  test("Test error message when update fails", async () => {
    const cartItems = [
      {
        id: "item-1",
        product: baseProduct,
        quantity: 1,
        subtotalCents: 1000,
      },
    ];

    mockUpdateQuantity.mockImplementationOnce(async () => {
      toast.error("Stock not available");
      throw new Error("Stock not available");
    });

    setCartStore({
      cartItems,
      subtotalCents: 1000,
      fetchCart: mockFetchCart,
      updateQuantity: mockUpdateQuantity,
      removeFromCart: mockRemoveFromCart,
    });

    renderWithRouter(renderUi());
    const incButton = document.getElementById("cart-qty-inc-item-1");

    fireEvent.click(incButton as HTMLElement);

    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledWith("item-1", 2);
      expect(toast.error).toHaveBeenCalledWith("Stock not available");
    });
  });
});
