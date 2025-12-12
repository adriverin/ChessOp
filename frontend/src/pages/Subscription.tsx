import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Subscription: React.FC = () => {
    const { user, loading, refreshUser } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [managing, setManaging] = useState(false);
    
    const isUpgraded = searchParams.get('upgraded') === '1';

    useEffect(() => {
        if (isUpgraded) {
            refreshUser();
        }
    }, [isUpgraded]);

    if (loading) return <div>Loading...</div>;

    if (!user || !user.is_authenticated) {
        // Redirect to login or show message (RequireAuth wrapper should handle this usually)
        return <div className="text-white p-6">Please log in.</div>;
    }

    const handleManage = async () => {
        setManaging(true);
        try {
            const { url } = await api.createPortalSession();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            // If no billing account, maybe redirect to pricing
            navigate('/pricing');
        } finally {
            setManaging(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 text-white">
            <h1 className="text-3xl font-bold mb-6">Subscription</h1>
            
            {isUpgraded && (
                <div className="bg-green-600 text-white p-4 rounded mb-6">
                    Subscription updated successfully!
                </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Status</h2>
                    <div className="text-lg">
                        {user.is_premium ? (
                            <span className="text-green-400 font-bold">Premium Active</span>
                        ) : (
                            <span className="text-gray-400">Free Tier</span>
                        )}
                    </div>
                </div>

                {user.subscription && (
                    <div className="mb-6 space-y-2">
                        <p><span className="text-gray-400">Status:</span> {user.subscription.status}</p>
                        {user.subscription.planInterval && (
                             <p><span className="text-gray-400">Plan:</span> {user.subscription.planInterval}ly</p>
                        )}
                        {user.subscription.currentPeriodEnd && (
                            <p><span className="text-gray-400">Current Period End:</span> {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                        )}
                    </div>
                )}

                <div className="mt-8">
                    {user.is_premium ? (
                        <button 
                            onClick={handleManage}
                            disabled={managing}
                            className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition"
                        >
                            {managing ? 'Loading...' : 'Manage Subscription'}
                        </button>
                    ) : (
                        <div>
                            <p className="mb-4 text-gray-300">Unlock all features with Premium.</p>
                            <button 
                                onClick={() => navigate('/pricing')}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded transition"
                            >
                                View Plans
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
