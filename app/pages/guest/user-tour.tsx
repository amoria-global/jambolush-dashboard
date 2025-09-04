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
  image?: string;
  description?: string;
  duration?: string;
}

// Mock data for the tours with images
const mockTours: Tour[] = [
  { id: '1', title: 'Historic City Center Walk', guide: 'Alice Johnson', status: 'active', price: 50, bookings: 12, date: '2023-09-15', image: 'https://picsum.photos/seed/tour1/600/400', description: 'Explore the historic heart of the city', duration: '2 hours' },
  { id: '2', title: 'Mountain Hiking Adventure', guide: 'Bob Williams', status: 'completed', price: 80, bookings: 25, date: '2023-08-20', image: 'https://picsum.photos/seed/tour2/600/400', description: 'Challenging mountain trail experience', duration: '4 hours' },
  { id: '3', title: 'Urban Street Art Tour', guide: 'Charlie Davis', status: 'draft', price: 35, bookings: 0, date: '2023-10-01', image: 'https://picsum.photos/seed/tour3/600/400', description: 'Discover amazing street art', duration: '1.5 hours' },
  { id: '4', title: 'Night Photography Workshop', guide: 'Diana Evans', status: 'active', price: 95, bookings: 8, date: '2023-09-22', image: 'https://picsum.photos/seed/tour4/600/400', description: 'Learn night photography techniques', duration: '3 hours' },
  { id: '5', title: 'Food Tasting Journey', guide: 'Alice Johnson', status: 'completed', price: 65, bookings: 30, date: '2023-07-10', image: 'https://picsum.photos/seed/tour5/600/400', description: 'Culinary adventure through local cuisine', duration: '2.5 hours' },
  { id: '6', title: 'Museum & History Tour', guide: 'Eve Wilson', status: 'cancelled', price: 40, bookings: 5, date: '2023-09-05', image: 'https://picsum.photos/seed/tour6/600/400', description: 'Deep dive into local history', duration: '2 hours' },
  { id: '7', title: 'Coastal Kayaking Trip', guide: 'Frank Miller', status: 'active', price: 120, bookings: 15, date: '2023-10-05', image: 'https://picsum.photos/seed/tour7/600/400', description: 'Paddle along scenic coastline', duration: '4 hours' },
  { id: '8', title: 'Local Winery Experience', guide: 'Grace Taylor', status: 'active', price: 110, bookings: 20, date: '2023-09-28', image: 'https://picsum.photos/seed/tour8/600/400', description: 'Wine tasting and vineyard tour', duration: '3 hours' },
  { id: '9', title: 'Sunset Beach Walk', guide: 'Alice Johnson', status: 'active', price: 45, bookings: 18, date: '2023-09-30', image: 'https://picsum.photos/seed/tour9/600/400', description: 'Romantic sunset coastal experience', duration: '1.5 hours' },
  { id: '10', title: 'Wildlife Safari', guide: 'Bob Williams', status: 'completed', price: 150, bookings: 12, date: '2023-08-15', image: 'https://picsum.photos/seed/tour10/600/400', description: 'Observe local wildlife in natural habitat', duration: '5 hours' },
  { id: '11', title: 'Architecture Walking Tour', guide: 'Charlie Davis', status: 'draft', price: 55, bookings: 0, date: '2023-10-10', image: 'https://picsum.photos/seed/tour11/600/400', description: 'Discover architectural marvels', duration: '2 hours' },
  { id: '12', title: 'Cooking Class Experience', guide: 'Diana Evans', status: 'active', price: 85, bookings: 14, date: '2023-09-25', image: 'https://picsum.photos/seed/tour12/600/400', description: 'Learn to cook local specialties', duration: '3 hours' },
  { id: '13', title: 'Garden & Nature Tour', guide: 'Alice Johnson', status: 'completed', price: 40, bookings: 22, date: '2023-07-25', image: 'https://picsum.photos/seed/tour13/600/400', description: 'Beautiful gardens and nature trails', duration: '2 hours' },
  { id: '14', title: 'Cultural Festival Tour', guide: 'Eve Wilson', status: 'cancelled', price: 60, bookings: 8, date: '2023-09-10', image: 'https://picsum.photos/seed/tour14/600/400', description: 'Experience local cultural festivities', duration: '3 hours' },
];

