import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import type { DashboardResponse } from '../types';

interface UserContextType {
    user: DashboardResponse | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    login: (payload: any) => Promise<void>;
    signup: (payload: any) => Promise<void>;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        setLoading(true);
        try {
            // Unify source of truth: Get auth/premium from 'me' endpoint, stats from 'dashboard'.
            // Execute in parallel to minimize latency.
            const [meData, dashboardData] = await Promise.all([
                api.me().catch(() => null), // If me fails, we probably aren't authed
                api.getDashboard().catch(() => null)
            ]);

            if (!meData && !dashboardData) {
                // Both failed
                setUser(null);
                return;
            }

            // Normalize and merge. 'me' takes precedence for auth/premium.
            // Dashboard takes precedence for XP/quests.
            const combinedUser: DashboardResponse = {
                ...(dashboardData || {}),
                ...(meData || {}),

                // Explicitly normalize premium/auth fields from 'me' (assuming meData is fresher/correct)
                is_authenticated: meData?.isAuthenticated ?? dashboardData?.is_authenticated ?? false,
                is_premium: meData?.isPremium ?? dashboardData?.is_premium ?? false,
                subscription: meData?.subscription ?? dashboardData?.subscription,

                // Ensure we have stats if 'me' doesn't provide them
                xp: dashboardData?.xp ?? meData?.xp,
                level: dashboardData?.level ?? meData?.level,
                quests: dashboardData?.quests ?? meData?.quests,
            };

            setUser(combinedUser);
        } catch (error) {
            console.error("Failed to fetch user data", error);
            // If we have a critical failure (like 401 on me), clear user
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (payload: any) => {
        await api.login(payload);
        await refreshUser();
    };

    const signup = async (payload: any) => {
        await api.signup(payload);
        await refreshUser();
    };

    const logout = async () => {
        await api.logout();
        setUser(null); // Clear locally
        await refreshUser(); // Confirm with server
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser, login, signup, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

