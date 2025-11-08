'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CancelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyName: string;
  unlockId: string;
  amountPaid: number;
  canCancel: boolean;
}

export default function CancelRequestModal({
  isOpen,
  onClose,
  onConfirm,
  propertyName,
  unlockId,
  amountPaid,
  canCancel
}: CancelRequestModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error canceling request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

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
            className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-lg overflow-hidden"
          >
            {/* Close Button - Airbnb Style */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="bi bi-x text-gray-700 text-2xl font-light"></i>
            </button>

            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="text-center mb-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                  <i className="bi bi-exclamation-circle text-red-500 text-3xl"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Cancel unlock request?</h2>
                <p className="text-base text-gray-600">{propertyName}</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pb-8">
              {canCancel ? (
                <>
                  {/* Info Banner */}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
                    <div className="flex gap-3">
                      <i className="bi bi-info-circle-fill text-amber-500 text-lg flex-shrink-0 mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Since you paid 30%, you'll receive a deal code to unlock another property when you cancel.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reason Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Why are you canceling? <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all resize-none text-base"
                      rows={3}
                      placeholder="Help us improve by sharing your feedback..."
                    />
                  </div>

                  {/* Reward Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <i className="bi bi-gift-fill text-[#F20C8F] text-xl"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base mb-1">You'll receive</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          A deal code for 5 free property unlocks, valid for 6 months
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Airbnb Style */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3.5 border border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium text-base"
                      disabled={isProcessing}
                    >
                      Keep request
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#F20C8F] to-[#E01A7F] text-white rounded-xl hover:from-[#E01A7F] hover:to-[#D0176F] transition-all font-medium text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isProcessing}
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
                        'Cancel request'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
                    <div className="flex gap-3">
                      <i className="bi bi-x-circle-fill text-red-500 text-lg flex-shrink-0 mt-0.5"></i>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Cannot cancel</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Cancellation is only available for requests where 30% booking payment was made.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full px-6 py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-base"
                  >
                    Got it
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
