"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService'; // Your API service

// Updated types to match server response
interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  lastBooking?: string;
  preferredCommunication: 'email' | 'phone' | 'sms';
  notes?: string;
}

interface Booking {
  id: string;
  propertyId: number;
  propertyName: string;
  guestId: number;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface GuestWithBookings extends Guest {
  guestName: string;
  recentBookings?: Booking[];
  bookingStatus?: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  amountPaid?: number;
  totalAmount?: number;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded' | 'pending';
  guestCount?: number;
  bookingDate?: string;
  specialRequests?: string;
  avatar: string;
  propertyName?: string;
  propertyId?: string;
  checkIn?: Date;
  checkOut?: Date;
}

interface GuestDetailData {
  guest: Guest;
  bookings: Booking[];
  stats: {
    totalBookings: number;
    totalSpent: number;
    averageRating: number;
  };
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'bookings' | 'spending' | 'joinDate';
type SortOrder = 'asc' | 'desc';

interface GuestSearchFilters {
  search?: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  bookingStatus?: 'active' | 'past' | 'upcoming';
  sortBy?: 'name' | 'bookings' | 'spending' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

const GuestsListingPage: React.FC = () => {
  // Date formatting helper
  const format = (date: Date | string, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [guests, setGuests] = useState<GuestWithBookings[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<GuestWithBookings[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestWithBookings | null>(null);
  const [selectedGuestDetails, setSelectedGuestDetails] = useState<GuestDetailData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Edit modal states
  const [editBookingStatus, setEditBookingStatus] = useState<string>('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');

  // Helper function to map frontend booking status to backend values
  const mapBookingStatusToBackend = (status: string): 'active' | 'past' | 'upcoming' | undefined => {
    switch (status) {
      case 'confirmed': return 'active';
      case 'pending': return 'upcoming';
      case 'completed': return 'past';
      case 'cancelled': return 'past';
      case 'all': return undefined;
      default: return undefined;
    }
  };

  // Transform guest data for display
  const transformGuestForDisplay = (guest: Guest): GuestWithBookings => {
    return {
      ...guest,
      guestName: `${guest.firstName} ${guest.lastName}`,
      avatar: guest.profileImage || `https://ui-avatars.com/api/?name=${guest.firstName}+${guest.lastName}&background=083A85&color=fff`,
      // Set default values for fields that will be populated when viewing details
      bookingStatus: 'completed', // Default status for list view
      paymentStatus: 'paid', // Default status for list view
      amountPaid: guest.totalSpent,
      totalAmount: guest.totalSpent,
      guestCount: 1,
      bookingDate: guest.lastBooking || guest.joinDate,
      propertyName: 'Multiple Properties', // Default for list view
      propertyId: '0',
      checkIn: guest.lastBooking ? new Date(guest.lastBooking) : new Date(guest.joinDate),
      checkOut: guest.lastBooking ? new Date(guest.lastBooking) : new Date(guest.joinDate),
    };
  };

  // Fetch guests data from API
  const fetchGuests = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters object that matches backend expectations
      const filters: GuestSearchFilters = {};

      // Add search term if provided
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      // Add booking status filter (mapped to backend values)
      const mappedBookingStatus = mapBookingStatusToBackend(bookingStatusFilter);
      if (mappedBookingStatus) {
        filters.bookingStatus = mappedBookingStatus;
      }

      // Add sort parameters
      filters.sortBy = sortField;
      filters.sortOrder = sortOrder;

      // Add date range filters
      if (dateRangeFilter === 'custom' && (customDateRange.start || customDateRange.end)) {
        if (customDateRange.start) filters.startDate = customDateRange.start;
        if (customDateRange.end) filters.endDate = customDateRange.end;
      } else if (dateRangeFilter !== 'all') {
        // Calculate date ranges for predefined filters
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        switch (dateRangeFilter) {
          case 'today':
            filters.startDate = todayStr;
            filters.endDate = todayStr;
            break;
          case 'week':
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            filters.startDate = todayStr;
            filters.endDate = weekEnd.toISOString().split('T')[0];
            break;
          case 'month':
            const monthEnd = new Date(today);
            monthEnd.setMonth(today.getMonth() + 1);
            filters.startDate = todayStr;
            filters.endDate = monthEnd.toISOString().split('T')[0];
            break;
        }
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof GuestSearchFilters] === undefined) {
          delete filters[key as keyof GuestSearchFilters];
        }
      });

      console.log('Sending filters to backend:', filters);

      // Make API call to get host guests - ONLY the list, no individual calls
      const response = await api.get('/properties/host/guests', {
        params: filters
      });

      if (response.ok) {
        // Transform the data using only the list response
        const transformedGuests = response.data.data.map((guest: Guest) => 
          transformGuestForDisplay(guest)
        );

        setGuests(transformedGuests);
      }
    } catch (err: any) {
      console.error('Error fetching guests:', err);
      setError(err.response?.data?.message || 'Failed to fetch guests');
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual guest details - only called when viewing details
  const fetchGuestDetails = async (guestId: string): Promise<GuestDetailData | null> => {
    try {
      setLoadingDetails(true);
      const response = await api.get(`/properties/host/guests/${guestId}`);
      
      if (response.ok) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching guest details:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch guest details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch guests on component mount and when filters change
  useEffect(() => {
    fetchGuests();
  }, [searchTerm, dateRangeFilter, customDateRange, sortField, sortOrder, bookingStatusFilter]);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + 7);
    
    return {
      total: guests.length,
      confirmed: guests.filter(g => g.verificationStatus === 'verified').length,
      pending: guests.filter(g => g.verificationStatus === 'pending').length,
      upcomingThisWeek: guests.filter(g => 
        g.lastBooking && 
        new Date(g.lastBooking) >= today && 
        new Date(g.lastBooking) <= thisWeek
      ).length,
      revenue: guests.reduce((sum, g) => sum + g.totalSpent, 0)
    };
  }, [guests]);

