import { ArrowUpRight, RotateCcw, Play } from 'lucide-react';

interface SuccessOverlayProps {
    title: string;
    description: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export function SuccessOverlay({ title, description, primaryAction, secondaryAction }: SuccessOverlayProps) {
    return (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 rounded-xl">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-200/50 dark:ring-emerald-700/30">
                <span className="text-xl">✨</span>
            </div>

            <h2 className="text-lg font-heading font-bold text-white mb-2">
                {title}
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed max-w-[280px]">
                {description}
            </p>

            <div className="flex flex-col gap-3 w-full max-w-[240px]">
                {primaryAction && (
                    <button
                        onClick={primaryAction.onClick}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-lg transition-colors shadow-sm shadow-emerald-600/20 text-sm"
                        type="button"
                    >
                        <span>{primaryAction.label}</span>
                        <ArrowUpRight className="h-4 w-4" />
                    </button>
                )}

                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 font-medium rounded-lg transition-colors ring-1 ring-inset ring-white/10 text-sm"
                        type="button"
                    >
                        <span>{secondaryAction.label}</span>
                        {secondaryAction.label.toLowerCase().includes('next') ? (
                            <Play className="h-4 w-4" />
                        ) : (
                            <RotateCcw className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
