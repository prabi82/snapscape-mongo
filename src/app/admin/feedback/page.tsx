'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface FeedbackItem {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    username?: string;
  };
  rating: number;
  feedback: string;
  category: string;
  title: string;
  isAnonymous: boolean;
  status: string;
  adminResponse?: string;
  adminResponseDate?: string;
  adminUser?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface FeedbackStats {
  totalFeedback: number;
  averageRating: number;
  newFeedback: number;
  resolvedFeedback: number;
  ratingDistribution: number[];
}

interface FeedbackData {
  feedback: FeedbackItem[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalCount: number;
  };
  stats: FeedbackStats;
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    page: 1
  });

  // Redirect if not authenticated or not admin
  if (status === 'loading') return <div>Loading...</div>;
  if (!session || (session.user as ExtendedUser)?.role !== 'admin') {
    redirect('/admin');
  }

  useEffect(() => {
    fetchFeedback();
  }, [filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      params.append('page', filters.page.toString());
      
      const response = await fetch(`/api/admin/feedback?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        alert(result.message || 'Error fetching feedback');
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      alert('Error fetching feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFeedback = async (feedbackId: string, updates: { status?: string; adminResponse?: string }) => {
    try {
      setUpdatingStatus(feedbackId);
      const response = await fetch('/api/admin/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, ...updates })
      });

      const result = await response.json();

      if (result.success) {
        fetchFeedback(); // Refresh the list
        if (selectedFeedback?._id === feedbackId) {
          setSelectedFeedback(result.data);
        }
        if (updates.adminResponse !== undefined) {
          setResponseText('');
          setSelectedFeedback(null);
        }
      } else {
        alert(result.message || 'Error updating feedback');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Error updating feedback');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteFeedback = async (feedbackId: string, title: string, userEmail: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the feedback "${title}" from ${userEmail}? This action cannot be undone.`);
    
    if (!confirmed) return;

    setDeletingId(feedbackId);

    try {
      const response = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('Feedback deleted successfully!');
        fetchFeedback(); // Refresh the list
      } else {
        alert(result.message || 'Error deleting feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Error deleting feedback');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general': return 'General';
      case 'bug': return 'Bug Report';
      case 'feature_request': return 'Feature Request';
      case 'improvement': return 'Improvement';
      case 'other': return 'Other';
      default: return category;
    }
  };

  const getRatingDistribution = (distribution: number[]) => {
    const counts = [0, 0, 0, 0, 0];
    distribution.forEach(rating => {
      if (rating >= 1 && rating <= 5) counts[rating - 1]++;
    });
    return counts;
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ratingDistribution = data?.stats ? getRatingDistribution(data.stats.ratingDistribution) : [0, 0, 0, 0, 0];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h1 className="text-3xl font-bold mb-2">Feedback Management</h1>
          <p className="text-blue-100">Review and respond to user feedback and app ratings</p>
        </div>

        {/* Statistics */}
        {data?.stats && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Total Feedback</h3>
                <p className="text-2xl font-bold text-blue-800">{data.stats.totalFeedback}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Average Rating</h3>
                <p className="text-2xl font-bold text-green-800">
                  {data.stats.averageRating ? data.stats.averageRating.toFixed(1) : '0.0'}/5
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">New Feedback</h3>
                <p className="text-2xl font-bold text-yellow-800">{data.stats.newFeedback}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Resolved</h3>
                <p className="text-2xl font-bold text-purple-800">{data.stats.resolvedFeedback}</p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Rating Distribution</h3>
              <div className="flex items-end space-x-2 h-20">
                {ratingDistribution.map((count, index) => {
                  const maxCount = Math.max(...ratingDistribution);
                  const height = maxCount > 0 ? (count / maxCount) * 64 : 0;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="bg-blue-500 w-8 transition-all duration-300"
                        style={{ height: `${height}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 mt-1">{index + 1}★</span>
                      <span className="text-xs text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg mb-6 p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature_request">Feature Request</option>
              <option value="improvement">Improvement</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Feedback Submissions</h2>
          
          {!data?.feedback || data.feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No feedback found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.feedback.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          {renderStars(item.rating)}
                        </div>
                        <span>
                          {item.isAnonymous ? 'Anonymous User' : (item.user.name || item.user.email)}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => updateFeedback(item._id, { status: e.target.value })}
                        disabled={updatingStatus === item._id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                      >
                        Respond
                      </button>
                      <button
                        onClick={() => deleteFeedback(item._id, item.title, item.user.email)}
                        disabled={deletingId === item._id}
                        className="text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded transition-colors flex items-center gap-1"
                        title="Delete feedback"
                      >
                        {deletingId === item._id ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{item.feedback}</p>
                  
                  {item.adminResponse && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-3">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-green-800">Admin Response:</span>
                        {item.adminUser && (
                          <span className="text-sm text-green-600 ml-2">
                            by {item.adminUser.name}
                          </span>
                        )}
                        {item.adminResponseDate && (
                          <span className="text-sm text-green-600 ml-2">
                            on {new Date(item.adminResponseDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-green-700">{item.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.total > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {filters.page > 1 && (
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                <span className="px-3 py-2 bg-blue-600 text-white rounded-lg">
                  Page {data.pagination.current} of {data.pagination.total}
                </span>
                {filters.page < data.pagination.total && (
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Respond to Feedback</h3>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">{selectedFeedback.title}</h4>
                <div className="flex items-center gap-3 mb-2">
                  {renderStars(selectedFeedback.rating)}
                  <span className="text-sm text-gray-600">
                    by {selectedFeedback.isAnonymous ? 'Anonymous User' : selectedFeedback.user.name}
                  </span>
                </div>
                <p className="text-gray-700">{selectedFeedback.feedback}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your response to the user..."
                  maxLength={1000}
                />
                <p className="text-sm text-gray-500 mt-1">{responseText.length}/1000 characters</p>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => updateFeedback(selectedFeedback._id, { adminResponse: responseText })}
                  disabled={!responseText.trim() || updatingStatus === selectedFeedback._id}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {updatingStatus === selectedFeedback._id ? 'Sending...' : 'Send Response'}
                </button>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 