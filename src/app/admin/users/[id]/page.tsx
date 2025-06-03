'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  country?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  photoCount?: number;
  submissionCount?: number;
}

interface Photo {
  _id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

interface Submission {
  _id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  competitionTitle?: string;
  competitionId?: string;
  createdAt: string;
}

interface ExtendedSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

export default function UserManagementPage() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    // Check if user is admin
    if (status === 'authenticated' && (session?.user as any)?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Fetch the user
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'An error occurred while fetching user information');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      fetchUser();
    }
  }, [status, session, router, userId]);

  const resetPassword = async () => {
    if (!user) return;
    
    // Validate passwords
    if (!newPassword || !confirmPassword) {
      setPasswordError('Both password fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setActionLoading(true);
      setPasswordError('');
      setActionSuccess('');
      setError('');
      
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reset password');
      }
      
      setActionSuccess('Password reset successfully');
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setPasswordError(err.message || 'An error occurred while resetting password');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserStatus = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      setActionSuccess('');
      setError('');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      const data = await response.json();
      setUser(data.user);
      setActionSuccess(`User ${data.user.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error updating user status:', err);
      setError(err.message || 'An error occurred while updating user status');
    } finally {
      setActionLoading(false);
    }
  };
  
  const changeUserRole = async (newRole: string) => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      setActionSuccess('');
      setError('');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      const data = await response.json();
      setUser(data.user);
      setActionSuccess(`User role updated to ${newRole} successfully`);
    } catch (err: any) {
      console.error('Error updating user role:', err);
      setError(err.message || 'An error occurred while updating user role');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserVerification = async () => {
    if (!user) return;
    
    try {
      setActionLoading(true);
      setActionSuccess('');
      setError('');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVerified: !user.isVerified,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user verification status');
      }
      
      const data = await response.json();
      setUser(data.user);
      setActionSuccess(`User email ${data.user.isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (err: any) {
      console.error('Error updating user verification status:', err);
      setError(err.message || 'An error occurred while updating user verification status');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!user || !confirmDelete) return;
    
    try {
      setActionLoading(true);
      setActionSuccess('');
      setError('');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      setActionSuccess('User deleted successfully');
      
      // Redirect back to user list
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'An error occurred while deleting user');
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage User</h1>
          <p className="text-sm text-gray-500">View and manage user information</p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Users
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">{actionSuccess}</p>
        </div>
      )}

      {user ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">User Profile</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">User details and account information.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Mobile</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.mobile || 'Not provided'}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Country</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.country || 'Not provided'}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : user.role === 'judge'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email Verification</dt>
                <dd className="mt-1 sm:mt-0 sm:col-span-2">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Joined Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(user.createdAt).toLocaleDateString()} at {new Date(user.createdAt).toLocaleTimeString()}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Activity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user.photoCount || 0} photos uploaded, {user.submissionCount || 0} competition entries
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          User not found or you don't have permission to view this user.
        </div>
      )}

      {user && (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50">
            <h3 className="text-lg font-medium leading-6 text-gray-900">User Management</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage this user's account.</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Change User Role</h4>
                <div className="flex items-center mt-2 space-x-4">
                  <button
                    onClick={() => changeUserRole('user')}
                    disabled={user.role === 'user' || actionLoading}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      user.role === 'user'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    Set as User
                  </button>
                  <button
                    onClick={() => changeUserRole('admin')}
                    disabled={user.role === 'admin' || actionLoading}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      user.role === 'admin'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100'
                    }`}
                  >
                    Set as Admin
                  </button>
                  <button
                    onClick={() => changeUserRole('judge')}
                    disabled={user.role === 'judge' || actionLoading}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      user.role === 'judge'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    Set as Judge
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Password Management</h4>
                <div className="mt-2">
                  {!showPasswordReset ? (
                    <button
                      onClick={() => setShowPasswordReset(true)}
                      className="px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium"
                    >
                      Reset Password
                    </button>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h5 className="text-sm font-medium text-blue-800 mb-3">Reset User Password</h5>
                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-3">
                          {passwordError}
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="newPassword" className="block text-sm font-medium text-blue-700">
                            New Password
                          </label>
                          <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter new password (min 8 characters)"
                          />
                        </div>
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-700">
                            Confirm Password
                          </label>
                          <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={resetPassword}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoading ? 'Resetting...' : 'Reset Password'}
                          </button>
                          <button
                            onClick={() => {
                              setShowPasswordReset(false);
                              setNewPassword('');
                              setConfirmPassword('');
                              setPasswordError('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Account Status</h4>
                <div className="mt-2">
                  <button
                    onClick={toggleUserStatus}
                    disabled={actionLoading}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      user.isActive
                        ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                        : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {user.isActive ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500">Email Verification</h4>
                <div className="mt-2">
                  <button
                    onClick={toggleUserVerification}
                    disabled={actionLoading}
                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                      user.isVerified
                        ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'
                        : 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    {user.isVerified ? 'Mark as Unverified' : 'Manually Verify Email'}
                  </button>
                </div>
              </div>

              {userId !== (session?.user as any)?.id && (
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-red-500">Danger Zone</h4>
                  <div className="mt-2">
                    {!confirmDelete ? (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="px-4 py-2 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium"
                      >
                        Delete User
                      </button>
                    ) : (
                      <div className="bg-red-50 p-4 rounded-md">
                        <p className="text-sm text-red-800 mb-4">
                          Are you sure you want to delete this user? This action cannot be undone and will remove all of the user's data.
                        </p>
                        <div className="flex space-x-4">
                          <button
                            onClick={deleteUser}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 