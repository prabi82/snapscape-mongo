'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface RoleSelectorProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onRoleSelect: (role: 'user' | 'judge') => void;
}

export default function RoleSelector({ user, onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<'user' | 'judge' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleRoleSelect = async (role: 'user' | 'judge') => {
    setSelectedRole(role);
    setIsConfirming(true);

    // Store role preference in localStorage for future sessions
    localStorage.setItem('preferredRole', role);
    
    // Call the parent callback
    setTimeout(() => {
      onRoleSelect(role);
    }, 500);
  };

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6f0f3] to-[#fffbe6] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-2 border-[#e0c36a]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2699a6] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#1a4d5c] mb-2">
            Setting up your {selectedRole === 'judge' ? 'Judge' : 'User'} dashboard...
          </h2>
          <p className="text-[#2699a6]">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6f0f3] to-[#fffbe6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full border-2 border-[#e0c36a]">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="SnapScape Logo" className="w-20 h-20 rounded-full border-4 border-[#e0c36a] shadow bg-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a4d5c] mb-2">Welcome back!</h1>
          
          {/* User Info */}
          <div className="flex items-center justify-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-[#e0c36a]/20 flex items-center justify-center border-2 border-[#e0c36a]">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-[#1a4d5c] font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>
            <div className="ml-3 text-left">
              <p className="text-base font-semibold text-[#1a4d5c]">
                {user.name}
              </p>
              <p className="text-sm text-[#2699a6]">
                {user.email}
              </p>
            </div>
          </div>
          
          <p className="text-[#2699a6] mb-6">
            You have judge privileges. How would you like to use SnapScape today?
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-4">
          
          {/* User Mode */}
          <button
            onClick={() => handleRoleSelect('user')}
            className="w-full p-6 border-2 border-[#e0c36a] rounded-xl hover:bg-[#fffbe6] transition-all duration-200 text-left group hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-[#1a4d5c] mb-1">Login as User</h3>
                <p className="text-sm text-[#2699a6]">
                  Participate in competitions, submit photos, view feeds, and engage with the community
                </p>
              </div>
            </div>
          </button>

          {/* Judge Mode */}
          <button
            onClick={() => handleRoleSelect('judge')}
            className="w-full p-6 border-2 border-[#e0c36a] rounded-xl hover:bg-[#fffbe6] transition-all duration-200 text-left group hover:shadow-lg"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-[#1a4d5c] mb-1">Login as Judge</h3>
                <p className="text-sm text-[#2699a6]">
                  Review submissions, evaluate competitions, manage judging responsibilities
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            You can always log out and select a different role if needed
          </p>
        </div>
      </div>
    </div>
  );
} 