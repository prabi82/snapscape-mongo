'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { Session } from 'next-auth';

// Extend the Session type to include our custom user properties
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

interface CleanupResult {
  success: boolean;
  message: string;
  stats?: {
    ratingsBefore: number;
    orphanedRatingsRemoved: number;
    duplicateRatingsRemoved: number;
    ratingsAfter: number;
    affectedUsers: string[];
    totalRatingsRemoved: number;
    affectedPhotoCount: number;
  };
}

export default function CleanupVotesPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin';

  // Redirect if not admin
  React.useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard');
    }
  }, [status, isAdmin, router]);

  // Handle cleanup
  const handleCleanup = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/cleanup-votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('An error occurred while cleaning up votes. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If loading session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // If not admin or not authenticated
  if (status === 'authenticated' && !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Head>
        <title>Cleanup Votes - Admin</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Cleanup Votes</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Vote Cleanup Tool</h2>
        <p className="mb-4">
          This tool will clean up the following issues in the rating system:
        </p>
        <ul className="list-disc pl-6 mb-6">
          <li>Remove ratings for photos that no longer exist (orphaned ratings)</li>
          <li>Delete duplicate ratings (only keep one rating per user per photo)</li>
          <li>Recalculate photo rating averages and counts for affected photos</li>
        </ul>
        
        <div className="flex justify-center">
          <button
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isLoading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleCleanup}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                Processing...
              </>
            ) : (
              'Start Cleanup Process'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className={`border-l-4 p-4 mb-6 ${
          result.success ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700'
        }`}>
          <h3 className="font-bold text-lg mb-2">
            {result.success ? 'Cleanup Successful' : 'Cleanup Failed'}
          </h3>
          <p className="mb-2">{result.message}</p>
          
          {result.stats && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Results:</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Ratings Before</p>
                  <p className="text-xl font-bold">{result.stats.ratingsBefore}</p>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Ratings After</p>
                  <p className="text-xl font-bold">{result.stats.ratingsAfter}</p>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Orphaned Ratings Removed</p>
                  <p className="text-xl font-bold">{result.stats.orphanedRatingsRemoved}</p>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Duplicate Ratings Removed</p>
                  <p className="text-xl font-bold">{result.stats.duplicateRatingsRemoved}</p>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Total Ratings Removed</p>
                  <p className="text-xl font-bold">{result.stats.totalRatingsRemoved}</p>
                </div>
                <div className="bg-white p-3 rounded shadow">
                  <p className="text-sm text-gray-600">Photos Affected</p>
                  <p className="text-xl font-bold">{result.stats.affectedPhotoCount}</p>
                </div>
              </div>
              
              {result.stats.affectedUsers.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Affected Users:</h4>
                  <div className="bg-white p-3 rounded shadow overflow-auto max-h-40">
                    <ul className="list-disc pl-6">
                      {result.stats.affectedUsers.map((userId, index) => (
                        <li key={index}>{userId}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 