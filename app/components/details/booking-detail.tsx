'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';
import AddressModal from '@/app/components/modals/AddressModal';
import { formatStatusDisplay, getStatusColor, getStatusIcon } from "@/app/utils/statusFormatter";

interface BookingDetailProps {
  id: string;
  bookingType?: 'property' | 'tour';
}

type UserRole = 'guest' | 'host' | 'agent' | 'tourguide';

interface BookingInfo {
  id: string;
  // Property booking fields
  propertyId?: number;
  property?: {
    name: string;
    location: string;
    images: any;
    pricePerNight: number;
    pricePerMonth?: number;
    pricingType?: 'night' | 'month';
    hostName: string;
    hostEmail: string;
    hostPhone?: string;
  };
  // Tour booking fields
  tourId?: string;
  tour?: {
    title: string;
    description: string;
    category: string;
    type: string;
    duration: number;
    difficulty: string;
    location: string;
    images: any;
    price: number;
    currency: string;
    inclusions: string[];
    exclusions: string[];
    requirements: string[];
    meetingPoint: string;
  };
  scheduleId?: string;
  schedule?: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    availableSlots: number;
    bookedSlots: number;
  };
  tourGuideId?: number;
  tourGuide?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage: string;
    bio: string | null;
    rating: number;
    totalTours: number;
  };
  // Guest info (common)
  guestId?: number;
  userId?: number;
  guest?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
  };
  // Booking details (common)
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  numberOfParticipants?: number;
  participants?: any[];
  totalAmount?: number;
  totalPrice?: number;
  pricePerNight?: number;
  subtotal?: number;
  cleaningFee?: number;
  serviceFee?: number;
  taxes?: number;
  currency?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentTiming?: string;
  checkInStatus?: string;
  message?: string;
  specialRequests?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundReason?: string | null;
  createdAt: string;
  updatedAt: string;
  bookingDate?: string;
  confirmationCode?: string;
  pricingType?: 'night' | 'month';
  isMonthlyBooking?: boolean;
  renewalDate?: string;
  // Legacy fields for backwards compatibility
  propertyName?: string;
  propertyImage?: string;
  propertyLocation?: string;
  guestName?: string;
  guestEmail?: string;
  hostId?: number;
  hostName?: string;
  hostEmail?: string;
}

