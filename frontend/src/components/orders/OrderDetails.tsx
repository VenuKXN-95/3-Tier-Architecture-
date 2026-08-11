/**
 * OrderDetails — full order display with status badge and item table.
 */
import { formatPrice, formatDate } from '@/lib/utils'
import type { Order } from '@/types'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { XCircle, Clock } from 'lucide-react'

interface OrderDetailsProps {
  order: Order
  onCancel?: (orderId: string) => void
  cancelling?: boolean
}

export function OrderDetails({ order, onCancel, cancelling }: OrderDetailsProps) {
  const cancellable = order.status === 'PLACED' || order.status === 'CONFIRMED'

  return (
    <div className="gradient-border p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-text-3 font-mono">Order ID</p>
          <p className="text-sm font-medium text-text-1 font-mono">{order.id}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-text-3">Placed</p>
          <p className="text-text-2 flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatDate(order.created_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-3">Total</p>
          <p className="text-cyan font-semibold font-mono">{formatPrice(order.total_amount)}</p>
        </div>
      </div>

      {/* Items table */}
      <div>
        <p className="text-xs text-text-3 mb-2">Items</p>
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-canvas-2">
                <th scope="col" className="text-left px-3 py-2 text-xs text-text-3 font-medium">Product</th>
                <th scope="col" className="text-right px-3 py-2 text-xs text-text-3 font-medium">Qty</th>
                <th scope="col" className="text-right px-3 py-2 text-xs text-text-3 font-medium">Unit</th>
                <th scope="col" className="text-right px-3 py-2 text-xs text-text-3 font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-3 py-2 text-text-1 font-medium">{item.product_name}</td>
                  <td className="px-3 py-2 text-right text-text-2 tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-2 text-right text-text-3 tabular-nums font-mono">{formatPrice(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right text-cyan font-semibold tabular-nums font-mono">{formatPrice(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel button */}
      {cancellable && onCancel && (
        <div className="flex justify-end">
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={() => onCancel(order.id)}
            aria-label="Cancel this order"
          >
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Cancel Order
          </Button>
        </div>
      )}
    </div>
  )
}
