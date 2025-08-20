"use client";
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface Guest {
  id: string;
  guestName: string;
  propertyName: string;
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  amountPaid: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'pending';
  guestCount: number;
  bookingDate: Date;
  specialRequests?: string;
  avatar: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'guestName' | 'checkIn' | 'amountPaid' | 'bookingDate';
type SortOrder = 'asc' | 'desc';

const GuestsListingPage: React.FC = () => {
  // Date formatting helper
  const format = (date: Date, formatStr: string) => {
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
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('checkIn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Edit modal states
  const [editBookingStatus, setEditBookingStatus] = useState<string>('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>('');
  const [editSpecialRequests, setEditSpecialRequests] = useState('');

  // Mock data generation
  useEffect(() => {
    const generateMockGuests = (): Guest[] => {
      const bookingStatuses: ('confirmed' | 'pending' | 'cancelled' | 'completed')[] = 
        ['confirmed', 'pending', 'cancelled', 'completed'];
      const paymentStatuses: ('paid' | 'unpaid' | 'refunded' | 'pending')[] = 
        ['paid', 'unpaid', 'refunded', 'pending'];
      const guestNames = [
        'John Smith', 'Emma Johnson', 'Michael Brown', 'Sarah Davis',
        'James Wilson', 'Lisa Anderson', 'Robert Taylor', 'Maria Garcia',
        'David Martinez', 'Jennifer Lopez', 'William Jones', 'Patricia Miller'
      ];
      const propertyNames = [
        'Ocean View Villa', 'Downtown Loft', 'Mountain Retreat',
        'Beach House Paradise', 'City Center Apartment', 'Lakeside Cabin',
        'Luxury Penthouse', 'Cozy Studio', 'Garden Cottage'
      ];
      
      return Array.from({ length: 48 }, (_, i) => {
        const checkIn = new Date(2025, 0, Math.floor(Math.random() * 60) + 1);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 7) + 1);
        const bookingDate = new Date(checkIn);
        bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30) - 1);
        
        const totalAmount = Math.floor(Math.random() * 2000) + 300;
        const bookingStatus = bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)];
        const paymentStatus = bookingStatus === 'cancelled' 
          ? (Math.random() > 0.5 ? 'refunded' : 'unpaid')
          : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
        
        return {
          id: `BK${String(i + 1).padStart(5, '0')}`,
          guestName: guestNames[Math.floor(Math.random() * guestNames.length)] + ` ${i + 1}`,
          propertyName: propertyNames[Math.floor(Math.random() * propertyNames.length)],
          propertyId: `PROP${String(Math.floor(Math.random() * 9) + 1).padStart(3, '0')}`,
          checkIn,
          checkOut,
          bookingStatus,
          amountPaid: paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'pending' ? totalAmount * 0.5 : 0),
          totalAmount,
          paymentStatus,
          guestCount: Math.floor(Math.random() * 4) + 1,
          bookingDate,
          specialRequests: Math.random() > 0.5 ? 'Late check-in requested' : undefined,
          avatar: `https://ui-avatars.com/api/?name=${guestNames[Math.floor(Math.random() * guestNames.length)].replace(' ', '+')}&background=083A85&color=fff`
        };
      });
    };

    setTimeout(() => {
      setGuests(generateMockGuests());
      setLoading(false);
    }, 1000);
  }, []);

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
      confirmed: guests.filter(g => g.bookingStatus === 'confirmed').length,
      pending: guests.filter(g => g.bookingStatus === 'pending').length,
      upcomingThisWeek: guests.filter(g => 
        g.bookingStatus === 'confirmed' && 
        g.checkIn >= today && 
        g.checkIn <= thisWeek
      ).length,
      revenue: guests
        .filter(g => g.paymentStatus === 'paid')
        .reduce((sum, g) => sum + g.amountPaid, 0)
    };
  }, [guests]);

  // Get unique properties for filter
  const uniqueProperties = useMemo(() => {
    const props = new Map();
    guests.forEach(g => props.set(g.propertyId, g.propertyName));
    return Array.from(props, ([id, name]) => ({ id, name }));
  }, [guests]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...guests];

    // Search filter (name or booking ID)
    if (searchTerm) {
      filtered = filtered.filter(guest =>
        guest.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property filter
    if (propertyFilter !== 'all') {
      filtered = filtered.filter(guest => guest.propertyId === propertyFilter);
    }

    // Booking status filter
    if (bookingStatusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.bookingStatus === bookingStatusFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(guest => guest.paymentStatus === paymentStatusFilter);
    }

    // Date range filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateRangeFilter === 'today') {
      filtered = filtered.filter(guest => {
        const checkIn = new Date(guest.checkIn);
        checkIn.setHours(0, 0, 0, 0);
        return checkIn.getTime() === today.getTime();
      });
    } else if (dateRangeFilter === 'week') {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + 7);
      filtered = filtered.filter(guest => 
        guest.checkIn >= today && guest.checkIn <= weekEnd
      );
    } else if (dateRangeFilter === 'month') {
      const monthEnd = new Date(today);
      monthEnd.setMonth(today.getMonth() + 1);
      filtered = filtered.filter(guest => 
        guest.checkIn >= today && guest.checkIn <= monthEnd
      );
    } else if (dateRangeFilter === 'custom' && (customDateRange.start || customDateRange.end)) {
      const start = customDateRange.start ? new Date(customDateRange.start) : new Date(0);
      const end = customDateRange.end ? new Date(customDateRange.end) : new Date(9999, 11, 31);
      filtered = filtered.filter(guest => 
        guest.checkIn >= start && guest.checkIn <= end
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'guestName':
          comparison = a.guestName.localeCompare(b.guestName);
          break;
        case 'checkIn':
          comparison = a.checkIn.getTime() - b.checkIn.getTime();
          break;
        case 'amountPaid':
          comparison = a.amountPaid - b.amountPaid;
          break;
        case 'bookingDate':
          comparison = a.bookingDate.getTime() - b.bookingDate.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredGuests(filtered);
    setCurrentPage(1);
  }, [guests, searchTerm, propertyFilter, bookingStatusFilter, paymentStatusFilter, dateRangeFilter, customDateRange, sortField, sortOrder]);

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

  const handleViewDetails = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowDetailModal(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setEditBookingStatus(guest.bookingStatus);
    setEditPaymentStatus(guest.paymentStatus);
    setEditSpecialRequests(guest.specialRequests || '');
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (selectedGuest) {
      setGuests(prev => 
        prev.map(guest => 
          guest.id === selectedGuest.id 
            ? {
                ...guest,
                bookingStatus: editBookingStatus as any,
                paymentStatus: editPaymentStatus as any,
                specialRequests: editSpecialRequests || undefined,
                amountPaid: editPaymentStatus === 'paid' ? guest.totalAmount : 
                           editPaymentStatus === 'pending' ? guest.totalAmount * 0.5 : 0
              }
            : guest
        )
      );
      setShowEditModal(false);
      alert('Guest booking updated successfully!');
    }
  };

  const handleDeleteGuest = (guestId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      setGuests(prev => prev.filter(g => g.id !== guestId));
      setShowDetailModal(false); // Close modal if open
      alert('Booking deleted.');
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

  const getBookingStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bi-check-circle';
      case 'pending': return 'bi-clock';
      case 'cancelled': return 'bi-x-circle';
      case 'completed': return 'bi-check-square';
      default: return 'bi-calendar';
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Guest Listings</h1>
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
                <p className="text-2xl font-bold text-green-600">${summaryStats.revenue.toLocaleString()}</p>
              </div>
              <i className="bi bi-cash-stack text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-100 rounded-lg shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Guest name or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="bi bi-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>

            {/* Property Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Property</label>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Properties</option>
                {uniqueProperties.map(prop => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
            </div>

            {/* Booking Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Booking Status</label>
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
                <option value="refunded">Refunded</option>
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredGuests.length === 0 && (
          <div className="bg-gray-100 rounded-lg shadow-xl p-12 text-center">
            <i className="bi bi-people text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">
              {guests.length === 0 
                ? "No guest bookings yet"
                : "No guests found"}
            </h3>
            <p className="text-gray-600 mt-2">
              {guests.length === 0 
                ? "Your guest bookings will appear here"
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
                      <p className="text-base text-gray-500">{guest.id}</p>
                    </div>
                    <span className={`px-2 py-1 text-base font-semibold rounded-full ${getBookingStatusColor(guest.bookingStatus)}`}>
                      <i className={`bi ${getBookingStatusIcon(guest.bookingStatus)} mr-1`}></i>
                      {guest.bookingStatus}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-base text-gray-600">
                      <i className="bi bi-house mr-2"></i>
                      {guest.propertyName}
                    </p>
                    <p className="text-base text-gray-600">
                      <i className="bi bi-calendar-check mr-2"></i>
                      {format(guest.checkIn, 'MMM dd')} - {format(guest.checkOut, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-base text-gray-600">
                      <i className="bi bi-people mr-2"></i>
                      {guest.guestCount} {guest.guestCount === 1 ? 'Guest' : 'Guests'}
                    </p>
                  </div>
                  
                  <div className="border-t pt-3 mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-base text-gray-600">Total Price</span>
                      <span className="text-lg font-semibold text-gray-900">${guest.totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base text-gray-600">Payment</span>
                      <span className={`px-2 py-1 text-base font-semibold rounded-full ${getPaymentStatusColor(guest.paymentStatus)}`}>
                        {guest.paymentStatus}
                      </span>
                    </div>
                  </div>
                  
                  {guest.specialRequests && (
                    <p className="text-base text-gray-500 italic mb-3">
                      <i className="bi bi-info-circle mr-1"></i>{guest.specialRequests}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(guest)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-base font-medium cursor-pointer"
                    >
                      <i className="bi bi-eye mr-1"></i>View
                    </button>
                    <button
                      onClick={() => handleEditGuest(guest)}
                      className="flex-1 px-3 py-2 text-white rounded-lg transition-colors text-base font-medium cursor-pointer"
                      style={{ backgroundColor: '#083A85' }}
                    >
                      <i className="bi bi-pencil mr-1"></i>Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete booking"
                    >
                      <i className="bi bi-trash"></i>
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
                        onClick={() => handleSort('guestName')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Guest
                        <i className={`bi bi-chevron-${sortField === 'guestName' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('checkIn')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Check-in
                        <i className={`bi bi-chevron-${sortField === 'checkIn' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Check-out
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('amountPaid')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Amount
                        <i className={`bi bi-chevron-${sortField === 'amountPaid' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Payment
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
                            <div className="text-base text-gray-500">{guest.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">{guest.propertyName}</div>
                        <div className="text-base text-gray-500">{guest.guestCount} guests</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {format(guest.checkIn, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          {format(guest.checkOut, 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getBookingStatusColor(guest.bookingStatus)}`}>
                          {guest.bookingStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base text-gray-900">
                          ${guest.amountPaid} / ${guest.totalAmount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getPaymentStatusColor(guest.paymentStatus)}`}>
                          {guest.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                        <button
                          onClick={() => handleViewDetails(guest)}
                          className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                          title="View details"
                        >
                          <i className="bi bi-eye text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleEditGuest(guest)}
                          className="text-green-600 hover:text-green-900 mr-3 cursor-pointer"
                          title="Edit booking"
                        >
                          <i className="bi bi-pencil text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title="Delete booking"
                        >
                          <i className="bi bi-trash text-lg"></i>
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Guest Details</h2>
                    <p className="text-gray-600 mt-1">Booking {selectedGuest.id}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>

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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Booking Status</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Booking:</span>
                        <span className={`px-2 py-1 text-base font-semibold rounded-full ${getBookingStatusColor(selectedGuest.bookingStatus)}`}>
                          {selectedGuest.bookingStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment:</span>
                        <span className={`px-2 py-1 text-base font-semibold rounded-full ${getPaymentStatusColor(selectedGuest.paymentStatus)}`}>
                          {selectedGuest.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-house text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Property</p>
                    <p className="font-semibold">{selectedGuest.propertyName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-calendar-check text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Check-in</p>
                    <p className="font-semibold">{format(selectedGuest.checkIn, 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-calendar-x text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Check-out</p>
                    <p className="font-semibold">{format(selectedGuest.checkOut, 'MMM dd, yyyy')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-people text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Guests</p>
                    <p className="font-semibold">{selectedGuest.guestCount}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-semibold">${selectedGuest.totalAmount}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-semibold text-green-600">${selectedGuest.amountPaid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold text-red-600">
                        ${selectedGuest.totalAmount - selectedGuest.amountPaid}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedGuest.specialRequests && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Special Requests</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                      <i className="bi bi-info-circle mr-2"></i>
                      {selectedGuest.specialRequests}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Booking Date</h3>
                  <p className="text-gray-600">
                    <i className="bi bi-calendar mr-2"></i>
                    {format(selectedGuest.bookingDate, 'MMM dd, yyyy')}
                  </p>
                </div>

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
                    Edit Booking
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(selectedGuest.id)}
                    className="flex-1 px-6 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium cursor-pointer"
                  >
                    <i className="bi bi-trash mr-2"></i>
                    Delete Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedGuest && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full animate-scale-in">
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
                    Guest: <span className="font-semibold">{selectedGuest.guestName}</span><br/>
                    Property: <span className="font-semibold">{selectedGuest.propertyName}</span>
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
                        Payment Status
                      </label>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="pending">Pending</option>
                        <option value="refunded">Refunded</option>
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