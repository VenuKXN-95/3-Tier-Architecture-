/**
 * ProductsPage — browse products, filter by category, add to cart.
 */
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { productsApi, cartApi, categoriesApi } from '@/services/api'
import type { Product, Category } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryFilter } from '@/components/products/CategoryFilter'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useData } from '@/hooks/useData'

// Demo user — in a real app this comes from auth context
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? ''

export function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [addingProductId, setAddingProductId] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    data: products,
    loading: productsLoading,
    error: productsError,
  } = useData<Product[]>(() => productsApi.list(selectedCategory ?? undefined), [selectedCategory])

  const {
    data: categories,
    loading: categoriesLoading,
  } = useData<Category[]>(() => categoriesApi.list(), [])

  const handleAddToCart = useCallback(async (product: Product) => {
    if (!DEMO_USER_ID) {
      setCartMessage({ type: 'error', text: 'Please create a user first on the Profile page.' })
      setTimeout(() => setCartMessage(null), 4000)
      return
    }
    setAddingProductId(product.id)
    try {
      await cartApi.addItem(DEMO_USER_ID, { product_id: product.id, quantity: 1 })
      setCartMessage({ type: 'success', text: `${product.name} added to cart!` })
    } catch (err) {
      setCartMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setAddingProductId(null)
      setTimeout(() => setCartMessage(null), 3000)
    }
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-text-1 flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-bright" aria-hidden="true" />
          Products
        </h1>
        <p className="mt-1 text-sm text-text-3">
          Browse the catalogue and add items to your cart.
        </p>
      </div>

      {/* Cart feedback message */}
      {cartMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`mb-4 px-4 py-2.5 rounded-lg border text-sm ${
            cartMessage.type === 'success'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-danger/10 text-danger border-danger/20'
          }`}
          role="status"
          aria-live="polite"
        >
          {cartMessage.text}
        </motion.div>
      )}

      {/* Category filter */}
      {!categoriesLoading && categories && (
        <div className="mb-5">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* Products grid */}
      {productsLoading && <Loading message="Loading products…" />}
      {productsError && <ErrorMessage message="Unable to load products. Is the backend running?" />}

      {!productsLoading && !productsError && products && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16 text-text-3 text-sm">
              No products found. Add some via the Inventory page.
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                    addingToCart={addingProductId === product.id}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
