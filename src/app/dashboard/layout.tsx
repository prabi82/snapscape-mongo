'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import ProfileIncompleteNotification from '@/components/ProfileIncompleteNotification';

// Icons for navigation
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CompetitionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const SubmissionsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FeedbackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '/dashboard';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Check if user is a judge in "View as User" mode
  const isJudgeViewingAsUser = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return (session?.user as any)?.role === 'judge' && urlParams.get('viewAsUser') === 'true';
    }
    return false;
  };
  
  // Function to get URL with viewAsUser parameter preserved
  const getNavigationUrl = (href: string) => {
    if (isJudgeViewingAsUser()) {
      return `${href}?viewAsUser=true`;
    }
    return href;
  };
  
  useEffect(() => {
    // Redirect to homepage if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    // Fetch unread notification count
    if (session?.user) {
      fetchUnreadNotifications();
    }
  }, [session, status, router]);
  
  const fetchUnreadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?unread=true&limit=1');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUnreadNotifications(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Competitions', href: '/dashboard/competitions', icon: CompetitionsIcon },
    { name: 'My Submissions', href: '/dashboard/submissions', icon: SubmissionsIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: ProfileIcon },
    { name: 'Feedback', href: '/dashboard/feedback', icon: FeedbackIcon },
    { 
      name: 'Notifications', 
      href: '/dashboard/notifications', 
      icon: NotificationsIcon,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined
    },
  ];
  
  // Add admin link if user is an admin
  if (session?.user && (session.user as any).role === 'admin') {
    navigation.push({ name: 'Admin', href: '/dashboard/admin', icon: AdminIcon });
  }
  
  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/';
  };
  
  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden p-4 flex items-center justify-center bg-white shadow-sm relative">
        <Link href="/" className="flex items-center justify-center w-full">
          <img src="/logo.png" alt="SnapScape Logo" className="w-16 h-16 rounded-full border-2 border-[#e0c36a] bg-white" />
        </Link>
        <button
          type="button"
          className="absolute right-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Sidebar for desktop */}
      <div className="fixed inset-y-0 left-0 bg-[#e6f0f3] border-r-2 border-[#e0c36a] z-10 w-64 hidden lg:block rounded-tr-3xl rounded-br-3xl shadow-xl">
        <div className="h-full flex flex-col">
          <div className="h-36 flex items-center justify-center border-b-2 border-[#e0c36a] bg-white rounded-tr-3xl">
            <Link href="/" className="flex flex-col items-center justify-center">
              <img src="/logo.png" alt="SnapScape Logo" className="w-24 h-24 rounded-full border-4 border-[#e0c36a] shadow mb-1 bg-white" />
            </Link>
          </div>
          <div className="flex-grow overflow-y-auto">
            <nav className="px-4 mt-8">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={getNavigationUrl(item.href)}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-base font-semibold rounded-xl transition-all
                      ${
                        (item.href === '/dashboard' && pathname === '/dashboard') ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href))
                          ? 'bg-gradient-to-r from-[#e0c36a]/30 to-[#fffbe6] text-[#1a4d5c] shadow border-l-4 border-[#e0c36a]'
                          : 'text-[#1a4d5c] hover:bg-[#e0c36a]/10 hover:text-[#2699a6]'
                      }
                    `}
                  >
                    <span className="flex items-center justify-center w-6 h-6">
                        <item.icon />
                      </span>
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-semibold text-[#1a4d5c] rounded-xl hover:bg-[#e0c36a]/10 hover:text-[#2699a6] transition-all mt-2"
                >
                  <span className="flex items-center justify-center w-6 h-6">
                    <LogoutIcon />
                  </span>
                  Logout
                </button>
              </div>
            </nav>
          </div>
          <div className="p-5 border-t-2 border-[#e0c36a] bg-white rounded-br-3xl">
            {session?.user && (
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-[#e0c36a]/20 flex items-center justify-center border-2 border-[#e0c36a]">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-[#1a4d5c] font-bold text-lg">
                        {session.user.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-base font-semibold text-[#1a4d5c] truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs font-medium text-[#2699a6] truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on mobile menu state */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="h-20 flex items-center justify-center px-6 border-b border-gray-200">
              <Link href="/" className="flex items-center justify-center w-full">
                <img src="/logo.png" alt="SnapScape Logo" className="w-16 h-16 rounded-full border-2 border-[#e0c36a] bg-white" />
              </Link>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <nav className="px-3 mt-6">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={getNavigationUrl(item.href)}
                      className={`
                        flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md group
                        ${pathname.startsWith(item.href) 
                          ? 'bg-indigo-50 text-indigo-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">
                          <item.icon />
                        </span>
                        {item.name}
                      </div>
                      {item.badge && (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 group"
                  >
                    <span className="mr-3">
                      <LogoutIcon />
                    </span>
                    Logout
                  </button>
                </div>
              </nav>
            </div>
            
            {session?.user && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-200 flex items-center justify-center">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-indigo-600 font-medium">
                          {session.user.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs font-medium text-gray-500 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 w-14"></div>
        </div>
      )}
      
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6">
          {/* View as User Mode Indicator */}
          {isJudgeViewingAsUser() && (
            <div className="mx-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-400 p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">
                      Judge - View as User Mode
                    </h3>
                    <p className="text-sm text-purple-700">
                      You are currently viewing the platform as a regular user. You can submit photos to competitions where you are not assigned as a judge.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href="/judge"
                    className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Return to Judge Mode
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('preferredRole');
                      window.location.href = '/role-selection';
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Switch Role
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Role Switcher for Judges (when not in View as User mode) */}
          {(session?.user as any)?.role === 'judge' && !isJudgeViewingAsUser() && pathname.startsWith('/dashboard') && (
            <div className="mx-4 mb-6 bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-400 p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Judge Access Detected
                    </h3>
                    <p className="text-sm text-green-700">
                      You have judge privileges. Switch to judge mode for full judging features.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 flex gap-2">
                  <Link
                    href="/judge"
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Switch to Judge Mode
                  </Link>
                  <button
                    onClick={() => {
                      localStorage.removeItem('preferredRole');
                      window.location.href = '/role-selection';
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Change Role
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <ProfileIncompleteNotification />
          {children}
        </main>
      </div>
      {/* Mobile Bottom Nav - visible on all dashboard pages */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e0c36a] flex justify-around items-center py-2 md:hidden">
        <Link href={getNavigationUrl("/dashboard")} className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-xs">Feed</span>
        </Link>
        <Link href={getNavigationUrl("/dashboard/competitions")} className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /></svg>
          <span className="text-xs">Competitions</span>
        </Link>
        <Link href={getNavigationUrl("/dashboard/feedback")} className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-xs">Feedback</span>
        </Link>
        <Link href={getNavigationUrl("/dashboard/profile")} className="flex flex-col items-center text-[#1a4d5c]">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  );
} 