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

// Add a simple funnel icon component
const FunnelIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="4" x2="21" y2="4" />
    <polygon points="4 4 20 4 14 12 14 19 10 19 10 12 4 4" />
  </svg>
);

export default function UserCompetitions() {
  const { data: session } = useSession();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [participationFilter, setParticipationFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);

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
      <div className="mb-8 hidden md:block">
        <h1 className="text-3xl font-extrabold text-[#1a4d5c] tracking-tight mb-1">Photography Competitions</h1>
        <p className="text-[#2699a6] text-lg">Showcase your photography skills and compete with other photographers.</p>
      </div>

      {/* Mobile filter floating action button */}
      <button
        className="fixed bottom-20 right-4 z-50 p-2 rounded-full border-2 border-[#e0c36a] bg-white shadow-lg text-[#1a4d5c] hover:bg-[#e6f0f3] focus:outline-none focus:ring-2 focus:ring-[#e0c36a] md:hidden transition-transform duration-200 ease-in-out hover:scale-125 active:scale-125"
        style={{ boxShadow: '0 4px 16px rgba(26,77,92,0.10)' }}
        onClick={() => setShowFilterModal(true)}
        aria-label="Open filters"
      >
        <FunnelIcon className="w-4 h-4" />
      </button>

      {/* Filter Modal for mobile */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl p-6 w-11/12 max-w-xs shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowFilterModal(false)}
              aria-label="Close filters"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="mb-4">
              <label htmlFor="status-filter-mobile" className="block text-sm font-semibold text-[#1a4d5c] mb-1">Status</label>
              <select
                id="status-filter-mobile"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border-[#e0c36a] shadow-sm focus:border-[#2699a6] focus:ring-[#2699a6] text-[#1a4d5c] bg-[#e6f0f3] font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="voting">Voting</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="participation-filter-mobile" className="block text-sm font-semibold text-[#1a4d5c] mb-1">My Participation</label>
              <select
                id="participation-filter-mobile"
                value={participationFilter}
                onChange={e => setParticipationFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border-[#e0c36a] shadow-sm focus:border-[#2699a6] focus:ring-[#2699a6] text-[#1a4d5c] bg-[#e6f0f3] font-medium"
              >
                <option value="all">All Competitions</option>
                <option value="participated">I've Participated</option>
                <option value="not-participated">I Haven't Participated</option>
              </select>
            </div>
            <button
              className="mt-6 w-full py-2 rounded-lg bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition"
              onClick={() => setShowFilterModal(false)}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Filters for desktop only */}
      <div className="bg-white border-2 border-[#e0c36a] rounded-2xl p-6 mb-6 shadow-sm hidden md:block">
        <div className="flex flex-wrap gap-6">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-semibold text-[#1a4d5c] mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[#e0c36a] shadow-sm focus:border-[#2699a6] focus:ring-[#2699a6] text-[#1a4d5c] bg-[#e6f0f3] font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="voting">Voting</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label htmlFor="participation-filter" className="block text-sm font-semibold text-[#1a4d5c] mb-1">My Participation</label>
            <select
              id="participation-filter"
              value={participationFilter}
              onChange={(e) => setParticipationFilter(e.target.value)}
              className="mt-1 block w-full rounded-lg border-[#e0c36a] shadow-sm focus:border-[#2699a6] focus:ring-[#2699a6] text-[#1a4d5c] bg-[#e6f0f3] font-medium"
            >
              <option value="all">All Competitions</option>
              <option value="participated">I've Participated</option>
              <option value="not-participated">I Haven't Participated</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Competition Cards */}
      {competitions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No competitions found matching the selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {competitions.map((competition) => (
            <div key={competition._id} className="bg-white border-2 border-[#e0c36a] rounded-2xl shadow flex flex-col overflow-hidden">
              {/* Cover image */}
              <div className="relative w-full aspect-[4/3] bg-[#e6f0f3]">
                <Image 
                  src={competition.coverImage || '/default-cover.jpg'} 
                  alt={competition.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow ${competition.status === 'active' ? 'bg-green-100 text-green-800' : competition.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : competition.status === 'voting' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                >
                  {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                </span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="font-bold text-lg mb-1 text-[#1a4d5c]">{competition.title}</div>
                <div className="flex flex-row justify-between w-full text-xs text-[#1a4d5c] mb-4 items-center">
                  <div className="flex-1 flex flex-col items-center">
                    <span className="font-semibold">Starts</span>
                    <span>{formatDate(competition.startDate)}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="font-semibold">Ends</span>
                    <span>{formatDate(competition.endDate)}</span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="font-semibold">Voting Ends</span>
                    <span>{formatDate(competition.votingEndDate)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mb-4">
                  <span className="text-[#1a4d5c] font-semibold">
                    {competition.submissionCount} {competition.submissionCount === 1 ? 'submission' : 'submissions'}
                  </span>
                  {competition.hasSubmitted && (
                    <span className="text-green-600 font-medium">You've participated</span>
                  )}
                </div>
                <Link
                  href={
                    competition.status === 'completed'
                      ? `/dashboard/competitions/${competition._id}/view-submissions?result=1`
                      : `/dashboard/competitions/${competition._id}?submit=true`
                  }
                  className="w-full inline-block text-center px-4 py-2 rounded-md bg-gradient-to-r from-[#1a4d5c] to-[#2699a6] text-white font-semibold shadow hover:from-[#2699a6] hover:to-[#1a4d5c] transition mb-2"
                >
                  {competition.status === 'active' && !competition.hasSubmitted
                    ? 'Submit Photo'
                    : competition.status === 'voting'
                      ? 'Vote Now'
                      : competition.status === 'completed'
                        ? 'View Result'
                        : 'View Details'}
                </Link>
                {competition.submissionCount > 0 && (
                  <Link
                    href={`/dashboard/competitions/${competition._id}/view-submissions`}
                    className="w-full inline-block text-center px-4 py-2 rounded-md border-2 border-[#e0c36a] text-[#1a4d5c] font-semibold bg-[#fffbe6] hover:bg-[#e6f0f3] transition"
                  >
                    View Submissions
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 