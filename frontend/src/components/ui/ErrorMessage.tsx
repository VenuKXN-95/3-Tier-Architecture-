/**
 * ErrorMessage — displays API error messages cleanly.
 * Never exposes stack traces or internal details.
 */
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message?: string
  className?: string
}

export function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  className,
}: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/[0.08] px-4 py-3 text-sm text-danger',
        className,
      )}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}
