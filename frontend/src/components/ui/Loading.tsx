/**
 * Loading — accessible spinner with aria-busy and status role.
 * Used wherever data is being fetched.
 */
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function Loading({ className, size = 'md', message = 'Loading…' }: LoadingProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      className={cn('flex flex-col items-center justify-center gap-3 p-8', className)}
    >
      <div
        className={cn(
          'border-2 border-violet/20 border-t-violet-bright rounded-full animate-spin',
          sizeMap[size],
        )}
      />
      <span className="text-sm text-text-3">{message}</span>
    </div>
  )
}
