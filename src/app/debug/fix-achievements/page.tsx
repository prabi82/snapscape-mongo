'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function FixAchievementsContent() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const searchParams = useSearchParams();

  const rebuildIndexes = async () => {
    try {
      setLoading('rebuild');
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/debug/rebuild-indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to rebuild indexes');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const syncResults = async () => {
    try {
      setLoading('sync');
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/debug/sync-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sync results');
      }
      
      setResult(data);
      
      // After syncing, fetch the achievements to see the counts
      fetchAchievements();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  const fetchAchievements = async () => {
    try {
      setLoading('achievements');
      setError(null);
      
      // Add cache-busting parameter to ensure we get fresh data
      const response = await fetch('/api/users/achievements?nocache=' + new Date().getTime());
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch achievements');
      }
      
      setAchievements(data.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(null);
    }
  };

  // Check for autoRefresh param when the component mounts
  useEffect(() => {
    if (searchParams.has('autoRefresh')) {
      setAutoRefresh(true);
    }
  }, [searchParams]);

  // Set up auto-refresh when enabled
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      // Refresh every 3 seconds when auto-refresh is enabled
      intervalId = setInterval(fetchAchievements, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);

  // Initial fetch of achievements
  useEffect(() => {
    fetchAchievements();
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Achievement Fixes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Step 1: Rebuild Indexes</h2>
          <p className="text-gray-600 mb-3">
            Update database indexes to allow multiple achievements per competition
          </p>
          <button 
            onClick={rebuildIndexes}
            disabled={loading !== null}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading === 'rebuild' ? 'Rebuilding...' : 'Rebuild Indexes'}
          </button>
        </div>
        
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Step 2: Sync Achievements</h2>
          <p className="text-gray-600 mb-3">
            Recreate achievement records for all your competitions
          </p>
          <button 
            onClick={syncResults}
            disabled={loading !== null}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading === 'sync' ? 'Syncing...' : 'Sync Achievements'}
          </button>
        </div>
        
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Step 3: Check Achievements</h2>
          <p className="text-gray-600 mb-3">
            View your current achievement counts
          </p>
          <div className="flex gap-2 mb-3">
            <button 
              onClick={fetchAchievements}
              disabled={loading !== null}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              {loading === 'achievements' ? 'Loading...' : 'Check Achievements'}
            </button>
            
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded-md ${autoRefresh ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh (updates every 3 seconds)'}
            >
              {autoRefresh ? '⟳ ON' : '⟳ OFF'}
            </button>
          </div>
          
          {achievements && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-amber-100 rounded-md">
                <div className="text-amber-700 font-bold text-xl">{achievements.stats.firstPlace}</div>
                <div className="text-amber-600 text-sm">1st Place</div>
              </div>
              <div className="p-2 bg-slate-100 rounded-md">
                <div className="text-slate-700 font-bold text-xl">{achievements.stats.secondPlace}</div>
                <div className="text-slate-600 text-sm">2nd Place</div>
              </div>
              <div className="p-2 bg-orange-100 rounded-md">
                <div className="text-orange-700 font-bold text-xl">{achievements.stats.thirdPlace}</div>
                <div className="text-orange-600 text-sm">3rd Place</div>
              </div>
            </div>
          )}
          
          {autoRefresh && (
            <div className="mt-2 text-xs text-blue-600 animate-pulse text-center">
              Auto-refreshing achievement counts...
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Step 4: View Profile</h2>
          <p className="text-gray-600 mb-3">
            Check if achievements are displaying correctly
          </p>
          <Link href="/dashboard/profile" className="block w-full text-center bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600">
            Go to Profile
          </Link>
        </div>
      </div>
      
      <div className="mt-6 border rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Fix Specific Competitions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/debug/check-munroe-island" className="block text-center bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600">
            Fix Munroe Island Achievements
          </Link>
          <button 
            onClick={fetchAchievements}
            className="bg-blue-400 text-white py-2 px-4 rounded-md hover:bg-blue-500 disabled:opacity-50"
          >
            Refresh Achievement Counts
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <h3 className="font-bold">Success</h3>
            <p>{result.message}</p>
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md border">
            <h3 className="font-semibold mb-2">Result Details:</h3>
            <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Achievement Fixes</h1>
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

export default function FixAchievementsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FixAchievementsContent />
    </Suspense>
  );
} 