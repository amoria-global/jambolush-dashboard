"use client";
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface WishlistItem {
  id: string;
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
  const [itemsPerPage] = useState(9);
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

  // Mock data generation
  useEffect(() => {
    const generateMockWishlist = (): WishlistItem[] => {
      const statuses: ('available' | 'unavailable' | 'price-dropped' | 'booked')[] = 
        ['available', 'unavailable', 'price-dropped', 'booked'];
      const categories: ('apartment' | 'house' | 'villa' | 'condo' | 'studio')[] = 
        ['apartment', 'house', 'villa', 'condo', 'studio'];
      const titles = [
        'Luxury Downtown Apartment', 'Cozy Beach House', 'Modern Villa with Pool',
        'Urban Studio Loft', 'Mountain View Condo', 'Seaside Cottage',
        'Penthouse Suite', 'Garden Villa', 'Historic Townhouse', 'Lake View Cabin'
      ];
      const locations = [
        'Miami Beach, FL', 'San Francisco, CA', 'New York, NY', 
        'Austin, TX', 'Seattle, WA', 'Portland, OR', 'Denver, CO'
      ];
      
      return Array.from({ length: 42 }, (_, i) => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const basePrice = Math.floor(Math.random() * 3000) + 500;
        const isPriceDropped = status === 'price-dropped';
        
        return {
          id: `WL${String(i + 1).padStart(5, '0')}`,
          title: titles[Math.floor(Math.random() * titles.length)] + ` ${i + 1}`,
          category: categories[Math.floor(Math.random() * categories.length)],
          price: isPriceDropped ? Math.floor(basePrice * 0.85) : basePrice,
          originalPrice: isPriceDropped ? basePrice : undefined,
          status,
          image: `https://picsum.photos/400/300?random=${i}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          bedrooms: Math.floor(Math.random() * 4) + 1,
          bathrooms: Math.floor(Math.random() * 3) + 1,
          sqft: Math.floor(Math.random() * 2000) + 500,
          addedDate: new Date(2025, 0, Math.floor(Math.random() * 30) + 1),
          notes: Math.random() > 0.5 ? 'Perfect for summer vacation' : undefined,
          rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
          reviews: Math.floor(Math.random() * 200) + 10,
          userRating: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : undefined,
          userReview: Math.random() > 0.7 ? 'Great property with amazing views!' : undefined
        };
      });
    };

    setTimeout(() => {
      setWishlistItems(generateMockWishlist());
      setLoading(false);
    }, 1000);
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Price range filter
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

  const handleRemove = (itemId: string) => {
    if (confirm('Are you sure you want to remove this item from your wishlist?')) {
      setWishlistItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleMoveToBookings = (item: WishlistItem) => {
    alert(`Moving "${item.title}" to bookings...`);
    // In real app, this would make an API call
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
      case 'available': return 'bg-green-100 text-green-800';
      case 'unavailable': return 'bg-gray-100 text-gray-800';
      case 'price-dropped': return 'bg-blue-100 text-blue-800';
      case 'booked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'bi-house-check';
      case 'unavailable': return 'bi-x-circle';
      case 'price-dropped': return 'bi-tag';
      case 'booked': return 'bi-calendar-check';
      default: return 'bi-house';
    }
  };

  return (
    <div className="pt-14 px-2 sm:px-4 md:px-8 lg:px-12 xl:px-24">
      <div className="mx-auto py-8">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2 text-base sm:text-lg">Track and manage your favorite properties</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
              </div>
              <i className="bi bi-heart-fill text-2xl text-gray-400"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.available}</p>
              </div>
              <i className="bi bi-house-check text-2xl text-green-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-gray-600">Unavailable</p>
                <p className="text-2xl font-bold text-gray-600">{summaryStats.unavailable}</p>
              </div>
              <i className="bi bi-x-circle text-2xl text-gray-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-gray-600">Price Drop</p>
                <p className="text-2xl font-bold text-blue-600">{summaryStats.priceDropped}</p>
              </div>
              <i className="bi bi-tag text-2xl text-blue-500"></i>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow-xl p-4 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm sm:text-base text-gray-600">Booked</p>
                <p className="text-2xl font-bold text-red-600">{summaryStats.booked}</p>
              </div>
              <i className="bi bi-calendar-check text-2xl text-red-500"></i>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-50 rounded-lg shadow-xl p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Property name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                <i className="bi bi-search absolute left-3 top-3 text-gray-700"></i>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="price-dropped">Price Dropped</option>
                <option value="booked">Booked</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer text-base"
              >
                <option value="all">All Categories</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="condo">Condo</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="flex-1 min-w-0 px-2 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                />
              </div>
            </div>
          </div>

          {/* View Mode Toggle & Results Count */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
            <p className="text-base text-gray-600 mb-4 sm:mb-0">
              Showing {paginatedItems.length} of {filteredItems.length} properties
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm sm:text-base font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}
              >
                <i className="bi bi-grid-3x3-gap mr-1 sm:mr-2"></i><span className="hidden sm:inline">Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition-colors cursor-pointer text-sm sm:text-base font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-900 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}
              >
                <i className="bi bi-list-ul mr-1 sm:mr-2"></i><span className="hidden sm:inline">List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="bg-gray-100 rounded-lg shadow-xl p-8 sm:p-12 text-center">
            <i className="bi bi-heart text-5xl sm:text-6xl text-gray-300"></i>
            <h3 className="text-xl sm:text-2xl font-medium text-gray-900 mt-4">
              {wishlistItems.length === 0 
                ? "Your wishlist is empty"
                : "No properties found"}
            </h3>
            <p className="text-base text-gray-600 mt-2">
              {wishlistItems.length === 0 
                ? "Start adding your favorite listings!"
                : "Try adjusting your filters or search criteria"}
            </p>
          </div>
        )}

        {/* Grid View */}
        {!loading && filteredItems.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedItems.map((item) => (
              <div key={item.id} className="bg-gray-100 rounded-lg shadow-xl hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <span className={`absolute top-3 right-3 px-2 py-1 text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(item.status)}`}>
                    <i className={`bi ${getStatusIcon(item.status)} mr-1`}></i>
                    {item.status === 'price-dropped' ? 'Price Drop' : item.status}
                  </span>
                  {item.userRating && (
                    <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                      <i className="bi bi-star-fill text-yellow-400"></i>
                      <span className="text-sm font-semibold">{item.userRating}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center text-sm sm:text-base text-gray-600">
                      <i className="bi bi-star-fill text-yellow-400 mr-2"></i>
                      {item.rating}
                    </div>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-500 mb-3">
                    <i className="bi bi-geo-alt mr-1"></i>
                    {item.location}
                  </p>
                  
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm sm:text-base text-gray-600 mb-3">
                    <span><i className="bi bi-door-open mr-1"></i>{item.bedrooms} bed</span>
                    <span><i className="bi bi-droplet mr-1"></i>{item.bathrooms} bath</span>
                    <span><i className="bi bi-arrows-angle-expand mr-1"></i>{item.sqft} sqft</span>
                  </div>
                  
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      {item.originalPrice && (
                        <span className="text-sm sm:text-base text-gray-400 line-through mr-2">
                          ${item.originalPrice}/night
                        </span>
                      )}
                      <span className="text-xl font-bold text-green-600">
                        ${item.price}
                        <span className="text-sm sm:text-base font-normal text-gray-600">/night</span>
                      </span>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <p className="text-sm sm:text-base text-gray-500 italic mb-3 line-clamp-2">
                      <i className="bi bi-sticky mr-1"></i>{item.notes}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex-1 px-3 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base font-medium cursor-pointer"
                    >
                      <i className="bi bi-eye mr-1"></i><span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => handleMoveToBookings(item)}
                      className="flex-1 px-3 py-2 text-white rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer"
                      style={{ backgroundColor: '#083A85' }}
                    >
                      <i className="bi bi-cart-plus mr-1"></i><span className="hidden sm:inline">Book</span>
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal(item)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Add review & notes"
                    >
                      <i className="bi bi-pencil text-lg"></i>
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <i className="bi bi-trash text-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {!loading && filteredItems.length > 0 && viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-xl overflow-x-auto">
            <table className="w-full text-base">
              <thead className="bg-gray-50 border-b border-gray-200 hidden sm:table-header-group">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-700 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('price')}
                      className="font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                    >
                      Price
                      <i className={`bi bi-chevron-${sortField === 'price' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                    >
                      Status
                      <i className={`bi bi-chevron-${sortField === 'status' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('addedDate')}
                      className="font-medium text-gray-700 uppercase tracking-wider flex items-center gap-1 hover:text-gray-900 cursor-pointer"
                    >
                      Added
                      <i className={`bi bi-chevron-${sortField === 'addedDate' && sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors block sm:table-row p-4 sm:p-0">
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0">
                      <div className="flex items-center">
                        <img 
                          src={item.image} 
                          alt={item.title}
                          className="w-12 h-12 rounded-lg object-cover mr-3 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 flex items-center gap-2 truncate">
                            {item.title}
                            {item.userRating && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex-shrink-0">
                                <i className="bi bi-star-fill text-xs"></i> {item.userRating}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0">
                      <div className="text-gray-600">
                        <i className="bi bi-geo-alt text-gray-400 mr-1"></i>
                        {item.location}
                      </div>
                    </td>
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0">
                      <div>
                        {item.originalPrice && (
                          <span className="text-gray-400 line-through block">
                            ${item.originalPrice}
                          </span>
                        )}
                        <span className="font-medium text-gray-900">
                          ${item.price}/night
                        </span>
                      </div>
                    </td>
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0">
                      <span className={`px-2 py-1 inline-flex text-xs sm:text-sm leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status === 'price-dropped' ? 'Price Drop' : item.status}
                      </span>
                    </td>
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0">
                      <div className="text-gray-500">
                        {format(item.addedDate, 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="sm:px-6 sm:py-4 whitespace-nowrap block sm:table-cell mb-2 sm:mb-0 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleViewDetails(item)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="View details"
                        >
                          <i className="bi bi-eye text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleMoveToBookings(item)}
                          className="text-green-600 hover:text-green-900 cursor-pointer"
                          title="Move to bookings"
                        >
                          <i className="bi bi-cart-plus text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleOpenReviewModal(item)}
                          className="text-gray-600 hover:text-gray-900 cursor-pointer"
                          title="Add review & notes"
                        >
                          <i className="bi bi-pencil text-lg"></i>
                        </button>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-red-600 hover:text-red-900 cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <i className="bi bi-trash text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <i className="bi bi-chevron-left"></i>
              </button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                        currentPage === pageNum
                          ? 'text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                      style={{ 
                        backgroundColor: currentPage === pageNum ? '#083A85' : undefined 
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>

            {/* Go to page */}
            <div className="flex items-center gap-2">
              <span className="text-base text-gray-600">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPageInput}
                onChange={(e) => setGoToPageInput(e.target.value)}
                onBlur={(e) => handleGoToPage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGoToPage((e.target as HTMLInputElement).value);
                  }
                }}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
              <span className="text-base text-gray-600">of {totalPages}</span>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="relative">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.title}
                  className="w-full h-48 sm:h-64 object-cover rounded-t-lg"
                />
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 bg-gray-400 rounded-full p-2 shadow-xl hover:bg-red-500 cursor-pointer"
                >
                  <i className="bi bi-x-lg text-white"></i>
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedItem.title}</h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                      <i className="bi bi-geo-alt mr-1"></i>
                      {selectedItem.location}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm sm:text-base font-semibold rounded-full mt-2 sm:mt-0 ${getStatusColor(selectedItem.status)}`}>
                    {selectedItem.status === 'price-dropped' ? 'Price Drop' : selectedItem.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-door-open text-gray-600 text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Bedrooms</p>
                    <p className="font-semibold text-base">{selectedItem.bedrooms}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-droplet text-gray-600 text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Bathrooms</p>
                    <p className="font-semibold text-base">{selectedItem.bathrooms}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-arrows-angle-expand text-gray-600 text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Square Feet</p>
                    <p className="font-semibold text-base">{selectedItem.sqft}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <i className="bi bi-tag text-gray-600 text-xl mb-1"></i>
                    <p className="text-sm sm:text-base text-gray-600">Category</p>
                    <p className="font-semibold text-base capitalize">{selectedItem.category}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-2">Pricing</h3>
                  <div className="flex flex-wrap items-baseline gap-3">
                    {selectedItem.originalPrice && (
                      <span className="text-xl text-gray-400 line-through">
                        ${selectedItem.originalPrice}/night
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                      ${selectedItem.price}
                      <span className="text-base sm:text-lg font-normal text-gray-900">/night</span>
                    </span>
                    {selectedItem.originalPrice && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-sm sm:text-base font-semibold">
                        Save ${selectedItem.originalPrice - selectedItem.price}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Rating & Reviews</h3>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
                    <div className="flex items-center">
                      <i className="bi bi-star-fill text-yellow-400 text-xl"></i>
                      <span className="text-xl font-semibold ml-1">{selectedItem.rating}</span>
                    </div>
                    <span className="text-gray-600 text-sm sm:text-base">({selectedItem.reviews} reviews)</span>
                    {selectedItem.userRating && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                        Your rating: {selectedItem.userRating}/5
                      </span>
                    )}
                  </div>
                </div>

                {selectedItem.userReview && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Your Review</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-base">
                      <i className="bi bi-chat-quote mr-2"></i>
                      {selectedItem.userReview}
                    </p>
                  </div>
                )}

                {selectedItem.notes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Your Notes</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3 text-base">
                      <i className="bi bi-sticky mr-2"></i>
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Added to Wishlist</h3>
                  <p className="text-gray-600 text-base">
                    <i className="bi bi-calendar mr-2"></i>
                    {format(selectedItem.addedDate, 'MMM dd, yyyy')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      handleMoveToBookings(selectedItem);
                      setShowModal(false);
                    }}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium cursor-pointer text-sm sm:text-base"
                    style={{ backgroundColor: '#083A85' }}
                  >
                    <i className="bi bi-cart-plus mr-2"></i>
                    Move to Bookings
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      handleOpenReviewModal(selectedItem);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <i className="bi bi-pencil mr-2"></i>
                    Add Review & Notes
                  </button>
                  <button
                    onClick={() => {
                      handleRemove(selectedItem.id);
                      setShowModal(false);
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <i className="bi bi-trash mr-2"></i>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review, Rating & Notes Modal */}
        {showReviewModal && selectedItem && (
          <div className="fixed inset-0 backdrop-blur-md bg-gray-900/30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md sm:max-w-xl md:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Review & Notes</h3>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="text-gray-400 hover:text-red-600 cursor-pointer"
                  >
                    <i className="bi bi-x-lg text-2xl"></i>
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{selectedItem.title}</p>
                      <p className="text-sm sm:text-base text-gray-600">
                        <i className="bi bi-geo-alt mr-1"></i>
                        {selectedItem.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="mb-6">
                  <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                    <i className="bi bi-star-fill text-yellow-400 mr-2"></i>
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditingRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        <i 
                          className={`bi ${
                            star <= (hoverRating || editingRating) 
                              ? 'bi-star-fill text-yellow-400' 
                              : 'bi-star text-gray-300'
                          } text-3xl`}
                        ></i>
                      </button>
                    ))}
                    <span className="ml-3 text-base sm:text-lg text-gray-600">
                      {editingRating > 0 && `${editingRating}/5`}
                    </span>
                  </div>
                </div>

                {/* Review Section */}
                <div className="mb-6">
                  <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                    <i className="bi bi-chat-quote mr-2"></i>
                    Your Review
                  </label>
                  <textarea
                    value={editingReview}
                    onChange={(e) => setEditingReview(e.target.value)}
                    placeholder="Share your thoughts about this property..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
                    rows={4}
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {editingReview.length}/500 characters
                  </p>
                </div>

                {/* Notes Section */}
                <div className="mb-6">
                  <label className="block text-base sm:text-lg font-medium text-gray-700 mb-3">
                    <i className="bi bi-sticky mr-2"></i>
                    Personal Notes
                  </label>
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add private notes about this property (only visible to you)..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
                    rows={3}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSaveReview}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-colors font-medium cursor-pointer text-sm sm:text-base"
                    style={{ backgroundColor: '#083A85' }}
                  >
                    <i className="bi bi-check-lg mr-2"></i>
                    Save All
                  </button>
                  <button
                    onClick={() => {
                      setEditingRating(selectedItem.userRating || 0);
                      setEditingReview(selectedItem.userReview || '');
                      setEditingNotes(selectedItem.notes || '');
                    }}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    <i className="bi bi-arrow-clockwise mr-2"></i>
                    Reset
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;