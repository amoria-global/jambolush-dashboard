"use client";
import api from '@/app/api/apiService';
import React, { useState, useEffect, useMemo } from 'react';

interface TourReviewInfo {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userProfileImage?: string;
  tourId: string;
  tourTitle: string;
  tourGuideId: string;
  rating: number;
  comment: string;
  images: string[];
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  isAnonymous: boolean;
  isVerified: boolean;
  isVisible: boolean;
  helpfulCount: number;
  response?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Tour {
  id: string;
  title: string;
  // Add other tour properties as needed
}

interface ReviewsApiResponse {
  reviews: TourReviewInfo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Review {
  id: string;
  clientName: string;
  clientAvatar: string;
  rating: number;
  date: string;
  tourName: string;
  tourId: string;
  comment: string;
  helpful: number;
  isVerified: boolean;
  pros: string[];
  cons: string[];
  wouldRecommend: boolean;
  response?: string;
  responseDate?: string;
}

const TourGuideReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterTour, setFilterTour] = useState<string>('all');
  const [loadingReviews, setLoadingReviews] = useState<Record<string, boolean>>({});

  // Transform API data to component format
  const transformReviewData = (apiReviews: TourReviewInfo[], tourTitle: string): Review[] => {
    return apiReviews.map(review => ({
      id: review.id,
      clientName: review.isAnonymous ? "Anonymous User" : review.userName,
      clientAvatar: review.userProfileImage || `https://i.pravatar.cc/150?u=${review.userId}`,
      rating: review.rating,
      date: review.createdAt,
      tourName: tourTitle,
      tourId: review.tourId,
      comment: review.comment,
      helpful: review.helpfulCount,
      isVerified: review.isVerified,
      pros: review.pros,
      cons: review.cons,
      wouldRecommend: review.wouldRecommend,
      response: review.response,
      responseDate: review.responseDate
    }));
  };

  // Fetch all tours for the guide
  const fetchMyTours = async (): Promise<Tour[]> => {
    try {
      const response: any = await api.get(`/tours/guide/my-tours`);
      
      // Updated to match your actual response structure
      const { tours, total, totalPages, page } = response.data.data;
      const toursArray: Tour[] = Array.isArray(tours) ? tours : [];
      return toursArray;
    } catch (err) {
      console.error('Error fetching tours:', err);
      throw err;
    }
  };

  // Fetch reviews for a specific tour
  const fetchTourReviews = async (tourId: string, page: number = 1): Promise<TourReviewInfo[]> => {
    try {
      const data: ReviewsApiResponse | any = await api.get(`/tours/${tourId}/reviews?page=${page}&limit=50`);
      return data.data.reviews;
    } catch (err) {
      console.error(`Error fetching reviews for tour ${tourId}:`, err);
      return []; // Return empty array instead of throwing to allow other tours to load
    }
  };

  // Fetch all reviews for all tours
  const fetchAllReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all tours
      const myTours = await fetchMyTours();
      setTours(myTours);

      if (myTours.length === 0) {
        setReviews([]);
        return;
      }

      // Then fetch reviews for each tour
      const allReviewsPromises = myTours.map(async (tour) => {
        setLoadingReviews(prev => ({ ...prev, [tour.id]: true }));
        try {
          const tourReviews = await fetchTourReviews(tour.id);
          const transformedReviews = transformReviewData(tourReviews, tour.title);
          return transformedReviews;
        } catch (err) {
          console.error(`Failed to fetch reviews for tour ${tour.title}:`, err);
          return [];
        } finally {
          setLoadingReviews(prev => ({ ...prev, [tour.id]: false }));
        }
      });

      const reviewsArrays = await Promise.all(allReviewsPromises);
      const allReviews = reviewsArrays.flat();
      
