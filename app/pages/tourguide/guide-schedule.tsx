//app/pages/tourguide/guide-schedule.tsx
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
                date: day.date // Use the day's date
              }))
            );
            
            allSchedules.push(...monthSchedules);
          }
        } catch (monthError) {
          console.warn(`Failed to fetch calendar data for ${year}-${month}:`, monthError);
        }
      }
      
      // Remove duplicates based on schedule ID
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

  // Load data on component mount and when month changes
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
        
        // Find calendar day data from server response
        const calendarDay = calendarData.find(day => 
          day.date.startsWith(dateString)
        );
        
        // If no server data, filter from local schedules
        const daySchedules = calendarDay?.tours || filteredSchedules.filter(s => {
          const scheduleDate = new Date(s.date);
          return scheduleDate.getDate() === date.getDate() &&
                 scheduleDate.getMonth() === date.getMonth() &&
                 scheduleDate.getFullYear() === date.getFullYear();
        });
        
        // Safe calculation of totals
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
    <div className="pt-4 md:pt-14 min-h-screen bg-gray-50">
      <div className="mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Tour Guide Schedule</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Manage your availability and scheduled tours</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Today</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{summaryStats.today}</p>
              </div>
              <i className="bi bi-calendar-day text-lg sm:text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Upcoming</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{summaryStats.upcoming}</p>
              </div>
              <i className="bi bi-calendar-week text-lg sm:text-2xl text-blue-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Confirmed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{summaryStats.confirmed}</p>
              </div>
              <i className="bi bi-calendar-check text-lg sm:text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{summaryStats.pending}</p>
              </div>
              <i className="bi bi-hourglass-split text-lg sm:text-2xl text-yellow-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Available</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{summaryStats.available}</p>
              </div>
              <i className="bi bi-calendar-plus text-lg sm:text-2xl text-purple-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Tours</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-600">{summaryStats.total}</p>
              </div>
              <i className="bi bi-map text-lg sm:text-2xl text-gray-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Guests</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600">{summaryStats.totalGuests}</p>
              </div>
              <i className="bi bi-people text-lg sm:text-2xl text-indigo-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-green-600">${formatCurrency(summaryStats.revenue)}</p>
              </div>
              <i className="bi bi-cash-stack text-lg sm:text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 rounded-lg shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tour name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="bi bi-search absolute left-2 sm:left-3 top-2.5 sm:top-3 text-gray-700 text-sm sm:text-base"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Tour Type</label>
              <select
                value={tourTypeFilter}
                onChange={(e) => setTourTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 text-xs sm:text-sm border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 text-xs sm:text-sm border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 gap-4">
            <p className="text-sm sm:text-base text-gray-600">
              Showing {viewMode === 'list' ? paginatedSchedules.length : filteredSchedules.length} of {filteredSchedules.length} tours
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm sm:text-base ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'calendar' ? '#083A85' : undefined }}
              >
                <i className="bi bi-calendar3 mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm sm:text-base ${
                  viewMode === 'list' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
              >
                <i className="bi bi-list-ul mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">List</span>
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

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="bi bi-exclamation-triangle text-red-600 mr-2"></i>
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSchedules.length === 0 && (
          <div className="bg-gray-100 rounded-lg shadow-xl p-8 sm:p-12 text-center">
            <i className="bi bi-calendar text-4xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mt-4">
              {schedules.length === 0 
                ? "No tours scheduled"
                : "No tours found"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              {schedules.length === 0 
                ? "Start by adding your first tour schedule!"
                : "Try adjusting your filters or search criteria"}
            </p>
            {schedules.length === 0 && availableTours.length > 0 && (
              <button
                onClick={handleAddNew}
                className="mt-4 px-4 sm:px-6 py-2 sm:py-3 text-white rounded-lg font-medium cursor-pointer text-sm sm:text-base"
                style={{ backgroundColor: '#083A85' }}
              >
                <i className="bi bi-plus-circle mr-2"></i>Add Your First Schedule
              </button>
            )}
            {availableTours.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                You need to create tours first before scheduling.
              </p>
            )}
          </div>
        )}

        {/* Calendar View */}
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'calendar' && (
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <i className="bi bi-chevron-left text-lg sm:text-xl"></i>
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <i className="bi bi-chevron-right text-lg sm:text-xl"></i>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="bg-gray-50 p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-700">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.substring(0, 1)}</span>
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarViewData.map((week, weekIndex) => (
                week.map((day, dayIndex) => {
                  const isToday = new Date().toDateString() === day.date.toDateString();
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`bg-white min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 ${
                        !day.isCurrentMonth ? 'opacity-50' : ''
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs sm:text-sm font-medium ${
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
                        {day.schedules.slice(0, window.innerWidth < 640 ? 1 : 3).map((schedule, index) => (
                          <div
                            key={`${schedule.id}-${index}`}
                            onClick={() => handleViewDetails(schedule)}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                              getStatusColor(schedule.status)
                            }`}
                          >
                            <div className="truncate">
                              <span className="hidden sm:inline">{schedule.startTime} - </span>
                              {schedule.title || schedule.tourTitle}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs">
                                {schedule.currentGuests || schedule.bookedSlots || 0}/{schedule.maxGuests || schedule.totalSlots || 0}
                              </span>
                              <i className={`bi ${getTourTypeIcon(schedule.tourType)} text-xs`}></i>
                            </div>
                          </div>
                        ))}
                        {day.schedules.length > (window.innerWidth < 640 ? 1 : 3) && (
                          <div className="text-xs text-gray-500 text-center">
                            +{day.schedules.length - (window.innerWidth < 640 ? 1 : 3)} more
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
        {!loading && !error && filteredSchedules.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Mobile Card View */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200">
                {paginatedSchedules.map((schedule) => {
                  const isUpcoming = schedule.date >= new Date() && schedule.status !== 'completed';
                  const isPast = schedule.date < new Date() || schedule.status === 'completed';
                  
                  return (
                    <div key={schedule.id} className={`p-4 ${isPast ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 text-sm">{schedule.title || schedule.tourTitle}</h3>
                          <p className="text-xs text-gray-800 mt-1">
                            <i className={`bi ${getTourTypeIcon(schedule.tourType)} mr-1`}></i>
                            {schedule.tourType} • {schedule.duration}h
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-800 mb-3">
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
                        <span className="text-sm font-medium text-gray-900">
                          ${formatCurrency((schedule.price || 0) * (schedule.currentGuests || schedule.bookedSlots || 0))}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(schedule)}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          >
                            <i className="bi bi-eye text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-gray-600 hover:text-gray-900 cursor-pointer"
                          >
                            <i className="bi bi-pencil text-sm"></i>
                          </button>
                          {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelTour(schedule)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                            >
                              <i className="bi bi-x-circle text-sm"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ 
                            width: `${Math.min(100, ((schedule.currentGuests || schedule.bookedSlots || 0) / (schedule.maxGuests || schedule.totalSlots || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Tour
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Guests
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-sm lg:text-base font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSchedules.map((schedule) => {
                    const isUpcoming = schedule.date >= new Date() && schedule.status !== 'completed';
                    const currentGuests = schedule.currentGuests || schedule.bookedSlots || 0;
                    const maxGuests = schedule.maxGuests || schedule.totalSlots || 1;
                    
                    return (
                      <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">
                              {format(schedule.date, 'EEE, MMM dd')}
                            </div>
                            <div className="text-sm lg:text-base text-gray-500">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center">
                            <i className={`bi ${getTourTypeIcon(schedule.tourType)} text-lg lg:text-xl mr-2 lg:mr-3 text-gray-400`}></i>
                            <div>
                              <div className="text-sm lg:text-base font-medium text-gray-900">{schedule.title || schedule.tourTitle}</div>
                              <div className="text-sm lg:text-base text-gray-500 capitalize">{schedule.tourType} • {schedule.duration}h</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm lg:text-base text-gray-600">
                            <i className="bi bi-geo-alt text-gray-400 mr-1"></i>
                            {schedule.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(schedule.language || ['English']).join(', ')}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm lg:text-base font-medium text-gray-900">
                              {currentGuests}/{maxGuests}
                            </div>
                            {currentGuests >= maxGuests && (
                              <span className="ml-2 bg-red-100 text-red-800 text-xs sm:text-sm px-2 py-1 rounded-full">
                                Full
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (currentGuests / maxGuests) * 100)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs lg:text-sm leading-5 font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                            <i className={`bi ${getStatusIcon(schedule.status)} mr-1`}></i>
                            {schedule.status}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm lg:text-base font-medium text-gray-900">
                            ${formatCurrency((schedule.price || 0) * currentGuests)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${formatCurrency(schedule.price || 0)}/person
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm lg:text-base font-medium">
                          <button
                            onClick={() => handleViewDetails(schedule)}
                            className="text-blue-600 hover:text-blue-900 mr-2 lg:mr-3 cursor-pointer"
                            title="View details"
                          >
                            <i className="bi bi-eye text-sm lg:text-lg"></i>
                          </button>
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-gray-600 hover:text-gray-900 mr-2 lg:mr-3 cursor-pointer"
                            title="Edit schedule"
                          >
                            <i className="bi bi-pencil text-sm lg:text-lg"></i>
                          </button>
                          {schedule.status !== 'cancelled' && schedule.status !== 'completed' && (
                            <button
                              onClick={() => handleCancelTour(schedule)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                              title="Cancel tour"
                            >
                              <i className="bi bi-x-circle text-sm lg:text-lg"></i>
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
              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-700 order-2 sm:order-1">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSchedules.length)} of {filteredSchedules.length} tours
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${
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
                          className={`px-2 sm:px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm ${
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
                      className={`px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm ${
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
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 cursor-pointer"
            style={{ backgroundColor: '#083A85' }}
            title="Add New Schedule"
          >
            <i className="bi bi-plus text-xl sm:text-2xl"></i>
          </button>
        )}

        {/* Add/Edit Modal */}
        {showAddEditModal && editingSchedule && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingSchedule.id ? 'Edit Schedule' : 'Add New Schedule'}
                  </h2>
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>
                
                {/* Form fields */}
                <div className="space-y-4">
                  {/* Tour Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Tour</label>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tour Title</label>
                    <input
                      type="text"
                      value={editingSchedule.title || editingSchedule.tourTitle || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ 
                        ...prev, 
                        title: e.target.value,
                        tourTitle: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter tour title"
                      readOnly
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tour Type</label>
                      <select
                        value={editingSchedule.tourType}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, tourType: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (hours)</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={editingSchedule.duration || 3}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={editingSchedule.location || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={editingSchedule.date ? editingSchedule.date.toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, date: new Date(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={editingSchedule.startTime || '09:00'}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={editingSchedule.endTime || '17:00'}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Guests</label>
                      <input
                        type="number"
                        min="1"
                        value={editingSchedule.maxGuests || 10}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Price per Person ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={editingSchedule.price || 50}
                        onChange={(e) => setEditingSchedule(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Point</label>
                    <input
                      type="text"
                      value={editingSchedule.meetingPoint || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, meetingPoint: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter meeting point"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                    <textarea
                      value={editingSchedule.specialInstructions || ''}
                      onChange={(e) => setEditingSchedule(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter any special instructions for guests"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddEditModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#083A85' }}
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
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex-1 mr-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {selectedSchedule.title || selectedSchedule.tourTitle}
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      <i className={`bi ${getTourTypeIcon(selectedSchedule.tourType)} mr-2`}></i>
                      {selectedSchedule.tourType} Tour • {selectedSchedule.duration} hours
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                  >
                    <i className="bi bi-x-lg text-xl sm:text-2xl"></i>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-calendar3 text-gray-600 text-lg sm:text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Date</p>
                    <p className="font-semibold text-sm sm:text-base">{format(selectedSchedule.date, 'EEE, MMM dd')}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-clock text-gray-600 text-lg sm:text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Time</p>
                    <p className="font-semibold text-sm sm:text-base">{selectedSchedule.startTime} - {selectedSchedule.endTime}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-people text-gray-600 text-lg sm:text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Guests</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {selectedSchedule.currentGuests || selectedSchedule.bookedSlots || 0}/{selectedSchedule.maxGuests || selectedSchedule.totalSlots || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-cash-stack text-gray-600 text-lg sm:text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Revenue</p>
                    <p className="font-semibold text-sm sm:text-base">
                      ${formatCurrency((selectedSchedule.price || 0) * (selectedSchedule.currentGuests || selectedSchedule.bookedSlots || 0))}
                    </p>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold mb-2">Status & Details</h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                    <span className={`px-3 py-1 text-sm sm:text-base font-semibold rounded-full ${getStatusColor(selectedSchedule.status)}`}>
                      <i className={`bi ${getStatusIcon(selectedSchedule.status)} mr-1`}></i>
                      {selectedSchedule.status}
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      <i className="bi bi-geo-alt mr-1"></i>
                      {selectedSchedule.location}
                    </span>
                    <span className="text-gray-600 text-sm sm:text-base">
                      <i className="bi bi-translate mr-1"></i>
                      {(selectedSchedule.language || ['English']).join(', ')}
                    </span>
                  </div>
                  {selectedSchedule.meetingPoint && (
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      <i className="bi bi-pin-map mr-2"></i>
                      <strong>Meeting Point:</strong> {selectedSchedule.meetingPoint}
                    </p>
                  )}
                  {selectedSchedule.description && (
                    <p className="text-gray-600 text-sm sm:text-base">{selectedSchedule.description}</p>
                  )}
                </div>

                {selectedSchedule.specialInstructions && (
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold mb-2">Special Instructions</h3>
                    <p className="text-gray-600 bg-yellow-50 rounded-lg p-3 text-sm sm:text-base">
                      <i className="bi bi-info-circle mr-2"></i>
                      {selectedSchedule.specialInstructions}
                    </p>
                  </div>
                )}

                {selectedSchedule.guestNotes && (
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold mb-2">Guest Notes</h3>
                    <p className="text-gray-600 bg-blue-50 rounded-lg p-3 text-sm sm:text-base">
                      <i className="bi bi-sticky mr-2"></i>
                      {selectedSchedule.guestNotes}
                    </p>
                  </div>
                )}

                {/* Bookings List */}
                {selectedSchedule.bookings && selectedSchedule.bookings.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold mb-3">Guest Bookings</h3>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Guest Name</th>
                              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Email</th>
                              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700">People</th>
                              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Status</th>
                              <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Special Requests</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedSchedule.bookings.map((booking) => (
                              <tr key={booking.id}>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{booking.guestName}</td>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{booking.guestEmail}</td>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">{booking.numberOfPeople}</td>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">
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
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <i className="bi bi-pencil mr-2"></i>
                    Edit Schedule
                  </button>
                  {selectedSchedule.status !== 'cancelled' && selectedSchedule.status !== 'completed' && (
                    <button
                      onClick={() => {
                        handleCancelTour(selectedSchedule);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                    >
                      <i className="bi bi-x-circle mr-2"></i>
                      Cancel Tour
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleDelete(selectedSchedule.id);
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <i className="bi bi-trash mr-2"></i>
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