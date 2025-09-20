//app/pages/host/host-bookings.tsx
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService';

// Types based on your backend service
interface BookingInfo {
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

interface BookingFilters {
  status?: string[];
  propertyId?: number;
  guestId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface BookingUpdateDto {
  status?: string;
  notes?: string;
  specialRequests?: string;
  checkInInstructions?: string;
  checkOutInstructions?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'checkIn' | 'propertyName' | 'totalPrice' | 'status' | 'createdAt';
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

const BookingsPage: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date | string, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      case 'EEEE, MMM dd, yyyy':
        return `${days[dayOfWeek]}, ${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [bookings, setBookings] = useState<BookingInfo[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingInfo[]>([]);
  const [properties, setProperties] = useState<Array<{id: number; name: string}>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('checkIn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Edit modal states
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCheckInInstructions, setEditCheckInInstructions] = useState('');
  const [editCheckOutInstructions, setEditCheckOutInstructions] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  const checkKYCStatus = (): boolean => {
  if (!user || !user.kycCompleted || user.kycStatus !== 'approved') {
    setShowKYCModal(true);
    return false;
  }
  return true;
};

const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      api.setAuth(token);
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser(response.data);
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Fixed fetchProperties function - based on your API response structure
const fetchProperties = async () => {
  try {
    const response = await api.get('/properties/host/my-properties');
    
    if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
      const propertyList = response.data.data.map((p: any) => ({
        id: p.id,
        name: p.name
      }));
      setProperties(propertyList);
    } else {
      console.warn('Unexpected response structure for properties:', response.data);
      setProperties([]);
    }
  } catch (err) {
    console.error('Error fetching properties:', err);
    setProperties([]);
  }
};

// Fixed fetchBookings function - based on your API response structure
const fetchBookings = async () => {
  try {
    setLoading(true);
    setError(null);

    // Build filters object
    const filters: BookingFilters = {
      sortBy: sortField,
      sortOrder: sortOrder,
    };

    if (statusFilter !== 'all') {
      filters.status = [statusFilter];
    }

    if (propertyFilter !== 'all') {
      filters.propertyId = parseInt(propertyFilter);
    }

    if (dateRange.start && dateRange.end) {
      filters.dateRange = {
        start: dateRange.start,
        end: dateRange.end
      };
    }

    // Make API call to get host bookings
    const response = await api.get('/properties/host/bookings', {
      params: {
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined
      }
    });

    if (response.data && response.data.success && response.data.data) {
      // Updated to match your API response structure
      setBookings(response.data.data.bookings || []);
      setTotal(response.data.data.total || 0);
      setTotalPages(response.data.data.totalPages || 0);
    } else {
      console.warn('Unexpected response structure for bookings:', response.data);
      setBookings([]);
      setTotal(0);
      setTotalPages(0);
    }
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    setError(err.response?.data?.message || 'Failed to fetch bookings');
    // Ensure bookings is always an array to prevent filter errors
    setBookings([]);
    setTotal(0);
    setTotalPages(0);
  } finally {
    setLoading(false);
  }
};

  // Initial data fetch
  useEffect(() => {
    fetchProperties();
    fetchUserData();
  }, []);

  // Fetch bookings when filters change
  useEffect(() => {
    fetchBookings();
  }, [currentPage, sortField, sortOrder, statusFilter, propertyFilter, dateRange, searchTerm]);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Set filtered bookings (for client-side operations)
  useEffect(() => {
    setFilteredBookings(bookings);
  }, [bookings]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + 7);
    
    return {
      total: total,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      upcomingThisWeek: bookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.checkIn) >= today && 
        new Date(b.checkIn) <= thisWeek
      ).length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0)
    };
  }, [bookings, total]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (booking: BookingInfo) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleEditBooking = (booking: BookingInfo) => {
    if (!checkKYCStatus()) return;
    setSelectedBooking(booking);
    setEditStatus(booking.status);
    setEditNotes(booking.message || '');
    setEditCheckInInstructions('');
    setEditCheckOutInstructions('');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBooking) return;

    try {
      const updateData: BookingUpdateDto = {
        status: editStatus,
        notes: editNotes,
        checkInInstructions: editCheckInInstructions,
        checkOutInstructions: editCheckOutInstructions
      };

      await api.put(`/properties/host/bookings/${selectedBooking.id}`, updateData);
      
      // Refresh bookings
      await fetchBookings();
      setShowEditModal(false);
      alert('Booking updated successfully!');
    } catch (error: any) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!checkKYCStatus()) return;
    if (!confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/properties/host/bookings/${bookingId}`);
      await fetchBookings();
      setShowModal(false);
      alert('Booking deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting booking:', error);
      alert(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const handlePrint = (booking: BookingInfo) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Booking ${booking.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #083A85; }
              .detail { margin: 10px 0; }
              .label { font-weight: bold; display: inline-block; width: 150px; }
            </style>
          </head>
          <body>
            <h1>Booking Details</h1>
            <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
            <div class="detail"><span class="label">Guest Name:</span> ${booking.guestName}</div>
            <div class="detail"><span class="label">Property:</span> ${booking.propertyName}</div>
            <div class="detail"><span class="label">Check-in:</span> ${format(booking.checkIn, 'MMM dd, yyyy')}</div>
            <div class="detail"><span class="label">Check-out:</span> ${format(booking.checkOut, 'MMM dd, yyyy')}</div>
            <div class="detail"><span class="label">Guests:</span> ${booking.guests}</div>
            <div class="detail"><span class="label">Amount:</span> $${booking.totalPrice}</div>
            <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
            ${booking.message ? `<div class="detail"><span class="label">Notes:</span> ${booking.message}</div>` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'cancelled': return 'bi-x-circle';
      case 'completed': return 'bi-check-square';
      default: return 'bi-calendar';
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            <span className="ml-3 text-lg text-gray-600">Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
            <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Bookings</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchBookings}
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
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Manage and track all your property bookings</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <i className="bi bi-calendar-check text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Confirmed</p>
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
                <p className="text-base text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.upcomingThisWeek}</p>
              </div>
              <i className="bi bi-calendar-week text-2xl text-blue-500"></i>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-xl p-4 transition-transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600">${summaryStats.totalRevenue.toLocaleString()}</p>
              </div>
              <i className="bi bi-cash-stack text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Guest or property name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Property</label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm sm:text-base"
              >
                <option value="all">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id.toString()}>{property.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Check-in Range</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm sm:text-base"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* View Mode Toggle & Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm sm:text-base text-gray-600 order-2 sm:order-1">
              Showing {bookings.length} of {total} bookings
            </p>
            <div className="flex gap-2 order-1 sm:order-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 sm:px-4 rounded-lg transition-colors cursor-pointer text-sm sm:text-base ${
                  viewMode === 'list' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
              >
                <i className="bi bi-list-ul sm:mr-2"></i><span className="hidden sm:inline">List View</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 sm:px-4 rounded-lg transition-colors cursor-pointer text-sm sm:text-base ${
                  viewMode === 'grid' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
              >
                <i className="bi bi-grid-3x3-gap sm:mr-2"></i><span className="hidden sm:inline">Grid View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <i className="bi bi-calendar-x text-5xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">No bookings found</h3>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              {total === 0 
                ? "You don't have any bookings yet"
                : "Try adjusting your filters or search criteria"}
            </p>
          </div>
        )}

        {/* List View */}
        {!loading && filteredBookings.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs sm:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Property & Guest
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('checkIn')}
                        className="text-xs sm:text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Check-in/out
                        <i className={`bi bi-chevron-${sortField === 'checkIn' && sortOrder === 'asc' ? 'up' : 'down'} text-xs sm:text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="text-xs sm:text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'} text-xs sm:text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('totalPrice')}
                        className="text-xs sm:text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Amount
                        <i className={`bi bi-chevron-${sortField === 'totalPrice' && sortOrder === 'asc' ? 'up' : 'down'} text-xs sm:text-base`}></i>
                      </button>
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs sm:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 sm:px-6 py-4">
                        <div>
                          <div className="text-sm sm:text-base font-medium text-gray-900">{booking.propertyName}</div>
                          <div className="text-sm text-gray-500">{booking.guestName}</div>
                          <div className="text-xs text-gray-400">{booking.guests} guests</div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm sm:text-base text-gray-900">
                          {format(booking.checkIn, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {format(booking.checkOut, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          <i className={`bi ${getStatusIcon(booking.status)} mr-1`}></i>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm sm:text-base font-medium text-gray-900">${booking.totalPrice.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Booking #{booking.id.slice(-8)}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm sm:text-base font-medium">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="text-blue-600 hover:text-blue-900 mr-2 sm:mr-3 cursor-pointer"
                          title="View details"
                        >
                          <i className="bi bi-eye text-base sm:text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="text-green-600 hover:text-green-900 mr-2 sm:mr-3 cursor-pointer"
                          title="Edit booking"
                        >
                          <i className="bi bi-pencil text-base sm:text-lg"></i>
                        </button>
                        <button
                          onClick={() => handlePrint(booking)}
                          className="text-gray-600 hover:text-gray-900 mr-2 sm:mr-3 cursor-pointer"
                          title="Print booking"
                        >
                          <i className="bi bi-printer text-base sm:text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Delete booking"
                        >
                          <i className="bi bi-trash text-base sm:text-lg"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredBookings.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{booking.propertyName}</h3>
                      <p className="text-sm text-gray-600">Guest: {booking.guestName}</p>
                      <p className="text-xs text-gray-500">Booking #{booking.id.slice(-8)}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      <i className={`bi ${getStatusIcon(booking.status)} mr-1`}></i>
                      {booking.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 border-t border-b py-3 my-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-calendar-check text-gray-400"></i>
                      <span>{format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-people text-gray-400"></i>
                      <span>{booking.guests} guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="bi bi-envelope text-gray-400"></i>
                      <span className="truncate">{booking.guestEmail}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="text-xl font-bold text-gray-900">${booking.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {booking.message && (
                    <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      <i className="bi bi-info-circle mr-1"></i>
                      {booking.message}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(booking)}
                      className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
                    >
                      <i className="bi bi-eye mr-1"></i>View
                    </button>
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="flex-1 text-center px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer"
                      style={{ backgroundColor: '#083A85' }}
                    >
                      <i className="bi bi-pencil mr-1"></i>Edit
                    </button>
                    <button
                      onClick={() => handlePrint(booking)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Print"
                    >
                      <i className="bi bi-printer text-lg"></i>
                    </button>
                    <button
                      onClick={() => handleDeleteBooking(booking.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <i className="bi bi-trash text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              
              {/* Page numbers */}
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
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
              <div className="sm:hidden text-sm text-gray-700">Page {currentPage} of {totalPages}</div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm sm:text-base text-gray-700">Go to page:</span>
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
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm sm:text-base text-gray-700">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Booking Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="cursor-pointer flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                >
                  <i className="bi bi-x text-xl"></i>
                </button>
              </div>

              <div className="px-4 sm:px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                <div className="space-y-6 text-sm sm:text-base">
                  {/* Booking Info */}
                  <div>
                    <h3 className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Booking Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking ID</span>
                        <span className="font-medium text-gray-900">{selectedBooking.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created</span>
                        <span className="font-medium text-gray-900">
                          {format(selectedBooking.createdAt, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span className={`px-2 py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          <i className={`bi ${getStatusIcon(selectedBooking.status)} mr-1`}></i>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div>
                    <h3 className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Guest Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name</span>
                        <span className="font-medium text-gray-900">{selectedBooking.guestName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email</span>
                        <span className="font-medium text-gray-900 truncate">{selectedBooking.guestEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Number of Guests</span>
                        <span className="font-medium text-gray-900">{selectedBooking.guests}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div>
                    <h3 className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Property Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Property Name</span>
                        <span className="font-medium text-gray-900">{selectedBooking.propertyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in</span>
                        <span className="font-medium text-gray-900 text-right">
                          {format(selectedBooking.checkIn, 'EEEE, MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out</span>
                        <span className="font-medium text-gray-900 text-right">
                          {format(selectedBooking.checkOut, 'EEEE, MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div>
                    <h3 className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">${selectedBooking.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedBooking.message && (
                    <div>
                      <h3 className="text-xs sm:text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Guest Message</h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-gray-700">{selectedBooking.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-3 sm:py-4 flex justify-end gap-3 z-10">
                <button
                  onClick={() => handlePrint(selectedBooking)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                >
                  <i className="bi bi-printer sm:mr-2"></i><span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleEditBooking(selectedBooking);
                  }}
                  className="px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  style={{ backgroundColor: '#083A85' }}
                >
                  <i className="bi bi-pencil sm:mr-2"></i><span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => {
                    handleDeleteBooking(selectedBooking.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                >
                  <i className="bi bi-trash sm:mr-2"></i><span className="hidden sm:inline">Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Booking</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Guest:</strong> {selectedBooking.guestName}<br/>
                      <strong>Property:</strong> {selectedBooking.propertyName}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Internal notes about this booking..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Instructions</label>
                    <textarea
                      value={editCheckInInstructions}
                      onChange={(e) => setEditCheckInInstructions(e.target.value)}
                      placeholder="Instructions for guest check-in..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Instructions</label>
                    <textarea
                      value={editCheckOutInstructions}
                      onChange={(e) => setEditCheckOutInstructions(e.target.value)}
                      placeholder="Instructions for guest check-out..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: '#083A85' }}
                  >
                    {loading ? (
                      <>
                        <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg mr-2"></i>
                        Save Changes
                      </>
                    )}
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
        </div>
      )}
      <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
    </div>
  );
};

export default BookingsPage;