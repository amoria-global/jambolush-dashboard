'use client';

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';

// --- INTERFACES ---
interface OwnerDetails {
  names: string;
  email: string;
  phone: string;
  address: string;
}

interface AvailabilityDates {
  start: string;
  end: string;
}

interface ImageFile {
  file: File | null;
  url: string;
  name: string;
}

interface VideoFile {
  file: File | null;
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
  ownerDetails: OwnerDetails;
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

interface AddPropertyPageProps {
  existingProperty?: FormData | null;
}

// --- SAMPLE DATA TO SIMULATE FETCHING AN EXISTING PROPERTY ---
const samplePropertyData: FormData = {
  ownerDetails: {
    names: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 987-6543',
    address: '100 Main Street, Kigali, Rwanda'
  },
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
  },
  video3D: {
      file: null,
      url: 'https://www.example.com/sample-video.mp4',
      name: 'existing-property-tour.mp4',
      size: 15728640 // 15MB
  }
};


// --- COMPONENT ---
const AddPropertyPage: React.FC<AddPropertyPageProps> = ({ existingProperty = null }) => {
  const isEditMode = !!existingProperty;

  const getInitialFormData = (): FormData => {
    if (isEditMode && existingProperty) {
      return JSON.parse(JSON.stringify(existingProperty)); // Deep copy
    }
    return {
      ownerDetails: { names: '', email: '', phone: '', address: '' },
      name: '',
      location: '',
      availabilityDates: { start: '', end: '' },
      pricePerTwoNights: '',
      type: '',
      features: [],
      images: {
        livingRoom: [], kitchen: [], diningArea: [], bedroom: [], bathroom: [],
        workspace: [], balcony: [], laundryArea: [], gym: [], exterior: [], childrenPlayroom: []
      },
      video3D: null
    };
  };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isEditing, setIsEditing] = useState<boolean>(!isEditMode);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);


  useEffect(() => {
    if (existingProperty) {
      setFormData(JSON.parse(JSON.stringify(existingProperty)));
      setIsEditing(false);
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

  const handleOwnerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      ownerDetails: { ...prev.ownerDetails, [name]: value }
    }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: capitalizeFirstLetter(value) }));
    } else if (name === 'startDate' || name === 'endDate') {
      setFormData(prev => ({
        ...prev,
        availabilityDates: { ...prev.availabilityDates, [name === 'startDate' ? 'start' : 'end']: value }
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
    if (formData.images[category].length + files.length > categoryConfig.maxImages) {
      alert(`Maximum ${categoryConfig.maxImages} images allowed for ${categoryConfig.label}.`);
      return;
    }
    const newImages: ImageFile[] = Array.from(files).map(file => ({ file, url: URL.createObjectURL(file), name: file.name }));
    setFormData(prev => ({ ...prev, images: { ...prev.images, [category]: [...prev.images[category], ...newImages] } }));
  };
  
  const handleVideoUpload = (file: File | null) => {
    if (!file || !isEditing) return;

    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(file.type)) {
      alert('Please upload a valid video file (MP4, WebM, MOV, AVI)');
      return;
    }
    if (file.size > 500 * 1024 * 1024) { // 500MB
      alert('Video file size must be less than 500MB');
      return;
    }

    setVideoUploadProgress(0);
    const interval = setInterval(() => setVideoUploadProgress(prev => Math.min(prev + 10, 100)), 200);
    
    setFormData(prev => ({ ...prev, video3D: { file, url: URL.createObjectURL(file), name: file.name, size: file.size } }));
    setTimeout(() => clearInterval(interval), 2200); // Clear interval after simulation
  };

  const removeImage = (category: keyof PropertyImages, index: number) => {
    if (!isEditing) return;
    const imageToRemove = formData.images[category][index];
    if (imageToRemove.url.startsWith('blob:')) URL.revokeObjectURL(imageToRemove.url);
    setFormData(prev => ({ ...prev, images: { ...prev.images, [category]: prev.images[category].filter((_, i) => i !== index) } }));
  };

  const removeVideo = () => {
    if (!isEditing) return;
    if (formData.video3D?.url.startsWith('blob:')) URL.revokeObjectURL(formData.video3D.url);
    setFormData(prev => ({ ...prev, video3D: null }));
    setVideoUploadProgress(0);
  };

  const handleCancelEdit = () => {
    setFormData(getInitialFormData());
    setIsEditing(false);
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    const action = isEditMode ? 'Updating' : 'Adding New';
    console.log(`${action} Property Data:`, formData);
    alert(`Property ${isEditMode ? 'updated' : 'added'} successfully!`);
    setIsModalOpen(false);
    setTimeout(() => { resetForm(); setIsModalOpen(true); }, 2000);
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setCurrentStep(1);
    setIsEditing(!isEditMode);
    setVideoUploadProgress(0);
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.ownerDetails.names && formData.ownerDetails.email && formData.ownerDetails.phone && formData.ownerDetails.address);
      case 2:
        return !!(formData.name && formData.location && formData.availabilityDates.start && formData.availabilityDates.end && formData.pricePerTwoNights && formData.type);
      case 3:
        return formData.features.length >= 5;
      case 4:
        const hasVideo = !!formData.video3D;
        const hasImages = imageCategories.some(cat => formData.images[cat.name].length > 0);
        return hasVideo || hasImages; // Must have at least a video or one image
      default:
        return true;
    }
  };

  const getModalTitle = () => isEditMode ? (isEditing ? 'Edit Property' : 'Property Details') : 'Add New Property';

  return (
    <div className="min-h-screen bg-gray-50">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/5 backdrop-blur-xs transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{getModalTitle()}</h2>
                  <p className="text-sm text-gray-600 mt-1">Step {currentStep} of 4</p>
                </div>
                <div className="flex items-center gap-2">
                  {isEditMode && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-[#083A85] text-white hover:bg-[#0a4499] text-sm shadow-sm cursor-pointer">
                      <span>Edit</span>
                      <i className="bi bi-pencil w-4 h-4 ml-2"></i>
                    </button>
                  )}
                  {isEditMode && isEditing && (
                     <button onClick={handleCancelEdit} className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-red-100 text-red-600 hover:bg-red-200 text-sm cursor-pointer">
                      <span>Cancel</span>
                      <i className="bi bi-slash-circle w-4 h-4 ml-2"></i>
                    </button>
                  )}
                  <button onClick={() => setIsModalOpen(false)} className="cursor-pointer"><i className="bi bi-x w-5 h-5 p-3 bg-gray-300 text-black-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"></i></button>
                </div>
              </div>

              <div className="px-8 pt-4 pb-2">
                <div className="flex items-center justify-between relative">
                   {[1, 2, 3, 4].map((step, index) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${currentStep >= step ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>
                          {currentStep > step ? <i className="bi bi-check w-5 h-5"></i> : step}
                        </div>
                        <span className="text-sm font-semibold text-gray-600 mt-2 whitespace-nowrap">
                          {['Owner Details', 'Property Details', 'Property Features', 'Media Upload'][index]}
                        </span>
                      </div>
                      {step < 4 && <div className={`flex-1 h-1 mx-2 transition-all self-start mt-5 ${currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 260px)' }}>
                {currentStep === 1 && (
                  <div className="space-y-6">
                     <h3 className="text-lg font-medium text-gray-900">Property Owner Information</h3>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer"><i className="bi bi-person w-4 h-4 inline mr-2"></i>Full Name</label>
                      <input type="text" name="names" value={formData.ownerDetails.names} onChange={handleOwnerInputChange} disabled={!isEditing} placeholder="Enter owner's full name" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer"><i className="bi bi-envelope w-4 h-4 inline mr-2"></i>Email Address</label>
                      <input type="email" name="email" value={formData.ownerDetails.email} onChange={handleOwnerInputChange} disabled={!isEditing} placeholder="owner@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer"><i className="bi bi-phone w-4 h-4 inline mr-2"></i>Phone Number</label>
                      <input type="tel" name="phone" value={formData.ownerDetails.phone} onChange={handleOwnerInputChange} disabled={!isEditing} placeholder="+1 (555) 123-4567" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2 cursor-pointer"><i className="bi bi-map w-4 h-4 inline mr-2"></i>Address</label>
                      <input type="text" name="address" value={formData.ownerDetails.address} onChange={handleOwnerInputChange} disabled={!isEditing} placeholder="123 Main St, City, State, ZIP" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2">Property Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter property name" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2"><i className="bi bi-geo-alt w-4 h-4 inline mr-1"></i>Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} disabled={!isEditing} placeholder="City, State" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-2"><i className="bi bi-calendar w-4 h-4 inline mr-1"></i>Available From</label>
                        <input type="date" name="startDate" value={formData.availabilityDates.start} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-base font-semibold text-gray-700 mb-2"><i className="bi bi-calendar w-4 h-4 inline mr-1"></i>Available Until</label>
                        <input type="date" name="endDate" value={formData.availabilityDates.end} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-base font-semibold text-gray-700 mb-2"><i className="bi bi-currency-dollar w-4 h-4 inline mr-1"></i>Price per 2 Nights</label>
                      <input type="number" name="pricePerTwoNights" value={formData.pricePerTwoNights} onChange={handleInputChange} disabled={!isEditing} placeholder="0.00" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed placeholder:font-bold" />
                    </div>
                    <div className="pb-4">
                      <label className="block text-base font-semibold text-gray-700 mb-2"><i className="bi bi-house w-4 h-4 inline mr-1"></i>Property Type</label>
                      <select name="type" value={formData.type} onChange={handleInputChange} disabled={!isEditing} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed">
                        <option value="">Select property type</option>
                        {propertyTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                      </select>
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select Property Features</h3>
                      <p className="text-sm text-gray-600 mb-4">Choose all the features and amenities available at your property</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4"><p className="text-sm text-blue-800">Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''}</p></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getAllPossibleFeatures().map(feature => (
                        <div key={feature} onClick={() => handleFeatureToggle(feature)} className={`flex items-center p-3 rounded-xl transition-all select-none ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'} ${formData.features.includes(feature) ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-md' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}>
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0 ${formData.features.includes(feature) ? 'border-white bg-white' : 'border-gray-400'}`}>{formData.features.includes(feature) && (<i className="bi bi-check w-3 h-3 text-[#083A85]"></i>)}</div>
                            <span className="text-sm">{feature}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {currentStep === 4 && (
                   <div className="space-y-8">
                    {/* Video Upload Section */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">3D Property Video</h3>
                        <div className={`border-2 rounded-xl p-6 transition-all ${formData.video3D ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
                            {!formData.video3D ? (
                                isEditing ? (
                                    <>
                                        <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#083A85] hover:bg-blue-50 transition-all cursor-pointer">
                                            <i className="bi bi-camera-video w-12 h-12 text-gray-400 mb-3" style={{ fontSize: '2.5rem' }}></i>
                                            <span className="text-sm font-medium text-gray-700">Click to upload 3D video</span>
                                            <span className="text-sm text-gray-500 mt-1">MP4, WebM, MOV, AVI (Max 500MB)</span>
                                        </button>
                                        <input ref={videoInputRef} type="file" accept="video/*" onChange={(e) => handleVideoUpload(e.target.files?.[0] || null)} className="hidden" />
                                    </>
                                ) : <p className="text-sm text-gray-500 text-center">No 3D video has been uploaded for this property.</p>
                            ) : (
                                <div className="bg-white rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-green-100 rounded-lg"><i className="bi bi-film w-8 h-8 text-green-600" style={{ fontSize: '1.8rem' }}></i></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 break-all">{formData.video3D.name}</p>
                                                <p className="text-sm text-gray-500">{formatFileSize(formData.video3D.size)}</p>
                                            </div>
                                        </div>
                                        {isEditing && (
                                            <button type="button" onClick={removeVideo} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"><i className="bi bi-trash w-5 h-5"></i></button>
                                        )}
                                    </div>
                                    {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                                        <div className="mt-3">
                                            <div className="bg-gray-200 rounded-full h-2"><div className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all" style={{ width: `${videoUploadProgress}%` }} /></div>
                                            <p className="text-sm text-gray-500 mt-1">Uploading... {videoUploadProgress}%</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Image Upload Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Property Images (Optional)</h3>
                      <div className="space-y-6">
                        {imageCategories.map(category => (
                          <div key={category.name} className="border rounded-xl p-4 transition-all border-gray-200 bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{category.label}</h4>
                              <span className={`text-sm ${formData.images[category.name].length === category.maxImages ? 'text-green-600 font-medium' : 'text-gray-500'}`}>{formData.images[category.name].length}/{category.maxImages} images {formData.images[category.name].length === category.maxImages && '✓'}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {formData.images[category.name].map((image, index) => (
                                <div key={image.url} className="relative group">
                                  <img src={image.url} alt={`${category.label} ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                                  {isEditing && (<button type="button" onClick={() => removeImage(category.name, index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><i className="bi bi-x w-3 h-3"></i></button>)}
                                </div>
                              ))}
                              {isEditing && formData.images[category.name].length < category.maxImages && (
                                <button type="button" onClick={() => fileInputRefs.current[category.name]?.click()} className="h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all border-gray-300 hover:border-[#083A85] hover:bg-blue-50 cursor-pointer">
                                  <i className="bi bi-upload w-5 h-5 mb-1 text-gray-400"></i>
                                  <span className="text-xs text-gray-500">Upload</span>
                                </button>
                              )}
                            </div>
                            <input ref={el => { if (el) fileInputRefs.current[category.name] = el; }} type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(category.name, e.target.files)} className="hidden" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-10">
                <button type="button" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1 || !isEditing} className="inline-flex items-center px-4 py-2 rounded-full font-medium transition-all bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer">
                  <i className="bi bi-chevron-left w-4 h-4 mr-1"></i>Previous
                </button>
                {currentStep < 4 ? (
                  <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!isStepValid() || !isEditing} className="inline-flex items-center px-6 py-2 rounded-full font-medium transition-all bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] shadow-lg hover:shadow-xl disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
                    Next<i className="bi bi-chevron-right w-4 h-4 ml-1"></i>
                  </button>
                ) : (
                  <button type="button" onClick={handleSubmit} disabled={!isStepValid() || !isEditing} className="inline-flex items-center px-6 py-2 text-white font-medium rounded-full transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-[#083A85] to-[#0a4499] hover:from-[#0a4499] hover:to-[#0c52b8] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none cursor-pointer">
                    <i className="bi bi-check w-4 h-4 mr-1"></i>{isEditMode ? 'Save Changes' : 'Add Property'}
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
       <style jsx global>{`
        ::-webkit-scrollbar { width: 12px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #083A85; border-radius: 6px; }
        ::-webkit-scrollbar-thumb:hover { background: #0a4499; }
      `}</style>
    </div>
  );
};

export default () => <AddPropertyPage existingProperty={samplePropertyData} />;