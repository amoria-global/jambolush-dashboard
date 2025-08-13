"use client";

import React, { useState, useMemo, FC } from 'react';

// Define the data structure for a Tour
interface Tour {
  id: string;
  title: string;
  guide: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  price: number;
  bookings: number;
  date: string;
}

// Mock data for the tours
const mockTours: Tour[] = [
  { id: '1', title: 'Historic City Center Walk', guide: 'Alice Johnson', status: 'active', price: 50, bookings: 12, date: '2023-09-15' },
  { id: '2', title: 'Mountain Hiking Adventure', guide: 'Bob Williams', status: 'completed', price: 80, bookings: 25, date: '2023-08-20' },
  { id: '3', title: 'Urban Street Art Tour', guide: 'Charlie Davis', status: 'draft', price: 35, bookings: 0, date: '2023-10-01' },
  { id: '4', title: 'Night Photography Workshop', guide: 'Diana Evans', status: 'active', price: 95, bookings: 8, date: '2023-09-22' },
  { id: '5', title: 'Food Tasting Journey', guide: 'Alice Johnson', status: 'completed', price: 65, bookings: 30, date: '2023-07-10' },
  { id: '6', title: 'Museum & History Tour', guide: 'Eve Wilson', status: 'cancelled', price: 40, bookings: 5, date: '2023-09-05' },
  { id: '7', title: 'Coastal Kayaking Trip', guide: 'Frank Miller', status: 'active', price: 120, bookings: 15, date: '2023-10-05' },
  { id: '8', title: 'Local Winery Experience', guide: 'Grace Taylor', status: 'active', price: 110, bookings: 20, date: '2023-09-28' },
  { id: '9', title: 'Historic City Center Walk', guide: 'Alice Johnson', status: 'active', price: 50, bookings: 12, date: '2023-09-15' },
  { id: '10', title: 'Mountain Hiking Adventure', guide: 'Bob Williams', status: 'completed', price: 80, bookings: 25, date: '2023-08-20' },
  { id: '11', title: 'Urban Street Art Tour', guide: 'Charlie Davis', status: 'draft', price: 35, bookings: 0, date: '2023-10-01' },
  { id: '12', title: 'Night Photography Workshop', guide: 'Diana Evans', status: 'active', price: 95, bookings: 8, date: '2023-09-22' },
  { id: '13', title: 'Food Tasting Journey', guide: 'Alice Johnson', status: 'completed', price: 65, bookings: 30, date: '2023-07-10' },
  { id: '14', title: 'Museum & History Tour', guide: 'Eve Wilson', status: 'cancelled', price: 40, bookings: 5, date: '2023-09-05' },
];

// Define props for the Tour Card and Modal components
interface TourCardProps {
  tour: Tour;
  onEdit: (tour: Tour) => void;
  onDelete: (tour: Tour) => void;
}

