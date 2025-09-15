"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService';

// Types for agent bookings
interface AgentBookingInfo {
    id: string;
    propertyId: number;
    propertyName: string;
    guestId: number;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    agentCommission: number;
    commissionStatus: string;
    clientName: string;
    message?: string;
    createdAt: string;
    updatedAt: string;
}

interface AgentProperty {
    id: number;
    name: string;
    location: string;
    hostEmail: string;
}

interface BookingFilters {
    clientId?: number;
    dateRange?: {
        start: string;
        end: string;
    };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

type ViewMode = 'grid' | 'list';
type SortField = 'date' | 'amount' | 'property' | 'guest';

const AgentBookingsPage: React.FC = () => {
    // Date formatting helper
    const format = (date: Date | string, formatStr: string) => {
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
    const [bookings, setBookings] = useState<AgentBookingInfo[]>([]);
    const [properties, setProperties] = useState<AgentProperty[]>([]);
    const [clients, setClients] = useState<Array<{id: number; name: string}>>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<AgentBookingInfo | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState<string>('all');
    const [propertyFilter, setPropertyFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    // Sort states
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Edit modal states
    const [editNotes, setEditNotes] = useState('');
    const [editCheckInInstructions, setEditCheckInInstructions] = useState('');
    const [editCheckOutInstructions, setEditCheckOutInstructions] = useState('');

    // Fetch agent properties
    const fetchProperties = async () => {
        try {
            const response = await api.get('/properties/agent/all-properties');
            
            if (response.data && response.data.success) {
                const { ownProperties, managedProperties } = response.data.data;
                const allProperties = [
                    ...(ownProperties || []),
                    ...(managedProperties || [])
                ];

                const propertyList = allProperties.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    location: p.location,
                    hostEmail: p.hostEmail || 'N/A'
                }));
                setProperties(propertyList);
            }
        } catch (err) {
            console.error('Error fetching properties:', err);
            setProperties([]);
        }
    };


    // Fetch agent bookings
    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(null);

            const filters: any = {
                sortBy: sortField,
                sortOrder: sortOrder,
                page: currentPage,
                limit: itemsPerPage
            };

            if (searchTerm) {
                filters.search = searchTerm;
            }

            if (clientFilter !== 'all') {
                filters.clientId = parseInt(clientFilter);
            }

            if (propertyFilter !== 'all') {
                filters.propertyId = parseInt(propertyFilter);
            }

            if (dateRange.start && dateRange.end) {
                filters.dateRange = {
                    start: dateRange.start,
                    end: dateRange.end
                };
            }

            const response = await api.get('/properties/agent/bookings', {
                params: filters
            });

