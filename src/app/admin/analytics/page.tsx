'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface AnalyticsData {
  userStats: {
    total: number;
    newThisMonth: number;
    activeThisMonth: number;
    growthRate: number;
  };
  photoStats: {
    total: number;
    newThisMonth: number;
    avgPerUser: number;
    topCategories: Array<{ name: string; count: number }>;
  };
  competitionStats: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    avgParticipation: number;
  };
  engagementStats: {
    totalRatings: number;
    avgRatingScore: number;
    totalComments: number;
    avgCommentsPerPhoto: number;
  };
  monthlyActiveUsers: Array<{ month: string; count: number }>;
  photoUploadsOverTime: Array<{ month: string; count: number }>;
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30days'); // '7days', '30days', '90days', '1year'

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // This would be a real API call in production
        // For now, we'll simulate the data
        const simulatedData: AnalyticsData = {
          userStats: {
            total: 1245,
            newThisMonth: 87,
            activeThisMonth: 642,
            growthRate: 5.2,
          },
          photoStats: {
            total: 4278,
            newThisMonth: 356,
            avgPerUser: 3.4,
            topCategories: [
              { name: 'Nature', count: 1245 },
              { name: 'Portrait', count: 982 },
              { name: 'Street', count: 876 },
              { name: 'Architecture', count: 654 },
              { name: 'Abstract', count: 521 },
            ],
          },
          competitionStats: {
            total: 24,
            active: 3,
            upcoming: 2,
            completed: 19,
            avgParticipation: 32.5,
          },
          engagementStats: {
            totalRatings: 12450,
            avgRatingScore: 4.2,
            totalComments: 3245,
            avgCommentsPerPhoto: 0.8,
          },
          monthlyActiveUsers: [
            { month: 'Jan', count: 420 },
            { month: 'Feb', count: 445 },
            { month: 'Mar', count: 470 },
            { month: 'Apr', count: 490 },
            { month: 'May', count: 520 },
            { month: 'Jun', count: 550 },
            { month: 'Jul', count: 590 },
            { month: 'Aug', count: 610 },
            { month: 'Sep', count: 635 },
            { month: 'Oct', count: 642 },
            { month: 'Nov', count: 660 },
            { month: 'Dec', count: 690 },
          ],
          photoUploadsOverTime: [
            { month: 'Jan', count: 220 },
            { month: 'Feb', count: 240 },
            { month: 'Mar', count: 270 },
            { month: 'Apr', count: 310 },
            { month: 'May', count: 350 },
            { month: 'Jun', count: 320 },
            { month: 'Jul', count: 340 },
            { month: 'Aug', count: 380 },
            { month: 'Sep', count: 350 },
            { month: 'Oct', count: 356 },
            { month: 'Nov', count: 390 },
            { month: 'Dec', count: 410 },
          ],
        };
        
        // In real implementation, we would fetch from API:
        // const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
        // if (!response.ok) {
        //   throw new Error('Failed to fetch analytics data');
        // }
        // const data = await response.json();
        // setAnalyticsData(data);
        
        setAnalyticsData(simulatedData);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError(err.message || 'An error occurred while fetching analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading && !analyticsData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">
          {error || 'Unable to load analytics data. Please try again later.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform statistics and user engagement metrics.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analyticsData.userStats.total.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm flex justify-between">
              <span className="font-medium text-indigo-600">
                New: {analyticsData.userStats.newThisMonth}
              </span>
              <span className={`font-medium ${analyticsData.userStats.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.userStats.growthRate > 0 ? '+' : ''}{analyticsData.userStats.growthRate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Photos</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analyticsData.photoStats.total.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm flex justify-between">
              <span className="font-medium text-green-600">
                New: {analyticsData.photoStats.newThisMonth}
              </span>
              <span className="font-medium text-gray-600">
                {analyticsData.photoStats.avgPerUser} per user
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Competitions</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analyticsData.competitionStats.total.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm flex justify-between">
              <span className="font-medium text-yellow-600">
                Active: {analyticsData.competitionStats.active}
              </span>
              <span className="font-medium text-gray-600">
                Upcoming: {analyticsData.competitionStats.upcoming}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{analyticsData.engagementStats.totalRatings.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm flex justify-between">
              <span className="font-medium text-purple-600">
                Avg Rating: {analyticsData.engagementStats.avgRatingScore}/5
              </span>
              <span className="font-medium text-gray-600">
                {analyticsData.engagementStats.totalComments} comments
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Active Users Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Active Users</h2>
          <div className="h-64 w-full">
            <div className="relative h-full w-full">
              {/* This would be a real chart in production */}
              <div className="absolute bottom-0 left-0 right-0 h-56 flex items-end">
                {analyticsData.monthlyActiveUsers.map((item, i) => (
                  <div key={i} className="flex-1 mx-1">
                    <div 
                      className="bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${(item.count / Math.max(...analyticsData.monthlyActiveUsers.map(d => d.count))) * 100}%`,
                        minHeight: '5px'
                      }}
                      title={`${item.month}: ${item.count} users`}
                    ></div>
                    <div className="text-xs text-center mt-1 text-gray-600">{item.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Uploads Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Photo Uploads</h2>
          <div className="h-64 w-full">
            <div className="relative h-full w-full">
              {/* This would be a real chart in production */}
              <div className="absolute bottom-0 left-0 right-0 h-56 flex items-end">
                {analyticsData.photoUploadsOverTime.map((item, i) => (
                  <div key={i} className="flex-1 mx-1">
                    <div 
                      className="bg-green-500 hover:bg-green-600 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${(item.count / Math.max(...analyticsData.photoUploadsOverTime.map(d => d.count))) * 100}%`,
                        minHeight: '5px'
                      }}
                      title={`${item.month}: ${item.count} photos`}
                    ></div>
                    <div className="text-xs text-center mt-1 text-gray-600">{item.month}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Photo Categories */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Top Photo Categories
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Most popular categories based on photo count.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {analyticsData.photoStats.topCategories.map((category, index) => (
                <li key={index} className="px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${(category.count / analyticsData.photoStats.topCategories[0].count) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{category.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Competition Stats */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Competition Performance
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Statistics about competition participation and engagement.
            </p>
          </div>
          <div className="border-t border-gray-200 p-4">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Competitions</dt>
                <dd className="mt-1 text-sm text-gray-900">{analyticsData.competitionStats.total}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Active Competitions</dt>
                <dd className="mt-1 text-sm text-gray-900">{analyticsData.competitionStats.active}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Upcoming Competitions</dt>
                <dd className="mt-1 text-sm text-gray-900">{analyticsData.competitionStats.upcoming}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Completed Competitions</dt>
                <dd className="mt-1 text-sm text-gray-900">{analyticsData.competitionStats.completed}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Average Participation Rate</dt>
                <dd className="mt-1 text-sm text-gray-900">{analyticsData.competitionStats.avgParticipation} photos per competition</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
} 