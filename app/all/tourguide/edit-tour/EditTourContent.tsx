'use client';

import api from '@/app/api/apiService';
import uploadDocumentToSupabase, { deleteDocumentFromSupabase } from '@/app/api/storage';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeId, createViewDetailsUrl } from '@/app/utils/encoder';
import TourMapSelector from '@/app/components/TourMapSelector';
import 'bootstrap-icons/font/bootstrap-icons.css';

// --- Reusable Interfaces ---
interface TourItineraryItem {
  title: string;
  description: string;
  duration: number;
  order: number;
}

interface TourSchedule {
  id?: string; // For existing schedules
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  isAvailable?: boolean;
}

interface TourImages {
  main?: string[];
  gallery?: string[];
}

// DTO for both creating and updating a tour
interface TourDataDto {
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

const EditTourContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const encodedId = searchParams.get('id');
  const tourId = encodedId ? decodeId(encodedId) : null;

  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Track original schedules to detect changes
  const [originalSchedules, setOriginalSchedules] = useState<TourSchedule[]>([]);

  // State for new image files and their previews
  const [newMainImages, setNewMainImages] = useState<File[]>([]);
  const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
  const [newMainImagePreviews, setNewMainImagePreviews] = useState<string[]>([]);
  const [newGalleryImagePreviews, setNewGalleryImagePreviews] = useState<string[]>([]);

