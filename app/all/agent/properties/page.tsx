"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/app/api/apiService';
import { useRouter } from 'next/navigation';
import PhotoViewerModal from '@/app/components/photo-viewers';
import { encodeId, createViewDetailsUrl } from '@/app/utils/encoder';
import AgentAssessmentGuard from "@/app/components/guards/AgentAssessmentGuard";

// Types
interface Property {
    id: string;
    name: string;
    title?: string;
    price: number;
    pricePerNight: number;
    pricePerMonth?: number;
    pricePerTwoNights: number;
    pricingType: 'night' | 'month';
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

interface BookingDetail {
    guestName: string;
    propertyName: string;
    guests: number;
    checkIn: string;
    checkOut: string;
    propertyId?: string;
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

const PropertiesPage: React.FC = () => {
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
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);
    const [loading, setLoading] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPhotoViewer, setShowPhotoViewer] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [goToPageInput, setGoToPageInput] = useState('');
    const [error, setError] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
    const [ratingFilter, setRatingFilter] = useState<string>('all');
    const [pricingTypeFilter, setPricingTypeFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Sort states
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Booking details states
    const [upcomingCheckIns, setUpcomingCheckIns] = useState<BookingDetail[]>([]);
    const [recentBookings, setRecentBookings] = useState<BookingDetail[]>([]);

    const router = useRouter();

    // Helper function to get cookie value
    const getCookieValue = (name: string): string | null => {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    };

    // Authentication check
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const token = localStorage.getItem('authToken') || 
                            sessionStorage.getItem('authToken') || 
                            getCookieValue('authToken');
                
                if (token) {
                    api.setAuth(token);
                    setIsAuthenticated(true);
                } else {
                    setError('Please log in to view your properties.');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setError('Authentication error. Please log in again.');
                setLoading(false);
            }
        };

