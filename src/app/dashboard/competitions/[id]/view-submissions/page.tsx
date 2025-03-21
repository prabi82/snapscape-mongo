'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface Submission {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingCount: number;
  userRating?: number;
  createdAt: string;
  user?: {
    _id: string;
    name?: string;
    email?: string;
    profileImage?: string;
  };
}

interface Competition {
  _id: string;
  title: string;
  theme: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  hideOtherSubmissions?: boolean;
}

export default function ViewSubmissions() {
  const { data: session, status } = useSession();
  const params = useParams();
  const competitionId = params?.id as string;
  const router = useRouter();
  
  // Add a check for admin status
  const isAdmin = session?.user?.role === 'admin';
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'highest', 'lowest'
  
  // Modal state for full-screen view
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // State for image transition effects
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousSubmission, setPreviousSubmission] = useState<Submission | null>(null);
  
  // Fetch competition and submissions data
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
        
        // Fetch approved submissions for this competition
        const submissionsRes = await fetch(`/api/photo-submissions?competition=${competitionId}&status=approved`);
        if (!submissionsRes.ok) {
          const errorData = await submissionsRes.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch submissions');
        }
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData.data || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && competitionId) {
      fetchData();
    }
  }, [competitionId, status]);

  // Handle voting/rating
  const handleRatePhoto = async (submissionId: string, rating: number) => {
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photo: submissionId,
          score: rating,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit rating');
      }
      
      const responseData = await response.json();
      
      // Update submission in state with new rating
      setSubmissions(submissions.map(submission => 
        submission._id === submissionId 
          ? { 
              ...submission, 
              userRating: rating,
              averageRating: responseData.data.averageRating,
              ratingCount: responseData.data.ratingsCount
            } 
          : submission
      ));
      
      // Also update the selectedSubmission if it's the one being rated
      if (selectedSubmission && selectedSubmission._id === submissionId) {
        setSelectedSubmission({
          ...selectedSubmission,
          userRating: rating,
          averageRating: responseData.data.averageRating,
          ratingCount: responseData.data.ratingsCount
        });
      }
      
    } catch (err: any) {
      console.error('Error rating photo:', err);
      alert(err.message || 'An error occurred while rating the photo');
    }
  };

  // Sort submissions based on the selected criteria
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'highest') {
      return b.averageRating - a.averageRating;
    } else if (sortBy === 'lowest') {
      return a.averageRating - b.averageRating;
    }
    return 0;
  });

  // Handle opening the full-screen modal
  const openModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setModalOpen(true);
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  // Handle closing the full-screen modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedSubmission(null);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

  // Handle navigation between images in full screen mode
  const navigateImages = (direction: 'next' | 'prev') => {
    if (!selectedSubmission || isTransitioning) return;
    
    const currentIndex = sortedSubmissions.findIndex(
      submission => submission._id === selectedSubmission._id
    );
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % sortedSubmissions.length;
    } else {
      newIndex = (currentIndex - 1 + sortedSubmissions.length) % sortedSubmissions.length;
    }
    
    // Start transition
    setDirection(direction);
    setIsTransitioning(true);
    setPreviousSubmission(selectedSubmission);
    
    // Change the image
    setSelectedSubmission(sortedSubmissions[newIndex]);
    
    // End transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousSubmission(null);
    }, 600); // Increased from 300ms to 600ms for slower transition
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
          href="/dashboard/competitions"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Competitions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href={`/dashboard/competitions/${competitionId}`}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Competition Details
        </Link>
      </div>
      
      {/* Competition header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{competition.title} - Submissions</h1>
        <p className="text-sm text-gray-500">Theme: {competition.theme}</p>
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 
              competition.status === 'active' ? 'bg-green-100 text-green-800' :
              competition.status === 'voting' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
          </span>
        </div>
      </div>
      
      {/* Sorting options */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="text-sm text-gray-700">
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </span>
        </div>
        <div className="flex items-center">
          <label htmlFor="sortBy" className="mr-2 text-sm text-gray-700">Sort by:</label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md p-1"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>
      
      {/* Submissions masonry grid */}
      {submissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No approved submissions available for this competition.</p>
        </div>
      ) : (
        <>
          {/* Show a notice if the competition is in active status and hideOtherSubmissions is enabled */}
          {competition.status === 'active' && competition.hideOtherSubmissions && !isAdmin && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    During the active submission phase, you can only view your own submitted photos. All submissions will be visible during the voting phase.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
            {sortedSubmissions.map((submission) => (
              <div 
                key={submission._id} 
                className="relative aspect-square overflow-hidden cursor-pointer hover:opacity-95 transition-opacity group"
                onClick={() => openModal(submission)}
              >
                <Image 
                  src={submission.imageUrl || submission.thumbnailUrl} 
                  alt={submission.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Caption overlay with title and description */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-16 pb-3 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <h3 className="text-white text-lg font-medium mb-1 line-clamp-1">{submission.title}</h3>
                  <p className="text-gray-200 text-sm line-clamp-2">{submission.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Full screen modal */}
      {modalOpen && selectedSubmission && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden"
          onClick={closeModal}
        >
          <div className="relative w-full h-full">
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-white z-20 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              onClick={closeModal}
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Navigation buttons */}
            <button 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white z-20 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                navigateImages('prev');
              }}
              aria-label="Previous image"
              disabled={isTransitioning}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white z-20 bg-black bg-opacity-50 rounded-full p-3 hover:bg-opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                navigateImages('next');
              }}
              aria-label="Next image"
              disabled={isTransitioning}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Full screen images with transition */}
            <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
              {/* Current image */}
              <div 
                className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                  isTransitioning && direction === 'next' ? 'translate-x-0 animate-slide-in-right' : 
                  isTransitioning && direction === 'prev' ? 'translate-x-0 animate-slide-in-left' : 
                  ''
                }`}
              >
                <div className="relative w-full h-full">
                  <Image 
                    src={selectedSubmission.imageUrl} 
                    alt={selectedSubmission.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
              
              {/* Previous image (for transition) */}
              {isTransitioning && previousSubmission && (
                <div 
                  className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                    direction === 'next' ? 'animate-slide-out-left' : 
                    direction === 'prev' ? 'animate-slide-out-right' : 
                    ''
                  }`}
                >
                  <div className="relative w-full h-full">
                    <Image 
                      src={previousSubmission.imageUrl} 
                      alt={previousSubmission.title}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Title and info overlay at the bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-16 pb-8 px-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto flex flex-col items-center">
                <h3 className="text-white text-xl font-medium mb-1">{selectedSubmission.title}</h3>
                <p className="text-gray-200 text-sm mb-4 max-w-3xl">{selectedSubmission.description}</p>
                
                {/* Rating controls - enhanced and centered */}
                {competition.status === 'voting' && (
                  <div className="flex flex-col items-center mt-2">
                    {selectedSubmission.user && selectedSubmission.user._id && session?.user?.id === selectedSubmission.user._id.toString() ? (
                      <div className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-md">
                        <p className="text-sm font-medium">This photo is submitted by You</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatePhoto(selectedSubmission._id, star)}
                              className={`text-3xl focus:outline-none transform transition-transform hover:scale-125 ${
                                selectedSubmission.userRating && selectedSubmission.userRating >= star 
                                  ? 'text-yellow-500' 
                                  : 'text-white hover:text-yellow-300'
                              }`}
                              aria-label={`Rate ${star} stars`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        
                        {/* Show user's own rating */}
                        <p className="text-yellow-300 text-sm mt-1">
                          {selectedSubmission.userRating 
                            ? `Your rating: ${selectedSubmission.userRating} ${selectedSubmission.userRating === 1 ? 'star' : 'stars'}` 
                            : 'Click to rate this photo'}
                        </p>
                      </>
                    )}
                    
                    {/* Show average rating only to admins during voting stage */}
                    {(isAdmin || competition.status !== 'voting') && (
                      <p className="text-white text-sm mt-2">
                        {selectedSubmission.averageRating > 0 
                          ? `Average: ${selectedSubmission.averageRating.toFixed(1)} (${selectedSubmission.ratingCount} ${selectedSubmission.ratingCount === 1 ? 'vote' : 'votes'})` 
                          : 'No ratings yet'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideOutLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        
        @keyframes slideOutRight {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 600ms ease-in-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 600ms ease-in-out forwards;
        }
        
        .animate-slide-out-left {
          animation: slideOutLeft 600ms ease-in-out forwards;
        }
        
        .animate-slide-out-right {
          animation: slideOutRight 600ms ease-in-out forwards;
        }
      `}</style>
    </div>
  );
} 