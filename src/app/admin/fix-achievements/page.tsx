'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Define extended user type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Define extended session type
interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

export default function FixAchievementsPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [step1Complete, setStep1Complete] = useState(false);
  const [step2Complete, setStep2Complete] = useState(false);
  const [step3Complete, setStep3Complete] = useState(false);
  const [userId, setUserId] = useState('');
  const [userSyncLoading, setUserSyncLoading] = useState(false);
  const [userSyncMessage, setUserSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Check if user is admin
  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
        <p className="mb-4">You need administrator access to use this page.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const fixIndexes = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/debug/fix-indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Database indexes fixed successfully' });
        setStep1Complete(true);
      } else {
        throw new Error(data.message || 'Failed to fix database indexes');
      }
    } catch (error: any) {
      console.error('Error fixing indexes:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };
  
  const fixAllAchievements = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/debug/fix-all-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'All achievements fixed successfully' });
        setStep2Complete(true);
      } else {
        throw new Error(data.message || 'Failed to fix all achievements');
      }
    } catch (error: any) {
      console.error('Error fixing all achievements:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const fixUserAchievements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setUserSyncMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setUserSyncLoading(true);
    setUserSyncMessage(null);
    try {
      const response = await fetch(`/api/debug/sync-results?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUserSyncMessage({ type: 'success', text: `Achievements fixed for user ${userId}. Found ${data.data?.totalResults || 0} achievements.` });
      } else {
        throw new Error(data.message || 'Failed to fix achievements for this user');
      }
    } catch (error: any) {
      console.error('Error fixing user achievements:', error);
      setUserSyncMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setUserSyncLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Fix Competition Achievements</h1>
      <p className="text-gray-600 mb-6">
        Use this page to fix any issues with competition achievements
      </p>
      
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Step-by-step Fix</h2>
          <p className="mt-1 text-sm text-gray-500">
            Follow these steps in order to fix achievement-related issues
          </p>
        </div>
        
        <div className="p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Step 1: Fix Database Indexes</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will ensure the database has the correct indexes for achievements to work properly.
            </p>
            <button
              onClick={fixIndexes}
              disabled={loading || step1Complete}
              className={`px-4 py-2 rounded-md text-white ${
                step1Complete 
                  ? 'bg-green-500 cursor-not-allowed' 
                  : loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && !step1Complete ? 'Processing...' : step1Complete ? 'Completed' : 'Fix Indexes'}
            </button>
            {step1Complete && (
              <span className="ml-3 text-green-600">✓ Index fix complete</span>
            )}
          </div>
          
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Step 2: Rebuild All Achievements</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will delete and rebuild all achievement records for all users. This operation might take a while.
            </p>
            <button
              onClick={fixAllAchievements}
              disabled={loading || !step1Complete || step2Complete}
              className={`px-4 py-2 rounded-md text-white ${
                !step1Complete || step2Complete
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && step1Complete ? 'Processing...' : step2Complete ? 'Completed' : 'Rebuild All Achievements'}
            </button>
            {step2Complete && (
              <span className="ml-3 text-green-600">✓ All achievements rebuilt</span>
            )}
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Step 3: Fix Achievements for a Specific User</h3>
            <p className="text-sm text-gray-500 mb-4">
              If you need to fix achievements for a specific user, enter their user ID below.
            </p>
            
            <form onSubmit={fixUserAchievements} className="mb-4">
              <div className="flex items-start space-x-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  disabled={userSyncLoading || !userId.trim()}
                  className={`px-4 py-2 rounded-md text-white ${
                    !userId.trim()
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : userSyncLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {userSyncLoading ? 'Processing...' : 'Fix User Achievements'}
                </button>
              </div>
              
              {userSyncMessage && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${userSyncMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {userSyncMessage.text}
                </div>
              )}
            </form>
          </div>
          
          <div className="mt-8">
            <h3 className="font-medium text-gray-900 mb-4">Additional Tools:</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/debug-rankings">
                <button className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50">
                  Debug Rankings Tool
                </button>
              </Link>
              <Link href="/admin">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Back to Admin Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 