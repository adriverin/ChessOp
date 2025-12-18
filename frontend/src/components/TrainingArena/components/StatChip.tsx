import type { ReactNode } from 'react'

interface StatChipProps {
    icon: ReactNode
    label: string
    value: string | number
    variant?: 'default' | 'success' | 'warning'
}

export function StatChip({ icon, label, value, variant = 'default' }: StatChipProps) {
    const variantClasses = {
        default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    }

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${variantClasses[variant]}`}>
            <span className="flex-shrink-0">{icon}</span>
            <span className="text-xs font-medium">{label}:</span>
            <span className="text-xs font-bold">{value}</span>
        </div>
    )
}

