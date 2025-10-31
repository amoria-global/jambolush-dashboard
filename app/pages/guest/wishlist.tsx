"use client";
import React, { useState, useEffect, useMemo } from 'react';
import api from '@/app/api/apiService';

// Types
interface WishlistItem {
  id: string;
  propertyId: number;
  title: string;
  category: 'apartment' | 'house' | 'villa' | 'condo' | 'studio';
  price: number;
  originalPrice?: number;
  status: 'available' | 'unavailable' | 'price-dropped' | 'booked';
  image: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  addedDate: Date;
  notes?: string;
  rating: number;
  reviews: number;
  userRating?: number;
  userReview?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'title' | 'price' | 'addedDate' | 'status';
type SortOrder = 'asc' | 'desc';

const WishlistPage: React.FC = () => {
  // Date formatting helper
  const format = (date: Date, formatStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();
    
    switch(formatStr) {
      case 'MMM dd, yyyy':
        return `${months[month]} ${day.toString().padStart(2, '0')}, ${year}`;
      case 'MMM dd':
        return `${months[month]} ${day.toString().padStart(2, '0')}`;
      default:
        return `${months[month]} ${day}, ${year}`;
    }
  };

  // States
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingReview, setEditingReview] = useState('');
  const [editingRating, setEditingRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('addedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Data fetching
  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }
        api.setAuth(token);
        
        const response: any = await api.get('/bookings/wishlist');

        if (response.success) {
          const mappedData = response.data.data.items.map((item: any): WishlistItem => ({
            id: item.id,
            propertyId: item.itemId,
            title: item.itemDetails.name || 'N/A',
            category: item.itemDetails.category || 'house',
            price: item.itemDetails.price || 0,
            status: item.isAvailable ? 'available' : 'unavailable',
            image: item.itemDetails.image || 'https://via.placeholder.com/400x300',
            location: item.itemDetails.location || 'N/A',
            rating: item.itemDetails.rating || 0,
            addedDate: new Date(item.createdAt),
            notes: item.notes || '',
            bedrooms: item.itemDetails.bedrooms || 0,
            bathrooms: item.itemDetails.bathrooms || 0,
            sqft: item.itemDetails.sqft || 0,
            reviews: item.itemDetails.reviews || 0,
          }));
          setWishlistItems(mappedData);
        }
      } catch (error: any) {
        console.error("Failed to fetch wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      total: wishlistItems.length,
      available: wishlistItems.filter(item => item.status === 'available').length,
      unavailable: wishlistItems.filter(item => item.status === 'unavailable').length,
      priceDropped: wishlistItems.filter(item => item.status === 'price-dropped').length,
      booked: wishlistItems.filter(item => item.status === 'booked').length
    };
  }, [wishlistItems]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...wishlistItems];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (priceRange.min || priceRange.max) {
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      filtered = filtered.filter(item => item.price >= min && item.price <= max);
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'addedDate':
          comparison = a.addedDate.getTime() - b.addedDate.getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [wishlistItems, searchTerm, statusFilter, categoryFilter, priceRange, sortField, sortOrder]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (item: WishlistItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleRemove = async (itemId: string) => {
    if (confirm('Remove this property from your wishlist?')) {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        api.setAuth(token);
        
        await api.delete(`/bookings/wishlist/${itemId}`);
        setWishlistItems(prev => prev.filter(item => item.id !== itemId));
        
      } catch (error: any) {
        console.error("Failed to remove item:", error);
      }
    }
  };

  const handleMoveToBookings = (item: WishlistItem) => {
    alert(`Booking "${item.title}"...`);
  };

  const handleOpenReviewModal = (item: WishlistItem) => {
    setSelectedItem(item);
    setEditingNotes(item.notes || '');
    setEditingReview(item.userReview || '');
    setEditingRating(item.userRating || 0);
    setShowReviewModal(true);
  };

  const handleSaveReview = () => {
    if (selectedItem) {
      setWishlistItems(prev => 
        prev.map(item => 
          item.id === selectedItem.id 
            ? { 
                ...item, 
                notes: editingNotes,
                userReview: editingReview,
                userRating: editingRating
              }
            : item
        )
      );
      setShowReviewModal(false);
      setEditingNotes('');
      setEditingReview('');
      setEditingRating(0);
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'unavailable': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'price-dropped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'booked': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Wishlists</h1>
        <p className="text-gray-600">Save your favorite places to stay</p>
      </div>

      {/* Summary Cards - Airbnb Style */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <i className="bi bi-heart-fill text-gray-400 text-xl"></i>
            <span className="text-2xl font-semibold text-gray-900">{summaryStats.total}</span>
          </div>
          <p className="text-sm text-gray-600">Total saved</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <i className="bi bi-check-circle text-emerald-500 text-xl"></i>
            <span className="text-2xl font-semibold text-gray-900">{summaryStats.available}</span>
          </div>
          <p className="text-sm text-gray-600">Available</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <i className="bi bi-x-circle text-gray-400 text-xl"></i>
            <span className="text-2xl font-semibold text-gray-900">{summaryStats.unavailable}</span>
          </div>
          <p className="text-sm text-gray-600">Unavailable</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <i className="bi bi-tag text-blue-500 text-xl"></i>
            <span className="text-2xl font-semibold text-gray-900">{summaryStats.priceDropped}</span>
          </div>
          <p className="text-sm text-gray-600">Price drops</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <i className="bi bi-calendar-check text-red-500 text-xl"></i>
            <span className="text-2xl font-semibold text-gray-900">{summaryStats.booked}</span>
          </div>
          <p className="text-sm text-gray-600">Booked</p>
        </div>
      </div>

      {/* Filters Section - Airbnb Style */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search saved properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] transition-all"
            />
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full bg-white hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all">
            <option value="all">Any status</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
            <option value="price-dropped">Price dropped</option>
            <option value="booked">Booked</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-full bg-white hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] cursor-pointer transition-all">
            <option value="all">Any type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="condo">Condo</option>
            <option value="studio">Studio</option>
          </select>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-28 px-4 py-2 border border-gray-300 rounded-full hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] transition-all"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-28 px-4 py-2 border border-gray-300 rounded-full hover:border-gray-400 focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] transition-all"
            />
          </div>
        </div>

        {/* Results Count & View Toggle */}
        <div className="flex justify-between items-center">
          <p className="text-gray-700">
            <span className="font-medium">{filteredItems.length}</span> properties saved
          </p>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <i className="bi bi-grid-3x3-gap-fill mr-2"></i>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}>
              <i className="bi bi-list mr-2"></i>
              List
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083A85]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <i className="bi bi-heart text-3xl text-gray-400"></i>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {wishlistItems.length === 0 ? "No saved places yet" : "No matching properties"}
          </h3>
          <p className="text-gray-600">
            {wishlistItems.length === 0 
              ? "Start exploring and save your favorite places"
              : "Try adjusting your filters"}
          </p>
        </div>
      )}

      {/* Grid View - Airbnb Style */}
      {!loading && filteredItems.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedItems.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => handleViewDetails(item)}>
              <div className="relative aspect-square mb-3 overflow-hidden rounded-xl">
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Heart Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.id);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all shadow-md">
                  <i className="bi bi-heart-fill text-red-500"></i>
                </button>
                
                {/* Status Badge */}
                {item.status !== 'available' && (
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border backdrop-blur-sm bg-white/90 ${getStatusColor(item.status)}`}>
                      {item.status === 'price-dropped' ? 'Price drop' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-gray-900 line-clamp-1">{item.title}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <i className="bi bi-star-fill text-xs"></i>
                    <span>{item.rating}</span>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm mb-1">{item.location}</p>
                <p className="text-gray-500 text-sm mb-2">
                  {item.bedrooms} bed · {item.bathrooms} bath · {item.sqft} sqft
                </p>
                
                <div className="flex items-baseline gap-2">
                  {item.originalPrice && (
                    <span className="text-gray-400 line-through text-sm">
                      ${item.originalPrice}
                    </span>
                  )}
                  <p className="font-semibold text-gray-900">
                    ${item.price} <span className="font-normal text-gray-500">night</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToBookings(item);
                    }}
                    className="flex-1 px-3 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm font-medium">
                    Reserve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReviewModal(item);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <i className="bi bi-pencil text-gray-600"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View - Airbnb Style */}
      {!loading && filteredItems.length > 0 && viewMode === 'list' && (
        <div className="space-y-4">
          {paginatedItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleViewDetails(item)}>
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{item.title}</h3>
                      <p className="text-gray-500 text-sm">{item.location}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                      {item.status === 'price-dropped' ? 'Price drop' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{item.bedrooms} bedrooms</span>
                    <span>{item.bathrooms} bathrooms</span>
                    <span>{item.sqft} sqft</span>
                    <span className="flex items-center gap-1">
                      <i className="bi bi-star-fill text-xs"></i>
                      {item.rating} ({item.reviews} reviews)
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="flex items-baseline gap-2">
                      {item.originalPrice && (
                        <span className="text-gray-400 line-through">
                          ${item.originalPrice}
                        </span>
                      )}
                      <span className="text-xl font-semibold text-gray-900">
                        ${item.price} <span className="text-sm font-normal text-gray-500">/ night</span>
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToBookings(item);
                        }}
                        className="px-4 py-2 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors text-sm font-medium">
                        Reserve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReviewModal(item);
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                        <i className="bi bi-pencil text-gray-600"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(item.id);
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - Airbnb Style */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-left"></i>
            </button>
            
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#083A85] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}>
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                  return <span key={pageNum} className="text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors">
              <i className="bi bi-chevron-right"></i>
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal - Airbnb Style */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Image Header */}
              <div className="relative h-64">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title}
                  className="w-full h-full object-cover rounded-t-2xl"
                />
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">{selectedItem.title}</h2>
                    <p className="text-gray-600 flex items-center gap-1">
                      <i className="bi bi-geo-alt"></i>
                      {selectedItem.location}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status === 'price-dropped' ? 'Price drop' : selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                  </span>
                </div>

                {/* Property Details */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <i className="bi bi-door-open text-2xl text-gray-600 mb-1"></i>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                    <p className="font-semibold">{selectedItem.bedrooms}</p>
                  </div>
                  <div className="text-center">
                    <i className="bi bi-droplet text-2xl text-gray-600 mb-1"></i>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                    <p className="font-semibold">{selectedItem.bathrooms}</p>
                  </div>
                  <div className="text-center">
                    <i className="bi bi-arrows-angle-expand text-2xl text-gray-600 mb-1"></i>
                    <p className="text-sm text-gray-600">Square feet</p>
                    <p className="font-semibold">{selectedItem.sqft}</p>
                  </div>
                  <div className="text-center">
                    <i className="bi bi-house text-2xl text-gray-600 mb-1"></i>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold capitalize">{selectedItem.category}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-b py-4 mb-6">
                  <div className="flex items-baseline gap-3">
                    {selectedItem.originalPrice && (
                      <span className="text-xl text-gray-400 line-through">
                        ${selectedItem.originalPrice}
                      </span>
                    )}
                    <span className="text-3xl font-semibold text-gray-900">
                      ${selectedItem.price}
                    </span>
                    <span className="text-gray-600">per night</span>
                    {selectedItem.originalPrice && (
                      <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        Save ${selectedItem.originalPrice - selectedItem.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Reviews */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <i className="bi bi-star-fill text-lg"></i>
                      <span className="text-lg font-semibold">{selectedItem.rating}</span>
                    </div>
                    <span className="text-gray-600">·</span>
                    <span className="text-gray-600">{selectedItem.reviews} reviews</span>
                    {selectedItem.userRating && (
                      <>
                        <span className="text-gray-600">·</span>
                        <span className="text-gray-600">You rated: {selectedItem.userRating}/5</span>
                      </>
                    )}
                  </div>
                </div>

                {/* User Notes/Review */}
                {(selectedItem.notes || selectedItem.userReview) && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    {selectedItem.notes && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 mb-1">Your notes</h4>
                        <p className="text-gray-600">{selectedItem.notes}</p>
                      </div>
                    )}
                    {selectedItem.userReview && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Your review</h4>
                        <p className="text-gray-600">{selectedItem.userReview}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleMoveToBookings(selectedItem);
                      setShowModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors font-medium">
                    Reserve this place
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleOpenReviewModal(selectedItem);
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors font-medium">
                    Add notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal - Airbnb Style */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowReviewModal(false)}></div>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add notes and rating</h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <i className="bi bi-x-lg text-xl"></i>
                  </button>
                </div>

                {/* Property Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{selectedItem.title}</p>
                    <p className="text-sm text-gray-600">{selectedItem.location}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Your rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditingRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110">
                        <i 
                          className={`bi ${
                            star <= (hoverRating || editingRating) 
                              ? 'bi-star-fill text-black' 
                              : 'bi-star text-gray-300'
                          } text-2xl`}
                        ></i>
                      </button>
                    ))}
                    {editingRating > 0 && (
                      <span className="ml-2 text-gray-600">{editingRating} star{editingRating !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {/* Review */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your review (optional)
                  </label>
                  <textarea
                    value={editingReview}
                    onChange={(e) => setEditingReview(e.target.value)}
                    placeholder="Share your thoughts about this property..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] resize-none"
                    rows={3}
                  />
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal notes (private)
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add notes for yourself..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-[#083A85] focus:ring-1 focus:ring-[#083A85] resize-none"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReview}
                    className="flex-1 px-6 py-3 bg-[#083A85] text-white rounded-lg hover:bg-[#062d65] transition-colors font-medium">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;