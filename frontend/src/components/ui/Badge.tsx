/**
 * Badge — semantic status badge for order status, stock levels, etc.
 */
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'violet' | 'cyan'
  className?: string
}

const variantMap: Record<string, string> = {
  default:  'bg-canvas-raised text-text-2 border-white/[0.06]',
  success:  'bg-success/10 text-success border-success/20',
  warning:  'bg-warning/10 text-warning border-warning/20',
  danger:   'bg-danger/10 text-danger border-danger/20',
  violet:   'bg-violet/10 text-violet-bright border-violet/20',
  cyan:     'bg-cyan-dim text-cyan border-cyan/20',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
        variantMap[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * OrderStatusBadge — maps OrderStatus enum to a semantic badge variant.
 */
const statusVariantMap: Record<OrderStatus, string> = {
  PLACED:     'violet',
  CONFIRMED:  'cyan',
  PROCESSING: 'cyan',
  SHIPPED:    'warning',
  DELIVERED:  'success',
  CANCELLED:  'danger',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={statusVariantMap[status] as BadgeProps['variant']}>
      {status}
    </Badge>
  )
}
