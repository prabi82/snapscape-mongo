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

  // Fetch competitions on component mount
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchCompetitions();
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

  const triggerReminders = async (type: 'day_before' | 'last_day', isTest: boolean = false) => {
    setIsLoading(true);
    setResult(null);

    try {
      let url = `/api/cron/competition-reminders?type=${type}`;
      
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
        </div>
      </div>
    </div>
  );
} 