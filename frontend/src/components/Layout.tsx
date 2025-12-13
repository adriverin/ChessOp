import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useUpgradeNavigation } from '../hooks/useUpgradeNavigation';
import { LayoutDashboard, BookOpen, User as UserIcon, LogOut, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

export const Layout: React.FC = () => {
    const { user, loading, logout } = useUser();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const { goToPricing } = useUpgradeNavigation();
    const isAuthenticated = !!user?.is_authenticated;
    const isPremium = !!user?.effective_premium || !!user?.is_premium;

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Openings', path: '/openings', icon: BookOpen },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 dark:bg-transparent dark:text-slate-100 flex flex-col transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-sm dark:bg-slate-900/80 dark:border-slate-800/80 dark:shadow-none transition-colors duration-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-400 to-cyan-500 flex items-center justify-center text-slate-50 font-black shadow-lg shadow-indigo-900/30">
                            CT
                        </div>
                        <span className="font-semibold text-lg tracking-tight hidden sm:block">Chess Trainer</span>
                    </Link>

                    <nav className="flex items-center gap-1 sm:gap-2 text-sm">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-2 px-3 py-2 rounded-full transition-all border border-transparent',
                                    location.pathname === item.path
                                        ? 'bg-indigo-500/15 text-indigo-600 border-indigo-200 shadow-inner dark:bg-indigo-500/20 dark:text-indigo-100 dark:border-indigo-500/40'
                                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70'
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="p-2 rounded-full border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition shadow-sm dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-500 dark:hover:bg-slate-800/60"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        {/* Upgrade / Subscription CTA */}
                        {!loading && isAuthenticated && isPremium && (
                            <Link
                                to="/subscription"
                                className="px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-50 border border-slate-200 transition dark:text-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 dark:border-slate-700/70"
                            >
                                Manage
                            </Link>
                        )}
                        {!loading && isAuthenticated && !isPremium && (
                            <button
                                type="button"
                                onClick={goToPricing}
                                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/40 hover:brightness-110 cursor-pointer transition duration-200"
                            >
                                Upgrade
                            </button>
                        )}
                        {user?.is_authenticated ? (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end leading-tight">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.14em]">Level {user.level}</span>
                                    <span className="text-sm font-semibold text-indigo-300">{user.xp} XP</span>
                                </div>
                                <button
                                    onClick={() => logout()}
                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition"
                                    title="Log Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                state={{ backgroundLocation: location }}
                                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-400 transition"
                            >
                                Log In
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Outlet />
            </main>
        </div>
    );
};
