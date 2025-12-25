import type { ReactNode } from 'react'
import type { TrainingMode } from '../types'

export interface ModeCardProps {
    mode: TrainingMode
    title: string
    description: string
    icon: ReactNode
    isPremium?: boolean
    isLocked?: boolean
    onSelect?: () => void
    onUnlock?: () => void
    stats?: ReactNode
}

export function ModeCard({
    title,
    description,
    icon,
    isPremium = false,
    isLocked = false,
    onSelect,
    onUnlock,
    stats,
}: ModeCardProps) {
    return (
        <div className="relative group">
            <div className={`
                h-full min-h-[260px] p-6 rounded-2xl border transition-all duration-300 flex flex-col
                ${isLocked
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-75'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/20'
                }
            `}>
                {/* Premium Badge */}
                {isPremium && (
                    <div className="absolute -top-2 -right-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg">
                            PREMIUM
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                        ${isLocked
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        }
                    `}>
                        {icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-1">
                            {title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Spacer to push stats and button to bottom */}
                <div className="flex-1" />

                {/* Stats - positioned at bottom, just above button */}
                {stats && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {stats}
                    </div>
                )}

                {/* Action Button */}
                {isLocked ? (
                    <button
                        onClick={onUnlock}
                        className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors duration-200"
                    >
                        Unlock Premium
                    </button>
                ) : (
                    <button
                        onClick={onSelect}
                        className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors duration-200"
                    >
                        Start Training
                    </button>
                )}
            </div>
        </div>
    )
}

