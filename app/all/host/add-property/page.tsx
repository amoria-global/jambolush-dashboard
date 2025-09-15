'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import api from '@/app/api/apiService';
import uploadDocumentToSupabase from '@/app/api/storage';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  names: string;
  phone: string;
  address: string;
  userType: string;
}

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

interface DocumentFile {
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

interface LocationDetails {
  type: 'upi' | 'address' | '';
  upi: string;
  upiDocument: DocumentFile | null;
  address: string;
}

interface FormData {
  ownerDetails: OwnerDetails;
  name: string;
  location: LocationDetails;
  availabilityDates: AvailabilityDates;
  pricePerTwoNights: string;
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

const AddPropertyPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [documentUploadProgress, setDocumentUploadProgress] = useState<number>(0);
  const [imageUploadProgress, setImageUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isExistingHost, setIsExistingHost] = useState<boolean>(false);
  
  // Add ref to track component mount status for cleanup only
  const isMountedRef = useRef<boolean>(true);
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    ownerDetails: {
      names: '',
      email: '',
      phone: '',
      address: ''
    },
    name: '',
    location: {
      type: '',
      upi: '',
      upiDocument: null,
      address: ''
    },
    availabilityDates: { start: '', end: '' },
    pricePerTwoNights: '',
    type: '',
    category: 'entire_place', // Updated to match backend expectations
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

  // Updated property types to match backend validation
  const propertyTypes: string[] = [
    'apartment', 'house', 'villa', 'condo', 'townhouse',
    'studio', 'loft' // Removed types not supported by backend
  ];

  // Property categories that match backend validation
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
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function to get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Helper function to validate dates
  const isValidStartDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const selectedDate = new Date(dateString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return selectedDate >= tomorrow;
  };

  // Email validation helper to match backend
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // UPI validation helper
  const isValidUPI = (upi: string): boolean => {
    // UPI should be a number with at least 6 digits
    const upiRegex = /^[0-9]{6,}$/;
    return upiRegex.test(upi);
  };

  // Enhanced error handling function
  const handleApiError = (error: any): string => {
    console.error('API Error:', error);
    
    // If error has response data with message
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    
    // If error has direct message
    if (error?.message) {
      return error.message;
    }
    
    // If it's a string error
    if (typeof error === 'string') {
      return error;
    }
    
    // If error has response with error field
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    
    // If error has data field directly
    if (error?.data?.message) {
      return error.data.message;
    }
    
    // Default fallback
    return 'An unexpected error occurred. Please try again.';
  };

