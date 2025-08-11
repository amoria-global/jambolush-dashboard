'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, Check, ChevronRight, ChevronLeft, MapPin, Home, Calendar, DollarSign } from 'lucide-react';

interface AvailabilityDates {
  start: string;
  end: string;
}

interface ImageFile {
  file: File;
  url: string;
  name: string;
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
}

interface ImageCategory {
  name: keyof PropertyImages;
  label: string;
  maxImages: number;
}

const AddPropertyPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true); // Auto-open modal
  const [currentStep, setCurrentStep] = useState<number>(1);
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
    }
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

  const capitalizeFirstLetter = (str: string): string => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
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
    // After closing, you might want to redirect or show success state
    setTimeout(() => {
      resetForm();
      setIsModalOpen(true); // Re-open for demo purposes
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
      }
    });
    setCurrentStep(1);
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
      // Check if all selected categories have maximum images
      for (const category of imageCategories) {
        const categoryImages = formData.images[category.name];
        if (categoryImages.length > 0 && categoryImages.length < category.maxImages) {
          return false; // If any category has been started but not completed, invalid
        }
      }
      // At least one category must have images
      const hasAnyImages = imageCategories.some(
        category => formData.images[category.name].length > 0
      );
      return hasAnyImages;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          />
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Add New Property</h2>
                  <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 3</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="px-8 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                  {[1, 2, 3].map((step, index) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all
                          ${currentStep >= step 
                            ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-lg' 
                            : 'bg-gray-200 text-gray-600'}
                        `}>
                          {currentStep > step ? <Check className="w-5 h-5" /> : step}
                        </div>
                        <span className="text-xs text-gray-600 mt-2 whitespace-nowrap">
                          {index === 0 && 'Property Details'}
                          {index === 1 && 'Property Features'}
                          {index === 2 && 'Upload Images'}
                        </span>
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 transition-all self-start mt-5 ${
                          currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 260px)' }}>
                {/* Step 1: Property Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Property Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter property name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, State"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Available From
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.availabilityDates.start}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Available Until
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.availabilityDates.end}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Price per 2 Nights
                      </label>
                      <input
                        type="number"
                        name="pricePerTwoNights"
                        value={formData.pricePerTwoNights}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Home className="w-4 h-4 inline mr-1" />
                        Property Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                      >
                        <option value="">Select property type</option>
                        {propertyTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Property Features - Now Selectable */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select Property Features
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Choose all the features and amenities available at your property
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getAllPossibleFeatures().map(feature => (
                        <div
                          key={feature}
                          onClick={() => handleFeatureToggle(feature)}
                          className={`
                            flex items-center p-3 rounded-xl cursor-pointer transition-all select-none
                            ${formData.features.includes(feature)
                              ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-md'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                            }
                          `}
                        >
                          <div className="flex items-center">
                            <div className={`
                              w-5 h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0
                              ${formData.features.includes(feature)
                                ? 'border-white bg-white'
                                : 'border-gray-400'
                              }
                            `}>
                              {formData.features.includes(feature) && (
                                <Check className="w-3 h-3 text-[#083A85]" />
                              )}
                            </div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Upload Images */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Upload Property Images
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Upload high-quality images for each area of your property
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-800">
                          <strong>Important:</strong> Once you start uploading images for a category, you must upload the maximum number of images allowed for that category.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {imageCategories.map(category => {
                        const currentCount = formData.images[category.name].length;
                        const isIncomplete = currentCount > 0 && currentCount < category.maxImages;
                        
                        return (
                          <div 
                            key={category.name} 
                            className={`border rounded-xl p-4 transition-all ${
                              isIncomplete 
                                ? 'border-amber-400 bg-amber-50' 
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">
                                {category.label}
                                {isIncomplete && (
                                  <span className="ml-2 text-sm text-amber-600">
                                    (Incomplete - {category.maxImages - currentCount} more required)
                                  </span>
                                )}
                              </h4>
                              <span className={`text-sm ${
                                currentCount === category.maxImages 
                                  ? 'text-green-600 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                {currentCount}/{category.maxImages} images
                                {currentCount === category.maxImages && ' ✓'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {formData.images[category.name].map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={image.url}
                                    alt={`${category.label} ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(category.name, index)}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              
                              {formData.images[category.name].length < category.maxImages && (
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[category.name]?.click()}
                                  className={`h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                                    isIncomplete
                                      ? 'border-amber-400 bg-amber-50 hover:border-amber-500 hover:bg-amber-100'
                                      : 'border-gray-300 hover:border-[#083A85] hover:bg-blue-50'
                                  }`}
                                >
                                  <Upload className={`w-5 h-5 mb-1 ${
                                    isIncomplete ? 'text-amber-500' : 'text-gray-400 cursor-pointer'
                                  }`} />
                                  <span className={`text-xs ${
                                    isIncomplete ? 'text-amber-600' : 'text-gray-500 cursor-pointer'
                                  }`}>
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
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-10">
                <button
  type="button"
  onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
  disabled={currentStep === 1}
  className={`inline-flex items-center px-4 py-2 rounded-full font-medium transition-all ${
    currentStep === 1 
      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
  }`}
>
  <ChevronLeft className="w-4 h-4 mr-1" />
  Previous
</button>


                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!isStepValid()}
                    className={`inline-flex items-center px-6 py-2 rounded-full font-medium cursor-pointer transition-all ${
                      isStepValid()
                        ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] cursor-pointer shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white font-medium rounded-full hover:from-[#0a4499] hover:to-[#0c52b8] transition-all cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Add Property
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple background when modal is closed */}
      {!isModalOpen && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Property Added Successfully!</h2>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddPropertyPage;