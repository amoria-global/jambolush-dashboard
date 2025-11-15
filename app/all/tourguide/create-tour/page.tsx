'use client';

import api from '@/app/api/apiService';
import uploadDocumentToSupabase, { deleteDocumentFromSupabase } from '@/app/api/storage';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createViewDetailsUrl } from '@/app/utils/encoder';
import TourMapSelector from '@/app/components/TourMapSelector';
import 'bootstrap-icons/font/bootstrap-icons.css';

interface TourItineraryItem {
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface TourSchedule {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
}

interface TourImages {
  main?: string[];
  gallery?: string[];
  [key: string]: string[] | undefined;
}

interface CreateTourDto {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  type: string;
  duration: number;
  maxGroupSize: number;
  minGroupSize?: number;
  price: number;
  currency?: string;
  images: TourImages;
  itinerary: TourItineraryItem[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
  locationCountry: string;
  locationState?: string;
  locationCity: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  locationZipCode?: string;
  meetingPoint: string;
  tags: string[];
  schedules: TourSchedule[];
}

type ActiveTab = 'basic' | 'images' | 'location' | 'details' | 'itinerary' | 'schedule';

const CreateTourPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [mainImagePreviews, setMainImagePreviews] = useState<string[]>([]);
  const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
  const [mainImages, setMainImages] = useState<File[]>([]);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);

  const [tourData, setTourData] = useState<CreateTourDto>({
    title: '',
    description: '',
    shortDescription: '',
    category: 'History',
    type: 'walking',
    duration: 2,
    maxGroupSize: 10,
    minGroupSize: 1,
    price: 50,
    currency: 'USD',
    difficulty: 'easy',
    locationCountry: '',
    locationState: '',
    locationCity: '',
    locationAddress: '',
    locationZipCode: '',
    latitude: undefined,
    longitude: undefined,
    meetingPoint: '',
    images: { main: [], gallery: [] },
    itinerary: [],
    inclusions: [],
    exclusions: [],
    requirements: [],
    tags: [],
    schedules: []
  });

  // Temporary state for array inputs
  const [tempInclusion, setTempInclusion] = useState('');
  const [tempExclusion, setTempExclusion] = useState('');
  const [tempRequirement, setTempRequirement] = useState('');
  const [tempTag, setTempTag] = useState('');
  const [showMapSelector, setShowMapSelector] = useState(false);

  const categories = ['History', 'Food', 'Photography', 'Adventure', 'Culture', 'Nature', 'Art', 'Architecture', 'Music', 'Shopping'];
  const tourTypes = ['walking', 'driving', 'cycling', 'boat', 'bus', 'train', 'hiking', 'virtual'];
  const difficulties = ['easy', 'moderate', 'challenging', 'extreme'];

