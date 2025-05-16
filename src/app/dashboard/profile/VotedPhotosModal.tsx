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
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Photos You've Voted On</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="loader">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-blue-50 p-3 mb-4 rounded-md text-sm">
            {totalVotes === totalPhotos ? (
              <p>Displaying all {totalVotes} photos you've voted on.</p>
            ) : (
              <p>Displaying {votedPhotos.length} of {totalVotes} photos you've voted on. Some photos may no longer be available.</p>
            )}
          </div>
        )}

        {!loading && !error && votedPhotos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            You haven't voted on any photos yet.
          </div>
        )}

        {!loading && !error && votedPhotos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {votedPhotos.map((photo) => (
              <div key={photo._id} className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="relative h-48">
                  <Image
                    src={photo.thumbnailUrl}
                    alt={photo.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-sm mb-1 truncate">{photo.title}</h4>
                  
                  {photo.competition && (
                    <p className="text-xs text-gray-500 mb-2">
                      From: {photo.competition.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Your rating:</span>
                    {renderStars(photo.userRating)}
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