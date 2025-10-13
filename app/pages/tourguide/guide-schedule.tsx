"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService';

// Types
interface TourSchedule {
  id: string;
  scheduleId?: string;
  tourId: string;
  title: string;
  tourTitle?: string;
  tourType: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  location: string;
  meetingPoint: string;
  maxGuests: number;
  totalSlots?: number;
  currentGuests: number;
  bookedSlots?: number;
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

interface CalendarDay {
  date: string;
  tours: TourSchedule[];
  totalBookings: number;
  totalRevenue: number;
  isToday: boolean;
}

interface Tour {
  duration: number;
  shortDescription: string | undefined;
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
}

type ViewMode = 'calendar' | 'list';

const KYCPendingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-50 rounded-full">
            <i className="bi bi-hourglass-split text-2xl text-yellow-600"></i>
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 mb-3">
            KYC Verification Pending
          </h3>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Your account verification is currently being processed. Please wait for verification to complete before performing this action. This process typically takes 2-4 hours.
          </p>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors font-medium cursor-pointer text-sm"
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('en-US');
  };

  // Helper function to normalize tour data from API
  const normalizeTourData = (schedule: any, tour: Tour): TourSchedule => {
    return {
      id: schedule.id,
      scheduleId: schedule.id,
      tourId: tour.id,
      title: tour.title,
      tourTitle: tour.title,
      tourType: tour.type as 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical',
      date: new Date(schedule.startDate),  // Use startDate; handle multi-day if needed
      startTime: schedule.startTime || '09:00',
      endTime: schedule.endTime || '17:00',
      duration: tour.duration || 8,
      location: tour.location || '',
      meetingPoint: schedule.meetingPoint || '',
      maxGuests: schedule.availableSlots || 10,
      totalSlots: schedule.availableSlots,
      currentGuests: schedule.bookedSlots || 0,
      bookedSlots: schedule.bookedSlots,
      status: schedule.isAvailable ? 'available' : 'confirmed',
      price: tour.price || 0,
      pricePerPerson: true,
      language: schedule.language || ['English'],
      description: tour.shortDescription,
      specialInstructions: schedule.specialInstructions,
      guestNotes: schedule.guestNotes,
      bookings: schedule.bookings || [],
      createdAt: new Date(schedule.createdAt),
      lastModified: new Date(schedule.updatedAt)
    };
  };

  // States
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<TourSchedule[]>([]);
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<TourSchedule> | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tourTypeFilter, setTourTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
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

  // API Functions
  const fetchAvailableTours = async () => {
    try {
      const response: any = await api.get('/tours/guide/my-tours');
      if (response.data.success) {
        setAvailableTours(response.data.data.tours || []);
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    }
  };

  const fetchTourSchedules = async () => {
    if (availableTours.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      
      const allSchedules: TourSchedule[] = [];
      
      for (const tour of availableTours) {
        const response: any = await api.get(`/tours/${tour.id}/schedules`);
        if (response.data.success && Array.isArray(response.data.data)) {
          const tourSchedules = response.data.data.map((schedule: any) =>
            normalizeTourData(schedule, tour)
          );
          allSchedules.push(...tourSchedules);
        }
      }
      
      const uniqueSchedules = allSchedules.filter(
        (schedule, index, self) => index === self.findIndex((s) => s.id === schedule.id)
      );
      
      setSchedules(uniqueSchedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to fetch schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = (year: number, month: number) => {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    const calendarDays: CalendarDay[] = [];
    
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      
      const dayTours = schedules.filter((s) => {
        const scheduleDate = new Date(s.date);
        return (
          scheduleDate.getFullYear() === year &&
          scheduleDate.getMonth() === month &&
          scheduleDate.getDate() === day
        );
      });
      
      const totalBookings = dayTours.reduce((sum, s) => sum + (s.currentGuests || 0), 0);
      const totalRevenue = dayTours.reduce(
        (sum, s) => sum + (s.price || 0) * (s.currentGuests || 0),
        0
      );
      
      calendarDays.push({
        date: dateString,
        tours: dayTours,
        totalBookings,
        totalRevenue,
        isToday: date.toDateString() === new Date().toDateString(),
      });
    }
    
    setCalendarData(calendarDays);
  };

  const createTourSchedule = async (scheduleData: Partial<TourSchedule>) => {
    try {
      setLoading(true);
      
      if (!scheduleData.tourId) {
        throw new Error('Tour selection is required to create a schedule');
      }
      
      const response: any = await api.post(`/tours/${scheduleData.tourId}/schedules`, scheduleData);
      
      if (response.data.success) {
        await fetchTourSchedules();
        return response.data.data;
      } else {
        throw new Error(response.message || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      setError('Failed to create schedule. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTourSchedule = async (scheduleId: string, scheduleData: Partial<TourSchedule>) => {
    try {
      setLoading(true);
      const response: any = await api.put(`/tours/schedules/${scheduleId}`, scheduleData);
      
      if (response.data.success) {
        await fetchTourSchedules();
        return response.data.data;
      } else {
        throw new Error(response.message || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      setError('Failed to update schedule. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTourSchedule = async (scheduleId: string) => {
    try {
      setLoading(true);
      const response: any = await api.delete(`/tours/schedules/${scheduleId}`);
      
      if (response.data.success) {
        await fetchTourSchedules();
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAvailableTours();
    fetchUserData();
  }, []);

  // Fetch schedules after availableTours is set
  useEffect(() => {
    if (availableTours.length > 0) {
      fetchTourSchedules();
    }
  }, [availableTours]);

  // Update calendar when month changes or schedules update
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    fetchCalendarData(year, month);
  }, [currentMonth, schedules]);

  // Calculate summary stats with safe number handling
  const summaryStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = schedules.filter(s => s.date >= today && s.status !== 'completed' && s.status !== 'cancelled');
    const todaySchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === today.getTime();
    });
    
    // Safe calculation of total guests
    const totalGuests = schedules.reduce((sum, s) => {
      const guests = s.currentGuests || s.bookedSlots || 0;
      return sum + (isNaN(guests) ? 0 : guests);
    }, 0);
    
    // Safe calculation of revenue
    const revenue = schedules
      .filter(s => s.status === 'confirmed' || s.status === 'completed')
      .reduce((sum, s) => {
        const guests = s.currentGuests || s.bookedSlots || 0;
        const price = s.price || 0;
        const scheduleRevenue = price * guests;
        return sum + (isNaN(scheduleRevenue) ? 0 : scheduleRevenue);
      }, 0);
    
    return {
      total: schedules.length,
      upcoming: upcoming.length,
      today: todaySchedules.length,
      confirmed: schedules.filter(s => s.status === 'confirmed').length,
      pending: schedules.filter(s => s.status === 'pending').length,
      available: schedules.filter(s => s.status === 'available').length,
      totalGuests: isNaN(totalGuests) ? 0 : totalGuests,
      revenue: isNaN(revenue) ? 0 : revenue
    };
  }, [schedules]);

  // Filter logic
  useEffect(() => {
    let filtered = [...schedules];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(schedule => {
        const title = schedule.title || schedule.tourTitle || '';
        const location = schedule.location || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               location.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : new Date(0);
      const endDate = dateRange.end ? new Date(dateRange.end) : new Date(9999, 11, 31);
      filtered = filtered.filter(schedule => 
        schedule.date >= startDate && schedule.date <= endDate
      );
    }

    setFilteredSchedules(filtered);
    setCurrentPage(1);
  }, [schedules, searchTerm, statusFilter, tourTypeFilter, dateRange]);

  // Pagination for list view
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Calendar view data
  const calendarViewData = useMemo(() => {
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
        const dateString = date.toISOString().split('T')[0];
        
        // Find calendar day data
        const calendarDay = calendarData.find(day => 
          day.date.startsWith(dateString)
        );
        
        const daySchedules = calendarDay?.tours || [];
        
        const totalBookings = calendarDay?.totalBookings || 0;
        const totalRevenue = calendarDay?.totalRevenue || 0;
        
        week.push({
          date: date,
          schedules: daySchedules,
          isCurrentMonth: date.getMonth() === month,
          totalBookings: isNaN(totalBookings) ? 0 : totalBookings,
          totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }
    
    return weeks;
  }, [currentMonth, calendarData]);

  // Handlers
  const handleViewDetails = (schedule: TourSchedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const handleAddNew = () => {
    if (!checkKYCStatus()) return;
    if (availableTours.length === 0) {
      setError('You need to create at least one tour before scheduling.');
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const firstTour = availableTours[0];
    setEditingSchedule({
      tourId: firstTour.id,
      title: firstTour.title,
      tourTitle: firstTour.title,
      tourType: (firstTour.type as any) || 'city',
      date: tomorrow,
      startTime: '09:00',
      endTime: '12:00',
      duration: 3,
      location: firstTour.location,
      meetingPoint: '',
      maxGuests: 10,
      currentGuests: 0,
      status: 'available',
      price: firstTour.price || 50,
      pricePerPerson: true,
      language: ['English'],
      description: '',
      specialInstructions: '',
      guestNotes: ''
    });
    setShowAddEditModal(true);
  };

  const handleEdit = (schedule: TourSchedule) => {
    if (!checkKYCStatus()) return;
    setEditingSchedule(schedule);
    setShowAddEditModal(true);
  };

  const handleSaveSchedule = async () => {
    if (editingSchedule) {
      try {
        if (editingSchedule.id) {
          await updateTourSchedule(editingSchedule.id, editingSchedule);
        } else {
          await createTourSchedule(editingSchedule);
        }
        setShowAddEditModal(false);
        setEditingSchedule(null);
        setError(null);
      } catch (err) {
        console.error('Error saving schedule:', err);
      }
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!checkKYCStatus()) return;
    if (confirm('Are you sure you want to delete this tour schedule? This action cannot be undone.')) {
      try {
        await deleteTourSchedule(scheduleId);
        setShowDetailModal(false);
        setError(null);
      } catch (err) {
        console.error('Error deleting schedule:', err);
      }
    }
  };

  const handleCancelTour = async (schedule: TourSchedule) => {
    if (confirm(`Are you sure you want to cancel "${schedule.title || schedule.tourTitle}"? All guests will be notified.`)) {
      try {
        await updateTourSchedule(schedule.id, { ...schedule, status: 'cancelled' });
        setError(null);
      } catch (err) {
        console.error('Error cancelling tour:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-50 text-green-800';
      case 'confirmed': return 'bg-blue-50 text-blue-800';
      case 'pending': return 'bg-yellow-50 text-yellow-800';
      case 'cancelled': return 'bg-red-50 text-red-800';
      case 'completed': return 'bg-gray-50 text-gray-800';
      default: return 'bg-gray-50 text-gray-800';
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
    <div className="pt-5">
      <div className="mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-3 max-w-8xl">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-xl sm:text-2xl font-bold text-black">Schedules</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your availability and scheduled tours</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8 sm:mb-12">
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Today</p>
                <p className="text-lg font-bold text-black">{summaryStats.today}</p>
              </div>
              <i className="bi bi-calendar-day text-lg text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Upcoming</p>
                <p className="text-lg font-bold text-[#FF385C]">{summaryStats.upcoming}</p>
              </div>
              <i className="bi bi-calendar-week text-lg text-[#FF385C]"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Confirmed</p>
                <p className="text-lg font-bold text-green-600">{summaryStats.confirmed}</p>
              </div>
              <i className="bi bi-calendar-check text-lg text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <i className="bi bi-hourglass-split text-lg text-yellow-500"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Available</p>
                <p className="text-lg font-bold text-purple-600">{summaryStats.available}</p>
              </div>
              <i className="bi bi-calendar-plus text-lg text-purple-500"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Tours</p>
                <p className="text-lg font-bold text-gray-600">{summaryStats.total}</p>
              </div>
              <i className="bi bi-map text-lg text-gray-500"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Guests</p>
                <p className="text-lg font-bold text-indigo-600">{summaryStats.totalGuests}</p>
              </div>
              <i className="bi bi-people text-lg text-indigo-500"></i>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-green-600">${formatCurrency(summaryStats.revenue)}</p>
              </div>
              <i className="bi bi-cash-stack text-lg text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 mb-8 sm:mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tour name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                />
                <i className="bi bi-search absolute left-2 top-2.5 text-gray-400 text-sm"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                />
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-3">
            <p className="text-sm text-gray-600">
              Showing {viewMode === 'list' ? paginatedSchedules.length : filteredSchedules.length} of {filteredSchedules.length} tours
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm ${
                  viewMode === 'calendar' 
                    ? 'bg-[#FF385C] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="bi bi-calendar3 mr-1"></i>
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm ${
                  viewMode === 'list' 
                    ? 'bg-[#FF385C] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className="bi bi-list-ul mr-1"></i>
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C]"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-red-600 mr-2 text-sm"></i>
              <span className="text-red-800 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSchedules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-8 sm:p-12 text-center">
            <i className="bi bi-calendar text-4xl sm:text-5xl text-gray-300"></i>
            <h3 className="text-base font-medium text-black mt-3">
              {schedules.length === 0 
                ? "No tours scheduled"
                : "No tours found"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {schedules.length === 0 
                ? "Start by adding your first tour schedule!"
                : "Try adjusting your filters or search criteria"}
            </p>
            {schedules.length === 0 && availableTours.length > 0 && (
              <button
                onClick={handleAddNew}
                className="mt-3 px-4 py-2 bg-[#FF385C] text-white rounded-lg font-medium cursor-pointer text-sm"
              >
                <i className="bi bi-plus-circle mr-1"></i>Add Your First Schedule
              </button>
            )}
            {availableTours.length === 0 && (
              <p className="text-xs text-gray-500 mt-2">
                You need to create tours first before scheduling.
              </p>
            )}
          </div>
        )}

        {/* Calendar View */}
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="bi bi-chevron-left text-base"></i>
              </button>
              <h2 className="text-base font-bold text-black">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-1 hover:bg-gray-100 rounded-full cursor-pointer"
              >
                <i className="bi bi-chevron-right text-base"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 bg-white">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-1 text-center text-xs font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarViewData.flat().map((day, index) => {
                const isToday = new Date().toDateString() === day.date.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[100px] p-1 border border-gray-100 rounded-lg ${
                      !day.isCurrentMonth ? 'opacity-50' : ''
                    } ${isToday ? 'ring-2 ring-[#FF385C]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-medium ${
                        isToday ? 'text-[#FF385C]' : 'text-black'
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {day.schedules.length > 0 && (
                        <span className="bg-gray-100 text-gray-700 text-xs px-1 rounded-full">
                          {day.schedules.length}
                        </span>
                      )}
                    </div>
                    
                    {/* Tour indicators */}
                    <div className="space-y-1">
                      {day.schedules.slice(0, 2).map((schedule, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleViewDetails(schedule)}
                          className={`text-xs p-1 rounded-lg cursor-pointer hover:opacity-80 ${
                            getStatusColor(schedule.status)
                          }`}
                        >
                          <div className="truncate font-medium">
                            {schedule.title || schedule.tourTitle}
                          </div>
                          <div className="flex justify-between items-center mt-0.5 text-gray-600">
                            <span>
                              {schedule.startTime}
                            </span>
                            <span>
                              {schedule.currentGuests || schedule.bookedSlots || 0}/{schedule.maxGuests || schedule.totalSlots || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                      {day.schedules.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{day.schedules.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {paginatedSchedules.map((schedule) => {
                const isUpcoming = schedule.date >= new Date() && schedule.status !== 'completed';
                const isPast = schedule.date < new Date() || schedule.status === 'completed';
                
                return (
                  <div key={schedule.id} className={`p-3 ${isPast ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-black text-sm">{schedule.title || schedule.tourTitle}</h3>
                        <p className="text-gray-600 mt-0.5 text-xs">
                          <i className={`bi ${getTourTypeIcon(schedule.tourType)} mr-1`}></i>
                          {schedule.tourType} • {schedule.duration}h
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <div>
                        <i className="bi bi-calendar mr-1"></i>
                        {format(schedule.date, 'MMM dd')}
                      </div>
                      <div>
                        <i className="bi bi-clock mr-1"></i>
                        {schedule.startTime}
                      </div>
                      <div>
                        <i className="bi bi-geo-alt mr-1"></i>
                        {schedule.location}
                      </div>
                      <div>
                        <i className="bi bi-people mr-1"></i>
                        {schedule.currentGuests || schedule.bookedSlots || 0}/{schedule.maxGuests || schedule.totalSlots || 0}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-black">
                        ${formatCurrency((schedule.price || 0) * (schedule.currentGuests || schedule.bookedSlots || 0))}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(schedule)}
                          className="text-gray-600 hover:text-[#FF385C] cursor-pointer"
                        >
                          <i className="bi bi-eye text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="text-gray-600 hover:text-[#FF385C] cursor-pointer"
                        >
                          <i className="bi bi-pencil text-sm"></i>
                        </button>
                        {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                          <button
                            onClick={() => handleCancelTour(schedule)}
                            className="text-gray-600 hover:text-red-600 cursor-pointer"
                          >
                            <i className="bi bi-x-circle text-sm"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                      <div 
                        className="bg-[#FF385C] h-1 rounded-full"
                        style={{ 
                          width: `${Math.min(100, ((schedule.currentGuests || schedule.bookedSlots || 0) / (schedule.maxGuests || schedule.totalSlots || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSchedules.map((schedule) => {
                    const isUpcoming = schedule.date >= new Date() && schedule.status !== 'completed';
                    const currentGuests = schedule.currentGuests || schedule.bookedSlots || 0;
                    const maxGuests = schedule.maxGuests || schedule.totalSlots || 1;
                    
                    return (
                      <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-black">
                              {format(schedule.date, 'EEE, MMM dd')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <i className={`bi ${getTourTypeIcon(schedule.tourType)} text-lg mr-2 text-gray-400`}></i>
                            <div>
                              <div className="text-sm font-medium text-black">{schedule.title || schedule.tourTitle}</div>
                              <div className="text-sm text-gray-500 capitalize">{schedule.tourType} • {schedule.duration}h</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            <i className="bi bi-geo-alt text-gray-400 mr-1"></i>
                            {schedule.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(schedule.language || ['English']).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-black">
                              {currentGuests}/{maxGuests}
                            </div>
                            {currentGuests >= maxGuests && (
                              <span className="ml-2 bg-red-50 text-red-800 text-xs px-1 py-0.5 rounded-full">
                                Full
                              </span>
                            )}
                          </div>
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-[#FF385C] h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, (currentGuests / maxGuests) * 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                            <i className={`bi ${getStatusIcon(schedule.status)} mr-1`}></i>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-black">
                            ${formatCurrency((schedule.price || 0) * currentGuests)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${formatCurrency(schedule.price || 0)}/person
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(schedule)}
                            className="text-gray-600 hover:text-[#FF385C] mr-2 cursor-pointer"
                            title="View details"
                          >
                            <i className="bi bi-eye text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-gray-600 hover:text-[#FF385C] mr-2 cursor-pointer"
                            title="Edit schedule"
                          >
                            <i className="bi bi-pencil text-sm"></i>
                          </button>
                          {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelTour(schedule)}
                              className="text-gray-600 hover:text-red-600 cursor-pointer"
                              title="Cancel tour"
                            >
                              <i className="bi bi-x-circle text-sm"></i>
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
              <div className="px-4 py-3 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-sm text-gray-700 order-2 sm:order-1">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSchedules.length)} of {filteredSchedules.length} tours
                  </div>
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-2 py-1 rounded-lg transition-colors text-sm ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                      }`}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>

                    {[...Array(Math.min(window.innerWidth < 640 ? 3 : 5, totalPages))].map((_, index) => {
                      let pageNum;
                      const maxPages = window.innerWidth < 640 ? 3 : 5;
                      if (totalPages <= maxPages) {
                        pageNum = index + 1;
                      } else if (currentPage <= Math.floor(maxPages/2) + 1) {
                        pageNum = index + 1;
                      } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                        pageNum = totalPages - maxPages + 1 + index;
                      } else {
                        pageNum = currentPage - Math.floor(maxPages/2) + index;
                      }

                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-sm ${
                            currentPage === pageNum
                              ? 'bg-[#FF385C] text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-2 py-1 rounded-lg transition-colors text-sm ${
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

        {/* Floating Action Button */}
        {!loading && (
          <button
            onClick={handleAddNew}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 bg-[#FF385C] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 cursor-pointer"
            title="Add New Schedule"
          >
            <i className="bi bi-plus text-2xl"></i>
          </button>
        )}

        {/* Add/Edit Modal */}
        {showAddEditModal && editingSchedule && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-black">
                    {editingSchedule.id ? 'Edit Schedule' : 'Add New Schedule'}
                  </h2>
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-base"></i>
                  </button>
                </div>
                
                {/* Form fields */}
                <div className="space-y-4">
                  {/* Tour Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Tour</label>
                    <select
                      value={editingSchedule.tourId || ''}
                      onChange={(e) => {
                        const selectedTour = availableTours.find(tour => tour.id === e.target.value);
                        setEditingSchedule(prev => ({
                          ...prev,
                          tourId: e.target.value,
                          title: selectedTour?.title || '',
                          tourTitle: selectedTour?.title || '',
                          tourType: (selectedTour?.type as any) || 'city',
                          location: selectedTour?.location || '',
                          price: selectedTour?.price || 50
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      required
                    >
                      {availableTours.map(tour => (
                        <option key={tour.id} value={tour.id}>
                          {tour.title} - {tour.location}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tour Title</label>
                    <input
                      type="text"
                      value={editingSchedule.title || editingSchedule.tourTitle || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ 
                        ...prev, 
                        title: e.target.value,
                        tourTitle: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      placeholder="Enter tour title"
                      readOnly
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tour Type</label>
                      <select
                        value={editingSchedule.tourType}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, tourType: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                        disabled
                      >
                        <option value="city">City Tour</option>
                        <option value="nature">Nature</option>
                        <option value="cultural">Cultural</option>
                        <option value="adventure">Adventure</option>
                        <option value="food">Food & Culinary</option>
                        <option value="historical">Historical</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={editingSchedule.duration || 3}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingSchedule.location || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={editingSchedule.date ? editingSchedule.date.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, date: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={editingSchedule.startTime || '09:00'}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={editingSchedule.endTime || '17:00'}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Guests</label>
                      <input
                        type="number"
                        min="1"
                        value={editingSchedule.maxGuests || 10}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price per Person ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.price || 50}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Meeting Point</label>
                    <input
                      type="text"
                      value={editingSchedule.meetingPoint || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      placeholder="Enter meeting point"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                    <textarea
                      value={editingSchedule.specialInstructions || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                      placeholder="Enter any special instructions for guests"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 px-4 py-2 bg-[#FF385C] text-white rounded-lg hover:bg-[#FF385C]/90 transition-colors text-sm"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingSchedule.id ? 'Update Schedule' : 'Create Schedule')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 mr-4">
                    <h2 className="text-base sm:text-lg font-bold text-black">
                      {selectedSchedule.title || selectedSchedule.tourTitle}
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm">
                      <i className={`bi ${getTourTypeIcon(selectedSchedule.tourType)} mr-1`}></i>
                      {selectedSchedule.tourType} Tour • {selectedSchedule.duration} hours
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
                  >
                    <i className="bi bi-x-lg text-base"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-calendar3 text-gray-600 text-base mb-1"></i>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium text-sm">{format(selectedSchedule.date, 'EEE, MMM dd')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-clock text-gray-600 text-base mb-1"></i>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium text-sm">{selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-people text-gray-600 text-base mb-1"></i>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-medium text-sm">
                      {selectedSchedule.currentGuests || selectedSchedule.bookedSlots || 0}/{selectedSchedule.maxGuests || selectedSchedule.totalSlots || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-cash-stack text-gray-600 text-base mb-1"></i>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="font-medium text-sm">
                      ${formatCurrency((selectedSchedule.price || 0) * (selectedSchedule.currentGuests || selectedSchedule.bookedSlots || 0))}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-bold mb-2">Status & Details</h3>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-0.5 text-sm font-medium rounded-full ${getStatusColor(selectedSchedule.status)}`}>
                      <i className={`bi ${getStatusIcon(selectedSchedule.status)} mr-1`}></i>
                      {selectedSchedule.status}
                    </span>
                    <span className="text-gray-600 text-sm">
                      <i className="bi bi-geo-alt mr-1"></i>
                      {selectedSchedule.location}
                    </span>
                    <span className="text-gray-600 text-sm">
                      <i className="bi bi-translate mr-1"></i>
                      {(selectedSchedule.language || ['English']).join(', ')}
                    </span>
                  </div>
                  {selectedSchedule.meetingPoint && (
                    <p className="text-gray-600 mb-1 text-sm">
                      <i className="bi bi-pin-map mr-1"></i>
                      <strong>Meeting Point:</strong> {selectedSchedule.meetingPoint}
                    </p>
                  )}
                  {selectedSchedule.description && (
                    <p className="text-gray-600 text-sm">{selectedSchedule.description}</p>
                  )}
                </div>

                {selectedSchedule.specialInstructions && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold mb-2">Special Instructions</h3>
                    <p className="text-gray-600 bg-yellow-50 rounded-lg p-3 text-sm">
                      <i className="bi bi-info-circle mr-1"></i>
                      {selectedSchedule.specialInstructions}
                    </p>
                  </div>
                )}

                {selectedSchedule.guestNotes && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold mb-2">Guest Notes</h3>
                    <p className="text-gray-600 bg-blue-50 rounded-lg p-3 text-sm">
                      <i className="bi bi-sticky mr-1"></i>
                      {selectedSchedule.guestNotes}
                    </p>
                  </div>
                )}

                {/* Bookings List */}
                {selectedSchedule.bookings && selectedSchedule.bookings.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-bold mb-2">Guest Bookings</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Guest Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">People</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Special Requests</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedSchedule.bookings.map((booking) => (
                              <tr key={booking.id}>
                                <td className="px-3 py-2 text-sm">{booking.guestName}</td>
                                <td className="px-3 py-2 text-sm">{booking.guestEmail}</td>
                                <td className="px-3 py-2 text-sm">{booking.numberOfPeople}</td>
                                <td className="px-3 py-2 text-sm">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    booking.status === 'confirmed' ? 'bg-green-50 text-green-800' :
                                    booking.status === 'pending' ? 'bg-yellow-50 text-yellow-800' :
                                    'bg-red-50 text-red-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">
                                  {booking.specialRequests || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedSchedule);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    <i className="bi bi-pencil mr-1"></i>
                    Edit Schedule
                  </button>
                  {selectedSchedule.status !== 'cancelled' && selectedSchedule.status !== 'completed' && (
                    <button
                      onClick={() => {
                        handleCancelTour(selectedSchedule);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors font-medium text-sm"
                    >
                      <i className="bi bi-x-circle mr-1"></i>
                      Cancel Tour
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDelete(selectedSchedule.id);
                    }}
                    className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
                  >
                    <i className="bi bi-trash mr-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
    </div>
  );
};

export default TourGuideSchedulePage;