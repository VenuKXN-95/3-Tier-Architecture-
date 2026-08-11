/**
 * Centralized Axios API client.
 *
 * WHY THIS EXISTS
 * ───────────────
 * All API calls go through this single client. This means:
 *   • The base URL is configured in ONE place (VITE_API_BASE_URL env var)
 *   • Request/response interceptors apply globally (error handling, auth headers)
 *   • Components never contain raw URLs like 'http://localhost:8000/api/...'
 *   • The backend URL can be changed without editing any component
 *
 * In Docker: frontend makes requests to /api/* which nginx proxies to
 *            the backend container.
 * In development: Vite dev server proxies /api/* to localhost:8000.
 */
import axios from 'axios'
import type {
  Category,
  Product,
  User,
  Cart,
  Order,
  InventoryRecord,
  CreateUserPayload,
  LoginUserPayload,
  TokenResponse,
  CreateCategoryPayload,
  CreateProductPayload,
  AddToCartPayload,
  UpdateCartItemPayload,
  CreateInventoryPayload,
  UpdateInventoryPayload,
} from '@/types'

// Determine base URL:
// In production behind Nginx, relative path '' uses the Nginx /api proxy seamlessly.
// In dev mode, fallback to import.meta.env.VITE_API_BASE_URL.
const getBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  }
  return ''
}

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

// ── Response interceptor — extract data, handle errors ────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Never expose raw Axios errors to components.
    // Return a clean error message from the API's detail field.
    const message =
      error.response?.data?.detail ??
      error.message ??
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

// ── Categories ────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () =>
    apiClient.get<Category[]>('/api/categories').then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Category>(`/api/categories/${id}`).then((r) => r.data),

  create: (payload: CreateCategoryPayload) =>
    apiClient.post<Category>('/api/categories', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateCategoryPayload>) =>
    apiClient.put<Category>(`/api/categories/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/categories/${id}`),
}

// ── Products ──────────────────────────────────────────────────────────

export const productsApi = {
  list: (categoryId?: string) =>
    apiClient
      .get<Product[]>('/api/products', { params: categoryId ? { category_id: categoryId } : {} })
      .then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Product>(`/api/products/${id}`).then((r) => r.data),

  create: (payload: CreateProductPayload) =>
    apiClient.post<Product>('/api/products', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateProductPayload>) =>
    apiClient.put<Product>(`/api/products/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/api/products/${id}`),
}

// ── Users ─────────────────────────────────────────────────────────────

export const usersApi = {
  get: (id: string) =>
    apiClient.get<User>(`/api/users/${id}`).then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/api/users', payload).then((r) => r.data),

  login: (payload: LoginUserPayload) =>
    apiClient.post<TokenResponse>('/api/users/login', payload).then((r) => r.data),

  getOrders: (userId: string) =>
    apiClient.get<Order[]>(`/api/users/${userId}/orders`).then((r) => r.data),
}


// ── Inventory ─────────────────────────────────────────────────────────

export const inventoryApi = {
  get: (productId: string) =>
    apiClient.get<InventoryRecord>(`/api/inventory/${productId}`).then((r) => r.data),

  create: (payload: CreateInventoryPayload) =>
    apiClient.post<InventoryRecord>('/api/inventory', payload).then((r) => r.data),

  update: (productId: string, payload: UpdateInventoryPayload) =>
    apiClient.put<InventoryRecord>(`/api/inventory/${productId}`, payload).then((r) => r.data),
}

// ── Cart ──────────────────────────────────────────────────────────────

export const cartApi = {
  get: (userId: string) =>
    apiClient.get<Cart>(`/api/cart/${userId}`).then((r) => r.data),

  addItem: (userId: string, payload: AddToCartPayload) =>
    apiClient.post<Cart>(`/api/cart/${userId}/items`, payload).then((r) => r.data),

  updateItem: (userId: string, productId: string, payload: UpdateCartItemPayload) =>
    apiClient.put<Cart>(`/api/cart/${userId}/items/${productId}`, payload).then((r) => r.data),

  removeItem: (userId: string, productId: string) =>
    apiClient.delete<Cart>(`/api/cart/${userId}/items/${productId}`).then((r) => r.data),
}

// ── Orders ────────────────────────────────────────────────────────────

export const ordersApi = {
  get: (orderId: string) =>
    apiClient.get<Order>(`/api/orders/${orderId}`).then((r) => r.data),

  create: (userId: string) =>
    apiClient.post<Order>(`/api/orders/${userId}`).then((r) => r.data),

  cancel: (orderId: string) =>
    apiClient.post<Order>(`/api/orders/${orderId}/cancel`).then((r) => r.data),
}

export default apiClient
