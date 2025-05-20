'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface Competition {
  _id: string;
  title: string;
  theme: string;
  description: string;
  rules: string;
  prizes: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
  submissionLimit: number;
  votingCriteria: string;
  status: string;
  coverImage?: string;
  hideOtherSubmissions?: boolean;
}

export default function EditCompetition() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const competitionId = params?.id as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    theme: '',
    description: '',
    rules: '',
    prizes: '',
    startDate: '',
    endDate: '',
    votingEndDate: '',
    submissionLimit: 5,
    votingCriteria: '',
    status: 'upcoming',
    hideOtherSubmissions: false
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const [imageValidationError, setImageValidationError] = useState<string | null>(null);

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "yyyy-MM-dd");
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Add a function to parse and validate dates
  const parseDateString = (dateString: string) => {
    try {
      // Split the date string into parts
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Create a new date using UTC to avoid timezone issues
      const date = new Date(Date.UTC(year, month - 1, day));
      
      // Validate that the date is valid
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      throw new Error('Invalid date format');
    }
  };
  
  // Fetch competition data
  useEffect(() => {
    // Redirect if not admin
    if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/competitions/${competitionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch competition');
        }
        
        const data = await response.json();
        setCompetition(data.data);
        
        // Log detailed competition data for debugging
        console.log('Fetched competition data detailed:', {
          title: data.data.title,
          hideOtherSubmissions: data.data.hideOtherSubmissions,
          hideOtherSubmissionsType: typeof data.data.hideOtherSubmissions
        });
        
        // If competition has a cover image, set the preview
        if (data.data.coverImage) {
          setCoverImagePreview(data.data.coverImage);
        }
        
        // Format dates for input fields
        setFormData({
          title: data.data.title,
          theme: data.data.theme,
          description: data.data.description,
          rules: data.data.rules || '',
          prizes: data.data.prizes || '',
          startDate: formatDateForInput(data.data.startDate),
          endDate: formatDateForInput(data.data.endDate),
          votingEndDate: formatDateForInput(data.data.votingEndDate),
          submissionLimit: data.data.submissionLimit || 5,
          votingCriteria: data.data.votingCriteria || '',
          status: data.data.status,
          hideOtherSubmissions: data.data.hideOtherSubmissions || false
        });
      } catch (error: any) {
        console.error('Error fetching competition:', error);
        setError(error.message || 'Failed to load competition details');
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionStatus === 'authenticated' && competitionId) {
      fetchCompetition();
    }
  }, [competitionId, session, sessionStatus, router]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle image changes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageValidationError(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    const file = e.target.files?.[0] || null;
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setImageValidationError('Image size must be less than 10MB');
        setCoverImage(null);
        setCoverImagePreview(competition?.coverImage || null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

    } else {
      setCoverImage(null);
      setCoverImagePreview(competition?.coverImage || null);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    if (coverImagePreview && !crop) { 
      const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          4 / 3,
          width,
          height
        ),
        width,
        height
      );
      setCrop(newCrop);
    }
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Log form data and crop data for debugging
    console.log('Submitting competition edit:', {
      formData,
      coverImage,
      completedCrop,
      coverImagePreview
    });

    // Validate required fields
    if (!formData.title || !formData.theme || !formData.description || !formData.startDate || !formData.endDate || !formData.votingEndDate || !formData.status) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const formDataToSubmit = new FormData();

    // Append all non-file fields from formData state
    Object.entries(formData).forEach(([key, value]) => {
      // Always append all fields, including status
      if (key === 'coverImage' || key === 'coverImageUrl') return; // Handled separately
      if (typeof value === 'boolean') {
        formDataToSubmit.append(key, value ? 'true' : 'false');
      } else if (value !== null && value !== undefined) {
        formDataToSubmit.append(key, String(value));
      }
    });

    // Handle new cover image upload with crop parameters
    if (coverImage && completedCrop) {
      formDataToSubmit.append('coverImage', coverImage);
      formDataToSubmit.append('cropX', String(Math.round(completedCrop.x)));
      formDataToSubmit.append('cropY', String(Math.round(completedCrop.y)));
      formDataToSubmit.append('cropWidth', String(Math.round(completedCrop.width)));
      formDataToSubmit.append('cropHeight', String(Math.round(completedCrop.height)));
    } else if (coverImage && !completedCrop && coverImagePreview) {
        setError('New image selected but crop data is missing. Please ensure the crop is set.');
        setLoading(false);
        return;
    }
    
    try {
      // Add retry logic for large files
      const MAX_RETRIES = 3;
      const TIMEOUT = 60000; // 60 seconds timeout
      
      let response: Response | null = null;
      let retryCount = 0;
      let lastError: Error | null = null;
      
      while (retryCount < MAX_RETRIES && !response) {
        try {
          if (retryCount > 0) {
            console.log(`Retry attempt ${retryCount} for upload...`);
            setError(`Upload timed out. Retrying (${retryCount}/${MAX_RETRIES})...`);
          }
          
          // Create a timeout promise
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), TIMEOUT);
          });
          
          // Create the fetch promise
          const fetchPromise = fetch(`/api/competitions/${competitionId}`, {
            method: 'PUT',
            body: formDataToSubmit,
          });
          
          // Race them - whichever resolves/rejects first wins
          response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          
          // If we get here, the fetch completed before the timeout
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch (jsonErr) {
              errorData = { message: await response.text() };
            }
            console.error('Backend error:', errorData);
            throw new Error(errorData.message || 'Failed to update competition');
          }
        } catch (err: any) {
          lastError = err;
          response = null;
          retryCount++;
          
          // If it's not the last retry, continue the loop
          if (retryCount < MAX_RETRIES) {
            continue;
          }
          
          // If we're out of retries, throw the last error
          throw err;
        }
      }

      if (!response) {
        throw new Error('No response received after multiple attempts');
      }

      setSuccess(coverImage ? 'Competition updated successfully with new cover image!' : 'Competition updated successfully!');
      setTimeout(() => {
        router.push('/admin/competitions');
      }, 1500);

    } catch (error: any) {
      console.error('Error updating competition:', error);
      setError(error.message || 'An error occurred while updating the competition');
    } finally {
      setLoading(false);
    }
  };
  
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Check if user is admin
  if (sessionStatus === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">You do not have permission to access this page.</p>
        </div>
        <Link 
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Competition</h1>
        <Link
          href="/admin/competitions"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Competitions
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Title */}
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>
            
            {/* Theme */}
            <div className="sm:col-span-2">
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                Theme <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="theme"
                  id="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Rules */}
            <div className="sm:col-span-6">
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
                Rules
              </label>
              <div className="mt-1">
                <textarea
                  id="rules"
                  name="rules"
                  rows={4}
                  value={formData.rules}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Prizes */}
            <div className="sm:col-span-6">
              <label htmlFor="prizes" className="block text-sm font-medium text-gray-700">
                Prizes
              </label>
              <div className="mt-1">
                <textarea
                  id="prizes"
                  name="prizes"
                  rows={4}
                  value={formData.prizes}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            {/* Dates Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900">Important Dates</h3>
              <p className="mt-1 text-sm text-gray-500">
                All dates and times are in your local timezone.
              </p>
            </div>
            
            {/* Start Date */}
            <div className="sm:col-span-2">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>
            
            {/* End Date */}
            <div className="sm:col-span-2">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                Submission End Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>
            
            {/* Voting End Date */}
            <div className="sm:col-span-2">
              <label htmlFor="votingEndDate" className="block text-sm font-medium text-gray-700">
                Voting End Date <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="date"
                  name="votingEndDate"
                  id="votingEndDate"
                  value={formData.votingEndDate}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>
            
            {/* Additional Settings */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900">Additional Settings</h3>
            </div>
            
            {/* Hide Other Submissions Checkbox */}
            <div className="sm:col-span-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="hideOtherSubmissions"
                    name="hideOtherSubmissions"
                    type="checkbox"
                    checked={!!formData.hideOtherSubmissions}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        hideOtherSubmissions: e.target.checked
                      }));
                      console.log(`Checkbox changed to: ${e.target.checked} (${typeof e.target.checked})`);
                    }}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="hideOtherSubmissions" className="font-medium text-gray-700">
                    Disable viewing others' submissions in active status
                    {formData.hideOtherSubmissions ? ' (Enabled)' : ' (Disabled)'}
                  </label>
                  <p className="text-gray-500">When enabled, regular users will only be able to view their own submitted photos during the active phase.</p>
                </div>
              </div>
            </div>
            
            {/* Submission Limit */}
            <div className="sm:col-span-2">
              <label htmlFor="submissionLimit" className="block text-sm font-medium text-gray-700">
                Submission Limit
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="submissionLimit"
                  id="submissionLimit"
                  value={formData.submissionLimit}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Maximum photos per participant (1-10)</p>
            </div>
            
            {/* Status */}
            <div className="sm:col-span-2">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Competition Status <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="voting">Voting</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            {/* Voting Criteria */}
            <div className="sm:col-span-6">
              <label htmlFor="votingCriteria" className="block text-sm font-medium text-gray-700">
                Voting Criteria
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="votingCriteria"
                  id="votingCriteria"
                  value={formData.votingCriteria}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="e.g. Creativity, Composition, Technical Quality (comma separated)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Separate criteria with commas</p>
            </div>
            
            {/* Cover Image - REPLACEMENT START */}
            <div className="sm:col-span-6">
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
                Cover Image
              </label>
              <div className="mt-2">
                {coverImagePreview ? (
                  <div>
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={4 / 3}
                      className="w-full max-w-3xl mx-auto"
                      minWidth={100}
                      minHeight={75}
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={coverImagePreview}
                        onLoad={onImageLoad}
                        style={{ maxHeight: '70vh' }}
                      />
                    </ReactCrop>
                    <div className="flex justify-center mt-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImagePreview(competition?.coverImage || null);
                          setCrop(undefined);
                          setCompletedCrop(undefined);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="rounded-full bg-gray-300 text-gray-700 p-1 shadow-md hover:bg-gray-400 text-xs"
                        title="Remove/Reset image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                     <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-1 text-sm text-gray-500">
                        No cover image set
                      </p>
                      <input
                        id="coverImage"
                        name="coverImage"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Upload Cover Image
                      </button>
                    </div>
                  </div>
                )}
                {imageValidationError && (
                  <p className="mt-2 text-sm text-red-600">
                    {imageValidationError}
                  </p>
                )}
              </div>
            </div>
            {/* Cover Image - REPLACEMENT END */}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link
              href="/admin/competitions"
              className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 