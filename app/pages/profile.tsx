"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/app/api/apiService";

// --- INTERFACES ---

interface UserInfo {
  id: number;
  profile: string;
  name: string;
  email: string;
  status?: string;
  userType?: string;
  phone?: string;
  phoneCountryCode?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_sessions?: number;

  // Dynamic Address Fields
  street?: string;
  city?: string;
  state?: string;
  province?: string;
  district?: string;
  zipCode?: string;
  postalCode?: string;
  postcode?: string;
  pinCode?: string;
  cep?: string;
  county?: string;
  region?: string;
  prefecture?: string;
  village?: string;
  island?: string;
  parish?: string;
  blockNumber?: string;
  dzongkhag?: string;
  department?: string;
  atoll?: string;
  'flat/floor/block'?: string;
  buildingName?: string;
  eircode?: string;
  town?: string;
  building?: string;
  governorate?: string;
  'oblast/krai/republic'?: string;
  quarter?: string;
  zone?: string;
  'sub-district'?: string;
  suco?: string;
  administrativePost?: string;
  municipality?: string;
  ward?: string;
  township?: string;
  'state/region'?: string;
  hamlet?: string;
  suburb?: string;
  emirate?: string;
  kingdom?: string;
}

interface CountryInfo {
  name: string;
  flag: string;
  code: string;
  addressFields: string[];
  states?: string[];
  provinces?: string[];
}

// --- COUNTRY DATA (CONDENSED) ---

