"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService';
import ScheduleModal from '@/app/components/modals/ScheduleModal';

// Types remain the same
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

interface CalendarResponse {
  success: boolean;
  message: string;
  data: {
    year: number;
    month: number;
    days: CalendarDay[];
  };
}

interface Tour {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        <div className="p-8">
          <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-full">
            <i className="bi bi-hourglass-split text-4xl text-amber-600 animate-pulse"></i>
          </div>
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
            KYC Verification Pending
          </h3>
          <p className="text-gray-600 text-center leading-relaxed mb-8 text-base">
            Your account verification is currently being processed. Please wait for verification to complete before performing this action. This process typically takes 2-4 hours.
          </p>
          <button
            onClick={onClose}
            className="w-full py-4 bg-gradient-to-r from-[#083A85] to-[#0a4191] text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-base"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

const TourGuideSchedule: React.FC = () => {
  // Date formatting helpers (same as before)
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
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to normalize tour data from API
  const normalizeTourData = (tour: any): TourSchedule => {
    return {
      id: tour.id || tour.scheduleId || `schedule-${Date.now()}`,
      scheduleId: tour.scheduleId,
      tourId: tour.tourId || tour.id,
      title: tour.title || tour.tourTitle || 'Untitled Tour',
      tourTitle: tour.title || tour.tourTitle || 'Untitled Tour',
      tourType: tour.tourType || 'city',
      date: new Date(tour.date),
      startTime: tour.startTime || '09:00',
      endTime: tour.endTime || '17:00',
      duration: tour.duration || 8,
      location: tour.location || '',
      meetingPoint: tour.meetingPoint || '',
      maxGuests: tour.maxGuests || tour.totalSlots || 10,
      totalSlots: tour.totalSlots,
      currentGuests: tour.currentGuests || tour.bookedSlots || 0,
      bookedSlots: tour.bookedSlots,
      status: tour.status || 'available',
      price: tour.price || 0,
      pricePerPerson: tour.pricePerPerson !== false,
      language: tour.language || ['English'],
      description: tour.description,
      specialInstructions: tour.specialInstructions,
      guestNotes: tour.guestNotes,
      bookings: tour.bookings,
      createdAt: new Date(tour.createdAt || tour.date),
      lastModified: new Date(tour.lastModified || tour.date)
    };
  };

  // States (same as before)
  const [schedules, setSchedules] = useState<TourSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<TourSchedule[]>([]);
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'add' | 'edit' | 'view'>('add');
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

  // API Functions (same as before)
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
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      
      const allSchedules: TourSchedule[] = [];
      
      for (let i = 0; i < 18; i++) {
        const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        
        try {
          const response: any = await api.get(`/tours/guide/bookings/calendar?year=${year}&month=${month}`);
          
          if (response.data.success && response.data.data?.days) {
            const monthSchedules = response.data.data.days.flatMap((day: any) => 
              (day.tours || []).map((tour: any) => normalizeTourData({
                ...tour,
                date: day.date
              }))
            );
            
            allSchedules.push(...monthSchedules);
          }
        } catch (monthError) {
          console.warn(`Failed to fetch calendar data for ${year}-${month}:`, monthError);
        }
      }
      
      const uniqueSchedules = allSchedules.filter((schedule, index, self) => 
        index === self.findIndex(s => s.id === schedule.id)
      );
      
      setSchedules(uniqueSchedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to fetch schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalendarData = async (year: number, month: number) => {
    try {
      const response: any = await api.get(`/tours/guide/bookings/calendar?year=${year}&month=${month + 1}`);
      
      if (response.data.success) {
        const calendarDays = response.data.data.days.map((day: any) => ({
          ...day,
          tours: (day.tours || []).map((tour: any) => normalizeTourData({
            ...tour,
            date: day.date
          }))
        }));
        setCalendarData(calendarDays);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to fetch calendar data.');
    }
  };

  const createTourSchedule = async (scheduleData: any) => {
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

  const updateTourSchedule = async (scheduleId: string, scheduleData: any) => {
    try {
      setLoading(true);

      // Remove tourId from update data - schedules can't change their associated tour
      const { tourId, ...updatePayload } = scheduleData;

      const response: any = await api.put(`/tours/schedules/${scheduleId}`, updatePayload);

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
    fetchTourSchedules();
    fetchUserData();
  }, []);

  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    fetchCalendarData(year, month);
  }, [currentMonth]);

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
    
    const totalGuests = schedules.reduce((sum, s) => {
      const guests = s.currentGuests || s.bookedSlots || 0;
      return sum + (isNaN(guests) ? 0 : guests);
    }, 0);
    
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

    if (searchTerm) {
      filtered = filtered.filter(schedule => {
        const title = schedule.title || schedule.tourTitle || '';
        const location = schedule.location || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               location.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter);
    }

    if (tourTypeFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.tourType === tourTypeFilter);
    }

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

  // Pagination
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
        
        const calendarDay = calendarData.find(day => 
          day.date.startsWith(dateString)
        );
        
        const daySchedules = calendarDay?.tours || filteredSchedules.filter(s => {
          const scheduleDate = new Date(s.date);
          return scheduleDate.getDate() === date.getDate() &&
                 scheduleDate.getMonth() === date.getMonth() &&
                 scheduleDate.getFullYear() === date.getFullYear();
        });
        
        const totalBookings = calendarDay?.totalBookings || daySchedules.reduce((sum, s) => {
          const guests = s.currentGuests || s.bookedSlots || 0;
          return sum + (isNaN(guests) ? 0 : guests);
        }, 0);
        
        const totalRevenue = calendarDay?.totalRevenue || daySchedules.reduce((sum, s) => {
          const guests = s.currentGuests || s.bookedSlots || 0;
          const price = s.price || 0;
          const revenue = price * guests;
          return sum + (isNaN(revenue) ? 0 : revenue);
        }, 0);
        
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
  }, [currentMonth, filteredSchedules, calendarData]);

