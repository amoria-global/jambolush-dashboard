"use client";

import React, { useState, useMemo, useEffect, FC } from 'react';
import api from '@/app/api/apiService';
import AddTourModal from '@/app/components/tourguide/add-tour';
import EditTourModal from '@/app/components/tourguide/edit-tour';

// --- Interfaces ---
interface Tour {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  maxGroupSize: number;
  status: 'active' | 'draft' | 'paused'; // Derived from isActive
  category: string;
  mainImage?: string;
  rating: number;
  totalBookings: number;
  locationCity?: string;
  locationCountry?: string;
  isActive: boolean; // The source of truth for status
}

interface DashboardData {
  totalTours: number;
  activeTours: number;
  draftTours: number;
  pausedTours: number;
}

interface TourCardProps {
  tour: Tour;
  onEdit: (tourId: string) => void;
  onStatusChange: (tourId: string, newStatus: 'active' | 'paused') => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'category' | 'price' | 'status' | 'totalBookings';
type SortOrder = 'asc' | 'desc';


// --- Main Component ---
const TourGuideMyTours: FC = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI & Interaction State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 8;
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [goToPageInput, setGoToPageInput] = useState('1');
  
  const [filters, setFilters] = useState({ status: 'all', search: '', category: 'all' });
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  
  // User & KYC State
  const [user, setUser] = useState<any>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // --- Data Fetching ---
  const fetchToursAndData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (token) api.setAuth(token);