      // Sort by date (most recent first)
      const sortedReviews = allReviews.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setReviews(sortedReviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      console.error('Error fetching all reviews:', err);
    } finally {
      setLoading(false);
      setLoadingReviews({});
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllReviews();
  }, []);

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

  const filteredReviews = useMemo(() => {
    let filtered = reviews;
    
    // Filter by rating
    if (filterRating !== 0) {
      filtered = filtered.filter(r => r.rating === filterRating);
    }
    
    // Filter by tour
    if (filterTour !== 'all') {
      filtered = filtered.filter(r => r.tourId === filterTour);
    }
    
    return filtered;
  }, [reviews, filterRating, filterTour]);

  // Get tour-specific stats for tour filter
  const tourStats = useMemo(() => {
    const stats: Record<string, number> = {};
    reviews.forEach(review => {
      stats[review.tourId] = (stats[review.tourId] || 0) + 1;
    });
    return stats;
  }, [reviews]);

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

  // Loading state
  if (loading) {
    return (
      <div className="pt-4 md:pt-14 min-h-screen bg-gray-50">
        <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Reviews</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Loading your tour reviews...</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
              <p className="text-gray-600">Fetching reviews from all your tours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pt-4 md:pt-14 min-h-screen bg-gray-50">
        <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Reviews</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i className="bi bi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Reviews</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchAllReviews}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-14 min-h-screen bg-gray-50">
      <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Reviews</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            See what clients are saying about your tours. ({tours.length} tours, {reviews.length} total reviews)
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                  <p className="text-sm text-gray-600 mb-2">Active Tours</p>
                  <h2 className="text-4xl font-bold text-[#083A85]">{tours.length}</h2>
                  <p className="text-sm text-gray-500 mt-1">With reviews</p>
              </div>
              <i className="bi bi-map text-4xl text-blue-400"></i>
            </div>
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3">Filter reviews</h3>
            
            {/* Rating Filter */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">By Rating:</h4>
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

            {/* Tour Filter */}
            {tours.length > 1 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">By Tour:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                      filterTour === 'all'
                        ? 'bg-[#083A85] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setFilterTour('all')}
                  >
                    All Tours ({reviews.length})
                  </button>
                  {tours.map(tour => (
                    <button
                      key={tour.id}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
                        filterTour === tour.id
                          ? 'bg-[#083A85] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setFilterTour(tour.id)}
                    >
                      {tour.title} ({tourStats[tour.id] || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                            <div className="flex items-center gap-2">
                              <h4 className="text-base sm:text-lg font-bold text-[#083A85]">{review.clientName}</h4>
                              {review.isVerified && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  <i className="bi bi-patch-check-fill mr-1"></i>Verified
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">on <span className="font-medium">{review.tourName}</span></p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            {renderStars(review.rating, 'sm')}
                            <p className="text-sm text-gray-500 mt-1">{formatDate(review.date)}</p>
                        </div>
                        </div>
                        
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                        
                        {/* Pros and Cons */}
                        {(review.pros.length > 0 || review.cons.length > 0) && (
                          <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {review.pros.length > 0 && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <h5 className="text-sm font-medium text-green-800 mb-2">What they loved:</h5>
                                <ul className="text-sm text-green-700 space-y-1">
                                  {review.pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <i className="bi bi-check-circle-fill text-green-600 mt-0.5"></i>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {review.cons.length > 0 && (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <h5 className="text-sm font-medium text-orange-800 mb-2">Room for improvement:</h5>
                                <ul className="text-sm text-orange-700 space-y-1">
                                  {review.cons.map((con, index) => (
                                    <li key={index} className="flex items-start gap-1">
                                      <i className="bi bi-exclamation-circle-fill text-orange-600 mt-0.5"></i>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Would Recommend */}
                        <div className="mb-3">
                          <span className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                            review.wouldRecommend 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            <i className={`bi ${review.wouldRecommend ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-down-fill'}`}></i>
                            {review.wouldRecommend ? 'Would recommend' : 'Would not recommend'}
                          </span>
                        </div>

                        {/* Your Response */}
                        {review.response && (
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="text-sm font-medium text-blue-800">Your Response:</h5>
                              {review.responseDate && (
                                <span className="text-xs text-blue-600">{formatDate(review.responseDate)}</span>
                              )}
                            </div>
                            <p className="text-sm text-blue-700">{review.response}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#083A85] transition-colors">
                            <i className="bi bi-hand-thumbs-up"></i>
                            Helpful ({review.helpful})
                        </button>
                        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors">
                            <i className="bi bi-flag"></i>
                            Report
                        </button>
                        {!review.response && (
                          <button className="flex items-center gap-2 text-sm text-[#083A85] hover:text-blue-700 transition-colors">
                            <i className="bi bi-reply"></i>
                            Respond
                          </button>
                        )}
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
                    {tours.length === 0 
                      ? "You don't have any tours yet. Create your first tour to start receiving reviews!"
                      : filterRating === 0 && filterTour === 'all'
                      ? "You haven't received any reviews yet. Complete some tours to start getting feedback!"
                      : "There are no reviews that match your selected filters."
                    }
                </p>
                {(filterRating !== 0 || filterTour !== 'all') && (
                  <button 
                    onClick={() => {
                      setFilterRating(0);
                      setFilterTour('all');
                    }}
                    className="mt-4 px-4 py-2 text-[#083A85] border border-[#083A85] rounded-lg hover:bg-[#083A85] hover:text-white transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
             </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
            <button 
                onClick={fetchAllReviews}
                disabled={loading}
                className="px-6 py-3 text-white rounded-lg font-medium cursor-pointer text-sm sm:text-base transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#083A85' }}
            >
            {loading ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise mr-2"></i>
                Refresh Reviews
              </>
            )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TourGuideReviews;