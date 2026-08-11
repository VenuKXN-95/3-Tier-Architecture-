/**
 * Button — shadcn-style button with variants.
 */
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantMap: Record<string, string> = {
  primary:   'bg-violet text-white hover:bg-violet-bright border-transparent shadow-glow-violet',
  secondary: 'bg-canvas-raised text-text-1 hover:bg-canvas-3 border-white/[0.08]',
  ghost:     'bg-transparent text-text-2 hover:bg-white/[0.04] border-transparent',
  danger:    'bg-danger/10 text-danger hover:bg-danger/20 border-danger/20',
  outline:   'bg-transparent text-text-1 hover:bg-white/[0.04] border-white/[0.12]',
}

const sizeMap: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-sm rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium border transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-violet focus-visible:outline-offset-2',
          variantMap[variant],
          sizeMap[size],
          className,
        )}
        {...props}
      >
        {loading && (
          <span
            className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
