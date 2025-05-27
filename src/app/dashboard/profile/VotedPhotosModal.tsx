import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface VotedPhoto {
  _id: string;
  title: string;
  thumbnailUrl: string;
  imageUrl: string;
  userRating: number;
  competition?: {
    _id: string;
    title: string;
  };
}

interface VotedPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const VotedPhotosModal: React.FC<VotedPhotosModalProps> = ({ isOpen, onClose, userId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [votedPhotos, setVotedPhotos] = useState<VotedPhoto[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [totalPhotos, setTotalPhotos] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVotedPhotos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/users/voted-photos?userId=${userId}&limit=100`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch voted photos');
        }

        const data = await response.json();
        setVotedPhotos(data.data || []);
        setTotalPhotos(data.total || 0);
        setTotalVotes(data.count || 0);
      } catch (err: any) {
        console.error('Error fetching voted photos:', err);
        setError(err.message || 'An error occurred while fetching voted photos');
      } finally {
        setLoading(false);
      }
    };

    fetchVotedPhotos();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  // Helper function to render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-4 w-4 sm:h-5 sm:w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-xs sm:text-sm text-gray-600 font-medium">({rating}/5)</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Photos You've Voted On</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 -m-2"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading your voted photos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 mb-4 rounded-lg text-sm sm:text-base">
            {totalVotes === totalPhotos ? (
              <p className="text-blue-800 font-medium">📊 Displaying all {totalVotes} photos you've voted on.</p>
            ) : (
              <p className="text-blue-800 font-medium">📊 Displaying {votedPhotos.length} of {totalVotes} photos you've voted on. Some photos may no longer be available.</p>
            )}
          </div>
        )}

        {!loading && !error && votedPhotos.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🗳️</div>
            <p className="text-gray-600 text-base sm:text-lg font-medium">You haven't voted on any photos yet.</p>
            <p className="text-gray-500 text-sm sm:text-base mt-2">Start voting on photos in active competitions to see them here!</p>
          </div>
        )}

        {!loading && !error && votedPhotos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {votedPhotos.map((photo) => (
              <div key={photo._id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48 sm:h-56">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">{photo.title}</h4>
                  
                  {photo.competition && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 font-medium">
                      📸 From: {photo.competition.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">Your rating:</span>
                    <div className="flex items-center">
                      {renderStars(photo.userRating)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotedPhotosModal; 