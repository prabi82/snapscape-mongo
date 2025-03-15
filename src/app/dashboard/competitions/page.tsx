'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import Image from 'next/image';

interface Competition {
  _id: string;
  title: string;
  theme: string;
  description: string;
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  startDate: string;
  endDate: string;
  votingEndDate: string;
  submissionCount: number;
  hasSubmitted: boolean;
  coverImage?: string;
}

export default function UserCompetitions() {
  const { data: session } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [participationFilter, setParticipationFilter] = useState<string>('all');

  // Fetch competitions
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        // Build query based on filters
        const queryParams = new URLSearchParams();
        
        if (statusFilter !== 'all') {
          queryParams.append('status', statusFilter);
        }
        
        if (participationFilter === 'participated') {
          queryParams.append('participated', 'true');
        } else if (participationFilter === 'not-participated') {
          queryParams.append('participated', 'false');
        }
        
        // Add limit to get more results than the dashboard
        queryParams.append('limit', '20');
        
        const response = await fetch(`/api/competitions?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch competitions');
        }
        const data = await response.json();
        setCompetitions(data.data || []);
      } catch (err: any) {
        console.error('Error fetching competitions:', err);
        setError(err.message || 'An error occurred while fetching competitions');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [statusFilter, participationFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'voting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Photography Competitions</h1>
        <p className="mt-1 text-gray-600">
          Showcase your photography skills and compete with other photographers.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-4">
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
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="voting">Voting</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="participation-filter" className="block text-sm font-medium text-gray-700 mb-1">
              My Participation
            </label>
            <select
              id="participation-filter"
              value={participationFilter}
              onChange={(e) => setParticipationFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">All Competitions</option>
              <option value="participated">I've Participated</option>
              <option value="not-participated">I Haven't Participated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competition Cards */}
      {competitions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No competitions found matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div key={competition._id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
              {/* Cover image */}
              <div className="relative h-40 w-full">
                <Image 
                  src={competition.coverImage || "https://placehold.co/600x400?text=No+Cover+Image"} 
                  alt={competition.title}
                  fill
                  unoptimized={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                <span
                  className={`absolute top-3 right-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}
                >
                  {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                </span>
              </div>
              
              <div className="p-6 flex-grow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{competition.title}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Theme: <span className="font-medium text-gray-700">{competition.theme}</span>
                </p>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {competition.description}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                  <div className="col-span-1">
                    <p className="font-medium text-gray-700">Starts</p>
                    <p>{formatDate(competition.startDate)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="font-medium text-gray-700">Ends</p>
                    <p>{formatDate(competition.endDate)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-700">Voting Ends</p>
                    <p>{formatDate(competition.votingEndDate)}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>
                    {competition.submissionCount} {competition.submissionCount === 1 ? 'submission' : 'submissions'}
                  </span>
                  {competition.hasSubmitted && (
                    <span className="text-green-600 font-medium">You've participated</span>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-4">
                <Link
                  href={`/dashboard/competitions/${competition._id}?submit=true`}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {competition.status === 'active' && !competition.hasSubmitted 
                    ? 'Submit Photo' 
                    : competition.status === 'voting' 
                      ? 'Vote Now' 
                      : 'View Details'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 