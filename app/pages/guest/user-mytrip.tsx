"use client";

import React, { useState, useEffect } from 'react';

// Define brand colors and a harmonious green for the Edit button.
const primaryColor = '#cf0a7aff'; // Pink
const secondaryColor = '#083A85'; // Blue

// Define a type for the SVG icon props
type SvgProps = React.SVGProps<SVGSVGElement>;

// Inline SVG icons with explicit type for props
const Search = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
);

const ChevronLeft = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6"></path>
  </svg>
);

const ChevronRight = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m9 18 6-6-6-6"></path>
  </svg>
);

const Plane = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17.8 19.2 20 21l2-2-2.2-2.2a1 1 0 0 0-1.4 0l-2.6 2.6a1 1 0 0 0 0 1.4Z"></path>
    <path d="M17.8 19.2 6.5 7.9c-.8-.8-2.2-.8-3 0L2 8.4V2l7.5 1.5L8.4 5.2c-.8.8-.8 2.2 0 3L19.2 17.8"></path>
  </svg>
);

const CheckCircle = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-8.62"></path>
    <path d="M9 11l3 3L22 4"></path>
  </svg>
);

const XCircle = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m15 9-6 6"></path>
    <path d="m9 9 6 6"></path>
  </svg>
);

const ChevronDown = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Eye = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Trash2 = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18l-2 13a2 2 0 0 1-2 1.9H7a2 2 0 0 1-2-1.9L3 6Z" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const Grid = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </svg>
);

const List = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const X = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m18 6-12 12" />
    <path d="m6 6 12 12" />
  </svg>
);

// Define a type for the trip data
interface Trip {
  id: number;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'Checked In' | 'Checked Out' | 'Pending' | 'Rejected' | 'Cancelled';
  totalCost: number;
  tripType: 'One-way' | 'Round-trip' | 'Multi-city';
}

const MOCK_TRIPS_DATA: Trip[] = [
  { id: 1, destination: 'Paris, France', departureDate: '2024-10-15', returnDate: '2024-10-20', status: 'Pending', totalCost: 1500, tripType: 'Round-trip' },
  { id: 2, destination: 'Maui, USA', departureDate: '2024-07-20', returnDate: '2024-07-28', status: 'Checked Out', totalCost: 3200, tripType: 'Round-trip' },
  { id: 3, destination: 'Swiss Alps', departureDate: '2024-09-05', returnDate: '2024-09-12', status: 'Pending', totalCost: 2500, tripType: 'Round-trip' },
  { id: 4, destination: 'New York, USA', departureDate: '2024-08-11', returnDate: '2024-08-13', status: 'Checked In', totalCost: 950, tripType: 'One-way' },
  { id: 5, destination: 'Tokyo, Japan', departureDate: '2024-11-01', returnDate: '2024-11-08', status: 'Pending', totalCost: 4100, tripType: 'Round-trip' },
  { id: 6, destination: 'Route 66, USA', departureDate: '2024-06-15', returnDate: '2024-06-30', status: 'Checked Out', totalCost: 1800, tripType: 'Multi-city' },
  { id: 7, destination: 'London, UK', departureDate: '2024-08-25', returnDate: '2024-08-28', status: 'Pending', totalCost: 1200, tripType: 'Round-trip' },
  { id: 8, destination: 'Cancun, Mexico', departureDate: '2024-05-10', returnDate: '2024-05-17', status: 'Cancelled', totalCost: 1600, tripType: 'Round-trip' },
];

const tripsPerPageOptions = [5, 10, 20];

