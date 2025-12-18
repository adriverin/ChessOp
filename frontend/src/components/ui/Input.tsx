import * as React from 'react'
import { cn } from './cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-10 w-full rounded-lg bg-white px-3 text-sm text-slate-900',
          'ring-1 ring-inset ring-slate-200/80',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-emerald-400/40 dark:focus:ring-emerald-500/40',
          'dark:bg-slate-950 dark:text-white dark:ring-slate-800',
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

