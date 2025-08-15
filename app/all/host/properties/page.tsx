"use client";
import React, { useState } from 'react';
import Link from 'next/link';

type PropertyStatus = 'active' | 'pending' | 'checkedin' | 'checkedout' | 'inactive';
type ViewType = 'grid' | 'table';

interface Property {
    id: string;
    title: string;
    price: number;
    location: string;
    agentId: string;
    agentName: string;
    status: PropertyStatus;
    clientName?: string;
    clientId?: string;
    image: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    unavailableUntil?: string;
}

interface StatusCard {
    label: string;
    count: number;
    icon: string;
    bgColor: string;
}

const HostPropertiesPage: React.FC = () => {
    const [viewType, setViewType] = useState<ViewType>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [unavailableDate, setUnavailableDate] = useState('');
    const itemsPerPage = 12;

    // Mock data - replace with API call
    const properties: Property[] = [
        {
            id: 'P001',
            title: 'Luxury Villa Kilimani',
            price: 250000,
            location: 'Kilimani, Nairobi',
            agentId: 'A001',
            agentName: 'Jane Mwangi',
            status: 'active',
            image: '/api/placeholder/400/300',
            bedrooms: 4,
            bathrooms: 3,
            area: 2500
        },
        {
            id: 'P002',
            title: 'Modern Apartment Westlands',
            price: 150000,
            location: 'Westlands, Nairobi',
            agentId: 'A002',
            agentName: 'John Kamau',
            status: 'checkedin',
            clientName: 'Michael Smith',
            clientId: 'C001',
            image: '/api/placeholder/400/300',
            bedrooms: 3,
            bathrooms: 2,
            area: 1800
        },
        {
            id: 'P003',
            title: 'Cozy Studio Karen',
            price: 75000,
            location: 'Karen, Nairobi',
            agentId: 'A001',
            agentName: 'Jane Mwangi',
            status: 'pending',
            image: '/api/placeholder/400/300',
            bedrooms: 1,
            bathrooms: 1,
            area: 800
        },
        {
            id: 'P004',
            title: 'Executive Penthouse CBD',
            price: 350000,
            location: 'CBD, Nairobi',
            agentId: 'A003',
            agentName: 'Sarah Ochieng',
            status: 'checkedout',
            image: '/api/placeholder/400/300',
            bedrooms: 5,
            bathrooms: 4,
            area: 3500
        },
        {
            id: 'P005',
            title: 'Garden Estate Runda',
            price: 450000,
            location: 'Runda, Nairobi',
            agentId: 'A002',
            agentName: 'John Kamau',
            status: 'inactive',
            unavailableUntil: '2025-09-15',
            image: '/api/placeholder/400/300',
            bedrooms: 6,
            bathrooms: 5,
            area: 4000
        },
        // Add more mock properties for pagination
    ];

    const statusCards: StatusCard[] = [
        {
            label: 'Total Properties',
            count: properties.length,
            icon: 'bi-building',
            bgColor: '#083A85'
        },
        {
            label: 'Active',
            count: properties.filter(p => p.status === 'active').length,
            icon: 'bi-check-circle',
            bgColor: '#10B981'
        },
        {
            label: 'Pending',
            count: properties.filter(p => p.status === 'pending').length,
            icon: 'bi-clock',
            bgColor: '#F59E0B'
        },
        {
            label: 'Checked In',
            count: properties.filter(p => p.status === 'checkedin').length,
            icon: 'bi-door-open',
            bgColor: '#3B82F6'
        },
        {
            label: 'Checked Out',
            count: properties.filter(p => p.status === 'checkedout').length,
            icon: 'bi-door-closed',
            bgColor: '#8B5CF6'
        },
        {
            label: 'Inactive',
            count: properties.filter(p => p.status === 'inactive').length,
            icon: 'bi-x-circle',
            bgColor: '#EF4444'
        }
    ];

    const getStatusBadge = (status: PropertyStatus) => {
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            checkedin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Checked In' },
            checkedout: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Checked Out' },
            inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactive' }
        };
        const config = statusConfig[status];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const handleEdit = (property: Property) => {
        setEditingProperty(property);
        setUnavailableDate(property.unavailableUntil || '');
        setShowEditModal(true);
    };

    const handleSaveEdit = () => {
        // Handle save logic here
        console.log('Saving property:', editingProperty?.id, 'Unavailable until:', unavailableDate);
        setShowEditModal(false);
        setEditingProperty(null);
        setUnavailableDate('');
    };

    // Pagination
    const totalPages = Math.ceil(properties.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProperties = properties.slice(startIndex, endIndex);

    return (
        <div className="mt-16">
           
            {/* Summary Status Cards */}
            <div className="px-6 py-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statusCards.map((card, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bgColor + '20' }}>
                                    <i className={`bi ${card.icon} text-lg`} style={{ color: card.bgColor }}></i>
                                </div>
                                <span className="text-xl font-bold" style={{ color: card.bgColor }}>
                                    {card.count}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{card.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* View Toggle and Actions */}
            <div className="px-6 pb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setViewType('grid')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                viewType === 'grid' 
                                    ? 'text-white' 
                                    : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                            style={{ backgroundColor: viewType === 'grid' ? '#083A85' : '' }}
                        >
                            <i className="bi bi-grid-3x3-gap-fill mr-2"></i>Grid View
                        </button>
                        <button
                            onClick={() => setViewType('table')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                viewType === 'table' 
                                    ? 'text-white' 
                                    : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                            style={{ backgroundColor: viewType === 'table' ? '#083A85' : '' }}
                        >
                            <i className="bi bi-table mr-2"></i>Table View
                        </button>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#F20C8F' }}>
                        <i className="bi bi-plus-lg mr-2"></i>Add Property
                    </button>
                </div>
            </div>

            {/* Properties Listing */}
            <div className="px-6 pb-6">
                {viewType === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {currentProperties.map((property) => (
                            <div key={property.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                                    <img src={property.image} alt={property.title} className="w-full h-48 object-cover" />
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                                        {getStatusBadge(property.status)}
                                    </div>
                                    <p className="text-xl font-bold mb-2" style={{ color: '#083A85' }}>
                                        KSh {property.price.toLocaleString()}
                                    </p>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p className="flex items-center">
                                            <i className="bi bi-geo-alt mr-2"></i>{property.location}
                                        </p>
                                        <p className="flex items-center">
                                            <i className="bi bi-person mr-2"></i>{property.agentName} (ID: {property.agentId})
                                        </p>
                                        {property.status === 'checkedin' && property.clientName && (
                                            <p className="flex items-center justify-between">
                                                <span className="flex items-center">
                                                    <i className="bi bi-person-check mr-2"></i>{property.clientName}
                                                </span>
                                                <Link href={`/clients/${property.clientId}`} className="text-blue-600 hover:underline text-xs">
                                                    View
                                                </Link>
                                            </p>
                                        )}
                                        {property.unavailableUntil && (
                                            <p className="flex items-center text-red-600">
                                                <i className="bi bi-calendar-x mr-2"></i>Until {property.unavailableUntil}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                            <span><i className="bi bi-door-open mr-1"></i>{property.bedrooms} Beds</span>
                                            <span><i className="bi bi-droplet mr-1"></i>{property.bathrooms} Baths</span>
                                        </div>
                                        <button
                                            onClick={() => handleEdit(property)}
                                            className="text-sm font-medium hover:opacity-80"
                                            style={{ color: '#F20C8F' }}
                                        >
                                            <i className="bi bi-pencil-square mr-1"></i>Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ backgroundColor: '#083A85' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Property</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Agent</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {currentProperties.map((property) => (
                                        <tr key={property.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <img src={property.image} alt={property.title} className="w-10 h-10 rounded-lg object-cover mr-3" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{property.title}</p>
                                                        <p className="text-xs text-gray-500">ID: {property.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-semibold" style={{ color: '#083A85' }}>
                                                    KSh {property.price.toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{property.location}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-gray-900">{property.agentName}</p>
                                                <p className="text-xs text-gray-500">ID: {property.agentId}</p>
                                            </td>
                                            <td className="px-4 py-3">{getStatusBadge(property.status)}</td>
                                            <td className="px-4 py-3">
                                                {property.status === 'checkedin' && property.clientName ? (
                                                    <div>
                                                        <p className="text-sm text-gray-900">{property.clientName}</p>
                                                        <Link href={`/clients/${property.clientId}`} className="text-xs text-blue-600 hover:underline">
                                                            View Details
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleEdit(property)}
                                                    className="text-sm font-medium hover:opacity-80"
                                                    style={{ color: '#F20C8F' }}
                                                >
                                                    <i className="bi bi-pencil-square mr-1"></i>Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="px-6 pb-6">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, properties.length)} of {properties.length} properties
                    </p>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === index + 1
                                        ? 'text-white'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                                style={{ backgroundColor: currentPage === index + 1 ? '#083A85' : '' }}
                            >
                                {index + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && editingProperty && (
                <div className="fixed bg-black/10 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold" style={{ color: '#083A85' }}>Edit Property</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="bi bi-x-lg text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                                <p className="text-sm text-gray-900">{editingProperty.title}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                                {getStatusBadge(editingProperty.status)}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Set Unavailable Until
                                </label>
                                <input
                                    type="date"
                                    value={unavailableDate}
                                    onChange={(e) => setUnavailableDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty to make property available immediately
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                style={{ backgroundColor: '#F20C8F' }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="px-6 py-4">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">© 2025 Jambolush. All rights reserved.</p>
                        <div className="flex items-center space-x-4">
                            <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">Help</Link>
                            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms</Link>
                            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HostPropertiesPage;