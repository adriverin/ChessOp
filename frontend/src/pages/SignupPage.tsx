import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';

export const SignupPage = () => {
    const { signup } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await signup({ email, password, confirmPassword });
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl shadow-black/40 text-slate-100">
            <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-200">Sign Up</h2>
            {error && <div className="mb-4 p-3 bg-rose-500/20 text-rose-100 rounded border border-rose-400/30">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-200">Email</label>
                    <input
                        type="email"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 focus:border-indigo-500 focus:outline-none text-white placeholder:text-slate-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
                        minLength={10}
                    />
                    <p className="text-xs text-slate-500 mt-1">Min. 10 characters</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-200">Confirm Password</label>
                    <input
                        type="password"
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 focus:border-indigo-500 focus:outline-none text-white placeholder:text-slate-500"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-full transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/40"
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-400">
                Already have an account? <Link to="/login" className="text-indigo-200 hover:underline" state={location.state}>Login</Link>
            </div>
        </div>
    );
};
