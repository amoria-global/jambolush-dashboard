"use client";
import React, { useState, useMemo } from 'react';

interface Review {
  id: number;
  clientName: string;
  clientAvatar: string;
  rating: number;
  date: string;
  tourName: string;
  comment: string;
  helpful: number;
}

const TourGuideReviews: React.FC = () => {
  const [reviews] = useState<Review[]>([
    {
      id: 1,
      clientName: "Sarah Johnson",
      clientAvatar: "https://i.pravatar.cc/150?img=1",
      rating: 5,
      date: "2025-08-15",
      tourName: "Historic City Walking Tour",
      comment: "Amazing experience! The guide was knowledgeable and made the tour incredibly engaging. I learned so much and saw parts of the city I would have never found on my own. Would definitely recommend!",
      helpful: 12
    },
    {
      id: 2,
      clientName: "Mike Chen",
      clientAvatar: "https://i.pravatar.cc/150?img=2",
      rating: 4,
      date: "2025-08-10",
      tourName: "Sunset Beach Adventure",
      comment: "Great tour with beautiful views. The guide was friendly and professional, and the pace was perfect. My only wish is that it could have been a bit longer because we were having so much fun.",
      helpful: 8
    },
    {
      id: 3,
      clientName: "Emma Wilson",
      clientAvatar: "https://i.pravatar.cc/150?img=3",
      rating: 5,
      date: "2025-08-05",
      tourName: "Food & Culture Experience",
      comment: "An incredible culinary journey! I learned so much about the local cuisine and culture. The guide's passion for food and history really showed and made the experience unforgettable.",
      helpful: 15
    },
    {
        id: 4,
        clientName: "David Lee",
        clientAvatar: "https://i.pravatar.cc/150?img=4",
        rating: 3,
        date: "2025-07-22",
        tourName: "Mountain Hiking Expedition",
        comment: "The scenery was breathtaking, but the hike was much more challenging than described. It would be better to label the difficulty more accurately. The guide was supportive, though.",
        helpful: 4
      }
  ]);

  const [filterRating, setFilterRating] = useState<number>(0);

  // Memoize calculations for performance
  const summaryStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }
    const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
    const ratingCounts = reviews.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    return {
      averageRating: totalRating / reviews.length,
      totalReviews: reviews.length,
      ratingCounts
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => 
    filterRating === 0 
      ? reviews 
      : reviews.filter(r => r.rating === filterRating),
    [reviews, filterRating]
  );

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const starSize = { sm: '14px', md: '16px', lg: '20px' };
    return (
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <i
            key={i}
            className={`bi bi-star${i < Math.round(rating) ? '-fill' : ''}`}
            style={{ color: i < Math.round(rating) ? '#F20C8F' : '#dee2e6', fontSize: starSize[size] }}
          ></i>
        ))}
      </div>
    );
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="pt-4 md:pt-14 min-h-screen bg-gray-50">
      <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Reviews</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">See what clients are saying about your tours.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 sm:p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                    <h2 className="text-4xl font-bold text-[#083A85]">{summaryStats.averageRating.toFixed(1)}</h2>
                    <div className="mt-1">{renderStars(summaryStats.averageRating, 'md')}</div>
                </div>
                <i className="bi bi-star-half text-4xl text-yellow-400"></i>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                  <p className="text-sm text-gray-600 mb-2">Total Reviews</p>
                  <h2 className="text-4xl font-bold text-[#083A85]">{summaryStats.totalReviews}</h2>
                  <p className="text-sm text-gray-500 mt-1">Across all tours</p>
              </div>
              <i className="bi bi-chat-quote text-4xl text-gray-400"></i>
            </div>
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3">Filter by rating</h3>
            <div className="flex flex-wrap gap-2">
                <button
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                    filterRating === 0 
                      ? 'bg-[#083A85] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterRating(0)}
                >
                  All ({summaryStats.totalReviews})
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center cursor-pointer ${
                      filterRating === rating
                        ? 'bg-[#083A85] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFilterRating(rating)}
                  >
                    {rating} <i className="bi bi-star-fill ml-2 text-sm text-yellow-400"></i>
                    <span className="ml-2 text-sm opacity-80">({summaryStats.ratingCounts[rating] || 0})</span>
                  </button>
                ))}
            </div>
        </div>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
            <div className="space-y-4">
                {filteredReviews.map(review => (
                <div key={review.id} className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
                    <div className="flex gap-4">
                    <img
                        src={review.clientAvatar}
                        alt={review.clientName}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0 mt-1"
                    />
                    <div className="flex-1">
                        <div className="flex justify-between items-start flex-wrap mb-2 gap-2">
                        <div>
                            <h4 className="text-base sm:text-lg font-bold text-[#083A85]">{review.clientName}</h4>
                            <p className="text-sm text-gray-600">on <span className="font-medium">{review.tourName}</span></p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            {renderStars(review.rating, 'sm')}
                            <p className="text-sm text-gray-500 mt-1">{formatDate(review.date)}</p>
                        </div>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">{review.comment}</p>
                        <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#083A85] transition-colors">
                            <i className="bi bi-hand-thumbs-up"></i>
                            Helpful ({review.helpful})
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                            <i className="bi bi-flag"></i>
                            Report
                        </button>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
        ) : (
            // Empty State
            <div className="bg-white rounded-lg shadow-xl p-8 sm:p-12 text-center">
                <i className="bi bi-chat-quote text-4xl sm:text-6xl text-gray-300"></i>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">
                    No reviews found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                    There are no reviews that match your selected filter.
                </p>
             </div>
        )}

        {/* Load More Button */}
        {filteredReviews.length > 0 && (
            <div className="mt-6 text-center">
                <button 
                    className="px-6 py-3 text-white rounded-lg font-medium cursor-pointer text-sm sm:text-base transition-transform hover:scale-105"
                    style={{ backgroundColor: '#083A85' }}
                >
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Load More Reviews
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TourGuideReviews;