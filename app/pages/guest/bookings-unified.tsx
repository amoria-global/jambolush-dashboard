"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../api/apiService';
import { createViewDetailsUrl } from '@/app/utils/encoder';

// Types
interface PropertyBooking {
  id: string;
  type: 'property';
  propertyName: string;
  propertyAddress: string;
  propertyImage?: string;
  checkIn: Date;
  checkOut: Date;
  bookingDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'checked_in' | 'checked_out';
  amount: number;
  paymentStatus: string;
  guests: number;
  nights: number;
  pricingType?: 'night' | 'month';
  isMonthlyBooking?: boolean;
  renewalDate?: string;
  propertyId?: string;
}

interface TourBooking {
  id: string;
  type: 'tour';
  tourTitle: string;
  location: string;
  date: Date;
  startTime: string;
  duration: number;
  numberOfGuests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  totalPrice: number;
  guideName?: string;
  tourType?: string;
}

type UnifiedBooking = PropertyBooking | TourBooking;
type BookingTab = 'all' | 'schedules' | 'stays' | 'tours' | 'monthly' | 'night';
type ViewMode = 'grid' | 'list';

const GuestBookingsUnified: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial tab from URL query parameter (default to 'schedules')
  const initialTab = (searchParams.get('tab') as BookingTab) || 'schedules';

  // States
  const [activeTab, setActiveTab] = useState<BookingTab>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [scheduleView, setScheduleView] = useState<'calendar' | 'list'>('calendar');
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Date formatter
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMMM yyyy':
        return `${fullMonths[month]} ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // Helper function to extract first image from property images JSON
  const getFirstPropertyImage = (imagesJson?: any): string => {
    if (!imagesJson) {
      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    }

    try {
      const images = typeof imagesJson === 'string' ? JSON.parse(imagesJson) : imagesJson;
      const categories = ['exterior', 'livingRoom', 'bedroom', 'kitchen', 'bathroom'];

      for (const category of categories) {
        if (images[category] && Array.isArray(images[category]) && images[category].length > 0) {
          return images[category][0];
        }
      }

      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    } catch (error) {
      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=400&fit=crop';
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch property bookings and tour bookings in parallel
      const [propertyResponse, tourResponse] = await Promise.all([
        api.searchPropertyBookings({ limit: 100 }).catch(() => ({ data: { success: false, data: { bookings: [] } } })),
        api.get('/bookings/tours').catch(() => ({ data: { success: false, data: { bookings: [] } } }))
      ]);

      // Transform property bookings
      const propertyBookings: PropertyBooking[] = propertyResponse.data?.success && propertyResponse.data?.data?.bookings
        ? propertyResponse.data.data.bookings.map((booking: any) => {
            const isMonthly = booking.pricingType === 'month' || booking.isMonthlyBooking;
            let renewalDate: string | undefined = undefined;
            if (isMonthly && booking.checkIn) {
              const checkInDate = new Date(booking.checkIn);
              const renewal = new Date(checkInDate);
              renewal.setMonth(renewal.getMonth() + 1);
              renewalDate = renewal.toISOString();
            }

            return {
              id: booking.id,
              type: 'property' as const,
              propertyName: booking.property?.name || 'Unknown Property',
              propertyAddress: booking.property?.location || '',
              propertyImage: getFirstPropertyImage(booking.property?.images),
              checkIn: new Date(booking.checkIn),
              checkOut: new Date(booking.checkOut),
              bookingDate: new Date(booking.createdAt),
              status: booking.status,
              amount: booking.totalPrice || 0,
              paymentStatus: booking.paymentStatus || 'pending',
              guests: booking.guests || 1,
              nights: booking.nights || 1,
              pricingType: booking.pricingType || 'night',
              isMonthlyBooking: isMonthly,
              renewalDate,
              propertyId: booking.property?.id || booking.propertyId
            };
          })
        : [];

      // Transform tour bookings
      const tourBookings: TourBooking[] = tourResponse.data?.success && tourResponse.data?.data?.bookings
        ? tourResponse.data.data.bookings.map((booking: any) => ({
            id: booking.id,
            type: 'tour' as const,
            tourTitle: booking.tour?.title || booking.tour?.name || 'Tour Booking',
            location: booking.tour?.location || booking.location || 'Location TBD',
            date: new Date(booking.schedule?.startDate || booking.startDate || booking.createdAt),
            startTime: booking.schedule?.startTime || booking.startTime || '10:00',
            duration: booking.tour?.duration || booking.duration || 2,
            numberOfGuests: booking.guests || booking.numberOfGuests || 1,
            status: booking.status || 'pending',
            price: booking.price || 0,
            totalPrice: booking.totalPrice || booking.price || 0,
            guideName: booking.tour?.guide?.name || booking.guideName || 'Guide TBD',
            tourType: booking.tour?.type || 'city'
          }))
        : [];

      // Combine all bookings
      setBookings([...propertyBookings, ...tourBookings]);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to load bookings. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings based on active tab and filters
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by tab
    if (activeTab === 'schedules') {
      // Show all bookings sorted by date (upcoming first)
      filtered = [...bookings].sort((a, b) => {
        const dateA = a.type === 'property' ? a.checkIn : a.date;
        const dateB = b.type === 'property' ? b.checkIn : b.date;
        return dateA.getTime() - dateB.getTime();
      });
    } else if (activeTab === 'stays') {
      filtered = filtered.filter(b => b.type === 'property');
    } else if (activeTab === 'tours') {
      filtered = filtered.filter(b => b.type === 'tour');
    } else if (activeTab === 'monthly') {
      filtered = filtered.filter(b => b.type === 'property' && (b as PropertyBooking).isMonthlyBooking);
    } else if (activeTab === 'night') {
      filtered = filtered.filter(b => b.type === 'property' && !(b as PropertyBooking).isMonthlyBooking);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => {
        if (booking.type === 'property') {
          return booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return booking.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 booking.location.toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    return filtered;
  }, [bookings, activeTab, searchTerm, statusFilter]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Calendar view data for Schedules tab
  const calendarData = useMemo(() => {
    if (activeTab !== 'schedules') return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    const firstDayWeekDay = firstDayOfMonth.getDay();
    startDate.setDate(startDate.getDate() - firstDayWeekDay);

    const weeks: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[][] = [];
    let currentDate = new Date(startDate);

    for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
      const week: { date: Date; bookings: UnifiedBooking[]; isCurrentMonth: boolean }[] = [];
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const date = new Date(currentDate);
        const dayBookings = filteredBookings.filter(b => {
          const bookingDate = b.type === 'property' ? b.checkIn : b.date;
          return bookingDate.getFullYear() === date.getFullYear() &&
                 bookingDate.getMonth() === date.getMonth() &&
                 bookingDate.getDate() === date.getDate();
        });

        week.push({
          date: date,
          bookings: dayBookings,
          isCurrentMonth: date.getMonth() === month
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
    }

    return weeks;
  }, [activeTab, currentMonth, filteredBookings]);

  // Grouped bookings for list view in Schedules
  const groupedBookings = useMemo(() => {
    if (activeTab !== 'schedules' || scheduleView !== 'list') return {};

    const groups: { [key: string]: UnifiedBooking[] } = {};
    filteredBookings.forEach(booking => {
      const bookingDate = booking.type === 'property' ? booking.checkIn : booking.date;
      const dateKey = format(bookingDate, 'MMM dd, yyyy');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    });
    return groups;
  }, [activeTab, scheduleView, filteredBookings]);

  // Summary stats
  const stats = useMemo(() => {
    const propertyBookings = bookings.filter(b => b.type === 'property') as PropertyBooking[];
    const tourBookings = bookings.filter(b => b.type === 'tour') as TourBooking[];
    const monthlyBookings = propertyBookings.filter(b => b.isMonthlyBooking);
    const nightBookings = propertyBookings.filter(b => !b.isMonthlyBooking);

    return {
      total: bookings.length,
      stays: propertyBookings.length,
      tours: tourBookings.length,
      monthly: monthlyBookings.length,
      night: nightBookings.length
    };
  }, [bookings]);

  const handleViewDetails = (booking: UnifiedBooking) => {
    const url = createViewDetailsUrl(booking.id, booking.type === 'property' ? 'booking' : 'tour-booking');
    router.push(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-700 border border-green-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border border-red-200';
      case 'completed': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'checked_in': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'checked_out': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  if (error && !loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <i className="bi bi-exclamation-triangle text-lg text-red-500"></i>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Unable to load bookings</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-[#083A85] text-white text-sm rounded-lg hover:bg-[#062d65] transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-base text-gray-500">Manage all your stays and tour reservations</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <nav className="flex flex-wrap gap-x-8 gap-y-3 border-b border-gray-200">
          {[
            { key: 'all', label: 'All', count: stats.total, style: 'small' },
            { key: 'schedules', label: 'Schedules', count: stats.total, style: 'small' },
            { key: 'stays', label: 'Stays', count: stats.stays, style: 'medium' },
            { key: 'tours', label: 'Tours', count: stats.tours, style: 'medium' },
            { key: 'night', label: 'Nightly', count: stats.night, style: 'medium' },
            { key: 'monthly', label: 'Monthly', count: stats.monthly, style: 'medium' }
          ].map(tab => {
            const sizeClasses = tab.style === 'small'
              ? 'text-sm px-1'
              : 'text-sm px-2';

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as BookingTab);
                  setCurrentPage(1);
                }}
                className={`pb-4 border-b-2 font-medium transition-all ${sizeClasses} ${
                  activeTab === tab.key
                    ? 'border-[#083A85] text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 text-xs ${
                    activeTab === tab.key ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
            />
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors bg-white appearance-none cursor-pointer">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filteredBookings.length}</span> {filteredBookings.length === 1 ? 'booking' : 'bookings'}
            </span>

            {/* View mode toggle - different for Schedules tab */}
            {activeTab === 'schedules' ? (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setScheduleView('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    scheduleView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <i className="bi bi-calendar3 mr-1.5"></i>
                  Calendar
                </button>
                <button
                  onClick={() => setScheduleView('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    scheduleView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <i className="bi bi-list mr-1.5"></i>
                  List
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <i className="bi bi-grid-3x3-gap"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  <i className="bi bi-list"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#083A85]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="bi bi-calendar-x text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No bookings found</h3>
          <p className="text-sm text-gray-600">Try adjusting your filters or make a new reservation</p>
        </div>
      )}

      {/* Schedules Calendar View */}
      {!loading && filteredBookings.length > 0 && activeTab === 'schedules' && scheduleView === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <i className="bi bi-chevron-left text-lg text-gray-700"></i>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors">
              <i className="bi bi-chevron-right text-lg text-gray-700"></i>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 pb-2">
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarData.flat().map(({ date, bookings: dayBookings, isCurrentMonth }, index) => {
              const isToday = date.getFullYear() === new Date().getFullYear() &&
                            date.getMonth() === new Date().getMonth() &&
                            date.getDate() === new Date().getDate();
              const hasBookings = dayBookings.length > 0;

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-3 rounded-xl transition-all relative ${
                    !isCurrentMonth
                      ? 'text-gray-300'
                      : hasBookings
                        ? 'bg-gray-50 hover:bg-gray-100 cursor-pointer'
                        : 'hover:bg-gray-50'
                  } ${isToday ? 'ring-2 ring-[#083A85] ring-offset-2' : ''}`}>

                  {/* Date Number */}
                  <div className={`text-sm font-medium mb-2 ${
                    isToday
                      ? 'flex items-center justify-center w-7 h-7 rounded-full bg-[#083A85] text-white'
                      : ''
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* Booking Indicators */}
                  {hasBookings && (
                    <div className="space-y-1.5">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <div
                          key={booking.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(booking);
                          }}
                          className={`text-[10px] px-2 py-1 rounded-md truncate font-medium transition-all ${
                            booking.type === 'property'
                              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                              : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                          }`}>
                          {booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-[10px] text-gray-500 px-2 font-medium">
                          +{dayBookings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dot Indicator for Mobile */}
                  {hasBookings && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-[#083A85] rounded-full md:hidden"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedules List View */}
      {!loading && filteredBookings.length > 0 && activeTab === 'schedules' && scheduleView === 'list' && (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([dateKey, dayBookings]) => (
            <div key={dateKey}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <i className="bi bi-calendar-event mr-2 text-[#083A85]"></i>
                {dateKey}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="group cursor-pointer bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all"
                    onClick={() => handleViewDetails(booking)}>
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={booking.type === 'property' ? booking.propertyImage : 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&h=400&fit=crop'}
                        alt={booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-white/90 text-gray-900">
                          {booking.type === 'property' ? 'Stay' : 'Tour'}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-1">
                        {booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                        {booking.type === 'property' ? booking.propertyAddress : booking.location}
                      </p>
                      <div className="text-base font-semibold text-gray-900">
                        ${booking.type === 'property' ? booking.amount : booking.totalPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredBookings.length > 0 && activeTab !== 'schedules' && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              className="group cursor-pointer bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleViewDetails(booking)}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={booking.type === 'property' ? booking.propertyImage : 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&h=400&fit=crop'}
                  alt={booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base text-gray-900 line-clamp-1">
                    {booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium whitespace-nowrap">
                    {booking.type === 'property' ? 'Stay' : 'Tour'}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                  {booking.type === 'property' ? booking.propertyAddress : booking.location}
                </p>

                {/* Dates */}
                {booking.type === 'property' ? (
                  <>
                    <div className="flex items-center text-sm text-gray-700 mb-3">
                      <i className="bi bi-calendar3 mr-2 text-gray-400"></i>
                      <span>{format(booking.checkIn, 'MMM dd')}</span>
                      <span className="mx-2 text-gray-400">—</span>
                      <span>{format(booking.checkOut, 'MMM dd')}</span>
                    </div>
                    {booking.isMonthlyBooking && booking.renewalDate && (
                      <div className="mb-3 p-2.5 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <i className="bi bi-arrow-repeat"></i>
                          <span>Renews {format(new Date(booking.renewalDate), 'MMM dd')}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center text-sm text-gray-700 mb-3">
                    <i className="bi bi-calendar3 mr-2 text-gray-400"></i>
                    {format(booking.date, 'MMM dd')} at {booking.startTime}
                  </div>
                )}

                {/* Price */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        ${booking.type === 'property' ? booking.amount : booking.totalPrice}
                      </span>
                      {booking.type === 'property' && booking.isMonthlyBooking && (
                        <span className="text-xs text-gray-500 ml-1">/month</span>
                      )}
                    </div>
                    <i className="bi bi-chevron-right text-gray-400 text-sm"></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && filteredBookings.length > 0 && activeTab !== 'schedules' && viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Booking
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={booking.type === 'property' ? booking.propertyImage : 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&h=400&fit=crop'}
                        alt=""
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">
                          {booking.type === 'property' ? booking.propertyName : booking.tourTitle}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.type === 'property' ? booking.propertyAddress : booking.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                      {booking.type === 'property' ? (
                        (booking as PropertyBooking).isMonthlyBooking ? 'Monthly Stay' : 'Nightly Stay'
                      ) : 'Tour'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {booking.type === 'property'
                        ? format(booking.checkIn, 'MMM dd, yyyy')
                        : format(booking.date, 'MMM dd, yyyy')}
                    </div>
                    {booking.type === 'property' && (
                      <div className="text-xs text-gray-500">{booking.nights} nights</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-medium text-sm text-gray-900">
                      ${booking.type === 'property' ? booking.amount : booking.totalPrice}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(booking);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="View details">
                      <i className="bi bi-eye text-gray-600 text-sm"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && activeTab !== 'schedules' && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-left text-sm"></i>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-all ${
                  currentPage === pageNum
                    ? 'bg-[#083A85] text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}>
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-right text-sm"></i>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default GuestBookingsUnified;
