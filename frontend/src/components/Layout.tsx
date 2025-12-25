import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, type NavigationItem } from './Shell';
import { useUser } from '../context/UserContext';
import type { DashboardResponse } from '../types';

function getStringProp(record: Record<string, unknown>, key: string) {
    const value = record[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function getUserMenuUser(user: DashboardResponse | null) {
    if (!user?.is_authenticated) return undefined;

    const record = user as unknown as Record<string, unknown>;
    const name =
        getStringProp(record, 'displayName') ??
        getStringProp(record, 'display_name') ??
        getStringProp(record, 'username') ??
        getStringProp(record, 'email') ??
        'Player';

    const avatarUrl = getStringProp(record, 'avatarUrl') ?? getStringProp(record, 'avatar_url') ?? undefined;

    const is_premium = Boolean(user.effective_premium || user.is_premium);
    const is_superuser = Boolean(user.is_superuser || user.is_staff);

    return { name, avatarUrl, is_premium, is_superuser };
}

function isActive(pathname: string, href: string) {
    if (href === '/training-arena') return pathname === '/training-arena';
    if (href === '/curriculum') return pathname === '/curriculum' || pathname === '/openings';
    return pathname === href;
}

export const Layout: React.FC = () => {
    const { user, logout } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const isTrainingRoute = location.pathname === '/' || location.pathname === '/training-arena' || location.pathname === '/train' || location.pathname === '/drill';

    const navigationItems: NavigationItem[] = [
        { label: 'Training Arena', href: '/training-arena', isActive: isActive(location.pathname, '/training-arena') },
        { label: 'Curriculum', href: '/curriculum', isActive: isActive(location.pathname, '/curriculum') },
        { label: 'Profile', href: '/profile', isActive: isActive(location.pathname, '/profile') },
        { label: 'Help', href: '/help', isActive: isActive(location.pathname, '/help') },
    ];

    const shellUser = getUserMenuUser(user);

    return (
        <AppShell
            navigationItems={navigationItems}
            user={shellUser}
            onNavigate={(href) => navigate(href)}
            onSignIn={() =>
                navigate('/login', {
                    replace: false,
                        state: { from: location },
                })
            }
            onLogout={() => void logout()}
        >
            <div className={`max-w-[95vw] mx-auto w-full px-4 sm:px-6 lg:px-8 ${isTrainingRoute ? 'pt-2 pb-4' : 'py-6'}`}>
                <Outlet />
            </div>
        </AppShell>
    );
};
