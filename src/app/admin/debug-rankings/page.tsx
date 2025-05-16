'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

// Define extended user type
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

// Define extended session type
interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

export default function DebugRankingsPage() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const [loading, setLoading] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [rankings, setRankings] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Fetch competitions on page load
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/competitions?status=completed');
        const data = await response.json();
        
        if (response.ok) {
          setCompetitions(data.data || []);
          
          // Check for competitionId in URL query param
          const competitionId = searchParams.get('competitionId');
          if (competitionId) {
            setSelectedCompetition(competitionId);
            await fetchRankings(competitionId);
          }
        } else {
          setError('Failed to fetch competitions');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompetitions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Fetch rankings and achievements for a specific competition
  const fetchRankings = async (competitionId: string) => {
    if (!competitionId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all submissions with their rankings
      const submissionsResponse = await fetch(`/api/submissions?competition=${competitionId}&status=approved&showAll=true&limit=100`);
      const submissionsData = await submissionsResponse.json();
      
      if (!submissionsResponse.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      // Sort submissions by rating and calculate dense ranks
      const submissions = submissionsData.data || [];
      const sortedSubmissions = [...submissions].sort((a, b) => {
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        return (b.ratingCount || 0) - (a.ratingCount || 0);
      });
      
      // Calculate dense ranking
      let currentRank = 0;
      let lastRating = Number.MAX_VALUE;
      let lastCount = Number.MAX_VALUE;
      
      const rankedSubmissions = sortedSubmissions.map(submission => {
        if (submission.averageRating !== lastRating || submission.ratingCount !== lastCount) {
          currentRank++;
          lastRating = submission.averageRating;
          lastCount = submission.ratingCount || 0;
        }
        
        return {
          ...submission,
          rank: currentRank
        };
      });
      
      setRankings(rankedSubmissions);
      
      // Fetch achievements for this competition
      const achievementsResponse = await fetch(`/api/competitions/${competitionId}/achievements`);
      
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData.data || []);
      } else {
        const achievementsData = await achievementsResponse.json();
        throw new Error(achievementsData.message || 'Failed to fetch achievements');
      }
    } catch (err: any) {
      console.error('Error fetching rankings:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle competition selection
  const handleCompetitionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const competitionId = e.target.value;
    setSelectedCompetition(competitionId);
    if (competitionId) {
      fetchRankings(competitionId);
    } else {
      setRankings([]);
      setAchievements([]);
    }
  };

  // Check if user is admin
  if (session?.user?.role !== 'admin') {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
        <p className="mb-4">You need administrator access to use this page.</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Debug Competition Rankings</h1>
      <p className="text-gray-600 mb-6">
        Check the dense ranking system and verify achievements are assigned correctly
      </p>
      
      <div className="mb-8">
        <label htmlFor="competition" className="block text-sm font-medium text-gray-700 mb-2">
          Select a Completed Competition
        </label>
        <select
          id="competition"
          value={selectedCompetition}
          onChange={handleCompetitionChange}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        >
          <option value="">-- Select a competition --</option>
          {competitions.map((comp) => (
            <option key={comp._id} value={comp._id}>
              {comp.title}
            </option>
          ))}
        </select>
      </div>
      
      {error && (
        <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : rankings.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Competition Rankings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Dense ranking system (ties get the same rank)
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Achievements
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankings.map((submission) => {
                  // Find if this submission has an achievement
                  const achievement = achievements.find(a => 
                    a.photo && a.photo._id === submission._id
                  );
                  
                  // Determine badge style based on rank
                  let rankBadge;
                  if (submission.rank === 1) {
                    rankBadge = <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-yellow-400 text-white">🥇 1st</span>;
                  } else if (submission.rank === 2) {
                    rankBadge = <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-gray-300 text-white">🥈 2nd</span>;
                  } else if (submission.rank === 3) {
                    rankBadge = <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-orange-400 text-white">🥉 3rd</span>;
                  } else {
                    rankBadge = <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">{submission.rank}th</span>;
                  }
                  
                  return (
                    <tr key={submission._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rankBadge}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            <Image
                              src={submission.thumbnailUrl || submission.imageUrl}
                              alt={submission.title}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{submission.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.user?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{submission.user?._id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm">
                          <svg className="text-yellow-400 h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{submission.averageRating?.toFixed(2) || 0}</span>
                          <span className="text-gray-500 ml-2">({submission.ratingCount || 0} votes)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {achievement ? (
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold 
                              ${achievement.position === 1 ? 'bg-yellow-400 text-white' : 
                                achievement.position === 2 ? 'bg-gray-300 text-white' : 
                                'bg-orange-400 text-white'}`}>
                              {achievement.position === 1 ? '🥇 Gold' : 
                                achievement.position === 2 ? '🥈 Silver' : 
                                '🥉 Bronze'}
                            </span>
                            {submission.rank !== achievement.position && (
                              <span className="ml-2 text-red-600 font-bold">Mismatch!</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No achievement</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedCompetition && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No submissions found for this competition.</p>
        </div>
      )}
      
      <div className="mt-8 flex space-x-4">
        <Link href="/admin">
          <button className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700">
            Back to Admin Dashboard
          </button>
        </Link>
        {selectedCompetition && (
          <Link href={`/dashboard/competitions/${selectedCompetition}/view-submissions?result=1`}>
            <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
              View Competition Results
            </button>
          </Link>
        )}
      </div>
    </div>
  );
} 