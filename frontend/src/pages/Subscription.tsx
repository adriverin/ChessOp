import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const Subscription: React.FC = () => {
    const { user, loading, refreshUser } = useUser();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [managing, setManaging] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncTimedOut, setSyncTimedOut] = useState(false);

    const isUpgraded = searchParams.get('upgraded') === '1';

    useEffect(() => {
        if (!isUpgraded) return;

        let cancelled = false;
        const attempts = [1000, 2000, 3000, 5000, 8000];

        const removeUpgradeFlag = () => {
            const params = new URLSearchParams(searchParams);
            params.delete('upgraded');
            setSearchParams(params, { replace: true });
        };

        const checkPremium = async () => {
            setSyncing(true);
            setSyncTimedOut(false);

            for (const delay of attempts) {
                if (cancelled) return;

                try {
                    const data = await api.me();
                    const status = data.subscription?.status;
                    const periodEnd = data.subscription?.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd) : null;
                    const isCancelActive = data.subscription?.cancelAtPeriodEnd && periodEnd ? periodEnd.getTime() > Date.now() : false;
                    const isPremiumLike = Boolean(
                        data.isPremium ||
                        status === 'active' ||
                        status === 'trialing' ||
                        status === 'active_canceling' ||
                        isCancelActive
                    );

                    if (isPremiumLike) {
                        await refreshUser();
                        removeUpgradeFlag();
                        setSyncing(false);
                        return;
                    }
                } catch (err) {
                    console.error('Failed to sync subscription', err);
                }

                await new Promise(resolve => setTimeout(resolve, delay));
            }

            if (!cancelled) {
                setSyncTimedOut(true);
                setSyncing(false);
            }
        };

        checkPremium();

        return () => {
            cancelled = true;
        };
    }, [isUpgraded, refreshUser, searchParams, setSearchParams]);

    const subscription = user?.subscription;

    const currentPeriodEnd = useMemo(() => subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null, [subscription]);
    const trialEndsAt = useMemo(() => subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null, [subscription]);

    const statusLabel = useMemo(() => {
        const status = subscription?.status;

        if (status === 'trialing') {
            return `Trial${trialEndsAt ? ` (ends on ${trialEndsAt.toLocaleDateString()})` : ''}`;
        }

        if (status === 'active_canceling' || subscription?.cancelAtPeriodEnd) {
            return `Cancels on ${currentPeriodEnd ? currentPeriodEnd.toLocaleDateString() : 'period end'}`;
        }

        if (status === 'past_due') {
            return 'Payment issue';
        }

        if (status === 'active') {
            return 'Premium Active';
        }

        if (status === 'canceled') {
            return 'Inactive';
        }

        return user?.is_premium ? 'Premium Active' : 'Free Tier';
    }, [subscription, currentPeriodEnd, trialEndsAt, user?.is_premium]);

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

            {syncing && (
                <div className="bg-blue-900 text-blue-100 p-4 rounded mb-4">
                    Syncing your subscription...
                </div>
            )}

            {syncTimedOut && (
                <div className="bg-yellow-900 text-yellow-100 p-4 rounded mb-4 space-y-2">
                    <p>We're still confirming your subscription. If it doesn't update soon, click refresh or contact support.</p>
                    <button
                        onClick={() => refreshUser()}
                        className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
                    >
                        Refresh
                    </button>
                </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Status</h2>
                    <div className="text-lg font-semibold text-white">{statusLabel}</div>
                </div>

                {user.subscription && (
                    <div className="mb-6 space-y-2">
                        <p><span className="text-gray-400">Status:</span> {user.subscription.status || 'unknown'}</p>
                        {user.subscription.planInterval && (
                             <p><span className="text-gray-400">Plan:</span> {user.subscription.planInterval}ly</p>
                        )}
                        {user.subscription.currentPeriodEnd && (
                            <p><span className="text-gray-400">Current Period End:</span> {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                        )}
                        {user.subscription.trialEndsAt && (
                            <p><span className="text-gray-400">Trial Ends:</span> {new Date(user.subscription.trialEndsAt).toLocaleDateString()}</p>
                        )}
                        {user.subscription.cancelAtPeriodEnd && user.subscription.currentPeriodEnd && (
                            <p><span className="text-gray-400">Cancellation Date:</span> {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</p>
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
