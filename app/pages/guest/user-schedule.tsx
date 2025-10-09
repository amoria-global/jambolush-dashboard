"use client";

import api from '@/app/api/apiService';
import React, { useState, useEffect, useMemo } from 'react';

// Combined booking interface that handles both property and tour bookings
interface UnifiedBooking {
  id: string;
  type: 'property' | 'tour';
  title: string;
  subtitle?: string; // Property location or tour guide name
  category?: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical' | 'accommodation' | 'experience';
  date: Date;
  startTime: string;
  endTime?: string;
  duration?: number; // in hours for tours, in days/nights for properties
  location: string;
  meetingPoint?: string;
  numberOfGuests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out';
  price: number;
  totalPrice?: number;
  currency: string;
  hostOrGuideName?: string;
  hostOrGuideContact?: string;
  specialRequests?: string;
  createdAt: Date;
  lastModified: Date;
  
  // Property-specific fields
  checkInDate?: Date;
  checkOutDate?: Date;
  roomType?: string;
  propertyType?: string;
  
  // Tour-specific fields
  tourType?: string;
  
  // Original API data for reference
  originalData?: any;
}

type ViewMode = 'calendar' | 'list';
type SortField = 'date' | 'title' | 'status' | 'guests' | 'type';
type SortOrder = 'asc' | 'desc';

