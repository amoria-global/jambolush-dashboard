"use client";

import api from '@/app/api/apiService';
import React, { useState, useEffect, useMemo } from 'react';

// Types for Tours (available to book)
interface Tour {
  id: string;
  title: string;
  guide: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  price: number;
  bookings: number;
  date: string;
  image?: string;
  description?: string;
  duration?: string;
  location?: string;
  tourType?: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  maxParticipants?: number;
  availableSpots?: number;
}

// Types for User Bookings
interface UserBooking {
  id: string;
  tourTitle?: string;
  tourType?: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  date: Date;
  startTime: string;
  endTime?: string;
  duration: number;
  location: string;
  meetingPoint?: string;
  numberOfGuests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  totalPrice?: number;
  guideName?: string;
  guideContact?: string;
  specialRequests?: string;
  createdAt: Date;
  lastModified: Date;
  currency?: string;
  
  // API fields mapping
  tour?: {
    title?: string;
    name?: string;
    location?: string;
    duration?: number;
    type?: string;
    guide?: {
      name?: string;
      contact?: string;
    };
  };
  schedule?: {
    startDate?: string;
    startTime?: string;
    endTime?: string;
  };
  guests?: number;
}

type MainTab = 'available' | 'bookings';
type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'guide' | 'price' | 'status' | 'date';
type SortOrder = 'asc' | 'desc';