  // State to track existing images and deletions
  const [existingMainImageUrls, setExistingMainImageUrls] = useState<string[]>([]);
  const [existingGalleryImageUrls, setExistingGalleryImageUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [tourData, setTourData] = useState<TourDataDto>({
    title: '',
    description: '',
    shortDescription: '',
    category: 'History',
    type: 'walking',
    duration: 0,
    maxGroupSize: 10,
    price: 0,
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

  // Fetch existing tour data on component mount
  useEffect(() => {
    if (!tourId) {
      setErrors(['No tour ID provided']);
      setInitialLoading(false);
      return;
    }
    const fetchTour = async () => {
      setInitialLoading(true);
      try {
        const response = await api.get(`/tours/${tourId}`);
        const fetchedData = response.data.data;

        // Pre-process data for form compatibility
        const formattedSchedules = (fetchedData.schedules || []).map((s: any) => ({
          id: s.id,
          startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
          endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : '',
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '17:00',
          availableSlots: s.availableSlots || 10,
          isAvailable: s.isAvailable !== undefined ? s.isAvailable : true,
        }));

        const parsedItinerary = typeof fetchedData.itinerary === 'string'
          ? JSON.parse(fetchedData.itinerary)
          : (fetchedData.itinerary || []);

        setTourData({ ...fetchedData, schedules: formattedSchedules, itinerary: parsedItinerary });
        setOriginalSchedules(formattedSchedules); // Store original schedules for comparison
        setExistingMainImageUrls(fetchedData.images.main || []);
        setExistingGalleryImageUrls(fetchedData.images.gallery || []);

      } catch (err: any) {
        setErrors([`Failed to load tour data: ${err.message}`]);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const [tempInclusion, setTempInclusion] = useState('');
  const [tempExclusion, setTempExclusion] = useState('');
  const [tempRequirement, setTempRequirement] = useState('');
  const [tempTag, setTempTag] = useState('');
  const [showMapSelector, setShowMapSelector] = useState(false);

  const categories = ['History', 'Food', 'Photography', 'Adventure', 'Culture', 'Nature', 'Art', 'Architecture', 'Music', 'Shopping'];
  const tourTypes = ['walking', 'driving', 'cycling', 'boat', 'bus', 'train', 'hiking', 'virtual'];
  const difficulties = ['easy', 'moderate', 'challenging', 'extreme'];

  const resizeImage = async (file: File): Promise<File> => {
    const scale = 0.8;
    const maxDim = 672;
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
          canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], file.name, { type: file.type }));
            else reject(new Error('Failed to resize image'));
          }, file.type, 0.9);
        } else reject(new Error('Failed to get canvas context'));
      };
      img.onerror = reject;
    });
  };

  const validateTour = (): string[] => {
    const validationErrors: string[] = [];
    if (!tourData.title.trim()) validationErrors.push('Tour title is required');
    if (!tourData.description.trim()) validationErrors.push('Tour description is required');
    if (!tourData.shortDescription.trim()) validationErrors.push('Short description is required');
    if (!tourData.locationCountry.trim()) validationErrors.push('Country is required');
    if (!tourData.locationCity.trim()) validationErrors.push('City is required');
    if (!tourData.locationAddress.trim()) validationErrors.push('Address is required');
    if (!tourData.meetingPoint.trim()) validationErrors.push('Meeting point is required');
    if (tourData.price <= 0) validationErrors.push('Tour price must be greater than 0');
    if (tourData.duration <= 0) validationErrors.push('Tour duration must be greater than 0');
    if (existingMainImageUrls.length + newMainImages.length === 0) {
      validationErrors.push('At least one main image is required');
    }
    tourData.schedules.forEach((schedule, index) => {
      if (!schedule.startDate || !schedule.endDate) {
        validationErrors.push(`Schedule ${index + 1} must have a start and end date.`);
      } else if (new Date(schedule.startDate) >= new Date(schedule.endDate)) {
        validationErrors.push(`Schedule ${index + 1} end date must be after the start date.`);
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
      // 1. Delete images marked for deletion from Supabase
      await Promise.all(imagesToDelete.map(url => deleteDocumentFromSupabase(url)));

      // 2. Upload NEW main images
      const newMainUrls = await Promise.all(
        newMainImages.map(async file => {
          const resized = await resizeImage(file);
          const newPublicUrl = await uploadDocumentToSupabase(resized, file.name, 'tour_images/main');
          uploadedPaths.push(newPublicUrl);
          return newPublicUrl;
        })
      );

      // 3. Upload NEW gallery images
      const newGalleryUrls = await Promise.all(
        newGalleryImages.map(async file => {
          const resized = await resizeImage(file);
          const publicUrl = await uploadDocumentToSupabase(resized, file.name, 'tour_images/gallery');
          uploadedPaths.push(publicUrl);
          return publicUrl;
        })
      );

      // 4. Update Tour (without schedules)
      const tourUpdateData = {
        title: tourData.title,
        description: tourData.description,
        shortDescription: tourData.shortDescription,
        category: tourData.category,
        type: tourData.type,
        duration: tourData.duration,
        maxGroupSize: tourData.maxGroupSize,
        minGroupSize: tourData.minGroupSize,
        price: tourData.price,
        currency: tourData.currency,
        difficulty: tourData.difficulty,
        locationCountry: tourData.locationCountry,
        locationState: tourData.locationState,
        locationCity: tourData.locationCity,
        locationAddress: tourData.locationAddress,
        latitude: tourData.latitude,
        longitude: tourData.longitude,
        locationZipCode: tourData.locationZipCode,
        meetingPoint: tourData.meetingPoint,
        inclusions: tourData.inclusions,
        exclusions: tourData.exclusions,
        requirements: tourData.requirements,
        tags: tourData.tags,
        itinerary: tourData.itinerary,
        images: {
          main: [...existingMainImageUrls, ...newMainUrls],
          gallery: [...existingGalleryImageUrls, ...newGalleryUrls],
        },
      };

      if (!tourId) {
        throw new Error('Tour ID is missing');
      }

      await api.put(`/tours/${tourId}`, tourUpdateData);

      // 5. Handle schedules separately
      await handleScheduleUpdates();

      // Navigate to tour details page
      const viewDetailsUrl = createViewDetailsUrl(tourId, 'tour');
      router.push(viewDetailsUrl);

    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || 'An unknown error occurred.';
      setErrors(['Failed to update tour. Please contact support.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Rollback: delete newly uploaded files if the API call fails
      await Promise.all(uploadedPaths.map(path => deleteDocumentFromSupabase(path)));
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdates = async () => {
    if (!tourId) {
      throw new Error('Tour ID is missing');
    }

    // Identify new, updated, and deleted schedules
    const originalScheduleIds = new Set(originalSchedules.map(s => s.id).filter(Boolean));
    const currentScheduleIds = new Set(tourData.schedules.map(s => s.id).filter(Boolean));

    // Find schedules to delete (in original but not in current)
    const schedulesToDelete = originalSchedules.filter(s => s.id && !currentScheduleIds.has(s.id));

    // Find schedules to create (no id)
    const schedulesToCreate = tourData.schedules.filter(s => !s.id);

    // Find schedules to update (has id and exists in both)
    const schedulesToUpdate = tourData.schedules.filter(s => s.id && originalScheduleIds.has(s.id));

    // Delete schedules
    await Promise.all(
      schedulesToDelete.map(schedule =>
        api.delete(`/tours/schedules/${schedule.id}`)
      )
    );

    // Create new schedules
    await Promise.all(
      schedulesToCreate.map(schedule => {
        const scheduleData = {
          startDate: new Date(schedule.startDate).toISOString(),
          endDate: new Date(schedule.endDate).toISOString(),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          availableSlots: schedule.availableSlots,
          isAvailable: schedule.isAvailable !== undefined ? schedule.isAvailable : true,
        };
        return api.post(`/tours/${tourId}/schedules`, scheduleData);
      })
    );

    // Update existing schedules
    await Promise.all(
      schedulesToUpdate.map(schedule => {
        const scheduleData = {
          startDate: new Date(schedule.startDate).toISOString(),
          endDate: new Date(schedule.endDate).toISOString(),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          availableSlots: schedule.availableSlots,
          isAvailable: schedule.isAvailable !== undefined ? schedule.isAvailable : true,
        };
        return api.put(`/tours/schedules/${schedule.id}`, scheduleData);
      })
    );
  };

  const addArrayItem = (field: 'inclusions' | 'exclusions' | 'requirements' | 'tags', value: string) => {
    if (value.trim()) {
      setTourData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
      if (field === 'inclusions') setTempInclusion('');
      else if (field === 'exclusions') setTempExclusion('');
      else if (field === 'requirements') setTempRequirement('');
      else if (field === 'tags') setTempTag('');
    }
  };

  const removeArrayItem = (field: 'inclusions' | 'exclusions' | 'requirements' | 'tags', index: number) => {
    setTourData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const addItineraryItem = () => {
    const newItem: TourItineraryItem = { title: '', description: '', duration: 1, order: tourData.itinerary.length + 1 };
    setTourData(prev => ({ ...prev, itinerary: [...prev.itinerary, newItem] }));
  };

  const updateItineraryItem = (index: number, field: keyof TourItineraryItem, value: string | number) => {
    setTourData(prev => ({ ...prev, itinerary: prev.itinerary.map((item, i) => i === index ? { ...item, [field]: value } : item) }));
  };

  const removeItineraryItem = (index: number) => {
    setTourData(prev => ({ ...prev, itinerary: prev.itinerary.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 })) }));
  };

  const addSchedule = () => {
    const newSchedule: TourSchedule = { startDate: '', endDate: '', startTime: '09:00', endTime: '17:00', availableSlots: tourData.maxGroupSize };
    setTourData(prev => ({ ...prev, schedules: [...prev.schedules, newSchedule] }));
  };

  const updateSchedule = (index: number, field: keyof TourSchedule, value: string | number) => {
    setTourData(prev => ({ ...prev, schedules: prev.schedules.map((schedule, i) => i === index ? { ...schedule, [field]: value } : schedule) }));
  };

  const removeSchedule = (index: number) => {
    setTourData(prev => ({ ...prev, schedules: prev.schedules.filter((_, i) => i !== index) }));
  };

  const handleNewMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewMainImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewMainImagePreviews(prev => [...prev, ...previews]);
  };

  const handleNewGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewGalleryImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewGalleryImagePreviews(prev => [...prev, ...previews]);
  };

  const removeNewMainImage = (index: number) => {
    setNewMainImages(prev => prev.filter((_, i) => i !== index));
    setNewMainImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewGalleryImage = (index: number) => {
    setNewGalleryImages(prev => prev.filter((_, i) => i !== index));
    setNewGalleryImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingMainImage = (index: number) => {
    const urlToRemove = existingMainImageUrls[index];
    setImagesToDelete(prev => [...prev, urlToRemove]);
    setExistingMainImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index: number) => {
    const urlToRemove = existingGalleryImageUrls[index];
    setImagesToDelete(prev => [...prev, urlToRemove]);
    setExistingGalleryImageUrls(prev => prev.filter((_, i) => i !== index));
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading tour data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-4 px-3">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm mb-6">
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Edit Tour</h1>
                <p className="text-gray-600 mt-2">Update your tour information and settings</p>
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
                {errors.map((error, index) => (<li key={index}>{error}</li>))}
              </ul>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white px-8 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} disabled={loading}
                className={`px-6 py-4 whitespace-nowrap text-base font-medium transition-colors disabled:opacity-50 ${activeTab === tab.id ? 'border-b-2 border-[#083A85] text-[#083A85]' : 'text-gray-500 hover:text-gray-700'}`}>
                <i className={`${tab.icon} mr-2`}></i>{tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'basic' && (
              <div className="space-y-8">
                {/* Tour Title */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Tour title</label>
                  <input type="text" value={tourData.title} onChange={(e) => setTourData(prev => ({ ...prev, title: e.target.value }))} disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="Give your tour a catchy title" maxLength={200} />
                  <div className="text-sm text-gray-500 mt-2">{tourData.title.length}/200</div>
                </div>
                {/* Description */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Description</label>
                  <textarea value={tourData.description} onChange={(e) => setTourData(prev => ({ ...prev, description: e.target.value }))} disabled={loading} rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="Tell guests what makes your tour special" maxLength={5000} />
                  <div className="text-sm text-gray-500 mt-2">{tourData.description.length}/5000</div>
                </div>
                {/* Short Description */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Short description</label>
                  <textarea value={tourData.shortDescription} onChange={(e) => setTourData(prev => ({ ...prev, shortDescription: e.target.value }))} disabled={loading} rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all"
                    placeholder="A quick summary for search results" maxLength={500} />
                  <div className="text-sm text-gray-500 mt-2">{tourData.shortDescription.length}/500</div>
                </div>
                {/* Category & Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Category</label>
                    <select value={tourData.category} onChange={(e) => setTourData(prev => ({ ...prev, category: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white">
                      {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Tour type</label>
                    <select value={tourData.type} onChange={(e) => setTourData(prev => ({ ...prev, type: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white">
                      {tourTypes.map(type => (<option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>))}
                    </select>
                  </div>
                </div>
                {/* Duration, Price, Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Duration (hours)</label>
                    <input type="number" value={tourData.duration} onChange={(e) => setTourData(prev => ({ ...prev, duration: Number(e.target.value) }))} disabled={loading} min="0.5" max="168" step="0.5"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Price (USD)</label>
                    <input type="number" value={tourData.price} onChange={(e) => setTourData(prev => ({ ...prev, price: Number(e.target.value) }))} disabled={loading} min="1" max="50000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Difficulty</label>
                    <select value={tourData.difficulty} onChange={(e) => setTourData(prev => ({ ...prev, difficulty: e.target.value as any }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all appearance-none bg-white">
                      {difficulties.map(diff => (<option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>))}
                    </select>
                  </div>
                </div>
                {/* Group Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Max group size</label>
                    <input type="number" value={tourData.maxGroupSize} onChange={(e) => setTourData(prev => ({ ...prev, maxGroupSize: Number(e.target.value) }))} disabled={loading} min="1" max="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Min group size (optional)</label>
                    <input type="number" value={tourData.minGroupSize || ''} onChange={(e) => setTourData(prev => ({ ...prev, minGroupSize: e.target.value ? Number(e.target.value) : undefined }))} disabled={loading} min="1" max={tourData.maxGroupSize}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-8">
                {/* Main Images */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Main images</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {existingMainImageUrls.map((url, index) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="existing" className="w-full h-32 object-cover rounded-xl" />
                        <button onClick={() => removeExistingMainImage(index)} disabled={loading} className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 hover:text-red-600 transition-colors">✕</button>
                      </div>
                    ))}
                    {newMainImagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <img src={preview} alt="new preview" className="w-full h-32 object-cover rounded-xl" />
                        <button onClick={() => removeNewMainImage(index)} disabled={loading} className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 hover:text-red-600 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                    <input type="file" multiple accept="image/*" onChange={handleNewMainImageUpload} disabled={loading} className="hidden" id="main-images" />
                    <label htmlFor="main-images" className="cursor-pointer">
                      <div className="text-[#083A85] text-4xl mb-2">↑</div>
                      <p className="text-gray-900 font-medium">Click to upload new main images</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>
                </div>
                {/* Gallery Images */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Gallery images (optional)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {existingGalleryImageUrls.map((url, index) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="existing gallery" className="w-full h-32 object-cover rounded-xl" />
                        <button onClick={() => removeExistingGalleryImage(index)} disabled={loading} className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 hover:text-red-600 transition-colors">✕</button>
                      </div>
                    ))}
                    {newGalleryImagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <img src={preview} alt="new gallery preview" className="w-full h-32 object-cover rounded-xl" />
                        <button onClick={() => removeNewGalleryImage(index)} disabled={loading} className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-500 hover:text-red-600 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                    <input type="file" multiple accept="image/*" onChange={handleNewGalleryImageUpload} disabled={loading} className="hidden" id="gallery-images" />
                    <label htmlFor="gallery-images" className="cursor-pointer">
                      <div className="text-[#083A85] text-4xl mb-2">↑</div>
                      <p className="text-gray-900 font-medium">Click to upload new gallery images</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Country</label>
                    <input type="text" value={tourData.locationCountry} onChange={(e) => setTourData(prev => ({ ...prev, locationCountry: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., United States" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">City</label>
                    <input type="text" value={tourData.locationCity} onChange={(e) => setTourData(prev => ({ ...prev, locationCity: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., New York" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">State/Province (optional)</label>
                    <input type="text" value={tourData.locationState} onChange={(e) => setTourData(prev => ({ ...prev, locationState: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., New York" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Zip code (optional)</label>
                    <input type="text" value={tourData.locationZipCode} onChange={(e) => setTourData(prev => ({ ...prev, locationZipCode: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., 10001" />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Address</label>
                  <input type="text" value={tourData.locationAddress} onChange={(e) => setTourData(prev => ({ ...prev, locationAddress: e.target.value }))} disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., 123 Main St" />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Meeting point</label>
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
                    <input type="text" value={tourData.meetingPoint} onChange={(e) => setTourData(prev => ({ ...prev, meetingPoint: e.target.value }))} disabled={loading}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="Or type meeting point manually" />
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
                    <label className="block text-base font-medium text-gray-900 mb-3">Latitude (optional)</label>
                    <input type="number" value={tourData.latitude || ''} onChange={(e) => setTourData(prev => ({ ...prev, latitude: e.target.value ? Number(e.target.value) : undefined }))} disabled={loading}
                      step="0.000001" min="-90" max="90" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., 40.7128" />
                  </div>
                  <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Longitude (optional)</label>
                    <input type="number" value={tourData.longitude || ''} onChange={(e) => setTourData(prev => ({ ...prev, longitude: e.target.value ? Number(e.target.value) : undefined }))} disabled={loading}
                      step="0.000001" min="-180" max="180" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., -74.0060" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Inclusions */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">What's included</label>
                  <div className="flex gap-3 mb-4">
                    <input type="text" value={tempInclusion} onChange={(e) => setTempInclusion(e.target.value)} disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., Professional guide"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('inclusions', tempInclusion))} />
                    <button onClick={() => addArrayItem('inclusions', tempInclusion)} disabled={loading || !tempInclusion.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.inclusions.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button onClick={() => removeArrayItem('inclusions', index)} disabled={loading} className="text-gray-500 hover:text-red-500 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Exclusions */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">What's not included</label>
                  <div className="flex gap-3 mb-4">
                    <input type="text" value={tempExclusion} onChange={(e) => setTempExclusion(e.target.value)} disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., Meals and drinks"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('exclusions', tempExclusion))} />
                    <button onClick={() => addArrayItem('exclusions', tempExclusion)} disabled={loading || !tempExclusion.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.exclusions.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button onClick={() => removeArrayItem('exclusions', index)} disabled={loading} className="text-gray-500 hover:text-red-500 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Requirements */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Guest requirements</label>
                  <div className="flex gap-3 mb-4">
                    <input type="text" value={tempRequirement} onChange={(e) => setTempRequirement(e.target.value)} disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., Comfortable walking shoes"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('requirements', tempRequirement))} />
                    <button onClick={() => addArrayItem('requirements', tempRequirement)} disabled={loading || !tempRequirement.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.requirements.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button onClick={() => removeArrayItem('requirements', index)} disabled={loading} className="text-gray-500 hover:text-red-500 transition-colors">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Tags */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">Tags</label>
                  <div className="flex gap-3 mb-4">
                    <input type="text" value={tempTag} onChange={(e) => setTempTag(e.target.value)} disabled={loading}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., family-friendly"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('tags', tempTag))} />
                    <button onClick={() => addArrayItem('tags', tempTag)} disabled={loading || !tempTag.trim()}
                      className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {tourData.tags.map((item, index) => (
                      <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        {item}
                        <button onClick={() => removeArrayItem('tags', index)} disabled={loading} className="text-gray-500 hover:text-red-500 transition-colors">✕</button>
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
                  <button onClick={addItineraryItem} disabled={loading}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add stop</button>
                </div>
                <div className="space-y-6">
                  {tourData.itinerary.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Stop {index + 1}</h4>
                        <button onClick={() => removeItineraryItem(index)} disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors font-medium">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">Title</label>
                          <input type="text" value={item.title} onChange={(e) => updateItineraryItem(index, 'title', e.target.value)} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="e.g., Explore the historic district" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">Duration (hours)</label>
                          <input type="number" value={item.duration} onChange={(e) => updateItineraryItem(index, 'duration', Number(e.target.value))} disabled={loading}
                            min="0.25" step="0.25" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-base font-medium text-gray-900 mb-3">Description</label>
                        <textarea value={item.description} onChange={(e) => updateItineraryItem(index, 'description', e.target.value)} disabled={loading}
                          rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" placeholder="What will guests do here?" />
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
                  <button onClick={addSchedule} disabled={loading}
                    className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Add dates</button>
                </div>
                <div className="space-y-6">
                  {tourData.schedules.map((schedule, index) => (
                    <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Date range {index + 1}</h4>
                        <button onClick={() => removeSchedule(index)} disabled={loading}
                          className="text-gray-500 hover:text-red-500 transition-colors font-medium">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">Start date</label>
                          <input type="date" value={schedule.startDate} onChange={(e) => updateSchedule(index, 'startDate', e.target.value)} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">End date</label>
                          <input type="date" value={schedule.endDate} onChange={(e) => updateSchedule(index, 'endDate', e.target.value)} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">Start time</label>
                          <input type="time" value={schedule.startTime} onChange={(e) => updateSchedule(index, 'startTime', e.target.value)} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                        </div>
                        <div>
                          <label className="block text-base font-medium text-gray-900 mb-3">End time</label>
                          <input type="time" value={schedule.endTime} onChange={(e) => updateSchedule(index, 'endTime', e.target.value)} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
                        </div>
                      </div>
                      <div className="mt-6">
                        <label className="block text-base font-medium text-gray-900 mb-3">Available spots</label>
                        <input type="number" value={schedule.availableSlots} onChange={(e) => updateSchedule(index, 'availableSlots', Number(e.target.value))} disabled={loading}
                          min="1" max={tourData.maxGroupSize} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20 disabled:opacity-50 transition-all" />
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
            <button onClick={() => router.back()} disabled={loading} className="px-8 py-3 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors">Cancel</button>
            <div className="flex gap-4">
              <button onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) - 1].id)} disabled={loading || activeTab === 'basic'}
                className="px-8 py-3 border border-gray-300 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-colors">Back</button>
              {activeTab === 'schedule' ? (
                <button onClick={handleSubmit} disabled={loading}
                  className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium flex items-center gap-3">
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              ) : (
                <button onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) + 1].id)} disabled={loading}
                  className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 transition-colors font-medium">Next</button>
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

export default EditTourContent;
