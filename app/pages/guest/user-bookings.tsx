"use client";
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  propertyAddress: string;
  checkIn: Date;
  checkOut: Date;
  bookingDate: Date;
  status: 'confirmed' | 'pending' | 'cancelled';
  amount: number;
  paymentStatus: 'paid' | 'due' | 'refunded';
  guests: number;
  specialRequests?: string;
  propertyImage?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'checkIn' | 'propertyName' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

const UserMyBookings: React.FC = () => {
  // Date formatting helper function
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    const dayOfWeek = d.getDay();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      case 'EEEE, MMM dd, yyyy':
        return `${days[dayOfWeek]}, ${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // MODIFICATION: Grid view is now the default
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('checkIn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Mock data generation
  useEffect(() => {
    const generateMockBookings = (): Booking[] => {
      const statuses: ('confirmed' | 'pending' | 'cancelled')[] = ['confirmed', 'pending', 'cancelled'];
      const paymentStatuses: ('paid' | 'due' | 'refunded')[] = ['paid', 'due', 'refunded'];
      const properties = ['Sunset Villa', 'Ocean View Apartment', 'Mountain Lodge', 'City Center Loft', 'Beach House'];
      const guests = ['John Smith', 'Emma Wilson', 'Michael Brown', 'Sarah Davis', 'James Johnson'];
      
      return Array.from({ length: 25 }, (_, i) => ({
        id: `BK${String(i + 1).padStart(5, '0')}`,
        guestName: guests[Math.floor(Math.random() * guests.length)],
        guestEmail: `guest${i + 1}@email.com`,
        guestPhone: `+1 555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        propertyName: properties[Math.floor(Math.random() * properties.length)],
        propertyAddress: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Ocean Blvd', 'Park Ave'][Math.floor(Math.random() * 3)]}`,
        checkIn: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
        checkOut: new Date(2025, Math.floor(Math.random() * 6) + 6, Math.floor(Math.random() * 28) + 1),
        bookingDate: new Date(2025, 0, Math.floor(Math.random() * 30) + 1),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        amount: Math.floor(Math.random() * 1500) + 300,
        paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
        guests: Math.floor(Math.random() * 5) + 1,
        specialRequests: Math.random() > 0.6 ? 'Early check-in requested.' : undefined,
        propertyImage: `https://picsum.photos/seed/${i + 1}/600/400`
      }));
    };

    setTimeout(() => {
      setBookings(generateMockBookings());
      setLoading(false);
    }, 1000);
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (propertyFilter !== 'all') {
      filtered = filtered.filter(booking => booking.propertyName === propertyFilter);
    }

    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filtered = filtered.filter(booking => {
        const checkInDate = new Date(booking.checkIn);
        return checkInDate >= startDate && checkInDate <= endDate;
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'checkIn': comparison = a.checkIn.getTime() - b.checkIn.getTime(); break;
        case 'propertyName': comparison = a.propertyName.localeCompare(b.propertyName); break;
        case 'amount': comparison = a.amount - b.amount; break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchTerm, statusFilter, propertyFilter, dateRange, sortField, sortOrder]);

  // Pagination
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const uniqueProperties = useMemo(() => {
    return [...new Set(bookings.map(b => b.propertyName))];
  }, [bookings]);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleDelete = (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    }
  };

  const handlePrint = (booking: Booking) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html><head><title>Booking ${booking.id}</title><style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #083A85; } .detail { margin: 10px 0; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
        </style></head><body>
          <h1>Booking Details</h1>
          <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
          <div class="detail"><span class="label">Guest Name:</span> ${booking.guestName}</div>
          <div class="detail"><span class="label">Property:</span> ${booking.propertyName}</div>
          <div class="detail"><span class="label">Check-in:</span> ${format(booking.checkIn, 'MMM dd, yyyy')}</div>
          <div class="detail"><span class="label">Check-out:</span> ${format(booking.checkOut, 'MMM dd, yyyy')}</div>
          <div class="detail"><span class="label">Amount:</span> $${booking.amount}</div>
          <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  // Styling helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'due': return 'text-orange-600';
      case 'refunded': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="pt-14">
      {/* MODIFICATION: Added responsive padding for better spacing on all devices */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* MODIFICATION: Responsive font size for the main heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Here you can manage and track all your property bookings.</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input type="text" placeholder="Guest or property name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <i className="bi bi-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Property</label>
              <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="all">All Properties</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Check-in Range</label>
              <div className="flex gap-2">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base" />
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base" />
              </div>
            </div>
          </div>
          {/* MODIFICATION: This container now stacks vertically on mobile for better readability */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-6 gap-4">
            <p className="text-base text-gray-600">
              Showing {paginatedBookings.length} of {filteredBookings.length} bookings
            </p>
            <div className="flex gap-2">
              {/* MODIFICATION: Grid view button is now first */}
              <button onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}>
                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid View
              </button>
              <button onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}>
                <i className="bi bi-list-ul mr-2"></i>List View
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>}
        
        {!loading && filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <i className="bi bi-calendar-x text-6xl text-gray-300"></i>
            <h3 className="text-xl font-medium text-gray-900 mt-4">No bookings found</h3>
            <p className="text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {/* List & Grid Views */}
        {!loading && filteredBookings.length > 0 && (
          viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-700 uppercase tracking-wider">Guest Info</th>
                      <th className="px-6 py-3 text-left"><button onClick={() => handleSort('checkIn')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">Check-in/out<i className={`bi bi-chevron-${sortField === 'checkIn' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i></button></th>
                      <th className="px-6 py-3 text-left"><button onClick={() => handleSort('status')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">Status<i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i></button></th>
                      <th className="px-6 py-3 text-left"><button onClick={() => handleSort('amount')} className="text-base font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer">Amount<i className={`bi bi-chevron-${sortField === 'amount' && sortOrder === 'asc' ? 'up' : 'down'} text-base`}></i></button></th>
                      <th className="px-6 py-3 text-right text-base font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img src={booking.propertyImage} alt={booking.propertyName} className="w-28 h-20 rounded-md object-cover mr-4" />
                            <div>
                              <div className="text-base font-medium text-gray-900">{booking.propertyName}</div>
                              <div className="text-base text-gray-500">{booking.propertyAddress}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">{booking.guestName}</div>
                          <div className="text-base text-gray-500">{booking.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base text-gray-900">{format(booking.checkIn, 'MMM dd, yyyy')}</div>
                          <div className="text-base text-gray-500">to {format(booking.checkOut, 'MMM dd, yyyy')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>{booking.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900">${booking.amount}</div>
                          <div className={`text-base ${getPaymentStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                          <button onClick={() => handleViewDetails(booking)} className="text-blue-600 hover:text-blue-900 mr-3 cursor-pointer"><i className="bi bi-eye text-lg font-bold"></i></button>
                          <button onClick={() => handlePrint(booking)} className="text-gray-600 hover:text-gray-900 mr-3 cursor-pointer"><i className="bi bi-printer text-lg font-bold"></i></button>
                          <button onClick={() => handleDelete(booking.id)} className="text-red-600 hover:text-red-900 cursor-pointer"><i className="bi bi-trash text-lg font-bold"></i></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                  <div className="relative">
                    <img src={booking.propertyImage} alt={booking.propertyName} className="w-full h-56 object-cover" />
                    <span className={`absolute top-3 left-3 px-3 py-1 text-base font-bold rounded-full uppercase tracking-wider ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{booking.propertyName}</h3>
                    <p className="text-base text-gray-500 mb-3 truncate">Guest: {booking.guestName}</p>
                    <div className="text-base text-gray-600 border-t border-b py-3 my-3">
                      <div className="flex items-center gap-2"><i className="bi bi-calendar-check text-gray-400"></i><span>{format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}</span></div>
                      <div className="flex items-center gap-2 mt-2"><i className="bi bi-people text-gray-400"></i><span>{booking.guests} guests</span></div>
                    </div>
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-xl font-bold text-gray-900">${booking.amount}</p>
                          <p className={`text-base ${getPaymentStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDetails(booking)} className="flex-1 text-center px-3 py-2.5 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-base font-medium cursor-pointer"><i className="bi bi-eye mr-1"></i>View</button>
                        <button onClick={() => handlePrint(booking)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"><i className="bi bi-printer text-lg"></i></button>
                        <button onClick={() => handleDelete(booking.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"><i className="bi bi-trash text-lg"></i></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-chevron-left"></i></button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                  return <button key={i} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${currentPage === pageNum ? 'text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`} style={{ backgroundColor: currentPage === pageNum ? '#083A85' : undefined }}>{pageNum}</button>;
                })}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"><i className="bi bi-chevron-right"></i></button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-700">Go to page:</span>
              <input type="number" min="1" max={totalPages} value={goToPageInput} onChange={(e) => setGoToPageInput(e.target.value)} onBlur={(e) => handleGoToPage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)} className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-base text-gray-700">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-semibold text-gray-900">Booking Details</h2>
                <button onClick={() => setShowModal(false)} className="cursor-pointer"><i className="bi bi-x w-5 h-5 p-3 bg-gray-300 text-black-400 hover:text-white hover:bg-red-500 rounded-full transition-colors"></i></button>
              </div>
              <div className="px-8 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                <div className="space-y-6">
                  {/* Booking, Guest, Property, Payment Info Sections */}
                  <div><h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Booking Information</h3><div className="bg-gray-50 rounded-lg p-4 space-y-3"><div className="flex justify-between"><span className="text-base text-gray-600">Booking ID</span><span className="text-base font-medium text-gray-900">{selectedBooking.id}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Booking Date</span><span className="text-base font-medium text-gray-900">{format(selectedBooking.bookingDate, 'MMM dd, yyyy')}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Status</span><span className={`px-2 py-1 text-base font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></div></div></div>
                  <div><h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Guest Information</h3><div className="bg-gray-50 rounded-lg p-4 space-y-3"><div className="flex justify-between"><span className="text-base text-gray-600">Name</span><span className="text-base font-medium text-gray-900">{selectedBooking.guestName}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Email</span><span className="text-base font-medium text-gray-900">{selectedBooking.guestEmail}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Phone</span><span className="text-base font-medium text-gray-900">{selectedBooking.guestPhone}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Number of Guests</span><span className="text-base font-medium text-gray-900">{selectedBooking.guests}</span></div></div></div>
                  <div><h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Property Information</h3><div className="bg-gray-50 rounded-lg p-4 space-y-3"><div className="flex justify-between"><span className="text-base text-gray-600">Property Name</span><span className="text-base font-medium text-gray-900">{selectedBooking.propertyName}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Address</span><span className="text-base font-medium text-gray-900">{selectedBooking.propertyAddress}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Check-in</span><span className="text-base font-medium text-gray-900">{format(selectedBooking.checkIn, 'EEEE, MMM dd, yyyy')}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Check-out</span><span className="text-base font-medium text-gray-900">{format(selectedBooking.checkOut, 'EEEE, MMM dd, yyyy')}</span></div></div></div>
                  <div><h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Payment Information</h3><div className="bg-gray-50 rounded-lg p-4 space-y-3"><div className="flex justify-between"><span className="text-base text-gray-600">Total Amount</span><span className="text-lg font-bold text-gray-900">${selectedBooking.amount}</span></div><div className="flex justify-between"><span className="text-base text-gray-600">Payment Status</span><span className={`text-base font-medium ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>{selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}</span></div></div></div>
                  {selectedBooking.specialRequests && <div><h3 className="text-base font-medium text-gray-500 uppercase tracking-wider mb-3">Special Requests</h3><div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="text-base text-gray-700">{selectedBooking.specialRequests}</p></div></div>}
                </div>
              </div>
              <div className="sticky bottom-0 bg-white border-t px-8 py-4 flex justify-end gap-3 z-10">
                <button onClick={() => handlePrint(selectedBooking)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer"><i className="bi bi-printer mr-2"></i>Print</button>
                <button onClick={() => { handleDelete(selectedBooking.id); setShowModal(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"><i className="bi bi-trash mr-2"></i>Delete</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-white rounded-lg transition-colors font-medium cursor-pointer" style={{ backgroundColor: '#083A85' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMyBookings;