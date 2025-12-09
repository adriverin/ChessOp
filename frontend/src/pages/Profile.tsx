import React from 'react';
import { useUser } from '../context/UserContext';
import { User, Mail, Shield, Settings, Crown } from 'lucide-react';

export const Profile: React.FC = () => {
    const { user } = useUser();

    if (!user?.is_authenticated) {
        return <div className="p-10 text-center">Please log in to view your profile.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <User size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chess Master</h2>
                        <p className="text-gray-500">Level {user.level}</p>
                    </div>
                    {user.effective_premium && (
                        <span className="ml-auto px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold flex items-center gap-1">
                            <Crown size={14} /> Premium
                        </span>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Mail size={18} />
                            <span>Email</span>
                        </div>
                        <span className="text-gray-500 font-mono text-sm">user@example.com</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Shield size={18} />
                            <span>Account Type</span>
                        </div>
                        <span className="text-gray-900 font-medium">
                            {user.effective_premium ? 'Premium Member' : 'Free Tier'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings size={20} /> Settings
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Sound Effects</p>
                            <p className="text-sm text-gray-500">Play sounds when moving pieces</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900">Board Coordinates</p>
                            <p className="text-sm text-gray-500">Show ranks and files on the board</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <a 
                    href="/admin/logout/?next=/" 
                    className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline"
                >
                    Sign Out
                </a>
            </div>
        </div>
    );
};

