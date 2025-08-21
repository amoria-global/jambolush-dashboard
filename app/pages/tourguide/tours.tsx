"use client"
import React, { useState } from 'react';

interface Tour {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  maxGuests: number;
  status: 'active' | 'draft' | 'paused';
  category: string;
  image: string;
  rating: number;
  totalBookings: number;
  nextBooking?: string;
}

const TourGuideMyTours: React.FC = () => {
  const [tours, setTours] = useState<Tour[]>([
    {
      id: '1',
      title: 'City Heritage Walk',
      description: 'Explore the historic downtown area with fascinating stories and hidden gems.',
      duration: 2,
      price: 35,
      maxGuests: 15,
      status: 'active',
      category: 'History',
      image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=250&fit=crop',
      rating: 4.8,
      totalBookings: 142,
      nextBooking: '2024-08-22T10:00'
    },
    {
      id: '2',
      title: 'Food Discovery Tour',
      description: 'Taste authentic local cuisine and discover the best food spots in the city.',
      duration: 3,
      price: 55,
      maxGuests: 8,
      status: 'active',
      category: 'Food',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop',
      rating: 4.9,
      totalBookings: 89,
      nextBooking: '2024-08-23T14:00'
    },
    {
      id: '3',
      title: 'Sunset Photography Tour',
      description: 'Capture stunning photos at the best sunset spots with professional tips.',
      duration: 4,
      price: 75,
      maxGuests: 6,
      status: 'draft',
      category: 'Photography',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
      rating: 0,
      totalBookings: 0
    }
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [newTour, setNewTour] = useState<Omit<Tour, 'id' | 'rating' | 'totalBookings'>>({
    title: '',
    description: '',
    duration: 2,
    price: 50,
    maxGuests: 10,
    status: 'draft',
    category: 'History',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
    nextBooking: undefined
  });

  const filteredTours = tours.filter(tour => {
    const statusMatch = filterStatus === 'all' || tour.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || tour.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  const handleAddTour = () => {
    const id = (Math.max(...tours.map(t => parseInt(t.id))) + 1).toString();
    const tour: Tour = {
      ...newTour,
      id,
      rating: 0,
      totalBookings: 0
    };
    setTours([...tours, tour]);
    setShowAddModal(false);
    setNewTour({
      title: '',
      description: '',
      duration: 2,
      price: 50,
      maxGuests: 10,
      status: 'draft',
      category: 'History',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
      nextBooking: undefined
    });
  };

  const handleEditTour = (tour: Tour) => {
    setEditingTour({ ...tour });
    setShowEditModal(true);
    setDropdownOpen(null);
  };

  const handleSaveTour = () => {
    if (editingTour) {
      setTours(tours.map(tour => 
        tour.id === editingTour.id ? editingTour : tour
      ));
      setShowEditModal(false);
      setEditingTour(null);
    }
  };

  const handleStatusChange = (tourId: string, newStatus: 'active' | 'draft' | 'paused') => {
    setTours(tours.map(tour => 
      tour.id === tourId ? { ...tour, status: newStatus } : tour
    ));
    setDropdownOpen(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-blue-900', text: 'text-white', icon: 'bi-check-circle' },
      draft: { bg: 'bg-gray-500', text: 'text-white', icon: 'bi-pencil' },
      paused: { bg: 'bg-pink-600', text: 'text-white', icon: 'bi-pause-circle' }
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`${config.bg} ${config.text} px-2 py-1 rounded-full text-xs flex items-center gap-1`}>
        <i className={`bi ${config.icon}`}></i>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="mt-20">
      {/* Header */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="text-xl font-semibold text-blue-900 mb-1">
              <i className="bi bi-map mr-2 text-pink-600"></i>
              My Tours
            </h4>
            <small className="text-gray-500">{tours.length} tours managed</small>
          </div>
          <button 
            className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700 transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus mr-1"></i>
            New Tour
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <div>
            <select 
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div>
            <select 
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="History">History</option>
              <option value="Food">Food</option>
              <option value="Photography">Photography</option>
              <option value="Adventure">Adventure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTours.map((tour) => (
          <div key={tour.id} className="h-full">
            <div className="bg-white rounded-lg shadow-sm border-0 h-full flex flex-col">
              <div className="relative">
                <img 
                  src={tour.image} 
                  alt={tour.title}
                  className="w-full h-36 object-cover rounded-t-lg"
                />
                <div className="absolute top-0 left-0 m-2">
                  {getStatusBadge(tour.status)}
                </div>
                <div className="absolute top-0 right-0 m-2">
                  <div className="relative">
                    <button 
                      className="w-8 h-8 bg-white bg-opacity-80 text-gray-700 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                      onClick={() => setDropdownOpen(dropdownOpen === tour.id ? null : tour.id)}
                    >
                      <i className="bi bi-three-dots"></i>
                    </button>
                    {dropdownOpen === tour.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 min-w-32 z-10">
                        <button 
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                          onClick={() => handleEditTour(tour)}
                        >
                          <i className="bi bi-pencil mr-2"></i>Edit
                        </button>
                        <button 
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center"
                          onClick={() => handleStatusChange(tour.id, 
                            tour.status === 'active' ? 'paused' : 'active'
                          )}
                        >
                          <i className={`bi ${tour.status === 'active' ? 'bi-pause' : 'bi-play'} mr-2`}></i>
                          {tour.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <h6 className="font-semibold text-blue-900 mb-2 text-sm">
                  {tour.title}
                </h6>
                <p className="text-gray-500 mb-2 text-xs leading-relaxed">
                  {tour.description}
                </p>

                {/* Tour Details */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className="text-gray-500">
                      <i className="bi bi-clock mr-1"></i>
                      {tour.duration}h
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">
                      <i className="bi bi-people mr-1"></i>
                      Max {tour.maxGuests}
                    </span>
                  </div>
                  <div>
                    <span className="text-pink-600 font-bold">
                      <i className="bi bi-currency-dollar"></i>
                      {tour.price}
                    </span>
                  </div>
                  <div>
                    {tour.rating > 0 && (
                      <span className="text-gray-500">
                        <i className="bi bi-star-fill mr-1 text-pink-600"></i>
                        {tour.rating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center mb-2 text-xs">
                  <small className="text-gray-500">
                    <i className="bi bi-calendar-check mr-1"></i>
                    {tour.totalBookings} bookings
                  </small>
                  {tour.nextBooking && (
                    <small className="text-blue-900">
                      Next: {new Date(tour.nextBooking).toLocaleDateString()}
                    </small>
                  )}
                </div>

                <div className="mt-auto">
                  <button 
                    className="w-full border border-blue-900 text-blue-900 py-1 rounded text-sm hover:bg-blue-50 transition-colors"
                    onClick={() => handleEditTour(tour)}
                  >
                    <i className="bi bi-pencil mr-1"></i>
                    Edit Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTours.length === 0 && (
        <div className="text-center py-12">
          <i className="bi bi-map text-5xl text-blue-900"></i>
          <h5 className="mt-3 text-lg text-blue-900">No tours found</h5>
          <p className="text-gray-500">Try adjusting your filters or create a new tour.</p>
        </div>
      )}

      {/* Add Tour Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="bg-pink-600 text-white p-3 rounded-t-lg flex justify-between items-center">
              <h5 className="text-base font-semibold">
                <i className="bi bi-plus mr-2"></i>
                Add New Tour
              </h5>
              <button 
                className="text-white hover:text-gray-300 text-xl"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Tour Title
                  </label>
                  <input 
                    type="text"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.title}
                    onChange={(e) => setNewTour({...newTour, title: e.target.value})}
                    placeholder="Enter tour title"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Description
                  </label>
                  <textarea 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    value={newTour.description}
                    onChange={(e) => setNewTour({...newTour, description: e.target.value})}
                    placeholder="Describe your tour experience"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Duration (hours)
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.duration}
                    onChange={(e) => setNewTour({...newTour, duration: Number(e.target.value)})}
                    min="1"
                    max="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Price ($)
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.price}
                    onChange={(e) => setNewTour({...newTour, price: Number(e.target.value)})}
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Max Guests
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.maxGuests}
                    onChange={(e) => setNewTour({...newTour, maxGuests: Number(e.target.value)})}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Category
                  </label>
                  <select 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.category}
                    onChange={(e) => setNewTour({...newTour, category: e.target.value})}
                  >
                    <option value="History">History</option>
                    <option value="Food">Food</option>
                    <option value="Photography">Photography</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Culture">Culture</option>
                    <option value="Nature">Nature</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Tour Image
                  </label>
                  <select 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.image}
                    onChange={(e) => setNewTour({...newTour, image: e.target.value})}
                  >
                    <option value="https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&h=250&fit=crop">Historic City</option>
                    <option value="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop">Food & Restaurant</option>
                    <option value="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop">Sunset Landscape</option>
                    <option value="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop">Architecture</option>
                    <option value="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=250&fit=crop">Beach & Ocean</option>
                    <option value="https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=250&fit=crop">Mountain Adventure</option>
                    <option value="https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=400&h=250&fit=crop">Cultural Experience</option>
                    <option value="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop">Forest & Nature</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={newTour.status}
                    onChange={(e) => setNewTour({...newTour, status: e.target.value as 'active' | 'draft' | 'paused'})}
                  >
                    <option value="draft">Draft - Not visible to customers</option>
                    <option value="active">Active - Available for booking</option>
                    <option value="paused">Paused - Temporarily unavailable</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 border-t">
              <button 
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddTour}
                disabled={!newTour.title.trim() || !newTour.description.trim()}
              >
                <i className="bi bi-plus mr-1"></i>
                Create Tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTour && (
        <div 
          className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto">
            <div className="bg-blue-900 text-white p-3 rounded-t-lg flex justify-between items-center">
              <h5 className="text-base font-semibold">
                <i className="bi bi-pencil mr-2"></i>
                Edit Tour
              </h5>
              <button 
                className="text-white hover:text-gray-300 text-xl"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Tour Title
                  </label>
                  <input 
                    type="text"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.title}
                    onChange={(e) => setEditingTour({...editingTour, title: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Description
                  </label>
                  <textarea 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={editingTour.description}
                    onChange={(e) => setEditingTour({...editingTour, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Duration (hours)
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.duration}
                    onChange={(e) => setEditingTour({...editingTour, duration: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Price ($)
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.price}
                    onChange={(e) => setEditingTour({...editingTour, price: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Max Guests
                  </label>
                  <input 
                    type="number"
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.maxGuests}
                    onChange={(e) => setEditingTour({...editingTour, maxGuests: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Category
                  </label>
                  <select 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.category}
                    onChange={(e) => setEditingTour({...editingTour, category: e.target.value})}
                  >
                    <option value="History">History</option>
                    <option value="Food">Food</option>
                    <option value="Photography">Photography</option>
                    <option value="Adventure">Adventure</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTour.status}
                    onChange={(e) => setEditingTour({...editingTour, status: e.target.value as 'active' | 'draft' | 'paused'})}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-3 border-t">
              <button 
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3 py-1 text-sm bg-pink-600 text-white rounded hover:bg-pink-700 transition-colors"
                onClick={handleSaveTour}
              >
                <i className="bi bi-check mr-1"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside handler for dropdown */}
      {dropdownOpen && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
};

export default TourGuideMyTours;