import * as React from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
          'ring-1 ring-inset focus:outline-none focus:ring-2 focus:ring-emerald-400/40 dark:focus:ring-emerald-500/40',
          'disabled:opacity-60 disabled:pointer-events-none',
          size === 'sm' && 'h-9 px-3 text-sm',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-11 px-5 text-base',
          variant === 'primary' &&
            'bg-emerald-600 text-white hover:bg-emerald-500 ring-emerald-600/30 dark:bg-emerald-600 dark:hover:bg-emerald-500',
          variant === 'secondary' &&
            'bg-amber-100 text-amber-900 hover:bg-amber-200 ring-amber-200/70 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/40 dark:ring-amber-700/40',
          variant === 'ghost' &&
            'bg-transparent text-slate-700 hover:bg-slate-100 ring-transparent dark:text-slate-200 dark:hover:bg-slate-800/60',
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

