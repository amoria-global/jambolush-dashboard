import React, { useState, useMemo, useEffect } from 'react';

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
}

const MOCK_CLIENTS: Client[] = [
  { 
    id: '1', 
    name: 'Mubeni pablo', 
    email: 'pablo12@gmail.com', 
    phone: '+1 (555) 123-4567',
    status: 'Checked In', 
    bookingDate: '2023-01-15', 
    checkInDate: '2023-02-01',
    checkOutDate: '2023-02-05',
    housePayment: 1200, 
    amountPerClient: 150,
    propertyName: 'Ocean View Villa',
    numberOfGuests: 4
  },
  { 
    id: '2', 
    name: 'Robert Willy', 
    email: 'robert.w@email.com', 
    phone: '+1 (555) 234-5678',
    status: 'Checked Out', 
    bookingDate: '2023-02-20', 
    checkInDate: '2023-03-01',
    checkOutDate: '2023-03-07',
    housePayment: 1500, 
    amountPerClient: 200,
    propertyName: 'Mountain Lodge',
    numberOfGuests: 6
  },
  { 
    id: '3', 
    name: 'Emily Chen', 
    email: 'emily.c@email.com', 
    phone: '+1 (555) 345-6789',
    status: 'Checked In', 
    bookingDate: '2023-03-10', 
    checkInDate: '2023-03-15',
    checkOutDate: '2023-03-20',
    housePayment: 1100, 
    amountPerClient: 175,
    propertyName: 'City Center Apartment',
    numberOfGuests: 2
  },
  { 
    id: '4', 
    name: 'David Brown', 
    email: 'david.b@email.com', 
    phone: '+1 (555) 456-7890',
    status: 'Pending', 
    bookingDate: '2023-04-05', 
    checkInDate: '2023-04-15',
    checkOutDate: '2023-04-22',
    housePayment: 1300, 
    amountPerClient: 180,
    propertyName: 'Lakeside Cabin',
    numberOfGuests: 5
  },
  { 
    id: '5', 
    name: 'Lisa Martin', 
    email: 'lisa.m@email.com', 
    phone: '+1 (555) 567-8901',
    status: 'Checked In', 
    bookingDate: '2023-05-18', 
    checkInDate: '2023-05-25',
    checkOutDate: '2023-05-30',
    housePayment: 1400, 
    amountPerClient: 160,
    propertyName: 'Beach House',
    numberOfGuests: 8
  },
  { 
    id: '6', 
    name: 'Kevin Davis', 
    email: 'kevin.d@email.com', 
    phone: '+1 (555) 678-9012',
    status: 'Checked Out', 
    bookingDate: '2023-06-22', 
    checkInDate: '2023-07-01',
    checkOutDate: '2023-07-08',
    housePayment: 1250, 
    amountPerClient: 190,
    propertyName: 'Downtown Loft',
    numberOfGuests: 3
  },
  { 
    id: '7', 
    name: 'Uwitonze paccy', 
    email: 'paccy.uw@email.com', 
    phone: '+1 (555) 789-0123',
    status: 'Pending', 
    bookingDate: '2023-07-30', 
    checkInDate: '2023-08-10',
    checkOutDate: '2023-08-17',
    housePayment: 1350, 
    amountPerClient: 170,
    propertyName: 'Countryside Villa',
    numberOfGuests: 7
  },
  { 
    id: '8', 
    name: 'Mugwiza jackson', 
    email: 'jackson.M@email.com', 
    phone: '+1 (555) 890-1234',
    status: 'Checked Out', 
    bookingDate: '2023-08-11', 
    checkInDate: '2023-08-20',
    checkOutDate: '2023-08-25',
    housePayment: 1450, 
    amountPerClient: 185,
    propertyName: 'Penthouse Suite',
    numberOfGuests: 4
  },
  { 
    id: '9', 
    name: 'Moses grant', 
    email: 'mgrant@email.com', 
    phone: '+1 (555) 901-2345',
    status: 'Checked In', 
    bookingDate: '2023-09-01', 
    checkInDate: '2023-09-10',
    checkOutDate: '2023-09-15',
    housePayment: 1200, 
    amountPerClient: 165,
    propertyName: 'Garden Cottage',
    numberOfGuests: 2
  },
  { 
    id: '10', 
    name: 'joe butman', 
    email: 'jbutman@email.com', 
    phone: '+1 (555) 012-3456',
    status: 'Pending', 
    bookingDate: '2023-10-14', 
    checkInDate: '2023-10-25',
    checkOutDate: '2023-11-01',
    housePayment: 1300, 
    amountPerClient: 155,
    propertyName: 'Ski Chalet',
    numberOfGuests: 6
  },
];

const AgentClientsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | Client['status']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Client>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [goToPageInput, setGoToPageInput] = useState('');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  const pageSize = 8;

  useEffect(() => setCurrentPage(1), [activeTab, searchTerm, startDate, endDate, propertyFilter]);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  const uniqueProperties = useMemo(() => {
    return [...new Set(MOCK_CLIENTS.map(c => c.propertyName))];
  }, []);

  const filteredAndSortedClients = useMemo(() => {
    let result = MOCK_CLIENTS.filter(client => {
      const matchesTab = activeTab === 'All' || client.status === activeTab;
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = (!startDate || client.bookingDate >= startDate) &&
                               (!endDate || client.bookingDate <= endDate);
      const matchesProperty = propertyFilter === 'all' || client.propertyName === propertyFilter;
      return matchesTab && matchesSearch && matchesDateRange && matchesProperty;
    });

    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeTab, searchTerm, startDate, endDate, propertyFilter, sortBy, sortOrder]);

  const totalClients = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalClients / pageSize);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedClients.slice(start, start + pageSize);
  }, [filteredAndSortedClients, currentPage, pageSize]);

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
          <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
        </div>
      </div>
      
      <div className="p-4 pt-8 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
        <p className="text-sm text-gray-500 mb-1">{client.email}</p>
        <p className="text-sm text-gray-500 mb-4">{client.phone}</p>
        
        <div className="text-sm text-gray-600 border-t border-b py-3 my-3 space-y-2">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium text-gray-900 text-right truncate ml-2">{client.propertyName}</span>
          </div>
          <div className="flex justify-between">
            <span>Guests:</span>
            <span className="font-medium text-gray-900">{client.numberOfGuests} people</span>
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
              <p className="text-sm text-green-600">${client.amountPerClient}/client</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-14">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your client portfolio</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Client name, email, or property..."
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Booking Date Range</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600">
              Showing {paginatedClients.length} of {totalClients} clients
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
        {totalClients === 0 && (
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
                            <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                            <div className="text-xs text-gray-500">{client.email}</div>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
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
                          <span className="text-gray-500">Check-in:</span>
                          <div className="font-medium text-gray-700">{new Date(client.checkInDate).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Check-out:</span>
                          <div className="font-medium text-gray-700">{new Date(client.checkOutDate).toLocaleDateString()}</div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button 
                          onClick={() => handleSort('checkInDate')} 
                          className="flex items-center space-x-1 hover:text-gray-700 cursor-pointer"
                        >
                          <span>Check-in/Out Dates</span>
                          {sortBy === 'checkInDate' && (
                            <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                              <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{client.name}</div>
                              <div className="text-xs text-gray-500 truncate">{client.email}</div>
                              <div className="text-xs text-gray-400 truncate">{client.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{client.propertyName}</div>
                          <div className="text-xs text-gray-500">{client.numberOfGuests} guests</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">
                            <div><strong>In:</strong> {new Date(client.checkInDate).toLocaleDateString()}</div>
                            <div><strong>Out:</strong> {new Date(client.checkOutDate).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-[#083A85]">${client.housePayment.toLocaleString()}</div>
                          <div className="text-xs text-green-600 font-semibold">${client.amountPerClient}/client</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
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
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
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
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Go to page:</span>
              <input 
                type="number" 
                min="1" 
                max={totalPages} 
                value={goToPageInput} 
                onChange={(e) => setGoToPageInput(e.target.value)} 
                onBlur={(e) => handleGoToPage(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)} 
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
              <span className="text-sm text-gray-700">of {totalPages}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentClientsPage;