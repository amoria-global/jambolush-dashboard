import api from '@/app/api/apiService';
import uploadDocumentToSupabase, { deleteDocumentFromSupabase } from '@/app/api/storage';
import React, { useState, useEffect } from 'react';

// --- Reusable Interfaces ---
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

interface EditTourModalProps {
  tourId: string;
  onClose: () => void;
  onUpdate: () => void; // To refresh data on the parent component
}

const EditTourModal: React.FC<EditTourModalProps> = ({ tourId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  
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
    if (!tourId) return;
    const fetchTour = async () => {
      setInitialLoading(true);
      try {
        const response = await api.get(`/tours/${tourId}`);
        const fetchedData = response.data.data;

        // Pre-process data for form compatibility
        const formattedSchedules = (fetchedData.schedules || []).map((s: any) => ({
          ...s,
          startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
          endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : '',
        }));

        const parsedItinerary = typeof fetchedData.itinerary === 'string'
          ? JSON.parse(fetchedData.itinerary)
          : (fetchedData.itinerary || []);

        setTourData({ ...fetchedData, schedules: formattedSchedules, itinerary: parsedItinerary });
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

      // 4. Construct a CLEAN final data payload
      // THIS IS THE KEY CHANGE: We explicitly define the object to avoid sending extra data.
     const finalData = {
        // Basic Info
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

        // Location Info
        locationCountry: tourData.locationCountry,
        locationState: tourData.locationState,
        locationCity: tourData.locationCity,
        locationAddress: tourData.locationAddress,
        latitude: tourData.latitude,
        longitude: tourData.longitude,
        locationZipCode: tourData.locationZipCode,
        meetingPoint: tourData.meetingPoint,

        // Details
        inclusions: tourData.inclusions,
        exclusions: tourData.exclusions,
        requirements: tourData.requirements,
        tags: tourData.tags,

        // Itinerary (Stringified for backend)
        itinerary: JSON.stringify(tourData.itinerary),

        // Images (Combined existing and new URLs)
        images: {
            main: [...existingMainImageUrls, ...newMainUrls],
            gallery: [...existingGalleryImageUrls, ...newGalleryUrls],
        },

        // Schedules (Correctly formatted for Prisma nested write)
        schedules: {
            // 1. Delete all existing schedules for this tour
            deleteMany: {},
            // 2. Create the new schedules from the form data
            create: tourData.schedules.map(s => ({
            startDate: s.startDate,
            endDate: s.endDate,
            startTime: s.startTime,
            endTime: s.endTime,
            availableSlots: s.availableSlots
            })),
        },
        };

      // 5. Send PUT request with the clean payload
      await api.put(`/tours/${tourId}`, finalData);
      
      alert('Tour updated successfully!');
      onUpdate();
      onClose();

    } catch (error: any) {
      const errorMessage = error.data?.message || error.message || 'An unknown error occurred.';
      setErrors(['Failed to update tour. Pease contact support.']);
      
      // Rollback: delete newly uploaded files if the API call fails
      await Promise.all(uploadedPaths.map(path => deleteDocumentFromSupabase(path)));
    } finally {
      setLoading(false);
    }
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

  const tabs = [
    { id: 'basic' as ActiveTab, label: 'Basic Info', icon: '📝' },
    { id: 'images' as ActiveTab, label: 'Images', icon: '📸' },
    { id: 'location' as ActiveTab, label: 'Location', icon: '📍' },
    { id: 'details' as ActiveTab, label: 'Details', icon: '⚙️' },
    { id: 'itinerary' as ActiveTab, label: 'Itinerary', icon: '📋' },
    { id: 'schedule' as ActiveTab, label: 'Schedule', icon: '📅' }
  ];

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900">Edit your tour</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-500 hover:text-gray-700 text-2xl font-light disabled:opacity-50 transition-colors">✕</button>
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
        <div className="flex border-b border-gray-200 bg-white px-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} disabled={loading}
              className={`px-6 py-4 whitespace-nowrap text-base font-medium transition-colors disabled:opacity-50 ${activeTab === tab.id ? 'border-b-2 border-[#083A85] text-[#083A85]' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="mr-2">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
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
                      <button onClick={() => removeExistingMainImage(index)} className="absolute top-2 right-2 bg-white/70 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                  {newMainImagePreviews.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <img src={preview} alt="new preview" className="w-full h-32 object-cover rounded-xl" />
                      <button onClick={() => removeNewMainImage(index)} className="absolute top-2 right-2 bg-white/70 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleNewMainImageUpload} disabled={loading} className="hidden" id="main-images" />
                  <label htmlFor="main-images" className="cursor-pointer">
                    <div className="text-[#083A85] text-4xl mb-2">↑</div>
                    <p className="text-gray-900 font-medium">Click to upload NEW main images</p>
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
                      <button onClick={() => removeExistingGalleryImage(index)} className="absolute top-2 right-2 bg-white/70 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                  {newGalleryImagePreviews.map((preview, index) => (
                    <div key={preview} className="relative group">
                      <img src={preview} alt="new gallery preview" className="w-full h-32 object-cover rounded-xl" />
                      <button onClick={() => removeNewGalleryImage(index)} className="absolute top-2 right-2 bg-white/70 rounded-full p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#083A85] transition-colors">
                  <input type="file" multiple accept="image/*" onChange={handleNewGalleryImageUpload} disabled={loading} className="hidden" id="gallery-images" />
                  <label htmlFor="gallery-images" className="cursor-pointer">
                    <div className="text-[#083A85] text-4xl mb-2">↑</div>
                    <p className="text-gray-900 font-medium">Click to upload NEW gallery images</p>
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20" placeholder="e.g., United States" />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-gray-900 mb-3">City</label>
                        <input type="text" value={tourData.locationCity} onChange={(e) => setTourData(prev => ({ ...prev, locationCity: e.target.value }))} disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20" placeholder="e.g., New York" />
                    </div>
                </div>
                <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Address</label>
                    <input type="text" value={tourData.locationAddress} onChange={(e) => setTourData(prev => ({ ...prev, locationAddress: e.target.value }))} disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20" placeholder="e.g., 123 Main St" />
                </div>
                <div>
                    <label className="block text-base font-medium text-gray-900 mb-3">Meeting point</label>
                    <input type="text" value={tourData.meetingPoint} onChange={(e) => setTourData(prev => ({ ...prev, meetingPoint: e.target.value }))} disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-2 focus:ring-[#083A85]/20" placeholder="Where guests should meet you" />
                </div>
            </div>
          )}
          {activeTab === 'details' && (
            <div className="space-y-8">
               {/* Inclusions */}
               <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">What’s included</label>
                  <div className="flex gap-3 mb-4">
                     <input type="text" value={tempInclusion} onChange={(e) => setTempInclusion(e.target.value)} disabled={loading}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl" placeholder="e.g., Professional guide"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('inclusions', tempInclusion))} />
                     <button onClick={() => addArrayItem('inclusions', tempInclusion)} disabled={loading || !tempInclusion.trim()}
                        className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 font-medium">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                     {tourData.inclusions.map((item, index) => (
                        <span key={index} className="bg-gray-100 text-gray-900 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                           {item}
                           <button onClick={() => removeArrayItem('inclusions', index)} disabled={loading} className="text-gray-500 hover:text-red-500">✕</button>
                        </span>
                     ))}
                  </div>
               </div>
               {/* Exclusions, Requirements, Tags with similar structure */}
            </div>
          )}
          {activeTab === 'itinerary' && (
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Itinerary</h3>
                    <button onClick={addItineraryItem} disabled={loading}
                        className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 font-medium">Add stop</button>
                </div>
                <div className="space-y-6">
                    {tourData.itinerary.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-medium text-gray-900">Stop {index + 1}</h4>
                                <button onClick={() => removeItineraryItem(index)} disabled={loading}
                                    className="text-gray-500 hover:text-red-500 font-medium">Remove</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-900 mb-3">Title</label>
                                    <input type="text" value={item.title} onChange={(e) => updateItineraryItem(index, 'title', e.target.value)} disabled={loading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-900 mb-3">Duration (hours)</label>
                                    <input type="number" value={item.duration} onChange={(e) => updateItineraryItem(index, 'duration', Number(e.target.value))} disabled={loading}
                                        min="0.25" step="0.25" className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                            <div className="mt-6">
                                <label className="block text-base font-medium text-gray-900 mb-3">Description</label>
                                <textarea value={item.description} onChange={(e) => updateItineraryItem(index, 'description', e.target.value)} disabled={loading}
                                    rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
          {activeTab === 'schedule' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
                    <button onClick={addSchedule} disabled={loading}
                        className="px-6 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 font-medium">Add dates</button>
                </div>
                <div className="space-y-6">
                    {tourData.schedules.map((schedule, index) => (
                        <div key={index} className="border border-gray-200 rounded-2xl p-6 bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-medium text-gray-900">Date range {index + 1}</h4>
                                <button onClick={() => removeSchedule(index)} disabled={loading}
                                    className="text-gray-500 hover:text-red-500 font-medium">Remove</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-base font-medium text-gray-900 mb-3">Start date</label>
                                    <input type="date" value={schedule.startDate} onChange={(e) => updateSchedule(index, 'startDate', e.target.value)} disabled={loading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                                <div>
                                    <label className="block text-base font-medium text-gray-900 mb-3">End date</label>
                                    <input type="date" value={schedule.endDate} onChange={(e) => updateSchedule(index, 'endDate', e.target.value)} disabled={loading}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-6 bg-white flex justify-between items-center">
          <button onClick={onClose} disabled={loading} className="px-8 py-3 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <div className="flex gap-4">
            <button onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) - 1].id)} disabled={loading || activeTab === 'basic'}
              className="px-8 py-3 border border-gray-300 text-gray-900 font-medium rounded-xl hover:bg-gray-100 disabled:opacity-50">Back</button>
            {activeTab === 'schedule' ? (
              <button onClick={handleSubmit} disabled={loading}
                className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 font-medium flex items-center gap-3">
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button onClick={() => setActiveTab(tabs[tabs.findIndex(t => t.id === activeTab) + 1].id)} disabled={loading}
                className="px-8 py-3 bg-[#083A85] text-white rounded-xl hover:bg-[#05285E] disabled:opacity-50 font-medium">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTourModal;