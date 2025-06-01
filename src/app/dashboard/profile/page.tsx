'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DebugInfo from '@/components/DebugInfo';
import React from 'react';
import Head from 'next/head';
import VotedPhotosModal from './VotedPhotosModal';

// Custom interface extending Session to ensure TypeScript knows about our custom fields
interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    username?: string;
    role?: string;
  };
}

// Custom image fallback for user uploads
function ImageWithFallback({ src, alt, ...props }: any) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallbackSrc = "https://placehold.co/600x400?text=No+Image+Available";

  useEffect(() => {
    setImgSrc(src); // Update imgSrc when the src prop changes
  }, [src]);

  return (
    <Image
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
      unoptimized={true}
    />
  );
}

// Define message type
type MessageType = {
  type: 'success' | 'error' | 'info';
  text: string;
};

export default function ProfilePage() {
  // Cast session to our extended type
  const { data: session, status, update: updateSession } = useSession() as { data: ExtendedSession | null, status: string, update: any };
  const typedSession = session as ExtendedSession;
  const router = useRouter();
  
  // Add state for direct user data from database
  const [dbUserData, setDbUserData] = useState<any>(null);
  
  // Log session data when it changes
  useEffect(() => {
    console.log('[ProfilePage] Session object updated:', session);
    if (session?.user) {
      console.log('[ProfilePage] session.user.image:', session.user.image);
      
      // Fetch latest user data from database when session is available
      fetchLatestUserData();
    }
  }, [session]);

  // New function to fetch the latest user data directly from database
  const fetchLatestUserData = async () => {
    if (!session?.user?.id) return;
    
    try {
      console.log('[ProfilePage] Fetching latest user data from database...');
      const response = await fetch(`/api/users/profile`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      console.log('[ProfilePage] Latest user data from database:', data);
      
      if (data.user) {
        setDbUserData(data.user);
        
        // If user data from DB has an image but session doesn't, update session
        if (data.user.image && !session.user.image) {
          console.log('[ProfilePage] Updating session with image from database:', data.user.image);
          await updateSession({
            ...session,
            user: {
              ...session.user,
              image: data.user.image
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
    }
  };

  // State for profile data
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageType | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [userImages, setUserImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState('');
  const [modalImageId, setModalImageId] = useState<string | null>(null);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [archivedImages, setArchivedImages] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [achievements, setAchievements] = useState<any>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [allImagesForCompetition, setAllImagesForCompetition] = useState<Record<string, any[]>>({});
  
  // State for user stats
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [correctedTotalPoints, setCorrectedTotalPoints] = useState<number | null>(null);
  const [pointsBreakdown, setPointsBreakdown] = useState<any>(null);
  const [showPointsBreakdown, setShowPointsBreakdown] = useState<boolean>(false);
  const [otherSubmissionsPoints, setOtherSubmissionsPoints] = useState<number>(0);
  const [showVotedPhotos, setShowVotedPhotos] = useState<boolean>(false);
  const [syncingAchievements, setSyncingAchievements] = useState<boolean>(false);

  // Add a new state to store competition results data
  const [competitionResults, setCompetitionResults] = useState<Record<string, any>>({});

  // Add state for toggling between direct and stored achievements
  const [useDirectResults, setUseDirectResults] = useState(true);

  // Add state to track corrected points
  const [badgesEarned, setBadgesEarned] = useState<number>(0);
  const [competitionsEntered, setCompetitionsEntered] = useState<number>(0);
  const [competitionsWon, setCompetitionsWon] = useState<number>(0);

  // Use modalImageId as the state, always derive the current image object from userImages
  const currentModalIndex = modalImageId ? userImages.findIndex(img => img._id === modalImageId) : -1;
  const currentModalImage = currentModalIndex >= 0 ? userImages[currentModalIndex] : null;

  // Handler to go to next/previous image
  const showNextImage = useCallback(() => {
    if (currentModalIndex >= 0 && currentModalIndex < userImages.length - 1) {
      setModalImageId(userImages[currentModalIndex + 1]._id);
    }
  }, [currentModalIndex, userImages]);
  const showPrevImage = useCallback(() => {
    if (currentModalIndex > 0) {
      setModalImageId(userImages[currentModalIndex - 1]._id);
    }
  }, [currentModalIndex, userImages]);

  // Listen for wheel and arrow key events when modal is open
  useEffect(() => {
    if (!modalImageId) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) showNextImage();
      else if (e.deltaY < 0) showPrevImage();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') showPrevImage();
      if (e.key === 'Escape') setModalImageId(null);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImageId, showNextImage, showPrevImage]);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    // Set initial form values
    if (typedSession?.user) {
      setName(typedSession.user.name || '');
      setEmail(typedSession.user.email || '');
      
      // Fetch user badges and achievements
      fetchUserBadges();
      fetchUserImages();
      fetchAchievements();
      fetchUserStats(); // Call new function to fetch stats
      
      // Force a second stats refresh after a short delay to ensure we get the latest data
      setTimeout(() => {
        console.log('[DEBUG-PROFILE] Force refreshing stats after delay');
        fetchUserStats();
      }, 2000);
    }
  }, [typedSession, status, router]);
  
  // Set up periodic refresh for achievements
  useEffect(() => {
    // Initial fetch
    if (typedSession?.user?.id) {
      // Force a refresh of achievements when the component mounts
      const loadAchievements = async () => {
        console.log('[PROFILE-PAGE] Initial load - refreshing achievements data');
        await fetchAchievements();
        
        // For each competition, ensure we have the direct results
        if (achievements && achievements.achievements) {
          await Promise.all(
            achievements.achievements.map((comp: any) => 
              fetchCompetitionResults(comp.competitionId)
            )
          );
          
          // Force a second update after a short delay to ensure we have the most up-to-date data
          setTimeout(() => {
            console.log('[PROFILE-PAGE] Follow-up refresh to ensure all achievements are loaded');
            fetchAchievements();
          }, 2000);
        }
      };
      
      loadAchievements();
    }

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      if (typedSession?.user?.id) {
        console.log('[PROFILE-PAGE] Auto-refreshing achievements');
        fetchAchievements();
      }
    }, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [typedSession?.user?.id]);
  
  // Helper to get user ID safely
  const getUserId = (): string | undefined => {
    // Check for potential URL parameter first
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('userId');
    
    // Log these for debugging
    console.log('[DEBUG-PROFILE] URL userId parameter:', urlUserId);
    console.log('[DEBUG-PROFILE] Session user ID:', typedSession?.user?.id);
    
    // Use URL parameter if available, otherwise use session ID
    return urlUserId || typedSession?.user?.id;
  }
  
  const fetchUserBadges = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/badges?user=${userId}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };
  
  const fetchUserImages = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    setImagesLoading(true);
    setImagesError('');
    try {
      console.log('Fetching main images...');
      const response = await fetch(`/api/user/submissions?user=${userId}&archived=false&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch user images');
      const data = await response.json();
      console.log('Main images fetched:', data.data?.length || 0);
      setUserImages(data.data || []);
    } catch (err: any) {
      console.error('Error fetching main images:', err);
      setImagesError(err.message || 'An error occurred while fetching your images');
    } finally {
      setImagesLoading(false);
    }
  };
  
  const fetchArchivedImages = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    setImagesLoading(true);
    setImagesError('');
    try {
      console.log('Fetching archived images...');
      const response = await fetch(`/api/user/submissions?user=${userId}&archived=true&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch archived images');
      const data = await response.json();
      console.log('Archived images fetched:', data.data?.length || 0);
      setArchivedImages(data.data || []);
    } catch (err: any) {
      console.error('Error fetching archived images:', err);
      setImagesError(err.message || 'An error occurred while fetching your archived images');
    } finally {
      setImagesLoading(false);
    }
  };
  
  // Add direct competition results fetching function
  const fetchCompetitionResults = async (competitionId: string) => {
    try {
      console.log(`[DEBUG-DIRECT-RESULTS] Fetching results for competition: ${competitionId}`);
      
      // Fetch all submissions for this competition (same as in the results view)
      const res = await fetch(`/api/submissions?competition=${competitionId}&status=approved&showAll=true&limit=1000`);
      if (!res.ok) throw new Error('Failed to fetch competition submissions');
      const data = await res.json();
      
      console.log(`[DEBUG-DIRECT-RESULTS] Found ${data.data?.length || 0} total submissions`);
      
      // Apply the same dense ranking logic as in view-submissions page
      const sortedSubmissions = (data.data || []).sort((a: any, b: any) => {
        // Sort by average rating (descending)
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        // If ratings are equal, sort by rating count (descending)
        return (b.ratingCount || 0) - (a.ratingCount || 0);
      });
      
      // Apply dense ranking (same rating = same rank)
      let currentRank = 1;
      let prevRating = -1;
      let rankedSubmissions = sortedSubmissions.map((submission: any, index: number) => {
        // If this is a new rating value, increment the rank
        if (index > 0 && submission.averageRating !== prevRating) {
          currentRank = index + 1;
        }
        prevRating = submission.averageRating;
        
        return {
          ...submission,
          rank: currentRank
        };
      });
      
      // Get the user's ID to filter their submissions
      const userId = getUserId();
      const userSubmissions = rankedSubmissions.filter((sub: any) => 
        sub.user?._id === userId || sub.user === userId
      );
      
      console.log(`[DEBUG-DIRECT-RESULTS] Found ${userSubmissions.length} user submissions for competition ${competitionId}`);
      
      // Define the type for achievements
      interface OfficialAchievement {
        position: number;
        submissionId: string;
        submissionTitle: string;
        rating: number;
      }
      
      // Find the 1st, 2nd, and 3rd place submissions 
      const officialAchievements: OfficialAchievement[] = [];
      for (let i = 1; i <= 3; i++) {
        const sameRankSubmissions = userSubmissions.filter((s: any) => s.rank === i);
        
        if (sameRankSubmissions.length > 0) {
          console.log(`[DEBUG-DIRECT-RESULTS] Found ${sameRankSubmissions.length} submissions with rank ${i}:`,
            sameRankSubmissions.map((s: any) => `"${s.title}" (Rating: ${s.averageRating})`));
            
          for (const sub of sameRankSubmissions) {
            officialAchievements.push({
              position: i,
              submissionId: sub._id,
              submissionTitle: sub.title,
              rating: sub.averageRating
            });
          }
        }
      }
      
      // Store the competition data
      setCompetitionResults(prev => ({
        ...prev,
        [competitionId]: {
          rankedSubmissions,
          userSubmissions,
          competitionId,
          officialAchievements
        }
      }));
      
    } catch (error) {
      console.error('Error fetching competition results:', error);
    }
  };
  
  // Modify the fetchAchievements function to also fetch direct competition results
  const fetchAchievements = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    // Add debug log for user ID
    console.log('[DEBUG] Fetching achievements for user ID:', userId);
    
    // Don't set loading state for background refreshes to avoid UI flicker
    const isInitialLoad = !achievements;
    if (isInitialLoad) {
      setAchievementsLoading(true);
    }
    
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/users/achievements?userId=${userId}&_nocache=${Date.now()}`);
      const data = await response.json();
      
      // Debug log the raw response
      console.log('[DEBUG] Achievements API response:', data);
      
      if (response.ok && data.success) {
        setAchievements(data.data);
        
        // For each competition, also fetch direct results
        if (data.data && data.data.achievements) {
          data.data.achievements.forEach((competition: any) => {
            fetchCompetitionResults(competition.competitionId);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      if (isInitialLoad) {
        setAchievementsLoading(false);
      }
    }
  };

  // Function to get the accurate user rankings for a competition
  const getAccurateUserRankings = (competitionId: string) => {
    const results = competitionResults[competitionId];
    if (!results) return [];
    
    // Find all submissions with positions 1st, 2nd, and 3rd
    interface Achievement {
      position: number;
      photo: {
        id: string;
        title: string;
        thumbnailUrl?: string;
      };
      finalScore: number;
    }
    
    const positions: Achievement[] = [];
    
    // Find all submissions with rank 1, 2, or 3 (allowing multiple submissions with the same rank)
    results.userSubmissions.forEach((submission: any) => {
      if (submission.rank >= 1 && submission.rank <= 3) {
        positions.push({
          position: submission.rank,
          photo: {
            id: submission._id,
            title: submission.title,
            thumbnailUrl: submission.thumbnailUrl || submission.imageUrl
          },
          finalScore: submission.averageRating
        });
      }
    });
    
    console.log(`[DEBUG-RANKINGS] Found ${positions.length} top-ranked submissions for competition ${competitionId}:`, 
      positions.map(p => `${p.photo.title} (Rank: ${p.position})`));
    
    return positions;
  };
  
  // New function to fetch user stats
  const fetchUserStats = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    setStatsLoading(true);
    setStatsError('');
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/users/${userId}/stats?_nocache=${Date.now()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch user stats" }));
        throw new Error(errorData.error || 'Failed to fetch user stats');
      }
      const data = await response.json();
      
      // Add debug logging to see what we're getting from the API
      console.log('[DEBUG-PROFILE-STATS] Raw API response:', data);
      
      if (data.success) {
        console.log('[DEBUG-PROFILE-STATS] Setting totalPoints to:', data.data.totalPoints);
        console.log('[DEBUG-PROFILE-STATS] Points breakdown:', data.data.pointsBreakdown);
        console.log('[DEBUG-PROFILE-STATS] Raw API data.data:', data.data);
        
        setTotalSubmissions(data.data.totalSubmissions);
        setTotalPoints(data.data.totalPoints);
        console.log('[DEBUG-PROFILE-STATS] Set totalPoints state to:', data.data.totalPoints);
        
        setBadgesEarned(data.data.badgesEarned || 0);
        setCompetitionsEntered(data.data.competitionsEntered || 0);
        setCompetitionsWon(data.data.competitionsWon || 0);
        setPointsBreakdown(data.data.pointsBreakdown);
        
        // Calculate corrected total points if needed
        if (data.data.pointsBreakdown) {
          const pb = data.data.pointsBreakdown;
          
          // Use the actual voting points - the server now correctly calculates this
          const votingPoints = pb.votingPoints;
          
          // Filter out duplicates from details
          const uniqueDetailsMap = new Map();
          // Process the details and keep only the highest ranking for each submission
          if (pb.details) {
            pb.details.forEach(detail => {
              const existingDetail = uniqueDetailsMap.get(detail.id);
              // If we haven't seen this submission or this position is better than what we have, update it
              if (!existingDetail || detail.position < existingDetail.position) {
                uniqueDetailsMap.set(detail.id, detail);
              }
            });
          }
          
          // Recalculate points for each category based on deduplicated entries
          let recalculatedFirstPlacePoints = 0;
          let recalculatedSecondPlacePoints = 0;
          let recalculatedThirdPlacePoints = 0;
          
          // Recalculate from deduplicated details
          Array.from(uniqueDetailsMap.values()).forEach(detail => {
            if (detail.position === 1) {
              recalculatedFirstPlacePoints += detail.points;
            } else if (detail.position === 2) {
              recalculatedSecondPlacePoints += detail.points;
            } else if (detail.position === 3) {
              recalculatedThirdPlacePoints += detail.points;
            }
          });
          
          // Filter out duplicates from otherSubmissions
          const uniqueOtherSubmissionsMap = new Map();
          // Store only unique submissions by ID
          if (pb.otherSubmissions) {
            pb.otherSubmissions.forEach(sub => {
              if (!uniqueOtherSubmissionsMap.has(sub.id)) {
                uniqueOtherSubmissionsMap.set(sub.id, sub);
              }
            });
          }
          
          // Recalculate other submissions points
          let otherPoints = 0;
          if (uniqueOtherSubmissionsMap.size > 0) {
            otherPoints = Array.from(uniqueOtherSubmissionsMap.values())
              .reduce((total, sub) => total + sub.points, 0);
          }
          // Remove the estimation logic - we should only count points from completed competitions
          // The backend now correctly filters submissions from completed competitions only
          
          setOtherSubmissionsPoints(otherPoints);
          
          // Calculate corrected total using deduplicated values
          const correctedTotal = Math.round(
            recalculatedFirstPlacePoints + 
            recalculatedSecondPlacePoints + 
            recalculatedThirdPlacePoints + 
            otherPoints + 
            votingPoints
          );
          
          console.log(`[DEBUG-FRONTEND-CALC] Corrected total calculation:`, {
            recalculatedFirstPlacePoints,
            recalculatedSecondPlacePoints,
            recalculatedThirdPlacePoints,
            otherPoints,
            votingPoints,
            correctedTotal
          });
          
          setCorrectedTotalPoints(correctedTotal);
        }
        
        console.log('User stats loaded:', data.data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStatsError('Failed to load user statistics');
    } finally {
      setStatsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userId = getUserId();
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setMessage(null);
      
      const response = await fetch(`/api/users/${userId}`, {
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
  
  // Archive image handler
  const handleArchiveImage = async (imgId: string) => {
    const img = userImages.find(img => img._id === imgId) || archivedImages.find(img => img._id === imgId);
    if (!img) {
      setMessage({ type: 'error', text: 'Image not found.' });
      return;
    }
    // For testing, always archive
    const archiveValue = true;
    console.log(`Sending archive request for image ${imgId}:`, { archived: archiveValue });
    if (!window.confirm('Are you sure you want to archive this image?')) return;
    try {
      const response = await fetch(`/api/user/submissions/${imgId}/archive`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: archiveValue }),
      });
      const data = await response.json();
      console.log('Archive response:', data);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to archive image');
      }
      setShowManagePopup(false);
      setModalImageId(null);
      setMessage({ type: 'success', text: data.message || 'Image archived successfully' });
      console.log('Refreshing image lists...');
      await Promise.all([
        fetchUserImages(),
        fetchArchivedImages()
      ]);
    } catch (err: any) {
      console.error('Archive error:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to archive image' });
    }
  };
  
  // Delete image handler
  const handleDeleteImage = async (imgId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this image? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/user/submissions/${imgId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete image');
      }
      
      setShowManagePopup(false);
      setModalImageId(null);
      
      // Refresh both lists
      await Promise.all([fetchUserImages(), fetchArchivedImages()]);
      
      // Show success message
      setMessage({ type: 'success', text: 'Image deleted successfully' });
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete image' });
    }
  };
  
  // Add a ref for the images grid and a highlight state
  const imagesGridRef = React.useRef<HTMLDivElement>(null);
  const [highlightedImageId, setHighlightedImageId] = useState<string | null>(null);

  // Helper to scroll to and highlight the first image for a given place
  const scrollToAchievementImage = (place: 1 | 2 | 3) => {
    if (!achievements || !achievements.achievements) return;
    
    // Find the first achievement with the given place
    for (const comp of achievements.achievements) {
      const found = comp.achievements.find((a: any) => a.position === place);
      if (found && found.photo) {
        // Find the corresponding image in userImages by photo ID
        const img = userImages.find(img => img._id === found.photo.id);
        
        if (img && imagesGridRef.current) {
          const imgElem = imagesGridRef.current.querySelector(`[data-img-id='${img._id}']`);
          if (imgElem) {
            imgElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedImageId(img._id);
            setTimeout(() => setHighlightedImageId(null), 2000);
            return; // Exit after finding the first image
          }
        }
          }
        }
    
    // If we get here, we didn't find any matching images
    const placeName = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
    console.log(`No matching ${placeName} place images found in your uploaded images`);
    setMessage({ 
      type: 'info', 
      text: `No matching ${placeName} place images found in your uploaded images` 
    });
  };

  // Effect to fetch all images for the currently selected competition in the modal
  useEffect(() => {
    if (currentModalImage && currentModalImage.competition && !allImagesForCompetition[currentModalImage.competition._id]) {
      const fetchAllCompImages = async () => {
        try {
          const res = await fetch(`/api/submissions?competition=${currentModalImage.competition._id}&status=approved&showAll=true&limit=1000`);
          if (res.ok) {
            const data = await res.json();
            setAllImagesForCompetition(prev => ({ ...prev, [currentModalImage.competition._id]: data.data || [] }));
          }
        } catch (err) {
          console.error("Error fetching all images for competition rank:", err);
        }
      };
      fetchAllCompImages();
    }
  }, [currentModalImage, allImagesForCompetition]);

  // Log session data directly before return (initial render and subsequent re-renders)
  console.log('[ProfilePage] Rendering with session:', session);
  if (typedSession?.user) {
    console.log('[ProfilePage] Rendering with session.user.image:', typedSession.user.image);
  }

  const syncAchievements = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    // Add debug log
    console.log('[DEBUG] Starting achievement sync for user ID:', userId);
    
    setSyncingAchievements(true);
    try {
      // Add user ID to sync request
      const response = await fetch(`/api/debug/sync-results?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync achievements');
      }
      
      // Get the response data
      const data = await response.json();
      console.log('[DEBUG] Sync results response:', data);
      
      // Display success message
      setMessage({
        type: 'success',
        text: `Achievements synchronized successfully! Found ${data.data?.totalResults || 0} achievements.`
      });
      
      // Refresh achievements
      fetchAchievements();
    } catch (error: any) {
      console.error('[DEBUG] Error syncing achievements:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while syncing achievements'
      });
    } finally {
      setSyncingAchievements(false);
    }
  };

  // Add this function to sync all user competitions
  const syncAllCompetitions = async () => {
    const userId = getUserId();
    if (!userId) return;
    
    setSyncingAchievements(true);
    try {
      // First get all completed competitions the user has participated in
      const res = await fetch(`/api/competitions?participated=true&status=completed`);
      if (!res.ok) throw new Error('Failed to fetch competitions');
      const data = await res.json();
      
      // Define type for sync results
      interface SyncResult {
        competitionId: string;
        title: string;
        success: boolean;
        message: string;
        results?: any[];
      }
      
      // For each competition, run the manual sync
      const results: SyncResult[] = [];
      for (const comp of data.data || []) {
        console.log(`[SYNC-ALL] Syncing competition: ${comp.title} (${comp.id})`);
        try {
          const syncRes = await fetch(`/api/debug/manual-sync?userId=${userId}&competitionId=${comp.id}`);
          const syncData = await syncRes.json();
          results.push({
            competitionId: comp.id,
            title: comp.title,
            success: syncRes.ok,
            message: syncData.message,
            results: syncData.data?.results || []
          });
        } catch (err) {
          console.error(`Error syncing competition ${comp.title}:`, err);
          results.push({
            competitionId: comp.id,
            title: comp.title,
            success: false,
            message: 'Failed to sync'
          });
        }
      }
      
      // Show success message
      setMessage({
        type: 'success',
        text: `Synchronized ${results.length} competitions. ${results.filter(r => r.success).length} succeeded.`
      });
      
      // Refresh achievements
      fetchAchievements();
      
      console.log('[SYNC-ALL] Sync results:', results);
      
    } catch (error: any) {
      console.error('[SYNC-ALL] Error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while syncing achievements'
      });
    } finally {
      setSyncingAchievements(false);
    }
  };

  // Render sync buttons for debugging
  const renderSyncButtons = () => {
    return (
      <div className="flex items-center space-x-2 mt-1 mb-4">
        <DebugInfo>
          <a 
            href={`/api/debug/manual-sync?userId=${getUserId()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>API Test</span>
          </a>
          
          {/* Debug API Test Button */}
          <a 
            href={`/api/debug/force-sync?userId=${getUserId()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded"
          >
            Debug API
          </a>
        </DebugInfo>
      </div>
    );
  };

  // Add back the achievement explanation function
  const renderAchievementExplanation = () => {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <span className="font-bold">Achievement Data:</span> Your achievements are calculated using the same ranking algorithm as the competition results page, ensuring you see accurate placements.
            </p>
          </div>
        </div>
        {/* Add toggle for stored vs. direct achievements (for debugging) */}
        <DebugInfo>
          <div className="mt-2 flex items-center justify-end">
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-xs text-blue-700">
                {useDirectResults ? "Using direct results" : "Using stored results"}
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={useDirectResults}
                  onChange={() => setUseDirectResults(!useDirectResults)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </DebugInfo>
      </div>
    );
  };

  // Make sure it's included in the renderAchievementCards function
  const renderAchievementCards = () => {
    if (!achievements || !achievements.achievements) return null;
    
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Achievement Details</h3>
          {/* Display data source indication */}
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
            {useDirectResults ? "Using competition data" : "Using stored achievements"}
          </span>
        </div>
        
        {renderAchievementExplanation()}
        
        <div className="space-y-4">
          {achievements.achievements.map((competition: any) => {
            // Get the accurate rankings from direct competition results
            const accurateAchievements = useDirectResults 
              ? getAccurateUserRankings(competition.competitionId)
              : competition.achievements;
            
            return (
              <div key={competition.competitionId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-[#1a4d5c] mb-2">{competition.competitionTitle}</h4>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-gray-500">
                    Ended on: {new Date(competition.endDate).toLocaleDateString()}
                  </p>
                  {/* Add a link to view competition results */}
                  <Link 
                    href={`/dashboard/competitions/${competition.competitionId}/view-submissions?result=1`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Full Results
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(!useDirectResults && competition.achievements && competition.achievements.length > 0) || 
                   (useDirectResults && accurateAchievements && accurateAchievements.length > 0) ? (
                    accurateAchievements
                      .sort((a: any, b: any) => a.position - b.position)
                      .map((achievement: any, index: number) => (
                        <div 
                          key={achievement.id || `${achievement.position}-${achievement.photo?.id || index}`} 
                          className={`flex items-center p-3 rounded-md ${
                            achievement.position === 1 ? 'bg-yellow-50 border border-yellow-200' : 
                            achievement.position === 2 ? 'bg-gray-50 border border-gray-200' : 
                            'bg-orange-50 border border-orange-200'
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            {achievement.photo && (achievement.photo.thumbnailUrl || useDirectResults) ? (
                              <div className="relative w-16 h-16 rounded-md overflow-hidden">
                                <ImageWithFallback
                                  src={achievement.photo.thumbnailUrl}
                                  alt={achievement.photo.title || 'Achievement photo'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-md">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center mb-1">
                              <span className="text-lg font-bold mr-2">
                                {achievement.position === 1 ? '🥇' : 
                                 achievement.position === 2 ? '🥈' : '🥉'}
                              </span>
                              <span className="text-sm font-medium truncate">
                                {achievement.photo?.title || `Rank ${achievement.position}`}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Score: {achievement.finalScore?.toFixed(1) || '0.0'}/5.0
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-3 text-center py-4 text-gray-500">
                      {competitionResults[competition.competitionId] ? 
                        "No top 3 placements found in this competition." : 
                        "Loading competition results..."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get the achievement stats properly from both direct results and stored results
  const getAchievementStats = () => {
    if (!achievements?.stats) return { firstPlace: 0, secondPlace: 0, thirdPlace: 0, totalTopThree: 0 };
    
    if (!useDirectResults) {
      // Return stored stats
      return achievements.stats;
    }
    
    // Calculate stats from direct competition results
    let firstPlace = 0;
    let secondPlace = 0;
    let thirdPlace = 0;
    
    // Look through all competitions and count achievements
    achievements.achievements.forEach((competition: any) => {
      const directResults = competitionResults[competition.competitionId];
      if (directResults) {
        // Count occurrences of each rank
        directResults.userSubmissions.forEach((sub: any) => {
          if (sub.rank === 1) firstPlace++;
          else if (sub.rank === 2) secondPlace++;
          else if (sub.rank === 3) thirdPlace++;
        });
      }
    });
    
    const totalTopThree = firstPlace + secondPlace + thirdPlace;
    return { firstPlace, secondPlace, thirdPlace, totalTopThree };
  };

  // Points Breakdown Modal
  const PointsBreakdownModal = () => {
    if (!showPointsBreakdown || !pointsBreakdown) return null;
    
    // Use actual voting points from the API - we've fixed the backend calculation
    const correctedVotingPoints = pointsBreakdown.votingPoints;
    
    // Use the state-tracked other submissions points
    const finalOtherSubmissionsPoints = otherSubmissionsPoints;
    
    // Create maps for deduplication
    const uniqueDetailsMap = new Map();
    // Process the details and keep only the highest ranking for each submission
    pointsBreakdown.details.forEach(detail => {
      const existingDetail = uniqueDetailsMap.get(detail.id);
      // If we haven't seen this submission or this position is better than what we have, update it
      if (!existingDetail || detail.position < existingDetail.position) {
        uniqueDetailsMap.set(detail.id, detail);
      }
    });
    
    // Recalculate points for each category based on deduplicated entries
    let recalculatedFirstPlacePoints = 0;
    let recalculatedSecondPlacePoints = 0;
    let recalculatedThirdPlacePoints = 0;
    
    // Recalculate from deduplicated details
    Array.from(uniqueDetailsMap.values()).forEach(detail => {
      if (detail.position === 1) {
        recalculatedFirstPlacePoints += detail.points;
      } else if (detail.position === 2) {
        recalculatedSecondPlacePoints += detail.points;
      } else if (detail.position === 3) {
        recalculatedThirdPlacePoints += detail.points;
      }
    });
    
    // Create unique other submissions map
    const uniqueOtherSubmissionsMap = new Map();
    // Store only unique submissions by ID
    pointsBreakdown.otherSubmissions.forEach(sub => {
      if (!uniqueOtherSubmissionsMap.has(sub.id)) {
        uniqueOtherSubmissionsMap.set(sub.id, sub);
      }
    });
    
    // Recalculate other submissions points
    const recalculatedOtherSubmissionsPoints = Array.from(uniqueOtherSubmissionsMap.values())
      .reduce((total, sub) => total + sub.points, 0);
    
    // Recalculate total for display using the deduplicated points
    const totalCalculatedPoints = Math.round(
      recalculatedFirstPlacePoints +
      recalculatedSecondPlacePoints +
      recalculatedThirdPlacePoints +
      recalculatedOtherSubmissionsPoints +
      correctedVotingPoints
    );
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Points Breakdown</h3>
            <button 
              onClick={() => setShowPointsBreakdown(false)}
              className="text-gray-500 hover:text-gray-700 p-2 -m-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {recalculatedFirstPlacePoints > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-yellow-800 font-semibold text-sm sm:text-base">🥇 1st Place Points</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(recalculatedFirstPlacePoints)}</p>
              </div>
            )}
            
            {recalculatedSecondPlacePoints > 0 && (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-gray-800 font-semibold text-sm sm:text-base">🥈 2nd Place Points</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(recalculatedSecondPlacePoints)}</p>
              </div>
            )}
            
            {recalculatedThirdPlacePoints > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <p className="text-orange-800 font-semibold text-sm sm:text-base">🥉 3rd Place Points</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(recalculatedThirdPlacePoints)}</p>
              </div>
            )}
            
            {recalculatedOtherSubmissionsPoints > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="text-green-800 font-semibold text-sm sm:text-base">Other Submissions Points</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{Math.round(recalculatedOtherSubmissionsPoints)}</p>
                <p className="text-xs sm:text-sm text-green-700">(4th place and beyond)</p>
              </div>
            )}
            
            <div 
              className="bg-blue-50 border border-blue-200 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => {
                setShowPointsBreakdown(false);
                setShowVotedPhotos(true);
              }}
            >
              <p className="text-blue-800 font-semibold text-sm sm:text-base">🗳️ Voting Points</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{correctedVotingPoints}</p>
              <p className="text-xs sm:text-sm text-blue-700 mt-1">
                {correctedVotingPoints} {correctedVotingPoints === 1 ? 'vote' : 'votes'} × 1 point each
              </p>
              <p className="text-xs sm:text-sm text-blue-700 mt-1 underline">
                Click to view voted photos
              </p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <p className="text-purple-800 font-semibold text-sm sm:text-base">🏆 Total Points</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCalculatedPoints}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mt-6">
            <h4 className="font-semibold mb-4 text-base sm:text-lg text-gray-900">Detailed Breakdown</h4>
            
            {pointsBreakdown.details && pointsBreakdown.details.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 sm:p-3 text-left font-semibold text-gray-900">Submission</th>
                      <th className="p-2 sm:p-3 text-left font-semibold text-gray-900">Competition</th>
                      <th className="p-2 sm:p-3 text-center font-semibold text-gray-900">Position</th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-gray-900">Total Rating</th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-gray-900">Multiplier</th>
                      <th className="p-2 sm:p-3 text-right font-semibold text-gray-900">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Filter out duplicates by ID and use a Map to keep track of seen submissions */}
                    {(() => {
                      const uniqueDetailsMap = new Map();
                      // Process the details and keep only the highest ranking for each submission
                      pointsBreakdown.details.forEach(detail => {
                        const existingDetail = uniqueDetailsMap.get(detail.id);
                        // If we haven't seen this submission or this position is better than what we have, update it
                        if (!existingDetail || detail.position < existingDetail.position) {
                          uniqueDetailsMap.set(detail.id, detail);
                        }
                      });
                      // Convert back to array and render
                      return Array.from(uniqueDetailsMap.values()).map((detail, index) => {
                        // Determine multiplier based on position
                        let multiplier = 1;
                        if (detail.position === 1) multiplier = 5;
                        else if (detail.position === 2) multiplier = 3;
                        else if (detail.position === 3) multiplier = 2;
                        
                        return (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="p-2 sm:p-3 text-gray-900 font-medium">{detail.title || 'Untitled'}</td>
                            <td className="p-2 sm:p-3 text-gray-700">{detail.competitionName || 'Unknown Competition'}</td>
                            <td className="p-2 sm:p-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {detail.position}
                              </span>
                            </td>
                            <td className="p-2 sm:p-3 text-right text-gray-900 font-medium">{detail.totalRating.toFixed(1)}</td>
                            <td className="p-2 sm:p-3 text-right text-gray-700">×{multiplier}</td>
                            <td className="p-2 sm:p-3 text-right font-bold text-gray-900">{Math.round(detail.points)}</td>
                          </tr>
                        );
                      });
                    })()}
                    
                    {/* Other submissions (4th place and beyond) */}
                    {pointsBreakdown.otherSubmissions && pointsBreakdown.otherSubmissions.length > 0 && (
                      <>
                        {(() => {
                          const uniqueOtherSubmissionsMap = new Map();
                          // Store only unique submissions by ID
                          pointsBreakdown.otherSubmissions.forEach(sub => {
                            if (!uniqueOtherSubmissionsMap.has(sub.id)) {
                              uniqueOtherSubmissionsMap.set(sub.id, sub);
                            }
                          });
                          
                          return Array.from(uniqueOtherSubmissionsMap.values()).map((sub, index) => (
                            <tr key={`other-${index}`} className="border-b border-gray-200 bg-green-50 hover:bg-green-100">
                              <td className="p-2 sm:p-3 text-gray-900 font-medium">{sub.title || 'Untitled'}</td>
                              <td className="p-2 sm:p-3 text-gray-700">{sub.competitionName || 'Unknown Competition'}</td>
                              <td className="p-2 sm:p-3 text-center">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  4+
                                </span>
                              </td>
                              <td className="p-2 sm:p-3 text-right text-gray-900 font-medium">{sub.totalRating.toFixed(1)}</td>
                              <td className="p-2 sm:p-3 text-right text-gray-700">×1</td>
                              <td className="p-2 sm:p-3 text-right font-bold text-gray-900">{Math.round(sub.points)}</td>
                            </tr>
                          ));
                        })()}
                      </>
                    )}
                    
                    {/* Voting points row */}
                    <tr 
                      className="bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors border-b border-gray-200"
                      onClick={() => {
                        setShowPointsBreakdown(false);
                        setShowVotedPhotos(true);
                      }}
                    >
                      <td className="p-2 sm:p-3 text-gray-900 font-medium">
                        🗳️ Votes Cast 
                        <span className="ml-1 text-xs text-blue-700 underline">
                          (click to view photos)
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-gray-500">-</td>
                      <td className="p-2 sm:p-3 text-center text-gray-500">-</td>
                      <td className="p-2 sm:p-3 text-right text-gray-900 font-medium">{correctedVotingPoints}</td>
                      <td className="p-2 sm:p-3 text-right text-gray-700">×1</td>
                      <td className="p-2 sm:p-3 text-right font-bold text-gray-900">{correctedVotingPoints}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <td className="p-2 sm:p-3 text-gray-900 font-bold" colSpan={5}>🏆 Total Points</td>
                      <td className="p-2 sm:p-3 text-right text-gray-900 font-bold text-lg">{totalCalculatedPoints}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm sm:text-base">No detailed breakdown available</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">Submit photos to competitions to see detailed points!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#f5f8fa] pb-12">
      <Head>
        <title>User Profile | SnapScape</title>
      </Head>

      {/* Show the points breakdown modal */}
      <PointsBreakdownModal />

      {typedSession?.user?.id && (
        <VotedPhotosModal 
          isOpen={showVotedPhotos} 
          onClose={() => setShowVotedPhotos(false)} 
          userId={typedSession.user.id}
        />
      )}

      <div className="min-h-screen bg-[#e6f0f3] py-10 px-2 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Message display */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 
              message.type === 'error' ? 'bg-red-100 text-red-800' : 
              'bg-blue-100 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}
          
          {/* Compact Instagram-style profile header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 bg-white rounded-2xl shadow p-6 border-2 border-[#e0c36a]">
            {/* Profile picture */}
            <div className="flex-shrink-0 w-28 h-28 rounded-full overflow-hidden border-2 border-[#e0c36a] bg-gray-100">
              <ImageWithFallback
                src={(dbUserData?.image || typedSession?.user?.image) || 'https://placehold.co/200x200?text=No+Image'}
                alt={typedSession?.user?.name || 'Profile photo'}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            </div>
            {/* Profile info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-[#1a4d5c]">{typedSession?.user?.username || typedSession?.user?.name || 'Username'}</span>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Link href="/dashboard/edit-profile">
                    <button className="px-4 py-1 bg-[#e6f0f3] text-[#1a4d5c] font-semibold rounded-lg border border-[#e0c36a] hover:bg-[#d1e6ed] transition text-sm">Edit profile</button>
                  </Link>
                  <Link href="/dashboard/settings">
                    <button className="px-4 py-1 bg-[#e6f0f3] text-[#1a4d5c] font-semibold rounded-lg border border-[#e0c36a] hover:bg-[#d1e6ed] transition text-sm flex items-center gap-1" title="Settings">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  </Link>
                </div>
              </div>
              {/* New dynamic stats section */}
              <div className="flex gap-6 text-[#1a4d5c] text-base mb-2">
                {statsLoading ? (
                  <span>Loading stats...</span>
                ) : statsError ? (
                  <span className="text-red-500">Error loading stats</span>
                ) : (
                  <>
                    <span><span className="font-bold">{totalSubmissions !== null ? totalSubmissions : '-'}</span> Submissions</span>
                    <span>
                      <span 
                        className="font-bold cursor-pointer hover:text-[#2699a6] hover:underline"
                        onClick={() => setShowPointsBreakdown(true)}
                        title="Click for points breakdown"
                      >
                        {(() => {
                          const displayValue = correctedTotalPoints !== null ? correctedTotalPoints : totalPoints !== null ? totalPoints : '-';
                          console.log('[DEBUG-DISPLAY] Points display values:', {
                            correctedTotalPoints,
                            totalPoints,
                            displayValue
                          });
                          return displayValue;
                        })()}
                      </span> Points
                      <span className="text-xs ml-1 text-green-600">(all submissions counted)</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[DEBUG-PROFILE] Manual stats refresh triggered');
                          fetchUserStats();
                        }}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                        title="Refresh stats"
                      >
                        ↻
                      </button>
                    </span>
                    {/* You can add more stats here if needed */}
                  </>
                )}
              </div>
              <div className="font-semibold text-[#1a4d5c]">{typedSession?.user?.name || 'Full Name'}</div>
              <div className="text-sm text-gray-600 mb-1">@{typedSession?.user?.username || typedSession?.user?.email?.split('@')[0]}</div>
              <div className="text-sm text-[#1a4d5c]">Entrepreneur, Educationist, sports enthusiast, Traveler, Shutter bug.</div>
            </div>
          </div>
          {/* Achievements Section */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Competition Achievements</h2>
              {renderSyncButtons()}
            </div>
            
            {achievementsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : achievements ? (
              <>
                {/* Debug Information */}
                <DebugInfo>
                  <div className="bg-gray-100 p-3 rounded-md mb-4 text-xs whitespace-pre-wrap">
                    <p><strong>Debug Info:</strong></p>
                    <p>User ID: {getUserId()}</p>
                    <p>Stats: First={getAchievementStats().firstPlace}, Second={getAchievementStats().secondPlace}, Third={getAchievementStats().thirdPlace}</p>
                    <p>Raw Achievements Count: {achievements.achievements?.length || 0}</p>
                    <details>
                      <summary className="cursor-pointer text-blue-600">View Raw Achievement Data</summary>
                      <pre className="mt-2 overflow-auto max-h-40 text-xs">
                        {JSON.stringify(achievements, null, 2)}
                      </pre>
                    </details>
                  </div>
                </DebugInfo>
                
                {/* Achievement Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {(() => {
                    const stats = getAchievementStats();
                    return (
                      <>
                        <div className="bg-yellow-50 rounded-lg p-4 text-center cursor-pointer hover:bg-yellow-100 transition" onClick={() => scrollToAchievementImage(1)}>
                          <div className="text-3xl font-bold text-yellow-600 mb-1">🥇</div>
                          <div className="text-2xl font-bold text-gray-900">{stats.firstPlace}</div>
                          <div className="text-sm text-gray-600">First Place</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => scrollToAchievementImage(2)}>
                          <div className="text-3xl font-bold text-gray-600 mb-1">🥈</div>
                          <div className="text-2xl font-bold text-gray-900">{stats.secondPlace}</div>
                          <div className="text-sm text-gray-600">Second Place</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center cursor-pointer hover:bg-orange-100 transition" onClick={() => scrollToAchievementImage(3)}>
                          <div className="text-3xl font-bold text-orange-600 mb-1">🥉</div>
                          <div className="text-2xl font-bold text-gray-900">{stats.thirdPlace}</div>
                          <div className="text-sm text-gray-600">Third Place</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-100 transition">
                          <div className="text-3xl font-bold text-blue-600 mb-1">🏆</div>
                          <div className="text-2xl font-bold text-gray-900">{stats.totalTopThree}</div>
                          <div className="text-sm text-gray-600">Total Top 3</div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Detailed Achievement Cards - MODIFIED TO USE DIRECT COMPETITION RESULTS */}
                {achievements.achievements && achievements.achievements.length > 0 && renderAchievementCards()}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No competition achievements yet. Keep participating to earn medals!
              </div>
            )}
          </div>
          {/* User Uploaded Images Section */}
          <div className="mt-8 bg-white border-2 border-[#e0c36a] rounded-2xl shadow">
            <div className="px-6 py-6 border-b-2 border-[#e0c36a]">
              <h2 className="text-xl font-bold text-[#1a4d5c]">Your Uploaded Images</h2>
              <p className="mt-1 text-sm text-[#2699a6]">All photos you've submitted to competitions</p>
            </div>
            <div className="px-6 py-6" ref={imagesGridRef}>
              {imagesLoading ? (
                <div className="text-center py-8 text-[#1a4d5c] font-semibold">Loading images...</div>
              ) : imagesError ? (
                <div className="text-center py-8 text-red-600 font-semibold">{imagesError}</div>
              ) : userImages.filter(img => !img.archived).length === 0 ? (
                <div className="text-center py-8 text-gray-500">You haven't uploaded any images yet.</div>
              ) : (
                <div className="grid grid-cols-3 gap-0">
                  {userImages.filter(img => !img.archived).map((img) => (
                    <div key={img._id} data-img-id={img._id} className={`relative w-full aspect-[4/3] group overflow-hidden cursor-pointer${highlightedImageId === img._id ? ' ring-4 ring-yellow-400 z-10' : ''}`} onClick={() => setModalImageId(img._id)}>
                      <ImageWithFallback
                        src={img.thumbnailUrl || img.imageUrl}
                        alt={img.title || 'User photo'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-4">
                        <div className="font-bold text-base mb-1 truncate w-full text-center">{img.title}</div>
                        {img.competition && (
                          <div className="text-xs mb-1 truncate w-full text-center">Competition: {img.competition.title}</div>
                        )}
                        <div className="text-xs w-full text-center">Uploaded: {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Modal for enlarged image */}
          {currentModalImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setModalImageId(null)}>
              <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center" onClick={e => e.stopPropagation()}>
                <button className="absolute top-4 right-8 z-10 bg-white/80 hover:bg-white text-[#1a4d5c] rounded-full p-2 shadow" onClick={() => setModalImageId(null)} aria-label="Close">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Image on the left */}
                <div className="flex-1 h-full relative modal-image-area" key={currentModalImage._id}>
                  {(currentModalImage.imageUrl || currentModalImage.thumbnailUrl) ? (
                    <ImageWithFallback
                      key={currentModalImage._id}
                      src={currentModalImage.imageUrl || currentModalImage.thumbnailUrl}
                      alt={currentModalImage.title || 'User photo'}
                      fill
                      className="object-contain w-full h-full modal-image"
                    />
                  ) : (
                    <img
                      src="https://placehold.co/600x400?text=No+Image+Available"
                      alt="No image"
                      className="object-contain w-full h-full modal-image"
                    />
                  )}
                </div>
                {/* Sidebar on the right */}
                <div className="w-full md:w-64 h-full flex flex-col justify-center bg-black/70 p-6 md:rounded-none rounded-b-2xl md:rounded-r-2xl modal-sidebar">
                  <div className="font-bold text-2xl text-white mb-2 text-center md:text-left">{currentModalImage.title}</div>
                  {currentModalImage.competition && (
                    <div className="text-base text-[#e0c36a] mb-2 text-center md:text-left">Competition: {currentModalImage.competition.title}
                      {/* Show actual rank badge for this image in the competition */}
                      {(() => {
                        const compImages = allImagesForCompetition[currentModalImage.competition?._id];
                        if (!compImages || compImages.length === 0) {
                          // Optionally, show a loading state if images are being fetched for the first time
                          if(currentModalImage && currentModalImage.competition && !allImagesForCompetition[currentModalImage.competition._id]){
                             return <span className="ml-2 text-xs text-gray-400">Loading rank...</span>;
                          }
                          return null;
                        }

                        // Sort by averageRating desc, then ratingCount desc
                        const sorted = [...compImages].sort((a, b) => {
                          if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
                          return (b.ratingCount || 0) - (a.ratingCount || 0);
                        });
                        
                        // Properly implement dense ranking
                        let currentRank = 0;
                        let prevRating = null;
                        let prevRatingCount = null;
                        let actualRank = 0;
                        
                        // First pass: create ranking map
                        const rankMap = new Map();
                        
                        for (let i = 0; i < sorted.length; i++) {
                          const image = sorted[i];
                          const rating = image.averageRating;
                          const ratingCount = image.ratingCount || 0;
                          
                          // If first item or different rating from previous item
                          if (i === 0 || rating !== prevRating || ratingCount !== prevRatingCount) {
                            currentRank = rankMap.size + 1;
                          }
                          
                          // Define the rating key as a combination of rating and count
                          const ratingKey = `${rating}-${ratingCount}`;
                          
                          // If we haven't assigned a rank to this rating yet
                          if (!rankMap.has(ratingKey)) {
                            rankMap.set(ratingKey, currentRank);
                          }
                          
                          // Store current values for next comparison
                          prevRating = rating;
                          prevRatingCount = ratingCount;
                          
                          // If this is our target image, store its rank
                          if (image._id === currentModalImage._id) {
                            actualRank = currentRank;
                          }
                        }
                        
                        if (actualRank > 0) {
                          let badgeIcon: React.ReactNode = null;
                          if (actualRank === 1) badgeIcon = <span className="mr-1">🥇</span>;
                          else if (actualRank === 2) badgeIcon = <span className="mr-1">🥈</span>;
                          else if (actualRank === 3) badgeIcon = <span className="mr-1">🥉</span>;
                          return (
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${
                              actualRank === 1 ? 'bg-yellow-400' :
                              actualRank === 2 ? 'bg-gray-300' :
                              actualRank === 3 ? 'bg-orange-400' :
                              'bg-gray-700'
                            }`}>
                              {badgeIcon}
                              {actualRank === 1 ? '1st' : actualRank === 2 ? '2nd' : actualRank === 3 ? '3rd' : `${actualRank}th`} Rank
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                  <div className="text-xs text-gray-200 mb-4 text-center md:text-left">Uploaded: {currentModalImage.createdAt ? new Date(currentModalImage.createdAt).toLocaleDateString() : ''}</div>
                  {currentModalImage.description && (
                    <div className="text-sm text-gray-100 mt-2 text-center md:text-left">{currentModalImage.description}</div>
                  )}
                  <div className="mt-6 flex justify-center md:justify-start">
                    <button
                      className="px-4 py-2 bg-[#e0c36a] text-[#1a4d5c] font-bold rounded-lg shadow hover:bg-[#ffe082] transition"
                      onClick={() => setShowManagePopup((v) => !v)}
                    >
                      Manage
                    </button>
                    {/* Manage popup */}
                    {showManagePopup && (
                      <>
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowManagePopup(false)}></div>
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                          <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-xs flex flex-col items-center border-2 border-[#e0c36a]">
                            <h3 className="text-xl font-bold text-[#1a4d5c] mb-6">Manage Image</h3>
                            <button
                              className="w-full px-6 py-3 text-lg rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 border-t border-gray-200 transition"
                              onClick={() => { setShowManagePopup(false); handleDeleteImage(currentModalImage._id); }}
                            >
                              Delete
                            </button>
                            <button
                              className="mt-4 text-sm text-gray-500 hover:underline"
                              onClick={() => setShowManagePopup(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Mobile portrait-specific styles */}
              <style jsx global>{`
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
              `}</style>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 