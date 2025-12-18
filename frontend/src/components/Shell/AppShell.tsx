import type { ReactNode } from 'react';
import { MainNav } from './MainNav';
import type { NavigationItem } from './MainNav';
import type { UserMenuProps } from './UserMenu';

export interface AppShellProps {
    children: ReactNode;
    navigationItems: NavigationItem[];
    user?: UserMenuProps['user'];
    onNavigate?: (href: string) => void;
    onSignIn?: () => void;
    onLogout?: () => void;
}

export function AppShell({
    children,
    navigationItems,
    user,
    onNavigate,
    onSignIn,
    onLogout
}: AppShellProps) {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-body selection:bg-emerald-100 dark:selection:bg-emerald-900/30 selection:text-emerald-900 dark:selection:text-emerald-100 flex flex-col">
            <MainNav
                items={navigationItems}
                user={user}
                onNavigate={onNavigate}
                onSignIn={onSignIn}
                onLogout={onLogout}
            />
            <main className="flex-1 relative flex flex-col">{children}</main>
        </div>
    );
}

