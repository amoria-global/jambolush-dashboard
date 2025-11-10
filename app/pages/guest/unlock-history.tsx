"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/app/api/apiService';
import {
  UnlockHistoryEntry,
  DealCode,
  GuestUnlockStats
} from '@/app/types/addressUnlock';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getTimeAgo,
  copyToClipboard,
  isDealCodeExpired
} from '@/app/services/addressUnlockService';
import CancelRequestModal from '@/app/components/modals/CancelRequestModal';
import AppreciationModal from '@/app/components/modals/AppreciationModal';
import CompletePaymentModal from '@/app/components/modals/CompletePaymentModal';
import BookingModal, { BookingData } from '@/app/components/modals/BookingModal';
import AlertNotification from '@/app/components/notify';

const GuestUnlockHistory = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GuestUnlockStats | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'deal-codes'>('history');
  const [selectedUnlock, setSelectedUnlock] = useState<UnlockHistoryEntry | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showAppreciationModal, setShowAppreciationModal] = useState(false);
  const [showCompletePaymentModal, setShowCompletePaymentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    loadUnlockData();
  }, []);

  // Extract user-friendly error message from API error response
  const getErrorMessage = (error: any): string => {
    // Check if it's an API error with data
    if (error?.data) {
      // If there's a message field, use it
      if (error.data.message) {
        return error.data.message;
      }
      // If there are errors array, join them
      if (error.data.errors && Array.isArray(error.data.errors)) {
        return error.data.errors.join('. ');
      }
    }
    // Fallback to error message
    return error?.message || 'An unexpected error occurred. Please try again.';
  };

  // Transform backend response to match frontend interface
  const transformUnlockData = (backendUnlock: any): UnlockHistoryEntry => {
    // Parse property images
    let propertyImage = '';
    try {
      const images = typeof backendUnlock.property?.images === 'string'
        ? JSON.parse(backendUnlock.property.images)
        : backendUnlock.property?.images;

      // Get first available image from any category
      const imageCategories = ['livingRoom', 'bedroom', 'kitchen', 'bathroom', 'exterior', 'diningArea'];
      for (const category of imageCategories) {
        if (images?.[category]?.[0]) {
          propertyImage = images[category][0];
          break;
        }
      }
    } catch (e) {
      console.warn('Failed to parse property images:', e);
    }

    // Parse address string to PropertyAddress object
    const parseAddress = (addressStr: string | null | undefined) => {
      if (!addressStr) {
        return {
          street: '',
          city: 'Unknown',
          state: '',
          country: 'Rwanda',
          postalCode: '',
          latitude: 0,
          longitude: 0
        };
      }
      const parts = addressStr.split(',').map(p => p.trim());
      return {
        street: parts[0] || '',
        city: parts[1] || 'Unknown',
        state: parts[2] || '',
        country: parts[parts.length - 1] || 'Rwanda',
        postalCode: '',
        latitude: 0,
        longitude: 0
      };
    };

    // Map payment method from backend to frontend enum
    const mapPaymentMethod = (method: string): 'non_refundable' | 'monthly_booking' | 'deal_code' => {
      if (method === 'three_month_30_percent') return 'monthly_booking';
      if (method === 'non_refundable') return 'non_refundable';
      if (method === 'deal_code') return 'deal_code';
      return 'non_refundable'; // default
    };

    return {
      id: backendUnlock.unlockId || backendUnlock.id,
      propertyId: String(backendUnlock.propertyId),
      propertyTitle: backendUnlock.property?.name || 'Property',
      propertyImage: propertyImage || '/placeholder-property.jpg',
      unlockDate: backendUnlock.unlockedAt || backendUnlock.unlockDate,
      paymentMethod: mapPaymentMethod(backendUnlock.paymentMethod),
      amountPaid: backendUnlock.amountPaid || 0,
      currency: backendUnlock.currency || 'RWF',
      address: typeof backendUnlock.address === 'string'
        ? parseAddress(backendUnlock.address)
        : backendUnlock.address || parseAddress(null),
      hostContact: {
        name: backendUnlock.hostContactInfo?.hostName || backendUnlock.hostContact?.name || 'Host',
        phone: backendUnlock.hostContactInfo?.hostPhone || backendUnlock.hostContact?.phone || '',
        email: backendUnlock.hostContactInfo?.hostEmail || backendUnlock.hostContact?.email || '',
        whatsapp: backendUnlock.hostContactInfo?.whatsapp || backendUnlock.hostContact?.whatsapp,
        preferredContact: (backendUnlock.hostContactInfo?.preferredContactMethod || backendUnlock.hostContact?.preferredContact || 'email') as 'phone' | 'email' | 'whatsapp',
        profileImage: backendUnlock.hostContactInfo?.hostProfileImage || backendUnlock.hostContact?.profileImage,
        verified: backendUnlock.hostContactInfo?.verified || backendUnlock.hostContact?.verified || false
      },
      appreciationSubmitted: backendUnlock.appreciationSubmitted || false,
      appreciationLevel: backendUnlock.appreciationLevel,
      status: backendUnlock.status || 'unlocked',
      canCancel: backendUnlock.canCancel ?? (backendUnlock.paymentMethod === 'three_month_30_percent'),
      canRequestDealCode: backendUnlock.canRequestDealCode ?? (!backendUnlock.appreciationSubmitted && backendUnlock.paymentMethod === 'three_month_30_percent'),
      canBook: backendUnlock.canBook ?? false,
      bookingId: backendUnlock.bookingId,
      bookingCompleted: backendUnlock.bookingCompleted || false,
      rewardReceived: backendUnlock.rewardReceived
    };
  };

  const loadUnlockData = async () => {
    try {
      setLoading(true);

      // Fetch from API: GET /api/property-unlock/my-unlocks
      const [unlocksResponse, dealCodesResponse] = await Promise.all([
        api.getGuestUnlockStats(),
        api.getMyDealCodes()
      ]);

      console.log('Unlocks Response:', unlocksResponse);
      console.log('Deal Codes Response:', dealCodesResponse);

      // Check if response is successful
      if (unlocksResponse.data && unlocksResponse.data.success) {
        const unlocksData = unlocksResponse.data.data;

        // Transform unlocks array
        const transformedUnlocks = (unlocksData.unlocks || []).map(transformUnlockData);

        // Get deal codes from the dedicated endpoint
        let dealCodes: any[] = [];
        let activeDealCodes = 0;

        if (dealCodesResponse.data && dealCodesResponse.data.success && dealCodesResponse.data.data) {
          const dealCodesData = dealCodesResponse.data.data;
          dealCodes = dealCodesData.dealCodes || [];
          activeDealCodes = dealCodesData.activeDealCodes || 0;

          // Transform deal codes to match the expected format
          dealCodes = dealCodes.map((dc: any) => ({
            code: dc.code,
            userId: '', // Not provided by API
            totalUnlocks: dc.remainingUnlocks + (dc.usageHistory?.length || 0), // Calculate total from remaining + used
            remainingUnlocks: dc.remainingUnlocks,
            expiryDate: dc.expiresAt,
            createdDate: dc.generatedAt,
            isActive: dc.isActive && dc.isValid && !dc.isExpired,
            source: 'not_appreciated_feedback' as const
          }));
        }

        setStats({
          totalUnlocked: unlocksData.totalUnlocks || 0,
          totalSpent: unlocksData.totalSpent || 0,
          currency: unlocksData.currency || 'RWF',
          activeDealCodes: activeDealCodes,
          activeRequests: unlocksData.activeRequests || 0,
          completedBookings: unlocksData.completedBookings || 0,
          recentUnlocks: transformedUnlocks,
          dealCodes: dealCodes
        });
      } else {
        console.error('API response not successful:', unlocksResponse.data);
        setNotification({
          message: 'Failed to load unlock data',
          type: 'error'
        });

        // Set empty stats
        setStats({
          totalUnlocked: 0,
          totalSpent: 0,
          currency: 'RWF',
          activeDealCodes: 0,
          activeRequests: 0,
          completedBookings: 0,
          recentUnlocks: [],
          dealCodes: []
        });
      }
    } catch (error: any) {
      console.error('Error loading unlock data:', {
        message: error?.message || 'Unknown error',
        status: error?.status || 'No status',
        data: error?.data || 'No data',
        fullError: error
      });

      setNotification({
        message: 'Error loading unlock data',
        type: 'error'
      });

      // Set empty stats on error
      setStats({
        totalUnlocked: 0,
        totalSpent: 0,
        currency: 'RWF',
        activeDealCodes: 0,
        activeRequests: 0,
        completedBookings: 0,
        recentUnlocks: [],
        dealCodes: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDealCode = async (code: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleViewOnMap = (unlock: UnlockHistoryEntry) => {
    if (!unlock.address || (!unlock.address.latitude && !unlock.address.longitude)) {
      setNotification({
        message: 'Location coordinates not available',
        type: 'warning'
      });
      return;
    }
    const { latitude, longitude } = unlock.address;
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  const handleContactHost = (unlock: UnlockHistoryEntry, method: 'phone' | 'email' | 'whatsapp') => {
    const { hostContact } = unlock;

    switch (method) {
      case 'phone':
        window.location.href = `tel:${hostContact.phone}`;
        break;
      case 'email':
        window.location.href = `mailto:${hostContact.email}`;
        break;
      case 'whatsapp':
        if (hostContact.whatsapp) {
          window.open(`https://wa.me/${hostContact.whatsapp}`, '_blank');
        }
        break;
    }
  };

  // Cancel Request Handler
  const handleCancelRequest = (unlock: UnlockHistoryEntry) => {
    setSelectedUnlock(unlock);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedUnlock) return;

    try {
      // Call API to cancel unlock request: POST /api/properties/unlock/cancel
      await api.cancelUnlockRequest({
        unlockId: selectedUnlock.id
      });

      // Reload data
      await loadUnlockData();
      setShowCancelModal(false);
      setSelectedUnlock(null);
    } catch (error: any) {
      console.error('Error canceling request:', error);
      const errorMessage = getErrorMessage(error);
      alert(errorMessage);
    }
  };

  // Deal Code Request Handler
  const handleRequestDealCode = (unlock: UnlockHistoryEntry) => {
    setSelectedUnlock(unlock);
    setShowAppreciationModal(true);
  };

  const handleSubmitDealCodeRequest = async (appreciationLevel: 'appreciated' | 'neutral' | 'not_appreciated', feedback: string): Promise<string> => {
    if (!selectedUnlock) return '';

    try {
      // Call API to submit feedback and get deal code: POST /api/properties/unlock-appreciation
      const response = await api.submitUnlockAppreciation({
        unlockId: selectedUnlock.id,
        propertyId: selectedUnlock.propertyId,
        appreciationLevel,
        feedback
      });

      console.log('Appreciation response:', response);

      if (response.data && response.data.success) {
        // Show success notification
        setNotification({
          message: response.data.message || 'Feedback submitted successfully!',
          type: 'success'
        });

        // Reload data to update stats
        await loadUnlockData();

        // Check if deal code was generated
        if (response.data.data) {
          const dealCode = response.data.data.dealCodeGenerated ? response.data.data.dealCode?.code : '';

          if (dealCode) {
            return dealCode;
          }
        }

        // For appreciated/neutral, we don't expect a deal code, just return empty string
        if (appreciationLevel !== 'not_appreciated') {
          return '';
        }

        // If we reach here for not_appreciated, it means no deal code was generated
        // Show the actual server message
        setNotification({
          message: response.data.message || 'Feedback received but no deal code generated',
          type: 'warning'
        });
        return '';
      }

      // Handle unsuccessful response
      const errorMsg = response.data?.message || 'Failed to submit feedback';
      setNotification({
        message: errorMsg,
        type: 'error'
      });
      throw new Error(errorMsg);
    } catch (error: any) {
      console.error('Error submitting appreciation:', error);
      const errorMessage = getErrorMessage(error);

      // Show error notification
      setNotification({
        message: errorMessage,
        type: 'error'
      });

      // Re-throw with user-friendly message
      throw new Error(errorMessage);
    }
  };

  // Complete Payment Handler
  const handleCompletePayment = (unlock: UnlockHistoryEntry) => {
    setSelectedUnlock(unlock);
    setShowCompletePaymentModal(true);
  };

  const handleProceedToBooking = () => {
    setShowCompletePaymentModal(false);
    setShowBookingModal(true);
  };

  // Booking Handler
  const handleCreateBooking = async (bookingData: BookingData): Promise<string> => {
    if (!selectedUnlock) return '';

    try {
      // Call API to create booking: POST /api/properties/unlock/create-booking
      // Note: Server will get firstName, lastName, email, phone from session
      const response = await api.createBookingFromUnlock({
        unlockId: selectedUnlock.id,
        checkIn: bookingData.startDate,
        checkOut: bookingData.endDate,
        guests: bookingData.guests,
        specialRequests: bookingData.specialRequests,
        totalPrice: bookingData.totalAmount
      });

      if (response.data && response.data.success && response.data.data) {
        return response.data.data.bookingId;
      }

      throw new Error('Failed to create booking');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      const errorMessage = getErrorMessage(error);
      // Re-throw with user-friendly message
      throw new Error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#F20C8F] animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your unlock history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Address Unlocks
          </h1>
          <p className="text-sm text-gray-600">
            Manage your unlocked properties and deal codes
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-xl">
                <i className="bi bi-unlock-fill text-white text-2xl"></i>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Unlocked</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUnlocked || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Properties accessed</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-[#083A85] to-blue-600 rounded-xl">
                <i className="bi bi-cash-stack text-white text-2xl"></i>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats?.totalSpent || 0, stats?.currency as any || 'RWF')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Unlock fees paid</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl">
                <i className="bi bi-ticket-perforated-fill text-white text-2xl"></i>
              </div>
              <span className="text-sm font-medium text-gray-500">Active Codes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.activeDealCodes || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Deal codes available</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="bg-white rounded-2xl shadow-sm p-2 inline-flex">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-[#F20C8F] to-rose-400 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-clock-history mr-2"></i>
              Unlock History
            </button>
            <button
              onClick={() => setActiveTab('deal-codes')}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'deal-codes'
                  ? 'bg-gradient-to-r from-[#F20C8F] to-rose-400 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <i className="bi bi-ticket-perforated mr-2"></i>
              Deal Codes
            </button>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {stats?.recentUnlocks && stats.recentUnlocks.length > 0 ? (
                stats.recentUnlocks.map((unlock, index) => (
                  <motion.div
                    key={unlock.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Property Image */}
                        <div className="relative w-full lg:w-48 h-48 lg:h-32 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={unlock.propertyImage || '/placeholder-property.jpg'}
                            alt={unlock.propertyTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                            {unlock.paymentMethod === 'non_refundable' ? 'Non-refundable' :
                             unlock.paymentMethod === 'monthly_booking' ? '30% Booking' : 'Deal Code'}
                          </div>
                        </div>

                        {/* Property Details */}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {unlock.propertyTitle}
                          </h3>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center">
                              <i className="bi bi-geo-alt-fill text-[#F20C8F] mr-1.5"></i>
                              {unlock.address?.city || 'Unknown'}, {unlock.address?.country || 'Rwanda'}
                            </span>
                            <span className="flex items-center">
                              <i className="bi bi-calendar-check text-[#083A85] mr-1.5"></i>
                              {getTimeAgo(unlock.unlockDate)}
                            </span>
                            <span className="flex items-center font-semibold text-gray-900">
                              <i className="bi bi-cash mr-1.5"></i>
                              {formatCurrency(unlock.amountPaid, unlock.currency as any)}
                            </span>
                          </div>

                          {/* Address Preview */}
                          {unlock.address && (
                            <div className="bg-gray-50 rounded-xl p-3 mb-3">
                              <p className="text-sm text-gray-700">
                                <i className="bi bi-house-door mr-2"></i>
                                {unlock.address.street && `${unlock.address.street}, `}
                                {unlock.address.city && `${unlock.address.city}, `}
                                {unlock.address.state && `${unlock.address.state} `}
                                {unlock.address.postalCode}
                              </p>
                            </div>
                          )}

                          {/* Host Contact */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#F20C8F] to-rose-400 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                {unlock.hostContact.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {unlock.hostContact.name}
                                {unlock.hostContact.verified && (
                                  <i className="bi bi-patch-check-fill text-blue-500 ml-1"></i>
                                )}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleContactHost(unlock, 'phone')}
                                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                              >
                                <i className="bi bi-telephone-fill mr-1"></i>
                                Call
                              </button>
                              <button
                                onClick={() => handleContactHost(unlock, 'email')}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                              >
                                <i className="bi bi-envelope-fill mr-1"></i>
                                Email
                              </button>
                              {unlock.hostContact.whatsapp && (
                                <button
                                  onClick={() => handleContactHost(unlock, 'whatsapp')}
                                  className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                  <i className="bi bi-whatsapp mr-1"></i>
                                  WhatsApp
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reward Badge */}
                          {unlock.rewardReceived && (
                            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg">
                              <i className="bi bi-gift-fill text-amber-600 mr-2"></i>
                              <span className="text-xs font-medium text-amber-800">
                                {unlock.rewardReceived.type === 'both' ? 'Refund + Deal Code Received' :
                                 unlock.rewardReceived.type === 'deal_code' ? 'Deal Code Received' :
                                 'Refund Processed'}
                              </span>
                            </div>
                          )}

                          {/* Status Badge */}
                          {unlock.status === 'cancelled' && (
                            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-red-100 rounded-lg">
                              <i className="bi bi-x-circle-fill text-red-600 mr-2"></i>
                              <span className="text-xs font-medium text-red-800">Request Cancelled</span>
                            </div>
                          )}
                          {unlock.bookingCompleted && (
                            <div className="mt-3 inline-flex items-center px-3 py-1.5 bg-green-100 rounded-lg">
                              <i className="bi bi-check-circle-fill text-green-600 mr-2"></i>
                              <span className="text-xs font-medium text-green-800">Booking Completed</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex-shrink-0">
                          <div className="flex flex-col gap-2 w-full lg:w-auto">
                            <button
                              onClick={() => handleViewOnMap(unlock)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-300"
                            >
                              <i className="bi bi-map mr-1.5"></i>
                              View Map
                            </button>

                            {/* Cancel Request Button - Show only if 30% paid and not cancelled/completed */}
                            {unlock.canCancel && unlock.status !== 'cancelled' && !unlock.bookingCompleted && (
                              <button
                                onClick={() => handleCancelRequest(unlock)}
                                className="px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-all duration-300"
                              >
                                <i className="bi bi-x-circle mr-1.5"></i>
                                Cancel
                              </button>
                            )}

                            {/* Request Deal Code - Show only if not appreciated and payment method is 30% */}
                            {unlock.canRequestDealCode && !unlock.appreciationSubmitted && unlock.paymentMethod === 'monthly_booking' && (
                              <button
                                onClick={() => handleRequestDealCode(unlock)}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                              >
                                <i className="bi bi-gift mr-1.5"></i>
                                Respond To Get Deal Code
                              </button>
                            )}

                            {/* Complete Payment & Book - Show only if appreciated */}
                            {unlock.canBook && unlock.appreciationLevel === 'appreciated' && !unlock.bookingCompleted && (
                              <button
                                onClick={() => handleCompletePayment(unlock)}
                                className="px-4 py-2 bg-gradient-to-r from-[#F20C8F] to-rose-400 hover:from-[#083A85] hover:to-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                              >
                                <i className="bi bi-calendar-check mr-1.5"></i>
                                Book Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-sm p-12 text-center"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-lock text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Unlocked Properties Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start exploring properties and unlock addresses to view host contact information
                  </p>
                  <button
                    onClick={() => window.location.href = '/spaces'}
                    className="px-6 py-3 bg-gradient-to-r from-[#F20C8F] to-rose-400 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    Browse Properties
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="deal-codes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {stats?.dealCodes && stats.dealCodes.length > 0 ? (
                stats.dealCodes.map((code, index) => {
                  const isExpired = isDealCodeExpired(code.expiryDate);
                  const isActive = code.isActive && !isExpired && code.remainingUnlocks > 0;

                  return (
                    <motion.div
                      key={code.code}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 ${
                        !isActive ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 rounded-xl ${
                              isActive
                                ? 'bg-gradient-to-br from-green-500 to-emerald-400'
                                : 'bg-gray-300'
                            }`}>
                              <i className="bi bi-ticket-perforated-fill text-white text-xl"></i>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
                                  {code.code}
                                </span>
                                <button
                                  onClick={() => handleCopyDealCode(code.code)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Copy code"
                                >
                                  <i className={`bi ${
                                    copiedCode === code.code ? 'bi-check-circle-fill text-green-500' : 'bi-clipboard'
                                  } text-lg`}></i>
                                </button>
                              </div>
                              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                                isActive
                                  ? 'bg-green-100 text-green-700'
                                  : isExpired
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {isActive ? 'Active' : isExpired ? 'Expired' : 'Used'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Remaining Unlocks</span>
                              <p className="font-bold text-gray-900 text-lg">
                                {code.remainingUnlocks} / {code.totalUnlocks}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Expires On</span>
                              <p className="font-semibold text-gray-900">
                                {formatDate(code.expiryDate)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Source</span>
                              <p className="font-semibold text-gray-900 capitalize">
                                {code.source.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {isActive && (
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => window.location.href = '/spaces'}
                              className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#083A85] to-blue-600 text-white font-medium rounded-xl hover:shadow-lg transition-all duration-300"
                            >
                              Use Code
                              <i className="bi bi-arrow-right ml-2"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow-sm p-12 text-center"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="bi bi-ticket-perforated text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No Deal Codes Available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Earn deal codes by providing feedback on unlocked properties
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        {selectedUnlock && (
          <>
            <CancelRequestModal
              isOpen={showCancelModal}
              onClose={() => {
                setShowCancelModal(false);
                setSelectedUnlock(null);
              }}
              onConfirm={handleConfirmCancel}
              propertyName={selectedUnlock.propertyTitle}
              unlockId={selectedUnlock.id}
              amountPaid={selectedUnlock.amountPaid}
              canCancel={selectedUnlock.canCancel}
            />

            <AppreciationModal
              isOpen={showAppreciationModal}
              onClose={() => {
                setShowAppreciationModal(false);
                setSelectedUnlock(null);
              }}
              onRequestDealCode={handleSubmitDealCodeRequest}
              propertyName={selectedUnlock.propertyTitle}
              unlockId={selectedUnlock.id}
            />

            <CompletePaymentModal
              isOpen={showCompletePaymentModal}
              onClose={() => {
                setShowCompletePaymentModal(false);
                setSelectedUnlock(null);
              }}
              onProceedToBooking={handleProceedToBooking}
              propertyName={selectedUnlock.propertyTitle}
              propertyImage={selectedUnlock.propertyImage}
              amountPaid={selectedUnlock.amountPaid}
              pricePerNight={selectedUnlock.amountPaid / 90 / 0.3} // Reverse calculate price per night
            />

            <BookingModal
              isOpen={showBookingModal}
              onClose={() => {
                setShowBookingModal(false);
                setSelectedUnlock(null);
              }}
              onBook={handleCreateBooking}
              propertyName={selectedUnlock.propertyTitle}
              propertyId={selectedUnlock.propertyId}
              pricePerNight={selectedUnlock.amountPaid / 90 / 0.3} // Reverse calculate price per night
              unlockId={selectedUnlock.id}
              hasUnlocked={selectedUnlock.paymentMethod === 'monthly_booking'}
              amountPaidForUnlock={selectedUnlock.amountPaid}
            />
          </>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          position="top-right"
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default GuestUnlockHistory;
