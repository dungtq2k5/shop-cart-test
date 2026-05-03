// ─── Shared API response wrapper ─────────────────────────────────────────────
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
}

// ─── Domain Models ─────────────────────────────────────────────────────────
export type User = {
  id: string;
  email: string;
  createdAt: string;
}

export type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  subtotalCents: number;
}

export type OrderItem = {
  id: string;
  product: Product;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export type Order = {
  id: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  totalAmountCents: number;
  discountAmountCents: number;
  deliveryAddress: string;
  couponCode: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination (Spring Data VIA_DTO mode) ─────────────────────────────────
export type PageMeta = {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export type Page<T> = {
  content: T[];
  page: PageMeta;
}

// ─── Request Shapes ────────────────────────────────────────────────────────
export type RegisterRequest = {
  email: string;
  password: string;
}

export type LoginRequest = {
  email: string;
  password: string;
}

export type UpdateProfileRequest = {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export type AddToCartRequest = {
  productId: string;
  quantity: number;
}

export type UpdateCartRequest = {
  quantity: number;
}

export type CheckoutRequest = {
  deliveryAddress: string;
  couponCode?: string;
}

export type ProductFilters = {
  name?: string;
  priceCentsMin?: number;
  priceCentsMax?: number;
  page?: number;
  size?: number;
}
