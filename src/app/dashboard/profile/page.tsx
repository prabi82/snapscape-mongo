'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [badges, setBadges] = useState([]);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
    
    // Set initial form values
    if (session?.user) {
      setName(session.user.name);
      setEmail(session.user.email);
      
      // Fetch user badges
      fetchUserBadges();
    }
  }, [session, status, router]);
  
  const fetchUserBadges = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/badges?user=${session.user.id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your account details</p>
        </div>
        
        {message.text && (
          <div className={`mx-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                disabled
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Badges Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">Your Badges</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Achievements you've earned</p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge: any) => (
                <div key={badge._id} className="flex flex-col items-center p-4 border rounded-lg">
                  <div className="w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full mb-2">
                    {badge.badge.icon ? (
                      <Image 
                        src={badge.badge.icon} 
                        alt={badge.badge.name} 
                        width={40} 
                        height={40} 
                      />
                    ) : (
                      <span className="text-2xl text-indigo-600">🏆</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 text-center">{badge.badge.name}</h3>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {new Date(badge.awardedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">You haven't earned any badges yet. Participate in competitions to earn badges!</p>
          )}
        </div>
      </div>
    </div>
  );
} 