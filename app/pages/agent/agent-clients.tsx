"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from "@/app/api/apiService";

// Interfaces remain the same
interface GuestProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
  joinDate: string;
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  lastBooking?: string;
  preferredCommunication: string;
  notes?: string;
}

interface GuestBookingHistory {
  guestId: number;
  bookings: BookingInfo[];
  totalBookings: number;
  totalRevenue: number;
  averageStayDuration: number;
  favoriteProperty?: string;
}

interface BookingInfo {
  id: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Checked In' | 'Checked Out' | 'Pending';
  bookingDate: string;
  checkInDate: string;
  checkOutDate: string;
  housePayment: number;
  amountPerClient: number;
  propertyName: string;
  numberOfGuests: number;
  verificationStatus: string;
  totalBookings: number;
  averageRating: number;
  profileImage?: string;
}

interface GuestSearchFilters {
  search?: string;
  verificationStatus?: 'verified' | 'unverified' | 'pending';
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'name' | 'joinDate' | 'totalBookings' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  vipClients: number;
  totalRevenue: number;
  averageBookingValue: number;
  clientRetention: number;
}

const AgentClientsPage: React.FC = () => {
  // States
  const [activeTab, setActiveTab] = useState<'All' | Client['status']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Client>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [goToPageInput, setGoToPageInput] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // API related state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  const [uniqueProperties, setUniqueProperties] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    vipClients: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    clientRetention: 0
  });

  const pageSize = 12;

  useEffect(() => setCurrentPage(1), [activeTab, searchTerm, startDate, endDate, propertyFilter, verificationFilter]);

  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Transform function
  const transformGuestToClient = (guest: GuestProfile, latestBooking?: BookingInfo): Client => {
    const status: Client['status'] = latestBooking 
      ? latestBooking.status === 'confirmed' 
        ? new Date(latestBooking.checkIn) <= new Date() && new Date(latestBooking.checkOut) > new Date()
          ? 'Checked In'
          : new Date(latestBooking.checkOut) <= new Date()
          ? 'Checked Out'
          : 'Pending'
        : latestBooking.status === 'completed'
        ? 'Checked Out'
        : 'Pending'
      : 'Pending';

    return {
      id: guest.id.toString(),
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      email: guest.email,
      phone: guest.phone || '',
      status,
      bookingDate: latestBooking?.createdAt || guest.joinDate,
      checkInDate: latestBooking?.checkIn || guest.joinDate,
      checkOutDate: latestBooking?.checkOut || guest.joinDate,
      housePayment: latestBooking?.totalPrice || 0,
      amountPerClient: latestBooking ? Math.round(latestBooking.totalPrice / latestBooking.guests) : 0,
      propertyName: latestBooking?.propertyName || 'N/A',
      numberOfGuests: latestBooking?.guests || 1,
      verificationStatus: guest.verificationStatus,
      totalBookings: guest.totalBookings,
      averageRating: guest.averageRating,
      profileImage: guest.profileImage
    };
  };

  // Fetch function
  const fetchAgentGuests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Authentication required');
        return;
      }

      api.setAuth(authToken);

      const filters: GuestSearchFilters = {};
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      if (startDate && endDate) {
        filters.dateRange = { start: startDate, end: endDate };
      }

      const apiSortBy = sortBy === 'name' ? 'name' : 
                       sortBy === 'totalBookings' ? 'totalBookings' :
                       sortBy === 'housePayment' ? 'totalSpent' : 'joinDate';
      
      filters.sortBy = apiSortBy as any;
      filters.sortOrder = sortOrder;

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      if (filters.dateRange) {
        queryParams.append('dateStart', filters.dateRange.start);
        queryParams.append('dateEnd', filters.dateRange.end);
      }

      const response = await api.get(`/properties/agent/guests?${queryParams.toString()}`);

      if (response.data && response.data.success) {
        const guestsData: GuestProfile[] = response.data.data || [];
        
        const clientsPromises = guestsData.map(async (guest) => {
          try {
            const bookingResponse = await api.get(`/properties/agent/guests/${guest.id}/bookings`);
            const bookings: BookingInfo[] = bookingResponse.data?.bookings || [];
            const latestBooking = bookings.length > 0 ? bookings[0] : undefined;
            return transformGuestToClient(guest, latestBooking);
          } catch (error) {
            console.error(`Failed to fetch bookings for guest ${guest.id}:`, error);
            return transformGuestToClient(guest);
          }
        });

        const transformedClients = await Promise.all(clientsPromises);
        setClients(transformedClients);

        const properties = [...new Set(transformedClients.map(c => c.propertyName).filter(p => p !== 'N/A'))];
        setUniqueProperties(properties);

        // Calculate dashboard stats
        const stats = {
          totalClients: response.data.total || transformedClients.length,
          activeClients: transformedClients.filter(c => c.status === 'Checked In').length,
          vipClients: transformedClients.filter(c => c.totalBookings >= 5).length,
          totalRevenue: transformedClients.reduce((sum, c) => sum + c.housePayment, 0),
          averageBookingValue: transformedClients.length > 0 
            ? transformedClients.reduce((sum, c) => sum + c.housePayment, 0) / transformedClients.length 
            : 0,
          clientRetention: 85 // Mock value
        };
        setDashboardStats(stats);

        if (response.data.total !== undefined) {
          setApiTotal(response.data.total);
          setApiTotalPages(response.data.totalPages || Math.ceil(response.data.total / pageSize));
        } else {
          setApiTotal(transformedClients.length);
          setApiTotalPages(1);
        }

      } else {
        setClients([]);
        setApiTotal(0);
        setApiTotalPages(0);
      }

    } catch (error: any) {
      console.error('Failed to fetch agent guests:', error);
      setError(error.response?.data?.message || 'Failed to load clients data');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentGuests();
  }, [currentPage, searchTerm, startDate, endDate, sortBy, sortOrder]);

  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(client => {
      const matchesTab = activeTab === 'All' || client.status === activeTab;
      const matchesProperty = propertyFilter === 'all' || client.propertyName === propertyFilter;
      const matchesVerification = verificationFilter === 'all' || client.verificationStatus === verificationFilter;
      return matchesTab && matchesProperty && matchesVerification;
    });
    return result;
  }, [clients, activeTab, propertyFilter, verificationFilter]);

  const totalClients = filteredAndSortedClients.length;
  const totalPages = Math.max(apiTotalPages, Math.ceil(totalClients / pageSize));
  const paginatedClients = filteredAndSortedClients;

  // Helper functions
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
      'bg-gray-200',
    ];
    return colors[parseInt(id) % colors.length];
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'Checked In': return 'bg-green-100 text-green-800';
      case 'Checked Out': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Client['status']) => {
    switch (status) {
      case 'Checked In': return 'bi-door-open';
      case 'Checked Out': return 'bi-door-closed';
      case 'Pending': return 'bi-clock';
      default: return 'bi-circle';
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified': return { color: 'text-green-600', icon: 'bi-patch-check', label: 'Verified' };
      case 'pending': return { color: 'text-yellow-600', icon: 'bi-clock', label: 'Pending' };
      default: return { color: 'text-gray-400', icon: 'bi-x-circle', label: 'Unverified' };
    }
  };

  const handleSort = (column: keyof Client) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  // Client Detail Modal
  const ClientDetailModal = () => {
    if (!selectedClient) return null;

    const verification = getVerificationBadge(selectedClient.verificationStatus);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold">Guest details</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {selectedClient.profileImage ? (
                  <img src={selectedClient.profileImage} alt={selectedClient.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-3xl font-bold">{getInitials(selectedClient.name)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold">{selectedClient.name}</h3>
                  <span className={`${verification.color} flex items-center gap-1`}>
                    <i className={`bi ${verification.icon}`}></i>
                    <span className="text-sm">{verification.label}</span>
                  </span>
                </div>
                <p className="text-gray-600 mb-1">{selectedClient.email}</p>
                <p className="text-gray-600 mb-3">{selectedClient.phone}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total bookings</p>
                <p className="text-3xl font-bold">{selectedClient.totalBookings}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Last payment</p>
                <p className="text-3xl font-bold">${selectedClient.housePayment.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg. rating</p>
                <p className="text-3xl font-bold">{selectedClient.averageRating.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Guests</p>
                <p className="text-3xl font-bold">{selectedClient.numberOfGuests}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Latest booking</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Property</span>
                  <span className="font-medium">{selectedClient.propertyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium">{new Date(selectedClient.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium">{new Date(selectedClient.checkOutDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking date</span>
                  <span className="font-medium">{new Date(selectedClient.bookingDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <span className="text-gray-600">Amount per guest</span>
                  <span className="font-medium text-green-600">${selectedClient.amountPerClient}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">Guests</h1>
          <p className="text-gray-600">Manage your guests and view their details</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total guests</p>
            <p className="text-3xl font-bold">{dashboardStats.totalClients}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Checked in</p>
            <p className="text-3xl font-bold">{dashboardStats.activeClients}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">VIP guests</p>
            <p className="text-3xl font-bold">{dashboardStats.vipClients}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Total revenue</p>
            <p className="text-3xl font-bold">${(dashboardStats.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Avg. value</p>
            <p className="text-3xl font-bold">${Math.round(dashboardStats.averageBookingValue)}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Retention</p>
            <p className="text-3xl font-bold">{dashboardStats.clientRetention}%</p>
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-black font-medium"
          >
            <i className="bi bi-funnel text-xl"></i>
            Filters
            {(activeTab !== 'All' || propertyFilter !== 'all' || verificationFilter !== 'all' || searchTerm || (startDate && endDate)) && (
              <span className="bg-black text-white text-xs rounded-full px-2 ml-2">1+</span>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
            >
              <i className="bi bi-grid-3x3-gap text-xl"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
            >
              <i className="bi bi-list text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-8 p-6 border border-gray-200 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
              />
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value as 'All' | Client['status'])}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black appearance-none"
              >
                <option value="All">All statuses</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Pending">Pending</option>
              </select>
              <select 
                value={propertyFilter} 
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black appearance-none"
              >
                <option value="all">All properties</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select 
                value={verificationFilter} 
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black appearance-none"
              >
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="unverified">Unverified</option>
              </select>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {totalClients === 0 && !isLoading ? (
          <div className="text-center py-24">
            <i className="bi bi-people text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No guests</h3>
            <p className="text-gray-600">When you have guests, they'll show up here.</p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {paginatedClients.map(client => (
                  <div key={client.id} className="border border-gray-200 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
                          {client.profileImage ? (
                            <img src={client.profileImage} alt={client.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-gray-600 font-bold">{getInitials(client.name)}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-1">{client.email}</p>
                      <p className="text-gray-600 mb-4">{client.phone}</p>
                      <p className="text-sm text-gray-600 mb-2">{client.propertyName} • {client.numberOfGuests} guests</p>
                      <p className="text-sm text-gray-500 mb-4">{new Date(client.checkInDate).toLocaleDateString()} – {new Date(client.checkOutDate).toLocaleDateString()}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-xl">${client.housePayment.toLocaleString()}</span>
                        <span className="text-green-600 text-sm">${client.amountPerClient}/guest</span>
                      </div>
                      <button
                        onClick={() => handleViewDetails(client)}
                        className="w-full py-3 border border-black rounded-full font-medium hover:bg-gray-50 transition"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Guest</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Property</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Dates</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-600">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-4">
                            {client.profileImage ? (
                              <img src={client.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-600 font-medium">{getInitials(client.name)}</span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{client.name}</span>
                            <div className="text-gray-600">{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">{client.propertyName}</td>
                      <td className="py-4 px-6 text-gray-600">{new Date(client.checkInDate).toLocaleDateString()} – {new Date(client.checkOutDate).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium">${client.housePayment.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 border border-gray-300 rounded-full font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 border border-gray-300 rounded-full font-medium disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Modals */}
        {showDetailModal && <ClientDetailModal />}
      </div>
    </div>
  );
};

export default AgentClientsPage;