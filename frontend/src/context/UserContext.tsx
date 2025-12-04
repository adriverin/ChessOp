import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';
import type { DashboardResponse } from '../types';

interface UserContextType {
    user: DashboardResponse | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const data = await api.getDashboard();
            setUser(data);
        } catch (error) {
            console.error("Failed to fetch user data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, loading, refreshUser }}>
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

