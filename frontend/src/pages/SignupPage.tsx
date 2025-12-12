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
            // Close modal/redirect logic similar to login
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
        <div className="bg-white p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sign Up</h2>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
                    <input 
                        type="email" 
                        className="w-full bg-white border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-gray-900"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
                        minLength={10}
                    />
                    <p className="text-xs text-gray-500 mt-1">Min. 10 characters</p>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
                    <input 
                        type="password" 
                        className="w-full bg-white border border-gray-300 rounded p-2 focus:border-blue-500 focus:outline-none text-gray-900"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-blue-600 hover:underline" state={location.state}>Log in</Link>
            </div>
        </div>
    );
};
