"use client";
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface UserBooking {
  id: string;
  tourTitle: string;
  tourType: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  location: string;
  meetingPoint: string;
  numberOfGuests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  guideName: string;
  guideContact: string;
  specialRequests?: string;
  createdAt: Date;
  lastModified: Date;
}

type ViewMode = 'calendar' | 'list';
type SortField = 'date' | 'tourTitle' | 'status' | 'guests';
type SortOrder = 'asc' | 'desc';

const UserSchedulePage: React.FC = () => {
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
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<UserBooking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Partial<UserBooking> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tourTypeFilter, setTourTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Mock data generation
  useEffect(() => {
    const generateMockBookings = (): UserBooking[] => {
      const statuses: UserBooking['status'][] = ['confirmed', 'pending', 'cancelled', 'completed'];
      const tourTypes: UserBooking['tourType'][] = ['city', 'nature', 'cultural', 'adventure', 'food', 'historical'];
      const tourTitles = [
        'City Highlights Tour', 'Coastal Hike Adventure', 'Museum & Art Walk',
        'Mountain Biking Expedition', 'Street Food Discovery', 'Ancient Ruins Exploration',
      ];
      const locations = ['Downtown', 'National Park', 'Historic District', 'Mountain Trails', 'Central Market'];
      const guides = [
        { name: 'Alex Ray', contact: 'alex.ray@tours.com' },
        { name: 'Maria Garcia', contact: 'maria.g@tours.com' },
        { name: 'Sam Chen', contact: 'sam.chen@tours.com' },
      ];
      
      const userBookings: UserBooking[] = [];
      const today = new Date();
      
      for (let dayOffset = -30; dayOffset < 60; dayOffset++) {
        if (Math.random() > 0.8) {
          const bookingDate = new Date(today);
          bookingDate.setDate(today.getDate() + dayOffset);
          
          const status = dayOffset < 0 ? 'completed' : statuses[Math.floor(Math.random() * (statuses.length - 1))];
          const startHour = 9 + Math.floor(Math.random() * 8);
          const duration = Math.floor(Math.random() * 3) + 2;
          const guide = guides[Math.floor(Math.random() * guides.length)];

          userBookings.push({
            id: `UB${String(userBookings.length + 1).padStart(5, '0')}`,
            tourTitle: tourTitles[Math.floor(Math.random() * tourTitles.length)],
            tourType: tourTypes[Math.floor(Math.random() * tourTypes.length)],
            date: bookingDate,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
            duration,
            location: locations[Math.floor(Math.random() * locations.length)],
            meetingPoint: 'At the main entrance',
            numberOfGuests: Math.floor(Math.random() * 4) + 1,
            status,
            price: Math.floor(Math.random() * 80) + 40,
            guideName: guide.name,
            guideContact: guide.contact,
            specialRequests: Math.random() > 0.8 ? 'Vegetarian meal preference.' : undefined,
            createdAt: new Date(today.getTime() - Math.random() * 45 * 24 * 60 * 60 * 1000),
            lastModified: new Date(),
          });
        }
      }
      return userBookings;
    };

    setTimeout(() => {
      setBookings(generateMockBookings());
      setLoading(false);
    }, 1000);
  }, []);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = bookings.filter(b => new Date(b.date) >= today && b.status === 'confirmed');
    const completed = bookings.filter(b => b.status === 'completed');
    
    return {
      total: bookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      totalGuests: upcoming.reduce((sum, b) => sum + b.numberOfGuests, 0),
      totalSpent: completed.reduce((sum, b) => sum + (b.price * b.numberOfGuests), 0)
    };
  }, [bookings]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (tourTypeFilter !== 'all') {
      filtered = filtered.filter(b => b.tourType === tourTypeFilter);
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
        case 'tourTitle': comparison = a.tourTitle.localeCompare(b.tourTitle); break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
        case 'guests': comparison = a.numberOfGuests - b.numberOfGuests; break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, tourTypeFilter, dateRange, sortField, sortOrder]);

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
    
    const weeks: { date: Date; bookings: UserBooking[]; isCurrentMonth: boolean }[][] = [];
    let currentDate = startDate;
    
    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: { date: Date; bookings: UserBooking[]; isCurrentMonth: boolean }[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(currentDate);
        const dayBookings = filteredBookings.filter(b => {
          const bookingDate = new Date(b.date);
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

  // Handlers
  const handleSort = (field: SortField) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handleViewDetails = (booking: UserBooking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleAddNew = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEditingBooking({
      tourTitle: '',
      tourType: 'city',
      date: tomorrow,
      startTime: '10:00',
      duration: 3,
      location: '',
      numberOfGuests: 2,
      status: 'pending',
      price: 75,
      guideName: 'Any Available Guide',
      specialRequests: ''
    });
    setShowAddEditModal(true);
  };

  const handleEdit = (booking: UserBooking) => {
    setEditingBooking(booking);
    setShowAddEditModal(true);
  };

  const handleSaveBooking = () => {
    if (!editingBooking) return;

    if (editingBooking.id) {
      setBookings(prev => prev.map(b => b.id === editingBooking.id ? {...b, ...editingBooking, lastModified: new Date()} as UserBooking : b));
    } else {
      const newBooking: UserBooking = {
        id: `UB${String(bookings.length + 1).padStart(5, '0')}`,
        createdAt: new Date(),
        lastModified: new Date(),
        ...editingBooking as Omit<UserBooking, 'id' | 'createdAt' | 'lastModified'>,
        endTime: `${(parseInt(editingBooking.startTime?.split(':')[0] || '0') + (editingBooking.duration || 0))}:00`
      };
      setBookings(prev => [...prev, newBooking]);
    }
    setShowAddEditModal(false);
    setEditingBooking(null);
  };

  const handleCancelBooking = (booking: UserBooking) => {
    if (window.confirm(`Are you sure you want to cancel your booking for "${booking.tourTitle}"?`)) {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
      setShowDetailModal(false);
    }
  };
  
  // Helper Functions
  const getStatusColor = (status: UserBooking['status']) => {
    const colors = {
      confirmed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: UserBooking['status']) => {
    const icons = {
      confirmed: 'bi-calendar-check',
      pending: 'bi-hourglass-split',
      cancelled: 'bi-calendar-x',
      completed: 'bi-check-circle'
    };
    return icons[status] || 'bi-calendar';
  };

  const getTourTypeIcon = (type: UserBooking['tourType']) => {
    const icons = {
      city: 'bi-buildings',
      nature: 'bi-tree',
      cultural: 'bi-palette',
      adventure: 'bi-bicycle',
      food: 'bi-cup-hot',
      historical: 'bi-hourglass'
    };
    return icons[type] || 'bi-map';
  };

  return (
    <div className="pt-14 font-sans">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">My Booked Tours</h1>
          <p className="text-gray-600 mt-2">Manage your upcoming and past adventures.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">{summaryStats.upcoming}</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Total Guests</p>
            <p className="text-2xl font-bold text-indigo-600">{summaryStats.totalGuests}</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.completed}</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Total Bookings</p>
            <p className="text-2xl font-bold text-gray-600">{summaryStats.total}</p>
          </div>
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 text-center sm:text-left">
            <p className="text-base text-gray-600">Total Spent</p>
            <p className="text-xl font-bold text-green-600">${summaryStats.totalSpent.toLocaleString()}</p>
          </div>
        </div>
 
        <div className="mb-6 text-right">
          <button
            onClick={handleAddNew}
            className="w-full sm:w-auto inline-block px-5 py-2.5 rounded-lg text-white text-base font-medium transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: '#F20C8F' }}
          >
            <i className="bi bi-plus-lg mr-2"></i>
            Book a New Tour
          </button>
        </div>


        {/* Filters and Actions */}
        <div className="bg-gray-50 rounded-lg shadow-xl p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input type="text" placeholder="Tour name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <i className="bi bi-search absolute left-3 top-3 text-gray-700"></i>
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Tour Type</label>
              <select value={tourTypeFilter} onChange={(e) => setTourTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="all">All Types</option>
                <option value="city">City Tour</option>
                <option value="nature">Nature</option>
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="food">Food & Culinary</option>
                <option value="historical">Historical</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
            <p className="text-base text-gray-600 mb-4 sm:mb-0">Showing {filteredBookings.length} tours</p>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 cursor-pointer rounded-lg ${viewMode === 'calendar' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} style={{ backgroundColor: viewMode === 'calendar' ? '#083A85' : undefined }}>
                <i className="bi bi-calendar3 mr-2"></i>Calendar
              </button>
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 cursor-pointer rounded-lg ${viewMode === 'list' ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}>
                <i className="bi bi-list-ul mr-2"></i>List
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-gray-100 rounded-lg shadow-xl p-8 sm:p-12 text-center">
            <i className="bi bi-calendar-x text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">{bookings.length === 0 ? "You have no booked tours" : "No tours found"}</h3>
            <p className="text-gray-600 mt-2">{bookings.length === 0 ? "Ready for an adventure? Book your first tour now!" : "Try adjusting your filters to find your booking."}</p>
            {bookings.length === 0 && (
              <button onClick={handleAddNew} className="mt-4 px-6 py-3 text-white rounded-lg font-medium" style={{ backgroundColor: '#083A85' }}>
                <i className="bi bi-plus-circle mr-2"></i>Book Your First Tour
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'calendar' && (
              <div className="bg-white rounded-lg shadow-xl p-2 sm:p-6 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded-lg"><i className="bi bi-chevron-left text-xl"></i></button>
                  <h2 className="text-xl font-bold text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded-lg"><i className="bi bi-chevron-right text-xl"></i></button>
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-200 border-t border-l border-gray-200 min-w-[700px]">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="bg-gray-50 p-2 text-center text-base font-medium text-gray-700">{day}</div>)}
                  {calendarData.flat().map(({ date, bookings, isCurrentMonth }, index) => (
                    <div key={index} className={`bg-white min-h-[120px] p-2 border-r border-b border-gray-200 ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : ''} ${new Date().toDateString() === date.toDateString() ? 'ring-2 ring-blue-500 z-10' : ''}`}>
                      <span className={`text-base font-medium ${new Date().toDateString() === date.toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>{date.getDate()}</span>
                      <div className="space-y-1 mt-1">
                        {bookings.slice(0, 2).map(booking => (
                          <div key={booking.id} onClick={() => handleViewDetails(booking)} className={`text-sm p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(booking.status)}`}>
                            <div className="truncate font-semibold">{booking.tourTitle}</div>
                            <div className="text-gray-700 text-xs">{booking.startTime}</div>
                          </div>
                        ))}
                        {bookings.length > 2 && <div className="text-xs text-center text-gray-500 mt-1">+{bookings.length - 2} more</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left"><button onClick={() => handleSort('date')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1">Date & Time <i className={`bi bi-chevron-${sortField === 'date' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`}></i></button></th>
                        <th className="px-6 py-3 text-left"><button onClick={() => handleSort('tourTitle')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1">Tour & Guide <i className={`bi bi-chevron-${sortField === 'tourTitle' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`}></i></button></th>
                        <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">Location</th>
                        <th className="px-6 py-3 text-left"><button onClick={() => handleSort('guests')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1">Guests <i className={`bi bi-chevron-${sortField === 'guests' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`}></i></button></th>
                        <th className="px-6 py-3 text-left"><button onClick={() => handleSort('status')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1">Status <i className={`bi bi-chevron-${sortField === 'status' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`}></i></button></th>
                        <th className="px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedBookings.map((booking) => (
                        <tr key={booking.id} className={`hover:bg-gray-50 transition-colors ${new Date(booking.date) < new Date() && booking.status !== 'completed' ? 'opacity-60' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-base font-medium text-gray-900">{format(booking.date, 'EEE, MMM dd')}</div>
                            <div className="text-base text-gray-500">{booking.startTime}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-base font-medium text-gray-900">{booking.tourTitle}</div>
                            <div className="text-base text-gray-500">by {booking.guideName}</div>
                          </td>
                          <td className="px-6 py-4 hidden lg:table-cell"><div className="text-base text-gray-600"><i className="bi bi-geo-alt text-gray-400 mr-1"></i>{booking.location}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-base font-medium text-gray-900">{booking.numberOfGuests}</div></td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}><i className={`bi ${getStatusIcon(booking.status)} mr-1`}></i>{booking.status}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                            <button onClick={() => handleViewDetails(booking)} className="text-blue-600 hover:text-blue-900 mr-3"><i className="bi bi-eye text-lg"></i></button>
                            {booking.status !== 'completed' && booking.status !== 'cancelled' && (<>
                              <button onClick={() => handleEdit(booking)} className="text-gray-600 hover:text-gray-900 mr-3"><i className="bi bi-pencil text-lg"></i></button>
                              <button onClick={() => handleCancelBooking(booking)} className="text-red-600 hover:text-red-900"><i className="bi bi-x-circle text-lg"></i></button>
                            </>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-base text-gray-700">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}</div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"><i className="bi bi-chevron-left"></i></button>
                        <span className="hidden sm:inline-flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => <button key={i} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-2 rounded-lg ${currentPage === i + 1 ? 'text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`} style={{ backgroundColor: currentPage === i + 1 ? '#083A85' : undefined }}>{i + 1}</button>)}
                        </span>
                        <span className="sm:hidden text-sm">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"><i className="bi bi-chevron-right"></i></button>
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
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedBooking.tourTitle}</h2>
                    <p className="text-gray-600 mt-1"><i className={`bi ${getTourTypeIcon(selectedBooking.tourType)} mr-2`}></i>{selectedBooking.tourType} Tour • {selectedBooking.duration} hours</p>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-600"><i className="bi bi-x-lg text-2xl"></i></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3"><i className="bi bi-calendar3 text-gray-600 text-xl mb-1"></i><p className="text-base text-gray-600">Date</p><p className="font-semibold">{format(selectedBooking.date, 'EEE, MMM dd')}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><i className="bi bi-clock text-gray-600 text-xl mb-1"></i><p className="text-base text-gray-600">Time</p><p className="font-semibold">{selectedBooking.startTime} - {selectedBooking.endTime}</p></div>
                  <div className="bg-gray-50 rounded-lg p-3"><i className="bi bi-people text-gray-600 text-xl mb-1"></i><p className="text-base text-gray-600">Guests</p><p className="font-semibold">{selectedBooking.numberOfGuests}</p></div>
                </div>
                <div className="mb-6"><h3 className="text-lg font-bold mb-2">Booking Details</h3><div className="space-y-2 text-gray-700"><div><span className={`px-3 py-1 text-base font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}><i className={`bi ${getStatusIcon(selectedBooking.status)} mr-1`}></i>{selectedBooking.status}</span></div><p><i className="bi bi-geo-alt mr-2 w-4 text-center"></i><strong>Location:</strong> {selectedBooking.location}</p><p><i className="bi bi-pin-map mr-2 w-4 text-center"></i><strong>Meeting Point:</strong> {selectedBooking.meetingPoint}</p><p><i className="bi bi-person-circle mr-2 w-4 text-center"></i><strong>Tour Guide:</strong> {selectedBooking.guideName} ({selectedBooking.guideContact})</p></div></div>
                {selectedBooking.specialRequests && <div className="mb-6"><h3 className="text-lg font-bold mb-2">My Special Requests</h3><p className="text-gray-600 bg-blue-50 rounded-lg p-3"><i className="bi bi-sticky mr-2"></i>{selectedBooking.specialRequests}</p></div>}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (<>
                    <button onClick={() => { setShowDetailModal(false); handleEdit(selectedBooking); }} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium order-last sm:order-first"><i className="bi bi-pencil mr-2"></i>Edit Booking</button>
                    <button onClick={() => handleCancelBooking(selectedBooking)} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"><i className="bi bi-x-circle mr-2"></i>Cancel Booking</button>
                  </>)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Add/Edit Modal */}
        {showAddEditModal && editingBooking && (
          <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{editingBooking.id ? 'Edit Your Booking' : 'Book a New Tour'}</h3>
                  <button onClick={() => { setShowAddEditModal(false); setEditingBooking(null); }} className="text-gray-400 cursor-pointer hover:text-red-600"><i className="bi bi-x-lg text-2xl"></i></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block font-medium text-gray-700 mb-2">Tour Title *</label><input type="text" value={editingBooking.tourTitle || ''} onChange={(e) => setEditingBooking(p => ({ ...p, tourTitle: e.target.value }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Downtown Walking Tour"/></div>
                  <div><label className="block font-medium text-gray-700 mb-2">Tour Type *</label><select value={editingBooking.tourType || 'city'} onChange={(e) => setEditingBooking(p => ({ ...p, tourType: e.target.value as UserBooking['tourType'] }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="city">City Tour</option><option value="nature">Nature</option><option value="cultural">Cultural</option><option value="adventure">Adventure</option><option value="food">Food & Culinary</option><option value="historical">Historical</option></select></div>
                  <div><label className="block font-medium text-gray-700 mb-2">Date *</label><input type="date" value={editingBooking.date ? new Date(editingBooking.date).toISOString().split('T')[0] : ''} onChange={(e) => setEditingBooking(p => ({ ...p, date: new Date(e.target.value) }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block font-medium text-gray-700 mb-2">Start Time *</label><input type="time" value={editingBooking.startTime || ''} onChange={(e) => setEditingBooking(p => ({ ...p, startTime: e.target.value }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
                  <div><label className="block font-medium text-gray-700 mb-2">Number of Guests *</label><input type="number" value={editingBooking.numberOfGuests || ''} onChange={(e) => setEditingBooking(p => ({ ...p, numberOfGuests: parseInt(e.target.value) }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min="1" max="20"/></div>
                  <div><label className="block font-medium text-gray-700 mb-2">Location *</label><input type="text" value={editingBooking.location || ''} onChange={(e) => setEditingBooking(p => ({ ...p, location: e.target.value }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Downtown District"/></div>
                  <div className="md:col-span-2"><label className="block text-base font-medium text-gray-700 mb-2">Special Requests</label><textarea value={editingBooking.specialRequests || ''} onChange={(e) => setEditingBooking(p => ({ ...p, specialRequests: e.target.value }))} className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} placeholder="e.g., Dietary restrictions, accessibility needs..."/></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button onClick={handleSaveBooking} className="flex-1 px-6 py-3 cursor-pointer text-white rounded-lg font-medium" style={{ backgroundColor: '#083A85' }}><i className="bi bi-check-lg mr-2"></i>{editingBooking.id ? 'Update Booking' : 'Submit Booking Request'}</button>
                  <button onClick={() => { setShowAddEditModal(false); setEditingBooking(null); }} className="flex-1 sm:flex-initial px-6 py-3 cursor-pointer bg-gray-300 text-black rounded-lg hover:bg-gray-400 font-medium">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSchedulePage;