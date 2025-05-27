'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { compressImage, isValidImageType, formatFileSize } from '@/utils/imageCompression';

interface Competition {
  _id: string;
  title: string;
  theme: string;
  description: string;
  rules: string;
  prizes: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  votingEndDate: string;
  submissionLimit: number;
  votingCriteria: string;
  submissionFormat: string;
  hasSubmitted: boolean;
  userSubmissionsCount: number;
  canSubmitMore: boolean;
  coverImage?: string;
  submissionCount: number;
}

interface Submission {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  user: {
    _id: string;
    name: string;
  };
  averageRating: number;
  ratingsCount: number;
  userRating?: number;
  createdAt?: string;
}

// Accordion Component
interface AccordionItemProps {
  title: string;
  content: string;
  defaultContent?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function AccordionItem({ title, content, defaultContent, isExpanded, onToggle }: AccordionItemProps) {
  const displayContent = content || defaultContent || '';
  
  return (
    <div className="border border-[#e0c36a] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-[#fffbe6] hover:bg-[#f5f1d4] text-left flex items-center justify-between transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2699a6] focus:ring-inset"
      >
        <h3 className="font-bold text-[#1a4d5c] text-base">{title}</h3>
        <svg 
          className={`w-5 h-5 text-[#1a4d5c] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 bg-white border-t border-[#e0c36a]">
          <div className="text-gray-700">
            <MarkdownRenderer content={displayContent} />
          </div>
        </div>
      )}
    </div>
  );
}

// Expandable Section Component
interface ExpandableSectionProps {
  title: string;
  content: string;
  defaultContent?: string;
  maxLines?: number;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableSection({ title, content, defaultContent, maxLines = 3, isExpanded, onToggle }: ExpandableSectionProps) {
  // Determine if content should be expandable (has more than a reasonable amount of text)
  const shouldBeExpandable = content && content.length > 200;
  const displayContent = content || defaultContent || '';

  return (
    <div>
      <h3 className="font-bold text-[#1a4d5c] mb-1 text-base">{title}</h3>
      <div className="text-gray-700">
        <div 
          className={!isExpanded && shouldBeExpandable ? 'overflow-hidden' : ''}
          style={
            !isExpanded && shouldBeExpandable 
              ? {
                  display: '-webkit-box',
                  WebkitLineClamp: maxLines,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }
              : {}
          }
        >
          <MarkdownRenderer content={displayContent} />
        </div>
        {shouldBeExpandable && (
          <button
            onClick={onToggle}
            className="mt-2 inline-flex items-center text-[#2699a6] hover:text-[#1a4d5c] text-sm font-medium transition-colors duration-200 focus:outline-none group"
          >
            <span className="mr-1">{isExpanded ? 'Show Less' : 'Show More'}</span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CompetitionDetail() {
  const { data: session, status } = useSession();
  const params = useParams();
  const competitionId = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSubmitParam = searchParams.get('submit');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    rules: false,
    prizes: false,
    submissionFormat: false
  });
  
  // Photo submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [fileSizeError, setFileSizeError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string>('');

  // New state for user's submissions to this competition
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Add modal navigation logic
  const currentModalIndex = modalImage ? userSubmissions.findIndex(img => img._id === modalImage) : -1;
  const showNextImage = useCallback(() => {
    if (currentModalIndex >= 0 && currentModalIndex < userSubmissions.length - 1) {
      setModalImage(userSubmissions[currentModalIndex + 1]._id);
    }
  }, [currentModalIndex, userSubmissions]);
  const showPrevImage = useCallback(() => {
    if (currentModalIndex > 0) {
      setModalImage(userSubmissions[currentModalIndex - 1]._id);
    }
  }, [currentModalIndex, userSubmissions]);
  // Listen for wheel and arrow key events when modal is open
  useEffect(() => {
    if (!modalImage) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) showNextImage();
      else if (e.deltaY < 0) showPrevImage();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') showPrevImage();
      if (e.key === 'Escape') setModalImage(null);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImage, showNextImage, showPrevImage]);

  // Fetch competition and submissions data
  useEffect(() => {
    const fetchCompetitionData = async () => {
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
        
        // Fetch submissions for this competition if it's in voting or completed status
        if (competitionData.data.status === 'voting' || competitionData.data.status === 'completed') {
          const submissionsRes = await fetch(`/api/photo-submissions?competition=${competitionId}`);
          if (!submissionsRes.ok) {
            throw new Error('Failed to fetch submissions');
          }
          const submissionsData = await submissionsRes.json();
          setSubmissions(submissionsData.data || []);
        }
      } catch (err: any) {
        console.error('Error fetching competition data:', err);
        setError(err.message || 'An error occurred while fetching competition data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && competitionId) {
      fetchCompetitionData();
    }
  }, [competitionId, status]);

  // Fetch user's submissions for this competition
  useEffect(() => {
    const fetchUserSubmissions = async () => {
      if (!session?.user || !competitionId) return;
      try {
        const response = await fetch(`/api/user/submissions?competition=${competitionId}&limit=100`);
        if (!response.ok) throw new Error('Failed to fetch user submissions');
        const data = await response.json();
        setUserSubmissions(data.data || []);
      } catch (err) {
        setUserSubmissions([]);
      }
    };
    fetchUserSubmissions();
  }, [session, competitionId]);

  // Modify the useEffect to show the form based on URL parameter
  useEffect(() => {
    if (showSubmitParam === 'true' && competition?.status === 'active' && !competition?.hasSubmitted) {
      setShowSubmitForm(true);
    }
  }, [competition, showSubmitParam]);

  // Handle file input change with file size check and compression
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeError('');
    setCompressionInfo('');
    setIsCompressing(false);
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (!isValidImageType(file)) {
        setFileSizeError('Please upload a valid image file (JPG, PNG or WebP)');
        setPhotoFile(null);
        return;
      }
      
      // Check original file size (10MB limit)
      const originalSize = file.size / (1024 * 1024); // Size in MB
      console.log(`Original image size: ${originalSize.toFixed(2)} MB`);
      
      if (file.size > 10 * 1024 * 1024) {
        setFileSizeError(`Image size must be less than 10MB (current size: ${originalSize.toFixed(2)} MB)`);
        setPhotoFile(null);
        return;
      }
      
      // If file is larger than 10MB, compress it to fit within 10MB limit
      if (file.size > 10 * 1024 * 1024) {
        try {
          setIsCompressing(true);
          setCompressionInfo('Optimizing image for high-quality desktop viewing...');
          
          const compressionResult = await compressImage(file, {
            maxSizeMB: 10, // Set to 10MB maximum
            maxWidthOrHeight: 3840, // Support up to 4K resolution
            initialQuality: 0.95, // Start with very high quality
            alwaysKeepResolution: false // Allow smart resizing only when necessary
          });
          
          setPhotoFile(compressionResult.file);
          setCompressionInfo(
            `Image compressed: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${Math.round(compressionResult.compressionRatio * 100)}% of original)`
          );
          
          console.log('Compression successful:', compressionResult);
        } catch (error) {
          console.error('Error compressing image:', error);
          setFileSizeError('Failed to compress image. Please try a smaller file or compress it manually.');
          setPhotoFile(null);
        } finally {
          setIsCompressing(false);
        }
      } else {
        // For smaller files, just use them as is
        setPhotoFile(file);
        setCompressionInfo(`Image ready: ${formatFileSize(file.size)}`);
      }
    } else {
      setPhotoFile(null);
    }
  };

  // Handle photo submission
  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    setFileSizeError('');
    
    try {
      // Validate input
      if (!photoTitle || !photoDescription || !photoFile) {
        throw new Error('Please fill in all fields and select a photo');
      }
      
      // Final size check (should be under 10MB after optimization)
      const maxSize = 10 * 1024 * 1024; // 10MB maximum
      if (photoFile.size > maxSize) {
        setFileSizeError('The processed image is still too large. Please try a smaller original image.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Creating FormData for photo upload');
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', photoTitle);
      formData.append('description', photoDescription);
      formData.append('competition', competitionId);
      formData.append('photo', photoFile);
      
      console.log('Submitting photo', {
        title: photoTitle,
        description: photoDescription?.substring(0, 30) + '...',
        competitionId,
        photoSize: photoFile?.size,
        photoSizeMB: (photoFile?.size / 1024 / 1024).toFixed(2),
        photoType: photoFile?.type
      });
      
      // Use fetch with explicit configuration optimized for reliability
      try {
        // Submit photo with explicit Content-Type
        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
          // Don't set Content-Type header manually when using FormData
          // The browser will set it correctly with the boundary parameter
          headers: {
            // Only add non-conflicting headers
            'Accept': 'application/json',
          },
          // Important options for reliability
          credentials: 'same-origin',
          mode: 'cors',
          cache: 'no-cache',
        });
        
        console.log('Response status:', response.status, response.statusText);
        // Fix TypeScript error with headers entries
        const headerObj: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headerObj[key] = value;
        });
        console.log('Response headers:', headerObj);
        
        // Enhanced error handling for 413 and other status codes
        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          
          // Handle specific HTTP status codes
          if (response.status === 413) {
            errorMessage = 'File too large for upload. Please try a smaller original image.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid request. Please check your file and try again.';
          } else if (response.status === 401) {
            errorMessage = 'Authentication required. Please refresh the page and try again.';
          } else if (response.status === 404) {
            errorMessage = 'Competition not found. Please refresh the page.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          try {
            // Try to parse the error response for more details
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
              const errorData = await response.json();
              console.log('Error response data:', errorData);
              
              // Use server-provided error message if available
              if (errorData.message) {
                errorMessage = errorData.message;
              }
              
              // Handle specific error types
              if (errorData.error === 'PAYLOAD_TOO_LARGE' || errorData.error === 'FILE_TOO_LARGE') {
                setFileSizeError(errorData.message || 'File too large. Please try a smaller original image.');
                setIsSubmitting(false);
                return;
              }
            } else {
              // If not JSON, try to get text
              const textResponse = await response.text();
              console.log('Non-JSON error response:', textResponse);
              if (textResponse && textResponse.length < 200) {
                errorMessage += ` - ${textResponse}`;
              }
            }
          } catch (jsonError) {
            console.error('Error parsing error response:', jsonError);
          }
          
          throw new Error(errorMessage);
        }
        
        // Handle successful response
        let responseData;
        try {
          // Check if there's content to parse
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.indexOf('application/json') !== -1) {
            responseData = await response.json();
            console.log('Success response:', responseData);
          } else {
            console.log('Non-JSON success response');
            // Handle empty or non-JSON response
            responseData = { message: 'Photo submitted successfully' };
          }
        } catch (jsonError) {
          console.error('Error parsing success response:', jsonError);
          // Don't throw here, assume success if response was ok
          responseData = { message: 'Photo submitted successfully' };
        }
        
        setSubmitSuccess(responseData?.message || 'Photo submitted successfully!');
        setPhotoTitle('');
        setPhotoDescription('');
        setPhotoFile(null);
        setCompressionInfo('');
        setShowSubmitForm(false);
        
        // Refresh competition data to update submission status
        try {
          console.log('Refreshing competition data');
          const refreshRes = await fetch(`/api/competitions/${competitionId}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setCompetition(refreshData.data);
          }
        } catch (refreshError) {
          console.error('Error refreshing competition data:', refreshError);
          // Don't throw here, as the submission was successful
        }
      } catch (fetchError: unknown) {
        console.error('Fetch operation failed:', fetchError);
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown network error';
        
        // Handle specific network errors
        if (errorMessage.includes('413')) {
          setFileSizeError('File too large for upload. Please try a smaller original image.');
          setIsSubmitting(false);
          return;
        }
        
        throw new Error(`Network error: ${errorMessage}`);
      }
    } catch (err: any) {
      console.error('Error submitting photo:', err);
      
      // Enhanced error message for users
      let userErrorMessage = err.message || 'An error occurred while submitting your photo';
      
      // Provide helpful guidance based on error type
      if (userErrorMessage.includes('413') || userErrorMessage.includes('too large') || userErrorMessage.includes('payload')) {
        setFileSizeError('Your image file is too large. Please try a smaller original image.');
      } else if (userErrorMessage.includes('network') || userErrorMessage.includes('fetch')) {
        setSubmitError('Network error occurred. Please check your internet connection and try again.');
      } else if (userErrorMessage.includes('timeout')) {
        setSubmitError('Upload timed out. Please try again with a smaller image or check your connection.');
      } else {
        setSubmitError(userErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      
      // Update submission in state with new rating
      setSubmissions(submissions.map(submission => 
        submission._id === submissionId 
          ? { ...submission, userRating: rating } 
          : submission
      ));
      
    } catch (err: any) {
      console.error('Error rating photo:', err);
      alert(err.message || 'An error occurred while rating the photo');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  // Function to toggle expanded sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
    <div className="container mx-auto px-4 py-4 bg-[#e6f0f3] min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <Link 
          href="/dashboard/competitions"
          className="inline-flex items-center text-sm text-[#1a4d5c] hover:text-[#2699a6] font-semibold"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Competitions
        </Link>
      </div>
      
      {/* Competition header and details in 2 columns */}
      <div className="bg-white border-2 border-[#e0c36a] shadow rounded-2xl overflow-hidden mb-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Image and main info */}
          <div className="flex flex-col items-start gap-3">
            {competition.coverImage && (
              <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden border border-[#e0c36a] bg-[#e6f0f3] relative">
                <Image
                  src={competition.coverImage}
                  alt={competition.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            {/* Submit photo section for active competitions - MOVED HERE */}
            {competition.status === 'active' && (
              <div className="w-full px-4 py-4 bg-[#fffbe6] border-2 border-[#e0c36a] rounded-lg">
                <div className="text-center">
                  {/* Show submission count */}
                  <div className="mb-2">
                    <p className="text-[#1a4d5c] font-semibold">
                      Your submissions: <span className="font-bold">{competition.userSubmissionsCount}</span> of <span className="font-bold">{competition.submissionLimit}</span>
                    </p>
                    {competition.hasSubmitted && !competition.canSubmitMore && (
                      <p className="text-red-600 font-semibold mt-1 text-sm">
                        You've reached the maximum number of submissions for this competition.
                      </p>
                    )}
                    {competition.hasSubmitted && competition.canSubmitMore && (
                      <p className="text-green-600 font-semibold mt-1 text-sm">
                        You can submit {competition.submissionLimit - competition.userSubmissionsCount} more photo{competition.submissionLimit - competition.userSubmissionsCount !== 1 ? 's' : ''}.
                      </p>
                    )}
                  </div>

                  {showSubmitForm ? (
                    <div>
                      <h3 className="text-lg font-bold text-[#1a4d5c] mb-2">Submit Your Photo</h3>
                      
                      {submitError && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-3 text-left rounded-md">
                          <p className="text-red-700 font-semibold">{submitError}</p>
                        </div>
                      )}
                      
                      {fileSizeError && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-2 mt-2 rounded-md">
                          <p className="text-red-700 text-sm font-semibold">{fileSizeError}</p>
                        </div>
                      )}
                      
                      <form onSubmit={handleSubmitPhoto} className="max-w-md mx-auto text-left">
                        <div className="mb-3">
                          <label htmlFor="photoTitle" className="block text-sm font-semibold text-[#1a4d5c] mb-1">
                            Photo Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="photoTitle"
                            value={photoTitle}
                            onChange={(e) => setPhotoTitle(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 text-[#1a4d5c] bg-white border border-[#e0c36a] rounded-lg shadow-sm focus:ring-2 focus:ring-[#2699a6] focus:border-[#2699a6] text-base"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="photoDescription" className="block text-sm font-semibold text-[#1a4d5c] mb-1">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="photoDescription"
                            value={photoDescription}
                            onChange={(e) => setPhotoDescription(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full px-3 py-2 text-[#1a4d5c] bg-white border border-[#e0c36a] rounded-lg shadow-sm focus:ring-2 focus:ring-[#2699a6] focus:border-[#2699a6] text-base resize-vertical"
                            required
                          />
                        </div>
                        
                        <div className="mb-3">
                          <label htmlFor="photoFile" className="block text-sm font-semibold text-[#1a4d5c] mb-1">
                            Photo <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="file"
                            id="photoFile"
                            accept="image/*"
                            onChange={handlePhotoFileChange}
                            className="mt-1 block w-full text-sm text-[#1a4d5c] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#e6f0f3] file:text-[#1a4d5c] hover:file:bg-[#d1e6ed] border-[#e0c36a]"
                            required
                            disabled={isCompressing}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            JPG, PNG or WebP up to 10MB (automatically optimized for high-quality desktop viewing)
                          </p>
                          
                          {/* Compression status */}
                          {isCompressing && (
                            <div className="mt-2 flex items-center text-sm text-[#2699a6]">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#2699a6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Compressing image...
                            </div>
                          )}
                          
                          {/* Compression info */}
                          {compressionInfo && !isCompressing && (
                            <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
                              ✓ {compressionInfo}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(false)}
                            className="inline-flex items-center px-4 py-2 border-2 border-[#e0c36a] shadow-sm text-sm font-semibold rounded-lg text-[#1a4d5c] bg-[#fffbe6] hover:bg-[#e6f0f3]"
                            disabled={isSubmitting || isCompressing}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || isCompressing}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] hover:from-[#2699a6] hover:to-[#1a4d5c] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Submitting...' : isCompressing ? 'Processing...' : 'Submit Photo'}
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      {submitSuccess && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-3 rounded-md">
                          <p className="text-green-700 font-semibold">{submitSuccess}</p>
                        </div>
                      )}
                      
                      {competition.canSubmitMore ? (
                        <button
                          onClick={() => setShowSubmitForm(true)}
                          className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] hover:from-[#2699a6] hover:to-[#1a4d5c]"
                        >
                          {competition.hasSubmitted ? 'Submit Another Photo' : 'Submit Your Photo'}
                        </button>
                      ) : (
                        <p className="text-gray-500">
                          You've reached the maximum number of submissions for this competition.
                        </p>
                      )}
                      
                      <p className="mt-2 text-sm text-gray-500">
                        Submission period ends on {formatDate(competition.endDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* View All Submissions button */}
            {competition.submissionCount > 0 && (
              <Link 
                href={`/dashboard/competitions/${competition._id}/view-submissions`}
                className="block w-full"
              >
                <button className="mt-2 w-full px-3 py-2 bg-[#fffbe6] border-2 border-[#e0c36a] rounded-lg text-[#1a4d5c] text-sm font-semibold hover:bg-[#e6f0f3]">
                  View All Submissions ({competition.submissionCount})
                </button>
              </Link>
            )}
          </div>
          {/* Right: Details */}
          <div className="flex flex-col gap-3 text-sm">
            {/* Title and status at the top */}
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-[#1a4d5c] m-0 p-0">{competition.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow ${
                competition.status === 'active' ? 'bg-green-100 text-green-800' :
                competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                competition.status === 'voting' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
              </span>
            </div>
            
            {/* Competition Details Accordion */}
            <div className="space-y-2">
              <AccordionItem
                title="Description"
                content={competition.description}
                isExpanded={expandedSections.description}
                onToggle={() => toggleSection('description')}
              />
              
              <AccordionItem
                title="Rules & Regulations"
                content={competition.rules}
                defaultContent="Standard rules apply."
                isExpanded={expandedSections.rules}
                onToggle={() => toggleSection('rules')}
              />
              
              <AccordionItem
                title="Prizes"
                content={competition.prizes}
                defaultContent="No prize information is available for this competition."
                isExpanded={expandedSections.prizes}
                onToggle={() => toggleSection('prizes')}
              />
              
              <AccordionItem
                title="Submission Format"
                content={competition.submissionFormat || 'JPEG, minimum resolution of 700px × 700px, maximum size 25MB'}
                isExpanded={expandedSections.submissionFormat}
                onToggle={() => toggleSection('submissionFormat')}
              />
            </div>
            
            {/* Voting Criteria - Compact display */}
            {competition.votingCriteria && (
              <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-3">
                <h3 className="font-bold text-[#1a4d5c] mb-2 text-base">Voting Criteria</h3>
                <div className="flex flex-wrap gap-2">
                  {competition.votingCriteria.split(',').map((criteria, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#e6f0f3] text-[#1a4d5c] border border-[#e0c36a]">
                      {criteria.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Copyright - Compact display */}
            <div className="bg-[#fffbe6] border border-[#e0c36a] rounded-lg p-3">
              <h3 className="font-bold text-[#1a4d5c] mb-1 text-base">Copyright</h3>
              <div className="text-gray-700 text-sm">You maintain the copyrights to all photos you submit. You must own all submitted images.</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Dates - MOVED UP */}
      <div className="px-6 py-6 border-t-2 border-[#e0c36a] bg-[#e6f0f3] rounded-b-2xl">
        <h2 className="text-lg font-bold text-[#1a4d5c] mb-2">Important Dates</h2>
        <div className="bg-[#fffbe6] rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-semibold text-[#2699a6]">Submission Start</p>
            <p className="text-[#1a4d5c] font-bold">{formatDate(competition.startDate)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2699a6]">Submission End</p>
            <p className="text-[#1a4d5c] font-bold">{formatDate(competition.endDate)}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#2699a6]">Voting End</p>
            <p className="text-[#1a4d5c] font-bold">{formatDate(competition.votingEndDate)}</p>
          </div>
        </div>
      </div>
      {/* User's Submitted Images for this Competition */}
      {userSubmissions.length > 0 && (
        <div className="mt-12 px-6">
          <h2 className="text-lg font-bold text-[#1a4d5c] mb-3">My Submitted Images for this Competition</h2>
          <div className="grid grid-cols-3 gap-0">
            {userSubmissions.map((img) => (
              <div
                key={img._id}
                className="relative w-full aspect-[4/3] group overflow-hidden cursor-pointer"
                onClick={() => setModalImage(img._id)}
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-4">
                  <div className="font-bold text-base mb-1 truncate w-full text-center">{img.title}</div>
                  <div className="text-xs w-full text-center">Uploaded: {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal for full image with sidebar */}
      {modalImage && (() => {
        const currentImg = userSubmissions.find(img => img._id === modalImage);
        if (!currentImg) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setModalImage(null)}>
            <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-8 z-10 bg-white/80 hover:bg-white text-[#1a4d5c] rounded-full p-2 shadow" onClick={() => setModalImage(null)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Image on the left */}
              <div className="flex-1 h-full relative modal-image-area" key={currentImg._id}>
                <img
                  src={currentImg.imageUrl}
                  alt={currentImg.title}
                  className="object-contain w-full h-full modal-image"
                />
              </div>
              {/* Sidebar on the right */}
              <div className="w-full md:w-64 h-full flex flex-col justify-center bg-black/70 p-6 md:rounded-none rounded-b-2xl md:rounded-r-2xl modal-sidebar">
                <div className="font-bold text-2xl text-white mb-2 text-center md:text-left">{currentImg.title}</div>
                <div className="text-xs text-gray-200 mb-4 text-center md:text-left">Uploaded: {currentImg.createdAt ? new Date(currentImg.createdAt).toLocaleDateString() : ''}</div>
                {currentImg.description && (
                  <div className="text-sm text-gray-100 mt-2 text-center md:text-left">{currentImg.description}</div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
} 