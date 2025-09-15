"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/apiService'; 
import AlertNotification from '@/app/components/notify';
import { encodeId } from '@/app/utils/encoder';

// Types
interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  propertyAddress: string;
  checkIn: Date;
  checkOut: Date;
  bookingDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'refunded';
  amount: number;
  paymentStatus: 'paid' | 'due' | 'refunded' | 'pending';
  guests: number;
  specialRequests?: string;
  propertyImage?: string;
  nights: number;
  propertyId?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'checkIn' | 'propertyName' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

interface APIError {
  message: string;
  status?: number;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const UserMyBookings: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

  // Transform backend booking data to frontend format
  const transformBookingData = (backendBooking: any): Booking => {
    const propertyImages = backendBooking.property?.images;
    let propertyImage = 'https://picsum.photos/600/400';
    
    // Extract first available image from any category
    if (propertyImages && typeof propertyImages === 'object') {
      const imageCategories = ['exterior', 'livingRoom', 'bedroom', 'kitchen'];
      for (const category of imageCategories) {
        if (propertyImages[category] && propertyImages[category].length > 0) {
          propertyImage = propertyImages[category][0];
          break;
        }
      }
    }

    return {
      id: backendBooking.id,
      guestName: `${backendBooking.guest?.firstName || ''} ${backendBooking.guest?.lastName || ''}`.trim(),
      guestEmail: backendBooking.guest?.email || '',
      guestPhone: backendBooking.guest?.phone || '',
      propertyName: backendBooking.property?.name || 'Unknown Property',
      propertyAddress: backendBooking.property?.location || '',
      checkIn: new Date(backendBooking.checkIn),
      checkOut: new Date(backendBooking.checkOut),
      bookingDate: new Date(backendBooking.createdAt),
      status: backendBooking.status,
      amount: backendBooking.totalPrice || 0,
      paymentStatus: backendBooking.paymentStatus || 'pending',
      guests: backendBooking.guests || 1,
      specialRequests: backendBooking.specialRequests,
      propertyImage,
      nights: backendBooking.nights || 1,
      propertyId: backendBooking.property?.id || backendBooking.propertyId
    };
  };

  // States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Sort states
  const [sortField, setSortField] = useState<SortField>('checkIn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({ show: true, message, type });
  };

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filters for API call
      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      
      if (dateRange.start) filters.checkInDate = dateRange.start;
      if (dateRange.end) filters.checkOutDate = dateRange.end;
      if (searchTerm) filters.search = searchTerm;
      
      filters.sortBy = sortField;
      filters.sortOrder = sortOrder;
      filters.page = 1; // Get all for frontend filtering
      filters.limit = 100; // Get more records for frontend filtering

      console.log('Fetching bookings with filters:', filters);
      
      const response = await api.searchPropertyBookings(filters);
      
      if (response.data.success && response.data.data) {
        const transformedBookings = response.data.data.bookings.map(transformBookingData);
        setBookings(transformedBookings);
        console.log('Fetched bookings:', transformedBookings);
      } else {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to load bookings. Please try again.';
      setError(errorMessage);
      
      // If it's an auth error, you might want to redirect to login
      if (err?.status === 401) {
        console.log('Unauthorized access - user needs to login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBookings();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchBookings();
    }
  }, [statusFilter, dateRange]);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Frontend filtering and sorting (for search and property filters)
  useEffect(() => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (propertyFilter !== 'all') {
      filtered = filtered.filter(booking => booking.propertyName === propertyFilter);
    }

    // Sort bookings
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'checkIn': comparison = a.checkIn.getTime() - b.checkIn.getTime(); break;
        case 'propertyName': comparison = a.propertyName.localeCompare(b.propertyName); break;
        case 'amount': comparison = a.amount - b.amount; break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, propertyFilter, sortField, sortOrder]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const uniqueProperties = useMemo(() => {
    return [...new Set(bookings.map(b => b.propertyName))];
  }, [bookings]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!bookingToCancel || !cancelReason.trim()) {
      showNotification('Please provide a reason for cancellation', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.cancelPropertyBooking(bookingToCancel, cancelReason);
      
      showNotification('Booking cancelled successfully', 'success');
      
      // Refresh bookings after successful cancellation
      await fetchBookings();
      
      // Close modals
      setShowCancelModal(false);
      if (selectedBooking?.id === bookingToCancel) {
        setShowModal(false);
        setSelectedBooking(null);
      }
      
      setBookingToCancel(null);
      setCancelReason('');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      showNotification(err?.data?.message || 'Failed to cancel booking. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (booking: Booking) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Booking ${booking.id}</title><style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #083A85; } .detail { margin: 10px 0; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
        </style></head><body>
          <h1>Booking Details</h1>
          <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
          <div class="detail"><span class="label">Guest Name:</span> ${booking.guestName}</div>
          <div class="detail"><span class="label">Property:</span> ${booking.propertyName}</div>
          <div class="detail"><span class="label">Check-in:</span> ${format(booking.checkIn, 'MMM dd, yyyy')}</div>
          <div class="detail"><span class="label">Check-out:</span> ${format(booking.checkOut, 'MMM dd, yyyy')}</div>
          <div class="detail"><span class="label">Amount:</span> $${booking.amount}</div>
          <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  const handlePayNow = (booking: Booking) => {
    if (booking.propertyId) {
      const encodedPropertyId = encodeId(booking.propertyId);
      const encodedBookingId = encodeId(booking.id);
      const paymentUrl = `https://app.jambolush.com/property/${encodedPropertyId}/confirm-and-pay/${encodedBookingId}`;
      window.open(paymentUrl, '_blank');
    } else {
      showNotification('Property information not available for payment', 'error');
    }
  };

  // Styling helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-500';
      case 'pending': return 'bg-yellow-100 text-yellow-500';
      case 'cancelled': return 'bg-red-100 text-red-500';
      case 'completed': return 'bg-blue-100 text-blue-500';
      case 'refunded': return 'bg-purple-100 text-purple-500';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'due': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      case 'refunded': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="pt-14 min-h-screen bg-gray-50">
        <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <i className="bi bi-exclamation-triangle text-4xl sm:text-6xl text-red-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">Error Loading Bookings</h3>
            <p className="text-base sm:text-base text-gray-600 mt-2">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors cursor-pointer">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-14 min-h-screen bg-gray-50">
      {/* Notification */}
      {notification.show && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}

      <div className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#083A85]">My Bookings</h1>
            <p className="text-base sm:text-base text-gray-600 mt-1 sm:mt-2">Here you can manage and track all your property bookings.</p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors cursor-pointer disabled:opacity-50">
            <i className={`bi bi-arrow-clockwise mr-2 ${loading ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-base sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Guest or property name..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-base" 
                />
                <i className="bi bi-search absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
              </div>
            </div>
            <div>
              <label className="block text-base sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base sm:text-base">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Property</label>
              <select 
                value={propertyFilter} 
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base sm:text-base">
                <option value="all">All Properties</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-base sm:text-base font-medium text-gray-700 mb-1 sm:mb-2">Check-in Range</label>
              <div className="flex gap-1 sm:gap-2">
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 min-w-0 px-1 sm:px-2 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base sm:text-base" 
                />
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 min-w-0 px-1 sm:px-2 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base sm:text-base" 
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 sm:mt-6 gap-3 sm:gap-4">
            <p className="text-base sm:text-base text-gray-600 text-center sm:text-left">
              Showing {paginatedBookings.length} of {filteredBookings.length} bookings
            </p>
            <div className="flex justify-center sm:justify-end gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer text-base font-medium ${
                  viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}>
                <i className="bi bi-grid-3x3-gap mr-1 sm:mr-2"></i>
                <span className="hidden xs:inline">Grid View</span>
                <span className="xs:hidden">Grid</span>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer text-base font-medium ${
                  viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}>
                <i className="bi bi-list-ul mr-1 sm:mr-2"></i>
                <span className="hidden xs:inline">List View</span>
                <span className="xs:hidden">List</span>
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {!loading && filteredBookings.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <i className="bi bi-calendar-x text-4xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">No bookings found</h3>
            <p className="text-base sm:text-base text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* List & Grid Views */}
        {!loading && filteredBookings.length > 0 && (
          viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">Property</th>
                      <th className="px-3 sm:px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">Guest Info</th>
                      <th className="px-3 sm:px-6 py-3 text-left">
                        <button 
                          onClick={() => handleSort('checkIn')} 
                          className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">
                          Check-in/out
                          <i className={`bi bi-chevron-${sortField === 'checkIn' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left">
                        <button 
                          onClick={() => handleSort('status')} 
                          className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">
                          Status
                          <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left">
                        <button 
                          onClick={() => handleSort('amount')} 
                          className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">
                          Amount
                          <i className={`bi bi-chevron-${sortField === 'amount' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                        </button>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <img 
                              src={booking.propertyImage} 
                              alt={booking.propertyName} 
                              className="w-full sm:w-24 md:w-28 h-16 sm:h-16 md:h-20 rounded-md object-cover" 
                            />
                            <div className="min-w-0">
                              <div className="text-base font-medium text-gray-900 truncate">{booking.propertyName}</div>
                              <div className="text-base sm:text-base text-gray-500 truncate">{booking.propertyAddress}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{booking.guestName}</div>
                          <div className="text-base sm:text-base text-gray-500 uppercase">{booking.id}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-base sm:text-base text-gray-900">{format(booking.checkIn, 'MMM dd, yyyy')}</div>
                          <div className="text-base text-gray-500">to {format(booking.checkOut, 'MMM dd, yyyy')}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                           {booking.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">${booking.amount}</div>
                          <div className={`text-base sm:text-base ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <button 
                              onClick={() => handleViewDetails(booking)} 
                              className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                              title="View Details">
                              <i className="bi bi-eye text-base sm:text-lg font-bold"></i>
                            </button>
                            <button 
                              onClick={() => handlePrint(booking)} 
                              className="text-gray-600 hover:text-gray-900 p-1 cursor-pointer"
                              title="Print">
                              <i className="bi bi-printer text-base sm:text-lg font-bold"></i>
                            </button>
                            {booking.paymentStatus === 'pending' && (
                              <button 
                                onClick={() => handlePayNow(booking)} 
                                className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                                title="Pay Now">
                                <i className="bi bi-credit-card text-base sm:text-lg font-bold"></i>
                              </button>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <button 
                                onClick={() => handleCancelClick(booking.id)} 
                                className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                                title="Cancel">
                                <i className="bi bi-x-circle text-base sm:text-lg font-bold"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedBookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="block rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Compact Image Section */}
                  <div 
                    className="relative h-40 bg-cover bg-center bg-gray-200"
                    style={{ backgroundImage: `url(${booking.propertyImage})` }}
                  >
                    {/* Gradient Overlay for better text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20"></div>
                    
                    {/* Status Badge - Professional Style */}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold shadow-lg ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                    

                    {/* Amount Overlay */}
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-900 px-2 py-1 rounded-lg text-sm font-bold shadow-lg">
                        ${booking.amount}
                      </span>
                    </div>
                  </div>

                  {/* Compact Content Section */}
                  <div className="bg-gradient-to-br from-[#083A85] to-[#0B4A9F] p-3 text-white h-full">
                    {/* Title - Compact */}
                    <h3 className="text-sm font-bold mb-1 text-white group-hover:text-blue-100 transition-colors leading-tight line-clamp-2">
                      {booking.propertyName}
                    </h3>
                    
                    {/* Location with Icon */}
                    <div className="flex items-center mb-2 text-xs text-blue-100">
                      <i className="bi bi-geo-alt-fill mr-1 text-xs"></i>
                      <p className="truncate">{booking.propertyAddress}</p>
                    </div>
                    
                    {/* Guest Details - Compact Grid */}
                    <div className="grid grid-cols-2 gap-1 text-xs text-blue-100 mb-2">
                      <div className="flex items-center justify-center bg-white/10 rounded px-1 py-0.5 backdrop-blur-sm">
                        <i className="bi bi-person mr-1"></i>
                        <span>{booking.guests} guests</span>
                      </div>
                      <div className="flex items-center justify-center bg-white/10 rounded px-1 py-0.5 backdrop-blur-sm">
                        <i className="bi bi-moon mr-1"></i>
                        <span>{booking.nights} nights</span>
                      </div>
                    </div>

                    {/* Dates and Payment Info */}
                    <div className="text-xs text-blue-100 mb-3 space-y-1">
                      <div className="flex items-center">
                        <i className="bi bi-calendar-check mr-1"></i>
                        <span>{format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="truncate">Guest: {booking.guestName}</span>
                        <span className={`font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewDetails(booking);
                        }} 
                        className="flex-1 text-center px-2 sm:px-3 py-2 sm:py-2.5 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-base sm:text-base font-medium cursor-pointer">
                        <i className="bi bi-eye mr-1"></i>View
                      </button>
                      
                      {booking.paymentStatus === 'due' && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePayNow(booking);
                          }} 
                          className="flex-1 text-center px-2 sm:px-3 py-2 sm:py-2.5 bg-gradient-to-r from-[#F20C8F] to-[#F20C8F]/90 text-white rounded-lg hover:from-[#D10B7A] hover:to-[#D10B7A]/90 transition-colors text-base sm:text-base font-medium cursor-pointer">
                          <i className="bi bi-credit-card mr-1"></i>Pay Now
                        </button>
                      )}
                      
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePrint(booking);
                        }} 
                        className="p-2 text-blue-100 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Print">
                        <i className="bi bi-printer text-base sm:text-lg"></i>
                      </button>
                      
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelClick(booking.id);
                          }} 
                          className="p-2 text-red-300 hover:bg-red-100/10 rounded-lg transition-colors cursor-pointer"
                          title="Cancel">
                          <i className="bi bi-x-circle text-base sm:text-lg"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-base sm:text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                <i className="bi bi-chevron-left"></i>
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(pageNum)} 
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-base sm:text-base font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum ? 'text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`} 
                      style={{ backgroundColor: currentPage === pageNum ? '#083A85' : undefined }}>
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-base sm:text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            <div className="flex items-center gap-2 text-base sm:text-base order-1 sm:order-2">
              <span className="text-gray-700 whitespace-nowrap">Go to page:</span>
              <input 
                type="number" 
                min="1" 
                max={totalPages} 
                value={goToPageInput} 
                onChange={(e) => setGoToPageInput(e.target.value)} 
                onBlur={(e) => handleGoToPage(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)} 
                className="w-12 sm:w-16 px-1 sm:px-2 py-1 border border-gray-300 rounded-lg text-base sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <span className="text-gray-700 whitespace-nowrap">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="flex items-center justify-center min-h-screen p-3 sm:p-4">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between z-10">
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">Booking Details</h2>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="cursor-pointer p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <i className="bi bi-x-lg text-lg sm:text-xl text-gray-600 hover:text-gray-900"></i>
                </button>
              </div>
              <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 140px)' }}>
                <div className="space-y-4 sm:space-y-6 text-base sm:text-base">
                  {/* Booking Information */}
                  <div>
                    <h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                      Booking Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Booking ID</span>
                        <span className="font-medium text-gray-900">{selectedBooking.id}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Booking Date</span>
                        <span className="font-medium text-gray-900">{format(selectedBooking.bookingDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Status</span>
                        <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div>
                    <h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                      Guest Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Name</span>
                        <span className="font-medium text-gray-900">{selectedBooking.guestName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Email</span>
                        <span className="font-medium text-gray-900 break-all sm:break-normal">{selectedBooking.guestEmail}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Phone</span>
                        <span className="font-medium text-gray-900">{selectedBooking.guestPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Number of Guests</span>
                        <span className="font-medium text-gray-900">{selectedBooking.guests}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Information */}
                  <div>
                    <h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                      Property Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Property Name</span>
                        <span className="font-medium text-gray-900">{selectedBooking.propertyName}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Address</span>
                        <span className="font-medium text-gray-900">{selectedBooking.propertyAddress}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Check-in</span>
                        <span className="font-medium text-gray-900">{format(selectedBooking.checkIn, 'EEEE, MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Check-out</span>
                        <span className="font-medium text-gray-900">{format(selectedBooking.checkOut, 'EEEE, MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Nights</span>
                        <span className="font-medium text-gray-900">{selectedBooking.nights}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                      Payment Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Total Amount</span>
                        <span className="text-lg font-bold text-gray-900">${selectedBooking.amount}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                        <span className="text-gray-600 font-medium sm:font-normal">Payment Status</span>
                        <span className={`font-medium ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                          {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {selectedBooking.specialRequests && (
                    <div>
                      <h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                        Special Requests
                      </h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                        <p className="text-gray-700">{selectedBooking.specialRequests}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap justify-end gap-2 sm:gap-3 z-10">
                <button 
                  onClick={() => handlePrint(selectedBooking)} 
                  className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer text-base sm:text-base">
                  <i className="bi bi-printer mr-1 sm:mr-2"></i>Print
                </button>
                {selectedBooking.paymentStatus === 'due' && (
                  <button 
                    onClick={() => handlePayNow(selectedBooking)} 
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#F20C8F] to-[#F20C8F]/90 text-white rounded-lg hover:from-[#D10B7A] hover:to-[#D10B7A]/90 transition-colors font-medium cursor-pointer text-base sm:text-base">
                    <i className="bi bi-credit-card mr-1 sm:mr-2"></i>Pay Now
                  </button>
                )}
                {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                  <button 
                    onClick={() => { handleCancelClick(selectedBooking.id); }} 
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer text-base sm:text-base">
                    <i className="bi bi-x-circle mr-1 sm:mr-2"></i>Cancel Booking
                  </button>
                )}
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-3 sm:px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer text-base sm:text-base" 
                  style={{ backgroundColor: '#083A85' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="flex items-center justify-center min-h-screen p-3 sm:p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
                <p className="text-sm text-gray-600 mt-1">Please provide a reason for cancelling this booking.</p>
              </div>
              <div className="px-6 py-4">
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="px-6 py-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setBookingToCancel(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-x-circle mr-2"></i>Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMyBookings;