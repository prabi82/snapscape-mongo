'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AppSettings {
  allowNotificationDeletion: boolean;
  enableImageCompressionDisplay: boolean;
  debugModeEnabled: boolean;
  debugModeUsers: string[];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    allowNotificationDeletion: true,
    enableImageCompressionDisplay: true,
    debugModeEnabled: false,
    debugModeUsers: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [ratingCleanupLoading, setRatingCleanupLoading] = useState(false);
  const [ratingCleanupResult, setRatingCleanupResult] = useState<any>(null);
  const [newDebugUser, setNewDebugUser] = useState('');
  const [users, setUsers] = useState<{_id: string, name: string, email: string}[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Fetch settings from API
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setSettings(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setMessage({ text: 'Failed to load settings. Please try again.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch users for debug user selection
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.users) {
            setUsers(data.users);
          }
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchSettings();
    fetchUsers();
  }, []);

  const handleToggleChange = (setting: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const addDebugUser = () => {
    if (newDebugUser && !settings.debugModeUsers.includes(newDebugUser)) {
      setSettings(prev => ({
        ...prev,
        debugModeUsers: [...prev.debugModeUsers, newDebugUser]
      }));
      setNewDebugUser('');
    }
  };

  const removeDebugUser = (userId: string) => {
    setSettings(prev => ({
      ...prev,
      debugModeUsers: prev.debugModeUsers.filter(id => id !== userId)
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setMessage({ text: '', type: '' });

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ text: 'Settings saved successfully!', type: 'success' });
        // Force refresh app-wide settings
        router.refresh();
      } else {
        setMessage({ text: data.error || 'Failed to save settings.', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ text: 'An error occurred while saving settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCleanupOrphanedSubmissions = async () => {
    if (!confirm('This will permanently delete all photo submissions from deleted competitions. Continue?')) {
      return;
    }
    
    try {
      setCleanupLoading(true);
      setMessage({ text: '', type: '' });
      setCleanupResult(null);
      
      const response = await fetch('/api/cleanup/orphaned-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up orphaned submissions');
      }
      
      setCleanupResult(data);
      
    } catch (err: any) {
      console.error('Error cleaning up orphaned submissions:', err);
      setMessage({ text: err.message || 'An error occurred during cleanup', type: 'error' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCleanupOrphanedRatings = async () => {
    if (!confirm('This will permanently delete all voting points that are not associated with existing photos. Continue?')) {
      return;
    }
    
    try {
      setRatingCleanupLoading(true);
      setMessage({ text: '', type: '' });
      setRatingCleanupResult(null);
      
      const response = await fetch('/api/cleanup/orphaned-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to clean up orphaned ratings');
      }
      
      setRatingCleanupResult(data);
      
    } catch (err: any) {
      console.error('Error cleaning up orphaned ratings:', err);
      setMessage({ text: err.message || 'An error occurred during ratings cleanup', type: 'error' });
    } finally {
      setRatingCleanupLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Application Settings</h1>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">User Interface Settings</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Configure how users interact with the application
          </p>
        </div>
        
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-500">Loading settings...</p>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allowNotificationDeletion"
                    name="allowNotificationDeletion"
                    type="checkbox"
                    checked={settings.allowNotificationDeletion}
                    onChange={() => handleToggleChange('allowNotificationDeletion')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allowNotificationDeletion" className="font-medium text-gray-700">
                    Allow Users to Delete Notifications
                  </label>
                  <p className="text-gray-500">
                    When enabled, users can delete activity items and notifications from their dashboard feed.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="enableImageCompressionDisplay"
                    name="enableImageCompressionDisplay"
                    type="checkbox"
                    checked={settings.enableImageCompressionDisplay}
                    onChange={() => handleToggleChange('enableImageCompressionDisplay')}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="enableImageCompressionDisplay" className="font-medium text-gray-700">
                    Enable Image Compression Display
                  </label>
                  <p className="text-gray-500">
                    When enabled, users will see compression status messages when uploading images over 3MB.
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-900 mb-4">Debug Mode Settings</h4>
                
                <div className="flex items-start mb-4">
                  <div className="flex items-center h-5">
                    <input
                      id="debugModeEnabled"
                      name="debugModeEnabled"
                      type="checkbox"
                      checked={settings.debugModeEnabled}
                      onChange={() => handleToggleChange('debugModeEnabled')}
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="debugModeEnabled" className="font-medium text-gray-700">
                      Enable Debug Mode
                    </label>
                    <p className="text-gray-500">
                      When enabled, debug options and information will be shown to selected users.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="debugUsers" className="block text-sm font-medium text-gray-700 mb-2">
                    Users with Debug Access
                  </label>
                  
                  <div className="flex mb-3">
                    <select
                      id="debugUsers"
                      className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300"
                      value={newDebugUser}
                      onChange={(e) => setNewDebugUser(e.target.value)}
                    >
                      <option value="">Select a user...</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addDebugUser}
                      disabled={!newDebugUser}
                      className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  {settings.debugModeUsers.length > 0 ? (
                    <div className="mt-2">
                      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
                        {settings.debugModeUsers.map(userId => {
                          const user = users.find(u => u._id === userId);
                          return (
                            <li key={userId} className="flex items-center justify-between py-2 px-3 text-sm">
                              <div className="flex-1 truncate">
                                {user ? `${user.name} (${user.email})` : userId}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDebugUser(userId)}
                                className="ml-2 text-red-600 hover:text-red-900"
                              >
                                Remove
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic mt-2">
                      No users with debug access. Add users to give them access to debug mode.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Database Maintenance Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Database Maintenance</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tools to maintain database integrity
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-2">Orphaned Submissions Cleanup</h4>
            <p className="text-sm text-gray-500 mb-3">
              Remove all photo submissions and photos that belong to competitions which have been deleted.
              This will update user points and clean up orphaned images.
            </p>
            
            <button
              onClick={handleCleanupOrphanedSubmissions}
              disabled={cleanupLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${cleanupLoading ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
            >
              {cleanupLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cleaning...
                </>
              ) : (
                'Clean Up Orphaned Submissions'
              )}
            </button>
            
            {cleanupResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Cleanup successful</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Photo submissions deleted: {cleanupResult.deleteSummary.photoSubmissions}</li>
                        <li>Photos deleted: {cleanupResult.deleteSummary.photos}</li>
                        <li>Ratings deleted: {cleanupResult.deleteSummary.ratings}</li>
                        <li>Voting points removed: {cleanupResult.deleteSummary.votingPoints}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-8 mb-5">
            <h4 className="text-md font-medium text-gray-900 mb-2">Orphaned Ratings Cleanup</h4>
            <p className="text-sm text-gray-500 mb-3">
              Remove all user ratings/votes that reference photos which no longer exist.
              This will fix orphaned voting points that remain after photos are deleted.
            </p>
            
            <button
              onClick={handleCleanupOrphanedRatings}
              disabled={ratingCleanupLoading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${ratingCleanupLoading ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
            >
              {ratingCleanupLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cleaning...
                </>
              ) : (
                'Clean Up Orphaned Ratings'
              )}
            </button>
            
            {ratingCleanupResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Ratings cleanup successful</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Removed {ratingCleanupResult.deleteSummary.orphanedRatings} orphaned ratings/voting points</p>
                      
                      {ratingCleanupResult.userSummary && ratingCleanupResult.userSummary.length > 0 && (
                        <>
                          <p className="mt-2 font-medium">User breakdown:</p>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            {ratingCleanupResult.userSummary.map((item, index) => (
                              <li key={index}>User {item.userId}: {item.ratingsRemoved} points removed</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 