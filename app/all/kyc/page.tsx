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

interface PersonalDetails {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  phoneNumber: string;
  email: string;
  documentType: 'passport' | 'id' | 'both';
}

interface DocumentFile {
  file: File;
  url: string;
  name: string;
  uploaded?: boolean;
  uploadedUrl?: string;
}

interface KYCDocuments {
  passportPhoto: DocumentFile | null;
  idFront: DocumentFile | null;
  idBack: DocumentFile | null;
}

interface FormData {
  personalDetails: PersonalDetails;
  documents: KYCDocuments;
}

// Brevo Email Service
class BrevoEmailService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // You'll need to set your Brevo API key
    this.apiKey = process.env.NEXT_PUBLIC_BREVO_API_KEY || 'your-brevo-api-key';
    this.baseUrl = 'https://api.brevo.com/v3';
  }

  async sendEmail(templateId: number, to: Array<{email: string, name?: string}>, params: any) {
    try {
      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          templateId,
          to,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Brevo API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email via Brevo:', error);
      throw error;
    }
  }

  async sendKYCSubmissionEmails(formData: FormData, documentUrls: any, userId: string) {
    const userEmail = formData.personalDetails.email;
    const userName = formData.personalDetails.fullName;

    // Email to Admin
    await this.sendEmail(1, // Replace with your admin template ID
      [{ email: 'admin@amoriaglobal.com', name: 'Admin' }],
      {
        USER_NAME: userName,
        USER_EMAIL: userEmail,
        USER_PHONE: formData.personalDetails.phoneNumber,
        DOCUMENT_TYPE: formData.personalDetails.documentType.toUpperCase(),
        PASSPORT_URL: documentUrls.passport || 'N/A',
        ID_FRONT_URL: documentUrls.idFront || 'N/A',
        ID_BACK_URL: documentUrls.idBack || 'N/A',
        SUBMISSION_DATE: new Date().toLocaleDateString(),
        USER_ID: userId
      }
    );

    // Email to User
    await this.sendEmail(2, // Replace with your user template ID
      [{ email: userEmail, name: userName }],
      {
        USER_NAME: userName,
        DOCUMENT_TYPE: formData.personalDetails.documentType.toUpperCase(),
        SUBMISSION_DATE: new Date().toLocaleDateString(),
        TRACKING_ID: `KYC-${userId.slice(-8).toUpperCase()}`
      }
    );
  }
}

const KYCUploadPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  
  const isMountedRef = useRef<boolean>(true);
  const router = useRouter();
  const brevoService = new BrevoEmailService();
  
  const [formData, setFormData] = useState<FormData>({
    personalDetails: {
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      address: '',
      phoneNumber: '',
      email: '',
      documentType: 'passport'
    },
    documents: {
      passportPhoto: null,
      idFront: null,
      idBack: null
    }
  });

  const passportInputRef = useRef<HTMLInputElement | null>(null);
  const idFrontInputRef = useRef<HTMLInputElement | null>(null);
  const idBackInputRef = useRef<HTMLInputElement | null>(null);

  // Country list for nationality dropdown
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
    'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China', 'Colombia',
    'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Ghana',
    'India', 'Indonesia', 'Italy', 'Japan', 'Kenya', 'Malaysia',
    'Mexico', 'Netherlands', 'Nigeria', 'Norway', 'Pakistan', 'Philippines',
    'Poland', 'Portugal', 'Russia', 'Saudi Arabia', 'South Africa', 'Spain',
    'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Kingdom',
    'United States', 'Vietnam'
  ].sort();

  // Helper function to get tomorrow's date for min date validation
  const getEighteenYearsAgo = (): string => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    return eighteenYearsAgo.toISOString().split('T')[0];
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check user session on component mount
  useEffect(() => {
    checkUserSession();
  }, []);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up object URLs on unmount
      try {
        if (formData.documents.passportPhoto?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(formData.documents.passportPhoto.url);
        }
        if (formData.documents.idFront?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(formData.documents.idFront.url);
        }
        if (formData.documents.idBack?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(formData.documents.idBack.url);
        }
      } catch (error) {
        console.warn('Error cleaning up object URLs:', error);
      }
    };
  }, []);

  const checkUserSession = async () => {
    try {
      setIsLoadingUser(true);
      const response = await api.get('/auth/me');
      
      if (response.ok && response.data) {
        const user = response.data;
        setCurrentUser(user);
        
        // Pre-fill personal details with user information
        setFormData(prev => ({
          ...prev,
          personalDetails: {
            ...prev.personalDetails,
            fullName: user.names || '',
            email: user.email || '',
            phoneNumber: user.phone || '',
            address: user.address || ''
          }
        }));
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handlePersonalDetailsChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
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

  const handleDocumentUpload = (documentType: keyof KYCDocuments, file: File | null) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, WebP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Clean up previous object URL if it exists
    const existingDocument = formData.documents[documentType];
    if (existingDocument?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(existingDocument.url);
    }

    const newDocument: DocumentFile = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      uploaded: false
    };

    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: newDocument
      }
    }));
  };

  const removeDocument = (documentType: keyof KYCDocuments) => {
    const document = formData.documents[documentType];
    if (document?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(document.url);
    }
    
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [documentType]: null
      }
    }));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[documentType];
      return newProgress;
    });
  };

  const generateUniqueFileName = (file: File, documentType: string): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || '';
    const userId = currentUser?.id || 'unknown';
    
    return `kyc_${userId}_${documentType}_${timestamp}_${randomStr}.${fileExtension}`;
  };

  const uploadDocumentToStorage = async (
    file: File,
    documentType: string,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    try {
      if (onProgress) onProgress(10);
      
      const fileName = generateUniqueFileName(file, documentType);
      const folder = `kyc/${documentType}`;
      
      if (onProgress) onProgress(50);
      
      console.log('Uploading KYC document to Supabase:', {
        fileName,
        folder,
        fileSize: file.size,
        fileType: file.type
      });
      
      const uploadedUrl = await uploadDocumentToSupabase(file, fileName, folder);
      
      if (onProgress) onProgress(100);
      
      console.log('KYC document uploaded successfully:', uploadedUrl);
      return uploadedUrl;
    } catch (error) {
      console.error(`Error uploading KYC document (${documentType}):`, error);
      throw error;
    }
  };

  const processDocuments = async (): Promise<any> => {
    const uploadedUrls: any = {};
    
    // Upload passport photo if exists
    if (formData.documents.passportPhoto) {
      try {
        setUploadProgress(prev => ({ ...prev, passport: 0 }));
        uploadedUrls.passport = await uploadDocumentToStorage(
          formData.documents.passportPhoto.file,
          'passport',
          (progress) => setUploadProgress(prev => ({ ...prev, passport: progress }))
        );
      } catch (error) {
        console.error('Failed to upload passport photo:', error);
        setUploadProgress(prev => ({ ...prev, passport: -1 }));
        throw error;
      }
    }

    // Upload ID front if exists
    if (formData.documents.idFront) {
      try {
        setUploadProgress(prev => ({ ...prev, idFront: 0 }));
        uploadedUrls.idFront = await uploadDocumentToStorage(
          formData.documents.idFront.file,
          'id_front',
          (progress) => setUploadProgress(prev => ({ ...prev, idFront: progress }))
        );
      } catch (error) {
        console.error('Failed to upload ID front:', error);
        setUploadProgress(prev => ({ ...prev, idFront: -1 }));
        throw error;
      }
    }

    // Upload ID back if exists
    if (formData.documents.idBack) {
      try {
        setUploadProgress(prev => ({ ...prev, idBack: 0 }));
        uploadedUrls.idBack = await uploadDocumentToStorage(
          formData.documents.idBack.file,
          'id_back',
          (progress) => setUploadProgress(prev => ({ ...prev, idBack: progress }))
        );
      } catch (error) {
        console.error('Failed to upload ID back:', error);
        setUploadProgress(prev => ({ ...prev, idBack: -1 }));
        throw error;
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');
      setValidationErrors({});

      if (!currentUser) {
        throw new Error('User session not found. Please log in again.');
      }

      // Validate required documents based on document type
      const { documentType } = formData.personalDetails;
      
      if (documentType === 'passport' && !formData.documents.passportPhoto) {
        throw new Error('Passport photo is required for passport verification.');
      }
      
      if (documentType === 'id' && (!formData.documents.idFront || !formData.documents.idBack)) {
        throw new Error('Both front and back of ID are required for ID verification.');
      }
      
      if (documentType === 'both' && (!formData.documents.passportPhoto || !formData.documents.idFront || !formData.documents.idBack)) {
        throw new Error('Passport photo and both sides of ID are required for comprehensive verification.');
      }

      // Upload documents to Supabase
      const uploadedUrls = await processDocuments();

      // Send emails via Brevo
      await brevoService.sendKYCSubmissionEmails(formData, uploadedUrls, currentUser.id);

      setSubmitSuccess('KYC documents submitted successfully! You will receive a confirmation email shortly.');
      
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        // Redirect to dashboard or verification status page
        router.push('/all/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      setSubmitError(error.message || 'Failed to submit KYC documents. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    // Clean up object URLs
    if (formData.documents.passportPhoto?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.documents.passportPhoto.url);
    }
    if (formData.documents.idFront?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.documents.idFront.url);
    }
    if (formData.documents.idBack?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(formData.documents.idBack.url);
    }

    setFormData({
      personalDetails: {
        fullName: '',
        dateOfBirth: '',
        nationality: '',
        address: '',
        phoneNumber: '',
        email: '',
        documentType: 'passport'
      },
      documents: {
        passportPhoto: null,
        idFront: null,
        idBack: null
      }
    });
    setCurrentStep(1);
    setUploadProgress({});
    setSubmitError('');
    setSubmitSuccess('');
    setValidationErrors({});
  };

  const isStepValid = (): boolean => {
    if (currentStep === 1) {
      const { fullName, dateOfBirth, nationality, address, phoneNumber, email } = formData.personalDetails;
      return !!(
        fullName && fullName.trim().length >= 2 &&
        dateOfBirth &&
        nationality &&
        address && address.trim().length >= 10 &&
        phoneNumber && phoneNumber.trim().length >= 10 &&
        email && isValidEmail(email)
      );
    }
    
    if (currentStep === 2) {
      const { documentType } = formData.personalDetails;
      
      if (documentType === 'passport') {
        return !!formData.documents.passportPhoto;
      }
      if (documentType === 'id') {
        return !!(formData.documents.idFront && formData.documents.idBack);
      }
      if (documentType === 'both') {
        return !!(formData.documents.passportPhoto && formData.documents.idFront && formData.documents.idBack);
      }
    }
    
    return true;
  };

  const getStepLabel = (step: number): string => {
    switch(step) {
      case 1: return 'Personal Details';
      case 2: return 'Document Upload';
      default: return '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        <title>KYC Verification - Amoria Global</title>
      </head>
      <div className="min-h-screen bg-gray-50">
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
            <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
              <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">KYC Verification</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Step {currentStep} of 2 • Secure Document Upload</p>
                    {currentUser && (
                      <p className="text-xs sm:text-sm text-green-600 mt-1">✓ User: {currentUser.names || currentUser.email}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => {setIsModalOpen(false); router.push("/all/dashboard")}} 
                    className="cursor-pointer"
                  >
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
                
                {/* Mobile Stepper */}
                <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-4 sm:hidden">
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2].map((step) => (
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
                    {[1, 2].map((step) => (
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
                        {step < 2 && (
                          <div className={`flex-1 h-1 mx-1 sm:mx-2 transition-all self-start mt-4 sm:mt-5 ${
                            currentStep > step ? 'bg-gradient-to-r from-[#083A85] to-[#0a4499]' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 240px)' }}>
                  {/* Step 1: Personal Details */}
                  {currentStep === 1 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>KYC Verification:</strong> Please provide accurate information. This will be used to verify your identity and must match your official documents.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.personalDetails.fullName}
                          onChange={handlePersonalDetailsChange}
                          placeholder="Enter your full legal name"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.fullName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.fullName && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.personalDetails.dateOfBirth}
                          onChange={handlePersonalDetailsChange}
                          max={getEighteenYearsAgo()}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all ${
                            validationErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">You must be at least 18 years old</p>
                        {validationErrors.dateOfBirth && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.dateOfBirth}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Nationality <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="nationality"
                          value={formData.personalDetails.nationality}
                          onChange={handlePersonalDetailsChange}
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer ${
                            validationErrors.nationality ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select your nationality</option>
                          {countries.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                        {validationErrors.nationality && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.nationality}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Full Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.personalDetails.address}
                          onChange={handlePersonalDetailsChange}
                          placeholder="Street, City, State, Country, ZIP Code"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.address && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.personalDetails.phoneNumber}
                          onChange={handlePersonalDetailsChange}
                          placeholder="+1 (555) 123-4567"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.phoneNumber && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.personalDetails.email}
                          onChange={handlePersonalDetailsChange}
                          placeholder="your.email@example.com"
                          className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all placeholder:font-bold ${
                            validationErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                          Document Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="documentType"
                          value={formData.personalDetails.documentType}
                          onChange={handlePersonalDetailsChange}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none transition-all appearance-none bg-white cursor-pointer"
                        >
                          <option value="passport">Passport Only</option>
                          <option value="id">National ID Only</option>
                          <option value="both">Both Passport & ID</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Choose the documents you want to submit for verification
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Document Upload */}
                  {currentStep === 2 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
                          Upload Identity Documents
                        </h3>
                        
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-amber-800">Important Requirements:</p>
                              <ul className="text-sm text-amber-700 mt-1 space-y-1">
                                <li>• Documents must be clear and readable</li>
                                <li>• All corners of the document must be visible</li>
                                <li>• No shadows or glare on the document</li>
                                <li>• Maximum file size: 10MB per document</li>
                                <li>• Supported formats: JPEG, PNG, WebP</li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Passport Upload */}
                        {(formData.personalDetails.documentType === 'passport' || formData.personalDetails.documentType === 'both') && (
                          <div className={`border-2 rounded-lg p-4 sm:p-6 transition-all mb-6 ${
                            formData.documents.passportPhoto ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                              <h4 className="text-sm sm:text-lg font-medium text-gray-900">
                                Passport Photo Page
                                <span className="ml-2 text-xs sm:text-sm text-red-600">*Required</span>
                              </h4>
                              {formData.documents.passportPhoto && (
                                <span className="text-xs sm:text-sm text-green-600 font-medium">✓ Ready</span>
                              )}
                            </div>

                            {!formData.documents.passportPhoto ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => passportInputRef.current?.click()}
                                  className="w-full py-6 sm:py-8 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-100 transition-all cursor-pointer"
                                >
                                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm font-medium text-gray-700">Upload Passport Photo Page</span>
                                  <span className="text-xs sm:text-sm text-gray-500 mt-1">JPEG, PNG, WebP (Max 10MB)</span>
                                </button>
                                <input
                                  ref={passportInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleDocumentUpload('passportPhoto', e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <div className="w-16 h-12 sm:w-20 sm:h-16 rounded-lg overflow-hidden border border-gray-200">
                                      <img
                                        src={formData.documents.passportPhoto.url}
                                        alt="Passport"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                        {formData.documents.passportPhoto.name}
                                      </p>
                                      <p className="text-xs sm:text-sm text-gray-500">
                                        {formatFileSize(formData.documents.passportPhoto.file.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeDocument('passportPhoto')}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Upload progress */}
                                {uploadProgress.passport !== undefined && uploadProgress.passport > 0 && uploadProgress.passport < 100 && isSubmitting && (
                                  <div className="mt-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                        style={{ width: `${uploadProgress.passport}%` }}
                                      />
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Uploading... {uploadProgress.passport}%</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ID Upload */}
                        {(formData.personalDetails.documentType === 'id' || formData.personalDetails.documentType === 'both') && (
                          <div className="space-y-4">
                            {/* ID Front */}
                            <div className={`border-2 rounded-lg p-4 sm:p-6 transition-all ${
                              formData.documents.idFront ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                <h4 className="text-sm sm:text-lg font-medium text-gray-900">
                                  National ID - Front Side
                                  <span className="ml-2 text-xs sm:text-sm text-red-600">*Required</span>
                                </h4>
                                {formData.documents.idFront && (
                                  <span className="text-xs sm:text-sm text-green-600 font-medium">✓ Ready</span>
                                )}
                              </div>

                              {!formData.documents.idFront ? (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => idFrontInputRef.current?.click()}
                                    className="w-full py-6 sm:py-8 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-100 transition-all cursor-pointer"
                                  >
                                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">Upload ID Front Side</span>
                                    <span className="text-xs sm:text-sm text-gray-500 mt-1">JPEG, PNG, WebP (Max 10MB)</span>
                                  </button>
                                  <input
                                    ref={idFrontInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDocumentUpload('idFront', e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-3 sm:p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                      <div className="w-16 h-12 sm:w-20 sm:h-16 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                          src={formData.documents.idFront.url}
                                          alt="ID Front"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                          {formData.documents.idFront.name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                          {formatFileSize(formData.documents.idFront.file.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument('idFront')}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  {/* Upload progress */}
                                  {uploadProgress.idFront !== undefined && uploadProgress.idFront > 0 && uploadProgress.idFront < 100 && isSubmitting && (
                                    <div className="mt-3">
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                          style={{ width: `${uploadProgress.idFront}%` }}
                                        />
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Uploading... {uploadProgress.idFront}%</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* ID Back */}
                            <div className={`border-2 rounded-lg p-4 sm:p-6 transition-all ${
                              formData.documents.idBack ? 'border-green-400 bg-green-50' : 'border-orange-400 bg-orange-50'
                            }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                <h4 className="text-sm sm:text-lg font-medium text-gray-900">
                                  National ID - Back Side
                                  <span className="ml-2 text-xs sm:text-sm text-red-600">*Required</span>
                                </h4>
                                {formData.documents.idBack && (
                                  <span className="text-xs sm:text-sm text-green-600 font-medium">✓ Ready</span>
                                )}
                              </div>

                              {!formData.documents.idBack ? (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => idBackInputRef.current?.click()}
                                    className="w-full py-6 sm:py-8 border-2 border-dashed border-orange-300 rounded-lg flex flex-col items-center justify-center hover:border-orange-400 hover:bg-orange-100 transition-all cursor-pointer"
                                  >
                                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">Upload ID Back Side</span>
                                    <span className="text-xs sm:text-sm text-gray-500 mt-1">JPEG, PNG, WebP (Max 10MB)</span>
                                  </button>
                                  <input
                                    ref={idBackInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleDocumentUpload('idBack', e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg p-3 sm:p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                      <div className="w-16 h-12 sm:w-20 sm:h-16 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                          src={formData.documents.idBack.url}
                                          alt="ID Back"
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                          {formData.documents.idBack.name}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                          {formatFileSize(formData.documents.idBack.file.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeDocument('idBack')}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  {/* Upload progress */}
                                  {uploadProgress.idBack !== undefined && uploadProgress.idBack > 0 && uploadProgress.idBack < 100 && isSubmitting && (
                                    <div className="mt-3">
                                      <div className="bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-gradient-to-r from-[#083A85] to-[#0a4499] h-2 rounded-full transition-all"
                                          style={{ width: `${uploadProgress.idBack}%` }}
                                        />
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Uploading... {uploadProgress.idBack}%</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Navigation */}
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

                  {currentStep < 2 ? (
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
                          <span className="hidden sm:inline">Submitting...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="hidden sm:inline">Submit KYC</span>
                          <span className="sm:hidden">Submit</span>
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

export default KYCUploadPage;