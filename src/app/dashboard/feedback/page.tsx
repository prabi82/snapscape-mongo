'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { trackFeedbackView, trackFeedbackSubmission } from '@/lib/gtag';

interface FeedbackItem {
  _id: string;
  rating: number;
  feedback: string;
  category: string;
  title: string;
  isAnonymous: boolean;
  status: string;
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const { data: session, status } = useSession();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    rating: 5,
    feedback: '',
    category: 'general',
    isAnonymous: false
  });

  // Redirect if not authenticated
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    redirect('/');
  }

  useEffect(() => {
    fetchFeedback();
    trackFeedbackView();
  }, []);

  const fetchFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      const data = await response.json();
      
      if (data.success) {
        setFeedbackList(data.data);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Feedback submitted successfully!');
        setFormData({
          title: '',
          rating: 5,
          feedback: '',
          category: 'general',
          isAnonymous: false
        });
        setShowForm(false);
        fetchFeedback(); // Refresh the list
        trackFeedbackSubmission(formData.rating, formData.category);
      } else {
        alert(data.message || 'Error submitting feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteFeedback = async (feedbackId: string, title: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete the feedback "${title}"? This action cannot be undone.`);
    
    if (!confirmed) return;

    setDeletingId(feedbackId);

    try {
      const response = await fetch(`/api/feedback?id=${feedbackId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert('Feedback deleted successfully!');
        fetchFeedback(); // Refresh the list
      } else {
        alert(data.message || 'Error deleting feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Error deleting feedback');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange && onChange(star)}
            disabled={!interactive}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </button>
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h1 className="text-3xl font-bold mb-2">Feedback & App Rating</h1>
          <p className="text-blue-100">
            Help us improve SnapScape by sharing your feedback and rating your experience
          </p>
        </div>

        <div className="p-6">
          {/* New Feedback Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'Submit New Feedback'}
            </button>
          </div>

          {/* Feedback Form */}
          {showForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4">Share Your Feedback</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief summary of your feedback"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Your Experience *
                  </label>
                  {renderStars(formData.rating, true, (rating) => 
                    setFormData({ ...formData, rating })
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.rating === 5 ? 'Excellent!' : 
                     formData.rating === 4 ? 'Very Good' :
                     formData.rating === 3 ? 'Good' :
                     formData.rating === 2 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General Feedback</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="improvement">Improvement Suggestion</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback *
                  </label>
                  <textarea
                    required
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please share your detailed feedback, suggestions, or report any issues you've encountered..."
                    maxLength={2000}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.feedback.length}/2000 characters
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                    Submit anonymously (your name won't be visible to admins)
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Previous Feedback */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Previous Feedback</h2>
            
            {feedbackList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">No feedback submitted yet</p>
                <p className="text-sm">Click "Submit New Feedback" to share your first experience!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((item) => (
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
                        <div className="flex items-center gap-3 mb-2">
                          {renderStars(item.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteFeedback(item._id, item.title)}
                        disabled={deletingId === item._id}
                        className="ml-4 px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
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
                    
                    <p className="text-gray-700 mb-3">{item.feedback}</p>
                    
                    {item.adminResponse && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-3 mt-3">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-green-800">Admin Response:</span>
                          {item.adminResponseDate && (
                            <span className="text-sm text-green-600 ml-2">
                              {new Date(item.adminResponseDate).toLocaleDateString()}
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
          </div>
        </div>
      </div>
    </div>
  );
} 