'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

// Extended session type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// Types
interface User {
  _id: string;
  name: string;
  email?: string;
  profileImage?: string;
}

interface Rating {
  _id: string;
  user: User;
  score: number;
  createdAt: string;
}

interface Submission {
  _id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingCount: number;
  ratings?: Rating[];
  user: User;
  globalRank?: number;
}

interface Competition {
  _id: string;
  title: string;
  theme: string;
  status: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function CompetitionRatings() {
  const { data: session } = useSession() as { data: ExtendedSession | null, status: string };
  const params = useParams();
  const router = useRouter();
  const competitionId = params?.id as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });

  // Security check
  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch competition and submission data
  useEffect(() => {
    const fetchData = async () => {
      if (!competitionId) return;

      try {
        setLoading(true);

        // Fetch competition details
        const competitionRes = await fetch(`/api/competitions/${competitionId}`);
        if (!competitionRes.ok) {
          throw new Error('Failed to fetch competition details');
        }
        const competitionData = await competitionRes.json();
        setCompetition(competitionData.data);

        // First, fetch ALL submissions to calculate global rankings
        const allSubmissionsRes = await fetch(`/api/photo-submissions?competition=${competitionId}&status=approved&limit=1000`);
        if (!allSubmissionsRes.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const allSubmissionsData = await allSubmissionsRes.json();
        
        // Get detailed ratings for each submission
        const allSubmissionsWithRatings = await Promise.all(
          allSubmissionsData.data.map(async (submission: Submission) => {
            const ratingsRes = await fetch(`/api/ratings?photo=${submission._id}&detailed=true`);
            if (ratingsRes.ok) {
              const ratingsData = await ratingsRes.json();
              return { ...submission, ratings: ratingsData.data || [] };
            }
            return submission;
          })
        );

        // Sort all submissions by rating for global ranking
        const globalSortedSubmissions = [...allSubmissionsWithRatings].sort((a, b) => {
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          return (b.ratingCount || 0) - (a.ratingCount || 0);
        });

        // Calculate global rankings and add rank property
        const submissionsWithGlobalRanks = globalSortedSubmissions.map((submission, index) => ({
          ...submission,
          globalRank: index + 1
        }));

        // Apply pagination on the frontend
        const startIndex = (currentPage - 1) * 20;
        const endIndex = startIndex + 20;
        const paginatedSubmissions = submissionsWithGlobalRanks.slice(startIndex, endIndex);

        setSubmissions(paginatedSubmissions);
        
        // Update pagination info
        setPagination({
          total: allSubmissionsWithRatings.length,
          page: currentPage,
          limit: 20,
          pages: Math.ceil(allSubmissionsWithRatings.length / 20)
        });

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchData();
    }
  }, [competitionId, session, currentPage]);

  // Toggle expanded submission view
  const toggleExpand = (submissionId: string) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedSubmission(null); // Close any expanded submissions when changing pages
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const totalPages = pagination.pages;
    const current = currentPage;
    
    // Always show first page
    if (totalPages > 0) pages.push(1);
    
    // Show pages around current page
    for (let i = Math.max(2, current - 2); i <= Math.min(totalPages - 1, current + 2); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    return pages.sort((a, b) => a - b);
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

  if (error || !competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || 'Competition not found'}</p>
        </div>
        <Link 
          href="/admin/competitions"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Competitions
        </Link>
      </div>
    );
  }

  // For regular users, only show results if competition is completed
  // For admins, always show results even during voting phase
  if (competition.status !== 'completed' && session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">Results will be available once the competition is completed.</p>
        </div>
        <Link 
          href="/admin/competitions"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Competitions
        </Link>
      </div>
    );
  }
  
  // Flag to show info banner when admin is viewing voting-phase ratings
  const isVoting = competition.status === 'voting';
  const showVotingBanner = isVoting && session?.user?.role === 'admin';

  // Badge assignment logic based on global ranks
  function getBadge(globalRank: number | undefined) {
    if (globalRank === 1) return { label: '1st', color: 'bg-yellow-400', text: 'Gold' };
    if (globalRank === 2) return { label: '2nd', color: 'bg-gray-300', text: 'Silver' };
    if (globalRank === 3) return { label: '3rd', color: 'bg-orange-400', text: 'Bronze' };
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/admin/competitions"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Competitions
        </Link>
      </div>

      {/* Admin viewing voting-phase ratings banner */}
      {showVotingBanner && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <p className="text-blue-700">
            <span className="font-bold">Admin View:</span> You are viewing live ratings during the voting phase. 
            These results are not visible to regular users until the competition is completed.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{competition.title} - Ratings</h1>
        <p className="text-sm text-gray-500 mt-1">Theme: {competition.theme}</p>
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium 
              ${competition.status === 'completed' ? 'bg-gray-800 text-white' :
                competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
                competition.status === 'active' ? 'bg-green-100 text-green-800' :
                competition.status === 'voting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'}`}
          >
            {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
          </span>
          {pagination.total > 0 && (
            <p className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} submissions
            </p>
          )}
        </div>
      </div>

      {/* Submissions list with ratings */}
      {submissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No submissions available for this competition.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Results</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Final rankings and ratings for all submissions.
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {submissions.map((submission) => {
              const badge = getBadge(submission.globalRank);
              return (
                <li key={submission._id} className="px-4 py-5 sm:px-6">
                  <div className="flex flex-col md:flex-row md:items-center">
                    <div className="flex-shrink-0 mr-4 mb-4 md:mb-0">
                      <div className="relative h-24 w-32 rounded-lg overflow-hidden">
                        <Image
                          src={submission.thumbnailUrl || submission.imageUrl}
                          alt={submission.title}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-gray-900">{submission.title}</h4>
                        <div className="flex items-center">
                          <svg className="text-yellow-400 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-lg font-medium">
                            {submission.averageRating.toFixed(1)} ({submission.ratingCount} votes)
                          </span>
                        </div>
                      </div>
                      {/* User details and badge */}
                      <div className="flex items-center mt-2">
                        {badge && (
                          <span className={`inline-flex items-center px-2 py-1 mr-2 rounded text-xs font-bold text-white ${badge.color}`}>{badge.label} <span className="ml-1">{badge.text}</span></span>
                        )}
                        {submission.user?.profileImage && (
                          <Image src={submission.user.profileImage} alt={submission.user.name} width={32} height={32} className="rounded-full mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{submission.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{submission.user?.email}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExpand(submission._id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          {expandedSubmission === submission._id ? 'Hide Ratings' : 'Show Ratings'}
                          <svg 
                            className={`ml-1 h-4 w-4 transition-transform ${expandedSubmission === submission._id ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Expanded ratings list */}
                  {expandedSubmission === submission._id && (
                    <div className="mt-4 bg-gray-50 rounded-md p-4">
                      <h5 className="font-medium text-gray-700 mb-3">Individual Ratings</h5>
                      {submission.ratings && submission.ratings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  User
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Rating
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {submission.ratings.map((rating) => (
                                <tr key={rating._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {rating.user?.name || 'Anonymous'}
                                    </div>
                                    <div className="text-sm text-gray-500">{rating.user?.email}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <span
                                            key={star}
                                            className={`text-lg ${
                                              star <= rating.score
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          >
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      <span className="ml-2 text-sm text-gray-700">
                                        {rating.score}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {format(new Date(rating.createdAt), 'MMM d, yyyy h:mm a')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No individual ratings found.</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
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
                      {getPageNumbers().map((pageNum, index, array) => (
                        <div key={pageNum}>
                          {index > 0 && array[index - 1] !== pageNum - 1 && (
                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                              ...
                            </span>
                          )}
                          <button
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
} 