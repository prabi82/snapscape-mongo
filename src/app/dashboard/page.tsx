'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Fetch all dashboard data at once
      fetchDashboardData();
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch user stats
      const statsRes = await fetch('/api/users/stats');
      
      // Fetch active competitions
      const competitionsRes = await fetch('/api/competitions?limit=3&status=active,upcoming');
      
      // Fetch recent activities
      const activitiesRes = await fetch('/api/users/activities?limit=5');
      
      if (!statsRes.ok) throw new Error('Failed to load user statistics');
      if (!competitionsRes.ok) throw new Error('Failed to load competitions');
      if (!activitiesRes.ok) throw new Error('Failed to load recent activities');
      
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
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setIsLoading(false);
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-center">
            <div className="h-12 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-6 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Photographer'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your photography journey.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Submissions</div>
          <div className="mt-2 flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</div>
            <Link 
              href="/dashboard/submissions" 
              className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Photos Rated</div>
          <div className="mt-2 flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">{stats.photosRated}</div>
            <span className="text-sm text-gray-500">Votes cast</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Badges</div>
          <div className="mt-2 flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">{stats.badgesEarned}</div>
            <Link 
              href="/dashboard/profile" 
              className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Competitions</div>
          <div className="mt-2 flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">{stats.competitionsEntered}</div>
            <span className="text-sm text-gray-500">Entered</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="font-semibold text-sm text-gray-500 uppercase tracking-wide">Wins</div>
          <div className="mt-2 flex justify-between items-baseline">
            <div className="text-3xl font-bold text-gray-900">{stats.competitionsWon}</div>
            <span className="text-sm text-gray-500">1st Place</span>
          </div>
        </div>
      </div>
      
      {/* Active Competitions */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Active Competitions</h2>
          <Link 
            href="/dashboard/competitions" 
            className="text-sm text-indigo-600 hover:text-indigo-900 hover:underline"
          >
            View all competitions
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {competitions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No active competitions available at the moment.</p>
              <p className="mt-2 text-sm">Check back soon or explore past competitions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Competition</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {competitions.map((competition) => (
                    <tr key={competition._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/dashboard/competitions/${competition._id}`}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          {competition.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{competition.theme}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(competition.status)}`}>
                          {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(competition.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {competition.submissionCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/dashboard/competitions/${competition._id}?submit=true`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          {competition.status === 'active' ? 'Submit Photo' : 'View Details'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          {activities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No recent activities to display.</p>
              <p className="mt-2 text-sm">Start participating in competitions to see your activity here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <li key={activity._id} className="p-4">
                  <div className="flex items-start space-x-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      {activity.details && (
                        <p className="text-sm text-gray-500 truncate">{activity.details}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.date).toLocaleDateString()} • {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {activity.photoUrl && (
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                          <Image 
                            src={activity.photoUrl} 
                            alt="Activity thumbnail" 
                            width={40} 
                            height={40} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {activity.competitionId && (
                      <div className="flex-shrink-0">
                        <Link 
                          href={`/dashboard/competitions/${activity.competitionId}`}
                          className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 