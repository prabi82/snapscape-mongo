'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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
    prizes: false
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
      
      // Check file size (limit: 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (photoFile.size > maxSize) {
        setFileSizeError('The selected image is above the 10MB limit. Please choose a smaller file.');
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
        
        // Check for error responses
        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          
          try {
            // Try to parse the error response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
              const errorData = await response.json();
              console.log('Error response data:', errorData);
              errorMessage = errorData.message || errorMessage;
            } else {
              // If not JSON, try to get text
              const textResponse = await response.text();
              console.log('Non-JSON error response:', textResponse);
              if (textResponse) {
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
        throw new Error(`Network error: ${errorMessage}`);
      }
    } catch (err: any) {
      console.error('Error submitting photo:', err);
      setSubmitError(err.message || 'An error occurred while submitting your photo');
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

  // Handle file input change with file size check and compression
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileSizeError('');
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setFileSizeError('Please upload a valid image file (JPG, PNG or WebP)');
        setPhotoFile(null);
        return;
      }
      
      // Check original file size
      const originalSize = file.size / (1024 * 1024); // Size in MB
      console.log(`Original image size: ${originalSize.toFixed(2)} MB`);
      
      // ORIGINAL SIZE LIMIT: 10MB for initial selection
      if (file.size > 10 * 1024 * 1024) {
        setFileSizeError(`Image size must be less than 10MB (current size: ${originalSize.toFixed(2)} MB)`);
        setPhotoFile(null);
        return;
      }
      
      // Automatically compress if file is over 5MB (Vercel's limit)
      if (file.size > 5 * 1024 * 1024) {
        try {
          // Create an image element from the file
          const img = document.createElement('img');
          const reader = new FileReader();
          
          // Wait for the image to load
          await new Promise<void>((resolve) => {
            reader.onload = (e) => {
              img.src = e.target?.result as string;
              img.onload = () => resolve();
            };
            reader.readAsDataURL(file);
          });
          
          // Create a canvas and compress the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          // Reduce dimensions if larger than 2000px on any side
          const maxDimension = 2000;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height / width) * maxDimension);
              width = maxDimension;
            } else {
              width = Math.round((width / height) * maxDimension);
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Calculate compression quality based on file size
          // Larger files need more compression
          let quality = 0.7;
          if (file.size > 8 * 1024 * 1024) {
            quality = 0.5; // More aggressive compression for very large files
          }
          
          // Convert to blob with quality reduction
          const compressedBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(
              (blob) => {
                // This should never happen, but TypeScript requires us to check
                if (!blob) {
                  resolve(new Blob([]));
                  return;
                }
                resolve(blob);
              },
              file.type,
              quality
            );
          });
          
          // Create new File from compressed blob
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          
          console.log(`Compressed image size: ${(compressedFile.size / (1024 * 1024)).toFixed(2)} MB (${Math.round((compressedFile.size / file.size) * 100)}% of original)`);
          
          // If compression wasn't enough, try one more time with more aggressive settings
          if (compressedFile.size > 5 * 1024 * 1024) {
            const canvas2 = document.createElement('canvas');
            const ctx2 = canvas2.getContext('2d');
            
            // Reduce dimensions further if still too large
            width = Math.round(width * 0.8);
            height = Math.round(height * 0.8);
            
            canvas2.width = width;
            canvas2.height = height;
            
            ctx2?.drawImage(img, 0, 0, width, height);
            
            const recompressedBlob = await new Promise<Blob>((resolve) => {
              canvas2.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve(new Blob([]));
                    return;
                  }
                  resolve(blob);
                },
                file.type,
                0.4 // Much more aggressive compression
              );
            });
            
            const recompressedFile = new File([recompressedBlob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            console.log(`Re-compressed image size: ${(recompressedFile.size / (1024 * 1024)).toFixed(2)} MB (${Math.round((recompressedFile.size / file.size) * 100)}% of original)`);
            
            // Use the recompressed file
            setPhotoFile(recompressedFile);
          } else {
            // Use the compressed file
            setPhotoFile(compressedFile);
          }
        } catch (error) {
          console.error('Error compressing image:', error);
          // If compression fails, inform the user they need a smaller image
          setFileSizeError(`Unable to compress image. Please use an image smaller than 5MB.`);
          setPhotoFile(null);
          return;
        }
      } else {
        // For smaller files, just use them as is
        setPhotoFile(file);
      }
    } else {
      setPhotoFile(null);
    }
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
                            className="mt-1 block w-full shadow-sm sm:text-sm rounded-lg border-[#e0c36a] focus:ring-[#2699a6] focus:border-[#2699a6] py-2"
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
                            className="mt-1 block w-full shadow-sm sm:text-sm rounded-lg border-[#e0c36a] focus:ring-[#2699a6] focus:border-[#2699a6] py-2"
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
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            JPG, PNG or GIF up to 10MB
                          </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowSubmitForm(false)}
                            className="inline-flex items-center px-4 py-2 border-2 border-[#e0c36a] shadow-sm text-sm font-semibold rounded-lg text-[#1a4d5c] bg-[#fffbe6] hover:bg-[#e6f0f3]"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] hover:from-[#2699a6] hover:to-[#1a4d5c] disabled:opacity-50"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Photo'}
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
            
            <ExpandableSection
              title="Description"
              content={competition.description}
              isExpanded={expandedSections.description}
              onToggle={() => toggleSection('description')}
              maxLines={3}
            />
            
            <ExpandableSection
              title="Rules & Regulations"
              content={competition.rules}
              defaultContent="Standard rules apply."
              isExpanded={expandedSections.rules}
              onToggle={() => toggleSection('rules')}
              maxLines={3}
            />
            
            <ExpandableSection
              title="Prizes"
              content={competition.prizes}
              defaultContent="No prize information is available for this competition."
              isExpanded={expandedSections.prizes}
              onToggle={() => toggleSection('prizes')}
              maxLines={2}
            />
            
            {competition.votingCriteria && (
              <div>
                <h3 className="font-bold text-[#1a4d5c] mb-1 text-base">Voting Criteria</h3>
                <div className="flex flex-wrap gap-2">
                  {competition.votingCriteria.split(',').map((criteria, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#e6f0f3] text-[#1a4d5c] border border-[#e0c36a]">
                      {criteria.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-bold text-[#1a4d5c] mb-1 text-base">Submission Format</h3>
              <div className="text-gray-700">JPEG, minimum resolution of 700px × 700px, maximum size 25MB</div>
            </div>
            <div>
              <h3 className="font-bold text-[#1a4d5c] mb-1 text-base">Copyright</h3>
              <div className="text-gray-700">You maintain the copyrights to all photos you submit. You must own all submitted images.</div>
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