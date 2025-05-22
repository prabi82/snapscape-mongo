'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

// Define extended session type to include role and id properties
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
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string };
  const params = useParams();
  const competitionId = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Track total submissions from API pagination if available
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  
  const showResults = competition?.status === 'completed' || searchParams?.get('result') === '1';
  
  // Fetch competition and submissions data
  useEffect(() => {
    const fetchData = async () => {
      if (!competitionId) return;
      try {
        setLoading(true);
        // Fetch competition details only
        const competitionRes = await fetch(`/api/competitions/${competitionId}`);
        if (!competitionRes.ok) {
          throw new Error('Failed to fetch competition details');
        }
        const competitionData = await competitionRes.json();
        setCompetition(competitionData.data);
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

  // Fetch submissions with pagination
  const fetchSubmissions = async (resetPage = false) => {
    setIsLoadingMore(true);
    try {
      console.log('Fetching submissions for competition:', competitionId); // Debug log
      const res = await fetch(`/api/submissions?competition=${competitionId}&status=approved&showAll=true&limit=12&page=${resetPage ? 1 : page}`);
      if (!res.ok) throw new Error('Failed to fetch submissions');
      const data = await res.json();
      console.log('Fetched submissions:', data); // Debug log

      // Fetch user ratings for each submission
      const submissionsWithRatings = await Promise.all(
        (data.data || []).map(async (submission: any) => {
          try {
            const ratingRes = await fetch(`/api/ratings?photo=${submission._id}`);
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              return {
                ...submission,
                userRating: ratingData.data?.score
              };
            }
          } catch (err) {
            console.error('Error fetching rating for submission:', submission._id, err);
          }
          return submission;
        })
      );

      if (resetPage || page === 1) {
        setSubmissions(submissionsWithRatings);
      } else {
        // Deduplicate submissions when adding new ones
        setSubmissions(prev => {
          const existingIds = new Set(prev.map(s => s._id));
          const newSubmissions = submissionsWithRatings.filter(s => !existingIds.has(s._id));
          return [...prev, ...newSubmissions];
        });
      }
      setHasMore((data.data?.length || 0) === 12);
      if (data.pagination?.total) setTotalSubmissions(data.pagination.total);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (competitionId && status === 'authenticated') {
      fetchSubmissions();
    }
  }, [competitionId, status, page]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore) return;
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (scrollY + clientHeight >= height - 200) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore]);

  // Handle voting/rating
  const handleRatePhoto = async (submissionId: string, rating: number) => {
    try {
      console.log('Submitting rating:', { submissionId, rating }); // Debug log
      
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

      const result = await response.json();
      console.log('Rating submission result:', result); // Debug log

      // Update the submissions array with the new rating
      setSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => 
          submission._id === submissionId 
            ? { 
                ...submission, 
                userRating: rating,
                averageRating: result.data.averageRating,
                ratingCount: result.data.ratingsCount
              }
            : submission
        )
      );

      // Update the selected submission if it's the one being rated
      if (selectedSubmission && selectedSubmission._id === submissionId) {
        setSelectedSubmission(prev => 
          prev ? {
            ...prev,
            userRating: rating,
            averageRating: result.data.averageRating,
            ratingCount: result.data.ratingsCount
          } : null
        );
      }

    } catch (err: any) {
      console.error('Error rating photo:', err);
      alert(err.message || 'An error occurred while rating the photo');
    }
  };

  // Memoize the navigation function
  const navigateImages = useCallback(async (direction: 'next' | 'prev') => {
    if (!selectedSubmission || isTransitioning) return;
    
    const currentIndex = submissions.findIndex(
      submission => submission._id === selectedSubmission._id
    );
    
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex + 1;
      // If we're at the end of current submissions and there are more to load
      if (newIndex >= submissions.length && hasMore) {
        setIsLoadingMore(true);
        try {
          const nextPage = page + 1;
          const res = await fetch(`/api/submissions?competition=${competitionId}&status=approved&showAll=true&limit=12&page=${nextPage}`);
          if (!res.ok) throw new Error('Failed to fetch more submissions');
          const data = await res.json();
          
          // Fetch user ratings for new submissions
          const newSubmissionsWithRatings = await Promise.all(
            (data.data || []).map(async (submission: any) => {
              try {
                const ratingRes = await fetch(`/api/ratings?photo=${submission._id}`);
                if (ratingRes.ok) {
                  const ratingData = await ratingRes.json();
                  return {
                    ...submission,
                    userRating: ratingData.data?.score
                  };
                }
              } catch (err) {
                console.error('Error fetching rating for submission:', submission._id, err);
              }
              return submission;
            })
          );

          // Deduplicate submissions when adding new ones
          setSubmissions(prev => {
            const existingIds = new Set(prev.map(s => s._id));
            const uniqueNewSubmissions = newSubmissionsWithRatings.filter(s => !existingIds.has(s._id));
            return [...prev, ...uniqueNewSubmissions];
          });
          
          setPage(nextPage);
          setHasMore((data.data?.length || 0) === 12);
          if (data.pagination?.total) setTotalSubmissions(data.pagination.total);
          
          // Now that we have more submissions, update the newIndex
          newIndex = submissions.length;
        } catch (err) {
          console.error('Error loading more submissions:', err);
          return; // Don't proceed with navigation if loading more failed
        } finally {
          setIsLoadingMore(false);
        }
      }
    } else {
      newIndex = currentIndex - 1;
    }
    
    // Ensure newIndex is within bounds
    if (newIndex < 0 || newIndex >= submissions.length) return;
    
    // Start transition
    setDirection(direction);
    setIsTransitioning(true);
    setPreviousSubmission(selectedSubmission);
    
    // Change the image
    setSelectedSubmission(submissions[newIndex]);
    
    // End transition after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
      setPreviousSubmission(null);
    }, 600);
  }, [selectedSubmission, isTransitioning, submissions, hasMore, page, competitionId]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          navigateImages('prev');
          break;
        case 'ArrowRight':
          navigateImages('next');
          break;
        case 'Escape':
          closeModal();
          break;
      }
    };

    // Add scroll wheel navigation
    const handleWheel = (e: WheelEvent) => {
      if (!modalOpen) return;
      
      // Prevent default scroll behavior
      e.preventDefault();
      
      // Use a small threshold to prevent accidental triggers
      if (Math.abs(e.deltaY) > 10) {
        if (e.deltaY > 0) {
          navigateImages('next');
        } else {
          navigateImages('prev');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [modalOpen, navigateImages]);

  // Sort submissions based on the selected criteria
  const sortedSubmissions = useMemo(() => {
    // Ensure unique submissions before sorting
    const uniqueSubmissions = Array.from(
      new Map(submissions.map(s => [s._id, s])).values()
    );
    
    return uniqueSubmissions.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'highest') {
        return b.averageRating - a.averageRating;
      } else if (sortBy === 'lowest') {
        return a.averageRating - b.averageRating;
      }
      return 0;
    });
  }, [submissions, sortBy]);

  // Handle opening the full-screen modal
  const openModal = (submission: Submission) => {
    // Always use the latest submission object from the array (with userRating)
    const latest = submissions.find(s => s._id === submission._id) || submission;
    setSelectedSubmission(latest);
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

  // Badge assignment logic for ties (reuse from admin)
  let goldRating: number | null = null, silverRating: number | null = null, bronzeRating: number | null = null;
  const resultsSubmissions = [...submissions].sort((a, b) => {
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    return (b.ratingCount || 0) - (a.ratingCount || 0);
  });
  resultsSubmissions.forEach(sub => {
    if (goldRating === null && sub.averageRating > 0) goldRating = sub.averageRating;
    else if (silverRating === null && goldRating !== null && sub.averageRating < goldRating && sub.averageRating > 0) silverRating = sub.averageRating;
    else if (bronzeRating === null && silverRating !== null && sub.averageRating < silverRating && sub.averageRating > 0) bronzeRating = sub.averageRating;
  });
  function getBadge(rating: number) {
    if (goldRating !== null && rating === goldRating) return { label: '1st', color: 'bg-yellow-400', text: 'Gold' };
    if (silverRating !== null && rating === silverRating) return { label: '2nd', color: 'bg-gray-300', text: 'Silver' };
    if (bronzeRating !== null && rating === bronzeRating) return { label: '3rd', color: 'bg-orange-400', text: 'Bronze' };
    return null;
  }

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

  if (showResults) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{competition.title} - Results</h1>
          <p className="text-sm text-gray-500">Theme: {competition.theme}</p>
        </div>
        {resultsSubmissions.length === 0 ? (
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
              {(() => {
                let currentActualRank = 0;
                let lastAvgRating = -Infinity; // Initialize to a value that won't match
                let lastRatingCount = -Infinity;

                return resultsSubmissions.map((submission, index) => {
                  // Determine actual dense rank
                  if (submission.averageRating !== lastAvgRating || (submission.ratingCount || 0) !== lastRatingCount) {
                    currentActualRank++;
                  }
                  // Update tracking variables for the next iteration
                  lastAvgRating = submission.averageRating;
                  lastRatingCount = (submission.ratingCount || 0);
                  
                  const rankToDisplay = currentActualRank;
                  
                  // Calculate total rating
                  const totalRating = submission.averageRating * (submission.ratingCount || 0);
                  
                  // Apply ranking multiplier based on position
                  let multiplier = 1; // Default for 4th place and beyond
                  if (rankToDisplay === 1) {
                    multiplier = 5;
                  } else if (rankToDisplay === 2) {
                    multiplier = 3;
                  } else if (rankToDisplay === 3) {
                    multiplier = 2;
                  }
                  
                  // Calculate points with the multiplier
                  const totalPoints = Math.round(totalRating * multiplier);

                  let rankText = '';
                  let rankColor = 'bg-gray-500'; // Default for ranks > 3
                  let trophyIcon: React.ReactNode = null;

                  if (rankToDisplay === 1) { 
                    rankText = '1st'; 
                    rankColor = 'bg-yellow-400'; 
                    trophyIcon = <span className="mr-1" role="img" aria-label="gold trophy">🥇</span>; 
                  } else if (rankToDisplay === 2) { 
                    rankText = '2nd'; 
                    rankColor = 'bg-gray-300'; 
                    trophyIcon = <span className="mr-1" role="img" aria-label="silver trophy">🥈</span>; 
                  } else if (rankToDisplay === 3) { 
                    rankText = '3rd'; 
                    rankColor = 'bg-orange-400'; 
                    trophyIcon = <span className="mr-1" role="img" aria-label="bronze trophy">🥉</span>; 
                  } else {
                     if (rankToDisplay % 100 >= 11 && rankToDisplay % 100 <= 13) {
                        rankText = `${rankToDisplay}th`;
                    } else {
                        switch (rankToDisplay % 10) {
                            case 1: rankText = `${rankToDisplay}st`; break;
                            case 2: rankText = `${rankToDisplay}nd`; break;
                            case 3: rankText = `${rankToDisplay}rd`; break;
                            default: rankText = `${rankToDisplay}th`; break;
                        }
                    }
                    // No trophy icon for ranks > 3, color is already set to default.
                  }
                  
                  const isCurrentUserSubmission = session?.user?.id === submission.user?._id;

                  return (
                    <li 
                      key={submission._id} 
                      className={`px-4 py-5 sm:px-6 ${isCurrentUserSubmission ? 'bg-indigo-50' : ''}`}
                    >
                      {/* Main container for a submission item: flex-col on mobile, md:flex-row on desktop */}
                      <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                        {/* Image Section: full width on mobile, fixed on desktop */}
                        <div className="w-full md:w-32 flex-shrink-0 mb-3 md:mb-0">
                          <div className="relative h-48 sm:h-32 md:h-24 w-full md:w-32 rounded-lg overflow-hidden">
                            <Image
                              src={submission.thumbnailUrl || submission.imageUrl}
                              alt={submission.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 128px"
                              className="object-cover"
                            />
                          </div>
                        </div>
                        {/* Details Section Wrapper */}
                        <div className="flex-1">
                          {/* Mobile View Details - visible by default, hidden on md and up */}
                          <div className="flex flex-col items-center mt-3 md:hidden">
                            {/* 1. Rank Badge (centered) */}
                            <div className="mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${rankColor}`}>
                                {trophyIcon} {rankText} <span className="ml-1">Rank</span>
                              </span>
                            </div>
                            {/* 2. Title (centered) */}
                            <h4 className="text-center text-md sm:text-lg font-medium text-gray-900 mb-2 truncate w-full px-1">{submission.title}</h4>
                            {/* 3. Ratings (centered row) */}
                            <div className="flex flex-row items-center justify-center space-x-3 mb-2">
                              {/* Avg Rating */}
                              <div className="flex items-center">
                                <svg className="text-yellow-400 h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-xs sm:text-sm font-medium">
                                  {submission.averageRating.toFixed(1)} ({submission.ratingCount} votes)
                                </span>
                              </div>
                              {/* Total Rating */}
                              <div className="flex items-center">
                                <svg className="text-green-500 h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {totalRating.toFixed(1)} (Total Rating)
                                </span>
                              </div>
                              {/* Total Points - Add this section */}
                              <div className="flex items-center justify-center mt-2">
                                <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                                  <span className="font-bold">{totalPoints}</span>
                                  <span className="ml-1">(Total Points)</span>
                                  <span className="ml-1 text-xs">×{multiplier}</span>
                                </div>
                              </div>
                            </div>
                            {/* 4. User Name (centered, no avatar) */}
                            <div className="flex justify-center items-center mt-1">
                              <div className="text-sm font-medium text-gray-900">{submission.user?.name || 'Unknown'}</div>
                            </div>
                          </div>

                          {/* Desktop View Details - hidden by default, visible as block on md and up */}
                          <div className="hidden md:block">
                            {/* Row 1: Title | Ratings */}
                            <div className="flex items-start justify-between">
                              <h4 className="text-lg font-medium text-gray-900 mr-2 truncate">{submission.title}</h4>
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center justify-end">
                                  <svg className="text-yellow-400 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  <span className="text-lg font-medium">
                                    {submission.averageRating.toFixed(1)} ({submission.ratingCount} votes)
                                  </span>
                                </div>
                                {/* Total Rating */}
                                <div className="flex items-center justify-end mt-1">
                                  <svg className="text-green-500 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                  <span className="text-sm text-gray-500">
                                    {totalRating.toFixed(1)} (Total Rating)
                                  </span>
                                </div>
                                {/* Total Points - Desktop view */}
                                <div className="flex items-center justify-end mt-2">
                                  <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                    <span className="font-bold">{totalPoints}</span>
                                    <span className="ml-1">(Total Points)</span>
                                    <span className="ml-1 text-xs">×{multiplier}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Row 2: Rank | Avatar | User Name */}
                            <div className="flex items-center mt-2">
                              <span className={`inline-flex items-center px-2 py-1 mr-2 rounded text-xs font-bold text-white ${rankColor}`}>
                                {trophyIcon} {rankText} <span className="ml-1">Rank</span>
                              </span>
                              {submission.user?.profileImage && typeof submission.user.profileImage === 'string' && (
                                <Image src={submission.user.profileImage || '/default-profile.png'} alt={submission.user.name || 'User'} width={32} height={32} className="rounded-full mr-2" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">{submission.user?.name || 'Unknown'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        )}
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
            {totalSubmissions !== null ? totalSubmissions : submissions.length} {(totalSubmissions !== null ? totalSubmissions : submissions.length) === 1 ? 'submission' : 'submissions'}
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
          <div className="grid grid-cols-3 gap-0">
            {sortedSubmissions.map((submission) => (
              <div
                key={submission._id}
                className="relative w-full aspect-[4/3] group overflow-hidden cursor-pointer"
                onClick={() => openModal(submission)}
              >
                <Image
                  src={submission.thumbnailUrl || submission.imageUrl}
                  alt={submission.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-4">
                  <div className="font-bold text-base mb-1 truncate w-full text-center">{submission.title}</div>
                  {submission.user && (
                    (!competition.hideOtherSubmissions || competition.status !== 'voting' || isAdmin || session?.user?.id === submission.user._id) ? (
                      <div className="text-xs mb-1 truncate w-full text-center">By: {submission.user.name || 'Unknown'}</div>
                    ) : null
                  )}
                  <div className="text-xs w-full text-center">Uploaded: {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
          {isLoadingMore && (
            <div className="flex justify-center items-center py-6">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </>
      )}
      
      {/* Modal for enlarged image */}
      {modalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 landscape-modal-container" onClick={closeModal}>
          <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center landscape-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-8 z-10 bg-white/80 hover:bg-white text-[#1a4d5c] rounded-full p-2 shadow landscape-close-btn" onClick={closeModal} aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image on the left */}
            <div className="flex-1 h-full relative modal-image-area landscape-image-container" key={selectedSubmission._id}>
              <Image
                key={selectedSubmission._id}
                src={selectedSubmission.imageUrl || selectedSubmission.thumbnailUrl}
                alt={selectedSubmission.title || 'Submission photo'}
                fill
                className="object-contain w-full h-full modal-image landscape-image"
              />
              
              {/* Left navigation arrow - inside image container */}
              <button 
                className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full landscape-nav-btn landscape-prev-btn ${
                  submissions.findIndex(s => s._id === selectedSubmission._id) <= 0 
                    ? 'bg-gray-300/40 text-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-white/40 hover:bg-white/60 text-[#1a4d5c] shadow'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImages('prev');
                }}
                disabled={submissions.findIndex(s => s._id === selectedSubmission._id) <= 0}
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Right navigation arrow - inside image container at right edge */}
              <button 
                className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full landscape-nav-btn landscape-next-btn ${
                  !hasMore && submissions.findIndex(s => s._id === selectedSubmission._id) >= submissions.length - 1
                    ? 'bg-gray-300/40 text-gray-500 cursor-not-allowed opacity-50' 
                    : 'bg-white/40 hover:bg-white/60 text-[#1a4d5c] shadow'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImages('next');
                }}
                disabled={!hasMore && submissions.findIndex(s => s._id === selectedSubmission._id) >= submissions.length - 1}
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {/* Sidebar on the right */}
            <div className="w-full md:w-64 h-full flex flex-col justify-center bg-black/70 p-6 md:rounded-none rounded-b-2xl md:rounded-r-2xl modal-sidebar landscape-sidebar">
              <div className="font-bold text-2xl text-white mb-2 text-center md:text-left">{selectedSubmission.title}</div>
              {selectedSubmission.user && (
                (!competition.hideOtherSubmissions || competition.status !== 'voting' || isAdmin || session?.user?.id === selectedSubmission.user._id) ? (
                  <div className="text-base text-[#e0c36a] mb-2 text-center md:text-left">By: {selectedSubmission.user.name || 'Unknown'}</div>
                ) : null
              )}
              <div className="text-xs text-gray-200 mb-4 text-center md:text-left">Uploaded: {selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleDateString() : ''}</div>
              {selectedSubmission.description && (
                <div className="text-sm text-gray-100 mt-2 text-center md:text-left">{selectedSubmission.description}</div>
              )}
              {/* Rating controls - only in voting phase */}
              {competition.status === 'voting' && (
                <div className="flex flex-col items-center mt-4">
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
                            aria-label={`Rate ${star} stars`}>
                            ★
                          </button>
                        ))}
                      </div>
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
          {/* Completely rewritten mobile and landscape styles with more specific selectors */}
          <style jsx global>{`
            /* Portrait Mode Styles */
            @media (max-width: 767px) and (orientation: portrait) {
              .modal-image-area {
                width: 100vw !important;
                height: 40vh !important;
                min-height: 180px;
                max-height: 50vh;
                position: relative !important;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #111;
              }
              .modal-image {
                object-fit: contain !important;
                width: 100% !important;
                height: 100% !important;
                position: relative !important;
              }
              .modal-sidebar {
                max-height: 50vh;
                overflow-y: auto;
              }
            }
            
            /* Landscape Mode Styles - Completely redesigned and more specific */
            @media screen and (orientation: landscape) and (max-height: 500px) {
              /* Main container */
              .landscape-modal-container {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                overflow: hidden !important;
                display: flex !important;
                background-color: rgba(0, 0, 0, 0.85) !important;
                z-index: 50 !important;
              }
              
              /* Inner container */
              .landscape-modal-inner {
                display: flex !important;
                flex-direction: row !important;
                width: 100% !important;
                height: 100% !important;
                position: relative !important;
              }
              
              /* Image container */
              .landscape-image-container {
                flex: 0 0 70% !important;
                width: 70% !important;
                height: 100vh !important;
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background: #000 !important;
              }
              
              /* Actual image */
              .landscape-image {
                object-fit: contain !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100vh !important;
              }
              
              /* Sidebar */
              .landscape-sidebar {
                flex: 0 0 30% !important;
                width: 30% !important;
                height: 100vh !important;
                overflow-y: auto !important;
                padding: 1rem !important;
                background-color: rgba(0, 0, 0, 0.8) !important;
              }
              
              /* Navigation buttons */
              .landscape-nav-btn {
                position: absolute !important;
                z-index: 20 !important;
                background-color: rgba(255, 255, 255, 0.8) !important;
                border-radius: 50% !important;
                width: 40px !important;
                height: 40px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                padding: 0.5rem !important;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
              }
              
              .landscape-prev-btn {
                left: 1rem !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
              }
              
              .landscape-next-btn {
                right: 1rem !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
              }
              
              /* Close button */
              .landscape-close-btn {
                position: absolute !important;
                top: 1rem !important;
                right: 31% !important; /* Position it just before the sidebar */
                z-index: 30 !important;
                background-color: rgba(255, 255, 255, 0.8) !important;
                border-radius: 50% !important;
                padding: 0.5rem !important;
              }
              
              /* Hide bottom navigation bar when modal is open in landscape mode */
              body:has(.landscape-modal-container) nav,
              body:has(.landscape-modal-container) [role="navigation"],
              body:has(.landscape-modal-container) .fixed.bottom-0,
              body:has(.landscape-modal-container) .fixed.bottom-0.inset-x-0,
              body:has(.landscape-modal-container) .w-full.fixed.bottom-0,
              body:has(.landscape-modal-container) .container.fixed.bottom-0,
              body:has(.landscape-modal-container) .flex.justify-between.items-center.bg-white.border-t.w-full.fixed.bottom-0.inset-x-0 {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
                z-index: -1 !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}