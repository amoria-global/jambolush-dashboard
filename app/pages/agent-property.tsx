"use client";
import Link from 'next/link';   
import React, { useState, useEffect, useMemo } from 'react';

// Types
interface Property {
  id: string;
  propertyName: string;
  address: string;
  imageUrl: string;
  price: number;
  status: 'for sale' | 'for rent' | 'sold' | 'rented';
  propertyType: 'House' | 'Apartment' | 'Villa' | 'Condo';
  bedrooms: number;
  bathrooms: number;
  area: number; // in sqft
  dateListed: Date;
  description?: string;
}

type ViewMode = 'grid' | 'list';
type SortField = 'propertyName' | 'price' | 'dateListed' | 'area';
type SortOrder = 'asc' | 'desc';

const AgentPropertiesPage: React.FC = () => {
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
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('dateListed');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Mock data generation
  useEffect(() => {
    const generateMockProperties = (): Property[] => {
      const statuses: ('for sale' | 'for rent' | 'sold' | 'rented')[] = 
        ['for sale', 'for rent', 'sold', 'rented'];
      const propertyTypes: ('House' | 'Apartment' | 'Villa' | 'Condo')[] = 
        ['House', 'Apartment', 'Villa', 'Condo'];
      const propertyNames = [
        'Serene Villa', 'Modern Downtown Loft', 'Rustic Mountain Cabin',
        'Beachfront Paradise', 'Skyline Penthouse', 'Cozy Garden Cottage',
        'Luxury Estate', 'Chic Urban Apartment', 'Lakeside Retreat'
      ];
      const addresses = [
        '123 Ocean Drive, Miami', '456 City Center, New York', '789 Pine Rd, Aspen',
        '101 Beach Blvd, Malibu', '202 High St, Chicago', '303 Oak Lane, Nashville',
        '404 Maple Ave, Beverly Hills', '505 Central Park, New York', '606 Lakeview, Tahoe'
      ];

      return Array.from({ length: 34 }, (_, i) => {
        const dateListed = new Date(2025, 0, Math.floor(Math.random() * 60) + 1);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const type = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
        
        return {
          id: `PROP${String(i + 1).padStart(5, '0')}`,
          propertyName: `${propertyNames[Math.floor(Math.random() * propertyNames.length)]}`,
          address: `${addresses[Math.floor(Math.random() * addresses.length)]}`,
          imageUrl: `https://picsum.photos/seed/${i+1}/600/400`,
          price: (status === 'for rent' || status === 'rented') 
            ? Math.floor(Math.random() * 4000) + 1500 
            : Math.floor(Math.random() * 1500000) + 250000,
          status,
          propertyType: type,
          bedrooms: Math.floor(Math.random() * 5) + 1,
          bathrooms: Math.floor(Math.random() * 4) + 1,
          area: Math.floor(Math.random() * 3000) + 800,
          dateListed,
          description: 'A stunning property with breathtaking views and modern amenities. Features an open-concept living space, gourmet kitchen, and a luxurious master suite. Perfect for families or as a high-end investment.',
        };
      });
    };

    setTimeout(() => {
      setProperties(generateMockProperties());
      setLoading(false);
    }, 1200);
  }, []);

  // Update goToPageInput when currentPage changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return {
      total: properties.length,
      forSale: properties.filter(p => p.status === 'for sale').length,
      forRent: properties.filter(p => p.status === 'for rent').length,
      soldOrRented: properties.filter(p => p.status === 'sold' || p.status === 'rented').length,
      totalValue: properties
        .filter(p => p.status === 'for sale')
        .reduce((sum, p) => sum + p.price, 0)
    };
  }, [properties]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = [...properties];

    // Search filter (name or address)
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.propertyType === typeFilter);
    }
    
    // Price range filter
    if (priceRangeFilter !== 'all') {
        const [min, max] = priceRangeFilter.split('-').map(Number);
        filtered = filtered.filter(p => p.price >= min && (max ? p.price <= max : true));
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'propertyName':
          comparison = a.propertyName.localeCompare(b.propertyName);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'area':
          comparison = a.area - b.area;
          break;
        case 'dateListed':
          comparison = a.dateListed.getTime() - b.dateListed.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredProperties(filtered);
    setCurrentPage(1);
  }, [properties, searchTerm, statusFilter, typeFilter, priceRangeFilter, sortField, sortOrder]);

  // Pagination
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  // Handlers
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowDetailModal(true);
  };

  const handleDeleteProperty = (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      setProperties(prev => prev.filter(p => p.id !== propertyId));
      setShowDetailModal(false); // Close modal if open
      alert('Property deleted.');
    }
  };

  const handleGoToPage = (value: string) => {
    const page = parseInt(value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setGoToPageInput(currentPage.toString());
  };

  // UI Helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'for sale': return 'bg-blue-100 text-blue-800';
      case 'for rent': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-green-100 text-green-800';
      case 'rented': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-14 font-sans">
      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
      <div className="mx-auto px-2 sm:px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Properties</h1>
          <p className="text-gray-600 mt-2">Manage your active and completed property listings.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-4 transition-transform hover:scale-105">
            <p className="text-base text-gray-600">Total Properties</p>
            <p className="text-2xl font-bold text-gray-900">{summaryStats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg shadow-lg p-4 transition-transform hover:scale-105">
            <p className="text-base text-gray-600">For Sale</p>
            <p className="text-2xl font-bold text-blue-600">{summaryStats.forSale}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg shadow-lg p-4 transition-transform hover:scale-105">
            <p className="text-base text-gray-600">For Rent</p>
            <p className="text-2xl font-bold text-yellow-600">{summaryStats.forRent}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-lg shadow-lg p-4 transition-transform hover:scale-105">
            <p className="text-base text-gray-600">Sold / Rented</p>
            <p className="text-2xl font-bold text-green-600">{summaryStats.soldOrRented}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg shadow-lg p-4 transition-transform hover:scale-105">
            <p className="text-base text-gray-600">Total Listing Value</p>
            <p className="text-2xl font-bold text-indigo-600">${(summaryStats.totalValue / 1_000_000).toFixed(2)}M</p>
          </div>
        </div>
        
        {/* Add Property Button */}
        <div className="mb-6 text-right">
            <Link href="/all/add-property" className="inline-block px-5 py-2.5 rounded-lg text-white text-base font-medium transition-transform hover:scale-105 cursor-pointer" style={{ backgroundColor: '#F20C8F' }}>
                <i className="bi bi-plus-lg mr-2"></i>Add Property
            </Link>
        </div>


        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-1">
                    <label htmlFor="search-input" className="block text-base font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                        <input id="search-input" type="text" placeholder="Property name or address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    </div>
                </div>

                {/* Status Filter */}
                <div>
                    <label htmlFor="status-filter" className="block text-base font-medium text-gray-700 mb-2 cursor-pointer">Listing Status</label>
                    <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="all">All Statuses</option>
                        <option value="for sale">For Sale</option>
                        <option value="for rent">For Rent</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                    </select>
                </div>
                
                {/* Type Filter */}
                <div>
                    <label htmlFor="type-filter" className="block text-base font-medium text-gray-700 mb-2 cursor-pointer">Property Type</label>
                    <select id="type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="all">All Types</option>
                        <option value="House">House</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Condo">Condo</option>
                    </select>
                </div>

                {/* Price Range Filter */}
                <div>
                    <label htmlFor="price-filter" className="block text-base font-medium text-gray-700 mb-2 cursor-pointer">Price Range</label>
                    <select id="price-filter" value={priceRangeFilter} onChange={(e) => setPriceRangeFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                        <option value="all">Any Price</option>
                        <option value="0-3000">Up to $3,000 (Rent)</option>
                        <option value="3000-5000">$3,000 - $5,000 (Rent)</option>
                        <option value="0-500000">Up to $500k (Sale)</option>
                        <option value="500000-1000000">$500k - $1M (Sale)</option>
                        <option value="1000000-">$1M+ (Sale)</option>
                    </select>
                </div>
            </div>

            {/* View Mode Toggle & Results Count */}
            <div className="flex justify-between items-center mt-6 border-t pt-4">
                <p className="text-base text-gray-600">
                    Showing {paginatedProperties.length} of {filteredProperties.length} properties
                </p>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('grid')} className={`px-4 py-2.5 rounded-lg transition-colors text-base font-medium cursor-pointer ${viewMode === 'grid' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{ backgroundColor: viewMode === 'grid' ? '#083A85' : undefined }}>
                        <i className="bi bi-grid-3x3-gap-fill mr-2"></i>Grid View
                    </button>
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2.5 rounded-lg transition-colors text-base font-medium cursor-pointer ${viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{ backgroundColor: viewMode === 'list' ? '#083A85' : undefined }}>
                        <i className="bi bi-list-task mr-2"></i>List View
                    </button>
                </div>
            </div>
        </div>

        {/* Loading & Empty States */}
        {loading && <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div></div>}
        {!loading && filteredProperties.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <i className="bi bi-house-slash text-6xl text-gray-300"></i>
                <h3 className="text-xl font-medium text-gray-800 mt-4">{properties.length === 0 ? "You have no properties listed" : "No properties found"}</h3>
                <p className="text-gray-500 mt-2">{properties.length === 0 ? "Click 'Add Property' to get started" : "Try adjusting your filters or search term."}</p>
            </div>
        )}

        {/* Grid View */}
        {!loading && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProperties.map((p) => (
                    <div key={p.id} className="bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                        <div className="relative">
                            <img src={p.imageUrl} alt={p.propertyName} className="w-full h-56 object-cover"/>
                            <span className={`absolute top-3 left-3 px-3 py-1 text-base font-bold rounded-full uppercase tracking-wider ${getStatusColor(p.status)}`}>{p.status}</span>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{p.propertyName}</h3>
                            <p className="text-base text-gray-500 mb-3 truncate">{p.address}</p>
                            <p className="text-2xl font-bold text-gray-800 mb-3">${p.price.toLocaleString()}{p.status.includes('rent') ? ' / mo' : ''}</p>
                            <div className="flex justify-around text-center text-base text-gray-600 border-t border-b py-3 my-3">
                                <span><i className="bi bi-rulers mr-1"></i>{p.area} sqft</span>
                                <span><i className="bi bi-door-open-fill mr-1"></i>{p.bedrooms} beds</span>
                                <span><i className="bi bi-droplet-fill mr-1"></i>{p.bathrooms} baths</span>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <button onClick={() => handleViewDetails(p)} className="flex-1 px-3 py-2.5 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors text-base font-medium cursor-pointer"><i className="bi bi-eye mr-1"></i>View</button>
                                <Link href={`/all/edit-property?id=${p.id}`} className="flex-1 text-center px-3 py-2.5 text-white rounded-lg transition-colors text-base font-medium cursor-pointer" style={{ backgroundColor: '#083A85' }}><i className="bi bi-pencil-square mr-1"></i>Edit</Link>
                                <button onClick={() => handleDeleteProperty(p.id)} className="p-2 text-red-600 hover:text-red-800 rounded-lg transition-colors cursor-pointer" title="Delete Property"><i className="bi bi-trash3"></i></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                <th className="px-6 py-4 text-left"><button onClick={() => handleSort('price')} className="text-base font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:text-gray-800 cursor-pointer">Price <i className={`bi bi-arrow-${sortField === 'price' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down-up'}`}></i></button></th>
                                <th className="px-6 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-base font-medium text-gray-500 uppercase tracking-wider">Specs</th>
                                <th className="px-6 py-4 text-left"><button onClick={() => handleSort('dateListed')} className="text-base font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1 hover:text-gray-800 cursor-pointer">Date Listed <i className={`bi bi-arrow-${sortField === 'dateListed' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down-up'}`}></i></button></th>
                                <th className="px-6 py-4 text-right text-base font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProperties.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img src={p.imageUrl} alt={p.propertyName} className="w-28 h-20 rounded-md object-cover mr-4"/>
                                            <div>
                                                <div className="text-base font-semibold text-gray-900">{p.propertyName}</div>
                                                <div className="text-base text-gray-500">{p.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-800">${p.price.toLocaleString()}{p.status.includes('rent') ? '/mo' : ''}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full ${getStatusColor(p.status)}`}>{p.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{p.bedrooms} bed, {p.bathrooms} bath, {p.area} sqft</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600">{format(p.dateListed, 'MMM dd, yyyy')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium">
                                        <button onClick={() => handleViewDetails(p)} className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer" title="View details"><i className="bi bi-search"></i></button>
                                        <Link href={`/all/edit-property?id=${p.id}`} className="text-green-600 hover:text-green-900 mr-4 cursor-pointer" title="Edit property"><i className="bi bi-pencil-fill"></i></Link>
                                        <button onClick={() => handleDeleteProperty(p.id)} className="text-red-600 hover:text-red-800 cursor-pointer" title="Delete property"><i className="bi bi-trash-fill"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Pagination Controls */}
{!loading && totalPages > 1 && (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
        {/* Pagination Buttons */}
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
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
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
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
        
        {/* Go to page input */}
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
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
            <span className="text-base text-gray-600">of {totalPages}</span>
        </div>
    </div>
)}

        {/* Detail Modal */}
        {showDetailModal && selectedProperty && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{selectedProperty.propertyName}</h2>
                                <p className="text-gray-500 mt-1">{selectedProperty.address}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-red-500 cursor-pointer"><i className="bi bi-x-lg text-xl"></i></button>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <img src={selectedProperty.imageUrl} alt={selectedProperty.propertyName} className="w-full h-80 rounded-lg object-cover mb-4"/>
                                <h3 className="text-lg font-semibold mb-2">Description</h3>
                                <p className="text-gray-600">{selectedProperty.description}</p>
                            </div>
                            <div>
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <p className="text-3xl font-bold text-gray-800">${selectedProperty.price.toLocaleString()}{selectedProperty.status.includes('rent') ? ' / month' : ''}</p>
                                    <span className={`mt-2 px-3 py-1 inline-flex text-base font-bold rounded-full ${getStatusColor(selectedProperty.status)}`}>{selectedProperty.status}</span>
                                </div>
                                <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                                <div className="grid grid-cols-2 gap-4 text-base">
                                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Type</p><p className="font-semibold">{selectedProperty.propertyType}</p></div>
                                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Area</p><p className="font-semibold">{selectedProperty.area} sqft</p></div>
                                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Bedrooms</p><p className="font-semibold">{selectedProperty.bedrooms}</p></div>
                                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Bathrooms</p><p className="font-semibold">{selectedProperty.bathrooms}</p></div>
                                    <div className="bg-gray-50 rounded-lg p-3 col-span-2"><p className="text-gray-500">Date Listed</p><p className="font-semibold">{format(selectedProperty.dateListed, 'MMM dd, yyyy')}</p></div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <Link href={`/all/edit-property?id=${selectedProperty.id}`} className="flex-1 text-center px-6 py-3 text-white rounded-lg font-medium cursor-pointer" style={{ backgroundColor: '#083A85' }}><i className="bi bi-pencil mr-2"></i>Edit Property</Link>
                                    <button onClick={() => handleDeleteProperty(selectedProperty.id)} className="flex-1 px-6 py-3 bg-red-600 text-red-100 rounded-lg hover:bg-red-700 font-medium cursor-pointer"><i className="bi bi-trash mr-2"></i>Delete Property</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AgentPropertiesPage;
