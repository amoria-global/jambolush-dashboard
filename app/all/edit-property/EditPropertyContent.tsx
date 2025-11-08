'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import api from '@/app/api/apiService';
import uploadDocumentToSupabase from '@/app/api/storage';
import { useRouter, useSearchParams } from 'next/navigation';
import AlertNotification from '@/app/components/notify';
import PropertyMapSelector from '@/app/components/PropertyMapSelector';
import { decodeId, createViewDetailsUrl } from '@/app/utils/encoder';

interface OwnerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  country?: string;
  city?: string;
  district?: string;
  sector?: string;
  village?: string;
  street?: string;
}

interface AvailabilityDates {
  start: string;
  end: string;
}

interface ImageFile {
  file: File;
  url: string;
  name: string;
  uploaded?: boolean;
  uploadedUrl?: string;
}

interface VideoFile {
  file: File;
  url: string;
  name: string;
  size: number;
  uploaded?: boolean;
  uploadedUrl?: string;
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

interface AddressComponent {
  street?: string;
  neighborhood?: string;
  city?: string;
  district?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationDetails {
  address: string;
  latitude?: number;
  longitude?: number;
  coordinates?: Coordinates;
  addressComponents?: AddressComponent;
}

interface PricingDetails {
  type: 'night' | 'month';
  amount: string;
  minimumStay: string;
}

interface FormData {
  ownerDetails: OwnerDetails;
  name: string;
  location: LocationDetails;
  availabilityDates: AvailabilityDates;
  pricing: PricingDetails;
  type: string;
  category: string;
  features: string[];
  images: PropertyImages;
  video3D: VideoFile | null;
}

interface ImageCategory {
  name: keyof PropertyImages;
  label: string;
  maxImages: number;
}

const EditPropertyContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [propertyId, setPropertyId] = useState<string>('');

  const isMountedRef = useRef<boolean>(true);
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    ownerDetails: {
      name: '',
      email: '',
      phone: '',
      address: '',
      country: '',
      city: '',
      district: '',
      sector: '',
      village: '',
      street: ''
    },
    name: '',
    location: {
      address: ''
    },
    availabilityDates: { start: '', end: '' },
    pricing: {
      type: 'night',
      amount: '',
      minimumStay: '1'
    },
    type: '',
    category: 'entire_place',
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
    'apartment', 'house', 'villa', 'condo', 'townhouse',
    'studio', 'loft'
  ];

