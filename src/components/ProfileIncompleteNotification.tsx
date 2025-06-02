'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  country?: string;
  provider?: string;
}

export default function ProfileIncompleteNotification() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setUser(data.user);
      
      // Check if profile is incomplete (missing mobile or country) AND user signed up with Google
      const isMissingMobile = !data.user.mobile || data.user.mobile.trim() === '';
      const isMissingCountry = !data.user.country || data.user.country.trim() === '' || data.user.country === 'Select Country';
      const isGoogleUser = data.user.provider === 'google';
      
      // Only show notification for Google users with incomplete profiles
      setIsProfileIncomplete(isGoogleUser && (isMissingMobile || isMissingCountry));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Don't render anything if loading, not authenticated, profile is complete, or user dismissed
  if (loading || status !== 'authenticated' || !isProfileIncomplete || !isVisible) {
    return null;
  }

  const missingFields: string[] = [];
  if (!user?.mobile || user.mobile.trim() === '') {
    missingFields.push('mobile number');
  }
  if (!user?.country || user.country.trim() === '' || user.country === 'Select Country') {
    missingFields.push('country');
  }

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-yellow-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Profile Incomplete:</span>{' '}
              Please add your {missingFields.join(' and ')} to complete your profile and enhance your SnapScape experience.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/dashboard/edit-profile"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
          >
            Complete Profile
          </Link>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center w-6 h-6 text-yellow-400 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 