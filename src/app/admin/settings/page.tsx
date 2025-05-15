'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AppSettings {
  allowNotificationDeletion: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    allowNotificationDeletion: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
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

    fetchSettings();
  }, []);

  const handleToggleChange = (setting: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Application Settings</h1>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
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
    </div>
  );
} 