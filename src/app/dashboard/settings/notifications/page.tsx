'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExtendedSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
  };
}

interface NotificationPreferences {
  competitionReminders: boolean;
  votingOpen: boolean;
  competitionCompleted: boolean;
  newCompetitions: boolean;
  achievementNotifications: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    competitionReminders: true,
    votingOpen: true,
    competitionCompleted: true,
    newCompetitions: true,
    achievementNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session?.user?.id) {
      fetchNotificationPreferences();
    }
  }, [status, router, session]);

  const fetchNotificationPreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationPreferences = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving preferences' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (status === 'loading' || isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const notificationOptions = [
    {
      key: 'competitionReminders' as keyof NotificationPreferences,
      title: 'Competition Reminders',
      description: 'Get reminded about upcoming competition deadlines',
      icon: '⏰',
      category: 'Competition Updates'
    },
    {
      key: 'votingOpen' as keyof NotificationPreferences,
      title: 'Voting Open Notifications',
      description: 'Be notified when voting opens for competitions',
      icon: '🗳️',
      category: 'Competition Updates'
    },
    {
      key: 'competitionCompleted' as keyof NotificationPreferences,
      title: 'Competition Results',
      description: 'Get notified when competition results are announced',
      icon: '🏆',
      category: 'Competition Updates'
    },
    {
      key: 'newCompetitions' as keyof NotificationPreferences,
      title: 'New Competitions',
      description: 'Be the first to know about new photography competitions',
      icon: '📸',
      category: 'Competition Updates'
    },
    {
      key: 'achievementNotifications' as keyof NotificationPreferences,
      title: 'Achievement Notifications',
      description: 'Get notified when you earn badges or reach milestones',
      icon: '🎖️',
      category: 'Personal Updates'
    },
    {
      key: 'weeklyDigest' as keyof NotificationPreferences,
      title: 'Weekly Digest',
      description: 'Receive a weekly summary of platform activity',
      icon: '📊',
      category: 'Digest & Updates'
    },
    {
      key: 'marketingEmails' as keyof NotificationPreferences,
      title: 'Marketing & Promotions',
      description: 'Receive updates about new features and special offers',
      icon: '📢',
      category: 'Digest & Updates'
    }
  ];

  const categories = Array.from(new Set(notificationOptions.map(option => option.category)));

  return (
    <div className="min-h-screen bg-[#f5f8fa] py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard/settings" className="text-[#1a4d5c] hover:text-[#2699a6] transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-[#1a4d5c]">Notification Settings</h1>
          </div>
          <p className="text-gray-600">Choose which email notifications you want to receive</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Email Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="font-medium text-blue-800">Email notifications will be sent to:</span>
          </div>
          <p className="text-blue-700 font-medium">{session.user.email}</p>
        </div>

        {/* Notification Categories */}
        {categories.map(category => (
          <div key={category} className="mb-8 bg-white rounded-2xl shadow-lg border-2 border-[#e0c36a]">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#1a4d5c]">{category}</h2>
            </div>
            <div className="p-6 space-y-4">
              {notificationOptions
                .filter(option => option.category === category)
                .map(option => (
                  <div key={option.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <h3 className="font-medium text-[#1a4d5c]">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences[option.key]}
                        onChange={() => handleToggle(option.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e0c36a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a4d5c]"></div>
                    </label>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/settings">
            <button className="px-6 py-2 text-[#1a4d5c] border border-[#e0c36a] rounded-lg hover:bg-[#e6f0f3] transition">
              Cancel
            </button>
          </Link>
          <button
            onClick={saveNotificationPreferences}
            disabled={isSaving}
            className="px-6 py-2 bg-[#1a4d5c] text-white rounded-lg hover:bg-[#2699a6] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <h4 className="font-medium text-gray-800 mb-2">📝 Note:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li>You can change these preferences at any time</li>
            <li>Some critical notifications (like security alerts) cannot be disabled</li>
            <li>It may take up to 24 hours for changes to take effect</li>
            <li>Check your spam folder if you're not receiving expected emails</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 