      const dashboardResponse = await api.get('/tours/guide/dashboard/enhanced');
      setDashboardData(dashboardResponse.data.data);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy: sortField,
        sortOrder,
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') {
        params.append('isActive', (filters.status === 'active').toString());
      }
      
      const toursResponse: any = await api.get(`/tours/guide/my-tours?${params.toString()}`);
      const { tours: fetchedTours, total, totalPages: fetchedTotalPages } = toursResponse.data.data;
      
      const processedTours = (fetchedTours || []).map((tour: any) => ({
        ...tour,
        status: tour.isActive ? 'active' : 'paused',
      }));

      setTours(processedTours);
      setTotalPages(fetchedTotalPages || 1);
      setTotalItems(total || 0);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load your experiences. Please try again.');
      setTours([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        api.setAuth(token);
        const response = await api.get('/auth/me');
        if (response.data) setUser(response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);
  
  useEffect(() => {
    fetchToursAndData();
  }, [currentPage, filters, sortField, sortOrder]);

   useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // --- Handlers ---
  const handleEditTour = (tourId: string) => {
    if (!checkKYCStatus()) return;
    setEditingTourId(tourId);
  };
  
  const handleAddNewTour = () => {
    if (!checkKYCStatus()) return;
    setShowAddModal(true);
  };

  const handleStatusChange = async (tourId: string, newStatus: 'active' | 'paused') => {
    if (!checkKYCStatus()) return;
    const originalTours = [...tours];
    setTours(tours.map(t => t.id === tourId ? { ...t, status: newStatus, isActive: newStatus === 'active' } : t));

    try {
      const endpoint = newStatus === 'active' ? `/tours/${tourId}/activate` : `/tours/${tourId}/deactivate`;
      await api.patch(endpoint, {});
      await fetchToursAndData();
    } catch (error) {
      console.error('Error updating tour status:', error);
      setError('Failed to update status.');
      setTours(originalTours);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    setSortOrder(sortField === field && sortOrder === 'asc' ? 'desc' : 'asc');
    setSortField(field);
    setCurrentPage(1);
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  const checkKYCStatus = (): boolean => {
    if (!user || user.kycStatus !== 'approved') {
      setShowKYCModal(true);
      return false;
    }
    return true;
  };
  
  const uniqueCategories = useMemo(() => {
    return [...new Set(tours.map(t => t.category))].filter(Boolean);
  }, [tours]);

  const statusSummary = useMemo(() => {
    return {
      all: dashboardData?.totalTours ?? 0,
      active: dashboardData?.activeTours ?? 0,
      draft: dashboardData?.draftTours ?? 0,
      paused: dashboardData?.pausedTours ?? 0,
    };
  }, [dashboardData]);


  // --- Sub-components ---
  const TourCard: FC<TourCardProps> = ({ tour, onEdit, onStatusChange }) => (
    <div className="bg-white rounded-xl overflow-hidden group transition-transform duration-300 ease-in-out hover:-translate-y-1 shadow-sm hover:shadow-lg">
      <div className="relative">
        <img 
          src={tour.mainImage || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=800&q=80'} 
          alt={tour.title} 
          className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/30 to-transparent"></div>
        <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-md bg-white/90 text-gray-800 backdrop-blur-sm">
          {tour.locationCity || tour.locationCountry}
        </span>
        <button className="absolute top-3 right-3 text-white opacity-80 hover:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-800 line-clamp-2 leading-tight flex-1">{tour.title}</h3>
          {tour.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <span className="text-sm font-medium text-gray-600">{tour.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{tour.category} • {tour.duration} hours</p>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <p className="text-base"><span className="font-bold text-gray-900">${tour.price}</span> / person</p>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(tour.id, tour.status === 'active' ? 'paused' : 'active')}
              className={`p-2 rounded-full transition-colors ${tour.status === 'active' ? 'text-orange-500 hover:bg-orange-100' : 'text-green-500 hover:bg-green-100'}`}
              title={tour.status === 'active' ? 'Pause' : 'Activate'}
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {tour.status === 'active' ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}
               </svg>
            </button>
            <button
              onClick={() => onEdit(tour.id)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  const StatusCard: FC<{ title: string; count: number; icon: React.ReactNode; color: string; }> = ({ title, count, icon, color }) => (
    <div className={`bg-white rounded-2xl p-5 shadow-sm flex items-center space-x-4 border-l-4 ${color}`}>
      <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-gray-50`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
      </div>
    </div>
  );

  // --- Render Logic ---
  if (loading && tours.length === 0) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
            <span className="ml-4 text-gray-700">Loading your dashboard...</span>
        </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 font-sans antialiased">
      <div className="w-full max-w-8xl mx-auto">
        <KYCPendingModal isOpen={showKYCModal} onClose={() => setShowKYCModal(false)} />
        {showAddModal && <AddTourModal onClose={() => { setShowAddModal(false); fetchToursAndData(); }} />}
        {editingTourId && (
          <EditTourModal 
            tourId={editingTourId} 
            onClose={() => setEditingTourId(null)} 
            onUpdate={() => {
              setEditingTourId(null);
              fetchToursAndData();
            }} 
          />
        )}
        
        <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 pt-5">My Experiences</h1>
            <p className="text-gray-600">Manage your experiences and bookings with ease.</p>
          </div>
          <button 
            className="bg-[#083A85] text-white px-5 py-2.5 rounded-full hover:bg-[#083A85]/90 transition-colors font-medium flex items-center gap-2 self-start sm:self-center"
            onClick={handleAddNewTour}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5v14"/></svg>
            New Experience
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatusCard title="Total Experiences" count={statusSummary.all} color="border-[#083A85]" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><path d="m16 6 4 14"/><path d="m12 6 4 14"/><path d="m8 6 4 14"/><path d="M4 20h16"/><path d="M5 20l3 -14"/><path d="m16 6l3 14"/></svg>} />
          <StatusCard title="Active" count={statusSummary.active} color="border-green-500" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>} />
          <StatusCard title="Draft" count={statusSummary.draft} color="border-gray-500" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v5h5"/></svg>} />
          <StatusCard title="Paused" count={statusSummary.paused} color="border-orange-500" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600"><circle cx="12" cy="12" r="10"/><rect x="9" y="8" width="2" height="8"/><rect x="13" y="8" width="2" height="8"/></svg>} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Filter Inputs */}
            <div>
              <div className="relative"><input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="Search experiences..." className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85]/50 text-sm" /><div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div></div>
            </div>
            <div>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85]/50 text-sm cursor-pointer"><option value="all">All Status</option><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option></select>
            </div>
            <div>
              <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#083A85]/50 text-sm cursor-pointer"><option value="all">All Categories</option>{uniqueCategories.map(category => <option key={category} value={category}>{category}</option>)}</select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-6 gap-4">
            <p className="text-sm text-gray-600 text-center sm:text-left">Showing {tours.length} of {totalItems} experiences</p>
            <div className="flex justify-center sm:justify-end gap-2">
              {/* View Mode Buttons */}
              <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-full transition-colors text-sm font-medium flex items-center gap-2 ${viewMode === 'grid' ? 'bg-[#083A85] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Grid</button>
              <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-full transition-colors text-sm font-medium flex items-center gap-2 ${viewMode === 'list' ? 'bg-[#083A85] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> List</button>
            </div>
          </div>
        </div>

        {tours.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900 mt-4">No experiences found</h3>
                <p className="text-sm text-gray-600 mt-2">Try adjusting your filters or create your first experience.</p>
                <button onClick={handleAddNewTour} className="mt-6 bg-[#083A85] text-white px-6 py-2 rounded-full hover:bg-[#083A85]/90 transition-colors font-medium">Create Your First Experience</button>
            </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tours.map(tour => <TourCard key={tour.id} tour={tour} onEdit={handleEditTour} onStatusChange={handleStatusChange} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50"><tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Experience</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Bookings</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Price</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-200">{tours.map(tour => (
                    <tr key={tour.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-4"><img src={tour.mainImage || 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=400&q=80'} alt={tour.title} className="w-28 h-20 rounded-lg object-cover" /><div><div className="text-sm font-semibold text-gray-800">{tour.title}</div><div className="text-xs text-gray-500">{tour.locationCity}</div></div></div></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tour.category}</td>
                      <td className="px-6 py-4"><span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${tour.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{tour.status}</span></td>
                      <td className="px-6 py-4 text-sm text-gray-600">{tour.totalBookings || 0}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">${tour.price}</td>
                      <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleStatusChange(tour.id, tour.status === 'active' ? 'paused' : 'active')} className={`p-2 rounded-full transition-colors ${tour.status === 'active' ? 'text-orange-500 hover:bg-orange-100' : 'text-green-500 hover:bg-green-100'}`} title={tour.status === 'active' ? 'Pause' : 'Activate'}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{tour.status === 'active' ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg></button>
                        <button onClick={() => handleEditTour(tour.id)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                      </div></td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 order-2 sm:order-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || loading} className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || loading} className="px-3 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
              </div>
              <div className="flex items-center gap-2 text-sm order-1 sm:order-2">
                <span className="text-gray-700 whitespace-nowrap">Go to page:</span>
                <input type="number" min="1" max={totalPages} value={goToPageInput} onChange={(e) => setGoToPageInput(e.target.value)} onBlur={(e) => handleGoToPage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleGoToPage((e.target as HTMLInputElement).value)} disabled={loading} className="w-16 px-2 py-1 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#083A85]/50 disabled:opacity-50" />
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

const KYCPendingModal: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-semibold text-center text-gray-900 mb-3">Verification Pending</h3>
                <p className="text-gray-600 text-center mb-6">Your account verification is in progress. Please wait for approval before creating experiences.</p>
                <div className="flex justify-center">
                    <button onClick={onClose} className="px-6 py-2 bg-[#083A85] text-white rounded-full hover:bg-[#083A85]/90 transition-colors font-medium">Got it</button>
                </div>
            </div>
        </div>
    );
};

export default TourGuideMyTours;