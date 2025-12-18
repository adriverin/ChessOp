import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface GuestModeBannerProps {
    isAuthenticated: boolean;
    isLoading?: boolean;
    storageKey?: string;
    className?: string;
}

export const GuestModeBanner: React.FC<GuestModeBannerProps> = ({
    isAuthenticated,
    isLoading = false,
    storageKey = 'guestBannerDismissed',
    className,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored === 'true') {
                setDismissed(true);
            }
        } catch {
            // Ignore localStorage errors (private mode, etc.)
        }
    }, [storageKey]);

    if (isAuthenticated || dismissed || isLoading) return null;

    const handleDismiss = () => {
        setDismissed(true);
        try {
            localStorage.setItem(storageKey, 'true');
        } catch {
            // Ignore localStorage errors
        }
    };

    return (
        <div
            className={clsx(
                'flex items-start gap-3 rounded-xl border border-indigo-200/70 bg-indigo-50 text-slate-800 p-3 shadow-sm dark:bg-slate-900/70 dark:border-slate-800 dark:text-slate-100',
                className
            )}
        >
            <div className="flex-1 space-y-1">
                <div className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">You're training in Guest Mode</div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                    You can practice selected openings and lines. Create an account to unlock all lines and save your progress.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    <button
                        onClick={() =>
                            navigate('/signup', {
                                replace: false,
                                state: { backgroundLocation: location, from: location },
                            })
                        }
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-full shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                        Create account
                    </button>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 dark:text-indigo-200 dark:hover:text-white"
                    >
                        What's included?
                    </button>
                </div>
            </div>
            <button
                onClick={handleDismiss}
                aria-label="Dismiss guest mode banner"
                className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/60 transition-colors dark:text-slate-400 dark:hover:text-white/90 dark:hover:bg-white/10"
            >
                <X size={14} />
            </button>
        </div>
    );
};
