import type { TrainingMode } from '../types'

interface CompletionBannerProps {
    onNextSession?: () => void
    onRetrySession?: () => void
    onSwitchMode?: (mode: TrainingMode) => void
}

export function CompletionBanner({ onNextSession, onRetrySession, onSwitchMode }: CompletionBannerProps) {
    return (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✨</span>
                </div>
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                    Line Complete!
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Great job! You've mastered this variation.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={onNextSession}
                        className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
                        type="button"
                    >
                        Next Line
                    </button>

                    <button
                        onClick={onRetrySession}
                        className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                        type="button"
                    >
                        Try Again
                    </button>

                    <button
                        onClick={() => onSwitchMode?.('opening-training')}
                        className="w-full px-6 py-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
                        type="button"
                    >
                        Switch Training Mode
                    </button>
                </div>
            </div>
        </div>
    )
}

