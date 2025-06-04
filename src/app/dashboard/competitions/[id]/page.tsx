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
  copyrightNotice: string;
  hasSubmitted: boolean;
  userSubmissionsCount: number;
  canSubmitMore: boolean;
  coverImage?: string;
  submissionCount: number;
  hideOtherSubmissions: boolean;
  judges?: string[];
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

// Utility function to check if user is in "View as User" mode
const isViewingAsUser = (): boolean => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('viewAsUser') === 'true';
  }
  return false;
};

// Utility function to get effective user role (considers view as user mode)
const getEffectiveUserRole = (user: ExtendedUser): string => {
  if (user.role === 'judge' && isViewingAsUser()) {
    return 'user';
  }
  return user.role || 'user';
};

export default function CompetitionDetail() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string };
  const params = useParams();
  const competitionId = params?.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSubmitParam = searchParams.get('submit');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add judge role detection - consider "View as User" mode
  const effectiveRole = session?.user ? getEffectiveUserRole(session.user) : 'user';
  const isJudge = effectiveRole === 'judge';
  const [isAssignedJudge, setIsAssignedJudge] = useState(false);
  
  // Detect if judge is in normal judge mode (not "View as User" mode)
  const [isJudgeMode, setIsJudgeMode] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewAsUser = urlParams.get('viewAsUser') === 'true';
      const userRole = (session?.user as any)?.role;
      
      // Judge is in "judge mode" if they're a judge but NOT in "View as User" mode
      const newJudgeMode = userRole === 'judge' && !viewAsUser;
      
      console.log('Judge mode state update:', {
        userRole,
        viewAsUser,
        newJudgeMode,
        currentJudgeMode: isJudgeMode
      });
      
      setIsJudgeMode(newJudgeMode);
    }
  }, [session, searchParams]);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    rules: false,
    prizes: false,
    submissionFormat: false,
    copyright: false
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
  const [showCompressionInfo, setShowCompressionInfo] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // New state for user's submissions to this competition
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Edit/Delete functionality state
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editFileSizeError, setEditFileSizeError] = useState('');
  const [editCompressionInfo, setEditCompressionInfo] = useState('');
  const [isEditCompressing, setIsEditCompressing] = useState(false);

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
      
      // Check if current judge is assigned to this competition
      if (session?.user?.role === 'judge' && session?.user?.id && competitionData.data?.judges) {
        const isAssigned = competitionData.data.judges.includes(session.user.id);
        setIsAssignedJudge(isAssigned);
      } else {
        setIsAssignedJudge(false);
      }
      
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

  useEffect(() => {
    if (status === 'authenticated' && competitionId) {
      fetchCompetitionData();
    }
  }, [competitionId, status]);

  // Separate useEffect to handle judge assignment when mode changes
  useEffect(() => {
    if (competition && session?.user?.role === 'judge' && session?.user?.id) {
      if (competition.judges) {
        const isAssigned = competition.judges.includes(session.user.id);
        setIsAssignedJudge(isAssigned);
      } else {
        setIsAssignedJudge(false);
      }
    }
  }, [competition, session, isJudgeMode]);

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

  // Fetch settings to determine if compression info should be shown
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setShowCompressionInfo(data.data.enableImageCompressionDisplay);
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        // Default to showing compression info if fetch fails
        setShowCompressionInfo(true);
      }
    };
    fetchSettings();
  }, []);

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
      
      // If file is larger than 3MB, compress it for optimization
      if (file.size > 3 * 1024 * 1024) {
        try {
          setIsCompressing(true);
          if (showCompressionInfo) {
            setCompressionInfo('Optimizing image for high-quality desktop viewing...');
          }
          
          const compressionResult = await compressImage(file, {
            maxSizeMB: 10, // Set to 10MB maximum (but compress from 3MB+)
            maxWidthOrHeight: 3840, // Support up to 4K resolution
            initialQuality: 0.95, // Start with very high quality
            alwaysKeepResolution: false // Allow smart resizing only when necessary
          });
          
          setPhotoFile(compressionResult.file);
          if (showCompressionInfo) {
            setCompressionInfo(
              `Image compressed: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${Math.round(compressionResult.compressionRatio * 100)}% of original)`
            );
          }
          
          console.log('Compression successful:', compressionResult);
        } catch (error) {
          console.error('Error compressing image:', error);
          setFileSizeError('Failed to compress image. Please try a smaller file or compress it manually.');
          setPhotoFile(null);
        } finally {
          setIsCompressing(false);
        }
              } else {
        // For files 3MB and under, use them as-is (no compression needed)
        setPhotoFile(file);
        if (showCompressionInfo) {
          setCompressionInfo(`Image ready: ${formatFileSize(file.size)} (no compression needed)`);
        }
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
      
      if (photoDescription.length > 500) {
        throw new Error('Description cannot be more than 500 characters');
      }
      
      if (!agreedToTerms) {
        throw new Error('Please confirm that you have reviewed and agree to the competition terms');
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
        setAgreedToTerms(false);
        setShowSubmitForm(false);
        
        // Refresh competition data to update submission status
        try {
          console.log('Refreshing competition data');
          const refreshRes = await fetch(`/api/competitions/${competitionId}`);
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setCompetition(refreshData.data);
          }
          
          // Also refresh user submissions to show the newly uploaded image
          console.log('Refreshing user submissions');
          const userSubmissionsRes = await fetch(`/api/user/submissions?competition=${competitionId}&limit=100`);
          if (userSubmissionsRes.ok) {
            const userSubmissionsData = await userSubmissionsRes.json();
            setUserSubmissions(userSubmissionsData.data || []);
          }
        } catch (refreshError) {
          console.error('Error refreshing data:', refreshError);
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Handle editing submission
  const handleEditSubmission = (submission: Submission) => {
    setEditingSubmission(submission._id);
    setEditTitle(submission.title);
    setEditDescription(submission.description || '');
    setEditError('');
    setEditSuccess('');
    setEditPhotoFile(null);
    setEditFileSizeError('');
    setEditCompressionInfo('');
  };

  const handleCancelEdit = () => {
    setEditingSubmission(null);
    setEditTitle('');
    setEditDescription('');
    setEditError('');
    setEditSuccess('');
    setEditPhotoFile(null);
    setEditFileSizeError('');
    setEditCompressionInfo('');
  };

  const handleUpdateSubmission = async (submissionId: string) => {
    if (!editTitle.trim()) {
      setEditError('Title is required');
      return;
    }

    if (editTitle.length > 100) {
      setEditError('Title cannot be more than 100 characters');
      return;
    }

    if (editDescription.length > 500) {
      setEditError('Description cannot be more than 500 characters');
      return;
    }

    try {
      setIsUpdating(true);
      setEditError('');

      let response;

      if (editPhotoFile) {
        // Update with new image using FormData
        const formData = new FormData();
        formData.append('title', editTitle.trim());
        formData.append('description', editDescription.trim());
        formData.append('photo', editPhotoFile);

        response = await fetch(`/api/photo-submissions/${submissionId}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        // Update text only using JSON
        response = await fetch(`/api/photo-submissions/${submissionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            description: editDescription.trim(),
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update submission');
      }

      setEditSuccess('Submission updated successfully!');
      
      // Update the submission in the local state
      setUserSubmissions(prev => 
        prev.map(sub => 
          sub._id === submissionId 
            ? { 
                ...sub, 
                title: editTitle.trim(), 
                description: editDescription.trim(),
                ...(data.data.imageUrl && { imageUrl: data.data.imageUrl })
              }
            : sub
        )
      );

      // Close edit form after a short delay
      setTimeout(() => {
        handleCancelEdit();
      }, 1500);

    } catch (error: any) {
      console.error('Error updating submission:', error);
      setEditError(error.message || 'Failed to update submission');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(submissionId);

      const response = await fetch(`/api/photo-submissions/${submissionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete submission');
      }

      // Remove the submission from local state
      setUserSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
      
      // Close modal if this submission was being viewed
      if (modalImage === submissionId) {
        setModalImage(null);
      }

      // Refresh competition data to update submission count
      await fetchCompetitionData();

      alert('Submission deleted successfully!');

    } catch (error: any) {
      console.error('Error deleting submission:', error);
      alert(error.message || 'Failed to delete submission');
    } finally {
      setIsDeleting(null);
    }
  };

  // Function to toggle expanded sections
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle edit photo file change with compression
  const handleEditPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFileSizeError('');
    setEditCompressionInfo('');
    setIsEditCompressing(false);
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (!isValidImageType(file)) {
        setEditFileSizeError('Please upload a valid image file (JPG, PNG or WebP)');
        setEditPhotoFile(null);
        return;
      }
      
      // Check original file size (10MB limit)
      const originalSize = file.size / (1024 * 1024); // Size in MB
      
      if (file.size > 10 * 1024 * 1024) {
        setEditFileSizeError(`Image size must be less than 10MB (current size: ${originalSize.toFixed(2)} MB)`);
        setEditPhotoFile(null);
        return;
      }
      
      // If file is larger than 3MB, compress it for optimization
      if (file.size > 3 * 1024 * 1024) {
        try {
          setIsEditCompressing(true);
          if (showCompressionInfo) {
            setEditCompressionInfo('Optimizing image for high-quality desktop viewing...');
          }
          
          const compressionResult = await compressImage(file, {
            maxSizeMB: 10,
            maxWidthOrHeight: 3840,
            initialQuality: 0.95,
            alwaysKeepResolution: false
          });
          
          setEditPhotoFile(compressionResult.file);
          if (showCompressionInfo) {
            setEditCompressionInfo(
              `Image compressed: ${formatFileSize(compressionResult.originalSize)} → ${formatFileSize(compressionResult.compressedSize)} (${Math.round(compressionResult.compressionRatio * 100)}% of original)`
            );
          }
        } catch (error) {
          console.error('Error compressing image:', error);
          setEditFileSizeError('Failed to compress image. Please try a smaller file or compress it manually.');
          setEditPhotoFile(null);
        } finally {
          setIsEditCompressing(false);
        }
      } else {
        // For files 3MB and under, use them as-is
        setEditPhotoFile(file);
        if (showCompressionInfo) {
          setEditCompressionInfo(`Image ready: ${formatFileSize(file.size)} (no compression needed)`);
        }
      }
    } else {
      setEditPhotoFile(null);
    }
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
                  {/* Judge restrictions - only apply when judge is not in "View as User" mode */}
                  {isJudgeMode ? (
                    <div className="mb-4">
                      <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-purple-700">
                              <strong>Judge Notice:</strong> As a judge{isAssignedJudge ? ' assigned to this competition' : ''}, you cannot submit photos. 
                              {!isAssignedJudge && (
                                <span> Click "Participate as User" below if you want to submit photos to this competition.</span>
                              )}
                              {isAssignedJudge && (
                                <span> Your role is to evaluate submissions professionally.</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Judge-specific action buttons */}
                      <div className="text-center space-y-3">
                        {!isAssignedJudge && (
                          <div>
                            <Link 
                              href={`/dashboard/competitions/${competitionId}?viewAsUser=true`}
                              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold mr-3"
                            >
                              🎯 Participate as User
                            </Link>
                            <p className="text-xs text-gray-600 mt-2">
                              Switch to user mode to submit photos to this competition
                            </p>
                          </div>
                        )}
                        <div>
                          <Link 
                            href="/judge" 
                            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                          >
                            Return to Judge Dashboard
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Regular user submission interface */
                    <>
                      {/* Show indicator when judge is in "View as User" mode */}
                      {(session?.user as any)?.role === 'judge' && !isJudgeMode && (
                        <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-700">
                                <strong>👤 User Mode:</strong> You're participating as a regular user. 
                                <a href="/judge" className="underline font-semibold ml-1">Return to Judge Dashboard</a>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {userSubmissions.length < 3 ? (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Submit Your Photo</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Share your creativity with the community. You can submit up to 3 photos.
                          </p>
                          
                          {/* Show submit form */}
                          <form onSubmit={handleSubmitPhoto} className="space-y-4">
                            {/* Photo upload section */}
                            <div>
                              <label htmlFor="photoFile" className="block text-sm font-medium text-[#1a4d5c] mb-2">
                                Select Photo *
                              </label>
                              <input
                                type="file"
                                id="photoFile"
                                accept="image/*"
                                onChange={handlePhotoFileChange}
                                className="block w-full text-sm text-[#1a4d5c] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#e6f0f3] file:text-[#1a4d5c] hover:file:bg-[#d1e6ed] border border-[#e0c36a] rounded-lg"
                                disabled={isSubmitting || isCompressing}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                JPG, PNG or WebP up to 10MB
                              </p>
                              
                              {/* File size error */}
                              {fileSizeError && (
                                <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                                  ⚠️ {fileSizeError}
                                </div>
                              )}
                              
                              {/* Compression status */}
                              {showCompressionInfo && isCompressing && (
                                <div className="mt-2 flex items-center text-sm text-[#2699a6]">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#2699a6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Compressing image...
                                </div>
                              )}
                              
                              {/* Compression info */}
                              {showCompressionInfo && compressionInfo && !isCompressing && (
                                <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
                                  ✓ {compressionInfo}
                                </div>
                              )}
                            </div>

                            {/* Photo title */}
                            <div>
                              <label htmlFor="photoTitle" className="block text-sm font-medium text-[#1a4d5c] mb-2">
                                Photo Title *
                              </label>
                              <input
                                type="text"
                                id="photoTitle"
                                value={photoTitle}
                                onChange={(e) => setPhotoTitle(e.target.value)}
                                className="block w-full px-3 py-2 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c]"
                                placeholder="Enter a catchy title for your photo"
                                maxLength={100}
                                disabled={isSubmitting || isCompressing}
                              />
                              <p className="text-xs text-gray-500 mt-1">{photoTitle.length}/100 characters</p>
                            </div>

                            {/* Photo description */}
                            <div>
                              <label htmlFor="photoDescription" className="block text-sm font-medium text-[#1a4d5c] mb-2">
                                Photo Description *
                              </label>
                              <textarea
                                id="photoDescription"
                                value={photoDescription}
                                onChange={(e) => setPhotoDescription(e.target.value)}
                                rows={3}
                                className="block w-full px-3 py-2 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c]"
                                placeholder="Tell us about your photo, the story behind it, or your creative process..."
                                maxLength={500}
                                disabled={isSubmitting || isCompressing}
                              />
                              <p className="text-xs text-gray-500 mt-1">{photoDescription.length}/500 characters</p>
                            </div>

                            {/* Terms agreement */}
                            <div className="flex items-start">
                              <input
                                type="checkbox"
                                id="agreedToTerms"
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 text-[#1a4d5c] focus:ring-[#1a4d5c] border-gray-300 rounded"
                                disabled={isSubmitting || isCompressing}
                              />
                              <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-700">
                                I confirm that I have reviewed and agree to the{' '}
                                <button
                                  type="button"
                                  onClick={() => toggleSection('rules')}
                                  className="text-[#2699a6] hover:text-[#1a4d5c] underline font-medium"
                                >
                                  competition rules
                                </button>
                                {' '}and{' '}
                                <button
                                  type="button"
                                  onClick={() => toggleSection('copyright')}
                                  className="text-[#2699a6] hover:text-[#1a4d5c] underline font-medium"
                                >
                                  copyright terms
                                </button>
                                .
                              </label>
                            </div>

                            {/* Submit button */}
                            <button
                              type="submit"
                              disabled={isSubmitting || isCompressing || !photoTitle.trim() || !photoDescription.trim() || !photoFile || !agreedToTerms}
                              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] hover:from-[#2699a6] hover:to-[#1a4d5c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a4d5c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {isSubmitting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Submitting...
                                </>
                              ) : isCompressing ? (
                                'Processing Image...'
                              ) : (
                                'Submit Photo'
                              )}
                            </button>

                            {/* Submit error */}
                            {submitError && (
                              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-red-700">{submitError}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Submit success */}
                            {submitSuccess && (
                              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                                <div className="flex">
                                  <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm text-green-700">{submitSuccess}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </form>
                        </div>
                      ) : (
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">Submission Limit Reached</h3>
                          <p className="text-gray-600">You have already submitted the maximum of 3 photos for this competition.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* View All Submissions button */}
            {competition.submissionCount > 0 && (
              // Only show the button if:
              // 1. Competition is not in active status, OR
              // 2. Competition is in active status but hideOtherSubmissions is disabled, OR  
              // 3. User is an admin (admins can always view all submissions)
              !(competition.status === 'active' && competition.hideOtherSubmissions && session?.user?.role !== 'admin') && (
              <Link 
                href={`/dashboard/competitions/${competition._id}/view-submissions`}
                className="block w-full"
              >
                <button className="mt-2 w-full px-3 py-2 bg-[#fffbe6] border-2 border-[#e0c36a] rounded-lg text-[#1a4d5c] text-sm font-semibold hover:bg-[#e6f0f3]">
                  View All Submissions ({competition.submissionCount})
                </button>
              </Link>
              )
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
            
            {/* Copyright - Collapsible display */}
            <AccordionItem
              title="Copyright"
              content={competition.copyrightNotice || 'You maintain the copyrights to all photos you submit. You must own all submitted images.'}
              isExpanded={expandedSections.copyright}
              onToggle={() => toggleSection('copyright')}
            />
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
          
          {/* Edit form */}
          {editingSubmission && (
            <div className="mb-6 p-4 bg-[#fffbe6] border border-[#e0c36a] rounded-lg">
              <h3 className="font-bold text-[#1a4d5c] mb-3">Edit Submission</h3>
              
              {editError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-3 rounded-md">
                  <p className="text-red-700 text-sm">{editError}</p>
                </div>
              )}
              
              {editSuccess && (
                <div className="bg-green-50 border-l-4 border-green-400 p-2 mb-3 rounded-md">
                  <p className="text-green-700 text-sm">{editSuccess}</p>
                </div>
              )}
              
              {editFileSizeError && (
                <div className="bg-red-50 border-l-4 border-red-400 p-2 mb-3 rounded-md">
                  <p className="text-red-700 text-sm">{editFileSizeError}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column - Text fields */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="editTitle" className="block text-sm font-medium text-[#1a4d5c] mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="editTitle"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="block w-full px-3 py-2 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-sm"
                      placeholder="Enter photo title"
                      maxLength={100}
                      disabled={isUpdating || isEditCompressing}
                    />
                    <p className="text-xs text-gray-500 mt-1">{editTitle.length}/100 characters</p>
                  </div>
                  
                  <div>
                    <label htmlFor="editDescription" className="block text-sm font-medium text-[#1a4d5c] mb-1">
                      Description
                    </label>
                    <textarea
                      id="editDescription"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="block w-full px-3 py-2 border border-[#1a4d5c] rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a4d5c] focus:border-[#1a4d5c] text-[#1a4d5c] text-sm"
                      placeholder="Describe your photo (optional)"
                      maxLength={500}
                      disabled={isUpdating || isEditCompressing}
                    />
                    <p className="text-xs text-gray-500 mt-1">{editDescription.length}/500 characters</p>
                  </div>
                </div>
                
                {/* Right column - Image upload */}
                <div className="space-y-3">
                  <div>
                    <label htmlFor="editPhotoFile" className="block text-sm font-medium text-[#1a4d5c] mb-1">
                      Replace Image (Optional)
                    </label>
                    <input
                      type="file"
                      id="editPhotoFile"
                      accept="image/*"
                      onChange={handleEditPhotoFileChange}
                      className="block w-full text-sm text-[#1a4d5c] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#e6f0f3] file:text-[#1a4d5c] hover:file:bg-[#d1e6ed] border border-[#e0c36a] rounded-lg"
                      disabled={isUpdating || isEditCompressing}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or WebP up to 10MB
                    </p>
                    
                    {/* Compression status */}
                    {showCompressionInfo && isEditCompressing && (
                      <div className="mt-2 flex items-center text-sm text-[#2699a6]">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#2699a6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Compressing image...
                      </div>
                    )}
                    
                    {/* Compression info */}
                    {showCompressionInfo && editCompressionInfo && !isEditCompressing && (
                      <div className="mt-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-2">
                        ✓ {editCompressionInfo}
                      </div>
                    )}
                  </div>
                  
                  {editPhotoFile && (
                    <div className="text-sm text-[#1a4d5c] bg-blue-50 border border-blue-200 rounded-md p-2">
                      <strong>New image selected:</strong> {editPhotoFile.name}
                      <br />
                      <span className="text-xs text-gray-600">
                        Size: {(editPhotoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex items-center px-4 py-2 border-2 border-[#e0c36a] shadow-sm text-sm font-semibold rounded-lg text-[#1a4d5c] bg-[#fffbe6] hover:bg-[#e6f0f3]"
                  disabled={isUpdating || isEditCompressing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateSubmission(editingSubmission)}
                  disabled={isUpdating || isEditCompressing || !editTitle.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] hover:from-[#2699a6] hover:to-[#1a4d5c] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Updating...' : isEditCompressing ? 'Processing...' : 'Update Submission'}
                </button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-0">
            {userSubmissions.map((img) => (
              <div
                key={img._id}
                className="relative w-full aspect-[4/3] group overflow-hidden"
              >
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                  loading="lazy"
                  onClick={() => setModalImage(img._id)}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-4">
                  <div className="font-bold text-base mb-1 truncate w-full text-center">{img.title}</div>
                  <div className="text-xs w-full text-center mb-3">Uploaded: {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</div>
                  
                  {/* Always show VIEW button */}
                  <div className="flex flex-col space-y-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setModalImage(img._id)}
                      className="w-full px-3 py-2 bg-[#2699a6] hover:bg-[#1a4d5c] text-white text-sm rounded-md transition-colors font-medium"
                    >
                      VIEW
                    </button>
                    
                    {/* Edit/Delete buttons - only show when competition is active */}
                    {competition?.status === 'active' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSubmission(img)}
                          className="flex-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
                          disabled={isDeleting === img._id}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSubmission(img._id)}
                          className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors"
                          disabled={isDeleting === img._id}
                        >
                          {isDeleting === img._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Show status message when competition is not active */}
                  {competition?.status !== 'active' && (
                    <div className="text-xs text-gray-300 text-center mt-2">
                      {competition?.status === 'voting' ? 'Voting in progress - cannot edit' : 
                       competition?.status === 'completed' ? 'Competition completed' : 
                       'Competition not active'}
                    </div>
                  )}
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
                  <div className="text-sm text-gray-100 mt-2 mb-4 text-center md:text-left">{currentImg.description}</div>
                )}
                
                {/* Edit/Delete buttons in modal - only show when competition is active */}
                {competition?.status === 'active' && (
                  <div className="flex flex-col space-y-2 mt-4">
                    <button
                      onClick={() => {
                        setModalImage(null);
                        handleEditSubmission(currentImg);
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                      disabled={isDeleting === currentImg._id}
                    >
                      Edit Submission
                    </button>
                    <button
                      onClick={() => handleDeleteSubmission(currentImg._id)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                      disabled={isDeleting === currentImg._id}
                    >
                      {isDeleting === currentImg._id ? 'Deleting...' : 'Delete Submission'}
                    </button>
                  </div>
                )}
                
                {/* Show status message when competition is not active */}
                {competition?.status !== 'active' && (
                  <div className="text-xs text-gray-300 text-center md:text-left mt-4 p-2 bg-black/50 rounded">
                    {competition?.status === 'voting' ? 'Voting in progress - submissions cannot be edited' : 
                     competition?.status === 'completed' ? 'Competition completed - submissions are final' : 
                     'Competition not active - submissions cannot be edited'}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
} 