'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/app/api/apiService';
import AlertNotification from '@/app/components/notify';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'checkin' | 'checkout';
  userType: 'host' | 'tourguide';
}

interface BookingDetails {
  bookingId: string;
  guest: {
    name: string;
    phone: string;
    email: string;
    guestCount: number;
  };
  booking: {
    amount: number;
    currency: string;
    paymentStatus: string;
    bookingDate: string;
  };
  schedule: {
    checkInDate: string;
    checkOutDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    duration?: string;
  };
  property: {
    type: string;
    name: string;
    location: string;
  };
  rules?: string[];
  status: string;
  isAlreadyCheckedIn?: boolean;
  specialRequests?: string;
  notes?: string;
}

// Helper function to calculate duration between dates
const calculateDuration = (checkIn: string, checkOut: string): string => {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} ${diffDays === 1 ? 'night' : 'nights'}`;
  } catch {
    return 'N/A';
  }
};

const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  isOpen,
  onClose,
  action,
  userType,
}) => {
  const [bookingId, setBookingId] = React.useState('');
  const [bookingCode, setBookingCode] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [step, setStep] = React.useState<1 | 2>(1); // Two-step process
  const [bookingDetails, setBookingDetails] = React.useState<BookingDetails | null>(null);

  // Payment at property flow
  const [paymentUrl, setPaymentUrl] = React.useState<string | null>(null);
  const [paymentReference, setPaymentReference] = React.useState('');
  const [showPaymentPrompt, setShowPaymentPrompt] = React.useState(false);
  const [countdown, setCountdown] = React.useState(20);
  const [paymentVerified, setPaymentVerified] = React.useState(false);

  // Notification state - handled internally
  const [notification, setNotification] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ message, type });
  };

  const onSuccess = (message: string) => {
    showNotification(message, 'success');
  };

  const onError = (message: string) => {
    showNotification(message, 'error');
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCloseModal = () => {
    if (!loading) {
      setBookingId('');
      setBookingCode('');
      setInstructions('');
      setStep(1);
      setBookingDetails(null);
      setPaymentUrl(null);
      setPaymentReference('');
      setShowPaymentPrompt(false);
      setCountdown(20);
      setPaymentVerified(false);
      onClose();
    }
  };

  // Countdown timer for payment redirect
  useEffect(() => {
    if (showPaymentPrompt && paymentUrl && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Auto-open payment URL when countdown reaches 0
    if (showPaymentPrompt && paymentUrl && countdown === 0) {
      window.open(paymentUrl, '_blank');
    }
  }, [showPaymentPrompt, paymentUrl, countdown]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleCloseModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading]);

  // Step 1: Retrieve booking details
  const handleGetBookingDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId.trim()) {
      onError('Please enter a booking ID');
      return;
    }

    try {
      setLoading(true);

      // Call the verify-booking endpoint to get booking details
      console.log('Fetching booking details for:', bookingId.trim());

      const response = await api.post('/checkin/verify-booking', { bookingId: bookingId.trim() });

      console.log('API Response:', response);

      if (response.data.success) {
        // Check if payment at property is required
        const message = response.data.message || '';
        const hasPaymentUrl = response.data.data?.paymentUrl;

        if (hasPaymentUrl && message.includes('This booking requires payment at the property')) {
          // Show payment prompt
          setPaymentUrl(response.data.data.paymentUrl);
          setShowPaymentPrompt(true);
          setCountdown(20); // Reset countdown
          return;
        }

        // Map backend response to frontend expected format
        const backendData = response.data.data;

        const mappedDetails: BookingDetails = {
          bookingId: backendData.id,
          guest: {
            name: `${backendData.guest.firstName} ${backendData.guest.lastName}`,
            phone: backendData.guest.phone || 'Not provided',
            email: backendData.guest.email,
            guestCount: backendData.guests
          },
          booking: {
            amount: backendData.totalPrice,
            currency: backendData.currency?.toUpperCase() || 'USD',
            paymentStatus: backendData.paymentStatus,
            bookingDate: backendData.bookingDate
          },
          schedule: {
            checkInDate: backendData.checkIn,
            checkOutDate: backendData.checkOut,
            checkInTime: backendData.checkInTime,
            checkOutTime: backendData.checkOutTime,
            duration: calculateDuration(backendData.checkIn, backendData.checkOut)
          },
          property: {
            type: backendData.type?.toLowerCase() || 'accommodation',
            name: backendData.property?.name || backendData.tour?.name || 'N/A',
            location: backendData.property?.location || backendData.tour?.location || 'N/A'
          },
          rules: backendData.property?.rules || backendData.tour?.rules || [],
          status: backendData.status || 'CONFIRMED',
          isAlreadyCheckedIn: backendData.checkInValidated || false,
          specialRequests: backendData.specialRequests || backendData.message,
          notes: backendData.notes
        };

        setBookingDetails(mappedDetails);
        setStep(2); // Move to step 2
      } else {
        onError(response.data.message || 'Failed to retrieve booking details');
      }
    } catch (err: any) {
      console.error('Error retrieving booking details:', err);
      console.error('Error details:', {
        status: err?.status,
        response: err?.response,
        data: err?.data,
        message: err?.message
      });

      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to retrieve booking details. Please ensure the backend endpoint is implemented.';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm check-in with booking code
  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingCode.trim()) {
      onError('Please enter the booking code');
      return;
    }

    if (bookingCode.trim().length !== 6) {
      onError('Booking code must be 6 characters');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/checkin/confirm', {
        bookingId: bookingId.trim(),
        bookingCode: bookingCode.trim().toUpperCase(),
        instructions: instructions.trim() || undefined, // Send instructions if provided
      });

      if (response.data.success) {
        const successMessage = instructions.trim()
          ? 'Check-in confirmed successfully! Instructions sent to guest. Funds have been released.'
          : 'Check-in confirmed successfully! Funds have been released.';
        onSuccess(successMessage);
        setBookingId('');
        setBookingCode('');
        setInstructions('');
        setStep(1);
        setBookingDetails(null);
        onClose();
      } else {
        onError(response.data.message || 'Failed to confirm check-in');
      }
    } catch (err: any) {
      console.error('Error confirming check-in:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to confirm check-in';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkout (keeps original single-step process)
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId.trim()) {
      onError('Please enter a booking ID');
      return;
    }

    try {
      setLoading(true);

      let endpoint = '';
      if (userType === 'host') {
        endpoint = `/bookings/properties/${bookingId}/checkout`;
      } else if (userType === 'tourguide') {
        endpoint = `/bookings/tourguide/${bookingId}/checkout`;
      }

      const response = await api.patch(endpoint);

      if (response.data.success) {
        onSuccess('Check-out confirmed successfully!');
        setBookingId('');
        onClose();
      } else {
        onError(response.data.message || 'Failed to confirm check-out');
      }
    } catch (err: any) {
      console.error('Error confirming check-out:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to confirm check-out';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setBookingCode('');
    setInstructions('');
    setBookingDetails(null);
  };

  // Copy payment URL to clipboard
  const handleCopyPaymentUrl = async () => {
    if (paymentUrl) {
      try {
        await navigator.clipboard.writeText(paymentUrl);
        onSuccess('Payment link copied to clipboard!');
      } catch (error) {
        onError('Failed to copy link');
      }
    }
  };

  // Verify payment reference
  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentReference.trim()) {
      onError('Please enter the transaction reference');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/checkin/collect-payment', {
        transactionReference: paymentReference.trim()
      });

      if (response.data.success) {
        setPaymentVerified(true);
        setShowPaymentPrompt(false);
        onSuccess('Payment verified successfully!');

        // Refetch booking details now that payment is verified
        const bookingResponse = await api.post('/checkin/verify-booking', {
          bookingId: bookingId.trim()
        });

        if (bookingResponse.data.success) {
          const backendData = bookingResponse.data.data;

          const mappedDetails: BookingDetails = {
            bookingId: backendData.id,
            guest: {
              name: `${backendData.guest.firstName} ${backendData.guest.lastName}`,
              phone: backendData.guest.phone || 'Not provided',
              email: backendData.guest.email,
              guestCount: backendData.guests
            },
            booking: {
              amount: backendData.totalPrice,
              currency: backendData.currency?.toUpperCase() || 'USD',
              paymentStatus: backendData.paymentStatus,
              bookingDate: backendData.bookingDate
            },
            schedule: {
              checkInDate: backendData.checkIn,
              checkOutDate: backendData.checkOut,
              checkInTime: backendData.checkInTime,
              checkOutTime: backendData.checkOutTime,
              duration: calculateDuration(backendData.checkIn, backendData.checkOut)
            },
            property: {
              type: backendData.type?.toLowerCase() || 'accommodation',
              name: backendData.property?.name || backendData.tour?.name || 'N/A',
              location: backendData.property?.location || backendData.tour?.location || 'N/A'
            },
            rules: backendData.property?.rules || backendData.tour?.rules || [],
            status: backendData.status || 'CONFIRMED',
            isAlreadyCheckedIn: backendData.checkInValidated || false,
            specialRequests: backendData.specialRequests || backendData.message,
            notes: backendData.notes
          };

          setBookingDetails(mappedDetails);
          setStep(2); // Move to step 2
        }
      } else {
        onError(response.data.message || 'Invalid payment reference');
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to verify payment';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend booking code to guest
  const handleResendBookingCode = async () => {
    if (!bookingDetails) return;

    try {
      setLoading(true);

      const response = await api.post('/checkin/resend-code', {
        bookingId: bookingDetails.bookingId
      });

      if (response.data.success) {
        onSuccess(`Booking code sent to ${bookingDetails.guest.email}`);
      } else {
        onError(response.data.message || 'Failed to resend booking code');
      }
    } catch (err: any) {
      console.error('Error resending booking code:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to resend booking code';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleCloseModal();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Modal Content */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        {/* Header */}
        <div
          className={`relative px-6 py-5 border-b border-gray-100 ${
            action === 'checkin'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50'
              : 'bg-gradient-to-r from-orange-50 to-amber-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                  action === 'checkin'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                <i
                  className={`bi ${
                    action === 'checkin' ? 'bi-door-open' : 'bi-door-closed'
                  } text-2xl`}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Confirm {action === 'checkin' ? 'Check-in' : 'Check-out'}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  {userType === 'host' ? 'Property Booking' : 'Tour Reservation'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all"
              disabled={loading}
              title="Close (ESC)"
            >
              <i className="bi bi-x-lg text-xl" />
            </button>
          </div>
        </div>

        {/* Body */}
        {showPaymentPrompt && paymentUrl ? (
          // Payment at Property Prompt
          <form onSubmit={handleVerifyPayment}>
            <div className="px-6 py-6 space-y-5">
              {/* Payment Required Notice */}
              <div className="rounded-xl p-4 border bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <i className="bi bi-exclamation-triangle-fill text-lg mt-0.5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-900">
                      Payment Required at Property
                    </p>
                    <p className="text-xs mt-1 text-yellow-800">
                      This booking requires payment verification before check-in can be confirmed
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Link with Countdown */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Payment Link for Guest
                </label>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-link-45deg text-blue-600 text-xl" />
                      <span className="text-sm font-medium text-blue-900">
                        Share this link with the guest
                      </span>
                    </div>
                    {countdown > 0 && (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {countdown}s
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-lg p-3 mb-3 break-all text-sm text-gray-700 border border-blue-200">
                    {paymentUrl}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPaymentUrl}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <i className="bi bi-clipboard" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(paymentUrl, '_blank')}
                      disabled={loading}
                      className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <i className="bi bi-box-arrow-up-right" />
                      Open
                    </button>
                  </div>

                  {countdown > 0 ? (
                    <p className="text-xs text-blue-700 mt-3 text-center">
                      <i className="bi bi-clock-history mr-1" />
                      Link will open automatically in {countdown} second{countdown !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 mt-3 text-center font-medium">
                      <i className="bi bi-check-circle mr-1" />
                      Payment link opened in new tab
                    </p>
                  )}
                </div>
              </div>

              {/* Transaction Reference Input */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="bi bi-receipt text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter transaction reference or external ID"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all text-gray-900 placeholder-gray-400"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <i className="bi bi-lightbulb text-amber-500" />
                  Ask the guest for their transaction reference after they complete payment
                </p>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !paymentReference.trim()}
                className="flex-1 px-5 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-repeat animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-check-circle" />
                    Verify Payment
                  </span>
                )}
              </button>
            </div>
          </form>
        ) : action === 'checkout' ? (
          // Checkout: Single-step process
          <form onSubmit={handleCheckout}>
            <div className="px-6 py-6 space-y-5">
              <div className="rounded-xl p-4 border bg-orange-50/50 border-orange-200">
                <div className="flex items-start gap-3">
                  <i className="bi bi-info-circle text-lg mt-0.5 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-900">
                      Confirm that your {userType === 'host' ? 'guest' : 'tour participant'} has departed
                    </p>
                    <p className="text-xs mt-1 text-orange-700">
                      Enter the booking ID to proceed with the confirmation
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Booking ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="bi bi-hash text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g., BK-12345678"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all text-gray-900 placeholder-gray-400"
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !bookingId.trim()}
                className="flex-1 px-5 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-repeat animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-door-closed" />
                    Confirm Check-out
                  </span>
                )}
              </button>
            </div>
          </form>
        ) : step === 1 ? (
          // Check-in Step 1: Enter Booking ID
          <form onSubmit={handleGetBookingDetails}>
            <div className="px-6 py-6 space-y-5">
              <div className="rounded-xl p-4 border bg-green-50/50 border-green-200">
                <div className="flex items-start gap-3">
                  <i className="bi bi-info-circle text-lg mt-0.5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Step 1 of 2: Retrieve Booking Details
                    </p>
                    <p className="text-xs mt-1 text-green-700">
                      Enter the booking ID to view guest information and booking details
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Booking ID <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="bi bi-hash text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g., BK-12345678"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all text-gray-900 placeholder-gray-400"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <i className="bi bi-lightbulb text-amber-500" />
                  Find the booking ID in your {userType === 'host' ? 'bookings' : 'reservations'} list
                </p>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !bookingId.trim()}
                className="flex-1 px-5 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-repeat animate-spin" />
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-right-circle" />
                    Get Booking Details
                  </span>
                )}
              </button>
            </div>
          </form>
        ) : (
          // Check-in Step 2: Show booking details and enter booking code
          <form onSubmit={handleConfirmCheckIn}>
            <div className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    disabled={loading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Step 2 of 2</p>
                    <p className="text-xs text-gray-500">Verify and confirm check-in</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>

              {/* Booking Details */}
              {bookingDetails && (
                <div className="space-y-4">
                  {/* Guest Information */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <i className="bi bi-person-circle" />
                      Guest Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Name:</span>
                        <span className="font-semibold text-blue-900">{bookingDetails.guest.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Phone:</span>
                        <span className="font-semibold text-blue-900">{bookingDetails.guest.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Email:</span>
                        <span className="font-semibold text-blue-900">{bookingDetails.guest.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Guests:</span>
                        <span className="font-semibold text-blue-900">{bookingDetails.guest.guestCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <i className="bi bi-calendar-check" />
                      Booking Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Booking ID:</span>
                        <span className="font-semibold text-purple-900">{bookingDetails.bookingId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Amount:</span>
                        <span className="font-semibold text-purple-900">
                          {bookingDetails.booking.currency} {bookingDetails.booking.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Payment Status:</span>
                        <span className="font-semibold text-purple-900">{bookingDetails.booking.paymentStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <i className="bi bi-clock-history" />
                      Schedule
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-700">Check-in:</span>
                        <span className="font-semibold text-amber-900">
                          {new Date(bookingDetails.schedule.checkInDate).toLocaleDateString()}
                          {bookingDetails.schedule.checkInTime && ` at ${bookingDetails.schedule.checkInTime}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700">Check-out:</span>
                        <span className="font-semibold text-amber-900">
                          {new Date(bookingDetails.schedule.checkOutDate).toLocaleDateString()}
                          {bookingDetails.schedule.checkOutTime && ` at ${bookingDetails.schedule.checkOutTime}`}
                        </span>
                      </div>
                      {bookingDetails.schedule.duration && (
                        <div className="flex justify-between">
                          <span className="text-amber-700">Duration:</span>
                          <span className="font-semibold text-amber-900">{bookingDetails.schedule.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Property Details */}
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
                      <i className="bi bi-building" />
                      {bookingDetails.property.type === 'tour' ? 'Tour' : 'Property'} Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Name:</span>
                        <span className="font-semibold text-green-900">{bookingDetails.property.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Location:</span>
                        <span className="font-semibold text-green-900">{bookingDetails.property.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rules */}
                  {bookingDetails.rules && bookingDetails.rules.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                        <i className="bi bi-exclamation-triangle" />
                        Rules & Guidelines
                      </h4>
                      <ul className="space-y-1.5 text-sm text-red-800">
                        {bookingDetails.rules.map((rule, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <i className="bi bi-dot text-lg mt-[-4px]" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Special Requests */}
                  {bookingDetails.specialRequests && (
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                      <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <i className="bi bi-chat-left-quote" />
                        Special Requests
                      </h4>
                      <p className="text-sm text-indigo-800">{bookingDetails.specialRequests}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Booking Code Input */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    Booking Code <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendBookingCode}
                    disabled={loading}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    <i className="bi bi-send" />
                    Resend Code
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="bi bi-key text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all text-gray-900 placeholder-gray-400 uppercase tracking-wider font-mono text-lg"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <i className="bi bi-shield-check text-green-500" />
                  Ask the guest for their 6-character booking code
                </p>
              </div>

              {/* Instructions for Guest */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Instructions for Guest <span className="text-gray-400">(Optional)</span>
                </label>

                {/* Quick Suggestion Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = "WiFi Network: [Your Network]\nPassword: [Your Password]";
                      setInstructions(prev => prev ? `${prev}\n${suggestion}` : suggestion);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="bi bi-wifi" />
                    WiFi Info
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = "Parking: Available at [location]";
                      setInstructions(prev => prev ? `${prev}\n${suggestion}` : suggestion);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="bi bi-p-circle" />
                    Parking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = "Key/Access: [Details about how to access the property]";
                      setInstructions(prev => prev ? `${prev}\n${suggestion}` : suggestion);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="bi bi-key" />
                    Keys/Access
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = "House Rules:\n- Check-out time: [time]\n- Quiet hours: [time]\n- No smoking inside";
                      setInstructions(prev => prev ? `${prev}\n${suggestion}` : suggestion);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="bi bi-list-check" />
                    Rules
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const suggestion = "Emergency Contact: [Your phone number]";
                      setInstructions(prev => prev ? `${prev}\n${suggestion}` : suggestion);
                    }}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <i className="bi bi-telephone" />
                    Emergency
                  </button>
                  {instructions && (
                    <button
                      type="button"
                      onClick={() => setInstructions('')}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <i className="bi bi-x-circle" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-4 pointer-events-none">
                    <i className="bi bi-chat-left-text text-gray-400" />
                  </div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Click suggestions above or type your own instructions..."
                    rows={5}
                    maxLength={500}
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-all text-gray-900 placeholder-gray-400 resize-none"
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <i className="bi bi-info-circle text-blue-500" />
                    <span>This will be sent to the guest via email/SMS</span>
                  </div>
                  <span className={instructions.length > 450 ? 'text-orange-500 font-semibold' : ''}>
                    {instructions.length}/500
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleBackToStep1}
                disabled={loading}
                className="px-5 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-white hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="bi bi-arrow-left mr-2" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !bookingCode.trim() || bookingCode.trim().length !== 6}
                className="flex-1 px-5 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-arrow-repeat animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="bi bi-check-circle-fill" />
                    Confirm Check-in
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );

  // Render modal in a portal at document.body level
  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Notification - Rendered at higher z-index than modal */}
      {notification && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          position="top-right"
          size="md"
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default CheckInOutModal;
