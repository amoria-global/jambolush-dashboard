// app/components/PhotoViewerModal.tsx
"use client";
import { useState, useEffect, useCallback } from 'react';

interface PhotoCategory {
  name: string;
  photos: string[];
  startIndex: number;
}

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: string[];
  initialPhotoIndex?: number;
  propertyTitle: string;
  propertyImages?: any; // Original backend images object with categories
}

export default function PhotoViewerModal({ 
  isOpen, 
  onClose, 
  photos, 
  initialPhotoIndex = 0,
  propertyTitle,
  propertyImages 
}: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);
  const [showThumbnails, setShowThumbnails] = useState(false);
  
  // Organize photos by category if propertyImages is provided
  const photoCategories: PhotoCategory[] = [];
  
  if (propertyImages) {
    const categoryOrder: { key: keyof typeof propertyImages; label: string }[] = [
      { key: 'exterior', label: 'Exterior' },
      { key: 'livingRoom', label: 'Living Room' },
      { key: 'bedroom', label: 'Bedroom' },
      { key: 'kitchen', label: 'Kitchen' },
      { key: 'bathroom', label: 'Bathroom' },
      { key: 'diningArea', label: 'Dining Area' },
      { key: 'workspace', label: 'Workspace' },
      { key: 'balcony', label: 'Balcony' },
      { key: 'laundryArea', label: 'Laundry Area' },
      { key: 'gym', label: 'Gym' },
      { key: 'childrenPlayroom', label: 'Children Playroom' }
    ];
    
    let runningIndex = 0;
    categoryOrder.forEach(({ key, label }) => {
      if (propertyImages[key] && Array.isArray(propertyImages[key]) && propertyImages[key].length > 0) {
        photoCategories.push({
          name: label,
          photos: propertyImages[key],
          startIndex: runningIndex
        });
        runningIndex += propertyImages[key].length;
      }
    });
  }

  // Get current category based on current photo index
  const getCurrentCategory = () => {
    if (photoCategories.length === 0) return null;
    for (let i = photoCategories.length - 1; i >= 0; i--) {
      if (currentIndex >= photoCategories[i].startIndex) {
        return photoCategories[i];
      }
    }
    return photoCategories[0];
  };

  const currentCategory = getCurrentCategory();

  useEffect(() => {
    setCurrentIndex(initialPhotoIndex);
  }, [initialPhotoIndex]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToCategory = (category: PhotoCategory) => {
    setCurrentIndex(category.startIndex);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
    setShowThumbnails(false);
  };

  if (!isOpen) return null;

  const fallbackImageUrl = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackImageUrl) {
      target.src = fallbackImageUrl;
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label="Close photo viewer"
            >
              <i className="bi bi-x-lg text-white text-xl"></i>
            </button>
            <div className="text-white">
              <h3 className="font-medium">{propertyTitle}</h3>
              {currentCategory && (
                <p className="text-sm text-white/70">{currentCategory.name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
              {currentIndex + 1} / {photos.length}
            </span>
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
              aria-label="Toggle thumbnails"
            >
              <i className={`bi ${showThumbnails ? 'bi-grid-3x3-gap-fill' : 'bi-grid-3x3-gap'} text-white text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Category tabs */}
        {photoCategories.length > 0 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {photoCategories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => goToCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    currentCategory?.name === category.name
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                  }`}
                >
                  {category.name} ({category.photos.length})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content area */}
      {showThumbnails ? (
        /* Thumbnail grid view */
        <div className="h-full overflow-y-auto pt-32 pb-4 px-4">
          <div className="max-w-7xl mx-auto">
            {photoCategories.length > 0 ? (
              /* Categorized view */
              photoCategories.map((category) => (
                <div key={category.name} className="mb-8">
                  <h3 className="text-white text-lg font-medium mb-3">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {category.photos.map((photo, idx) => (
                      <button
                        key={`${category.name}-${idx}`}
                        onClick={() => goToPhoto(category.startIndex + idx)}
                        className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-white transition-all group"
                      >
                        <img
                          src={photo || fallbackImageUrl}
                          alt={`${category.name} ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={handleImageError}
                        />
                        {currentIndex === category.startIndex + idx && (
                          <div className="absolute inset-0 ring-2 ring-white bg-black/20"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Simple grid for uncategorized photos */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToPhoto(idx)}
                    className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-white transition-all group"
                  >
                    <img
                      src={photo || fallbackImageUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={handleImageError}
                    />
                    {currentIndex === idx && (
                      <div className="absolute inset-0 ring-2 ring-white bg-black/20"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single photo view */
        <div className="h-full flex items-center justify-center px-4 py-20">
          {/* Navigation buttons */}
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10"
            aria-label="Previous photo"
          >
            <i className="bi bi-chevron-left text-white text-2xl"></i>
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10"
            aria-label="Next photo"
          >
            <i className="bi bi-chevron-right text-white text-2xl"></i>
          </button>

          {/* Main image */}
          <div className="max-w-6xl max-h-full w-full h-full flex items-center justify-center">
            <img
              src={photos[currentIndex] || fallbackImageUrl}
              alt={`Property photo ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
          </div>

          {/* Bottom thumbnail strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-6xl mx-auto">
              {photos.slice(Math.max(0, currentIndex - 3), Math.min(photos.length, currentIndex + 8)).map((photo, idx) => {
                const actualIndex = Math.max(0, currentIndex - 3) + idx;
                return (
                  <button
                    key={actualIndex}
                    onClick={() => setCurrentIndex(actualIndex)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                      actualIndex === currentIndex ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo || fallbackImageUrl}
                      alt={`Thumbnail ${actualIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}