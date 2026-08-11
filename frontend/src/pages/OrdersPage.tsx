/**
 * OrdersPage — list all orders for the demo user with cancel support.
 */
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList } from 'lucide-react'
import { usersApi, ordersApi } from '@/services/api'
import type { Order } from '@/types'
import { OrderDetails } from '@/components/orders/OrderDetails'
import { Loading } from '@/components/ui/Loading'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { useData } from '@/hooks/useData'

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? ''

export function OrdersPage() {
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const {
    data: orders,
    loading,
    error,
    refetch,
  } = useData<Order[]>(
    () => usersApi.getOrders(DEMO_USER_ID),
    [DEMO_USER_ID],
  )

  const handleCancel = useCallback(async (orderId: string) => {
    setCancellingId(orderId)
    try {
      await ordersApi.cancel(orderId)
      refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setCancellingId(null)
    }
  }, [refetch])

  if (!DEMO_USER_ID) {
    return (
      <div className="p-6">
        <ErrorMessage message="Please create a user on the Profile page first to view orders." />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold text-text-1 flex items-center gap-2 mb-6">
        <ClipboardList className="w-5 h-5 text-violet-bright" aria-hidden="true" />
        Orders
      </h1>

      {loading && <Loading message="Loading orders…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          {(!orders || orders.length === 0) ? (
            <div className="gradient-border p-12 text-center text-text-3 text-sm">
              No orders yet. Place your first order from the Cart page.
            </div>
          ) : (
            <AnimatePresence>
              <div className="flex flex-col gap-4">
                {orders.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.06 }}
                  >
                    <OrderDetails
                      order={order}
                      onCancel={handleCancel}
                      cancelling={cancellingId === order.id}
                    />
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}
