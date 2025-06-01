'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    id?: string;
  };
  expires: string;
}

interface CompetitionNeedingUpdate {
  id: string;
  title: string;
  currentStatus: string;
  expectedStatus: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
}

interface StatusUpdateResult {
  competitionId: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  success: boolean;
  message: string;
}

export default function CompetitionStatusPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [competitionsNeedingUpdate, setCompetitionsNeedingUpdate] = useState<CompetitionNeedingUpdate[]>([]);
  const [lastUpdateResults, setLastUpdateResults] = useState<StatusUpdateResult[]>([]);
  const [bypassManualOverride, setBypassManualOverride] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchPreview();
    }
  }, [session]);

  const fetchPreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await fetch('/api/cron/update-competition-statuses', {
        method: 'PUT'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompetitionsNeedingUpdate(data.competitions || []);
      } else {
        console.error('Failed to fetch preview');
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const runManualUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cron/update-competition-statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bypassManualOverride
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastUpdateResults(data.results.updates || []);
        // Refresh preview after update
        await fetchPreview();
      } else {
        console.error('Failed to run manual update');
      }
    } catch (error) {
      console.error('Error running manual update:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session?.user || session.user.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Competition Status Management
            </h1>
            
            {/* Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                🤖 Automatic Status Updates
              </h2>
              <p className="text-blue-700 mb-2">
                Competition statuses are automatically updated based on the dates and times set for each competition:
              </p>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li><strong>Upcoming</strong> → <strong>Active</strong>: When current time reaches the start date</li>
                <li><strong>Active</strong> → <strong>Voting</strong>: When current time reaches the submission end date</li>
                <li><strong>Voting</strong> → <strong>Completed</strong>: When current time reaches the voting end date</li>
              </ul>
              <p className="text-blue-700 mt-2">
                <strong>Note:</strong> Competitions with "Manual Status Override" enabled will not be automatically updated.
              </p>
            </div>

            {/* Preview Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Competitions Needing Status Updates
                </h2>
                <button
                  onClick={fetchPreview}
                  disabled={previewLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {previewLoading ? 'Refreshing...' : 'Refresh Preview'}
                </button>
              </div>
              
              {competitionsNeedingUpdate.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700">
                    ✅ All competitions have the correct status based on their dates.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-yellow-100 border-b border-yellow-200">
                    <p className="text-yellow-800 font-medium">
                      {competitionsNeedingUpdate.length} competition(s) need status updates:
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-yellow-200">
                      <thead className="bg-yellow-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                            Competition
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                            Current Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                            Expected Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-yellow-800 uppercase tracking-wider">
                            Dates
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-yellow-50 divide-y divide-yellow-200">
                        {competitionsNeedingUpdate.map((comp) => (
                          <tr key={comp.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {comp.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {comp.currentStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                {comp.expectedStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                              <div>Start: {new Date(comp.startDate).toLocaleString()}</div>
                              <div>End: {new Date(comp.endDate).toLocaleString()}</div>
                              <div>Voting End: {new Date(comp.votingEndDate).toLocaleString()}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Update Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Manual Status Update
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="bypassManualOverride"
                      type="checkbox"
                      checked={bypassManualOverride}
                      onChange={(e) => setBypassManualOverride(e.target.checked)}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="bypassManualOverride" className="font-medium text-gray-700">
                      Bypass Manual Override
                    </label>
                    <p className="text-gray-500">
                      When enabled, this will update ALL competitions, even those with manual status override enabled.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={runManualUpdate}
                  disabled={loading}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Updating Statuses...' : 'Run Manual Status Update'}
                </button>
              </div>
            </div>

            {/* Last Update Results */}
            {lastUpdateResults.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Last Update Results
                </h2>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Competition
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status Change
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Result
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lastUpdateResults.map((result, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.oldStatus} → {result.newStatus}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                result.success 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {result.success ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {result.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Cron Job Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                🕒 Automatic Cron Job
              </h2>
              <p className="text-gray-700 mb-2">
                For production deployment, set up a cron job to automatically run status updates:
              </p>
              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                # Run every 5 minutes<br/>
                */5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://snapscape.app/api/cron/update-competition-statuses
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Set the CRON_SECRET environment variable for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 