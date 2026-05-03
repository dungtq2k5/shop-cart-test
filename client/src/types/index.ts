// ─── Shared API response wrapper ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Domain Models ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotalCents: number;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

export interface Order {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalAmountCents: number;
  discountAmountCents: number;
  deliveryAddress: string;
  couponCode: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination (Spring Data VIA_DTO mode) ─────────────────────────────────
export interface PageMeta {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

export interface Page<T> {
  content: T[];
  page: PageMeta;
}

// ─── Request Shapes ────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartRequest {
  quantity: number;
}

export interface CheckoutRequest {
  deliveryAddress: string;
  couponCode?: string;
}

export interface ProductFilters {
  name?: string;
  priceCentsMin?: number;
  priceCentsMax?: number;
  page?: number;
  size?: number;
}
