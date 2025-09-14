import api from '@/app/api/apiService';
import React, { useState } from 'react';

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

type ActiveTab = 'basic' | 'location' | 'details' | 'itinerary' | 'schedule';

interface AddTourModalProps {
    onClose: () => void;
}

const AddTourModal: React.FC<AddTourModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

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

  const categories = ['History', 'Food', 'Photography', 'Adventure', 'Culture', 'Nature', 'Art', 'Architecture', 'Music', 'Shopping'];
  const tourTypes = ['walking', 'driving', 'cycling', 'boat', 'bus', 'train', 'hiking', 'virtual'];
  const difficulties = ['easy', 'moderate', 'challenging', 'extreme'];

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
      return;
    }

    setLoading(true);
    try {
      await api.post('/tours', tourData);
      setTimeout(() => {
        //onClose();
      }, 3000);;
      resetForm();
      alert('Tour created successfully!');
    } catch (error) {
      setErrors(['Failed to create tour. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTourData({
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
    setActiveTab('basic');
    setErrors([]);
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

  const tabs = [
    { id: 'basic' as ActiveTab, label: 'Basic Info', icon: '📝' },
    { id: 'location' as ActiveTab, label: 'Location', icon: '📍' },
    { id: 'details' as ActiveTab, label: 'Details', icon: '⚙️' },
    { id: 'itinerary' as ActiveTab, label: 'Itinerary', icon: '📋' },
    { id: 'schedule' as ActiveTab, label: 'Schedule', icon: '📅' }
  ];

  return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Create New Tour</h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-600 hover:text-red-600 text-2xl cursor-pointer disabled:opacity-50"
              >
                x
              </button>
            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
                <ul className="text-red-600 text-sm space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b bg-gray-50 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={loading}
                  className={`px-4 py-3 whitespace-nowrap text-sm font-medium border-b-2 cursor-pointer disabled:opacity-50 ${
                    activeTab === tab.id
                      ? 'border-[#F20C8F] text-[#F20C8F] bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-96">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tour Title *
                    </label>
                    <input
                      type="text"
                      value={tourData.title}
                      onChange={(e) => setTourData(prev => ({ ...prev, title: e.target.value }))}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      placeholder="Enter tour title (max 200 characters)"
                      maxLength={200}
                    />
                    <div className="text-xs text-gray-500 mt-1">{tourData.title.length}/200 characters</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={tourData.description}
                      onChange={(e) => setTourData(prev => ({ ...prev, description: e.target.value }))}
                      disabled={loading}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      placeholder="Detailed description of your tour (max 5000 characters)"
                      maxLength={5000}
                    />
                    <div className="text-xs text-gray-500 mt-1">{tourData.description.length}/5000 characters</div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description *
                    </label>
                    <textarea
                      value={tourData.shortDescription}
                      onChange={(e) => setTourData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      disabled={loading}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      placeholder="Brief summary for listings (max 500 characters)"
                      maxLength={500}
                    />
                    <div className="text-xs text-gray-500 mt-1">{tourData.shortDescription.length}/500 characters</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={tourData.category}
                        onChange={(e) => setTourData(prev => ({ ...prev, category: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50 cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tour Type *
                      </label>
                      <select
                        value={tourData.type}
                        onChange={(e) => setTourData(prev => ({ ...prev, type: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50 cursor-pointer"
                      >
                        {tourTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (hours) *
                      </label>
                      <input
                        type="number"
                        value={tourData.duration}
                        onChange={(e) => setTourData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                        disabled={loading}
                        min="0.5"
                        max="168"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        value={tourData.price}
                        onChange={(e) => setTourData(prev => ({ ...prev, price: Number(e.target.value) }))}
                        disabled={loading}
                        min="1"
                        max="50000"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={tourData.difficulty}
                        onChange={(e) => setTourData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50 cursor-pointer"
                      >
                        {difficulties.map(diff => (
                          <option key={diff} value={diff}>
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Group Size *
                      </label>
                      <input
                        type="number"
                        value={tourData.maxGroupSize}
                        onChange={(e) => setTourData(prev => ({ ...prev, maxGroupSize: Number(e.target.value) }))}
                        disabled={loading}
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Group Size
                      </label>
                      <input
                        type="number"
                        value={tourData.minGroupSize || ''}
                        onChange={(e) => setTourData(prev => ({ ...prev, minGroupSize: e.target.value ? Number(e.target.value) : undefined }))}
                        disabled={loading}
                        min="1"
                        max={tourData.maxGroupSize}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={tourData.locationCountry}
                        onChange={(e) => setTourData(prev => ({ ...prev, locationCountry: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Enter country"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={tourData.locationCity}
                        onChange={(e) => setTourData(prev => ({ ...prev, locationCity: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Enter city"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={tourData.locationState}
                        onChange={(e) => setTourData(prev => ({ ...prev, locationState: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Enter state or province"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={tourData.locationZipCode}
                        onChange={(e) => setTourData(prev => ({ ...prev, locationZipCode: e.target.value }))}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Enter zip code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={tourData.locationAddress}
                      onChange={(e) => setTourData(prev => ({ ...prev, locationAddress: e.target.value }))}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      placeholder="Enter full address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Point *
                    </label>
                    <input
                      type="text"
                      value={tourData.meetingPoint}
                      onChange={(e) => setTourData(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                      placeholder="Where should participants meet?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        value={tourData.latitude || ''}
                        onChange={(e) => setTourData(prev => ({ ...prev, latitude: e.target.value ? Number(e.target.value) : undefined }))}
                        disabled={loading}
                        step="0.000001"
                        min="-90"
                        max="90"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="e.g., 40.7128"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        value={tourData.longitude || ''}
                        onChange={(e) => setTourData(prev => ({ ...prev, longitude: e.target.value ? Number(e.target.value) : undefined }))}
                        disabled={loading}
                        step="0.000001"
                        min="-180"
                        max="180"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="e.g., -74.0060"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Inclusions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's Included
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempInclusion}
                        onChange={(e) => setTempInclusion(e.target.value)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Add inclusion (e.g., Professional guide)"
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('inclusions', tempInclusion)}
                      />
                      <button
                        onClick={() => addArrayItem('inclusions', tempInclusion)}
                        disabled={loading || !tempInclusion.trim()}
                        className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tourData.inclusions.map((item, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {item}
                          <button
                            onClick={() => removeArrayItem('inclusions', index)}
                            disabled={loading}
                            className="hover:text-green-600 cursor-pointer disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's Not Included
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempExclusion}
                        onChange={(e) => setTempExclusion(e.target.value)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Add exclusion (e.g., Meals)"
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('exclusions', tempExclusion)}
                      />
                      <button
                        onClick={() => addArrayItem('exclusions', tempExclusion)}
                        disabled={loading || !tempExclusion.trim()}
                        className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tourData.exclusions.map((item, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {item}
                          <button
                            onClick={() => removeArrayItem('exclusions', index)}
                            disabled={loading}
                            className="hover:text-red-600 cursor-pointer disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Requirements
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempRequirement}
                        onChange={(e) => setTempRequirement(e.target.value)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Add requirement (e.g., Comfortable walking shoes)"
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('requirements', tempRequirement)}
                      />
                      <button
                        onClick={() => addArrayItem('requirements', tempRequirement)}
                        disabled={loading || !tempRequirement.trim()}
                        className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tourData.requirements.map((item, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {item}
                          <button
                            onClick={() => removeArrayItem('requirements', index)}
                            disabled={loading}
                            className="hover:text-blue-600 cursor-pointer disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tempTag}
                        onChange={(e) => setTempTag(e.target.value)}
                        disabled={loading}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                        placeholder="Add tag (e.g., family-friendly)"
                        onKeyPress={(e) => e.key === 'Enter' && addArrayItem('tags', tempTag)}
                      />
                      <button
                        onClick={() => addArrayItem('tags', tempTag)}
                        disabled={loading || !tempTag.trim()}
                        className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tourData.tags.map((item, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          {item}
                          <button
                            onClick={() => removeArrayItem('tags', index)}
                            disabled={loading}
                            className="hover:text-purple-600 cursor-pointer disabled:opacity-50"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-800">Tour Itinerary</h3>
                    <button
                      onClick={addItineraryItem}
                      disabled={loading}
                      className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                    >
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tourData.itinerary.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-md font-medium text-gray-800">Item {index + 1}</h4>
                          <button
                            onClick={() => removeItineraryItem(index)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItineraryItem(index, 'title', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                              placeholder="e.g., Visit Historic District"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Duration (hours)
                            </label>
                            <input
                              type="number"
                              value={item.duration}
                              onChange={(e) => updateItineraryItem(index, 'duration', Number(e.target.value))}
                              disabled={loading}
                              min="0.25"
                              step="0.25"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateItineraryItem(index, 'description', e.target.value)}
                            disabled={loading}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            placeholder="Describe what happens during this part of the tour"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {tourData.itinerary.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No itinerary items yet.</p>
                      <p className="text-sm">Add items to create a detailed tour schedule.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-800">Tour Schedules</h3>
                    <button
                      onClick={addSchedule}
                      disabled={loading}
                      className="px-4 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                    >
                      Add Schedule
                    </button>
                  </div>

                  <div className="space-y-4">
                    {tourData.schedules.map((schedule, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-md font-medium text-gray-800">Schedule {index + 1}</h4>
                          <button
                            onClick={() => removeSchedule(index)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 cursor-pointer disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={schedule.startDate}
                              onChange={(e) => updateSchedule(index, 'startDate', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={schedule.endDate}
                              onChange={(e) => updateSchedule(index, 'endDate', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={schedule.startTime}
                              onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={schedule.endTime}
                              onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                              disabled={loading}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Available Slots
                          </label>
                          <input
                            type="number"
                            value={schedule.availableSlots}
                            onChange={(e) => updateSchedule(index, 'availableSlots', Number(e.target.value))}
                            disabled={loading}
                            min="1"
                            max={tourData.maxGroupSize}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F20C8F] disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {tourData.schedules.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No schedules yet.</p>
                      <p className="text-sm">Add schedules to make your tour bookable.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-gray-50 flex justify-between">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
                    if (currentTabIndex > 0) {
                      setActiveTab(tabs[currentTabIndex - 1].id);
                    }
                  }}
                  disabled={loading || activeTab === 'basic'}
                  className="px-6 py-2 border border-[#F20C8F] text-[#F20C8F] rounded-lg hover:bg-[#F20C8F] hover:text-white disabled:opacity-50 cursor-pointer transition-colors"
                >
                  Previous
                </button>
                
                {activeTab === 'schedule' ? (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    {loading ? 'Creating...' : 'Create Tour'}
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
                    className="px-6 py-2 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] disabled:opacity-50 cursor-pointer"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
  );
};

export default AddTourModal;