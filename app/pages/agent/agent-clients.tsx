"use client";

import React, { useState, useMemo, useEffect } from 'react';
import api from "@/app/api/apiService"; // Import your API service

// Interface for guest profile from API
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

// Interface for booking history from API
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

// Client interface for the component (transformed from API data)
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
}

// API response interface
interface ApiResponse {
  guests: GuestProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Guest search filters for API
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

const AgentClientsPage: React.FC = () => {
  // Original UI state
  const [activeTab, setActiveTab] = useState<'All' | Client['status']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Client>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [goToPageInput, setGoToPageInput] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  // API related state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  const [uniqueProperties, setUniqueProperties] = useState<string[]>([]);

  const pageSize = 8;

  useEffect(() => setCurrentPage(1), [activeTab, searchTerm, startDate, endDate, propertyFilter]);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Function to transform API guest data to client data
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
      averageRating: guest.averageRating
    };
  };

  // Function to fetch guests from API
  const fetchAgentGuests = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setError('Authentication required');
        return;
      }

      // Set authorization header
      api.setAuth(authToken);

      // Prepare filters
      const filters: GuestSearchFilters = {};
      
      if (searchTerm) {
        filters.search = searchTerm;
      }
      
      if (startDate && endDate) {
        filters.dateRange = {
          start: startDate,
          end: endDate
        };
      }

      // Map sortBy to API expected values
      const apiSortBy = sortBy === 'name' ? 'name' : 
                       sortBy === 'totalBookings' ? 'totalBookings' :
                       sortBy === 'housePayment' ? 'totalSpent' : 'joinDate';
      
      filters.sortBy = apiSortBy as any;
      filters.sortOrder = sortOrder;

      // Prepare query parameters for GET request
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());
      
      // Add filters as query parameters
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      if (filters.sortBy) {
        queryParams.append('sortBy', filters.sortBy);
      }
      
      if (filters.sortOrder) {
        queryParams.append('sortOrder', filters.sortOrder);
      }
      
      if (filters.dateRange) {
        queryParams.append('dateStart', filters.dateRange.start);
        queryParams.append('dateEnd', filters.dateRange.end);
      }

      // Make API call with query parameters
      const response = await api.get(`/properties/agent/guests?${queryParams.toString()}`);

      if (response.data && response.data.success) {
        const guestsData: GuestProfile[] = response.data.data || [];
        
        // Fetch booking details for each guest to get latest booking info
        const clientsPromises = guestsData.map(async (guest) => {
          try {
            // Get guest's booking history
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

        // Extract unique properties
        const properties = [...new Set(transformedClients.map(c => c.propertyName).filter(p => p !== 'N/A'))];
        setUniqueProperties(properties);

        // Set pagination info
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

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchAgentGuests();
  }, [currentPage, searchTerm, startDate, endDate, sortBy, sortOrder]);

  // Filter clients locally (since API might not handle all filters)
  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(client => {
      const matchesTab = activeTab === 'All' || client.status === activeTab;
      const matchesProperty = propertyFilter === 'all' || client.propertyName === propertyFilter;
      return matchesTab && matchesProperty;
    });

    return result;
  }, [clients, activeTab, propertyFilter]);

  const totalClients = filteredAndSortedClients.length;
  const totalPages = Math.max(apiTotalPages, Math.ceil(totalClients / pageSize));
  const paginatedClients = filteredAndSortedClients;

  // Helper functions remain the same
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const getAvatarColor = (id: string) => {
    const colors = [
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
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

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 h-20">
        <span className={`absolute top-3 left-3 px-3 py-1 text-sm font-bold rounded-full uppercase tracking-wider ${getStatusColor(client.status)}`}>
          {client.status}
        </span>
        <div className={`absolute -bottom-6 left-4 w-12 h-12 rounded-full ${getAvatarColor(client.id)} flex items-center justify-center shadow-lg`}>
          <span className="text-white text-base font-bold">{getInitials(client.name)}</span>
        </div>
      </div>
      
      <div className="p-4 pt-8 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
        <p className="text-base text-gray-500 mb-1">{client.email}</p>
        <p className="text-base text-gray-500 mb-4">{client.phone}</p>
        
        <div className="text-base text-gray-600 border-t border-b py-3 my-3 space-y-2">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium text-gray-900 text-right truncate ml-2">{client.propertyName}</span>
          </div>
          <div className="flex justify-between">
            <span>Guests:</span>
            <span className="font-medium text-gray-900">{client.numberOfGuests} people</span>
          </div>
          <div className="flex justify-between">
            <span>Total Bookings:</span>
            <span className="font-medium text-gray-900">{client.totalBookings}</span>
          </div>
          <div className="flex justify-between">
            <span>Check-in:</span>
            <span className="font-medium text-gray-900">{new Date(client.checkInDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Check-out:</span>
            <span className="font-medium text-gray-900">{new Date(client.checkOutDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-lg font-bold text-[#083A85]">${client.housePayment.toLocaleString()}</p>
              <p className="text-base text-green-600">${client.amountPerClient}/client</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your client portfolio</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <h3 className="text-xl font-medium text-gray-900">Loading clients...</h3>
            <p className="text-gray-600 mt-2">Please wait while we fetch your client data</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pt-14">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your client portfolio</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mt-4">Error Loading Data</h3>
            <p className="text-gray-600 mt-2">{error}</p>
            <button 
              onClick={fetchAgentGuests}
              className="mt-4 px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-blue-800 transition-colors"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-[#083A85]">Client Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your client portfolio</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Client name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-3 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Status</label>
              <select 
                value={activeTab} 
                onChange={(e) => setActiveTab(e.target.value as 'All' | Client['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Property</label>
              <select 
                value={propertyFilter} 
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Properties</option>
                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">Booking Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-6 gap-4">
            <p className="text-base text-gray-600">
              Showing {paginatedClients.length} of {apiTotal} clients
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                  viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid View
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                  viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {totalClients === 0 && !isLoading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mt-4">No clients found</h3>
            <p className="text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        )}

        {totalClients > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
              {paginatedClients.map(client => <ClientCard key={client.id} client={client} />)}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              {/* Mobile List View */}
              <div className="block sm:hidden">
                <div className="divide-y divide-gray-200">
                  {paginatedClients.map((client) => (
                    <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full ${getAvatarColor(client.id)} flex items-center justify-center shadow`}>
                            <span className="text-white text-base font-bold">{getInitials(client.name)}</span>
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">{client.name}</div>
                            <div className="text-base text-gray-500">{client.email}</div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-base">
                        <div>
                          <span className="text-gray-500">Property:</span>
                          <div className="font-medium text-gray-900 truncate">{client.propertyName}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Guests:</span>
                          <div className="font-medium text-gray-900">{client.numberOfGuests}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">House Payment:</span>
                          <div className="font-bold text-[#083A85]">${client.housePayment.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Per Client:</span>
                          <div className="font-bold text-green-600">${client.amountPerClient}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Bookings:</span>
                          <div className="font-medium text-gray-700">{client.totalBookings}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Verification:</span>
                          <div className="font-medium text-gray-700 capitalize">{client.verificationStatus}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('name')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Client Info</span>
                          {sortBy === 'name' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('propertyName')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Property & Guests</span>
                          {sortBy === 'propertyName' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('totalBookings')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Bookings & Verification</span>
                          {sortBy === 'totalBookings' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('housePayment')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Payment Details</span>
                          {sortBy === 'housePayment' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('status')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Status</span>
                          {sortBy === 'status' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedClients.map((client, index) => (
                      <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(client.id)} flex items-center justify-center shadow mr-3 flex-shrink-0`}>
                              <span className="text-white text-base font-bold">{getInitials(client.name)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-base font-semibold text-gray-900 truncate">{client.name}</div>
                              <div className="text-base text-gray-500 truncate">{client.email}</div>
                              <div className="text-base text-gray-400 truncate">{client.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-medium text-gray-900 truncate max-w-[150px]">{client.propertyName}</div>
                          <div className="text-base text-gray-500">{client.numberOfGuests} guests</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base sm:text-base text-gray-900">
                            <div><strong>Total:</strong> {client.totalBookings} bookings</div>
                            <div><strong>Status:</strong> <span className="capitalize">{client.verificationStatus}</span></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base font-bold text-[#083A85]">${client.housePayment.toLocaleString()}</div>
                          <div className="text-base text-green-600 font-semibold">${client.amountPerClient}/client</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getStatusColor(client.status)}`}>
                            {client.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : 
                                 (currentPage >= totalPages - 2) ? totalPages - 4 + i : 
                                 currentPage - 2 + i;
                  return (
                    <button 
                      key={i} 
                      onClick={() => setCurrentPage(pageNum)} 
                      className={`px-3 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                        currentPage === pageNum 
                          ? 'text-white' 
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`} 
                      style={{ backgroundColor: currentPage === pageNum ? '#083A85' : undefined }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages} 
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-700">Go to page:</span>
              <input 
                type="number" 
                min="1" 
                max={totalPages} 
                value={goToPageInput} 
                onChange={(e) => setGoToPageInput(e.target.value)} 
                onBlur={(e) => handleGoToPage(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)} 
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <span className="text-base text-gray-700">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentClientsPage;