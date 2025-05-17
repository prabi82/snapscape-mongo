'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

// Helper function to format time since a date
function formatTimeSince(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return 'recently'; // Default fallback for invalid dates
  }

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + ' years ago';
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + ' months ago';
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + ' hours ago';
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  return 'just now';
}

// Types for the dashboard data
interface UserStats {
  totalSubmissions: number;
  photosRated: number;
  badgesEarned: number;
  competitionsEntered: number;
  competitionsWon: number;
}

interface Competition {
  _id: string;
  title: string;
  theme: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  submissionCount?: number;
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RecentActivity {
  _id: string;
  type: 'submission' | 'rating' | 'badge' | 'win' | 'notification' | 'result';
  title: string;
  date: string;
  details?: string;
  photoUrl?: string;
  competitionId?: string;
  read?: boolean;
}

interface Submission {
  _id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingCount: number;
  user: {
    _id: string;
    name: string;
    email?: string;
    profileImage?: string;
  };
}

// New Unified Feed Item Type
interface FeedItemBase {
  id: string; // Unique ID for the item (can be competition._id or activity._id)
  sortDate: string; // ISO date string for sorting
}

interface CompetitionFeedItem extends FeedItemBase {
  type: 'competition_active' | 'competition_upcoming' | 'competition_voting' | 'competition_completed_results';
  data: Competition; // Original competition data
  userSubmissions?: Submission[]; // For completed competitions, user's ranked submissions
  allRankedSubmissions?: Submission[]; // For completed competitions, all ranked submissions (for tie-breaking display)
}

interface ActivityFeedItem extends FeedItemBase {
  type: 'activity' | 'notification';
  data: RecentActivity | any; // Original activity data or notification data
}

export type FeedItem = CompetitionFeedItem | ActivityFeedItem;

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Add a type assertion for session.user to fix TypeScript errors
  // Cast session.user to include id property from next-auth.d.ts
  const userId = (session?.user as { id?: string })?.id || '';
  
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    photosRated: 0,
    badgesEarned: 0,
    competitionsEntered: 0,
    competitionsWon: 0,
  });
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [activitiesHasMore, setActivitiesHasMore] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'competitions'>('feed');
  const [feedColumns, setFeedColumns] = useState<1 | 2>(2);
  const [competitionsColumns, setCompetitionsColumns] = useState<1 | 2>(2);
  const [votingCompetitions, setVotingCompetitions] = useState<Competition[]>([]);
  const [completedCompetitions, setCompletedCompetitions] = useState<Competition[]>([]);
  const [completedResults, setCompletedResults] = useState<Record<string, Submission[]>>({});

  // New state for combined and sorted feed items
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  
  // New state for hidden feed items
  const [hiddenFeedItems, setHiddenFeedItems] = useState<Set<string>>(new Set());
  
  // New state for application settings
  const [appSettings, setAppSettings] = useState({
    allowNotificationDeletion: true
  });

  const fetchActivities = async (page = 1) => {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/users/activities?page=${page}&limit=20`);
      if (!res.ok) throw new Error('Failed to load recent activities');
      const data = await res.json();
      
      const activities = data.data || [];
      
      if (page === 1) {
        setActivities(activities);
      } else {
        setActivities(prev => [...prev, ...activities]);
      }
      setActivitiesHasMore((data.data?.length || 0) === 20);
    } catch (err) {
      console.error('Error fetching activities:', err);
      if (page === 1) setActivities([]);
      setActivitiesHasMore(false);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // useEffect to combine and sort all data sources into feedItems
  useEffect(() => {
    const allFeedItems: FeedItem[] = [];
    const uniqueIds = new Set<string>();

    // 1. Add Completed Competitions with their results
    completedCompetitions.forEach(comp => {
      if (uniqueIds.has(comp._id)) return;
      const results = completedResults[comp._id] || [];
      const userSubs = results.filter(sub => String(sub.user?._id) === userId);

      allFeedItems.push({
        id: comp._id,
        type: 'competition_completed_results',
        sortDate: comp.updatedAt || comp.endDate,
        data: comp,
        userSubmissions: userSubs,
        allRankedSubmissions: results,
      });
      uniqueIds.add(comp._id);
    });

    // 2. Add Voting Competitions
    votingCompetitions.forEach(comp => {
      if (uniqueIds.has(comp._id)) return;
      allFeedItems.push({
        id: comp._id,
        type: 'competition_voting',
        sortDate: comp.updatedAt || comp.startDate,
        data: comp,
      });
      uniqueIds.add(comp._id);
    });

    // 3. Add Active and Upcoming Competitions (from the general 'competitions' state)
    competitions.forEach(comp => {
      if (uniqueIds.has(comp._id)) return;
      
      // Fix sorting order issue by prioritizing various dates correctly
      let sortDateToUse;
      
      if (comp.status === 'active') {
        // For active competitions, use updatedAt or startDate
        sortDateToUse = comp.updatedAt || comp.startDate;
      } else if (comp.status === 'upcoming') {
        // For upcoming competitions, prioritize createdAt over startDate 
        // to ensure new competitions appear at the top
        sortDateToUse = comp.createdAt || new Date().toISOString();
      } else {
        // Default fallback
        sortDateToUse = comp.updatedAt || comp.startDate;
      }
      
      allFeedItems.push({
        id: comp._id,
        type: comp.status === 'active' ? 'competition_active' : 'competition_upcoming',
        sortDate: sortDateToUse,
        data: comp,
      });
      uniqueIds.add(comp._id);
    });

    // 4. Add Activities
    console.log('Adding activities to feed, total:', activities.length);
    
    if (activities.length === 0) {
      console.warn('No activities found to add to feed!');
    }
    
    // Count by type before adding
    const typeCounts = activities.reduce((acc: Record<string, number>, act) => {
      acc[act.type] = (acc[act.type] || 0) + 1;
      return acc;
    }, {});
    console.log('Activity types to add:', typeCounts);
    
    activities.forEach(activity => {
      // Debug this specific activity
      console.log(`Adding activity to feed: ${activity.type} - "${activity.title}" (dated: ${activity.date})`);
      
      // Generate a unique id for this activity to avoid duplicates
      const activityId = activity._id || (activity.competitionId ? `${activity.competitionId}-${activity.type}` : `activity-${activity.title}-${activity.date}`);
      
      // Skip if we've already added an item with this ID (avoid duplicates)
      if (uniqueIds.has(activityId)) {
        console.log(`Skipping duplicate activity: ${activityId}`);
        return;
      }
      
      // Make sure all activities get properly added to the feed
         allFeedItems.push({
        id: activityId, 
            type: 'activity',
            sortDate: activity.date,
            data: activity,
          });
      uniqueIds.add(activityId);
    });
    
    console.log(`After adding activities, allFeedItems has ${allFeedItems.length} items`);

    // Sort all feed items by sortDate descending
    allFeedItems.sort((a, b) => {
      // Ensure we have valid date objects by checking and converting as needed
      const dateA = a.sortDate ? new Date(a.sortDate).getTime() : 0;
      const dateB = b.sortDate ? new Date(b.sortDate).getTime() : 0;
      
      // Return newest first (descending order)
      return dateB - dateA;
    });

    // Log final sorted order of feed items
    console.log('Final feed items order (first 5):', 
      allFeedItems.slice(0, 5).map(item => ({
        id: item.id,
        type: item.type,
        title: item.type.startsWith('competition') ? (item.data as Competition).title : 'activity',
        sortDate: item.sortDate,
        normalizedDate: new Date(item.sortDate).toISOString(),
        timestamp: new Date(item.sortDate).getTime()
      }))
    );

    setFeedItems(allFeedItems);

  }, [competitions, votingCompetitions, completedCompetitions, completedResults, activities, session]);

  // Add effect to load hidden items from localStorage on initial load
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedHiddenItems = localStorage.getItem('hiddenFeedItems');
      if (savedHiddenItems) {
        try {
          const parsedItems = JSON.parse(savedHiddenItems);
          setHiddenFeedItems(new Set(parsedItems));
        } catch (e) {
          console.error('Failed to parse hidden feed items from localStorage:', e);
        }
      }
    }
  }, []);

  // Add effect to save hidden items to localStorage when they change
  useEffect(() => {
    // Only run on client side and when hiddenFeedItems has been initialized
    if (typeof window !== 'undefined' && hiddenFeedItems.size > 0) {
      localStorage.setItem('hiddenFeedItems', JSON.stringify(Array.from(hiddenFeedItems)));
    }
  }, [hiddenFeedItems]);

  useEffect(() => {
    if (status === 'authenticated') {
      // Only fetch the dashboard data when authenticated
      fetchDashboardData();
      fetchVotingCompetitions();
      fetchCompletedCompetitions();
      fetchAppSettings(); // Add this line to fetch app settings when the component mounts
    }
  }, [status]);

  // Add new hook to handle pagination correctly
  useEffect(() => {
    if (activitiesPage > 1 && !activitiesLoading) {
      fetchActivities(activitiesPage);
    }
  }, [activitiesPage]);

  // Create a helper function to load more activities
  const loadMoreActivities = () => {
    if (!activitiesHasMore || activitiesLoading) return;
    setActivitiesPage(prev => prev + 1);
  };

  // Fetch results for each completed competition
  useEffect(() => {
    if (completedCompetitions.length === 0) return;
    completedCompetitions.forEach(async (comp) => {
      if (completedResults[comp._id]) return; // Already fetched
      try {
        // Fetch ALL approved submissions for this competition to ensure correct user ranking
        const res = await fetch(`/api/submissions?competition=${comp._id}&status=approved&showAll=true&limit=1000`);
        if (!res.ok) {
          // Log error if fetch fails, especially for Munroe Island
          if (comp.title === 'Munroe Island') {
            console.error(`[DEBUG] Failed to fetch submissions for Munroe Island. Status: ${res.status}`);
          }
          return;
        }
        const data = await res.json();
        // Log the fetched data specifically for Munroe Island before setting state
        if (comp.title === 'Munroe Island') {
          console.log('[DEBUG] Fetched submissions for Munroe Island:', JSON.stringify(data.data, null, 2));
          // Specifically log if prabi cdat is in this data
          const prabiCdatSubmission = data.data?.find((s: any) => s.user?.name === 'prabi cdat' || s.user?._id === '681c5872cb7eb5b3d36afe6b');
          console.log('[DEBUG] Is prabi cdat in Munroe Island fetched data?:', prabiCdatSubmission ? 'YES' : 'NO', prabiCdatSubmission);
        }
        const sorted = (data.data || []).sort((a: Submission, b: Submission) => {
          if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        });
        setCompletedResults(prev => ({ ...prev, [comp._id]: sorted }));
      } catch (err) {
        if (comp.title === 'Munroe Island') {
          console.error('[DEBUG] Error during fetch or processing for Munroe Island:', err);
        }
      }
    });
  }, [completedCompetitions]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch user stats
      const statsRes = await fetch('/api/users/stats');
      if (!statsRes.ok) {
        throw new Error('Failed to load user statistics');
      }
      
      // Fetch active competitions
      const competitionsRes = await fetch('/api/competitions?limit=10&status=active,upcoming');
      if (!competitionsRes.ok) {
        throw new Error('Failed to load competitions');
      }
      
      // Fetch recent activities - use page 1 to ensure proper pagination
      const activitiesRes = await fetch('/api/users/activities?page=1&limit=20');
      if (!activitiesRes.ok) {
        throw new Error('Failed to load recent activities');
      }
      
      const statsData = await statsRes.json();
      const competitionsData = await competitionsRes.json();
      const activitiesData = await activitiesRes.json();
      
      setStats(statsData.data || {
        totalSubmissions: 0,
        photosRated: 0,
        badgesEarned: 0,
        competitionsEntered: 0,
        competitionsWon: 0,
      });
      setCompetitions(competitionsData.data || []);
      setActivities(activitiesData.data || []);
      setActivitiesHasMore((activitiesData.data?.length || 0) === 20);
      setActivitiesPage(1);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVotingCompetitions = async () => {
    try {
      // Fetch competitions the user participated in that are now in voting
      const res = await fetch('/api/competitions?participated=true&status=voting');
      if (!res.ok) return;
      const data = await res.json();
      setVotingCompetitions(data.data || []);
    } catch (err) {
      setVotingCompetitions([]);
    }
  };

  const fetchCompletedCompetitions = async () => {
    try {
      const res = await fetch('/api/competitions?participated=true&status=completed');
      if (!res.ok) return;
      const data = await res.json();
      setCompletedCompetitions(data.data || []);
    } catch (err) {
      setCompletedCompetitions([]);
    }
  };

  // Add function to hide a feed item
  const hideFeedItem = (itemId: string) => {
    // Only allow deletion if the setting is enabled
    if (!appSettings.allowNotificationDeletion) {
      console.log('Notification deletion is disabled by administrator');
      return;
    }
    
    // Update the set of hidden feed items
    setHiddenFeedItems(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      return newSet;
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'voting': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'rating':
        return (
          <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      case 'badge':
        return (
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        );
      case 'win':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
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

  // Add admin redirect check
  useEffect(() => {
    // Check if user is admin and redirect to admin dashboard
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      console.log('User is admin, redirecting to admin dashboard');
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d5c]"></div>
      </div>
    );
  }

  // Highlights/Stories Row
  const highlights = [
    {
      label: 'Submissions',
      value: stats.totalSubmissions,
      icon: <svg className="w-7 h-7" fill="none" stroke="#1a4d5c" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
      color: 'bg-white border-2 border-[#1a4d5c] text-[#1a4d5c]'
    },
    {
      label: 'Photos Rated',
      value: stats.photosRated,
      icon: <svg className="w-7 h-7" fill="none" stroke="#2699a6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>,
      color: 'bg-white border-2 border-[#2699a6] text-[#2699a6]'
    },
    {
      label: 'Badges',
      value: stats.badgesEarned,
      icon: <svg className="w-7 h-7" fill="none" stroke="#e0c36a" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" /></svg>,
      color: 'bg-white border-2 border-[#e0c36a] text-[#e0c36a]'
    },
    {
      label: 'Competitions',
      value: stats.competitionsEntered,
      icon: <svg className="w-7 h-7" fill="none" stroke="#1a4d5c" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg>,
      color: 'bg-white border-2 border-[#1a4d5c] text-[#1a4d5c]'
    },
    {
      label: 'Wins',
      value: stats.competitionsWon,
      icon: <svg className="w-7 h-7" fill="none" stroke="#2699a6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m0 0l-3-3m3 3l3-3" /></svg>,
      color: 'bg-white border-2 border-[#2699a6] text-[#2699a6]'
    },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full px-2 py-4 md:py-8">
      {/* Highlights Row */}
      <div className="flex w-full justify-between items-center mb-6">
        {highlights.map((h, i) => (
          <div key={h.label} className="flex flex-col items-center flex-1 min-w-0 mx-1">
            <button
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-full shadow-md transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#e0c36a] ${h.color}`}
              style={{ flex: '0 0 auto' }}
            >
              <div className="flex items-center justify-center w-5 h-5 mb-1">
                {h.icon}
              </div>
              {h.value !== undefined && <span className="font-bold text-xs leading-none">{h.value}</span>}
            </button>
            <span className="text-xs mt-2 font-medium text-center whitespace-nowrap truncate w-full">{h.label}</span>
          </div>
        ))}
      </div>
      {/* Tabs */}      
      <div className="flex justify-between items-center border-b border-gray-200 mb-4">        
        {['feed', 'competitions'].map(tab => (          
          <button            
            key={tab}            
            onClick={() => setActiveTab(tab as any)}            
            className={`flex-1 py-2 text-center font-semibold capitalize transition border-b-2 ${activeTab === tab ? 'border-[#1a4d5c] text-[#1a4d5c]' : 'border-transparent text-gray-400'}`}          
          >            
            {tab}          
          </button>        
        ))}      
      </div>
      {/* Feed Content */}
      <div>
        {activeTab === 'feed' && (
          <>
            <div className="grid gap-6 grid-cols-1"> {/* Changed to always be grid-cols-1 */}
              {(() => {
                // This code only runs if activeTab === 'feed'
                
                // DEBUG: Check the raw activities we have
                console.log('Raw activities available:', 
                  activities.map(a => ({
                    id: a._id,
                    type: a.type,
                    title: a.title,
                    hasPhotoUrl: !!a.photoUrl
                  }))
                );
                
                const filteredFeedItems = feedItems.filter(item => {
                  // Always include all competition-related items
                  if (item.type === 'competition_voting') return true;
                  if (item.type === 'competition_completed_results') return true;
                  if (item.type === 'competition_active') return true;
                  if (item.type === 'competition_upcoming') return true;

                  // Include all activity items EXCEPT ratings
                  // Debug each activity item to understand what's happening
                  if (item.type === 'activity') {
                    const activityData = item.data as RecentActivity;
                    console.log('Activity filter check:', {
                      id: activityData._id,
                      type: activityData.type,
                      title: activityData.title,
                      date: activityData.date ? formatTimeSince(new Date(activityData.date)) : 'unknown'
                    });
                    
                    // Only exclude rating activities
                    if (activityData.type === 'rating') {
                      return false;
                    }
                    
                    // Include all important activities
                    return true;
                  }
                  
                  // Include any notification or result type items
                  if (item.type === 'notification' || item.type === 'result') {
                    return true;
                  }
                  
                  return false;
                });

                // Debug the filtered feed items
                console.log('Filtered Feed Items:', 
                  filteredFeedItems.map(item => ({
                    type: item.type,
                    dataType: item.type === 'activity' ? (item.data as any).type : null,
                    title: item.type === 'activity' ? (item.data as any).title : null
                  }))
                );

                if (filteredFeedItems.length === 0 && !isLoading) {
                  return (
                    <div className="col-span-full text-center py-10">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No relevant feed items</h3>
                      <p className="mt-1 text-sm text-gray-500">Your feed is currently empty or contains no items matching the display criteria (latest competitions, voting, results, submissions, badges, wins).</p>
                    </div>
                  );
                }

                // SPECIAL HANDLING: Add direct rendering of all activities to ensure they show up
                // Use this if the regular filtering mechanism isn't working
                const importantActivities = activities.filter(activity => {
                  // Exclude rating activities
                  if (activity.type === 'rating') {
                    return false;
                  }
                  
                  // Always include these important activity types
                  return activity.type === 'notification' || 
                         activity.type === 'submission' || 
                         activity.type === 'badge' || 
                         activity.type === 'win' ||
                         activity.type === 'result';
                });
                
                console.log(`Found ${importantActivities.length} important activities to directly render`, 
                  importantActivities.map(a => ({ 
                    type: a.type, 
                    title: a.title,
                    date: formatTimeSince(new Date(a.date))
                  })));
                
                // Define proper type for feed content items
                type FeedContentItem = 
                  | { id: string; date: Date; item: FeedItem; activity?: undefined }
                  | { id: string; date: Date; activity: RecentActivity; item?: undefined };
                
                const feedContent: FeedContentItem[] = [];
                
                // Get all competition IDs currently displayed in the feed
                const displayedCompetitionIds = new Set<string>();
                
                // Track activities we've already added to prevent duplicates
                const addedActivitySignatures = new Set<string>();
                
                // First add all the competition items and track their IDs
                filteredFeedItems.forEach(item => {
                  if (item.type.startsWith('competition_')) {
                    const itemDate = new Date(item.sortDate);
                    feedContent.push({
                      id: item.id,
                      date: itemDate,
                      item: item
                    });
                    
                    // Keep track of competition IDs
                    displayedCompetitionIds.add(item.id);
                  }
                });
                
                // Then add all the direct activity items, EVEN if they're related to completed competitions
                importantActivities.forEach(activity => {
                  // We want to include all important activities regardless of their competitionId
                  const activityDate = activity.date ? new Date(activity.date) : new Date();
                  
                  // Ensure we have a valid date (fallback to current timestamp if invalid)
                  const isValidDate = !isNaN(activityDate.getTime());
                  const finalDate = isValidDate ? activityDate : new Date();
                  
                  // Create a signature to detect duplicates - include competition ID if present
                  // For win activities, use competitionId+type+position to detect duplicate win notifications
                  let activitySignature = '';
                  if (activity.type === 'win' && activity.competitionId) {
                    // Extract position information from the title (1st/2nd/3rd place)
                    const positionMatch = activity.title.match(/Won|Runner-up|Third place/);
                    const position = positionMatch ? positionMatch[0] : '';
                    activitySignature = `${activity.competitionId}-${activity.type}-${position}`;
                  } else if (activity.type === 'notification' && (activity.title === 'Photo Approved' || activity.title === 'Photo Not Approved') && activity.competitionId) {
                    // For photo approvals, include the photo ID in the signature to distinguish different approvals
                    // Extract the photo ID from the details or use the activity ID if not available
                    activitySignature = `${activity.competitionId}-${activity.type}-${activity._id}`;
                  } else if (activity.competitionId) {
                    activitySignature = `${activity.competitionId}-${activity.type}`;
                  } else {
                    activitySignature = `${activity._id}-${activity.type}`;
                  }
                  
                  // Skip if we've already added this activity
                  if (addedActivitySignatures.has(activitySignature)) {
                    console.log(`Skipping duplicate activity: ${activity.type} - "${activity.title}" (signature: ${activitySignature})`);
                    return;
                  }
                  
                  // Log each activity being added to help debug
                  console.log(`Adding activity to feed content: ${activity.type} - "${activity.title}"${activity.competitionId ? ` (Competition: ${activity.competitionId})` : ''} (signature: ${activitySignature})`)
                  
                  feedContent.push({
                    id: activity._id,
                    date: finalDate,
                    activity: activity
                  });
                  
                  // Add to tracked signatures
                  addedActivitySignatures.add(activitySignature);
                });
                
                // Sort everything by date - ensure newest first
                feedContent.sort((a, b) => {
                  // Ensure valid date objects by safely getting timestamps
                  const dateA = a.date instanceof Date ? a.date.getTime() : 0;
                  const dateB = b.date instanceof Date ? b.date.getTime() : 0;
                  
                  // Return newest first (descending order)
                  return dateB - dateA;
                });
                
                // Log the sorted feed content for debugging
                console.log('Sorted feed content items (first 5):', 
                  feedContent.slice(0, 5).map(content => ({
                    id: content.id,
                    type: content.item?.type || (content.activity?.type || 'unknown'),
                    title: content.item 
                      ? (content.item.type.startsWith('competition') 
                          ? (content.item.data as Competition).title 
                          : 'activity item') 
                      : (content.activity?.title || 'unknown activity'),
                    date: content.date.toISOString(),
                    timestamp: content.date.getTime()
                  }))
                );
                
                // Filter out hidden items
                const visibleFeedContent = feedContent.filter(content => 
                  !hiddenFeedItems.has(content.id)
                );
                
                return visibleFeedContent.map(content => {
                  if (content.item) {
                    // This is a filtered feed item (competition)
                    const item = content.item;
                    
                    switch (item.type) {
                      case 'competition_completed_results':
                        const compData = item.data as Competition; // Use compData for item.data
                        const allSubmissionsForRank = item.allRankedSubmissions || [];
                        const userSubmissions = item.userSubmissions || [];
                        // const userId = session?.user?.id; // Already available if needed from outer scope, or use item.userSubmissions directly

                        // If no results at all, show a simplified card (similar to original feed item)
                        if (allSubmissionsForRank.length === 0) {
                          return (
                            <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col p-4 mb-4 relative">
                              {/* Delete Button - Only show if allowed by settings */}
                              {appSettings.allowNotificationDeletion && (
                                <button 
                                  onClick={() => hideFeedItem(item.id)} 
                                  className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                  aria-label="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                              
                              <div className="flex-1">
                                <div className="font-bold text-lg text-[#1a4d5c] mb-1">Competition Completed: {compData.title}</div>
                                <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(new Date(item.sortDate))}</p>
                                <div className="text-sm text-gray-700 mb-2">The competition you participated in has ended. Results are being processed or are not available.</div>
                                <Link 
                                  href={`/dashboard/competitions/${compData._id}/view-submissions?result=1`}
                                  className="mt-3 inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                                >
                                  View Full Results
                                </Link>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(item.id)} 
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            
                            <div className="relative w-32 h-24 mr-4 flex-shrink-0">
                              {compData.coverImage ? (
                                <Image src={compData.coverImage} alt={compData.title} fill className="object-cover rounded-lg" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1"> {/* Changed from flex-grow md:mt-0 */}
                              <div className="font-bold text-lg text-[#1a4d5c] mb-1">Competition Completed: {compData.title}</div>
                              <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(new Date(item.sortDate))}</p>
                              <div className="text-sm text-gray-700 mb-2">The competition you participated in has ended.</div>
                              
                              {userSubmissions.length > 0 ? (
                                <div className="mt-2">
                                  <div className="font-semibold text-sm text-[#1a4d5c] mb-1">Your Result{userSubmissions.length > 1 ? 's' : ''}:</div>
                                  <div className="flex flex-wrap gap-4">
                                    {userSubmissions.map((sub) => {
                                      let actualDenseRank = 0;
                                      let lastAvgRating = -Infinity;
                                      let lastRatingCount = -Infinity;
                                      for (let i = 0; i < allSubmissionsForRank.length; i++) {
                                        const currentResultSub = allSubmissionsForRank[i];
                                        if (currentResultSub.averageRating !== lastAvgRating || (currentResultSub.ratingCount || 0) !== lastRatingCount) {
                                          actualDenseRank++;
                                        }
                                        if (currentResultSub._id === sub._id) {
                                          break;
                                        }
                                        lastAvgRating = currentResultSub.averageRating;
                                        lastRatingCount = (currentResultSub.ratingCount || 0);
                                      }

                                      let badgeIcon: React.ReactNode = null;
                                      let badgeText = '';
                                      let badgeColor = 'bg-gray-700';

                                      if (actualDenseRank === 1) { 
                                        badgeIcon = <span className="mr-1">🥇</span>; badgeText = '1st'; badgeColor = 'bg-yellow-400'; 
                                      } else if (actualDenseRank === 2) { 
                                        badgeIcon = <span className="mr-1">🥈</span>; badgeText = '2nd'; badgeColor = 'bg-gray-300'; 
                                      } else if (actualDenseRank === 3) { 
                                        badgeIcon = <span className="mr-1">🥉</span>; badgeText = '3rd'; badgeColor = 'bg-orange-400'; 
                                      } else {
                                        if (actualDenseRank > 0) {
                                           if (actualDenseRank % 100 >= 11 && actualDenseRank % 100 <= 13) {
                                             badgeText = `${actualDenseRank}th`;
                                           } else {
                                             switch (actualDenseRank % 10) {
                                               case 1: badgeText = `${actualDenseRank}st`; break;
                                               case 2: badgeText = `${actualDenseRank}nd`; break;
                                               case 3: badgeText = `${actualDenseRank}rd`; break;
                                               default: badgeText = `${actualDenseRank}th`; break;
                                             }
                                           }
                                        } else {
                                           badgeText = 'N/A'; 
                                        }
                                      }
                                      
                                      return (
                                        <div key={sub._id} className="flex flex-col items-center w-24">
                                          <div className="relative w-20 h-16 mb-1">
                                            <Image src={sub.thumbnailUrl || sub.imageUrl} alt={sub.title} fill className="object-cover rounded" />
                                          </div>
                                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${badgeColor}`}>
                                            {badgeIcon}
                                            {badgeText} Rank
                                          </span>
                                          <span className="text-xs text-gray-500 mt-1">{sub.averageRating?.toFixed(1) ?? '0.0'} pts</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-700 mt-2">You did not participate or your submission was not ranked.</div>
                              )}
                              <Link 
                                href={`/dashboard/competitions/${compData._id}/view-submissions?result=1`}
                                className="mt-3 inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                              >
                                View Full Results
                              </Link>
                            </div>
                          </div>
                        );

                      case 'competition_voting':
                        const votingComp = item.data as Competition;
                        return (
                          <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-yellow-50 border-l-4 border-yellow-400 flex flex-col md:flex-row items-center p-4 mb-4 relative">
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(item.id)} 
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            
                            <div className="relative w-full md:w-32 h-24 md:mr-4 mb-3 md:mb-0 flex-shrink-0">
                              <Image src={votingComp.coverImage || '/default-cover.jpg'} alt={votingComp.title} fill className="object-cover rounded-lg" />
                            </div>
                            <div className="flex-1 text-left w-full">
                              <div className="font-bold text-lg text-[#1a4d5c] mb-1">Voting Open: {votingComp.title}</div>
                              {/* Use item.sortDate for the timestamp */}
                              <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(new Date(item.sortDate))}</p>
                              <div className="text-sm text-gray-700 mb-2">Voting is now open for a competition you participated in! Cast your vote for your favorite photos.</div>
                              <Link 
                                href={`/dashboard/competitions/${votingComp._id}/view-submissions`}
                                className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                              >
                                Vote Now
                              </Link>
                            </div>
                          </div>
                        );
                      
                      case 'competition_active':
                      case 'competition_upcoming':
                        const activeComp = item.data as Competition;
                        
                        // Improve timestamp handling
                        let displayTimestamp;
                        if (activeComp.status === 'upcoming') {
                          // For upcoming competitions, prioritize the creation date to show "added X minutes ago"
                          displayTimestamp = (activeComp as any).createdAt || item.sortDate;
                        } else {
                          // For active competitions, use the most recent modification time
                          displayTimestamp = (activeComp as any).updatedAt || activeComp.startDate;
                        }
                        
                        return (
                          <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-sky-50 border-l-4 border-sky-400 flex flex-col md:flex-row items-start p-4 mb-4 group relative">
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(item.id)} 
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
                              {activeComp.coverImage ? (
                                <Image 
                                  src={activeComp.coverImage} 
                                  alt={activeComp.title} 
                                  fill 
                                  className="object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
                                  <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                              )}
                            </div>
                            {/* Details Container */}
                            <div className="w-full md:w-3/5 flex flex-col">
                              <div className="flex-grow">
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="text-lg font-bold text-[#1a4d5c] truncate" title={activeComp.title}>{activeComp.title}</h3>
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeColor(activeComp.status)}`}>
                                    {activeComp.status.charAt(0).toUpperCase() + activeComp.status.slice(1)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(new Date(displayTimestamp))}</p>
                                <p className="text-sm text-gray-600 mb-1">Theme: {activeComp.theme}</p>
                                <p className="text-sm text-gray-500 mb-2">
                                  {activeComp.status === 'upcoming' ? `Starts: ${new Date(activeComp.startDate).toLocaleDateString()}` : `Ends: ${new Date(activeComp.endDate).toLocaleDateString()}`}
                                </p>
                              </div>
                              <div className="mt-auto flex justify-between items-center">
                                <p className="text-sm text-gray-500">{activeComp.submissionCount || 0} submissions</p>
                                <Link 
                                  href={`/dashboard/competitions/${activeComp._id}`}
                                  className="inline-block px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition text-xs md:text-sm"
                                >
                                  {activeComp.status === 'upcoming' ? 'View Details' : 'View & Submit'}
                                </Link>
                              </div>
                            </div>
                          </div>
                        );

                        default:
                          return null;
                      }
                    } else if (content.activity) {
                      // This is a direct activity
                      const activity = content.activity;
                      const activityDate = new Date(activity.date);
                      const timeSince = formatTimeSince(activityDate);
                      
                      // Special case for image submissions
                      if (activity.type === 'submission' || activity.title?.includes('Submitted photo')) {
                        return (
                          <div key={activity._id} className="bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500 mb-4 relative">
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(content.id)} 
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            
                            <div className="flex items-start space-x-3">
                              {/* Image thumbnail */}
                              {activity.photoUrl && (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                                  <img 
                                    src={activity.photoUrl}
                                    alt="Submitted photo"
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
                                  <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 mr-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                                </div>
                                <p className="text-xs text-gray-500">{activity.details}</p>
                                <p className="text-xs text-gray-400 mt-0.5 mb-2">{timeSince}</p>
                                
                                {activity.competitionId && (
                                  <div className="flex justify-end mt-1">
                                    <Link 
                                      href={`/dashboard/competitions/${activity.competitionId}`} 
                                      className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 rounded-md px-2 py-1 border border-teal-100 font-medium"
                                    >
                                      View Competition
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Special case for Photo Approved/Rejected notifications
                      if (activity.type === 'notification' && 
                          (activity.title === 'Photo Approved' || 
                           activity.title?.includes('approved') || 
                           activity.title === 'Photo Rejected' || 
                           activity.title?.includes('rejected'))) {
                        
                        // Debug to see exactly what URLs we're receiving
                        console.log('RENDERING PHOTO APPROVAL NOTIFICATION:', {
                          id: activity._id,
                          title: activity.title,
                          hasPhotoUrl: !!activity.photoUrl,
                          photoUrl: activity.photoUrl || 'none',
                          photoUrlType: activity.photoUrl ? typeof activity.photoUrl : 'N/A',
                          photoUrlIsValidString: activity.photoUrl ? typeof activity.photoUrl === 'string' : false,
                          photoUrlPrefix: activity.photoUrl ? activity.photoUrl.substring(0, 50) : 'none',
                          details: activity.details,
                          competitionId: activity.competitionId
                        });
                        
                        const borderColorClass = activity.title?.includes('Rejected') ? 
                                                'border-red-500' : 'border-green-500';
                        
                        // Generate a unique key for debugging
                        const debugKey = `notification-${activity._id || Math.random().toString(36).substring(2, 9)}`;
                        
                        // Extract photo details from the notification message
                        const photoTitleMatch = activity.details?.match(/photo "(.*?)"/);
                        const photoTitle = photoTitleMatch ? photoTitleMatch[1] : 'photo';
                        
                        return (
                          <div key={activity._id} className={`bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 ${borderColorClass} mb-4 relative`} id={debugKey}>
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(content.id)} 
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            
                            <div className="flex items-start space-x-3">
                              {/* Left side - Image thumbnail - Force show image if photoUrl exists */}
                              {activity.photoUrl ? (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                                  <img 
                                    src={activity.photoUrl}
                                    alt={photoTitle}
                                    className="w-full h-full object-cover"
                                    onLoad={() => console.log(`Image loaded successfully for ${debugKey}`)}
                                    onError={(e) => {
                                      console.error(`Image failed to load for ${debugKey}:`, {
                                        src: e.currentTarget.src,
                                        element: debugKey
                                      });
                                      // Don't set a fallback - leave the broken image
                                      // e.currentTarget.src = 'https://picsum.photos/300/200';
                                    }}
                                  />
                                </div>
                              ) : (
                                // Show fallback if no photo URL
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center">
                                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}

                              {/* Right side - Notification content */}
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <div className={`p-1.5 rounded-full ${activity.title?.includes('Rejected') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} mr-2`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      {activity.title?.includes('Rejected') 
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      }
                                    </svg>
                                  </div>
                                  <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                                </div>
                                <p className="text-xs text-gray-500">{activity.details}</p>
                                <p className="text-xs text-gray-400 mt-0.5 mb-2">{timeSince}</p>
                                
                                {activity.competitionId && (
                                  <div className="flex justify-end mt-1">
                                    <Link 
                                      href={`/dashboard/competitions/${activity.competitionId}`} 
                                      className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 rounded-md px-2 py-1 border border-teal-100 font-medium"
                                    >
                                      View Competition
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Special case for Competition Results and win notifications
                      if ((activity.type === 'result' || activity.type === 'notification') && 
                          (activity.title === 'Competition Results' || 
                           activity.title?.includes('Congratulations') || 
                           activity.title?.includes('Won') || 
                           activity.title?.includes('Results') ||
                           activity.title?.includes('Place'))) {
                        
                        // Determine appropriate styling based on placement
                        let borderColor = 'border-blue-400';
                        let bgColor = 'bg-blue-50';
                        let iconBg = 'bg-blue-100';
                        let iconColor = 'text-blue-600';
                        
                        // Check if it's a winning notification
                        if (activity.title?.includes('Won') || activity.title?.includes('1st') || activity.title?.includes('First')) {
                          borderColor = 'border-yellow-400';
                          bgColor = 'bg-yellow-50';
                          iconBg = 'bg-yellow-100';
                          iconColor = 'text-yellow-600';
                        } else if (activity.title?.includes('Second') || activity.title?.includes('2nd')) {
                          borderColor = 'border-gray-400';
                          bgColor = 'bg-gray-50';
                          iconBg = 'bg-gray-200';
                          iconColor = 'text-gray-600';
                        } else if (activity.title?.includes('Third') || activity.title?.includes('3rd')) {
                          borderColor = 'border-orange-400';
                          bgColor = 'bg-orange-50';
                          iconBg = 'bg-orange-100';
                          iconColor = 'text-orange-600';
                        }
                        
                        return (
                          <div key={activity._id} className={`p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 ${borderColor} mb-4 ${bgColor} relative`}>
                            {/* Delete Button - Only show if allowed by settings */}
                            {appSettings.allowNotificationDeletion && (
                              <button 
                                onClick={() => hideFeedItem(content.id)} 
                                className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${iconBg} ${iconColor}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                                <p className="text-xs text-gray-500">{activity.details}</p>
                                <p className="text-xs text-gray-400 mt-0.5 mb-1">{timeSince}</p>
                                
                                {activity.photoUrl && (
                                  <div className="mt-2 w-full max-w-xs rounded-md overflow-hidden mb-2">
                                    <img 
                                      src={activity.photoUrl} 
                                      alt="Competition result" 
                                      className="w-full h-auto object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://picsum.photos/300/200';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {activity.competitionId && (
                                  <div className="flex justify-end mt-1">
                                    <Link 
                                      href={`/dashboard/competitions/${activity.competitionId}/view-submissions?result=1`}
                                      className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 rounded-md px-2 py-1 border border-teal-100 font-medium"
                                    >
                                      View Results
                                    </Link>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      // Any other activity types
                      return (
                        <div key={activity._id} className="bg-white p-3 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-400 mb-4 relative">
                          {/* Delete Button - Only show if allowed by settings */}
                          {appSettings.allowNotificationDeletion && (
                            <button 
                              onClick={() => hideFeedItem(content.id)} 
                              className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 opacity-60 hover:opacity-100 transition-opacity"
                              aria-label="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-full bg-teal-100 text-teal-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10m6 0V4" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.details}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{timeSince}</p>
                              
                              {activity.photoUrl && (
                                <div className="mt-2 w-full max-w-xs rounded-md overflow-hidden">
                                  <img 
                                    src={activity.photoUrl} 
                                    alt="Notification image"
                                    className="w-full h-auto object-cover" 
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://picsum.photos/300/200';
                                    }}
                                  />
                                </div>
                              )}
                              
                              {activity.competitionId && (
                                <div className="mt-2">
                                  <Link 
                                    href={`/dashboard/competitions/${activity.competitionId}`} 
                                    className="text-xs text-teal-600 hover:text-teal-700 bg-teal-50 rounded-md px-2 py-1 border border-teal-100 font-medium"
                                  >
                                    View Competition
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  });
                })()}
              </div>
            </>
          )}
        {activeTab === 'competitions' && (
          <>
            {/* Column Toggle for Desktop */}
            <div className="hidden md:flex justify-end mb-2">
              <button
                onClick={() => setCompetitionsColumns(competitionsColumns === 2 ? 1 : 2)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-[#1a4d5c] bg-white hover:bg-gray-50 shadow-sm transition"
                aria-label="Toggle competitions columns"
              >
                {competitionsColumns === 2 ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20"><rect x="2" y="2" width="6" height="6" rx="1" strokeWidth="1.5"/><rect x="12" y="2" width="6" height="6" rx="1" strokeWidth="1.5"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" rx="2" strokeWidth="1.5"/></svg>
                )}
              </button>
            </div>
            <div className={`grid grid-cols-1 ${competitionsColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
              {competitions.map((comp) => (
                <div key={comp._id} className="bg-white rounded-2xl shadow p-0 overflow-hidden flex flex-col border border-gray-200">
                  {/* Banner Image */}
                  <div className="relative w-full aspect-[4/3] bg-gray-100">
                    <Image src={comp.coverImage || '/default-cover.jpg'} alt={comp.title} fill className="object-cover" />
                    {/* Status Badge */}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow ${getStatusBadgeColor(comp.status)}`}>{comp.status.charAt(0).toUpperCase() + comp.status.slice(1)}</span>
                  </div>
                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="font-bold text-lg mb-1 text-gray-900">{comp.title}</div>
                    <div className="text-gray-500 text-sm mb-3 line-clamp-2">{comp.theme}</div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Ends: {new Date(comp.endDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0021 6.382V5a2 2 0 00-2-2H5a2 2 0 00-2 2v1.382a2 2 0 001.447 1.342L9 10m6 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V10m6 0V4" /></svg> {comp.submissionCount || 0} submissions</span>
                    </div>
                    <Link href={`/dashboard/competitions/${comp._id}`} className="mt-auto inline-block w-full text-center px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition">Submit Photo</Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
                {/* Activity tab removed as requested */}
      </div>
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e0c36a] flex justify-around items-center py-2 md:hidden">
        <Link href="/dashboard" className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-xs">Feed</span>
        </Link>
        <Link href="/dashboard/competitions" className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg>
          <span className="text-xs">Competitions</span>
        </Link>
        <Link href="/dashboard/submissions" className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="text-xs">Submissions</span>
        </Link>
        <Link href="/dashboard/profile" className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  );
} 