const GuestToursPage: React.FC = () => {
  // Main state
  const [activeTab, setActiveTab] = useState<MainTab>('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Available Tours state
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // User Bookings state
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<UserBooking[]>([]);
  
  // Filter states for Available Tours
  const [tourFilters, setTourFilters] = useState({
    search: '',
    tourType: 'all',
    priceRange: 'all',
    status: 'active'
  });
  
  // Filter states for Bookings
  const [bookingFilters, setBookingFilters] = useState({
    search: '',
    status: 'all',
    tourType: 'all',
    dateRange: { start: '', end: '' }
  });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Modals
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Helper function to safely extract array data
  const extractArray = (data: any, fallback: any[] = []): any[] => {
    if (!data) return fallback;
    
    // Handle nested API response structure
    if (data.data && data.data.data) {
      if (data.data.data.bookings && Array.isArray(data.data.data.bookings)) {
        return data.data.data.bookings;
      }
      if (data.data.data.tours && Array.isArray(data.data.data.tours)) {
        return data.data.data.tours;
      }
      if (Array.isArray(data.data.data)) {
        return data.data.data;
      }
    }
    
    if (data.data) {
      if (data.data.bookings && Array.isArray(data.data.bookings)) {
        return data.data.bookings;
      }
      if (data.data.tours && Array.isArray(data.data.tours)) {
        return data.data.tours;
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return fallback;
  };

  // Transform API tour data
  const transformTourData = (apiTour: any): Tour => ({
    id: apiTour.id,
    title: apiTour.title || apiTour.name,
    guide: apiTour.guide?.name || apiTour.guideName || 'Guide TBD',
    status: apiTour.status || 'active',
    price: apiTour.price || apiTour.pricePerPerson || 0,
    bookings: apiTour.bookings || apiTour.totalBookings || 0,
    date: apiTour.date || apiTour.schedule?.startDate || new Date().toISOString(),
    image: apiTour.image || apiTour.images?.[0] || `https://picsum.photos/seed/tour${apiTour.id}/600/400`,
    description: apiTour.description || 'Tour description',
    duration: apiTour.duration || '2 hours',
    location: apiTour.location,
    tourType: apiTour.type || apiTour.tourType || 'city',
    maxParticipants: apiTour.maxParticipants || 20,
    availableSpots: (apiTour.maxParticipants || 20) - (apiTour.bookings || 0)
  });

  // Transform API booking data
  const transformBookingData = (apiBooking: any): UserBooking => {
    const bookingDate = new Date(apiBooking.schedule?.startDate || apiBooking.startDate || apiBooking.createdAt);
    const startTime = apiBooking.schedule?.startTime || apiBooking.startTime || '10:00';
    const duration = apiBooking.tour?.duration || apiBooking.duration || 2;

    return {
      id: apiBooking.id,
      tourTitle: apiBooking.tour?.title || apiBooking.tour?.name || 'Tour Booking',
      tourType: apiBooking.tour?.type || 'city',
      date: bookingDate,
      startTime: startTime,
      endTime: apiBooking.schedule?.endTime || apiBooking.endTime || `${(parseInt(startTime.split(':')[0]) + duration).toString().padStart(2, '0')}:00`,
      duration: duration,
      location: apiBooking.tour?.location || apiBooking.location || 'Location TBD',
      meetingPoint: apiBooking.meetingPoint || 'Meeting point TBD',
      numberOfGuests: apiBooking.guests || apiBooking.numberOfGuests || 1,
      status: apiBooking.status || 'pending',
      price: apiBooking.price || apiBooking.totalPrice || 0,
      totalPrice: apiBooking.totalPrice || apiBooking.price || 0,
      guideName: apiBooking.tour?.guide?.name || apiBooking.guideName || 'Guide TBD',
      guideContact: apiBooking.tour?.guide?.contact || apiBooking.guideContact || '',
      specialRequests: apiBooking.specialRequests || apiBooking.notes,
      createdAt: new Date(apiBooking.createdAt),
      lastModified: new Date(apiBooking.updatedAt || apiBooking.createdAt),
      currency: apiBooking.currency || 'KES'
    };
  };

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises = [];

        if (activeTab === 'available') {
          // Load available tours - you might need to create this endpoint or use existing tour listing
          promises.push(
            api.get('/tours').catch(() => null) // Adjust endpoint as needed
          );
        } else {
          // Load user's tour bookings
          promises.push(
            api.get('/bookings/tours').catch(() => null)
          );
        }

        const [response] = await Promise.all(promises);

        if (activeTab === 'available') {
          const extractedTours = extractArray(response);
          const transformedTours = extractedTours.map(transformTourData);
          setAvailableTours(transformedTours);
        } else {
          const extractedBookings = extractArray(response);
          const transformedBookings = extractedBookings.map(transformBookingData);
          setUserBookings(transformedBookings);
        }

      } catch (err: any) {
        const errorMessage = err?.data?.message || err?.message || 'Failed to load data. Please try again.';
        setError(errorMessage);
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Filter available tours
  useEffect(() => {
    let filtered = [...availableTours];

    if (tourFilters.search) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(tourFilters.search.toLowerCase()) ||
        t.guide.toLowerCase().includes(tourFilters.search.toLowerCase()) ||
        t.location?.toLowerCase().includes(tourFilters.search.toLowerCase())
      );
    }

    if (tourFilters.tourType !== 'all') {
      filtered = filtered.filter(t => t.tourType === tourFilters.tourType);
    }

    if (tourFilters.status !== 'all') {
      filtered = filtered.filter(t => t.status === tourFilters.status);
    }

    if (tourFilters.priceRange !== 'all') {
      const ranges = {
        'low': [0, 50],
        'medium': [51, 100],
        'high': [101, Infinity]
      };
      const [min, max] = ranges[tourFilters.priceRange as keyof typeof ranges] || [0, Infinity];
      filtered = filtered.filter(t => t.price >= min && t.price <= max);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title': comparison = a.title.localeCompare(b.title); break;
        case 'guide': comparison = a.guide.localeCompare(b.guide); break;
        case 'price': comparison = a.price - b.price; break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
        case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTours(filtered);
    setCurrentPage(1);
  }, [availableTours, tourFilters, sortField, sortOrder]);

  // Filter user bookings
  useEffect(() => {
    let filtered = [...userBookings];

    if (bookingFilters.search) {
      filtered = filtered.filter(b =>
        b.tourTitle?.toLowerCase().includes(bookingFilters.search.toLowerCase()) ||
        b.location.toLowerCase().includes(bookingFilters.search.toLowerCase())
      );
    }

    if (bookingFilters.status !== 'all') {
      filtered = filtered.filter(b => b.status === bookingFilters.status);
    }

    if (bookingFilters.tourType !== 'all') {
      filtered = filtered.filter(b => b.tourType === bookingFilters.tourType);
    }

    if (bookingFilters.dateRange.start && bookingFilters.dateRange.end) {
      const startDate = new Date(bookingFilters.dateRange.start);
      const endDate = new Date(bookingFilters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [userBookings, bookingFilters]);

  // Calculate summary stats for bookings
  const bookingStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = userBookings.filter(b => new Date(b.date) >= today && b.status === 'confirmed');
    const completed = userBookings.filter(b => b.status === 'completed');
    
    return {
      total: userBookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: userBookings.filter(b => b.status === 'pending').length,
      totalSpent: completed.reduce((sum, b) => sum + (b.totalPrice || b.price * b.numberOfGuests), 0)
    };
  }, [userBookings]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const items = activeTab === 'available' ? filteredTours : filteredBookings;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTours, filteredBookings, currentPage, itemsPerPage, activeTab]);

  const totalPages = Math.ceil((activeTab === 'available' ? filteredTours.length : filteredBookings.length) / itemsPerPage);

  // Handlers
  const handleBookTour = (tour: Tour) => {
    setSelectedTour(tour);
    setShowBookingForm(true);
  };

  const handleViewTourDetails = (tour: Tour) => {
    setSelectedTour(tour);
    setShowTourModal(true);
  };

  const handleViewBookingDetails = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleCancelBooking = async (booking: UserBooking) => {
    if (window.confirm(`Are you sure you want to cancel your booking for "${booking.tourTitle}"?`)) {
      try {
        await api.patch(`/tours/${booking.id}/cancel`);
        // Refresh bookings
        setActiveTab('bookings');
        window.location.reload();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="pt-14 font-sans min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-14 font-sans min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <i className="bi bi-exclamation-triangle text-red-600 text-xl" />
            </div>
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <i className="bi bi-arrow-clockwise mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 font-sans min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#083A85]">Tours</h1>
          <p className="text-gray-600 mt-2">Discover amazing tours and manage your bookings</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-[#083A85] text-[#083A85]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Tours
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-[#083A85] text-[#083A85]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Bookings {bookingStats.total > 0 && `(${bookingStats.total})`}
              </button>
            </nav>
          </div>
        </div>

        {/* Summary Stats for Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-[#083A85]">{bookingStats.total}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-600">{bookingStats.upcoming}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{bookingStats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-gray-600">Total Spent</p>
              <p className="text-xl font-bold text-green-600">{bookingStats.totalSpent.toLocaleString()} KES</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {activeTab === 'available' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Tours</label>
                <input
                  type="text"
                  placeholder="Tour name, guide, or location..."
                  value={tourFilters.search}
                  onChange={(e) => setTourFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Type</label>
                <select
                  value={tourFilters.tourType}
                  onChange={(e) => setTourFilters(prev => ({ ...prev, tourType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                >
                  <option value="all">All Types</option>
                  <option value="city">City</option>
                  <option value="nature">Nature</option>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="food">Food & Culinary</option>
                  <option value="historical">Historical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={tourFilters.priceRange}
                  onChange={(e) => setTourFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                >
                  <option value="all">All Prices</option>
                  <option value="low">0 - 50 KES</option>
                  <option value="medium">51 - 100 KES</option>
                  <option value="high">101+ KES</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <i className="bi bi-grid mr-1"></i>Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    <i className="bi bi-list mr-1"></i>List
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Bookings</label>
                <input
                  type="text"
                  placeholder="Tour name or location..."
                  value={bookingFilters.search}
                  onChange={(e) => setBookingFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={bookingFilters.status}
                  onChange={(e) => setBookingFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={bookingFilters.dateRange.start}
                  onChange={(e) => setBookingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={bookingFilters.dateRange.end}
                  onChange={(e) => setBookingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'available' ? (
          // Available Tours Content
          <>
            {filteredTours.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <i className="bi bi-search text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No tours found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedItems.map((tour: Tour | any) => (
                      <div key={tour.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                        <img src={tour.image} alt={tour.title} className="w-full h-48 object-cover" />
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{tour.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tour.status)}`}>
                              {tour.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Guide: {tour.guide}</p>
                          <p className="text-sm text-gray-600 mb-2">{tour.location}</p>
                          <p className="text-sm text-gray-500 mb-4">{tour.description}</p>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-2xl font-bold text-[#083A85]">{tour.price} KES</span>
                            <span className="text-sm text-gray-600">{tour.duration}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewTourDetails(tour)}
                              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleBookTour(tour)}
                              className="flex-1 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors"
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.map((tour: Tour | any) => (
                          <tr key={tour.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <img src={tour.image} alt={tour.title} className="w-12 h-12 rounded-lg object-cover mr-4" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{tour.title}</div>
                                  <div className="text-sm text-gray-500">{tour.location}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{tour.guide}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{tour.price} KES</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tour.status)}`}>
                                {tour.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleViewTourDetails(tour)}
                                className="text-gray-600 hover:text-gray-900 mr-3"
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                              <button
                                onClick={() => handleBookTour(tour)}
                                className="text-[#083A85] hover:text-blue-900"
                              >
                                <i className="bi bi-calendar-plus"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          // User Bookings Content
          <>
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <i className="bi bi-calendar-x text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">You haven't booked any tours yet or no bookings match your filters</p>
                <button
                  onClick={() => setActiveTab('available')}
                  className="mt-4 px-6 py-2 bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors"
                >
                  Browse Available Tours
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tour</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guests</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((booking: UserBooking | any) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.tourTitle}</div>
                            <div className="text-sm text-gray-500">{booking.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{booking.date.toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{booking.startTime}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{booking.numberOfGuests}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {booking.totalPrice || booking.price} {booking.currency}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleViewBookingDetails(booking)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activeTab === 'available' ? filteredTours.length : filteredBookings.length)} of {activeTab === 'available' ? filteredTours.length : filteredBookings.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 rounded-lg ${currentPage === i + 1 ? 'bg-[#083A85] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Tour Details Modal */}
        {showTourModal && selectedTour && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTour.title}</h2>
                  <button
                    onClick={() => setShowTourModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                <img src={selectedTour.image} alt={selectedTour.title} className="w-full h-64 object-cover rounded-lg mb-4" />
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Guide</p>
                      <p className="font-medium">{selectedTour.guide}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{selectedTour.duration}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{selectedTour.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Price</p>
                      <p className="font-medium text-[#083A85]">{selectedTour.price} KES</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-gray-800">{selectedTour.description}</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowTourModal(false);
                        handleBookTour(selectedTour);
                      }}
                      className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium"
                    >
                      Book This Tour
                    </button>
                    <button
                      onClick={() => setShowTourModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBooking.tourTitle}</h2>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-medium">{selectedBooking.date.toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time</p>
                      <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium">{selectedBooking.numberOfGuests}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Guide</p>
                      <p className="font-medium">{selectedBooking.guideName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Price</p>
                      <p className="font-medium text-[#083A85]">{selectedBooking.totalPrice || selectedBooking.price} {selectedBooking.currency}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Location</p>
                    <p className="text-gray-800">{selectedBooking.location}</p>
                  </div>
                  {selectedBooking.specialRequests && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Special Requests</p>
                      <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedBooking.specialRequests}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setShowBookingModal(false);
                          handleCancelBooking(selectedBooking);
                        }}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Cancel Booking
                      </button>
                    )}
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Booking Form Modal */}
        {showBookingForm && selectedTour && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Book {selectedTour.title}</h2>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                <p className="text-gray-600 mb-4">Complete booking functionality would be implemented here.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                    <input type="number" min="1" max="10" defaultValue="2" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                    <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" placeholder="Any special requirements..."></textarea>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      alert('Booking functionality would be implemented here');
                      setShowBookingForm(false);
                    }}
                    className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium"
                  >
                    Confirm Booking
                  </button>
                  <button
                    onClick={() => setShowBookingForm(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestToursPage;