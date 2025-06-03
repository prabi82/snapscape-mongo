'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function NotificationFixPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/');
    return <div>Redirecting...</div>;
  }

  const runDiagnosis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/user-notification-status');
      const data = await response.json();
      setDiagnosis(data);
    } catch (error) {
      console.error('Error running diagnosis:', error);
      setDiagnosis({ success: false, error: 'Failed to run diagnosis' });
    }
    setIsLoading(false);
  };

  const runFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/fix-notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setFixResult(data);
      
      // Re-run diagnosis to show updated numbers
      if (data.success) {
        setTimeout(() => runDiagnosis(), 1000);
      }
    } catch (error) {
      console.error('Error running fix:', error);
      setFixResult({ success: false, error: 'Failed to run fix' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Notification Preferences Debug Tool</h1>
            <p className="mt-1 text-sm text-gray-600">
              Diagnose and fix notification preference issues for users
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Diagnosis Section */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-4">
                🔍 Step 1: Diagnose the Problem
              </h2>
              <p className="text-blue-700 mb-4">
                Check how many users have notification preferences set and identify the issue.
              </p>
              
              <button
                onClick={runDiagnosis}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Running Diagnosis...' : 'Run Diagnosis'}
              </button>

              {diagnosis && (
                <div className="mt-4 bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Diagnosis Results:</h3>
                  {diagnosis.success ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Total Users:</strong> {diagnosis.analysis.totalUsers}</p>
                      <p><strong>Active & Verified Users:</strong> {diagnosis.analysis.activeAndVerified}</p>
                      <p><strong>Currently Qualified for Notifications:</strong> {diagnosis.analysis.qualifiedForNotifications}</p>
                      <p><strong>Users with newCompetitions = true:</strong> {diagnosis.analysis.newCompetitionOptIns.explicitlyTrue}</p>
                      <p><strong>Users with newCompetitions = false:</strong> {diagnosis.analysis.newCompetitionOptIns.explicitlyFalse}</p>
                      <p><strong>Users with undefined preferences:</strong> {diagnosis.analysis.newCompetitionOptIns.undefined}</p>
                      
                      <div className="mt-4 p-3 bg-yellow-100 rounded">
                        <p className="text-yellow-800">
                          <strong>Issue:</strong> {diagnosis.analysis.newCompetitionOptIns.undefined} users are missing notification preferences.
                          They should be receiving notifications but aren't.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">Error: {diagnosis.error || diagnosis.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Fix Section */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-4">
                🛠️ Step 2: Apply the Fix
              </h2>
              <p className="text-green-700 mb-4">
                Set default notification preferences for users who don't have them configured.
                This will enable notifications for users who are missing the preferences.
              </p>
              
              <button
                onClick={runFix}
                disabled={isLoading || !diagnosis?.success}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Applying Fix...' : 'Apply Fix'}
              </button>

              {!diagnosis?.success && (
                <p className="text-sm text-gray-600 mt-2">
                  Run diagnosis first to enable the fix button.
                </p>
              )}

              {fixResult && (
                <div className="mt-4 bg-white rounded-lg p-4 border">
                  <h3 className="font-semibold mb-2">Fix Results:</h3>
                  {fixResult.success ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-green-600 font-semibold">✅ Fix applied successfully!</p>
                      <p><strong>Users Updated:</strong> {fixResult.updateResult.modifiedCount}</p>
                      <p><strong>Users Now Qualified for Notifications:</strong> {fixResult.qualifiedUsersAfterUpdate}</p>
                      
                      <div className="mt-4 p-3 bg-green-100 rounded">
                        <p className="text-green-800">
                          🎉 <strong>Success!</strong> Notification recipients increased from 8 to {fixResult.qualifiedUsersAfterUpdate} users!
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600">Error: {fixResult.error || fixResult.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📝 What This Tool Does
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Problem:</strong> Users created before notification preferences were added don't have the field populated in the database.</p>
                <p><strong>Solution:</strong> This tool sets the default notification preferences for users missing them.</p>
                <p><strong>Safety:</strong> Only updates users with missing preferences - won't change users who explicitly opted out.</p>
                <p><strong>Expected Result:</strong> All active & verified users will receive new competition notifications.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 