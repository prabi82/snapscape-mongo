'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Competition {
  _id: string;
  title: string;
  description: string;
  theme: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  submissionCount?: number;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserStats {
  totalCompetitions: number;
  activeCompetitions: number;
  completedJudgements: number;
  submissionsReviewed: number;
  averageRating: number;
}

interface RecentActivity {
  _id: string;
  type: 'judgement' | 'competition_assigned' | 'competition_completed' | 'rating_submitted' | 'rating' | 'notification' | 'submission' | 'badge' | 'win' | 'result';
  title: string;
  date: string;
  details?: string;
  competitionId?: string;
  competitionTitle?: string;
  photoUrl?: string;
  read?: boolean;
}

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
  expires: string;
}

interface FeedItem {
  id: string;
  type: 'activity' | 'competition_active' | 'competition_voting' | 'competition_completed';
  data: any;
  sortDate: string;
}

export default function JudgeDashboard() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession;
  const router = useRouter();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalCompetitions: 0,
    activeCompetitions: 0,
    completedJudgements: 0,
    submissionsReviewed: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'competitions'>('feed');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Add state for application settings
  const [appSettings, setAppSettings] = useState({
    allowNotificationDeletion: false
  });

  // Check authentication and role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && extendedSession?.user?.role !== 'judge') {
      router.push('/dashboard');
      return;
    }
  }, [status, extendedSession, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (status === 'authenticated' && extendedSession?.user?.role === 'judge') {
      fetchDashboardData();
      fetchAppSettings();
    }
  }, [status, extendedSession]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch competitions
      const competitionsRes = await fetch('/api/competitions');
      if (competitionsRes.ok) {
        const competitionsData = await competitionsRes.json();
        const comps = competitionsData.data || [];
        setCompetitions(comps);
        
        // Calculate stats based on competitions
        const total = comps.length;
        const active = comps.filter((comp: Competition) => comp.status === 'active' || comp.status === 'voting').length;
        
        setStats(prev => ({
          ...prev,
          totalCompetitions: total,
          activeCompetitions: active,
          completedJudgements: 25, // Mock data
          submissionsReviewed: 150, // Mock data
          averageRating: 4.2 // Mock data
        }));

        // Create feed items from competitions and activities
        const competitionFeedItems: FeedItem[] = comps
          .filter((comp: Competition) => comp.status === 'active' || comp.status === 'voting')
          .map((comp: Competition) => ({
            id: `comp-${comp._id}`,
            type: comp.status === 'voting' ? 'competition_voting' : 'competition_active' as 'competition_voting' | 'competition_active',
            data: comp,
            sortDate: comp.createdAt || new Date().toISOString()
          }));

        // Fetch real activities for judges instead of using mock data
        const activitiesRes = await fetch('/api/users/activities?page=1&limit=20');
        let activityFeedItems: FeedItem[] = [];
        
        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          const activities = activitiesData.data || [];
          setRecentActivities(activities);

          // Add activities to feed with proper null checks and unique IDs
          activityFeedItems = activities
            .filter((activity: RecentActivity) => activity && activity._id) // Filter out null/undefined activities
            .map((activity: RecentActivity, index: number) => ({
              id: `activity-${activity._id}-${index}`, // Add index to ensure uniqueness
              type: 'activity' as const,
              data: activity,
              sortDate: activity.date || new Date().toISOString()
            }));
        } else {
          console.error('Failed to fetch activities for judge dashboard');
          setRecentActivities([]);
        }

        // Combine all feed items and sort them
        const allFeedItems = [...competitionFeedItems, ...activityFeedItems];
        
        // Remove any potential duplicates based on ID and sort
        const uniqueFeedItems = allFeedItems
          .filter((item, index, array) => 
            array.findIndex(i => i.id === item.id) === index
          )
          .sort((a, b) => 
            new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
          );

        setFeedItems(uniqueFeedItems);

      } else {
        console.error('Failed to fetch competitions for judge dashboard');
        setCompetitions([]);
        setFeedItems([]);
      }

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      // Set empty arrays on error to prevent rendering issues
      setCompetitions([]);
      setFeedItems([]);
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSince = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'voting': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to strip HTML tags and clean up text
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // Remove HTML tags
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let text = doc.body.textContent || '';
    
    // Clean up extra whitespace and newlines
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit length for better display
    if (text.length > 200) {
      text = text.substring(0, 200) + '...';
    }
    
    return text;
  };

  // Add function to fetch application settings
  const fetchAppSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setAppSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch app settings:', error);
    }
  };

  // Add function to delete a feed item
  const deleteFeedItem = async (itemId: string) => {
    console.log('\n=== FRONTEND DELETE ITEM START ===');
    console.log('[FRONTEND] Step 1: Delete request initiated:', {
      itemId,
      allowNotificationDeletion: appSettings.allowNotificationDeletion,
      settingsCheck: !!appSettings.allowNotificationDeletion
    });
    
    // Only allow deletion if the setting is enabled
    if (!appSettings.allowNotificationDeletion) {
      console.log('[FRONTEND] Step 1: BLOCKED - Notification deletion disabled by administrator');
      alert('Notification deletion is disabled by administrator');
      return;
    }
    
    try {
      console.log('[FRONTEND] Step 2: Finding activity to delete...');
      
      // Extract the original activity ID from the feed item ID
      let originalActivityId = itemId;
      if (itemId.startsWith('activity-')) {
        // Remove the 'activity-' prefix and the index suffix (e.g., '-0')
        const withoutPrefix = itemId.replace('activity-', '');
        // Remove the index suffix (last part after the last dash)
        const parts = withoutPrefix.split('-');
        if (parts.length > 1) {
          // Remove the last part (index) and rejoin
          originalActivityId = parts.slice(0, -1).join('-');
        } else {
          originalActivityId = withoutPrefix;
        }
      }
      
      console.log('[FRONTEND] Step 2a: ID extraction:', {
        originalFeedItemId: itemId,
        extractedActivityId: originalActivityId,
        startedWithActivity: itemId.startsWith('activity-')
      });
      
      // Check if this is an activity/notification that should be deleted from database
      const activityToDelete = recentActivities.find(activity => activity._id === originalActivityId);
      console.log('[FRONTEND] Step 2b: Activity search result:', {
        found: !!activityToDelete,
        activityId: activityToDelete?._id,
        activityType: activityToDelete?.type,
        activityTitle: activityToDelete?.title,
        totalActivities: recentActivities.length,
        searchedForId: originalActivityId,
        allActivityIds: recentActivities.map(a => a._id)
      });
      
      if (activityToDelete && (activityToDelete.type === 'notification' || activityToDelete.type === 'submission' || activityToDelete.type === 'badge' || activityToDelete.type === 'win' || activityToDelete.type === 'result' || activityToDelete.type === 'rating_submitted' || activityToDelete.type === 'rating' || activityToDelete.type === 'judgement' || activityToDelete.type === 'competition_assigned' || activityToDelete.type === 'competition_completed')) {
        console.log('[FRONTEND] Step 3: Processing deletable activity...');
        
        // Extract the real notification ID from the prefixed activity ID
        let actualNotificationId = activityToDelete._id;
        
        console.log('[FRONTEND] Step 4: Processing notification ID...');
        console.log('[FRONTEND] Step 4: Original ID:', actualNotificationId);
        
        // If the ID has a prefix (like "notification_", "submission_", etc.), extract the real ID
        if (actualNotificationId.includes('_')) {
          const parts = actualNotificationId.split('_');
          if (parts.length >= 2) {
            actualNotificationId = parts.slice(1).join('_'); // Handle cases where there might be multiple underscores
          }
          console.log('[FRONTEND] Step 4: Extracted ID from prefix:', {
            originalId: activityToDelete._id,
            extractedId: actualNotificationId,
            parts: parts
          });
        } else {
          console.log('[FRONTEND] Step 4: No prefix found, using original ID');
        }
        
        console.log('[FRONTEND] Step 5: Making API call...');
        
        // Determine the correct API endpoint based on activity type
        let apiEndpoint: string;
        if (activityToDelete.type === 'rating') {
          apiEndpoint = `/api/ratings/${actualNotificationId}`;
          console.log('[FRONTEND] Step 5: Using ratings API for rating activity');
        } else {
          apiEndpoint = `/api/notifications/${actualNotificationId}`;
          console.log('[FRONTEND] Step 5: Using notifications API for non-rating activity');
        }
        
        console.log('[FRONTEND] Step 5: API URL:', apiEndpoint);
        
        // This is a notification/activity that should be deleted from the database
        const response = await fetch(apiEndpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('[FRONTEND] Step 6: API response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        let responseData;
        try {
          responseData = await response.json();
          console.log('[FRONTEND] Step 7: Response data:', responseData);
        } catch (jsonError) {
          console.error('[FRONTEND] Step 7: Failed to parse JSON response:', jsonError);
          responseData = null;
        }
        
        if (response.ok) {
          console.log('[FRONTEND] Step 8: Deletion successful, updating local state...');
          
          // Remove from local activities state using original activity ID
          const updatedActivities = recentActivities.filter(activity => activity._id !== originalActivityId);
          console.log('[FRONTEND] Step 8a: Updating activities:', {
            originalCount: recentActivities.length,
            newCount: updatedActivities.length,
            removedItemId: originalActivityId
          });
          setRecentActivities(updatedActivities);
          
          // Remove from feedItems using feed item ID
          const updatedFeedItems = feedItems.filter(item => item.id !== itemId);
          console.log('[FRONTEND] Step 8b: Updating feedItems:', {
            originalCount: feedItems.length,
            newCount: updatedFeedItems.length,
            removedItemId: itemId
          });
          setFeedItems(updatedFeedItems);
          
          console.log('[FRONTEND] SUCCESS: Notification deleted from database and local state updated');
          alert('Notification deleted successfully!');
        } else {
          console.error('[FRONTEND] Step 8: FAILED - API deletion failed:', {
            status: response.status,
            statusText: response.statusText,
            responseData
          });
          alert(`Failed to delete notification: ${responseData?.message || response.statusText}`);
        }
      } else {
        console.log('[FRONTEND] Step 3: Non-deletable item, removing from local state only...');
        console.log('[FRONTEND] Step 3a: Item details:', {
          itemId,
          originalActivityId,
          activityFound: !!activityToDelete,
          activityType: activityToDelete?.type,
          isDeletableType: activityToDelete ? ['notification', 'submission', 'badge', 'win', 'result', 'rating_submitted', 'rating', 'judgement', 'competition_assigned', 'competition_completed'].includes(activityToDelete.type) : false
        });
        
        // For competition items or other non-deletable items, just remove from local state
        const updatedFeedItems = feedItems.filter(item => item.id !== itemId);
        console.log('[FRONTEND] Step 3b: Local removal:', {
          originalCount: feedItems.length,
          newCount: updatedFeedItems.length,
          removedItemId: itemId
        });
        setFeedItems(updatedFeedItems);
        
        console.log('[FRONTEND] SUCCESS: Item removed from local state (non-deletable)');
      }
      
    } catch (error: any) {
      console.error('[FRONTEND] ERROR: Exception during deletion:', {
        error: error.message,
        stack: error.stack,
        itemId,
        activityType: recentActivities.find(a => a._id === itemId)?.type
      });
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error deleting item: ${errorMessage}`);
      
      // Also log to console for debugging
      console.error('Delete operation failed:', error);
    }
    
    console.log('=== FRONTEND DELETE ITEM END ===\n');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your judge dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || extendedSession?.user?.role !== 'judge') {
    return null;
  }

  // Circular stats similar to user dashboard
  const highlights = [
    {
      label: 'Competitions',
      value: stats.totalCompetitions,
      icon: <svg className="w-7 h-7" fill="none" stroke="#1a4d5c" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg>,
      color: 'bg-white border-2 border-[#1a4d5c] text-[#1a4d5c]'
    },
    {
      label: 'Active to Judge',
      value: stats.activeCompetitions,
      icon: <svg className="w-7 h-7" fill="none" stroke="#2699a6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'bg-white border-2 border-[#2699a6] text-[#2699a6]'
    },
    {
      label: 'Completed',
      value: stats.completedJudgements,
      icon: <svg className="w-7 h-7" fill="none" stroke="#e0c36a" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
      color: 'bg-white border-2 border-[#e0c36a] text-[#e0c36a]'
    },
    {
      label: 'Photos Reviewed',
      value: stats.submissionsReviewed,
      icon: <svg className="w-7 h-7" fill="none" stroke="#1a4d5c" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      color: 'bg-white border-2 border-[#1a4d5c] text-[#1a4d5c]'
    },
    {
      label: 'Avg Rating',
      value: stats.averageRating.toFixed(1),
      icon: <svg className="w-7 h-7" fill="none" stroke="#2699a6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
      color: 'bg-white border-2 border-[#2699a6] text-[#2699a6]'
    },
  ];

  return (
    <div className="min-h-screen bg-[#e6f0f3] pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Circular Stats - Similar to user dashboard */}
        <div className="flex justify-center gap-4 mb-8 overflow-x-auto pt-4">
          {highlights.map((highlight, index) => (
            <div key={index} className="flex flex-col items-center min-w-[100px]">
              <div className={`w-20 h-20 rounded-full ${highlight.color} flex flex-col items-center justify-center shadow-lg`}>
                <div className="flex items-center justify-center mb-1">
                  {highlight.icon}
                </div>
                <span className="text-lg font-bold">{highlight.value}</span>
              </div>
              <span className="text-xs text-[#1a4d5c] mt-2 text-center font-medium">{highlight.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-white rounded-full p-1 shadow border border-[#e0c36a]/20">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-[#e0c36a] text-[#1a4d5c] shadow'
                  : 'text-[#1a4d5c] hover:bg-[#e0c36a]/10'
              }`}
            >
              Feed
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'competitions'
                  ? 'bg-[#e0c36a] text-[#1a4d5c] shadow'
                  : 'text-[#1a4d5c] hover:bg-[#e0c36a]/10'
              }`}
            >
              Competitions
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {feedItems && feedItems.length > 0 ? (
              feedItems
                .filter(item => item && item.id && item.data) // Add safety filter
                .map((item) => (
                  <div key={item.id}>
                    {item.type === 'activity' ? (
                      // Activity items - matching user dashboard styling
                      <div className="bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-400 mb-4 relative">
                        {/* Delete Button - Only show if allowed by settings */}
                        {appSettings.allowNotificationDeletion && (
                          <button 
                            onClick={() => deleteFeedItem(item.id)} 
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="flex items-start space-x-3">
                          {/* Image thumbnail for activities with photos */}
                          {item.data.photoUrl && (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                              <img 
                                src={item.data.photoUrl}
                                alt="Activity photo"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://picsum.photos/300/200';
                                }}
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {/* Dynamic icon based on activity type */}
                              {item.data.type === 'competition_assigned' && (
                                <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              )}
                              {/* Judge Assignment Notification */}
                              {(item.data.type === 'notification' && item.data.title === 'Judge Assignment') && (
                                <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              {item.data.type === 'judgement' && (
                                <div className="p-1.5 rounded-full bg-green-100 text-green-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              {item.data.type === 'competition_completed' && (
                                <div className="p-1.5 rounded-full bg-purple-100 text-purple-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                  </svg>
                                </div>
                              )}
                              {/* General notification icon for other notification types */}
                              {(item.data.type === 'notification' && item.data.title !== 'Judge Assignment') && (
                                <div className="p-1.5 rounded-full bg-teal-100 text-teal-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                  </svg>
                                </div>
                              )}
                              {/* Photo submission icon */}
                              {item.data.type === 'submission' && (
                                <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              {/* Rating submission icon */}
                              {(item.data.type === 'rating_submitted' || item.data.type === 'rating') && (
                                <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                </div>
                              )}
                              {/* Default icon for other types */}
                              {!['competition_assigned', 'notification', 'judgement', 'competition_completed', 'submission', 'rating_submitted', 'rating'].includes(item.data.type) && (
                                <div className="p-1.5 rounded-full bg-gray-100 text-gray-600 mr-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              <p className="text-sm font-medium text-gray-800">{item.data.title}</p>
                            </div>
                            <p className="text-xs text-gray-500">{item.data.details || item.data.competitionTitle || ''}</p>
                            <p className="text-xs text-gray-500 mt-0.5 mb-2">{formatTimeSince(item.data.date)}</p>
                            
                            {/* Show link for judge assignment notifications */}
                            {(item.data.type === 'notification' && item.data.title === 'Judge Assignment' && item.data.competitionId) && (
                              <div className="flex justify-end mt-1">
                                <Link
                                  href={`/dashboard/competitions/${item.data.competitionId}`}
                                  className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 rounded-md px-2 py-1 border border-teal-100 font-medium"
                                >
                                  View Competition
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Competition items - matching user dashboard styling exactly
                      (() => {
                        if (item.data.status === 'voting') {
                          // Voting competition - compact horizontal layout like user dashboard
                          return (
                            <div className="rounded-2xl shadow-lg overflow-hidden bg-yellow-50 border-l-4 border-yellow-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                              {/* Delete Button - Only show if allowed by settings */}
                              {appSettings.allowNotificationDeletion && (
                                <button 
                                  onClick={() => deleteFeedItem(item.id)} 
                                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                                  aria-label="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              
                              <div className="relative w-full md:w-32 h-24 md:mr-4 mb-3 md:mb-0 flex-shrink-0">
                                <Image src={item.data.coverImage || '/default-cover.jpg'} alt={item.data.title} fill className="object-cover rounded-lg" />
                              </div>
                              <div className="flex-1 text-left w-full">
                                <div className="font-bold text-lg text-[#1a4d5c] mb-1">Voting Open: {item.data.title}</div>
                                <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(item.data.createdAt || item.data.updatedAt || new Date().toISOString())}</p>
                                <div className="text-sm text-gray-700 mb-2">Voting is now open! Cast your vote for your favorite photos in this competition.</div>
                                <Link 
                                  href={`/judge/competitions/${item.data._id}/evaluate`}
                                  className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                                >
                                  Judge Submissions
                                </Link>
                              </div>
                            </div>
                          );
                        } else if (item.data.status === 'completed') {
                          // Completed competition - green styling
                          return (
                            <div className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                              {/* Delete Button - Only show if allowed by settings */}
                              {appSettings.allowNotificationDeletion && (
                                <button 
                                  onClick={() => deleteFeedItem(item.id)} 
                                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                                  aria-label="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              
                              <div className="relative w-full md:w-32 h-24 md:mr-4 mb-3 md:mb-0 flex-shrink-0">
                                <Image src={item.data.coverImage || '/default-cover.jpg'} alt={item.data.title} fill className="object-cover rounded-lg" />
                              </div>
                              <div className="flex-1 text-left w-full">
                                <div className="font-bold text-lg text-[#1a4d5c] mb-1">Competition Completed: {item.data.title}</div>
                                <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(item.data.createdAt || item.data.updatedAt || new Date().toISOString())}</p>
                                <div className="text-sm text-gray-700 mb-2">This competition has ended. View the final results and rankings.</div>
                                <Link 
                                  href={`/dashboard/competitions/${item.data._id}/view-submissions?result=1`}
                                  className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                                >
                                  View Results
                                </Link>
                              </div>
                            </div>
                          );
                        } else {
                          // Active/upcoming competitions - larger layout like user dashboard
                          const displayTimestamp = item.data.status === 'upcoming' 
                            ? (item.data.createdAt || item.sortDate)
                            : (item.data.updatedAt || item.data.startDate);
                          
                          return (
                            <div className="rounded-2xl shadow-lg overflow-hidden bg-sky-50 border-l-4 border-sky-400 flex flex-col md:flex-row items-start p-4 mb-4 group relative">
                              {/* Delete Button - Only show if allowed by settings */}
                              {appSettings.allowNotificationDeletion && (
                                <button 
                                  onClick={() => deleteFeedItem(item.id)} 
                                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                                  aria-label="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              
                              {/* Image Container */}
                              <div className="relative w-full md:w-2/5 h-48 flex-shrink-0 mb-4 md:mb-0 md:mr-4 rounded-lg overflow-hidden">
                                {item.data.coverImage ? (
                                  <Image 
                                    src={item.data.coverImage} 
                                    alt={item.data.title} 
                                    fill 
                                    className="object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                              {/* Details Container */}
                              <div className="w-full md:w-3/5 flex flex-col">
                                <div className="flex-grow">
                                  <div className="flex justify-between items-start mb-1">
                                    <h3 className="text-lg font-bold text-[#1a4d5c] truncate" title={item.data.title}>{item.data.title}</h3>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(item.data.status)}`}>
                                      {item.data.status.charAt(0).toUpperCase() + item.data.status.slice(1)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 mb-1">{formatTimeSince(displayTimestamp)}</p>
                                  <p className="text-sm text-gray-600 mb-1">Theme: {item.data.theme}</p>
                                  <p className="text-sm text-gray-500 mb-2">
                                    {item.data.status === 'upcoming' 
                                      ? `Starts: ${new Date(item.data.startDate).toLocaleDateString()}` 
                                      : `Ends: ${new Date(item.data.endDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                                <div className="mt-auto flex justify-between items-center">
                                  <p className="text-sm text-gray-500">{item.data.submissionCount || 0} submissions</p>
                                  <Link 
                                    href={`/dashboard/competitions/${item.data._id}`}
                                    className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition text-xs md:text-sm"
                                  >
                                    {item.data.status === 'upcoming' ? 'View Details' : 'View Details'}
                                  </Link>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      })()
                    )}
                  </div>
                ))
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">Your judging activities will appear here.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-4">
            {competitions && competitions.length > 0 ? (
              competitions
                .filter(competition => competition && competition._id) // Add safety filter
                .map((competition) => {
                  if (competition.status === 'voting') {
                    // Voting competition - compact horizontal layout like user dashboard
                    return (
                      <div key={competition._id} className="rounded-2xl shadow-lg overflow-hidden bg-yellow-50 border-l-4 border-yellow-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                        {/* Delete Button - Only show if allowed by settings */}
                        {appSettings.allowNotificationDeletion && (
                          <button 
                            onClick={() => deleteFeedItem(competition._id)} 
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="relative w-full md:w-32 h-24 md:mr-4 mb-3 md:mb-0 flex-shrink-0">
                          <Image src={competition.coverImage || '/default-cover.jpg'} alt={competition.title} fill className="object-cover rounded-lg" />
                        </div>
                        <div className="flex-1 text-left w-full">
                          <div className="font-bold text-lg text-[#1a4d5c] mb-1">Voting Open: {competition.title}</div>
                          <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(competition.createdAt || competition.updatedAt || new Date().toISOString())}</p>
                          <div className="text-sm text-gray-700 mb-2">Voting is now open! Cast your vote for your favorite photos in this competition.</div>
                          <Link 
                            href={`/judge/competitions/${competition._id}/evaluate`}
                            className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                          >
                            Judge Submissions
                          </Link>
                        </div>
                      </div>
                    );
                  } else if (competition.status === 'completed') {
                    // Completed competition - green styling
                    return (
                      <div key={competition._id} className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                        {/* Delete Button - Only show if allowed by settings */}
                        {appSettings.allowNotificationDeletion && (
                          <button 
                            onClick={() => deleteFeedItem(competition._id)} 
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="relative w-full md:w-32 h-24 md:mr-4 mb-3 md:mb-0 flex-shrink-0">
                          <Image src={competition.coverImage || '/default-cover.jpg'} alt={competition.title} fill className="object-cover rounded-lg" />
                        </div>
                        <div className="flex-1 text-left w-full">
                          <div className="font-bold text-lg text-[#1a4d5c] mb-1">Competition Completed: {competition.title}</div>
                          <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(competition.createdAt || competition.updatedAt || new Date().toISOString())}</p>
                          <div className="text-sm text-gray-700 mb-2">This competition has ended. View the final results and rankings.</div>
                          <Link 
                            href={`/dashboard/competitions/${competition._id}/view-submissions?result=1`}
                            className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                          >
                            View Results
                          </Link>
                        </div>
                      </div>
                    );
                  } else {
                    // Active/upcoming competitions - larger layout like user dashboard
                    const displayTimestamp = competition.status === 'upcoming' 
                      ? (competition.createdAt || new Date().toISOString())
                      : (competition.updatedAt || competition.startDate);
                    
                    return (
                      <div key={competition._id} className="rounded-2xl shadow-lg overflow-hidden bg-sky-50 border-l-4 border-sky-400 flex flex-col md:flex-row items-start p-4 mb-4 group relative">
                        {/* Delete Button - Only show if allowed by settings */}
                        {appSettings.allowNotificationDeletion && (
                          <button 
                            onClick={() => deleteFeedItem(competition._id)} 
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity z-10"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Image Container */}
                        <div className="relative w-full md:w-2/5 h-48 flex-shrink-0 mb-4 md:mb-0 md:mr-4 rounded-lg overflow-hidden">
                          {competition.coverImage ? (
                            <Image 
                              src={competition.coverImage} 
                              alt={competition.title} 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                              <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Details Container */}
                        <div className="w-full md:w-3/5 flex flex-col">
                          <div className="flex-grow">
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="text-lg font-bold text-[#1a4d5c] truncate" title={competition.title}>{competition.title}</h3>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(competition.status)}`}>
                                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 mb-1">{formatTimeSince(displayTimestamp)}</p>
                            <p className="text-sm text-gray-600 mb-1">Theme: {competition.theme}</p>
                            <p className="text-sm text-gray-500 mb-2">
                              {competition.status === 'upcoming' 
                                ? `Starts: ${new Date(competition.startDate).toLocaleDateString()}` 
                                : `Ends: ${new Date(competition.endDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="mt-auto flex justify-between items-center">
                            <p className="text-sm text-gray-500">{competition.submissionCount || 0} submissions</p>
                            <Link 
                              href={`/dashboard/competitions/${competition._id}`}
                              className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition text-xs md:text-sm"
                            >
                              {competition.status === 'upcoming' ? 'View Details' : 'View Details'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })
            ) : (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No competitions available</h3>
                <p className="mt-1 text-sm text-gray-500">New competitions will appear here for you to judge.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 