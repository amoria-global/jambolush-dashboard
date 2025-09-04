'use client';

import React, { useState, useRef, ChangeEvent } from 'react';

interface AvailabilityDates {
  start: string;
  end: string;
}

interface ImageFile {
  file: File;
  url: string;
  name: string;
}

interface VideoFile {
  file: File;
  url: string;
  name: string;
  size: number;
}

interface PropertyImages {
  livingRoom: ImageFile[];
  kitchen: ImageFile[];
  diningArea: ImageFile[];
  bedroom: ImageFile[];
  bathroom: ImageFile[];
  workspace: ImageFile[];
  balcony: ImageFile[];
  laundryArea: ImageFile[];
  gym: ImageFile[];
  exterior: ImageFile[];
  childrenPlayroom: ImageFile[];
}

interface FormData {
  name: string;
  location: string;
  availabilityDates: AvailabilityDates;
  pricePerTwoNights: string;
  type: string;
  features: string[];
  images: PropertyImages;
  video3D: VideoFile | null;
}

interface ImageCategory {
  name: keyof PropertyImages;
  label: string;
  maxImages: number;
}

const AddPropertyPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    location: '',
    availabilityDates: { start: '', end: '' },
    pricePerTwoNights: '',
    type: '',
    features: [],
    images: {
      livingRoom: [],
      kitchen: [],
      diningArea: [],
      bedroom: [],
      bathroom: [],
      workspace: [],
      balcony: [],
      laundryArea: [],
      gym: [],
      exterior: [],
      childrenPlayroom: []
    },
    video3D: null
  });

  const propertyTypes: string[] = [
    'Apartment', 'House', 'Villa', 'Condo', 'Townhouse',
    'Penthouse', 'Studio', 'Loft', 'Cottage', 'Bungalow'
  ];

  const imageCategories: ImageCategory[] = [
    { name: 'livingRoom', label: 'Living Room', maxImages: 6 },
    { name: 'kitchen', label: 'Kitchen', maxImages: 4 },
    { name: 'diningArea', label: 'Dining Area', maxImages: 2 },
    { name: 'bedroom', label: 'Bedroom', maxImages: 5 },
    { name: 'bathroom', label: 'Bathroom', maxImages: 5 },
    { name: 'workspace', label: 'Workspace', maxImages: 4 },
    { name: 'balcony', label: 'Balcony', maxImages: 5 },
    { name: 'laundryArea', label: 'Laundry Area', maxImages: 3 },
    { name: 'gym', label: 'Gym', maxImages: 5 },
    { name: 'exterior', label: 'Exterior', maxImages: 5 },
    { name: 'childrenPlayroom', label: 'Children Playroom', maxImages: 4 }
  ];

  const getAllPossibleFeatures = (): string[] => {
    const allFeatures = [
      // Basic Amenities
      'WiFi', 'Air Conditioning', 'Heating', 'Parking', 'TV', 'Cable TV',
      'Smart TV', 'Sound System', 'Security System', 'Smoke Detector',

      // Kitchen & Dining
      'Full Kitchen', 'Kitchenette', 'Refrigerator', 'Microwave', 'Oven',
      'Stove', 'Dishwasher', 'Coffee Maker', 'Toaster', 'Blender',
      'Dining Table', 'Bar Counter', 'Wine Cooler',

      // Bathroom
      'Hair Dryer', 'Bathtub', 'Shower', 'Hot Water', 'Towels Provided',
      'Toiletries', 'Bidet', 'Jacuzzi',

      // Bedroom & Living
      'King Bed', 'Queen Bed', 'Single Bed', 'Sofa Bed', 'Extra Bedding',
      'Closet', 'Hangers', 'Iron', 'Fireplace', 'Ceiling Fan',

      // Outdoor & Leisure
      'Pool', 'Hot Tub', 'Garden', 'BBQ Area', 'Patio', 'Balcony View',
      'Terrace', 'Outdoor Seating', 'Fire Pit', 'Playground',

      // Work & Study
      'Dedicated Workspace', 'Desk', 'Ergonomic Chair', 'Monitor',
      'Printer', 'High-Speed Internet', 'Video Conference Setup',

      // Laundry & Cleaning
      'Washing Machine', 'Dryer', 'Shared Laundry', 'Ironing Board',
      'Cleaning Service', 'Daily Housekeeping',

      // Building Features
      'Elevator', 'Gym Access', 'Pool Access', 'Concierge', 'Doorman',
      'Pet Friendly', 'Wheelchair Accessible', 'Private Entrance',

      // Special Features
      'Beach Access', 'Lake View', 'Mountain View', 'City View',
      'Guest House', 'Game Room', 'Home Theater', 'Library',
      'Wine Cellar', 'Sauna', 'Steam Room'
    ];

    return allFeatures.sort();
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const capitalizeFirstLetter = (str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: capitalizeFirstLetter(value) }));
    } else if (name === 'startDate' || name === 'endDate') {
      setFormData(prev => ({
        ...prev,
        availabilityDates: {
          ...prev.availabilityDates,
          [name === 'startDate' ? 'start' : 'end']: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = (category: keyof PropertyImages, files: FileList | null) => {
    if (!files) return;

    const categoryConfig = imageCategories.find(cat => cat.name === category);
    if (!categoryConfig) return;

    const maxImages = categoryConfig.maxImages;
    const fileArray = Array.from(files);

    if (formData.images[category].length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed for ${category}`);
      return;
    }

    const newImages: ImageFile[] = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [category]: [...prev.images[category], ...newImages]
      }
    }));
  };

  const handleVideoUpload = (file: File | null) => {
    if (!file) return;

    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validVideoTypes.includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, MOV, AVI)');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB in bytes
    if (file.size > maxSize) {
      alert('Video file size must be less than 500MB');
      return;
    }

    setVideoUploadProgress(0);
    const interval = setInterval(() => {
      setVideoUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    const newVideo: VideoFile = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    };

    setFormData(prev => ({
      ...prev,
      video3D: newVideo
    }));
  };

  const removeVideo = () => {
    if (formData.video3D?.url) {
      URL.revokeObjectURL(formData.video3D.url);
    }
    setFormData(prev => ({
      ...prev,
      video3D: null
    }));
    setVideoUploadProgress(0);
  };

  const removeImage = (category: keyof PropertyImages, index: number) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [category]: prev.images[category].filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = () => {
    console.log('Property Data:', formData);
    alert('Property added successfully!');
    setIsModalOpen(false);
    setTimeout(() => {
      resetForm();
      setIsModalOpen(true);
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      availabilityDates: { start: '', end: '' },
      pricePerTwoNights: '',
      type: '',
      features: [],
      images: {
        livingRoom: [],
        kitchen: [],
        diningArea: [],
        bedroom: [],
        bathroom: [],
        workspace: [],
        balcony: [],
        laundryArea: [],
        gym: [],
        exterior: [],
        childrenPlayroom: []
      },
      video3D: null
    });
    setCurrentStep(1);
    setVideoUploadProgress(0);
  };

  const isStepValid = (): boolean => {
    if (currentStep === 1) {
      return !!(formData.name && formData.location &&
             formData.availabilityDates.start && formData.availabilityDates.end &&
             formData.pricePerTwoNights && formData.type);
    }
    if (currentStep === 2) {
      return formData.features.length > 0;
    }
    if (currentStep === 3) {
      if (!formData.video3D) {
        return false;
      }
      for (const category of imageCategories) {
        const categoryImages = formData.images[category.name];
        if (categoryImages.length > 0 && categoryImages.length < category.maxImages) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const getStepLabel = (step: number): string => {
    switch(step) {
      case 1: return 'Property Details';
      case 2: return 'Property Features';
      case 3: return 'Media Upload';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
            <div className="relative bg-white rounded-xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Add Your Property</h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">Step {currentStep} of 3</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="cursor-pointer p-2 sm:p-3 bg-gray-300 text-gray-600 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Steps */}
              <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-medium transition-all
                          ${currentStep >= step
                            ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-lg'
                            : 'bg-gray-200 text-gray-600'}
                        `}>
                          {currentStep > step ? '✓' : step}
                        </div>
                        <span className="text-xs sm:text-sm lg:text-base font-semibold text-gray-600 mt-1 sm:mt-2 whitespace-nowrap text-center">
                          <span className="hidden sm:inline">{getStepLabel(step)}</span>
                          <span className="sm:hidden">
                            {step === 1 ? 'Details' : step === 2 ? 'Features' : 'Media'}
                          </span>
                        </span>
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-all self-start mt-4 sm:mt-5 ${
                          currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Content */}
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                {currentStep === 1 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-4">
                        Property Information
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                        Please provide details about your property
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                        Property Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter property name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Available From
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.availabilityDates.start}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Available Until
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.availabilityDates.end}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                        Price per 2 Nights
                      </label>
                      <input
                        type="number"
                        name="pricePerTwoNights"
                        value={formData.pricePerTwoNights}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold"
                      />
                    </div>

                    <div className="pb-4">
                      <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                        Property Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Select property type</option>
                        {propertyTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                        Select Property Features
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-4">
                        Choose all the features and amenities available at your property
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 mb-4">
                        <p className="text-sm sm:text-base text-blue-800">
                          Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {getAllPossibleFeatures().map(feature => (
                        <div
                          key={feature}
                          onClick={() => handleFeatureToggle(feature)}
                          className={`
                            flex items-center p-2 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all select-none
                            ${formData.features.includes(feature)
                              ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-md'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-4 h-4 sm:w-5 sm:h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0
                              ${formData.features.includes(feature)
                                ? 'border-white bg-white'
                                : 'border-gray-400'
                              }
                            `}>
                              {formData.features.includes(feature) && (
                                <span className="text-[#083A85] text-xs sm:text-base">✓</span>
                              )}
                            </div>
                            <span className="text-xs sm:text-base">{feature}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                        Upload Property Media
                      </h3>

                      {/* Video Upload Section */}
                      <div className="mb-6 sm:mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                          <div className="flex items-start">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm sm:text-base font-medium text-red-800">
                                3D Property Video - REQUIRED
                              </p>
                              <p className="text-xs sm:text-base font-medium text-red-700 mt-1">
                                You must upload a 3D walkthrough video of your property to proceed. This helps potential renters get a complete view of the space.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all ${
                          formData.video3D
                            ? 'border-green-400 bg-green-50'
                            : 'border-red-400 bg-red-50'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-base sm:text-lg font-medium text-gray-900">
                              3D Property Video
                              {!formData.video3D && (
                                <span className="ml-2 text-sm sm:text-base text-red-600">*Required</span>
                              )}
                            </h4>
                            {formData.video3D && (
                              <span className="text-sm sm:text-base text-green-600 font-medium">✓ Uploaded</span>
                            )}
                          </div>

                          {!formData.video3D ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => videoInputRef.current?.click()}
                                className="w-full py-6 sm:py-8 border-2 border-dashed border-red-300 rounded-lg flex flex-col items-center justify-center hover:border-red-400 hover:bg-red-100 transition-all cursor-pointer"
                              >
                                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-red-400 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm sm:text-base font-medium text-gray-700">Click to upload 3D video</span>
                                <span className="text-xs sm:text-base text-gray-500 mt-1">MP4, WebM, MOV, AVI (Max 500MB)</span>
                              </button>
                              <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)}
                                className="hidden"
                              />
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg p-3 sm:p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{formData.video3D.name}</p>
                                    <p className="text-xs sm:text-base text-gray-500">{formatFileSize(formData.video3D.size)}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={removeVideo}
                                  className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                                <div className="mt-3">
                                  <div className="bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                      style={{ width: `${videoUploadProgress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs sm:text-base text-gray-500 mt-1">Uploading... {videoUploadProgress}%</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Images Upload Section */}
                      <div>
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          Property Images (Optional)
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 mb-4">
                          Upload high-quality images for different areas of your property
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-3 mb-4">
                          <p className="text-xs sm:text-base text-amber-800">
                            <strong>Note:</strong> Images are optional, but if you start uploading for a category, you must complete it with the maximum allowed images.
                          </p>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                          {imageCategories.map(category => {
                            const currentCount = formData.images[category.name].length;
                            const isIncomplete = currentCount > 0 && currentCount < category.maxImages;

                            return (
                              <div
                                key={category.name}
                                className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                                  isIncomplete
                                    ? 'border-amber-400 bg-amber-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm sm:text-base font-medium text-gray-900">
                                    {category.label}
                                    {isIncomplete && (
                                      <span className="ml-2 text-xs sm:text-base text-amber-600">
                                        (Incomplete - {category.maxImages - currentCount} more required)
                                      </span>
                                    )}
                                  </h5>
                                  <span className={`text-xs sm:text-base ${
                                    currentCount === category.maxImages
                                      ? 'text-green-600 font-medium'
                                      : 'text-gray-500'
                                  }`}>
                                    {currentCount}/{category.maxImages} images
                                    {currentCount === category.maxImages && ' ✓'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
                                  {formData.images[category.name].map((image, index) => (
                                    <div key={index} className="relative group">
                                      <img
                                        src={image.url}
                                        alt={`${category.label} ${index + 1}`}
                                        className="w-full h-16 sm:h-20 lg:h-24 object-cover rounded-lg"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeImage(category.name, index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                      >
                                        <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}

                                  {formData.images[category.name].length < category.maxImages && (
                                    <button
                                      type="button"
                                      onClick={() => fileInputRefs.current[category.name]?.click()}
                                      className={`h-16 sm:h-20 lg:h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                                        isIncomplete
                                          ? 'border-amber-400 bg-amber-50 hover:border-amber-500 hover:bg-amber-100'
                                          : 'border-gray-300 hover:border-[#083A85] hover:bg-blue-50'
                                      }`}
                                    >
                                      <svg className={`w-4 h-4 sm:w-6 sm:h-6 mb-1 ${isIncomplete ? 'text-amber-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                      <span className={`text-xs ${isIncomplete ? 'text-amber-600' : 'text-gray-500'}`}>
                                        Upload
                                      </span>
                                    </button>
                                  )}
                                </div>

                                <input
                                  ref={el => {
                                    if (el) fileInputRefs.current[category.name] = el;
                                  }}
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(category.name, e.target.files)}
                                  className="hidden"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Navigation */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between z-10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                  }`}
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!isStepValid()}
                    className={`inline-flex items-center px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                      isStepValid()
                        ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isStepValid()}
                    className={`inline-flex items-center px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium transition-all ${
                      isStepValid()
                        ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] shadow-lg hover:shadow-xl cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Add Property
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isModalOpen && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Property Added Successfully!</h2>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: #083A85;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #0a4499;
        }

        @media (max-width: 640px) {
          ::-webkit-scrollbar {
            width: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default AddPropertyPage;