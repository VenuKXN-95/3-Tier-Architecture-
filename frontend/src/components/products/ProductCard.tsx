/**
 * ProductCard — displays a product with Motion hover lift animation.
 * Inspired by Kokonut UI interactive card patterns.
 */
import { motion } from 'framer-motion'
import { ShoppingCart, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Product } from '@/types'
import { formatPrice, truncate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface ProductCardProps {
  product: Product
  onAddToCart?: (product: Product) => void
  addingToCart?: boolean
}

export function ProductCard({ product, onAddToCart, addingToCart }: ProductCardProps) {
  const navigate = useNavigate()

  return (
    <motion.article
      layout
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="gradient-border p-5 flex flex-col gap-3 cursor-pointer group"
      onClick={() => navigate(`/products/${product.id}`)}
      tabIndex={0}
      role="article"
      aria-label={`${product.name}, ${formatPrice(product.price)}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          navigate(`/products/${product.id}`)
        }
      }}
    >
      {/* Product Image */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden bg-canvas-2 border border-white/[0.06] flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-text-4">
            <Tag className="w-6 h-6 opacity-40" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Price badge & Tag */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <span className="inline-flex items-center gap-1.5 text-xs text-text-3 bg-canvas-2 px-2 py-1 rounded-md border border-white/[0.06]">
          <Tag className="w-3 h-3" aria-hidden="true" />
          Product
        </span>
        <span className="text-sm font-semibold text-cyan font-mono">
          {formatPrice(product.price)}
        </span>
      </div>

      {/* Product name */}
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-text-1 group-hover:text-violet-bright transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 text-xs text-text-3 leading-relaxed">
            {truncate(product.description, 80)}
          </p>
        )}
      </div>

      {/* Add to cart */}
      <Button
        variant="primary"
        size="sm"
        loading={addingToCart}
        onClick={(e) => {
          e.stopPropagation()
          onAddToCart?.(product)
        }}
        aria-label={`Add ${product.name} to cart`}
        className="w-full mt-1"
      >
        <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
        Add to Cart
      </Button>
    </motion.article>
  )
}
