'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import Head from 'next/head';

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
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Track total submissions from API pagination if available
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  
  const showResults = competition?.status === 'completed' || searchParams?.get('result') === '1';
  
  // Add state for results tabs
  const [activeResultsTab, setActiveResultsTab] = useState<'submissions' | 'photographers'>('submissions');
  
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
      
      // For active competitions, only show user's own submissions unless admin
      // For voting/completed competitions, show all submissions
      // For results view (completed competitions), ALL users should see all submissions
      const shouldShowAll = competition?.status === 'voting' || competition?.status === 'completed' || showResults || isAdmin;
      const showAllParam = shouldShowAll ? '&showAll=true' : '';
      
      // For results view, load ALL submissions at once (no pagination)
      // For regular view, use pagination
      const paginationParams = showResults ? '&limit=1000' : `&limit=12&page=${resetPage ? 1 : page}`;
      
      const res = await fetch(`/api/submissions?competition=${competitionId}&status=approved${showAllParam}${paginationParams}`);
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

      if (resetPage || page === 1 || showResults) {
        // For results view or first page, replace all submissions
        setSubmissions(submissionsWithRatings);
      } else {
        // For paginated view, append new submissions
        setSubmissions(prev => {
          const existingIds = new Set(prev.map(s => s._id));
          const newSubmissions = submissionsWithRatings.filter(s => !existingIds.has(s._id));
          return [...prev, ...newSubmissions];
        });
      }
      
      // For results view, disable "hasMore" since we loaded everything
      // For regular view, check if more pages available
      setHasMore(showResults ? false : (data.data?.length || 0) === 12);
      
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

  // Separate effect to refetch when competition status changes
  useEffect(() => {
    if (competition && competitionId && status === 'authenticated') {
      setPage(1);
      fetchSubmissions(true);
    }
  }, [competition?.status]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      // Don't use infinite scroll for results view since all submissions are loaded at once
      if (!hasMore || isLoadingMore || showResults) return;
      const scrollY = window.scrollY;
      const height = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (scrollY + clientHeight >= height - 200) {
        setPage(p => p + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, showResults]);

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

    } catch (err: any) {
      console.error('Error rating photo:', err);
      alert(err.message || 'An error occurred while rating the photo');
    }
  };

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

  // Badge assignment logic based on total rating instead of average rating - moved before navigateImages
  let goldTotalRating: number | null = null, silverTotalRating: number | null = null, bronzeTotalRating: number | null = null;
  const resultsSubmissions = [...submissions].sort((a, b) => {
    // Calculate total rating for each submission (averageRating × ratingCount)
    const totalRatingA = a.averageRating * (a.ratingCount || 0);
    const totalRatingB = b.averageRating * (b.ratingCount || 0);
    
    // Sort by total rating first (descending)
    if (totalRatingB !== totalRatingA) {
      return totalRatingB - totalRatingA;
    }
    
    // If total ratings are equal, sort by average rating as tiebreaker (descending)
    if (b.averageRating !== a.averageRating) {
      return b.averageRating - a.averageRating;
    }
    
    // If both total rating and average rating are equal, sort by rating count (descending)
    return (b.ratingCount || 0) - (a.ratingCount || 0);
  });
  resultsSubmissions.forEach(sub => {
    const totalRating = sub.averageRating * (sub.ratingCount || 0);
    if (goldTotalRating === null && totalRating > 0) goldTotalRating = totalRating;
    else if (silverTotalRating === null && goldTotalRating !== null && totalRating < goldTotalRating && totalRating > 0) silverTotalRating = totalRating;
    else if (bronzeTotalRating === null && silverTotalRating !== null && totalRating < silverTotalRating && totalRating > 0) bronzeTotalRating = totalRating;
  });
  function getBadge(totalRating: number) {
    if (goldTotalRating !== null && totalRating === goldTotalRating) return { label: '1st', color: 'bg-yellow-400', text: 'Gold' };
    if (silverTotalRating !== null && totalRating === silverTotalRating) return { label: '2nd', color: 'bg-gray-300', text: 'Silver' };
    if (bronzeTotalRating !== null && totalRating === bronzeTotalRating) return { label: '3rd', color: 'bg-orange-400', text: 'Bronze' };
    return null;
  }

  // Photographer ranking logic
  const photographerRankings = useMemo(() => {
    if (!showResults || submissions.length === 0) return [];
    
    // Group submissions by photographer
    const photographerGroups = new Map<string, {
      photographer: { id: string; name: string; profileImage?: string };
      submissions: Submission[];
      bestSubmission: Submission;
      totalPoints: number;
      totalVotes: number;
      totalRating: number;
      totalSubmissions: number;
      averageRating: number;
    }>();
    
    submissions.forEach(submission => {
      if (!submission.user) return;
      
      const photographerId = submission.user._id;
      const photographerName = submission.user.name || 'Unknown';
      const submissionTotalRating = submission.averageRating * (submission.ratingCount || 0);
      
      // Calculate total points for this submission based on its rank in the overall results
      let submissionRank = 1;
      let lastTotalRating = -Infinity;
      let currentRankCounter = 0;
      
      // Find this submission's rank in the overall results
      for (const resultSubmission of resultsSubmissions) {
        const resultTotalRating = resultSubmission.averageRating * (resultSubmission.ratingCount || 0);
        if (resultTotalRating !== lastTotalRating) {
          currentRankCounter++;
        }
        if (resultSubmission._id === submission._id) {
          submissionRank = currentRankCounter;
          break;
        }
        lastTotalRating = resultTotalRating;
      }
      
      // Calculate multiplier based on rank
      let multiplier = 1;
      if (submissionRank === 1) {
        multiplier = 5;
      } else if (submissionRank === 2) {
        multiplier = 3;
      } else if (submissionRank === 3) {
        multiplier = 2;
      }
      
      const submissionTotalPoints = Math.round(submissionTotalRating * multiplier);
      
      if (!photographerGroups.has(photographerId)) {
        photographerGroups.set(photographerId, {
          photographer: {
            id: photographerId,
            name: photographerName,
            profileImage: submission.user.profileImage
          },
          submissions: [],
          bestSubmission: submission,
          totalPoints: 0,
          totalVotes: 0,
          totalRating: 0,
          totalSubmissions: 0,
          averageRating: 0
        });
      }
      
      const group = photographerGroups.get(photographerId)!;
      group.submissions.push(submission);
      group.totalSubmissions++;
      
      // Accumulate totals across all submissions
      group.totalPoints += submissionTotalPoints;
      group.totalVotes += (submission.ratingCount || 0);
      group.totalRating += submissionTotalRating;
      
      // Update best submission if this one has higher total rating
      const currentBestTotalRating = group.bestSubmission.averageRating * (group.bestSubmission.ratingCount || 0);
      if (submissionTotalRating > currentBestTotalRating) {
        group.bestSubmission = submission;
      }
      
      // Calculate average rating across all submissions
      const totalRating = group.submissions.reduce((sum, sub) => sum + sub.averageRating, 0);
      group.averageRating = totalRating / group.submissions.length;
    });
    
    // Convert to array and sort by total points (primary), then total rating, then total votes
    const rankings = Array.from(photographerGroups.values()).sort((a, b) => {
      // Sort by total points first (descending)
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // If tied, sort by total rating across all submissions (descending)
      if (b.totalRating !== a.totalRating) {
        return b.totalRating - a.totalRating;
      }
      
      // If still tied, sort by total votes (descending)
      return b.totalVotes - a.totalVotes;
    });
    
    return rankings;
  }, [submissions, showResults, resultsSubmissions]);

  // Twitter-specific compact sharing function for character limit optimization
  const generateTwitterText = (tabType: 'submissions' | 'photographers') => {
    if (!competition) {
      return '🏆 Photography competition results on SnapScape! 📷 #Photography #Contest';
    }
    
    if (tabType === 'submissions') {
      if (resultsSubmissions.length === 0) {
        return `🏆 "${competition.title}" results are in! Theme: ${competition.theme} 📷 #SnapScape #Photography`;
      }

      // Get winner only for compact version
      const winner = resultsSubmissions[0];
      const winnerName = winner?.user?.name || 'Anonymous';
      const totalRating = (winner.averageRating * (winner.ratingCount || 0)).toFixed(1);
      
      return `🏆 "${competition.title}" Results!\n\n🥇 Winner: ${winnerName}\n"${winner.title}" - ${winner.averageRating.toFixed(1)}⭐ (${winner.ratingCount} votes)\n\nTheme: ${competition.theme}\n\n#SnapScape #Photography #Contest`;
    } else {
      // Photographer ranking compact version
      if (photographerRankings.length === 0) {
        return `🏆 "${competition.title}" photographer rankings! Theme: ${competition.theme} 📷 #SnapScape #Photography`;
      }

      const topPhotographer = photographerRankings[0];
      const photographerName = topPhotographer.photographer.name || 'Anonymous';
      
      return `🏆 "${competition.title}" Photographer Rankings!\n\n🥇 Top Photographer: ${photographerName}\n${topPhotographer.totalPoints} points • ${topPhotographer.totalVotes} votes\n\nTheme: ${competition.theme}\n\n#SnapScape #Photography #Contest`;
    }
  };

  // WhatsApp-specific sharing function with URL-compatible emojis
  const generateWhatsAppText = (tabType: 'submissions' | 'photographers') => {
    if (!competition) {
      return '🏆 Photography competition results on SnapScape! 📷';
    }
    
    if (tabType === 'submissions') {
      if (resultsSubmissions.length === 0) {
        return `🏆 Check out "${competition.title}" photography competition results on SnapScape!\n\nTheme: ${competition.theme}\n\nJoin SnapScape for amazing photography competitions! 📷`;
      }

      // Get top 3 winners with simple text indicators for WhatsApp
      const top3 = resultsSubmissions.slice(0, 3);
      let shareText = `🏆 Results from "${competition.title}" photography competition!\n\nTheme: ${competition.theme}\n\n`;
      
      top3.forEach((submission, index) => {
        const rank = index + 1;
        // Use simple text brackets that work in all platforms
        const indicator = rank === 1 ? '[1st]' : rank === 2 ? '[2nd]' : '[3rd]';
        const winnerName = submission?.user?.name || 'Anonymous';
        const totalRating = (submission.averageRating * (submission.ratingCount || 0)).toFixed(1);
        
        shareText += `${indicator} ${rank === 1 ? 'First' : rank === 2 ? 'Second' : 'Third'} Place: ${winnerName}\n`;
        shareText += `   "${submission.title}" - ${submission.averageRating.toFixed(1)} stars (${submission.ratingCount} votes, ${totalRating} total)\n\n`;
      });
      
      shareText += `Join SnapScape for amazing photography competitions! 📷`;
      return shareText;
    } else {
      // Photographer ranking share text with simple text indicators
      if (photographerRankings.length === 0) {
        return `🏆 Check out the photographer rankings from "${competition.title}" competition!\n\nTheme: ${competition.theme}\n\nJoin SnapScape for amazing photography competitions! 📷`;
      }

      // Get top 3 photographers with simple text indicators
      const top3Photographers = photographerRankings.slice(0, 3);
      let shareText = `🏆 Photographer Rankings from "${competition.title}" competition!\n\nTheme: ${competition.theme}\n\n`;
      
      top3Photographers.forEach((photographer, index) => {
        const rank = index + 1;
        // Use simple text brackets that work in all platforms
        const indicator = rank === 1 ? '[1st]' : rank === 2 ? '[2nd]' : '[3rd]';
        const photographerName = photographer.photographer.name || 'Anonymous';
        
        shareText += `${indicator} ${rank === 1 ? 'First' : rank === 2 ? 'Second' : 'Third'} Place: ${photographerName}\n`;
        shareText += `   ${photographer.totalPoints} points • ${photographer.totalVotes} votes • ${photographer.totalSubmissions} submission${photographer.totalSubmissions !== 1 ? 's' : ''}\n\n`;
      });
      
      shareText += `Join SnapScape for amazing photography competitions! 📷`;
      return shareText;
    }
  };

  // Social media sharing functions - Updated for top 3 winners/photographers
  const generateShareText = (tabType: 'submissions' | 'photographers') => {
    if (!competition) {
      return 'Check out this photography competition on SnapScape! 📷';
    }
    
    if (tabType === 'submissions') {
      if (resultsSubmissions.length === 0) {
        return `🏆 Check out "${competition.title}" photography competition results on SnapScape!\n\nTheme: ${competition.theme}\n\nJoin SnapScape for amazing photography competitions! 📷`;
      }

      // Get top 3 winners
      const top3 = resultsSubmissions.slice(0, 3);
      let shareText = `🏆 Results from "${competition.title}" photography competition!\n\nTheme: ${competition.theme}\n\n`;
      
      top3.forEach((submission, index) => {
        const rank = index + 1;
        const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        const winnerName = submission?.user?.name || 'Anonymous';
        const totalRating = (submission.averageRating * (submission.ratingCount || 0)).toFixed(1);
        
        shareText += `${emoji} ${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place: ${winnerName}\n`;
        shareText += `   "${submission.title}" - ${submission.averageRating.toFixed(1)} stars (${submission.ratingCount} votes, ${totalRating} total)\n\n`;
      });
      
      shareText += `Join SnapScape for amazing photography competitions! 📷`;
      return shareText;
    } else {
      // Photographer ranking share text
      if (photographerRankings.length === 0) {
        return `🏆 Check out the photographer rankings from "${competition.title}" competition!\n\nTheme: ${competition.theme}\n\nJoin SnapScape for amazing photography competitions! 📷`;
      }

      // Get top 3 photographers
      const top3Photographers = photographerRankings.slice(0, 3);
      let shareText = `🏆 Photographer Rankings from "${competition.title}" competition!\n\nTheme: ${competition.theme}\n\n`;
      
      top3Photographers.forEach((photographer, index) => {
        const rank = index + 1;
        const emoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        const photographerName = photographer.photographer.name || 'Anonymous';
        
        shareText += `${emoji} ${rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'} Place: ${photographerName}\n`;
        shareText += `   ${photographer.totalPoints} points • ${photographer.totalVotes} votes • ${photographer.totalSubmissions} submission${photographer.totalSubmissions !== 1 ? 's' : ''}\n\n`;
      });
      
      shareText += `Join SnapScape for amazing photography competitions! 📷`;
      return shareText;
    }
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  const shareToTwitter = (tabType: 'submissions' | 'photographers') => {
    const text = generateTwitterText(tabType);
    const url = getShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const shareToWhatsApp = (tabType: 'submissions' | 'photographers') => {
    const text = generateWhatsAppText(tabType);
    const url = getShareUrl();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareToFacebook = (tabType: 'submissions' | 'photographers') => {
    const text = generateShareText(tabType);
    const url = getShareUrl();
    const fullText = text + '\n\n' + url;
    
    // Copy to clipboard and provide instructions
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        alert('Competition results copied to clipboard!\n\nTo share on Facebook:\n1. Go to facebook.com\n2. Click "What\'s on your mind?" to create a post\n3. Paste (Ctrl+V) the copied content\n4. Click "Post" to share');
        // Also open Facebook in a new tab to make it easier
        window.open('https://www.facebook.com', '_blank');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Competition results copied to clipboard!\n\nTo share on Facebook:\n1. Go to facebook.com\n2. Click "What\'s on your mind?" to create a post\n3. Paste (Ctrl+V) the copied content\n4. Click "Post" to share');
        window.open('https://www.facebook.com', '_blank');
      });
    } else {
      // If clipboard is not available, just open Facebook and show the text
      alert(`Copy this text and paste it on Facebook:\n\n${fullText}`);
      window.open('https://www.facebook.com', '_blank');
    }
  };

  const shareToInstagram = (tabType: 'submissions' | 'photographers') => {
    const text = generateShareText(tabType);
    const url = getShareUrl();
    const fullText = text + '\n\n' + url;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        alert('Competition results copied to clipboard! You can now paste this in your Instagram story or post.');
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Competition results copied to clipboard! You can now paste this in your Instagram story or post.');
      });
    }
  };

  const copyToClipboard = (tabType: 'submissions' | 'photographers') => {
    const text = generateShareText(tabType);
    const url = getShareUrl();
    const fullText = text + '\n\n' + url;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText).then(() => {
        alert('Competition results copied to clipboard!');
      }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Competition results copied to clipboard!');
      });
    }
  };

  // Share buttons component
  const ShareButtons = ({ tabType }: { tabType: 'submissions' | 'photographers' }) => (
    <div className="flex items-center space-x-2 ml-4">
      <span className="text-sm text-gray-500">Share:</span>
      <button
        onClick={() => shareToTwitter(tabType)}
        className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
        title="Share on Twitter"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
        </svg>
      </button>
      <button
        onClick={() => shareToWhatsApp(tabType)}
        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
        title="Share on WhatsApp"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.05 0C4.5 0 0 4.5 0 10.05c0 1.77.46 3.43 1.26 4.87L0 20l5.25-1.38c1.39.76 2.96 1.17 4.8 1.17 5.55 0 10.05-4.5 10.05-10.05S15.6 0 10.05 0zm5.84 14.47c-.26.73-1.28 1.34-2.08 1.51-.57.12-1.31.21-3.82-.82-2.74-1.12-4.5-3.9-4.64-4.08-.13-.18-1.1-1.47-1.1-2.8 0-1.33.7-1.99 1-2.27.26-.26.57-.33.76-.33.19 0 .38.01.55.01.18 0 .42-.07.65.5.26.66.88 2.14.96 2.3.08.16.13.35.03.56-.1.21-.15.34-.3.52-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.18.3.8 1.32 1.72 2.14 1.18.95 2.18 1.24 2.49 1.38.31.14.49.12.67-.07.18-.19.76-.89.96-1.2.2-.31.4-.26.67-.16.27.1 1.71.81 2 .95.29.14.48.21.55.33.07.12.07.69-.19 1.42z"/>
        </svg>
      </button>
      <button
        onClick={() => shareToFacebook(tabType)}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors duration-200"
        title="Share on Facebook"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
        </svg>
      </button>
      <button
        onClick={() => shareToInstagram(tabType)}
        className="p-2 text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors duration-200"
        title="Share on Instagram"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 1.8c2.67 0 2.99.01 4.04.06 1.97.09 3.04.41 3.75.69.94.37 1.61.8 2.31 1.5.7.7 1.13 1.37 1.5 2.31.28.71.6 1.78.69 3.75.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.09 1.97-.41 3.04-.69 3.75-.37.94-.8 1.61-1.5 2.31-.7.7-1.37 1.13-2.31 1.5-.71.28-1.78.6-3.75.69-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-1.97-.09-3.04-.41-3.75-.69-.94-.37-1.61-.8-2.31-1.5-.7-.7-1.13-1.37-1.5-2.31-.28-.71-.6-1.78-.69-3.75C1.81 12.99 1.8 12.67 1.8 10s.01-2.99.06-4.04c.09-1.97.41-3.04.69-3.75.37-.94.8-1.61 1.5-2.31.7-.7 1.37-1.13 2.31-1.5.71-.28 1.78-.6 3.75-.69C7.01 1.81 7.33 1.8 10 1.8zm0 1.44c-2 0-3.63 1.63-3.63 3.63S8 13.63 10 13.63 13.63 12 13.63 10 12 6.37 10 6.37zm5.84-3.72c.65 0 1.18.53 1.18 1.18s-.53 1.18-1.18 1.18-1.18-.53-1.18-1.18.53-1.18 1.18-1.18z"/>
        </svg>
      </button>
      <button
        onClick={() => copyToClipboard(tabType)}
        className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors duration-200"
        title="Copy to Clipboard"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  );

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
    // Generate social media metadata for results sharing
    const pageTitle = `${competition.title} - Results | SnapScape`;
    const pageDescription = resultsSubmissions.length > 0 
      ? `Check out the results from "${competition.title}" photography competition! Winner: ${resultsSubmissions[0]?.user?.name || 'Anonymous'} - "${resultsSubmissions[0]?.title}". Theme: ${competition.theme}`
      : `View the results from "${competition.title}" photography competition on SnapScape. Theme: ${competition.theme}`;
    
    const featuredImage = resultsSubmissions.length > 0 
      ? resultsSubmissions[0].imageUrl 
      : '/logo.png'; // Default SnapScape logo
    
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    return (
      <>
        <Head>
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={currentUrl} />
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:image" content={featuredImage} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content="SnapScape" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:url" content={currentUrl} />
          <meta property="twitter:title" content={pageTitle} />
          <meta property="twitter:description" content={pageDescription} />
          <meta property="twitter:image" content={featuredImage} />

          {/* Additional meta tags */}
          <meta name="description" content={pageDescription} />
          <title>{pageTitle}</title>
        </Head>
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
              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveResultsTab('submissions')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeResultsTab === 'submissions'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Results
                  </button>
                  <button
                    onClick={() => setActiveResultsTab('photographers')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm ${
                      activeResultsTab === 'photographers'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Photographer Rank
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeResultsTab === 'submissions' && (
                <>
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Results</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Final rankings and ratings for all submissions.
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <ShareButtons tabType="submissions" />
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {(() => {
                      let currentActualRank = 0;
                      let lastTotalRating = -Infinity; // Track by total rating instead

                      return resultsSubmissions.map((submission, index) => {
                        // Calculate total rating for this submission
                        const totalRating = submission.averageRating * (submission.ratingCount || 0);
                        
                        // Determine actual dense rank based on total rating
                        if (totalRating !== lastTotalRating) {
                          currentActualRank++;
                        }
                        // Update tracking variable for the next iteration
                        lastTotalRating = totalRating;
                        
                        const rankToDisplay = currentActualRank;
                        
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
                                <div 
                                  className="relative h-48 sm:h-32 md:h-24 w-full md:w-32 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                                >
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
                                  {/* 3. Description (centered, full text) */}
                                  {submission.description && (
                                    <p className="text-center text-xs text-gray-600 mb-3 px-2">
                                      {submission.description}
                                    </p>
                                  )}
                                  {/* 4. Ratings (centered row) */}
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
                                  {/* 5. User Name (centered, no avatar) */}
                                  <div className="flex justify-center items-center mt-1">
                                    <div className="text-sm font-medium text-gray-900">{submission.user?.name || 'Unknown'}</div>
                                  </div>
                                </div>

                                {/* Desktop View Details - hidden by default, visible as block on md and up */}
                                <div className="hidden md:block">
                                  {/* Row 1: Title | Ratings */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-4">
                                      <h4 className="text-lg font-medium text-gray-900 mb-1 truncate">{submission.title}</h4>
                                      {/* Description below title with full text */}
                                      {submission.description && (
                                        <p className="text-sm text-gray-600 leading-tight mb-2">
                                          {submission.description}
                                        </p>
                                      )}
                                    </div>
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
                </>
              )}

              {/* Photographer Rankings Tab */}
              {activeResultsTab === 'photographers' && (
                <>
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Photographer Rank</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          Rankings based on each photographer's cumulative points from all submissions.
                        </p>
                      </div>
                      <div className="mt-3 sm:mt-0">
                        <ShareButtons tabType="photographers" />
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {(() => {
                      let currentRank = 0;
                      let lastTotalRating = -Infinity;

                      return photographerRankings.map((photographer, index) => {
                        // Calculate dense rank based on total points
                        if (photographer.totalPoints !== lastTotalRating) {
                          currentRank++;
                        }
                        lastTotalRating = photographer.totalPoints;

                        let rankText = '';
                        let rankColor = 'bg-gray-500';
                        let trophyIcon: React.ReactNode = null;

                        if (currentRank === 1) {
                          rankText = '1st';
                          rankColor = 'bg-yellow-400';
                          trophyIcon = <span className="mr-1" role="img" aria-label="gold trophy">🥇</span>;
                        } else if (currentRank === 2) {
                          rankText = '2nd';
                          rankColor = 'bg-gray-300';
                          trophyIcon = <span className="mr-1" role="img" aria-label="silver trophy">🥈</span>;
                        } else if (currentRank === 3) {
                          rankText = '3rd';
                          rankColor = 'bg-orange-400';
                          trophyIcon = <span className="mr-1" role="img" aria-label="bronze trophy">🥉</span>;
                        } else {
                          if (currentRank % 100 >= 11 && currentRank % 100 <= 13) {
                            rankText = `${currentRank}th`;
                          } else {
                            switch (currentRank % 10) {
                              case 1: rankText = `${currentRank}st`; break;
                              case 2: rankText = `${currentRank}nd`; break;
                              case 3: rankText = `${currentRank}rd`; break;
                              default: rankText = `${currentRank}th`; break;
                            }
                          }
                        }

                        const isCurrentUser = session?.user?.id === photographer.photographer.id;

                        return (
                          <li
                            key={photographer.photographer.id}
                            className={`px-4 py-5 sm:px-6 ${isCurrentUser ? 'bg-indigo-50' : ''}`}
                          >
                            <div className="flex flex-col md:flex-row md:items-start md:space-x-4">
                              {/* Best Submission Image */}
                              <div className="w-full md:w-32 flex-shrink-0 mb-3 md:mb-0">
                                <div className="relative h-48 sm:h-32 md:h-24 w-full md:w-32 rounded-lg overflow-hidden">
                                  <Image
                                    src={photographer.bestSubmission.thumbnailUrl || photographer.bestSubmission.imageUrl}
                                    alt={photographer.bestSubmission.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 128px"
                                    className="object-cover"
                                  />
                                </div>
                              </div>

                              {/* Photographer Details */}
                              <div className="flex-1">
                                {/* Mobile View */}
                                <div className="flex flex-col items-center mt-3 md:hidden">
                                  <div className="mb-2">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${rankColor}`}>
                                      {trophyIcon} {rankText} <span className="ml-1">Rank</span>
                                    </span>
                                  </div>
                                  <h4 className="text-center text-md sm:text-lg font-medium text-gray-900 mb-2">
                                    {photographer.photographer.name}
                                  </h4>
                                  <div className="flex flex-col items-center space-y-2 mb-2">
                                    {/* Total Points */}
                                    <div className="flex items-center justify-center">
                                      <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                                        <span className="font-bold">{photographer.totalPoints}</span>
                                        <span className="ml-1">(Total Points)</span>
                                      </div>
                                    </div>
                                    {/* Total Votes */}
                                    <div className="flex items-center">
                                      <svg className="text-blue-500 h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs sm:text-sm font-medium">
                                        {photographer.totalVotes} (Total Votes)
                                      </span>
                                    </div>
                                    {/* Total Rating */}
                                    <div className="flex items-center">
                                      <svg className="text-green-500 h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      <span className="text-xs sm:text-sm text-gray-500">
                                        {photographer.totalRating.toFixed(1)} (Total Rating)
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-center text-xs text-gray-500">
                                    {photographer.totalSubmissions} submission{photographer.totalSubmissions !== 1 ? 's' : ''} • Avg: {photographer.averageRating.toFixed(1)}
                                  </div>
                                </div>

                                {/* Desktop View */}
                                <div className="hidden md:block">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 mr-4">
                                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                                        {photographer.photographer.name}
                                      </h4>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Best submission: "{photographer.bestSubmission.title}"
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {photographer.totalSubmissions} submission{photographer.totalSubmissions !== 1 ? 's' : ''} • Average rating: {photographer.averageRating.toFixed(1)}
                                      </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      {/* Total Points */}
                                      <div className="flex items-center justify-end mb-2">
                                        <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                          <span className="font-bold">{photographer.totalPoints}</span>
                                          <span className="ml-1">(Total Points)</span>
                                        </div>
                                      </div>
                                      {/* Total Votes */}
                                      <div className="flex items-center justify-end">
                                        <svg className="text-blue-500 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-lg font-medium">
                                          {photographer.totalVotes} (Total Votes)
                                        </span>
                                      </div>
                                      {/* Total Rating */}
                                      <div className="flex items-center justify-end mt-1">
                                        <svg className="text-green-500 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        <span className="text-sm text-gray-500">
                                          {photographer.totalRating.toFixed(1)} (Total Rating)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center mt-2">
                                    <span className={`inline-flex items-center px-2 py-1 mr-2 rounded text-xs font-bold text-white ${rankColor}`}>
                                      {trophyIcon} {rankText} <span className="ml-1">Rank</span>
                                    </span>
                                    {photographer.photographer.profileImage && (
                                      <Image
                                        src={photographer.photographer.profileImage}
                                        alt={photographer.photographer.name}
                                        width={32}
                                        height={32}
                                        className="rounded-full mr-2"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </>
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
                className="relative w-full aspect-[4/3] group overflow-hidden"
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
    </div>
  );
}