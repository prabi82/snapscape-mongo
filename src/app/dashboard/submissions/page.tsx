'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';
import React from 'react';

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

// Add a simple funnel icon component
const FunnelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="4" x2="21" y2="4" />
    <polygon points="4 4 20 4 14 12 14 19 10 19 10 12 4 4" />
  </svg>
);

export default function UserSubmissions() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [allImages, setAllImages] = useState<Submission[]>([]);

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

  // Fetch all submissions for the image strip (ignoring filters/pagination)
  useEffect(() => {
    const fetchAllImages = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch('/api/user/submissions?limit=1000');
        if (!response.ok) throw new Error('Failed to fetch all images');
        const data = await response.json();
        setAllImages(data.data || []);
      } catch (err) {
        setAllImages([]);
      }
    };
    fetchAllImages();
  }, [session]);

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
      <div className="mb-8 hidden md:block">
        <h1 className="text-2xl font-bold text-gray-800">My Photo Submissions</h1>
        <p className="mt-1 text-gray-600">
          View and manage your submissions to photography competitions.
        </p>
      </div>

      {/* Mobile filter floating action button */}
      <button
        className="fixed bottom-20 right-4 z-50 p-2 rounded-full border-2 border-[#e0c36a] bg-white shadow-lg text-[#1a4d5c] hover:bg-[#e6f0f3] focus:outline-none focus:ring-2 focus:ring-[#e0c36a] md:hidden transition-transform duration-200 ease-in-out hover:scale-125 active:scale-125"
        style={{ boxShadow: '0 4px 16px rgba(26,77,92,0.10)' }}
        onClick={() => setShowFilterModal(true)}
        aria-label="Open filters"
      >
        <FunnelIcon className="w-4 h-4" />
      </button>

      {/* Filter Modal for mobile */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-white rounded-2xl p-6 w-11/12 max-w-xs shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowFilterModal(false)}
              aria-label="Close filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-4">
              <label htmlFor="status-filter-mobile" className="block text-sm font-semibold text-[#1a4d5c] mb-1">Status</label>
              <select
                id="status-filter-mobile"
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setShowFilterModal(false);
                }}
                className="mt-1 block w-full rounded-lg border-[#e0c36a] shadow-sm focus:border-[#2699a6] focus:ring-[#2699a6] text-[#1a4d5c] bg-[#e6f0f3] font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filters for desktop only */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 hidden md:block">
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {submissions.map((submission) => (
            <div key={submission._id} className="bg-white border-2 border-[#e0c36a] rounded-2xl shadow flex flex-col overflow-hidden">
              {/* Image area */}
              <div className="relative w-full aspect-[4/3] bg-[#e6f0f3]">
                <ImageWithFallback
                  src={submission.thumbnailUrl || submission.imageUrl}
                  alt={submission.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                {/* Competition title and status */}
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/dashboard/competitions/${submission.competition._id}`}
                    className="font-bold text-lg text-[#1a4d5c] hover:underline"
                  >
                    {submission.competition.title}
                  </Link>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow ${getCompetitionStatusColor(submission.competition.status)}`}>
                    {submission.competition.status.charAt(0).toUpperCase() + submission.competition.status.slice(1)}
                  </span>
                </div>
                {/* Submission title and status */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#2699a6] font-semibold text-base">{submission.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow ${getStatusColor(submission.status)}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">Submitted on {formatDate(submission.createdAt)}</div>
                {/* Ratings */}
                {(submission.status === 'approved' && submission.competition.status !== 'upcoming' && submission.competition.status !== 'active') && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-500">★</span>
                    <span className="text-sm text-gray-700">
                      {submission.averageRating > 0 
                        ? `${submission.averageRating.toFixed(1)} (${submission.ratingsCount} ${submission.ratingsCount === 1 ? 'rating' : 'ratings'})` 
                        : 'No ratings yet'}
                    </span>
                  </div>
                )}
                {/* Status notes */}
                {submission.status === 'rejected' && (
                  <div className="text-sm text-red-600 mb-2">
                    This photo was not approved for the competition.
                  </div>
                )}
                {submission.status === 'pending' && (
                  <div className="text-sm text-yellow-600 mb-2">
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

      {/* All My Submitted Images Section */}
      {allImages.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-[#1a4d5c] mb-3">All My Submitted Images</h2>
          <div className="flex overflow-x-auto gap-3 pb-2">
            {allImages.map((img) => (
              <button
                key={img._id}
                className="flex-shrink-0 w-24 h-18 rounded-lg border border-[#e0c36a] overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#e0c36a]"
                onClick={() => setModalImage(img.imageUrl || img.thumbnailUrl)}
                aria-label={img.title}
              >
                <img
                  src={img.thumbnailUrl || img.imageUrl}
                  alt={img.title}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal for full image */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalImage(null)}>
          <div className="relative max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <img src={modalImage} alt="Full submission" className="w-full h-auto rounded-lg shadow-lg" />
            <button
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-[#1a4d5c] rounded-full p-2 shadow"
              onClick={() => setModalImage(null)}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 