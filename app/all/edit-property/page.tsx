'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { X, Upload, Check, ChevronRight, ChevronLeft, MapPin, Home, Calendar, DollarSign, Edit, Ban } from 'lucide-react';

// --- INTERFACES ---
interface AvailabilityDates {
  start: string;
  end: string;
}

interface ImageFile {
  file: File | null; // Can be null for existing images from DB
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

interface AddPropertyPageProps {
  existingProperty?: FormData | null;
}

// --- SAMPLE DATA TO SIMULATE FETCHING AN EXISTING PROPERTY ---
const samplePropertyData: FormData = {
  name: 'Kigali Heights Villa',
  location: 'Kigali, Rwanda',
  availabilityDates: { start: '2025-09-01', end: '2025-12-31' },
  pricePerTwoNights: '250',
  type: 'Villa',
  features: [
    'WiFi', 'Pool', 'Air Conditioning', 'Full Kitchen', 'Parking', 
    'Security System', 'Patio', 'King Bed', 'City View'
  ],
  images: {
    livingRoom: [
      { file: null, url: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'existing-lr-1.jpg' },
      { file: null, url: 'https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'existing-lr-2.jpg' },
    ],
    kitchen: [
      { file: null, url: 'https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'existing-kitchen-1.jpg' },
    ],
    diningArea: [],
    bedroom: [
       { file: null, url: 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'existing-bed-1.jpg' },
    ],
    bathroom: [],
    workspace: [],
    balcony: [],
    laundryArea: [],
    gym: [],
    exterior: [
      { file: null, url: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', name: 'existing-ext-1.jpg' },
    ],
    childrenPlayroom: []
  }
};


// --- COMPONENT ---
const AddPropertyPage: React.FC<AddPropertyPageProps> = ({ existingProperty = null }) => {
  const isEditMode = !!existingProperty;

  const getInitialFormData = (): FormData => {
    if (isEditMode && existingProperty) {
      return JSON.parse(JSON.stringify(existingProperty)); // Deep copy to prevent mutation
    }
    return {
      name: '',
      location: '',
      availabilityDates: { start: '', end: '' },
      pricePerTwoNights: '',
      type: '',
      features: [],
      images: {
        livingRoom: [], kitchen: [], diningArea: [], bedroom: [], bathroom: [],
        workspace: [], balcony: [], laundryArea: [], gym: [], exterior: [], childrenPlayroom: []
      }
    };
  };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isEditing, setIsEditing] = useState<boolean>(!isEditMode); // Start editing if adding new

  useEffect(() => {
    // If an existing property is passed, populate the form
    if (existingProperty) {
      setFormData(JSON.parse(JSON.stringify(existingProperty))); // Use deep copy
      setIsEditing(false); // Start in view mode
    }
  }, [existingProperty]);

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
    return [
      'WiFi', 'Air Conditioning', 'Heating', 'Parking', 'TV', 'Cable TV', 'Smart TV', 
      'Sound System', 'Security System', 'Smoke Detector', 'Full Kitchen', 'Kitchenette', 
      'Refrigerator', 'Microwave', 'Oven', 'Stove', 'Dishwasher', 'Coffee Maker', 'Toaster', 
      'Blender', 'Dining Table', 'Bar Counter', 'Wine Cooler', 'Hair Dryer', 'Bathtub', 
      'Shower', 'Hot Water', 'Towels Provided', 'Toiletries', 'Bidet', 'Jacuzzi', 'King Bed', 
      'Queen Bed', 'Single Bed', 'Sofa Bed', 'Extra Bedding', 'Closet', 'Hangers', 'Iron', 
      'Fireplace', 'Ceiling Fan', 'Pool', 'Hot Tub', 'Garden', 'BBQ Area', 'Patio', 
      'Balcony View', 'Terrace', 'Outdoor Seating', 'Fire Pit', 'Playground', 
      'Dedicated Workspace', 'Desk', 'Ergonomic Chair', 'Monitor', 'Printer', 'High-Speed Internet',
      'Video Conference Setup', 'Washing Machine', 'Dryer', 'Shared Laundry', 'Ironing Board', 
      'Cleaning Service', 'Daily Housekeeping', 'Elevator', 'Gym Access', 'Pool Access', 
      'Concierge', 'Doorman', 'Pet Friendly', 'Wheelchair Accessible', 'Private Entrance', 
      'Beach Access', 'Lake View', 'Mountain View', 'City View', 'Guest House', 'Game Room', 
      'Home Theater', 'Library', 'Wine Cellar', 'Sauna', 'Steam Room'
    ].sort();
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
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = (category: keyof PropertyImages, files: FileList | null) => {
    if (!files || !isEditing) return;
    
    const categoryConfig = imageCategories.find(cat => cat.name === category);
    if (!categoryConfig) return;
    
    const maxImages = categoryConfig.maxImages;
    const fileArray = Array.from(files);
    
    if (formData.images[category].length + fileArray.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed for ${categoryConfig.label}.`);
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
    if (!isEditing) return;
    const imageToRemove = formData.images[category][index];
    // If it's a new image with a blob URL, revoke it to prevent memory leaks
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        [category]: prev.images[category].filter((_, i) => i !== index)
      }
    }));
  };
  
  const handleCancelEdit = () => {
    setFormData(getInitialFormData()); // Revert to original data
    setIsEditing(false);
    setCurrentStep(1); // Go back to the first step
  };

  const handleSubmit = () => {
    if (isEditMode) {
      console.log('Updating Property Data:', formData);
      alert('Property updated successfully!');
    } else {
      console.log('Adding New Property Data:', formData);
      alert('Property added successfully!');
    }
    setIsModalOpen(false);
    setTimeout(() => {
      resetForm();
      setIsModalOpen(true); 
    }, 2000);
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setCurrentStep(1);
    setIsEditing(!isEditMode);
  };

  const isStepValid = (): boolean => {
    if (currentStep === 1) {
      return !!(formData.name && formData.location && 
             formData.availabilityDates.start && formData.availabilityDates.end &&
             formData.pricePerTwoNights && formData.type);
    }
    if (currentStep === 2) {
      return formData.features.length >= 5; // Example: require at least 5 features
    }
    if (currentStep === 3) {
      // Simple validation: at least one image must be present overall
      return imageCategories.some(cat => formData.images[cat.name].length > 0);
    }
    return true;
  };

  const getModalTitle = () => {
    if (isEditMode) {
      return isEditing ? 'Edit Property' : 'Property Details';
    }
    return 'Add New Property';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-xs transition-opacity" />
          
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{getModalTitle()}</h2>
                  <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 3</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditMode && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-[#083A85] text-white hover:bg-[#0a4499] text-sm shadow-sm cursor-pointer"
                    >
                      <span>Edit</span>
                      <Edit className="w-4 h-4 ml-2" />
                    </button>
                  )}
                  {isEditMode && isEditing && (
                     <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-red-100 text-red-600 hover:bg-red-200 text-sm cursor-pointer"
                    >
                      <span>Cancel</span>
                      <Ban className="w-4 h-4 ml-2" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="px-8 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                   {[1, 2, 3].map((step, index) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${currentStep >= step ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
                          {currentStep > step ? <Check className="w-5 h-5" /> : step}
                        </div>
                        <span className="text-xs text-gray-600 mt-2 whitespace-nowrap">
                          {['Property Details', 'Property Features', 'Upload Images'][index]}
                        </span>
                      </div>
                      {step < 3 && (
                        <div className={`flex-1 h-1 mx-2 transition-all self-start mt-5 ${currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 260px)' }}>
                {/* Step 1: Property Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter property name" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><MapPin className="w-4 h-4 inline mr-1" />Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} disabled={!isEditing} placeholder="City, State" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-1" />Available From</label>
                        <input type="date" name="startDate" value={formData.availabilityDates.start} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-1" />Available Until</label>
                        <input type="date" name="endDate" value={formData.availabilityDates.end} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><DollarSign className="w-4 h-4 inline mr-1" />Price per 2 Nights</label>
                      <input type="number" name="pricePerTwoNights" value={formData.pricePerTwoNights} onChange={handleInputChange} disabled={!isEditing} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                    </div>
                    <div className="pb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Home className="w-4 h-4 inline mr-1" />Property Type</label>
                      <select name="type" value={formData.type} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                        <option value="">Select property type</option>
                        {propertyTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                      </select>
                    </div>
                  </div>
                )}
                {/* Step 2: Property Features */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select Property Features</h3>
                      <p className="text-sm text-gray-600 mb-4">Choose all the features and amenities available at your property</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                        <p className="text-sm text-blue-800">Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getAllPossibleFeatures().map(feature => (
                        <div key={feature} onClick={() => handleFeatureToggle(feature)} className={`flex items-center p-3 rounded-xl transition-all select-none ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.features.includes(feature) ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}>
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0 ${formData.features.includes(feature) ? 'border-white bg-white' : 'border-gray-400'}`}>
                              {formData.features.includes(feature) && (<Check className="w-3 h-3 text-[#083A85]" />)}
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
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Property Images</h3>
                      <p className="text-sm text-gray-600 mb-2">Upload high-quality images for each area of your property. You can mix existing and new images.</p>
                    </div>
                    <div className="space-y-6">
                      {imageCategories.map(category => (
                        <div key={category.name} className="border rounded-xl p-4 transition-all border-gray-200 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{category.label}</h4>
                            <span className={`text-sm ${formData.images[category.name].length === category.maxImages ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                              {formData.images[category.name].length}/{category.maxImages} images {formData.images[category.name].length === category.maxImages && '✓'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {formData.images[category.name].map((image, index) => (
                              <div key={image.url} className="relative group">
                                <img src={image.url} alt={`${category.label} ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                {isEditing && (
                                  <button type="button" onClick={() => removeImage(category.name, index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ))}
                            {isEditing && formData.images[category.name].length < category.maxImages && (
                              <button type="button" onClick={() => fileInputRefs.current[category.name]?.click()} className="h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all border-gray-300 hover:border-[#083A85] hover:bg-blue-50 cursor-pointer">
                                <Upload className="w-5 h-5 mb-1 text-gray-400" />
                                <span className="text-xs text-gray-500">Upload</span>
                              </button>
                            )}
                          </div>
                          <input ref={el => { if (el) fileInputRefs.current[category.name] = el; }} type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(category.name, e.target.files)} className="hidden" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-10">
                <button type="button" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1 || !isEditing} className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                {currentStep < 3 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!isStepValid() || !isEditing} className="inline-flex items-center px-6 py-2 rounded-full font-medium transition-all bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] shadow-lg hover:shadow-xl disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={!isStepValid() || !isEditing} className="inline-flex items-center px-6 py-2 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-[#083A85] to-[#0a4499] hover:from-[#0a4499] hover:to-[#0c52b8] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
                    <Check className="w-4 h-4 mr-1" />
                    {isEditMode ? 'Save Changes' : 'Add Property'}
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Action Completed Successfully!</h2>
            <p className="text-gray-600">The modal will reopen shortly for demonstration...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// To use this component for editing, pass the 'existingProperty' prop.
// For adding a new property, render it without any props.

// Example Usage for EDIT MODE (as currently set):
export default () => <AddPropertyPage existingProperty={samplePropertyData} />;

// Example Usage for ADD MODE:
// export default () => <AddPropertyPage />;
