import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { LayoutDashboard, BookOpen, BrainCircuit, User as UserIcon, LogOut } from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const { user } = useUser();
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Train', path: '/train', icon: BrainCircuit },
        { name: 'Openings', path: '/openings', icon: BookOpen },
        { name: 'Profile', path: '/profile', icon: UserIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            CT
                        </div>
                        <span className="font-bold text-xl hidden sm:block">Chess Trainer</span>
                    </Link>

                    <nav className="flex gap-1 sm:gap-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                    location.pathname === item.path
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {user?.is_authenticated ? (
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Level {user.level}</span>
                                    <span className="text-sm font-semibold text-blue-600">{user.xp} XP</span>
                                </div>
                                <a 
                                    href="/admin/logout/?next=/" 
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Log Out"
                                >
                                    <LogOut className="w-5 h-5" />
                                </a>
                            </div>
                        ) : (
                            <a href="/admin/login/?next=/" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                                Log In
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <Outlet />
            </main>
        </div>
    );
};
