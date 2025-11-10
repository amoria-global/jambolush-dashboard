'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourOption {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
}

interface ScheduleFormData {
  tourId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  isAvailable: boolean;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: ScheduleFormData) => Promise<void>;
  tours: TourOption[];
  initialData?: {
    id?: string;
    scheduleId?: string;
    tourId: string;
    startDate?: string | Date;
    endDate?: string | Date;
    startTime: string;
    endTime: string;
    maxGuests?: number;
    availableSlots?: number;
    isAvailable?: boolean;
  } | null;
  mode: 'add' | 'edit' | 'view';
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  tours,
  initialData,
  mode
}: ScheduleModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [availableSlots, setAvailableSlots] = useState(10);
  const [isAvailable, setIsAvailable] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedTourId(initialData.tourId || '');

        // Handle date conversion
        const formatDate = (date: string | Date | undefined) => {
          if (!date) return '';
          const d = new Date(date);
          return d.toISOString().split('T')[0];
        };

        setStartDate(formatDate(initialData.startDate));
        setEndDate(formatDate(initialData.endDate));
        setStartTime(initialData.startTime || '09:00');
        setEndTime(initialData.endTime || '17:00');
        setAvailableSlots(initialData.availableSlots || initialData.maxGuests || 10);
        setIsAvailable(initialData.isAvailable !== false);
      } else if (tours.length > 0) {
        // Set default values for new schedule
        setSelectedTourId(tours[0].id);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setStartDate(tomorrow.toISOString().split('T')[0]);
        setEndDate(tomorrow.toISOString().split('T')[0]);
        setStartTime('09:00');
        setEndTime('17:00');
        setAvailableSlots(10);
        setIsAvailable(true);
      }
      setErrors({});
    }
  }, [isOpen, initialData, tours]);

  const selectedTour = tours.find(t => t.id === selectedTourId);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedTourId) {
      newErrors.tourId = 'Please select a tour';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (availableSlots < 1) {
      newErrors.availableSlots = 'Available slots must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      const scheduleData: ScheduleFormData = {
        tourId: selectedTourId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        startTime,
        endTime,
        availableSlots,
        isAvailable
      };

      await onSave(scheduleData);
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      setErrors({ general: 'Failed to save schedule. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const duration = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    return Math.max(0, duration);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, days);
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

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
              <h2 className="text-2xl font-semibold text-gray-900">
                {isAddMode && 'Add Schedule'}
                {isEditMode && 'Edit Schedule'}
                {isViewMode && 'Schedule Details'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isAddMode && 'Create a new tour schedule'}
                {isEditMode && 'Update tour schedule information'}
                {isViewMode && 'View tour schedule information'}
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-6">
              {/* Error Message */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6"
                >
                  <div className="flex gap-3">
                    <i className="bi bi-exclamation-triangle-fill text-red-500 text-lg flex-shrink-0 mt-0.5"></i>
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                </motion.div>
              )}

              {/* Tour Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Selection</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Tour <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTourId}
                    onChange={(e) => setSelectedTourId(e.target.value)}
                    disabled={isViewMode || isEditMode}
                    className={`w-full px-4 py-3 border ${errors.tourId ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode || isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Choose a tour...</option>
                    {tours.map(tour => (
                      <option key={tour.id} value={tour.id}>
                        {tour.title} - {tour.location}
                      </option>
                    ))}
                  </select>
                  {errors.tourId && (
                    <p className="mt-1 text-sm text-red-600">{errors.tourId}</p>
                  )}

                  {/* Selected Tour Info */}
                  {selectedTour && (
                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#083A85]/10 flex items-center justify-center">
                          <i className="bi bi-geo-alt text-[#083A85] text-xl"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{selectedTour.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{selectedTour.location}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              <span className="font-medium">Type:</span> {selectedTour.type}
                            </span>
                            <span className="text-gray-600">
                              <span className="font-medium">Price:</span> ${selectedTour.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule Dates */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={isViewMode}
                      className={`w-full px-4 py-3 border ${errors.startDate ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      disabled={isViewMode}
                      className={`w-full px-4 py-3 border ${errors.endDate ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                    )}
                  </div>
                </div>
                {startDate && endDate && (
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                    <i className="bi bi-info-circle mr-2"></i>
                    Schedule duration: <span className="font-semibold">{calculateDays()} day(s)</span>
                  </div>
                )}
              </div>

              {/* Time Settings */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Time</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-4 py-3 border ${errors.startTime ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.startTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={isViewMode}
                      className={`w-full px-4 py-3 border ${errors.endTime ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.endTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                    )}
                  </div>
                </div>
                {startTime && endTime && (
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
                    <i className="bi bi-clock mr-2"></i>
                    Tour duration: <span className="font-semibold">{calculateDuration().toFixed(1)} hour(s)</span>
                  </div>
                )}
              </div>

              {/* Availability Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Available Slots <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={availableSlots}
                      onChange={(e) => setAvailableSlots(parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                      disabled={isViewMode}
                      className={`w-full px-4 py-3 border ${errors.availableSlots ? 'border-red-300' : 'border-gray-300'} rounded-xl focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] outline-none transition-all text-base ${isViewMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    />
                    {errors.availableSlots && (
                      <p className="mt-1 text-sm text-red-600">{errors.availableSlots}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">Maximum number of guests for this schedule</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => setIsAvailable(e.target.checked)}
                        disabled={isViewMode}
                        className="sr-only peer"
                      />
                      <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#083A85]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#083A85] ${isViewMode ? 'cursor-not-allowed opacity-50' : ''}`}></div>
                    </label>
                    <span className="text-sm font-medium text-gray-900">
                      {isAvailable ? 'Available for booking' : 'Not available for booking'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              {selectedTour && startDate && endDate && (
                <div className="bg-gradient-to-br from-[#083A85]/5 to-[#083A85]/10 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Tour</span>
                      <span className="font-medium text-gray-900">{selectedTour.title}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{calculateDays()} day(s)</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Daily Hours</span>
                      <span className="font-medium text-gray-900">{startTime} - {endTime} ({calculateDuration().toFixed(1)}h)</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Available Slots</span>
                      <span className="font-medium text-gray-900">{availableSlots} guests</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                        {isAvailable ? 'Available' : 'Not Available'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 border border-gray-900 text-gray-900 rounded-xl hover:bg-gray-50 transition-all font-medium text-base"
                  disabled={isProcessing}
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </button>
                {!isViewMode && (
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#083A85] to-[#0a4191] text-white rounded-xl hover:from-[#072f6b] hover:to-[#083A85] transition-all font-medium text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isProcessing || !selectedTourId || !startDate || !endDate || !startTime || !endTime || availableSlots < 1}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <>
                        <i className="bi bi-check-lg mr-2"></i>
                        {isEditMode ? 'Update Schedule' : 'Create Schedule'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
