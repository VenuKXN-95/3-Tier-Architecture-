/**
 * ProductDetailPage — full product view with inventory status and add-to-cart.
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Package, Tag } from 'lucide-react'
import { productsApi, inventoryApi, cartApi } from '@/services/api'
import type { Product, InventoryRecord } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useData } from '@/hooks/useData'

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? ''

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: product, loading, error } = useData<Product>(
    () => productsApi.get(id!),
    [id],
  )

  const { data: inventory } = useData<InventoryRecord>(
    () => inventoryApi.get(id!),
    [id],
  )

  const handleAddToCart = async () => {
    if (!DEMO_USER_ID) {
      setMessage({ type: 'error', text: 'Please create a user on the Profile page first.' })
      return
    }
    setAdding(true)
    try {
      await cartApi.addItem(DEMO_USER_ID, { product_id: id!, quantity: 1 })
      setMessage({ type: 'success', text: 'Added to cart!' })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setAdding(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (loading) return <div className="p-6"><Loading /></div>
  if (error) return <div className="p-6"><ErrorMessage message={error} /></div>
  if (!product) return null

  const inStock = inventory ? inventory.quantity > 0 : null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-5"
        aria-label="Go back"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="gradient-border p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-violet/10 border border-violet/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-violet-bright" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-1">{product.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Tag className="w-3 h-3 text-text-3" aria-hidden="true" />
                <span className="text-xs text-text-3 font-mono">{product.category_id}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-cyan font-mono">{formatPrice(product.price)}</p>
            {inStock !== null && (
              <Badge variant={inStock ? 'success' : 'danger'} className="mt-1">
                {inStock ? `${inventory!.quantity} in stock` : 'Out of stock'}
              </Badge>
            )}
          </div>
        </div>

        {/* Product Image preview */}
        {product.image_url && (
          <div className="w-full h-72 rounded-xl overflow-hidden bg-canvas-2 border border-white/[0.06] flex items-center justify-center">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-sm text-text-2 leading-relaxed">{product.description}</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 text-xs text-text-3">
          <div>
            <span className="text-text-4">Added</span>
            <br />
            {formatDate(product.created_at)}
          </div>
          <div>
            <span className="text-text-4">Updated</span>
            <br />
            {formatDate(product.updated_at)}
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`px-4 py-2.5 rounded-lg border text-sm ${
              message.type === 'success'
                ? 'bg-success/10 text-success border-success/20'
                : 'bg-danger/10 text-danger border-danger/20'
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </motion.div>
        )}

        {/* Add to cart */}
        <Button
          variant="primary"
          size="lg"
          loading={adding}
          onClick={handleAddToCart}
          disabled={inStock === false}
          aria-label={`Add ${product.name} to cart`}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          {inStock === false ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </motion.div>
    </div>
  )
}