            if (response.data && response.data.success) {
                const { bookings, total, totalPages } = response.data.data;
                setBookings(bookings || []);
                setTotal(total || 0);
                setTotalPages(totalPages || 0);
            } else {
                setBookings([]);
                setTotal(0);
                setTotalPages(0);
            }
        } catch (err: any) {
            console.error('Error fetching bookings:', err);
            setError(err.response?.data?.message || 'Failed to fetch bookings');
            setBookings([]);
            setTotal(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBookings();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [currentPage, sortField, sortOrder, clientFilter, propertyFilter, dateRange.start, dateRange.end, searchTerm]);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const totalCommission = bookings.reduce((sum, b) => sum + (b.agentCommission || 0), 0);
        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
        
        return {
            total: total,
            confirmed: bookings.filter(b => b.status === 'confirmed').length,
            pending: bookings.filter(b => b.status === 'pending').length,
            completed: bookings.filter(b => b.status === 'completed').length,
            totalCommission,
            totalRevenue
        };
    }, [bookings, total]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const handleViewDetails = (booking: AgentBookingInfo) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };

    const handleEditBooking = (booking: AgentBookingInfo) => {
        setSelectedBooking(booking);
        setEditNotes(booking.message || '');
        setEditCheckInInstructions('');
        setEditCheckOutInstructions('');
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedBooking) return;

        try {
            const updateData = {
                notes: editNotes,
                checkInInstructions: editCheckInInstructions,
                checkOutInstructions: editCheckOutInstructions
            };

            await api.put(`/properties/agent/bookings/${selectedBooking.id}`, updateData);
            
            await fetchBookings();
            setShowEditModal(false);
            alert('Booking updated successfully!');
        } catch (error: any) {
            console.error('Error updating booking:', error);
            alert(error.response?.data?.message || 'Failed to update booking');
        }
    };

    const handlePrint = (booking: AgentBookingInfo) => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Agent Booking ${booking.id}</title>
                    <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #083A85; }
                    .detail { margin: 10px 0; }
                    .label { font-weight: bold; display: inline-block; width: 150px; }
                    .commission { background: #f0f9ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    </style>
                </head>
                <body>
                    <h1>Agent Booking Details</h1>
                    <div class="detail"><span class="label">Booking ID:</span> ${booking.id}</div>
                    <div class="detail"><span class="label">Client:</span> ${booking.clientName}</div>
                    <div class="detail"><span class="label">Guest:</span> ${booking.guestName}</div>
                    <div class="detail"><span class="label">Property:</span> ${booking.propertyName}</div>
                    <div class="detail"><span class="label">Check-in:</span> ${format(booking.checkIn, 'MMM dd, yyyy')}</div>
                    <div class="detail"><span class="label">Check-out:</span> ${format(booking.checkOut, 'MMM dd, yyyy')}</div>
                    <div class="detail"><span class="label">Guests:</span> ${booking.guests}</div>
                    <div class="detail"><span class="label">Total Amount:</span> $${booking.totalPrice}</div>
                    <div class="detail"><span class="label">Status:</span> ${booking.status}</div>
                    <div class="commission">
                        <div class="detail"><span class="label">Agent Commission:</span> $${booking.agentCommission || 0}</div>
                        <div class="detail"><span class="label">Commission Status:</span> ${booking.commissionStatus}</div>
                    </div>
                    ${booking.message ? `<div class="detail"><span class="label">Notes:</span> ${booking.message}</div>` : ''}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bi-check-circle';
            case 'pending': return 'bi-clock';
            case 'cancelled': return 'bi-x-circle';
            case 'completed': return 'bi-check-square';
            default: return 'bi-calendar';
        }
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="pt-14">
                <div className="mx-auto px-4 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                        <span className="ml-3 text-lg text-gray-600">Loading agent bookings...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pt-14">
                <div className="mx-auto px-4 py-8">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                        <i className="bi bi-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                        <h3 className="text-xl font-medium text-red-800 mb-2">Error Loading Bookings</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchBookings}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-14">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agent Bookings</h1>
                    <p className="text-gray-600 mt-2">Manage bookings for your clients' properties</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-white to-gray-100 rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Bookings</p>
                                <p className="text-xl font-bold text-gray-900">{summaryStats.total}</p>
                            </div>
                            <i className="bi bi-calendar-check text-xl text-gray-400"></i>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Confirmed</p>
                                <p className="text-xl font-bold text-green-600">{summaryStats.confirmed}</p>
                            </div>
                            <i className="bi bi-check-circle text-xl text-green-500"></i>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Pending</p>
                                <p className="text-xl font-bold text-yellow-600">{summaryStats.pending}</p>
                            </div>
                            <i className="bi bi-clock text-xl text-yellow-500"></i>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Completed</p>
                                <p className="text-xl font-bold text-blue-600">{summaryStats.completed}</p>
                            </div>
                            <i className="bi bi-check-square text-xl text-blue-500"></i>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-xl font-bold text-purple-600">${summaryStats.totalRevenue.toLocaleString()}</p>
                            </div>
                            <i className="bi bi-cash-stack text-xl text-purple-500"></i>
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Commission</p>
                                <p className="text-xl font-bold text-indigo-600">${summaryStats.totalCommission.toLocaleString()}</p>
                            </div>
                            <i className="bi bi-percent text-xl text-indigo-500"></i>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Guest or property name..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                        </div>

                        {/* Client Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                            <select
                                value={clientFilter}
                                onChange={(e) => {
                                    setClientFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id.toString()}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Property Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                            <select
                                value={propertyFilter}
                                onChange={(e) => {
                                    setPropertyFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Properties</option>
                                {properties.map(property => (
                                    <option key={property.id} value={property.id.toString()}>{property.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, start: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => {
                                        setDateRange(prev => ({ ...prev, end: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                    className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* View Mode Toggle & Results Count */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                        <p className="text-sm text-gray-600 order-2 sm:order-1">
                            Showing {bookings.length} of {total} bookings
                        </p>
                        <div className="flex gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    viewMode === 'list' 
                                        ? 'bg-blue-900 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
                            >
                                <i className="bi bi-list-ul mr-2"></i>List View
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    viewMode === 'grid' 
                                        ? 'bg-blue-900 text-white' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
                            >
                                <i className="bi bi-grid-3x3-gap mr-2"></i>Grid View
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {!loading && bookings.length === 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <i className="bi bi-calendar-x text-6xl text-gray-300"></i>
                        <h3 className="text-xl font-medium text-gray-900 mt-4">No bookings found</h3>
                        <p className="text-gray-600 mt-2">
                            {total === 0
                                ? "No bookings have been made for your managed properties yet"
                                : "Try adjusting your filters or search criteria"}
                        </p>
                    </div>
                )}

                {/* List View */}
                {!loading && bookings.length > 0 && viewMode === 'list' && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Client & Property
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('guest')}
                                                className="text-xs font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Guest
                                                <i className={`bi bi-chevron-${sortField === 'guest' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('date')}
                                                className="text-xs font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Dates
                                                <i className={`bi bi-chevron-${sortField === 'date' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left">
                                            <button
                                                onClick={() => handleSort('amount')}
                                                className="text-xs font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                                            >
                                                Amount & Commission
                                                <i className={`bi bi-chevron-${sortField === 'amount' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{booking.clientName}</div>
                                                    <div className="text-sm text-gray-500">{booking.propertyName}</div>
                                                    <div className="text-xs text-gray-400">{booking.guests} guests</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{booking.guestName}</div>
                                                <div className="text-xs text-gray-500">{booking.guestEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {format(booking.checkIn, 'MMM dd, yyyy')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    to {format(booking.checkOut, 'MMM dd, yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">${booking.totalPrice.toLocaleString()}</div>
                                                <div className="text-xs text-green-600 font-medium">Commission: ${booking.agentCommission?.toLocaleString() || 0}</div>
                                                <div className="text-xs text-gray-500">#{booking.id.slice(-8)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                    <i className={`bi ${getStatusIcon(booking.status)} mr-1`}></i>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewDetails(booking)}
                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                    title="View details"
                                                >
                                                    <i className="bi bi-eye text-lg"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleEditBooking(booking)}
                                                    className="text-green-600 hover:text-green-900 mr-3"
                                                    title="Edit booking"
                                                >
                                                    <i className="bi bi-pencil text-lg"></i>
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(booking)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Print booking"
                                                >
                                                    <i className="bi bi-printer text-lg"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {!loading && bookings.length > 0 && viewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">{booking.propertyName}</h3>
                                            <p className="text-sm text-blue-600 font-medium">Client: {booking.clientName}</p>
                                            <p className="text-sm text-gray-600">Guest: {booking.guestName}</p>
                                            <p className="text-xs text-gray-500">Booking #{booking.id.slice(-8)}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                            <i className={`bi ${getStatusIcon(booking.status)} mr-1`}></i>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 border-t border-b py-3 my-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <i className="bi bi-calendar-check text-gray-400"></i>
                                            <span>{format(booking.checkIn, 'MMM dd')} - {format(booking.checkOut, 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i className="bi bi-people text-gray-400"></i>
                                            <span>{booking.guests} guests</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <i className="bi bi-envelope text-gray-400"></i>
                                            <span className="truncate">{booking.guestEmail}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Total Amount</span>
                                            <span className="text-lg font-bold text-gray-900">${booking.totalPrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Your Commission</span>
                                            <span className="text-lg font-bold text-green-600">${booking.agentCommission?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>

                                    {booking.message && (
                                        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                            <i className="bi bi-info-circle mr-1"></i>
                                            {booking.message}
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewDetails(booking)}
                                            className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                        >
                                            <i className="bi bi-eye mr-1"></i>View
                                        </button>
                                        <button
                                            onClick={() => handleEditBooking(booking)}
                                            className="flex-1 text-center px-3 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                                            style={{ backgroundColor: '#083A85' }}
                                        >
                                            <i className="bi bi-pencil mr-1"></i>Edit
                                        </button>
                                        <button
                                            onClick={() => handlePrint(booking)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Print"
                                        >
                                            <i className="bi bi-printer text-lg"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-6 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="bi bi-chevron-left"></i>
                            </button>
                            
                            <div className="flex gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === pageNum
                                                    ? 'text-white'
                                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
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
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="bi bi-chevron-right"></i>
                            </button>
                        </div>
                        
                        <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
                                <h2 className="text-2xl font-semibold text-gray-900">Agent Booking Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-700 hover:text-white hover:bg-red-500 rounded-full transition-colors"
                                >
                                    <i className="bi bi-x text-xl"></i>
                                </button>
                            </div>

                            <div className="px-8 py-6 overflow-y-auto">
                                <div className="space-y-6">
                                    {/* Booking Info */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Booking Information</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Booking ID</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Client</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.clientName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Property</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.propertyName}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Status</span>
                                                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                                                    {selectedBooking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guest Info */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Guest Information</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Name</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.guestName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Email</span>
                                                <span className="font-medium text-gray-900 truncate">{selectedBooking.guestEmail}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Number of Guests</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.guests}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stay Details */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Stay Details</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-in</span>
                                                <span className="font-medium text-gray-900 text-right">
                                                    {format(selectedBooking.checkIn, 'EEEE, MMM dd, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Check-out</span>
                                                <span className="font-medium text-gray-900 text-right">
                                                    {format(selectedBooking.checkOut, 'EEEE, MMM dd, yyyy')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Info */}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Financial Information</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Total Amount</span>
                                                <span className="text-lg font-bold text-gray-900">${selectedBooking.totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-t pt-2">
                                                <span className="text-gray-600">Your Commission</span>
                                                <span className="text-lg font-bold text-green-600">${selectedBooking.agentCommission?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Commission Status</span>
                                                <span className="font-medium text-gray-900">{selectedBooking.commissionStatus}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {selectedBooking.message && (
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Notes</h3>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <p className="text-gray-700">{selectedBooking.message}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex justify-end gap-3 z-10">
                                <button
                                    onClick={() => handlePrint(selectedBooking)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    <i className="bi bi-printer mr-2"></i>Print
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        handleEditBooking(selectedBooking);
                                    }}
                                    className="px-4 py-2 text-white rounded-lg transition-colors font-medium"
                                    style={{ backgroundColor: '#083A85' }}
                                >
                                    <i className="bi bi-pencil mr-2"></i>Edit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedBooking && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm transition-opacity" />
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-900">Edit Booking</h3>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <i className="bi bi-x-lg text-xl"></i>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-4">
                                            <strong>Client:</strong> {selectedBooking.clientName}<br/>
                                            <strong>Property:</strong> {selectedBooking.propertyName}<br/>
                                            <strong>Guest:</strong> {selectedBooking.guestName}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                        <textarea
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            placeholder="Internal notes about this booking..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={3}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Instructions</label>
                                        <textarea
                                            value={editCheckInInstructions}
                                            onChange={(e) => setEditCheckInInstructions(e.target.value)}
                                            placeholder="Instructions for guest check-in..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={2}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Instructions</label>
                                        <textarea
                                            value={editCheckOutInstructions}
                                            onChange={(e) => setEditCheckOutInstructions(e.target.value)}
                                            placeholder="Instructions for guest check-out..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                            rows={2}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                        style={{ backgroundColor: '#083A85' }}
                                    >
                                        {loading ? (
                                            <>
                                                <i className="bi bi-arrow-clockwise animate-spin mr-2"></i>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg mr-2"></i>
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentBookingsPage;