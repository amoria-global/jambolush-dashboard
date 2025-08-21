"use client"
import React, { useState } from 'react';

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
      date: "2024-01-15",
      tourName: "Historic City Walking Tour",
      comment: "Amazing experience! The guide was knowledgeable and made the tour incredibly engaging. Would definitely recommend!",
      helpful: 12
    },
    {
      id: 2,
      clientName: "Mike Chen",
      clientAvatar: "https://i.pravatar.cc/150?img=2",
      rating: 4,
      date: "2024-01-10",
      tourName: "Sunset Beach Adventure",
      comment: "Great tour with beautiful views. The guide was friendly and professional. Only wish it was a bit longer.",
      helpful: 8
    },
    {
      id: 3,
      clientName: "Emma Wilson",
      clientAvatar: "https://i.pravatar.cc/150?img=3",
      rating: 5,
      date: "2024-01-05",
      tourName: "Food & Culture Experience",
      comment: "Incredible culinary journey! Learned so much about local cuisine and culture. The guide's passion really showed.",
      helpful: 15
    }
  ]);

  const [filterRating, setFilterRating] = useState<number>(0);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`bi bi-star${i < rating ? '-fill' : ''}`}
        style={{ color: i < rating ? '#F20C8F' : '#dee2e6', fontSize: '14px' }}
      ></i>
    ));
  };

  const filteredReviews = filterRating === 0 
    ? reviews 
    : reviews.filter(r => r.rating === filterRating);

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  return (
    <div className="mt-20">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between flex-wrap">
          <h5 className="text-xl font-bold text-blue-900 mb-2 md:mb-0">
            <i className="bi bi-star-fill mr-2 text-pink-600"></i>
            Client Reviews
          </h5>
          <div className="flex items-center gap-2">
            <span className="bg-blue-900 text-white px-3 py-2 rounded-full text-sm">
              {reviews.length} Reviews
            </span>
            <span className="bg-pink-600 text-white px-3 py-2 rounded-full text-sm">
              {averageRating.toFixed(1)} <i className="bi bi-star-fill ml-1"></i>
            </span>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="mb-4">
        <div className="bg-white rounded-xl shadow-sm border-0 p-3">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="flex-1 mb-3 md:mb-0">
              <h6 className="text-blue-900 font-semibold mb-2">Overall Rating</h6>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-pink-600 mb-0">{averageRating.toFixed(1)}</h2>
                <div>
                  <div>{renderStars(Math.round(averageRating))}</div>
                  <small className="text-gray-500">Based on {reviews.length} reviews</small>
                </div>
              </div>
            </div>
            <div className="flex-1 md:flex justify-end">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 text-sm rounded ${
                    filterRating === 0 
                      ? 'bg-blue-900 text-white' 
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterRating(0)}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    className={`px-3 py-1 text-sm rounded ${
                      filterRating === rating
                        ? 'bg-blue-900 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setFilterRating(rating)}
                  >
                    {rating} <i className="bi bi-star-fill ml-1"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.map(review => (
          <div key={review.id}>
            <div className="bg-white rounded-xl shadow-sm border-0 p-3">
              <div className="flex gap-3">
                <img
                  src={review.clientAvatar}
                  alt={review.clientName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap mb-2">
                    <div>
                      <h6 className="text-blue-900 font-semibold mb-0">{review.clientName}</h6>
                      <small className="text-gray-500">{review.tourName}</small>
                    </div>
                    <div className="text-right">
                      <div>{renderStars(review.rating)}</div>
                      <small className="text-gray-500">{new Date(review.date).toLocaleDateString()}</small>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed mb-3">{review.comment}</p>
                  <div className="flex items-center gap-3">
                    <button className="bg-pink-600 text-white px-3 py-1 text-sm rounded hover:bg-pink-700 transition-colors">
                      <i className="bi bi-hand-thumbs-up mr-1"></i>
                      Helpful ({review.helpful})
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-3 py-1 text-sm rounded hover:bg-gray-50 transition-colors">
                      <i className="bi bi-flag mr-1"></i>
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-4 text-center">
        <button className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors">
          <i className="bi bi-arrow-clockwise mr-2"></i>
          Load More Reviews
        </button>
      </div>
    </div>
  );
};

export default TourGuideReviews;