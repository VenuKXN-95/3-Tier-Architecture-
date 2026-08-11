/**
 * CartItem — individual item row in the cart with quantity controls.
 */
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem as CartItemType } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface CartItemProps {
  item: CartItemType
  productName?: string
  onUpdate: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
  updating?: boolean
}

export function CartItem({ item, productName, onUpdate, onRemove, updating }: CartItemProps) {
  const subtotal = item.unit_price * item.quantity

  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/[0.06] last:border-0">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-1 truncate">
          {productName ?? item.product_id}
        </p>
        <p className="text-xs text-text-3 mt-0.5">
          {formatPrice(item.unit_price)} each
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(item.product_id, item.quantity - 1)}
          disabled={item.quantity <= 1 || updating}
          aria-label={`Decrease quantity of item`}
          className="w-7 h-7 p-0"
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-sm font-medium text-text-1 w-6 text-center tabular-nums">
          {item.quantity}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUpdate(item.product_id, item.quantity + 1)}
          disabled={updating}
          aria-label={`Increase quantity of item`}
          className="w-7 h-7 p-0"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Subtotal */}
      <span className="text-sm font-semibold text-cyan font-mono w-24 text-right tabular-nums">
        {formatPrice(subtotal)}
      </span>

      {/* Remove */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.product_id)}
        disabled={updating}
        aria-label="Remove item from cart"
        className="w-7 h-7 p-0 text-text-3 hover:text-danger"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}
