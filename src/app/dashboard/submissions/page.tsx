'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';

interface Competition {
  _id: string;
  title: string;
  theme: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  votingEndDate: string;
}

interface Submission {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  averageRating: number;
  ratingsCount: number;
  competition: Competition;
  createdAt: string;
}

// Create a custom image component that handles errors
function ImageWithFallback({ src, alt, ...props }: any) {
  const [imgSrc, setImgSrc] = useState(src);
  
  // Use a genuine placeholder image from a reliable service
  const fallbackSrc = "https://placehold.co/600x400?text=No+Image+Available";
  
  const onError = useCallback(() => {
    console.log("Image failed to load:", src);
    setImgSrc(fallbackSrc);
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      onError={onError}
      unoptimized={true} // Skip Next.js image optimization
    />
  );
}

export default function UserSubmissions() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch user submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        
        // Build query with status filter and pagination
        const queryParams = new URLSearchParams();
        if (statusFilter !== 'all') {
          queryParams.append('status', statusFilter);
        }
        queryParams.append('page', currentPage.toString());
        queryParams.append('limit', '12');
        
        const response = await fetch(`/api/user/submissions?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const data = await response.json();
        console.log("Submissions data:", data.data);
        
        // Extract submissions without URL transformation
        setSubmissions(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'An error occurred while fetching your submissions');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchSubmissions();
    }
  }, [session, statusFilter, currentPage]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get competition status badge color
  const getCompetitionStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'voting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Photo Submissions</h1>
        <p className="mt-1 text-gray-600">
          View and manage your submissions to photography competitions.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      {submissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'You have not submitted any photos to competitions yet.'
              : `You have no submissions with "${statusFilter}" status.`}
          </p>
          <Link
            href="/dashboard/competitions"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Competitions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {submissions.map((submission) => (
            <div key={submission._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="relative h-48 w-full">
                {/* Use our custom image component with fallback */}
                <ImageWithFallback
                  src={submission.thumbnailUrl || submission.imageUrl}
                  alt={submission.title}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{submission.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">
                  Submitted on {formatDate(submission.createdAt)}
                </p>

                <div className="mb-3">
                  <Link
                    href={`/dashboard/competitions/${submission.competition._id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    {submission.competition.title}
                  </Link>
                  <div className="flex mt-1">
                    <span className="text-xs text-gray-500 mr-2">Theme: {submission.competition.theme}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCompetitionStatusColor(submission.competition.status)}`}>
                      {submission.competition.status.charAt(0).toUpperCase() + submission.competition.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {(submission.status === 'approved' && submission.competition.status !== 'upcoming' && submission.competition.status !== 'active') && (
                  <div className="flex items-center mt-2">
                    <span className="text-yellow-500 mr-1">
                      ★
                    </span>
                    <span className="text-sm text-gray-700">
                      {submission.averageRating > 0 
                        ? `${submission.averageRating.toFixed(1)} (${submission.ratingsCount} ${submission.ratingsCount === 1 ? 'rating' : 'ratings'})` 
                        : 'No ratings yet'}
                    </span>
                  </div>
                )}
                
                {submission.status === 'rejected' && (
                  <div className="text-sm text-red-600 mt-2">
                    This photo was not approved for the competition.
                  </div>
                )}
                
                {submission.status === 'pending' && (
                  <div className="text-sm text-yellow-600 mt-2">
                    This photo is awaiting approval.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border ${
                  page === currentPage
                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                } text-sm font-medium`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
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
      )}
    </div>
  );
} 