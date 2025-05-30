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

interface Competition {
  _id: string;
  title: string;
  status: string;
  endDate: string;
}

interface ReminderResult {
  success: boolean;
  message: string;
  data?: {
    totalCompetitions: number;
    totalEmailsSent: number;
    totalNotificationsCreated: number;
    errors: string[];
    competitionResults: any[];
  };
}

export default function CompetitionRemindersPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ReminderResult | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [loadingCompetitions, setLoadingCompetitions] = useState(false);
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState<any>(null);
  const [logsFilter, setLogsFilter] = useState({
    triggerType: '',
    triggerMethod: ''
  });

  // Fetch competitions on component mount
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchCompetitions();
      fetchReminderLogs();
    }
  }, [session]);

  const fetchCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      // Include all relevant statuses for reminder testing
      const response = await fetch('/api/competitions?status=active,upcoming,voting&limit=50');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched competitions for reminders:', data.data);
        setCompetitions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
    } finally {
      setLoadingCompetitions(false);
    }
  };

  const fetchReminderLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (logsFilter.triggerType) {
        params.append('triggerType', logsFilter.triggerType);
      }
      if (logsFilter.triggerMethod) {
        params.append('triggerMethod', logsFilter.triggerMethod);
      }
      
      const response = await fetch(`/api/admin/reminder-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReminderLogs(data.data.logs || []);
        setLogsPagination(data.data.pagination);
        setLogsPage(page);
      } else {
        console.error('Failed to fetch reminder logs - API not available yet');
        // For now, show a message that logs will be available after the first reminder is sent
        setReminderLogs([]);
        setLogsPagination(null);
      }
    } catch (error) {
      console.error('Error fetching reminder logs:', error);
      // For now, show a message that logs will be available after the first reminder is sent
      setReminderLogs([]);
      setLogsPagination(null);
    } finally {
      setLogsLoading(false);
    }
  };

  // Check if user is admin
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  if (session.user.role !== 'admin') {
    router.push('/dashboard');
    return null;
  }

  const triggerReminders = async (type: 'day_before' | 'last_day', isTest: boolean = false, bypassTimeCheck: boolean = false) => {
    setIsLoading(true);
    setResult(null);

    try {
      let url = `/api/cron/competition-reminders?type=${type}`;
      
      // Add bypass parameter if needed
      if (bypassTimeCheck) {
        url += `&bypass=true`;
      }
      
      // Add test email parameter if this is a test
      if (isTest && testEmail.trim()) {
        url += `&testEmail=${encodeURIComponent(testEmail.trim())}`;
        
        // Add competition ID if selected
        if (selectedCompetition) {
          url += `&competitionId=${encodeURIComponent(selectedCompetition)}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Competition Reminder System</h2>
          <p className="mt-1 text-sm text-gray-600">
            Test and manage automated competition reminder emails
          </p>
        </div>

        <div className="p-6">
          {/* Test Email Section */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              🧪 Test Email Functionality
            </h3>
            <p className="text-yellow-700 mb-4">
              Send test reminder emails to a specific email address without affecting all users.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="testEmail" className="block text-sm font-medium text-yellow-800 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  id="testEmail"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email address for testing"
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {testEmail && !isValidEmail(testEmail) && (
                  <p className="text-red-600 text-sm mt-1">Please enter a valid email address</p>
                )}
              </div>

              <div>
                <label htmlFor="competitionSelect" className="block text-sm font-medium text-yellow-800 mb-2">
                  Select Competition (Optional)
                </label>
                <select
                  id="competitionSelect"
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  disabled={loadingCompetitions}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Use Mock Competition (Test Competition)</option>
                  {competitions.length > 0 ? (
                    competitions.map((comp) => (
                      <option key={comp._id} value={comp._id}>
                        {comp.title} ({comp.status.toUpperCase()}) - Ends: {new Date(comp.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </option>
                    ))
                  ) : (
                    !loadingCompetitions && (
                      <option disabled>No active/upcoming competitions found</option>
                    )
                  )}
                </select>
                {loadingCompetitions && (
                  <p className="text-yellow-600 text-sm mt-1">Loading competitions...</p>
                )}
                <p className="text-yellow-600 text-sm mt-1">
                  Leave empty to use a mock competition with midnight end time, or select a real competition.
                  {competitions.length > 0 && (
                    <span className="font-medium"> Found {competitions.length} competition(s).</span>
                  )}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => triggerReminders('day_before', true)}
                  disabled={isLoading || !testEmail.trim() || !isValidEmail(testEmail)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Test Day Before Email'}
                </button>
                
                <button
                  onClick={() => triggerReminders('last_day', true)}
                  disabled={isLoading || !testEmail.trim() || !isValidEmail(testEmail)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Test Last Day Email'}
                </button>
              </div>
            </div>
          </div>

          {/* Production Section */}
          <div className="border border-red-200 bg-red-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-3">
              🚨 Production Reminders
            </h3>
            <p className="text-red-700 mb-4">
              <strong>WARNING:</strong> These buttons will send emails to ALL registered users. Use with caution!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => triggerReminders('day_before', false)}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Send Day Before Reminders to ALL USERS'}
              </button>
              
              <button
                onClick={() => triggerReminders('last_day', false)}
                disabled={isLoading}
                className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'Send Last Day Reminders to ALL USERS'}
              </button>
            </div>
          </div>

          {/* Emergency Bypass Section */}
          <div className="border border-orange-200 bg-orange-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">
              ⚡ Emergency Bypass (Ignore Time Window)
            </h3>
            <p className="text-orange-700 mb-4">
              <strong>EMERGENCY USE:</strong> These buttons bypass the 6 PM time window check and will send reminders immediately to ALL users, regardless of current time. Use only if automated reminders failed!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => triggerReminders('day_before', false, true)}
                disabled={isLoading}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'BYPASS: Send Day Before Reminders'}
              </button>
              
              <button
                onClick={() => triggerReminders('last_day', false, true)}
                disabled={isLoading}
                className="bg-orange-800 text-white px-4 py-2 rounded-md hover:bg-orange-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Processing...' : 'BYPASS: Send Last Day Reminders'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className={`border rounded-lg p-6 ${
              result.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <h3 className={`text-lg font-semibold mb-3 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '✅ Success' : '❌ Error'}
              </h3>
              
              <p className={`mb-4 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>

              {result.data && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-900">Competitions</div>
                      <div className="text-2xl font-bold text-blue-600">{result.data.totalCompetitions}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-900">Emails Sent</div>
                      <div className="text-2xl font-bold text-green-600">{result.data.totalEmailsSent}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-900">Notifications</div>
                      <div className="text-2xl font-bold text-purple-600">{result.data.totalNotificationsCreated}</div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-900">Errors</div>
                      <div className="text-2xl font-bold text-red-600">{result.data.errors.length}</div>
                    </div>
                  </div>

                  {result.data.competitionResults && result.data.competitionResults.length > 0 && (
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">Competition Details:</h4>
                      <div className="space-y-2">
                        {result.data.competitionResults.map((comp: any, index: number) => (
                          <div key={index} className="text-sm border-l-4 border-blue-200 pl-3">
                            <div className="font-medium">{comp.competitionTitle}</div>
                            <div className="text-gray-600">
                              Emails: {comp.emailsSent}, Notifications: {comp.notificationsCreated}
                              {comp.errors && comp.errors.length > 0 && (
                                <span className="text-red-600"> | Errors: {comp.errors.length}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.data.errors && result.data.errors.length > 0 && (
                    <div className="bg-white p-4 rounded border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {result.data.errors.map((error: string, index: number) => (
                          <li key={index} className="break-words">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Setup Instructions */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📋 Production Setup Instructions
            </h3>
            <div className="text-blue-700 space-y-2 text-sm">
              <p><strong>For automated reminders in production:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Set up cron jobs or scheduled tasks to call these endpoints:</li>
                <li className="ml-4">Day before: <code className="bg-blue-100 px-1 rounded">GET /api/cron/competition-reminders?type=day_before</code></li>
                <li className="ml-4">Last day: <code className="bg-blue-100 px-1 rounded">GET /api/cron/competition-reminders?type=last_day</code></li>
                <li>Schedule both to run daily at 6 PM Oman time (14:00 UTC)</li>
                <li>The system will automatically check if reminders are needed</li>
                <li>Optional: Add Bearer token authentication with <code className="bg-blue-100 px-1 rounded">CRON_SECRET_TOKEN</code> environment variable</li>
              </ol>
            </div>
          </div>

          {/* Reminder Logs Section */}
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📊 Reminder Activity Logs
              </h3>
              <button
                onClick={() => fetchReminderLogs(1)}
                disabled={logsLoading}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {logsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Type
                </label>
                <select
                  value={logsFilter.triggerType}
                  onChange={(e) => {
                    setLogsFilter(prev => ({ ...prev, triggerType: e.target.value }));
                    fetchReminderLogs(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Types</option>
                  <option value="day_before">Day Before</option>
                  <option value="last_day">Last Day</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Method
                </label>
                <select
                  value={logsFilter.triggerMethod}
                  onChange={(e) => {
                    setLogsFilter(prev => ({ ...prev, triggerMethod: e.target.value }));
                    fetchReminderLogs(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Methods</option>
                  <option value="cron">Automated (Cron)</option>
                  <option value="manual">Manual</option>
                  <option value="bypass">Emergency Bypass</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setLogsFilter({ triggerType: '', triggerMethod: '' });
                    fetchReminderLogs(1);
                  }}
                  className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Logs Display */}
            {logsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading reminder logs...</div>
              </div>
            ) : reminderLogs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 mb-2">📊 Reminder Logs Coming Soon!</div>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    <strong>Comprehensive logging is now active!</strong> All reminder activities will be tracked here.
                  </p>
                  <p>
                    Logs will appear after the next reminder is triggered, showing:
                  </p>
                  <ul className="text-left inline-block mt-2 space-y-1">
                    <li>• When cron jobs run (automated at 6 PM Oman time)</li>
                    <li>• Which competitions were processed</li>
                    <li>• How many emails and notifications were sent</li>
                    <li>• Execution time and success/failure status</li>
                    <li>• Detailed error information if any issues occur</li>
                  </ul>
                  <p className="mt-3">
                    <strong>Next automated run:</strong> Today at 6 PM Oman time (14:00 UTC)
                  </p>
                  <p>
                    <strong>To see logs immediately:</strong> Use the "Emergency Bypass" buttons above to trigger reminders manually.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reminderLogs.map((log, index) => (
                  <div key={log._id || index} className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.triggerType === 'day_before' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {log.triggerType === 'day_before' ? 'Day Before' : 'Last Day'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.triggerMethod === 'cron' 
                              ? 'bg-blue-100 text-blue-800' 
                              : log.triggerMethod === 'manual'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {log.triggerMethod === 'cron' ? 'Automated' : 
                             log.triggerMethod === 'manual' ? 'Manual' : 'Emergency'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.overallSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.overallSuccess ? 'Success' : 'Failed'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {log.omanTime} • {log.executionTimeMs}ms
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium text-gray-900">
                          {log.competitionsFound} competition(s)
                        </div>
                        <div className="text-gray-600">
                          {log.totalEmailsSent} emails • {log.totalNotificationsCreated} notifications
                        </div>
                      </div>
                    </div>
                    
                    {/* Competition Details */}
                    {log.competitionsProcessed && log.competitionsProcessed.length > 0 && (
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Competitions Processed:</h4>
                        <div className="space-y-2">
                          {log.competitionsProcessed.map((comp: any, compIndex: number) => (
                            <div key={compIndex} className="bg-gray-50 rounded p-2 text-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">{comp.competitionTitle}</div>
                                  {comp.skipped && (
                                    <div className="text-yellow-600 text-xs mt-1">
                                      Skipped: {comp.skipReason}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-600">
                                    📧 {comp.emailsSent} • 🔔 {comp.notificationsCreated}
                                  </div>
                                  {comp.errors && comp.errors.length > 0 && (
                                    <div className="text-red-600 text-xs">
                                      {comp.errors.length} error(s)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Errors */}
                    {log.errors && log.errors.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <h4 className="text-sm font-medium text-red-900 mb-2">Errors:</h4>
                        <div className="bg-red-50 rounded p-2">
                          {log.errors.map((error: string, errorIndex: number) => (
                            <div key={errorIndex} className="text-sm text-red-700">
                              • {error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Pagination */}
                {logsPagination && logsPagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                      onClick={() => fetchReminderLogs(logsPage - 1)}
                      disabled={!logsPagination.hasPrevPage || logsLoading}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {logsPagination.currentPage} of {logsPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchReminderLogs(logsPage + 1)}
                      disabled={!logsPagination.hasNextPage || logsLoading}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 