import React, { useState, useMemo, useEffect } from 'react';

// Define the type for a client object
interface Client {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Pending' | 'Inactive';
  joined: string; // YYYY-MM-DD format
}

// Mock data to simulate fetching from an API
const MOCK_CLIENTS: Client[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', status: 'Active', joined: '2023-01-15' },
  { id: '2', name: 'Robert Williams', email: 'robert.w@email.com', status: 'Pending', joined: '2023-02-20' },
  { id: '3', name: 'Emily Chen', email: 'emily.c@email.com', status: 'Active', joined: '2023-03-10' },
  { id: '4', name: 'David Brown', email: 'david.b@email.com', status: 'Inactive', joined: '2023-04-05' },
  { id: '5', name: 'Lisa Martinez', email: 'lisa.m@email.com', status: 'Active', joined: '2023-05-18' },
  { id: '6', name: 'Kevin Davis', email: 'kevin.d@email.com', status: 'Pending', joined: '2023-06-22' },
  { id: '7', name: 'Jessica Taylor', email: 'jessica.t@email.com', status: 'Active', joined: '2023-07-30' },
  { id: '8', name: 'Daniel Miller', email: 'daniel.m@email.com', status: 'Inactive', joined: '2023-08-11' },
  { id: '9', name: 'Olivia Wilson', email: 'olivia.w@email.com', status: 'Active', joined: '2023-09-01' },
  { id: '10', name: 'James White', email: 'james.w@email.com', status: 'Pending', joined: '2023-10-14' },
  { id: '11', name: 'Sophia Lee', email: 'sophia.l@email.com', status: 'Active', joined: '2023-11-25' },
  { id: '12', name: 'Christopher Hall', email: 'chris.h@email.com', status: 'Active', joined: '2023-12-09' },
  { id: '13', name: 'Ava Garcia', email: 'ava.g@email.com', status: 'Pending', joined: '2024-01-03' },
  { id: '14', 'name': 'Matthew King', 'email': 'matt.k@email.com', status: 'Inactive', joined: '2024-02-17' },
  { id: '15', name: 'Mia Wright', email: 'mia.w@email.com', status: 'Active', joined: '2024-03-21' },
  { id: '16', name: 'Ethan Green', email: 'ethan.g@email.com', status: 'Active', joined: '2024-04-12' },
  { id: '17', name: 'Charlotte Baker', email: 'charlotte.b@email.com', status: 'Pending', joined: '2024-05-08' },
  { id: '18', name: 'Noah Adams', email: 'noah.a@email.com', status: 'Active', joined: '2024-06-01' },
  { id: '19', name: 'Amelia Evans', email: 'amelia.e@email.com', status: 'Active', joined: '2024-07-19' },
  { id: '20', name: 'Benjamin Scott', email: 'ben.s@email.com', status: 'Inactive', joined: '2024-08-25' },
];

const AgentClientsPage: React.FC = () => {
  // State for filters, sorting, and pagination
  const [activeTab, setActiveTab] = useState<'All' | Client['status']>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Client>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Hardcoded page size as per request
  const pageSize = 10;
  
  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, startDate, endDate]);

  // Memoized function to filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    // 1. Filter clients based on tab, search term, and date range
    let result = MOCK_CLIENTS.filter(client => {
      const matchesTab = activeTab === 'All' || client.status === activeTab;
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            client.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDateRange = (!startDate || client.joined >= startDate) &&
                               (!endDate || client.joined <= endDate);

      return matchesTab && matchesSearch && matchesDateRange;
    });

    // 2. Sort the filtered clients
    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [MOCK_CLIENTS, activeTab, searchTerm, startDate, endDate, sortBy, sortOrder]);

  // Calculate clients for the current page
  const totalClients = filteredAndSortedClients.length;
  const totalPages = Math.ceil(totalClients / pageSize);
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAndSortedClients.slice(start, end);
  }, [filteredAndSortedClients, currentPage, pageSize]);

  // Handle sorting logic
  const handleSort = (key: keyof Client) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Helper function to get status badge color
  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center sm:text-left">Client Management</h1>
        
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 border-b border-gray-200">
          {(['All', 'Active', 'Pending', 'Inactive'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 font-semibold text-lg transition-all duration-200 rounded-t-lg ${
                activeTab === tab
                  ? 'text-[#083A85] border-b-2 border-[#083A85]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} Clients
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 items-end">
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Clients</label>
            <input
              id="search"
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 rounded-xl shadow-sm border border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-colors"
            />
          </div>
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">Joined Date Range</label>
            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 rounded-xl shadow-sm border border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-colors"
              />
              <span className="text-gray-500 hidden sm:block">to</span>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 rounded-xl shadow-sm border border-gray-300 focus:ring-2 focus:ring-[#083A85] focus:border-[#083A85] transition-colors"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Clear date filter"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#083A85] text-white">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortBy === 'name' && (
                      <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortBy === 'email' && (
                      <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortBy === 'status' && (
                      <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('joined')}
                >
                  <div className="flex items-center">
                    Joined Date
                    {sortBy === 'joined' && (
                      <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedClients.length > 0 ? (
                paginatedClients.map(client => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.joined}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 text-lg">
                    No clients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 mt-8 rounded-2xl shadow-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-[#F20C8F] text-sm font-medium rounded-md text-white bg-[#F20C8F] hover:bg-pink-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalClients === 0}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-[#F20C8F] text-sm font-medium rounded-md text-white bg-[#F20C8F] hover:bg-pink-700"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                {' '}to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalClients)}</span>
                {' '}of{' '}
                <span className="font-medium">{totalClients}</span>
                {' '}results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#F20C8F] bg-[#F20C8F] text-sm font-medium text-white hover:bg-pink-700"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalClients === 0}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#F20C8F] bg-[#F20C8F] text-sm font-medium text-white hover:bg-pink-700"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AgentClientsPage;
