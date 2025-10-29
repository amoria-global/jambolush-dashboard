'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';

interface PropertyDetailProps {
  id: string;
  type: 'property' | 'tour';
}

interface PropertyImages {
  livingRoom?: string[];
  kitchen?: string[];
  diningArea?: string[];
  bedroom?: string[];
  bathroom?: string[];
  workspace?: string[];
  balcony?: string[];
  laundryArea?: string[];
  gym?: string[];
  exterior?: string[];
  childrenPlayroom?: string[];
}

interface PropertyAvailability {
  isAvailable: boolean;
  availableFrom?: string;
  availableTo?: string;
  blockedDates: string[];
  minStay: number;
  maxStay?: number;
}

interface PropertyInfo {
  id: number;
  name: string;
  location: string;
  category: string;
  pricePerNight: number;
  rating: number;
  reviewsCount: number;
  beds: number;
  baths: number;
  maxGuests: number;
  hostName: string;
  hostId: number;
  hostProfileImage?: string;
  availability: PropertyAvailability;
  type?: string;
  features: string[];
  description?: string;
  images: PropertyImages;
  video3D?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalBookings: number;
  isVerified: boolean;
}

export default function PropertyDetail({ id, type }: PropertyDetailProps) {
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageCategory, setActiveImageCategory] = useState<string>('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;

        // Use different endpoints based on type
        if (type === 'tour') {
          // For tours, use the tours endpoint: GET /tours/:id
          response = await api.get<any>(`/tours/${id}`);
        } else {
          // For properties, use the properties endpoint
          response = await api.getProperty(id);
        }

        if (response.ok && response.data.success) {
          const propertyData = response.data.data;
          setProperty(propertyData);

          // Set first available image category as active
          if (propertyData.images) {
            const firstCategory = Object.keys(propertyData.images).find(
              key => propertyData.images[key as keyof PropertyImages]?.length
            );
            if (firstCategory) {
              setActiveImageCategory(firstCategory);
            }
          }
        } else {
          setError(response.data.message || `Failed to load ${type} details`);
        }
      } catch (err: any) {
        console.error(`Error fetching ${type}:`, err);
        setError(err.message || `An error occurred while loading ${type} details`);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, type]);

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'active' || statusLower === 'available') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'inactive' || statusLower === 'unavailable') return 'bg-red-100 text-red-800';
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCategoryLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading {type} details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <i className="bi bi-exclamation-triangle text-3xl text-red-600"></i>
              <div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Error Loading {type === 'tour' ? 'Tour' : 'Property'}
                </h3>
                <p className="text-red-800">{error || `${type === 'tour' ? 'Tour' : 'Property'} not found`}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const imageCategories = property.images
    ? Object.entries(property.images).filter(([_, images]) => images && images.length > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            <i className={`bi ${type === 'tour' ? 'bi-compass' : 'bi-house-door'} mr-2`}></i>
            {property.name}
          </h2>
          <div className="flex items-center gap-2">
            {property.isVerified && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <i className="bi bi-patch-check-fill mr-1"></i>
                Verified
              </span>
            )}
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(property.status)}`}>
              {property.status}
            </span>
          </div>
        </div>

        {/* Main Property Image - Use first available image from gallery */}
        {property.images && (() => {
          const firstCategory = Object.keys(property.images).find(
            key => property.images[key as keyof PropertyImages]?.length
          );
          const firstImage = firstCategory ? property.images[firstCategory as keyof PropertyImages]?.[0] : null;
          return firstImage ? (
            <div className="mb-6">
              <img
                src={firstImage}
                alt={property.name}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          ) : null;
        })()}

        {/* Image Gallery */}
        {imageCategories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-images mr-2"></i>
              Photo Gallery
            </h3>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {imageCategories.map(([category, _]) => (
                <button
                  key={category}
                  onClick={() => setActiveImageCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeImageCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>

            {/* Images Grid */}
            {activeImageCategory && property.images[activeImageCategory as keyof PropertyImages] && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {property.images[activeImageCategory as keyof PropertyImages]?.map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`${getCategoryLabel(activeImageCategory)} ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3D Video */}
        {property.video3D && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-badge-3d mr-2"></i>
              3D Virtual Tour
            </h3>
            <video
              controls
              className="w-full rounded-lg"
              src={property.video3D}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Property Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-geo-alt mr-1"></i>
              Location
            </label>
            <p className="text-base text-gray-900">{property.location}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-tag mr-1"></i>
              Category
            </label>
            <p className="text-base text-gray-900">{property.category}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-cash mr-1"></i>
              Price per Night
            </label>
            <p className="text-2xl font-bold text-gray-900">{formatAmount(property.pricePerNight)}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-door-closed mr-1"></i>
              Bedrooms
            </label>
            <p className="text-base text-gray-900">{property.beds} {property.beds === 1 ? 'bed' : 'beds'}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-droplet mr-1"></i>
              Bathrooms
            </label>
            <p className="text-base text-gray-900">{property.baths} {property.baths === 1 ? 'bath' : 'baths'}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-people mr-1"></i>
              Max Guests
            </label>
            <p className="text-base text-gray-900">{property.maxGuests} {property.maxGuests === 1 ? 'guest' : 'guests'}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-star-fill mr-1"></i>
              Rating
            </label>
            <p className="text-base text-gray-900">
              {property.rating.toFixed(1)} ({property.reviewsCount} {property.reviewsCount === 1 ? 'review' : 'reviews'})
            </p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              <i className="bi bi-calendar-check mr-1"></i>
              Total Bookings
            </label>
            <p className="text-base text-gray-900">{property.totalBookings}</p>
          </div>
        </div>

        {/* Description */}
        {property.description && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              <i className="bi bi-file-text mr-2"></i>
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
          </div>
        )}

        {/* Features & Amenities */}
        {property.features && property.features.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-list-check mr-2"></i>
              Features & Amenities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <i className="bi bi-check-circle-fill text-green-600"></i>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host Information */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="bi bi-person-circle mr-2"></i>
            Host Information
          </h3>
          <div className="flex items-center gap-4">
            {property.hostProfileImage ? (
              <img
                src={property.hostProfileImage}
                alt={property.hostName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <i className="bi bi-person-fill text-3xl text-gray-500"></i>
              </div>
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">{property.hostName}</p>
              <p className="text-sm text-gray-600">Host ID: {property.hostId}</p>
            </div>
          </div>
        </div>

        {/* Availability */}
        {property.availability && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="bi bi-calendar-range mr-2"></i>
              Availability
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Status</label>
                <p className="text-base text-gray-900">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    property.availability.isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.availability.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </p>
              </div>

              {property.availability.availableFrom && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Available From</label>
                  <p className="text-base text-gray-900">{formatDate(property.availability.availableFrom)}</p>
                </div>
              )}

              {property.availability.availableTo && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Available Until</label>
                  <p className="text-base text-gray-900">{formatDate(property.availability.availableTo)}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600 block mb-1">Minimum Stay</label>
                <p className="text-base text-gray-900">
                  {property.availability.minStay} {property.availability.minStay === 1 ? 'night' : 'nights'}
                </p>
              </div>

              {property.availability.maxStay && (
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Maximum Stay</label>
                  <p className="text-base text-gray-900">
                    {property.availability.maxStay} {property.availability.maxStay === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              )}
            </div>

            {property.availability.blockedDates && property.availability.blockedDates.length > 0 && (
              <div className="mt-4">
                <label className="text-sm text-gray-600 block mb-2">Blocked Dates</label>
                <p className="text-sm text-gray-500">
                  {property.availability.blockedDates.length} {property.availability.blockedDates.length === 1 ? 'date' : 'dates'} blocked
                </p>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <i className="bi bi-clock-history mr-1"></i>
              Listed: {formatDate(property.createdAt)}
            </div>
            <div>
              <i className="bi bi-clock mr-1"></i>
              Last Updated: {formatDate(property.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
