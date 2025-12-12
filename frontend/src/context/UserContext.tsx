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
        try {
            // Check session via dashboard or explicit 'me'
            // Using dashboard ensures we get all user data
            const data = await api.getDashboard();
            setUser(data);
        } catch (error) {
            console.error("Failed to fetch user data", error);
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