  const resizeImage = async (file: File): Promise<File> => {
    const scale = 0.8; // 20% off
    const maxDim = 672; // Equivalent to Tailwind's 2xl (42rem at 16px/rem)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let targetWidth = img.width * scale;
        let targetHeight = img.height * scale;
        if (targetWidth > maxDim || targetHeight > maxDim) {
          const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
          targetWidth *= ratio;
          targetHeight *= ratio;
        }
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                reject(new Error('Failed to resize image'));
              }
            },
            file.type,
            0.9
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = reject;
    });
  };

  const validateTour = (): string[] => {
    const validationErrors: string[] = [];

    // Required field validations
    if (!tourData.title.trim()) validationErrors.push('Tour title is required');
    else if (tourData.title.length > 200) validationErrors.push('Tour title must be less than 200 characters');

    if (!tourData.description.trim()) validationErrors.push('Tour description is required');
    else if (tourData.description.length > 5000) validationErrors.push('Tour description must be less than 5000 characters');

    if (!tourData.shortDescription.trim()) validationErrors.push('Short description is required');
    else if (tourData.shortDescription.length > 500) validationErrors.push('Short description must be less than 500 characters');

    if (!tourData.category.trim()) validationErrors.push('Tour category is required');
    if (!tourData.type.trim()) validationErrors.push('Tour type is required');

    // Pricing validation
    if (tourData.price <= 0) validationErrors.push('Tour price must be greater than 0');
    else if (tourData.price > 50000) validationErrors.push('Tour price seems too high (max: $50,000)');

    // Duration validation
    if (tourData.duration <= 0) validationErrors.push('Tour duration must be greater than 0');
    else if (tourData.duration > 168) validationErrors.push('Tour duration cannot exceed 168 hours (7 days)');

    // Group size validation
    if (tourData.maxGroupSize < 1 || tourData.maxGroupSize > 100) {
      validationErrors.push('Maximum group size must be between 1 and 100');
    }
    if (tourData.minGroupSize && (tourData.minGroupSize < 1 || tourData.minGroupSize > tourData.maxGroupSize)) {
      validationErrors.push('Minimum group size must be between 1 and maximum group size');
    }

    // Location validation
    if (!tourData.locationCountry.trim()) validationErrors.push('Country is required');
    if (!tourData.locationCity.trim()) validationErrors.push('City is required');
    if (!tourData.locationAddress.trim()) validationErrors.push('Address is required');
    if (!tourData.meetingPoint.trim()) validationErrors.push('Meeting point is required');

    // Coordinate validation
    if (tourData.latitude && (tourData.latitude < -90 || tourData.latitude > 90)) {
      validationErrors.push('Latitude must be between -90 and 90');
    }
    if (tourData.longitude && (tourData.longitude < -180 || tourData.longitude > 180)) {
      validationErrors.push('Longitude must be between -180 and 180');
    }

    // Images validation
    if (mainImages.length === 0) validationErrors.push('At least one main image is required');

    // Itinerary validation
    tourData.itinerary.forEach((item, index) => {
      if (!item.title || !item.description || !item.duration || !item.order) {
        validationErrors.push(`Itinerary item ${index + 1} must have title, description, duration, and order`);
      }
      if (item.duration <= 0) {
        validationErrors.push(`Itinerary item ${index + 1} duration must be greater than 0`);
      }
    });

    // Schedule validation
    tourData.schedules.forEach((schedule, index) => {
      if (!schedule.startDate || !schedule.endDate || !schedule.startTime || !schedule.endTime || !schedule.availableSlots) {
        validationErrors.push(`Schedule ${index + 1} must have start date, end date, start time, end time, and available slots`);
      }

      if (schedule.availableSlots <= 0) {
        validationErrors.push(`Schedule ${index + 1} available slots must be greater than 0`);
      }

      const startDate = new Date(schedule.startDate);
      const endDate = new Date(schedule.endDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        validationErrors.push(`Schedule ${index + 1} has invalid dates`);
      } else if (startDate >= endDate) {
        validationErrors.push(`Schedule ${index + 1} end date must be after start date`);
      } else if (startDate < new Date()) {
        validationErrors.push(`Schedule ${index + 1} start date cannot be in the past`);
      }

      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(schedule.startTime) || !timePattern.test(schedule.endTime)) {
        validationErrors.push(`Schedule ${index + 1} times must be in HH:MM format`);
      }
    });

    return validationErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateTour();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    let uploadedPaths: string[] = [];
    try {
      const mainUrls: string[] = [];
      for (const file of mainImages) {
        const resized = await resizeImage(file);
        const newPublicUrl = await uploadDocumentToSupabase(resized, file.name, 'tour_images/main');
        mainUrls.push(newPublicUrl);
        uploadedPaths.push(newPublicUrl);
      }

      const galleryUrls: string[] = [];
      for (const file of galleryImages) {
        const resized = await resizeImage(file);
        const publicUrl = await uploadDocumentToSupabase(resized, file.name, 'tour_images/gallery');
        galleryUrls.push(publicUrl);
        uploadedPaths.push(publicUrl);
      }

      const finalData = {
        ...tourData,
        images: {
          main: mainUrls,
          gallery: galleryUrls,
        },
      };

      const response = await api.post('/tours', finalData);
      const tourId = response.data.data.id;

      // Navigate to tour details page
      const viewDetailsUrl = createViewDetailsUrl(tourId, 'tour');
      router.push(viewDetailsUrl);
    } catch (error: any) {
      setErrors(['Failed to create tour. Please try again.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      for (const path of uploadedPaths) {
        await deleteDocumentFromSupabase(path);
      }
    } finally {
      setLoading(false);
    }
  };

  const addArrayItem = (field: 'inclusions' | 'exclusions' | 'requirements' | 'tags', value: string) => {
    if (value.trim()) {
      setTourData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));

      // Clear the temporary input
      if (field === 'inclusions') setTempInclusion('');
      else if (field === 'exclusions') setTempExclusion('');
      else if (field === 'requirements') setTempRequirement('');
      else if (field === 'tags') setTempTag('');
    }
  };

  const removeArrayItem = (field: 'inclusions' | 'exclusions' | 'requirements' | 'tags', index: number) => {
    setTourData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addItineraryItem = () => {
    const newItem: TourItineraryItem = {
      title: '',
      description: '',
      duration: 1,
      order: tourData.itinerary.length + 1
    };
    setTourData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, newItem]
    }));
  };

  const updateItineraryItem = (index: number, field: keyof TourItineraryItem, value: string | number) => {
    setTourData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItineraryItem = (index: number) => {
    setTourData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        order: i + 1
      }))
    }));
  };

  const addSchedule = () => {
    const newSchedule: TourSchedule = {
      startDate: '',
      endDate: '',
      startTime: '09:00',
      endTime: '17:00',
      availableSlots: tourData.maxGroupSize
    };
    setTourData(prev => ({
      ...prev,
      schedules: [...prev.schedules, newSchedule]
    }));
  };

  const updateSchedule = (index: number, field: keyof TourSchedule, value: string | number) => {
    setTourData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }));
  };

  const removeSchedule = (index: number) => {
    setTourData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setMainImages((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setMainImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setGalleryImages((prev) => [...prev, ...newFiles]);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setGalleryImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMainImage = (index: number) => {
    setMainImages((prev) => prev.filter((_, i) => i !== index));
    setMainImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (locationData: { latitude: number; longitude: number; address: string; addressComponents: any }) => {
    setTourData(prev => ({
      ...prev,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      meetingPoint: locationData.address,
      locationAddress: locationData.address,
      locationCity: locationData.addressComponents.city || prev.locationCity,
      locationCountry: locationData.addressComponents.country || prev.locationCountry,
      locationState: locationData.addressComponents.region || prev.locationState,
      locationZipCode: locationData.addressComponents.postalCode || prev.locationZipCode
    }));
  };

  const tabs = [
    { id: 'basic' as ActiveTab, label: 'Basic Info', icon: 'bi-file-text' },
    { id: 'images' as ActiveTab, label: 'Images', icon: 'bi-images' },
    { id: 'location' as ActiveTab, label: 'Location', icon: 'bi-geo-alt' },
    { id: 'details' as ActiveTab, label: 'Details', icon: 'bi-gear' },
    { id: 'itinerary' as ActiveTab, label: 'Itinerary', icon: 'bi-list-check' },
    { id: 'schedule' as ActiveTab, label: 'Schedule', icon: 'bi-calendar-event' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mt-4 px-3">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Create Tour</h1>
                <p className="text-gray-600 mt-2">Share your expertise and create an amazing tour experience</p>
              </div>
              <button
                onClick={() => router.back()}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <h4 className="text-red-800 font-medium mb-2">Please fix these issues:</h4>
              <ul className="text-red-600 text-sm space-y-1 list-disc pl-5">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={loading}
                className={`px-6 py-4 whitespace-nowrap text-base font-medium transition-colors disabled:opacity-50 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#083A85] text-[#083A85]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'basic' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Tour title
                  </label>
                  <input
                    type="text"
                    value={tourData.title}
                    onChange={(e) => setTourData(prev => ({ ...prev, title: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="Give your tour a catchy title"
                    maxLength={200}
                  />
                  <div className="text-sm text-gray-500 mt-2">{tourData.title.length}/200</div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Description
                  </label>
                  <textarea
                    value={tourData.description}
                    onChange={(e) => setTourData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={loading}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="Tell guests what makes your tour special"
                    maxLength={5000}
                  />
                  <div className="text-sm text-gray-500 mt-2">{tourData.description.length}/5000</div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Short description
                  </label>
                  <textarea
                    value={tourData.shortDescription}
                    onChange={(e) => setTourData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    disabled={loading}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="A quick summary for search results"
                    maxLength={500}
                  />
                  <div className="text-sm text-gray-500 mt-2">{tourData.shortDescription.length}/500</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Category
                    </label>
                    <select
                      value={tourData.category}
                      onChange={(e) => setTourData(prev => ({ ...prev, category: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Tour type
                    </label>
                    <select
                      value={tourData.type}
                      onChange={(e) => setTourData(prev => ({ ...prev, type: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white"
                    >
                      {tourTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={tourData.duration}
                      onChange={(e) => setTourData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      disabled={loading}
                      min="0.5"
                      max="168"
                      step="0.5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      value={tourData.price}
                      onChange={(e) => setTourData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      disabled={loading}
                      min="1"
                      max="50000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Difficulty
                    </label>
                    <select
                      value={tourData.difficulty}
                      onChange={(e) => setTourData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white"
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Max group size
                    </label>
                    <input
                      type="number"
                      value={tourData.maxGroupSize}
                      onChange={(e) => setTourData(prev => ({ ...prev, maxGroupSize: Number(e.target.value) }))}
                      disabled={loading}
                      min="1"
                      max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Min group size (optional)
                    </label>
                    <input
                      type="number"
                      value={tourData.minGroupSize || ''}
                      onChange={(e) => setTourData(prev => ({ ...prev, minGroupSize: e.target.value ? Number(e.target.value) : undefined }))}
                      disabled={loading}
                      min="1"
                      max={tourData.maxGroupSize}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Main images (at least 1 required)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={loading}
                      className="hidden"
                      id="main-images"
                    />
                    <label htmlFor="main-images" className="cursor-pointer">
                      <div className="text-[#083A85] text-4xl mb-2">↑</div>
                      <p className="text-gray-900 font-medium">Click to upload main images</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {mainImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                        <button
                          onClick={() => removeMainImage(index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-600 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Gallery images (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleGalleryImageUpload}
                      disabled={loading}
                      className="hidden"
                      id="gallery-images"
                    />
                    <label htmlFor="gallery-images" className="cursor-pointer">
                      <div className="text-[#083A85] text-4xl mb-2">↑</div>
                      <p className="text-gray-900 font-medium">Click to upload gallery images</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {galleryImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-xl" />
                        <button
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 text-gray-600 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Country
                    </label>
                    <input
                      type="text"
                      value={tourData.locationCountry}
                      onChange={(e) => setTourData(prev => ({ ...prev, locationCountry: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., United States"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      City
                    </label>
                    <input
                      type="text"
                      value={tourData.locationCity}
                      onChange={(e) => setTourData(prev => ({ ...prev, locationCity: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      State/Province (optional)
                    </label>
                    <input
                      type="text"
                      value={tourData.locationState}
                      onChange={(e) => setTourData(prev => ({ ...prev, locationState: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., New York"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Zip code (optional)
                    </label>
                    <input
                      type="text"
                      value={tourData.locationZipCode}
                      onChange={(e) => setTourData(prev => ({ ...prev, locationZipCode: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., 10001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Address
                  </label>
                  <input
                    type="text"
                    value={tourData.locationAddress}
                    onChange={(e) => setTourData(prev => ({ ...prev, locationAddress: e.target.value }))}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="e.g., 123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Meeting point
                  </label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowMapSelector(true)}
                      disabled={loading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#083A85] hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-gray-700 font-medium"
                    >
                      <i className="bi bi-geo-alt-fill text-[#083A85]"></i>
                      Select Meeting Point on Map
                    </button>
                    <input
                      type="text"
                      value={tourData.meetingPoint}
                      onChange={(e) => setTourData(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="Or type meeting point manually"
                    />
                    {tourData.latitude && tourData.longitude && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Location selected: {tourData.latitude.toFixed(6)}, {tourData.longitude.toFixed(6)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Latitude (optional)
                    </label>
                    <input
                      type="number"
                      value={tourData.latitude || ''}
                      onChange={(e) => setTourData(prev => ({ ...prev, latitude: e.target.value ? Number(e.target.value) : undefined }))}
                      disabled={loading}
                      step="0.000001"
                      min="-90"
                      max="90"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., 40.7128"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">
                      Longitude (optional)
                    </label>
                    <input
                      type="number"
                      value={tourData.longitude || ''}
                      onChange={(e) => setTourData(prev => ({ ...prev, longitude: e.target.value ? Number(e.target.value) : undefined }))}
                      disabled={loading}
                      step="0.000001"
                      min="-180"
                      max="180"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., -74.0060"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Inclusions */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    What's included
                  </label>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={tempInclusion}
                      onChange={(e) => setTempInclusion(e.target.value)}
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., Professional guide"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('inclusions', tempInclusion))}
                    />
                    <button
                      onClick={() => addArrayItem('inclusions', tempInclusion)}
                      disabled={loading || !tempInclusion.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.inclusions.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button
                          onClick={() => removeArrayItem('inclusions', index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Exclusions */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    What's not included
                  </label>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={tempExclusion}
                      onChange={(e) => setTempExclusion(e.target.value)}
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., Meals and drinks"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('exclusions', tempExclusion))}
                    />
                    <button
                      onClick={() => addArrayItem('exclusions', tempExclusion)}
                      disabled={loading || !tempExclusion.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.exclusions.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button
                          onClick={() => removeArrayItem('exclusions', index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Guest requirements
                  </label>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={tempRequirement}
                      onChange={(e) => setTempRequirement(e.target.value)}
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., Comfortable walking shoes"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('requirements', tempRequirement))}
                    />
                    <button
                      onClick={() => addArrayItem('requirements', tempRequirement)}
                      disabled={loading || !tempRequirement.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.requirements.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button
                          onClick={() => removeArrayItem('requirements', index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Tags
                  </label>
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={tempTag}
                      onChange={(e) => setTempTag(e.target.value)}
                      disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                      placeholder="e.g., family-friendly"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('tags', tempTag))}
                    />
                    <button
                      onClick={() => addArrayItem('tags', tempTag)}
                      disabled={loading || !tempTag.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.tags.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button
                          onClick={() => removeArrayItem('tags', index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'itinerary' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Itinerary</h3>
                  <button
                    onClick={addItineraryItem}
                    disabled={loading}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                  >
                    Add stop
                  </button>
                </div>

                <div className="space-y-6">
                  {tourData.itinerary.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Stop {index + 1}</h4>
                        <button
                          onClick={() => removeItineraryItem(index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            Title
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateItineraryItem(index, 'title', e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                            placeholder="e.g., Explore the historic district"
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            Duration (hours)
                          </label>
                          <input
                            type="number"
                            value={item.duration}
                            onChange={(e) => updateItineraryItem(index, 'duration', Number(e.target.value))}
                            disabled={loading}
                            min="0.25"
                            step="0.25"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-base font-medium text-gray-900 mb-3">
                          Description
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateItineraryItem(index, 'description', e.target.value)}
                          disabled={loading}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          placeholder="What will guests do here?"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {tourData.itinerary.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium">No stops added yet</p>
                    <p className="text-base mt-2">Add stops to outline your tour's journey</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
                  <button
                    onClick={addSchedule}
                    disabled={loading}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                  >
                    Add dates
                  </button>
                </div>

                <div className="space-y-6">
                  {tourData.schedules.map((schedule, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Date range {index + 1}</h4>
                        <button
                          onClick={() => removeSchedule(index)}
                          disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors font-medium"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            Start date
                          </label>
                          <input
                            type="date"
                            value={schedule.startDate}
                            onChange={(e) => updateSchedule(index, 'startDate', e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            End date
                          </label>
                          <input
                            type="date"
                            value={schedule.endDate}
                            onChange={(e) => updateSchedule(index, 'endDate', e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            Start time
                          </label>
                          <input
                            type="time"
                            value={schedule.startTime}
                            onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">
                            End time
                          </label>
                          <input
                            type="time"
                            value={schedule.endTime}
                            onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-base font-medium text-gray-900 mb-3">
                          Available spots
                        </label>
                        <input
                          type="number"
                          value={schedule.availableSlots}
                          onChange={(e) => updateSchedule(index, 'availableSlots', Number(e.target.value))}
                          disabled={loading}
                          min="1"
                          max={tourData.maxGroupSize}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {tourData.schedules.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium">No availability added yet</p>
                    <p className="text-base mt-2">Add date ranges when your tour is available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-8 py-6 bg-white flex justify-between items-center rounded-b-3xl">
            <button
              onClick={() => router.back()}
              disabled={loading}
              className="px-8 py-3 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
                  if (currentTabIndex > 0) {
                    setActiveTab(tabs[currentTabIndex - 1].id);
                  }
                }}
                disabled={loading || activeTab === 'basic'}
                className="px-8 py-3 border border-gray-300 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Back
              </button>

              {activeTab === 'schedule' ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium flex items-center gap-3"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  {loading ? 'Creating...' : 'Publish tour'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentTabIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentTabIndex + 1].id);
                    }
                  }}
                  disabled={loading}
                  className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map Selector Modal */}
      <TourMapSelector
        isOpen={showMapSelector}
        onClose={() => setShowMapSelector(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          tourData.latitude && tourData.longitude
            ? { lat: tourData.latitude, lng: tourData.longitude }
            : undefined
        }
      />
    </div>
  );
};

export default CreateTourPage;
