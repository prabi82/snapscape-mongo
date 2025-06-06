'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
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
  submissionFormat: string;
  copyrightNotice: string;
  status: string;
  coverImage?: string;
  hideOtherSubmissions?: boolean;
  manualStatusOverride?: boolean;
  judges?: string[];
}

interface Judge {
  _id: string;
  name: string;
  email: string;
  image?: string;
}

export default function EditCompetition() {
  const { data: session, status: sessionStatus } = useSession() as { data: ExtendedSession | null; status: string };
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
    startTime: '',
    endTime: '',
    votingEndTime: '',
    submissionLimit: 5,
    votingCriteria: '',
    submissionFormat: '',
    copyrightNotice: '',
    status: 'upcoming',
    hideOtherSubmissions: false,
    manualStatusOverride: false,
    judges: [] as string[]
  });

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  
  // Add state for judge management
  const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(false);

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

  // Extract time from ISO date string (HH:mm format)
  const extractTimeFromISO = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "HH:mm");
    } catch (error) {
      console.error('Error extracting time:', error);
      return '';
    }
  };

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
          startTime: extractTimeFromISO(data.data.startDate),
          endTime: extractTimeFromISO(data.data.endDate),
          votingEndTime: extractTimeFromISO(data.data.votingEndDate),
          submissionLimit: data.data.submissionLimit || 5,
          votingCriteria: data.data.votingCriteria || '',
          submissionFormat: data.data.submissionFormat || '',
          copyrightNotice: data.data.copyrightNotice || 'You maintain the copyrights to all photos you submit. You must own all submitted images.',
          status: data.data.status,
          hideOtherSubmissions: data.data.hideOtherSubmissions || false,
          manualStatusOverride: data.data.manualStatusOverride || false,
          judges: data.data.judges || []
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
  
  // Fetch available judges
  useEffect(() => {
    const fetchJudges = async () => {
      try {
        setLoadingJudges(true);
        const response = await fetch('/api/users?role=judge');
        if (response.ok) {
          const data = await response.json();
          setAvailableJudges(data.users || []);
        } else {
          console.error('Failed to fetch judges');
        }
      } catch (error) {
        console.error('Error fetching judges:', error);
      } finally {
        setLoadingJudges(false);
      }
    };

    if (sessionStatus === 'authenticated' && session?.user?.role === 'admin') {
      fetchJudges();
    }
  }, [sessionStatus, session]);

  // Handle judge selection
  const handleJudgeToggle = (judgeId: string) => {
    setFormData(prev => ({
      ...prev,
      judges: prev.judges.includes(judgeId)
        ? prev.judges.filter(id => id !== judgeId)
        : [...prev.judges, judgeId]
    }));
  };
  
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
  
  // Handle rich text editor changes
  const handleRichTextChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle image changes
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageValidationError(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Check original file size
      const originalSize = file.size / (1024 * 1024); // Size in MB
      console.log(`Original image size: ${originalSize.toFixed(2)} MB`);
      
      // ORIGINAL SIZE LIMIT: 10MB for initial selection
      if (file.size > 10 * 1024 * 1024) {
        setImageValidationError(`Image size must be less than 10MB (current size: ${originalSize.toFixed(2)} MB)`);
        setCoverImage(null);
        setCoverImagePreview(competition?.coverImage || null);
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
          setCoverImagePreview(competition?.coverImage || null);
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

    // Prepare dates with times in Oman timezone
    const submissionData = {
      ...formData,
      startDate: combineDateTimeOman(formData.startDate, formData.startTime),
      endDate: combineDateTimeOman(formData.endDate, formData.endTime),
      votingEndDate: combineDateTimeOman(formData.votingEndDate, formData.votingEndTime)
    };

    // Append all non-file fields from prepared submission data
    Object.entries(submissionData).forEach(([key, value]) => {
      // Skip time fields as they're already combined into date fields
      if (key === 'startTime' || key === 'endTime' || key === 'votingEndTime') return;
      // Skip file-related fields
      if (key === 'coverImage' || key === 'coverImageUrl') return;
      
      if (key === 'judges') {
        // Handle judges array specially
        (value as string[]).forEach((judgeId, index) => {
          formDataToSubmit.append(`judges[${index}]`, judgeId);
        });
      } else if (typeof value === 'boolean') {
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
              <p className="mt-1 text-xs text-gray-500">
                need the competition status to be updated automatically based on the competition dates provided
              </p>
            </div>
            
            {/* Manual Status Override */}
            <div className="sm:col-span-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="manualStatusOverride"
                    name="manualStatusOverride"
                    type="checkbox"
                    checked={!!formData.manualStatusOverride}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        manualStatusOverride: e.target.checked
                      }));
                    }}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="manualStatusOverride" className="font-medium text-gray-700">
                    Manual Status Override
                    {formData.manualStatusOverride ? ' (Enabled)' : ' (Disabled)'}
                  </label>
                  <p className="text-gray-500">
                    When enabled, the competition status will NOT be automatically updated based on dates. 
                    Use this if you need to manually control the status transitions.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Assign Judges */}
            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Assign Judges
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Option to assign multiple judges. This field is not mandatory.
              </p>
              
              {loadingJudges ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading judges...</span>
                </div>
              ) : availableJudges.length > 0 ? (
                <div className="space-y-3">
                  {/* Dropdown Interface */}
                  <div className="relative">
                    <div className="min-h-[42px] w-full border border-gray-300 rounded-md shadow-sm bg-white">
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {formData.judges.length === 0 
                              ? 'Select judges...' 
                              : `${formData.judges.length} judge${formData.judges.length !== 1 ? 's' : ''} selected`
                            }
                          </span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Dropdown Content */}
                      <div className="border-t border-gray-200 bg-gray-50 rounded-b-md">
                        <div className="max-h-60 overflow-y-auto">
                          {availableJudges.map((judge) => (
                            <div
                              key={judge._id}
                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleJudgeToggle(judge._id)}
                            >
                              <input
                                type="checkbox"
                                checked={formData.judges.includes(judge._id)}
                                onChange={() => handleJudgeToggle(judge._id)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="ml-3 flex items-center flex-1">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                                    {judge.image ? (
                                      <img
                                        src={judge.image}
                                        alt={judge.name}
                                        className="h-8 w-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-indigo-600 font-medium text-sm">
                                        {judge.name.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{judge.name}</p>
                                  <p className="text-xs text-gray-500">{judge.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Judges Summary */}
                  {formData.judges.length > 0 && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-md">
                      <p className="text-sm font-medium text-indigo-900">
                        Selected Judges:
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.judges.map((judgeId) => {
                          const judge = availableJudges.find(j => j._id === judgeId);
                          return judge ? (
                            <span
                              key={judgeId}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {judge.name}
                              <button
                                type="button"
                                onClick={() => handleJudgeToggle(judgeId)}
                                className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500"
                              >
                                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                                </svg>
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No judges available</p>
                  <p className="text-xs text-gray-400 mt-1">Create judge accounts in User Management first</p>
                </div>
              )}
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