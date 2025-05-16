'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Extended session type to include role
interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    id?: string;
  };
  expires: string;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  relatedLink?: string;
  relatedCompetition?: string;
  relatedPhoto?: string;
}

export default function AdminNotificationsPage() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession;
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && extendedSession?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchNotifications(currentPage);
    }
  }, [status, currentPage, extendedSession]);

  const fetchNotifications = async (page: number) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/notifications?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.data);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notification => notification._id));
    }
    setIsSelectAll(!isSelectAll);
  };

  const handleSelectNotification = (id: string) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(notificationId => notificationId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const markAsRead = async () => {
    try {
      if (selectedNotifications.length === 0) {
        return;
      }
      
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedNotifications,
          read: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      
      // Update notifications in the UI
      setNotifications(notifications.map(notification => 
        selectedNotifications.includes(notification._id) 
          ? { ...notification, read: true } 
          : notification
      ));
      
      // Clear selection
      setSelectedNotifications([]);
      setIsSelectAll(false);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to update notifications. Please try again.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAll: true,
          read: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update all notifications in the UI
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      
      // Clear selection
      setSelectedNotifications([]);
      setIsSelectAll(false);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to update notifications. Please try again.');
    }
  };

  const deleteNotifications = async () => {
    try {
      if (selectedNotifications.length === 0) {
        return;
      }
      
      setIsDeleting(true);
      
      const response = await fetch('/api/admin/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedNotifications,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }
      
      // Remove deleted notifications from the UI
      const remainingNotifications = notifications.filter(notification => 
        !selectedNotifications.includes(notification._id)
      );
      
      setNotifications(remainingNotifications);
      
      // Clear selection
      setSelectedNotifications([]);
      setIsSelectAll(false);
      
      // Check if we've deleted all notifications on this page
      if (remainingNotifications.length === 0) {
        // Refetch notifications to get the updated pagination
        const fetchResponse = await fetch(`/api/admin/notifications?page=1`);
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          // If there are no more notifications at all
          if (data.pagination.total === 0) {
            setNotifications([]);
            setTotalPages(0);
            setCurrentPage(1);
          } else {
            // If there are still notifications, either go to previous page or stay on page 1
            if (currentPage > 1 && currentPage > data.pagination.pages) {
              // If current page is now beyond the total pages, go to the last page
              setCurrentPage(data.pagination.pages);
            } else {
              // Otherwise refetch the current page
              fetchNotifications(currentPage);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error deleting notifications:', err);
      setError('Failed to delete notifications. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // If notification isn't read, mark it as read
    if (!notification.read) {
      markAsRead();
    }
    
    // Navigate to related content if available
    if (notification.relatedLink) {
      router.push(notification.relatedLink);
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'photo_submission':
        return (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'competition':
        return (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-100 text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  if (status === 'loading' || isLoading && notifications.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage new image submissions and other administration notifications
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Admin Notifications</h2>
          <div className="flex space-x-2">
            <button
              onClick={markAllAsRead}
              disabled={notifications.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark All as Read
            </button>
            <button
              onClick={markAsRead}
              disabled={selectedNotifications.length === 0}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Selected as Read
            </button>
            <button
              onClick={deleteNotifications}
              disabled={selectedNotifications.length === 0 || isDeleting}
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You're all caught up! There are no new admin notifications.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 px-4 py-2 bg-gray-50 flex items-center">
              <input
                type="checkbox"
                checked={isSelectAll}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
              />
              <span className="text-xs text-gray-500">Select All</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <li 
                  key={notification._id} 
                  className={`hover:bg-gray-50 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex py-3 px-4">
                    <div className="mr-4 flex items-start">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={() => handleSelectNotification(notification._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                      />
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center">
                        {getNotificationTypeIcon(notification.type)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {notification.relatedLink && (
                            <a href={notification.relatedLink} className="text-xs text-indigo-600 hover:text-indigo-900 mt-1 inline-block">
                              View Details
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span> pages
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 