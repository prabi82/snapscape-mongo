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

export default function FixAllAchievementsPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runGlobalFix = async () => {
    if (!confirm("This will rebuild achievements for ALL users. It may take some time to complete. Continue?")) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/debug/fix-all-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fix achievements');
      }
      
      setResult(data);
    } catch (error: any) {
      console.error('Error fixing achievements:', error);
      setError(error.message || 'An error occurred while fixing achievements');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Fix All User Achievements</h1>
      <p className="text-gray-600 mb-6">
        This tool will fix achievements for ALL users in the system. It rebuilds the database indexes and regenerates all achievement records.
      </p>
      
      <div className="flex flex-col gap-4 mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> This operation will delete and rebuild ALL achievement records for ALL users. 
                Only run this during low traffic periods.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={runGlobalFix}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing... This may take a few minutes
            </span>
          ) : (
            "Fix All User Achievements"
          )}
        </button>
        
        <Link href="/admin">
          <button className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-md hover:bg-gray-300 transition">
            Return to Admin Dashboard
          </button>
        </Link>
      </div>
      
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Results:</h2>
          
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{result.data.totalUsers}</div>
              <div className="text-sm text-blue-700">Total Users</div>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{result.data.totalResults}</div>
              <div className="text-sm text-indigo-700">Total Achievements</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{result.data.firstPlace}</div>
              <div className="text-sm text-yellow-700">First Place</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{result.data.secondPlace}</div>
              <div className="text-sm text-gray-700">Second Place</div>
            </div>
          </div>
          
          <div className="overflow-auto p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Detailed Results</h3>
            <pre className="text-xs overflow-auto max-h-96 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 