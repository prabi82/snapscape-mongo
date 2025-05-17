'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { JWT } from 'next-auth/jwt';

export default function DebugTokenPage() {
  const { data: session, status } = useSession();
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTokenData() {
      try {
        const response = await fetch('/api/auth/token');
        if (!response.ok) {
          throw new Error('Failed to fetch token data');
        }
        const data = await response.json();
        setTokenData(data);
      } catch (err) {
        console.error('Error fetching token:', err);
        setError('Error fetching token data');
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchTokenData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('You must be logged in to view token information');
    }
  }, [status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 max-w-4xl w-full bg-white rounded-lg shadow-lg">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-center mt-4">Loading token information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 max-w-4xl w-full bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p>{error}</p>
          <div className="mt-6">
            <a href="/" className="text-blue-600 hover:underline">Go to login page</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="p-6 max-w-4xl w-full bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Session & Token Debug</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Session Information</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap">{JSON.stringify(session, null, 2)}</pre>
          </div>
        </div>
        
        {tokenData && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Token Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap">{JSON.stringify(tokenData, null, 2)}</pre>
            </div>
            
            <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Role Information</h3>
              <p><strong>Role in token:</strong> {tokenData.role || 'No role found'}</p>
              <p><strong>Is admin:</strong> {tokenData.role === 'admin' ? 'Yes ✅' : 'No ❌'}</p>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex space-x-4">
          <a 
            href="/dashboard" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </a>
          <a 
            href="/admin/dashboard" 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Go to Admin Dashboard
          </a>
          <a 
            href="/auth/reset-session" 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reset Session
          </a>
        </div>
        
        <div className="mt-4">
          <a 
            href="/api/auth/middleware-check" 
            target="_blank"
            className="text-sm text-blue-600 hover:underline"
          >
            Check Middleware Configuration
          </a>
        </div>
      </div>
    </div>
  );
} 