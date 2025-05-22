'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user: ExtendedUser;
  expires: string;
}

interface DashboardStats {
  userCount: number;
  competitionCount: number;
  activeCompetitions: number;
  submissionCount: number;
  pendingSubmissions: number;
  recentUsers: any[];
  recentCompetitions: any[];
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    userCount: 0,
    competitionCount: 0,
    activeCompetitions: 0,
    submissionCount: 0,
    pendingSubmissions: 0,
    recentUsers: [],
    recentCompetitions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch users count
      const usersResponse = await fetch('/api/users');
      if (!usersResponse.ok) throw new Error('Failed to fetch users');
      const usersData = await usersResponse.json();
      
      // Fetch competitions count and active competitions
      const competitionsResponse = await fetch('/api/competitions');
      if (!competitionsResponse.ok) throw new Error('Failed to fetch competitions');
      const competitionsData = await competitionsResponse.json();
      
      // For demo purposes, let's simulate some stats
      // In a real app, you would make specific API calls for these statistics
      const activeCompetitions = competitionsData.data.filter(
        (comp: any) => comp.status === 'active' || comp.status === 'voting'
      ).length;
      
      // Dummy data for submissions since we don't have that API yet
      const submissionCount = 150;
      const pendingSubmissions = 23;
      
      setStats({
        userCount: usersData.users.length,
        competitionCount: competitionsData.data.length,
        activeCompetitions,
        submissionCount,
        pendingSubmissions,
        recentUsers: usersData.users.slice(0, 5),
        recentCompetitions: competitionsData.data.slice(0, 5)
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message || 'An error occurred while fetching dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Check if user is admin
    if (status === 'authenticated' && (session?.user as ExtendedUser)?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Fetch all users
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data.users);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError(err.message || 'An error occurred while fetching users');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && (session?.user as ExtendedUser)?.role === 'admin') {
      fetchUsers();
      fetchStats();
    }
  }, [status, session, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin/settings"
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm"
            >
              Settings
            </Link>
            <Link 
              href="/admin/create-admin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md text-sm"
            >
              Add Admin
            </Link>
            <button
              onClick={handleSignOut}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        ) : null}
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">
                User Management
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Overview of all registered users
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Total Users: {users.length}
            </p>
          </div>
          
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/admin/users/${user._id}`}
                          className="text-indigo-600 hover:text-indigo-900 bg-white px-3 py-1 rounded-md border border-indigo-200 shadow-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {session?.user?.name}. Here's what's happening with SnapScape today.
          </p>
        </div>

        {/* Stats Cards */}
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
                    <dd className="text-2xl font-semibold text-gray-900">{stats.userCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/users" className="font-medium text-indigo-600 hover:text-indigo-500">
                  View all users
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Competitions</dt>
                    <dd className="flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{stats.competitionCount}</span>
                      <span className="ml-2 text-sm font-medium text-green-600">
                        {stats.activeCompetitions} active
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/competitions" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage competitions
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Photo Submissions</dt>
                    <dd className="flex items-baseline">
                      <span className="text-2xl font-semibold text-gray-900">{stats.submissionCount}</span>
                      <span className="ml-2 text-sm font-medium text-yellow-600">
                        {stats.pendingSubmissions} pending
                      </span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/submissions" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Moderate submissions
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Badges</dt>
                    <dd className="text-2xl font-semibold text-gray-900">12</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/admin/badges" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Manage badges
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Users
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  New registrations on the platform
                </p>
              </div>
              <Link href="/admin/users" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {stats.recentUsers.length > 0 ? (
                  stats.recentUsers.map((user) => (
                    <li key={user._id} className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg text-gray-600">{user.name.charAt(0)}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <div className="ml-auto">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-center text-sm text-gray-500">
                    No recent users
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Recent Competitions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  Recent Competitions
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Latest photography competitions
                </p>
              </div>
              <Link href="/admin/competitions" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all
              </Link>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {stats.recentCompetitions.length > 0 ? (
                  stats.recentCompetitions.map((competition) => (
                    <li key={competition._id} className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{competition.title}</p>
                          <p className="text-sm text-gray-500">Theme: {competition.theme}</p>
                        </div>
                        <div className="ml-3">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            competition.status === 'active' ? 'bg-green-100 text-green-800' : 
                            competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                            competition.status === 'voting' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {competition.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-center text-sm text-gray-500">
                    No recent competitions
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/competitions/create"
              className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-2">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Create Competition</p>
                <p className="text-sm text-gray-500">Add a new photography contest</p>
              </div>
            </Link>

            <Link
              href="/admin/submissions?status=pending"
              className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Moderate Photos</p>
                <p className="text-sm text-gray-500">Review pending submissions</p>
              </div>
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Database Maintenance</p>
                <p className="text-sm text-gray-500">Clean up orphaned data and settings</p>
              </div>
            </Link>

            <Link
              href="/admin/create-admin"
              className="flex items-center p-4 bg-white shadow rounded-lg hover:bg-gray-50"
            >
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-2">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-base font-medium text-gray-900">Add Admin</p>
                <p className="text-sm text-gray-500">Create new administrator account</p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 