const MyTripsDashboard = () => {
  // State for all trips, filtered trips, and pagination
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS_DATA);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [tripsPerPage, setTripsPerPage] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // State for filters and search
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterTripType, setFilterTripType] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Summary statistics (updated for new statuses)
  const totalTrips = trips.length;
  const pendingTrips = trips.filter(trip => trip.status === 'Pending').length;
  const checkedInTrips = trips.filter(trip => trip.status === 'Checked In').length;
  const checkedOutTrips = trips.filter(trip => trip.status === 'Checked Out').length;

  // Effect to filter the trips based on all criteria
  useEffect(() => {
    let newFilteredTrips = trips.filter(trip => {
      const statusMatch = filterStatus === 'All' || trip.status === filterStatus;
      const tripTypeMatch = filterTripType === 'All' || trip.tripType === filterTripType;
      const searchMatch = trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.departureDate.includes(searchTerm) ||
                          trip.returnDate.includes(searchTerm);
      return statusMatch && tripTypeMatch && searchMatch;
    });
    setFilteredTrips(newFilteredTrips);
    setCurrentPage(1);
  }, [trips, filterStatus, filterTripType, searchTerm]);

  // Pagination logic
  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = filteredTrips.slice(indexOfFirstTrip, indexOfLastTrip);
  const totalPages = Math.ceil(filteredTrips.length / tripsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTripsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setSelectedTrip(null);
  };

  // Modal handlers for the action buttons (only View and Delete)
  const handleAction = (action: string, trip: Trip) => {
    if (action === 'View') {
      setSelectedTrip(trip);
      setIsModalOpen(true);
    } else if (action === 'Delete') {
      setModalContent({
        title: `Confirm Deletion`,
        message: `Are you sure you want to delete the trip to ${trip.destination}? This action cannot be undone.`,
        onConfirm: () => {
          setTrips(prevTrips => prevTrips.filter(t => t.id !== trip.id));
          closeModal();
        },
      });
      setIsModalOpen(true);
    }
  };

  // Helper for status badges
  const getStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = 'text-white';
    switch (status) {
      case 'Pending':
        bgColor = `bg-yellow-500`;
        break;
      case 'Checked In':
        bgColor = `bg-[${secondaryColor}]`;
        break;
      case 'Checked Out':
        bgColor = `bg-green-600`;
        break;
      case 'Rejected':
        bgColor = `bg-red-600`;
        break;
      case 'Cancelled':
        bgColor = `bg-[${primaryColor}]`;
        break;
      default:
        bgColor = 'bg-gray-400';
    }
    return (
      <span className={`px-2 py-1 text-sm font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  // Helper for summary card colors
  const summaryCardColors = {
    pending: 'bg-yellow-100 text-yellow-600',
    checkedIn: 'bg-blue-100 text-blue-600',
    checkedOut: 'bg-green-100 text-green-600',
  };

  return (
    <div className="font-['Inter',_sans-serif]">
      <div className="min-h-screen bg-gray-50 transition-colors duration-300 p-4 sm:p-8 text-gray-800">
        <style>{`
          .my-primary { background-color: ${primaryColor}; }
          .my-secondary { background-color: ${secondaryColor}; }
          .my-text-primary { color: ${primaryColor}; }
          .my-text-secondary { color: ${secondaryColor}; }
          .my-border-primary { border-color: ${primaryColor}; }
          .my-border-secondary { border-color: ${secondaryColor}; }
        `}</style>
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">My Trips</h1>
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-colors cursor-pointer hover:scale-105 ${
                  viewMode === 'table' 
                    ? 'bg-[#F20C8F] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Table View"
              >
                <List />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors cursor-pointer hover:scale-105 ${
                  viewMode === 'grid' 
                    ? 'bg-[#F20C8F] text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label="Grid View"
              >
                <Grid />
              </button>
            </div>
          </div>

          {/* Summary Cards - updated for new statuses */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.pending}`}>
              <Plane className="w-12 h-12" />
              <div>
                <div className="text-sm font-bold">Pending Trips</div>
                <div className="text-xl font-extrabold">{pendingTrips}</div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.checkedIn}`}>
              <CheckCircle className="w-12 h-12" />
              <div>
                <div className="text-sm font-bold">Checked In</div>
                <div className="text-xl font-extrabold">{checkedInTrips}</div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.checkedOut}`}>
              <XCircle className="w-12 h-12" />
              <div>
                <div className="text-sm font-bold">Checked Out</div>
                <div className="text-xl font-extrabold">{checkedOutTrips}</div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none pr-8 py-2 px-4 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Checked In">Checked In</option>
                    <option value="Checked Out">Checked Out</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterTripType}
                    onChange={(e) => setFilterTripType(e.target.value)}
                    className="appearance-none pr-8 py-2 px-4 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <option value="All">All Trip Types</option>
                    <option value="One-way">One-way</option>
                    <option value="Round-trip">Round-trip</option>
                    <option value="Multi-city">Multi-city</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="relative flex-grow max-w-lg">
                <input
                  type="text"
                  placeholder="Search trips or destinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Conditional rendering based on view mode */}
          {viewMode === 'table' ? (
            /* Table View */
            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mb-8">
              <table className="w-full table-auto">
                <thead className="text-left text-sm font-semibold text-gray-500 uppercase">
                  <tr className="border-b border-gray-200">
                    <th className="p-4 whitespace-nowrap">Destination</th>
                    <th className="p-4 whitespace-nowrap hidden sm:table-cell">Departure Date</th>
                    <th className="p-4 whitespace-nowrap hidden sm:table-cell">Return Date</th>
                    <th className="p-4 whitespace-nowrap hidden md:table-cell">Trip Type</th>
                    <th className="p-4 whitespace-nowrap">Status</th>
                    <th className="p-4 whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTrips.length > 0 ? (
                    currentTrips.map(trip => (
                      <tr key={trip.id} className="border-b last:border-b-0 border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-4 text-sm font-medium">{trip.destination}</td>
                        <td className="p-4 text-sm hidden sm:table-cell">{trip.departureDate}</td>
                        <td className="p-4 text-sm hidden sm:table-cell">{trip.returnDate}</td>
                        <td className="p-4 text-sm hidden md:table-cell">{trip.tripType}</td>
                        <td className="p-4 text-sm">{getStatusBadge(trip.status)}</td>
                        <td className="p-4 text-sm text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleAction('View', trip)}
                              className="p-2 rounded-lg my-secondary text-white shadow-md hover:bg-opacity-80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                              aria-label="View Trip Details"
                              title="View Trip Details"
                            >
                              <Eye />
                            </button>
                            <button
                              onClick={() => handleAction('Delete', trip)}
                              className="p-2 rounded-lg bg-pink-500 text-white shadow-md hover:bg-pink-600 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400 cursor-pointer"
                              aria-label="Delete Trip"
                              title="Delete Trip"
                            >
                              <Trash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-gray-500 text-sm">No trips found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentTrips.length > 0 ? (
                currentTrips.map(trip => (
                  <div key={trip.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{trip.destination}</h3>
                      {getStatusBadge(trip.status)}
                    </div>
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Departure:</span> {trip.departureDate}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Return:</span> {trip.returnDate}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Trip Type:</span> {trip.tripType}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction('View', trip)}
                        className="flex-1 p-2 rounded-lg my-secondary text-white text-sm font-medium shadow-md hover:bg-opacity-80 transition-all duration-200 cursor-pointer hover:scale-105"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAction('Delete', trip)}
                        className="p-2 rounded-lg bg-pink-500 text-white shadow-md hover:bg-pink-600 transition-all duration-200 cursor-pointer hover:scale-105"
                        aria-label="Delete Trip"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 text-sm py-10">
                  No trips found for the selected filters.
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredTrips.length > tripsPerPage && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Items per page:</span>
                <select
                  value={tripsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {tripsPerPageOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 my-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:my-primary transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      onClick={() => handlePageChange(number + 1)}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors cursor-pointer hover:scale-105 ${
                        currentPage === number + 1
                          ? 'bg-[#F20C8F] text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {number + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 my-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:my-primary transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Modal with better styling and dimmed background */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center p-4 z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100 relative">
              {/* Close button in top right */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {selectedTrip ? (
                /* Trip Details Modal */
                <div className="text-center">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">Trip Details</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-blue-600 mx-auto rounded-full"></div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-pink-50 rounded-2xl p-6 mb-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{selectedTrip.destination}</h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Departure</label>
                          <p className="text-lg font-medium text-gray-800">{selectedTrip.departureDate}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Trip Type</label>
                          <p className="text-lg font-medium text-gray-800">{selectedTrip.tripType}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Return</label>
                          <p className="text-lg font-medium text-gray-800">{selectedTrip.returnDate}</p>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Cost</label>
                          <p className="text-lg font-bold text-green-600">${selectedTrip.totalCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-center">
                      {getStatusBadge(selectedTrip.status)}
                    </div>
                  </div>
                  
                  <button
                    onClick={closeModal}
                    className="w-full px-6 py-3 rounded-lg font-semibold text-sm bg-[#F20C8F] text-white hover:[#F20C8F] transition-all duration-200 cursor-pointer hover:scale-105 shadow-lg"
                  >
                    Close Details
                  </button>
                </div>
              ) : modalContent ? (
                /* Confirmation Modal */
                <div className="text-center">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{modalContent.title}</h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-red-500 mx-auto rounded-full"></div>
                  </div>
                  
                  <div className="mb-6">
                    {modalContent.message.split('\n').map((line, index) => (
                      <p key={index} className="text-gray-700 text-sm mb-2 leading-relaxed">{line}</p>
                    ))}
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={closeModal}
                      className="px-6 py-3 rounded-lg font-semibold text-sm border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer hover:scale-105"
                    >
                      {modalContent.onConfirm ? 'Cancel' : 'Close'}
                    </button>
                    {modalContent.onConfirm && (
                      <button
                        onClick={modalContent.onConfirm}
                        className="px-6 py-3 rounded-lg font-semibold text-sm bg-pink-500 text-white hover:bg-pink-600 transition-colors cursor-pointer hover:scale-105 shadow-lg"
                      >
                        Confirm Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return <MyTripsDashboard />;
};

export default App;