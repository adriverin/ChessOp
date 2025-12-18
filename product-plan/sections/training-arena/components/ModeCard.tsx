import type { ReactNode } from 'react'
import type { TrainingMode } from '../types'

interface ModeCardProps {
    mode: TrainingMode
    title: string
    description: string
    icon: ReactNode
    stats: ReactNode
    isLocked?: boolean
    isPremium?: boolean
    onSelect?: () => void
    onUnlock?: () => void
}

export function ModeCard({
    title,
    description,
    icon,
    stats,
    isLocked = false,
    isPremium = false,
    onSelect,
    onUnlock,
}: ModeCardProps) {
    const handleClick = () => {
        if (isLocked && onUnlock) {
            onUnlock()
        } else if (!isLocked && onSelect) {
            onSelect()
        }
    }

    return (
        <button
            onClick={handleClick}
            className={`
                group relative w-full text-left p-6 rounded-2xl border-2 transition-all duration-300
                ${isLocked
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-75'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/5 cursor-pointer hover:-translate-y-1'
                }
            `}
            disabled={isLocked && !onUnlock}
        >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Premium badge */}
            {isPremium && (
                <div className="absolute -top-2 -right-2 px-2.5 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-xs font-bold rounded-full shadow-lg shadow-amber-500/30 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    PRO
                </div>
            )}

            {/* Lock icon for locked modes */}
            {isLocked && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
            )}

            <div className="relative z-10">
                {/* Icon */}
                <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110
                    ${isLocked
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                        : 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    }
                `}>
                    {icon}
                </div>

                {/* Title */}
                <h3 className={`
                    text-lg font-heading font-bold mb-2
                    ${isLocked
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-900 dark:text-white'
                    }
                `}>
                    {title}
                </h3>

                {/* Description */}
                <p className={`
                    text-sm mb-4 leading-relaxed
                    ${isLocked
                        ? 'text-slate-400 dark:text-slate-600'
                        : 'text-slate-600 dark:text-slate-400'
                    }
                `}>
                    {description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-2">
                    {stats}
                </div>

                {/* CTA for locked modes */}
                {isLocked && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Start Free Trial
                        </span>
                    </div>
                )}
            </div>
        </button>
    )
}
