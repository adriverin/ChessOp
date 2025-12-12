import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export const Pricing: React.FC = () => {
    const { user, loading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    const isCanceled = searchParams.get('canceled') === '1';
    const selectedPlan = searchParams.get('plan') as ('monthly' | 'yearly' | null);
    const autoStart = searchParams.get('autostart') === '1';

    const isAuthenticated = !!user?.is_authenticated;
    const isPremium = !!user?.is_premium;

    const effectivePlan = useMemo(() => {
        if (selectedPlan === 'monthly' || selectedPlan === 'yearly') return selectedPlan;
        return null;
    }, [selectedPlan]);

    const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
        if (loading) return;
        setError(null);

        if (!isAuthenticated) {
            // Persist choice in URL so login flow can return here and proceed.
            const next = new URLSearchParams(searchParams);
            next.set('plan', plan);
            next.set('autostart', '1');
            setSearchParams(next, { replace: true });

            navigate('/login', {
                state: {
                    backgroundLocation: location,
                    from: {
                        pathname: '/pricing',
                        search: `?plan=${plan}&autostart=1`,
                    },
                },
            });
            return;
        }

        if (isPremium) {
            navigate('/subscription');
            return;
        }

        try {
            const { url } = await api.createCheckoutSession(plan);
            window.location.href = url;
        } catch (err: any) {
            console.error(err);
            const code = err.response?.data?.error;
            const detail = err.response?.data?.detail;
            if (code === 'PRICE_NOT_CONFIGURED' || code === 'BILLING_NOT_CONFIGURED') {
                setError(`Billing is not configured on the server${detail ? ` (${detail})` : ''}.`);
            } else {
                setError(code || 'Failed to start checkout');
            }
        }
    };

    // If user logs in and returns here with ?autostart=1, start checkout once.
    useEffect(() => {
        if (loading) return;
        if (!autoStart) return;
        if (!effectivePlan) return;
        if (!isAuthenticated) return;
        if (isPremium) return;

        // Clear autostart flag to avoid loops if checkout fails.
        const next = new URLSearchParams(searchParams);
        next.delete('autostart');
        setSearchParams(next, { replace: true });

        handleSubscribe(effectivePlan);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, autoStart, effectivePlan, isAuthenticated, isPremium, searchParams]);

    if (loading) return <div className="flex justify-center p-10">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">Upgrade to Premium</h1>
            
            {isCanceled && (
                <div className="bg-yellow-50 text-yellow-900 p-4 rounded border border-yellow-200 mb-6 text-center">
                    Checkout canceled. No charge was made.
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-900 p-4 rounded border border-red-200 mb-6 text-center">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 flex flex-col items-center shadow-sm">
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Monthly</h2>
                    <p className="text-4xl font-bold mb-4 text-gray-900">$4.99<span className="text-base font-normal text-gray-500">/mo</span></p>
                    <p className="text-green-700 mb-6 font-semibold">7-day free trial</p>
                    <ul className="text-gray-700 space-y-2 mb-8 text-center">
                        <li>Unlimited openings</li>
                        <li>Unlimited drills</li>
                        <li>Advanced stats</li>
                    </ul>
                    <button 
                        onClick={() => handleSubscribe('monthly')}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded w-full transition-colors disabled:opacity-50"
                    >
                        {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                    </button>
                </div>

                {/* Yearly */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 flex flex-col items-center relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 bg-green-600 text-xs px-2 py-1 rounded-bl-lg text-white">
                        Best Value
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Yearly</h2>
                    <p className="text-4xl font-bold mb-4 text-gray-900">$34.99<span className="text-base font-normal text-gray-500">/yr</span></p>
                    <p className="text-green-700 mb-6 font-semibold">7-day free trial</p>
                    <ul className="text-gray-700 space-y-2 mb-8 text-center">
                        <li>All Monthly features</li>
                        <li>Save ~40%</li>
                    </ul>
                    <button 
                        onClick={() => handleSubscribe('yearly')}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded w-full transition-colors disabled:opacity-50"
                    >
                        {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                    </button>
                </div>
            </div>

            {isPremium && (
                <div className="mt-8 text-center text-gray-600">
                    You are already subscribed.{' '}
                    <button
                        onClick={() => navigate('/subscription')}
                        className="text-blue-700 underline"
                    >
                        Manage your subscription
                    </button>
                    .
                </div>
            )}
        </div>
    );
};
