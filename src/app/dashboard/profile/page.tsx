'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import React from 'react';

// Custom image fallback for user uploads
function ImageWithFallback({ src, alt, ...props }: any) {
  const [imgSrc, setImgSrc] = useState(src);
  const fallbackSrc = "https://placehold.co/600x400?text=No+Image+Available";
  return (
    <Image
      {...props}
      src={imgSrc || fallbackSrc}
      alt={alt}
      onError={() => setImgSrc(fallbackSrc)}
      unoptimized={true}
    />
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [badges, setBadges] = useState([]);
  const [userImages, setUserImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState('');
  const [modalImageId, setModalImageId] = useState<string | null>(null);
  const [showManagePopup, setShowManagePopup] = useState(false);
  const [archivedImages, setArchivedImages] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [achievements, setAchievements] = useState<any>(null);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [allImagesForCompetition, setAllImagesForCompetition] = useState<Record<string, any[]>>({});
  
  // Use modalImageId as the state, always derive the current image object from userImages
  const currentModalIndex = modalImageId ? userImages.findIndex(img => img._id === modalImageId) : -1;
  const currentModalImage = currentModalIndex >= 0 ? userImages[currentModalIndex] : null;

  // Handler to go to next/previous image
  const showNextImage = useCallback(() => {
    if (currentModalIndex >= 0 && currentModalIndex < userImages.length - 1) {
      setModalImageId(userImages[currentModalIndex + 1]._id);
    }
  }, [currentModalIndex, userImages]);
  const showPrevImage = useCallback(() => {
    if (currentModalIndex > 0) {
      setModalImageId(userImages[currentModalIndex - 1]._id);
    }
  }, [currentModalIndex, userImages]);

  // Listen for wheel and arrow key events when modal is open
  useEffect(() => {
    if (!modalImageId) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) showNextImage();
      else if (e.deltaY < 0) showPrevImage();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') showPrevImage();
      if (e.key === 'Escape') setModalImageId(null);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImageId, showNextImage, showPrevImage]);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    // Set initial form values
    if (session?.user) {
      setName(session.user.name);
      setEmail(session.user.email);
      
      // Fetch user badges and achievements
      fetchUserBadges();
      fetchUserImages();
      fetchAchievements();
    }
  }, [session, status, router]);
  
  const fetchUserBadges = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/badges?user=${session.user.id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBadges(data.data);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };
  
  const fetchUserImages = async () => {
    if (!session?.user?.id) return;
    setImagesLoading(true);
    setImagesError('');
    try {
      console.log('Fetching main images...');
      const response = await fetch(`/api/user/submissions?user=${session.user.id}&archived=false&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch user images');
      const data = await response.json();
      console.log('Main images fetched:', data.data?.length || 0);
      setUserImages(data.data || []);
    } catch (err: any) {
      console.error('Error fetching main images:', err);
      setImagesError(err.message || 'An error occurred while fetching your images');
    } finally {
      setImagesLoading(false);
    }
  };
  
  const fetchArchivedImages = async () => {
    if (!session?.user?.id) return;
    setImagesLoading(true);
    setImagesError('');
    try {
      console.log('Fetching archived images...');
      const response = await fetch(`/api/user/submissions?user=${session.user.id}&archived=true&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch archived images');
      const data = await response.json();
      console.log('Archived images fetched:', data.data?.length || 0);
      setArchivedImages(data.data || []);
    } catch (err: any) {
      console.error('Error fetching archived images:', err);
      setImagesError(err.message || 'An error occurred while fetching your archived images');
    } finally {
      setImagesLoading(false);
    }
  };
  
  const fetchAchievements = async () => {
    if (!session?.user?.id) return;
    
    setAchievementsLoading(true);
    try {
      const response = await fetch(`/api/users/achievements?userId=${session.user.id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAchievements(data.data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setAchievementsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) return;
    
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'An error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Archive image handler
  const handleArchiveImage = async (imgId: string) => {
    const img = userImages.find(img => img._id === imgId) || archivedImages.find(img => img._id === imgId);
    if (!img) {
      setMessage({ type: 'error', text: 'Image not found.' });
      return;
    }
    // For testing, always archive
    const archiveValue = true;
    console.log(`Sending archive request for image ${imgId}:`, { archived: archiveValue });
    if (!window.confirm('Are you sure you want to archive this image?')) return;
    try {
      const response = await fetch(`/api/user/submissions/${imgId}/archive`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: archiveValue }),
      });
      const data = await response.json();
      console.log('Archive response:', data);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to archive image');
      }
      setShowManagePopup(false);
      setModalImageId(null);
      setMessage({ type: 'success', text: data.message || 'Image archived successfully' });
      console.log('Refreshing image lists...');
      await Promise.all([
        fetchUserImages().then(() => console.log('Main images refreshed')),
        fetchArchivedImages().then(() => console.log('Archived images refreshed'))
      ]);
    } catch (err: any) {
      console.error('Error archiving image:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to archive image' });
    }
  };
  
  // Delete image handler
  const handleDeleteImage = async (imgId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this image? This cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/user/submissions/${imgId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete image');
      }
      
      setShowManagePopup(false);
      setModalImageId(null);
      
      // Refresh both lists
      await Promise.all([fetchUserImages(), fetchArchivedImages()]);
      
      // Show success message
      setMessage({ type: 'success', text: 'Image deleted successfully' });
    } catch (err: any) {
      console.error('Error deleting image:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to delete image' });
    }
  };
  
  // Add a ref for the images grid and a highlight state
  const imagesGridRef = React.useRef<HTMLDivElement>(null);
  const [highlightedImageId, setHighlightedImageId] = useState<string | null>(null);

  // Helper to scroll to and highlight the first image for a given place
  const scrollToAchievementImage = (place: 1 | 2 | 3) => {
    if (!achievements || !achievements.achievements) return;
    // Find the first achievement with the given place
    for (const comp of achievements.achievements) {
      const found = comp.achievements.find((a: any) => a.position === place);
      if (found) {
        // Find the corresponding image in userImages
        const img = userImages.find(img => img.averageRating === found.rating && img.competition && img.competition.title === comp.competitionTitle);
        if (img && imagesGridRef.current) {
          const imgElem = imagesGridRef.current.querySelector(`[data-img-id='${img._id}']`);
          if (imgElem) {
            imgElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedImageId(img._id);
            setTimeout(() => setHighlightedImageId(null), 2000);
          }
        }
        break;
      }
    }
  };

  // Effect to fetch all images for the currently selected competition in the modal
  useEffect(() => {
    if (currentModalImage && currentModalImage.competition && !allImagesForCompetition[currentModalImage.competition._id]) {
      const fetchAllCompImages = async () => {
        try {
          const res = await fetch(`/api/submissions?competition=${currentModalImage.competition._id}&status=approved&showAll=true&limit=1000`);
          if (res.ok) {
            const data = await res.json();
            setAllImagesForCompetition(prev => ({ ...prev, [currentModalImage.competition._id]: data.data || [] }));
          }
        } catch (err) {
          console.error("Error fetching all images for competition rank:", err);
        }
      };
      fetchAllCompImages();
    }
  }, [currentModalImage, allImagesForCompetition]);

  if (status === 'loading') {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#e6f0f3] py-10 px-2 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Compact Instagram-style profile header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 bg-white rounded-2xl shadow p-6 border-2 border-[#e0c36a]">
          {/* Profile picture */}
          <div className="flex-shrink-0 w-28 h-28 rounded-full overflow-hidden border-2 border-[#e0c36a] bg-gray-100">
            <ImageWithFallback
              src={session?.user?.image || 'https://placehold.co/200x200?text=No+Image'}
              alt={session?.user?.name || 'Profile photo'}
              width={112}
              height={112}
              className="object-cover w-full h-full"
            />
          </div>
          {/* Profile info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-[#1a4d5c]">{session?.user?.username || session?.user?.name || 'Username'}</span>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button className="px-4 py-1 bg-[#e6f0f3] text-[#1a4d5c] font-semibold rounded-lg border border-[#e0c36a] hover:bg-[#d1e6ed] transition text-sm">Edit profile</button>
                <button className="px-4 py-1 bg-[#e6f0f3] text-[#1a4d5c] font-semibold rounded-lg border border-[#e0c36a] hover:bg-[#d1e6ed] transition text-sm">View archive</button>
                <button className="p-2 bg-[#e6f0f3] rounded-full border border-[#e0c36a] hover:bg-[#d1e6ed] transition"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#1a4d5c" className="w-5 h-5"><circle cx="12" cy="12" r="10" stroke="#1a4d5c" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2 2" /></svg></button>
              </div>
            </div>
            <div className="flex gap-6 text-[#1a4d5c] text-base mb-2">
              <span><span className="font-bold">37</span> posts</span>
              <span><span className="font-bold">163</span> followers</span>
              <span><span className="font-bold">267</span> following</span>
            </div>
            <div className="font-semibold text-[#1a4d5c]">{session?.user?.name || 'Full Name'}</div>
            <div className="text-sm text-gray-600 mb-1">@{session?.user?.username || session?.user?.email?.split('@')[0]}</div>
            <div className="text-sm text-[#1a4d5c]">Entrepreneur, Educationist, sports enthusiast, Traveler, Shutter bug.</div>
          </div>
        </div>
        {/* Achievements Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Competition Achievements</h2>
          
          {achievementsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : achievements ? (
            <>
              {/* Achievement Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-yellow-50 rounded-lg p-4 text-center cursor-pointer hover:bg-yellow-100 transition" onClick={() => scrollToAchievementImage(1)}>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">🥇</div>
                  <div className="text-2xl font-bold text-gray-900">{achievements.stats.firstPlace}</div>
                  <div className="text-sm text-gray-600">First Place</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => scrollToAchievementImage(2)}>
                  <div className="text-3xl font-bold text-gray-600 mb-1">🥈</div>
                  <div className="text-2xl font-bold text-gray-900">{achievements.stats.secondPlace}</div>
                  <div className="text-sm text-gray-600">Second Place</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center cursor-pointer hover:bg-orange-100 transition" onClick={() => scrollToAchievementImage(3)}>
                  <div className="text-3xl font-bold text-orange-600 mb-1">🥉</div>
                  <div className="text-2xl font-bold text-gray-900">{achievements.stats.thirdPlace}</div>
                  <div className="text-sm text-gray-600">Third Place</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-1">🏆</div>
                  <div className="text-2xl font-bold text-gray-900">{achievements.stats.totalTopThree}</div>
                  <div className="text-sm text-gray-600">Total Top 3</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No competition achievements yet. Keep participating to earn medals!
            </div>
          )}
        </div>
        {/* User Uploaded Images Section */}
        <div className="mt-8 bg-white border-2 border-[#e0c36a] rounded-2xl shadow">
          <div className="px-6 py-6 border-b-2 border-[#e0c36a]">
            <h2 className="text-xl font-bold text-[#1a4d5c]">Your Uploaded Images</h2>
            <p className="mt-1 text-sm text-[#2699a6]">All photos you've submitted to competitions</p>
          </div>
          <div className="px-6 py-6" ref={imagesGridRef}>
            {imagesLoading ? (
              <div className="text-center py-8 text-[#1a4d5c] font-semibold">Loading images...</div>
            ) : imagesError ? (
              <div className="text-center py-8 text-red-600 font-semibold">{imagesError}</div>
            ) : userImages.filter(img => !img.archived).length === 0 ? (
              <div className="text-center py-8 text-gray-500">You haven't uploaded any images yet.</div>
            ) : (
              <div className="grid grid-cols-3 gap-0">
                {userImages.filter(img => !img.archived).map((img) => (
                  <div key={img._id} data-img-id={img._id} className={`relative w-full aspect-[4/3] group overflow-hidden cursor-pointer${highlightedImageId === img._id ? ' ring-4 ring-yellow-400 z-10' : ''}`} onClick={() => setModalImageId(img._id)}>
                    <ImageWithFallback
                      src={img.thumbnailUrl || img.imageUrl}
                      alt={img.title || 'User photo'}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-white p-4">
                      <div className="font-bold text-base mb-1 truncate w-full text-center">{img.title}</div>
                      {img.competition && (
                        <div className="text-xs mb-1 truncate w-full text-center">Competition: {img.competition.title}</div>
                      )}
                      <div className="text-xs w-full text-center">Uploaded: {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Modal for enlarged image */}
        {currentModalImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setModalImageId(null)}>
            <div className="relative w-full h-full flex flex-col md:flex-row items-center justify-center" onClick={e => e.stopPropagation()}>
              <button className="absolute top-4 right-8 z-10 bg-white/80 hover:bg-white text-[#1a4d5c] rounded-full p-2 shadow" onClick={() => setModalImageId(null)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* Image on the left */}
              <div className="flex-1 h-full relative modal-image-area" key={currentModalImage._id}>
                {(currentModalImage.imageUrl || currentModalImage.thumbnailUrl) ? (
                  <ImageWithFallback
                    key={currentModalImage._id}
                    src={currentModalImage.imageUrl || currentModalImage.thumbnailUrl}
                    alt={currentModalImage.title || 'User photo'}
                    fill
                    className="object-contain w-full h-full modal-image"
                  />
                ) : (
                  <img
                    src="https://placehold.co/600x400?text=No+Image+Available"
                    alt="No image"
                    className="object-contain w-full h-full modal-image"
                  />
                )}
              </div>
              {/* Sidebar on the right */}
              <div className="w-full md:w-64 h-full flex flex-col justify-center bg-black/70 p-6 md:rounded-none rounded-b-2xl md:rounded-r-2xl modal-sidebar">
                <div className="font-bold text-2xl text-white mb-2 text-center md:text-left">{currentModalImage.title}</div>
                {currentModalImage.competition && (
                  <div className="text-base text-[#e0c36a] mb-2 text-center md:text-left">Competition: {currentModalImage.competition.title}
                    {/* Show actual rank badge for this image in the competition */}
                    {(() => {
                      const compImages = allImagesForCompetition[currentModalImage.competition?._id];
                      if (!compImages || compImages.length === 0) {
                        // Optionally, show a loading state if images are being fetched for the first time
                        if(currentModalImage && currentModalImage.competition && !allImagesForCompetition[currentModalImage.competition._id]){
                           return <span className="ml-2 text-xs text-gray-400">Loading rank...</span>;
                        }
                        return null;
                      }

                      // Sort by averageRating desc, then ratingCount desc
                      const sorted = [...compImages].sort((a, b) => {
                        if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
                        return (b.ratingCount || 0) - (a.ratingCount || 0);
                      });
                      const rank = sorted.findIndex(img => img._id === currentModalImage._id) + 1;
                      if (rank > 0) {
                        let badgeIcon: React.ReactNode = null;
                        if (rank === 1) badgeIcon = <span className="mr-1">🥇</span>;
                        else if (rank === 2) badgeIcon = <span className="mr-1">🥈</span>;
                        else if (rank === 3) badgeIcon = <span className="mr-1">🥉</span>;
                        return (
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white ${
                            rank === 1 ? 'bg-yellow-400' :
                            rank === 2 ? 'bg-gray-300' :
                            rank === 3 ? 'bg-orange-400' :
                            'bg-gray-700'
                          }`}>
                            {badgeIcon}
                            {rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`} Rank
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
                <div className="text-xs text-gray-200 mb-4 text-center md:text-left">Uploaded: {currentModalImage.createdAt ? new Date(currentModalImage.createdAt).toLocaleDateString() : ''}</div>
                {currentModalImage.description && (
                  <div className="text-sm text-gray-100 mt-2 text-center md:text-left">{currentModalImage.description}</div>
                )}
                <div className="mt-6 flex justify-center md:justify-start">
                  <button
                    className="px-4 py-2 bg-[#e0c36a] text-[#1a4d5c] font-bold rounded-lg shadow hover:bg-[#ffe082] transition"
                    onClick={() => setShowManagePopup((v) => !v)}
                  >
                    Manage
                  </button>
                  {/* Manage popup */}
                  {showManagePopup && (
                    <>
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowManagePopup(false)}></div>
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 min-w-[320px] max-w-xs flex flex-col items-center border-2 border-[#e0c36a]">
                          <h3 className="text-xl font-bold text-[#1a4d5c] mb-6">Manage Image</h3>
                          <button
                            className="w-full px-6 py-3 text-lg rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 border-t border-gray-200 transition"
                            onClick={() => { setShowManagePopup(false); handleDeleteImage(currentModalImage._id); }}
                          >
                            Delete
                          </button>
                          <button
                            className="mt-4 text-sm text-gray-500 hover:underline"
                            onClick={() => setShowManagePopup(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* Mobile portrait-specific styles */}
            <style jsx global>{`
              @media (max-width: 767px) and (orientation: portrait) {
                .modal-image-area {
                  width: 100vw !important;
                  height: 40vh !important;
                  min-height: 180px;
                  max-height: 50vh;
                  position: relative !important;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #111;
                }
                .modal-image {
                  object-fit: contain !important;
                  width: 100% !important;
                  height: 100% !important;
                  position: relative !important;
                }
                .modal-sidebar {
                  max-height: 50vh;
                  overflow-y: auto;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
} 