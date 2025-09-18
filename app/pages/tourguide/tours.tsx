"use client";

import React, { useState, useMemo, useEffect, FC } from 'react';
import api from '@/app/api/apiService';
import AddTourModal from '@/app/components/tourguide/add-tour';

interface Tour {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  duration: number;
  price: number;
  maxGroupSize: number;
  status: 'active' | 'draft' | 'paused';
  category: string;
  image?: string;
  images?: {
    main?: string[];
    gallery?: string[];
  };
  rating: number;
  totalBookings: number;
  nextBooking?: string;
  locationCity?: string;
  locationCountry?: string;
  meetingPoint?: string;
  type?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardData {
  totalTours: number;
  activeTours: number;
  draftTours: number;
  pausedTours: number;
  totalBookings: number;
  totalEarnings: number;
  averageRating: number;
  upcomingBookings: any[];
  recentBookings: any[];
}

interface TourCardProps {
  tour: Tour;
  onEdit: (tour: Tour) => void;
  onStatusChange: (tourId: string, newStatus: 'active' | 'draft' | 'paused') => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'category' | 'price' | 'status' | 'totalBookings';
type SortOrder = 'asc' | 'desc';

const TourGuideMyTours: FC = () => {
  // State for tours data
  const [tours, setTours] = useState<Tour[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [goToPageInput, setGoToPageInput] = useState('1');
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    category: 'all',
  });
  
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState<Tour | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [newTour, setNewTour] = useState<Omit<Tour, 'id' | 'rating' | 'totalBookings'>>({
    title: '',
    description: '',
    shortDescription: '',
    duration: 2,
    price: 50,
    maxGroupSize: 10,
    status: 'draft',
    category: 'History',
    locationCity: '',
    locationCountry: '',
    meetingPoint: '',
    type: 'walking'
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/tours/guide/dashboard/enhanced');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    }
  };

  // Fetch tours with filters and pagination
  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Token 
      const token = localStorage.getItem('authToken');
      if (token) {
        api.setAuth(token);
      }
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder: sortOrder
      });
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') {
        if (filters.status === 'active') params.append('isActive', 'true');
        if (filters.status === 'paused') params.append('isActive', 'false');
      }
      
      const response: any = await api.get(`/tours/guide/my-tours?${params.toString()}`);
      
      // Updated to match your actual response structure
      const { tours, total, totalPages, page } = response.data.data;
      
      setTours(tours || []);
      setTotalPages(totalPages || 1);
      setTotalItems(total || 0);
      // Optional: Update current page if needed
      // setCurrentPage(page || 1);
      
    } catch (error) {
      console.error('Error fetching tours:', error);
      setError('Failed to load tours');
      setTours([]);
    } finally {
      setLoading(false);
    }
  };
  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch tours when filters, pagination, or sorting changes
  useEffect(() => {
    fetchTours();
  }, [currentPage, filters, sortField, sortOrder]);

  // Update page input when current page changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate status summary from dashboard data or tours
  const statusSummary = useMemo(() => {
    if (dashboardData) {
      return {
        all: dashboardData.totalTours,
        active: dashboardData.activeTours,
        draft: dashboardData.draftTours,
        paused: dashboardData.pausedTours,
      };
    }
    
    // Fallback to calculating from current tours data
    const summary = {
      all: tours.length,
      active: 0,
      draft: 0,
      paused: 0,
    };
    
    tours.forEach(tour => {
      if (tour.status === 'active') summary.active++;
      if (tour.status === 'draft') summary.draft++;
      if (tour.status === 'paused') summary.paused++;
    });
    
    return summary;
  }, [dashboardData, tours]);

  // Get unique categories from tours
  const uniqueCategories = useMemo(() => {
    return [...new Set(tours.map(t => t.category))].filter(Boolean);
  }, [tours]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour({ ...tour });
    setShowEditModal(tour);
  };

  const handleSaveTour = async () => {
    if (!editingTour) return;
    
    try {
      setLoading(true);
      await api.put(`/tours/${editingTour.id}`, editingTour);
      
      setShowEditModal(null);
      setEditingTour(null);
      
      // Refresh data
      await fetchTours();
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Error updating tour:', error);
      setError('Failed to update tour');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tourId: string, newStatus: 'active' | 'draft' | 'paused') => {
    try {
      setLoading(true);
      
      if (newStatus === 'active') {
        await api.patch(`/tours/${tourId}/activate`, {});
      } else if (newStatus === 'paused') {
        await api.patch(`/tours/${tourId}/deactivate`, {});
      } else {
        // For draft status, update the tour
        await api.put(`/tours/${tourId}`, { status: 'draft' });
      }
      
      // Refresh data
      await fetchTours();
      await fetchDashboardData();
      
    } catch (error) {
      console.error('Error updating tour status:', error);
      setError('Failed to update tour status');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // TourCard component for grid view
  const TourCard: FC<TourCardProps> = ({ tour, onEdit, onStatusChange }) => (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative">
        <img 
          src={tour.images?.main?.[0] || tour.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'} 
          alt={tour.title} 
          className="w-full h-48 sm:h-56 object-cover" 
        />
        <span className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(tour.status)}`}>
          {tour.status}
        </span>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
          {tour.title}
        </h3>
        <p className="text-md text-gray-600 mb-1">Category: {tour.category}</p>
        {tour.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tour.description}</p>
        )}
        
        <div className="text-md text-gray-600 border-t border-b py-2 sm:py-3 my-2 sm:my-3 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span>Bookings:</span>
            <span className="font-medium text-gray-800">{tour.totalBookings || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Duration:</span>
            <span className="font-medium text-gray-800">{tour.duration}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Max Guests:</span>
            <span className="font-medium text-gray-800">{tour.maxGroupSize}</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">${tour.price}</p>
              <p className="text-xs text-gray-500">per person</p>
            </div>
            {tour.rating > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">★ {tour.rating}</p>
                <p className="text-xs text-gray-500">rating</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(tour)}
              disabled={loading}
              className="flex-1 cursor-pointer text-center px-2 sm:px-3 py-2 sm:py-2.5 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] transition-colors text-md sm:text-base font-medium disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={() => onStatusChange(tour.id, tour.status === 'active' ? 'paused' : 'active')}
              disabled={loading}
              className={`p-2 text-white cursor-pointer rounded-lg transition-colors disabled:opacity-50 ${
                tour.status === 'active' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
              }`}
              title={tour.status === 'active' ? 'Pause Tour' : 'Activate Tour'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {tour.status === 'active' ? 
                  <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> :
                  <polygon points="5,3 19,12 5,21"/>
                }
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Status Card component
  interface StatusCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
  }
  
  const StatusCard: FC<StatusCardProps> = ({ title, count, icon, color }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm flex items-center space-x-4 border-l-4 ${color}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-md font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
      </div>
    </div>
  );

  if (loading && tours.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased mt-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
            <span className="ml-2 text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased mt-8">
      <div className="w-full max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => setError(null)}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="sr-only">Dismiss</span>
              ×
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#083A85]">My Tours</h1>
            <p className="text-gray-600">Manage all your tours and experiences in one place.</p>
          </div>
          <button 
            className="bg-[#F20C8F] text-white px-4 py-2 rounded-lg hover:bg-[#d1075e] transition-colors font-medium cursor-pointer disabled:opacity-50"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline">
              <path d="M5 12h14M12 5v14"/>
            </svg>
            New Tour
          </button>
        </div>

        {/* Status Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Total Tours"
            count={statusSummary.all}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="m12 6 4 14"/><path d="m8 6 4 14"/><path d="M4 20h16"/><path d="M5 20l3 -14"/><path d="m16 6l3 14"/></svg>}
            color="border-[#083A85]"
          />
          <StatusCard
            title="Active Tours"
            count={statusSummary.active}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>}
            color="border-green-500"
          />
          <StatusCard
            title="Draft Tours"
            count={statusSummary.draft}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v5h5"/></svg>}
            color="border-yellow-500"
          />
          <StatusCard
            title="Paused Tours"
            count={statusSummary.paused}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><rect x="9" y="8" width="2" height="8"/><rect x="13" y="8" width="2" height="8"/></svg>}
            color="border-red-500"
          />
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Tour title or description..."
                  className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base cursor-pointer"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 sm:mt-6 gap-3 sm:gap-4">
            <p className="text-md text-gray-600 text-center sm:text-left">
              Showing {tours.length} of {totalItems} tours
            </p>
            <div className="flex justify-center sm:justify-end gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 cursor-pointer sm:px-4 py-2 rounded-lg transition-colors text-md font-medium ${
                  viewMode === 'grid' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2 inline"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span className="hidden xs:inline">Grid View</span>
                <span className="xs:hidden">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 cursor-pointer sm:px-4 py-2 rounded-lg transition-colors text-md font-medium ${
                  viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2 inline"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span className="hidden xs:inline">List View</span>
                <span className="xs:hidden">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tours List - Grid or List View */}
        {tours.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4"><path d="m16 6 4 14"/><path d="m12 6 4 14"/><path d="m8 6 4 14"/><path d="M4 20h16"/><path d="M5 20l3 -14"/><path d="m16 6l3 14"/></svg>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No tours found</h3>
            <p className="text-md text-gray-600 mt-2">Try adjusting your filters or search criteria, or create your first tour</p>
            <button 
              className="mt-4 bg-[#F20C8F] text-white px-6 py-2 rounded-lg hover:bg-[#d1075e] transition-colors font-medium cursor-pointer"
              onClick={() => setShowAddModal(true)}
            >
              Create Your First Tour
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {tours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onEdit={handleEditTour} onStatusChange={handleStatusChange} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tour</th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('category')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Category
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'category' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('status')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Status
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'status' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('totalBookings')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Bookings
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'totalBookings' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('price')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Price
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'price' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tours.map((tour) => (
                        <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <img
                                src={tour.images?.main?.[0] || tour.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'}
                                alt={tour.title}
                                className="w-full sm:w-24 md:w-28 h-16 sm:h-16 md:h-20 rounded-md object-cover"
                              />
                              <div className="min-w-0">
                                <div className="text-md font-medium text-gray-900 truncate">{tour.title}</div>
                                <div className="text-xs text-gray-500 truncate">{tour.description}</div>
                                <div className="text-xs text-gray-500">{tour.duration}h • Max {tour.maxGroupSize} guests</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">{tour.category}</div>
                            {tour.rating > 0 && (
                              <div className="text-xs text-gray-500">★ {tour.rating}</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tour.status)}`}>
                              {tour.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">{tour.totalBookings || 0}</div>
                            <div className="text-xs text-gray-500">bookings</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">${tour.price}</div>
                            <div className="text-xs text-gray-500">per person</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEditTour(tour)}
                                disabled={loading}
                                className="text-[#F20C8F] hover:text-[#d1075e] p-1 cursor-pointer disabled:opacity-50"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                              </button>
                              <button
                                onClick={() => handleStatusChange(tour.id, tour.status === 'active' ? 'paused' : 'active')}
                                disabled={loading}
                                className={`p-1 cursor-pointer disabled:opacity-50 ${
                                  tour.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                                }`}
                                title={tour.status === 'active' ? 'Pause Tour' : 'Activate Tour'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {tour.status === 'active' ? 
                                    <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> :
                                    <polygon points="5,3 19,12 5,21"/>
                                  }
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg text-md font-medium transition-colors disabled:opacity-50 ${
                        currentPage === pageNum ? 'bg-[#083A85] text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-md order-1 sm:order-2">
              <span className="text-gray-700 whitespace-nowrap">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onBlur={(e) => handleGoToPage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)}
                disabled={loading}
                className="w-12 sm:w-16 px-1 sm:px-2 py-1 border border-gray-300 rounded-lg text-md focus:outline-none focus:ring-2 focus:ring-[#083A85] disabled:opacity-50"
              />
              <span className="text-gray-700 whitespace-nowrap">of {totalPages}</span>
            </div>
          </div>
        )}

        {/* Add Tour Modal */}
        {showAddModal && ( <AddTourModal onClose={() => setShowAddModal(false)} />)}

        {/* Edit Modal */}
        {showEditModal && editingTour && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit Tour: {editingTour.title}</h2>
                <button 
                  className="text-gray-600 hover:text-red-600 text-2xl cursor-pointer"
                  onClick={() => setShowEditModal(null)}
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tour Title</label>
                  <input 
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                    value={editingTour.title}
                    onChange={(e) => setEditingTour({...editingTour, title: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                    rows={3}
                    value={editingTour.description}
                    onChange={(e) => setEditingTour({...editingTour, description: e.target.value})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                    value={editingTour.duration}
                    onChange={(e) => setEditingTour({...editingTour, duration: Number(e.target.value)})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                    value={editingTour.price}
                    onChange={(e) => setEditingTour({...editingTour, price: Number(e.target.value)})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                  <input 
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                    value={editingTour.maxGroupSize}
                    onChange={(e) => setEditingTour({...editingTour, maxGroupSize: Number(e.target.value)})}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
                    value={editingTour.category}
                    onChange={(e) => setEditingTour({...editingTour, category: e.target.value})}
                    disabled={loading}
                  >
                    <option value="History">History</option>
                    <option value="Food">Food</option>
                    <option value="Photography">Photography</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Culture">Culture</option>
                    <option value="Nature">Nature</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
                    value={editingTour.status}
                    onChange={(e) => setEditingTour({...editingTour, status: e.target.value as 'active' | 'draft' | 'paused'})}
                    disabled={loading}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTour}
                  disabled={loading}
                  className="flex-1 bg-[#083A85] cursor-pointer text-white font-bold py-2 px-4 rounded-lg hover:bg-[#083A85]/80 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TourGuideMyTours;