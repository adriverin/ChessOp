import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export const LoginPage = () => {
    const { login } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Fallback to home if no state
    const from = location.state?.from?.pathname || '/';
    
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
            
            // If inside a modal (backgroundLocation exists), we can navigate back
            // or if specific 'from' was set, go there.
            if (location.state?.from) {
                navigate(from, { replace: true });
            } else {
                // If opened voluntarily, just close modal (go back)
                // If it was a full page load (rare now), go home/dashboard
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
        <div className="bg-white p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Log In</h2>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email or Username</label>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-gray-900"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
                    <input 
                        type="password" 
                        className="w-full bg-white border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-gray-900"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Logging in...' : 'Log In'}
                </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
                Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline" state={location.state}>Sign up</Link>
            </div>
        </div>
    );
};
