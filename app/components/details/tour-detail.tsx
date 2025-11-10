'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';

interface TourDetailProps {
  id: string;
}

interface TourGuide {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string | null;
  bio: string | null;
  experience: string | null;
  languages: string[] | null;
  specializations: string[] | null;
  rating: number;
  totalTours: number;
  isVerified: boolean;
  licenseNumber: string | null;
  certifications: string[] | null;
}

interface TourSchedule {
  id: string;
  tourId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  bookedSlots: number;
  isAvailable: boolean;
  price: number | null;
  specialNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TourImages {
  main: string[];
  gallery: string[];
}

interface ItineraryItem {
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface TourInfo {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  type: string;
  duration: number;
  maxGroupSize: number;
  minGroupSize: number;
  price: number;
  currency: string;
  images: TourImages;
  itinerary: string;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  difficulty: string;
  locationCountry: string;
  locationState: string;
  locationCity: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  locationZipCode: string;
  meetingPoint: string;
  tags: string[];
  rating: number;
  totalReviews: number;
  totalBookings: number;
  views: number;
  isActive: boolean;
  tourGuideId: number;
  tourGuide: TourGuide;
  schedules: TourSchedule[];
  createdAt: string;
  updatedAt: string;
}

export default function TourDetail({ id }: TourDetailProps) {
  const [tour, setTour] = useState<TourInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<'main' | 'gallery'>('main');

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<any>(`/tours/${id}`);

        if (response.ok && response.data.success) {
          setTour(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load tour details');
        }
      } catch (err: any) {
        console.error('Error fetching tour:', err);
        setError(err.message || 'An error occurred while loading tour details');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty?.toLowerCase();
    if (diff === 'easy') return 'bg-green-100 text-green-800';
    if (diff === 'moderate') return 'bg-yellow-100 text-yellow-800';
    if (diff === 'hard' || diff === 'difficult') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const parseItinerary = (itineraryString: string): ItineraryItem[] => {
    try {
      return JSON.parse(itineraryString);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tour details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <i className="bi bi-exclamation-triangle text-3xl text-red-600"></i>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading Tour
                </h3>
                <p className="text-red-800">{error || 'Tour not found'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const itinerary = parseItinerary(tour.itinerary);
  const mainImage = tour.images?.main?.[0];
  const galleryImages = tour.images?.gallery || [];

  return (
    <div className="space-y-6">
      {/* Tour Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            <i className="bi bi-compass mr-2"></i>
            {tour.title}
          </h2>
          <div className="flex items-center gap-2">
            {tour.tourGuide?.isVerified && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <i className="bi bi-patch-check-fill mr-1"></i>
                Verified Guide
              </span>
            )}
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              tour.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {tour.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Main Tour Image */}
        {mainImage && (
          <div className="mb-6">
            <img
              src={mainImage}
              alt={tour.title}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Image Gallery Tabs */}
        {(tour.images?.main?.length > 0 || galleryImages.length > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-images mr-2"></i>
              Photo Gallery
            </h3>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {tour.images?.main?.length > 0 && (
                <button
                  onClick={() => setActiveImageTab('main')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeImageTab === 'main'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Main Images ({tour.images.main.length})
                </button>
              )}
              {galleryImages.length > 0 && (
                <button
                  onClick={() => setActiveImageTab('gallery')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeImageTab === 'gallery'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Gallery ({galleryImages.length})
                </button>
              )}
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeImageTab === 'main' && tour.images?.main?.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`${tour.title} - Main ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
              {activeImageTab === 'gallery' && galleryImages.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`${tour.title} - Gallery ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Short Description */}
        {tour.shortDescription && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-gray-700 text-lg">{tour.shortDescription}</p>
          </div>
        )}

        {/* Tour Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-cash mr-1"></i>
              Price
            </label>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(tour.price, tour.currency)}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-clock mr-1"></i>
              Duration
            </label>
            <p className="text-base text-gray-900">{tour.duration} {tour.duration === 1 ? 'hour' : 'hours'}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-speedometer2 mr-1"></i>
              Difficulty
            </label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(tour.difficulty)}`}>
              {tour.difficulty}
            </span>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-people mr-1"></i>
              Group Size
            </label>
            <p className="text-base text-gray-900">{tour.minGroupSize} - {tour.maxGroupSize} people</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-tag mr-1"></i>
              Category
            </label>
            <p className="text-base text-gray-900">{tour.category}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-compass mr-1"></i>
              Type
            </label>
            <p className="text-base text-gray-900 capitalize">{tour.type}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-star-fill mr-1"></i>
              Rating
            </label>
            <p className="text-base text-gray-900">
              {tour.rating.toFixed(1)} ({tour.totalReviews} {tour.totalReviews === 1 ? 'review' : 'reviews'})
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-calendar-check mr-1"></i>
              Total Bookings
            </label>
            <p className="text-base text-gray-900">{tour.totalBookings}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-eye mr-1"></i>
              Views
            </label>
            <p className="text-base text-gray-900">{tour.views}</p>
          </div>
        </div>

        {/* Full Description */}
        {tour.description && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              <i className="bi bi-file-text mr-2"></i>
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{tour.description}</p>
          </div>
        )}

        {/* Itinerary */}
        {itinerary.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-list-ol mr-2"></i>
              Itinerary
            </h3>
            <div className="space-y-4">
              {itinerary.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                      {item.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        <i className="bi bi-clock mr-1"></i>
                        Duration: {item.duration} {item.duration === 1 ? 'hour' : 'hours'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inclusions */}
        {tour.inclusions && tour.inclusions.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-check-circle mr-2"></i>
              What's Included
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tour.inclusions.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="bi bi-check-circle-fill text-green-600"></i>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exclusions */}
        {tour.exclusions && tour.exclusions.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-x-circle mr-2"></i>
              What's Not Included
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tour.exclusions.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="bi bi-x-circle-fill text-red-600"></i>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        {tour.requirements && tour.requirements.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-info-circle mr-2"></i>
              Requirements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tour.requirements.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="bi bi-dot text-gray-600 text-2xl"></i>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="bi bi-geo-alt mr-2"></i>
            Location & Meeting Point
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Address</label>
              <p className="text-base text-gray-900">{tour.locationAddress}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">City</label>
              <p className="text-base text-gray-900">{tour.locationCity}, {tour.locationState}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Country</label>
              <p className="text-base text-gray-900">{tour.locationCountry}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Meeting Point</label>
              <p className="text-base text-gray-900">{tour.meetingPoint}</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-tags mr-2"></i>
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tour.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tour Guide Information */}
        {tour.tourGuide && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-person-badge mr-2"></i>
              Tour Guide
            </h3>
            <div className="flex items-start gap-4">
              {tour.tourGuide.profileImage ? (
                <img
                  src={tour.tourGuide.profileImage}
                  alt={`${tour.tourGuide.firstName} ${tour.tourGuide.lastName}`}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <i className="bi bi-person-fill text-3xl text-gray-500"></i>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-lg font-medium text-gray-900">
                    {tour.tourGuide.firstName} {tour.tourGuide.lastName}
                  </p>
                  {tour.tourGuide.isVerified && (
                    <i className="bi bi-patch-check-fill text-blue-600"></i>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{tour.tourGuide.email}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>
                    <i className="bi bi-star-fill text-yellow-500 mr-1"></i>
                    {tour.tourGuide.rating.toFixed(1)} rating
                  </span>
                  <span>
                    <i className="bi bi-compass mr-1"></i>
                    {tour.tourGuide.totalTours} tours
                  </span>
                </div>
                {tour.tourGuide.bio && (
                  <p className="text-sm text-gray-700 mt-3">{tour.tourGuide.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Schedules */}
        {tour.schedules && tour.schedules.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-calendar-range mr-2"></i>
              Available Schedules
            </h3>
            <div className="space-y-3">
              {tour.schedules.map((schedule, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Date Range</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(schedule.startDate)} - {formatDate(schedule.endDate)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Time</label>
                      <p className="text-sm text-gray-900">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Availability</label>
                      <p className="text-sm text-gray-900">
                        {schedule.availableSlots - schedule.bookedSlots} / {schedule.availableSlots} slots
                      </p>
                    </div>
                    {schedule.price && (
                      <div>
                        <label className="text-xs text-gray-600 block mb-1">Special Price</label>
                        <p className="text-sm text-gray-900">{formatAmount(schedule.price, tour.currency)}</p>
                      </div>
                    )}
                    {schedule.specialNotes && (
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-600 block mb-1">Notes</label>
                        <p className="text-sm text-gray-700">{schedule.specialNotes}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      schedule.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {schedule.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <i className="bi bi-clock-history mr-1"></i>
              Created: {formatDate(tour.createdAt)}
            </div>
            <div>
              <i className="bi bi-clock mr-1"></i>
              Last Updated: {formatDate(tour.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