        initializeAuth();
    }, [router]);

    // Extract main image from images object
    const getMainImage = (property: Property): string => {
        const fallbackImage = `https://picsum.photos/seed/${property.id}/600/400`;
        
        if (property.images) {
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
                    api.get('/properties/agent/dashboard'),
                    api.get('/properties/agent/properties')
                ]);

                if (dashboardResponse.ok && propertiesResponse.ok) {
                    const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
                    const propertiesData = propertiesResponse.data.data || propertiesResponse.data;
                    const allPropertiesArray = propertiesData.properties || [];

                    let totalRevenue = 0;
                    let totalRating = 0;
                    let ratedProperties = 0;
                    let occupiedDays = 0;
                    let totalDays = 0;
                    
                    let activeCount = 0;
                    let pendingCount = 0;
                    let checkedInCount = 0;
                    let checkedOutCount = 0;
                    let inactiveCount = 0;

                    const processedProperties = allPropertiesArray.map((property: any) => {
                        switch (property.status) {
                            case 'active':
                                activeCount++;
                                break;
                            case 'pending':
                                pendingCount++;
                                break;
                            case 'checkedin':
                                checkedInCount++;
                                break;
                            case 'checkedout':
                                checkedOutCount++;
                                break;
                            case 'inactive':
                                inactiveCount++;
                                break;
                        }

                        const propertyRevenue = (property.pricePerNight || 0) * (property.bookings?.length || 0) * 2;
                        totalRevenue += propertyRevenue;

                        const propertyRating = parseFloat(property.rating) || 0;
                        if (propertyRating > 0) {
                            totalRating += propertyRating;
                            ratedProperties++;
                        }

                        if (property.bookings && property.bookings.length > 0) {
                            occupiedDays += property.bookings.length * 2;
                        }
                        totalDays += 30;

                        // Determine display price based on pricing type
                        const displayPrice = property.pricingType === 'month'
                            ? (property.pricePerMonth || 0)
                            : (property.pricePerNight || property.pricePerTwoNights || property.price || 0);

                        return {
                            ...property,
                            title: property.name,
                            price: displayPrice,
                            pricingType: property.pricingType || 'night',
                            propertyType: property.type,
                            bedrooms: property.beds || property.bedrooms,
                            bathrooms: property.baths || property.bathrooms,
                            area: property.area || Math.floor(Math.random() * 2000) + 500,
                            dateListed: new Date(property.createdAt),
                            rating: propertyRating > 0 ? propertyRating : parseFloat((Math.random() * 2 + 3).toFixed(1)),
                            reviewsCount: property.reviewsCount || Math.floor(Math.random() * 50),
                            features: Array.isArray(property.features) ? property.features : []
                        };
                    });

                    const stats: DashboardStats = {
                        total: allPropertiesArray.length,
                        active: activeCount,
                        pending: pendingCount,
                        checkedIn: checkedInCount,
                        checkedOut: checkedOutCount,
                        inactive: inactiveCount,
                        totalRevenue: totalRevenue,
                        avgRating: ratedProperties > 0 ? parseFloat((totalRating / ratedProperties).toFixed(1)) : 0,
                        occupancyRate: totalDays > 0 ? Math.round((occupiedDays / totalDays) * 100) : 0
                    };

                    setSummaryStats(stats);

                    // Extract booking details for tooltips
                    setUpcomingCheckIns(dashboardData.upcomingCheckIns || []);
                    setRecentBookings(dashboardData.recentBookings || []);

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

        if (pricingTypeFilter !== 'all') {
            filtered = filtered.filter(p => p.pricingType === pricingTypeFilter);
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
    }, [properties, searchTerm, statusFilter, typeFilter, pricingTypeFilter, priceRangeFilter, ratingFilter, sortField, sortOrder]);

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
        const url = createViewDetailsUrl(property.id, 'property');
        router.push(url);
    };

    const handleEditProperty = (property: Property) => {
        router.push(`/all/edit-property?id=${encodeId(property.id)}`);
    };

    const handleOpenPhotoViewer = (property: Property, photoIndex: number = 0) => {
        setSelectedProperty(property);
        setSelectedPhotoIndex(photoIndex);
        setShowPhotoViewer(true);
    };

    const handleSetInactive = async (property: Property) => {
        if (!confirm(`Are you sure you want to set "${property.name}" as inactive?`)) return;
        
        try {
            const response = await api.put(`/properties/${property.id}`, { status: 'inactive' });
            
            if (response.data.success) {
                setProperties(prev => prev.map(p => 
                    p.id === property.id 
                        ? { ...p, status: 'inactive' }
                        : p
                ));
            }
        } catch (error: any) {
            console.error('Error updating property:', error);
            alert('Failed to update property status. Please try again.');
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
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'checkedin': return 'bg-blue-100 text-blue-800';
            case 'checkedout': return 'bg-purple-100 text-purple-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusDot = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500';
            case 'pending': return 'bg-yellow-500';
            case 'checkedin': return 'bg-blue-500';
            case 'checkedout': return 'bg-purple-500';
            case 'inactive': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    // Clear filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setTypeFilter('all');
        setPricingTypeFilter('all');
        setPriceRangeFilter('all');
        setRatingFilter('all');
    };

    const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || priceRangeFilter !== 'all' || ratingFilter !== 'all' || searchTerm !== '';

    // Tooltip component for stat cards
    const StatCardWithTooltip: React.FC<{
        label: string;
        count: number;
        dotColor: string;
        bookings: BookingDetail[];
    }> = ({ label, count, dotColor, bookings }) => {
        const [showTooltip, setShowTooltip] = useState(false);

        // Calculate total guests
        const totalGuests = bookings.reduce((sum, booking) => sum + (booking.guests || 0), 0);

        return (
            <div
                className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200 relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 font-medium">{label}</span>
                    <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                </div>
                <p className="text-2xl font-semibold text-gray-900">{count}</p>
                {totalGuests > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{totalGuests} guests</p>
                )}

                {/* Tooltip */}
                {showTooltip && bookings.length > 0 && (
                    <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                            {bookings.map((booking, idx) => (
                                <div key={idx} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <i className="bi bi-person-fill text-[#083A85] text-sm"></i>
                                                <p className="font-medium text-sm text-gray-900 truncate">{booking.guestName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <i className="bi bi-house-fill text-gray-400 text-xs"></i>
                                                <p className="text-xs text-gray-600 truncate">{booking.propertyName}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <i className="bi bi-people-fill text-gray-400 text-xs"></i>
                                                <p className="text-xs text-gray-500">{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Mobile Filter Modal
    const MobileFilterModal = () => (
        <div className={`fixed inset-0 bg-white z-50 transform transition-transform ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'} md:hidden`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="p-2">
                        <i className="bi bi-x-lg text-xl"></i>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Search</label>
                        <input 
                            type="text" 
                            placeholder="Property name or location..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Property Type</label>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="House">House</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Villa">Villa</option>
                            <option value="Condo">Condo</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Price Range</label>
                        <select 
                            value={priceRangeFilter} 
                            onChange={(e) => setPriceRangeFilter(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
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
                        <label className="text-sm font-medium text-gray-900 mb-2 block">Minimum Rating</label>
                        <select 
                            value={ratingFilter} 
                            onChange={(e) => setRatingFilter(e.target.value)} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                        >
                            <option value="all">Any Rating</option>
                            <option value="4.5">4.5+ Stars</option>
                            <option value="4">4+ Stars</option>
                            <option value="3.5">3.5+ Stars</option>
                            <option value="3">3+ Stars</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t space-y-3">
                    <button
                        onClick={clearAllFilters}
                        className="w-full py-2 text-gray-700 font-medium underline"
                    >
                        Clear all
                    </button>
                    <button
                        onClick={() => setShowMobileFilters(false)}
                        className="w-full py-3 bg-[#083A85] text-white rounded-lg font-medium"
                    >
                        Show {filteredProperties.length} properties
                    </button>
                </div>
            </div>
        </div>
    );

    // Login prompt
    if (!isAuthenticated && !loading) {
        return (
            <div className="pt-14 min-h-screen bg-gray-50">
                <div className="mx-auto px-4 py-12">
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-md mx-auto">
                        <i className="bi bi-shield-lock text-5xl text-[#083A85] mb-4"></i>
                        <h3 className="text-xl font-semibold text-gray-900">Sign in required</h3>
                        <p className="text-gray-500 mt-2 mb-6">Please sign in to view your properties.</p>
                        <Link 
                            href="/login" 
                            className="inline-block px-6 py-2.5 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#062a60] transition"
                        >
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AgentAssessmentGuard>
         <>
        <head>
            <title>Properties Listing - Jambolush</title>
        </head>
        <div className="p-2">
            <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-4 py-3">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
                    <p className="text-gray-600 mt-1 text-sm">Manage and track your property listings</p>
                </div>

                {/* Stats Cards - Horizontal scroll on mobile */}
                <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">Total</span>
                            <div className={`w-2 h-2 rounded-full bg-gray-500`}></div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.total}</p>
                    </div>

                    <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">Active</span>
                            <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.active}</p>
                    </div>

                    <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">Pending</span>
                            <div className={`w-2 h-2 rounded-full bg-yellow-500`}></div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.pending}</p>
                    </div>

                    <StatCardWithTooltip
                        label="Checked In"
                        count={summaryStats.checkedIn}
                        dotColor="bg-blue-500"
                        bookings={upcomingCheckIns}
                    />

                    <StatCardWithTooltip
                        label="Checked Out"
                        count={summaryStats.checkedOut}
                        dotColor="bg-purple-500"
                        bookings={recentBookings}
                    />

                    <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">Rating</span>
                            <i className="bi bi-star-fill text-yellow-500 text-xs"></i>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.avgRating || '0'}</p>
                    </div>

                    <div className="min-w-[140px] bg-white rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 font-medium">Occupancy</span>
                            <i className="bi bi-graph-up text-[#083A85] text-xs"></i>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.occupancyRate}%</p>
                    </div>
                </div>

                {/* Tabs for pricing types */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-6">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'night', label: 'Nightly' },
                            { key: 'month', label: 'Monthly' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setPricingTypeFilter(tab.key);
                                    setCurrentPage(1);
                                }}
                                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    pricingTypeFilter === tab.key
                                        ? 'border-[#083A85] text-[#083A85]'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input 
                                type="text" 
                                placeholder="Search properties..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent"
                            />
                        </div>

                        {/* Desktop Filters */}
                        <div className="hidden md:flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent text-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="House">House</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Villa">Villa</option>
                                <option value="Condo">Condo</option>
                            </select>

                            <select 
                                value={priceRangeFilter} 
                                onChange={(e) => setPriceRangeFilter(e.target.value)} 
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent text-sm"
                            >
                                <option value="all">Any Price</option>
                                <option value="0-100">Under $100</option>
                                <option value="100-300">$100-$300</option>
                                <option value="300-">$300+</option>
                            </select>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="md:hidden px-4 py-2 border border-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                        >
                            <i className="bi bi-funnel"></i>
                            Filters
                            {hasActiveFilters && (
                                <span className="bg-[#083A85] text-white text-xs px-2 py-0.5 rounded-full">
                                    {[statusFilter !== 'all', typeFilter !== 'all', priceRangeFilter !== 'all', ratingFilter !== 'all', searchTerm !== ''].filter(Boolean).length}
                                </span>
                            )}
                        </button>

                        {/* View Toggle */}
                        <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                            <button 
                                onClick={() => setViewMode('grid')} 
                                className={`px-3 py-1.5 rounded-md transition text-sm ${
                                    viewMode === 'grid' 
                                        ? 'bg-[#083A85] text-white' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <i className="bi bi-grid-3x3-gap"></i>
                            </button>
                            <button 
                                onClick={() => setViewMode('table')} 
                                className={`px-3 py-1.5 rounded-md transition text-sm ${
                                    viewMode === 'table' 
                                        ? 'bg-[#083A85] text-white' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <i className="bi bi-list"></i>
                            </button>
                        </div>

                        {/* Add Property Button */}
                        <Link 
                            href="/all/add-property" 
                            className="px-4 py-2 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#062a60] transition flex items-center justify-center gap-2 text-sm"
                        >
                            <i className="bi bi-plus-lg"></i>
                            <span className="hidden sm:inline">Add Property</span>
                            <span className="sm:hidden">Add</span>
                        </Link>
                    </div>
                </div>

                {/* Results info */}
                {!loading && (
                    <div className="flex justify-between items-center mb-4 text-sm">
                        <p className="text-gray-600">
                            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} found
                        </p>
                        <select 
                            value={`${sortField}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortField(field as SortField);
                                setSortOrder(order as SortOrder);
                            }}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="createdAt-desc">Newest first</option>
                            <option value="createdAt-asc">Oldest first</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating-desc">Rating: High to Low</option>
                            <option value="name-asc">Name: A-Z</option>
                        </select>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#083A85]"></div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredProperties.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <i className="bi bi-house text-5xl text-gray-300 mb-4"></i>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {properties.length === 0 ? "No properties yet" : "No properties found"}
                        </h3>
                        <p className="text-gray-500 text-sm mb-6">
                            {properties.length === 0 
                                ? "Get started by adding your first property" 
                                : "Try adjusting your filters or search"}
                        </p>
                        {properties.length === 0 ? (
                            <Link 
                                href="/all/add-property"
                                className="inline-block px-5 py-2.5 bg-[#083A85] text-white rounded-lg font-medium hover:bg-[#062a60] transition"
                            >
                                Add your first property
                            </Link>
                        ) : (
                            <button 
                                onClick={clearAllFilters}
                                className="text-[#083A85] font-medium underline"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}

                {/* Grid View */}
                {!loading && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedProperties.map((property) => {
                            const mainImage = getMainImage(property);
                            const allImages = getAllImages(property);
                            const encodedId = encodeId(property.id);

                            return (
                                <div key={property.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden cursor-pointer" onClick={() => handleOpenPhotoViewer(property)}>
                                        <img
                                            src={mainImage}
                                            alt={property.name}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Compact Status Badge */}
                                        <div className="absolute top-3 left-3">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${getStatusColor(property.status)} flex items-center gap-1`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(property.status)}`}></div>
                                                {property.status.toUpperCase()}
                                            </span>
                                        </div>
                                        {/* Photo Count */}
                                        {allImages.length > 1 && (
                                            <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs">
                                                <i className="bi bi-images mr-1"></i>{allImages.length}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        {/* Title and Rating */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">{property.name}</h3>
                                                <p className="text-sm text-gray-500 truncate">{property.location}</p>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <i className="bi bi-star-fill text-yellow-500 text-xs"></i>
                                                <span className="text-sm font-medium">{property.rating || '0'}</span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                                            <span>{property.beds} bed</span>
                                            <span>·</span>
                                            <span>{property.baths} bath</span>
                                            <span>·</span>
                                            <span>{property.maxGuests} guests</span>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-3">
                                            <span className="text-lg font-semibold text-gray-900">${property.price}</span>
                                            <span className="text-sm text-gray-500"> / {property.pricingType || 'night'}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleViewDetails(property)}
                                                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                                            >
                                                View
                                            </button>
                                            <button 
                                                onClick={() => handleEditProperty(property)}
                                                className="flex-1 px-3 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062a60] transition text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleSetInactive(property)}
                                                className="px-3 py-2 text-gray-500 hover:text-red-600 transition"
                                                title={property.status === 'inactive' ? 'Already inactive' : 'Set inactive'}
                                                disabled={property.status === 'inactive'}
                                            >
                                                <i className="bi bi-trash text-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Table View */}
                {!loading && viewMode === 'table' && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedProperties.map((property) => {
                                        const mainImage = getMainImage(property);
                                        const encodedId = encodeId(property.id);

                                        return (
                                            <tr key={property.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center">
                                                        <img
                                                            src={mainImage}
                                                            alt={property.name}
                                                            className="w-16 h-12 rounded-lg object-cover mr-3 cursor-pointer"
                                                            onClick={() => handleOpenPhotoViewer(property)}
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-gray-900 truncate">{property.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">{property.location}</div>
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                {property.beds}bd · {property.baths}ba · {property.maxGuests} guests
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(property.status)}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(property.status)}`}></div>
                                                        {property.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm font-medium text-gray-900">${property.price}</div>
                                                    <div className="text-xs text-gray-500">per {property.pricingType || 'night'}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <i className="bi bi-star-fill text-yellow-500 text-xs"></i>
                                                        <span className="text-sm">{property.rating || '0'}</span>
                                                        <span className="text-xs text-gray-500">({property.reviewsCount})</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => handleViewDetails(property)}
                                                            className="p-1.5 text-gray-600 hover:text-gray-900 transition"
                                                            title="View details"
                                                        >
                                                            <i className="bi bi-eye text-sm"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditProperty(property)}
                                                            className="p-1.5 text-gray-600 hover:text-[#083A85] transition"
                                                            title="Edit property"
                                                        >
                                                            <i className="bi bi-pencil text-sm"></i>
                                                        </button>
                                                        <Link
                                                            href={`/spaces/${encodedId}`}
                                                            target="_blank"
                                                            className="p-1.5 text-gray-600 hover:text-gray-900 transition"
                                                            title="View public page"
                                                        >
                                                            <i className="bi bi-box-arrow-up-right text-sm"></i>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleSetInactive(property)}
                                                            className="p-1.5 text-gray-600 hover:text-red-600 transition"
                                                            title="Set inactive"
                                                            disabled={property.status === 'inactive'}
                                                        >
                                                            <i className="bi bi-trash text-sm"></i>
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

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-lg transition ${
                                currentPage === 1 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>

                        {/* Page numbers */}
                        <div className="flex gap-1">
                            {[...Array(Math.min(7, totalPages))].map((_, index) => {
                                let pageNum = index + 1;
                                if (totalPages > 7) {
                                    if (currentPage <= 4) {
                                        if (index === 5) return <span key={index} className="px-2 py-1">...</span>;
                                        if (index === 6) pageNum = totalPages;
                                    } else if (currentPage >= totalPages - 3) {
                                        if (index === 0) pageNum = 1;
                                        if (index === 1) return <span key={index} className="px-2 py-1">...</span>;
                                        if (index > 1) pageNum = totalPages - 6 + index;
                                    } else {
                                        if (index === 0) pageNum = 1;
                                        if (index === 1) return <span key={index} className="px-2 py-1">...</span>;
                                        if (index >= 2 && index <= 4) pageNum = currentPage - 2 + index;
                                        if (index === 5) return <span key={index} className="px-2 py-1">...</span>;
                                        if (index === 6) pageNum = totalPages;
                                    }
                                }

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1 rounded-lg transition text-sm ${
                                            currentPage === pageNum 
                                                ? 'bg-[#083A85] text-white' 
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-lg transition ${
                                currentPage === totalPages 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                )}
                
                {/* Photo Viewer Modal */}
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

                {/* Mobile Filter Modal */}
                <MobileFilterModal />
            </div>

            {/* Custom styles for scrollbar */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    </>
        </AgentAssessmentGuard>
    );
};

export default PropertiesPage;