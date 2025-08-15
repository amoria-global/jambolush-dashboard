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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // default grid

  const pageSize = 8;

  useEffect(() => setCurrentPage(1), [activeTab, searchTerm, startDate, endDate]);

  const filteredAndSortedClients = useMemo(() => {
    let result = MOCK_CLIENTS.filter(client => {
      const matchesTab = activeTab === 'All' || client.status === activeTab;
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDateRange = (!startDate || client.bookingDate >= startDate) &&
                               (!endDate || client.bookingDate <= endDate);
      return matchesTab && matchesSearch && matchesDateRange;
    });

    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [activeTab, searchTerm, startDate, endDate, sortBy, sortOrder]);

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

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => (
    <div className="group relative bg-white backdrop-blur-md border border-gray-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 hover:-translate-y-0.5 hover:scale-[1.02]">
      {/* Status Badge - Top Right */}
      <div className="absolute top-3 right-3">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
          {client.status}
        </span>
      </div>

      <div className="flex items-start space-x-3 mb-4">
        <div className={`w-12 h-12 rounded-lg ${getAvatarColor(client.id)} flex items-center justify-center shadow`}>
          <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
        </div>
        <div className="flex-1 pr-16"> {/* Added right padding to avoid status badge overlap */}
          <h3 className="text-base font-bold text-[#083A85] group-hover:text-pink-500 transition-colors">{client.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{client.email}</p>
          <p className="text-sm text-gray-500">{client.phone}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Property</span>
          <span className="font-semibold text-gray-900 text-right text-xs">{client.propertyName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Guests</span>
          <span className="font-semibold text-gray-900">{client.numberOfGuests} people</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">House Payment</span>
          <span className="font-bold text-[#083A85]">${client.housePayment.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Amount/Client</span>
          <span className="font-bold text-green-600">${client.amountPerClient}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Check-in</span>
          <span className="text-gray-700 font-semibold text-xs">{new Date(client.checkInDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 font-medium">Check-out</span>
          <span className="text-gray-700 font-semibold text-xs">{new Date(client.checkOutDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#083A85] mb-1">Client Management</h1>
            <p className="text-gray-600 text-sm">Monitor and manage your client portfolio</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search clients, emails, or properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#083A85] focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 bg-white/50 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-200/50">
          {(['All', 'Checked In', 'Checked Out', 'Pending'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                activeTab === tab
                  ? 'bg-[#083A85] text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
              }`}
            >
              {tab} {tab !== 'All' && 'Clients'}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end mb-4 space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
              viewMode === 'grid' 
                ? 'bg-[#083A85] text-white shadow-md' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 font-semibold rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
              viewMode === 'table' 
                ? 'bg-[#083A85] text-white shadow-md' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Table View
          </button>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {paginatedClients.length > 0 ? (
              paginatedClients.map(client => <ClientCard key={client.id} client={client} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-bold text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Client Info</span>
                        {sortBy === 'name' && (
                          <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('propertyName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Property & Guests</span>
                        {sortBy === 'propertyName' && (
                          <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('checkInDate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Check-in/Out Dates</span>
                        {sortBy === 'checkInDate' && (
                          <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('housePayment')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Payment Details</span>
                        {sortBy === 'housePayment' && (
                          <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {sortBy === 'status' && (
                          <span className="text-[#083A85]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedClients.length > 0 ? (
                    paginatedClients.map((client, index) => (
                      <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(client.id)} flex items-center justify-center shadow mr-3`}>
                              <span className="text-white text-sm font-bold">{getInitials(client.name)}</span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                              <div className="text-xs text-gray-500">{client.email}</div>
                              <div className="text-xs text-gray-400">{client.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.propertyName}</div>
                          <div className="text-xs text-gray-500">{client.numberOfGuests} guests</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                          <p>Try adjusting your search criteria or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pageSize, totalClients)}</span> of{' '}
            <span className="font-medium">{totalClients}</span> clients
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1} 
              className="px-4 py-2 bg-[#083A85] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105 transition-all duration-200 hover:bg-blue-700 disabled:hover:scale-100 disabled:hover:bg-[#083A85]"
            >
              Previous
            </button>
            <div className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg">
              Page {currentPage} of {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages || totalClients === 0} 
              className="px-4 py-2 bg-[#083A85] text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-105 transition-all duration-200 hover:bg-blue-700 disabled:hover:scale-100 disabled:hover:bg-[#083A85]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentClientsPage;