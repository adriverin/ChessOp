import { useMemo } from 'react'
import type { TrainingArenaProps, Variation } from '../types'
import { ModePicker } from './ModePicker'
import { TrainingSession } from './TrainingSession'

function findVariation(variations: Variation[], variationId: string) {
    return variations.find(v => v.id === variationId) ?? null
}

export function TrainingArena({
    openings,
    variations,
    userProgress,
    currentSession,
    userStats,
    isGuest = false,
    isPremium = false,
    soundEnabled,
    setSoundEnabled,
    sessionBoard,
    onPlayMove,
    onRequestHint,
    onResetPosition,
    onStepBack,
    onStepForward,
    onNextSession,
    onRetrySession,
    onSelectOpening,
    onSelectVariation,
    onSwitchMode,
    onToggleRepertoireOnly,
    onToggleWrongMoveMode,
    onChangeSideFilter,
    onStartFreeTrial,
    onSignUp,
    successOverlay,
}: TrainingArenaProps) {
    const sessionVariation = useMemo(() => {
        if (!currentSession) return null
        return findVariation(variations, currentSession.variationId)
    }, [currentSession, variations])

    const sessionPremiumBlocked = currentSession && !!sessionVariation && sessionVariation.isPremium && !isPremium
    const sessionProgressionBlocked = currentSession && currentSession.mode === 'opening-drill' && !!sessionVariation && sessionVariation.isLocked

    return (
        <div className="w-full">
            {currentSession ? (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    {(sessionPremiumBlocked || sessionProgressionBlocked) && (
                        <div className="mb-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm">
                            {sessionPremiumBlocked && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">🔒 This line is Premium</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Unlock Premium to train this variation.
                                        </p>
                                    </div>
                                    {!isPremium && (
                                        <button
                                            onClick={onStartFreeTrial}
                                            className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 ring-1 ring-inset ring-emerald-500/60 shadow-sm transition-colors"
                                        >
                                            Start free trial
                                        </button>
                                    )}
                                </div>
                            )}

                            {sessionProgressionBlocked && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">🔒 Train all variations to unlock</p>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            Opening Drill becomes available after you’ve trained the full set of variations.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onSwitchMode?.('opening-training')}
                                        className="inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/40 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-700/40 transition-colors"
                                    >
                                        Switch to Opening Training
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <TrainingSession
                        openings={openings}
                        variations={variations}
                        currentSession={currentSession}
                        userStats={userStats}
                        isGuest={isGuest}
                        onSignUp={onSignUp}
                        board={sessionBoard}
                        soundEnabled={soundEnabled}
                        setSoundEnabled={setSoundEnabled}
                        onPlayMove={onPlayMove}
                        onRequestHint={onRequestHint}
                        onResetPosition={onResetPosition}
                        onStepBack={onStepBack}
                        onStepForward={onStepForward}
                        onNextSession={onNextSession}
                        onRetrySession={onRetrySession}
                        onSelectOpening={onSelectOpening}
                        onSelectVariation={onSelectVariation}
                        onSwitchMode={onSwitchMode}
                        onToggleRepertoireOnly={onToggleRepertoireOnly}
                        onToggleWrongMoveMode={onToggleWrongMoveMode}
                        onChangeSideFilter={onChangeSideFilter}
                        successOverlay={successOverlay}
                    />
                </div>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-950">
                    <ModePicker
                        userStats={userStats}
                        userProgress={userProgress}
                        variations={variations}
                        openings={openings}
                        isGuest={isGuest}
                        isPremium={isPremium}
                        onSelectMode={(mode) => {
                            onSwitchMode?.(mode)
                        }}
                        onStartFreeTrial={onStartFreeTrial}
                        onSignUp={onSignUp}
                    />
                </div>
            )}
        </div>
    )
}
