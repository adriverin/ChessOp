import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useUpgradeNavigation } from '../hooks/useUpgradeNavigation';
import { LayoutDashboard, BookOpen, User as UserIcon, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const { user, loading, logout } = useUser();
    const location = useLocation();

    const { goToPricing } = useUpgradeNavigation();
    const isAuthenticated = !!user?.is_authenticated;
    const isPremium = !!user?.effective_premium || !!user?.is_premium;

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Openings', path: '/openings', icon: BookOpen },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    return (
        <div className="min-h-screen bg-transparent text-slate-100 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800/80">
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
                                        ? 'bg-indigo-500/20 text-indigo-100 border-indigo-500/40 shadow-inner'
                                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* Upgrade / Subscription CTA */}
                        {!loading && isAuthenticated && isPremium && (
                            <Link
                                to="/subscription"
                                className="px-3 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-100 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/70 transition"
                            >
                                Manage
                            </Link>
                        )}
                        {!loading && isAuthenticated && !isPremium && (
                            <button
                                type="button"
                                onClick={goToPricing}
                                className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-400 text-white shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/40 transition"
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
