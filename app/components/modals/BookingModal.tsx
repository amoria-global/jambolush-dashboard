'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (bookingData: BookingData) => Promise<string>;
  propertyName: string;
  propertyId: string;
  pricePerNight: number;
  unlockId: string;
  hasUnlocked: boolean;
  amountPaidForUnlock: number;
}

export interface BookingData {
  startDate: string;
  endDate: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  totalAmount: number;
  amountDue: number;
}

export default function BookingModal({
  isOpen,
  onClose,
  onBook,
  propertyName,
  propertyId,
  pricePerNight,
  unlockId,
  hasUnlocked,
  amountPaidForUnlock
}: BookingModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const calculateTotalAmount = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights * pricePerNight : 0;
  };

  const totalAmount = calculateTotalAmount();
  const amountDue = hasUnlocked ? totalAmount - amountPaidForUnlock : totalAmount;
  const nights = startDate && endDate ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const handleBook = async () => {
    if (!startDate || !endDate || !firstName || !lastName || !email || !phone) {
      return;
    }

    setIsProcessing(true);
    try {
      const bookingData: BookingData = {
        startDate,
        endDate,
        guests,
        firstName,
        lastName,
        email,
        phone,
        specialRequests,
        totalAmount,
        amountDue
      };

      const bookingId = await onBook(bookingData);
      const spaceIdHashed = btoa(propertyId);
      const bookingIdHashed = btoa(bookingId);
      const paymentUrl = `https://jambolush.com/spaces/${spaceIdHashed}/confirm-and-pay?bookingId=${bookingIdHashed}`;

      // Open payment in new tab
      window.open(paymentUrl, '_blank');

      // Close modal and reset form
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 z-10 rounded-t-3xl">
              <button
                onClick={onClose}
                className="absolute top-5 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="bi bi-x text-gray-700 text-2xl font-light"></i>
              </button>
              <h2 className="text-2xl font-semibold text-gray-900">Request to book</h2>
              <p className="text-sm text-gray-600 mt-1">{propertyName}</p>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              {/* Unlock Credit Banner */}
              {hasUnlocked && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8"
                >
                  <div className="flex gap-3">
                    <i className="bi bi-check-circle-fill text-green-500 text-lg flex-shrink-0 mt-0.5"></i>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <strong className="font-semibold text-gray-900">${amountPaidForUnlock.toFixed(2)} credit applied!</strong> Your 30% deposit will be deducted from the total.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Trip Dates */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your trip</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Guests
                  </label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                    required
                  />
                </div>
              </div>

              {/* Guest Information */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Guest details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      First name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all text-base"
                      placeholder="+1 (555) 000-0000"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Special requests <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all resize-none text-base"
                    rows={3}
                    placeholder="Any special requirements or requests..."
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600">
                      ${pricePerNight.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="font-medium text-gray-900">${totalAmount.toFixed(2)}</span>
                  </div>
                  {hasUnlocked && (
                    <div className="flex justify-between text-base">
                      <span className="text-green-600 flex items-center">
                        <i className="bi bi-check-circle-fill mr-1.5"></i>
                        30% deposit
                      </span>
                      <span className="font-medium text-green-600">-${amountPaidForUnlock.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-gray-300 pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900 text-lg">Amount due</span>
                    <span className="font-bold text-[#F20C8F] text-xl">${amountDue.toFixed(2)}</span>
                  </div>
                  {hasUnlocked && (
                    <p className="text-xs text-gray-600 bg-white rounded-lg p-3 mt-2">
                      <i className="bi bi-info-circle mr-1"></i>
                      This booking will be recorded as 100% paid once you complete the remaining payment.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 border border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium text-base"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#F20C8F] to-[#E01A7F] text-white rounded-xl hover:from-[#E01A7F] hover:to-[#D0176F] transition-all font-medium text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || !startDate || !endDate || !firstName || !lastName || !email || !phone || totalAmount === 0}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <i className="bi bi-credit-card mr-2"></i>
                      Proceed to payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
