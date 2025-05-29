'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import RichTextEditor from '@/components/RichTextEditor';

interface ExtendedSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    id?: string;
  };
  expires: string;
}

interface CompetitionFormData {
  title: string;
  description: string;
  theme: string;
  rules: string;
  prizes: string;
  startDate: string;
  endDate: string;
  votingEndDate: string;
  startTime: string;
  endTime: string;
  votingEndTime: string;
  submissionLimit: number;
  votingCriteria: string;
  submissionFormat: string;
  copyrightNotice: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
}

export default function CreateCompetition() {
  const { data: session, status } = useSession() as { data: ExtendedSession | null; status: string };
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form data with default values
  const [formData, setFormData] = useState<CompetitionFormData>({
    title: '',
    description: '',
    theme: '',
    rules: '',
    prizes: '',
    startDate: '',
    endDate: '',
    votingEndDate: '',
    startTime: '',
    endTime: '',
    votingEndTime: '',
    submissionLimit: 5,
    votingCriteria: 'composition,creativity,technical',
    submissionFormat: '',
    copyrightNotice: 'You maintain the copyrights to all photos you submit. You must own all submitted images.',
    status: 'upcoming',
  });

  // Add coverImage to the form state and file handling capability
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null); // Ref for the image element in the cropper

  // Add new state for react-image-crop
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Add a new state for image upload validation
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);

  // Check if user is authenticated and admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  // Helper function to combine date and time and convert to Oman timezone (GMT+4)
  const combineDateTimeOman = (dateString: string, timeString: string): string => {
    if (!dateString) return '';
    
    try {
      // If no time is provided, default to midnight (00:00)
      const time = timeString || '00:00';
      
      // Combine date and time
      const dateTimeString = `${dateString}T${time}:00`;
      
      // Create date object (this will be in local timezone)
      const localDate = new Date(dateTimeString);
      
      // Check if the date is valid
      if (isNaN(localDate.getTime())) {
        console.error('Invalid date created:', dateString, timeString);
        return '';
      }
      
      // Convert to Oman timezone (GMT+4)
      // We need to adjust for the difference between local timezone and Oman timezone
      const omanOffset = 4 * 60; // Oman is GMT+4 (240 minutes)
      const localOffset = localDate.getTimezoneOffset(); // Local timezone offset in minutes (negative for positive timezones)
      
      // Calculate the difference and adjust
      const offsetDifference = omanOffset + localOffset; // Total offset to apply
      const omanDate = new Date(localDate.getTime() - (offsetDifference * 60 * 1000));
      
      console.log(`Date: ${dateString}, Time: ${time}, Local: ${localDate.toISOString()}, Oman: ${omanDate.toISOString()}`);
      return omanDate.toISOString();
    } catch (err) {
      console.error('Error formatting date:', err, dateString, timeString);
      return '';
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert to number for submission limit
    if (name === 'submissionLimit') {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Handle rich text editor changes
  const handleRichTextChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update the handleImageChange function to validate image file
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageValidationError(null);
    setCrop(undefined); // Clear previous crop
    setCompletedCrop(undefined); // Clear previous completed crop
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setImageValidationError('Please upload a valid image file (JPG, PNG or WebP)');
        setCoverImage(null);
        setCoverImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      
      // Check original file size
      const originalSize = file.size / (1024 * 1024); // Size in MB
      console.log(`Original image size: ${originalSize.toFixed(2)} MB`);
      
      // ORIGINAL SIZE LIMIT: 10MB for initial selection
      if (file.size > 10 * 1024 * 1024) {
        setImageValidationError(`Image size must be less than 10MB (current size: ${originalSize.toFixed(2)} MB)`);
        setCoverImage(null);
        setCoverImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            setCoverImage(recompressedFile);
            
            // Create a preview
            const reader2 = new FileReader();
            reader2.onloadend = () => {
              setCoverImagePreview(reader2.result as string);
            };
            reader2.readAsDataURL(recompressedFile);
          } else {
            // Use the compressed file
            setCoverImage(compressedFile);
            
            // Create a preview
            const reader2 = new FileReader();
            reader2.onloadend = () => {
              setCoverImagePreview(reader2.result as string);
            };
            reader2.readAsDataURL(compressedFile);
          }
          
        } catch (error) {
          console.error('Error compressing image:', error);
          // If compression fails, inform the user they need a smaller image
          setImageValidationError(`Unable to compress image. Please use an image smaller than 5MB.`);
          setCoverImage(null);
          setCoverImagePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      } else {
        // For smaller files, just use them as is
        setCoverImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
      
    } else {
      setCoverImage(null);
      setCoverImagePreview(null);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Initial crop width percentage
        },
        4 / 3, // Aspect ratio
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    setImageValidationError(null);

    if (!session?.user?.id) {
      setError('User session not found. Please log in again.');
      setLoading(false);
      return;
    }

    const formDataToSubmit = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof Date) {
        formDataToSubmit.append(key, value.toISOString());
      } else if (typeof value === 'boolean') {
        formDataToSubmit.append(key, value.toString());
      } else if (value !== null && value !== undefined) {
        formDataToSubmit.append(key, value as string); // Ensure value is string or Blob
      }
    });

    if (coverImage && completedCrop) {
      formDataToSubmit.append('coverImage', coverImage);
      // Add crop parameters
      formDataToSubmit.append('cropX', String(Math.round(completedCrop.x)));
      formDataToSubmit.append('cropY', String(Math.round(completedCrop.y)));
      formDataToSubmit.append('cropWidth', String(Math.round(completedCrop.width)));
      formDataToSubmit.append('cropHeight', String(Math.round(completedCrop.height)));
    } else if (coverImage && !completedCrop) {
      // If there's an image but no crop (e.g. user didn't interact with cropper)
      // We might want to send the original image or prevent submission
      // For now, let's assume a crop is always made if an image is present.
      // Or, we can send default crop (e.g. full image, but that might not respect 4:3)
      // This case should ideally be handled by onImageLoad setting an initial completedCrop.
      setError('Image selected but crop data is missing. Please adjust the crop area.');
      setLoading(false);
      return;
    }

    try {
      // Validate form data
      if (!formData.title || !formData.description || !formData.theme || !formData.startDate || !formData.endDate || !formData.votingEndDate) {
        throw new Error('Please fill in all required fields');
      }

      console.log('Original form data:', formData);

      // Prepare the form data with end-of-day times
      const submissionData = {
        ...formData,
        startDate: combineDateTimeOman(formData.startDate, formData.startTime),
        endDate: combineDateTimeOman(formData.endDate, formData.endTime),
        votingEndDate: combineDateTimeOman(formData.votingEndDate, formData.votingEndTime)
      };

      console.log('Submission data with formatted dates:', submissionData);

      // Check for missing required fields
      if (!submissionData.startDate || !submissionData.endDate || !submissionData.votingEndDate) {
        throw new Error('One or more dates are invalid. Please check the date formats.');
      }

      // Check date logic
      const startDate = new Date(submissionData.startDate);
      const endDate = new Date(submissionData.endDate);
      const votingEndDate = new Date(submissionData.votingEndDate);

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      if (votingEndDate <= endDate) {
        throw new Error('Voting end date must be after submission end date');
      }

      // Submit form with image
      console.log('Submitting with cover image:', coverImage?.name, coverImage?.size, coverImage?.type);
      
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
          const fetchPromise = fetch('/api/competitions/with-cover', {
            method: 'POST',
            body: formDataToSubmit,
          });
          
          // Race them - whichever resolves/rejects first wins
          response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
          
          // If we get here, the fetch completed before the timeout
          if (!response.ok) {
            let errorMessage = 'Failed to create competition';
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              console.error('Could not parse error response', e);
            }
            throw new Error(errorMessage);
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

      // Parse the response to verify success
      if (!response) {
        throw new Error('No response received after multiple attempts');
      }
      
      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to create competition');
      }

      // Verify the competition has a coverImage if one was uploaded
      if (coverImage && !responseData.data?.coverImage) {
        console.warn('Cover image was not saved properly in the server response');
      }

      // Handle success
      setSuccessMessage(coverImage ? 'Competition created successfully with cover image!' : 'Competition created successfully');
      
      // Clear form
      setFormData({
        title: '',
        description: '',
        theme: '',
        rules: '',
        prizes: '',
        startDate: '',
        endDate: '',
        votingEndDate: '',
        startTime: '',
        endTime: '',
        votingEndTime: '',
        submissionLimit: 5,
        votingCriteria: 'composition,creativity,technical',
        submissionFormat: '',
        copyrightNotice: 'You maintain the copyrights to all photos you submit. You must own all submitted images.',
        status: 'upcoming',
      });

      // Clear cover image
      setCoverImage(null);
      setCoverImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Redirect to competitions management after a short delay
      setTimeout(() => {
        router.push('/admin/competitions');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating competition:', err);
      setError(err.message || 'An error occurred while creating the competition');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Competition</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up a new photography competition for SnapScape users.
          </p>
        </div>
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

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-green-700">{successMessage}</p>
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
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => handleRichTextChange('description', value)}
                />
              </div>
            </div>

            {/* Rules */}
            <div className="sm:col-span-6">
              <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
                Rules
              </label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.rules}
                  onChange={(value) => handleRichTextChange('rules', value)}
                />
              </div>
            </div>

            {/* Prizes */}
            <div className="sm:col-span-6">
              <label htmlFor="prizes" className="block text-sm font-medium text-gray-700">
                Prizes
              </label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.prizes}
                  onChange={(value) => handleRichTextChange('prizes', value)}
                />
              </div>
            </div>

            {/* Dates Section */}
            <div className="sm:col-span-6">
              <h3 className="text-lg font-medium text-gray-900">Important Dates & Times</h3>
              <p className="mt-1 text-sm text-gray-500">
                All times are in Oman Standard Time (GMT+4). If no time is specified, it defaults to midnight (12:00 AM).
              </p>
            </div>

            {/* Start Date & Time */}
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
            
            <div className="sm:col-span-1">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time (Oman)
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="startTime"
                  id="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>

            {/* End Date & Time */}
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
            
            <div className="sm:col-span-1">
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time (Oman)
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="endTime"
                  id="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-3"
                />
              </div>
            </div>

            {/* Voting End Date & Time */}
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
            
            <div className="sm:col-span-1">
              <label htmlFor="votingEndTime" className="block text-sm font-medium text-gray-700">
                Voting End Time (Oman)
              </label>
              <div className="mt-1">
                <input
                  type="time"
                  name="votingEndTime"
                  id="votingEndTime"
                  value={formData.votingEndTime}
                  onChange={handleChange}
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

            {/* Submission Format */}
            <div className="sm:col-span-6">
              <label htmlFor="submissionFormat" className="block text-sm font-medium text-gray-700">
                Submission Format
              </label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.submissionFormat}
                  onChange={(value) => handleRichTextChange('submissionFormat', value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Specify the requirements for photo submissions (format, resolution, file size, etc.)</p>
            </div>

            {/* Copyright Notice */}
            <div className="sm:col-span-6">
              <label htmlFor="copyrightNotice" className="block text-sm font-medium text-gray-700">
                Copyright Notice
              </label>
              <div className="mt-1">
                <RichTextEditor
                  value={formData.copyrightNotice}
                  onChange={(value) => handleRichTextChange('copyrightNotice', value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Copyright information displayed to users when submitting photos</p>
            </div>

            {/* Cover Image */}
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
                      className="w-full max-w-3xl mx-auto" // Added max-width and centering
                      minWidth={100} // Example: min crop width in pixels
                      minHeight={75}  // Example: min crop height in pixels
                    >
                      <img
                        ref={imgRef}
                        alt="Crop preview"
                        src={coverImagePreview}
                        onLoad={onImageLoad}
                        style={{ maxHeight: '70vh' }} // Limit image display height
                      />
                    </ReactCrop>
                    <div className="flex justify-center mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCoverImage(null);
                          setCoverImagePreview(null);
                          setCrop(undefined);
                          setCompletedCrop(undefined);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="rounded-full bg-red-500 text-white p-1 shadow-md hover:bg-red-600 text-xs"
                        title="Remove image"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
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
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 