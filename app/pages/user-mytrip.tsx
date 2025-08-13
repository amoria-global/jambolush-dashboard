"use client";

import React, { useState, useEffect } from 'react';

// Define brand colors and a harmonious green for the Edit button.
const primaryColor = '#F20C8F'; // Pink
const secondaryColor = '#083A85'; // Blue
const editColor = '#10B981'; // A harmonious green

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

const DollarSign = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
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

const Pencil = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const X = (props: SvgProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// Define a type for the trip data
interface Trip {
  id: number;
  destination: string;
  departureDate: string;
  returnDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
  totalCost: number;
  tripType: 'One-way' | 'Round-trip' | 'Multi-city';
}

const MOCK_TRIPS_DATA: Trip[] = [
  { id: 1, destination: 'Paris, France', departureDate: '2024-10-15', returnDate: '2024-10-20', status: 'Upcoming', totalCost: 1500, tripType: 'Round-trip' },
  { id: 2, destination: 'Maui, USA', departureDate: '2024-07-20', returnDate: '2024-07-28', status: 'Completed', totalCost: 3200, tripType: 'Round-trip' },
  { id: 3, destination: 'Swiss Alps', departureDate: '2024-09-05', returnDate: '2024-09-12', status: 'Upcoming', totalCost: 2500, tripType: 'Round-trip' },
  { id: 4, destination: 'New York, USA', departureDate: '2024-08-11', returnDate: '2024-08-13', status: 'In Progress', totalCost: 950, tripType: 'One-way' },
  { id: 5, destination: 'Tokyo, Japan', departureDate: '2024-11-01', returnDate: '2024-11-08', status: 'Upcoming', totalCost: 4100, tripType: 'Round-trip' },
  { id: 6, destination: 'Route 66, USA', departureDate: '2024-06-15', returnDate: '2024-06-30', status: 'Completed', totalCost: 1800, tripType: 'Multi-city' },
  { id: 7, destination: 'London, UK', departureDate: '2024-08-25', returnDate: '2024-08-28', status: 'Upcoming', totalCost: 1200, tripType: 'Round-trip' },
  { id: 8, destination: 'Cancun, Mexico', departureDate: '2024-05-10', returnDate: '2024-05-17', status: 'Cancelled', totalCost: 1600, tripType: 'Round-trip' },
  { id: 9, destination: 'Aspen, USA', departureDate: '2024-02-01', returnDate: '2024-02-08', status: 'Completed', totalCost: 2800, tripType: 'Round-trip' },
  { id: 10, destination: 'Barcelona, Spain', departureDate: '2024-09-20', returnDate: '2024-09-24', status: 'Upcoming', totalCost: 1400, tripType: 'Round-trip' },
  { id: 11, destination: 'Amsterdam, Netherlands', departureDate: '2024-03-05', returnDate: '2024-03-10', status: 'Completed', totalCost: 1300, tripType: 'One-way' },
  { id: 12, destination: 'Grand Canyon, USA', departureDate: '2024-12-01', returnDate: '2024-12-05', status: 'Upcoming', totalCost: 850, tripType: 'Round-trip' },
  { id: 13, destination: 'Prague, Czech Republic', departureDate: '2024-04-18', returnDate: '2024-04-22', status: 'Completed', totalCost: 1100, tripType: 'Round-trip' },
  { id: 14, destination: 'Las Vegas, USA', departureDate: '2024-08-01', returnDate: '2024-08-04', status: 'Completed', totalCost: 750, tripType: 'One-way' },
  { id: 15, destination: 'Masai Mara, Kenya', departureDate: '2025-01-10', returnDate: '2025-01-20', status: 'Upcoming', totalCost: 6500, tripType: 'Round-trip' },
  { id: 16, destination: 'Berlin, Germany', departureDate: '2024-03-25', returnDate: '2024-03-29', status: 'Completed', totalCost: 1050, tripType: 'Round-trip' },
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
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // State for filters and search
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterTripType, setFilterTripType] = useState<string>('All');
  const [filterDestination, setFilterDestination] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Summary statistics
  const totalTrips = trips.length;
  const upcomingTrips = trips.filter(trip => trip.status === 'Upcoming').length;
  const completedTrips = trips.filter(trip => trip.status === 'Completed').length;
  const cancelledTrips = trips.filter(trip => trip.status === 'Cancelled').length;
  const totalAmountSpent = trips.reduce((acc, trip) => acc + trip.totalCost, 0);

  // Effect to filter the trips based on all criteria
  useEffect(() => {
    let newFilteredTrips = trips.filter(trip => {
      const statusMatch = filterStatus === 'All' || trip.status === filterStatus;
      const tripTypeMatch = filterTripType === 'All' || trip.tripType === filterTripType;
      const destinationMatch = filterDestination === '' || trip.destination.toLowerCase().includes(filterDestination.toLowerCase());
      const searchMatch = trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          trip.departureDate.includes(searchTerm) ||
                          trip.returnDate.includes(searchTerm);
      return statusMatch && tripTypeMatch && destinationMatch && searchMatch;
    });
    setFilteredTrips(newFilteredTrips);
    setCurrentPage(1); // Reset to the first page whenever filters change
  }, [trips, filterStatus, filterTripType, filterDestination, searchTerm]);

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
    setEditingTrip(null);
  };

  // Handler for saving the edited trip
  const handleSaveEdit = () => {
    if (editingTrip) {
      setTrips(prevTrips => prevTrips.map(t => (t.id === editingTrip.id ? editingTrip : t)));
      closeModal();
    }
  };

  // Modal handlers for the action buttons
  const handleAction = (action: string, trip: Trip) => {
    if (action === 'View') {
      setEditingTrip(null);
      setModalContent({
        title: `Trip to ${trip.destination}`,
        message: `Departure: ${trip.departureDate}\nReturn: ${trip.returnDate}\nType: ${trip.tripType}\nCost: $${trip.totalCost.toLocaleString()}`,
      });
      setIsModalOpen(true);
    } else if (action === 'Edit') {
      setEditingTrip(trip);
      setModalContent({
        title: `Edit Trip to ${trip.destination}`,
        message: '',
      });
      setIsModalOpen(true);
    } else if (action === 'Cancel') {
      setEditingTrip(null);
      setModalContent({
        title: `Confirm Cancellation`,
        message: `Are you sure you want to cancel the trip to ${trip.destination}? This action cannot be undone.`,
        onConfirm: () => {
          // This is placeholder logic. In a real app, this would update the state and/or make an API call.
          setTrips(prevTrips => prevTrips.map(t => t.id === trip.id ? { ...t, status: 'Cancelled' } : t));
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
      case 'Upcoming':
        bgColor = `bg-[${secondaryColor}]`;
        break;
      case 'In Progress':
        bgColor = `bg-yellow-500`;
        break;
      case 'Completed':
        bgColor = `bg-green-600`;
        break;
      case 'Cancelled':
        bgColor = `bg-[${primaryColor}]`;
        break;
      default:
        bgColor = 'bg-gray-400';
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  // Helper for summary card colors
  const summaryCardColors = {
    upcoming: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
    total: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="font-['Inter',_sans-serif']">
      <div className="min-h-screen bg-gray-50 transition-colors duration-300 p-4 sm:p-8 text-gray-800">
        <style>{`
          .my-primary { background-color: ${primaryColor}; }
          .my-secondary { background-color: ${secondaryColor}; }
          .my-text-primary { color: ${primaryColor}; }
          .my-text-secondary { color: ${secondaryColor}; }
          .my-border-primary { border-color: ${primaryColor}; }
          .my-border-secondary { border-color: ${secondaryColor}; }
          .my-edit-button { background-color: ${editColor}; }
        `}</style>
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">My Trips</h1>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.upcoming}`}>
              <Plane className="w-12 h-12" />
              <div>
                <div className="text-xl font-bold">Upcoming Trips</div>
                <div className="text-4xl font-extrabold">{upcomingTrips}</div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.completed}`}>
              <CheckCircle className="w-12 h-12" />
              <div>
                <div className="text-xl font-bold">Completed Trips</div>
                <div className="text-4xl font-extrabold">{completedTrips}</div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.cancelled}`}>
              <XCircle className="w-12 h-12" />
              <div>
                <div className="text-xl font-bold">Cancelled Trips</div>
                <div className="text-4xl font-extrabold">{cancelledTrips}</div>
              </div>
            </div>
            <div className={`p-6 rounded-2xl shadow-lg flex items-center gap-4 ${summaryCardColors.total}`}>
              <DollarSign className="w-12 h-12" />
              <div>
                <div className="text-xl font-bold">Total Spent</div>
                <div className="text-4xl font-extrabold">${totalAmountSpent.toLocaleString()}</div>
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
                    className="appearance-none pr-8 py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterTripType}
                    onChange={(e) => setFilterTripType(e.target.value)}
                    className="appearance-none pr-8 py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  className="w-full p-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Trips Table */}
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mb-8">
            <table className="w-full table-auto">
              <thead className="text-left text-sm font-semibold text-gray-500 uppercase">
                <tr className="border-b border-gray-200">
                  <th className="p-4 whitespace-nowrap">ID</th>
                  <th className="p-4 whitespace-nowrap">Destination</th>
                  <th className="p-4 whitespace-nowrap hidden sm:table-cell">Departure Date</th>
                  <th className="p-4 whitespace-nowrap hidden sm:table-cell">Return Date</th>
                  <th className="p-4 whitespace-nowrap hidden md:table-cell">Trip Type</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap hidden lg:table-cell">Total Cost</th>
                  <th className="p-4 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentTrips.length > 0 ? (
                  currentTrips.map(trip => (
                    <tr key={trip.id} className="border-b last:border-b-0 border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm font-medium">{trip.id}</td>
                      <td className="p-4 text-sm font-medium">{trip.destination}</td>
                      <td className="p-4 text-sm hidden sm:table-cell">{trip.departureDate}</td>
                      <td className="p-4 text-sm hidden sm:table-cell">{trip.returnDate}</td>
                      <td className="p-4 text-sm hidden md:table-cell">{trip.tripType}</td>
                      <td className="p-4 text-sm">{getStatusBadge(trip.status)}</td>
                      <td className="p-4 text-sm font-semibold hidden lg:table-cell">${trip.totalCost.toLocaleString()}</td>
                      <td className="p-4 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleAction('View', trip)}
                            className="p-2 rounded-lg my-secondary text-white shadow-md hover:bg-opacity-80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[${secondaryColor}]"
                            aria-label="View Trip Details"
                          >
                            <Eye />
                          </button>
                          <button
                            onClick={() => handleAction('Edit', trip)}
                            className="p-2 rounded-lg my-edit-button text-white shadow-md hover:bg-opacity-80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[${editColor}]"
                            aria-label="Edit Trip"
                          >
                            <Pencil />
                          </button>
                          <button
                            onClick={() => handleAction('Cancel', trip)}
                            className="p-2 rounded-lg my-primary text-white shadow-md hover:bg-opacity-80 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}]"
                            aria-label="Cancel Trip"
                          >
                            <X />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-500">No trips found for the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTrips.length > tripsPerPage && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Items per page:</span>
                <select
                  value={tripsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                  className="p-2 rounded-lg border border-gray-300 my-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:my-primary transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages).keys()].map(number => (
                    <button
                      key={number + 1}
                      onClick={() => handlePageChange(number + 1)}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        currentPage === number + 1
                          ? 'bg-blue-600 text-white shadow-md'
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
                  className="p-2 rounded-lg border border-gray-300 my-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:my-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal */}
        {isModalOpen && modalContent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg w-full">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{modalContent.title}</h3>
              {/* Conditional rendering for either the edit form or the message */}
              {editingTrip ? (
                <div className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
                      <input
                        type="text"
                        id="destination"
                        value={editingTrip.destination}
                        onChange={(e) => setEditingTrip({ ...editingTrip, destination: e.target.value })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700">Departure Date</label>
                      <input
                        type="date"
                        id="departureDate"
                        value={editingTrip.departureDate}
                        onChange={(e) => setEditingTrip({ ...editingTrip, departureDate: e.target.value })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">Return Date</label>
                      <input
                        type="date"
                        id="returnDate"
                        value={editingTrip.returnDate}
                        onChange={(e) => setEditingTrip({ ...editingTrip, returnDate: e.target.value })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="tripType" className="block text-sm font-medium text-gray-700">Trip Type</label>
                      <select
                        id="tripType"
                        value={editingTrip.tripType}
                        onChange={(e) => setEditingTrip({ ...editingTrip, tripType: e.target.value as Trip['tripType'] })}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="One-way">One-way</option>
                        <option value="Round-trip">Round-trip</option>
                        <option value="Multi-city">Multi-city</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 rounded-lg font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-6 py-2 rounded-lg font-semibold my-edit-button text-white hover:bg-opacity-90 transition-opacity"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {modalContent.message.split('\n').map((line, index) => (
                    <p key={index} className="text-gray-700 mb-2">{line}</p>
                  ))}
                  <div className="flex justify-center gap-4 mt-6">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 rounded-lg font-semibold border border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      {modalContent.onConfirm ? 'Cancel' : 'Close'}
                    </button>
                    {modalContent.onConfirm && (
                      <button
                        onClick={modalContent.onConfirm}
                        className="px-6 py-2 rounded-lg font-semibold my-primary text-white hover:bg-opacity-90 transition-opacity"
                      >
                        Confirm
                      </button>
                    )}
                  </div>
                </>
              )}
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
