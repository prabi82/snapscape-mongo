'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ResetSessionPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Resetting your session...');

  useEffect(() => {
    // Clear cookies manually
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    // Force a signout
    const resetSession = async () => {
      try {
        setMessage('Signing out...');
        await signOut({ redirect: false });
        
        // Small delay to ensure everything is cleared
        setTimeout(() => {
          setMessage('Redirecting to login...');
          // Redirect to home page with a refresh flag
          router.push('/?refresh=true');
        }, 1000);
      } catch (error) {
        console.error('Error during session reset:', error);
        setMessage('Error resetting session. Please try manually logging out and back in.');
      }
    };

    resetSession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-[#e6f0f3] to-[#1a4d5c]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Session Reset</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
          
          <div className="mt-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            If you are not redirected automatically, please{' '}
            <a href="/" className="text-blue-600 hover:text-blue-800">click here</a> to go to the login page.
          </p>
        </div>
      </div>
    </div>
  );
} 