// Define props for the Tour Card and Modal components
interface TourCardProps {
  tour: Tour;
  onEdit: (tour: Tour) => void;
  onDelete: (tour: Tour) => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'guide' | 'price' | 'status' | 'bookings';
type SortOrder = 'asc' | 'desc';

// TourCard component for grid view
const TourCard: FC<TourCardProps> = ({ tour, onEdit, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative">
        <img 
          src={tour.image} 
          alt={tour.title} 
          className="w-full h-48 sm:h-56 object-cover" 
        />
        <span className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(tour.status)}`}>
          {tour.status}
        </span>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
          {tour.title}
        </h3>
        <p className="text-md text-gray-600 mb-1">Guide: {tour.guide}</p>
        {tour.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tour.description}</p>
        )}
        
        <div className="text-md text-gray-600 border-t border-b py-2 sm:py-3 my-2 sm:my-3 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <span>Bookings:</span>
            <span className="font-medium text-gray-800">{tour.bookings}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Duration:</span>
            <span className="font-medium text-gray-800">{tour.duration || 'TBD'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Date:</span>
            <span className="font-medium text-gray-800">{new Date(tour.date).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-lg sm:text-xl font-bold text-gray-900">${tour.price}</p>
              <p className="text-xs text-gray-500">per person</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(tour)}
              className="flex-1 cursor-pointer text-center px-2 sm:px-3 py-2 sm:py-2.5 bg-[#F20C8F] text-white rounded-lg hover:bg-[#d1075e] transition-colors text-md sm:text-base font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(tour)}
              className="p-2 text-red-600 cursor-pointer hover:bg-red-100 rounded-lg transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-4 6v6m-4-6v6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ToursDashboard is the main component
const ToursDashboard: FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [goToPageInput, setGoToPageInput] = useState('1');
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    guide: 'all',
  });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const [showEditModal, setShowEditModal] = useState<Tour | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Tour | null>(null);

  // Update goToPageInput when currentPage changes
  React.useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Filter and sort the tours using useMemo for performance optimization
  const filteredTours = useMemo(() => {
    let filtered = mockTours.filter(tour => {
      const statusMatch = filters.status === 'all' || tour.status === filters.status;
      const searchMatch = tour.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          tour.guide.toLowerCase().includes(filters.search.toLowerCase());
      const guideMatch = filters.guide === 'all' || tour.guide === filters.guide;
      return statusMatch && searchMatch && guideMatch;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title': comparison = a.title.localeCompare(b.title); break;
        case 'guide': comparison = a.guide.localeCompare(b.guide); break;
        case 'price': comparison = a.price - b.price; break;
        case 'status': comparison = a.status.localeCompare(b.status); break;
        case 'bookings': comparison = a.bookings - b.bookings; break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [filters, sortField, sortOrder]);

  const paginatedTours = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTours.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTours, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTours.length / itemsPerPage);

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

  const uniqueGuides = useMemo(() => {
    return [...new Set(mockTours.map(t => t.guide))];
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleEdit = (tour: Tour) => setShowEditModal(tour);
  const handleDelete = (tour: Tour) => setShowDeleteModal(tour);
  const confirmDelete = () => {
    console.log(`Deleting tour: ${showDeleteModal?.id}`);
    setShowDeleteModal(null);
  };
  const confirmEdit = () => {
    console.log(`Editing tour: ${showEditModal?.id}`);
    setShowEditModal(null);
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';  
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <p className="text-md font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans antialiased mt-8">
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#083A85] mb-2">Tours Dashboard</h1>
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

        {/* Enhanced Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Tour title or guide..."
                  className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1 sm:mb-2">Guide</label>
              <select
                name="guide"
                value={filters.guide}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 sm:py-2.5 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#083A85] text-base cursor-pointer"
              >
                <option value="all">All Guides</option>
                {uniqueGuides.map(guide => <option key={guide} value={guide}>{guide}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-4 sm:mt-6 gap-3 sm:gap-4">
            <p className="text-md text-gray-600 text-center sm:text-left">
              Showing {paginatedTours.length} of {filteredTours.length} tours
            </p>
            <div className="flex justify-center sm:justify-end gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 cursor-pointer sm:px-4 py-2 rounded-lg transition-colors text-md font-medium ${
                  viewMode === 'grid' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2 inline"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span className="hidden xs:inline">Grid View</span>
                <span className="xs:hidden">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 cursor-pointer sm:px-4 py-2 rounded-lg transition-colors text-md font-medium ${
                  viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 sm:mr-2 inline"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                <span className="hidden xs:inline">List View</span>
                <span className="xs:hidden">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tours List - Grid or List View */}
        {filteredTours.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4"><path d="m16 6 4 14"/><path d="m12 6 4 14"/><path d="m8 6 4 14"/><path d="M4 20h16"/><path d="M5 20l3 -14"/><path d="m16 6l3 14"/></svg>
            <h3 className="text-lg font-medium text-gray-900 mt-4">No tours found</h3>
            <p className="text-md text-gray-600 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {paginatedTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tour</th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('guide')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Guide
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'guide' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('status')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Status
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'status' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('bookings')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Bookings
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'bookings' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left">
                          <button
                            onClick={() => handleSort('price')}
                            className="text-xs cursor-pointer font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900"
                          >
                            Price
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={sortField === 'price' && sortOrder === 'asc' ? 'm7 15 5-5 5 5' : 'm17 9-5 5-5-5'}/>
                            </svg>
                          </button>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedTours.map((tour) => (
                        <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <img
                                src={tour.image}
                                alt={tour.title}
                                className="w-full sm:w-24 md:w-28 h-16 sm:h-16 md:h-20 rounded-md object-cover"
                              />
                              <div className="min-w-0">
                                <div className="text-md font-medium text-gray-900 truncate">{tour.title}</div>
                                <div className="text-xs text-gray-500 truncate">{tour.description}</div>
                                <div className="text-xs text-gray-500">{new Date(tour.date).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">{tour.guide}</div>
                            <div className="text-xs text-gray-500">{tour.duration || 'TBD'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tour.status)}`}>
                              {tour.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">{tour.bookings}</div>
                            <div className="text-xs text-gray-500">bookings</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-md font-medium text-gray-900">${tour.price}</div>
                            <div className="text-xs text-gray-500">per person</div>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-md font-medium">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => handleEdit(tour)}
                                className="text-[#F20C8F] hover:text-[#d1075e] p-1 cursor-pointer"
                                title="Edit"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                              </button>
                              <button
                                onClick={() => handleDelete(tour)}
                                className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                                title="Delete"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-4 6v6m-4-6v6"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 order-2 sm:order-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = (totalPages <= 5 || currentPage <= 3) ? i + 1 : (currentPage >= totalPages - 2) ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg text-md font-medium transition-colors ${
                        currentPage === pageNum ? 'bg-[#083A85] text-white' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-md order-1 sm:order-2">
              <span className="text-gray-700 whitespace-nowrap">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onBlur={(e) => handleGoToPage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)}
                className="w-12 sm:w-16 px-1 sm:px-2 py-1 border border-gray-300 rounded-lg text-md focus:outline-none focus:ring-2 focus:ring-[#083A85]"
              />
              <span className="text-gray-700 whitespace-nowrap">of {totalPages}</span>
            </div>
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
                  className="flex-1 bg-gray-200 cursor-pointer text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEdit}
                  className="flex-1 bg-[#083A85] cursor-pointer text-white font-bold py-2 px-4 rounded-md hover:bg-[#083A85]/80 transition-colors"
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
                  className="flex-1 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors cursor-pointer"
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