// TourCard component for displaying a single tour's information
const TourCard: FC<TourCardProps> = ({ tour, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between">
    <div>
      <h3 className="font-semibold text-lg text-gray-800">{tour.title}</h3>
      <p className="text-sm text-gray-600 mt-1">Guide: {tour.guide}</p>
      <div className="mt-2 flex items-center text-sm text-gray-500">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 
          ${tour.status === 'active' && 'bg-green-500'}
          ${tour.status === 'completed' && 'bg-[#083A85]'}
          ${tour.status === 'draft' && 'bg-yellow-500'}
          ${tour.status === 'cancelled' && 'bg-red-500'}
        `}></span>
        <span className="capitalize">{tour.status}</span>
      </div>
    </div>
    <div className="mt-4 flex justify-between items-center border-t border-gray-100 pt-4">
      <div className="text-xs text-gray-500 space-y-1">
        <p>Bookings: <span className="font-medium text-gray-800">{tour.bookings}</span></p>
        <p>Price: <span className="font-medium text-gray-800">${tour.price}</span></p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(tour)}
          className="p-2 rounded-full text-[#F20C8F] hover:bg-[#F20C8F] hover:text-white transition-colors"
        >
          {/* Edit icon SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
        <button
          onClick={() => onDelete(tour)}
          className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
        >
          {/* Trash icon SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-4 6v6m-4-6v6"/></svg>
        </button>
      </div>
    </div>
  </div>
);

// ToursDashboard is the main component
const ToursDashboard: FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const toursPerPage = 6;
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });
  const [showEditModal, setShowEditModal] = useState<Tour | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Tour | null>(null);

  // Filter and paginate the tours using useMemo for performance optimization
  const filteredTours = useMemo(() => {
    return mockTours.filter(tour => {
      const statusMatch = filters.status === 'all' || tour.status === filters.status;
      const searchMatch = tour.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          tour.guide.toLowerCase().includes(filters.search.toLowerCase());
      return statusMatch && searchMatch;
    });
  }, [filters]);

  const paginatedTours = useMemo(() => {
    const startIndex = (currentPage - 1) * toursPerPage;
    return filteredTours.slice(startIndex, startIndex + toursPerPage);
  }, [filteredTours, currentPage, toursPerPage]);

  const totalPages = Math.ceil(filteredTours.length / toursPerPage);

  // Status summary calculations
  const statusSummary = useMemo(() => {
    const summary = {
      all: mockTours.length,
      active: 0,
      completed: 0,
      draft: 0,
      cancelled: 0,
    };
    mockTours.forEach(tour => {
      if (tour.status === 'active') summary.active++;
      if (tour.status === 'completed') summary.completed++;
      if (tour.status === 'draft') summary.draft++;
      if (tour.status === 'cancelled') summary.cancelled++;
    });
    return summary;
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleEdit = (tour: Tour) => setShowEditModal(tour);
  const handleDelete = (tour: Tour) => setShowDeleteModal(tour);
  const confirmDelete = () => {
    // Logic to delete the tour
    console.log(`Deleting tour: ${showDeleteModal?.id}`);
    setShowDeleteModal(null);
  };
  const confirmEdit = () => {
    // Logic to save edited tour
    console.log(`Editing tour: ${showEditModal?.id}`);
    setShowEditModal(null);
  };

  // Status Card component for the summary section
  interface StatusCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    color: string;
    bgColor?: string;
  }
  const StatusCard: FC<StatusCardProps> = ({ title, count, icon, color, bgColor }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm flex items-center space-x-4 border-l-4 ${color}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-${bgColor || 'gray-100'} text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tours Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage all your tours and experiences in one place.</p>

        {/* Status Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Total Tours"
            count={statusSummary.all}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14"/><path d="m12 6 4 14"/><path d="m8 6 4 14"/><path d="M4 20h16"/><path d="M5 20l3 -14"/><path d="m16 6l3 14"/></svg>}
            color="border-[#083A85]"
          />
          <StatusCard
            title="Active Tours"
            count={statusSummary.active}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-.9 0-1.8.2-2.6.7-1 .6-1.7 1.6-2 2.7-.2.7-.3 1.5-.3 2.3v3c0 .5-.2 1-.5 1.3L5 16h14l-.6-1.4c-.3-.3-.5-.8-.5-1.3v-3c0-.8-.1-1.6-.3-2.3-.3-1.1-1-2.1-2-2.7-.8-.5-1.7-.7-2.6-.7Z"/><path d="M22 16c0 3.3-5.2 6-10 6s-10-2.7-10-6"/><path d="M12 2v2"/></svg>}
            color="border-green-500"
          />
          <StatusCard
            title="Completed Tours"
            count={statusSummary.completed}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10c0-5.52-4.48-10-10-10zm-2 15l-5-5 1.4-1.4 3.6 3.6 7.6-7.6 1.4 1.4z"/></svg>}
            color="border-blue-500"
          />
          <StatusCard
            title="Drafts"
            count={statusSummary.draft}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v5h5"/></svg>}
            color="border-yellow-500"
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto flex-1">
            <label htmlFor="search" className="sr-only">Search tours</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                {/* Search icon SVG */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="block w-full rounded-md border-gray-300 pl-10 pr-4 py-2 text-sm focus:ring-[#083A85] focus:border-[#083A85]"
                placeholder="Search by title or guide..."
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label htmlFor="status" className="sr-only">Filter by status</label>
            <select
              name="status"
              id="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:ring-[#083A85] focus:border-[#083A85]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Tours List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTours.length > 0 ? (
            paginatedTours.map(tour => (
              <TourCard key={tour.id} tour={tour} onEdit={handleEdit} onDelete={handleDelete} />
            ))
          ) : (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
              <p className="text-lg">No tours found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              {/* ArrowLeft icon SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6-6"/></svg>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`p-2 px-4 rounded-md text-sm font-semibold transition-colors
                  ${page === currentPage
                    ? 'bg-[#083A85] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-[#083A85]'
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              {/* ArrowRight icon SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Tour: {showEditModal.title}</h2>
              <p className="text-gray-600 mb-4">
                This is a placeholder for your edit form. You can add inputs here to change tour details.
              </p>
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  className="flex-1 bg-[#083A85] text-white font-bold py-2 px-4 rounded-md hover:bg-[#083A85]/80 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
              <h2 className="text-xl font-bold mb-2 text-red-600">Confirm Deletion</h2>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the tour: "<span className="font-bold">{showDeleteModal.title}</span>"? This action cannot be undone.
              </p>
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursDashboard;