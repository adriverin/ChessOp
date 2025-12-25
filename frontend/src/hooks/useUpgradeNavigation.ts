import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export function useUpgradeNavigation() {
    const { user, loading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const isAuthenticated = !!user?.is_authenticated;

    const goToPricing = useCallback(() => {
        if (loading) return;

        if (isAuthenticated) {
            navigate('/pricing');
            return;
        }

        // Safe fallback if called while logged out.
        navigate('/login', { state: { from: location } });
    }, [isAuthenticated, loading, navigate, location]);

    return { goToPricing, isAuthenticated, loading };
}
