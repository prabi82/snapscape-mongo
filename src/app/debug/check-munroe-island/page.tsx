'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckMunroeIslandPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const router = useRouter();

  const checkMunroeIsland = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      
      const response = await fetch('/api/debug/fix-munroe');
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to check Munroe Island data');
      }
      
      setData(responseData.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fixMunroeIsland = async () => {
    try {
      setLoading(true);
      setError(null);
      setFixResult(null);
      
      const response = await fetch('/api/debug/fix-munroe', {
        method: 'POST',
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fix Munroe Island achievements');
      }
      
      setFixResult(responseData);
      
      // Refresh the data
      await checkMunroeIsland(); 
      
      // Also refresh the achievements data for the main achievements page
      try {
        await fetch('/api/users/achievements?nocache=' + new Date().getTime());
        
        // After a short delay, redirect back to the fix-achievements page with auto-refresh
        setTimeout(() => {
          router.push('/debug/fix-achievements?autoRefresh=true');
        }, 2000);
      } catch (e) {
        console.error('Failed to refresh achievements data', e);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Munroe Island Achievement Fix</h1>
      <p className="mb-4 text-gray-600">This page is for fixing specifically the 3rd place achievement for Munroe Island competition.</p>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={checkMunroeIsland}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Check Munroe Island Data'}
        </button>
        
        <button 
          onClick={fixMunroeIsland}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Fixing...' : 'Fix Munroe Island Achievements'}
        </button>
        
        <Link href="/debug/fix-achievements" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Back to Achievement Fixes
        </Link>
      </div>
      
      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {fixResult && (
        <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h3 className="font-bold">Success</h3>
          <p>{fixResult.message}</p>
          <div className="mt-2 grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-amber-100 rounded-md">
              <div className="text-amber-700 font-bold text-xl">{fixResult.data?.stats?.firstPlace}</div>
              <div className="text-amber-600 text-sm">1st Place</div>
            </div>
            <div className="p-2 bg-slate-100 rounded-md">
              <div className="text-slate-700 font-bold text-xl">{fixResult.data?.stats?.secondPlace}</div>
              <div className="text-slate-600 text-sm">2nd Place</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-md">
              <div className="text-orange-700 font-bold text-xl">{fixResult.data?.stats?.thirdPlace}</div>
              <div className="text-orange-600 text-sm">3rd Place</div>
            </div>
            <div className="p-2 bg-blue-100 rounded-md">
              <div className="text-blue-700 font-bold text-xl">{fixResult.data?.stats?.total}</div>
              <div className="text-blue-600 text-sm">Total</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-center text-blue-600">
            Redirecting to achievements page in 2 seconds...
          </p>
        </div>
      )}
      
      {data && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Munroe Island Data</h2>
          <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded mt-4">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 