const countryData: Record<string, CountryInfo> = {
  US: { name: 'United States', flag: '🇺🇸', code: '+1', addressFields: ['street', 'city', 'state', 'zipCode'], states: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'] },
  CA: { name: 'Canada', flag: '🇨🇦', code: '+1', addressFields: ['street', 'city', 'province', 'postalCode'], provinces: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'] },
  GB: { name: 'United Kingdom', flag: '🇬🇧', code: '+44', addressFields: ['street', 'city', 'county', 'postcode'] },
  FR: { name: 'France', flag: '🇫🇷', code: '+33', addressFields: ['street', 'city', 'region', 'postalCode'] },
  DE: { name: 'Germany', flag: '🇩🇪', code: '+49', addressFields: ['street', 'city', 'state', 'postalCode'] },
  IN: { name: 'India', flag: '🇮🇳', code: '+91', addressFields: ['street', 'city', 'state', 'district', 'pinCode'], states: ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'] },
  AU: { name: 'Australia', flag: '🇦🇺', code: '+61', addressFields: ['street', 'city', 'state', 'postcode'], states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'] },
  JP: { name: 'Japan', flag: '🇯🇵', code: '+81', addressFields: ['street', 'city', 'prefecture', 'postalCode'] },
  CN: { name: 'China', flag: '🇨🇳', code: '+86', addressFields: ['street', 'district', 'city', 'province', 'postalCode'] },
  BR: { name: 'Brazil', flag: '🇧🇷', code: '+55', addressFields: ['street', 'city', 'state', 'cep'] },
  MX: { name: 'Mexico', flag: '🇲🇽', code: '+52', addressFields: ['street', 'city', 'state', 'postalCode'] },
  RW: { name: 'Rwanda', flag: '🇷🇼', code: '+250', addressFields: ['street', 'district', 'province', 'city'], provinces: ['Kigali City', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'] },
  // Add more countries as needed...
};

// --- REUSABLE SEARCHABLE DROPDOWN COMPONENT ---
interface SearchableDropdownProps {
  options: { value: string; label: string; }[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}

const SearchableDropdown = ({ options, value, onChange, disabled, placeholder = "Select..." }: SearchableDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center transition-colors ${
          disabled
            ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
            : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer hover:border-gray-400'
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-4 h-4 text-gray-400 transform transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
              >
                {option.label}
              </li>
            )) : <li className="px-3 py-2 text-sm text-gray-500">No results found</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function UserProfileSettingsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [originalUser, setOriginalUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token: any = localStorage.getItem('authToken');
        api.setAuth(token)
        const response = await api.get('auth/me');
        
        if (response.data) {
          setUser(response.data);
          setOriginalUser(response.data);
          
          // Set postal code from appropriate field
          const currentCountry = countryData[response.data.country];
          if (currentCountry) {
            const postalField = getPostalCodeFieldName(currentCountry);
            if (postalField && response.data[postalField as keyof UserInfo]) {
              setPostalCode(response.data[postalField as keyof UserInfo] as string);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch user data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load user profile');
        
        // If unauthorized, handle logout
        if (err.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle logout (similar to your example)
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
    window.location.href = 'https://jambolush.com/all/login?redirect=' + encodeURIComponent(window.location.href);
  };

  // --- HELPER FUNCTIONS ---

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'inactive': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getUserTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'host': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'field agent': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatPhoneNumber = (phone: string, countryCodeKey: string) => {
    const country = countryData[countryCodeKey as keyof typeof countryData];
    if (!country || !phone) return phone;
    
    let formatted = phone;
    if (countryCodeKey === 'US' || countryCodeKey === 'CA') {
      if (phone.length === 10) formatted = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
    } else if (phone.length > 6) {
      formatted = `${phone.slice(0,3)} ${phone.slice(3,6)} ${phone.slice(6)}`;
    }
    return `${country.flag} ${country.code} ${formatted}`;
  };

  const getFullAddress = () => {
    if (!user || !user.country) return '';
    const countryInfo = countryData[user.country];
    if (!countryInfo) return 'No address data';

    const addressParts = countryInfo.addressFields
        .map(field => {
            if (getPostalCodeFieldName(countryInfo) === field) {
                return postalCode;
            }
            return user[field as keyof UserInfo];
        })
        .filter(Boolean);
    
    if (countryData[user.country]) {
        addressParts.push(countryData[user.country].name);
    }
    return addressParts.join(', ');
  };
  
  const getPostalCodeFieldName = (country: CountryInfo | undefined) => 
    country?.addressFields.find(f => f.toLowerCase().includes('code') || f.toLowerCase().includes('cep'));
  
  const getPostalCodeLabel = (country: CountryInfo | undefined) => {
    const field = getPostalCodeFieldName(country);
    if (!field) return "Postal Code";
    switch(field) {
      case 'zipCode': return 'ZIP Code'; 
      case 'postalCode': return 'Postal Code'; 
      case 'postcode': return 'Postcode';
      case 'pinCode': return 'PIN Code'; 
      case 'eircode': return 'Eircode'; 
      case 'cep': return 'CEP';
      default: return "Postal Code";
    }
  };

  // --- EVENT HANDLERS ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveMessage({ type: 'error', text: 'Please select a valid image file' });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !user) return;
    
    try {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('profile', selectedFile);
      
      const response = await api.put('auth/me/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        setUser({ ...user, profile: response.data.profile, updated_at: new Date().toISOString() });
        setUploadSuccess('Profile image uploaded successfully!');
        setSelectedFile(null);
        setPreviewUrl(null);
        setTimeout(() => setUploadSuccess(null), 3000);
      }
    } catch (error: any) {
      console.error('Image upload failed:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to upload image' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // Prepare data for API
      const updateData = {
        name: user.name,
        phone: user.phone,
        phoneCountryCode: user.phoneCountryCode,
        country: user.country,
        street: user.street,
        city: user.city,
        state: user.state,
        province: user.province,
        district: user.district,
        county: user.county,
        region: user.region,
        // Add postal code to appropriate field
        ...(postalCode && { [getPostalCodeFieldName(countryData[user.country!]) || 'postalCode']: postalCode })
      };

      // Remove undefined/empty values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined || updateData[key as keyof typeof updateData] === '') {
          delete updateData[key as keyof typeof updateData];
        }
      });

      const response = await api.put('auth/me', updateData);
      
      if (response.data) {
        setUser({ ...response.data, updated_at: new Date().toISOString() });
        setOriginalUser({ ...response.data, updated_at: new Date().toISOString() });
        setIsEditing(false);
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Profile update failed:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCountryChange = (newCountryCode: string) => {
    if (!user) return;
    const newCountryInfo = countryData[newCountryCode];
    const oldCountryInfo = user.country ? countryData[user.country] : undefined;
    
    const updatedUser: UserInfo = { ...user, country: newCountryCode };

    // Clear old address fields that don't exist in new country
    if (oldCountryInfo) {
      oldCountryInfo.addressFields.forEach(field => {
        if (!newCountryInfo.addressFields.includes(field)) {
          delete (updatedUser as any)[field];
        }
      });
    }
    
    // Reset postal code if field name changes
    const newPostalField = getPostalCodeFieldName(newCountryInfo);
    if (!newPostalField) {
        setPostalCode('');
    } else {
        const oldPostalField = getPostalCodeFieldName(oldCountryInfo);
        if (newPostalField !== oldPostalField) {
          setPostalCode('');
        }
    }
    
    // Initialize new address fields
    newCountryInfo.addressFields.forEach(field => {
      if (!(field in updatedUser)) {
        (updatedUser as any)[field] = '';
      }
    });
    
    setUser(updatedUser);
  };

  const handleFieldChange = (field: keyof UserInfo, value: string) => {
    if (user) setUser({ ...user, [field]: value });
  };

  const handleCancelEdit = () => {
    if (originalUser) {
      setUser(originalUser);
      const currentCountry = countryData[originalUser.country!];
      if (currentCountry) {
        const postalField = getPostalCodeFieldName(currentCountry);
        if (postalField && originalUser[postalField as keyof UserInfo]) {
          setPostalCode(originalUser[postalField as keyof UserInfo] as string);
        }
      }
    }
    setIsEditing(false);
    setSaveMessage(null);
  };

  const countryOptions = Object.entries(countryData)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([code, data]) => ({ value: code, label: `${data.flag} ${data.name}` }));

  const phoneCountryOptions = Object.entries(countryData)
    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
    .map(([code, data]) => ({ value: code, label: `${data.flag} ${data.code}` }));

  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full"></div>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Please wait while we fetch your information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;
  
  const currentCountry: CountryInfo | undefined = user.country ? countryData[user.country] : undefined;
  const postalCodeLabel = getPostalCodeLabel(currentCountry);
  const postalCodeField = getPostalCodeFieldName(currentCountry);

  return (
    <div className="pt-20">
      <div className="">
        
        {/* Alert Messages */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
                {saveMessage.type === 'success' ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                )}
              </svg>
              {saveMessage.text}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
                <h3 className="text-white text-lg font-semibold mb-4">Profile Image</h3>
                <div className="relative mb-4">
                  {previewUrl || user.profile ? (
                    <img 
                      src={previewUrl || user.profile} 
                      alt={user.name} 
                      className="w-24 h-24 rounded-full mx-auto border-4 border-white/30 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-white/20 rounded-full mx-auto border-4 border-white/30 shadow-lg flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{getInitials(user.name)}</span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {isEditing && (
                  <div className="space-y-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                      className="hidden" 
                      id="image-upload" 
                    />
                    <label 
                      htmlFor="image-upload" 
                      className="block bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      Choose Image
                    </label>
                    {selectedFile && (
                      <div className="space-y-2">
                        <p className="text-white/80 text-sm truncate px-2">{selectedFile.name}</p>
                        <button 
                          onClick={handleImageUpload}
                          disabled={isSaving}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center w-full"
                        >
                          {isSaving ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                            </svg>
                          )}
                          {isSaving ? 'Uploading...' : 'Upload Image'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {uploadSuccess && (
                  <div className="mt-3 bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-2 rounded-lg text-sm">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {uploadSuccess}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
                  <p className="text-gray-500 mb-4">ID: USER-{user.id.toString().padStart(6, '0')}</p>
                  <div className="flex items-center justify-center flex-wrap gap-2">
                    <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status || '')}`}>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      {user.status?.charAt(0).toUpperCase()}{user.status?.slice(1)} Status
                    </div>
                    <div className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm font-medium ${getUserTypeColor(user.userType || '')}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {user.userType === 'field agent' ? 'Field Agent' : (user.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'User')}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm break-all">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      <span className="text-sm">{formatPhoneNumber(user.phone, user.phoneCountryCode || 'US')}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-gray-600">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="text-sm">{getFullAddress() || 'No address provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Profile Information</h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                      </svg>
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Basic Information</h4>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
                    <input 
                      type="text" 
                      value={user.name || ''} 
                      onChange={(e) => handleFieldChange('name', e.target.value)} 
                      disabled={!isEditing} 
                      className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                        isEditing 
                          ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                      }`} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">User ID</label>
                    <input 
                      type="text" 
                      value={`USER-${user.id.toString().padStart(6, '0')}`} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
                    <input 
                      type="email" 
                      value={user.email || ''} 
                      disabled 
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                    <div className="flex gap-3">
                      <div className="w-32 flex-shrink-0">
                        <SearchableDropdown 
                          options={phoneCountryOptions} 
                          value={user.phoneCountryCode || ''} 
                          onChange={(value) => handleFieldChange('phoneCountryCode', value)} 
                          disabled={!isEditing}
                          placeholder="Country"
                        />
                      </div>
                      <input 
                        type="tel" 
                        value={user.phone || ''} 
                        onChange={(e) => handleFieldChange('phone', e.target.value)} 
                        disabled={!isEditing} 
                        placeholder="Phone number" 
                        className={`flex-1 border rounded-lg px-3 py-2 transition-colors ${
                          isEditing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Address Information</h4>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2">Country</label>
                    <SearchableDropdown 
                      options={countryOptions} 
                      value={user.country || ''} 
                      onChange={handleCountryChange} 
                      disabled={!isEditing}
                      placeholder="Select country"
                    />
                  </div>

                  {currentCountry?.addressFields.filter(f => !postalCodeField || f !== postalCodeField).map(field => {
                    const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    
                    if (field === 'state' && currentCountry.states) {
                      return (
                        <div key={field}>
                          <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                          <select 
                            value={user.state || ''} 
                            onChange={(e) => handleFieldChange('state', e.target.value)} 
                            disabled={!isEditing} 
                            className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                              isEditing 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <option value="">Select {label}</option>
                            {currentCountry.states.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    if (field === 'province' && currentCountry.provinces) {
                      return (
                        <div key={field}>
                          <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                          <select 
                            value={user.province || ''} 
                            onChange={(e) => handleFieldChange('province', e.target.value)} 
                            disabled={!isEditing} 
                            className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                              isEditing 
                                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            <option value="">Select {label}</option>
                            {currentCountry.provinces.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={field}>
                        <label className="block text-gray-700 font-semibold mb-2">{label}</label>
                        <input 
                          type="text" 
                          value={user[field as keyof UserInfo] as string || ''} 
                          onChange={(e) => handleFieldChange(field as keyof UserInfo, e.target.value)} 
                          disabled={!isEditing} 
                          placeholder={`Enter ${label.toLowerCase()}`} 
                          className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                            isEditing 
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                          }`} 
                        />
                      </div>
                    );
                  })}
                  
                  {postalCodeField && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">{postalCodeLabel}</label>
                      <input 
                        type="text" 
                        value={postalCode} 
                        onChange={(e) => setPostalCode(e.target.value)} 
                        disabled={!isEditing} 
                        placeholder={`Enter ${postalCodeLabel.toLowerCase()}`} 
                        className={`w-full border rounded-lg px-3 py-2 transition-colors ${
                          isEditing 
                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  )}

                  {/* Account Settings */}
                  <div className="md:col-span-2">
                    <h4 className="text-gray-700 font-bold mb-4 border-b pb-2">Account Settings</h4>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Profile Status</label>
                    <select 
                      value={user.status || 'active'} 
                      disabled 
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">User Type</label>
                    <select 
                      value={user.userType || 'host'} 
                      disabled 
                      className="w-full border rounded-lg px-3 py-2 transition-colors bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                    >
                      <option value="host">Host</option>
                      <option value="field agent">Field Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Activity */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <h3 className="text-lg font-bold text-white">Profile Activity</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Profile Created</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Last Updated</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Security Status</h4>
                        <p className="text-gray-600 text-sm">Account Verified</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-gray-900 font-semibold">Last Login</h4>
                        <p className="text-gray-600 text-sm truncate">{formatDate(user.last_login || user.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{user.total_sessions || 0}</div>
                      <div className="text-gray-600 text-sm">Total Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-gray-600 text-sm">Days Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}