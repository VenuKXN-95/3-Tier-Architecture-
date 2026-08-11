/**
 * CartPage — view cart, update quantities, place order.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ArrowRight, Package } from 'lucide-react'
import { cartApi, ordersApi, productsApi } from '@/services/api'
import type { Cart, Product } from '@/types'
import { getUserId, formatPrice } from '@/lib/utils'
import { CartItem } from '@/components/cart/CartItem'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { useData } from '@/hooks/useData'

export function CartPage() {
  const demoUserId = getUserId()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderMessage, setOrderMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const {
    data: cart,
    loading,
    error,
    refetch,
  } = useData<Cart>(() => cartApi.get(demoUserId), [demoUserId])

  const { data: products } = useData<Product[]>(() => productsApi.list(), [])

  const getProductName = (productId: string) =>
    products?.find((p) => p.id === productId)?.name

  const handleUpdate = useCallback(async (productId: string, quantity: number) => {
    if (!demoUserId) return
    setUpdatingId(productId)
    try {
      await cartApi.updateItem(demoUserId, productId, { quantity })
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }, [demoUserId, refetch])

  const handleRemove = useCallback(async (productId: string) => {
    if (!demoUserId) return
    setUpdatingId(productId)
    try {
      await cartApi.removeItem(demoUserId, productId)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }, [demoUserId, refetch])

  const handlePlaceOrder = useCallback(async () => {
    if (!demoUserId) return
    setPlacingOrder(true)
    try {
      const order = await ordersApi.create(demoUserId)
      setOrderMessage({
        type: 'success',
        text: `Order placed! ID: ${order.id}`,
      })
      refetch()
    } catch (err) {
      setOrderMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setPlacingOrder(false)
      setTimeout(() => setOrderMessage(null), 5000)
    }
  }, [demoUserId, refetch])

  const total = cart?.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  ) ?? 0

  if (!demoUserId) {
    return (
      <div className="p-6">
        <ErrorMessage message="Please create a user on the Profile page first to use the cart." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-text-1 flex items-center gap-2 mb-6">
        <ShoppingCart className="w-5 h-5 text-violet-bright" aria-hidden="true" />
        Cart
      </h1>

      {loading && <Loading message="Loading cart…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {(!cart?.items || cart.items.length === 0) ? (
            <div className="gradient-border p-12 text-center">
              <Package className="w-10 h-10 text-text-4 mx-auto mb-3" aria-hidden="true" />
              <p className="text-text-3 text-sm">Your cart is empty.</p>
              <p className="text-text-4 text-xs mt-1">Browse products and add items.</p>
            </div>
          ) : (
            <div className="gradient-border p-6 flex flex-col gap-2">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.div
                    key={item.product_id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                  >
                    <CartItem
                      item={item}
                      productName={getProductName(item.product_id)}
                      onUpdate={handleUpdate}
                      onRemove={handleRemove}
                      updating={updatingId === item.product_id}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Order summary */}
              <div className="pt-4 mt-2 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-3">Total</p>
                  <p className="text-lg font-bold text-cyan font-mono">{formatPrice(total)}</p>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  loading={placingOrder}
                  onClick={handlePlaceOrder}
                  aria-label="Place order"
                >
                  Place Order
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>

              {orderMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`px-4 py-2.5 rounded-lg border text-sm ${
                    orderMessage.type === 'success'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-danger/10 text-danger border-danger/20'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {orderMessage.text}
                </motion.div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
