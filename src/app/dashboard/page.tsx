'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

// Helper function to format time since a date
function formatTimeSince(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  if (seconds < 10) return "just now";
  return Math.floor(seconds) + " seconds ago";
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
  type: 'submission' | 'rating' | 'badge' | 'win';
  title: string;
  date: string;
  details?: string;
  photoUrl?: string;
  competitionId?: string;
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
  type: 'activity';
  data: RecentActivity; // Original activity data
}

export type FeedItem = CompetitionFeedItem | ActivityFeedItem;

export default function DashboardPage() {
  const { data: session, status } = useSession();
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
  const [activeTab, setActiveTab] = useState<'feed' | 'competitions' | 'activity'>('feed');
  const [feedColumns, setFeedColumns] = useState<1 | 2>(2);
  const [competitionsColumns, setCompetitionsColumns] = useState<1 | 2>(2);
  const [votingCompetitions, setVotingCompetitions] = useState<Competition[]>([]);
  const [completedCompetitions, setCompletedCompetitions] = useState<Competition[]>([]);
  const [completedResults, setCompletedResults] = useState<Record<string, Submission[]>>({});
  const router = useRouter();

  // New state for combined and sorted feed items
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const fetchActivities = async (page = 1) => {
    setActivitiesLoading(true);
    try {
      const res = await fetch(`/api/users/activities?page=${page}&limit=10`);
      if (!res.ok) throw new Error('Failed to load recent activities');
      const data = await res.json();
      if (page === 1) {
        setActivities(data.data || []);
      } else {
        setActivities(prev => [...prev, ...(data.data || [])]);
      }
      setActivitiesHasMore((data.data?.length || 0) === 10);
    } catch (err) {
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
      const userId = session?.user?.id;
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
      let sortDateToUse = comp.startDate; // Default for upcoming
      if (comp.status === 'active') {
        sortDateToUse = comp.updatedAt || comp.startDate; // Prioritize updatedAt for active
      } else if (comp.status === 'upcoming') {
        // Optional: use createdAt if preferred for upcoming, otherwise startDate is fine
        // sortDateToUse = comp.createdAt || comp.startDate;
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
    activities.forEach(activity => {
      // Activities might not always have unique IDs in the same way as competitions,
      // depending on their source. If they are unique by _id, this check is fine.
      // If not, ensure activities are not added if they somehow represent an already added competition event.
      if (uniqueIds.has(activity._id) && !activity.type.startsWith('competition')) {
        //This check might need refinement based on activity types and IDs
      } else {
         allFeedItems.push({
            id: activity._id, // Ensure activity._id is unique and suitable as a key
            type: 'activity',
            sortDate: activity.date,
            data: activity,
          });
         // uniqueIds.add(activity._id); // Add if activities should also be unique in the feed by their own ID
      }
    });

    // Sort all feed items by sortDate descending
    allFeedItems.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

    setFeedItems(allFeedItems);

  }, [competitions, votingCompetitions, completedCompetitions, completedResults, activities, session]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
      fetchVotingCompetitions();
      fetchCompletedCompetitions();
      fetchActivities(1);
      // Polling: auto-refresh stats every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchVotingCompetitions();
        fetchCompletedCompetitions();
        fetchActivities(1);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session]);

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
        const text = await statsRes.text();
        console.error('Failed to load user statistics:', statsRes.status, text);
        throw new Error('Failed to load user statistics: ' + statsRes.status + ' ' + text);
      }
      // Fetch active competitions - INCREASED LIMIT
      const competitionsRes = await fetch('/api/competitions?limit=50&status=active,upcoming');
      if (!competitionsRes.ok) {
        const text = await competitionsRes.text();
        console.error('Failed to load competitions:', competitionsRes.status, text);
        throw new Error('Failed to load competitions: ' + competitionsRes.status + ' ' + text);
      }
      // Fetch recent activities
      const activitiesRes = await fetch('/api/users/activities?limit=5');
      if (!activitiesRes.ok) {
        const text = await activitiesRes.text();
        console.error('Failed to load recent activities:', activitiesRes.status, text);
        throw new Error('Failed to load recent activities: ' + activitiesRes.status + ' ' + text);
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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later. ' + (err instanceof Error ? err.message : ''));
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
        {['feed', 'competitions', 'activity'].map(tab => (
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
              {/* FEED CONTENT - RENDER FROM feedItems STATE */}
              {(() => {
                // This code only runs if activeTab === 'feed'
                const filteredFeedItems = feedItems.filter(item => {
                  if (item.type === 'competition_voting') return true;
                  if (item.type === 'competition_completed_results') return true;
                  if (item.type === 'competition_active') return true;
                  if (item.type === 'competition_upcoming') return true;
                  if (item.type === 'activity') {
                    const activityData = item.data as RecentActivity;
                    return ['submission', 'badge', 'win'].includes(activityData.type);
                  }
                  return false;
                });

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

                return filteredFeedItems.map((item) => {
                  switch (item.type) {
                    case 'competition_completed_results':
                      const compData = item.data as Competition; // Use compData for item.data
                      const allSubmissionsForRank = item.allRankedSubmissions || [];
                      const userSubmissions = item.userSubmissions || [];
                      // const userId = session?.user?.id; // Already available if needed from outer scope, or use item.userSubmissions directly

                      // If no results at all, show a simplified card (similar to original feed item)
                      if (allSubmissionsForRank.length === 0) {
                        return (
                          <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col p-4 mb-4">
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
                        <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-green-50 border-l-4 border-green-400 flex flex-col md:flex-row items-center p-4 mb-4">
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
                        <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-yellow-50 border-l-4 border-yellow-400 flex flex-col md:flex-row items-center p-4 mb-4">
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
                      const createdAtDate = (activeComp as any).createdAt; // Attempt to get createdAt
                      return (
                        <div key={item.id} className="rounded-2xl shadow-lg overflow-hidden bg-sky-50 border-l-4 border-sky-400 flex flex-col md:flex-row items-start p-4 mb-4 group">
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
                              <p className="text-xs text-gray-400 mt-0.5 mb-1">{formatTimeSince(new Date(createdAtDate || item.sortDate))}</p>
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

                    case 'activity':
                      const activity = item.data as RecentActivity;
                      const activityDate = new Date(activity.date);
                      const timeSince = formatTimeSince(activityDate);
                      return (
                        <div key={item.id} className="bg-white p-3 rounded-xl shadow-md flex items-start space-x-3 hover:shadow-lg transition-shadow duration-200">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                            {activity.details && <p className="text-xs text-gray-500">{activity.details}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">{timeSince}</p>
                          </div>
                          {activity.photoUrl && (
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={activity.photoUrl} alt="Activity image" width={48} height={48} className="object-cover" />
                            </div>
                          )}
                          {activity.competitionId && activity.type !== 'submission' && (
                             <Link href={`/dashboard/competitions/${activity.competitionId}`} className="text-xs text-teal-500 hover:text-teal-600 self-end">
                               View Competition
                             </Link>
                          )}
                        </div>
                      );
                    default:
                      return null;
                  }
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
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {activities.map((activity) => (
              <div key={activity._id} className="rounded-2xl shadow-lg overflow-hidden bg-white flex items-center p-4">
                <div className="mr-4">{getActivityIcon(activity.type)}</div>
                <div>
                  <div className="font-semibold text-[#1a4d5c]">{activity.title}</div>
                  <div className="text-xs text-gray-500">{activity.date}</div>
                  {activity.details && <div className="text-sm text-gray-700 mt-1">{activity.details}</div>}
                </div>
              </div>
            ))}
            {activitiesHasMore && (
              <div className="flex justify-center">
                <button
                  className="px-4 py-2 rounded bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
                  onClick={() => {
                    if (!activitiesLoading) fetchActivities(activitiesPage + 1); setActivitiesPage(p => p + 1);
                  }}
                  disabled={activitiesLoading}
                >
                  {activitiesLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
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