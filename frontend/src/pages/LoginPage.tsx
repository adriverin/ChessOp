import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export const LoginPage = () => {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    // Fallback to home if no state
    const fromState = location.state?.from;
    const from =
        (fromState?.pathname || '/') +
        (fromState?.search || '') +
        (fromState?.hash || '');

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ identifier, password });

            if (location.state?.from) {
                navigate(from, { replace: true });
            } else {
                if (window.history.length > 1) {
                    navigate(-1);
                } else {
                    navigate('/');
                }
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                setError("Too many attempts, try again later.");
            } else {
                setError(err.response?.data?.error || "Invalid username/email or password.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl shadow-black/40 text-slate-100">
            <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-200">Log In</h2>
            {error && <div className="mb-4 p-3 bg-rose-500/20 text-rose-100 rounded border border-rose-400/30">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-200">Email or Username</label>
                    <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 focus:border-indigo-500 focus:outline-none text-white placeholder:text-slate-500"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-200">Password</label>
                    <input
                        type="password"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 focus:border-indigo-500 focus:outline-none text-white placeholder:text-slate-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/40"
                >
                    {isLoading ? 'Logging in...' : 'Log In'}
                </button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-400">
                Don't have an account? <Link to="/signup" className="text-indigo-200 hover:underline" state={location.state}>Signup</Link>
            </div>
        </div>
    );
};
