'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
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
  status: 'upcoming' | 'active' | 'voting' | 'completed';
  submissionCount: number;
  coverImage?: string;
}

export default function ViewCompetition() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const router = useRouter();
  const competitionId = params?.id as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch competition data
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/competitions/${competitionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch competition');
        }
        
        const data = await response.json();
        setCompetition(data.data);
      } catch (error: any) {
        console.error('Error fetching competition:', error);
        setError(error.message || 'Failed to load competition details');
      } finally {
        setLoading(false);
      }
    };
    
    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <Link
          href="/admin/competitions"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Competitions
        </Link>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">Competition not found</p>
        </div>
        <Link
          href="/admin/competitions"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Competitions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Competition Details</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/competitions"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Competitions
          </Link>
          <Link
            href={`/admin/competitions/${competition._id}/submissions`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            View Submissions
          </Link>
          <Link
            href={`/admin/competitions/${competition._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Edit Competition
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {competition.coverImage ? (
          <div className="relative h-80 w-full">
            <Image
              src={competition.coverImage}
              alt={competition.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              unoptimized={true}
            />
          </div>
        ) : (
          <div className="h-80 w-full bg-gray-100 flex items-center justify-center">
            <svg className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{competition.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(competition.status)}`}>
                  {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {competition.theme}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {competition.submissionCount || 0} submissions
                </span>
              </div>
            </div>
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

        <div className="px-4 py-5 sm:px-6">
          <div id="details" className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{competition.description}</p>
          </div>
          
          {/* Competition details in structured format */}
          <div className="space-y-8">
            {/* Submission Limit */}
            <div className="border-b pb-4 flex">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-gray-700 font-bold">{competition.submissionLimit || 4}</span>
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
                <h3 className="font-medium text-gray-900" id="rules">Submission Rules</h3>
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
                <h3 className="font-medium text-gray-900" id="rank">Level Requirements</h3>
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
            <h2 className="text-lg font-medium text-gray-900 mb-2">Important Dates</h2>
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
            <div className="mb-6">
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
      </div>
    </div>
  );
} 