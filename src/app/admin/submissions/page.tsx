'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

interface PhotoSubmission {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  competition: {
    _id: string;
    title: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function SubmissionsManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'all'
  );
  const [competitions, setCompetitions] = useState<Array<{ _id: string; title: string }>>([]);
  const [competitionFilter, setCompetitionFilter] = useState<string>(
    searchParams.get('competition') || 'all'
  );

  // Fetch submissions and competitions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch submissions
        const submissionsRes = await fetch('/api/photo-submissions');
        if (!submissionsRes.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const submissionsData = await submissionsRes.json();
        
        // Fetch competitions for filter
        const competitionsRes = await fetch('/api/competitions');
        if (!competitionsRes.ok) {
          throw new Error('Failed to fetch competitions');
        }
        const competitionsData = await competitionsRes.json();
        
        setSubmissions(submissionsData.data || []);
        setCompetitions(competitionsData.data || []);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters
  const filteredSubmissions = submissions.filter((sub) => {
    // Filter by status
    if (statusFilter !== 'all' && sub.status !== statusFilter) {
      return false;
    }
    
    // Filter by competition
    if (competitionFilter !== 'all' && sub.competition._id !== competitionFilter) {
      return false;
    }
    
    return true;
  });

  // Handle approve/reject submission
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/photo-submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${status} submission`);
      }

      // Update submission in the state
      setSubmissions(
        submissions.map((sub) =>
          sub._id === id ? { ...sub, status } : sub
        )
      );
    } catch (err: any) {
      console.error(`Error updating submission status:`, err);
      alert(err.message || `An error occurred while updating the submission status`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Photo Submissions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and moderate photo submissions from users.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
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
          
          <div>
            <label htmlFor="competition-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Competition
            </label>
            <select
              id="competition-filter"
              value={competitionFilter}
              onChange={(e) => setCompetitionFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Competitions</option>
              {competitions.map((comp) => (
                <option key={comp._id} value={comp._id}>
                  {comp.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-grow">
            <button
              onClick={() => {
                setStatusFilter('all');
                setCompetitionFilter('all');
              }}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No submissions found matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <div key={submission._id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={submission.thumbnailUrl || submission.imageUrl}
                  alt={submission.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : submission.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{submission.title}</h3>
                  <p className="text-sm text-gray-500 mb-1">
                    By {submission.user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    For: {submission.competition.title}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {submission.description}
                </p>
                
                <div className="flex space-x-2">
                  <Link
                    href={`/admin/submissions/${submission._id}`}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg
                      className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    View
                  </Link>
                  
                  {submission.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(submission._id, 'approved')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Approve
                      </button>
                      
                      <button
                        onClick={() => handleUpdateStatus(submission._id, 'rejected')}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg
                          className="-ml-1 mr-2 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Reject
                      </button>
                    </>
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