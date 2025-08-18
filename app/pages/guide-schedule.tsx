"use client";
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface TourSchedule {
  id: string;
  tourTitle: string;
  tourType: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  date: Date;
  startTime: string;
  endTime: string;
  duration: number; // in hours
  location: string;
  meetingPoint: string;
  maxGuests: number;
  currentGuests: number;
  status: 'available' | 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  pricePerPerson: boolean;
  language: string[];
  description?: string;
  specialInstructions?: string;
  guestNotes?: string;
  bookings?: Booking[];
  createdAt: Date;
  lastModified: Date;
}

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  numberOfPeople: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingDate: Date;
  specialRequests?: string;
}

type ViewMode = 'calendar' | 'list';
type SortField = 'date' | 'tourTitle' | 'status' | 'guests';
type SortOrder = 'asc' | 'desc';

const TourGuideSchedulePage: React.FC = () => {
  // Date formatting helpers
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMMM yyyy':
        return `${fullMonths[month]} ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      case 'EEE, MMM dd':
        return `${days[dayOfWeek]}, ${months[month]} ${day}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<TourSchedule[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<TourSchedule> | null>(null);
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
    const generateMockSchedules = (): TourSchedule[] => {
      const statuses: TourSchedule['status'][] = ['available', 'confirmed', 'pending', 'cancelled', 'completed'];
      const tourTypes: TourSchedule['tourType'][] = ['city', 'nature', 'cultural', 'adventure', 'food', 'historical'];
      const tourTitles = [
        'Downtown Walking Tour', 'Sunset Beach Adventure', 'Cultural Heritage Experience',
        'Mountain Hiking Expedition', 'Local Food & Market Tour', 'Historical Sites Discovery',
        'Art Gallery & Museum Tour', 'Wildlife Safari Experience', 'Coastal Kayaking Adventure',
        'Night City Photography Tour'
      ];
      const locations = [
        'Downtown District', 'Beachfront Promenade', 'Old Town Square',
        'Mountain Base Camp', 'Central Market', 'Historic Quarter', 'Museum District'
      ];
      const languages = [['English'], ['English', 'Spanish'], ['English', 'French'], ['English', 'German']];
      
      const schedules: TourSchedule[] = [];
      const today = new Date();
      
      // Generate schedules for the next 60 days
      for (let dayOffset = -10; dayOffset < 50; dayOffset++) {
        const scheduleDate = new Date(today);
        scheduleDate.setDate(today.getDate() + dayOffset);
        
        // Generate 0-3 tours per day
        const toursPerDay = Math.floor(Math.random() * 4);
        
        for (let tourNum = 0; tourNum < toursPerDay; tourNum++) {
          const status = dayOffset < 0 ? 'completed' : 
                         statuses[Math.floor(Math.random() * (statuses.length - 1))];
          const maxGuests = Math.floor(Math.random() * 15) + 5;
          const currentGuests = status === 'available' ? 0 : 
                               status === 'cancelled' ? 0 :
                               Math.floor(Math.random() * maxGuests);
          
          const startHour = 8 + Math.floor(Math.random() * 10);
          const duration = Math.floor(Math.random() * 4) + 1;
          
          schedules.push({
            id: `TS${String(schedules.length + 1).padStart(5, '0')}`,
            tourTitle: tourTitles[Math.floor(Math.random() * tourTitles.length)],
            tourType: tourTypes[Math.floor(Math.random() * tourTypes.length)],
            date: new Date(scheduleDate),
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
            duration: duration,
            location: locations[Math.floor(Math.random() * locations.length)],
            meetingPoint: 'Main entrance, near the information desk',
            maxGuests: maxGuests,
            currentGuests: currentGuests,
            status: status,
            price: Math.floor(Math.random() * 100) + 50,
            pricePerPerson: true,
            language: languages[Math.floor(Math.random() * languages.length)],
            description: 'Join us for an unforgettable experience exploring the best our city has to offer.',
            specialInstructions: Math.random() > 0.5 ? 'Please wear comfortable walking shoes and bring water.' : undefined,
            guestNotes: Math.random() > 0.7 ? 'Group includes children under 12' : undefined,
            createdAt: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            lastModified: new Date(),
            bookings: currentGuests > 0 ? generateBookings(currentGuests) : []
          });
        }
      }
      
      return schedules;
    };

    const generateBookings = (guestCount: number): Booking[] => {
      const bookings: Booking[] = [];
      let remainingGuests = guestCount;
      
      while (remainingGuests > 0) {
        const groupSize = Math.min(Math.floor(Math.random() * 4) + 1, remainingGuests);
        bookings.push({
          id: `B${Math.random().toString(36).substr(2, 9)}`,
          guestName: `Guest ${bookings.length + 1}`,
          guestEmail: `guest${bookings.length + 1}@email.com`,
          numberOfPeople: groupSize,
          status: Math.random() > 0.2 ? 'confirmed' : 'pending',
          bookingDate: new Date(),
          specialRequests: Math.random() > 0.7 ? 'Vegetarian meal required' : undefined
        });
        remainingGuests -= groupSize;
      }
      
      return bookings;
    };

    setTimeout(() => {
      setSchedules(generateMockSchedules());
      setLoading(false);
    }, 1000);
  }, []);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = schedules.filter(s => s.date >= today && s.status !== 'completed' && s.status !== 'cancelled');
    const todaySchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === today.getTime();
    });
    
    return {
      total: schedules.length,
      upcoming: upcoming.length,
      today: todaySchedules.length,
      confirmed: schedules.filter(s => s.status === 'confirmed').length,
      pending: schedules.filter(s => s.status === 'pending').length,
      available: schedules.filter(s => s.status === 'available').length,
      totalGuests: schedules.reduce((sum, s) => sum + s.currentGuests, 0),
      revenue: schedules.filter(s => s.status === 'confirmed' || s.status === 'completed')
                       .reduce((sum, s) => sum + (s.price * s.currentGuests), 0)
    };
  }, [schedules]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...schedules];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(schedule =>
        schedule.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    // Tour type filter
    if (tourTypeFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.tourType === tourTypeFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(0);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date(9999, 11, 31);
      filtered = filtered.filter(schedule => 
        schedule.date >= startDate && schedule.date <= endDate
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'tourTitle':
          comparison = a.tourTitle.localeCompare(b.tourTitle);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'guests':
          comparison = a.currentGuests - b.currentGuests;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredSchedules(filtered);
    setCurrentPage(1);
  }, [schedules, searchTerm, statusFilter, tourTypeFilter, dateRange, sortField, sortOrder]);

  // Pagination for list view
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Calendar view data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate);
        const daySchedules = filteredSchedules.filter(s => {
          const scheduleDate = new Date(s.date);
          return scheduleDate.getDate() === date.getDate() &&
                 scheduleDate.getMonth() === date.getMonth() &&
                 scheduleDate.getFullYear() === date.getFullYear();
        });
        
        week.push({
          date: date,
          schedules: daySchedules,
          isCurrentMonth: date.getMonth() === month
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, [currentMonth, filteredSchedules]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (schedule: TourSchedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleAddNew = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setEditingSchedule({
      tourTitle: '',
      tourType: 'city',
      date: tomorrow,
      startTime: '09:00',
      endTime: '12:00',
      duration: 3,
      location: '',
      meetingPoint: '',
      maxGuests: 10,
      currentGuests: 0,
      status: 'available',
      price: 50,
      pricePerPerson: true,
      language: ['English'],
      description: '',
      specialInstructions: '',
      guestNotes: ''
    });
    setShowAddEditModal(true);
  };

  const handleEdit = (schedule: TourSchedule) => {
    setEditingSchedule(schedule);
    setShowAddEditModal(true);
  };

  const handleSaveSchedule = () => {
    if (editingSchedule) {
      if (editingSchedule.id) {
        // Update existing
        setSchedules(prev => 
          prev.map(s => s.id === editingSchedule.id ? {...s, ...editingSchedule, lastModified: new Date()} as TourSchedule : s)
        );
      } else {
        // Add new
        const newSchedule: TourSchedule = {
          ...editingSchedule as TourSchedule,
          id: `TS${String(schedules.length + 1).padStart(5, '0')}`,
          bookings: [],
          createdAt: new Date(),
          lastModified: new Date()
        };
        setSchedules(prev => [...prev, newSchedule]);
      }
      setShowAddEditModal(false);
      setEditingSchedule(null);
    }
  };

  const handleDelete = (scheduleId: string) => {
    if (confirm('Are you sure you want to delete this tour schedule? This action cannot be undone.')) {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
      setShowDetailModal(false);
    }
  };

  const handleCancelTour = (schedule: TourSchedule) => {
    if (confirm(`Are you sure you want to cancel "${schedule.tourTitle}"? All guests will be notified.`)) {
      setSchedules(prev => 
        prev.map(s => s.id === schedule.id ? {...s, status: 'cancelled'} : s)
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'bi-calendar-plus';
      case 'confirmed': return 'bi-calendar-check';
      case 'pending': return 'bi-hourglass-split';
      case 'cancelled': return 'bi-calendar-x';
      case 'completed': return 'bi-check-circle';
      default: return 'bi-calendar';
    }
  };

  const getTourTypeIcon = (type: string) => {
    switch (type) {
      case 'city': return 'bi-buildings';
      case 'nature': return 'bi-tree';
      case 'cultural': return 'bi-palette';
      case 'adventure': return 'bi-bicycle';
      case 'food': return 'bi-cup-hot';
      case 'historical': return 'bi-hourglass';
      default: return 'bi-map';
    }
  };

  return (
    <div className="pt-14">
      <div className="mx-auto px-2 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tour Guide Schedule</h1>
          <p className="text-gray-600 mt-2">Manage your availability and scheduled tours</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.today}</p>
              </div>
              <i className="bi bi-calendar-day text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.upcoming}</p>
              </div>
              <i className="bi bi-calendar-week text-2xl text-blue-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.confirmed}</p>
              </div>
              <i className="bi bi-calendar-check text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <i className="bi bi-hourglass-split text-2xl text-yellow-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-purple-600">{summaryStats.available}</p>
              </div>
              <i className="bi bi-calendar-plus text-2xl text-purple-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tours</p>
                <p className="text-2xl font-bold text-gray-600">{summaryStats.total}</p>
              </div>
              <i className="bi bi-map text-2xl text-gray-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Guests</p>
                <p className="text-2xl font-bold text-indigo-600">{summaryStats.totalGuests}</p>
              </div>
              <i className="bi bi-people text-2xl text-indigo-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-xl font-bold text-green-600">${summaryStats.revenue}</p>
              </div>
              <i className="bi bi-cash-stack text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 rounded-lg shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tour name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="bi bi-search absolute left-3 top-3 text-gray-700"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Tour Type Filter */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Tour Type</label>
              <select
                value={tourTypeFilter}
                onChange={(e) => setTourTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="city">City Tour</option>
                <option value="nature">Nature</option>
                <option value="cultural">Cultural</option>
                <option value="adventure">Adventure</option>
                <option value="food">Food & Culinary</option>
                <option value="historical">Historical</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* View Mode Toggle & Add New Button */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-base text-gray-600">
              Showing {viewMode === 'list' ? paginatedSchedules.length : filteredSchedules.length} of {filteredSchedules.length} tours
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAddNew}
                className="px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer"
                style={{ backgroundColor: '#083A85' }}
              >
                <i className="bi bi-plus-circle mr-2"></i>Add New Tour
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'calendar' ? '#083A85' : undefined }}
              >
                <i className="bi bi-calendar3 mr-2"></i>Calendar View
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
        {!loading && filteredSchedules.length === 0 && (
          <div className="bg-gray-100 rounded-lg shadow-xl p-12 text-center">
            <i className="bi bi-calendar text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">
              {schedules.length === 0 
                ? "No tours scheduled"
                : "No tours found"}
            </h3>
            <p className="text-gray-600 mt-2">
              {schedules.length === 0 
                ? "Start by adding your first tour schedule!"
                : "Try adjusting your filters or search criteria"}
            </p>
            {schedules.length === 0 && (
              <button
                onClick={handleAddNew}
                className="mt-4 px-6 py-3 text-white rounded-lg font-medium cursor-pointer"
                style={{ backgroundColor: '#083A85' }}
              >
                <i className="bi bi-plus-circle mr-2"></i>Add Your First Tour
              </button>
            )}
          </div>
        )}

        {/* Calendar View */}
        {!loading && filteredSchedules.length > 0 && viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <i className="bi bi-chevron-left text-xl"></i>
              </button>
              <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <i className="bi bi-chevron-right text-xl"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarData.map((week, weekIndex) => (
                week.map((day, dayIndex) => {
                  const isToday = new Date().toDateString() === day.date.toDateString();
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`bg-white min-h-[100px] p-2 ${
                        !day.isCurrentMonth ? 'opacity-50' : ''
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        {day.schedules.length > 0 && (
                          <span className="bg-gray-200 text-gray-700 text-xs px-1 rounded">
                            {day.schedules.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Tour indicators */}
                      <div className="space-y-1">
                        {day.schedules.slice(0, 3).map((schedule, index) => (
                          <div
                            key={schedule.id}
                            onClick={() => handleViewDetails(schedule)}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                              getStatusColor(schedule.status)
                            }`}
                          >
                            <div className="truncate">
                              {schedule.startTime} - {schedule.tourTitle}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span>{schedule.currentGuests}/{schedule.maxGuests}</span>
                              <i className={`bi ${getTourTypeIcon(schedule.tourType)} text-xs`}></i>
                            </div>
                          </div>
                        ))}
                        {day.schedules.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{day.schedules.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {!loading && filteredSchedules.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('date')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Date & Time
                        <i className={`bi bi-chevron-${sortField === 'date' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('tourTitle')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Tour
                        <i className={`bi bi-chevron-${sortField === 'tourTitle' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('guests')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Guests
                        <i className={`bi bi-chevron-${sortField === 'guests' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                      >
                        Status
                        <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i>
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSchedules.map((schedule) => {
                    const isUpcoming = schedule.date >= new Date() && schedule.status !== 'completed';
                    const isPast = schedule.date < new Date() || schedule.status === 'completed';
                    
                    return (
                      <tr key={schedule.id} className={`hover:bg-gray-50 transition-colors ${
                        isPast ? 'opacity-60' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-base font-medium text-gray-900">
                              {format(schedule.date, 'EEE, MMM dd')}
                            </div>
                            <div className="text-base text-gray-500">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <i className={`bi ${getTourTypeIcon(schedule.tourType)} text-xl mr-3 text-gray-400`}></i>
                            <div>
                              <div className="text-base font-medium text-gray-900">{schedule.tourTitle}</div>
                              <div className="text-base text-gray-500 capitalize">{schedule.tourType} • {schedule.duration}h</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-base text-gray-600">
                            <i className="bi bi-geo-alt text-gray-400 mr-1"></i>
                            {schedule.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.language.join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-base font-medium text-gray-900">
                              {schedule.currentGuests}/{schedule.maxGuests}
                            </div>
                            {schedule.currentGuests >= schedule.maxGuests && (
                              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                Full
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(schedule.currentGuests / schedule.maxGuests) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                            <i className={`bi ${getStatusIcon(schedule.status)} mr-1`}></i>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">
                            ${schedule.price * schedule.currentGuests}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${schedule.price}/person
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                          <button
                            onClick={() => handleViewDetails(schedule)}
                            className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"
                            title="View details"
                          >
                            <i className="bi bi-eye text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-gray-600 hover:text-gray-900 mr-3 cursor-pointer"
                            title="Edit schedule"
                          >
                            <i className="bi bi-pencil text-lg"></i>
                          </button>
                          {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelTour(schedule)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                              title="Cancel tour"
                            >
                              <i className="bi bi-x-circle text-lg"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination for List View */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSchedules.length)} of {filteredSchedules.length} tours
                  </div>
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
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedSchedule.tourTitle}</h2>
                    <p className="text-gray-600 mt-1">
                      <i className={`bi ${getTourTypeIcon(selectedSchedule.tourType)} mr-2`}></i>
                      {selectedSchedule.tourType} Tour • {selectedSchedule.duration} hours
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-2xl"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-calendar3 text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Date</p>
                    <p className="font-semibold">{format(selectedSchedule.date, 'EEE, MMM dd')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-clock text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Time</p>
                    <p className="font-semibold">{selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-people text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Guests</p>
                    <p className="font-semibold">{selectedSchedule.currentGuests}/{selectedSchedule.maxGuests}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-cash-stack text-gray-600 text-xl mb-1"></i>
                    <p className="text-base text-gray-600">Revenue</p>
                    <p className="font-semibold">${selectedSchedule.price * selectedSchedule.currentGuests}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Status & Details</h3>
                  <div className="flex items-center gap-4 mb-3">
                    <span className={`px-3 py-1 text-base font-semibold rounded-full ${getStatusColor(selectedSchedule.status)}`}>
                      <i className={`bi ${getStatusIcon(selectedSchedule.status)} mr-1`}></i>
                      {selectedSchedule.status}
                    </span>
                    <span className="text-gray-600">
                      <i className="bi bi-geo-alt mr-1"></i>
                      {selectedSchedule.location}
                    </span>
                    <span className="text-gray-600">
                      <i className="bi bi-translate mr-1"></i>
                      {selectedSchedule.language.join(', ')}
                    </span>
                  </div>
                  {selectedSchedule.meetingPoint && (
                    <p className="text-gray-600 mb-2">
                      <i className="bi bi-pin-map mr-2"></i>
                      <strong>Meeting Point:</strong> {selectedSchedule.meetingPoint}
                    </p>
                  )}
                  {selectedSchedule.description && (
                    <p className="text-gray-600">{selectedSchedule.description}</p>
                  )}
                </div>

                {selectedSchedule.specialInstructions && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Special Instructions</h3>
                    <p className="text-gray-600 bg-yellow-50 rounded-lg p-3">
                      <i className="bi bi-info-circle mr-2"></i>
                      {selectedSchedule.specialInstructions}
                    </p>
                  </div>
                )}

                {selectedSchedule.guestNotes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-2">Guest Notes</h3>
                    <p className="text-gray-600 bg-blue-50 rounded-lg p-3">
                      <i className="bi bi-sticky mr-2"></i>
                      {selectedSchedule.guestNotes}
                    </p>
                  </div>
                )}

                {/* Bookings List */}
                {selectedSchedule.bookings && selectedSchedule.bookings.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Guest Bookings</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Guest Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">People</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Special Requests</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedSchedule.bookings.map((booking) => (
                            <tr key={booking.id}>
                              <td className="px-4 py-2 text-sm">{booking.guestName}</td>
                              <td className="px-4 py-2 text-sm">{booking.guestEmail}</td>
                              <td className="px-4 py-2 text-sm">{booking.numberOfPeople}</td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {booking.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-500">
                                {booking.specialRequests || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedSchedule);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium cursor-pointer"
                  >
                    <i className="bi bi-pencil mr-2"></i>
                    Edit Tour
                  </button>
                  {selectedSchedule.status !== 'cancelled' && selectedSchedule.status !== 'completed' && (
                    <button
                      onClick={() => {
                        handleCancelTour(selectedSchedule);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium cursor-pointer"
                    >
                      <i className="bi bi-x-circle mr-2"></i>
                      Cancel Tour
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDelete(selectedSchedule.id);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
                  >
                    <i className="bi bi-trash mr-2"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddEditModal && editingSchedule && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingSchedule.id ? 'Edit Tour Schedule' : 'Add New Tour Schedule'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddEditModal(false);
                      setEditingSchedule(null);
                    }}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-2xl"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tour Title */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Tour Title *
                    </label>
                    <input
                      type="text"
                      value={editingSchedule.tourTitle || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, tourTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown Walking Tour"
                    />
                  </div>

                  {/* Tour Type */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Tour Type *
                    </label>
                    <select
                      value={editingSchedule.tourType || 'city'}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, tourType: e.target.value as TourSchedule['tourType'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="city">City Tour</option>
                      <option value="nature">Nature</option>
                      <option value="cultural">Cultural</option>
                      <option value="adventure">Adventure</option>
                      <option value="food">Food & Culinary</option>
                      <option value="historical">Historical</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={editingSchedule.date ? new Date(editingSchedule.date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, date: new Date(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={editingSchedule.startTime || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={editingSchedule.endTime || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Max Guests */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Maximum Guests *
                    </label>
                    <input
                      type="number"
                      value={editingSchedule.maxGuests || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, maxGuests: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Price per Person ($) *
                    </label>
                    <input
                      type="number"
                      value={editingSchedule.price || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={editingSchedule.status || 'available'}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, status: e.target.value as TourSchedule['status'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="available">Available</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={editingSchedule.location || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Downtown District"
                    />
                  </div>

                  {/* Meeting Point */}
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Meeting Point *
                    </label>
                    <input
                      type="text"
                      value={editingSchedule.meetingPoint || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Main entrance, near the information desk"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Tour Description
                    </label>
                    <textarea
                      value={editingSchedule.description || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Describe the tour experience..."
                    />
                  </div>

                  {/* Special Instructions */}
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Special Instructions for Guests
                    </label>
                    <textarea
                      value={editingSchedule.specialInstructions || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="e.g., Please wear comfortable walking shoes..."
                    />
                  </div>

                  {/* Guest Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Internal Notes
                    </label>
                    <textarea
                      value={editingSchedule.guestNotes || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, guestNotes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      placeholder="Private notes about this tour or guests..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium cursor-pointer"
                    style={{ backgroundColor: '#083A85' }}
                  >
                    <i className="bi bi-check-lg mr-2"></i>
                    {editingSchedule.id ? 'Update Tour' : 'Create Tour'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddEditModal(false);
                      setEditingSchedule(null);
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"
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

export default TourGuideSchedulePage;