  // Handlers
  const handleViewDetails = (schedule: TourSchedule) => {
    setEditingSchedule(schedule);
    setScheduleModalMode('view');
    setShowScheduleModal(true);
  };

  const handleAddNew = () => {
    if (!checkKYCStatus()) return;
    if (availableTours.length === 0) {
      setError('You need to create at least one tour before scheduling.');
      return;
    }

    setEditingSchedule(null);
    setScheduleModalMode('add');
    setShowScheduleModal(true);
  };

  const handleEdit = (schedule: TourSchedule) => {
    if (!checkKYCStatus()) return;
    setEditingSchedule(schedule);
    setScheduleModalMode('edit');
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (scheduleData: any) => {
    try {
      // Use scheduleId if available, otherwise fall back to id
      const scheduleIdToUpdate = editingSchedule?.scheduleId || editingSchedule?.id;

      if (editingSchedule && scheduleIdToUpdate) {
        await updateTourSchedule(scheduleIdToUpdate, scheduleData);
      } else {
        await createTourSchedule(scheduleData);
      }
      setShowScheduleModal(false);
      setEditingSchedule(null);
      setError(null);
    } catch (err) {
      console.error('Error saving schedule:', err);
      throw err;
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!checkKYCStatus()) return;
    if (confirm('Are you sure you want to delete this tour schedule? This action cannot be undone.')) {
      try {
        await deleteTourSchedule(scheduleId);
        setShowScheduleModal(false);
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
      case 'available': return 'bg-green-100 text-green-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen mt-4 px-3">
      <div className="max-w-8xl mx-auto px-4 sm:px-4 lg:px-4 py-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Tour Schedule</h1>
            <p className="text-gray-500 mt-1">Manage your tours and bookings</p>
          </div>
          <button
            onClick={handleAddNew}
            className="mt-4 sm:mt-0 px-6 py-3 bg-[#083A85] text-white rounded-full font-medium hover:bg-[#083A85]/90 transition-all flex items-center gap-2"
          >
            <i className="bi bi-plus-lg"></i>
            <span>Add Schedule</span>
          </button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="bi bi-calendar-day text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.today}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <i className="bi bi-calendar-week-fill text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.upcoming}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="bi bi-people-fill text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Guests</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalGuests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <i className="bi bi-cash-stack text-emerald-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-gray-900">${formatCurrency(summaryStats.revenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Optimized */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="p-4">
            {/* First Row: Search and Main Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Search</label>
                <input
                  type="text"
                  placeholder="Search tours..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#083A85] focus:border-[#083A85] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#083A85] focus:border-[#083A85] text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tour Type</label>
                <select
                  value={tourTypeFilter}
                  onChange={(e) => setTourTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#083A85] focus:border-[#083A85] text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="city">City</option>
                  <option value="nature">Nature</option>
                  <option value="cultural">Cultural</option>
                  <option value="adventure">Adventure</option>
                  <option value="food">Food</option>
                  <option value="historical">Historical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#083A85] focus:border-[#083A85] text-xs"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#083A85] focus:border-[#083A85] text-xs"
                    placeholder="To"
                  />
                </div>
              </div>
            </div>

            {/* Second Row: View Toggle and Results Count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{filteredSchedules.length}</span> schedule{filteredSchedules.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'calendar'
                      ? 'bg-[#083A85] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="bi bi-calendar3"></i>
                  <span>Calendar</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    viewMode === 'list'
                      ? 'bg-[#083A85] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <i className="bi bi-list-ul"></i>
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-8">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle-fill text-red-600 mr-3"></i>
              <span className="text-red-800 flex-1 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSchedules.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-200">
            <i className="bi bi-calendar-x text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {schedules.length === 0 ? "No tours scheduled yet" : "No matching tours found"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {schedules.length === 0
                ? "Start planning your tours. Add your first schedule to get started."
                : "Try adjusting your filters to see more results."}
            </p>
            {schedules.length === 0 && availableTours.length > 0 && (
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-[#083A85] text-white rounded-full font-medium hover:bg-[#083A85]/90 transition-all"
              >
                <i className="bi bi-plus-circle-fill mr-2"></i>
                Create Your First Schedule
              </button>
            )}
          </div>
        )}

        {/* List View */}
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {schedule.tourType.charAt(0).toUpperCase() + schedule.tourType.slice(1)}
                    </span>
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {schedule.title || schedule.tourTitle}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">{schedule.location}</p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <i className="bi bi-calendar mr-2"></i>
                      {format(schedule.date, 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <i className="bi bi-clock mr-2"></i>
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <div className="flex items-center">
                      <i className="bi bi-people mr-2"></i>
                      {schedule.currentGuests || 0} / {schedule.maxGuests || 0} guests
                    </div>
                    <div className="flex items-center">
                      <i className="bi bi-cash mr-2"></i>
                      ${schedule.price} per person
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(schedule)}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-all font-medium"
                    >
                      <i className="bi bi-eye mr-1"></i>
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="flex-1 py-2 bg-[#083A85] text-white rounded-lg text-sm hover:bg-[#072f6b] transition-all font-medium"
                    >
                      <i className="bi bi-pencil mr-1"></i>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && viewMode === 'list' && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-full transition-all ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="bi bi-chevron-left"></i>
            </button>

            {[...Array(Math.min(5, totalPages))].map((_, index) => {
              const pageNum = index + 1;
              return (
                <button
                  key={index}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-4 py-2 rounded-full transition-all text-sm font-medium ${
                    currentPage === pageNum
                      ? 'bg-[#083A85] text-white'
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
              className={`p-2 rounded-full transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        )}

        {/* Calendar View */}
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'calendar' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <i className="bi bi-chevron-left text-lg"></i>
              </button>
              <h2 className="text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <i className="bi bi-chevron-right text-lg"></i>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {calendarViewData.flat().map((dayData, index) => {
                const isToday = dayData.date.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={index}
                    onClick={() => dayData.schedules.length > 0 && handleViewDetails(dayData.schedules[0])}
                    className={`p-2 text-center rounded-lg cursor-pointer transition-all min-h-[60px] ${
                      !dayData.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    } ${isToday ? 'bg-[#083A85]/10 ring-2 ring-[#083A85]' : ''} ${
                      dayData.schedules.length > 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-[#083A85]' : ''}`}>
                      {dayData.date.getDate()}
                    </span>
                    {dayData.schedules.length > 0 && (
                      <div className="mt-1">
                        <div className="w-2 h-2 bg-[#083A85] rounded-full mx-auto"></div>
                        <span className="text-xs text-gray-500 mt-1 block">{dayData.schedules.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        tours={availableTours.map(tour => ({
          id: tour.id,
          title: tour.title,
          type: tour.type,
          location: tour.location,
          price: tour.price
        }))}
        initialData={editingSchedule ? {
          id: editingSchedule.id,
          scheduleId: editingSchedule.scheduleId,
          tourId: editingSchedule.tourId || '',
          startDate: editingSchedule.date,
          endDate: editingSchedule.date,
          startTime: editingSchedule.startTime || '09:00',
          endTime: editingSchedule.endTime || '17:00',
          maxGuests: editingSchedule.maxGuests,
          availableSlots: editingSchedule.maxGuests || editingSchedule.totalSlots,
          isAvailable: editingSchedule.status === 'available'
        } : null}
        mode={scheduleModalMode}
      />
    </div>
  );
};

export default TourGuideSchedule;