'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompletePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBooking: () => void;
  propertyName: string;
  propertyImage: string;
  amountPaid: number;
  pricePerNight: number;
}

export default function CompletePaymentModal({
  isOpen,
  onClose,
  onProceedToBooking,
  propertyName,
  propertyImage,
  amountPaid,
  pricePerNight
}: CompletePaymentModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-2xl overflow-hidden"
          >
            {/* Close Button - Airbnb Style */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="bi bi-x text-gray-700 text-2xl font-light"></i>
            </button>

            {/* Property Image Header */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={propertyImage || '/placeholder-property.jpg'}
                alt={propertyName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-semibold text-white mb-2">{propertyName}</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
                    <i className="bi bi-check-circle-fill text-green-500 mr-1.5"></i>
                    Unlocked
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              {/* Success Message */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 20 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="bi bi-heart-fill text-white text-2xl"></i>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Great choice!
                </h3>
                <p className="text-base text-gray-600">
                  You're one step away from booking this property
                </p>
              </motion.div>

              {/* Payment Info Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i className="bi bi-cash-stack text-[#F20C8F] text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-base mb-1">Payment summary</h4>
                    <p className="text-sm text-gray-600">Your deposit will be credited to the final payment</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">30% Deposit paid</span>
                    <span className="text-base font-semibold text-green-600">${amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Price per night</span>
                    <span className="text-base font-semibold text-gray-900">${pricePerNight.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="bi bi-list-check text-[#F20C8F] mr-2 text-xl"></i>
                  Next steps
                </h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-[#F20C8F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      1
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">Choose your check-in and check-out dates</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-[#F20C8F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      2
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">Complete your guest information</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-[#F20C8F] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      3
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">Finalize payment on jambolush.com</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Airbnb Style */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 border border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium text-base"
                >
                  Maybe later
                </button>
                <button
                  onClick={onProceedToBooking}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#F20C8F] to-[#E01A7F] text-white rounded-xl hover:from-[#E01A7F] hover:to-[#D0176F] transition-all font-medium text-base shadow-lg hover:shadow-xl"
                >
                  <i className="bi bi-calendar-check mr-2"></i>
                  Continue to booking
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
