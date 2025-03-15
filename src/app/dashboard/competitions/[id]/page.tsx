'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';

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
  
  // Photo submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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
    
    try {
      // Validate input
      if (!photoTitle || !photoDescription || !photoFile) {
        throw new Error('Please fill in all fields and select a photo');
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
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          href="/dashboard/competitions"
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Competitions
        </Link>
      </div>
      
      {/* Competition cover image */}
      {competition.coverImage && (
        <div className="relative w-full h-64 md:h-80 mb-6 overflow-hidden rounded-lg shadow-md">
          <Image
            src={competition.coverImage}
            alt={competition.title}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 text-white w-full">
              <h1 className="text-3xl font-bold mb-2">{competition.title}</h1>
              <p className="text-lg">Theme: {competition.theme}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Competition header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{competition.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Theme: {competition.theme}</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        
        {/* Navigation tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <a href="#details" className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
              DETAILS
            </a>
            <a href="#prizes" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
              PRIZES
            </a>
            <a href="#rules" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
              RULES
            </a>
            <a href="#rank" className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
              RANK
            </a>
          </nav>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div id="details" className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{competition.description}</p>
          </div>
          
          {/* Competition details in structured format */}
          <div className="space-y-8">
            {/* Submission Limit */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-gray-700 font-bold">4</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Submission Limit</h3>
                <p className="text-gray-600">{competition.submissionLimit || 4} photo submits per participant</p>
              </div>
            </div>
            
            {/* Submission Rules */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Submission Rules</h3>
                {competition.rules ? (
                  <div className="text-gray-600 whitespace-pre-line">{competition.rules}</div>
                ) : (
                  <div className="text-gray-600">
                    <p>Do not post:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>Non-relevant images</li>
                      <li>Similar images: Images with the same combination of subject, background, foreground and location are not allowed. Images must be distinct</li>
                      <li>Same image multiple times (cropped, angle change or tone changes)</li>
                      <li>AI images</li>
                    </ul>
                    <p className="mt-2">Images that don't comply may be removed from the challenge.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Level Requirements */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Level Requirements</h3>
                <ul className="text-gray-600 mt-2 space-y-1">
                  <li>Popular - 25 votes</li>
                  <li>Skilled - 100 votes</li>
                  <li>Premier - 300 votes</li>
                  <li>Elite - 500 votes</li>
                  <li>All Star - 1000 votes</li>
                </ul>
              </div>
            </div>
            
            {/* Submission Format */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Submission Format</h3>
                <p className="text-gray-600">JPEG, minimum resolution of 700px × 700px, maximum size 25MB</p>
              </div>
            </div>
            
            {/* Eligibility */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Eligibility</h3>
                <p className="text-gray-600">Open to all photographers ages 18 and above. Photos must not contain obscene, provocative, defamatory, sexually explicit, or otherwise objectionable or inappropriate content. Photos deemed inappropriate will be disqualified. Challenge void where prohibited.</p>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Copyright</h3>
                <p className="text-gray-600">You maintain the copyrights to all photos you submit. You must own all submitted images. If you submit images that don't belong to you, your account will be permanently removed.</p>
              </div>
            </div>
            
            {/* Voting */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Voting</h3>
                <p className="text-gray-600">Voting is done by members of the site only. The voting system uses a "blind voting" method which is designed to keep the voting as fair as possible.</p>
              </div>
            </div>
            
            {/* Participation */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Participation</h3>
                <p className="text-gray-600">By entering this challenge you accept the standard <a href="#" className="text-indigo-600 hover:text-indigo-800">Terms of Use</a>.</p>
              </div>
            </div>
          </div>
          
          <div id="prizes" className="mb-6 mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Prizes</h2>
            {competition.prizes ? (
              <p className="text-gray-600 whitespace-pre-line">{competition.prizes}</p>
            ) : (
              <p className="text-gray-600">No prize information is available for this competition.</p>
            )}
          </div>
          
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2" id="rules">Important Dates</h2>
            <div className="bg-gray-50 rounded-md p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Submission Start</p>
                <p className="text-gray-900">{formatDate(competition.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Submission End</p>
                <p className="text-gray-900">{formatDate(competition.endDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Voting End</p>
                <p className="text-gray-900">{formatDate(competition.votingEndDate)}</p>
              </div>
            </div>
          </div>
          
          {competition.votingCriteria && (
            <div className="mb-6" id="rank">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Voting Criteria</h2>
              <div className="flex flex-wrap gap-2">
                {competition.votingCriteria.split(',').map((criteria, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {criteria.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Submit photo button for active competitions */}
        {competition.status === 'active' && (
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
            <div className="text-center">
              {/* Show submission count */}
              <div className="mb-4">
                <p className="text-gray-700">
                  Your submissions: <span className="font-medium">{competition.userSubmissionsCount}</span> of <span className="font-medium">{competition.submissionLimit}</span>
                </p>
                {competition.hasSubmitted && !competition.canSubmitMore && (
                  <p className="text-red-600 font-medium mt-1">
                    You've reached the maximum number of submissions for this competition.
                  </p>
                )}
                {competition.hasSubmitted && competition.canSubmitMore && (
                  <p className="text-green-600 font-medium mt-1">
                    You can submit {competition.submissionLimit - competition.userSubmissionsCount} more photo{competition.submissionLimit - competition.userSubmissionsCount !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>

              {showSubmitForm ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Your Photo</h3>
                  
                  {submitError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-left">
                      <p className="text-red-700">{submitError}</p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitPhoto} className="max-w-md mx-auto text-left">
                    <div className="mb-4">
                      <label htmlFor="photoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                        Photo Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="photoTitle"
                        value={photoTitle}
                        onChange={(e) => setPhotoTitle(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 py-3"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="photoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="photoDescription"
                        value={photoDescription}
                        onChange={(e) => setPhotoDescription(e.target.value)}
                        rows={5}
                        className="mt-1 block w-full shadow-sm sm:text-sm rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 py-2"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="photoFile" className="block text-sm font-medium text-gray-700 mb-1">
                        Photo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        id="photoFile"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
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
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Photo'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div>
                  {submitSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                      <p className="text-green-700">{submitSuccess}</p>
                    </div>
                  )}
                  
                  {competition.canSubmitMore ? (
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
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
      </div>
      
      {/* Submissions display for voting phase */}
      {(competition.status === 'voting' || competition.status === 'completed') && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {competition.status === 'voting' ? 'Vote on Submissions' : 'Competition Submissions'}
          </h2>
          
          {submissions.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No submissions available for this competition.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <div key={submission._id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image 
                      src={submission.imageUrl} 
                      alt={submission.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900">{submission.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">By {submission.user.name}</p>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{submission.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">
                          ★
                        </span>
                        <span className="text-sm text-gray-700">
                          {submission.averageRating?.toFixed(1) || 'No ratings'} 
                          {submission.ratingsCount > 0 && ` (${submission.ratingsCount})`}
                        </span>
                      </div>
                      
                      {competition.status === 'voting' && (
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatePhoto(submission._id, star)}
                              className={`text-xl focus:outline-none ${
                                submission.userRating && submission.userRating >= star 
                                  ? 'text-yellow-500' 
                                  : 'text-gray-300 hover:text-yellow-500'
                              }`}
                              aria-label={`Rate ${star} stars`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 