export default function BookingDetail({ id, bookingType }: BookingDetailProps) {
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'property' | 'tour'>('property');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  });
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Fetch user role on component mount
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userSession = localStorage.getItem('userSession');
        if (userSession) {
          const session = JSON.parse(userSession);
          setUserRole(session.role || null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    getUserRole();
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;

        // If bookingType is specified, use it directly with the unified endpoint
        if (bookingType) {
          response = await api.getBooking(id, bookingType);
          setDetectedType(bookingType);
        } else {
          // Auto-detect: Try property endpoint first, then tour endpoint
          try {
            response = await api.getBooking(id, 'property');
            setDetectedType('property');
          } catch (propertyErr) {
            // If property endpoint fails, try tour endpoint
            try {
              response = await api.getBooking(id, 'tour');
              setDetectedType('tour');
            } catch (tourErr) {
              throw new Error('Booking not found in property or tour bookings');
            }
          }
        }

        if (response && response.ok && response.data.success) {
          const bookingData = response.data.data as BookingInfo;

          // Determine if this is a monthly booking and calculate renewal date
          const isMonthly = (bookingData as any).pricingType === 'month' ||
                           bookingData.property?.pricingType === 'month' ||
                           (bookingData as any).isMonthlyBooking;

          let renewalDate = bookingData.renewalDate;
          if (isMonthly && bookingData.checkIn && !renewalDate) {
            const checkInDate = new Date(bookingData.checkIn);
            const renewal = new Date(checkInDate);
            renewal.setMonth(renewal.getMonth() + 1);
            renewalDate = renewal.toISOString();
          }

          setBooking({
            ...bookingData,
            isMonthlyBooking: isMonthly,
            renewalDate,
          });
        } else {
          setError(response?.data?.message || 'Failed to load booking details');
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'An error occurred while loading booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, bookingType]);

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase().replace(/_/g, '-');

    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bi-check-circle-fill' },
      completed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bi-check-circle-fill' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bi-clock-fill' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bi-x-circle-fill' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bi-x-circle-fill' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bi-x-circle-fill' },
      'checked-in': { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bi-door-open-fill' },
      'checked-out': { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bi-door-closed-fill' },
    };

    const config = configs[statusLower] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'bi-circle' };

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <i className={`bi ${config.icon}`}></i>
        {formatStatusDisplay(status)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  // Helper functions to normalize data between property and tour bookings
  const getTitle = () => {
    if (detectedType === 'tour') {
      return booking?.tour?.title || 'Tour Booking';
    }
    return booking?.property?.name || booking?.propertyName || 'Property Booking';
  };

  const getLocation = () => {
    if (detectedType === 'tour') {
      return booking?.tour?.location || '';
    }
    return booking?.property?.location || booking?.propertyLocation || '';
  };

  const getMainImage = () => {
    if (detectedType === 'tour') {
      const images = booking?.tour?.images;
      if (images?.main && images.main.length > 0) return images.main[0];
      if (images?.gallery && images.gallery.length > 0) return images.gallery[0];
      return '';
    }
    // Property images
    if (booking?.property?.images) {
      const images = booking.property.images;
      const categories = ['exterior', 'livingRoom', 'bedroom', 'kitchen', 'bathroom', 'diningArea'];
      for (const category of categories) {
        if (images[category] && Array.isArray(images[category]) && images[category].length > 0) {
          return images[category][0];
        }
      }
    }
    return booking?.propertyImage || '';
  };

  const getGuestInfo = () => {
    const guestData = booking?.guest || booking?.user;
    if (guestData) {
      return {
        name: `${guestData.firstName || ''} ${guestData.lastName || ''}`.trim() || 'Guest',
        email: guestData.email || 'N/A',
        phone: guestData.phone || null
      };
    }
    return {
      name: booking?.guestName || 'Guest',
      email: booking?.guestEmail || 'N/A',
      phone: null
    };
  };

  const getHostInfo = () => {
    if (detectedType === 'tour' && booking?.tourGuide) {
      return {
        name: `${booking.tourGuide.firstName || ''} ${booking.tourGuide.lastName || ''}`.trim() || 'Tour Guide',
        email: booking.tourGuide.email || 'N/A',
        phone: booking.tourGuide.phone || null,
        role: 'Tour Guide'
      };
    }
    if (booking?.property) {
      return {
        name: booking.property.hostName || 'Host',
        email: booking.property.hostEmail || 'N/A',
        phone: booking.property.hostPhone || null,
        role: 'Host'
      };
    }
    return {
      name: booking?.hostName || 'Host',
      email: booking?.hostEmail || 'N/A',
      phone: null,
      role: 'Host'
    };
  };

  const getTotalAmount = () => {
    return booking?.totalAmount || booking?.totalPrice || 0;
  };

  const getPricePerNight = () => {
    if (detectedType === 'tour') {
      return booking?.tour?.price || 0;
    }
    // For property bookings, check nested property object first, then root level
    return booking?.property?.pricePerNight || booking?.pricePerNight || 0;
  };

  const getSubtotal = () => {
    // Try to calculate from available data if subtotal is not provided
    if (booking?.subtotal) return booking.subtotal;

    const pricePerNight = getPricePerNight();
    const nights = booking?.nights || 0;

    if (pricePerNight && nights) {
      return pricePerNight * nights;
    }

    return getTotalAmount();
  };

  const canCancelBooking = () => {
    if (!booking) return false;
    const status = booking.status?.toLowerCase();
    return userRole === 'guest' && (status === 'pending' || status === 'confirmed');
  };

  const shouldShowHostInfo = () => {
    if (!booking) return false;
    const status = booking.status?.toLowerCase().replace(/_/g, '-');
    // Show host info only for confirmed, checked-in, checked-out, and completed bookings
    return ['confirmed', 'checked-in', 'checked-out', 'completed'].includes(status);
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setNotification({
        show: true,
        message: 'Please provide a reason for cancellation',
        type: 'error'
      });
      return;
    }

    try {
      setCancelling(true);
      await api.cancelPropertyBooking(id, cancelReason);

      setNotification({
        show: true,
        message: 'Booking cancelled successfully',
        type: 'success'
      });

      // Refresh booking data
      const response = await api.getBooking(id, detectedType);
      if (response && response.ok && response.data.success) {
        setBooking(response.data.data);
      }

      setShowCancelModal(false);
      setCancelReason('');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setNotification({
        show: true,
        message: err?.data?.message || 'Failed to cancel booking. Please try again.',
        type: 'error'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#083A85] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <i className="bi bi-exclamation-triangle text-2xl text-red-600"></i>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                Error Loading Booking
              </h3>
              <p className="text-red-700">{error || 'Booking not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const guestInfo = getGuestInfo();
  const hostInfo = getHostInfo();
  const mainImage = getMainImage();
  const title = getTitle();
  const location = getLocation();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Notification */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`rounded-xl p-4 shadow-lg ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <i className={`bi ${
                notification.type === 'success' ? 'bi-check-circle-fill text-green-600' :
                notification.type === 'error' ? 'bi-exclamation-circle-fill text-red-600' :
                'bi-info-circle-fill text-blue-600'
              } text-xl flex-shrink-0 mt-0.5`}></i>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-900' :
                  notification.type === 'error' ? 'text-red-900' :
                  'text-blue-900'
                }`}>{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Image and Status */}
      <div className="relative mb-8">
        {mainImage ? (
          <div className="relative h-96 rounded-3xl overflow-hidden shadow-xl">
            <img
              src={mainImage}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3">{title}</h1>
                  {location && (
                    <div className="flex items-center gap-2 text-white/90 text-lg">
                      <i className="bi bi-geo-alt-fill"></i>
                      <span>{location}</span>
                    </div>
                  )}
                </div>
                <div className="ml-auto">
                  {getStatusBadge(booking.status || 'pending')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-64 rounded-3xl flex items-center justify-center shadow-xl">
            <div className="text-center text-white p-8">
              <i className={`bi ${detectedType === 'tour' ? 'bi-compass' : 'bi-house-door'} text-6xl mb-4 opacity-50`}></i>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              {location && <p className="text-xl opacity-90 mb-4">{location}</p>}
              {getStatusBadge(booking.status || 'pending')}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {booking.checkIn && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-1">
                  <i className="bi bi-calendar-check mr-1"></i>Check-in
                </div>
                <div className="text-gray-900 font-semibold text-lg">
                  {formatDate(booking.checkIn)}
                </div>
              </div>
            )}

            {booking.checkOut && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-1">
                  <i className="bi bi-calendar-x mr-1"></i>Check-out
                </div>
                <div className="text-gray-900 font-semibold text-lg">
                  {formatDate(booking.checkOut)}
                </div>
              </div>
            )}

            {booking.nights && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200">
                <div className="text-amber-600 text-sm font-medium mb-1">
                  <i className="bi bi-moon-stars mr-1"></i>Duration
                </div>
                <div className="text-gray-900 font-semibold text-lg">
                  {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-1">
                <i className="bi bi-people mr-1"></i>{detectedType === 'tour' ? 'Participants' : 'Guests'}
              </div>
              <div className="text-gray-900 font-semibold text-lg">
                {booking.guests || booking.numberOfParticipants || 0}
              </div>
            </div>

            {booking.isMonthlyBooking && booking.renewalDate && (
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200 md:col-span-2">
                <div className="text-indigo-600 text-sm font-medium mb-1">
                  <i className="bi bi-arrow-repeat mr-1"></i>Next Renewal
                </div>
                <div className="text-gray-900 font-semibold text-lg">
                  {formatDate(booking.renewalDate)}
                </div>
                <div className="text-xs text-indigo-600 mt-1">Monthly booking</div>
              </div>
            )}
          </div>

          {/* People Involved Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <i className="bi bi-person-circle text-blue-600"></i>
              People Involved
            </h2>

            <div className={`grid ${shouldShowHostInfo() ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-md'} gap-6`}>
              {/* Guest Card */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-5 border border-blue-100">
                <div className="text-sm font-medium text-blue-600 mb-3 uppercase tracking-wide">Guest</div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                    {guestInfo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-lg truncate">{guestInfo.name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <i className="bi bi-envelope flex-shrink-0"></i>
                      <span className="truncate">{guestInfo.email}</span>
                    </div>
                    {guestInfo.phone && (
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <i className="bi bi-telephone flex-shrink-0"></i>
                        <span>{guestInfo.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Host/Tour Guide Card - Only show for confirmed/checked-in/checked-out bookings */}
              {shouldShowHostInfo() && (
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border border-purple-100">
                  <div className="text-sm font-medium text-purple-600 mb-3 uppercase tracking-wide">{hostInfo.role}</div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg flex-shrink-0">
                      {hostInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-lg truncate">{hostInfo.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <i className="bi bi-envelope flex-shrink-0"></i>
                        <span className="truncate">{hostInfo.email}</span>
                      </div>
                      {hostInfo.phone && (
                        <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <i className="bi bi-telephone flex-shrink-0"></i>
                          <span>{hostInfo.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info message when host info is hidden */}
            {!shouldShowHostInfo() && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <i className="bi bi-info-circle-fill text-amber-600 text-lg flex-shrink-0 mt-0.5"></i>
                  <div className="text-sm text-amber-900">
                    <p className="font-medium mb-1">Host information not yet available</p>
                    <p>Host contact details will be shared once your booking is confirmed.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tour Specific Details */}
          {detectedType === 'tour' && booking.tour && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <i className="bi bi-compass text-green-600"></i>
                Tour Details
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-clock text-green-600"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="font-medium text-gray-900">{booking.tour.duration} hours</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-speedometer text-amber-600"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Difficulty</div>
                    <div className="font-medium text-gray-900 capitalize">{booking.tour.difficulty}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-tag text-blue-600"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Category</div>
                    <div className="font-medium text-gray-900">{booking.tour.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-diagram-3 text-purple-600"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="font-medium text-gray-900 capitalize">{booking.tour.type}</div>
                  </div>
                </div>
              </div>

              {booking.tour.meetingPoint && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <i className="bi bi-geo-alt-fill text-blue-600 text-xl mt-0.5 flex-shrink-0"></i>
                    <div>
                      <div className="font-medium text-blue-900 mb-1">Meeting Point</div>
                      <div className="text-blue-700">{booking.tour.meetingPoint}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Section */}
          {(booking.message || booking.specialRequests) && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="bi bi-chat-left-text text-indigo-600"></i>
                Messages & Requests
              </h2>
              {booking.message && (
                <div className="mb-4 last:mb-0">
                  <div className="text-sm font-medium text-gray-500 mb-2">Booking Message</div>
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{booking.message}</p>
                  </div>
                </div>
              )}
              {booking.specialRequests && (
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Special Requests</div>
                  <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-200">
                    <p className="text-gray-700 leading-relaxed">{booking.specialRequests}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancellation Info */}
          {(booking.cancellationReason || booking.refundReason) && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <i className="bi bi-x-circle-fill text-2xl text-red-600"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 text-lg mb-2">Cancellation Details</h3>
                  <p className="text-red-800 mb-3">{booking.cancellationReason || booking.refundReason}</p>
                  {booking.refundAmount && (
                    <div className="inline-flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg">
                      <i className="bi bi-cash-coin text-red-700"></i>
                      <span className="text-sm text-red-700">Refund: <span className="font-semibold">{formatAmount(booking.refundAmount)}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Price Card */}
            <div className="border-2 border-gray-300 rounded-2xl p-6 shadow-lg bg-white">
              {/* Confirmation code - Only visible to guests */}
              {userRole === 'guest' && (
                <div className="mb-6">
                  <div className="text-sm text-gray-600 mb-1">Confirmation code</div>
                  <div className="font-mono text-xl font-bold text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{booking.confirmationCode || booking.id.substring(0, 8).toUpperCase()}</div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Price details</h3>
                  {booking.isMonthlyBooking && (
                    <span className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      Monthly
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {getPricePerNight() > 0 && booking.nights && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">
                        {formatAmount(getPricePerNight())} x {booking.nights} {booking.isMonthlyBooking ? 'month' : (booking.nights === 1 ? 'night' : 'nights')}
                      </span>
                      <span className="font-medium">{formatAmount(getSubtotal())}</span>
                    </div>
                  )}

                  {(booking.cleaningFee || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Cleaning fee</span>
                      <span className="font-medium">{formatAmount(booking.cleaningFee || 0)}</span>
                    </div>
                  )}

                  {(booking.serviceFee || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Service fee</span>
                      <span className="font-medium">{formatAmount(booking.serviceFee || 0)}</span>
                    </div>
                  )}

                  {(booking.taxes || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Taxes</span>
                      <span className="font-medium">{formatAmount(booking.taxes || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t-2 border-gray-900 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-bold text-gray-900 text-2xl">{formatAmount(getTotalAmount())}</span>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <i className="bi bi-info-circle text-blue-600"></i>
                Booking information
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Booking ID</div>
                  <div className="font-mono text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">{booking.id}</div>
                </div>

                {booking.paymentStatus && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment Status</div>
                    <div className="text-sm text-gray-900 capitalize font-medium">{booking.paymentStatus}</div>
                  </div>
                )}

                {booking.paymentTiming && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment timing</div>
                    <div className="text-sm text-gray-900 capitalize">{booking.paymentTiming}</div>
                  </div>
                )}

                {booking.paymentMethod && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Payment method</div>
                    <div className="text-sm text-gray-900 capitalize">{booking.paymentMethod}</div>
                  </div>
                )}

                {(booking.createdAt || booking.bookingDate) && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Booked on</div>
                    <div className="text-sm text-gray-900">{formatDateTime(booking.createdAt || booking.bookingDate || '')}</div>
                  </div>
                )}
              </div>
            </div>

            {/* View Directions Button */}
            {location && (
              <button
                onClick={() => setShowAddressModal(true)}
                className="w-full px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#062d65] transition-all font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                <i className="bi bi-signpost-2"></i>
                View Directions
              </button>
            )}

            {/* Cancel Booking Button - Only for guests with cancellable bookings */}
            {canCancelBooking() && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2">
                <i className="bi bi-x-circle"></i>
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCancelModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel booking</h3>
                <p className="text-gray-600 mb-4">Please tell us why you're canceling. This helps us improve our service.</p>

                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] resize-none h-32"
                  disabled={cancelling}
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                    }}
                    disabled={cancelling}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
                    Keep booking
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={!cancelReason.trim() || cancelling}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:hover:bg-red-600 flex items-center justify-center gap-2">
                    {cancelling ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cancelling...
                      </>
                    ) : (
                      'Cancel booking'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        propertyName={title}
        address={location}
        latitude={undefined}
        longitude={undefined}
      />
    </div>
  );
}
