'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

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
    status: 'upcoming'
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          status: data.data.status
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle image changes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Validate that all required dates are provided
      if (!formData.startDate || !formData.endDate || !formData.votingEndDate) {
        throw new Error('All dates are required');
      }

      // Create copies of the form data with proper date handling
      const formDataWithDates = { ...formData };
      
      try {
        // Parse dates and set proper times
        const startDate = parseDateString(formData.startDate);
        startDate.setUTCHours(0, 0, 0, 0);
        formDataWithDates.startDate = startDate.toISOString();

        const endDate = parseDateString(formData.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        formDataWithDates.endDate = endDate.toISOString();

        const votingEndDate = parseDateString(formData.votingEndDate);
        votingEndDate.setUTCHours(23, 59, 59, 999);
        formDataWithDates.votingEndDate = votingEndDate.toISOString();

        // Log dates for debugging
        console.log('Parsed dates:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          votingEndDate: votingEndDate.toISOString()
        });

        // Validate date order using UTC timestamps
        if (endDate.getTime() <= startDate.getTime()) {
          throw new Error('End date must be after start date');
        }
        
        if (votingEndDate.getTime() <= endDate.getTime()) {
          throw new Error('Voting end date must be after submission end date');
        }
      } catch (dateError: any) {
        console.error('Date parsing error:', dateError);
        throw new Error(dateError.message || 'Invalid date format. Please check all dates are entered correctly.');
      }

      let response;

      // Check if we need to handle file upload
      if (coverImage) {
        const updateFormData = new FormData();
        
        // Add all form fields with the properly formatted dates
        Object.entries(formDataWithDates).forEach(([key, value]) => {
          updateFormData.append(key, value.toString());
        });
        
        // Add cover image
        updateFormData.append('coverImage', coverImage);
        
        // Submit form with image
        response = await fetch(`/api/competitions/${competitionId}/with-cover`, {
          method: 'PUT',
          body: updateFormData,
        });
      } else {
        // Submit form without image using regular JSON
        response = await fetch(`/api/competitions/${competitionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataWithDates),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update competition');
      }

      setSuccess(coverImage ? 'Competition updated successfully with new cover image!' : 'Competition updated successfully!');
      
      // Redirect after success
      setTimeout(() => {
        router.push('/admin/competitions');
      }, 1500);

    } catch (error: any) {
      console.error('Error updating competition:', error);
      setError(error.message || 'An error occurred while updating the competition');
    } finally {
      setSubmitting(false);
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
            
            {/* Cover Image */}
            <div className="sm:col-span-6">
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700">
                Cover Image
              </label>
              <div className="mt-2">
                {coverImagePreview ? (
                  <div className="relative">
                    <div className="relative h-48 w-full overflow-hidden rounded-lg border border-gray-300">
                      <Image 
                        src={coverImagePreview}
                        alt="Competition cover"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null);
                        // Only clear preview if it's not from the database
                        if (coverImagePreview !== competition?.coverImage) {
                          setCoverImagePreview(competition?.coverImage || null);
                        }
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-md hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
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
                {coverImagePreview && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Change Image
                    </button>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Recommended size: 1200x600 pixels. The cover image will be displayed at the top of the competition page.
                </p>
              </div>
            </div>
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