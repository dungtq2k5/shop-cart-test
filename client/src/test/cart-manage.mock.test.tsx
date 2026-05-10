import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import api from "../lib/api";
import { useCartStore } from "../stores/useCartStore";
import { CART_DEBOUNCE_MS, ENDPOINTS } from "../config/constants";

vi.mock("../lib/api", () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

type MockApi = {
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

const mockedApi = api as unknown as MockApi;

const baseItem = {
  id: "item-1",
  product: {
    id: "prod-1",
    name: "Test Product",
    priceCents: 1000,
    stockQty: 5,
  },
  quantity: 1,
  subtotalCents: 1000,
};

describe("Cart Store Mock Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCartStore.setState({
      cartItems: [baseItem],
      subtotalCents: baseItem.subtotalCents,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Update quantity: optimistic state update and API call", async () => {
    // Arrange
    vi.useFakeTimers();

    // Act
    await useCartStore.getState().updateQuantity(baseItem.id, 2);

    // Assert (optimistic update)
    const updatedItem = useCartStore.getState().cartItems[0];
    expect(updatedItem.quantity).toBe(2);
    expect(updatedItem.subtotalCents).toBe(2000);

    // Assert (debounced API call)
    await vi.advanceTimersByTimeAsync(CART_DEBOUNCE_MS);
    expect(mockedApi.patch).toHaveBeenCalledWith(
      `${ENDPOINTS.CART}/${baseItem.id}`,
      { quantity: 2 },
    );
  });

  test("Update quantity: API failure triggers re-fetch", async () => {
    // Arrange
    vi.useFakeTimers();
    mockedApi.patch.mockRejectedValueOnce(new Error("Server error"));
    mockedApi.get.mockResolvedValueOnce({ data: { data: [baseItem] } });

    // Act
    await useCartStore.getState().updateQuantity(baseItem.id, 2);

    // Assert
    await vi.advanceTimersByTimeAsync(CART_DEBOUNCE_MS);
    expect(mockedApi.get).toHaveBeenCalledWith(ENDPOINTS.CART);
  });

  test("Remove item: success removes from state and calls API", async () => {
    // Arrange
    mockedApi.delete.mockResolvedValueOnce({ data: { success: true } });

    // Act
    await useCartStore.getState().removeFromCart(baseItem.id);

    // Assert
    expect(mockedApi.delete).toHaveBeenCalledWith(
      `${ENDPOINTS.CART}/${baseItem.id}`,
    );
    expect(useCartStore.getState().cartItems).toHaveLength(0);
    expect(useCartStore.getState().subtotalCents).toBe(0);
  });

  test("Remove item: API error keeps state and propagates error", async () => {
    // Arrange
    mockedApi.delete.mockRejectedValueOnce(new Error("Network Error"));

    // Act + Assert
    await expect(
      useCartStore.getState().removeFromCart(baseItem.id),
    ).rejects.toThrow("Network Error");
    expect(useCartStore.getState().cartItems).toHaveLength(1);
  });
});
