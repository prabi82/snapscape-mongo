'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RoleSelector from '@/components/RoleSelector';

export default function RoleSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Redirect if not a judge
    if (status === 'authenticated' && (session?.user as any)?.role !== 'judge') {
      router.push('/dashboard');
      return;
    }

    // Check if user already has a role preference
    const preferredRole = localStorage.getItem('preferredRole');
    if (preferredRole && (preferredRole === 'user' || preferredRole === 'judge')) {
      handleRoleSelect(preferredRole as 'user' | 'judge');
      return;
    }

    setIsLoading(false);
  }, [session, status, router]);

  const handleRoleSelect = (role: 'user' | 'judge') => {
    // Store the selected role
    localStorage.setItem('selectedRole', role);
    localStorage.setItem('preferredRole', role);

    // Redirect based on role selection
    if (role === 'judge') {
      router.push('/judge');
    } else {
      router.push('/dashboard?viewAsUser=true');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e6f0f3] to-[#fffbe6] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-2 border-[#e0c36a]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2699a6] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#1a4d5c] mb-2">Loading...</h2>
          <p className="text-[#2699a6]">Please wait</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <RoleSelector
      user={session.user}
      onRoleSelect={handleRoleSelect}
    />
  );
} 