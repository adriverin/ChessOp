import { useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { UserMenu } from './UserMenu';
import type { UserMenuProps } from './UserMenu';

export interface NavigationItem {
    label: string;
    href: string;
    isActive?: boolean;
    icon?: ReactNode;
}

interface MainNavProps {
    items: NavigationItem[];
    user?: UserMenuProps['user'];
    onNavigate?: (href: string) => void;
    onLogout?: () => void;
}

export function MainNav({ items, user, onNavigate, onLogout }: MainNavProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleNavigate = (href: string) => {
        onNavigate?.(href);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and Desktop Nav */}
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => handleNavigate('/')}
                            className="flex items-center gap-2 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-600 transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <path d="M11.5 13a3.5 3.5 0 0 0 0-7h5a3.5 3.5 0 0 1 0 7h-5Z" />
                                    <path d="M5.5 13a3.5 3.5 0 0 0 0-7h5a3.5 3.5 0 0 1 0 7h-5Z" />
                                    <path d="M5.5 13a3.5 3.5 0 0 1 0 7h5a3.5 3.5 0 0 0 0-7h-5Z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
                                ChessOp
                            </span>
                        </button>

                        <div className="hidden md:flex items-center gap-1">
                            {items.map((item) => (
                                <button
                                    key={item.href}
                                    onClick={() => handleNavigate(item.href)}
                                    className={`
                    px-3 py-2 rounded-md text-sm font-medium transition-all font-heading
                    ${item.isActive
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }
                  `}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Menu & Mobile Toggle */}
                    <div className="flex items-center gap-2">
                        <div className="hidden md:block border-l border-slate-200 dark:border-slate-800 pl-4 ml-2">
                            <UserMenu user={user} onLogout={onLogout} />
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 animate-in slide-in-from-top-5 duration-200 absolute w-full shadow-xl">
                    <div className="pt-2 pb-3 space-y-1 px-4">
                        {items.map((item) => (
                            <button
                                key={item.href}
                                onClick={() => handleNavigate(item.href)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium font-heading transition-colors
                  ${item.isActive
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                `}
                            >
                                {/* Optional: Add icons mapping if needed, or pass them in props */}
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 pb-4 border-t border-slate-200 dark:border-slate-800 px-4">
                        <div className="flex items-center gap-3 px-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-heading text-lg">
                                {user?.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-slate-900 dark:text-white font-heading">{user?.name}</div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 font-body">Grandmaster in training</div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-body"
                        >
                            <LogOutIcon />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}

// Simple Icon component for logout to avoid dependency issues if lucide imports fail
function LogOutIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
    )
}
