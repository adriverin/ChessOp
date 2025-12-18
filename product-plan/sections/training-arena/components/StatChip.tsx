import type { ReactNode } from 'react'

type StatVariant = 'default' | 'success' | 'warning' | 'accent'

interface StatChipProps {
    icon: ReactNode
    label: string
    value: string | number
    variant?: StatVariant
}

const variantStyles: Record<StatVariant, string> = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    accent: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900',
}

export function StatChip({ icon, label, value, variant = 'default' }: StatChipProps) {
    return (
        <div
            className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                transition-all duration-200 hover:scale-105
                ${variantStyles[variant]}
            `}
            title={label}
        >
            <span className="w-3.5 h-3.5 opacity-70">{icon}</span>
            <span className="font-semibold tabular-nums">{value}</span>
        </div>
    )
}
