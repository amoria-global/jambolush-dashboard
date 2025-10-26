'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/app/api/apiService';

interface CheckInOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'checkin' | 'checkout';
  userType: 'host' | 'tourguide';
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const CheckInOutModal: React.FC<CheckInOutModalProps> = ({
  isOpen,
  onClose,
  action,
  userType,
  onSuccess,
  onError,
}) => {
  const [bookingId, setBookingId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleCloseModal = () => {
    if (!loading) {
      setBookingId('');
      onClose();
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingId.trim()) {
      onError('Please enter a booking ID');
      return;
    }

    try {
      setLoading(true);

      let endpoint = '';
      if (userType === 'host') {
        endpoint = `/bookings/properties/${bookingId}/${action}`;
      } else if (userType === 'tourguide') {
        endpoint = `/bookings/tourguide/${bookingId}/${action}`;
      }

      const response = await api.patch(endpoint);

      if (response.data.success) {
        onSuccess(
          `${action === 'checkin' ? 'Check-in' : 'Check-out'} confirmed successfully!`
        );
        setBookingId('');
        onClose();
      } else {
        onError(response.data.message || `Failed to confirm ${action}`);
      }
    } catch (err: any) {
      console.error(`Error confirming ${action}:`, err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        `Failed to confirm ${action}`;
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleCloseModal();
        }
      }}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

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
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-5">
            {/* Info Box */}
            <div
              className={`rounded-xl p-4 border ${
                action === 'checkin'
                  ? 'bg-green-50/50 border-green-200'
                  : 'bg-orange-50/50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <i
                  className={`bi bi-info-circle text-lg mt-0.5 ${
                    action === 'checkin' ? 'text-green-600' : 'text-orange-600'
                  }`}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      action === 'checkin' ? 'text-green-900' : 'text-orange-900'
                    }`}
                  >
                    {action === 'checkin'
                      ? `Confirm that your ${
                          userType === 'host' ? 'guest' : 'tour participant'
                        } has arrived`
                      : `Confirm that your ${
                          userType === 'host' ? 'guest' : 'tour participant'
                        } has departed`}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      action === 'checkin' ? 'text-green-700' : 'text-orange-700'
                    }`}
                  >
                    Enter the booking ID to proceed with the confirmation
                  </p>
                </div>
              </div>
            </div>

            {/* Input Field */}
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
                Find the booking ID in your{' '}
                {userType === 'host' ? 'bookings' : 'reservations'} list
              </p>
            </div>
          </div>

          {/* Footer */}
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
              className={`flex-1 px-5 py-3 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                action === 'checkin'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="bi bi-arrow-repeat animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i
                    className={`bi ${
                      action === 'checkin' ? 'bi-check-circle' : 'bi-door-closed'
                    }`}
                  />
                  Confirm {action === 'checkin' ? 'Check-in' : 'Check-out'}
                </span>
              )}
            </button>
          </div>
        </form>
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
  return createPortal(modalContent, document.body);
};

export default CheckInOutModal;