  // Get unique properties for filter - simplified since we don't have property data initially
  const uniqueProperties = useMemo(() => {
    return []; // Will be empty until we have actual property data
  }, [guests]);

  // Client-side filtering for filters not supported by backend
  const applyClientSideFilters = (guests: GuestWithBookings[]): GuestWithBookings[] => {
    let filtered = [...guests];

    // Property filter (client-side only) - skip for now since we don't have property data
    if (propertyFilter !== 'all') {
      filtered = filtered.filter(guest => guest.propertyId === propertyFilter);
    }

    // Payment status filter (client-side only) - skip for now since it's derived
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.paymentStatus === paymentStatusFilter);
    }

    return filtered;
  };

  // Apply client-side filters
  useEffect(() => {
    const filtered = applyClientSideFilters(guests);
    setFilteredGuests(filtered);
    setCurrentPage(1);
  }, [guests, propertyFilter, paymentStatusFilter]);

  // Pagination
  const paginatedGuests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGuests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGuests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = async (guest: GuestWithBookings) => {
    setSelectedGuest(guest);
    setSelectedGuestDetails(null);
    setShowDetailModal(true);
    
    // Fetch detailed guest data
    try {
      const details = await fetchGuestDetails(guest.id);
      if (details) {
        setSelectedGuestDetails(details);
      }
    } catch (error) {
      console.error('Failed to load guest details:', error);
    }
  };

  const handleEditGuest = async (guest: GuestWithBookings) => {
    setSelectedGuest(guest);
    
    // Fetch guest details if not already loaded
    if (!selectedGuestDetails) {
      try {
        const details = await fetchGuestDetails(guest.id);
        if (details && details.bookings.length > 0) {
          setSelectedGuestDetails(details);
          const recentBooking = details.bookings[0];
          setEditBookingStatus(recentBooking.status);
          setEditSpecialRequests(recentBooking.message || '');
        }
      } catch (error) {
        console.error('Failed to load guest details for editing:', error);
        alert('Failed to load guest details. Please try again.');
        return;
      }
    } else if (selectedGuestDetails.bookings.length > 0) {
      const recentBooking = selectedGuestDetails.bookings[0];
      setEditBookingStatus(recentBooking.status);
      setEditSpecialRequests(recentBooking.message || '');
    }
    
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (selectedGuestDetails && selectedGuestDetails.bookings.length > 0) {
      try {
        const bookingId = selectedGuestDetails.bookings[0].id;
        const updateData = {
          status: editBookingStatus,
          notes: editSpecialRequests
        };

        await api.put(`/properties/host/bookings/${bookingId}`, updateData);

        // Refresh the data
        await fetchGuests();
        setShowEditModal(false);
        setShowDetailModal(false);
        alert('Guest booking updated successfully!');
      } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to update booking. Please try again.');
      }
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        // Fetch guest details to get booking ID if not already loaded
        let details = selectedGuestDetails;
        if (!details) {
          details = await fetchGuestDetails(guestId);
        }
        
        if (details && details.bookings.length > 0) {
          const bookingId = details.bookings[0].id;
          await api.delete(`/properties/host/bookings/${bookingId}`);
          
          // Refresh the data
          await fetchGuests();
          setShowDetailModal(false);
          alert('Booking deleted.');
        } else {
          alert('No bookings found to delete.');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Failed to delete booking. Please try again.');
      }
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'unverified': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'cancelled': return 'bi-x-circle';
      case 'completed': return 'bi-check-square';
      default: return 'bi-calendar';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-2 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <span className="ml-3 text-lg text-gray-600">Loading guests...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-2 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Guests</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchGuests}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14">
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
      <div className="mx-auto px-2 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#083A85]">Guest Listings</h1>
          <p className="text-gray-600 mt-2">Manage your property bookings and guest information</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Total Guests</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <i className="bi bi-people-fill text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.confirmed}</p>
              </div>
              <i className="bi bi-check-circle text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <i className="bi bi-clock text-2xl text-yellow-500"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.upcomingThisWeek}</p>
              </div>
              <i className="bi bi-calendar-week text-2xl text-blue-500"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${summaryStats.revenue.toLocaleString()}</p>
              </div>
              <i className="bi bi-cash-stack text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-100 rounded-lg shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Guest name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="bi bi-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>

            {/* Verification Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Verification Status</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Verified</option>
                <option value="pending">Pending</option>
                <option value="completed">Unverified</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                  setSortField(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="joinDate-desc">Newest First</option>
                <option value="joinDate-asc">Oldest First</option>
                <option value="spending-desc">Highest Spending</option>
                <option value="spending-asc">Lowest Spending</option>
                <option value="bookings-desc">Most Bookings</option>
                <option value="bookings-asc">Fewest Bookings</option>
              </select>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRangeFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* View Mode Toggle & Results Count */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-base text-gray-600">
              Showing {paginatedGuests.length} of {filteredGuests.length} guests
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
              >
                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
              >
                <i className="bi bi-list-ul mr-2"></i>List View
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!loading && filteredGuests.length === 0 && (
          <div className="bg-gray-100 rounded-lg shadow-xl p-12 text-center">
            <i className="bi bi-people text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">
              {guests.length === 0 
                ? "No guests yet"
                : "No guests found"}
            </h3>
            <p className="text-gray-600 mt-2">
              {guests.length === 0 
                ? "Your guests will appear here once they make bookings"
                : "Try adjusting your filters or search criteria"}
            </p>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredGuests.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedGuests.map((guest) => (
              <div key={guest.id} className="bg-gray-100 rounded-lg shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center mb-4">
                    <img 
                      src={guest.avatar} 
                      alt={guest.guestName}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{guest.guestName}</h3>
                      <p className="text-base text-gray-500">{guest.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-base font-semibold rounded-full ${getVerificationStatusColor(guest.verificationStatus)}`}>
                      {guest.verificationStatus}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-base text-gray-600">
                      <i className="bi bi-calendar-check mr-2"></i>
                      Member since {format(guest.joinDate, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-base text-gray-600">
                      <i className="bi bi-house mr-2"></i>
                      {guest.totalBookings} booking{guest.totalBookings !== 1 ? 's' : ''}
                    </p>
                    {guest.phone && (
                      <p className="text-base text-gray-600">
                        <i className="bi bi-telephone mr-2"></i>
                        {guest.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="border-t pt-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base text-gray-600">Total Spent</span>
                      <span className="text-lg font-semibold text-gray-900">${guest.totalSpent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">Avg Rating</span>
                      <span className="text-base font-semibold text-yellow-600">
                        {guest.averageRating > 0 ? `${guest.averageRating}/5` : 'No ratings'}
                      </span>
                    </div>
                  </div>
                  
                  {guest.lastBooking && (
                    <p className="text-base text-gray-500 italic mb-3">
                      <i className="bi bi-clock mr-1"></i>
                      Last booking: {format(guest.lastBooking, 'MMM dd, yyyy')}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(guest)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-base font-medium cursor-pointer"
                    >
                      <i className="bi bi-eye mr-1"></i>View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && filteredGuests.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Guest
                        <i className={`bi bi-chevron-${sortField === 'name' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('joinDate')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Join Date
                        <i className={`bi bi-chevron-${sortField === 'joinDate' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('bookings')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Bookings
                        <i className={`bi bi-chevron-${sortField === 'bookings' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('spending')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Total Spent
                        <i className={`bi bi-chevron-${sortField === 'spending' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={guest.avatar} 
                            alt={guest.guestName}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-base font-medium text-gray-900">{guest.guestName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{guest.email}</div>
                        {guest.phone && (
                          <div className="text-base text-gray-500">{guest.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {format(guest.joinDate, 'MMM dd, yyyy')}
                        </div>
                        {guest.lastBooking && (
                          <div className="text-base text-gray-500">
                            Last: {format(guest.lastBooking, 'MMM dd, yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getVerificationStatusColor(guest.verificationStatus)}`}>
                          {guest.verificationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {guest.totalBookings}
                        </div>
                        <div className="text-base text-gray-500">
                          Avg: {guest.averageRating > 0 ? `${guest.averageRating}/5` : 'No ratings'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          ${guest.totalSpent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                        <button
                          onClick={() => handleViewDetails(guest)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                          title="View details"
                        >
                          <i className="bi bi-eye text-lg"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {/* Page Numbers */}
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
                      key={index}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{ 
                        backgroundColor: currentPage === pageNum ? '#083A85' : undefined 
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            {/* Go to page */}
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-600">Go to page:</span>
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
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-base text-gray-600">of {totalPages}</span>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedGuest && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Guest Details</h2>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                    <span className="ml-3 text-lg text-gray-600">Loading details...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Guest Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <img 
                              src={selectedGuest.avatar} 
                              alt={selectedGuest.guestName}
                              className="w-16 h-16 rounded-full mr-4"
                            />
                            <div>
                              <p className="font-semibold text-xl text-gray-900">{selectedGuest.guestName}</p>
                              <p className="text-gray-600">{selectedGuest.email}</p>
                              {selectedGuest.phone && (
                                <p className="text-gray-600">{selectedGuest.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Guest Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Bookings:</span>
                            <span className="font-medium">{selectedGuest.totalBookings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Spent:</span>
                            <span className="font-medium">${selectedGuest.totalSpent}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Average Rating:</span>
                            <span className="font-medium">{selectedGuest.averageRating > 0 ? `${selectedGuest.averageRating}/5` : 'No ratings'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member Since:</span>
                            <span className="font-medium">{format(selectedGuest.joinDate, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verification Status:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getVerificationStatusColor(selectedGuest.verificationStatus)}`}>
                              {selectedGuest.verificationStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedGuestDetails && selectedGuestDetails.bookings.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Recent Bookings</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedGuestDetails.bookings.slice(0, 5).map((booking, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                              <div>
                                <p className="font-medium">{booking.propertyName}</p>
                                <p className="text-sm text-gray-600">
                                  {format(booking.checkIn, 'MMM dd, yyyy')} - {format(booking.checkOut, 'MMM dd, yyyy')}
                                </p>
                                <p className="text-sm text-gray-600">{booking.guests} guests</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${booking.totalPrice}</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${getBookingStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedGuestDetails && selectedGuestDetails.bookings.length > 0 && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDetailModal(false);
                            handleEditGuest(selectedGuest);
                          }}
                          className="flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium cursor-pointer"
                          style={{ backgroundColor: '#083A85' }}
                        >
                          <i className="bi bi-pencil mr-2"></i>
                          Edit Recent Booking
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(selectedGuest.id)}
                          className="flex-1 px-6 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium cursor-pointer"
                        >
                          <i className="bi bi-trash mr-2"></i>
                          Delete Recent Booking
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedGuest && selectedGuestDetails && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full animate-scale-in">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Recent Booking</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-base text-gray-600 mb-4">
                    Guest: <span className="font-semibold">{selectedGuest.guestName}</span><br/>
                    {selectedGuestDetails.bookings.length > 0 && (
                      <>Property: <span className="font-semibold">{selectedGuestDetails.bookings[0].propertyName}</span></>
                    )}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Booking Status
                      </label>
                      <select
                        value={editBookingStatus}
                        onChange={(e) => setEditBookingStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Special Requests / Notes
                      </label>
                      <textarea
                        value={editSpecialRequests}
                        onChange={(e) => setEditSpecialRequests(e.target.value)}
                        placeholder="Add any notes or special requests..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer"
                    style={{ backgroundColor: '#083A85' }}
                  >
                    <i className="bi bi-check-lg mr-2"></i>
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"
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

export default GuestsListingPage;