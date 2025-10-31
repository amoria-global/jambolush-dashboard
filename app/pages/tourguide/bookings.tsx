"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/api/apiService'; // Your API service
import { createViewDetailsUrl } from '@/app/utils/encoder';
// Updated types to match server response for tour bookings
interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
}
interface Tour {
  title: string;
  description: string;
  category: string;
  type: string;
  duration: number;
  difficulty: string;
  location: string;
  images: {
    main: string[];
    gallery: string[];
  };
  price: number;
  currency: string;
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  meetingPoint: string;
}
interface Schedule {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  availableSlots: number;
  bookedSlots: number;
}
interface TourGuide {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string;
  bio: string | null;
  rating: number;
  totalTours: number;
}
interface Participant {
  name: string;
  age: number;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  specialRequirements: string[];
  medicalConditions: string[];
}
// It's a good practice to make nested objects optional if the API might not return them
interface Booking {
  id: string;
  tourId: string;
  tour?: Tour; // <-- Best practice: Mark as optional
  scheduleId: string;
  schedule?: Schedule; // <-- Best practice: Mark as optional
  tourGuideId: number;
  tourGuide: TourGuide;
  userId: number;
  user: User;
  numberOfParticipants: number;
  participants: Participant[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'unpaid';
  checkInStatus: 'not_checked_in' | 'checked_in';
  specialRequests: string;
  refundAmount: number | null;
  refundReason: string | null;
  bookingDate: string;
  createdAt: string;
  updatedAt: string;
}
interface BookingDetailData {
  booking: Booking;
  // Add more if needed, e.g., related bookings or stats
}
type ViewMode = 'grid' | 'list';
type SortField = 'userName' | 'bookingDate' | 'totalAmount' | 'status';
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
interface BookingSearchFilters {
  search?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'unpaid';
  sortBy?: 'userName' | 'bookingDate' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}
const TourBookingsPage: React.FC = () => {
  const router = useRouter();

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingDetailData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [tourFilter, setTourFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  // Sort states
  const [sortField, setSortField] = useState<SortField>('bookingDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // Edit modal states
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');
  const [editCheckInStatus, setEditCheckInStatus] = useState<string>('');
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
  // Fetch bookings data from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      // Build filters object
      const filters: BookingSearchFilters = {};
      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      if (statusFilter !== 'all') {
        filters.status = statusFilter as 'pending' | 'confirmed' | 'cancelled' | 'completed';
      }
      if (paymentStatusFilter !== 'all') {
        filters.paymentStatus = paymentStatusFilter as 'pending' | 'paid' | 'refunded' | 'unpaid';
      }
      filters.sortBy = sortField;
      filters.sortOrder = sortOrder;
      if (dateRangeFilter === 'custom' && (customDateRange.start || customDateRange.end)) {
        if (customDateRange.start) filters.startDate = customDateRange.start;
        if (customDateRange.end) filters.endDate = customDateRange.end;
      } else if (dateRangeFilter !== 'all') {
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
        if (filters[key as keyof BookingSearchFilters] === undefined) {
          delete filters[key as keyof BookingSearchFilters];
        }
      });
      console.log('Sending filters to backend:', filters);
      // Make API call (adapt endpoint)
      const response = await api.get('/bookings/tourguide/bookings', {
        params: filters
      });
      if (response.data.success) {
        setBookings(response.data.data.bookings);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };
  // Fetch individual booking details
  const fetchBookingDetails = async (bookingId: string): Promise<BookingDetailData | null> => {
    try {
      setLoadingDetails(true);
      const response: any = await api.get(`/bookings/tours/${bookingId}`);
      if (response.data.success) {
        return { booking: response.data.data };
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch booking details');
    } finally {
      setLoadingDetails(false);
    }
  };
  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);
  // Fetch bookings on mount and filter changes
  useEffect(() => {
    fetchBookings();
  }, [searchTerm, dateRangeFilter, customDateRange, sortField, sortOrder, statusFilter, paymentStatusFilter]);
  // Update goToPageInput
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);
  // Calculate summary stats
  const summaryStats: any = useMemo(() => {
    const today = new Date();
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + 7);
    return {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      upcomingThisWeek: bookings.filter(b => 
        b.schedule && // FIX #1: Guard against missing schedule
        new Date(b.schedule.startDate) >= today && 
        new Date(b.schedule.startDate) <= thisWeek
      ).length,
      revenue: bookings.reduce((sum, b) => sum + b.totalAmount, 0)
    };
  }, [bookings]);
  // Get unique tours for filter
  const uniqueTours = useMemo(() => {
    const tours = new Map();
    bookings.forEach(b => {
      // FIX #2: Guard against missing tour object
      if (b.tour && b.tour.title) {
        tours.set(b.tourId, b.tour.title)
      }
    });
    return Array.from(tours.entries()).map(([id, title]) => ({ id, title }));
  }, [bookings]);
  // Apply client-side filters (if any additional)
  useEffect(() => {
    let filtered = [...bookings];
    if (tourFilter !== 'all') {
      filtered = filtered.filter(booking => booking.tourId === tourFilter);
    }
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, tourFilter]);
  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  const handleViewDetails = async (booking: Booking) => {
    const url = createViewDetailsUrl(booking.id, 'tour-booking');
    router.push(url);
  };
  const handleEditBooking = async (booking: Booking) => {
    if (!checkKYCStatus()) return;
    setSelectedBooking(booking);
    if (!selectedBookingDetails) {
      try {
        const details = await fetchBookingDetails(booking.id);
        if (details) {
          setSelectedBookingDetails(details);
          setEditStatus(details.booking.status);
          setEditPaymentStatus(details.booking.paymentStatus);
          setEditSpecialRequests(details.booking.specialRequests || '');
          setEditCheckInStatus(details.booking.checkInStatus);
        }
      } catch (error) {
        console.error('Failed to load booking details for editing:', error);
        alert('Failed to load booking details. Please try again.');
        return;
      }
    } else {
      setEditStatus(selectedBookingDetails.booking.status);
      setEditPaymentStatus(selectedBookingDetails.booking.paymentStatus);
      setEditSpecialRequests(selectedBookingDetails.booking.specialRequests || '');
      setEditCheckInStatus(selectedBookingDetails.booking.checkInStatus);
    }
    setShowEditModal(true);
  };
  const handleSaveEdit = async () => {
    if (selectedBookingDetails) {
      try {
        const updateData = {
          status: editStatus,
          paymentStatus: editPaymentStatus,
          specialRequests: editSpecialRequests,
          checkInStatus: editCheckInStatus,
        };
        await api.put(`/bookings/tours/${selectedBookingDetails.booking.id}`, updateData);
        await fetchBookings();
        setShowEditModal(false);
        setShowDetailModal(false);
        alert('Booking updated successfully!');
      } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to update booking. Please try again.');
      }
    }
  };
  const handleDeleteBooking = async (bookingId: string) => {
    if (!checkKYCStatus()) return;
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        await api.delete(`/tours/guide/bookings/${bookingId}`);
        await fetchBookings();
        setShowDetailModal(false);
        alert('Booking deleted.');
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'checked_in': return 'bg-purple-100 text-purple-800';
      case 'checked-in': return 'bg-purple-100 text-purple-800';
      case 'checked_out': return 'bg-indigo-100 text-indigo-800';
      case 'checked-out': return 'bg-indigo-100 text-indigo-800';
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
  const getCheckInStatusColor = (status: string) => {
    switch (status) {
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'not_checked_in': return 'bg-yellow-100 text-yellow-800';
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
  // Show loading state
  if (loading) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-2 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
            <span className="ml-3 text-lg text-gray-600">Loading bookings...</span>
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
    <div className="pt-5">
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
      <div className="mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#083A85]">Tour Bookings</h1>
          <p className="text-gray-600 mt-2">Manage your tour bookings and user information</p>
        </div>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <i className="bi bi-calendar-check-fill text-2xl text-gray-400"></i>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.confirmed}</p>
              </div>
              <i className="bi bi-check-circle text-2xl text-green-500"></i>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <i className="bi bi-clock text-2xl text-yellow-500"></i>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.upcomingThisWeek}</p>
              </div>
              <i className="bi bi-calendar-week text-2xl text-blue-500"></i>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="User name, email or tour title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                />
                <i className="bi bi-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
            {/* Tour Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Tour</label>
              <select
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
              >
                <option value="all">All Tours</option>
                {uniqueTours.map(tour => (
                  <option key={tour.id} value={tour.id}>{tour.title}</option>
                ))}
              </select>
            </div>
            {/* Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Booking Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {/* Payment Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          {/* Date Range and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Date Range</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
                  />
                </div>
              </>
            )}
            {! (dateRangeFilter === 'custom') && (
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
                >
                  <option value="userName-asc">User Name (A-Z)</option>
                  <option value="userName-desc">User Name (Z-A)</option>
                  <option value="bookingDate-desc">Newest First</option>
                  <option value="bookingDate-asc">Oldest First</option>
                  <option value="totalAmount-desc">Highest Amount</option>
                  <option value="totalAmount-asc">Lowest Amount</option>
                  <option value="status-asc">Status (A-Z)</option>
                </select>
              </div>
            )}
          </div>
          {/* View Mode Toggle & Results Count */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-base text-gray-600">
              Showing {paginatedBookings.length} of {filteredBookings.length} bookings
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-[#083A85] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-[#083A85] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <i className="bi bi-list-ul mr-2"></i>List View
              </button>
            </div>
          </div>
        </div>
        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-12 text-center">
            <i className="bi bi-calendar-x text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">
              {bookings.length === 0 
                ? "No bookings yet"
                : "No bookings found"}
            </h3>
            <p className="text-gray-600 mt-2">
              {bookings.length === 0 
                ? "Your tour bookings will appear here once users book"
                : "Try adjusting your filters or search criteria"}
            </p>
          </div>
        )}
        {/* Grid View */}
        {!loading && filteredBookings.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((booking) => (
              <div key={booking.id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  {booking.user && (
                  <div className="flex items-center mb-4">
                    <img 
                      src={booking.user.profileImage || `https://ui-avatars.com/api/?name=${booking.user.firstName}+${booking.user.lastName}&background=FF385C&color=fff`} 
                      alt={`${booking.user.firstName} ${booking.user.lastName}`}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{`${booking.user.firstName} ${booking.user.lastName}`}</h3>
                      <p className="text-base text-gray-500">{booking.user.email}</p>
                    </div>
                    <span className={`px-2 py-1 text-base font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  )}
                  <div className="space-y-2 mb-4">
                    <p className="text-base text-gray-600">
                      <i className="bi bi-map mr-2"></i>
                      Tour: {booking.tour?.title || 'N/A'}
                    </p>
                    <p className="text-base text-gray-600">
                      <i className="bi bi-calendar-event mr-2"></i>
                      Date: {booking.schedule ? format(booking.schedule.startDate, 'MMM dd, yyyy') : 'N/A'}
                    </p>
                    <p className="text-base text-gray-600">
                      <i className="bi bi-people mr-2"></i>
                      Participants: {booking.numberOfParticipants}
                    </p>
                  </div>
                  <div className="border-t pt-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base text-gray-600">Total Amount</span>
                      <span className="text-lg font-semibold text-gray-900">${booking.totalAmount} {booking.currency}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">Payment</span>
                      <span className={`text-base font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-base text-gray-500 italic mb-3">
                    <i className="bi bi-clock mr-1"></i>
                    Booked: {format(booking.bookingDate, 'MMM dd, yyyy')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(booking)}
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
        {!loading && filteredBookings.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('userName')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        User
                        <i className={`bi bi-chevron-${sortField === 'userName' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('bookingDate')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Booking Date
                        <i className={`bi bi-chevron-${sortField === 'bookingDate' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('totalAmount')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Amount
                        <i className={`bi bi-chevron-${sortField === 'totalAmount' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {booking.user &&  <div className="flex items-center">
                          <img 
                            src={booking.user.profileImage || `https://ui-avatars.com/api/?name=${booking.user.firstName}+${booking.user.lastName}&background=FF385C&color=fff`} 
                            alt={`${booking.user.firstName} ${booking.user.lastName}`}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-base font-medium text-gray-900">{`${booking.user.firstName} ${booking.user.lastName}`}</div>
                          </div>
                        </div>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{booking.tour?.title || 'N/A'}</div>
                        <div className="text-base text-gray-500">{booking.tour?.location || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {format(booking.bookingDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-base text-gray-500">
                          Tour: {booking.schedule ? format(booking.schedule.startDate, 'MMM dd') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {booking.numberOfParticipants}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          ${booking.totalAmount} {booking.currency}
                        </div>
                        <div className="text-base text-gray-500">
                          {booking.paymentStatus}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="text-[#083A85] hover:text-[#083A85]/80 mr-3 cursor-pointer"
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
                          ? 'text-white bg-[#083A85]'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
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
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"
              />
              <span className="text-base text-gray-600">of {totalPages}</span>
            </div>
          </div>
        )}
        {/* Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#083A85]"></div>
                    <span className="ml-3 text-lg text-gray-600">Loading details...</span>
                  </div>
                ) : selectedBookingDetails ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3">User Information</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <img 
                              src={selectedBookingDetails.booking.user.profileImage || `https://ui-avatars.com/api/?name=${selectedBookingDetails.booking.user.firstName}+${selectedBookingDetails.booking.user.lastName}&background=FF385C&color=fff`} 
                              alt={`${selectedBookingDetails.booking.user.firstName} ${selectedBookingDetails.booking.user.lastName}`}
                              className="w-16 h-16 rounded-full mr-4"
                            />
                            <div>
                              <p className="font-semibold text-xl text-gray-900">{`${selectedBookingDetails.booking.user.firstName} ${selectedBookingDetails.booking.user.lastName}`}</p>
                              <p className="text-gray-600">{selectedBookingDetails.booking.user.email}</p>
                              {selectedBookingDetails.booking.user.phone && (
                                <p className="text-gray-600">{selectedBookingDetails.booking.user.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Tour Details</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Title:</span>
                            <span className="font-medium">{selectedBookingDetails.booking.tour?.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium">{selectedBookingDetails.booking.tour?.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{selectedBookingDetails.booking.schedule ? format(selectedBookingDetails.booking.schedule.startDate, 'MMM dd, yyyy') : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">{selectedBookingDetails.booking.schedule?.startTime} - {selectedBookingDetails.booking.schedule?.endTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Participants:</span>
                            <span className="font-medium">{selectedBookingDetails.booking.numberOfParticipants}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Booking Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium">${selectedBookingDetails.booking.totalAmount} {selectedBookingDetails.booking.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedBookingDetails.booking.status)}`}>
                            {selectedBookingDetails.booking.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(selectedBookingDetails.booking.paymentStatus)}`}>
                            {selectedBookingDetails.booking.paymentStatus}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Check-in Status:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getCheckInStatusColor(selectedBookingDetails.booking.checkInStatus)}`}>
                            {selectedBookingDetails.booking.checkInStatus.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Special Requests:</span>
                          <span className="font-medium">{selectedBookingDetails.booking.specialRequests || 'None'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Participants</h3>
                      <div className="space-y-4">
                        {selectedBookingDetails.booking.participants.map((participant, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium">{participant.name} (Age: {participant.age})</p>
                            <p className="text-sm text-gray-600">Emergency Contact: {participant.emergencyContact.name} ({participant.emergencyContact.relationship}) - {participant.emergencyContact.phone}</p>
                            <p className="text-sm text-gray-600">Special Requirements: {participant.specialRequirements.join(', ') || 'None'}</p>
                            <p className="text-sm text-gray-600">Medical Conditions: {participant.medicalConditions.join(', ') || 'None'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleEditBooking(selectedBooking);
                        }}
                        className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <i className="bi bi-pencil mr-2"></i>
                        Edit Booking
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-red-600">Failed to load details.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Edit Modal */}
        {showEditModal && selectedBooking && selectedBookingDetails && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full animate-scale-in">
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
                <div className="mb-4">
                  <p className="text-base text-gray-600 mb-4">
                    User: <span className="font-semibold">{`${selectedBooking.user.firstName} ${selectedBooking.user.lastName}`}</span><br/>
                    Tour: <span className="font-semibold">{selectedBooking.tour?.title}</span>
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Booking Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Check-in Status
                      </label>
                      <select
                        value={editCheckInStatus}
                        onChange={(e) => setEditCheckInStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] cursor-pointer"
                      >
                        <option value="checked_in">Checked In</option>
                        <option value="not_checked_in">Not Checked In</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 mb-2">
                        Special Requests
                      </label>
                      <textarea
                        value={editSpecialRequests}
                        onChange={(e) => setEditSpecialRequests(e.target.value)}
                        placeholder="Add any notes or special requests..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-[#083A85] text-white rounded-lg transition-colors font-medium cursor-pointer"
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
        <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
      </div>
    </div>
  );
}
export default TourBookingsPage;