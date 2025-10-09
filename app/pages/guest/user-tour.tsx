"use client";
import api from '@/app/api/apiService';
import React, { useState, useEffect, useMemo } from 'react';

interface Tour {
  id: string;
  title: string;
  guide: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  price: number;
  bookings: number;
  date: string;
  image?: string;
  description?: string;
  duration?: string;
  location?: string;
  tourType?: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  maxParticipants?: number;
  availableSpots?: number;
}

interface UserBooking {
  id: string;
  tourTitle?: string;
  tourType?: 'city' | 'nature' | 'cultural' | 'adventure' | 'food' | 'historical';
  date: Date;
  startTime: string;
  endTime?: string;
  duration: number;
  location: string;
  meetingPoint?: string;
  numberOfGuests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  totalPrice?: number;
  guideName?: string;
  guideContact?: string;
  specialRequests?: string;
  createdAt: Date;
  lastModified: Date;
  currency?: string;
  tour?: any;
  schedule?: any;
  guests?: number;
}

type MainTab = 'available' | 'bookings';
type ViewMode = 'grid' | 'list';

const GuestToursPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTours, setAvailableTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<UserBooking[]>([]);
  const [tourFilters, setTourFilters] = useState({search: '', tourType: 'all', priceRange: 'all', status: 'active'});
  const [bookingFilters, setBookingFilters] = useState({search: '', status: 'all', tourType: 'all', dateRange: { start: '', end: '' }});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<UserBooking | null>(null);
  const [showTourModal, setShowTourModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const extractArray = (data: any, fallback: any[] = []): any[] => {
    if (!data) return fallback;
    if (data.data?.data?.bookings && Array.isArray(data.data.data.bookings)) return data.data.data.bookings;
    if (data.data?.data?.tours && Array.isArray(data.data.data.tours)) return data.data.data.tours;
    if (Array.isArray(data.data?.data)) return data.data.data;
    if (data.data?.bookings && Array.isArray(data.data.bookings)) return data.data.bookings;
    if (data.data?.tours && Array.isArray(data.data.tours)) return data.data.tours;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return fallback;
  };

  const transformTourData = (apiTour: any): Tour => ({
    id: apiTour.id,
    title: apiTour.title || apiTour.name,
    guide: apiTour.guide?.name || apiTour.guideName || 'Guide TBD',
    status: apiTour.status || 'active',
    price: apiTour.price || apiTour.pricePerPerson || 0,
    bookings: apiTour.bookings || apiTour.totalBookings || 0,
    date: apiTour.date || apiTour.schedule?.startDate || new Date().toISOString(),
    image: apiTour.image || apiTour.images?.[0] || `https://picsum.photos/seed/tour${apiTour.id}/600/400`,
    description: apiTour.description || 'Tour description',
    duration: apiTour.duration || '2 hours',
    location: apiTour.location,
    tourType: apiTour.type || apiTour.tourType || 'city',
    maxParticipants: apiTour.maxParticipants || 20,
    availableSpots: (apiTour.maxParticipants || 20) - (apiTour.bookings || 0)
  });

  const transformBookingData = (apiBooking: any): UserBooking => {
    const bookingDate = new Date(apiBooking.schedule?.startDate || apiBooking.startDate || apiBooking.createdAt);
    const startTime = apiBooking.schedule?.startTime || apiBooking.startTime || '10:00';
    const duration = apiBooking.tour?.duration || apiBooking.duration || 2;
    return {
      id: apiBooking.id,
      tourTitle: apiBooking.tour?.title || apiBooking.tour?.name || 'Tour Booking',
      tourType: apiBooking.tour?.type || 'city',
      date: bookingDate,
      startTime,
      endTime: apiBooking.schedule?.endTime || apiBooking.endTime || `${(parseInt(startTime.split(':')[0]) + duration).toString().padStart(2, '0')}:00`,
      duration,
      location: apiBooking.tour?.location || apiBooking.location || 'Location TBD',
      meetingPoint: apiBooking.meetingPoint || 'Meeting point TBD',
      numberOfGuests: apiBooking.guests || apiBooking.numberOfGuests || 1,
      status: apiBooking.status || 'pending',
      price: apiBooking.price || apiBooking.totalPrice || 0,
      totalPrice: apiBooking.totalPrice || apiBooking.price || 0,
      guideName: apiBooking.tour?.guide?.name || apiBooking.guideName || 'Guide TBD',
      guideContact: apiBooking.tour?.guide?.contact || apiBooking.guideContact || '',
      specialRequests: apiBooking.specialRequests || apiBooking.notes,
      createdAt: new Date(apiBooking.createdAt),
      lastModified: new Date(apiBooking.updatedAt || apiBooking.createdAt),
      currency: apiBooking.currency || 'KES'
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const promises = activeTab === 'available' ? [api.get('/tours').catch(() => null)] : [api.get('/bookings/tours').catch(() => null)];
        const [response] = await Promise.all(promises);
        if (activeTab === 'available') {
          const transformedTours = extractArray(response).map(transformTourData);
          setAvailableTours(transformedTours);
        } else {
          const transformedBookings = extractArray(response).map(transformBookingData);
          setUserBookings(transformedBookings);
        }
      } catch (err: any) {
        setError(err?.data?.message || err?.message || 'Failed to load data. Please try again.');
        console.error('Data loading error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  useEffect(() => {
    let filtered = [...availableTours];
    if (tourFilters.search) filtered = filtered.filter(t => t.title.toLowerCase().includes(tourFilters.search.toLowerCase()) || t.guide.toLowerCase().includes(tourFilters.search.toLowerCase()) || t.location?.toLowerCase().includes(tourFilters.search.toLowerCase()));
    if (tourFilters.tourType !== 'all') filtered = filtered.filter(t => t.tourType === tourFilters.tourType);
    if (tourFilters.status !== 'all') filtered = filtered.filter(t => t.status === tourFilters.status);
    if (tourFilters.priceRange !== 'all') {
      const ranges = {'low': [0, 50], 'medium': [51, 100], 'high': [101, Infinity]};
      const [min, max] = ranges[tourFilters.priceRange as keyof typeof ranges] || [0, Infinity];
      filtered = filtered.filter(t => t.price >= min && t.price <= max);
    }
    setFilteredTours(filtered);
    setCurrentPage(1);
  }, [availableTours, tourFilters]);

  useEffect(() => {
    let filtered = [...userBookings];
    if (bookingFilters.search) filtered = filtered.filter(b => b.tourTitle?.toLowerCase().includes(bookingFilters.search.toLowerCase()) || b.location.toLowerCase().includes(bookingFilters.search.toLowerCase()));
    if (bookingFilters.status !== 'all') filtered = filtered.filter(b => b.status === bookingFilters.status);
    if (bookingFilters.tourType !== 'all') filtered = filtered.filter(b => b.tourType === bookingFilters.tourType);
    if (bookingFilters.dateRange.start && bookingFilters.dateRange.end) {
      const startDate = new Date(bookingFilters.dateRange.start);
      const endDate = new Date(bookingFilters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [userBookings, bookingFilters]);

  const bookingStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = userBookings.filter(b => new Date(b.date) >= today && b.status === 'confirmed');
    const completed = userBookings.filter(b => b.status === 'completed');
    return {
      total: userBookings.length,
      upcoming: upcoming.length,
      completed: completed.length,
      pending: userBookings.filter(b => b.status === 'pending').length,
      totalSpent: completed.reduce((sum, b) => sum + (b.totalPrice || b.price * b.numberOfGuests), 0)
    };
  }, [userBookings]);

  const paginatedItems = useMemo(() => {
    const items = activeTab === 'available' ? filteredTours : filteredBookings;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTours, filteredBookings, currentPage, itemsPerPage, activeTab]);

  const totalPages = Math.ceil((activeTab === 'available' ? filteredTours.length : filteredBookings.length) / itemsPerPage);

  const handleBookTour = (tour: Tour) => { setSelectedTour(tour); setShowBookingForm(true); };
  const handleViewTourDetails = (tour: Tour) => { setSelectedTour(tour); setShowTourModal(true); };
  const handleViewBookingDetails = (booking: UserBooking) => { setSelectedBooking(booking); setShowBookingModal(true); };
  const handleCancelBooking = async (booking: UserBooking) => {
    if (window.confirm(`Cancel "${booking.tourTitle}"?`)) {
      try { await api.patch(`/tours/${booking.id}/cancel`); window.location.reload(); } catch (error) { alert('Failed to cancel booking.'); }
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {active: 'bg-green-100 text-green-800', confirmed: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800', cancelled: 'bg-red-100 text-red-800', completed: 'bg-gray-100 text-gray-800'};
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return (<div className="pt-14 min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div><p className="text-gray-600 text-sm">Loading...</p></div></div>);
  if (error) return (<div className="pt-14 min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center max-w-md"><div className="bg-red-50 border border-red-200 rounded-lg p-5 shadow-sm"><div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 bg-red-100 rounded-full"><i className="bi bi-exclamation-triangle text-red-600" /></div><h2 className="text-red-800 font-semibold mb-1.5 text-base">Error Loading Data</h2><p className="text-red-600 mb-3 text-sm">{error}</p><button onClick={() => window.location.reload()} className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm"><i className="bi bi-arrow-clockwise mr-1.5" />Try Again</button></div></div></div>);

  return (
    <div className="">
      <div className="px-2 sm:px-2 lg:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Tours</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Discover amazing tours and manage your bookings</p>
        </div>

        <div className="mb-4">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-6">
              <button onClick={() => setActiveTab('available')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'available' ? 'border-[#083A85] text-[#083A85]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Available Tours</button>
              <button onClick={() => setActiveTab('bookings')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-[#083A85] text-[#083A85]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>My Bookings {bookingStats.total > 0 && `(${bookingStats.total})`}</button>
            </nav>
          </div>
        </div>

        {activeTab === 'bookings' && (<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4"><div className="bg-white rounded-lg shadow p-3 text-center"><p className="text-gray-600 text-xs sm:text-sm">Total</p><p className="text-xl sm:text-2xl font-bold text-[#083A85]">{bookingStats.total}</p></div><div className="bg-white rounded-lg shadow p-3 text-center"><p className="text-gray-600 text-xs sm:text-sm">Upcoming</p><p className="text-xl sm:text-2xl font-bold text-blue-600">{bookingStats.upcoming}</p></div><div className="bg-white rounded-lg shadow p-3 text-center"><p className="text-gray-600 text-xs sm:text-sm">Pending</p><p className="text-xl sm:text-2xl font-bold text-yellow-600">{bookingStats.pending}</p></div><div className="bg-white rounded-lg shadow p-3 text-center"><p className="text-gray-600 text-xs sm:text-sm">Spent</p><p className="text-base sm:text-lg font-bold text-green-600">{bookingStats.totalSpent.toLocaleString()} KES</p></div></div>)}

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4">
          {activeTab === 'available' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label><input type="text" placeholder="Tour, guide, location..." value={tourFilters.search} onChange={(e) => setTourFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"/></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Type</label><select value={tourFilters.tourType} onChange={(e) => setTourFilters(prev => ({ ...prev, tourType: e.target.value }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"><option value="all">All</option><option value="city">City</option><option value="nature">Nature</option><option value="cultural">Cultural</option><option value="adventure">Adventure</option><option value="food">Food</option><option value="historical">Historical</option></select></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Price</label><select value={tourFilters.priceRange} onChange={(e) => setTourFilters(prev => ({ ...prev, priceRange: e.target.value }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"><option value="all">All</option><option value="low">0-50 KES</option><option value="medium">51-100 KES</option><option value="high">101+ KES</option></select></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">View</label><div className="flex gap-1.5"><button onClick={() => setViewMode('grid')} className={`flex-1 px-2 py-1.5 text-xs sm:text-sm rounded-lg ${viewMode === 'grid' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}><i className="bi bi-grid mr-1"></i>Grid</button><button onClick={() => setViewMode('list')} className={`flex-1 px-2 py-1.5 text-xs sm:text-sm rounded-lg ${viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700'}`}><i className="bi bi-list mr-1"></i>List</button></div></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label><input type="text" placeholder="Tour or location..." value={bookingFilters.search} onChange={(e) => setBookingFilters(prev => ({ ...prev, search: e.target.value }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"/></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label><select value={bookingFilters.status} onChange={(e) => setBookingFilters(prev => ({ ...prev, status: e.target.value }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"><option value="all">All</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={bookingFilters.dateRange.start} onChange={(e) => setBookingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"/></div>
              <div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={bookingFilters.dateRange.end} onChange={(e) => setBookingFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))} className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85]"/></div>
            </div>
          )}
        </div>

        {activeTab === 'available' ? (
          <>
            {filteredTours.length === 0 ? (<div className="bg-white rounded-lg shadow p-8 text-center"><i className="bi bi-search text-4xl text-gray-300 mb-3"></i><h3 className="text-lg font-medium text-gray-900 mb-1.5">No tours found</h3><p className="text-gray-600 text-sm">Adjust your filters</p></div>) : (<>{viewMode === 'grid' ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">{paginatedItems.map((tour: Tour | any) => (<div key={tour.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"><img src={tour.image} alt={tour.title} className="w-full h-36 sm:h-40 object-cover"/><div className="p-3 sm:p-4"><div className="flex justify-between items-start mb-1.5"><h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">{tour.title}</h3><span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(tour.status)}`}>{tour.status}</span></div><p className="text-xs sm:text-sm text-gray-600 mb-1">Guide: {tour.guide}</p><p className="text-xs sm:text-sm text-gray-600 mb-1">{tour.location}</p><p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-2">{tour.description}</p><div className="flex justify-between items-center mb-3"><span className="text-lg sm:text-xl font-bold text-[#083A85]">{tour.price} KES</span><span className="text-xs sm:text-sm text-gray-600">{tour.duration}</span></div><div className="flex gap-1.5 sm:gap-2"><button onClick={() => handleViewTourDetails(tour)} className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">Details</button><button onClick={() => handleBookTour(tour)} className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors">Book</button></div></div></div>))}</div>) : (<div className="bg-white rounded-lg shadow overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[600px]"><thead className="bg-gray-50"><tr><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tour</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guide</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{paginatedItems.map((tour: Tour | any) => (<tr key={tour.id} className="hover:bg-gray-50"><td className="px-3 sm:px-4 py-2 sm:py-3"><div className="flex items-center"><img src={tour.image} alt={tour.title} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mr-2 sm:mr-3"/><div><div className="text-xs sm:text-sm font-medium text-gray-900">{tour.title}</div><div className="text-xs text-gray-500">{tour.location}</div></div></div></td><td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{tour.guide}</td><td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{tour.price} KES</td><td className="px-3 sm:px-4 py-2 sm:py-3"><span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(tour.status)}`}>{tour.status}</span></td><td className="px-3 sm:px-4 py-2 sm:py-3 text-right"><button onClick={() => handleViewTourDetails(tour)} className="text-gray-600 hover:text-gray-900 mr-2"><i className="bi bi-eye text-sm"></i></button><button onClick={() => handleBookTour(tour)} className="text-[#083A85] hover:text-blue-900"><i className="bi bi-calendar-plus text-sm"></i></button></td></tr>))}</tbody></table></div></div>)}</>)}
          </>
        ) : (
          <>{filteredBookings.length === 0 ? (<div className="bg-white rounded-lg shadow p-8 text-center"><i className="bi bi-calendar-x text-4xl text-gray-300 mb-3"></i><h3 className="text-lg font-medium text-gray-900 mb-1.5">No bookings found</h3><p className="text-gray-600 text-sm mb-3">No tour bookings match your filters</p><button onClick={() => setActiveTab('available')} className="px-4 py-2 text-sm bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors">Browse Tours</button></div>) : (<div className="bg-white rounded-lg shadow overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[700px]"><thead className="bg-gray-50"><tr><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tour</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Guests</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-3 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th><th className="px-3 sm:px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{paginatedItems.map((booking: UserBooking | any) => (<tr key={booking.id} className="hover:bg-gray-50"><td className="px-3 sm:px-4 py-2 sm:py-3"><div><div className="text-xs sm:text-sm font-medium text-gray-900">{booking.tourTitle}</div><div className="text-xs text-gray-500">{booking.location}</div></div></td><td className="px-3 sm:px-4 py-2 sm:py-3"><div className="text-xs sm:text-sm text-gray-900">{booking.date.toLocaleDateString()}</div><div className="text-xs text-gray-500">{booking.startTime}</div></td><td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">{booking.numberOfGuests}</td><td className="px-3 sm:px-4 py-2 sm:py-3"><span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span></td><td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{booking.totalPrice || booking.price} {booking.currency}</td><td className="px-3 sm:px-4 py-2 sm:py-3 text-right"><button onClick={() => handleViewBookingDetails(booking)} className="text-gray-600 hover:text-gray-900 mr-2"><i className="bi bi-eye text-sm"></i></button>{booking.status !== 'completed' && booking.status !== 'cancelled' && (<button onClick={() => handleCancelBooking(booking)} className="text-red-600 hover:text-red-900"><i className="bi bi-x-circle text-sm"></i></button>)}</td></tr>))}</tbody></table></div></div>)}</>
        )}

        {totalPages > 1 && (<div className="mt-4 flex justify-between items-center"><div className="text-xs sm:text-sm text-gray-700">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, activeTab === 'available' ? filteredTours.length : filteredBookings.length)} of {activeTab === 'available' ? filteredTours.length : filteredBookings.length}</div><div className="flex items-center gap-1"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Prev</button>{[...Array(Math.min(5, totalPages))].map((_, i) => {const page = i + 1; return (<button key={i} onClick={() => setCurrentPage(page)} className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg ${currentPage === page ? 'bg-[#083A85] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{page}</button>);})}<button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button></div></div>)}

        {showTourModal && selectedTour && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-4 sm:p-6"><div className="flex justify-between items-start mb-3 sm:mb-4"><h2 className="text-lg sm:text-2xl font-bold text-gray-900">{selectedTour.title}</h2><button onClick={() => setShowTourModal(false)} className="text-gray-400 hover:text-gray-600"><i className="bi bi-x-lg text-lg sm:text-xl"></i></button></div><img src={selectedTour.image} alt={selectedTour.title} className="w-full h-48 sm:h-64 object-cover rounded-lg mb-3 sm:mb-4"/><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><p className="text-xs sm:text-sm text-gray-600">Guide</p><p className="font-medium text-sm sm:text-base">{selectedTour.guide}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Duration</p><p className="font-medium text-sm sm:text-base">{selectedTour.duration}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Location</p><p className="font-medium text-sm sm:text-base">{selectedTour.location}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Price</p><p className="font-medium text-sm sm:text-base text-[#083A85]">{selectedTour.price} KES</p></div></div><div><p className="text-xs sm:text-sm text-gray-600 mb-1.5">Description</p><p className="text-gray-800 text-sm sm:text-base">{selectedTour.description}</p></div><div className="flex gap-2 pt-3"><button onClick={() => { setShowTourModal(false); handleBookTour(selectedTour); }} className="flex-1 px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Book Tour</button><button onClick={() => setShowTourModal(false)} className="px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">Close</button></div></div></div></div></div>)}

        {showBookingModal && selectedBooking && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"><div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-4 sm:p-6"><div className="flex justify-between items-start mb-3 sm:mb-4"><h2 className="text-lg sm:text-2xl font-bold text-gray-900">{selectedBooking.tourTitle}</h2><button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600"><i className="bi bi-x-lg text-lg sm:text-xl"></i></button></div><div className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><p className="text-xs sm:text-sm text-gray-600">Date</p><p className="font-medium text-sm sm:text-base">{selectedBooking.date.toLocaleDateString()}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Time</p><p className="font-medium text-sm sm:text-base">{selectedBooking.startTime} - {selectedBooking.endTime}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Guests</p><p className="font-medium text-sm sm:text-base">{selectedBooking.numberOfGuests}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Status</p><span className={`px-1.5 py-0.5 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></div><div><p className="text-xs sm:text-sm text-gray-600">Guide</p><p className="font-medium text-sm sm:text-base">{selectedBooking.guideName}</p></div><div><p className="text-xs sm:text-sm text-gray-600">Total</p><p className="font-medium text-sm sm:text-base text-[#083A85]">{selectedBooking.totalPrice || selectedBooking.price} {selectedBooking.currency}</p></div></div><div><p className="text-xs sm:text-sm text-gray-600 mb-1.5">Location</p><p className="text-gray-800 text-sm sm:text-base">{selectedBooking.location}</p></div>{selectedBooking.specialRequests && (<div><p className="text-xs sm:text-sm text-gray-600 mb-1.5">Special Requests</p><p className="text-gray-800 bg-gray-50 p-2 sm:p-3 rounded-lg text-sm sm:text-base">{selectedBooking.specialRequests}</p></div>)}<div className="flex gap-2 pt-3">{selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (<button onClick={() => { setShowBookingModal(false); handleCancelBooking(selectedBooking); }} className="px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Cancel</button>)}<button onClick={() => setShowBookingModal(false)} className="px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">Close</button></div></div></div></div></div>)}

        {showBookingForm && selectedTour && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50"><div className="bg-white rounded-lg max-w-md w-full"><div className="p-4 sm:p-6"><div className="flex justify-between items-start mb-3 sm:mb-4"><h2 className="text-base sm:text-xl font-bold text-gray-900">Book {selectedTour.title}</h2><button onClick={() => setShowBookingForm(false)} className="text-gray-400 hover:text-gray-600"><i className="bi bi-x-lg text-lg sm:text-xl"></i></button></div><p className="text-gray-600 mb-3 text-xs sm:text-sm">Booking functionality in development</p><div className="space-y-3"><div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Guests</label><input type="number" min="1" max="10" defaultValue="2" className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg"/></div><div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg"/></div><div><label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Special Requests</label><textarea rows={3} className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg resize-none" placeholder="Any special requirements..."></textarea></div></div><div className="flex gap-2 mt-4 sm:mt-6"><button onClick={() => { alert('Booking functionality in development'); setShowBookingForm(false); }} className="flex-1 px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-[#083A85] text-white rounded-lg hover:bg-blue-900 transition-colors font-medium">Confirm</button><button onClick={() => setShowBookingForm(false)} className="px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium">Cancel</button></div></div></div></div>)}
      </div>
    </div>
  );
};

export default GuestToursPage;
