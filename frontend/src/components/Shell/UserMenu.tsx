import { useState, useRef, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

export interface UserMenuProps {
    user?: {
        name: string;
        avatarUrl?: string;
        is_premium?: boolean;
        is_superuser?: boolean;
        one_move_current_streak?: number;
    };
    onLogout?: () => void;
    onSignIn?: () => void;
}

export function UserMenu({ user, onLogout, onSignIn }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) {
        return (
            <button
                onClick={onSignIn}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-body"
                type="button"
            >
                <User size={18} />
                <span>Sign In</span>
            </button>
        );
    }

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 p-1 pl-3 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                type="button"
            >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200 font-body hidden sm:block">
                    {user.name}
                </span>
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-xs font-bold font-heading">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 sm:hidden">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate font-heading">
                            {user.name}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            onLogout?.();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-red-600 dark:hover:text-red-400 transition-colors font-body leading-none"
                        type="button"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}

