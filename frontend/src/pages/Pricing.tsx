import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../context/UserContext';
import { api } from '../api/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const Pricing: React.FC = () => {
    const { user, loading } = useUser();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    const isCanceled = searchParams.get('canceled') === '1';
    const selectedPlan = searchParams.get('plan') as ('monthly' | 'quarterly' | 'yearly' | null);
    const autoStart = searchParams.get('autostart') === '1';

    const isAuthenticated = !!user?.is_authenticated;
    const isPremium = Boolean(user?.effective_premium || user?.is_premium || user?.is_superuser || user?.is_staff);

    const effectivePlan = useMemo(() => {
        if (selectedPlan === 'monthly' || selectedPlan === 'quarterly' || selectedPlan === 'yearly') return selectedPlan;
        return null;
    }, [selectedPlan]);

    const handleSubscribe = async (plan: 'monthly' | 'quarterly' | 'yearly') => {
        if (loading) return;
        setError(null);

        if (!isAuthenticated) {
            // Persist choice in URL so login flow can return here and proceed.
            const next = new URLSearchParams(searchParams);
            next.set('plan', plan);
            next.set('autostart', '1');
            setSearchParams(next, { replace: true });

            navigate('/login', { state: { from: { pathname: '/pricing', search: `?plan=${plan}&autostart=1` } } });
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

    if (loading) return <div className="flex justify-center p-10 text-slate-400">Loading...</div>;

    const yearlyPrice = 35.0;
    const monthlyPrice = 4.99;
    const quarterlyPrice = 12.99;
    const yearlyPerMonth = (yearlyPrice / 12).toFixed(2);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-slate-900 dark:text-slate-100">
            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight font-heading text-white">
                    Invest in your chess
                </h1>
                <p className="mt-3 text-slate-400 font-body">
                    Unlock unlimited training lines, advanced stats, and save your progress across devices.
                </p>
            </div>

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

            <div className="mt-10 grid gap-6 md:grid-cols-3 items-stretch">
                {/* Monthly */}
                <div className="bg-slate-900 p-7 rounded-xl border border-slate-800 flex flex-col h-full shadow-xl shadow-black/30">
                    <h2 className="text-lg font-semibold text-white font-heading">Monthly</h2>
                    <div className="mt-3">
                        <div className="text-4xl font-bold text-white font-heading">
                            ${monthlyPrice.toFixed(2)}
                            <span className="text-base font-normal text-slate-400 font-body">/mo</span>
                        </div>
                        <p className="text-emerald-200 mt-2 text-sm font-semibold font-body">7-day free trial</p>
                    </div>

                    <ul className="mt-6 text-slate-300 space-y-2 text-sm font-body">
                        <li>Unlimited openings</li>
                        <li>Unlimited drills</li>
                        <li>Advanced stats</li>
                    </ul>

                    <div className="mt-auto pt-8">
                        <Button
                            onClick={() => handleSubscribe('monthly')}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-full"
                        >
                            {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                        </Button>
                    </div>
                </div>

                {/* Quarterly */}
                <div className="bg-slate-900 p-7 rounded-xl border border-slate-800 flex flex-col h-full shadow-xl shadow-black/30">
                    <h2 className="text-lg font-semibold text-white font-heading">Quarterly</h2>
                    <div className="mt-3">
                        <div className="text-4xl font-bold text-white font-heading">
                            ${quarterlyPrice.toFixed(2)}
                            <span className="text-base font-normal text-slate-400 font-body"> / 3 months</span>
                        </div>
                        <p className="text-emerald-200 mt-2 text-sm font-semibold font-body">7-day free trial</p>
                    </div>

                    <ul className="mt-6 text-slate-300 space-y-2 text-sm font-body">
                        <li>All Monthly features</li>
                        <li>Better value than monthly</li>
                        <li>Flexible commitment</li>
                    </ul>

                    <div className="mt-auto pt-8">
                        <Button
                            onClick={() => handleSubscribe('quarterly')}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-full"
                        >
                            {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                        </Button>
                    </div>
                </div>

                {/* Yearly */}
                <div className="bg-slate-900 p-7 rounded-xl border border-emerald-500/40 ring-1 ring-emerald-500/15 flex flex-col h-full relative overflow-hidden shadow-2xl shadow-emerald-500/10">
                    <div className="absolute top-0 right-0 bg-emerald-500 text-xs px-3 py-1 rounded-bl-xl text-white font-semibold font-heading">
                        Best Value
                    </div>
                    <h2 className="text-lg font-semibold text-white font-heading">Yearly</h2>
                    <div className="mt-3">
                        <div className="text-4xl font-bold text-white font-heading">${yearlyPerMonth}/mo</div>
                        <div className="text-sm text-slate-400 font-body">${yearlyPrice.toFixed(2)} billed yearly</div>
                        <p className="text-emerald-200 mt-2 text-sm font-semibold font-body">7-day free trial</p>
                    </div>

                    <ul className="mt-6 text-slate-300 space-y-2 text-sm font-body">
                        <li>All Monthly features</li>
                        <li>Best value for consistent training</li>
                        <li>Priority support</li>
                    </ul>

                    <div className="mt-auto pt-8">
                        <Button
                            onClick={() => handleSubscribe('yearly')}
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-full"
                        >
                            {isPremium ? 'Manage Subscription' : 'Start Free Trial'}
                        </Button>
                    </div>
                </div>
            </div>

            {isPremium && (
                <div className="mt-8 text-center text-slate-400">
                    You are already subscribed.{" "}
                    <button
                        onClick={() => navigate('/subscription')}
                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-body"
                    >
                        Manage your subscription
                    </button>
                    .
                </div>
            )}
        </div>
    );
};
