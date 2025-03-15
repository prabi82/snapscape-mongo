'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

interface Competition {
  _id: string;
  title: string;
  theme: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
}

interface Submission {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  competition: Competition;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
}

export default function CompetitionSubmissions() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const competitionId = params?.id as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [photoSubmissions, setPhotoSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Fetch competition details
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const response = await fetch(`/api/competitions/${competitionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch competition details');
        }
        const data = await response.json();
        setCompetition(data.data);
      } catch (err: any) {
        console.error('Error fetching competition:', err);
        setError(err.message || 'Failed to load competition details');
      }
    };
    
    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);
  
  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        
        // Fetch PhotoSubmission model data
        const submissionsResponse = await fetch(`/api/submissions?competition=${competitionId}&showAll=true${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
        
        if (!submissionsResponse.ok) {
          throw new Error('Failed to fetch submissions');
        }
        
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData.data || []);
        
        // Fetch Photo model data using our new API endpoint
        try {
          const photosResponse = await fetch(`/api/photos?competition=${competitionId}`);
          
          if (photosResponse.ok) {
            const photosData = await photosResponse.json();
            setPhotoSubmissions(photosData.data || []);
          } else {
            console.warn('Could not fetch photos, continuing with PhotoSubmission data only');
            setPhotoSubmissions([]);
          }
        } catch (photoErr) {
          console.warn('Error fetching photos:', photoErr);
          setPhotoSubmissions([]);
        }
        
      } catch (err: any) {
        console.error('Error fetching submissions:', err);
        setError(err.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };
    
    if (competitionId) {
      fetchSubmissions();
    }
  }, [competitionId, statusFilter]);
  
  // Handle status update
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this submission?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update submission status');
      }
      
      // Update the submission in the list
      setSubmissions(submissions.map(sub => 
        sub._id === id ? { ...sub, status } : sub
      ));
      
      // Also check in photo submissions
      setPhotoSubmissions(photoSubmissions.map(sub => 
        sub._id === id ? { ...sub, status } : sub
      ));
      
    } catch (err: any) {
      console.error('Error updating submission status:', err);
      alert(err.message || 'Failed to update submission status');
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // All submissions (combine both arrays)
  const allSubmissions = [...submissions, ...photoSubmissions];
  
  // Filter submissions by status if needed
  const filteredSubmissions = statusFilter === 'all'
    ? allSubmissions
    : allSubmissions.filter(sub => sub.status === statusFilter);
  
  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Competition Submissions</h1>
          {competition && (
            <p className="mt-1 text-sm text-gray-500">
              Submissions for <span className="font-medium">{competition.title}</span>
            </p>
          )}
        </div>
        <div>
          <Link
            href={`/admin/competitions/${competitionId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Competition
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="sm:ml-4">
            <p className="block text-sm font-medium text-gray-700 mb-1">
              Total Submissions: <span className="font-bold">{allSubmissions.length}</span>
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending: {allSubmissions.filter(sub => sub.status === 'pending').length}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Approved: {allSubmissions.filter(sub => sub.status === 'approved').length}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Rejected: {allSubmissions.filter(sub => sub.status === 'rejected').length}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Submissions list */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No submissions found for this competition.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <div key={submission._id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Image preview */}
              <div className="relative h-48 w-full">
                <Image
                  src={submission.imageUrl}
                  alt={submission.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  unoptimized={true}
                />
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(submission.status)}`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-1">{submission.title}</h3>
                
                {submission.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{submission.description}</p>
                )}
                
                <div className="mb-3">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Submitted by:</span> {submission.user?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Submitted on:</span> {formatDate(submission.createdAt)}
                  </p>
                  {submission.averageRating > 0 && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Rating:</span> {submission.averageRating.toFixed(1)} ({submission.ratingCount} votes)
                    </p>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <a
                    href={submission.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View Full Size
                  </a>
                  
                  {submission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(submission._id, 'approved')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(submission._id, 'rejected')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {submission.status === 'approved' && (
                    <button
                      onClick={() => handleUpdateStatus(submission._id, 'rejected')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                  
                  {submission.status === 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(submission._id, 'approved')}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 