const SchedulePage: React.FC = () => {
  // Date formatting helpers
  const format = (date: Date, formatStr: string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Invalid Date";
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const year = d.getFullYear();
    const month = d.getMonth();
    const dayOfMonth = d.getDate();
    const dayOfWeek = d.getDay();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${dayOfMonth.toString().padStart(2, '0')}, ${year}`;
      case 'MMMM yyyy':
        return `${fullMonths[month]} ${year}`;
      case 'MMM dd':
        return `${months[month]} ${dayOfMonth.toString().padStart(2, '0')}`;
      case 'EEE, MMM dd':
        return `${days[dayOfWeek]}, ${months[month]} ${dayOfMonth.toString().padStart(2, '0')}`;
      default:
        return d.toLocaleDateString();
    }
  };

  // States
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<UnifiedBooking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<UnifiedBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<UnifiedBooking> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'property', 'tour'
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Helper function to safely extract array data
  const extractArray = (data: any, fallback: any[] = []): any[] => {
    if (!data) {
      console.log('No data provided, returning fallback:', fallback);
      return fallback;
    }
    
    // Handle nested API response structure
    if (data.data && data.data.data) {
      if (data.data.data.bookings && Array.isArray(data.data.data.bookings)) {
        return data.data.data.bookings;
      }
      if (Array.isArray(data.data.data)) {
        return data.data.data;
      }
    }
    
    if (data.data) {
      if (data.data.bookings && Array.isArray(data.data.bookings)) {
        return data.data.bookings;
      }
      if (Array.isArray(data.data)) {
        return data.data;
      }
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    console.log('No array found, returning fallback. Data structure:', typeof data, data);
    return fallback;
  };

  // Transform property booking data
  const transformPropertyBooking = (apiBooking: any): UnifiedBooking => {
    const checkInDate = new Date(apiBooking.checkInDate || apiBooking.startDate || apiBooking.createdAt);
    const checkOutDate = new Date(apiBooking.checkOutDate || apiBooking.endDate || checkInDate);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: apiBooking.id,
      type: 'property',
      title: apiBooking.property?.name || apiBooking.propertyName || 'Property Booking',
      subtitle: apiBooking.property?.location || apiBooking.location || 'Location TBD',
      category: 'accommodation',
      date: checkInDate,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      startTime: apiBooking.checkInTime || '15:00',
      endTime: apiBooking.checkOutTime || '11:00',
      duration: nights,
      location: apiBooking.property?.location || apiBooking.location || 'Location TBD',
      numberOfGuests: apiBooking.guests || apiBooking.numberOfGuests || 1,
      status: apiBooking.status || 'pending',
      price: apiBooking.pricePerNight || apiBooking.price || 0,
      totalPrice: apiBooking.totalPrice || apiBooking.price || 0,
      currency: apiBooking.currency || 'KES',
      hostOrGuideName: apiBooking.property?.host?.name || apiBooking.hostName || 'Host TBD',
      hostOrGuideContact: apiBooking.property?.host?.contact || apiBooking.hostContact || '',
      specialRequests: apiBooking.specialRequests || apiBooking.notes,
      roomType: apiBooking.roomType || 'Standard Room',
      propertyType: apiBooking.property?.type || apiBooking.propertyType || 'hotel',
      createdAt: new Date(apiBooking.createdAt),
      lastModified: new Date(apiBooking.updatedAt || apiBooking.lastModified || apiBooking.createdAt),
      originalData: apiBooking
    };
  };

  // Transform tour booking data
  const transformTourBooking = (apiBooking: any): UnifiedBooking => {
    const bookingDate = new Date(apiBooking.schedule?.startDate || apiBooking.startDate || apiBooking.createdAt);
    const startTime = apiBooking.schedule?.startTime || apiBooking.startTime || '10:00';
    const duration = apiBooking.tour?.duration || apiBooking.duration || 2;
    const endTimeCalc = `${(parseInt(startTime.split(':')[0]) + duration).toString().padStart(2, '0')}:00`;

    return {
      id: apiBooking.id,
      type: 'tour',
      title: apiBooking.tour?.title || apiBooking.tour?.name || 'Tour Booking',
      subtitle: apiBooking.tour?.guide?.name || apiBooking.guideName || 'Guide TBD',
      category: apiBooking.tour?.type || 'city',
      tourType: apiBooking.tour?.type || 'city',
      date: bookingDate,
      startTime: startTime,
      endTime: apiBooking.schedule?.endTime || apiBooking.endTime || endTimeCalc,
      duration: duration,
      location: apiBooking.tour?.location || apiBooking.location || 'Location TBD',
      meetingPoint: apiBooking.meetingPoint || 'Meeting point TBD',
      numberOfGuests: apiBooking.guests || apiBooking.numberOfGuests || 1,
      status: apiBooking.status || 'pending',
      price: apiBooking.price || apiBooking.totalPrice || 0,
      totalPrice: apiBooking.totalPrice || apiBooking.price || 0,
      currency: apiBooking.currency || 'KES',
      hostOrGuideName: apiBooking.tour?.guide?.name || apiBooking.guideName || 'Guide TBD',
      hostOrGuideContact: apiBooking.tour?.guide?.contact || apiBooking.guideContact || '',
      specialRequests: apiBooking.specialRequests || apiBooking.notes,
      createdAt: new Date(apiBooking.createdAt),
      lastModified: new Date(apiBooking.updatedAt || apiBooking.lastModified || apiBooking.createdAt),
      originalData: apiBooking
    };
  };

  // Load all bookings from API
  useEffect(() => {
    const loadAllBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const [propertyResponse, tourResponse] = await Promise.allSettled([
          api.get('/bookings/guest/history'),
          api.get('/bookings/guest/tours')
        ]);

        const allBookings: UnifiedBooking[] = [];

        // Process property bookings
        if (propertyResponse.status === 'fulfilled') {
          const propertyBookings = extractArray(propertyResponse.value);
          const transformedProperties = propertyBookings.map(transformPropertyBooking);
          allBookings.push(...transformedProperties);
        } else {
          console.warn('Failed to load property bookings:', propertyResponse.reason);
        }

        // Process tour bookings
        if (tourResponse.status === 'fulfilled') {
          const tourBookings = extractArray(tourResponse.value);
          const transformedTours = tourBookings.map(transformTourBooking);
          allBookings.push(...transformedTours);
        } else {
          console.warn('Failed to load tour bookings:', tourResponse.reason);
        }

        console.log('All transformed bookings:', allBookings);
        setBookings(allBookings);
      } catch (err: any) {
        const errorMessage = err?.data?.message || err?.message || 'Failed to load bookings. Please try again.';
        setError(errorMessage);
        console.error('Bookings loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllBookings();
  }, []);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = bookings.filter(b => new Date(b.date) >= today && ['confirmed', 'checked_in'].includes(b.status));
    const completed = bookings.filter(b => ['completed', 'checked_out'].includes(b.status));
    const properties = bookings.filter(b => b.type === 'property');
    const tours = bookings.filter(b => b.type === 'tour');
    
    return {
      total: bookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      properties: properties.length,
      tours: tours.length,
      totalGuests: upcoming.reduce((sum, b) => sum + b.numberOfGuests, 0),
      totalSpent: completed.reduce((sum, b) => sum + (b.totalPrice || b.price), 0)
    };
  }, [bookings]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(b => b.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(b => b.category === categoryFilter);
    }

    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'title': comparison = (a.title || '').localeCompare(b.title || ''); break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
        case 'guests': comparison = a.numberOfGuests - b.numberOfGuests; break;
        case 'type': comparison = a.type.localeCompare(b.type); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, typeFilter, categoryFilter, dateRange, sortField, sortOrder]);

  // Pagination for list view
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Calendar view data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const weeks: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[][] = [];
    let currentDate = startDate;
    
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(currentDate);
        const dayBookings = filteredBookings.filter(b => {
          const bookingDate = new Date(b.date);
          
          // For property bookings, check if date falls within stay period
          if (b.type === 'property' && b.checkInDate && b.checkOutDate) {
            return date >= new Date(b.checkInDate) && date <= new Date(b.checkOutDate);
          }
          
          // For tour bookings, check exact date match
          return bookingDate.toDateString() === date.toDateString();
        });
        
        week.push({
          date: date,
          bookings: dayBookings,
          isCurrentMonth: date.getMonth() === month
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      if (currentDate.getMonth() !== month && weekIndex >= 4) break;
    }
    return weeks;
  }, [currentMonth, filteredBookings]);

  // Refresh data function
  const refreshData = () => {
    window.location.reload();
  };

  // Handlers
  const handleSort = (field: SortField) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handleViewDetails = (booking: UnifiedBooking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleAddNew = (type?: 'property' | 'tours') => {
    if (type === 'property') {
      window.location.href = 'https://jambolush.com/';
    } else if (type === 'tours') {
      window.location.href = 'https://jambolush.com/all/tours';
    } else {
      // Show selection modal or redirect to main booking page
      window.location.href = '/';
    }
  };

  const handleEdit = (booking: UnifiedBooking) => {
    setEditingBooking(booking);
    setShowAddEditModal(true);
  };

  const handleSaveBooking = async () => {
    if (!editingBooking) return;

    try {
      const endpoint = editingBooking.type === 'property' 
        ? `/bookings/properties/${editingBooking.id}`
        : `/bookings/tours/${editingBooking.id}`;

      await api.put(endpoint, {
        specialRequests: editingBooking.specialRequests,
        numberOfGuests: editingBooking.numberOfGuests
      });

      refreshData();
      setShowAddEditModal(false);
      setEditingBooking(null);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking. Please try again.');
    }
  };

  const handleCancelBooking = async (booking: UnifiedBooking) => {
    const bookingType = booking.type === 'property' ? 'property booking' : 'tour';
    if (window.confirm(`Are you sure you want to cancel your ${bookingType} for "${booking.title}"?`)) {
      try {
        const endpoint = booking.type === 'property' 
          ? `/bookings/properties/${booking.id}/cancel`
          : `/bookings/tours/${booking.id}/cancel`;

        await api.patch(endpoint);
        refreshData();
        setShowDetailModal(false);
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };
  
  // Helper Functions
  const getStatusColor = (status: UnifiedBooking['status']) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: UnifiedBooking['status']) => {
    const icons = {
      confirmed: 'bi-calendar-check',
      pending: 'bi-hourglass-split',
      cancelled: 'bi-calendar-x',
      completed: 'bi-check-circle',
      checked_in: 'bi-box-arrow-in-right',
      checked_out: 'bi-box-arrow-left'
    };
    return icons[status] || 'bi-calendar';
  };

  const getTypeIcon = (type: UnifiedBooking['type']) => {
    return type === 'property' ? 'bi-house' : 'bi-map';
  };

  const getCategoryIcon = (category: UnifiedBooking['category']) => {
    const icons: any = {
      city: 'bi-buildings',
      nature: 'bi-tree',
      cultural: 'bi-palette',
      adventure: 'bi-bicycle',
      food: 'bi-cup-hot',
      historical: 'bi-hourglass',
      accommodation: 'bi-house'
    };
    return icons[category || 'accommodation'] || 'bi-geo-alt';
  };

  const getTypeColor = (type: UnifiedBooking['type']) => {
    return type === 'property' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="pt-14 font-sans min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
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
            <h2 className="text-red-800 font-semibold mb-2">Error Loading Bookings</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={refreshData}
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
    <div className="pt-14 font-sans">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-[#083A85]">My Travel Schedule</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage all your property stays and tour bookings in one place.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Upcoming</p>
            <p className="text-lg sm:text-xl font-bold text-blue-600">{summaryStats.upcoming}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Properties</p>
            <p className="text-lg sm:text-xl font-bold text-purple-600">{summaryStats.properties}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Tours</p>
            <p className="text-lg sm:text-xl font-bold text-orange-600">{summaryStats.tours}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Pending</p>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">{summaryStats.pending}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Completed</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">{summaryStats.completed}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total Guests</p>
            <p className="text-lg sm:text-xl font-bold text-indigo-600">{summaryStats.totalGuests}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total</p>
            <p className="text-lg sm:text-xl font-bold text-gray-600">{summaryStats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all p-3 text-center sm:text-left border border-gray-100">
            <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Total Spent</p>
            <p className="text-sm sm:text-base font-bold text-green-600">{summaryStats.totalSpent.toLocaleString()} KES</p>
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="mb-5 flex flex-col sm:flex-row gap-2 justify-end">
          <button
            onClick={() => handleAddNew('property')}
            className="w-full sm:w-auto inline-block px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer bg-purple-600 hover:bg-purple-700"
          >
            <i className="bi bi-house mr-1.5"></i>
            Book Property
          </button>
          <button
            onClick={() => handleAddNew('tours')}
            className="w-full sm:w-auto inline-block px-4 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            style={{ backgroundColor: '#F20C8F' }}
          >
            <i className="bi bi-map mr-1.5"></i>
            Book Tour
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-5 mb-5 hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Search</label>
              <div className="relative">
                <input type="text" placeholder="Property, tour, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2.5 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm transition-all"/>
                <i className="bi bi-search absolute left-2.5 top-2 sm:top-2.5 text-gray-500 text-xs"></i>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-2.5 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-xs sm:text-sm transition-all">
                <option value="all">All Types</option>
                <option value="property">Properties</option>
                <option value="tour">Tours</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-2.5 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-xs sm:text-sm transition-all">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-2.5 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-xs sm:text-sm transition-all">
                <option value="all">All Categories</option>
                <option value="accommodation">Accommodation</option>
                <option value="city">City Tour</option>
                <option value="nature">Nature</option>
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="food">Food & Culinary</option>
                <option value="historical">Historical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Date Range</label>
              <div className="flex flex-col gap-1.5">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm transition-all"/>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm transition-all"/>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-0 font-medium">Showing {filteredBookings.length} bookings</p>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 cursor-pointer rounded-lg transition-all text-xs sm:text-sm font-medium ${viewMode === 'calendar' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{ backgroundColor: viewMode === 'calendar' ? '#083A85' : undefined }}>
                <i className="bi bi-calendar3 mr-1.5"></i>Calendar
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 cursor-pointer rounded-lg transition-all text-xs sm:text-sm font-medium ${viewMode === 'list' ? 'text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}>
                <i className="bi bi-list-ul mr-1.5"></i>List
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-10 text-center">
            <i className="bi bi-calendar-x text-4xl sm:text-5xl text-gray-300"></i>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mt-3">{bookings.length === 0 ? "You have no bookings yet" : "No bookings found"}</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5">{bookings.length === 0 ? "Ready to start your journey? Book your first stay or tour now!" : "Try adjusting your filters to find your booking."}</p>
            {bookings.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
                <button onClick={() => handleAddNew('property')} className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 text-xs sm:text-sm transition-all hover:shadow-lg">
                  <i className="bi bi-house mr-1.5"></i>Book a Property
                </button>
                <button onClick={() => handleAddNew('tours')} className="px-5 py-2.5 text-white rounded-lg font-medium text-xs sm:text-sm transition-all hover:shadow-lg" style={{ backgroundColor: '#F20C8F' }}>
                  <i className="bi bi-map mr-1.5"></i>Book a Tour
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 p-2 sm:p-5 overflow-x-auto">
                <div className="flex justify-between items-center mb-5">
                  <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><i className="bi bi-chevron-left text-base sm:text-lg"></i></button>
                  <h2 className="text-base sm:text-lg font-bold text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"><i className="bi bi-chevron-right text-base sm:text-lg"></i></button>
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200 border-t border-l border-gray-200 rounded-lg overflow-hidden min-w-[700px]">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="bg-gradient-to-b from-gray-50 to-gray-100 p-1.5 text-center text-xs sm:text-sm font-semibold text-gray-700">{day}</div>)}
                  {calendarData.flat().map(({ date, bookings, isCurrentMonth }, index) => {
                    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <div key={index} className={`bg-white min-h-[100px] sm:min-h-[110px] p-1.5 border-r border-b border-gray-200 ${!isCurrentMonth ? 'bg-gray-50/50 opacity-60' : ''} ${isToday ? 'ring-2 ring-blue-500 z-10' : ''}`}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-[10px] font-medium text-gray-500 ${isToday ? 'text-blue-500' : ''}`}>{dayName}</span>
                          <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full' : 'text-gray-900'}`}>{date.getDate()}</span>
                        </div>
                        <div className="space-y-0.5">
                          {bookings.slice(0, 2).map(booking => (
                            <div key={booking.id} onClick={() => handleViewDetails(booking)} className={`text-[10px] p-1.5 rounded cursor-pointer hover:opacity-80 transition-all ${getStatusColor(booking.status)} border-l-2`} style={{ borderLeftColor: booking.type === 'property' ? '#9333ea' : '#ea580c' }}>
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <i className={`bi ${getTypeIcon(booking.type)} text-[9px]`}></i>
                                <span className={`text-[9px] px-0.5 rounded ${getTypeColor(booking.type)}`}>
                                  {booking.type === 'property' ? 'STAY' : 'TOUR'}
                                </span>
                              </div>
                              <div className="font-semibold text-[10px] leading-tight mb-0.5" title={booking.title}>
                                {booking.title.length > 20 ? `${booking.title.substring(0, 20)}...` : booking.title}
                              </div>
                              <div className="text-[9px] text-gray-600">
                                {booking.type === 'tour'
                                  ? `${booking.startTime} • ${booking.subtitle}`
                                  : `${booking.duration} night${booking.duration !== 1 ? 's' : ''} • ${booking.subtitle}`
                                }
                              </div>
                            </div>
                          ))}
                          {bookings.length > 2 && (
                            <div className="text-[9px] text-center text-gray-500 mt-0.5 p-0.5 bg-gray-100 rounded">
                              +{bookings.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-5 py-2.5 text-left"><button onClick={() => handleSort('type')} className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-0.5 hover:text-gray-900 transition-colors">Type <i className={`bi bi-chevron-${sortField === 'type' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'} text-xs`}></i></button></th>
                        <th className="px-4 sm:px-5 py-2.5 text-left"><button onClick={() => handleSort('date')} className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-0.5 hover:text-gray-900 transition-colors">Date & Time <i className={`bi bi-chevron-${sortField === 'date' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'} text-xs`}></i></button></th>
                        <th className="px-4 sm:px-5 py-2.5 text-left"><button onClick={() => handleSort('title')} className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-0.5 hover:text-gray-900 transition-colors">Booking Details <i className={`bi bi-chevron-${sortField === 'title' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'} text-xs`}></i></button></th>
                        <th className="px-4 sm:px-5 py-2.5 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide hidden lg:table-cell">Location</th>
                        <th className="px-4 sm:px-5 py-2.5 text-left"><button onClick={() => handleSort('guests')} className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-0.5 hover:text-gray-900 transition-colors">Guests <i className={`bi bi-chevron-${sortField === 'guests' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'} text-xs`}></i></button></th>
                        <th className="px-4 sm:px-5 py-2.5 text-left"><button onClick={() => handleSort('status')} className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-0.5 hover:text-gray-900 transition-colors">Status <i className={`bi bi-chevron-${sortField === 'status' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'} text-xs`}></i></button></th>
                        <th className="px-4 sm:px-5 py-2.5 text-right text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {paginatedBookings.map((booking) => (
                        <tr key={booking.id} className={`hover:bg-blue-50/30 transition-all duration-150 ${new Date(booking.date) < new Date() && !['completed', 'checked_out'].includes(booking.status) ? 'opacity-60' : ''}`}>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getTypeColor(booking.type)}`}>
                              <i className={`bi ${getTypeIcon(booking.type)} mr-0.5`}></i>
                              {booking.type}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900">
                              {booking.type === 'property' ? format(booking.date, 'EEE, MMM dd') : format(booking.date, 'EEE, MMM dd')}
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {booking.type === 'property'
                                ? `${booking.duration} night${booking.duration !== 1 ? 's' : ''}`
                                : booking.startTime
                              }
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900">{booking.title}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                              {booking.type === 'property' ? `by ${booking.hostOrGuideName}` : `with ${booking.subtitle}`}
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 hidden lg:table-cell">
                            <div className="text-xs sm:text-sm text-gray-600">
                              <i className="bi bi-geo-alt text-gray-400 mr-1 text-xs"></i>
                              {booking.location}
                            </div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-gray-900">{booking.numberOfGuests}</div>
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              <i className={`bi ${getStatusIcon(booking.status)} mr-0.5`}></i>
                              {booking.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 sm:px-5 py-3 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                            <button onClick={() => handleViewDetails(booking)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1.5 rounded-lg transition-all mr-1">
                              <i className="bi bi-eye text-sm sm:text-base"></i>
                            </button>
                            {!['completed', 'cancelled', 'checked_out'].includes(booking.status) && (
                              <>
                                <button onClick={() => handleEdit(booking)} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-1.5 rounded-lg transition-all mr-1">
                                  <i className="bi bi-pencil text-sm sm:text-base"></i>
                                </button>
                                <button onClick={() => handleCancelBooking(booking)} className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                  <i className="bi bi-x-circle text-sm sm:text-base"></i>
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="px-3 sm:px-5 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="text-xs sm:text-sm text-gray-700 font-medium">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-2.5 py-1.5 rounded-lg bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed border border-gray-300 transition-all text-xs">
                          <i className="bi bi-chevron-left"></i>
                        </button>
                        <span className="hidden sm:inline-flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentPage === i + 1 ? 'text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`} style={{ backgroundColor: currentPage === i + 1 ? '#083A85' : undefined }}>
                              {i + 1}
                            </button>
                          ))}
                        </span>
                        <span className="sm:hidden text-xs font-medium">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-2.5 py-1.5 rounded-lg bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed border border-gray-300 transition-all text-xs">
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${getTypeColor(selectedBooking.type)}`}>
                        <i className={`bi ${getTypeIcon(selectedBooking.type)} mr-0.5`}></i>
                        {selectedBooking.type}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                        <i className={`bi ${getStatusIcon(selectedBooking.status)} mr-0.5`}></i>
                        {selectedBooking.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-bold text-gray-900">{selectedBooking.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      <i className={`bi ${getCategoryIcon(selectedBooking.category)} mr-1.5`}></i>
                      {selectedBooking.type === 'property' ? 'Property Stay' : `${selectedBooking.category} Tour`}
                      {selectedBooking.duration && (
                        <span> • {selectedBooking.duration} {selectedBooking.type === 'property' ? 'night' : 'hour'}{selectedBooking.duration !== 1 ? 's' : ''}</span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-600 transition-all p-1">
                    <i className="bi bi-x-lg text-lg sm:text-xl"></i>
                  </button>
                </div>

                {/* Property vs Tour specific details */}
                {selectedBooking.type === 'property' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-calendar-check text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Check-in</p>
                      <p className="font-semibold text-xs sm:text-sm">{format(selectedBooking.date, 'EEE, MMM dd')}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{selectedBooking.startTime}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-calendar-x text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Check-out</p>
                      <p className="font-semibold text-xs sm:text-sm">{selectedBooking.checkOutDate ? format(selectedBooking.checkOutDate, 'EEE, MMM dd') : 'TBD'}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{selectedBooking.endTime}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-people text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Guests</p>
                      <p className="font-semibold text-xs sm:text-sm">{selectedBooking.numberOfGuests}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-calendar3 text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Date</p>
                      <p className="font-semibold text-xs sm:text-sm">{format(selectedBooking.date, 'EEE, MMM dd')}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-clock text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Time</p>
                      <p className="font-semibold text-xs sm:text-sm">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg p-2.5 border border-gray-200">
                      <i className="bi bi-people text-gray-600 text-base sm:text-lg mb-0.5"></i>
                      <p className="text-[10px] sm:text-xs text-gray-600 font-medium">Participants</p>
                      <p className="font-semibold text-xs sm:text-sm">{selectedBooking.numberOfGuests}</p>
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-sm sm:text-base font-bold mb-2">Booking Details</h3>
                  <div className="space-y-1.5 text-xs sm:text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p><i className="bi bi-geo-alt mr-1.5 w-4 text-center"></i><strong>Location:</strong> {selectedBooking.location}</p>
                    {selectedBooking.meetingPoint && (
                      <p><i className="bi bi-pin-map mr-1.5 w-4 text-center"></i><strong>Meeting Point:</strong> {selectedBooking.meetingPoint}</p>
                    )}
                    <p>
                      <i className="bi bi-person-circle mr-1.5 w-4 text-center"></i>
                      <strong>{selectedBooking.type === 'property' ? 'Host:' : 'Guide:'}</strong> {selectedBooking.hostOrGuideName}
                      {selectedBooking.hostOrGuideContact && ` (${selectedBooking.hostOrGuideContact})`}
                    </p>
                    {selectedBooking.roomType && (
                      <p><i className="bi bi-door-open mr-1.5 w-4 text-center"></i><strong>Room Type:</strong> {selectedBooking.roomType}</p>
                    )}
                    <p><i className="bi bi-currency-dollar mr-1.5 w-4 text-center"></i><strong>Total Price:</strong> {selectedBooking.totalPrice || selectedBooking.price} {selectedBooking.currency}</p>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div className="mb-5">
                    <h3 className="text-sm sm:text-base font-bold mb-2">Special Requests</h3>
                    <p className="text-xs sm:text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                      <i className="bi bi-sticky mr-1.5"></i>
                      {selectedBooking.specialRequests}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  {!['cancelled', 'completed', 'checked_out'].includes(selectedBooking.status) && (
                    <>
                      <button
                        onClick={() => { setShowDetailModal(false); handleEdit(selectedBooking); }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium order-last sm:order-first text-xs sm:text-sm"
                      >
                        <i className="bi bi-pencil mr-1.5"></i>Edit Booking
                      </button>
                      <button
                        onClick={() => handleCancelBooking(selectedBooking)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-xs sm:text-sm"
                      >
                        <i className="bi bi-x-circle mr-1.5"></i>Cancel Booking
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add/Edit Modal */}
        {showAddEditModal && editingBooking && (
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900">Edit Your {editingBooking.type === 'property' ? 'Property' : 'Tour'} Booking</h3>
                  <button onClick={() => { setShowAddEditModal(false); setEditingBooking(null); }} className="text-gray-400 cursor-pointer hover:text-red-600 transition-all p-1">
                    <i className="bi bi-x-lg text-lg sm:text-xl"></i>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1.5 text-xs sm:text-sm">Number of Guests *</label>
                    <input
                      type="number"
                      value={editingBooking.numberOfGuests || ''}
                      onChange={(e) => setEditingBooking(p => ({ ...p, numberOfGuests: parseInt(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 sm:py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm transition-all"
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">Special Requests</label>
                    <textarea
                      value={editingBooking.specialRequests || ''}
                      onChange={(e) => setEditingBooking(p => ({ ...p, specialRequests: e.target.value }))}
                      className="w-full px-2.5 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-sm transition-all"
                      rows={3}
                      placeholder={editingBooking.type === 'property' ? "e.g., Late check-in, extra bedding, accessibility needs..." : "e.g., Dietary restrictions, accessibility needs, pickup location..."}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-5">
                  <button onClick={handleSaveBooking} className="flex-1 px-4 py-2 cursor-pointer text-white rounded-lg font-medium transition-all hover:shadow-lg text-xs sm:text-sm" style={{ backgroundColor: '#083A85' }}>
                    <i className="bi bi-check-lg mr-1.5"></i>Update Booking
                  </button>
                  <button onClick={() => { setShowAddEditModal(false); setEditingBooking(null); }} className="flex-1 sm:flex-initial px-4 py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-all text-xs sm:text-sm">
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

export default SchedulePage;