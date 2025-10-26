"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/app/api/apiService';

// Types based on your backend service
interface BookingInfo {
  id: string;
  propertyId: number;
  propertyName: string;
  propertyImage?: string;
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

interface Property {
  id: number;
  name: string;
  location?: string;
  images?: string; // JSON string containing property images
}

type ViewMode = 'grid' | 'list';
type SortField = 'date' | 'amount' | 'property' | 'guest';

// Helper function to extract first image from property images JSON
const getFirstPropertyImage = (imagesJson?: string): string => {
  if (!imagesJson) {
    return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
  }

  try {
    const images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;

    // Check each category for images in priority order
    const categories = ['exterior', 'livingRoom', 'bedroom', 'kitchen', 'bathroom', 'diningArea', 'balcony', 'workspace', 'laundryArea', 'gym', 'childrenPlayroom'];

    for (const category of categories) {
      if (images[category] && Array.isArray(images[category]) && images[category].length > 0) {
        return images[category][0];
      }
    }

    // Fallback to placeholder
    return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
  } catch (error) {
    return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
  }
};

// Custom hook for debounced values
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const KYCPendingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-yellow-50 rounded-full flex items-center justify-center">
            <i className="bi bi-hourglass-split text-yellow-600 text-xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Verification pending</h3>
          <p className="text-gray-600 mb-6">We&apos;re reviewing your info. This usually takes a few hours.</p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingsPage: React.FC = () => {
  // Date formatting helper
  const format = useCallback((date: Date | string, formatStr: string) => {
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
  }, []);

  // States
  const [bookings, setBookings] = useState<BookingInfo[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For modal actions
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editNotes, setEditNotes] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
      setError('Failed to fetch user data');
    }
  };

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setPropertiesLoading(true);
      const response = await api.get('/properties/host/my-properties');
      
      if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data)) {
        const propertyList = response.data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          location: p.location || '',
          images: p.images
        }));
        setProperties(propertyList);
      } else {
        setProperties([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch properties');
      setProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      setError(null);

      const filters: any = {
        sortBy: sortField === 'date' ? 'checkIn' : sortField === 'amount' ? 'totalPrice' : sortField === 'property' ? 'propertyName' : 'guestName',
        sortOrder,
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

      const response = await api.get('/properties/host/bookings', {
        params: {
          ...filters,
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearchTerm || undefined
        }
      });

      if (response.data && response.data.success && response.data.data) {
        const fetchedBookings = (response.data.data.bookings || []).map((b: BookingInfo) => {
          // Find the property to get its images
          const property = properties.find(p => p.id === b.propertyId);
          const propertyImage = property?.images
            ? getFirstPropertyImage(property.images)
            : 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';

          return {
            ...b,
            propertyImage
          };
        });
        setBookings(fetchedBookings);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setBookingsLoading(false);
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, propertyFilter, dateRange, sortField, sortOrder]);

  useEffect(() => {
    fetchProperties();
    fetchUserData();
  }, [fetchProperties]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filtered and sorted bookings (minimal since server-side)
  const filteredAndSortedBookings = useMemo(() => bookings, [bookings]);

  const paginatedBookings = useMemo(() => filteredAndSortedBookings, [filteredAndSortedBookings]);

  // Note: For accurate totalPages, need server to provide total count
  const totalPages = 1; // Placeholder; update with response.data.data.totalPages if available

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = bookings.reduce((acc, booking) => {
      acc.total += 1;
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      acc.totalRevenue += booking.totalPrice;
      return acc;
    }, {
      total: 0,
      confirmed: 0,
      pending: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    });

    return {
      ...stats,
      averageBookingValue: stats.total > 0 ? stats.totalRevenue / stats.total : 0,
      occupancyRate: stats.total > 0 ? Math.round((stats.confirmed + stats.completed) / stats.total * 100) : 0,
    };
  }, [bookings]);

  // Handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const handleViewDetails = useCallback((booking: BookingInfo) => {
    setSelectedBooking(booking);
    setShowModal(true);
  }, []);

  const handleEditBooking = useCallback((booking: BookingInfo) => {
    if (!checkKYCStatus()) return;
    setSelectedBooking(booking);
    setEditNotes(booking.message || '');
    setShowEditModal(true);
  }, [user]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedBooking) return;

    try {
        setActionLoading(true);
        await api.put(`/bookings/properties/${selectedBooking.id}`, { message: editNotes });
        
        await fetchBookings();
        setShowEditModal(false);
        alert('Booking message updated successfully!');
    } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to update booking message');
    } finally {
        setActionLoading(false);
    }
  }, [selectedBooking, editNotes, fetchBookings]);

  // CORE FUNCTION TO UPDATE BOOKING STATUS
  const handleUpdateBookingStatus = useCallback(async (bookingId: string, status: 'confirmed' | 'cancelled', reason?: string) => {
    if (!checkKYCStatus()) return;

    try {
        setActionLoading(true);
        const payload: { status: string; message?: string } = { status };
        if (reason) {
            payload.message = reason;
        }

        await api.put(`/bookings/properties/${bookingId}`, payload);

        await fetchBookings(); // Refresh the list
        setShowModal(false);   // Close the details modal
        alert(`Booking successfully ${status}.`);
    } catch (error: any) {
        alert(error.response?.data?.message || `Failed to update booking status.`);
    } finally {
        setActionLoading(false);
    }
  }, [fetchBookings, user]);

  // Specific handler for confirming
  const handleConfirmBooking = useCallback((bookingId: string) => {
    if (confirm('Are you sure you want to confirm this booking?')) {
        handleUpdateBookingStatus(bookingId, 'confirmed');
    }
  }, [handleUpdateBookingStatus]);

  // Specific handler for cancelling
  const handleCancelBooking = useCallback((bookingId: string) => {
    const reason = prompt('Please provide a reason for cancellation (optional):');
    if (reason !== null) { // User didn't click cancel on the prompt
        handleUpdateBookingStatus(bookingId, 'cancelled', reason || 'Booking cancelled by host.');
    }
  }, [handleUpdateBookingStatus]);

  const handlePrint = useCallback((booking: BookingInfo) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Booking ${booking.id}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.5; }
              h1 { font-size: 24px; font-weight: 600; margin-bottom: 24px; }
              .detail { margin-bottom: 12px; }
              .label { font-weight: 600; display: inline-block; width: 160px; }
            </style>
          </head>
          <body>
            <h1>Booking details</h1>
            <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
            <div class="detail"><span class="label">Property:</span> ${booking.propertyName}</div>
            <div class="detail"><span class="label">Guest:</span> ${booking.guestName}</div>
            <div class="detail"><span class="label">Email:</span> ${booking.guestEmail}</div>
            <div class="detail"><span class="label">Check-in:</span> ${format(booking.checkIn, 'MMM dd, yyyy')}</div>
            <div class="detail"><span class="label">Check-out:</span> ${format(booking.checkOut, 'MMM dd, yyyy')}</div>
            <div class="detail"><span class="label">Guests:</span> ${booking.guests}</div>
            <div class="detail"><span class="label">Total:</span> $${booking.totalPrice}</div>
            <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [format]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'confirmed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'cancelled': return 'bi-x-circle';
      case 'completed': return 'bi-check-square';
      default: return 'bi-calendar';
    }
  }, []);

  // Booking Detail Modal
  const BookingDetailModal = () => {
    if (!selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">Reservation details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <img 
              src={selectedBooking.propertyImage} 
              alt={selectedBooking.propertyName}
              className="w-full h-64 object-cover rounded-2xl mb-8"
            />

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-4">About the trip</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates</span>
                    <span className="font-medium text-right">{format(selectedBooking.checkIn, 'MMM dd')} – {format(selectedBooking.checkOut, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests</span>
                    <span className="font-medium">{selectedBooking.guests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Guest</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{selectedBooking.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{selectedBooking.guestEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mb-8">
              <h3 className="font-semibold mb-4">Payout</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total payout</span>
                  <span className="font-medium text-xl">${selectedBooking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedBooking.message && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Message from guest</h3>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-xl">{selectedBooking.message}</p>
              </div>
            )}
          </div>
          
          {/* UPDATED ACTION BUTTONS SECTION */}
          <div className="border-t p-8 flex flex-wrap justify-end gap-3 bg-gray-50 rounded-b-3xl">
            <button
                onClick={() => handlePrint(selectedBooking)}
                className="px-6 py-3 bg-gray-100 text-black rounded-full font-medium hover:bg-gray-200 transition"
            >
                Print
            </button>
            <button
                onClick={() => {
                    setShowModal(false);
                    handleEditBooking(selectedBooking);
                }}
                className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
                Message Guest
            </button>

            {selectedBooking.status === 'pending' && (
                <button
                    onClick={() => handleConfirmBooking(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                    {actionLoading ? 'Confirming...' : 'Confirm Booking'}
                </button>
            )}

            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
                <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={actionLoading}
                    className="px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                    {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
            )}
          </div>

        </div>
      </div>
    );
  };

  if (propertiesLoading || (loading && bookings.length === 0)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {propertiesLoading ? 'Loading your listings...' : 'Loading reservations...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchBookings}
            className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>

      <div className="max-w-8xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Reservations</h1>
          <p className="text-gray-600">Manage your upcoming and past guest stays</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total reservations</p>
            <p className="text-3xl font-bold">{summaryStats.total}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Upcoming</p>
            <p className="text-3xl font-bold">{summaryStats.confirmed + summaryStats.pending}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold">{summaryStats.completed}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Earnings</p>
            <p className="text-3xl font-bold">${(summaryStats.totalRevenue / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {/* Filters and View Mode */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-black font-medium"
          >
            <i className="bi bi-funnel text-xl"></i>
            Filters
            {(statusFilter !== 'all' || propertyFilter !== 'all' || searchTerm || (dateRange.start && dateRange.end)) && (
              <span className="bg-black text-white text-xs rounded-full px-2 ml-2">1+</span>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <i className="bi bi-grid-3x3-gap text-xl"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <i className="bi bi-list text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-8 p-6 border border-gray-200 rounded-2xl animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Search by guest, listing..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              />
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black appearance-none"
              >
                <option value="all">All properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id.toString()}>{property.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black appearance-none"
              >
                <option value="all">All status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black w-full"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && paginatedBookings.length === 0 && (
          <div className="text-center py-24">
            <i className="bi bi-calendar-x text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No reservations</h3>
            <p className="text-gray-600">When you have reservations, they&apos;ll show up here.</p>
          </div>
        )}

        {/* Grid View */}
        {!loading && paginatedBookings.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedBookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={booking.propertyImage}
                  alt={booking.propertyName}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{booking.propertyName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{booking.guestName} • {booking.guests} guests</p>
                  <p className="text-sm text-gray-500 mb-4">{format(booking.checkIn, 'MMM dd, yyyy')} – {format(booking.checkOut, 'MMM dd, yyyy')}</p>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium text-xl">${booking.totalPrice.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(booking)}
                    className="w-full py-3 border border-black rounded-full font-medium hover:bg-gray-50 transition"
                  >
                    View details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && paginatedBookings.length > 0 && viewMode === 'list' && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-6 font-medium text-gray-600">Property</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Guest</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Dates</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(booking)}>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <img src={booking.propertyImage} alt="" className="w-16 h-10 rounded-lg object-cover mr-4" />
                      <span className="font-medium">{booking.propertyName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">{booking.guestName}</td>
                  <td className="py-4 px-6 text-gray-600">{format(booking.checkIn, 'MMM dd')} – {format(booking.checkOut, 'MMM dd')}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium">${booking.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 border border-gray-300 rounded-full font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 border border-gray-300 rounded-full font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && <BookingDetailModal />}

      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold">Message Guest</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <label className="block text-sm font-medium mb-2">Message</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-black resize-none h-32"
              placeholder="Add a note or message to the guest..."
            />

            <button
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="w-full mt-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {actionLoading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
    </div>
  );
};

export default BookingsPage;