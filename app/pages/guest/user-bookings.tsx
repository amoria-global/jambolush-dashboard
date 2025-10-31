"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../api/apiService';
import AlertNotification from '@/app/components/notify';
import { encodeId, createViewDetailsUrl } from '@/app/utils/encoder';

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
  paymentStatus: 'intiated' | 'completed' | 'refunded' | 'pending' | 'failed' | 'processing' | 'accepted';
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
  const router = useRouter();

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

  // Helper function to extract first image from property images JSON
  const getFirstPropertyImage = (imagesJson?: any): string => {
    if (!imagesJson) {
      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    }

    try {
      const images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;
      const categories = ['exterior', 'livingRoom', 'bedroom', 'kitchen', 'bathroom', 'diningArea', 'balcony', 'workspace', 'laundryArea', 'gym', 'childrenPlayroom'];

      for (const category of categories) {
        if (images[category] && Array.isArray(images[category]) && images[category].length > 0) {
          return images[category][0];
        }
      }

      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    } catch (error) {
      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    }
  };

  // Transform backend booking data to frontend format
  const transformBookingData = (backendBooking: any): Booking => {
    const propertyImage = getFirstPropertyImage(backendBooking.property?.images);

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

      const filters: any = {};
      
      if (statusFilter !== 'all') {
        filters.status = [statusFilter];
      }
      
      if (dateRange.start) filters.checkInDate = dateRange.start;
      if (dateRange.end) filters.checkOutDate = dateRange.end;
      if (searchTerm) filters.search = searchTerm;
      
      filters.sortBy = sortField;
      filters.sortOrder = sortOrder;
      filters.page = 1;
      filters.limit = 100;

      const response = await api.searchPropertyBookings(filters);
      
      if (response.data.success && response.data.data) {
        const transformedBookings = response.data.data.bookings.map(transformBookingData);
        setBookings(transformedBookings);
      } else {
        throw new Error(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to load bookings. Please try again.';
      setError(errorMessage);
      
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

  // Frontend filtering and sorting
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
    const url = createViewDetailsUrl(booking.id, 'booking');
    router.push(url);
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
      await fetchBookings();
      
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
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; padding: 40px; color: #222; }
          h1 { color: #083A85; font-size: 32px; margin-bottom: 32px; }
          .section { margin-bottom: 32px; }
          .section-title { font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #717171; margin-bottom: 16px; }
          .detail { margin-bottom: 12px; display: flex; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #EBEBEB; }
          .label { color: #717171; }
          .value { font-weight: 500; color: #222; }
        </style></head><body>
          <h1>Booking confirmation</h1>
          <div class="section">
            <div class="section-title">Reservation details</div>
            <div class="detail"><span class="label">Confirmation code</span><span class="value">${booking.id}</span></div>
            <div class="detail"><span class="label">Guest name</span><span class="value">${booking.guestName}</span></div>
            <div class="detail"><span class="label">Property</span><span class="value">${booking.propertyName}</span></div>
            <div class="detail"><span class="label">Check-in</span><span class="value">${format(booking.checkIn, 'EEEE, MMM dd, yyyy')}</span></div>
            <div class="detail"><span class="label">Check-out</span><span class="value">${format(booking.checkOut, 'EEEE, MMM dd, yyyy')}</span></div>
            <div class="detail"><span class="label">Total amount</span><span class="value">$${booking.amount}</span></div>
            <div class="detail"><span class="label">Booking status</span><span class="value">${booking.status}</span></div>
          </div>
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
      const paymentUrl = `https://jambolush.com/spaces/${encodedPropertyId}/confirm-and-pay?bookingId=${encodedBookingId}`;
      window.open(paymentUrl, '_blank');
    } else {
      showNotification('Property information not available for payment', 'error');
    }
  };

  // Styling helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'refunded': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'checked_in': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'checked-in': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'checked_out': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'checked-out': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-700';
      case 'failed': return 'text-red-700';
      case 'initiated': return 'text-amber-700';
      case 'pending': return 'text-amber-700';
      case 'processing': return 'text-blue-700';
      case 'refunded': return 'text-gray-700';
      case 'accepted': return 'text-emerald-700';
      default: return 'text-gray-700';
    }
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <i className="bi bi-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load bookings</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors font-medium">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification.show && (
        <AlertNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Trips</h1>
        <p className="text-gray-600">Manage and track all your upcoming and past stays</p>
      </div>

      {/* Filters Section - Airbnb Style */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search by property or guest name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] transition-all"
            />
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full bg-white hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all">
            <option value="all">All reservations</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full bg-white hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all">
            <option value="all">All properties</option>
            {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-full hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all"
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-full hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-full hover:border-gray-400 bg-white transition-all disabled:opacity-50">
            <i className={`bi bi-arrow-clockwise mr-2 ${loading ? 'animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>

        {/* Results Count & View Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-gray-700">
            <span className="font-medium">{filteredBookings.length}</span> bookings found
          </p>
          
          {/* View Mode Toggle - Airbnb Style */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <i className="bi bi-grid-3x3-gap-fill mr-2"></i>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <i className="bi bi-list mr-2"></i>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="bi bi-calendar-x text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">Try adjusting your filters or make a new reservation</p>
        </div>
      )}

      {/* Grid View - Airbnb Style */}
      {!loading && filteredBookings.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="group cursor-pointer"
              onClick={() => handleViewDetails(booking)}
            >
              {/* Card */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={booking.propertyImage}
                    alt={booking.propertyName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm bg-white/90 ${getStatusColor(booking.status).replace('bg-', '').replace('50', '600')}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Property Name */}
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">
                    {booking.propertyName}
                  </h3>
                  
                  {/* Location */}
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    {booking.propertyAddress}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center text-sm text-gray-700 mb-3">
                    <span>{format(booking.checkIn, 'MMM dd')}</span>
                    <span className="mx-2">–</span>
                    <span>{format(booking.checkOut, 'MMM dd, yyyy')}</span>
                  </div>

                  {/* Divider */}
                  <div className="border-t pt-3 mb-3"></div>

                  {/* Price & Payment Status */}
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">${booking.amount}</span>
                      <span className="text-sm text-gray-500 ml-1">total</span>
                    </div>
                    <span className={`text-sm font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus === 'completed' ? 'Paid' : booking.paymentStatus}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(booking);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-sm font-medium">
                      View details
                    </button>
                    {booking.paymentStatus !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayNow(booking);
                        }}
                        className="flex-1 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm font-medium">
                        Pay now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View - Airbnb Style */}
      {!loading && filteredBookings.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('propertyName')}
                    className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900">
                    Property
                    {sortField === 'propertyName' && (
                      <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-xs`}></i>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('checkIn')}
                    className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900">
                    Check-in
                    {sortField === 'checkIn' && (
                      <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-xs`}></i>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Guest
                  </span>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900">
                    Status
                    {sortField === 'status' && (
                      <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-xs`}></i>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('amount')}
                    className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900">
                    Total
                    {sortField === 'amount' && (
                      <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} text-xs`}></i>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={booking.propertyImage}
                        alt={booking.propertyName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{booking.propertyName}</div>
                        <div className="text-sm text-gray-500">{booking.propertyAddress}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{format(booking.checkIn, 'MMM dd, yyyy')}</div>
                    <div className="text-sm text-gray-500">{booking.nights} nights</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{booking.guestName}</div>
                    <div className="text-sm text-gray-500">{booking.guests} guests</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">${booking.amount}</div>
                    <div className={`text-sm ${getPaymentStatusColor(booking.paymentStatus)}`}>
                      {booking.paymentStatus === 'completed' ? 'Paid' : booking.paymentStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View details">
                        <i className="bi bi-eye text-gray-600"></i>
                      </button>
                      {booking.paymentStatus !== 'completed' && (
                        <button
                          onClick={() => handlePayNow(booking)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Pay now">
                          <i className="bi bi-credit-card text-green-600"></i>
                        </button>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelClick(booking.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancel booking">
                          <i className="bi bi-x-circle text-red-600"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - Airbnb Style */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-left"></i>
            </button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#083A85] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}>
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                  return <span key={pageNum} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-right"></i>
            </button>
          </nav>
        </div>
      )}

      {/* Cancel Modal - Airbnb Style */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowCancelModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancel booking</h3>
                <p className="text-gray-600 mb-4">Please tell us why you're canceling. This helps us improve our service.</p>
                
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Reason for cancellation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] resize-none h-32"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setBookingToCancel(null);
                      setCancelReason('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Keep booking
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={!cancelReason.trim()}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:hover:bg-red-600">
                    Cancel booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMyBookings;