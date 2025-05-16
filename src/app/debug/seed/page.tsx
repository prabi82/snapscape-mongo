'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SeedAchievementsPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const seedAchievements = async () => {
    if (!session?.user) {
      alert('You must be logged in to seed achievements');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/seed-achievements', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert('Achievement data seeded successfully! Go to your profile to see your achievements.');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error seeding achievements:', error);
      setResult({ success: false, message: 'An error occurred' });
      alert('Error seeding achievements. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const viewAchievements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/achievements');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setResult({ success: false, message: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug - Seed Achievements</h1>
      
      <div className="flex gap-4 mb-8">
        <button 
          onClick={seedAchievements}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Seed My Achievements'}
        </button>
        
        <button 
          onClick={viewAchievements}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded font-medium hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'View Debug Data'}
        </button>
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