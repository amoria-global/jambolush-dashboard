"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/app/api/apiService';
import { useRouter } from 'next/navigation';
import PhotoViewerModal from '@/app/components/photo-viewers';
import { encodeId, createViewDetailsUrl } from '@/app/utils/encoder';

// Types
interface Property {
    id: string;
    name: string;
    title?: string; // For backward compatibility
    price: number;
    pricePerNight: number;
    pricePerTwoNights: number;
    location: string;
    agentId?: string;
    agentName?: string;
    status: 'active' | 'pending' | 'checkedin' | 'checkedout' | 'inactive';
    propertyType?: 'House' | 'Apartment' | 'Villa' | 'Condo';
    type: string;
    category: string;
    bedrooms?: number;
    beds: number;
    bathrooms?: number;
    baths: number;
    maxGuests: number;
    area?: number;
    dateListed?: Date;
    createdAt: Date;
    availableFrom: Date;
    availableTo: Date;
    clientName?: string;
    clientId?: string;
    image?: string;
    images: any;
    video3D?: string;
    unavailableUntil?: string;
    description?: string;
    features: string[];
    ownerDetails?: any;
    host?: any;
    reviews?: any[];
    bookings?: any[];
    rating?: number;
    reviewsCount?: number;
}

interface DashboardStats {
    total: number;
    active: number;
    pending: number;
    checkedIn: number;
    checkedOut: number;
    inactive: number;
    totalRevenue?: number;
    avgRating?: number;
    occupancyRate?: number;
}

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'price' | 'createdAt' | 'area' | 'rating';
type SortOrder = 'asc' | 'desc';

const KYCPendingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
            <i className="bi bi-hourglass-split text-2xl text-yellow-600"></i>
          </div>
          <h3 className="text-xl font-semibold text-center text-gray-900 mb-3">
            KYC Verification Pending
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Your account verification is currently being processed. Please wait for verification to complete before performing this action. This process typically takes 2-4 hours.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#083A85]/80 transition-colors font-medium cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HostPropertiesPage: React.FC = () => {
    // Date formatting helper
    const format = (date: Date | string, formatStr: string) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const d = new Date(date);
        const year = d.getFullYear();
        const month = d.getMonth();
        const day = d.getDate();

        switch (formatStr) {
            case 'MMM dd, yyyy':
                return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
            default:
                return `${months[month]} ${day}, ${year}`;
        }
    };

    // States
    const [properties, setProperties] = useState<Property[]>([]);
    const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
    const [summaryStats, setSummaryStats] = useState<DashboardStats>({
        total: 0,
        active: 0,
        pending: 0,
        checkedIn: 0,
        checkedOut: 0,
        inactive: 0,
        totalRevenue: 0,
        avgRating: 0,
        occupancyRate: 0
    });
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPhotoViewer, setShowPhotoViewer] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [goToPageInput, setGoToPageInput] = useState('');
    const [error, setError] = useState<string>('');
    const [user, setUser] = useState<any>(null);
    const [showKYCModal, setShowKYCModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [unavailableDate, setUnavailableDate] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Sort states
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const router = useRouter();

    // Helper function to get cookie value
    const getCookieValue = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    };

    const checkKYCStatus = (): boolean => {
        if (!user || !user.kycCompleted || user.kycStatus !== 'approved') {
            setShowKYCModal(true);
            return false;
        }
        return true;
    };

    const handleAddPropertyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!checkKYCStatus()) return;
        router.push('/all/host/add-property');
    };

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || getCookieValue('authToken');
            if (token) {
                api.setAuth(token);
                const response = await api.get('/auth/me');
                if (response.data) {
                    setUser(response.data);
                    setIsAuthenticated(true);
                } else {
                    setError('Please log in to view your properties.');
                }
            } else {
                setError('Please log in to view your properties.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Authentication error. Please log in again.');
        } finally {
            setLoading(false);
        }
    };

    // Authentication and user fetch
    useEffect(() => {
        fetchUserData();
    }, []);

    // Extract main image from images object
    const getMainImage = (property: Property): string => {
        const fallbackImage = `https://picsum.photos/seed/${property.id}/600/400`;
        
        if (property.images) {
            // Try to get from exterior first, then other categories
            const imageSources = [
                property.images.exterior,
                property.images.livingRoom,
                property.images.bedroom,
                property.images.kitchen
            ].filter(Boolean);

            for (const source of imageSources) {
                if (Array.isArray(source) && source.length > 0) {
                    return source[0];
                }
            }
        }

        return property.image || fallbackImage;
    };

    // Get all images from property
    const getAllImages = (property: Property): string[] => {
        const allImages: string[] = [];
        
        if (property.images) {
            const imageCategories = [
                'exterior', 'livingRoom', 'bedroom', 'kitchen',
                'bathroom', 'diningArea', 'workspace', 'balcony',
                'laundryArea', 'gym', 'childrenPlayroom'
            ];

            imageCategories.forEach(category => {
                if (property.images[category] && Array.isArray(property.images[category])) {
                    allImages.push(...property.images[category]);
                }
            });
        }

        return allImages.length > 0 ? allImages : [getMainImage(property)];
    };

    // Data fetching with manual stats calculation from properties
    useEffect(() => {
        const fetchData = async () => {
            if (!isAuthenticated) return;

            try {
                setLoading(true);
                setError('');

                const [dashboardResponse, propertiesResponse] = await Promise.all([
                    api.get('/properties/host/dashboard'),
                    api.get('/properties/host/my-properties')
                ]);
                
                if (dashboardResponse.ok && propertiesResponse.ok) {
                    const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
                    const propertiesData = propertiesResponse.data.data || propertiesResponse.data;
                    const allPropertiesArray = Array.isArray(propertiesData) ? propertiesData : [];

                    // Calculate stats manually from properties
                    let totalRevenue = 0;
                    let totalRating = 0;
                    let ratedProperties = 0;
                    let occupiedDays = 0;
                    let totalDays = 0;
                    
                    // Count properties by status
                    let activeCount = 0;
                    let pendingCount = dashboardData.pendingReviews || 0;
                    let checkedInCount = Array.isArray(dashboardData.upcomingCheckIns) ? dashboardData.upcomingCheckIns.length : dashboardData.upcomingCheckIns || 0;
                    let checkedOutCount = Array.isArray(dashboardData.recentBookings) ? dashboardData.recentBookings.length : dashboardData.recentBookings || 0;
                    let inactiveCount = 0;

                    const processedProperties = allPropertiesArray.map((property: any) => {
                        // Count by status
                        switch (property.status) {
                            case 'active':
                                activeCount++;
                                break;
                            case 'inactive':
                                inactiveCount++;
                                break;
                        }

                        // Calculate revenue
                        const propertyRevenue = (property.pricePerNight || 0) * (property.bookings?.length || 0) * 2;
                        totalRevenue += propertyRevenue;

                        // Calculate ratings
                        const propertyRating = parseFloat(property.rating) || 0;
                        if (propertyRating > 0) {
                            totalRating += propertyRating;
                            ratedProperties++;
                        } else {
                            // Fallback random rating like agent
                            property.rating = parseFloat((Math.random() * 2 + 3).toFixed(1));
                            totalRating += property.rating;
                            ratedProperties++;
                        }

                        // Calculate occupancy
                        if (property.bookings && property.bookings.length > 0) {
                            occupiedDays += property.bookings.length * 2;
                        }
                        totalDays += 30; // Assuming 30 days period per property

                        return {
                            ...property,
                            title: property.name, // For backward compatibility
                            price: property.pricePerNight || property.pricePerTwoNights || property.price || 0,
                            propertyType: property.type,
                            bedrooms: property.beds || property.bedrooms,
                            bathrooms: property.baths || property.bathrooms,
                            area: property.area || Math.floor(Math.random() * 2000) + 500,
                            dateListed: new Date(property.createdAt),
                            reviewsCount: property.reviews?.length || Math.floor(Math.random() * 50),
                            features: Array.isArray(property.features) ? property.features : 
                                typeof property.features === 'string' ? 
                                (property.features.startsWith('[') ? JSON.parse(property.features) : [property.features]) : 
                                []
                        };
                    });

                    // Set calculated stats
                    const stats: DashboardStats = {
                        total: dashboardData.totalProperties || allPropertiesArray.length,
                        active: dashboardData.activeProperties || activeCount,
                        pending: pendingCount,
                        checkedIn: checkedInCount,
                        checkedOut: checkedOutCount,
                        inactive: inactiveCount,
                        totalRevenue: totalRevenue,
                        avgRating: ratedProperties > 0 ? parseFloat((totalRating / ratedProperties).toFixed(1)) : 0,
                        occupancyRate: totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0
                    };
                    setSummaryStats(stats);

                    setProperties(processedProperties);
                } else {
                    throw new Error(
                        (dashboardResponse.data as any)?.message ||
                        (propertiesResponse.data as any)?.message ||
                        'Failed to fetch data'
                    );
                }
            } catch (error: any) {
                console.error('Error fetching properties:', error);
                setError(error.message || 'Failed to load properties. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // Update goToPageInput when currentPage changes
    useEffect(() => {
        setGoToPageInput(currentPage.toString());
    }, [currentPage]);

    // Enhanced filter and sort logic
    useEffect(() => {
        let filtered = [...properties];

        if (searchTerm) {
            filtered = filtered.filter(p =>
                (p.name || p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type === typeFilter || p.propertyType === typeFilter);
        }

        if (priceRangeFilter !== 'all') {
            const [min, max] = priceRangeFilter.split('-').map(Number);
            filtered = filtered.filter(p => p.price >= min && (max ? p.price <= max : true));
        }

        if (ratingFilter !== 'all') {
            const minRating = parseFloat(ratingFilter);
            filtered = filtered.filter(p => (p.rating || 0) >= minRating);
        }

        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = (a.name || a.title || '').localeCompare(b.name || b.title || '');
                    break;
                case 'price':
                    comparison = a.price - b.price;
                    break;
                case 'area':
                    comparison = (a.area || 0) - (b.area || 0);
                    break;
                case 'rating':
                    comparison = (a.rating || 0) - (b.rating || 0);
                    break;
                case 'createdAt':
                    comparison = new Date(a.dateListed || a.createdAt).getTime() - new Date(b.dateListed || b.createdAt).getTime();
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredProperties(filtered);
        setCurrentPage(1);
    }, [properties, searchTerm, statusFilter, typeFilter, priceRangeFilter, ratingFilter, sortField, sortOrder]);

    // Pagination
    const paginatedProperties = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProperties.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProperties, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

    // Handlers
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleViewDetails = (property: Property) => {
        if (!checkKYCStatus()) return;
        const url = createViewDetailsUrl(property.id, 'property');
        router.push(url);
    };

    const handleOpenPhotoViewer = (property: Property, photoIndex: number = 0) => {
        setSelectedProperty(property);
        setSelectedPhotoIndex(photoIndex);
        setShowPhotoViewer(true);
    };

    const handleEdit = (property: Property) => {
        if (!checkKYCStatus()) return;
        setEditingProperty(property);
        setUnavailableDate(property.unavailableUntil || '');
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingProperty(null);
        setUnavailableDate('');
    };

    const handleSaveEdit = async () => {
        if (!editingProperty) return;
        
        try {
            const updateData: any = {};
            
            if (unavailableDate) {
                updateData.unavailableUntil = unavailableDate;
            }

            const response = await api.put(`/properties/${editingProperty.id}`, updateData);
            
            if (response.data.success) {
                setProperties(prev => prev.map(p => 
                    p.id === editingProperty.id 
                        ? { ...p, unavailableUntil: unavailableDate }
                        : p
                ));
                handleCloseEditModal();
            } else {
                throw new Error(response.data.message || 'Failed to update property');
            }
        } catch (error: any) {
            console.error('Error updating property:', error);
            alert(error.message || 'Failed to update property. Please try again.');
        }
    };

    const handleGoToPage = (value: string) => {
        const page = parseInt(value);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
        setGoToPageInput(currentPage.toString());
    };

    // UI Helpers
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'checkedin': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'checkedout': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'inactive': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return 'bi-check-circle-fill';
            case 'pending': return 'bi-clock-fill';
            case 'checkedin': return 'bi-door-open-fill';
            case 'checkedout': return 'bi-door-closed-fill';
            case 'inactive': return 'bi-x-circle-fill';
            default: return 'bi-circle-fill';
        }
    };

    // Property Detail Modal Component
    const PropertyDetailModal = () => {
        if (!selectedProperty) return null;

        const images = getAllImages(selectedProperty);
        const encodedId = encodeId(selectedProperty.id);

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                        <h2 className="text-2xl font-semibold">{selectedProperty.name}</h2>
                        <button 
                            onClick={() => setShowDetailModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <i className="bi bi-x-lg text-xl"></i>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Photo Grid */}
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden mb-8">
                            <div 
                                className="col-span-2 row-span-2 relative cursor-pointer group"
                                onClick={() => handleOpenPhotoViewer(selectedProperty, 0)}
                            >
                                <img
                                    src={images[0]}
                                    alt="Main view"
                                    className="w-full h-full object-cover group-hover:brightness-95 transition"
                                />
                            </div>
                            {images.slice(1, 5).map((img, idx) => (
                                <div 
                                    key={idx}
                                    className="relative cursor-pointer group"
                                    onClick={() => handleOpenPhotoViewer(selectedProperty, idx + 1)}
                                >
                                    <img
                                        src={img}
                                        alt={`View ${idx + 2}`}
                                        className="w-full h-full object-cover group-hover:brightness-95 transition"
                                    />
                                    {idx === 3 && images.length > 5 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-medium">+{images.length - 5} more</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Property Info Grid */}
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h3 className="font-semibold mb-4 text-lg">Property Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Type</span>
                                        <span className="font-medium">{selectedProperty.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Location</span>
                                        <span className="font-medium">{selectedProperty.location}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Price per night</span>
                                        <span className="font-semibold text-lg">${selectedProperty.price}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Guests</span>
                                        <span className="font-medium">{selectedProperty.maxGuests} max</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bedrooms</span>
                                        <span className="font-medium">{selectedProperty.beds}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bathrooms</span>
                                        <span className="font-medium">{selectedProperty.baths}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Area</span>
                                        <span className="font-medium">{selectedProperty.area} sqft</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-4 text-lg">Performance</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedProperty.status)}`}>
                                            <i className={`bi ${getStatusIcon(selectedProperty.status)} mr-1`}></i>
                                            {selectedProperty.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Rating</span>
                                        <div className="flex items-center gap-1">
                                            <i className="bi bi-star-fill text-yellow-500"></i>
                                            <span className="font-medium">{selectedProperty.rating || 'N/A'}</span>
                                            <span className="text-gray-500">({selectedProperty.reviewsCount || 0} reviews)</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Listed on</span>
                                        <span className="font-medium">{format(selectedProperty.createdAt, 'MMM dd, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Bookings</span>
                                        <span className="font-medium">{selectedProperty.bookings?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        {selectedProperty.features && selectedProperty.features.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-semibold mb-4 text-lg">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProperty.features.map((feature, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {selectedProperty.description && (
                            <div className="mb-8">
                                <h3 className="font-semibold mb-4 text-lg">Description</h3>
                                <p className="text-gray-700 leading-relaxed">{selectedProperty.description}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-end pt-6 border-t">
                            <Link
                                href={`/spaces/${encodedId}`}
                                target="_blank"
                                className="px-6 py-2.5 bg-white border-2 border-[#083A85] text-[#083A85] rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                <i className="bi bi-box-arrow-up-right mr-2"></i>
                                View Public Page
                            </Link>
                            <button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedProperty);
                                }}
                                className="px-6 py-2.5 bg-[#083A85] text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                <i className="bi bi-pencil-square mr-2"></i>
                                Edit Property
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Edit Modal (styled similarly)
    const EditModal = () => {
        if (!editingProperty) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Edit Property</h2>
                            <button onClick={handleCloseEditModal} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <i className="bi bi-x-lg text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                                <p className="text-base text-gray-900 break-words">{editingProperty.name || editingProperty.title}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(editingProperty.status)}`}>
                                    <i className={`bi ${getStatusIcon(editingProperty.status)} mr-1`}></i>
                                    {editingProperty.status}
                                </span>
                            </div>
                            <div>
                                <label htmlFor="unavailable-date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Set Unavailable Until
                                </label>
                                <input
                                    id="unavailable-date"
                                    type="date"
                                    value={unavailableDate}
                                    onChange={(e) => setUnavailableDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to make property available immediately.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCloseEditModal}
                                className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2.5 bg-[#F20C8F] text-white rounded-lg font-medium hover:bg-[#F20C8F]/90 transition"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Login prompt
    if (!isAuthenticated && !loading) {
        return (
            <div className="pt-14 min-h-screen bg-gradient-to-br from-gray-50 to-white">
                <div className="mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto">
                        <i className="bi bi-shield-lock text-6xl text-[#083A85] mb-4"></i>
                        <h3 className="text-2xl font-semibold text-gray-800">Authentication Required</h3>
                        <p className="text-gray-500 mt-2">Please log in to view your properties.</p>
                        <Link 
                            href="/login" 
                            className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-[#083A85] to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <head>
                <title>My Properties - Jambolush</title>
            </head>
            <div className="pt-1">
                <style jsx>{`
                    @keyframes scale-in {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-scale-in { animation: scale-in 0.3s ease-out; }
                    @keyframes slide-up {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up { animation: slide-up 0.5s ease-out; }
                `}</style>

                <div className="mx-auto px-2 sm:px-3 lg:px-4 py-3">
                    {/* Enhanced Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">
                            My Properties
                        </h1>
                        <p className="text-gray-600 mt-2">Manage your active and completed property listings.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-house-door-fill text-2xl text-gray-400"></i>
                                <span className="text-xs font-semibold text-gray-500">TOTAL</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900">{summaryStats.total}</p>
                            <p className="text-xs text-gray-500 mt-1">Properties</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-check-circle-fill text-2xl text-emerald-500"></i>
                                <span className="text-xs font-semibold text-emerald-700">ACTIVE</span>
                            </div>
                            <p className="text-3xl font-bold text-emerald-700">{summaryStats.active}</p>
                            <p className="text-xs text-emerald-600 mt-1">Live listings</p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-clock-fill text-2xl text-amber-500"></i>
                                <span className="text-xs font-semibold text-amber-700">PENDING</span>
                            </div>
                            <p className="text-3xl font-bold text-amber-700">{summaryStats.pending}</p>
                            <p className="text-xs text-amber-600 mt-1">Under review</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-door-open-fill text-2xl text-blue-500"></i>
                                <span className="text-xs font-semibold text-blue-700">CHECKED IN</span>
                            </div>
                            <p className="text-3xl font-bold text-blue-700">{summaryStats.checkedIn}</p>
                            <p className="text-xs text-blue-600 mt-1">Current stays</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-door-closed-fill text-2xl text-purple-500"></i>
                                <span className="text-xs font-semibold text-purple-700">CHECKED OUT</span>
                            </div>
                            <p className="text-3xl font-bold text-purple-700">{summaryStats.checkedOut}</p>
                            <p className="text-xs text-purple-600 mt-1">Recent stays</p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all p-6">
                            <div className="flex items-center justify-between mb-2">
                                <i className="bi bi-x-circle-fill text-2xl text-red-500"></i>
                                <span className="text-xs font-semibold text-red-700">INACTIVE</span>
                            </div>
                            <p className="text-3xl font-bold text-red-700">{summaryStats.inactive}</p>
                            <p className="text-xs text-red-600 mt-1">Paused listings</p>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                        >
                            <i className="bi bi-funnel"></i>
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                            {(statusFilter !== 'all' || typeFilter !== 'all' || priceRangeFilter !== 'all' || ratingFilter !== 'all') && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                                    Active
                                </span>
                            )}
                        </button>

                        <Link 
                            href="/all/host/add-property" 
                            onClick={handleAddPropertyClick}
                            className="px-6 py-3 bg-gradient-to-r from-[#083A85] to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                        >
                            <i className="bi bi-plus-lg mr-2"></i>Add Property
                        </Link>
                    </div>
                    
                    {/* Enhanced Filters Section */}
                    {showFilters && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 animate-slide-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Name or location..." 
                                            value={searchTerm} 
                                            onChange={(e) => setSearchTerm(e.target.value)} 
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        />
                                        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="checkedin">Checked In</option>
                                        <option value="checkedout">Checked Out</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                                    <select 
                                        value={typeFilter} 
                                        onChange={(e) => setTypeFilter(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="House">House</option>
                                        <option value="Apartment">Apartment</option>
                                        <option value="Villa">Villa</option>
                                        <option value="Condo">Condo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                                    <select 
                                        value={priceRangeFilter} 
                                        onChange={(e) => setPriceRangeFilter(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                                    >
                                        <option value="all">Any Price</option>
                                        <option value="0-50">Under $50</option>
                                        <option value="50-100">$50 - $100</option>
                                        <option value="100-200">$100 - $200</option>
                                        <option value="200-500">$200 - $500</option>
                                        <option value="500-">$500+</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Min Rating</label>
                                    <select 
                                        value={ratingFilter} 
                                        onChange={(e) => setRatingFilter(e.target.value)} 
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition cursor-pointer"
                                    >
                                        <option value="all">Any Rating</option>
                                        <option value="4.5">4.5+ Stars</option>
                                        <option value="4">4+ Stars</option>
                                        <option value="3.5">3.5+ Stars</option>
                                        <option value="3">3+ Stars</option>
                                    </select>
                                </div>
                            </div>

                            {/* Sort Options */}
                            <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t">
                                <span className="text-sm font-semibold text-gray-700">Sort by:</span>
                                {[
                                    { field: 'createdAt', label: 'Date Listed' },
                                    { field: 'price', label: 'Price' },
                                    { field: 'name', label: 'Name' },
                                    { field: 'rating', label: 'Rating' },
                                    { field: 'area', label: 'Size' }
                                ].map(({ field, label }) => (
                                    <button
                                        key={field}
                                        onClick={() => handleSort(field as SortField)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            sortField === field 
                                                ? 'bg-[#083A85] text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {label}
                                        {sortField === field && (
                                            <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'} ml-1`}></i>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Results Summary */}
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold">{paginatedProperties.length}</span> of <span className="font-semibold">{filteredProperties.length}</span> properties
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setViewMode('grid')} 
                                        className={`px-4 py-2 rounded-lg transition font-medium ${
                                            viewMode === 'grid' 
                                                ? 'bg-[#083A85] text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <i className="bi bi-grid-3x3-gap mr-2"></i>Grid
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('table')} 
                                        className={`px-4 py-2 rounded-lg transition font-medium ${
                                            viewMode === 'table' 
                                                ? 'bg-[#083A85] text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <i className="bi bi-list mr-2"></i>List
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredProperties.length === 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                            <i className="bi bi-house-slash text-6xl text-gray-300 mb-4"></i>
                            <h3 className="text-2xl font-semibold text-gray-800">
                                {properties.length === 0 ? "No Properties Yet" : "No Matches Found"}
                            </h3>
                            <p className="text-gray-500 mt-2">
                                {properties.length === 0 
                                    ? "Start building your portfolio by adding your first property" 
                                    : "Try adjusting your filters or search terms"}
                            </p>
                            {properties.length === 0 && (
                                <Link 
                                    href="/all/host/add-property"
                                    onClick={handleAddPropertyClick}
                                    className="inline-block mt-6 px-8 py-3 bg-gradient-to-r from-[#083A85] to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
                                >
                                    <i className="bi bi-plus-lg mr-2"></i>Add Your First Property
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Enhanced Grid View */}
                    {!loading && viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedProperties.map((property) => {
                                const mainImage = getMainImage(property);
                                const allImages = getAllImages(property);
                                const encodedId = encodeId(property.id);

                                return (
                                    <div key={property.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                        {/* Image Container */}
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={mainImage}
                                                alt={property.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                onClick={() => handleOpenPhotoViewer(property)}
                                            />
                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(property.status)} backdrop-blur-sm`}>
                                                    <i className={`bi ${getStatusIcon(property.status)} mr-1`}></i>
                                                    {property.status.toUpperCase()}
                                                </span>
                                            </div>
                                            {/* Photo Count */}
                                            {allImages.length > 1 && (
                                                <button 
                                                    onClick={() => handleOpenPhotoViewer(property)}
                                                    className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-md text-xs backdrop-blur-sm hover:bg-black/80 transition"
                                                >
                                                    <i className="bi bi-images mr-1"></i>{allImages.length} photos
                                                </button>
                                            )}
                                            {/* Quick Actions */}
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/spaces/${encodedId}`}
                                                    target="_blank"
                                                    className="bg-white/90 backdrop-blur-sm p-2 rounded-lg hover:bg-white transition"
                                                >
                                                    <i className="bi bi-box-arrow-up-right text-gray-700"></i>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            {/* Title and Location */}
                                            <div className="mb-3">
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">{property.name}</h3>
                                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                                    <i className="bi bi-geo-alt mr-1"></i>
                                                    {property.location}
                                                </p>
                                            </div>

                                            {/* Rating and Reviews */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-1">
                                                    <i className="bi bi-star-fill text-yellow-500"></i>
                                                    <span className="font-medium">{property.rating || '0'}</span>
                                                    <span className="text-gray-500 text-sm">({property.reviewsCount || 0})</span>
                                                </div>
                                                <p className="text-xl font-bold text-[#083A85]">${property.price}</p>
                                            </div>

                                            {/* Property Details */}
                                            <div className="flex justify-between text-sm text-gray-600 pb-4 mb-4 border-b">
                                                <span><i className="bi bi-door-open mr-1"></i>{property.beds} beds</span>
                                                <span><i className="bi bi-droplet mr-1"></i>{property.baths} baths</span>
                                                <span><i className="bi bi-rulers mr-1"></i>{property.area} sqft</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(property)}
                                                    className="flex-1 px-4 py-2.5 bg-[#083A85] text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                                >
                                                    <i className="bi bi-eye mr-1"></i>View Details
                                                </button>
                                                <button 
                                                    onClick={() => handleEdit(property)}
                                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                                    title="Edit"
                                                >
                                                    <i className="bi bi-pencil-square"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Enhanced List View */}
                    {!loading && viewMode === 'table' && (
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property</th>
                                            <th className="px-6 py-4 text-left">
                                                <button 
                                                    onClick={() => handleSort('price')} 
                                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                                                >
                                                    Price <i className={`bi bi-arrow-${sortField === 'price' && sortOrder === 'desc' ? 'down' : 'up'}`}></i>
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left">
                                                <button 
                                                    onClick={() => handleSort('rating')} 
                                                    className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                                                >
                                                    Rating <i className={`bi bi-arrow-${sortField === 'rating' && sortOrder === 'desc' ? 'down' : 'up'}`}></i>
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedProperties.map((property) => {
                                            const mainImage = getMainImage(property);
                                            const encodedId = encodeId(property.id);

                                            return (
                                                <tr key={property.id} className="hover:bg-gray-50 transition">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <img
                                                                src={mainImage}
                                                                alt={property.name}
                                                                className="w-24 h-16 rounded-lg object-cover mr-4 cursor-pointer hover:opacity-90 transition"
                                                                onClick={() => handleOpenPhotoViewer(property)}
                                                            />
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900">{property.name}</div>
                                                                <div className="text-sm text-gray-500">{property.location}</div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {property.beds} bed • {property.baths} bath • {property.area} sqft
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-lg font-bold text-gray-900">${property.price}</div>
                                                        <div className="text-xs text-gray-500">per night</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border inline-flex items-center ${getStatusColor(property.status)}`}>
                                                            <i className={`bi ${getStatusIcon(property.status)} mr-1`}></i>
                                                            {property.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1">
                                                            <i className="bi bi-star-fill text-yellow-500"></i>
                                                            <span className="font-medium">{property.rating || '0'}</span>
                                                            <span className="text-gray-500 text-sm">({property.reviewsCount || 0})</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleViewDetails(property)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                                title="View Details"
                                                            >
                                                                <i className="bi bi-eye text-lg"></i>
                                                            </button>
                                                            <Link
                                                                href={`/spaces/${encodedId}`}
                                                                target="_blank"
                                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                                title="View Public Page"
                                                            >
                                                                <i className="bi bi-box-arrow-up-right text-lg"></i>
                                                            </Link>
                                                            <button
                                                                onClick={() => handleEdit(property)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                                                title="Edit"
                                                            >
                                                                <i className="bi bi-pencil-square text-lg"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg transition ${
                                        currentPage === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                    }`}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>

                                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                    let pageNum = index + 1;
                                    if (totalPages > 5) {
                                        if (currentPage <= 3) {
                                            pageNum = index + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + index;
                                        } else {
                                            pageNum = currentPage - 2 + index;
                                        }
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                                currentPage === pageNum 
                                                    ? 'bg-[#083A85] text-white shadow-lg' 
                                                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg transition ${
                                        currentPage === totalPages 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
                                    }`}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Go to page:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    value={goToPageInput}
                                    onChange={(e) => setGoToPageInput(e.target.value)}
                                    onBlur={(e) => handleGoToPage(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleGoToPage((e.target as HTMLInputElement).value);
                                        }
                                    }}
                                    className="w-16 px-2 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                                />
                                <span className="text-sm text-gray-600">of {totalPages}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Modals */}
                    {showDetailModal && <PropertyDetailModal />}
                    
                    {showPhotoViewer && selectedProperty && (
                        <PhotoViewerModal
                            isOpen={showPhotoViewer}
                            onClose={() => setShowPhotoViewer(false)}
                            photos={getAllImages(selectedProperty)}
                            initialPhotoIndex={selectedPhotoIndex}
                            propertyTitle={selectedProperty.name}
                            propertyImages={selectedProperty.images}
                        />
                    )}

                    {showEditModal && <EditModal />}

                    <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
                </div>
            </div>
        </>
    );
};

export default HostPropertiesPage;