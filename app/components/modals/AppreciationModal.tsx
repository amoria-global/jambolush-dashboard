'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppreciationLevel } from '@/app/types/addressUnlock';

interface AppreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDealCode: (appreciationLevel: AppreciationLevel, feedback: string) => Promise<string>;
  propertyName: string;
  unlockId: string;
}

export default function AppreciationModal({
  isOpen,
  onClose,
  onRequestDealCode,
  propertyName,
  unlockId
}: AppreciationModalProps) {
  const validLevels: AppreciationLevel[] = ['appreciated', 'neutral', 'not_appreciated'];

  const [isProcessing, setIsProcessing] = useState(false);
  const [appreciationLevel, setAppreciationLevel] = useState<AppreciationLevel | null>(null);
  const [feedback, setFeedback] = useState('');
  const [dealCode, setDealCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestDealCode = async () => {
    if (!appreciationLevel) return;
    if (appreciationLevel === 'not_appreciated' && !feedback.trim()) return;

    setIsProcessing(true);
    setError(null);
    try {
      const code = await onRequestDealCode(appreciationLevel, feedback);
      setDealCode(code);
    } catch (error: any) {
      console.error('Error submitting appreciation:', error);
      setError(error?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCode = async () => {
    if (dealCode) {
      await navigator.clipboard.writeText(dealCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setAppreciationLevel(null);
    setFeedback('');
    setDealCode(null);
    setCopied(false);
    setError(null);
    onClose();
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
          onClick={dealCode ? undefined : handleClose}
        />

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full overflow-hidden ${
              dealCode ? 'max-w-2xl' : 'max-w-xl'
            }`}
          >
            {/* Close Button - Airbnb Style */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="bi bi-x text-gray-700 text-2xl font-light"></i>
            </button>

            {!dealCode ? (
              <>
                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                  <div className="text-center mb-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-full mb-4">
                      <i className="bi bi-heart-fill text-[#F20C8F] text-3xl"></i>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">How was your experience?</h2>
                    <p className="text-base text-gray-600">{propertyName}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                  {/* Appreciation Level Selection */}
                  {!appreciationLevel ? (
                    <div className="space-y-3 mb-6">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        How do you feel about this property? <span className="text-red-500">*</span>
                      </label>

                      {/* Appreciated Option */}
                      <button
                        onClick={() => setAppreciationLevel('appreciated')}
                        className="w-full p-5 border-2 border-gray-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <i className="bi bi-emoji-smile-fill text-white text-2xl"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">I loved it!</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              The property met or exceeded my expectations
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Neutral Option */}
                      <button
                        onClick={() => setAppreciationLevel('neutral')}
                        className="w-full p-5 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <i className="bi bi-emoji-neutral-fill text-white text-2xl"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">It was okay</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              The property was average, nothing special
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Not Appreciated Option */}
                      <button
                        onClick={() => setAppreciationLevel('not_appreciated')}
                        className="w-full p-5 border-2 border-gray-200 rounded-2xl hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <i className="bi bi-emoji-frown-fill text-white text-2xl"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 text-base mb-1">Not what I expected</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              The property didn't meet my expectations
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Back Button */}
                      <button
                        onClick={() => setAppreciationLevel(null)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                      >
                        <i className="bi bi-arrow-left"></i>
                        <span className="text-sm font-medium">Change selection</span>
                      </button>

                      {/* Info Banner - Conditional based on appreciation level */}
                      {appreciationLevel === 'not_appreciated' && (
                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-5 mb-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <i className="bi bi-gift-fill text-[#F20C8F] text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-base mb-1">Get a deal code</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                Share your feedback and receive 5 free property unlocks, valid for 6 months
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {appreciationLevel === 'appreciated' && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 mb-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <i className="bi bi-heart-fill text-green-600 text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-base mb-1">Thank you for your positive feedback!</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                Your appreciation helps hosts improve their properties
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {appreciationLevel === 'neutral' && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <i className="bi bi-chat-dots-fill text-blue-600 text-xl"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-base mb-1">We appreciate your feedback</h4>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                Help us understand what could be improved
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Feedback Input */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          {appreciationLevel === 'appreciated'
                            ? 'What did you love about the property?'
                            : appreciationLevel === 'neutral'
                            ? 'What could be improved?'
                            : 'What didn\'t you like?'}
                          {appreciationLevel === 'not_appreciated' && <span className="text-red-500"> *</span>}
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-all resize-none text-base"
                          rows={4}
                          placeholder={
                            appreciationLevel === 'appreciated'
                              ? 'Share what you appreciated about the property...'
                              : appreciationLevel === 'neutral'
                              ? 'Tell us what could make this property better...'
                              : 'Please share details about what you didn\'t appreciate...'
                          }
                          required={appreciationLevel === 'not_appreciated'}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Your feedback helps improve our platform
                        </p>
                      </div>

                      {/* Features List - Only for not_appreciated */}
                      {appreciationLevel === 'not_appreciated' && (
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-8">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">You'll receive:</h4>
                          <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="bi bi-check-circle-fill text-green-500"></i>
                              <span>5 property unlocks</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="bi bi-check-circle-fill text-green-500"></i>
                              <span>Valid for 6 months</span>
                            </li>
                            <li className="flex items-center gap-2 text-sm text-gray-700">
                              <i className="bi bi-check-circle-fill text-green-500"></i>
                              <span>Use on any property</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {/* Error Message */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <i className="bi bi-exclamation-circle-fill text-red-500 text-xl flex-shrink-0 mt-0.5"></i>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-red-900 mb-1">Error</p>
                              <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <button
                              onClick={() => setError(null)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <i className="bi bi-x-lg text-sm"></i>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                          onClick={handleClose}
                          className="flex-1 px-6 py-3.5 border border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium text-base"
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRequestDealCode}
                          className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#F20C8F] to-[#E01A7F] text-white rounded-xl hover:from-[#E01A7F] hover:to-[#D0176F] transition-all font-medium text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isProcessing || (appreciationLevel === 'not_appreciated' && !feedback.trim())}
                        >
                          {isProcessing ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {appreciationLevel === 'not_appreciated' ? 'Getting your code...' : 'Submitting...'}
                            </span>
                          ) : (
                            appreciationLevel === 'not_appreciated' ? 'Get deal code' : 'Submit feedback'
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="px-10 pt-14 pb-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-center mb-10"
                  >
                    <div className={`w-24 h-24 ${
                      appreciationLevel === 'appreciated'
                        ? 'bg-gradient-to-br from-green-500 to-emerald-400'
                        : appreciationLevel === 'neutral'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-400'
                        : 'bg-gradient-to-br from-green-500 to-emerald-400'
                    } rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                      <i className="bi bi-check-lg text-white text-5xl font-bold"></i>
                    </div>
                    <h3 className="text-3xl font-semibold text-gray-900 mb-4">
                      Thanks for your feedback!
                    </h3>
                    <p className="text-lg text-gray-600">
                      {appreciationLevel === 'not_appreciated' && dealCode
                        ? "Here's your deal code to unlock another property"
                        : appreciationLevel === 'appreciated'
                        ? "Your positive feedback has been recorded"
                        : "Your feedback helps us improve"}
                    </p>
                  </motion.div>

                  {/* Deal Code Display - Only for not_appreciated */}
                  {appreciationLevel === 'not_appreciated' && dealCode && (
                    <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 border-2 border-pink-200 rounded-3xl p-10 mb-8">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md mb-4">
                          <i className="bi bi-gift-fill text-[#F20C8F] text-3xl"></i>
                        </div>
                        <p className="text-base font-semibold text-gray-900 mb-4">Your Exclusive Deal Code</p>
                        <div className="flex items-center justify-center gap-4 mb-8">
                          <div className="bg-white px-8 py-5 rounded-2xl shadow-sm border border-pink-100">
                            <p className="text-4xl font-bold text-gray-900 font-mono tracking-widest">
                              {dealCode}
                            </p>
                          </div>
                          <button
                            onClick={handleCopyCode}
                            className="p-4 bg-white hover:bg-gray-50 rounded-2xl shadow-sm border border-pink-100 transition-all hover:scale-105"
                            title="Copy code"
                          >
                            {copied ? (
                              <i className="bi bi-check2 text-green-600 text-3xl"></i>
                            ) : (
                              <i className="bi bi-clipboard text-gray-600 text-3xl"></i>
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-6 pt-8 border-t-2 border-pink-200">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                              <i className="bi bi-unlock-fill text-[#F20C8F] text-xl"></i>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">Unlocks</p>
                            <p className="text-xl font-bold text-gray-900">5</p>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                              <i className="bi bi-calendar-check text-[#083A85] text-xl"></i>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">Valid for</p>
                            <p className="text-xl font-bold text-gray-900">6 mo</p>
                          </div>
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                              <i className="bi bi-infinity text-green-600 text-xl"></i>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">Properties</p>
                            <p className="text-xl font-bold text-gray-900">Any</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    {appreciationLevel === 'not_appreciated' && dealCode && (
                      <button
                        onClick={() => window.open('https://www.google.com/maps', '_blank')}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-base shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        <i className="bi bi-globe text-xl"></i>
                        <span>Take a Google 3D Tour</span>
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium text-base shadow-lg"
                    >
                      {appreciationLevel === 'not_appreciated' && dealCode ? 'Browse Properties' : 'Close'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
