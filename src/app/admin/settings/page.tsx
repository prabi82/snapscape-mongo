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
    <div>
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
                    Show Image Compression Information
                  </label>
                  <p className="text-gray-500">
                    When enabled, users will see compression details when uploading images.
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

                {settings.debugModeEnabled && (
                  <div className="ml-7 space-y-4">
                    <div>
                      <label htmlFor="debugUsers" className="block text-sm font-medium text-gray-700 mb-2">
                        Debug Mode Users
                      </label>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={newDebugUser}
                          onChange={(e) => setNewDebugUser(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                          <option value="">Select a user...</option>
                          {users
                            .filter(user => !settings.debugModeUsers.includes(user._id))
                            .map(user => (
                              <option key={user._id} value={user._id}>
                                {user.name} ({user.email})
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={addDebugUser}
                          disabled={!newDebugUser}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                      
                      {settings.debugModeUsers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">Current debug users:</p>
                          {settings.debugModeUsers.map(userId => {
                            const user = users.find(u => u._id === userId);
                            return (
                              <div key={userId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                <span className="text-sm">
                                  {user ? `${user.name} (${user.email})` : `User ID: ${userId}`}
                                </span>
                                <button
                                  onClick={() => removeDebugUser(userId)}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5">
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Maintenance Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Database Maintenance</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Clean up orphaned data and maintain database integrity
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* Orphaned Submissions Cleanup */}
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-yellow-800">Clean Up Orphaned Photo Submissions</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    This will permanently delete all photo submissions that belong to competitions that no longer exist.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={handleCleanupOrphanedSubmissions}
                      disabled={cleanupLoading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {cleanupLoading ? 'Cleaning...' : 'Clean Up Orphaned Submissions'}
                    </button>
                  </div>
                  
                  {cleanupResult && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h5 className="text-sm font-medium text-gray-900">Cleanup Results:</h5>
                      <ul className="mt-1 text-sm text-gray-600">
                        <li>• Orphaned submissions found: {cleanupResult.orphanedSubmissions?.length || 0}</li>
                        <li>• Submissions deleted: {cleanupResult.deletedCount || 0}</li>
                        <li>• Images deleted from Cloudinary: {cleanupResult.cloudinaryDeletions || 0}</li>
                        {cleanupResult.errors?.length > 0 && (
                          <li className="text-red-600">• Errors: {cleanupResult.errors.length}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Orphaned Ratings Cleanup */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800">Clean Up Orphaned Voting Points</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    This will permanently delete all voting points that reference photos that no longer exist.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={handleCleanupOrphanedRatings}
                      disabled={ratingCleanupLoading}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {ratingCleanupLoading ? 'Cleaning...' : 'Clean Up Orphaned Ratings'}
                    </button>
                  </div>
                  
                  {ratingCleanupResult && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h5 className="text-sm font-medium text-gray-900">Cleanup Results:</h5>
                      <ul className="mt-1 text-sm text-gray-600">
                        <li>• Orphaned ratings found: {ratingCleanupResult.orphanedRatings?.length || 0}</li>
                        <li>• Ratings deleted: {ratingCleanupResult.deletedCount || 0}</li>
                        {ratingCleanupResult.errors?.length > 0 && (
                          <li className="text-red-600">• Errors: {ratingCleanupResult.errors.length}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 