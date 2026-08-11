/**
 * InventoryPage — manage product inventory levels.
 * Allows creating inventory records and updating stock quantities.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Package, RefreshCw } from 'lucide-react'
import { inventoryApi, productsApi } from '@/services/api'
import type { Product, InventoryRecord } from '@/types'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useData } from '@/hooks/useData'

export function InventoryPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<string, string>>({})

  const { data: products, loading: productsLoading, error: productsError } = useData<Product[]>(
    () => productsApi.list(),
    [],
  )

  const getStockVariant = (qty: number) => {
    if (qty === 0) return 'danger'
    if (qty < 5) return 'warning'
    return 'success'
  }

  const handleUpdateOrCreate = async (product: Product, currentQty: number | null) => {
    const qtyStr = quantities[product.id]
    const qty = qtyStr !== undefined ? parseInt(qtyStr, 10) : null
    if (qty === null || isNaN(qty) || qty < 0) return

    setUpdatingId(product.id)
    try {
      if (currentQty === null) {
        await inventoryApi.create({ product_id: product.id, quantity: qty })
      } else {
        await inventoryApi.update(product.id, { quantity: qty })
      }
      setQuantities((prev) => ({ ...prev, [product.id]: '' }))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-text-1 flex items-center gap-2 mb-6">
        <Package className="w-5 h-5 text-violet-bright" aria-hidden="true" />
        Inventory
      </h1>

      {productsLoading && <Loading message="Loading products…" />}
      {productsError && <ErrorMessage message={productsError} />}

      {!productsLoading && !productsError && products && (
        <div className="gradient-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Inventory table">
              <thead>
                <tr className="border-b border-white/[0.06] bg-canvas-2">
                  <th scope="col" className="text-left px-4 py-3 text-xs text-text-3 font-medium">Product</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs text-text-3 font-medium">Current Stock</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs text-text-3 font-medium">Set Quantity</th>
                  <th scope="col" className="text-right px-4 py-3 text-xs text-text-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => (
                  <InventoryRow
                    key={product.id}
                    product={product}
                    index={i}
                    quantity={quantities[product.id] ?? ''}
                    onQuantityChange={(val) =>
                      setQuantities((prev) => ({ ...prev, [product.id]: val }))
                    }
                    onUpdate={handleUpdateOrCreate}
                    updating={updatingId === product.id}
                    getStockVariant={getStockVariant}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component for each inventory row — fetches its own inventory data
interface InventoryRowProps {
  product: Product
  index: number
  quantity: string
  onQuantityChange: (val: string) => void
  onUpdate: (product: Product, currentQty: number | null) => void
  updating: boolean
  getStockVariant: (qty: number) => string
}

function InventoryRow({
  product,
  index,
  quantity,
  onQuantityChange,
  onUpdate,
  updating,
  getStockVariant,
}: InventoryRowProps) {
  const { data: inventory, loading, refetch } = useData<InventoryRecord>(
    () => inventoryApi.get(product.id),
    [product.id],
  )

  const currentQty = inventory?.quantity ?? null

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
    >
      <td className="px-4 py-3 font-medium text-text-1">{product.name}</td>
      <td className="px-4 py-3 text-right">
        {loading ? (
          <span className="text-text-4 text-xs">…</span>
        ) : currentQty !== null ? (
          <Badge variant={getStockVariant(currentQty) as 'danger' | 'warning' | 'success'}>
            {currentQty} units
          </Badge>
        ) : (
          <Badge variant="default">No record</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          placeholder="0"
          aria-label={`Set quantity for ${product.name}`}
          className="w-20 bg-canvas-2 border border-white/[0.08] rounded-md px-2 py-1 text-sm text-text-1 text-right focus:outline-none focus:border-violet/50 transition-colors tabular-nums"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <Button
          variant="secondary"
          size="sm"
          loading={updating}
          disabled={!quantity}
          onClick={async () => {
            await onUpdate(product, currentQty)
            refetch()
          }}
          aria-label={`Update inventory for ${product.name}`}
        >
          <RefreshCw className="w-3 h-3" aria-hidden="true" />
          {currentQty === null ? 'Create' : 'Update'}
        </Button>
      </td>
    </motion.tr>
  )
}
