import * as React from 'react'
import { cn } from './cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl bg-white/70 shadow-sm',
          'ring-1 ring-inset ring-slate-200/80',
          'dark:bg-slate-950/40 dark:ring-slate-800',
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

