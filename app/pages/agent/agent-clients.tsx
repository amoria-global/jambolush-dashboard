"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from "@/app/api/apiService"; // Import your API service
import { set } from 'date-fns';

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
      setUser(null);
    }
  };

  const KYCPendingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full">
              <i className="bi bi-hourglass-split text-2xl text-black"></i>
            </div>
            <h3 className="text-xl font-semibold text-center text-black mb-3">
              KYC Verification Pending
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Your account verification is currently being processed. Please wait for verification to complete before performing this action. This process typically takes 2-4 hours.
            </p>
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-black/90 transition-all font-medium cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const pageSize = 8;

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
      propertyName: latestBooking?.propertyName || '',
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
            setError('Failed to load booking data for some guests');
            return transformGuestToClient(guest);
          }
        });

        const transformedClients = await Promise.all(clientsPromises);
        setClients(transformedClients);

        const properties = [...new Set(transformedClients.map(c => c.propertyName).filter(p => p && p !== ''))];
        setUniqueProperties(properties);

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
      <div className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
        <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-black">Guest details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>
            </div>

            <div className="flex items-start gap-6 mb-8">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {selectedClient.profileImage ? (
                  <img src={selectedClient.profileImage} alt={selectedClient.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-3xl font-bold">{getInitials(selectedClient.name)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-semibold text-black">{selectedClient.name}</h3>
                  <span className={`${verification.color} flex items-center gap-1`}>
                    <i className={`bi ${verification.icon}`}></i>
                    <span className="text-sm">{verification.label}</span>
                  </span>
                </div>
                <p className="text-gray-600 mb-1">{selectedClient.email}</p>
                {selectedClient.phone && <p className="text-gray-600 mb-3">{selectedClient.phone}</p>}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total bookings</p>
                <p className="text-3xl font-bold text-black">{selectedClient.totalBookings}</p>
              </div>
              {selectedClient.averageRating > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Avg. rating</p>
                  <p className="text-3xl font-bold text-black flex items-center gap-2">
                    <i className="bi bi-star-fill text-2xl"></i>
                    {selectedClient.averageRating.toFixed(1)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Guests</p>
                <p className="text-3xl font-bold text-black">{selectedClient.numberOfGuests}</p>
              </div>
            </div>

            {selectedClient.propertyName && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-black mb-4">Latest booking</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Property</span>
                    <span className="font-medium text-black">{selectedClient.propertyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-medium text-black">{new Date(selectedClient.checkInDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-medium text-black">{new Date(selectedClient.checkOutDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Booked on</span>
                    <span className="font-medium text-black">{new Date(selectedClient.bookingDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )}
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
    <div className="min-h-screen bg-white font-sans mt-4 px-3">
      <div className="max-w-7xl mx-auto px-4 py-5">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-2 text-black">Guests</h1>
          <p className="text-gray-500 text-lg">Manage your guests and view their details</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-6 rounded-2xl border border-gray-200 hover:border-black transition-all hover:shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Total guests</p>
            <p className="text-3xl font-bold text-black">{apiTotal}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 hover:border-black transition-all hover:shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Checked in</p>
            <p className="text-3xl font-bold text-black">{clients.filter(c => c.status === 'Checked In').length}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 hover:border-black transition-all hover:shadow-sm">
            <p className="text-sm text-gray-500 mb-2">VIP guests</p>
            <p className="text-3xl font-bold text-black">{clients.filter(c => c.totalBookings >= 5).length}</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 hover:border-black transition-all hover:shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Retention</p>
            <p className="text-3xl font-bold text-black">85%</p>
          </div>
        </div>

        {/* Filters Toggle */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-black font-medium hover:bg-gray-50 px-4 py-2 rounded-lg transition-all"
          >
            <i className="bi bi-funnel text-lg"></i>
            Filters
            {(activeTab !== 'All' || propertyFilter !== 'all' || verificationFilter !== 'all' || searchTerm || (startDate && endDate)) && (
              <span className="bg-black text-white text-xs rounded-full px-2 py-0.5 ml-1">Active</span>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              <i className="bi bi-grid-3x3-gap text-lg"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
            >
              <i className="bi bi-list text-lg"></i>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as 'All' | Client['status'])}
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none bg-white transition-all"
              >
                <option value="All">All statuses</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Pending">Pending</option>
              </select>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none bg-white transition-all"
              >
                <option value="all">All properties</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none bg-white transition-all"
              >
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="unverified">Unverified</option>
              </select>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white transition-all"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
                className="px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {totalClients === 0 && !isLoading ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-people text-4xl text-gray-400"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-black">No guests yet</h3>
            <p className="text-gray-500">When you have guests, they'll appear here.</p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedClients.map(client => (
                  <div key={client.id} className="group border border-gray-200 rounded-2xl overflow-hidden hover:border-black hover:shadow-xl transition-all cursor-pointer" onClick={() => handleViewDetails(client)}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {client.profileImage ? (
                              <img src={client.profileImage} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-600 font-bold text-lg">{getInitials(client.name)}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-base text-black">{client.name}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                              {client.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="bi bi-envelope text-xs"></i>
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <i className="bi bi-telephone text-xs"></i>
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-100 pt-4 space-y-3">
                        {client.propertyName && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Property</span>
                            <span className="font-medium text-black truncate ml-2">{client.propertyName}</span>
                          </div>
                        )}
                        {client.propertyName && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Guests</span>
                            <span className="font-medium text-black">{client.numberOfGuests}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total bookings</span>
                          <span className="font-medium text-black">{client.totalBookings}</span>
                        </div>
                        {client.averageRating > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Rating</span>
                            <span className="font-medium text-black flex items-center gap-1">
                              <i className="bi bi-star-fill text-xs"></i>
                              {client.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {client.propertyName && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Latest stay</p>
                          <p className="text-sm text-black font-medium">{new Date(client.checkInDate).toLocaleDateString()} – {new Date(client.checkOutDate).toLocaleDateString()}</p>
                        </div>
                      )}

                      <button
                        className="w-full mt-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all group-hover:shadow-lg"
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
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Guest</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Property</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Dates</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Status</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Rating</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-600 text-sm">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleViewDetails(client)}>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mr-4">
                              {client.profileImage ? (
                                <img src={client.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-600 font-medium">{getInitials(client.name)}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-black">{client.name}</span>
                              <div className="text-gray-500 text-sm">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-black font-medium">{client.propertyName || '—'}</td>
                        <td className="py-4 px-6 text-gray-600 text-sm">{new Date(client.checkInDate).toLocaleDateString()} – {new Date(client.checkOutDate).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {client.averageRating > 0 ? (
                            <span className="flex items-center gap-1 text-black font-medium">
                              <i className="bi bi-star-fill text-xs"></i>
                              {client.averageRating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-medium text-black">{client.totalBookings}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page <span className="font-semibold text-black">{currentPage}</span> of <span className="font-semibold text-black">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 bg-black text-white rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-800 transition-all"
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