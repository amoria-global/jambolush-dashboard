'use client';

import React, { useEffect, useState } from 'react';
import api from '@/app/api/apiService';

interface BookingDetailProps {
  id: string;
  bookingType?: 'property' | 'tour';
}

interface BookingInfo {
  id: string;
  propertyId: number;
  propertyName: string;
  propertyImage: string;
  propertyLocation: string;
  guestId: number;
  guestName: string;
  guestEmail: string;
  hostId: number;
  hostName: string;
  hostEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  totalPrice: number;
  status: string;
  paymentMethod?: string;
  paymentTiming: string;
  message?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
  confirmationCode: string;
}

export default function BookingDetail({ id, bookingType }: BookingDetailProps) {
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'property' | 'tour'>('property');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;

        // If bookingType is specified, use it directly
        if (bookingType) {
          if (bookingType === 'tour') {
            response = await api.get<any>(`/bookings/tours/${id}`);
            setDetectedType('tour');
          } else {
            response = await api.getPropertyBooking(id);
            setDetectedType('property');
          }
        } else {
          // Auto-detect: Try property endpoint first, then tour endpoint
          try {
            response = await api.getPropertyBooking(id);
            setDetectedType('property');
          } catch (propertyErr) {
            // If property endpoint fails, try tour endpoint
            try {
              response = await api.get<any>(`/bookings/tours/${id}`);
              setDetectedType('tour');
            } catch (tourErr) {
              throw new Error('Booking not found in property or tour bookings');
            }
          }
        }

        if (response && response.ok && response.data.success) {
          setBooking(response.data.data);
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
    const statusLower = status?.toLowerCase();

    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bi-check-circle-fill' },
      completed: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bi-check-circle-fill' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bi-clock-fill' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bi-x-circle-fill' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bi-x-circle-fill' },
      'checked-in': { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bi-door-open-fill' },
    };

    const config = configs[statusLower] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'bi-circle' };

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <i className={`bi ${config.icon}`}></i>
        {status}
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Section */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {booking.propertyName || 'Property Booking'}
                </h1>
                {booking.propertyLocation && (
                  <div className="flex items-center text-gray-600">
                    <i className="bi bi-geo-alt mr-1.5"></i>
                    <span>{booking.propertyLocation}</span>
                  </div>
                )}
              </div>
              {getStatusBadge(booking.status || 'pending')}
            </div>
          </div>

          {/* Property Image */}
          {booking.propertyImage && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-md">
              <img
                src={booking.propertyImage}
                alt={booking.propertyName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Stay Details */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your stay</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Check-in</div>
                <div className="text-base font-medium text-gray-900">{booking.checkIn ? formatDate(booking.checkIn) : 'N/A'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Check-out</div>
                <div className="text-base font-medium text-gray-900">{booking.checkOut ? formatDate(booking.checkOut) : 'N/A'}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Duration</div>
                <div className="text-base font-medium text-gray-900">
                  {booking.nights || 0} {(booking.nights || 0) === 1 ? 'night' : 'nights'}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Guests</div>
                <div className="text-base font-medium text-gray-900">
                  {booking.guests || 0} {(booking.guests || 0) === 1 ? 'guest' : 'guests'}
                </div>
              </div>
            </div>
          </div>

          {/* Guest & Host Info */}
          <div className="border-t border-gray-200 pt-8 space-y-6">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Guest</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#083A85] flex items-center justify-center text-white font-semibold text-lg">
                  {booking.guestName ? booking.guestName.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{booking.guestName || 'Guest'}</div>
                  <div className="text-sm text-gray-600">{booking.guestEmail || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500 mb-2">Host</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-lg">
                  {booking.hostName ? booking.hostName.charAt(0).toUpperCase() : 'H'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{booking.hostName || 'Host'}</div>
                  <div className="text-sm text-gray-600">{booking.hostEmail || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Message */}
          {booking.message && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Message from guest</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed">{booking.message}</p>
              </div>
            </div>
          )}

          {/* Cancellation Info */}
          {booking.cancellationReason && (
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <i className="bi bi-x-circle-fill text-2xl text-red-600 mt-0.5"></i>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">Cancellation reason</h3>
                    <p className="text-red-800 mb-3">{booking.cancellationReason}</p>
                    {booking.refundAmount && (
                      <div className="text-sm text-red-700">
                        Refund amount: <span className="font-semibold">{formatAmount(booking.refundAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {/* Price Card */}
            <div className="border border-gray-300 rounded-2xl p-6 shadow-lg">
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-1">Confirmation code</div>
                <div className="font-mono text-xl font-bold text-gray-900">{booking.confirmationCode || 'N/A'}</div>
              </div>

              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Price details</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span className="underline">
                      {formatAmount(booking.pricePerNight || 0)} x {booking.nights || 0} {(booking.nights || 0) === 1 ? 'night' : 'nights'}
                    </span>
                    <span>{formatAmount(booking.subtotal || 0)}</span>
                  </div>

                  {(booking.cleaningFee || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Cleaning fee</span>
                      <span>{formatAmount(booking.cleaningFee)}</span>
                    </div>
                  )}

                  {(booking.serviceFee || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Service fee</span>
                      <span>{formatAmount(booking.serviceFee)}</span>
                    </div>
                  )}

                  {(booking.taxes || 0) > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Taxes</span>
                      <span>{formatAmount(booking.taxes)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-900 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-gray-900 text-lg">{formatAmount(booking.totalPrice || 0)}</span>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            <div className="mt-6 border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Booking information</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Booking ID</div>
                  <div className="font-mono text-sm text-gray-900">{booking.id || 'N/A'}</div>
                </div>

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

                {booking.createdAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Booked on</div>
                    <div className="text-sm text-gray-900">{formatDateTime(booking.createdAt)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
