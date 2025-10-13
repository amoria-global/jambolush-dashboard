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
  image?: string; // Added for card display
  
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
  // Date formatting helpers using UTC to avoid timezone shifts
  const format = (date: Date, formatStr: string) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const dayOfMonth = date.getUTCDate();
    const dayOfWeek = date.getUTCDay();
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
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
        return date.toUTCString();
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
  const [selectedDay, setSelectedDay] = useState<Date | null>(null); // For day-specific listing
  
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
    if (!data) return fallback;
    
    if (data.data && data.data.data) {
      if (data.data.data.bookings && Array.isArray(data.data.data.bookings)) return data.data.data.bookings;
      if (Array.isArray(data.data.data)) return data.data.data;
    }
    
    if (data.data) {
      if (data.data.bookings && Array.isArray(data.data.bookings)) return data.data.bookings;
      if (Array.isArray(data.data)) return data.data;
    }
    
    if (Array.isArray(data)) return data;
    
    return fallback;
  };

  // Transform property booking data, normalizing dates to UTC midnight
  const transformPropertyBooking = (apiBooking: any): UnifiedBooking => {
    const checkInUTC = new Date(apiBooking.checkInDate || apiBooking.startDate || apiBooking.createdAt);
    const checkOutUTC = new Date(apiBooking.checkOutDate || apiBooking.endDate || checkInUTC);
    
    const checkInDate = new Date(Date.UTC(checkInUTC.getUTCFullYear(), checkInUTC.getUTCMonth(), checkInUTC.getUTCDate()));
    const checkOutDate = new Date(Date.UTC(checkOutUTC.getUTCFullYear(), checkOutUTC.getUTCMonth(), checkOutUTC.getUTCDate()));
    
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
      image: apiBooking.property?.images?.livingRoom?.[0] || apiBooking.property?.images?.exterior?.[0] || '',
      originalData: apiBooking
    };
  };

  // Transform tour booking data, normalizing to UTC
  const transformTourBooking = (apiBooking: any): UnifiedBooking => {
    const bookingUTC = new Date(apiBooking.schedule?.startDate || apiBooking.startDate || apiBooking.createdAt);
    const bookingDate = new Date(Date.UTC(bookingUTC.getUTCFullYear(), bookingUTC.getUTCMonth(), bookingUTC.getUTCDate()));
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
      image: apiBooking.tour?.images?.[0] || '',
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

        if (propertyResponse.status === 'fulfilled') {
          const propertyBookings = extractArray(propertyResponse.value);
          const transformedProperties = propertyBookings.map(transformPropertyBooking);
          allBookings.push(...transformedProperties);
        }

        if (tourResponse.status === 'fulfilled') {
          const tourBookings = extractArray(tourResponse.value);
          const transformedTours = tourBookings.map(transformTourBooking);
          allBookings.push(...transformedTours);
        }

        setBookings(allBookings);
      } catch (err: any) {
        const errorMessage = err?.data?.message || err?.message || 'Failed to load bookings. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAllBookings();
  }, []);

  // Calculate summary stats using UTC
  const summaryStats = useMemo(() => {
    const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
    
    const upcoming = bookings.filter(b => b.date.getTime() >= today.getTime() && ['confirmed', 'checked_in'].includes(b.status));
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

  // Filter and sort logic with UTC date range
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
      const startDate = new Date(`${dateRange.start}T00:00:00Z`);
      const endDate = new Date(`${dateRange.end}T23:59:59.999Z`);
      filtered = filtered.filter(b => b.date.getTime() >= startDate.getTime() && b.date.getTime() <= endDate.getTime());
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date': comparison = a.date.getTime() - b.date.getTime(); break;
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

  // Grouped bookings for list view by UTC date
  const groupedBookings = useMemo(() => {
    const groups: { [key: string]: UnifiedBooking[] } = {};
    filteredBookings.forEach(booking => {
      const dateKey = format(booking.date, 'MMM dd, yyyy');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });
    return groups;
  }, [filteredBookings]);

  // Calendar view data using UTC
  const calendarData = useMemo(() => {
    const year = currentMonth.getUTCFullYear();
    const month = currentMonth.getUTCMonth();
    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const startDate = new Date(firstDayOfMonth.getTime());
    const firstDayWeekDay = firstDayOfMonth.getUTCDay();
    startDate.setUTCDate(startDate.getUTCDate() - firstDayWeekDay);
    
    const weeks: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[][] = [];
    let currentDate = new Date(startDate.getTime());
    
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(currentDate.getTime());
        const dayBookings = filteredBookings.filter(b => {
          if (b.type === 'property' && b.checkInDate && b.checkOutDate) {
            return date.getTime() >= b.checkInDate.getTime() && date.getTime() <= b.checkOutDate.getTime();
          }
          return b.date.getTime() === date.getTime();
        });
        
        week.push({
          date: date,
          bookings: dayBookings,
          isCurrentMonth: date.getUTCMonth() === month
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }
      weeks.push(week);
      if (currentDate.getUTCMonth() !== month && weekIndex >= 4) break;
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

  const handleDayClick = (date: Date, bookings: UnifiedBooking[]) => {
    if (bookings.length > 0) {
      setSelectedDay(date);
    }
  };
  
  // Helper Functions
  const getStatusColor = (status: UnifiedBooking['status']) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
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
      <div className="pt-14 font-sans min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85] mx-auto mb-4"></div>
          <p className="text-gray-600 text-base">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-1 font-sans min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full">
              <i className="bi bi-exclamation-triangle text-gray-600 text-xl" />
            </div>
            <h2 className="text-gray-800 font-semibold mb-2 text-lg">Error Loading Schedule</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={refreshData}
              className="bg-[#083A85] text-white px-6 py-3 rounded-full hover:bg-blue-900 transition-colors font-medium text-sm"
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
    <div className="pt-1 font-sans bg-white">
      <div className="mx-auto px-2 sm:px-3 lg:px-4 py-4 max-w-8xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
          <p className="text-sm text-gray-500 mt-2">All your stays and tours in one place.</p>
        </div>

        {/* Summary Stats - Mimic Airbnb's clean cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-[#083A85]">{summaryStats.upcoming}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Spaces</p>
            <p className="text-2xl font-bold text-purple-600">{summaryStats.properties}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Tours</p>
            <p className="text-2xl font-bold text-orange-600">{summaryStats.tours}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.completed}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={() => handleAddNew('property')}
            className="w-full sm:w-auto px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:shadow-md bg-purple-600 hover:bg-purple-700"
          >
            <i className="bi bi-house mr-2"></i>
            Book Property
          </button>
          <button
            onClick={() => handleAddNew('tours')}
            className="w-full sm:w-auto px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:shadow-md bg-[#F20C8F] hover:bg-pink-700"
          >
            <i className="bi bi-map mr-2"></i>
            Book Tour
          </button>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input type="text" placeholder="Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm"/>
                <i className="bi bi-search absolute left-4 top-3 text-gray-400"></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm">
                <option value="all">All Types</option>
                <option value="property">Spaces</option>
                <option value="tour">Tours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm"/>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm"/>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">Showing {filteredBookings.length} bookings</p>
            <div className="flex gap-3">
              <button onClick={() => setViewMode('calendar')} className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-[#083A85] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <i className="bi bi-calendar3 mr-2"></i>Calendar
              </button>
              <button onClick={() => setViewMode('list')} className={`px-5 py-3 rounded-full text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <i className="bi bi-list-ul mr-2"></i>List
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <i className="bi bi-calendar-x text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{bookings.length === 0 ? "No schedule yet" : "No bookings found"}</h3>
            <p className="text-sm text-gray-500 mb-6">{bookings.length === 0 ? "Start planning your next adventure." : "Adjust filters to see more."}</p>
            {bookings.length === 0 && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => handleAddNew('property')} className="px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 text-sm transition-all">
                  <i className="bi bi-house mr-2"></i>Book a Property
                </button>
                <button onClick={() => handleAddNew('tours')} className="px-6 py-3 bg-[#F20C8F] text-white rounded-full font-medium text-sm transition-all">
                  <i className="bi bi-map mr-2"></i>Book a Tour
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1)))} className="p-2 hover:bg-gray-100 rounded-full transition-all"><i className="bi bi-chevron-left text-lg"></i></button>
                  <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <button onClick={() => setCurrentMonth(prev => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1)))} className="p-2 hover:bg-gray-100 rounded-full transition-all"><i className="bi bi-chevron-right text-lg"></i></button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center text-sm font-medium text-gray-500">{day}</div>)}
                  {calendarData.flat().map(({ date, bookings, isCurrentMonth }, index) => {
                    const isToday = date.getUTCFullYear() === new Date().getUTCFullYear() && date.getUTCMonth() === new Date().getUTCMonth() && date.getUTCDate() === new Date().getUTCDate();
                    return (
                      <div 
                        key={index} 
                        onClick={() => handleDayClick(date, bookings)}
                        className={`p-2 text-center rounded-lg cursor-pointer transition-all ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'} ${isToday ? 'bg-[#083A85]/10 ring-2 ring-[#083A85]' : ''} ${bookings.length > 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`text-sm font-medium ${isToday ? 'text-[#083A85]' : ''}`}>{date.getUTCDate()}</span>
                        {bookings.length > 0 && (
                          <div className="flex justify-center mt-1">
                            <div className="w-2 h-2 bg-[#083A85] rounded-full"></div>
                          </div>
                        )}
                        {bookings.length > 2 && <span className="text-xs text-gray-500">+{bookings.length - 2}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {viewMode === 'list' && (
              <div className="space-y-8">
                {Object.entries(groupedBookings).map(([dateKey, dayBookings]) => (
                  <div key={dateKey}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{dateKey}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dayBookings.map(booking => (
                        <div key={booking.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                          {booking.image ? (
                            <img src={booking.image} alt={booking.title} className="w-full h-48 object-cover" />
                          ) : (
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                              <i className={`bi ${getTypeIcon(booking.type)} text-6xl text-gray-300`}></i>
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(booking.type)}`}>
                                {booking.type.charAt(0).toUpperCase() + booking.type.slice(1)}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status.replace('_', ' ').charAt(0).toUpperCase() + booking.status.replace('_', ' ').slice(1)}
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{booking.title}</h4>
                            <p className="text-sm text-gray-500 mb-3">{booking.location}</p>
                            <div className="flex items-center text-sm text-gray-600 mb-4">
                              <i className="bi bi-calendar mr-2"></i>
                              {format(booking.date, 'MMM dd')} {booking.startTime ? `• ${booking.startTime}` : ''}
                            </div>
                            <div className="flex gap-3">
                              <button onClick={() => handleViewDetails(booking)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all">
                                Details
                              </button>
                              {!['completed', 'cancelled', 'checked_out'].includes(booking.status) && (
                                <button onClick={() => handleCancelBooking(booking)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-all">
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail Modal - Mimic Airbnb's clean modal */}
        {showDetailModal && selectedBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBooking.title}</h2>
                    <p className="text-sm text-gray-500">{selectedBooking.location}</p>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-900 p-2">
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                {selectedBooking.image && <img src={selectedBooking.image} alt={selectedBooking.title} className="w-full h-64 object-cover rounded-2xl mb-6" />}
                <div className="space-y-4 text-sm text-gray-700">
                  <p><strong>Date:</strong> {format(selectedBooking.date, 'MMM dd, yyyy')}</p>
                  <p><strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}</p>
                  <p><strong>Guests:</strong> {selectedBooking.numberOfGuests}</p>
                  <p><strong>Status:</strong> {selectedBooking.status}</p>
                  <p><strong>Total Price:</strong> {selectedBooking.totalPrice} {selectedBooking.currency}</p>
                  {selectedBooking.specialRequests && <p><strong>Special Requests:</strong> {selectedBooking.specialRequests}</p>}
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => handleCancelBooking(selectedBooking)} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showAddEditModal && editingBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Edit Booking</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                    <input type="number" value={editingBooking.numberOfGuests || ''} onChange={(e) => setEditingBooking(p => ({ ...p, numberOfGuests: parseInt(e.target.value) }))} className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea value={editingBooking.specialRequests || ''} onChange={(e) => setEditingBooking(p => ({ ...p, specialRequests: e.target.value }))} className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#083A85] text-sm" rows={4} />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button onClick={handleSaveBooking} className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-full text-sm">
                    Save
                  </button>
                  <button onClick={() => setShowAddEditModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-sm">
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