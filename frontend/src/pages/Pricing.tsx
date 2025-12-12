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
        <div className="max-w-4xl mx-auto p-6 text-slate-100">
            <h1 className="text-3xl font-semibold mb-6 text-center">Upgrade to Premium</h1>

            {isCanceled && (
                <div className="bg-amber-500/20 text-amber-100 p-4 rounded-xl border border-amber-400/30 mb-6 text-center">
                    Checkout canceled. No charge was made.
                </div>
            )}

            {error && (
                <div className="bg-rose-500/20 text-rose-100 p-4 rounded-xl border border-rose-400/30 mb-6 text-center">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Monthly */}
                <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex flex-col items-center shadow-2xl shadow-black/40">
                    <h2 className="text-2xl font-semibold mb-2">Monthly</h2>
                    <p className="text-4xl font-bold mb-4 text-white">$4.99<span className="text-base font-normal text-slate-400">/mo</span></p>
                    <p className="text-emerald-200 mb-6 font-semibold">7-day free trial</p>
                    <ul className="text-slate-300 space-y-2 mb-8 text-center">
                        <li>Unlimited openings</li>
                        <li>Unlimited drills</li>
                        <li>Advanced stats</li>
                    </ul>
                    <button
                        onClick={() => handleSubscribe('monthly')}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-8 rounded-full w-full transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/40"
                    >
                        {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                    </button>
                </div>

                {/* Yearly */}
                <div className="bg-slate-900/70 p-8 rounded-2xl border border-slate-800 flex flex-col items-center relative overflow-hidden shadow-2xl shadow-black/40">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-xs px-3 py-1 rounded-bl-xl text-white font-semibold">
                        Best Value
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Yearly</h2>
                    <p className="text-4xl font-bold mb-4 text-white">$34.99<span className="text-base font-normal text-slate-400">/yr</span></p>
                    <p className="text-emerald-200 mb-6 font-semibold">7-day free trial</p>
                    <ul className="text-slate-300 space-y-2 mb-8 text-center">
                        <li>All Monthly features</li>
                        <li>Save ~40%</li>
                    </ul>
                    <button
                        onClick={() => handleSubscribe('yearly')}
                        disabled={loading}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-8 rounded-full w-full transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/40"
                    >
                        {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                    </button>
                </div>
            </div>

            {isPremium && (
                <div className="mt-8 text-center text-slate-400">
                    You are already subscribed.{" "}
                    <button
                        onClick={() => navigate('/subscription')}
                        className="text-indigo-200 underline"
                    >
                        Manage your subscription
                    </button>
                    .
                </div>
            )}
        </div>
    );
};
