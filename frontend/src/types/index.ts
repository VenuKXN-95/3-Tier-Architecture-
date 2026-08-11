/**
 * Shared TypeScript interfaces for the E-Commerce Order System.
 * These mirror the Pydantic response schemas from the FastAPI backend.
 * All IDs are strings (ObjectId serialized at the API boundary).
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryRecord {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Cart {
  id: string | null;
  user_id: string;
  items: CartItem[];
  updated_at?: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ── API request payloads ──────────────────────────────────────────────

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}


export interface CreateCategoryPayload {
  name: string;
  description?: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: string;
}

export interface AddToCartPayload {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface CreateInventoryPayload {
  product_id: string;
  quantity: number;
}

export interface UpdateInventoryPayload {
  quantity: number;
}
