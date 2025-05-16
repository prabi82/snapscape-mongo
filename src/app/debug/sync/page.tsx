'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function SyncAchievementsPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const syncAchievements = async () => {
    if (!session?.user) {
      alert('You must be logged in to sync achievements');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/sync-results', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`Success! Synchronized ${data.data.results.length} achievement records. Go to your profile to see your achievements.`);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error syncing achievements:', error);
      setResult({ success: false, message: 'An error occurred' });
      alert('Error syncing achievements. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/achievements');
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        const stats = data.data?.stats;
        alert(`You have: ${stats.firstPlace} first places, ${stats.secondPlace} second places, ${stats.thirdPlace} third places.`);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setResult({ success: false, message: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sync Achievements</h1>
      <p className="mb-6 text-gray-700">
        This tool will synchronize your competition results with your achievements.
        It will look at all competitions you've participated in and create achievement records
        for your top 3 placements.
      </p>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={syncAchievements}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Sync My Achievements'}
        </button>
        
        <button 
          onClick={checkAchievements}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Check My Achievements'}
        </button>
        
        <Link href="/dashboard/profile">
          <button className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700">
            Go to Profile
          </button>
        </Link>
      </div>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Response:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 