  const propertyCategories = [
    { value: 'entire_place', label: 'Entire Place' },
    { value: 'private_room', label: 'Private Room' },
    { value: 'shared_room', label: 'Shared Room' }
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

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isValidStartDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return selectedDate >= tomorrow;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleApiError = (error: any): string => {
    console.error('API Error:', error);

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    if (error?.data?.message) {
      return error.data.message;
    }

    return 'An unexpected error occurred. Please try again.';
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      try {
        Object.values(formData.images).forEach(categoryImages => {
          categoryImages.forEach((image: any) => {
            if (image.url && image.url.startsWith('blob:') && !image.uploaded) {
              URL.revokeObjectURL(image.url);
            }
          });
        });

        if (formData.video3D?.url && formData.video3D.url.startsWith('blob:') && !formData.video3D.uploaded) {
          URL.revokeObjectURL(formData.video3D.url);
        }
      } catch (error) {
        console.warn('Error cleaning up object URLs:', error);
      }
    };
  }, []);

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

  useEffect(() => {
    loadPropertyData();
  }, []);

  const loadPropertyData = async () => {
    try {
      setIsLoadingProperty(true);

      // Get encoded property ID from URL
      const encodedId = searchParams.get('id');
      if (!encodedId) {
        setNotification({
          message: 'Property ID is missing',
          type: 'error'
        });
        setTimeout(() => router.push('/all/agent/properties'), 2000);
        return;
      }

      // Decode the property ID
      const decodedId = decodeId(encodedId);
      if (!decodedId) {
        setNotification({
          message: 'Invalid property ID',
          type: 'error'
        });
        setTimeout(() => router.push('/all/agent/properties'), 2000);
        return;
      }

      setPropertyId(decodedId);

      // Fetch property data
      const response = await api.getProperty(decodedId);

      if (!response.ok || !response.data) {
        throw new Error(response.data?.message || 'Failed to load property');
      }

      const property = response.data.data;

      // Transform API response to populate formData
      const transformedData: FormData = {
        ownerDetails: {
          name: property.client?.name || property.client?.firstName || '',
          email: property.client?.email || '',
          phone: formatPhoneWithCountryCode(property.client?.phone || ''),
          address: [
            property.client?.country,
            property.client?.city,
            property.client?.district,
            property.client?.sector,
            property.client?.village,
            property.client?.street
          ].filter(Boolean).join(', '),
          country: property.client?.country || '',
          city: property.client?.city || '',
          district: property.client?.district || '',
          sector: property.client?.sector || '',
          village: property.client?.village || '',
          street: property.client?.street || ''
        },
        name: property.name || '',
        location: {
          address: property.location || '',
          latitude: property.coordinates?.latitude || property.latitude,
          longitude: property.coordinates?.longitude || property.longitude
        },
        availabilityDates: {
          start: property.availableFrom ? property.availableFrom.split('T')[0] : '',
          end: property.availableTo ? property.availableTo.split('T')[0] : ''
        },
        pricing: {
          type: (property.pricingType === 'month' ? 'month' : 'night') as 'night' | 'month',
          amount: String(property.pricePerNight || property.pricePerMonth || ''),
          minimumStay: String(property.minimumStay || '1')
        },
        type: property.type || '',
        category: property.category || 'entire_place',
        features: property.features || [],
        images: transformImages(property.images),
        video3D: transformVideo(property.video3D || null)
      };

      setFormData(transformedData);

      setNotification({
        message: 'Property data loaded successfully',
        type: 'success'
      });

    } catch (error: any) {
      console.error('Error loading property:', error);
      const errorMessage = handleApiError(error);
      setNotification({
        message: errorMessage,
        type: 'error'
      });
      setTimeout(() => router.push('/all/agent/properties'), 2000);
    } finally {
      setIsLoadingProperty(false);
    }
  };

  const transformImages = (imagesData: any): PropertyImages => {
    const transformedImages: PropertyImages = {
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
    };

    if (!imagesData) return transformedImages;

    // Transform each category
    for (const category of imageCategories) {
      const categoryData = imagesData[category.name];
      if (Array.isArray(categoryData) && categoryData.length > 0) {
        transformedImages[category.name] = categoryData.map((url: string) => ({
          file: new File([], ''), // Empty file for existing images
          url: url,
          name: url.split('/').pop() || 'image',
          uploaded: true,
          uploadedUrl: url
        }));
      }
    }

    return transformedImages;
  };

  const transformVideo = (videoUrl: string | null): VideoFile | null => {
    if (!videoUrl) return null;

    return {
      file: new File([], ''), // Empty file for existing video
      url: videoUrl,
      name: videoUrl.split('/').pop() || 'video',
      size: 0,
      uploaded: true,
      uploadedUrl: videoUrl
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPhoneWithCountryCode = (phone: string): string => {
    if (!phone) return '';

    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    if (cleanPhone.startsWith('+')) {
      return cleanPhone;
    }

    if (cleanPhone.startsWith('250')) {
      return `+${cleanPhone}`;
    }

    if (cleanPhone.startsWith('0')) {
      return `+250${cleanPhone.substring(1)}`;
    }

    return `+250${cleanPhone}`;
  };

  const generateUniqueFileName = (file: File, category: string, propertyName?: string): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const safePropertyName = propertyName ? propertyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'property';

    return `${safePropertyName}_${category}_${timestamp}_${randomStr}.${fileExtension}`;
  };

  const uploadSingleFileToSupabase = async (
    file: File,
    category: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      if (onProgress) onProgress(10);

      const fileName = generateUniqueFileName(file, category, formData.name);
      const folder = `properties/${category}`;

      if (onProgress) onProgress(50);

      console.log('Uploading single file to Supabase:', {
        fileName,
        folder,
        fileSize: file.size,
        fileType: file.type
      });

      const uploadedUrl = await uploadDocumentToSupabase(file, fileName, folder);

      if (onProgress) onProgress(100);

      console.log('File uploaded successfully:', uploadedUrl);
      return uploadedUrl;
    } catch (error: any) {
      console.error('Error uploading file to Supabase:', error);
      if (onProgress) onProgress(-1);
      throw new Error(`Failed to upload ${category}: ${error.message || 'Unknown error'}`);
    }
  };

  const processVideo = async (): Promise<string> => {
    if (!formData.video3D) return '';

    // If video is already uploaded, return the uploaded URL
    if (formData.video3D.uploaded && formData.video3D.uploadedUrl) {
      return formData.video3D.uploadedUrl;
    }

    try {
      setVideoUploadProgress(0);
      const uploadedUrl = await uploadSingleFileToSupabase(
        formData.video3D.file,
        'videos',
        (progress) => setVideoUploadProgress(progress)
      );

      return uploadedUrl;
    } catch (error: any) {
      console.error('Error processing video:', error);
      throw new Error(`Video upload failed: ${error.message}`);
    }
  };

  const processImages = async (): Promise<any> => {
    const allImages: any = {};

    for (const category of imageCategories) {
      const categoryImages = formData.images[category.name];

      if (categoryImages.length > 0) {
        setImageUploadProgress(prev => ({ ...prev, [category.name]: 0 }));

        const uploadedUrls: string[] = [];

        for (let i = 0; i < categoryImages.length; i++) {
          const image = categoryImages[i];

          // Skip already uploaded images
          if (image.uploaded && image.uploadedUrl) {
            uploadedUrls.push(image.uploadedUrl);
            const progress = ((i + 1) / categoryImages.length) * 100;
            setImageUploadProgress(prev => ({ ...prev, [category.name]: progress }));
            continue;
          }

          const progress = ((i + 1) / categoryImages.length) * 100;
          setImageUploadProgress(prev => ({ ...prev, [category.name]: progress }));

          const uploadedUrl = await uploadSingleFileToSupabase(
            image.file,
            category.name,
            (fileProgress) => {
              const totalProgress = ((i / categoryImages.length) * 100) + ((fileProgress / 100) * (100 / categoryImages.length));
              setImageUploadProgress(prev => ({ ...prev, [category.name]: totalProgress }));
            }
          );

          uploadedUrls.push(uploadedUrl);
        }

        allImages[category.name] = uploadedUrls;
        setImageUploadProgress(prev => ({ ...prev, [category.name]: 100 }));
      } else {
        allImages[category.name] = [];
      }
    }

    return allImages;
  };

  const handleOwnerInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      ownerDetails: {
        ...prev.ownerDetails,
        [name]: value
      }
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'startDate' || name === 'endDate') {
      setFormData(prev => ({
        ...prev,
        availabilityDates: {
          ...prev.availabilityDates,
          [name === 'startDate' ? 'start' : 'end']: value
        }
      }));
    } else if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value.toLowerCase()
      }));
    } else if (name === 'pricingType') {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          type: value as 'night' | 'month',
          minimumStay: value === 'night' ? '1' : '1'
        }
      }));
    } else if (name === 'pricingAmount') {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          amount: value
        }
      }));
    } else if (name === 'minimumStay') {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          minimumStay: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLocationSelect = (locationData: { latitude: number; longitude: number; address: string; addressComponents: AddressComponent }) => {
    setFormData(prev => ({
      ...prev,
      location: {
        address: locationData.address,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        addressComponents: locationData.addressComponents
      }
    }));

    if (validationErrors.location) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => {
      const currentFeatures = prev.features;
      const newFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];

      return {
        ...prev,
        features: newFeatures
      };
    });
  };

  const handleImageUpload = (category: keyof PropertyImages, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const categoryConfig = imageCategories.find(c => c.name === category);
    if (!categoryConfig) return;

    const currentImages = formData.images[category];
    const availableSlots = categoryConfig.maxImages - currentImages.length;

    if (availableSlots <= 0) {
      alert(`Maximum ${categoryConfig.maxImages} images allowed for ${categoryConfig.label}`);
      return;
    }

    const filesToAdd = Math.min(files.length, availableSlots);
    const newImages: ImageFile[] = [];

    for (let i = 0; i < filesToAdd; i++) {
      const file = files[i];

      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }

      const imageUrl = URL.createObjectURL(file);
      newImages.push({
        file,
        url: imageUrl,
        name: file.name,
        uploaded: false
      });
    }

    if (newImages.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: {
          ...prev.images,
          [category]: [...prev.images[category], ...newImages]
        }
      }));
    }
  };

  const removeImage = (category: keyof PropertyImages, index: number) => {
    const imageToRemove = formData.images[category][index];
    if (imageToRemove?.url && !imageToRemove.uploaded) {
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

  const handleVideoUpload = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('Video file is too large. Maximum size is 500MB');
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      video3D: {
        file,
        url: videoUrl,
        name: file.name,
        size: file.size,
        uploaded: false
      }
    }));

    if (validationErrors.video3D) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.video3D;
        return newErrors;
      });
    }
  };

  const removeVideo = () => {
    if (formData.video3D?.url && !formData.video3D.uploaded) {
      URL.revokeObjectURL(formData.video3D.url);
    }
    setFormData(prev => ({
      ...prev,
      video3D: null
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: { [key: string]: string } = {};

    // Step 1: Property Details (was Step 2)
    if (step === 1) {
      if (!formData.name || formData.name.trim().length < 3) {
        errors.name = 'Property name is required (min 3 characters)';
      }

      // Location is read-only in edit mode, no validation needed
      // Just verify it exists
      if (!formData.location.address) {
        errors.location = 'Property location is missing';
      }

      if (!isValidStartDate(formData.availabilityDates.start)) {
        errors.startDate = 'Start date must be at least tomorrow';
      }

      if (!formData.availabilityDates.end) {
        errors.endDate = 'End date is required';
      }

      if (formData.availabilityDates.start && formData.availabilityDates.end) {
        if (new Date(formData.availabilityDates.end) <= new Date(formData.availabilityDates.start)) {
          errors.endDate = 'End date must be after start date';
        }
      }

      if (!formData.pricing.amount || parseFloat(formData.pricing.amount) <= 0) {
        errors.pricing = 'Price must be greater than 0';
      }

      if (parseFloat(formData.pricing.amount) > 20000) {
        errors.pricing = 'Price cannot exceed $20,000';
      }

      if (!formData.pricing.minimumStay || parseInt(formData.pricing.minimumStay) <= 0) {
        errors.minimumStay = 'Minimum stay is required';
      }

      if (!formData.type) {
        errors.type = 'Property type is required';
      }

      if (!formData.category) {
        errors.category = 'Property category is required';
      }
    }

    // Step 2: Features (was Step 3)
    if (step === 2) {
      if (formData.features.length === 0) {
        errors.features = 'Please select at least 1 feature';
      }

      if (formData.features.length > 50) {
        errors.features = 'Maximum 50 features allowed';
      }
    }

    // Step 3: Media (was Step 4)
    if (step === 3) {
      if (!formData.video3D) {
        errors.video3D = '3D property video is required';
      }

      for (const category of imageCategories) {
        const currentCount = formData.images[category.name].length;
        if (currentCount > 0 && currentCount < category.maxImages) {
          errors[`images_${category.name}`] = `${category.label}: Please upload ${category.maxImages - currentCount} more image(s) or remove existing ones`;
        }
      }
    }

    // Step 4: Review (was Step 5) - no validation needed

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      setNotification({
        message: 'Please fix all validation errors before proceeding',
        type: 'error'
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      setValidationErrors({});

      if (!isValidStartDate(formData.availabilityDates.start)) {
        setValidationErrors(prev => ({
          ...prev,
          startDate: 'Start date must be at least tomorrow (today and previous dates are not allowed)'
        }));
        setSubmitError('Please correct the validation errors before submitting.');
        return;
      }

      const beds = Math.max(1, formData.features.filter(f => f.includes('Bed')).length || 2);
      const baths = Math.max(1, formData.features.filter(f => f.includes('Shower') || f.includes('Bathtub')).length || 1);
      const maxGuests = beds * 2;

      let video3DUrl = '';
      if (formData.video3D) {
        video3DUrl = await processVideo();
      }

      const processedImages = await processImages();

      // Build coordinates object properly
      const coordinates = {
        latitude: formData.location.latitude,
        longitude: formData.location.longitude
      };

      const baseRequestBody = {
        name: formData.name.trim(),
        location: formData.location.address,
        coordinates: coordinates,
        type: formData.type,
        category: formData.category,
        pricingType: formData.pricing.type,
        minimumStay: parseInt(formData.pricing.minimumStay),
        beds: beds,
        baths: baths,
        maxGuests: maxGuests,
        features: formData.features,
        description: `A stunning ${formData.type} with ${formData.features.length} amazing features.`,
        images: processedImages,
        video3D: video3DUrl || '',
        availableFrom: formData.availabilityDates.start,
        availableTo: formData.availabilityDates.end
      };

      const requestBody = formData.pricing.type === 'night'
        ? {
            ...baseRequestBody,
            pricePerNight: parseFloat(formData.pricing.amount)
          }
        : {
            ...baseRequestBody,
            pricePerMonth: parseFloat(formData.pricing.amount)
          };

      console.log('Updating property with data:', requestBody);

      const response = await api.updateProperty(parseInt(propertyId), requestBody);

      if (response.ok) {
        setSubmitSuccess('Property updated successfully!');
        setNotification({
          message: 'Property has been successfully updated!',
          type: 'success'
        });

        setTimeout(() => {
          const viewDetailsUrl = createViewDetailsUrl(propertyId, 'property');
          router.push(viewDetailsUrl);
        }, 2000);
      } else {
        throw new Error(response.data?.message || 'Failed to update property');
      }
    } catch (error: any) {
      console.error('Error updating property:', error);
      const errorMessage = handleApiError(error);
      setSubmitError(errorMessage);
      setNotification({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const getStepTitle = (step: number): string => {
    switch (step) {
      case 1: return 'Property Details';
      case 2: return 'Amenities & Features';
      case 3: return 'Photos & Video';
      case 4: return 'Review & Confirm';
      default: return '';
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-col items-center" style={{ width: '23%' }}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step === currentStep
                  ? 'bg-[#083A85] text-white shadow-lg scale-110'
                  : step < currentStep
                  ? 'bg-[#0a4499] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            <span className={`text-xs mt-2 text-center ${step === currentStep ? 'font-semibold text-[#083A85]' : 'text-gray-500'}`}>
              {getStepTitle(step)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#083A85] to-[#0a4499] transition-all duration-500"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
    </div>
  );

  if (isLoadingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#083A85] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Map selector removed - location cannot be edited */}

      <div className="py-3 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Property</h1>
            <p className="text-gray-600">Update your property information</p>
          </div>

          {renderProgressBar()}

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            {/* Step 1: Property Details (Host Info Removed) */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Property Details</h2>
                  <p className="text-gray-600 mb-6">Update your property information</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Name <span className="text-[#083A85]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Beautiful Downtown Apartment"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                      validationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>

                {/* Property Location - READ ONLY */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Location <span className="text-gray-400">(Cannot be changed)</span>
                  </label>
                  <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">{formData.location.address}</p>
                        {formData.location.latitude && formData.location.longitude && (
                          <p className="text-xs text-gray-500">
                            Coordinates: {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Property location cannot be modified after creation. Contact support if you need to change it.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type <span className="text-[#083A85]">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white ${
                        validationErrors.type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select type</option>
                      {propertyTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                    {validationErrors.type && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Category <span className="text-[#083A85]">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white ${
                        validationErrors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {propertyCategories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    {validationErrors.category && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pricing Type <span className="text-[#083A85]">*</span>
                      </label>
                      <select
                        name="pricingType"
                        value={formData.pricing.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white"
                      >
                        <option value="night">Per Night</option>
                        <option value="month">Per Month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price <span className="text-[#083A85]">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-gray-500">$</span>
                        <input
                          type="number"
                          name="pricingAmount"
                          value={formData.pricing.amount}
                          onChange={handleInputChange}
                          placeholder="100"
                          min="1"
                          max="20000"
                          step="0.01"
                          className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                            validationErrors.pricing ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {validationErrors.pricing && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.pricing}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stay <span className="text-[#083A85]">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        name="minimumStay"
                        value={formData.pricing.minimumStay}
                        onChange={handleInputChange}
                        placeholder="1"
                        min="1"
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                          validationErrors.minimumStay ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <span className="text-gray-600 font-medium">
                        {formData.pricing.type === 'night' ? 'night(s)' : 'month(s)'}
                      </span>
                    </div>
                    {validationErrors.minimumStay && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.minimumStay}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Guests must book for at least this duration
                    </p>
                  </div>
                </div>

                {/* Availability */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available From <span className="text-[#083A85]">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.availabilityDates.start}
                        onChange={handleInputChange}
                        min={getTomorrowDate()}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                          validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.startDate && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Until <span className="text-[#083A85]">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.availabilityDates.end}
                        onChange={handleInputChange}
                        min={formData.availabilityDates.start || getTomorrowDate()}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                          validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors.endDate && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Features */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Amenities & Features</h2>
                  <p className="text-gray-600 mb-6">Select all amenities available at your property</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    Selected: <span className="font-bold">{formData.features.length}</span> feature{formData.features.length !== 1 ? 's' : ''} (max 50)
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getAllPossibleFeatures().map(feature => (
                    <div
                      key={feature}
                      onClick={() => handleFeatureToggle(feature)}
                      className={`
                        flex items-center p-3 rounded-lg cursor-pointer transition-all select-none border-2
                        ${formData.features.includes(feature)
                          ? 'bg-[#083A85] text-white border-[#083A85] shadow-md'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-center w-full">
                        <div className={`
                          w-5 h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0
                          ${formData.features.includes(feature)
                            ? 'border-white bg-white'
                            : 'border-gray-400'
                          }
                        `}>
                          {formData.features.includes(feature) && (
                            <span className="text-[#083A85] text-sm">✓</span>
                          )}
                        </div>
                        <span className="text-sm leading-tight">{feature}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {validationErrors.features && (
                  <p className="mt-2 text-sm text-red-600">{validationErrors.features}</p>
                )}
              </div>
            )}

            {/* Step 3: Media Upload */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Photos & Video</h2>
                  <p className="text-gray-600 mb-6">Update your property images and video tour</p>
                </div>

                {/* Video Upload */}
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <svg className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-900">3D Property Video Required</h3>
                      <p className="text-sm text-amber-800 mt-1">Please upload a walkthrough video of your property</p>
                    </div>
                  </div>

                  {!formData.video3D ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full py-8 border-2 border-dashed border-amber-400 rounded-lg flex flex-col items-center justify-center hover:border-amber-500 hover:bg-amber-100 transition-all cursor-pointer"
                      >
                        <svg className="w-12 h-12 text-amber-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Click to upload video</span>
                        <span className="text-sm text-gray-500 mt-1">MP4, WebM, MOV, AVI (Max 500MB)</span>
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
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{formData.video3D.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(formData.video3D.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeVideo}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {videoUploadProgress > 0 && videoUploadProgress < 100 && isSubmitting && (
                        <div className="mt-3">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                              style={{ width: `${videoUploadProgress}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Uploading... {videoUploadProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  {validationErrors.video3D && (
                    <p className="mt-2 text-sm text-red-600">{validationErrors.video3D}</p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Images (Optional)</h3>
                  <p className="text-sm text-gray-600 mb-4">Upload high-quality photos of different areas</p>

                  <div className="space-y-4">
                    {imageCategories.map(category => {
                      const currentCount = formData.images[category.name].length;
                      const isIncomplete = currentCount > 0 && currentCount < category.maxImages;
                      const uploadProgress = imageUploadProgress[category.name];

                      return (
                        <div
                          key={category.name}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            isIncomplete
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900">
                              {category.label}
                              {isIncomplete && (
                                <span className="ml-2 text-xs text-amber-600">
                                  ({category.maxImages - currentCount} more required)
                                </span>
                              )}
                            </h5>
                            <span className={`text-sm ${
                              currentCount === category.maxImages
                                ? 'text-green-600 font-medium'
                                : 'text-gray-500'
                            }`}>
                              {currentCount}/{category.maxImages}
                              {currentCount === category.maxImages && ' ✓'}
                            </span>
                          </div>

                          {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && isSubmitting && (
                            <div className="mb-3">
                              <div className="bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
                            </div>
                          )}

                          {currentCount < category.maxImages && (
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[category.name]?.click()}
                              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#083A85] hover:bg-gray-50 transition-all cursor-pointer mb-3"
                            >
                              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs font-medium text-gray-700">Add {category.label} Images</span>
                            </button>
                          )}

                          <input
                            ref={(el) => { fileInputRefs.current[category.name] = el; }}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(category.name, e.target.files)}
                            className="hidden"
                          />

                          {currentCount > 0 && (
                            <div className="grid grid-cols-3 gap-2">
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
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {validationErrors[`images_${category.name}`] && (
                            <p className="mt-2 text-sm text-red-600">{validationErrors[`images_${category.name}`]}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Review Your Changes</h2>
                  <p className="text-gray-600 mb-6">Please review all details before updating</p>
                </div>

                {/* Host Info Preview */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Host Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.ownerDetails.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.ownerDetails.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.ownerDetails.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.ownerDetails.address}</span>
                    </div>
                  </div>
                </div>

                {/* Property Details Preview */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Property Name:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {propertyCategories.find(c => c.value === formData.category)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium text-gray-900">{formData.location.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pricing:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ${formData.pricing.amount} per {formData.pricing.type}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Minimum Stay:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formData.pricing.minimumStay} {formData.pricing.type === 'night' ? 'night(s)' : 'month(s)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Availability:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formData.availabilityDates.start} to {formData.availabilityDates.end}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features Preview */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features ({formData.features.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map(feature => (
                      <span key={feature} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Media Preview */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-900 font-medium">3D Video: {formData.video3D?.name}</span>
                    </div>
                    {imageCategories.map(category => {
                      const count = formData.images[category.name].length;
                      if (count > 0) {
                        return (
                          <div key={category.name} className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-900">{category.label}: {count} image(s)</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                )}

                {submitSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">{submitSuccess}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-6 py-3 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#0a4499] transition-colors shadow-md hover:shadow-lg"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="ml-auto px-8 py-3 bg-gradient-to-r from-[#083A85] to-[#0a4499] text-white rounded-lg font-medium hover:from-[#0a4499] hover:to-[#083A85] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Property'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EditPropertyContent;
