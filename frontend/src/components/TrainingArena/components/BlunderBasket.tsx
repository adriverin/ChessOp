import { X } from 'lucide-react'
import type { UserMistake, Variation } from '../types'

export interface BlunderBasketProps {
    userMistakes: UserMistake[]
    variations: Variation[]
    onReviewMistake?: (mistakeId: string) => void
    onDismissMistake?: (mistakeId: string) => void
    onClearAll?: () => void
}

function formatWhen(iso: string) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return 'Recently'
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function BlunderBasket({
    userMistakes,
    variations,
    onReviewMistake,
    onDismissMistake,
    onClearAll,
}: BlunderBasketProps) {
    const mistakes = userMistakes.slice().sort((a, b) => {
        const aTime = new Date(a.occurredAt).getTime()
        const bTime = new Date(b.occurredAt).getTime()
        return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime)
    })

    return (
        <section className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-950/40 ring-1 ring-inset ring-slate-200/80 dark:ring-slate-800 shadow-sm h-full flex flex-col">
            <header className="relative flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800 shrink-0">
                <div>
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 ring-1 ring-inset ring-amber-200/60 dark:ring-amber-700/40">
                            <span className="text-lg leading-none">♟</span>
                        </span>
                        <h2 className="text-base sm:text-lg font-heading font-semibold text-slate-900 dark:text-white">
                            Blunder Basket
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Review positions where you played the wrong move.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {onClearAll && mistakes.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="mr-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                            type="button"
                        >
                            Clear All
                        </button>
                    )}
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-inset ring-slate-200 dark:ring-slate-700 whitespace-nowrap">
                        {mistakes.length} saved
                    </span>
                </div>
            </header>

            <div className="relative p-5 sm:p-6 overflow-y-auto flex-1 h-0">
                {mistakes.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
                        <p className="font-medium text-slate-900 dark:text-white">No mistakes saved</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            When you miss a move during training, it will land here for targeted review.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {mistakes.map((mistake) => {
                            const variation = variations.find(v => v.id === mistake.variationId)
                            return (
                                <li
                                    key={mistake.id}
                                    className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/30 p-3 sm:p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                {variation?.name ?? 'Unknown variation'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-1">
                                                <span>{formatWhen(mistake.occurredAt)} •</span>
                                                <span>Played <span className="font-mono bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-1 py-0.5 rounded">{mistake.wrongMove}</span>,</span>
                                                <span>best <span className="font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-1 py-0.5 rounded">{mistake.correctMove}</span></span>
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() => onReviewMistake?.(mistake.id)}
                                                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors shadow-sm"
                                                type="button"
                                            >
                                                Review Mistake
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('Dismissing mistake ID:', mistake.id);
                                                    onDismissMistake?.(mistake.id);
                                                }}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                                                aria-label="Dismiss mistake"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </section>
    )
}
