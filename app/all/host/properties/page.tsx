"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import api from '@/app/api/apiService' // Import your API service
import { useRouter } from 'next/navigation';

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
}

interface DashboardStats {
    total: number;
    active: number;
    pending: number;
    checkedIn: number;
    checkedOut: number;
    inactive: number;
}

type ViewMode = 'grid' | 'table';
type SortField = 'name' | 'price' | 'createdAt' | 'area';
type SortOrder = 'asc' | 'desc';

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
        inactive: 0
    });
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [loading, setLoading] = useState(true);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [unavailableDate, setUnavailableDate] = useState('');
    const [goToPageInput, setGoToPageInput] = useState('');
    const [error, setError] = useState<string>('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');

    // Sort states
    const [sortField, setSortField] = useState<SortField>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const router = useRouter();
    
    // Fixed data mapping in the useEffect where you fetch dashboard data

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');

                // Fetch dashboard stats and properties
                const [dashboardResponse, propertiesResponse] = await Promise.all([
                    api.get('/properties/host/dashboard'),
                    api.get('/properties/host/my-properties')
                ]);
                
                console.log('Dashboard Response:', dashboardResponse);
                console.log('Properties Response:', propertiesResponse);
                
                if (dashboardResponse.ok && propertiesResponse.ok) {
                    // Fixed dashboard stats mapping
                    const dashboardData = dashboardResponse.data.data || dashboardResponse.data;
                    
                    const stats = {
                        total: dashboardData.totalProperties || 0,
                        active: dashboardData.activeProperties || 0,
                        pending: dashboardData.pendingReviews || 0,
                        // Fix: upcomingCheckIns is an array, get its length
                        checkedIn: Array.isArray(dashboardData.upcomingCheckIns) 
                            ? dashboardData.upcomingCheckIns.length 
                            : dashboardData.upcomingCheckIns || 0,
                        // Fix: recentBookings is an array, get its length
                        checkedOut: Array.isArray(dashboardData.recentBookings) 
                            ? dashboardData.recentBookings.length 
                            : dashboardData.recentBookings || 0,
                        // Fix: Calculate inactive properties
                        inactive: (dashboardData.totalProperties || 0) - (dashboardData.activeProperties || 0)
                    };
                    setSummaryStats(stats);

                    // Fixed properties data processing
                    const propertiesData = propertiesResponse.data.data || propertiesResponse.data;
                    
                    // Ensure we're working with an array
                    const propertiesArray = Array.isArray(propertiesData) ? propertiesData : [];
                    
                    const processedProperties = propertiesArray.map((property: any) => ({
                        ...property,
                        // Map backend fields to frontend expectations
                        title: property.name, // For backward compatibility
                        price: property.pricePerNight || property.pricePerTwoNights || property.price || 0,
                        propertyType: property.type,
                        bedrooms: property.beds || property.bedrooms,
                        bathrooms: property.baths || property.bathrooms,
                        area: property.area || Math.floor(Math.random() * 3000) + 800, // Fallback if area not set
                        dateListed: new Date(property.createdAt),
                        image: property.images && Array.isArray(property.images) && property.images.length > 0 
                            ? property.images[0] 
                            : `https://picsum.photos/seed/${property.id}/600/400`,
                        features: Array.isArray(property.features) ? property.features : 
                                typeof property.features === 'string' ? 
                                (property.features.startsWith('[') ? JSON.parse(property.features) : [property.features]) : 
                                []
                    }));

                    setProperties(processedProperties);
                } else {
                    throw new Error(
                        dashboardResponse.message || 
                        propertiesResponse.message || 
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
    }, []);

    // Alternative stats calculation if you want more accurate numbers
    // You could also calculate stats from the properties array directly:

    const calculateStatsFromProperties = (properties: Property[]) => {
        const statusCounts = properties.reduce((acc, property) => {
            acc[property.status] = (acc[property.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: properties.length,
            active: statusCounts.active || 0,
            pending: statusCounts.pending || 0,
            checkedIn: statusCounts.checkedin || 0,
            checkedOut: statusCounts.checkedout || 0,
            inactive: statusCounts.inactive || 0
        };
    };

    // Update goToPageInput when currentPage changes
    useEffect(() => {
        setGoToPageInput(currentPage.toString());
    }, [currentPage]);

    // Filter and sort logic
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
                case 'createdAt':
                    comparison = new Date(a.dateListed || a.createdAt).getTime() - new Date(b.dateListed || b.createdAt).getTime();
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredProperties(filtered);
        setCurrentPage(1);
    }, [properties, searchTerm, statusFilter, typeFilter, priceRangeFilter, sortField, sortOrder]);

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

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setUnavailableDate(property.unavailableUntil || '');
        setShowEditModal(true);
    };
    
    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditingProperty(null);
        setUnavailableDate('');
        router.push('/all/host/properties')
    };

    const handleSaveEdit = async () => {
        if (!editingProperty) return;
        
        try {
            const updateData: any = {};
            
            // Only update unavailableUntil if it's provided
            if (unavailableDate) {
                updateData.unavailableUntil = unavailableDate;
            }

            const response = await api.put(`/properties/${editingProperty.id}`, updateData);
            
            if (response.data.success) {
                // Update the local state
                setProperties(prev => prev.map(p => 
                    p.id === editingProperty.id 
                        ? { ...p, unavailableUntil: unavailableDate }
                        : p
                ));
                handleCloseModal();
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
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'checkedin': return 'bg-blue-100 text-blue-800';
            case 'checkedout': return 'bg-purple-100 text-purple-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    // Extracted Modal Component for clarity
    const EditModal = () => {
        if (!editingProperty) {
            return null;
        }

        return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in mx-2">
                    <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Property</h2>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 cursor-pointer p-1">
                                <i className="bi bi-x-lg text-lg sm:text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                                <p className="text-sm sm:text-base text-gray-900 break-words">{editingProperty.name || editingProperty.title}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                <span className={`px-2 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${getStatusColor(editingProperty.status)}`}>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to make property available immediately.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                            <button
                                onClick={handleCloseModal}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-300 order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-white text-sm sm:text-base font-medium order-1 sm:order-2"
                                style={{ backgroundColor: '#F20C8F' }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
    <>
        <head>
            <title>My Properties - Jambolush</title>
        </head>
        <div className="pt-14 font-sans">
            <style jsx>{`
                @keyframes scale-in {
                  from { transform: scale(0.95); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.2s ease-out; }
            `}</style>
            <div className="mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Properties</h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">Manage your active and completed property listings.</p>
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

                {/* Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Total</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{summaryStats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Active</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{summaryStats.active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Pending</p>
                        <p className="text-xl sm:text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Checked In</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">{summaryStats.checkedIn}</p>
                    </div>
                     <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Checked Out</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">{summaryStats.checkedOut}</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-white rounded-lg shadow-lg p-3 sm:p-4 transition-transform hover:scale-105">
                        <p className="text-sm sm:text-base text-gray-600">Inactive</p>
                        <p className="text-xl sm:text-2xl font-bold text-red-600">{summaryStats.inactive}</p>
                    </div>
                </div>

                {/* Add Property & Filters */}
                <div className="mb-4 sm:mb-6 text-center sm:text-right">
                    <Link href="/all/host/add-property" className="inline-block w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-lg text-white text-sm sm:text-base font-medium transition-transform hover:scale-105 cursor-pointer" style={{ backgroundColor: '#F20C8F' }}>
                        <i className="bi bi-plus-lg mr-2"></i>Add Property
                    </Link>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="lg:col-span-1">
                            <label htmlFor="search-input" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <input 
                                    id="search-input" 
                                    type="text" 
                                    placeholder="Property title or location..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="status-filter" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 cursor-pointer">Status</label>
                            <select 
                                id="status-filter" 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="checkedin">Checked In</option>
                                <option value="checkedout">Checked Out</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="type-filter" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 cursor-pointer">Property Type</label>
                            <select 
                                id="type-filter" 
                                value={typeFilter} 
                                onChange={(e) => setTypeFilter(e.target.value)} 
                                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="House">House</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Villa">Villa</option>
                                <option value="Condo">Condo</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="price-filter" className="block text-sm sm:text-base font-medium text-gray-700 mb-2 cursor-pointer">Price Range</label>
                            <select 
                                id="price-filter" 
                                value={priceRangeFilter} 
                                onChange={(e) => setPriceRangeFilter(e.target.value)} 
                                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="all">Any Price</option>
                                <option value="0-100000">Up to $100k</option>
                                <option value="100000-250000">$100k - 250k</option>
                                <option value="250000-500000">$250k - 500k</option>
                                <option value="500000-">$500k+</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 border-t pt-4">
                        <p className="text-sm sm:text-base text-gray-600">
                            Showing {paginatedProperties.length} of {filteredProperties.length} properties
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => setViewMode('grid')} 
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer ${viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
                                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
                            >
                                <i className="bi bi-grid-3x3-gap-fill mr-1 sm:mr-2"></i>
                                <span className="hidden sm:inline">Grid View</span>
                                <span className="sm:hidden">Grid</span>
                            </button>
                            <button 
                                onClick={() => setViewMode('table')} 
                                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer ${viewMode === 'table' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
                                style={{ backgroundColor: viewMode === 'table' ? '#083A85' : undefined }}
                            >
                                <i className="bi bi-list-task mr-1 sm:mr-2"></i>
                                <span className="hidden sm:inline">List View</span>
                                <span className="sm:hidden">List</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading & Empty States */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-900"></div>
                    </div>
                )}
                {!loading && filteredProperties.length === 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
                        <i className="bi bi-house-slash text-4xl sm:text-6xl text-gray-300"></i>
                        <h3 className="text-lg sm:text-xl font-medium text-gray-800 mt-4">
                            {properties.length === 0 ? "You have no properties listed" : "No properties found"}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 mt-2">
                            {properties.length === 0 ? "Click 'Add Property' to get started" : "Try adjusting your filters or search term."}
                        </p>
                    </div>
                )}

                {/* Grid View */}
                {!loading && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedProperties.map((p) => (
                            <div key={p.id} className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                                <div className="relative">
                                    <img src={p.image || `https://picsum.photos/seed/${p.id}/600/400`} alt={p.name || p.title} className="w-full h-48 sm:h-56 object-cover" />
                                    <span className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-full uppercase tracking-wider ${getStatusColor(p.status)}`}>
                                        {p.status}
                                    </span>
                                </div>
                                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{p.name || p.title}</h3>
                                    <p className="text-sm sm:text-base text-gray-500 mb-3 truncate">{p.location}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">${p.price.toLocaleString()}</p>
                                    <div className="flex justify-around text-center text-xs sm:text-base text-gray-600 border-t border-b py-2 sm:py-3 my-3">
                                        <span><i className="bi bi-rulers mr-1"></i>{p.area || 'N/A'} sqft</span>
                                        <span><i className="bi bi-door-open-fill mr-1"></i>{p.beds || p.bedrooms} beds</span>
                                        <span><i className="bi bi-droplet-fill mr-1"></i>{p.baths || p.bathrooms} baths</span>
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button 
                                            onClick={() => handleEdit(p)} 
                                            className="flex-1 text-center px-3 py-2.5 text-white rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer" 
                                            style={{ backgroundColor: '#083A85' }}
                                        >
                                            <i className="bi bi-pencil-square mr-1"></i>Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* List View */}
                {!loading && viewMode === 'table' && (
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                                            <button 
                                                onClick={() => handleSort('price')} 
                                                className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:text-gray-800 cursor-pointer"
                                            >
                                                Price <i className={`bi bi-arrow-${sortField === 'price' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down-up'}`}></i>
                                            </button>
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-left">
                                            <button 
                                                onClick={() => handleSort('createdAt')} 
                                                className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:text-gray-800 cursor-pointer"
                                            >
                                                Date Listed <i className={`bi bi-arrow-${sortField === 'createdAt' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down-up'}`}></i>
                                            </button>
                                        </th>
                                        <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedProperties.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img src={p.image || `https://picsum.photos/seed/${p.id}/600/400`} alt={p.name || p.title} className="w-16 h-12 sm:w-28 sm:h-20 rounded-md object-cover mr-2 sm:mr-4 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">{p.name || p.title}</div>
                                                        <div className="text-xs sm:text-base text-gray-500 truncate">{p.location}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm sm:text-base font-medium text-gray-800">
                                                ${p.price.toLocaleString()}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-base text-gray-600">
                                                {format(p.dateListed || p.createdAt, 'MMM dd, yyyy')}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-base sm:text-lg font-medium">
                                                <button 
                                                    onClick={() => handleEdit(p)} 
                                                    className="text-green-600 hover:text-green-900 cursor-pointer p-2" 
                                                    title="Edit property"
                                                >
                                                    <i className="bi bi-pencil-fill"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 sm:mt-8">
                        <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}`}
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>

                            <div className="hidden sm:flex items-center gap-1">
                                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = index + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = index + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + index;
                                    } else {
                                        pageNum = currentPage - 2 + index;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm ${currentPage === pageNum ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                                            style={{ backgroundColor: currentPage === pageNum ? '#083A85' : undefined }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Mobile page indicator */}
                            <div className="sm:hidden px-3 py-2 bg-white rounded-lg text-sm text-gray-600">
                                {currentPage} / {totalPages}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'}`}
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 text-sm sm:text-base order-1 sm:order-2">
                            <span className="text-gray-600 whitespace-nowrap">Go to page:</span>
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
                                className="w-12 sm:w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm"
                            />
                            <span className="text-gray-600 whitespace-nowrap">of {totalPages}</span>
                        </div>
                    </div>
                )}
                
                {/* Render the modal only when showEditModal is true */}
                {showEditModal && <EditModal />}

            </div>
        </div>
    </>

    );
};

export default HostPropertiesPage;