  // Cleanup function to prevent memory leaks - ONLY for cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up object URLs on unmount
      try {
        Object.values(formData.images).forEach(categoryImages => {
          categoryImages.forEach((image: any) => {
            if (image.url && image.url.startsWith('blob:')) {
              URL.revokeObjectURL(image.url);
            }
          });
        });
        
        if (formData.video3D?.url && formData.video3D.url.startsWith('blob:')) {
          URL.revokeObjectURL(formData.video3D.url);
        }

        if (formData.location.upiDocument?.url && formData.location.upiDocument.url.startsWith('blob:')) {
          URL.revokeObjectURL(formData.location.upiDocument.url);
        }
      } catch (error) {
        console.warn('Error cleaning up object URLs:', error);
      }
    };
  }, []); // Empty dependency array - only run on unmount

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

  // Check user session and role on component mount
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      setIsLoadingUser(true);
      const response = await api.get('/auth/me');
      
      if (response.ok && response.data) {
        const user = response.data;
        setCurrentUser(user);
        
        // Check if user is already a host
        if (user.userType === 'host') {
          setIsExistingHost(true);
          // Pre-fill owner details with host information
          setFormData(prev => ({
            ...prev,
            ownerDetails: {
              names: user.names || '',
              email: user.email || '',
              phone: user.phone || '',
              address: user.address || ''
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      // User might not be logged in - we'll handle this in form submission
    } finally {
      setIsLoadingUser(false);
    }
  };

  const registerUserAsHost = async (ownerDetails: OwnerDetails): Promise<string> => {
    try {
      // Check if user with this email already exists
      const existingUserResponse = await api.get(`/auth/users/email/${ownerDetails.email}`);
      
      if (existingUserResponse.ok && existingUserResponse.data) {
        const existingUser = existingUserResponse.data;
        
        // If user exists and is already a host, return their ID
        if (existingUser.userType === 'host') {
          return existingUser.id;
        }
        
        // If user exists but not a host, update their userType to host
        const updateResponse = await api.put('/auth/me', {
          userType: 'host',
          ...ownerDetails
        });
        
        if (updateResponse.ok) {
          return existingUser.id;
        }
      }
      
      // Register new user as host
      const registerResponse = await api.post('/auth/register', {
        ...ownerDetails,
        password: Math.random().toString(36).substring(2, 15), // Temporary password
        userType: 'host'
      });
      
      if (registerResponse.ok && registerResponse.data) {
        return registerResponse.data.id;
      }
      
      throw new Error('Failed to register user as host');
    } catch (error) {
      console.error('Error in registerUserAsHost:', error);
      throw error;
    }
  };

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

  // Generate unique filename for property media
  const generateUniqueFileName = (file: File, category: string, propertyName?: string): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const safePropertyName = propertyName ? propertyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'property';
    
    return `${safePropertyName}_${category}_${timestamp}_${randomStr}.${fileExtension}`;
  };

  // Upload single file to Supabase
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
    } catch (error) {
      console.error(`Error uploading file to Supabase (${category}):`, error);
      throw error;
    }
  };

  // Upload multiple files to Supabase
  const uploadMultipleFilesToSupabase = async (
    files: File[],
    category: string,
    onProgress?: (progress: number) => void
  ): Promise<string[]> => {
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;
      
      if (onProgress) onProgress(0);
      
      console.log('Uploading multiple files to Supabase:', {
        fileCount: totalFiles,
        fileNames: files.map(f => f.name),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        category
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = generateUniqueFileName(file, category, formData.name);
        const folder = `properties/${category}`;
        
        try {
          const uploadedUrl = await uploadDocumentToSupabase(file, fileName, folder);
          uploadedUrls.push(uploadedUrl);
          
          // Update progress
          const progress = Math.round(((i + 1) / totalFiles) * 100);
          if (onProgress) onProgress(progress);
          
          console.log(`File ${i + 1}/${totalFiles} uploaded:`, uploadedUrl);
        } catch (error) {
          console.error(`Error uploading file ${i + 1}:`, error);
          // Continue with other files, but log the error
          throw error;
        }
      }

      console.log('All files uploaded successfully:', uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      console.error(`Error uploading files to Supabase (${category}):`, error);
      throw error;
    }
  };

  // Process and upload all images
  const processImages = async (): Promise<any> => {
    const processedImages: any = {};
    
    for (const category of imageCategories) {
      const categoryImages = formData.images[category.name];
      if (categoryImages.length > 0) {
        try {
          setImageUploadProgress(prev => ({ ...prev, [category.name]: 0 }));
          
          // Upload all images for this category
          const files = categoryImages.map(imgFile => imgFile.file);
          const uploadedUrls = await uploadMultipleFilesToSupabase(
            files, 
            category.name,
            (progress) => {
              setImageUploadProgress(prev => ({ ...prev, [category.name]: progress }));
            }
          );

          processedImages[category.name] = uploadedUrls;
        } catch (error) {
          console.error(`Failed to process ${category.name} images:`, error);
          setImageUploadProgress(prev => ({ ...prev, [category.name]: -1 })); // -1 indicates error
          processedImages[category.name] = [];
        }
      } else {
        processedImages[category.name] = [];
      }
    }
    
    return processedImages;
  };

  // Process and upload video
  const processVideo = async (): Promise<string> => {
    if (!formData.video3D) return '';
    
    try {
      setVideoUploadProgress(10);
      
      const uploadedUrl = await uploadSingleFileToSupabase(
        formData.video3D.file,
        'videos',
        (progress) => {
          setVideoUploadProgress(progress);
        }
      );
      
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to upload video:', error);
      setVideoUploadProgress(-1); // -1 indicates error
      throw error;
    }
  };

  // Process and upload UPI document
  const processUPIDocument = async (): Promise<string> => {
    if (!formData.location.upiDocument) return '';
    
    try {
      setDocumentUploadProgress(10);
      
      const uploadedUrl = await uploadSingleFileToSupabase(
        formData.location.upiDocument.file,
        'documents',
        (progress) => {
          setDocumentUploadProgress(progress);
        }
      );
      
      return uploadedUrl;
    } catch (error) {
      console.error('Failed to upload UPI document:', error);
      setDocumentUploadProgress(-1); // -1 indicates error
      throw error;
    }
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
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleLocationTypeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        type: value as 'upi' | 'address',
        upi: '',
        address: '',
        upiDocument: null
      }
    }));
    
    // Clear validation errors
    if (validationErrors.location) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const handleLocationDetailsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [name]: value
      }
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors.location) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (name === 'name') {
      setFormData(prev => ({ ...prev, [name]: capitalizeFirstLetter(value) }));
    } else if (name === 'type') {
      // Convert to lowercase for backend compatibility while keeping display value
      setFormData(prev => ({ ...prev, [name]: value.toLowerCase() }));
    } else if (name === 'startDate' || name === 'endDate') {
      const fieldName = name === 'startDate' ? 'start' : 'end';
      
      // Validate start date
      if (name === 'startDate' && !isValidStartDate(value)) {
        setValidationErrors(prev => ({
          ...prev,
          startDate: 'Start date must be at least tomorrow (today and previous dates are not allowed)'
        }));
      }
      
      setFormData(prev => ({
        ...prev,
        availabilityDates: {
          ...prev.availabilityDates,
          [fieldName]: value
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
      name: file.name,
      uploaded: false
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
    const newVideo: VideoFile = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploaded: false
    };

    setFormData(prev => ({
      ...prev,
      video3D: newVideo
    }));
  };

  const handleDocumentUpload = (file: File | null) => {
    if (!file) return;

    const validDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validDocumentTypes.includes(file.type)) {
      alert('Please upload a valid document file (PDF, JPEG, PNG, JPG)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('Document file size must be less than 10MB');
      return;
    }

    setDocumentUploadProgress(0);
    const newDocument: DocumentFile = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploaded: false
    };

    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        upiDocument: newDocument
      }
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
  
  const removeDocument = () => {
    if (formData.location.upiDocument?.url) {
      URL.revokeObjectURL(formData.location.upiDocument.url);
    }
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        upiDocument: null
      }
    }));
    setDocumentUploadProgress(0);
  };

  const removeImage = (category: keyof PropertyImages, index: number) => {
    const imageToRemove = formData.images[category][index];
    if (imageToRemove?.url) {
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      setValidationErrors({});

      // Client-side validation for dates
      if (!isValidStartDate(formData.availabilityDates.start)) {
        setValidationErrors(prev => ({
          ...prev,
          startDate: 'Start date must be at least tomorrow (today and previous dates are not allowed)'
        }));
        setSubmitError('Please correct the validation errors before submitting.');
        return;
      }

      let hostId: string;

      // Handle user registration/authentication
      if (isExistingHost && currentUser) {
        // User is already a host, use their ID
        hostId = currentUser.id;
      } else {
        // Register new user as host or get existing user ID
        hostId = await registerUserAsHost(formData.ownerDetails);
      }

      // Calculate beds and baths from features or set defaults
      const beds = Math.max(1, formData.features.filter(f => f.includes('Bed')).length || 2);
      const baths = Math.max(1, formData.features.filter(f => f.includes('Shower') || f.includes('Bathtub')).length || 1);
      const maxGuests = beds * 2; // Estimate max guests

      // Process and upload video
      let video3DUrl = '';
      if (formData.video3D) {
        video3DUrl = await processVideo();
      }
      
      // Process and upload UPI document if provided
      let upiDocumentUrl = '';
      if (formData.location.type === 'upi' && formData.location.upiDocument) {
        upiDocumentUrl = await processUPIDocument();
      }

      // Process and upload images
      const processedImages = await processImages();
      
      // Prepare location data based on type
      const locationData = formData.location.type === 'upi' 
        ? {
            type: 'upi',
            upi: formData.location.upi,
            upiDocument: upiDocumentUrl,
            address: ''
          }
        : {
            type: 'address',
            upi: '',
            upiDocument: '',
            address: formData.location.address
          };

      // Prepare the request body to match backend expectations exactly
      const requestBody = {
        hostId: hostId,
        name: formData.name.trim(),
        location: locationData,
        type: formData.type, // Already lowercase from handleInputChange
        category: formData.category,
        pricePerNight: parseFloat(formData.pricePerTwoNights) / 2, // Convert to per night
        pricePerTwoNights: parseFloat(formData.pricePerTwoNights),
        beds: beds,
        baths: baths,
        maxGuests: maxGuests,
        features: formData.features, // Ensure it's an array
        description: `A stunning ${formData.type} with ${formData.features.length} amazing features.`,
        images: processedImages,
        video3D: video3DUrl,
        availabilityDates: {
          start: formData.availabilityDates.start,
          end: formData.availabilityDates.end
        },
        ownerDetails: {
          names: formData.ownerDetails.names.trim(),
          email: formData.ownerDetails.email.trim(),
          phone: formData.ownerDetails.phone.trim(),
          address: formData.ownerDetails.address.trim()
        }
      };

      console.log('Submitting property data:', requestBody);

      // Make API call to create property
      const response = await api.post('/properties', requestBody);

      if (response.ok) {
        const successMessage = response.data?.message || 'Property added successfully!';
        setSubmitSuccess(successMessage);
        
        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
          // Redirect to properties page
          window.location.href = '/host/properties';
        }, 2000);
      } else {
        // Handle different types of server errors
        let errorMessage = 'Failed to create property. Please try again.';
        
        // Check for validation errors from server
        if (response.data?.errors) {
          const serverErrors = response.data.errors;
          const newValidationErrors: { [key: string]: string } = {};
          
          // Map server validation errors to form fields
          Object.keys(serverErrors).forEach(field => {
            newValidationErrors[field] = Array.isArray(serverErrors[field]) 
              ? serverErrors[field][0] 
              : serverErrors[field];
          });
          
          setValidationErrors(newValidationErrors);
          errorMessage = 'Please correct the validation errors and try again.';
        } else if (response.data?.message) {
          errorMessage = response.data.message;
        }
        
        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('Error creating property:', error);
      const errorMessage = handleApiError(error);
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Clean up object URLs
    Object.values(formData.images).forEach(categoryImages => {
      categoryImages.forEach((image: any) => {
        if (image.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    });
    
    if (formData.video3D?.url) {
      URL.revokeObjectURL(formData.video3D.url);
    }
    
    if (formData.location.upiDocument?.url) {
      URL.revokeObjectURL(formData.location.upiDocument.url);
    }

    setFormData({
      ownerDetails: {
        names: '',
        email: '',
        phone: '',
        address: ''
      },
      name: '',
      location: {
        type: '',
        upi: '',
        upiDocument: null,
        address: ''
      },
      availabilityDates: { start: '', end: '' },
      pricePerTwoNights: '',
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
    setCurrentStep(1);
    setVideoUploadProgress(0);
    setDocumentUploadProgress(0);
    setImageUploadProgress({});
    setSubmitError('');
    setSubmitSuccess('');
    setValidationErrors({});
  };

  // Updated validation to match original backend requirements exactly
  const isStepValid = (): boolean => {
    if (currentStep === 1) {
      const { names, email, phone, address } = formData.ownerDetails;
      return !!(
        names && names.trim().length >= 2 &&
        email && isValidEmail(email) &&
        phone && phone.trim().length >= 10 &&
        address && address.trim().length >= 10
      );
    }
    if (currentStep === 2) {
      // Match original backend validation requirements
      const validTypes = ['apartment', 'house', 'villa', 'condo', 'townhouse', 'studio', 'loft'];
      const isStartDateValid = isValidStartDate(formData.availabilityDates.start);
      
      // Location validation based on type
      let isLocationValid = false;
      if (formData.location.type === 'upi') {
        isLocationValid = !!(
          formData.location.upi && 
          isValidUPI(formData.location.upi) &&
          formData.location.upiDocument
        );
      } else if (formData.location.type === 'address') {
        isLocationValid = !!(
          formData.location.address && 
          formData.location.address.trim().length >= 5
        );
      }
      
      return !!(
        formData.name && formData.name.trim().length >= 3 && formData.name.length <= 100 &&
        formData.location.type && isLocationValid &&
        formData.availabilityDates.start && 
        formData.availabilityDates.end &&
        isStartDateValid &&
        formData.pricePerTwoNights && 
        parseFloat(formData.pricePerTwoNights) > 0 &&
        parseFloat(formData.pricePerTwoNights) <= 20000 && // Per two nights max
        formData.type && validTypes.includes(formData.type) &&
        formData.category && ['entire_place', 'private_room', 'shared_room'].includes(formData.category) &&
        Object.keys(validationErrors).length === 0
      );
    }
    if (currentStep === 3) {
      return formData.features.length > 0 && formData.features.length <= 50;
    }
    if (currentStep === 4) {
      // Video is required per original backend validation
      if (!formData.video3D) {
        return false;
      }
      // Images validation - following original backend logic
      let hasRequiredImages = false;
      const requiredCategories = ['exterior', 'livingRoom', 'bedroom'];
      
      for (const category of requiredCategories) {
        const categoryImages = formData.images[category as keyof PropertyImages];
        if (categoryImages && categoryImages.length > 0) {
          hasRequiredImages = true;
          break;
        }
      }
      
      // If images started for any category, must complete per frontend logic
      for (const category of imageCategories) {
        const categoryImages = formData.images[category.name];
        if (categoryImages.length > 0 && categoryImages.length < category.maxImages) {
          return false;
        }
      }
      
      return true; // Images are optional per original backend, video is required
    }
    return true;
  };

  const getStepLabel = (step: number): string => {
    switch(step) {
      case 1: return 'Owner Details';
      case 2: return 'Property Details';
      case 3: return 'Property Features';
      case 4: return 'Media Upload';
      default: return '';
    }
  };

  // Show loading state while checking user session
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <head>
        <title>Add Property - Jambolush</title>
      </head>
      <div className="min-h-screen bg-gray-50">
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
            <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
              <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Add New Property</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Step {currentStep} of 4 • Supabase Storage</p>
                    {isExistingHost && (
                      <p className="text-xs sm:text-sm text-green-600 mt-1">✓ Existing Host Account</p>
                    )}
                  </div>
                 <button onClick={() => {setIsModalOpen(false); router.push("/all/host/properties")}} className="cursor-pointer">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 p-2 sm:p-3 bg-gray-300 text-black-400 hover:text-white hover:bg-red-500 rounded-full transition-colors flex items-center justify-center">
                     <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </div>
                 </button>
                </div>

                {/* Success Message */}
                {submitSuccess && (
                  <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-green-800">{submitSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {submitError && (
                  <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{submitError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Mobile Stepper - Horizontal dots */}
                <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:hidden">
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                          ${currentStep >= step
                            ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white shadow-lg'
                            : 'bg-gray-200 text-gray-600'}
                        `}>
                          {currentStep > step ? '✓' : step}
                        </div>
                        <span className="text-xs font-medium text-gray-600 mt-1 text-center">
                          {getStepLabel(step).split(' ')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Stepper */}
                <div className="hidden sm:block px-4 sm:px-6 lg:px-8 pt-4 pb-2">
                  <div className="flex items-center justify-between relative">
                    {[1, 2, 3, 4].map((step) => (
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
                          <span className="text-xs sm:text-sm font-semibold text-gray-600 mt-2 whitespace-nowrap text-center">
                            {getStepLabel(step)}
                          </span>
                        </div>
                        {step < 4 && (
                          <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-all self-start mt-4 sm:mt-5 ${
                            currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-16 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 240px)' }}>
                  {currentStep === 1 && (
                    <div className="space-y-4 sm:space-y-6">
                      {isExistingHost && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-green-800">
                            <strong>Host Account Detected:</strong> Your existing account details have been pre-filled. You can modify them if needed.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Full Name {!isExistingHost && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          name="names"
                          value={formData.ownerDetails.names}
                          onChange={handleOwnerInputChange}
                          placeholder="Enter owner's full name (min 2 characters)"
                          disabled={isExistingHost && !!currentUser?.names}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.names ? 'border-red-500' : 'border-gray-300'
                          } ${isExistingHost && currentUser?.names ? 'bg-gray-100' : ''}`}
                        />
                        {validationErrors.names && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.names}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Email Address {!isExistingHost && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.ownerDetails.email}
                          onChange={handleOwnerInputChange}
                          placeholder="owner@example.com"
                          disabled={isExistingHost && !!currentUser?.email}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.email ? 'border-red-500' : 'border-gray-300'
                          } ${isExistingHost && currentUser?.email ? 'bg-gray-100' : ''}`}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Phone Number {!isExistingHost && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.ownerDetails.phone}
                          onChange={handleOwnerInputChange}
                          placeholder="+250 7812-4567 (min 10 characters)"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.phone && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Address {!isExistingHost && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.ownerDetails.address}
                          onChange={handleOwnerInputChange}
                          placeholder="123 Main St, City, State, ZIP (min 10 characters)"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.address && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Property Details */}
                  {currentStep === 2 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Property Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter property name (min 3 characters)"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                        )}
                      </div>

                      {/* Location Type Selection */}
                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 cursor-pointer">
                          Property Location Type <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="upi"
                              name="locationType"
                              value="upi"
                              checked={formData.location.type === 'upi'}
                              onChange={handleLocationTypeChange}
                              className="h-4 w-4 text-[#083A85] focus:ring-[#083A85] border-gray-300"
                            />
                            <label htmlFor="upi" className="ml-2 text-sm sm:text-base font-medium text-gray-700 cursor-pointer">
                              Property UPI (Unique Parcel Identifier)
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="address"
                              name="locationType"
                              value="address"
                              checked={formData.location.type === 'address'}
                              onChange={handleLocationTypeChange}
                              className="h-4 w-4 text-[#083A85] focus:ring-[#083A85] border-gray-300"
                            />
                            <label htmlFor="address" className="ml-2 text-sm sm:text-base font-medium text-gray-700 cursor-pointer">
                              Property Address
                            </label>
                          </div>
                        </div>
                        {validationErrors.location && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                        )}
                      </div>

                      {/* UPI Input */}
                      {formData.location.type === 'upi' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                              Property UPI Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="upi"
                              value={formData.location.upi}
                              onChange={handleLocationDetailsChange}
                              placeholder="Enter UPI number (numbers only, min 6 digits)"
                              className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                                validationErrors.location ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            <p className="mt-1 text-xs text-gray-500">UPI should contain only numbers and be at least 6 digits long</p>
                          </div>

                          {/* UPI Document Upload */}
                          <div>
                            <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                              UPI Verification Document <span className="text-red-500">*</span>
                            </label>
                            {!formData.location.upiDocument ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => documentInputRef.current?.click()}
                                  className="w-full py-4 sm:py-6 border-2 border-dashed border-[#083A85] rounded-lg flex flex-col items-center justify-center hover:border-[#0a4499] hover:bg-blue-50 transition-all cursor-pointer"
                                >
                                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#083A85] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Click to upload UPI document</span>
                                  <span className="text-xs sm:text-sm text-gray-500 mt-1">PDF, JPEG, PNG, JPG (Max 10MB)</span>
                                </button>
                                <input
                                  ref={documentInputRef}
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleDocumentUpload(e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </div>
                            ) : (
                              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{formData.location.upiDocument.name}</p>
                                      <p className="text-xs sm:text-sm text-gray-500">{formatFileSize(formData.location.upiDocument.size)}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={removeDocument}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Upload progress for document */}
                                {documentUploadProgress > 0 && documentUploadProgress < 100 && isSubmitting && (
                                  <div className="mt-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                        style={{ width: `${documentUploadProgress}%` }}
                                      />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Uploading document to Supabase... {documentUploadProgress}%</p>
                                  </div>
                                )}
                                
                                {documentUploadProgress === -1 && (
                                  <div className="mt-3 text-red-600 text-xs sm:text-sm">
                                    Upload failed. Please try again.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Address Input */}
                      {formData.location.type === 'address' && (
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                            Property Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={formData.location.address}
                            onChange={handleLocationDetailsChange}
                            placeholder="Street, House Number, City, District (min 5 characters)"
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                              validationErrors.location ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          <p className="mt-1 text-xs text-gray-500">Include full address details for easy location identification</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                            Available From <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.availabilityDates.start}
                            onChange={handleInputChange}
                            min={getTomorrowDate()}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                              validationErrors.startDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.startDate && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">Must be at least tomorrow</p>
                        </div>
                        <div>
                          <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                            Available Until <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.availabilityDates.end}
                            onChange={handleInputChange}
                            min={formData.availabilityDates.start || getTomorrowDate()}
                            className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                              validationErrors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {validationErrors.endDate && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Price per 2 Nights <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="pricePerTwoNights"
                          value={formData.pricePerTwoNights}
                          onChange={handleInputChange}
                          placeholder="0.00 (max $20,000)"
                          min="1"
                          max="20000"
                          step="0.01"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.pricePerTwoNights ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.pricePerTwoNights && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.pricePerTwoNights}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Property Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="type"
                          value={formData.type}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer ${
                            validationErrors.type ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select property type</option>
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

                      <div className="pb-4">
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 cursor-pointer">
                          Property Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer ${
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
                  )}

                  {/* Step 3: Features */}
                  {currentStep === 3 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          Select Property Features
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Choose all the features and amenities available at your property (1-50 features required)
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            Selected: {formData.features.length} feature{formData.features.length !== 1 ? 's' : ''} (max 50)
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
                            <div className="flex items-center w-full">
                              <div className={`
                                w-4 h-4 sm:w-5 sm:h-5 rounded border-2 mr-2 flex items-center justify-center flex-shrink-0
                                ${formData.features.includes(feature)
                                  ? 'border-white bg-white'
                                  : 'border-gray-400'
                                }
                              `}>
                                {formData.features.includes(feature) && (
                                  <span className="text-[#083A85] text-xs sm:text-sm">✓</span>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm leading-tight">{feature}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Media Upload */}
                  {currentStep === 4 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                          Upload Property Media
                        </h3>

                        <div className="mb-6 sm:mb-8">
                          <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-start">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <div>
                                <p className="text-xs sm:text-sm font-medium text-red-800">
                                  3D Property Video - REQUIRED
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-red-700 mt-1">
                                  You must upload a 3D walkthrough video of your property to proceed. Files will be stored securely in Supabase.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className={`border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 transition-all ${
                            formData.video3D
                              ? 'border-green-400 bg-green-50'
                              : 'border-red-400 bg-red-50'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                              <h4 className="text-sm sm:text-lg font-medium text-gray-900">
                                3D Property Video
                                {!formData.video3D && (
                                  <span className="ml-2 text-xs sm:text-sm text-red-600">*Required</span>
                                )}
                              </h4>
                              {formData.video3D && (
                                <span className="text-xs sm:text-sm text-green-600 font-medium">✓ Ready</span>
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
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Click to upload 3D video</span>
                                  <span className="text-xs sm:text-sm text-gray-500 mt-1">MP4, WebM, MOV, AVI (Max 500MB)</span>
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
                                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{formData.video3D.name}</p>
                                      <p className="text-xs sm:text-sm text-gray-500">{formatFileSize(formData.video3D.size)}</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={removeVideo}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Upload progress for video */}
                                {videoUploadProgress > 0 && videoUploadProgress < 100 && isSubmitting && (
                                  <div className="mt-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                        style={{ width: `${videoUploadProgress}%` }}
                                      />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Uploading to Supabase... {videoUploadProgress}%</p>
                                  </div>
                                )}
                                
                                {videoUploadProgress === -1 && (
                                  <div className="mt-3 text-red-600 text-xs sm:text-sm">
                                    Upload failed. Please try again.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm sm:text-lg font-medium text-gray-900 mb-2">
                            Property Images (Optional)
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-4">
                            Upload high-quality images for different areas of your property. All files will be stored securely in Supabase.
                          </p>
                          <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-3 mb-4">
                            <p className="text-xs sm:text-sm text-amber-800">
                              <strong>Note:</strong> Images are optional, but if you start uploading for a category, you must complete it with the maximum allowed images.
                            </p>
                          </div>

                          <div className="space-y-4 sm:space-y-6">
                            {imageCategories.map(category => {
                              const currentCount = formData.images[category.name].length;
                              const isIncomplete = currentCount > 0 && currentCount < category.maxImages;
                              const uploadProgress = imageUploadProgress[category.name];

                              return (
                                <div
                                  key={category.name}
                                  className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all ${
                                    isIncomplete
                                      ? 'border-amber-400 bg-amber-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-1">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {category.label}
                                      {isIncomplete && (
                                        <span className="block sm:inline ml-0 sm:ml-2 text-xs text-amber-600">
                                          (Incomplete - {category.maxImages - currentCount} more required)
                                        </span>
                                      )}
                                    </h5>
                                    <span className={`text-xs sm:text-sm ${
                                      currentCount === category.maxImages
                                        ? 'text-green-600 font-medium'
                                        : 'text-gray-500'
                                    }`}>
                                      {currentCount}/{category.maxImages} images
                                      {currentCount === category.maxImages && ' ✓'}
                                    </span>
                                  </div>

                                  {/* Upload progress bar */}
                                  {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && isSubmitting && (
                                    <div className="mb-3">
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">Uploading {category.label} to Supabase... {uploadProgress}%</p>
                                    </div>
                                  )}
                                  
                                  {uploadProgress === -1 && (
                                    <div className="mb-3 text-red-600 text-xs">
                                      Upload failed for {category.label}. Please try again.
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                                    {formData.images[category.name].map((image, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={image.url}
                                          alt={`${category.label} ${index + 1}`}
                                          className="w-full h-20 sm:h-24 object-cover rounded-lg"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeImage(category.name, index)}
                                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}

                                    {formData.images[category.name].length < category.maxImages && (
                                      <button
                                        type="button"
                                        onClick={() => fileInputRefs.current[category.name]?.click()}
                                        className={`h-20 sm:h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
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

                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between z-10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                    disabled={currentStep === 1 || isSubmitting}
                    className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      currentStep === 1 || isSubmitting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      disabled={!isStepValid() || isSubmitting}
                      className={`inline-flex items-center px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        isStepValid() && !isSubmitting
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
                      disabled={!isStepValid() || isSubmitting}
                      className={`inline-flex items-center px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all ${
                        isStepValid() && !isSubmitting
                          ? 'bg-gradient-to-br from-[#083A85] to-[#0a4499] text-white hover:from-[#0a4499] hover:to-[#0c52b8] shadow-lg hover:shadow-xl cursor-pointer'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Creating...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Add Property</span>
                          <span className="sm:hidden">Add</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
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
              width: 4px;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default AddPropertyPage;