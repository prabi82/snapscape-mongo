'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
  photoCount?: number;
  submissionCount?: number;
  badgeCount?: number;
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

export default function UserDetails() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // profile, photos, submissions
  
  // Password reset states - simplified
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch user details
        const userRes = await fetch(`/api/users/${userId}`);
        if (!userRes.ok) {
          throw new Error('Failed to fetch user details');
        }
        const userData = await userRes.json();
        setUser(userData.user);
        
        // Fetch user's photos
        const photosRes = await fetch(`/api/photos?user=${userId}`);
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(photosData.data || []);
        }
        
        // Fetch user's submissions
        const submissionsRes = await fetch(`/api/photo-submissions?user=${userId}`);
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData.data || []);
        }
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'An error occurred while fetching user data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [userId, session]);

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // New simplified password reset handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 8) {
      setResetMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters long' 
      });
      return;
    }
    
    try {
      setResetMessage({ type: 'loading', text: 'Resetting password...' });
      
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetMessage({ type: 'success', text: 'Password reset successfully' });
        setNewPassword('');
        // Close the form after success with delay
        setTimeout(() => {
          setShowResetForm(false);
          setResetMessage({ type: '', text: '' });
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      setResetMessage({ 
        type: 'error', 
        text: err.message || 'An error occurred while resetting the password' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || 'User not found'}</p>
        </div>
        <Link 
          href="/admin/users"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Users
        </Link>
      </div>
    );
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/admin/users"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to User Management
        </Link>
      </div>
      
      {/* User header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-700 text-xl font-medium">
                    {getUserInitials(user?.name || '')}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Admin actions - only shown if admin viewing other user's profile */}
            {session?.user && session.user.email !== user?.email && (
              <div className="flex flex-col space-y-2">
                {/* Role change dropdown */}
                <select
                  onChange={async (e) => {
                    if (confirm(`Are you sure you want to change this user's role to ${e.target.value}?`)) {
                      try {
                        const response = await fetch(`/api/users/${user?._id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ role: e.target.value }),
                        });
                        
                        if (!response.ok) {
                          throw new Error('Failed to update user role');
                        }
                        
                        // Update user in state
                        setUser({
                          ...user!,
                          role: e.target.value,
                        });
                        
                      } catch (err: any) {
                        console.error('Error updating user role:', err);
                        alert(err.message || 'An error occurred while updating the user role');
                      }
                    }
                  }}
                  value={user?.role}
                  className="block px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Change Role
                  </option>
                  <option value="user">Set as User</option>
                  <option value="admin">Set as Admin</option>
                </select>
                
                {/* Password Reset button - now toggles the form display */}
                <button
                  type="button"
                  onClick={() => setShowResetForm(!showResetForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reset Password
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* New simplified Password Reset Form */}
        {showResetForm && session?.user && session.user.email !== user?.email && (
          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Reset User Password</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a new password for this user. They will need to use this password for their next login.
            </p>
            
            <form onSubmit={handleResetPassword} className="mt-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-64">
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    required
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    disabled={resetMessage.type === 'loading'}
                  >
                    {resetMessage.type === 'loading' ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : 'Reset Password'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setNewPassword('');
                      setResetMessage({ type: '', text: '' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              {/* Status messages */}
              {resetMessage.text && (
                <div className={`mt-3 text-sm ${
                  resetMessage.type === 'error' ? 'text-red-600' : 
                  resetMessage.type === 'success' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {resetMessage.text}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`${
              activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`${
              activeTab === 'photos'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Photos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`${
              activeTab === 'submissions'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Submissions ({submissions.length})
          </button>
        </nav>
      </div>
      
      {/* Profile tab */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and activity.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.name}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.email}</dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user?.role}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {user?.bio || 'No bio provided'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Joined</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(user?.createdAt || '')}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Activity</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex space-x-6">
                    <div>
                      <span className="font-medium">{photos.length}</span> photos
                    </div>
                    <div>
                      <span className="font-medium">{submissions.length}</span> competition submissions
                    </div>
                    <div>
                      <span className="font-medium">{user?.badgeCount || 0}</span> badges earned
                    </div>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
      
      {/* Photos tab */}
      {activeTab === 'photos' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Photos</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Photos uploaded by this user.</p>
          </div>
          <div className="border-t border-gray-200 p-4">
            {photos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No photos found for this user.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo._id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={photo.thumbnailUrl || photo.imageUrl}
                        alt={photo.title}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-900">{photo.title}</h4>
                      <p className="text-xs text-gray-500">{formatDate(photo.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Submissions tab */}
      {activeTab === 'submissions' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Competition Submissions</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Photos submitted to competitions.</p>
          </div>
          <div className="border-t border-gray-200 p-4">
            {submissions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No competition submissions found for this user.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {submissions.map((submission) => (
                  <div key={submission._id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={submission.thumbnailUrl || submission.imageUrl}
                        alt={submission.title}
                        width={300}
                        height={300}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-900">{submission.title}</h4>
                      {submission.competitionTitle && (
                        <p className="text-xs text-gray-700">
                          For: <Link href={`/admin/competitions/${submission.competitionId}`} className="text-indigo-600 hover:text-indigo-500">{submission.competitionTitle}</Link>
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{formatDate(submission.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 